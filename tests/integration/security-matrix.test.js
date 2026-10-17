import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'node:crypto';
import { db } from '@/lib/db.js';
import { storage } from '@/lib/storage/index.js';
import { createSkillWithVersion, softDeleteSkill, manageShareToken } from '@/lib/dal/skills.js';
import { POST as createSkillHandler } from '@/app/api/skills/route.js';
import {
  GET as getSkillHandler,
  PATCH as patchSkillHandler,
  DELETE as deleteSkillHandler,
} from '@/app/api/skills/[id]/route.js';
import { POST as createVersionHandler } from '@/app/api/skills/[id]/versions/route.js';
import { GET as getFileHandler } from '@/app/api/skills/[id]/files/[fileId]/route.js';
import { GET as downloadSkillHandler } from '@/app/api/skills/[id]/download/route.js';
import { POST as forkHandler } from '@/app/api/skills/[id]/fork/route.js';
import {
  POST as enableShareTokenHandler,
  DELETE as disableShareTokenHandler,
} from '@/app/api/skills/[id]/share-token/route.js';
import { GET as getSharedSkillHandler } from '@/app/api/shared/[token]/route.js';
import { POST as importGithubHandler } from '@/app/api/imports/github/route.js';
import { GET as getOwnerSkillsHandler } from '@/app/api/me/skills/route.js';
import { POST as deleteAccountHandler } from '@/app/api/me/delete-account/route.js';
import { GET as catchAllNotFoundHandler } from '@/app/api/[...not_found]/route.js';

describe('Milestone M1.8: Security Hardening & Authorization Matrix Tests', () => {
  let userA, userB;
  let sessionCookieA, sessionCookieB;
  let privateSkillA, publicSkillA, unlistedSkillA, deletedSkillA;
  let unlistedShareToken;
  let privateFileId, publicFileId;

  beforeAll(async () => {
    const { auth } = await import('@/lib/auth/config.js');

    const saltA = crypto.randomBytes(4).toString('hex');
    const resA = await auth.api.signUpEmail({
      body: {
        email: `matrix_user_a_${saltA}@skillvault.local`,
        password: 'Password123!',
        name: `Matrix User A ${saltA}`,
        handle: `matrix_a_${saltA}`,
      },
      asResponse: true,
    });
    sessionCookieA = resA.headers.get('set-cookie').split(';')[0];
    const dataA = await resA.json();
    userA = dataA.user;

    const saltB = crypto.randomBytes(4).toString('hex');
    const resB = await auth.api.signUpEmail({
      body: {
        email: `matrix_user_b_${saltB}@skillvault.local`,
        password: 'Password123!',
        name: `Matrix User B ${saltB}`,
        handle: `matrix_b_${saltB}`,
      },
      asResponse: true,
    });
    sessionCookieB = resB.headers.get('set-cookie').split(';')[0];
    const dataB = await resB.json();
    userB = dataB.user;

    // 1. Create Private Skill for User A
    const fileHashA = crypto.randomBytes(32).toString('hex');
    const fileContentA = Buffer.from('---\nname: Private Security Skill\n---\n# Secret Content');
    await storage.putBlob(fileHashA, fileContentA);

    privateSkillA = await createSkillWithVersion({
      ownerId: userA.id,
      name: 'Private Security Skill',
      description: 'Private skill for authorization testing',
      tags: ['security', 'private'],
      visibility: 'PRIVATE',
      message: 'v1',
      contentHash: crypto.randomBytes(32).toString('hex'),
      files: [
        {
          path: 'SKILL.md',
          size: fileContentA.length,
          isText: true,
          sha256: fileHashA,
          content: fileContentA.toString('utf-8'),
        },
      ],
    });
    const privSkillWithFiles = await db.skill.findUnique({
      where: { id: privateSkillA.id },
      include: { currentVersion: { include: { files: true } } },
    });
    privateFileId = privSkillWithFiles.currentVersion.files[0].id;

    // 2. Create Public Skill for User A
    const fileHashB = crypto.randomBytes(32).toString('hex');
    const fileContentB = Buffer.from('---\nname: Public Security Skill\n---\n# Open Content');
    await storage.putBlob(fileHashB, fileContentB);

    publicSkillA = await createSkillWithVersion({
      ownerId: userA.id,
      name: 'Public Security Skill',
      description: 'Public skill for authorization testing',
      tags: ['security', 'public'],
      visibility: 'PUBLIC',
      message: 'v1',
      contentHash: crypto.randomBytes(32).toString('hex'),
      files: [
        {
          path: 'SKILL.md',
          size: fileContentB.length,
          isText: true,
          sha256: fileHashB,
          content: fileContentB.toString('utf-8'),
        },
      ],
    });
    const pubSkillWithFiles = await db.skill.findUnique({
      where: { id: publicSkillA.id },
      include: { currentVersion: { include: { files: true } } },
    });
    publicFileId = pubSkillWithFiles.currentVersion.files[0].id;

    // 3. Create Unlisted Skill for User A
    unlistedSkillA = await createSkillWithVersion({
      ownerId: userA.id,
      name: 'Unlisted Security Skill',
      description: 'Unlisted skill for authorization testing',
      tags: ['security', 'unlisted'],
      visibility: 'UNLISTED',
      message: 'v1',
      contentHash: crypto.randomBytes(32).toString('hex'),
      files: [
        {
          path: 'SKILL.md',
          size: 100,
          isText: true,
          sha256: crypto.randomBytes(32).toString('hex'),
          content: '---\nname: Unlisted Security Skill\n---\n# Shared Content',
        },
      ],
    });
    const unlistedUpdated = await manageShareToken(userA, unlistedSkillA.id, 'enable');
    unlistedShareToken = unlistedUpdated.shareToken;

    // 4. Create Soft-deleted Skill for User A
    deletedSkillA = await createSkillWithVersion({
      ownerId: userA.id,
      name: 'Deleted Security Skill',
      description: 'Deleted skill for authorization testing',
      tags: ['deleted'],
      visibility: 'PUBLIC',
      message: 'v1',
      contentHash: crypto.randomBytes(32).toString('hex'),
      files: [],
    });
    await softDeleteSkill(userA, deletedSkillA.id);
  });

  describe('1. Unauthenticated Endpoint Guards (Rule R3, S1: Default Deny -> 401)', () => {
    const unauthEndpoints = [
      {
        name: 'POST /api/skills',
        fn: () =>
          createSkillHandler(
            new Request('http://localhost:3000/api/skills', {
              method: 'POST',
              body: JSON.stringify({}),
              headers: { 'content-type': 'application/json' },
            }),
          ),
      },
      {
        name: 'GET /api/me/skills',
        fn: () =>
          getOwnerSkillsHandler(
            new Request('http://localhost:3000/api/me/skills', { method: 'GET' }),
          ),
      },
      {
        name: 'PATCH /api/skills/[id]',
        fn: () =>
          patchSkillHandler(
            new Request('http://localhost:3000/api/skills/123', {
              method: 'PATCH',
              body: JSON.stringify({}),
              headers: { 'content-type': 'application/json' },
            }),
            { params: Promise.resolve({ id: '123' }) },
          ),
      },
      {
        name: 'DELETE /api/skills/[id]',
        fn: () =>
          deleteSkillHandler(
            new Request('http://localhost:3000/api/skills/123', { method: 'DELETE' }),
            { params: Promise.resolve({ id: '123' }) },
          ),
      },
      {
        name: 'POST /api/skills/[id]/versions',
        fn: () =>
          createVersionHandler(
            new Request('http://localhost:3000/api/skills/123/versions', {
              method: 'POST',
              body: JSON.stringify({}),
              headers: { 'content-type': 'application/json' },
            }),
            { params: Promise.resolve({ id: '123' }) },
          ),
      },
      {
        name: 'POST /api/skills/[id]/fork',
        fn: () =>
          forkHandler(
            new Request('http://localhost:3000/api/skills/123/fork', { method: 'POST' }),
            { params: Promise.resolve({ id: '123' }) },
          ),
      },
      {
        name: 'POST /api/skills/[id]/share-token',
        fn: () =>
          enableShareTokenHandler(
            new Request('http://localhost:3000/api/skills/123/share-token', {
              method: 'POST',
              body: JSON.stringify({ action: 'enable' }),
              headers: { 'content-type': 'application/json' },
            }),
            { params: Promise.resolve({ id: '123' }) },
          ),
      },
      {
        name: 'POST /api/imports/github',
        fn: () =>
          importGithubHandler(
            new Request('http://localhost:3000/api/imports/github', {
              method: 'POST',
              body: JSON.stringify({ url: 'https://github.com/a/b' }),
              headers: { 'content-type': 'application/json' },
            }),
          ),
      },
      {
        name: 'POST /api/me/delete-account',
        fn: () =>
          deleteAccountHandler(
            new Request('http://localhost:3000/api/me/delete-account', {
              method: 'POST',
              body: JSON.stringify({ password: 'Password123!' }),
              headers: { 'content-type': 'application/json' },
            }),
          ),
      },
    ];

    for (const ep of unauthEndpoints) {
      it(`${ep.name} returns 401 UNAUTHENTICATED without session`, async () => {
        const res = await ep.fn();
        expect(res.status).toBe(401);
        const json = await res.json();
        expect(json.error).toBeDefined();
        expect(json.error.code).toBe('UNAUTHENTICATED');
        expect(res.headers.get('x-trace-id')).toBeTruthy();
      });
    }
  });

  describe('2. Cross-User Authorization Matrix (Rule S2: IDOR Prevention)', () => {
    describe("User B on User A's PRIVATE skill -> 404 (Hidden existence)", () => {
      it('GET /api/skills/[id] returns 404', async () => {
        const req = new Request(`http://localhost:3000/api/skills/${privateSkillA.id}`, {
          method: 'GET',
          headers: { cookie: sessionCookieB },
        });
        const res = await getSkillHandler(req, {
          params: Promise.resolve({ id: privateSkillA.id }),
        });
        expect(res.status).toBe(404);
        const json = await res.json();
        expect(['NOT_FOUND', 'SKILL_NOT_FOUND']).toContain(json.error.code);
      });

      it('PATCH /api/skills/[id] returns 404', async () => {
        const req = new Request(`http://localhost:3000/api/skills/${privateSkillA.id}`, {
          method: 'PATCH',
          headers: {
            cookie: sessionCookieB,
            'content-type': 'application/json',
            origin: 'http://localhost:3000',
          },
          body: JSON.stringify({ tags: ['hacked'] }),
        });
        const res = await patchSkillHandler(req, {
          params: Promise.resolve({ id: privateSkillA.id }),
        });
        expect(res.status).toBe(404);
      });

      it('DELETE /api/skills/[id] returns 404', async () => {
        const req = new Request(`http://localhost:3000/api/skills/${privateSkillA.id}`, {
          method: 'DELETE',
          headers: { cookie: sessionCookieB, origin: 'http://localhost:3000' },
        });
        const res = await deleteSkillHandler(req, {
          params: Promise.resolve({ id: privateSkillA.id }),
        });
        expect(res.status).toBe(404);
      });

      it('POST /api/skills/[id]/versions returns 404', async () => {
        const req = new Request(`http://localhost:3000/api/skills/${privateSkillA.id}/versions`, {
          method: 'POST',
          headers: {
            cookie: sessionCookieB,
            'content-type': 'application/json',
            origin: 'http://localhost:3000',
          },
          body: JSON.stringify({ message: 'hacked version', files: [] }),
        });
        const res = await createVersionHandler(req, {
          params: Promise.resolve({ id: privateSkillA.id }),
        });
        expect(res.status).toBe(404);
      });

      it('GET /api/skills/[id]/files/[fileId] returns 404', async () => {
        const req = new Request(
          `http://localhost:3000/api/skills/${privateSkillA.id}/files/${privateFileId}`,
          {
            method: 'GET',
            headers: { cookie: sessionCookieB },
          },
        );
        const res = await getFileHandler(req, {
          params: Promise.resolve({ id: privateSkillA.id, fileId: privateFileId }),
        });
        expect(res.status).toBe(404);
      });

      it('GET /api/skills/[id]/download returns 404', async () => {
        const req = new Request(`http://localhost:3000/api/skills/${privateSkillA.id}/download`, {
          method: 'GET',
          headers: { cookie: sessionCookieB },
        });
        const res = await downloadSkillHandler(req, {
          params: Promise.resolve({ id: privateSkillA.id }),
        });
        expect(res.status).toBe(404);
      });

      it('POST /api/skills/[id]/fork returns 404', async () => {
        const req = new Request(`http://localhost:3000/api/skills/${privateSkillA.id}/fork`, {
          method: 'POST',
          headers: { cookie: sessionCookieB, origin: 'http://localhost:3000' },
        });
        const res = await forkHandler(req, { params: Promise.resolve({ id: privateSkillA.id }) });
        expect(res.status).toBe(404);
      });

      it('POST /api/skills/[id]/share-token returns 404', async () => {
        const req = new Request(
          `http://localhost:3000/api/skills/${privateSkillA.id}/share-token`,
          {
            method: 'POST',
            headers: {
              cookie: sessionCookieB,
              'content-type': 'application/json',
              origin: 'http://localhost:3000',
            },
            body: JSON.stringify({ action: 'enable' }),
          },
        );
        const res = await enableShareTokenHandler(req, {
          params: Promise.resolve({ id: privateSkillA.id }),
        });
        expect(res.status).toBe(404);
      });
    });

    describe("User B on User A's PUBLIC skill (Read/Fork OK, Mutation FORBIDDEN -> 403)", () => {
      it('GET /api/skills/[id] returns 200', async () => {
        const req = new Request(`http://localhost:3000/api/skills/${publicSkillA.id}`, {
          method: 'GET',
          headers: { cookie: sessionCookieB },
        });
        const res = await getSkillHandler(req, {
          params: Promise.resolve({ id: publicSkillA.id }),
        });
        expect(res.status).toBe(200);
      });

      it('GET /api/skills/[id]/files/[fileId] returns 200', async () => {
        const req = new Request(
          `http://localhost:3000/api/skills/${publicSkillA.id}/files/${publicFileId}`,
          {
            method: 'GET',
            headers: { cookie: sessionCookieB },
          },
        );
        const res = await getFileHandler(req, {
          params: Promise.resolve({ id: publicSkillA.id, fileId: publicFileId }),
        });
        expect(res.status).toBe(200);
      });

      it('GET /api/skills/[id]/download returns 200', async () => {
        const req = new Request(`http://localhost:3000/api/skills/${publicSkillA.id}/download`, {
          method: 'GET',
          headers: { cookie: sessionCookieB },
        });
        const res = await downloadSkillHandler(req, {
          params: Promise.resolve({ id: publicSkillA.id }),
        });
        expect(res.status).toBe(200);
      });

      it('POST /api/skills/[id]/fork returns 201 (cloning public skill is allowed)', async () => {
        const req = new Request(`http://localhost:3000/api/skills/${publicSkillA.id}/fork`, {
          method: 'POST',
          headers: { cookie: sessionCookieB, origin: 'http://localhost:3000' },
        });
        const res = await forkHandler(req, { params: Promise.resolve({ id: publicSkillA.id }) });
        expect(res.status).toBe(201);
      });

      it("PATCH /api/skills/[id] returns 403 (cannot modify other user's public skill)", async () => {
        const req = new Request(`http://localhost:3000/api/skills/${publicSkillA.id}`, {
          method: 'PATCH',
          headers: {
            cookie: sessionCookieB,
            'content-type': 'application/json',
            origin: 'http://localhost:3000',
          },
          body: JSON.stringify({ tags: ['hacked'] }),
        });
        const res = await patchSkillHandler(req, {
          params: Promise.resolve({ id: publicSkillA.id }),
        });
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.error.code).toBe('FORBIDDEN');
      });

      it("DELETE /api/skills/[id] returns 403 (cannot delete other user's public skill)", async () => {
        const req = new Request(`http://localhost:3000/api/skills/${publicSkillA.id}`, {
          method: 'DELETE',
          headers: { cookie: sessionCookieB, origin: 'http://localhost:3000' },
        });
        const res = await deleteSkillHandler(req, {
          params: Promise.resolve({ id: publicSkillA.id }),
        });
        expect(res.status).toBe(403);
      });

      it("POST /api/skills/[id]/versions returns 403 (cannot create new version on other user's public skill)", async () => {
        const req = new Request(`http://localhost:3000/api/skills/${publicSkillA.id}/versions`, {
          method: 'POST',
          headers: {
            cookie: sessionCookieB,
            'content-type': 'application/json',
            origin: 'http://localhost:3000',
          },
          body: JSON.stringify({ message: 'unauthorized version', files: [] }),
        });
        const res = await createVersionHandler(req, {
          params: Promise.resolve({ id: publicSkillA.id }),
        });
        expect(res.status).toBe(403);
      });

      it("POST /api/skills/[id]/share-token returns 403 (cannot manage share token on other user's public skill)", async () => {
        const req = new Request(`http://localhost:3000/api/skills/${publicSkillA.id}/share-token`, {
          method: 'POST',
          headers: {
            cookie: sessionCookieB,
            'content-type': 'application/json',
            origin: 'http://localhost:3000',
          },
          body: JSON.stringify({ action: 'enable' }),
        });
        const res = await enableShareTokenHandler(req, {
          params: Promise.resolve({ id: publicSkillA.id }),
        });
        expect(res.status).toBe(403);
      });
    });

    describe('UNLISTED and Soft-Deleted Skills Isolation', () => {
      it('User B calling GET /api/skills/[id] on UNLISTED skill returns 404', async () => {
        const req = new Request(`http://localhost:3000/api/skills/${unlistedSkillA.id}`, {
          method: 'GET',
          headers: { cookie: sessionCookieB },
        });
        const res = await getSkillHandler(req, {
          params: Promise.resolve({ id: unlistedSkillA.id }),
        });
        expect(res.status).toBe(404);
      });

      it('Public caller accessing GET /api/shared/[token] with valid token returns 200', async () => {
        const req = new Request(`http://localhost:3000/api/shared/${unlistedShareToken}`, {
          method: 'GET',
        });
        const res = await getSharedSkillHandler(req, {
          params: Promise.resolve({ token: unlistedShareToken }),
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data.skill.id).toBe(unlistedSkillA.id);
      });

      it('Public caller accessing GET /api/shared/[invalid_token] returns 404', async () => {
        const req = new Request('http://localhost:3000/api/shared/invalid-token-12345678', {
          method: 'GET',
        });
        const res = await getSharedSkillHandler(req, {
          params: Promise.resolve({ token: 'invalid-token-12345678' }),
        });
        expect(res.status).toBe(404);
      });

      it('Owner accessing soft-deleted skill returns 404 (deleted skills are invisible in Phase 1)', async () => {
        const req = new Request(`http://localhost:3000/api/skills/${deletedSkillA.id}`, {
          method: 'GET',
          headers: { cookie: sessionCookieA },
        });
        const res = await getSkillHandler(req, {
          params: Promise.resolve({ id: deletedSkillA.id }),
        });
        expect(res.status).toBe(404);
      });
    });
  });

  describe('3. Mass Assignment Defense (Rule R5, S2)', () => {
    it('rejects PATCH /api/skills/[id] with forbidden ownerId', async () => {
      const req = new Request(`http://localhost:3000/api/skills/${publicSkillA.id}`, {
        method: 'PATCH',
        headers: {
          cookie: sessionCookieA,
          'content-type': 'application/json',
          origin: 'http://localhost:3000',
        },
        body: JSON.stringify({ ownerId: userB.id, tags: ['safe'] }),
      });
      const res = await patchSkillHandler(req, {
        params: Promise.resolve({ id: publicSkillA.id }),
      });
      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.error.code).toBe('VALIDATION_FAILED');
    });

    it('rejects PATCH /api/skills/[id] with forbidden deletedAt', async () => {
      const req = new Request(`http://localhost:3000/api/skills/${publicSkillA.id}`, {
        method: 'PATCH',
        headers: {
          cookie: sessionCookieA,
          'content-type': 'application/json',
          origin: 'http://localhost:3000',
        },
        body: JSON.stringify({ deletedAt: new Date().toISOString() }),
      });
      const res = await patchSkillHandler(req, {
        params: Promise.resolve({ id: publicSkillA.id }),
      });
      expect(res.status).toBe(422);
    });

    it('rejects PATCH /api/skills/[id] with forbidden shareToken', async () => {
      const req = new Request(`http://localhost:3000/api/skills/${publicSkillA.id}`, {
        method: 'PATCH',
        headers: {
          cookie: sessionCookieA,
          'content-type': 'application/json',
          origin: 'http://localhost:3000',
        },
        body: JSON.stringify({ shareToken: 'forged_token' }),
      });
      const res = await patchSkillHandler(req, {
        params: Promise.resolve({ id: publicSkillA.id }),
      });
      expect(res.status).toBe(422);
    });
  });

  describe('4. Standard Error Shape & Information Leakage Guards (Rule S3, R7, R8)', () => {
    it('unknown API route returns 404 in standard error shape', async () => {
      const req = new Request('http://localhost:3000/api/non-existent-endpoint-test', {
        method: 'GET',
      });
      const res = await catchAllNotFoundHandler(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBeDefined();
      expect(json.error.code).toBe('ROUTE_NOT_FOUND');
      expect(json.error.traceId).toBeDefined();
      expect(json.error.message).toBeTruthy();
    });

    it('malformed JSON returns 400 INVALID_JSON', async () => {
      const req = new Request(`http://localhost:3000/api/skills/${publicSkillA.id}`, {
        method: 'PATCH',
        headers: {
          cookie: sessionCookieA,
          'content-type': 'application/json',
          origin: 'http://localhost:3000',
        },
        body: '{"invalid json: true',
      });
      const res = await patchSkillHandler(req, {
        params: Promise.resolve({ id: publicSkillA.id }),
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('INVALID_JSON');
    });

    it('CSRF Origin mismatch on mutating requests returns 403', async () => {
      const req = new Request(`http://localhost:3000/api/skills/${publicSkillA.id}`, {
        method: 'PATCH',
        headers: {
          cookie: sessionCookieA,
          'content-type': 'application/json',
          origin: 'https://evil-attacker.com',
        },
        body: JSON.stringify({ tags: ['test'] }),
      });
      const res = await patchSkillHandler(req, {
        params: Promise.resolve({ id: publicSkillA.id }),
      });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.code).toBe('CSRF_ORIGIN_MISMATCH');
    });

    it('error responses contain no stack traces, SQL syntax, or internal file paths', async () => {
      const req = new Request(`http://localhost:3000/api/skills/${publicSkillA.id}`, {
        method: 'PATCH',
        headers: {
          cookie: sessionCookieA,
          'content-type': 'application/json',
          origin: 'http://localhost:3000',
        },
        body: JSON.stringify({ tags: ['a'.repeat(100)] }), // invalid tag length
      });
      const res = await patchSkillHandler(req, {
        params: Promise.resolve({ id: publicSkillA.id }),
      });
      const text = await res.text();
      expect(text).not.toContain('node_modules');
      expect(text).not.toContain('SELECT ');
      expect(text).not.toContain('at Function.');
      expect(text).not.toContain('stack');
    });
  });

  describe('5. Security Headers Assertions (Rule S5, S8)', () => {
    it('file download response includes Content-Security-Policy: sandbox and nosniff', async () => {
      const req = new Request(
        `http://localhost:3000/api/skills/${publicSkillA.id}/files/${publicFileId}?raw=true`,
        {
          method: 'GET',
          headers: { cookie: sessionCookieA },
        },
      );
      const res = await getFileHandler(req, {
        params: Promise.resolve({ id: publicSkillA.id, fileId: publicFileId }),
      });
      expect(res.status).toBe(200);
      expect(res.headers.get('x-content-type-options')).toBe('nosniff');
      expect(res.headers.get('content-security-policy')).toContain('sandbox');
    });

    it('zip download response includes Content-Disposition: attachment and x-trace-id', async () => {
      const req = new Request(`http://localhost:3000/api/skills/${publicSkillA.id}/download`, {
        method: 'GET',
        headers: { cookie: sessionCookieA },
      });
      const res = await downloadSkillHandler(req, {
        params: Promise.resolve({ id: publicSkillA.id }),
      });
      expect(res.status).toBe(200);
      expect(res.headers.get('content-disposition')).toContain('attachment');
      expect(res.headers.get('content-disposition')).toContain('.zip');
      expect(res.headers.get('x-trace-id')).toBeTruthy();
      expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    });
  });
});
