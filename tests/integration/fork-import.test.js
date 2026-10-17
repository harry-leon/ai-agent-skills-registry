import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import crypto from 'node:crypto';
import { ZipArchive } from 'archiver';
import { db } from '@/lib/db.js';
import { parseGitHubUrl, fetchAndIngestGitHubRepo } from '@/lib/skills/github.js';
import { POST as forkHandler } from '@/app/api/skills/[id]/fork/route.js';
import { POST as importGithubHandler } from '@/app/api/imports/github/route.js';
import { POST as createVersionHandler } from '@/app/api/skills/[id]/versions/route.js';
import { createSkillWithVersion, manageShareToken, softDeleteSkill } from '@/lib/dal/skills.js';
import { ingestSkill } from '@/lib/skills/ingest.js';
import { env } from '@/lib/env.js';

// Helper to create mock in-memory GitHub zipball
async function createMockGitHubZip({ topFolder = 'testowner-testrepo-7fd1a60', files = [] }) {
  const zip = new ZipArchive('zip', { zlib: { level: 9 } });
  const chunks = [];
  zip.on('data', (c) => chunks.push(c));
  for (const f of files) {
    zip.append(f.content, { name: `${topFolder}/${f.path}` });
  }
  zip.finalize();
  await new Promise((resolve, reject) => {
    zip.on('end', resolve);
    zip.on('error', reject);
  });
  return Buffer.concat(chunks);
}

describe('Milestone M1.6: Fork and GitHub Import Integration Tests', () => {
  let userA, userB;
  let sessionCookieA, sessionCookieB;
  let publicSkill, privateSkill, unlistedSkill;
  let unlistedShareToken;

  beforeAll(async () => {
    const { auth } = await import('@/lib/auth/config.js');

    // 1. Create two test users
    const saltA = crypto.randomBytes(4).toString('hex');
    const resA = await auth.api.signUpEmail({
      body: {
        email: `tester_fork_a_${saltA}@skillvault.local`,
        password: 'Password123!',
        name: `Tester Fork A ${saltA}`,
        handle: `user_fork_a_${saltA}`,
      },
      asResponse: true,
    });
    sessionCookieA = resA.headers.get('set-cookie').split(';')[0];
    const dataA = await resA.json();
    userA = dataA.user;

    const saltB = crypto.randomBytes(4).toString('hex');
    const resB = await auth.api.signUpEmail({
      body: {
        email: `tester_fork_b_${saltB}@skillvault.local`,
        password: 'Password123!',
        name: `Tester Fork B ${saltB}`,
        handle: `user_fork_b_${saltB}`,
      },
      asResponse: true,
    });
    sessionCookieB = resB.headers.get('set-cookie').split(';')[0];
    const dataB = await resB.json();
    userB = dataB.user;

    // 2. Ingest base skill files
    const skillMdContent = `---
name: forkable-skill
description: Original forkable description
---
# Original Forkable Skill
Welcome to forkable skill.`;

    const pythonContent = `print("hello from original")\n`;

    const ingested = await ingestSkill({
      entries: [
        { rawPath: 'SKILL.md', buffer: Buffer.from(skillMdContent, 'utf-8') },
        { rawPath: 'scripts/worker.py', buffer: Buffer.from(pythonContent, 'utf-8') },
      ],
      persistBlobs: true,
    });

    // 3. Create Public, Private, and Unlisted Skills for User A
    publicSkill = await createSkillWithVersion({
      ownerId: userA.id,
      name: ingested.skillMd.name,
      description: ingested.skillMd.description,
      visibility: 'PUBLIC',
      tags: ['forkable', 'public'],
      files: ingested.files,
      contentHash: ingested.contentHash,
    });

    privateSkill = await createSkillWithVersion({
      ownerId: userA.id,
      name: 'Private Fork Target',
      description: 'Private fork target description',
      visibility: 'PRIVATE',
      tags: ['private'],
      files: ingested.files,
      contentHash: ingested.contentHash,
    });

    unlistedSkill = await createSkillWithVersion({
      ownerId: userA.id,
      name: 'Unlisted Fork Target',
      description: 'Unlisted fork target description',
      visibility: 'UNLISTED',
      tags: ['unlisted'],
      files: ingested.files,
      contentHash: ingested.contentHash,
    });

    const shareTokenResult = await manageShareToken(userA, unlistedSkill.id, 'enable');
    unlistedShareToken = shareTokenResult.shareToken;
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

  describe('1. SSRF and GitHub URL Validation Matrix (S7 & Section 9.5)', () => {
    it('accepts valid https://github.com/{owner}/{repo}', () => {
      const res = parseGitHubUrl('https://github.com/octocat/Hello-World');
      expect(res.owner).toBe('octocat');
      expect(res.repo).toBe('Hello-World');
      expect(res.ref).toBeNull();
      expect(res.subpath).toBe('');
    });

    it('accepts valid https://github.com/{owner}/{repo}/tree/{ref}', () => {
      const res = parseGitHubUrl('https://github.com/octocat/Hello-World/tree/main');
      expect(res.owner).toBe('octocat');
      expect(res.repo).toBe('Hello-World');
      expect(res.ref).toBe('main');
      expect(res.subpath).toBe('');
    });

    it('accepts valid https://github.com/{owner}/{repo}/tree/{ref}/{subpath}', () => {
      const res = parseGitHubUrl('https://github.com/octocat/Hello-World/tree/v1.2.0/skills/agent');
      expect(res.owner).toBe('octocat');
      expect(res.repo).toBe('Hello-World');
      expect(res.ref).toBe('v1.2.0');
      expect(res.subpath).toBe('skills/agent');
    });

    it('rejects plain HTTP protocol (http://)', () => {
      expect(() => parseGitHubUrl('http://github.com/octocat/Hello-World')).toThrowError();
    });

    it('rejects domain spoofing (github.com.evil.com)', () => {
      expect(() =>
        parseGitHubUrl('https://github.com.evil.com/octocat/Hello-World'),
      ).toThrowError();
    });

    it('rejects other hosts (gitlab.com)', () => {
      expect(() => parseGitHubUrl('https://gitlab.com/octocat/Hello-World')).toThrowError();
    });

    it('rejects username/password in URL (https://user:pass@github.com/...)', () => {
      expect(() =>
        parseGitHubUrl('https://user:pass@github.com/octocat/Hello-World'),
      ).toThrowError();
    });

    it('rejects non-standard ports (8443)', () => {
      expect(() => parseGitHubUrl('https://github.com:8443/octocat/Hello-World')).toThrowError();
    });

    it('rejects internal IP addresses (127.0.0.1, 169.254.169.254)', () => {
      expect(() => parseGitHubUrl('https://127.0.0.1/octocat/Hello-World')).toThrowError();
    });

    it('rejects branch refs containing slashes (/) with helpful message', () => {
      expect(() =>
        parseGitHubUrl('https://github.com/octocat/Hello-World/tree/feature%2Ftest'),
      ).toThrowError(/dấu gạch chéo/);
    });

    it('rejects path traversal (..) in subpath', () => {
      expect(() =>
        parseGitHubUrl('https://github.com/octocat/Hello-World/tree/main/../secret'),
      ).toThrowError();
    });

    it('rejects non-tree paths like /blob/main/SKILL.md', () => {
      expect(() =>
        parseGitHubUrl('https://github.com/octocat/Hello-World/blob/main/SKILL.md'),
      ).toThrowError();
    });
  });

  describe('2. GitHub Fetch Hardening (SSRF, Redirects, Byte Limits)', () => {
    it('aborts redirect to untrusted host (SSRF_ATTEMPT_BLOCKED)', async () => {
      const mockFetch = async (url) => {
        if (url === 'https://api.github.com/repos/test/repo') {
          return new Response(JSON.stringify({ default_branch: 'main', private: false }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (url.includes('/zipball/')) {
          // Redirect to evil.com
          return new Response(null, {
            status: 302,
            headers: { Location: 'https://evil.com/malicious.zip' },
          });
        }
        return new Response('ok', { status: 200 });
      };

      await expect(
        fetchAndIngestGitHubRepo({
          url: 'https://github.com/test/repo',
          fetchFn: mockFetch,
        }),
      ).rejects.toThrowError(/máy chủ không được phép/);
    });

    it('never forwards GITHUB_TOKEN to codeload.github.com', async () => {
      let codeloadReceivedAuth = false;

      const mockZip = await createMockGitHubZip({
        files: [
          {
            path: 'SKILL.md',
            content: '---\nname: valid-skill\ndescription: valid skill\n---\n# Valid',
          },
        ],
      });

      const mockFetch = async (url, options = {}) => {
        if (url === 'https://api.github.com/repos/test/repo') {
          return new Response(JSON.stringify({ default_branch: 'main', private: false }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (url.includes('api.github.com/repos/test/repo/zipball')) {
          return new Response(null, {
            status: 302,
            headers: { Location: 'https://codeload.github.com/test/repo/legacy.zip/main' },
          });
        }
        if (url.includes('codeload.github.com')) {
          if (options.headers?.Authorization) {
            codeloadReceivedAuth = true;
          }
          return new Response(mockZip, {
            status: 200,
            headers: { 'Content-Type': 'application/zip' },
          });
        }
        return new Response('Not found', { status: 404 });
      };

      await fetchAndIngestGitHubRepo({
        url: 'https://github.com/test/repo',
        fetchFn: mockFetch,
      });

      expect(codeloadReceivedAuth).toBe(false);
    });

    it('rejects private GitHub repository with friendly 403 error', async () => {
      const mockFetch = async () => {
        return new Response(JSON.stringify({ default_branch: 'main', private: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      await expect(
        fetchAndIngestGitHubRepo({
          url: 'https://github.com/test/private-repo',
          fetchFn: mockFetch,
        }),
      ).rejects.toThrowError(/chế độ riêng tư/);
    });

    it('handles non-existent GitHub repository (404) gracefully', async () => {
      const mockFetch = async () => {
        return new Response(JSON.stringify({ message: 'Not Found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      await expect(
        fetchAndIngestGitHubRepo({
          url: 'https://github.com/test/missing-repo',
          fetchFn: mockFetch,
        }),
      ).rejects.toThrowError(/không tồn tại/);
    });
  });

  describe('3. POST /api/imports/github Handler', () => {
    it('successfully imports a GitHub repository with SKILL.md at root', async () => {
      const mockZip = await createMockGitHubZip({
        topFolder: 'testowner-agent-repo-9a1b2c3',
        files: [
          {
            path: 'SKILL.md',
            content:
              '---\nname: imported-skill\ndescription: Skill imported directly from GitHub\n---\n# Readme',
          },
          {
            path: 'scripts/run.py',
            content: 'print("imported from github")',
          },
        ],
      });

      // Override global fetch during this test invocation
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url) => {
        if (url === 'https://api.github.com/repos/testowner/agent-repo') {
          return new Response(JSON.stringify({ default_branch: 'main', private: false }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (url.includes('/zipball/')) {
          return new Response(null, {
            status: 302,
            headers: {
              Location: 'https://codeload.github.com/testowner/agent-repo/legacy.zip/main',
            },
          });
        }
        if (url.includes('codeload.github.com')) {
          return new Response(mockZip, {
            status: 200,
            headers: { 'Content-Type': 'application/zip' },
          });
        }
        return new Response('Not found', { status: 404 });
      };

      try {
        const req = new Request('http://localhost:3000/api/imports/github', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: sessionCookieA,
            Origin: 'http://localhost:3000',
          },
          body: JSON.stringify({
            url: 'https://github.com/testowner/agent-repo',
            tags: ['github', 'agent'],
            visibility: 'PUBLIC',
          }),
        });

        const res = await importGithubHandler(req);
        expect(res.status).toBe(201);

        const json = await res.json();
        expect(json.data.skill.name).toBe('imported-skill');
        expect(json.data.skill.sourceUrl).toBe('https://github.com/testowner/agent-repo');
        expect(json.data.skill.sourceCommit).toBe('9a1b2c3');
        expect(json.data.skill.visibility).toBe('PUBLIC');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('rejects mass assignment when ownerId is submitted in import body', async () => {
      const req = new Request('http://localhost:3000/api/imports/github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookieA,
          Origin: 'http://localhost:3000',
        },
        body: JSON.stringify({
          url: 'https://github.com/testowner/agent-repo',
          ownerId: userB.id,
        }),
      });

      const res = await importGithubHandler(req);
      expect(res.status).toBe(422);
    });
  });

  describe('4. POST /api/skills/[id]/fork Pipeline & Matrix', () => {
    let forkedSkillByB;

    it('User B forks User A PUBLIC skill -> 201 Created with private fork and zero blob duplication', async () => {
      const req = new Request(`http://localhost:3000/api/skills/${publicSkill.id}/fork`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookieB,
          Origin: 'http://localhost:3000',
        },
      });

      const res = await forkHandler(req, { params: Promise.resolve({ id: publicSkill.id }) });
      expect(res.status).toBe(201);

      const json = await res.json();
      forkedSkillByB = json.data.skill;

      // Ownership and visibility
      expect(forkedSkillByB.ownerId).toBe(userB.id);
      expect(forkedSkillByB.visibility).toBe('PRIVATE');

      // Attribution
      expect(forkedSkillByB.forkedFromId).toBe(publicSkill.id);
      expect(forkedSkillByB.forkedFromVersionId).toBe(publicSkill.currentVersionId);
      expect(forkedSkillByB.forkedFromSnapshot).toEqual({
        ownerHandle: userA.handle,
        slug: publicSkill.slug,
        name: publicSkill.name,
        versionNumber: 1,
      });

      // Verify Blob deduplication: SkillFiles point to exact same blobSha256
      const originalFiles = await db.skillFile.findMany({
        where: { versionId: publicSkill.currentVersionId },
      });
      const forkedFiles = await db.skillFile.findMany({
        where: { versionId: forkedSkillByB.currentVersionId },
      });

      expect(forkedFiles.length).toBe(originalFiles.length);
      for (const origFile of originalFiles) {
        const matchingForkFile = forkedFiles.find((f) => f.path === origFile.path);
        expect(matchingForkFile).toBeDefined();
        expect(matchingForkFile.blobSha256).toBe(origFile.blobSha256);
      }
    });

    it('User B cannot fork User A PRIVATE skill -> 404 (IDOR protection)', async () => {
      const req = new Request(`http://localhost:3000/api/skills/${privateSkill.id}/fork`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookieB,
          Origin: 'http://localhost:3000',
        },
      });

      const res = await forkHandler(req, { params: Promise.resolve({ id: privateSkill.id }) });
      expect(res.status).toBe(404);
    });

    it('User B cannot fork User A UNLISTED skill without shareToken -> 404', async () => {
      const req = new Request(`http://localhost:3000/api/skills/${unlistedSkill.id}/fork`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookieB,
          Origin: 'http://localhost:3000',
        },
      });

      const res = await forkHandler(req, { params: Promise.resolve({ id: unlistedSkill.id }) });
      expect(res.status).toBe(404);
    });

    it('User B can fork User A UNLISTED skill with valid shareToken -> 201 Created', async () => {
      const req = new Request(`http://localhost:3000/api/skills/${unlistedSkill.id}/fork`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookieB,
          Origin: 'http://localhost:3000',
        },
        body: JSON.stringify({
          shareToken: unlistedShareToken,
        }),
      });

      const res = await forkHandler(req, { params: Promise.resolve({ id: unlistedSkill.id }) });
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.data.skill.ownerId).toBe(userB.id);
      expect(json.data.skill.forkedFromId).toBe(unlistedSkill.id);
    });

    it('Owner (User A) can fork their own skill and receives unique slug suffix', async () => {
      const req = new Request(`http://localhost:3000/api/skills/${publicSkill.id}/fork`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookieA,
          Origin: 'http://localhost:3000',
        },
      });

      const res = await forkHandler(req, { params: Promise.resolve({ id: publicSkill.id }) });
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.data.skill.ownerId).toBe(userA.id);
      // Because User A already has publicSkill with slug 'forkable-skill', new slug must have suffix
      expect(json.data.skill.slug).toBe('forkable-skill-2');
    });

    it('Unauthenticated user cannot fork -> 401', async () => {
      const req = new Request(`http://localhost:3000/api/skills/${publicSkill.id}/fork`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000',
        },
      });

      const res = await forkHandler(req, { params: Promise.resolve({ id: publicSkill.id }) });
      expect(res.status).toBe(401);
    });

    it('Reject mass assignment when ownerId is passed in fork body -> 422', async () => {
      const req = new Request(`http://localhost:3000/api/skills/${publicSkill.id}/fork`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookieB,
          Origin: 'http://localhost:3000',
        },
        body: JSON.stringify({
          ownerId: userA.id,
        }),
      });

      const res = await forkHandler(req, { params: Promise.resolve({ id: publicSkill.id }) });
      expect(res.status).toBe(422);
    });
  });

  describe('5. Fork Independence & Source Deletion', () => {
    it('editing a fork creates a new version on the fork and leaves the original skill untouched', async () => {
      // 1. User B forks publicSkill
      const forkReq = new Request(`http://localhost:3000/api/skills/${publicSkill.id}/fork`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookieB,
          Origin: 'http://localhost:3000',
        },
      });
      const forkRes = await forkHandler(forkReq, {
        params: Promise.resolve({ id: publicSkill.id }),
      });
      const forkJson = await forkRes.json();
      const fork = forkJson.data.skill;

      // 2. User B edits the fork by adding a new version
      const newSkillMdContent = `---
name: mutated-fork-name
description: Mutated description on fork
---
# Mutated Fork
This fork has diverged.`;

      const editReq = new Request(`http://localhost:3000/api/skills/${fork.id}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookieB,
          Origin: 'http://localhost:3000',
        },
        body: JSON.stringify({
          message: 'Divergent edit on fork',
          files: [
            { path: 'SKILL.md', content: newSkillMdContent },
            { path: 'scripts/worker.py', content: 'print("divergent fork")\n' },
          ],
        }),
      });

      const editRes = await createVersionHandler(editReq, {
        params: Promise.resolve({ id: fork.id }),
      });
      expect(editRes.status).toBe(201);
      const editJson = await editRes.json();
      expect(editJson.data.number).toBe(2);

      // 3. Verify original skill (publicSkill) is completely untouched
      const originalAfter = await db.skill.findUnique({
        where: { id: publicSkill.id },
        include: { currentVersion: true },
      });

      expect(originalAfter.currentVersion.number).toBe(1);
      expect(originalAfter.name).toBe('forkable-skill');
      expect(originalAfter.description).toBe('Original forkable description');
    });

    it('soft-deleting source skill retains the fork and preserves the attribution snapshot', async () => {
      // 1. Create a temporary skill to be deleted
      const tempSkill = await createSkillWithVersion({
        ownerId: userA.id,
        name: 'Ephemeral Source',
        description: 'Ephemeral description',
        visibility: 'PUBLIC',
        files: [
          {
            path: 'SKILL.md',
            content: '---\nname: ephemeral\ndescription: ephemeral\n---\n# Ephemeral',
            size: 50,
            sha256: crypto.createHash('sha256').update('ephemeral').digest('hex'),
            isText: true,
          },
        ],
        contentHash: crypto.createHash('sha256').update('hash').digest('hex'),
      });

      // 2. User B forks tempSkill
      const forkReq = new Request(`http://localhost:3000/api/skills/${tempSkill.id}/fork`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookieB,
          Origin: 'http://localhost:3000',
        },
      });
      const forkRes = await forkHandler(forkReq, {
        params: Promise.resolve({ id: tempSkill.id }),
      });
      const forkJson = await forkRes.json();
      const fork = forkJson.data.skill;

      // 3. User A soft-deletes the source skill
      await softDeleteSkill(userA, tempSkill.id);

      // 4. Verify fork is still valid and readable
      const forkRecord = await db.skill.findUnique({
        where: { id: fork.id },
      });

      expect(forkRecord).toBeDefined();
      expect(forkRecord.deletedAt).toBeNull();
      // forkedFromSnapshot remains completely intact!
      expect(forkRecord.forkedFromSnapshot).toEqual({
        ownerHandle: userA.handle,
        slug: tempSkill.slug,
        name: tempSkill.name,
        versionNumber: 1,
      });
    });
  });
});
