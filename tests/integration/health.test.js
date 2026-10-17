import { describe, it, expect, vi } from 'vitest';
import { GET as healthHandler } from '@/app/api/health/route.js';
import { GET as readyHandler } from '@/app/api/ready/route.js';
import { GET as notFoundHandler } from '@/app/api/[...not_found]/route.js';
import { route } from '@/lib/api/route.js';
import * as systemDal from '@/lib/dal/system.js';

describe('Health and Readiness Endpoints', () => {
  it('/api/health returns 200 and healthy status', async () => {
    const request = new Request('http://localhost:3000/api/health', { method: 'GET' });
    const response = await healthHandler(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('healthy');
    expect(response.headers.get('x-trace-id')).toBeDefined();
  });

  it('/api/ready returns 200 when database connectivity succeeds', async () => {
    const spy = vi.spyOn(systemDal, 'checkDatabaseConnection').mockResolvedValue(true);
    const request = new Request('http://localhost:3000/api/ready', { method: 'GET' });
    const response = await readyHandler(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ready');
    expect(body.database).toBe('connected');
    spy.mockRestore();
  });

  it('/api/ready returns 503 when database connectivity fails', async () => {
    const spy = vi
      .spyOn(systemDal, 'checkDatabaseConnection')
      .mockRejectedValue(new Error('DB Connection Refused'));
    const request = new Request('http://localhost:3000/api/ready', { method: 'GET' });
    const response = await readyHandler(request);

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(response.headers.get('x-trace-id')).toBeDefined();
    spy.mockRestore();
  });

  it('unknown API route returns standard JSON 404', async () => {
    const response = await notFoundHandler();
    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.error.code).toBe('ROUTE_NOT_FOUND');
    expect(body.error.traceId).toBeDefined();
  });

  it('route wrapper throws error at module load if access is omitted (Rule R3)', () => {
    expect(() => route({}, () => {})).toThrow(
      /API route must explicitly declare access as 'public' or 'user'/,
    );
    expect(() => route({ access: 'invalid' }, () => {})).toThrow(
      /API route must explicitly declare access/,
    );
  });
});
