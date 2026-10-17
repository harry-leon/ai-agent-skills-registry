import crypto from 'node:crypto';
import { ZodError } from 'zod';
import { ERROR_CODES, AppError } from './errors.js';
import { errorResponse } from './responses.js';
import { logger } from '../logger.js';
import { env } from '../env.js';

/**
 * Universal Route Handler Wrapper
 * @param {Object} options
 * @param {'public' | 'user'} options.access - Access control level (REQUIRED)
 * @param {Object} [options.schema] - Zod schemas { body, query, params }
 * @param {Object} [options.rateLimit] - Rate limiting config
 * @param {Function} handler - Next.js route handler function
 */
export function route(options, handler) {
  const actualHandler = handler || options?.handler;

  // Rule R3: Default deny: every API route MUST declare its access level explicitly.
  // A route without a declaration MUST fail at module load.
  if (!options || (options.access !== 'public' && options.access !== 'user')) {
    throw new Error(
      `FATAL: API route must explicitly declare access as 'public' or 'user'. Got: ${options?.access}`,
    );
  }

  if (typeof actualHandler !== 'function') {
    throw new Error('FATAL: API route handler function must be provided.');
  }

  return async function wrappedHandler(request, context = {}) {
    const startTime = Date.now();
    const traceId = crypto.randomUUID();
    const method = request.method;
    const url = new URL(request.url);
    const pathname = url.pathname;

    let actor = null;
    let body = undefined;
    let query = undefined;
    let params = undefined;

    try {
      // 1. CSRF Protection for mutating requests
      const isMutating = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method);
      if (isMutating) {
        const origin = request.headers.get('origin');
        // If an Origin header is present, require it to match APP_URL
        if (origin) {
          try {
            const expectedOrigin = new URL(env.APP_URL).origin;
            const requestOrigin = new URL(origin).origin;
            const isDevOrTest = env.NODE_ENV === 'development' || env.NODE_ENV === 'test';
            const devAllowed = [
              'http://localhost:3000',
              'http://localhost:3001',
              'http://127.0.0.1:3000',
              'http://127.0.0.1:3001',
            ];
            const isMatch =
              expectedOrigin === requestOrigin ||
              (isDevOrTest && devAllowed.includes(requestOrigin));
            if (!isMatch) {
              logger.warn({ traceId, origin, expectedOrigin }, 'CSRF origin mismatch');
              return errorResponse({
                code: ERROR_CODES.CSRF_ORIGIN_MISMATCH,
                message: 'Yêu cầu bị từ chối do nguồn gốc không khớp (CSRF).',
                traceId,
                status: 403,
              });
            }
          } catch {
            return errorResponse({
              code: ERROR_CODES.CSRF_ORIGIN_MISMATCH,
              message: 'Yêu cầu bị từ chối do header Origin không hợp lệ.',
              traceId,
              status: 403,
            });
          }
        }
      }

      // 2. Session Resolution
      if (options.access === 'user' || request.headers.get('cookie')) {
        try {
          const { getSessionFromRequest } = await import('../auth/session.js');
          actor = await getSessionFromRequest(request);
        } catch (err) {
          logger.debug({ traceId, err: err.message }, 'Failed to resolve session');
        }
      }

      // 3. Authentication Enforcement
      if (options.access === 'user') {
        if (!actor) {
          return errorResponse({
            code: ERROR_CODES.UNAUTHENTICATED,
            message: 'Vui lòng đăng nhập để tiếp tục.',
            traceId,
            status: 401,
          });
        }
        if (actor.status === 'DISABLED') {
          logger.warn({ traceId, userId: actor.id }, 'Disabled user attempted access');
          return errorResponse({
            code: ERROR_CODES.UNAUTHENTICATED,
            message: 'Tài khoản đã bị vô hiệu hóa.',
            traceId,
            status: 401,
          });
        }
      }

      // 4. Rate Limiting
      if (options.rateLimit) {
        try {
          const { checkRateLimit } = await import('../rate-limit/index.js');
          const limitResult = await checkRateLimit(request, actor, options.rateLimit);
          if (!limitResult.allowed) {
            return errorResponse({
              code: ERROR_CODES.RATE_LIMITED,
              message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.',
              traceId,
              retryAfter: limitResult.retryAfter,
              status: 429,
            });
          }
        } catch (err) {
          if (options.rateLimit.failClosed) {
            logger.error({ traceId, err: err.message }, 'Rate limiter failed closed');
            return errorResponse({
              code: ERROR_CODES.SERVICE_UNAVAILABLE,
              message: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.',
              traceId,
              status: 503,
            });
          }
          logger.warn({ traceId, err: err.message }, 'Rate limiter error, continuing open');
        }
      }

      // 5. Input Parsing & Validation
      if (context?.params) {
        params = await Promise.resolve(context.params);
        if (options.schema?.params) {
          params = options.schema.params.parse(params);
        }
      }

      if (options.schema?.query) {
        const queryObj = Object.fromEntries(url.searchParams.entries());
        query = options.schema.query.parse(queryObj);
      }

      if (options.schema?.body && isMutating) {
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          try {
            const text = await request.text();
            body = text && text.trim().length > 0 ? JSON.parse(text) : undefined;
          } catch {
            return errorResponse({
              code: ERROR_CODES.INVALID_JSON,
              message: 'Dữ liệu JSON không hợp lệ.',
              traceId,
              status: 400,
            });
          }
          body = options.schema.body.parse(body);
        } else if (!contentType) {
          body = options.schema.body.parse(undefined);
        }
      }

      // 6. Execute Handler
      const response = await actualHandler({
        request,
        actor,
        body,
        query,
        params,
        traceId,
      });

      // Inject x-trace-id header into successful response
      response.headers.set('x-trace-id', traceId);

      // Log request completion
      const duration = Date.now() - startTime;
      logger.info(
        {
          method,
          path: pathname,
          status: response.status,
          duration,
          traceId,
          userId: actor?.id || null,
        },
        'API request completed',
      );

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Handle Zod Validation Errors
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        logger.debug({ traceId, details }, 'Validation failed');
        return errorResponse({
          code: ERROR_CODES.VALIDATION_FAILED,
          message: 'Dữ liệu không hợp lệ.',
          traceId,
          details,
          status: 422,
        });
      }

      // Handle AppError
      if (error instanceof AppError) {
        if (error.status === 403 || error.status === 404) {
          logger.warn(
            { traceId, code: error.code, actorId: actor?.id, pathname },
            'Access denied / resource hidden',
          );
        }
        return errorResponse({
          code: error.code,
          message: error.message,
          traceId,
          details: error.details,
          status: error.status,
        });
      }

      // Handle Prisma Unique Constraint Violation
      if (error?.code === 'P2002') {
        const target = Array.isArray(error.meta?.target) ? error.meta.target.join(', ') : 'Trường';
        return errorResponse({
          code: ERROR_CODES.CONFLICT,
          message: `${target} đã tồn tại trong hệ thống.`,
          traceId,
          status: 409,
        });
      }

      // Log full internal error server-side (Rule S3, S10)
      logger.error(
        {
          err: error.message,
          stack: error.stack,
          traceId,
          method,
          path: pathname,
          duration,
          userId: actor?.id || null,
        },
        'Unhandled API internal error',
      );

      // Return generic message to client without leaking internal details
      return errorResponse({
        code: ERROR_CODES.INTERNAL,
        message: 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
        traceId,
        status: 500,
      });
    }
  };
}

export const apiRoute = route;
