import { cache } from 'react';
import { auth } from './config.js';
import { logger } from '../logger.js';

/**
 * Resolves session and authenticated actor from incoming request.
 * Per Rule S1, the user is resolved directly from the database on every request.
 * Disabled users are immediately rejected.
 *
 * @param {Request} request
 * @returns {Promise<Object|null>} The authenticated user object or null
 */
export async function getSessionFromRequest(request) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData || !sessionData.user) {
      return null;
    }

    const { user, session } = sessionData;

    // Rule S1: Disabled user is rejected on every request even with valid session token
    if (user.status === 'DISABLED') {
      logger.warn({ userId: user.id }, 'Session rejected for DISABLED user');
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      handle: user.handle,
      status: user.status || 'ACTIVE',
      image: user.image || null,
      sessionId: session?.id || null,
    };
  } catch (err) {
    logger.debug({ err: err.message }, 'Failed to resolve session from request');
    return null;
  }
}

/**
 * Resolves session in Next.js Server Components using next/headers.
 * Deduplicated per RSC request via React.cache() while preserving Rule S1.
 * @returns {Promise<Object|null>}
 */
export const getServerSession = cache(async () => {
  try {
    const { headers } = await import('next/headers');
    const requestHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: requestHeaders,
    });

    if (!sessionData || !sessionData.user || sessionData.user.status === 'DISABLED') {
      return null;
    }

    const actor = {
      id: sessionData.user.id,
      email: sessionData.user.email,
      name: sessionData.user.name,
      handle: sessionData.user.handle,
      status: sessionData.user.status,
      image: sessionData.user.image,
      sessionId: sessionData.session?.id,
    };
    actor.user = actor;
    return actor;
  } catch {
    return null;
  }
});
