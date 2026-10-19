import { z } from 'zod';
import { apiRoute } from '@/lib/api/route.js';
import { successResponse, errorResponse } from '@/lib/api/responses.js';
import { ERROR_CODES, AppError } from '@/lib/api/errors.js';
import { RATE_LIMIT_CONFIGS } from '@/lib/rate-limit/config.js';
import { getClientIp } from '@/lib/rate-limit/index.js';
import { getSkillById } from '@/lib/dal/skills.js';
import { createNewSkillVersion, listSkillVersions } from '@/lib/dal/versions.js';
import { ingestSkill, IngestionError } from '@/lib/skills/ingest.js';
import { can, ACTIONS } from '@/lib/auth/policy.js';

export const GET = apiRoute({
  access: 'public',
  handler: async ({ request, actor, params, traceId }) => {
    const { id } = params;
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    const skill = await getSkillById(actor, id, token);
    if (!skill || !can(actor, ACTIONS.SKILL_READ, skill)) {
      return errorResponse({
        code: ERROR_CODES.NOT_FOUND,
        message: 'The requested skill was not found.',
        traceId,
        status: 404,
      });
    }

    const versions = await listSkillVersions(id);
    return successResponse(versions);
  },
});

export const POST = apiRoute({
  access: 'user',
  rateLimit: RATE_LIMIT_CONFIGS.upload,
  handler: async ({ request, actor, params, traceId }) => {
    const { id } = params;
    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent');
    const contentType = request.headers.get('content-type') || '';

    // 1. Verify ownership before ingestion
    const existingSkill = await getSkillById(actor, id);
    if (!existingSkill) {
      return errorResponse({
        code: ERROR_CODES.NOT_FOUND,
        message: 'The requested skill was not found.',
        traceId,
        status: 404,
      });
    }

    if (!can(actor, ACTIONS.SKILL_WRITE, existingSkill)) {
      return errorResponse({
        code: ERROR_CODES.FORBIDDEN,
        message: 'You do not have permission to update this skill.',
        traceId,
        status: 403,
      });
    }

    let message = 'Version update';
    let rawEntries = [];
    let zipBuffer = null;

    // 2. Parse incoming payload (multipart or JSON)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      message = formData.get('message') ? String(formData.get('message')).trim() : 'Version update';

      const fileField = formData.get('file');
      if (
        fileField &&
        typeof fileField === 'object' &&
        typeof fileField.arrayBuffer === 'function'
      ) {
        const buf = Buffer.from(await fileField.arrayBuffer());
        const fileName = (fileField.name || '').toLowerCase();
        if (fileName.endsWith('.zip') || fileName.endsWith('.skill')) {
          zipBuffer = buf;
        } else if (
          fileName.endsWith('.md') ||
          fileName.endsWith('.markdown') ||
          fileName.endsWith('.txt')
        ) {
          rawEntries.push({
            rawPath: fileField.name || fileName,
            buffer: buf,
          });
        } else {
          return errorResponse({
            code: ERROR_CODES.VALIDATION_ERROR,
            message:
              'Only compressed archives (.zip, .skill) or markdown/text files (.md, .txt) can be uploaded directly.',
            traceId,
            status: 422,
          });
        }
      }

      for (const [key, val] of formData.entries()) {
        if (key.startsWith('files[') || key === 'files') {
          if (val && typeof val === 'object' && typeof val.arrayBuffer === 'function') {
            const buf = Buffer.from(await val.arrayBuffer());
            const filePath = val.name || key;
            rawEntries.push({
              rawPath: filePath,
              buffer: buf,
            });
          }
        }
      }
    } else if (contentType.includes('application/json')) {
      let jsonBody;
      try {
        jsonBody = await request.json();
      } catch {
        return errorResponse({
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid JSON payload.',
          traceId,
          status: 400,
        });
      }
      message = jsonBody.message ? String(jsonBody.message).trim() : 'Version update';

      if (!Array.isArray(jsonBody.files) || jsonBody.files.length === 0) {
        return errorResponse({
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'File list cannot be empty.',
          traceId,
          status: 422,
        });
      }

      for (const file of jsonBody.files) {
        if (!file.path || typeof file.path !== 'string') {
          return errorResponse({
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid file path.',
            traceId,
            status: 422,
          });
        }

        const content = file.content !== undefined ? file.content : '';
        const buf = Buffer.from(content, typeof content === 'string' ? 'utf-8' : undefined);
        rawEntries.push({
          rawPath: file.path,
          buffer: buf,
        });
      }
    } else {
      return errorResponse({
        code: ERROR_CODES.INVALID_INPUT,
        message: 'Unsupported content type. Please send JSON or multipart/form-data.',
        traceId,
        status: 415,
      });
    }

    // 3. Ingestion pipeline with validation (SKILL.md frontmatter, S6 security constraints)
    let ingested;
    try {
      ingested = await ingestSkill({
        zipBuffer,
        entries: rawEntries,
        persistBlobs: true,
      });
    } catch (err) {
      if (err instanceof IngestionError) {
        return errorResponse({
          code: err.code || ERROR_CODES.VALIDATION_ERROR,
          message: err.message,
          traceId,
          details: err.details,
          status: 422,
        });
      }
      throw err;
    }

    // 4. Create new immutable version and update currentVersionId in single transaction
    const newVersion = await createNewSkillVersion({
      actor,
      skillId: id,
      message,
      name: ingested.skillMd.name,
      description: ingested.skillMd.description,
      files: ingested.files,
      contentHash: ingested.contentHash,
      auditMeta: {
        ip,
        userAgent,
      },
    });

    return successResponse(newVersion, 201);
  },
});
