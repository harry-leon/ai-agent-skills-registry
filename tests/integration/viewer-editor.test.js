import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'node:crypto';
import { db } from '@/lib/db.js';
import { GET as downloadHandler } from '@/app/api/skills/[id]/download/route.js';
import { GET as fileHandler } from '@/app/api/skills/[id]/files/[fileId]/route.js';
import {
  POST as versionPostHandler,
  GET as versionGetHandler,
} from '@/app/api/skills/[id]/versions/route.js';
import { createSkillWithVersion, manageShareToken } from '@/lib/dal/skills.js';
import { ingestSkill } from '@/lib/skills/ingest.js';
import { extractZipEntries } from '@/lib/skills/zip.js';
import { computeVersionContentHash } from '@/lib/skills/hash.js';

describe('Milestone M1.5: Viewer, Editor, Download & Versions Tests', () => {
  let userA, userB;
  let sessionCookieA, sessionCookieB;
  let publicSkill, privateSkill, unlistedSkill;
  let unlistedShareToken;

  beforeAll(async () => {
    const { auth } = await import('@/lib/auth/config.js');

    // 1. Sign up two test users to obtain signed session cookies
    const saltA = crypto.randomBytes(4).toString('hex');
    const resA = await auth.api.signUpEmail({
      body: {
        email: `tester_a_${saltA}@skillvault.local`,
        password: 'Password123!',
        name: `Tester A ${saltA}`,
        handle: `usera_${saltA}`,
      },
      asResponse: true,
    });
    sessionCookieA = resA.headers.get('set-cookie').split(';')[0];
    const dataA = await resA.json();
    userA = dataA.user;

    const saltB = crypto.randomBytes(4).toString('hex');
    const resB = await auth.api.signUpEmail({
      body: {
        email: `tester_b_${saltB}@skillvault.local`,
        password: 'Password123!',
        name: `Tester B ${saltB}`,
        handle: `userb_${saltB}`,
      },
      asResponse: true,
    });
    sessionCookieB = resB.headers.get('set-cookie').split(';')[0];
    const dataB = await resB.json();
    userB = dataB.user;

    // 2. Ingest base skill files
    const skillMdContent = `---
name: skill-alpha
description: Original Alpha description
---
# Skill Alpha Documentation
Welcome to alpha.`;

    const pythonScriptContent = `print("hello from alpha")\n`;

    const ingested = await ingestSkill({
      entries: [
        { rawPath: 'SKILL.md', buffer: Buffer.from(skillMdContent, 'utf-8') },
        { rawPath: 'scripts/run.py', buffer: Buffer.from(pythonScriptContent, 'utf-8') },
      ],
      persistBlobs: true,
    });

    // 3. Create Public Skill
    publicSkill = await createSkillWithVersion({
      ownerId: userA.id,
      name: ingested.skillMd.name,
      description: ingested.skillMd.description,
      visibility: 'PUBLIC',
      tags: ['alpha', 'public'],
      files: ingested.files,
      contentHash: ingested.contentHash,
    });

    // 4. Create Private Skill
    privateSkill = await createSkillWithVersion({
      ownerId: userA.id,
      name: 'Private Skill',
      description: 'Private description',
      visibility: 'PRIVATE',
      tags: ['private'],
      files: ingested.files,
      contentHash: ingested.contentHash,
    });

    // 5. Create Unlisted Skill and generate share token
    unlistedSkill = await createSkillWithVersion({
      ownerId: userA.id,
      name: 'Unlisted Skill',
      description: 'Unlisted description',
      visibility: 'UNLISTED',
      tags: ['unlisted'],
      files: ingested.files,
      contentHash: ingested.contentHash,
    });

    const tokenResult = await manageShareToken(userA, unlistedSkill.id, 'enable');
    unlistedShareToken = tokenResult.shareToken;
  });

  describe('1. Streaming ZIP Download (/api/skills/[id]/download)', () => {
    it('Anonymous user can download PUBLIC skill as valid zip with preserved paths', async () => {
      const req = new Request(`http://localhost:3000/api/skills/${publicSkill.id}/download`, {
        method: 'GET',
        headers: { 'x-trace-id': crypto.randomUUID() },
      });

      const res = await downloadHandler(req, { params: { id: publicSkill.id } });
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe('application/zip');
      expect(res.headers.get('content-disposition')).toContain(`${publicSkill.slug}-v1.zip`);

      const zipArrayBuffer = await res.arrayBuffer();
      const zipBuffer = Buffer.from(zipArrayBuffer);
      expect(zipBuffer.length).toBeGreaterThan(0);

      // Verify the downloaded zip can be decompressed and paths are preserved
      const entries = await extractZipEntries(zipBuffer);
      expect(entries.length).toBe(2);

      const paths = entries.map((e) => e.rawPath).sort();
      expect(paths).toEqual(['SKILL.md', 'scripts/run.py']);

      // Acceptance criteria: downloaded zip re-uploads successfully with same contentHash!
      const reIngested = await ingestSkill({
        zipBuffer,
        persistBlobs: false,
      });
      expect(reIngested.valid).toBe(true);
      expect(reIngested.contentHash).toBe(publicSkill.currentVersion.contentHash);
    });

    it('Anonymous user downloading PRIVATE skill returns 404 (IDOR control)', async () => {
      const req = new Request(`http://localhost:3000/api/skills/${privateSkill.id}/download`, {
        method: 'GET',
        headers: { 'x-trace-id': crypto.randomUUID() },
      });

      const res = await downloadHandler(req, { params: { id: privateSkill.id } });
      expect(res.status).toBe(404);
    });

    it('Anonymous user downloading UNLISTED skill without token returns 404', async () => {
      const req = new Request(`http://localhost:3000/api/skills/${unlistedSkill.id}/download`, {
        method: 'GET',
        headers: { 'x-trace-id': crypto.randomUUID() },
      });

      const res = await downloadHandler(req, { params: { id: unlistedSkill.id } });
      expect(res.status).toBe(404);
    });

    it('Anonymous user downloading UNLISTED skill WITH valid share token succeeds', async () => {
      const req = new Request(
        `http://localhost:3000/api/skills/${unlistedSkill.id}/download?token=${unlistedShareToken}`,
        {
          method: 'GET',
          headers: { 'x-trace-id': crypto.randomUUID() },
        },
      );

      const res = await downloadHandler(req, { params: { id: unlistedSkill.id } });
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe('application/zip');
    });
  });

  describe('2. Single File Retrieval (/api/skills/[id]/files/[fileId])', () => {
    it('Returns file metadata and text content for authorized read', async () => {
      const skillFile = publicSkill.currentVersion.files.find((f) => f.path === 'SKILL.md');
      expect(skillFile).toBeDefined();

      const req = new Request(
        `http://localhost:3000/api/skills/${publicSkill.id}/files/${skillFile.id}`,
        {
          method: 'GET',
          headers: { 'x-trace-id': crypto.randomUUID() },
        },
      );

      const res = await fileHandler(req, {
        params: { id: publicSkill.id, fileId: skillFile.id },
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.path).toBe('SKILL.md');
      expect(json.data.isText).toBe(true);
      expect(json.data.content).toContain('name: skill-alpha');
    });

    it('Raw parameter returns streaming binary body with content headers', async () => {
      const skillFile = publicSkill.currentVersion.files.find((f) => f.path === 'scripts/run.py');

      const req = new Request(
        `http://localhost:3000/api/skills/${publicSkill.id}/files/${skillFile.id}?raw=true`,
        {
          method: 'GET',
          headers: { 'x-trace-id': crypto.randomUUID() },
        },
      );

      const res = await fileHandler(req, {
        params: { id: publicSkill.id, fileId: skillFile.id },
      });
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toBe('print("hello from alpha")\n');
    });

    it('Attempting to read file from PRIVATE skill returns 404 for unauthorized user', async () => {
      const privateFile = privateSkill.currentVersion.files[0];

      const req = new Request(
        `http://localhost:3000/api/skills/${privateSkill.id}/files/${privateFile.id}`,
        {
          method: 'GET',
          headers: { 'x-trace-id': crypto.randomUUID() },
        },
      );

      const res = await fileHandler(req, {
        params: { id: privateSkill.id, fileId: privateFile.id },
      });
      expect(res.status).toBe(404);
    });
  });

  describe('3. Version Management (POST /api/skills/[id]/versions)', () => {
    it('Owner can create a new version (v2), incrementing version number and updating metadata', async () => {
      const updatedSkillMd = `---
name: skill-alpha-evolved
description: Updated description for version 2
---
# Skill Alpha v2
Now with more capabilities.`;

      const req = new Request(`http://localhost:3000/api/skills/${publicSkill.id}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-trace-id': crypto.randomUUID(),
          cookie: sessionCookieA,
        },
        body: JSON.stringify({
          message: 'Update documentation to v2',
          files: [
            { path: 'SKILL.md', content: updatedSkillMd },
            { path: 'scripts/run.py', content: 'print("hello from alpha v2")\n' },
            { path: 'notes.txt', content: 'Changelog notes\n' },
          ],
        }),
      });

      const res = await versionPostHandler(req, { params: { id: publicSkill.id } });
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.data.number).toBe(2);
      expect(json.data.message).toBe('Update documentation to v2');
      expect(json.data.files.length).toBe(3);

      // Verify skill record has updated name, description, and currentVersionId
      const refreshedSkill = await db.skill.findUnique({
        where: { id: publicSkill.id },
      });
      expect(refreshedSkill.name).toBe('skill-alpha-evolved');
      expect(refreshedSkill.description).toBe('Updated description for version 2');
      expect(refreshedSkill.currentVersionId).toBe(json.data.id);

      // Acceptance criteria: older version 1 is left completely byte-identical
      const v1Record = await db.skillVersion.findFirst({
        where: { skillId: publicSkill.id, number: 1 },
        include: { files: true },
      });
      expect(v1Record.contentHash).toBe(publicSkill.currentVersion.contentHash);
      expect(v1Record.files.length).toBe(2);
    });

    it('Non-owner cannot create a new version (returns 403 Forbidden)', async () => {
      const req = new Request(`http://localhost:3000/api/skills/${publicSkill.id}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-trace-id': crypto.randomUUID(),
          cookie: sessionCookieB,
        },
        body: JSON.stringify({
          message: 'Malicious update attempt',
          files: [
            { path: 'SKILL.md', content: '---\nname: Hacked\ndescription: Hacked\n---\n# Hacked' },
          ],
        }),
      });

      const res = await versionPostHandler(req, { params: { id: publicSkill.id } });
      expect(res.status).toBe(403);
    });

    it('Editing SKILL.md into invalid frontmatter is blocked with validation report (422)', async () => {
      const invalidFrontmatter = `---
invalid_no_name: True
---
# Invalid Body`;

      const req = new Request(`http://localhost:3000/api/skills/${publicSkill.id}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-trace-id': crypto.randomUUID(),
          cookie: sessionCookieA,
        },
        body: JSON.stringify({
          message: 'Breaking edit',
          files: [{ path: 'SKILL.md', content: invalidFrontmatter }],
        }),
      });

      const res = await versionPostHandler(req, { params: { id: publicSkill.id } });
      expect(res.status).toBe(422);

      const json = await res.json();
      expect(['NAME_INVALID', 'VALIDATION_ERROR']).toContain(json.error.code);
      expect(json.error.message).toMatch(/(frontmatter|name|SKILL\.md)/i);
    });

    it('GET /api/skills/[id]/versions returns chronological version history', async () => {
      const req = new Request(`http://localhost:3000/api/skills/${publicSkill.id}/versions`, {
        method: 'GET',
        headers: { 'x-trace-id': crypto.randomUUID() },
      });

      const res = await versionGetHandler(req, { params: { id: publicSkill.id } });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.length).toBe(2);
      expect(json.data[0].number).toBe(2);
      expect(json.data[1].number).toBe(1);
    });
  });

  afterAll(async () => {
    if (userA && userB) {
      await db.skill.deleteMany({
        where: { ownerId: { in: [userA.id, userB.id] } },
      });
      await db.session.deleteMany({
        where: { userId: { in: [userA.id, userB.id] } },
      });
      await db.user.deleteMany({
        where: { id: { in: [userA.id, userB.id] } },
      });
    }
  });
});
