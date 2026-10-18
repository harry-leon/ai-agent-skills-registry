import { z } from 'zod';
import { route } from '@/lib/api/route.js';
import { successResponse } from '@/lib/api/responses.js';
import { getUserFavoriteSkills } from '@/lib/dal/favorites.js';

const getFavoritesSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const GET = route(
  {
    access: 'user',
    schema: {
      query: getFavoritesSchema,
    },
  },
  async ({ actor, query }) => {
    const { cursor, limit } = query;
    const result = await getUserFavoriteSkills(actor.id, { cursor, limit });
    return successResponse(result);
  },
);
