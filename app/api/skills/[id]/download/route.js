import { Readable } from 'node:stream';
import { ZipArchive } from 'archiver';
import { apiRoute } from '@/lib/api/route.js';
import { errorResponse } from '@/lib/api/responses.js';
import { ERROR_CODES, AppError } from '@/lib/api/errors.js';
import { getSkillById } from '@/lib/dal/skills.js';
import { getSkillVersionByNumber } from '@/lib/dal/versions.js';
import { getVersionFiles } from '@/lib/dal/files.js';
import { can, ACTIONS } from '@/lib/auth/policy.js';
import { storage } from '@/lib/storage/index.js';
import { createAuditLog } from '@/lib/dal/audit.js';
import { getClientIp } from '@/lib/rate-limit/index.js';

export const GET = apiRoute({
  access: 'public',
  handler: async ({ request, actor, params, traceId }) => {
    const { id } = params;
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const versionNumParam = url.searchParams.get('version');
    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent');

    // 1. Fetch skill scoped by actor and share token
    const skill = await getSkillById(actor, id, token);
    if (!skill || !can(actor, ACTIONS.SKILL_READ, skill)) {
      return errorResponse({
        code: ERROR_CODES.NOT_FOUND,
        message: 'The requested skill was not found or is unavailable.',
        traceId,
        status: 404,
      });
    }

    // 2. Resolve version (either requested version or current active version)
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

    // 3. Fetch all files for this version
    const files = await getVersionFiles(version.id);
    if (!files || files.length === 0) {
      throw new AppError(ERROR_CODES.INTERNAL_ERROR, 'Skill version contains no files.', 500);
    }

    // 4. Create ZIP stream preserving relative folder paths
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

    // Finalize zip archive creation
    zip.finalize();

    // 5. Record download audit log (Section S10)
    await createAuditLog({
      actorId: actor?.id || null,
      action: 'SKILL_DOWNLOAD',
      targetType: 'SKILL',
      targetId: skill.id,
      ip,
      userAgent,
      metadata: {
        versionNumber: version.number,
        fileCount: files.length,
        viaShareToken: Boolean(skill._accessViaShareToken),
      },
    });

    const filename = `${skill.slug}-v${version.number}.zip`;

    return new Response(Readable.toWeb(zip), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': 'sandbox',
        'x-trace-id': traceId,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  },
});
