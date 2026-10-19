import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'node:crypto';
import { db } from '@/lib/db.js';
import { createSkillWithVersion } from '@/lib/dal/skills.js';
import { GET as byHandleHandler } from '@/app/api/skills/by-handle/[handle]/[slug]/route.js';

describe('By-Handle Route Caching and Headers', () => {
  let user;
  let sessionCookie;
  let publicSkill;
  let privateSkill;

  beforeAll(async () => {
    const { auth } = await import('@/lib/auth/config.js');
    const salt = crypto.randomBytes(4).toString('hex');

    const res = await auth.api.signUpEmail({
      body: {
        email: `byhandle_user_${salt}@skillvault.local`,
        password: 'Password123!',
        name: `ByHandle User ${salt}`,
        handle: `bh_${salt}`,
      },
      asResponse: true,
    });
    sessionCookie = res.headers.get('set-cookie')?.split(';')[0];
    const data = await res.json();
    user = data.user;

    const { storage } = await import('@/lib/storage/index.js');
    const pubFileHash = crypto.randomBytes(32).toString('hex');
    const pubContent = Buffer.from('---\nname: Public Skill\n---\n# Public');
    await storage.putBlob(pubFileHash, pubContent);

    publicSkill = await createSkillWithVersion({
      ownerId: user.id,
      name: 'Public Skill for Header Test',
      description: 'Testing public headers',
      visibility: 'PUBLIC',
      contentHash: crypto.randomBytes(32).toString('hex'),
      files: [
        {
          path: 'SKILL.md',
          size: pubContent.length,
          isText: true,
          sha256: pubFileHash,
          content: pubContent.toString('utf-8'),
        },
      ],
    });

    privateSkill = await createSkillWithVersion({
      ownerId: user.id,
      name: 'Private Skill for Header Test',
      description: 'Testing private headers',
      visibility: 'PRIVATE',
      contentHash: crypto.randomBytes(32).toString('hex'),
      files: [
        {
          path: 'SKILL.md',
          size: 50,
          isText: true,
          sha256: crypto.randomBytes(32).toString('hex'),
          content: '---\nname: Private Skill\n---\n# Private',
        },
      ],
    });
  });

  it('sets public Cache-Control and Vary headers on public skill json manifest', async () => {
    const req = new Request(
      `http://localhost:3000/api/skills/by-handle/@${user.handle}/${publicSkill.slug}?format=json`,
      {
        method: 'GET',
      },
    );
    const res = await byHandleHandler(req, {
      params: Promise.resolve({ handle: `@${user.handle}`, slug: publicSkill.slug }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=60, s-maxage=300');
    expect(res.headers.get('Vary')).toContain('Cookie');
  });

  it('sets public Cache-Control and Vary headers on public skill zip download', async () => {
    const req = new Request(
      `http://localhost:3000/api/skills/by-handle/@${user.handle}/${publicSkill.slug}`,
      {
        method: 'GET',
      },
    );
    const res = await byHandleHandler(req, {
      params: Promise.resolve({ handle: `@${user.handle}`, slug: publicSkill.slug }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=60, s-maxage=300');
    expect(res.headers.get('Vary')).toContain('Cookie');
  });

  it('returns 404 for unauthenticated access to private skill', async () => {
    const req = new Request(
      `http://localhost:3000/api/skills/by-handle/@${user.handle}/${privateSkill.slug}?format=json`,
      {
        method: 'GET',
      },
    );
    const res = await byHandleHandler(req, {
      params: Promise.resolve({ handle: `@${user.handle}`, slug: privateSkill.slug }),
    });

    expect(res.status).toBe(404);
  });

  it('allows authenticated owner to fetch private skill with private Cache-Control headers', async () => {
    const req = new Request(
      `http://localhost:3000/api/skills/by-handle/@${user.handle}/${privateSkill.slug}?format=json`,
      {
        method: 'GET',
        headers: {
          Cookie: sessionCookie,
        },
      },
    );
    const res = await byHandleHandler(req, {
      params: Promise.resolve({ handle: `@${user.handle}`, slug: privateSkill.slug }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('private, no-cache, no-store, must-revalidate');
    expect(res.headers.get('Vary')).toContain('Cookie');
  });
});
