import { env } from '../env.js';
import { incrementBucket } from '../dal/rate-limit.js';

/**
 * Extracts client IP securely according to S4 rules.
 * @param {Request} request
 * @returns {string}
 */
export function getClientIp(request) {
  if (env.TRUSTED_PROXY_HEADER) {
    const trustedHeader = request.headers.get(env.TRUSTED_PROXY_HEADER.toLowerCase());
    if (trustedHeader) {
      return trustedHeader.split(',')[0].trim();
    }
  }
  // Fallback to socket address / localhost in absence of trusted proxy header
  return request.headers.get('x-real-ip') || '127.0.0.1';
}

/**
 * Checks and updates rate limit for a given request.
 * @param {Request} request
 * @param {Object|null} actor
 * @param {Object} options
 * @param {string} options.keyPrefix
 * @param {number} options.windowMs
 * @param {number} options.max
 * @param {boolean} [options.useUser]
 * @param {string} [options.extraKey]
 * @returns {Promise<{ allowed: boolean, count: number, retryAfter: number }>}
 */
export async function checkRateLimit(request, actor, options) {
  const ip = getClientIp(request);
  const userIdentifier = options.useUser && actor ? `user:${actor.id}` : `ip:${ip}`;
  const suffix = options.extraKey ? `:${options.extraKey}` : '';
  const key = `${options.keyPrefix}:${userIdentifier}${suffix}`;

  const now = Date.now();
  const windowStartMs = Math.floor(now / options.windowMs) * options.windowMs;
  const windowStart = new Date(windowStartMs);

  const count = await incrementBucket(key, windowStart);

  if (count > options.max) {
    const retryAfter = Math.ceil((windowStartMs + options.windowMs - now) / 1000);
    return {
      allowed: false,
      count,
      retryAfter: Math.max(1, retryAfter),
    };
  }

  return {
    allowed: true,
    count,
    retryAfter: 0,
  };
}
