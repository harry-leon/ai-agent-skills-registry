import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/lib/db.js';
import { POST as favoriteToggleHandler } from '@/app/api/skills/[id]/favorite/route.js';
import { GET as getFavoritesHandler } from '@/app/api/me/favorites/route.js';
import { POST as createSkillHandler } from '@/app/api/skills/route.js';

describe('Milestone M1.8: Favorites & Community Interactions', () => {
  let userA;
  let userB;
  let sessionCookieA;
  let sessionCookieB;
  let publicSkill;
  let privateSkill;

  const userAHandle = `fav-a-${Date.now()}`.slice(0, 20);
  const userBHandle = `fav-b-${Date.now()}`.slice(0, 20);

  const VALID_SKILL_MD = `---
name: sample-agent
description: An agent for inspecting code
---
# Sample Agent
Instructions...
`;

  beforeAll(async () => {
    const { auth } = await import('@/lib/auth/config.js');

    const resA = await auth.api.signUpEmail({
      body: {
        email: `${userAHandle}@skillvault.local`,
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
        email: `${userBHandle}@skillvault.local`,
        password: 'Password123!',
        name: 'User Beta',
        handle: userBHandle,
      },
      asResponse: true,
    });
    sessionCookieB = resB.headers.get('set-cookie').split(';')[0];
    const dataB = await resB.json();
    userB = dataB.user;

    // Create a public skill under userA
    const pubReq = new Request('http://localhost:3000/api/skills', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Cookie: sessionCookieA,
      },
      body: JSON.stringify({
        files: [{ path: 'SKILL.md', content: VALID_SKILL_MD }],
        visibility: 'PUBLIC',
        tags: ['favorite', 'test'],
        message: 'Initial public v1',
      }),
    });
    const pubRes = await createSkillHandler(pubReq);
    expect(pubRes.status).toBe(201);
    const pubData = await pubRes.json();
    publicSkill = pubData.data.skill;

    // Create a private skill under userA
    const privReq = new Request('http://localhost:3000/api/skills', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Cookie: sessionCookieA,
      },
      body: JSON.stringify({
        files: [{ path: 'SKILL.md', content: VALID_SKILL_MD.replace('sample-agent', 'private-agent') }],
        visibility: 'PRIVATE',
        tags: ['internal'],
        message: 'Initial private v1',
      }),
    });
    const privRes = await createSkillHandler(privReq);
    expect(privRes.status).toBe(201);
    const privData = await privRes.json();
    privateSkill = privData.data.skill;
  });

  afterAll(async () => {
    await db.favoriteSkill.deleteMany({
      where: { userId: { in: [userA.id, userB.id] } },
    });
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

  it('rejects favorite toggle without authentication', async () => {
    const req = new Request(`http://localhost:3000/api/skills/${publicSkill.id}/favorite`, {
      method: 'POST',
      headers: {
        Origin: 'http://localhost:3000',
      },
    });
    const res = await favoriteToggleHandler(req, { params: Promise.resolve({ id: publicSkill.id }) });
    expect(res.status).toBe(401);
  });

  it('allows authenticated userB to favorite a public skill', async () => {
    const req = new Request(`http://localhost:3000/api/skills/${publicSkill.id}/favorite`, {
      method: 'POST',
      headers: {
        Origin: 'http://localhost:3000',
        Cookie: sessionCookieB,
      },
    });
    const res = await favoriteToggleHandler(req, { params: Promise.resolve({ id: publicSkill.id }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.favorited).toBe(true);
    expect(json.data.count).toBe(1);
  });

  it('lists favorited skill in userB /api/me/favorites', async () => {
    const req = new Request('http://localhost:3000/api/me/favorites', {
      method: 'GET',
      headers: {
        Cookie: sessionCookieB,
      },
    });
    const res = await getFavoritesHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.skills).toBeDefined();
    expect(json.data.skills.some((s) => s.id === publicSkill.id)).toBe(true);
    expect(json.data.total).toBeGreaterThanOrEqual(1);
  });

  it('toggles favorite off when starred again', async () => {
    const req = new Request(`http://localhost:3000/api/skills/${publicSkill.id}/favorite`, {
      method: 'POST',
      headers: {
        Origin: 'http://localhost:3000',
        Cookie: sessionCookieB,
      },
    });
    const res = await favoriteToggleHandler(req, { params: Promise.resolve({ id: publicSkill.id }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.favorited).toBe(false);
    expect(json.data.count).toBe(0);
  });

  it('rejects favoriting another user private skill', async () => {
    const req = new Request(`http://localhost:3000/api/skills/${privateSkill.id}/favorite`, {
      method: 'POST',
      headers: {
        Origin: 'http://localhost:3000',
        Cookie: sessionCookieB,
      },
    });
    const res = await favoriteToggleHandler(req, { params: Promise.resolve({ id: privateSkill.id }) });
    expect(res.status).toBe(404);
  });
});
