import { z } from 'zod';
import { route } from '@/lib/api/route.js';
import { successResponse } from '@/lib/api/responses.js';
import { RATE_LIMIT_CONFIGS } from '@/lib/rate-limit/config.js';
import { forkSkill } from '@/lib/dal/skills.js';
import { getClientIp } from '@/lib/rate-limit/index.js';

const forkSkillSchema = z
  .object({
    shareToken: z.string().optional(),
  })
  .strict()
  .optional();

export const POST = route(
  {
    access: 'user',
    rateLimit: {
      ...RATE_LIMIT_CONFIGS.fork,
      useUser: true,
    },
    schema: {
      body: forkSkillSchema,
    },
  },
  async ({ request, actor, params, body }) => {
    const { id } = await params;
    const url = new URL(request.url);
    const shareToken = body?.shareToken || url.searchParams.get('shareToken') || null;
    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent');

    const skill = await forkSkill({
      actor,
      skillId: id,
      shareToken,
      auditMeta: { ip, userAgent },
    });

    return successResponse({ skill }, 201);
  },
);
