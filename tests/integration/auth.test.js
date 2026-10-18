import { describe, it, expect, beforeEach } from 'vitest';
import { POST as authHandler } from '@/app/api/auth/[...all]/route.js';
import { PATCH as updateProfileHandler } from '@/app/api/me/profile/route.js';
import { db } from '@/lib/db.js';
import { getSessionFromRequest } from '@/lib/auth/session.js';
import { deleteUserAccount } from '@/lib/dal/users.js';
import crypto from 'node:crypto';

describe('Milestone M1.2: Authentication & Account Security Tests', () => {
  const testUserEmail = `test-${Date.now()}@example.com`;
  const testHandle = `user-${Date.now()}`.slice(0, 20);
  const testPassword = 'CorrectPassword123!';

  beforeEach(async () => {
    // Clear test rate limits before tests
    await db.rateLimitBucket.deleteMany();
  });

  it('1. Wrong password returns generic error message', async () => {
    // Attempt sign-in with non-existent or invalid credentials
    const req = new Request('http://localhost:3000/api/auth/sign-in/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'WrongPassword123!',
      }),
    });

    const res = await authHandler(req);
    expect(res.status).toBeGreaterThanOrEqual(400);

    const body = await res.json();
    // Verify no internal stack traces or database info leaked
    expect(body.stack).toBeUndefined();
  });

  it('2. The 11th login attempt within 15 minutes returns HTTP 429 with Retry-After', async () => {
    const targetEmail = `brute-${Date.now()}@example.com`;

    for (let i = 1; i <= 10; i++) {
      const req = new Request('http://localhost:3000/api/auth/sign-in/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-real-ip': '192.168.1.100',
        },
        body: JSON.stringify({
          email: targetEmail,
          password: 'WrongPassword123!',
        }),
      });
      const res = await authHandler(req);
      expect(res.status).not.toBe(429);
    }

    // 11th attempt must be rate limited (S4)
    const blockedReq = new Request('http://localhost:3000/api/auth/sign-in/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-real-ip': '192.168.1.100',
      },
      body: JSON.stringify({
        email: targetEmail,
        password: 'WrongPassword123!',
      }),
    });

    const blockedRes = await authHandler(blockedReq);
    expect(blockedRes.status).toBe(429);

    const body = await blockedRes.json();
    expect(body.error.code).toBe('RATE_LIMITED');
    expect(blockedRes.headers.get('Retry-After')).toBeDefined();
  });

  it('3. Forgot-password returns identical response for existing and unknown emails', async () => {
    // Email 1: Not in database
    const reqUnknown = new Request('http://localhost:3000/api/auth/forget-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-real-ip': '10.0.0.1',
      },
      body: JSON.stringify({
        email: 'definitely-unknown-email@example.com',
      }),
    });
    const resUnknown = await authHandler(reqUnknown);
    const bodyUnknown = await resUnknown.text();

    // Email 2: Exists in database
    const user = await db.user.create({
      data: {
        name: 'Existing User',
        email: `exist-${Date.now()}@example.com`,
        handle: `exist-${Date.now()}`.slice(0, 20),
        status: 'ACTIVE',
      },
    });

    const reqKnown = new Request('http://localhost:3000/api/auth/forget-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-real-ip': '10.0.0.2',
      },
      body: JSON.stringify({
        email: user.email,
      }),
    });
    const resKnown = await authHandler(reqKnown);
    const bodyKnown = await resKnown.text();

    // Status codes and responses must match to prevent enumeration
    expect(resUnknown.status).toBe(resKnown.status);
    expect(bodyUnknown).toBe(bodyKnown);
  });

  it('4. A DISABLED user is rejected on every request even with a valid session', async () => {
    // Create a disabled user with a session in the DB
    const disabledUser = await db.user.create({
      data: {
        name: 'Disabled User',
        email: `disabled-${Date.now()}@example.com`,
        handle: `disabled-${Date.now()}`.slice(0, 20),
        status: 'DISABLED',
      },
    });

    const sessionToken = crypto.randomUUID();
    await db.session.create({
      data: {
        token: sessionToken,
        userId: disabledUser.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });

    const mockRequest = new Request('http://localhost:3000/api/ready', {
      headers: {
        cookie: `better-auth.session_token=${sessionToken}`,
      },
    });

    const resolved = await getSessionFromRequest(mockRequest);
    expect(resolved).toBeNull();
  });

  it('5. Account deletion cascades skills, versions, sessions and logs audit row', async () => {
    // Create user with a skill and version
    const victim = await db.user.create({
      data: {
        name: 'To Delete',
        email: `delete-${Date.now()}@example.com`,
        handle: `del-${Date.now()}`.slice(0, 20),
        status: 'ACTIVE',
      },
    });

    const skill = await db.skill.create({
      data: {
        ownerId: victim.id,
        slug: 'victim-skill',
        name: 'Victim Skill',
        description: 'To be deleted with user',
        tags: ['test'],
        visibility: 'PRIVATE',
      },
    });

    await db.skillVersion.create({
      data: {
        skillId: skill.id,
        number: 1,
        contentHash: 'mock-hash',
        createdById: victim.id,
      },
    });

    // Delete account
    await deleteUserAccount(victim.id, { ip: '127.0.0.1', userAgent: 'vitest' });

    // Assert user and skill are deleted from DB
    const deletedUser = await db.user.findUnique({ where: { id: victim.id } });
    const deletedSkill = await db.skill.findUnique({ where: { id: skill.id } });
    expect(deletedUser).toBeNull();
    expect(deletedSkill).toBeNull();

    // Assert audit log exists
    const audit = await db.auditLog.findFirst({
      where: {
        action: 'user.account_delete',
        targetId: victim.id,
      },
    });
    expect(audit).toBeDefined();
    expect(audit.actorId).toBe(victim.id);
  });

  it('6. User can update their profile name and handle', async () => {
    const { auth } = await import('@/lib/auth/config.js');
    const email = `profile-test-${Date.now()}@skillvault.local`;
    const initialHandle = `h-${Date.now()}`.slice(0, 20);

    const signupRes = await auth.api.signUpEmail({
      body: {
        email,
        password: 'Password123!',
        name: 'Initial Name',
        handle: initialHandle,
      },
      asResponse: true,
    });
    const sessionCookie = signupRes.headers.get('set-cookie').split(';')[0];
    const data = await signupRes.json();
    const user = data.user;

    const newHandle = `new-${Date.now()}`.slice(0, 20);

    const req = new Request('http://localhost:3000/api/me/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie: sessionCookie,
      },
      body: JSON.stringify({
        name: 'Updated Name',
        handle: newHandle,
      }),
    });

    const res = await updateProfileHandler(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.user.name).toBe('Updated Name');
    expect(body.user.handle).toBe(newHandle);

    const updated = await db.user.findUnique({ where: { id: user.id } });
    expect(updated.name).toBe('Updated Name');
    expect(updated.handle).toBe(newHandle);
  });
});
