import { env } from '../env.js';
import { AppError, ERROR_CODES } from '../api/errors.js';
import { normalizeAndValidatePath } from './paths.js';
import { extractZipEntries } from './zip.js';
import { ingestSkill } from './ingest.js';

const GITHUB_REPO_REGEX = /^[A-Za-z0-9_.-]{1,100}$/;

/**
 * Parses and strictly validates a GitHub URL per Section S7.
 *
 * @param {string} rawUrl
 * @returns {{ owner: string, repo: string, ref: string|null, subpath: string }}
 */
export function parseGitHubUrl(rawUrl) {
  if (rawUrl.includes('..')) {
    throw new AppError(
      ERROR_CODES.INVALID_GITHUB_URL,
      'URL không được chứa ký tự duyệt ngược ("..").',
      422,
    );
  }

  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new AppError(
      ERROR_CODES.INVALID_GITHUB_URL,
      'Địa chỉ kho lưu trữ GitHub không đúng định dạng URL.',
      422,
    );
  }

  // 1. Protocol must be https:
  if (url.protocol !== 'https:') {
    throw new AppError(
      ERROR_CODES.INVALID_GITHUB_URL,
      'Chỉ chấp nhận giao thức HTTPS an toàn từ GitHub.',
      422,
    );
  }

  // 2. Hostname must be EXACTLY github.com
  if (url.hostname.toLowerCase() !== 'github.com') {
    throw new AppError(
      ERROR_CODES.INVALID_GITHUB_URL,
      'Tên miền phải chính xác là github.com.',
      422,
    );
  }

  // 3. No username or password
  if (url.username || url.password) {
    throw new AppError(
      ERROR_CODES.INVALID_GITHUB_URL,
      'Không được chứa thông tin xác thực (username/password) trong URL.',
      422,
    );
  }

  // 4. Port must be empty or 443
  if (url.port && url.port !== '443') {
    throw new AppError(
      ERROR_CODES.INVALID_GITHUB_URL,
      'Cổng mạng không được phép ngoài cổng HTTPS tiêu chuẩn (443).',
      422,
    );
  }

  // 5. Parse path segments
  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length < 2) {
    throw new AppError(
      ERROR_CODES.INVALID_GITHUB_URL,
      'URL GitHub phải chứa ít nhất {owner}/{repo}.',
      422,
    );
  }

  const owner = segments[0];
  let repo = segments[1];

  // Optional .git suffix
  if (repo.endsWith('.git')) {
    repo = repo.slice(0, -4);
  }

  if (!GITHUB_REPO_REGEX.test(owner) || !GITHUB_REPO_REGEX.test(repo)) {
    throw new AppError(
      ERROR_CODES.INVALID_GITHUB_URL,
      'Tên chủ sở hữu hoặc kho lưu trữ GitHub chứa ký tự không hợp lệ.',
      422,
    );
  }

  let ref = null;
  let subpath = '';

  if (segments.length > 2) {
    const treeKeyword = segments[2];
    if (treeKeyword !== 'tree') {
      throw new AppError(
        ERROR_CODES.INVALID_GITHUB_URL,
        'Đường dẫn sau tên repo chỉ chấp nhận dạng /tree/{ref}/{subpath}.',
        422,
      );
    }

    if (segments.length < 4) {
      throw new AppError(ERROR_CODES.INVALID_GITHUB_URL, 'Thiếu tên nhánh/tag sau /tree/.', 422);
    }

    ref = decodeURIComponent(segments[3]);

    // Phase 1 restriction: branch names containing / are unsupported
    if (ref.includes('/') || ref.includes('\\')) {
      throw new AppError(
        ERROR_CODES.INVALID_GITHUB_URL,
        'Tên nhánh chứa dấu gạch chéo ("/") chưa được hỗ trợ. Vui lòng sử dụng commit SHA hoặc git tag.',
        422,
      );
    }

    if (segments.length > 4) {
      const rawSubpath = segments.slice(4).join('/');
      try {
        subpath = normalizeAndValidatePath(rawSubpath);
      } catch (err) {
        throw new AppError(
          ERROR_CODES.INVALID_GITHUB_URL,
          `Đường dẫn thư mục con không hợp lệ: ${err.message}`,
          422,
        );
      }
    }
  }

  return {
    owner,
    repo,
    ref,
    subpath,
  };
}

/**
 * Performs a manual redirect check enforcing S7 SSRF protections.
 *
 * @param {string} destinationUrl
 * @returns {URL}
 */
function validateRedirectDestination(destinationUrl) {
  let parsed;
  try {
    parsed = new URL(destinationUrl);
  } catch {
    throw new AppError(ERROR_CODES.SSRF_ATTEMPT_BLOCKED, 'Địa chỉ chuyển hướng không hợp lệ.', 403);
  }

  if (parsed.protocol !== 'https:') {
    throw new AppError(
      ERROR_CODES.SSRF_ATTEMPT_BLOCKED,
      'Chuyển hướng đến giao thức không an toàn bị từ chối.',
      403,
    );
  }

  const allowedHosts = ['codeload.github.com', 'api.github.com'];
  if (!allowedHosts.includes(parsed.hostname.toLowerCase())) {
    throw new AppError(
      ERROR_CODES.SSRF_ATTEMPT_BLOCKED,
      `Chuyển hướng đến máy chủ không được phép (${parsed.hostname}) bị chặn vì lý do bảo mật.`,
      403,
    );
  }

  return parsed;
}

/**
 * Fetches with manual redirect control (max 3 hops) and SSRF validation.
 * Never forwards GITHUB_TOKEN to non-api.github.com hosts.
 *
 * @param {string} initialUrl
 * @param {Object} options
 * @param {typeof fetch} [fetchFn]
 * @returns {Promise<Response>}
 */
async function fetchWithRedirectControl(initialUrl, options = {}, fetchFn = fetch) {
  let currentUrl = initialUrl;
  let hops = 0;
  const maxHops = 3;

  while (hops <= maxHops) {
    const urlObj = new URL(currentUrl);
    const headers = { ...options.headers };

    // Security Rule S7: GITHUB_TOKEN sent ONLY to api.github.com
    if (urlObj.hostname.toLowerCase() === 'api.github.com' && env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${env.GITHUB_TOKEN}`;
    } else {
      delete headers['Authorization'];
    }

    const response = await fetchFn(currentUrl, {
      ...options,
      headers,
      redirect: 'manual',
      signal: options.signal || AbortSignal.timeout(30000),
    });

    const isRedirect = [301, 302, 303, 307, 308].includes(response.status);
    if (!isRedirect) {
      return response;
    }

    hops++;
    if (hops > maxHops) {
      throw new AppError(
        ERROR_CODES.INVALID_GITHUB_URL,
        'Quá nhiều lần chuyển hướng từ GitHub API.',
        422,
      );
    }

    const location = response.headers.get('location');
    if (!location) {
      throw new AppError(
        ERROR_CODES.INVALID_GITHUB_URL,
        'Phản hồi chuyển hướng từ GitHub thiếu tiêu đề Location.',
        422,
      );
    }

    // Resolve relative or absolute redirect and validate SSRF
    const nextUrl = new URL(location, currentUrl);
    validateRedirectDestination(nextUrl.toString());
    currentUrl = nextUrl.toString();
  }

  throw new AppError(
    ERROR_CODES.INVALID_GITHUB_URL,
    'Quá nhiều lần chuyển hướng từ GitHub API.',
    422,
  );
}

/**
 * Downloads response stream while enforcing GITHUB_IMPORT_MAX_BYTES limit.
 *
 * @param {Response} response
 * @returns {Promise<Buffer>}
 */
async function downloadStreamWithLimit(response) {
  const maxBytes = env.GITHUB_IMPORT_MAX_BYTES || 100 * 1024 * 1024;

  if (!response.body) {
    const arrayBuffer = await response.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    if (buf.length > maxBytes) {
      throw new AppError(
        ERROR_CODES.PAYLOAD_TOO_LARGE,
        `Gói tải từ GitHub vượt quá giới hạn tối đa ${Math.round(maxBytes / (1024 * 1024))} MB.`,
        413,
      );
    }
    return buf;
  }

  const reader = response.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.length;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new AppError(
          ERROR_CODES.PAYLOAD_TOO_LARGE,
          `Gói tải từ GitHub vượt quá giới hạn tối đa ${Math.round(maxBytes / (1024 * 1024))} MB.`,
          413,
        );
      }
      chunks.push(value);
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(ERROR_CODES.INTERNAL, `Lỗi khi tải dữ liệu từ GitHub: ${err.message}`, 500);
  }

  return Buffer.concat(chunks);
}

/**
 * Fetches repository archive from GitHub and ingests into validated skill manifest.
 *
 * @param {Object} params
 * @param {string} params.url - GitHub repository URL
 * @param {string} [params.ref] - Optional branch/tag/commit override
 * @param {string} [params.subpath] - Optional subpath override
 * @param {typeof fetch} [params.fetchFn] - For testing injection
 * @returns {Promise<{
 *   ingestResult: Object,
 *   sourceUrl: string,
 *   sourceCommit: string|null
 * }>}
 */
export async function fetchAndIngestGitHubRepo({
  url: rawUrl,
  ref: overrideRef,
  subpath: overrideSubpath,
  fetchFn = fetch,
}) {
  const parsed = parseGitHubUrl(rawUrl);
  const owner = parsed.owner;
  const repo = parsed.repo;
  const ref = overrideRef || parsed.ref;
  let subpath = overrideSubpath !== undefined ? overrideSubpath : parsed.subpath;

  if (ref && (ref.includes('/') || ref.includes('\\'))) {
    throw new AppError(
      ERROR_CODES.INVALID_GITHUB_URL,
      'Tên nhánh chứa dấu gạch chéo ("/") chưa được hỗ trợ. Vui lòng sử dụng commit SHA hoặc git tag.',
      422,
    );
  }

  if (subpath) {
    try {
      subpath = normalizeAndValidatePath(subpath);
    } catch (err) {
      throw new AppError(
        ERROR_CODES.INVALID_GITHUB_URL,
        `Đường dẫn thư mục con không hợp lệ: ${err.message}`,
        422,
      );
    }
  }

  // 1. Fetch Repo Metadata from api.github.com
  const metaUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const metaResponse = await fetchWithRedirectControl(
    metaUrl,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'SkillVault-Importer',
      },
    },
    fetchFn,
  );

  if (metaResponse.status === 404) {
    throw new AppError(
      ERROR_CODES.NOT_FOUND,
      'Kho lưu trữ GitHub không tồn tại hoặc ở chế độ riêng tư (private). SkillVault chỉ hỗ trợ nhập từ kho lưu trữ công khai.',
      404,
    );
  }

  if (metaResponse.status === 403 || metaResponse.status === 429) {
    throw new AppError(
      ERROR_CODES.RATE_LIMITED,
      'Đã vượt quá giới hạn lượt gọi GitHub API. Vui lòng thử lại sau ít phút.',
      429,
    );
  }

  if (!metaResponse.ok) {
    throw new AppError(
      ERROR_CODES.INTERNAL,
      `GitHub API trả về lỗi (${metaResponse.status}).`,
      502,
    );
  }

  const repoMeta = await metaResponse.json();
  if (repoMeta.private) {
    throw new AppError(
      ERROR_CODES.FORBIDDEN,
      'Kho lưu trữ này ở chế độ riêng tư (private). SkillVault chỉ hỗ trợ nhập kho lưu trữ công khai.',
      403,
    );
  }

  const targetRef = ref || repoMeta.default_branch || 'main';

  // 2. Fetch Zipball from api.github.com
  const zipballUrl = `https://api.github.com/repos/${owner}/${repo}/zipball/${encodeURIComponent(targetRef)}`;
  const zipResponse = await fetchWithRedirectControl(
    zipballUrl,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'SkillVault-Importer',
      },
    },
    fetchFn,
  );

  if (zipResponse.status === 404) {
    throw new AppError(
      ERROR_CODES.NOT_FOUND,
      `Không tìm thấy nhánh, thẻ hoặc commit "${targetRef}" trong kho lưu trữ GitHub.`,
      404,
    );
  }

  if (zipResponse.status === 403 || zipResponse.status === 429) {
    throw new AppError(
      ERROR_CODES.RATE_LIMITED,
      'Đã vượt quá giới hạn lượt gọi GitHub API khi tải gói mã nguồn. Vui lòng thử lại sau.',
      429,
    );
  }

  if (!zipResponse.ok) {
    throw new AppError(
      ERROR_CODES.INTERNAL,
      `Lỗi khi tải gói nén từ GitHub (${zipResponse.status}).`,
      502,
    );
  }

  const zipBuffer = await downloadStreamWithLimit(zipResponse);

  // 3. Extract and parse zipball
  const rawEntries = await extractZipEntries(zipBuffer);
  if (rawEntries.length === 0) {
    throw new AppError(
      ERROR_CODES.SKILL_MD_MISSING,
      'Gói tải về từ GitHub không chứa tệp tin nào.',
      422,
    );
  }

  // GitHub zipball has a single top folder: {owner}-{repo}-{commitHash}/
  const topFolder = rawEntries[0].rawPath.split('/')[0];
  const commitMatch = topFolder.match(/-([0-9a-fA-F]{7,40})$/);
  const sourceCommit = commitMatch ? commitMatch[1] : null;

  // Filter entries if subpath is specified
  let entriesToIngest = [];

  // Strip the top-level repo folder from all entries first
  const repoRootEntries = [];
  const topPrefix = `${topFolder}/`;

  for (const entry of rawEntries) {
    if (entry.rawPath.startsWith(topPrefix)) {
      const relPath = entry.rawPath.slice(topPrefix.length);
      if (relPath) {
        repoRootEntries.push({
          rawPath: relPath,
          buffer: entry.buffer,
        });
      }
    }
  }

  if (subpath) {
    const subpathPrefix = `${subpath}/`;
    for (const entry of repoRootEntries) {
      if (entry.rawPath === subpath || entry.rawPath.startsWith(subpathPrefix)) {
        const pathInSkill =
          entry.rawPath === subpath ? '' : entry.rawPath.slice(subpathPrefix.length);
        if (pathInSkill) {
          entriesToIngest.push({
            rawPath: pathInSkill,
            buffer: entry.buffer,
          });
        }
      }
    }

    if (entriesToIngest.length === 0) {
      throw new AppError(
        ERROR_CODES.SKILL_MD_MISSING,
        `Không tìm thấy tệp hoặc thư mục con "${subpath}" trong kho lưu trữ GitHub.`,
        422,
      );
    }
  } else {
    entriesToIngest = repoRootEntries;
  }

  // 4. Ingest via S6 Ingestion Pipeline
  const ingestResult = await ingestSkill({
    entries: entriesToIngest,
    persistBlobs: true,
  });

  const canonicalUrl = `https://github.com/${owner}/${repo}${
    ref
      ? `/tree/${ref}${subpath ? `/${subpath}` : ''}`
      : subpath
        ? `/tree/${targetRef}/${subpath}`
        : ''
  }`;

  return {
    ingestResult,
    sourceUrl: canonicalUrl,
    sourceCommit,
  };
}
