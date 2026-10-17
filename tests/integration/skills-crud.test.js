import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import crypto from 'node:crypto';
import { db } from '@/lib/db.js';
import { POST as createSkillHandler } from '@/app/api/skills/route.js';
import {
  GET as getSkillHandler,
  PATCH as patchSkillHandler,
  DELETE as deleteSkillHandler,
} from '@/app/api/skills/[id]/route.js';
import { POST as shareTokenHandler } from '@/app/api/skills/[id]/share-token/route.js';

describe('Milestone M1.4: Skills CRUD, Visibility & Authorization Matrix', () => {
  let userA;
  let userB;
  let sessionCookieA;
  let sessionCookieB;

  const userAHandle = `usera-${Date.now()}`.slice(0, 20);
  const userBHandle = `userb-${Date.now()}`.slice(0, 20);

  beforeAll(async () => {
    const { auth } = await import('@/lib/auth/config.js');

    const resA = await auth.api.signUpEmail({
      body: {
        email: `usera-${Date.now()}@skillvault.local`,
        password: 'Password123!',
        name: 'User Alpha',
        handle: userAHandle,
      },
      asResponse: true,
    });
    sessionCookieA = resA.headers.get('set-cookie').split(';')[0];
    const dataA = await resA.json();
    userA = dataA.user;

    const resB = await auth.api.signUpEmail({
      body: {
        email: `userb-${Date.now()}@skillvault.local`,
        password: 'Password123!',
        name: 'User Beta',
        handle: userBHandle,
      },
      asResponse: true,
    });
    sessionCookieB = resB.headers.get('set-cookie').split(';')[0];
    const dataB = await resB.json();
    userB = dataB.user;
  });

  afterAll(async () => {
    await db.skill.deleteMany({
      where: { ownerId: { in: [userA.id, userB.id] } },
    });
    await db.session.deleteMany({
      where: { userId: { in: [userA.id, userB.id] } },
    });
    await db.user.deleteMany({
      where: { id: { in: [userA.id, userB.id] } },
    });
  });

  const VALID_SKILL_MD = `---
name: security-agent
description: An agent for inspecting security headers and policies
---
# Security Agent
Instructions...
`;

  let createdSkillId = null;

  it('1. Mass assignment: sending ownerId or deletedAt is rejected with 422', async () => {
    const maliciousReq = new Request('http://localhost:3000/api/skills', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Cookie: sessionCookieA,
      },
      body: JSON.stringify({
        ownerId: userB.id, // Attempt to assign ownership to user B
        deletedAt: new Date().toISOString(),
        files: [{ path: 'SKILL.md', content: VALID_SKILL_MD }],
        visibility: 'PRIVATE',
      }),
    });

    const res = await createSkillHandler(maliciousReq);
    expect(res.status).toBe(422);

    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_FAILED');
  });

  it('2. User A successfully creates a PRIVATE skill', async () => {
    const req = new Request('http://localhost:3000/api/skills', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Cookie: sessionCookieA,
      },
      body: JSON.stringify({
        files: [
          { path: 'SKILL.md', content: VALID_SKILL_MD },
          { path: 'scripts/audit.py', content: 'print("audit")\n' },
        ],
        tags: ['security', 'audit'],
        visibility: 'PRIVATE',
        message: 'Initial v1 release',
      }),
    });

    const res = await createSkillHandler(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.data.skill.id).toBeDefined();
    expect(data.data.skill.visibility).toBe('PRIVATE');
    expect(data.data.skill.ownerId).toBe(userA.id);

    createdSkillId = data.data.skill.id;
  });

  it("3. User B cannot read User A's PRIVATE skill (returns 404 to avoid leaking existence)", async () => {
    const req = new Request(`http://localhost:3000/api/skills/${createdSkillId}`, {
      method: 'GET',
      headers: {
        Cookie: sessionCookieB,
      },
    });

    const res = await getSkillHandler(req, { params: { id: createdSkillId } });
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it("4. User B cannot patch or delete User A's PRIVATE skill (returns 404/403)", async () => {
    // Attempt PATCH
    const patchReq = new Request(`http://localhost:3000/api/skills/${createdSkillId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Cookie: sessionCookieB,
      },
      body: JSON.stringify({ tags: ['hacked'] }),
    });

    const patchRes = await patchSkillHandler(patchReq, { params: { id: createdSkillId } });
    expect(patchRes.status).toBe(403);

    // Attempt DELETE
    const deleteReq = new Request(`http://localhost:3000/api/skills/${createdSkillId}`, {
      method: 'DELETE',
      headers: {
        Origin: 'http://localhost:3000',
        Cookie: sessionCookieB,
      },
    });

    const deleteRes = await deleteSkillHandler(deleteReq, { params: { id: createdSkillId } });
    expect(deleteRes.status).toBe(403);
  });

  it('5. User A updates skill to PUBLIC; User B can read, but cannot patch or delete (403)', async () => {
    // User A sets PUBLIC
    const patchReq = new Request(`http://localhost:3000/api/skills/${createdSkillId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Cookie: sessionCookieA,
      },
      body: JSON.stringify({ visibility: 'PUBLIC' }),
    });

    const patchRes = await patchSkillHandler(patchReq, { params: { id: createdSkillId } });
    expect(patchRes.status).toBe(200);

    // User B reads PUBLIC skill -> 200 OK
    const getReq = new Request(`http://localhost:3000/api/skills/${createdSkillId}`, {
      method: 'GET',
      headers: {
        Cookie: sessionCookieB,
      },
    });
    const getRes = await getSkillHandler(getReq, { params: { id: createdSkillId } });
    expect(getRes.status).toBe(200);

    // User B attempts to patch User A's PUBLIC skill -> 403
    const unauthorizedPatch = new Request(`http://localhost:3000/api/skills/${createdSkillId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Cookie: sessionCookieB,
      },
      body: JSON.stringify({ tags: ['malicious'] }),
    });
    const unauthRes = await patchSkillHandler(unauthorizedPatch, {
      params: { id: createdSkillId },
    });
    expect(unauthRes.status).toBe(403);
  });

  it('6. Share token enable and rotate: rotating token immediately invalidates old token', async () => {
    // Enable share token (sets UNLISTED)
    const enableReq = new Request(
      `http://localhost:3000/api/skills/${createdSkillId}/share-token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000',
          Cookie: sessionCookieA,
        },
        body: JSON.stringify({ action: 'enable' }),
      },
    );

    const enableRes = await shareTokenHandler(enableReq, { params: { id: createdSkillId } });
    expect(enableRes.status).toBe(200);

    const enableData = await enableRes.json();
    const token1 = enableData.data.shareToken;
    expect(token1).toBeDefined();

    // Verify token1 in DB
    const { getSkillByShareToken } = await import('@/lib/dal/skills.js');
    const skillByToken1 = await getSkillByShareToken(token1);
    expect(skillByToken1).not.toBeNull();
    expect(skillByToken1.id).toBe(createdSkillId);

    // Rotate share token
    const rotateReq = new Request(
      `http://localhost:3000/api/skills/${createdSkillId}/share-token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000',
          Cookie: sessionCookieA,
        },
        body: JSON.stringify({ action: 'rotate' }),
      },
    );

    const rotateRes = await shareTokenHandler(rotateReq, { params: { id: createdSkillId } });
    expect(rotateRes.status).toBe(200);

    const rotateData = await rotateRes.json();
    const token2 = rotateData.data.shareToken;
    expect(token2).not.toBe(token1);

    // Old token must be invalidated immediately
    const oldLookup = await getSkillByShareToken(token1);
    expect(oldLookup).toBeNull();

    // New token must work
    const newLookup = await getSkillByShareToken(token2);
    expect(newLookup).not.toBeNull();
    expect(newLookup.id).toBe(createdSkillId);
  });

  it('7. Soft delete: deleted skill is invisible to everyone (returns 404)', async () => {
    // User A soft deletes
    const deleteReq = new Request(`http://localhost:3000/api/skills/${createdSkillId}`, {
      method: 'DELETE',
      headers: {
        Origin: 'http://localhost:3000',
        Cookie: sessionCookieA,
      },
    });

    const deleteRes = await deleteSkillHandler(deleteReq, { params: { id: createdSkillId } });
    expect(deleteRes.status).toBe(200);

    // User A queries it -> returns 404
    const getReqA = new Request(`http://localhost:3000/api/skills/${createdSkillId}`, {
      method: 'GET',
      headers: { Cookie: sessionCookieA },
    });
    const resA = await getSkillHandler(getReqA, { params: { id: createdSkillId } });
    expect(resA.status).toBe(404);

    // User B queries it -> returns 404
    const getReqB = new Request(`http://localhost:3000/api/skills/${createdSkillId}`, {
      method: 'GET',
      headers: { Cookie: sessionCookieB },
    });
    const resB = await getSkillHandler(getReqB, { params: { id: createdSkillId } });
    expect(resB.status).toBe(404);
  });
});
