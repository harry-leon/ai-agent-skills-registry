import { describe, it, expect } from 'vitest';
import { db } from '@/lib/db.js';
import {
  GET as cleanupGetHandler,
  POST as cleanupPostHandler,
} from '@/app/api/cron/cleanup/route.js';

describe('Cron Cleanup Endpoint', () => {
  it('GET /api/cron/cleanup cleans up expired rate limit buckets', async () => {
    const expiredDate = new Date(Date.now() - 7200 * 1000); // 2 hours ago
    await db.rateLimitBucket.create({
      data: {
        key: 'cron-test-expired',
        windowStart: expiredDate,
        count: 5,
      },
    });

    const activeDate = new Date();
    await db.rateLimitBucket.create({
      data: {
        key: 'cron-test-active',
        windowStart: activeDate,
        count: 1,
      },
    });

    const req = new Request('http://localhost:3000/api/cron/cleanup?retention=3600', {
      method: 'GET',
    });
    const res = await cleanupGetHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.deletedBuckets).toBeGreaterThanOrEqual(1);

    const checkExpired = await db.rateLimitBucket.findUnique({
      where: {
        key_windowStart: {
          key: 'cron-test-expired',
          windowStart: expiredDate,
        },
      },
    });
    expect(checkExpired).toBeNull();

    const checkActive = await db.rateLimitBucket.findUnique({
      where: {
        key_windowStart: {
          key: 'cron-test-active',
          windowStart: activeDate,
        },
      },
    });
    expect(checkActive).not.toBeNull();

    // Clean up
    await db.rateLimitBucket.deleteMany({
      where: { key: 'cron-test-active' },
    });
  });

  it('POST /api/cron/cleanup also cleans up expired rate limit buckets', async () => {
    const expiredDate = new Date(Date.now() - 7200 * 1000);
    await db.rateLimitBucket.create({
      data: {
        key: 'cron-test-post-expired',
        windowStart: expiredDate,
        count: 3,
      },
    });

    const req = new Request('http://localhost:3000/api/cron/cleanup', {
      method: 'POST',
      headers: {
        Origin: 'http://localhost:3000',
      },
    });
    const res = await cleanupPostHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.deletedBuckets).toBeGreaterThanOrEqual(1);
  });

  it('rejects unauthorized requests when CRON_SECRET is set', async () => {
    const { env } = await import('@/lib/env.js');
    env.CRON_SECRET = 'secret_cron_token_123';

    try {
      // 1. Missing header -> 401
      const reqMissing = new Request('http://localhost:3000/api/cron/cleanup', { method: 'GET' });
      const resMissing = await cleanupGetHandler(reqMissing);
      expect(resMissing.status).toBe(401);

      // 2. Wrong header -> 401
      const reqWrong = new Request('http://localhost:3000/api/cron/cleanup', {
        method: 'GET',
        headers: { Authorization: 'Bearer wrong_token' },
      });
      const resWrong = await cleanupGetHandler(reqWrong);
      expect(resWrong.status).toBe(401);

      // 3. Valid header -> 200
      const reqValid = new Request('http://localhost:3000/api/cron/cleanup', {
        method: 'GET',
        headers: { Authorization: 'Bearer secret_cron_token_123' },
      });
      const resValid = await cleanupGetHandler(reqValid);
      expect(resValid.status).toBe(200);
    } finally {
      env.CRON_SECRET = undefined;
    }
  });

  it('handles negative or invalid retention gracefully without crashing', async () => {
    const req = new Request('http://localhost:3000/api/cron/cleanup?retention=-99999', {
      method: 'GET',
    });
    const res = await cleanupGetHandler(req);
    expect(res.status).toBe(200);
  });
});
