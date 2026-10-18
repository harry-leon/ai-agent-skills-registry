import crypto from 'node:crypto';
import { ERROR_CODES } from '@/lib/api/errors.js';
import { errorResponse } from '@/lib/api/responses.js';

export async function GET() {
  const traceId = crypto.randomUUID();
  return errorResponse({
    code: ERROR_CODES.ROUTE_NOT_FOUND,
    message: 'API route not found.',
    traceId,
    status: 404,
  });
}

export const POST = GET;
export const PUT = GET;
export const PATCH = GET;
export const DELETE = GET;
export const HEAD = GET;
export const OPTIONS = GET;
