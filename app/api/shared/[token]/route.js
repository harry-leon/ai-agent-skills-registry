import { route } from '@/lib/api/route.js';
import { successResponse, errorResponse } from '@/lib/api/responses.js';
import { ERROR_CODES } from '@/lib/api/errors.js';
import { getSkillByShareToken } from '@/lib/dal/skills.js';
import { getVersionFiles } from '@/lib/dal/files.js';
import { can, ACTIONS } from '@/lib/auth/policy.js';

export const GET = route(
  {
    access: 'public',
  },
  async ({ params, traceId }) => {
    const { token } = params;

    // 1. Fetch unlisted skill strictly by active shareToken
    const skill = await getSkillByShareToken(token);

    if (!skill || !can(null, ACTIONS.SKILL_READ, skill)) {
      return errorResponse({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Share link does not exist or has been disabled.',
        traceId,
        status: 404,
      });
    }

    // 2. Fetch current version files
    const files = skill.currentVersionId ? await getVersionFiles(skill.currentVersionId) : [];

    return successResponse({
      skill,
      files,
    });
  },
);
