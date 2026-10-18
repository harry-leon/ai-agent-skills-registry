import { z } from 'zod';
import { route } from '@/lib/api/route.js';
import { jsonResponse, errorResponse } from '@/lib/api/responses.js';
import { isHandleTaken, updateUserProfile } from '@/lib/dal/users.js';
import { validateHandle } from '@/lib/auth/handle.js';
import { ERROR_CODES } from '@/lib/api/errors.js';

export const PATCH = route(
  {
    access: 'user',
    schema: {
      body: z
        .object({
          name: z.string().trim().min(1, 'Name cannot be empty.').max(100, 'Name cannot exceed 100 characters.').optional(),
          handle: z.string().trim().optional(),
        })
        .strict(),
    },
  },
  async ({ actor, body }) => {
    const updates = {};

    if (body.name !== undefined) {
      updates.name = body.name;
    }

    if (body.handle !== undefined) {
      const normalizedHandle = body.handle.toLowerCase().trim();
      if (normalizedHandle !== actor.handle) {
        const check = validateHandle(normalizedHandle);
        if (!check.valid) {
          return errorResponse({
            code: ERROR_CODES.VALIDATION_FAILED,
            message: check.error,
            status: 400,
          });
        }

        // Check uniqueness across other users via DAL
        const taken = await isHandleTaken(normalizedHandle, actor.id);

        if (taken) {
          return errorResponse({
            code: ERROR_CODES.CONFLICT,
            message: 'This handle is already taken. Please choose another.',
            status: 409,
          });
        }

        updates.handle = normalizedHandle;
      }
    }

    if (Object.keys(updates).length === 0) {
      return jsonResponse({
        success: true,
        user: actor,
        message: 'No changes detected.',
      });
    }

    const updatedUser = await updateUserProfile(actor.id, updates);

    return jsonResponse({
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully.',
    });
  },
);
