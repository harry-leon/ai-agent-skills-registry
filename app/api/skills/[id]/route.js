import { z } from 'zod';
import { route } from '@/lib/api/route.js';
import { successResponse, errorResponse } from '@/lib/api/responses.js';
import { ERROR_CODES } from '@/lib/api/errors.js';
import { getSkillById, updateSkillMetadata, softDeleteSkill } from '@/lib/dal/skills.js';
import { getClientIp } from '@/lib/rate-limit/index.js';

const patchSkillSchema = z
  .object({
    tags: z.array(z.string().max(50)).max(20).optional(),
    visibility: z.enum(['PRIVATE', 'UNLISTED', 'PUBLIC']).optional(),
  })
  .strict();

export const GET = route(
  {
    access: 'public',
  },
  async ({ actor, params, traceId }) => {
    const id = params?.id;
    if (!id) {
      return errorResponse({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Không tìm thấy kỹ năng yêu cầu.',
        traceId,
        status: 404,
      });
    }

    const skill = await getSkillById(actor, id);
    if (!skill) {
      return errorResponse({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Không tìm thấy kỹ năng yêu cầu.',
        traceId,
        status: 404,
      });
    }

    return successResponse({ skill });
  },
);

export const PATCH = route(
  {
    access: 'user',
    schema: {
      body: patchSkillSchema,
    },
  },
  async ({ actor, params, body, request }) => {
    const id = params?.id;
    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent');

    const updated = await updateSkillMetadata(actor, id, body, { ip, userAgent });
    return successResponse({ skill: updated });
  },
);

export const DELETE = route(
  {
    access: 'user',
  },
  async ({ actor, params, request }) => {
    const id = params?.id;
    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent');

    await softDeleteSkill(actor, id, { ip, userAgent });
    return successResponse({ success: true });
  },
);
