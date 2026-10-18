import { z } from 'zod';
import { route } from '@/lib/api/route.js';
import { successResponse, errorResponse } from '@/lib/api/responses.js';
import { ERROR_CODES, AppError } from '@/lib/api/errors.js';
import { RATE_LIMIT_CONFIGS } from '@/lib/rate-limit/config.js';
import { ingestSkill } from '@/lib/skills/ingest.js';
import { createSkillWithVersion } from '@/lib/dal/skills.js';
import { searchPublicSkills } from '@/lib/dal/search.js';
import { getClientIp } from '@/lib/rate-limit/index.js';

const FORBIDDEN_FIELDS = [
  'ownerId',
  'deletedAt',
  'currentVersionId',
  'shareToken',
  'forkedFromId',
  'forkedFromVersionId',
  'forkedFromSnapshot',
];

const createSkillJsonSchema = z
  .object({
    zipBase64: z.string().optional(),
    files: z
      .array(
        z.object({
          path: z.string(),
          content: z.string(), // UTF-8 text or base64
          isBase64: z.boolean().optional(),
        }),
      )
      .optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    visibility: z.enum(['PRIVATE', 'UNLISTED', 'PUBLIC']).optional(),
    message: z.string().max(255).optional(),
  })
  .strict();

export const POST = route(
  {
    access: 'user',
    rateLimit: {
      ...RATE_LIMIT_CONFIGS.upload,
      useUser: true,
    },
    schema: {
      body: createSkillJsonSchema,
    },
  },
  async ({ request, actor, body, traceId }) => {
    const contentType = request.headers.get('content-type') || '';
    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent');

    let tags = [];
    let visibility = 'PRIVATE';
    let message = 'Initial version';
    let ingestResult = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();

      // Check mass assignment in form data (Rule R5, S2)
      for (const field of FORBIDDEN_FIELDS) {
        if (formData.has(field)) {
          return errorResponse({
            code: ERROR_CODES.VALIDATION_FAILED,
            message: `Field '${field}' is not allowed in client request.`,
            traceId,
            status: 422,
            details: [{ field, message: 'Mass assignment forbidden' }],
          });
        }
      }

      if (formData.has('tags')) {
        const rawTags = formData.get('tags');
        if (typeof rawTags === 'string') {
          try {
            tags = JSON.parse(rawTags);
          } catch {
            tags = rawTags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean);
          }
        }
      }

      if (formData.has('visibility')) {
        visibility = formData.get('visibility');
        if (!['PRIVATE', 'UNLISTED', 'PUBLIC'].includes(visibility)) {
          return errorResponse({
            code: ERROR_CODES.VALIDATION_FAILED,
            message: 'Invalid visibility option.',
            traceId,
            status: 422,
          });
        }
      }

      if (formData.has('message')) {
        message = String(formData.get('message')).slice(0, 255);
      }

      // Check for file(s)
      const file = formData.get('file');
      const files = formData.getAll('files');

      if (file && typeof file === 'object' && 'arrayBuffer' in file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = file.name || '';
        const lowerName = filename.toLowerCase();

        if (lowerName.endsWith('.zip') || lowerName.endsWith('.skill')) {
          ingestResult = await ingestSkill({ zipBuffer: buffer, persistBlobs: true });
        } else if (
          lowerName.endsWith('.md') ||
          lowerName.endsWith('.markdown') ||
          lowerName.endsWith('.txt')
        ) {
          // Single text or markdown file upload
          ingestResult = await ingestSkill({
            entries: [{ rawPath: filename, buffer }],
            persistBlobs: true,
          });
        } else {
          return errorResponse({
            code: ERROR_CODES.VALIDATION_FAILED,
            message:
              'Only compressed archives (.zip, .skill) or markdown/text files (.md, .txt) can be uploaded directly.',
            traceId,
            status: 422,
          });
        }
      } else if (files && files.length > 0) {
        const rawEntries = [];
        for (const f of files) {
          if (f && typeof f === 'object' && 'arrayBuffer' in f) {
            const buf = Buffer.from(await f.arrayBuffer());
            rawEntries.push({
              rawPath: f.name || f.webkitRelativePath || 'unnamed',
              buffer: buf,
            });
          }
        }
        ingestResult = await ingestSkill({ entries: rawEntries, persistBlobs: true });
      } else {
        return errorResponse({
          code: ERROR_CODES.VALIDATION_FAILED,
          message: 'Please provide a ZIP archive or source files to create a skill.',
          traceId,
          status: 422,
        });
      }
    } else if (body) {
      tags = body.tags || [];
      visibility = body.visibility || 'PRIVATE';
      message = body.message || 'Initial version';

      if (body.zipBase64) {
        const zipBuffer = Buffer.from(body.zipBase64, 'base64');
        ingestResult = await ingestSkill({ zipBuffer, persistBlobs: true });
      } else if (body.files && body.files.length > 0) {
        const entries = body.files.map((f) => ({
          rawPath: f.path,
          buffer: f.isBase64 ? Buffer.from(f.content, 'base64') : Buffer.from(f.content, 'utf8'),
        }));
        ingestResult = await ingestSkill({ entries, persistBlobs: true });
      } else {
        return errorResponse({
          code: ERROR_CODES.VALIDATION_FAILED,
          message: 'Skill payload must contain either a ZIP archive or file entries.',
          traceId,
          status: 422,
        });
      }
    }

    if (!ingestResult) {
      throw new AppError(ERROR_CODES.INTERNAL, 'Failed to process skill contents.', 500);
    }

    // Create skill and initial version in DAL transaction
    const createdSkill = await createSkillWithVersion({
      ownerId: actor.id,
      name: ingestResult.skillMd.name,
      description: ingestResult.skillMd.description,
      tags,
      visibility,
      message,
      files: ingestResult.files,
      contentHash: ingestResult.contentHash,
      auditMeta: { ip, userAgent },
    });

    return successResponse(
      {
        skill: createdSkill,
        warnings: ingestResult.warnings,
      },
      201,
    );
  },
);

export const GET = route(
  {
    access: 'public',
  },
  async ({ request, actor }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') || '';
    const tag = url.searchParams.get('tag') || '';
    const sort = url.searchParams.get('sort') || 'updated';
    const order = url.searchParams.get('order') || 'desc';
    const cursor = url.searchParams.get('cursor') || null;
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    const result = await searchPublicSkills({
      q,
      tag,
      sort,
      order,
      cursor,
      limit,
      userId: actor?.id || null,
    });
    return successResponse(result);
  },
);
