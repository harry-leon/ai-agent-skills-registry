import { apiRoute } from '@/lib/api/route.js';
import { jsonResponse, errorResponse } from '@/lib/api/responses.js';
import { ERROR_CODES } from '@/lib/api/errors.js';
import { cleanupExpiredBuckets } from '@/lib/dal/rate-limit.js';
import { env } from '@/lib/env.js';

export const dynamic = 'force-dynamic';

function verifyCronAuth(request, traceId) {
  if (env.CRON_SECRET) {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token || token !== env.CRON_SECRET) {
      return errorResponse({
        code: ERROR_CODES.UNAUTHENTICATED,
        message: 'Invalid or missing cron authorization secret.',
        traceId,
        status: 401,
      });
    }
  }
  return null;
}

function getSanitizedRetentionSeconds(url) {
  const parsed = parseInt(url.searchParams.get('retention') || '3600', 10);
  // Guarantee a non-negative integer with a sensible minimum of 60 seconds (default 3600)
  if (isNaN(parsed) || parsed < 60) {
    return 3600;
  }
  return parsed;
}

/**
 * Scheduled cleanup endpoint to invoke cleanupExpiredBuckets.
 * Removes rate limit buckets older than retention cutoff (default: 1 hour).
 */
export const GET = apiRoute({
  access: 'public',
  handler: async ({ request, traceId }) => {
    const authErr = verifyCronAuth(request, traceId);
    if (authErr) return authErr;

    const url = new URL(request.url);
    const retentionSeconds = getSanitizedRetentionSeconds(url);
    const cutoffDate = new Date(Date.now() - retentionSeconds * 1000);

    const deletedCount = await cleanupExpiredBuckets(cutoffDate);

    return jsonResponse(
      {
        success: true,
        data: {
          deletedBuckets: deletedCount,
          cutoff: cutoffDate.toISOString(),
        },
      },
      { traceId },
    );
  },
});

export const POST = apiRoute({
  access: 'public',
  handler: async ({ request, traceId }) => {
    const authErr = verifyCronAuth(request, traceId);
    if (authErr) return authErr;

    const url = new URL(request.url);
    const retentionSeconds = getSanitizedRetentionSeconds(url);
    const cutoffDate = new Date(Date.now() - retentionSeconds * 1000);

    const deletedCount = await cleanupExpiredBuckets(cutoffDate);

    return jsonResponse(
      {
        success: true,
        data: {
          deletedBuckets: deletedCount,
          cutoff: cutoffDate.toISOString(),
        },
      },
      { traceId },
    );
  },
});
