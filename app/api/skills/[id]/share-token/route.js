import { z } from 'zod';
import { route } from '@/lib/api/route.js';
import { successResponse } from '@/lib/api/responses.js';
import { manageShareToken } from '@/lib/dal/skills.js';
import { getClientIp } from '@/lib/rate-limit/index.js';

const shareTokenSchema = z
  .object({
    action: z.enum(['enable', 'rotate', 'disable']),
  })
  .strict();

export const POST = route(
  {
    access: 'user',
    schema: {
      body: shareTokenSchema,
    },
  },
  async ({ actor, params, body, request }) => {
    const id = params?.id;
    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent');

    const result = await manageShareToken(actor, id, body.action, { ip, userAgent });
    return successResponse(result);
  },
);
