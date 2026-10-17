import { z } from 'zod';
import { route } from '@/lib/api/route.js';
import { jsonResponse, errorResponse } from '@/lib/api/responses.js';
import { deleteUserAccount } from '@/lib/dal/users.js';
import { auth } from '@/lib/auth/config.js';
import { getClientIp } from '@/lib/rate-limit/index.js';
import { ERROR_CODES } from '@/lib/api/errors.js';

export const POST = route(
  {
    access: 'user',
    schema: {
      body: z
        .object({
          password: z.string().min(1, 'Vui lòng nhập mật khẩu để xác nhận xóa tài khoản.'),
        })
        .strict(),
    },
  },
  async ({ actor, body, request }) => {
    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent');

    // Verify current password before permitting account deletion
    try {
      const verifyRes = await auth.api.signInEmail({
        body: {
          email: actor.email,
          password: body.password,
        },
      });

      if (!verifyRes || verifyRes.error) {
        return errorResponse({
          code: ERROR_CODES.VALIDATION_FAILED,
          message: 'Mật khẩu xác nhận không chính xác.',
          status: 400,
        });
      }
    } catch {
      return errorResponse({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: 'Mật khẩu xác nhận không chính xác.',
        status: 400,
      });
    }

    // Cascade delete user account, sessions, skills and write audit log (Rule S12)
    await deleteUserAccount(actor.id, { ip, userAgent });

    return jsonResponse({
      success: true,
      message: 'Tài khoản của bạn đã được xóa vĩnh viễn.',
    });
  },
);
