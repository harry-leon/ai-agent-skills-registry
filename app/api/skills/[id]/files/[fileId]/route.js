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
        message: 'The requested skill or file was not found.',
        traceId,
        status: 404,
      });
    }

    // 2. Fetch file strictly bound to this skill via DAL
    const file = await getFileByIdAndSkill(fileId, skill.id);

    if (!file) {
      return errorResponse({
        code: ERROR_CODES.NOT_FOUND,
        message: 'The requested file was not found in this skill.',
        traceId,
        status: 404,
      });
    }

    // 3. Raw / Download streaming response
    if (isRaw || isDownload) {
      const blobStream = await storage.getBlobStream(file.blobSha256);
      if (!blobStream) {
        throw new AppError(ERROR_CODES.INTERNAL_ERROR, 'File data not found in storage.', 500);
      }

      const filename = path.basename(file.path);
      const dotIdx = filename.lastIndexOf('.');
      const ext = dotIdx !== -1 ? filename.slice(dotIdx + 1).toLowerCase() : '';

      // Rule S8 & Threat 14: SVG, HTML and PDF are download-only.
      // Inline is allowed ONLY for text files up to 1 MB and raster images.
      const isDownloadOnly = ext === 'svg' || ext === 'html' || ext === 'pdf';
      const isRasterImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
      const isInlineAllowed =
        !isDownloadOnly && ((file.isText && file.size <= 1024 * 1024) || isRasterImage);

      const disposition = isDownload || !isInlineAllowed ? 'attachment' : 'inline';

      let contentType = file.mimeType || 'application/octet-stream';
      if (file.isText) {
        contentType = 'text/plain; charset=utf-8';
      } else if (ext === 'png') {
        contentType = 'image/png';
      } else if (ext === 'jpg' || ext === 'jpeg') {
        contentType = 'image/jpeg';
      } else if (ext === 'gif') {
        contentType = 'image/gif';
      } else if (ext === 'webp') {
        contentType = 'image/webp';
      }

      return new Response(Readable.toWeb(blobStream), {
        status: 200,
        headers: {
          'Content-Type': contentType,
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
