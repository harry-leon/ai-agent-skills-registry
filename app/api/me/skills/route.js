import { route } from '@/lib/api/route.js';
import { successResponse } from '@/lib/api/responses.js';
import { searchOwnerSkills } from '@/lib/dal/search.js';

export const GET = route(
  {
    access: 'user',
  },
  async ({ request, actor }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') || '';
    const tag = url.searchParams.get('tag') || '';
    const visibility = url.searchParams.get('visibility') || '';
    const sort = url.searchParams.get('sort') || 'updated';
    const order = url.searchParams.get('order') || 'desc';
    const cursor = url.searchParams.get('cursor') || null;
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    const result = await searchOwnerSkills(actor, {
      q,
      tag,
      visibility,
      sort,
      order,
      cursor,
      limit,
    });

    return successResponse(result);
  },
);
