import { route } from '@/lib/api/route.js';
import { jsonResponse } from '@/lib/api/responses.js';

export const GET = route({ access: 'public' }, async () => {
  return jsonResponse({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});
