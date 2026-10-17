import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'node:crypto';
import { db } from '@/lib/db.js';
import { createSkillWithVersion, softDeleteSkill } from '@/lib/dal/skills.js';
import { searchPublicSkills, searchOwnerSkills } from '@/lib/dal/search.js';
import { GET as getPublicSkillsHandler } from '@/app/api/skills/route.js';
import { GET as getOwnerSkillsHandler } from '@/app/api/me/skills/route.js';

describe('Milestone M1.7: Search & Library Integration Tests', () => {
  let userA, userB;
  let sessionCookieA, sessionCookieB;
  let skillA1, skillA2, skillA3, skillB1;

  beforeAll(async () => {
    const { auth } = await import('@/lib/auth/config.js');

    const saltA = crypto.randomBytes(4).toString('hex');
    const resA = await auth.api.signUpEmail({
      body: {
        email: `search_user_a_${saltA}@skillvault.local`,
        password: 'Password123!',
        name: `Search User A ${saltA}`,
        handle: `srch_a_${saltA}`,
      },
      asResponse: true,
    });
    sessionCookieA = resA.headers.get('set-cookie').split(';')[0];
    const dataA = await resA.json();
    userA = dataA.user;

    const saltB = crypto.randomBytes(4).toString('hex');
    const resB = await auth.api.signUpEmail({
      body: {
        email: `search_user_b_${saltB}@skillvault.local`,
        password: 'Password123!',
        name: `Search User B ${saltB}`,
        handle: `srch_b_${saltB}`,
      },
      asResponse: true,
    });
    sessionCookieB = resB.headers.get('set-cookie').split(';')[0];
    const dataB = await resB.json();
    userB = dataB.user;

    // Create test skills for User A
    // 1. Public skill with Vietnamese accents in name and description
    skillA1 = await createSkillWithVersion({
      ownerId: userA.id,
      name: 'Trợ lý Lập trình Tự động',
      description: 'Kỹ năng chuyên gia giúp kiểm thử phần mềm tự động hóa',
      tags: ['programming', 'kiem-thu', 'ai'],
      visibility: 'PUBLIC',
      message: 'Bản phát hành đầu tiên',
      contentHash: crypto.randomBytes(32).toString('hex'),
      files: [
        {
          path: 'SKILL.md',
          size: 150,
          isText: true,
          sha256: crypto.randomBytes(32).toString('hex'),
          content:
            '---\nname: Trợ lý Lập trình Tự động\ndescription: Kỹ năng chuyên gia\n---\n# Hướng dẫn chi tiết\nTìm kiếm và tối ưu hóa mã nguồn hiệu năng cao.',
        },
      ],
    });

    // 2. Unlisted skill for User A
    skillA2 = await createSkillWithVersion({
      ownerId: userA.id,
      name: 'Tài liệu Nội bộ Unlisted',
      description: 'Tài liệu chia sẻ qua liên kết riêng tư',
      tags: ['internal', 'docs'],
      visibility: 'UNLISTED',
      message: 'Initial unlisted',
      contentHash: crypto.randomBytes(32).toString('hex'),
      files: [
        {
          path: 'SKILL.md',
          size: 100,
          isText: true,
          sha256: crypto.randomBytes(32).toString('hex'),
          content: '---\nname: Unlisted Doc\n---\n# Nội dung bí mật',
        },
      ],
    });

    // 3. Private skill for User A
    skillA3 = await createSkillWithVersion({
      ownerId: userA.id,
      name: 'Kỹ năng Tối mật Private',
      description: 'Chỉ có tác giả mới xem được',
      tags: ['security', 'private'],
      visibility: 'PRIVATE',
      message: 'Initial private',
      contentHash: crypto.randomBytes(32).toString('hex'),
      files: [
        {
          path: 'SKILL.md',
          size: 100,
          isText: true,
          sha256: crypto.randomBytes(32).toString('hex'),
          content: '---\nname: Private Skill\n---\n# Dự án tuyệt mật',
        },
      ],
    });

    // 4. Public skill for User B
    skillB1 = await createSkillWithVersion({
      ownerId: userB.id,
      name: 'Công cụ Phân tích Dữ liệu',
      description: 'Phân tích dữ liệu lớn và trích xuất thông tin thông minh',
      tags: ['data', 'analytics'],
      visibility: 'PUBLIC',
      message: 'Initial public',
      contentHash: crypto.randomBytes(32).toString('hex'),
      files: [
        {
          path: 'SKILL.md',
          size: 120,
          isText: true,
          sha256: crypto.randomBytes(32).toString('hex'),
          content: '---\nname: Data Analytics\n---\n# Pipeline xử lý dữ liệu',
        },
      ],
    });
  });

  describe('Accent-Insensitive Full-Text Search', () => {
    it('finds skill with Vietnamese accents when querying without accents ("lap trinh" matches "Lập trình")', async () => {
      const results = await searchPublicSkills({ q: 'lap trinh' });
      const found = results.skills.find((s) => s.id === skillA1.id);
      expect(found).toBeDefined();
      expect(found.name).toBe('Trợ lý Lập trình Tự động');
    });

    it('finds skill when querying unaccented word matching description ("kiem thu" matches "kiểm thử")', async () => {
      const results = await searchPublicSkills({ q: 'kiem thu' });
      const found = results.skills.find((s) => s.id === skillA1.id);
      expect(found).toBeDefined();
    });

    it('finds skill when querying text located inside SKILL.md body text ("toi uu hoa")', async () => {
      const results = await searchPublicSkills({ q: 'toi uu hoa' });
      const found = results.skills.find((s) => s.id === skillA1.id);
      expect(found).toBeDefined();
    });

    it('matches exact Vietnamese query with accents ("Trợ lý")', async () => {
      const results = await searchPublicSkills({ q: 'Trợ lý' });
      const found = results.skills.find((s) => s.id === skillA1.id);
      expect(found).toBeDefined();
    });
  });

  describe('Visibility Isolation (Rule S2 & Security)', () => {
    it('public search never returns UNLISTED or PRIVATE skills', async () => {
      const results = await searchPublicSkills({ limit: 50 });
      const ids = results.skills.map((s) => s.id);
      expect(ids).toContain(skillA1.id);
      expect(ids).toContain(skillB1.id);
      expect(ids).not.toContain(skillA2.id); // UNLISTED
      expect(ids).not.toContain(skillA3.id); // PRIVATE
    });

    it('soft-deleted skills are excluded from searchPublicSkills', async () => {
      const tempSkill = await createSkillWithVersion({
        ownerId: userA.id,
        name: 'Temporary Public Skill',
        description: 'Will be deleted',
        tags: ['temp'],
        visibility: 'PUBLIC',
        message: 'Initial',
        contentHash: crypto.randomBytes(32).toString('hex'),
        files: [],
      });

      // Verify it shows up
      let res = await searchPublicSkills({ q: 'Temporary' });
      expect(res.skills.find((s) => s.id === tempSkill.id)).toBeDefined();

      // Soft delete it
      await softDeleteSkill(userA, tempSkill.id);

      // Verify it is excluded
      res = await searchPublicSkills({ q: 'Temporary' });
      expect(res.skills.find((s) => s.id === tempSkill.id)).toBeUndefined();
    });

    it('searchOwnerSkills returns caller skills across all visibilities but never other users skills', async () => {
      const resultsA = await searchOwnerSkills(userA, { limit: 50 });
      const idsA = resultsA.skills.map((s) => s.id);
      expect(idsA).toContain(skillA1.id); // PUBLIC
      expect(idsA).toContain(skillA2.id); // UNLISTED
      expect(idsA).toContain(skillA3.id); // PRIVATE
      expect(idsA).not.toContain(skillB1.id); // User B's skill

      const resultsB = await searchOwnerSkills(userB, { limit: 50 });
      const idsB = resultsB.skills.map((s) => s.id);
      expect(idsB).toContain(skillB1.id);
      expect(idsB).not.toContain(skillA1.id);
      expect(idsB).not.toContain(skillA2.id);
      expect(idsB).not.toContain(skillA3.id);
    });
  });

  describe('Tag and Visibility Filtering', () => {
    it('filters public skills by tag', async () => {
      const res = await searchPublicSkills({ tag: 'data' });
      const ids = res.skills.map((s) => s.id);
      expect(ids).toContain(skillB1.id);
      expect(ids).not.toContain(skillA1.id);
    });

    it('filters owner skills by visibility', async () => {
      const resPrivate = await searchOwnerSkills(userA, { visibility: 'PRIVATE' });
      expect(resPrivate.skills.every((s) => s.visibility === 'PRIVATE')).toBe(true);
      expect(resPrivate.skills.map((s) => s.id)).toContain(skillA3.id);
      expect(resPrivate.skills.map((s) => s.id)).not.toContain(skillA1.id);

      const resUnlisted = await searchOwnerSkills(userA, { visibility: 'UNLISTED' });
      expect(resUnlisted.skills.every((s) => s.visibility === 'UNLISTED')).toBe(true);
      expect(resUnlisted.skills.map((s) => s.id)).toContain(skillA2.id);
    });
  });

  describe('Sorting and Pagination', () => {
    it('sorts by name asc and desc', async () => {
      const asc = await searchPublicSkills({ sort: 'name', order: 'asc', limit: 50 });
      for (let i = 0; i < asc.skills.length - 1; i++) {
        expect(asc.skills[i].name.localeCompare(asc.skills[i + 1].name)).toBeLessThanOrEqual(0);
      }

      const desc = await searchPublicSkills({ sort: 'name', order: 'desc', limit: 50 });
      for (let i = 0; i < desc.skills.length - 1; i++) {
        expect(desc.skills[i].name.localeCompare(desc.skills[i + 1].name)).toBeGreaterThanOrEqual(
          0,
        );
      }
    });

    it('supports keyset cursor pagination cleanly', async () => {
      const page1 = await searchPublicSkills({ limit: 1 });
      expect(page1.skills.length).toBe(1);
      expect(page1.nextCursor).toBeDefined();

      const page2 = await searchPublicSkills({ limit: 1, cursor: page1.nextCursor });
      expect(page2.skills.length).toBe(1);
      expect(page2.skills[0].id).not.toBe(page1.skills[0].id);
    });
  });

  describe('SQL Injection Safety', () => {
    it('safely handles injection payloads in search query', async () => {
      const maliciousQueries = [
        "' OR 1=1; --",
        '\'; DROP TABLE "Skill"; --',
        '\\" OR 1=1 --',
        '"><script>alert(1)</script>',
        '*()&|!~',
        'AND 1=1 UNION SELECT * FROM "User"',
      ];

      for (const q of maliciousQueries) {
        const res = await searchPublicSkills({ q });
        expect(Array.isArray(res.skills)).toBe(true);
        expect(typeof res.total).toBe('number');
      }

      // Verify Skill table still exists and data is intact
      const count = await db.skill.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('Route Handlers (HTTP API)', () => {
    it('GET /api/skills serves public search results without authentication', async () => {
      const req = new Request('http://localhost:3000/api/skills?q=lap+trinh', {
        method: 'GET',
      });
      const res = await getPublicSkillsHandler(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toBeDefined();
      expect(body.data.skills).toBeDefined();
      expect(body.data.skills.find((s) => s.id === skillA1.id)).toBeDefined();
    });

    it('GET /api/me/skills returns 401 for unauthenticated requests', async () => {
      const req = new Request('http://localhost:3000/api/me/skills', {
        method: 'GET',
      });
      const res = await getOwnerSkillsHandler(req);
      expect(res.status).toBe(401);
    });

    it('GET /api/me/skills returns caller skills when authenticated', async () => {
      const req = new Request('http://localhost:3000/api/me/skills?visibility=PRIVATE', {
        method: 'GET',
        headers: {
          cookie: sessionCookieA,
        },
      });
      const res = await getOwnerSkillsHandler(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toBeDefined();
      expect(body.data.skills).toBeDefined();
      expect(body.data.skills.map((s) => s.id)).toContain(skillA3.id);
      expect(body.data.skills.map((s) => s.id)).not.toContain(skillB1.id);
    });
  });
});
