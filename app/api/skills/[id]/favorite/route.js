import { route } from '@/lib/api/route.js';
import { successResponse, errorResponse } from '@/lib/api/responses.js';
import { ERROR_CODES } from '@/lib/api/errors.js';
import {
  toggleSkillFavorite,
  isSkillFavorited,
  getSkillFavoriteCount,
} from '@/lib/dal/favorites.js';
import { getClientIp } from '@/lib/rate-limit/index.js';

export const POST = route(
  {
    access: 'user',
  },
  async ({ actor, params, request }) => {
    const skillId = params?.id;
    if (!skillId) {
      return errorResponse({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Skill not found.',
        status: 404,
      });
    }

    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent');

    const result = await toggleSkillFavorite(actor.id, skillId, { ip, userAgent });
    return successResponse(result);
  },
);

export const GET = route(
  {
    access: 'public',
  },
  async ({ actor, params }) => {
    const skillId = params?.id;
    if (!skillId) {
      return errorResponse({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Skill not found.',
        status: 404,
      });
    }

    const [favorited, count] = await Promise.all([
      actor?.id ? isSkillFavorited(actor.id, skillId) : Promise.resolve(false),
      getSkillFavoriteCount(skillId),
    ]);

    return successResponse({ favorited, count });
  },
);
