import { NextResponse } from 'next/server';
import { HTTP_STATUS } from './errors.js';

export function jsonResponse(data, { status = 200, traceId, headers = {} } = {}) {
  const responseHeaders = new Headers(headers);
  if (traceId) {
    responseHeaders.set('x-trace-id', traceId);
  }
  return NextResponse.json(data, {
    status,
    headers: responseHeaders,
  });
}

export function errorResponse({
  code,
  message,
  traceId,
  details = undefined,
  status = undefined,
  retryAfter = undefined,
}) {
  const httpStatus = status || HTTP_STATUS[code] || 500;
  const headers = new Headers();
  if (traceId) {
    headers.set('x-trace-id', traceId);
  }
  if (retryAfter) {
    headers.set('Retry-After', String(retryAfter));
  }

  const body = {
    error: {
      code,
      message,
      traceId,
      ...(details ? { details } : {}),
    },
  };

  return NextResponse.json(body, {
    status: httpStatus,
    headers,
  });
}
