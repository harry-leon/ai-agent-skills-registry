import { ZipArchive } from 'archiver';
import { apiRoute } from '@/lib/api/route.js';
import { errorResponse } from '@/lib/api/responses.js';
import { ERROR_CODES, AppError } from '@/lib/api/errors.js';
import { getSkillByHandleAndSlug } from '@/lib/dal/skills.js';
import { getSkillVersionByNumber } from '@/lib/dal/versions.js';
import { getVersionFiles } from '@/lib/dal/files.js';
import { can, ACTIONS } from '@/lib/auth/policy.js';
import { storage } from '@/lib/storage/index.js';
import { createAuditLog } from '@/lib/dal/audit.js';
import { getClientIp } from '@/lib/rate-limit/index.js';

export const dynamic = 'force-dynamic';

/**
 * CLI Public Resolver & Downloader Endpoint:
 * GET /api/skills/by-handle/[handle]/[slug]
 * Query params:
 *   - ?format=json (returns skill metadata + files manifest for CLI)
 *   - ?download=true (default: downloads ZIP stream)
 */
export const GET = apiRoute({
  access: 'public',
  handler: async ({ request, actor, params, traceId }) => {
    const { handle, slug } = params;
    const url = new URL(request.url);
    const format = url.searchParams.get('format');
    const versionNumParam = url.searchParams.get('version');
    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent');

    // 1. Resolve skill by @handle and slug
    const cleanHandle = handle.replace(/^@/, '');
    const skill = await getSkillByHandleAndSlug(actor, cleanHandle, slug);

    if (!skill || !can(actor, ACTIONS.SKILL_READ, skill)) {
      return errorResponse({
        code: ERROR_CODES.NOT_FOUND,
        message: `Skill @${cleanHandle}/${slug} not found or is private.`,
        traceId,
        status: 404,
      });
    }

    // 2. Resolve version
    let version = null;
    if (versionNumParam) {
      const parsedNum = parseInt(versionNumParam, 10);
      if (isNaN(parsedNum) || parsedNum <= 0) {
        return errorResponse({
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid version number.',
          traceId,
          status: 422,
        });
      }
      version = await getSkillVersionByNumber(skill.id, parsedNum);
    } else {
      version = skill.currentVersion;
    }

    if (!version) {
      return errorResponse({
        code: ERROR_CODES.NOT_FOUND,
        message: 'The requested skill version was not found.',
        traceId,
        status: 404,
      });
    }

    // 3. Fetch version files
    const files = await getVersionFiles(version.id);
    if (!files || files.length === 0) {
      throw new AppError(ERROR_CODES.INTERNAL_ERROR, 'Skill version contains no files.', 500);
    }

    // 4. If CLI requested JSON metadata manifest (?format=json)
    if (format === 'json') {
      const isPublic = skill.visibility === 'PUBLIC';
      return Response.json(
        {
          success: true,
          data: {
            id: skill.id,
            name: skill.name,
            slug: skill.slug,
            handle: cleanHandle,
            description: skill.description,
            tags: skill.tags,
            visibility: skill.visibility,
            version: version.number,
            contentHash: version.contentHash,
            fileCount: files.length,
            files: files.map((f) => ({
              path: f.path,
              size: f.size,
              isText: f.isText,
              sha256: f.blobSha256,
            })),
          },
        },
        {
          headers: {
            'Cache-Control': isPublic
              ? 'public, max-age=60, s-maxage=300'
              : 'private, no-cache, no-store, must-revalidate',
            'Vary': 'Cookie, Authorization',
          },
        },
      );
    }

    // 5. Default: Stream ZIP archive
    const zip = new ZipArchive({ zlib: { level: 6 } });

    for (const file of files) {
      const blobStream = await storage.getBlobStream(file.blobSha256);
      if (!blobStream) {
        throw new AppError(
          ERROR_CODES.INTERNAL_ERROR,
          `Storage blob not found for: ${file.path}`,
          500,
        );
      }
      zip.append(blobStream, { name: file.path });
    }

    zip.finalize();

    // Audit log
    await createAuditLog({
      actorId: actor?.id || null,
      action: 'CLI_SKILL_DOWNLOAD',
      targetType: 'SKILL',
      targetId: skill.id,
      ip,
      userAgent,
      metadata: {
        handle: cleanHandle,
        slug: skill.slug,
        versionNumber: version.number,
        fileCount: files.length,
      },
    });

    const filename = `${skill.slug}-v${version.number}.zip`;
    const isPublic = skill.visibility === 'PUBLIC';

    return new Response(zip, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': isPublic
          ? 'public, max-age=60, s-maxage=300'
          : 'private, no-cache, no-store, must-revalidate',
        'Vary': 'Cookie, Authorization',
        'X-SkillVault-Version': String(version.number),
        'X-SkillVault-Handle': cleanHandle,
        'X-SkillVault-Slug': skill.slug,
      },
    });
  },
});
