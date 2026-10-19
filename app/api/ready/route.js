import { route } from '@/lib/api/route.js';
import { jsonResponse, errorResponse } from '@/lib/api/responses.js';
import { checkDatabaseConnection } from '@/lib/dal/system.js';
import { ERROR_CODES } from '@/lib/api/errors.js';

export const GET = route({ access: 'public' }, async () => {
  try {
    await checkDatabaseConnection();
    return jsonResponse({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse({
      code: ERROR_CODES.SERVICE_UNAVAILABLE,
      message: 'System not ready (database connection failed).',
      status: 503,
    });
  }
});
