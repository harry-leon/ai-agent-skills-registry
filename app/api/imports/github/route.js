import { z } from 'zod';
import { route } from '@/lib/api/route.js';
import { successResponse } from '@/lib/api/responses.js';
import { RATE_LIMIT_CONFIGS } from '@/lib/rate-limit/config.js';
import { importSkillFromGitHub } from '@/lib/dal/skills.js';
import { getClientIp } from '@/lib/rate-limit/index.js';

const importGithubSchema = z
  .object({
    url: z.string().url('URL không đúng định dạng.'),
    ref: z.string().optional(),
    subpath: z.string().optional(),
    tags: z
      .array(
        z
          .string()
          .regex(/^[a-z0-9-]+$/, 'Thẻ chỉ được chứa chữ thường, số và dấu gạch ngang.')
          .max(30, 'Thẻ tối đa 30 ký tự.'),
      )
      .max(10, 'Tối đa 10 thẻ.')
      .optional()
      .default([]),
    visibility: z.enum(['PRIVATE', 'UNLISTED', 'PUBLIC']).optional().default('PRIVATE'),
  })
  .strict();

export const POST = route(
  {
    access: 'user',
    rateLimit: {
      ...RATE_LIMIT_CONFIGS.githubImport,
      useUser: true,
    },
    schema: {
      body: importGithubSchema,
    },
  },
  async ({ request, actor, body }) => {
    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent');

    const result = await importSkillFromGitHub({
      actor,
      url: body.url,
      ref: body.ref,
      subpath: body.subpath,
      tags: body.tags,
      visibility: body.visibility,
      auditMeta: { ip, userAgent },
    });

    return successResponse(result, 201);
  },
);
