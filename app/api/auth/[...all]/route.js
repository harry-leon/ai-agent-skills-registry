import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/lib/auth/config.js';
import { checkRateLimit } from '@/lib/rate-limit/index.js';
import { RATE_LIMIT_CONFIGS } from '@/lib/rate-limit/config.js';
import { errorResponse } from '@/lib/api/responses.js';
import { ERROR_CODES } from '@/lib/api/errors.js';
import { createAuditLog } from '@/lib/dal/audit.js';
import { getClientIp } from '@/lib/rate-limit/index.js';
import crypto from 'node:crypto';

const handler = toNextJsHandler(auth);

export const GET = handler.GET;

export async function POST(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const traceId = crypto.randomUUID();
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent');

  // Rate Limiting for Auth Actions (Section S4)
  if (pathname.includes('/sign-in')) {
    // Clone body to extract email for IP+email rate limit key without consuming stream
    let email = '';
    try {
      const cloned = request.clone();
      const body = await cloned.json();
      email = body.email ? String(body.email).toLowerCase().trim() : '';
    } catch {
      // Ignored here, Better Auth will handle invalid JSON
    }

    const rateResult = await checkRateLimit(request, null, {
      ...RATE_LIMIT_CONFIGS.login,
      extraKey: email,
    });

    if (!rateResult.allowed) {
      return errorResponse({
        code: ERROR_CODES.RATE_LIMITED,
        message: 'Too many failed sign-in attempts. Please wait 15 minutes and try again.',
        traceId,
        retryAfter: rateResult.retryAfter,
        status: 429,
      });
    }
  } else if (pathname.includes('/sign-up')) {
    const rateResult = await checkRateLimit(request, null, RATE_LIMIT_CONFIGS.register);
    if (!rateResult.allowed) {
      return errorResponse({
        code: ERROR_CODES.RATE_LIMITED,
        message: 'Too many registration attempts from this address. Please try again later.',
        traceId,
        retryAfter: rateResult.retryAfter,
        status: 429,
      });
    }
  } else if (pathname.includes('/forget-password') || pathname.includes('/reset-password')) {
    const rateResult = await checkRateLimit(request, null, RATE_LIMIT_CONFIGS.forgotPassword);
    if (!rateResult.allowed) {
      return errorResponse({
        code: ERROR_CODES.RATE_LIMITED,
        message: 'Too many password reset requests. Please try again later.',
        traceId,
        retryAfter: rateResult.retryAfter,
        status: 429,
      });
    }
  }

  // Execute Better Auth POST handler
  const response = await handler.POST(request);

  // Record Audit Logs for successful auth lifecycle events (Section S10)
  if (response.status >= 200 && response.status < 300) {
    if (pathname.includes('/sign-in')) {
      await createAuditLog({
        action: 'user.login_success',
        targetType: 'User',
        ip,
        userAgent,
      });
    } else if (pathname.includes('/sign-up')) {
      await createAuditLog({
        action: 'user.register',
        targetType: 'User',
        ip,
        userAgent,
      });
    } else if (pathname.includes('/change-password')) {
      await createAuditLog({
        action: 'user.password_change',
        targetType: 'User',
        ip,
        userAgent,
      });
    } else if (pathname.includes('/reset-password')) {
      await createAuditLog({
        action: 'user.password_reset',
        targetType: 'User',
        ip,
        userAgent,
      });
    }
  }

  return response;
}
