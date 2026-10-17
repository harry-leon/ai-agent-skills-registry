import path from 'node:path';
import { Readable } from 'node:stream';
import { apiRoute } from '@/lib/api/route.js';
import { successResponse, errorResponse } from '@/lib/api/responses.js';
import { ERROR_CODES, AppError } from '@/lib/api/errors.js';
import { getSkillById } from '@/lib/dal/skills.js';
import { getFileByIdAndSkill } from '@/lib/dal/files.js';
import { can, ACTIONS } from '@/lib/auth/policy.js';
import { storage } from '@/lib/storage/index.js';

export const GET = apiRoute({
  access: 'public',
  handler: async ({ request, actor, params, traceId }) => {
    const { id, fileId } = params;
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const isRaw = url.searchParams.get('raw') === 'true';
    const isDownload = url.searchParams.get('download') === 'true';

    // 1. Authorize skill access
    const skill = await getSkillById(actor, id, token);
    if (!skill || !can(actor, ACTIONS.SKILL_READ, skill)) {
      return errorResponse({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Không tìm thấy kỹ năng hoặc tệp yêu cầu.',
        traceId,
        status: 404,
      });
    }

    // 2. Fetch file strictly bound to this skill via DAL
    const file = await getFileByIdAndSkill(fileId, skill.id);

    if (!file) {
      return errorResponse({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Không tìm thấy tệp yêu cầu trong kỹ năng này.',
        traceId,
        status: 404,
      });
    }

    // 3. Raw / Download streaming response
    if (isRaw || isDownload) {
      const blobStream = await storage.getBlobStream(file.blobSha256);
      if (!blobStream) {
        throw new AppError(
          ERROR_CODES.INTERNAL_ERROR,
          'Dữ liệu tệp không tồn tại trong kho lưu trữ.',
          500,
        );
      }

      const filename = path.basename(file.path);
      const disposition = isDownload ? 'attachment' : 'inline';

      return new Response(Readable.toWeb(blobStream), {
        status: 200,
        headers: {
          'Content-Type': file.mimeType || 'application/octet-stream',
          'Content-Disposition': `${disposition}; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
          'Content-Length': String(file.size),
          'X-Content-Type-Options': 'nosniff',
          'Content-Security-Policy': 'sandbox',
          'x-trace-id': traceId,
          'Cache-Control': 'private, max-age=3600',
        },
      });
    }

    // 4. JSON metadata & text content response
    if (file.isText) {
      const buffer = await storage.getBlobBuffer(file.blobSha256);
      const content = buffer ? buffer.toString('utf-8') : '';
      return successResponse({
        id: file.id,
        path: file.path,
        size: file.size,
        mimeType: file.mimeType,
        isText: true,
        content,
      });
    }

    return successResponse({
      id: file.id,
      path: file.path,
      size: file.size,
      mimeType: file.mimeType,
      isText: false,
    });
  },
});
