import { describe, it, expect, beforeEach } from 'vitest';
import { ZipArchive } from 'archiver';
import { ingestSkill } from '@/lib/skills/ingest.js';
import { slugify, generateUniqueSlug } from '@/lib/skills/slug.js';
import { storage } from '@/lib/storage/index.js';

// Helper to create in-memory ZIP buffer
function createZipBuffer(entries) {
  return new Promise((resolve, reject) => {
    const zip = new ZipArchive();
    const chunks = [];
    zip.on('data', (c) => chunks.push(c));
    zip.on('end', () => resolve(Buffer.concat(chunks)));
    zip.on('error', reject);

    for (const e of entries) {
      if (e.symlink) {
        zip.symlink(e.name, e.target);
      } else {
        zip.append(e.content, {
          name: e.name,
          mode: e.mode !== undefined ? e.mode : 0o100644,
        });
      }
    }
    zip.finalize();
  });
}

const VALID_SKILL_MD = `---
name: code-reviewer
description: An automated AI agent skill for reviewing pull requests
---
# Code Reviewer
Instructions for the agent...
`;

const VALID_PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
]);

describe('Milestone M1.3: Storage and Ingestion Pipeline', () => {
  it('1. Happy Path: Ingest valid skill ZIP with SKILL.md, script, and image', async () => {
    const zipBuffer = await createZipBuffer([
      { name: 'SKILL.md', content: VALID_SKILL_MD },
      { name: 'scripts/review.py', content: 'print("Reviewing code...")\n' },
      { name: 'assets/logo.png', content: VALID_PNG_BYTES },
    ]);

    const result = await ingestSkill({ zipBuffer, persistBlobs: true });

    expect(result.valid).toBe(true);
    expect(result.skillMd.name).toBe('code-reviewer');
    expect(result.skillMd.description).toBe(
      'An automated AI agent skill for reviewing pull requests',
    );
    expect(result.fileCount).toBe(3);
    expect(result.contentHash).toMatch(/^[0-9a-f]{64}$/);

    // Verify all blobs exist in storage
    for (const file of result.files) {
      const exists = await storage.hasBlob(file.sha256);
      expect(exists).toBe(true);
    }
  });

  it('2. Identical file content is stored deduplicated', async () => {
    const identicalText = 'common shared library content';
    const zipBuffer = await createZipBuffer([
      { name: 'SKILL.md', content: VALID_SKILL_MD },
      { name: 'lib/a.py', content: identicalText },
      { name: 'lib/b.py', content: identicalText },
    ]);

    const result = await ingestSkill({ zipBuffer, persistBlobs: true });
    expect(result.fileCount).toBe(3);

    const aFile = result.files.find((f) => f.path === 'lib/a.py');
    const bFile = result.files.find((f) => f.path === 'lib/b.py');
    expect(aFile.sha256).toBe(bFile.sha256);
  });

  it('3. Strips ONE wrapping top-level folder if all entries share it', async () => {
    const zipBuffer = await createZipBuffer([
      { name: 'my-package/SKILL.md', content: VALID_SKILL_MD },
      { name: 'my-package/reference.txt', content: 'Some documentation' },
    ]);

    const result = await ingestSkill({ zipBuffer, persistBlobs: false });
    const paths = result.files.map((f) => f.path);
    expect(paths).toContain('SKILL.md');
    expect(paths).toContain('reference.txt');
    expect(paths).not.toContain('my-package/SKILL.md');
  });

  it('4. Backslash path normalization', async () => {
    const result = await ingestSkill({
      entries: [
        { rawPath: 'SKILL.md', buffer: Buffer.from(VALID_SKILL_MD) },
        { rawPath: 'docs\\guide\\setup.md', buffer: Buffer.from('# Setup Guide\n') },
      ],
      persistBlobs: false,
    });

    const paths = result.files.map((f) => f.path);
    expect(paths).toContain('docs/guide/setup.md');
    expect(paths).not.toContain('docs\\guide\\setup.md');
  });

  it('5. Adversarial: Path traversal (../) is rejected with PATH_TRAVERSAL_FORBIDDEN', async () => {
    await expect(
      ingestSkill({
        entries: [
          { rawPath: 'SKILL.md', buffer: Buffer.from(VALID_SKILL_MD) },
          { rawPath: 'docs/../../etc/passwd', buffer: Buffer.from('root:x:0:0') },
        ],
        persistBlobs: false,
      }),
    ).rejects.toMatchObject({
      code: 'PATH_TRAVERSAL_FORBIDDEN',
    });
  });

  it('6. Adversarial: Absolute path is rejected with ABSOLUTE_PATH_FORBIDDEN', async () => {
    await expect(
      ingestSkill({
        entries: [
          { rawPath: 'SKILL.md', buffer: Buffer.from(VALID_SKILL_MD) },
          { rawPath: '/var/log/skill.log', buffer: Buffer.from('log data') },
        ],
        persistBlobs: false,
      }),
    ).rejects.toMatchObject({
      code: 'ABSOLUTE_PATH_FORBIDDEN',
    });
  });

  it('7. Adversarial: Drive letters are rejected with ABSOLUTE_PATH_FORBIDDEN', async () => {
    await expect(
      ingestSkill({
        entries: [
          { rawPath: 'SKILL.md', buffer: Buffer.from(VALID_SKILL_MD) },
          { rawPath: 'C:/Windows/System32/cmd.exe', buffer: Buffer.from('data') },
        ],
        persistBlobs: false,
      }),
    ).rejects.toMatchObject({
      code: 'ABSOLUTE_PATH_FORBIDDEN',
    });
  });

  it('8. Adversarial: Empty path segments (//) are rejected with EMPTY_PATH_SEGMENT', async () => {
    await expect(
      ingestSkill({
        entries: [
          { rawPath: 'SKILL.md', buffer: Buffer.from(VALID_SKILL_MD) },
          { rawPath: 'docs//guide.txt', buffer: Buffer.from('guide') },
        ],
        persistBlobs: false,
      }),
    ).rejects.toMatchObject({
      code: 'EMPTY_PATH_SEGMENT',
    });
  });

  it('9. Adversarial: Control / NUL characters in path are rejected with INVALID_PATH_CHARACTERS', async () => {
    await expect(
      ingestSkill({
        entries: [
          { rawPath: 'SKILL.md', buffer: Buffer.from(VALID_SKILL_MD) },
          { rawPath: 'docs/test\x00file.txt', buffer: Buffer.from('hello') },
        ],
        persistBlobs: false,
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_PATH_CHARACTERS',
    });
  });

  it('10. Adversarial: Symlink entry in ZIP is rejected with SYMLINK_OR_DEVICE_FORBIDDEN', async () => {
    const symlinkZip = await createZipBuffer([
      { name: 'SKILL.md', content: VALID_SKILL_MD },
      { name: 'symlink-to-etc', target: '/etc/passwd', symlink: true },
    ]);

    await expect(ingestSkill({ zipBuffer: symlinkZip, persistBlobs: false })).rejects.toMatchObject(
      {
        code: 'SYMLINK_OR_DEVICE_FORBIDDEN',
      },
    );
  });

  it('11. Adversarial: Duplicate entries rejected with DUPLICATE_FILE_PATH', async () => {
    await expect(
      ingestSkill({
        entries: [
          { rawPath: 'SKILL.md', buffer: Buffer.from(VALID_SKILL_MD) },
          { rawPath: 'docs/info.txt', buffer: Buffer.from('content 1') },
          { rawPath: 'docs/info.txt', buffer: Buffer.from('content 2') },
        ],
        persistBlobs: false,
      }),
    ).rejects.toMatchObject({
      code: 'DUPLICATE_FILE_PATH',
    });
  });

  it('12. Adversarial: Case-insensitive collisions rejected with CASE_COLLISION_PATH', async () => {
    await expect(
      ingestSkill({
        entries: [
          { rawPath: 'SKILL.md', buffer: Buffer.from(VALID_SKILL_MD) },
          { rawPath: 'docs/Guide.md', buffer: Buffer.from('# Guide 1') },
          { rawPath: 'docs/guide.md', buffer: Buffer.from('# Guide 2') },
        ],
        persistBlobs: false,
      }),
    ).rejects.toMatchObject({
      code: 'CASE_COLLISION_PATH',
    });
  });

  it('13. Adversarial: Forbidden secret filenames are rejected with FORBIDDEN_SECRET_FILE', async () => {
    const secretFiles = [
      '.env',
      '.env.production',
      '.env.local',
      'id_rsa',
      'id_rsa.pub',
      'server.key',
      'cert.pem',
      'keystore.p12',
      '.npmrc',
      '.netrc',
    ];

    for (const secretFile of secretFiles) {
      await expect(
        ingestSkill({
          entries: [
            { rawPath: 'SKILL.md', buffer: Buffer.from(VALID_SKILL_MD) },
            { rawPath: `secrets/${secretFile}`, buffer: Buffer.from('secret-data') },
          ],
          persistBlobs: false,
        }),
      ).rejects.toMatchObject({
        code: 'FORBIDDEN_SECRET_FILE',
      });
    }

    // .env.example MUST be allowed
    const exampleResult = await ingestSkill({
      entries: [
        { rawPath: 'SKILL.md', buffer: Buffer.from(VALID_SKILL_MD) },
        { rawPath: '.env.example', buffer: Buffer.from('API_KEY=your_key_here\n') },
      ],
      persistBlobs: false,
    });
    expect(exampleResult.valid).toBe(true);
  });

  it('14. Adversarial: Executable and archive extensions are rejected with EXECUTABLE_ARCHIVE_FORBIDDEN', async () => {
    const executables = ['malware.exe', 'lib.dll', 'hack.sh.bin', 'app.apk', 'nested.zip'];

    for (const execFile of executables) {
      await expect(
        ingestSkill({
          entries: [
            { rawPath: 'SKILL.md', buffer: Buffer.from(VALID_SKILL_MD) },
            { rawPath: `bin/${execFile}`, buffer: Buffer.from('executable binary data') },
          ],
          persistBlobs: false,
        }),
      ).rejects.toMatchObject({
        code: 'EXECUTABLE_ARCHIVE_FORBIDDEN',
      });
    }
  });

  it('15. Adversarial: Non-UTF-8 text file is rejected with INVALID_UTF8_ENCODING', async () => {
    const invalidUtf8 = Buffer.from([0xc0, 0xaf, 0xff]); // invalid UTF-8 sequence

    await expect(
      ingestSkill({
        entries: [
          { rawPath: 'SKILL.md', buffer: Buffer.from(VALID_SKILL_MD) },
          { rawPath: 'docs/corrupted.txt', buffer: invalidUtf8 },
        ],
        persistBlobs: false,
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_UTF8_ENCODING',
    });
  });

  it('16. Adversarial: NUL byte in text file is rejected with TEXT_CONTAINS_NUL_BYTE', async () => {
    const textWithNul = Buffer.from('Hello world\x00with null byte');

    await expect(
      ingestSkill({
        entries: [
          { rawPath: 'SKILL.md', buffer: Buffer.from(VALID_SKILL_MD) },
          { rawPath: 'docs/hidden.txt', buffer: textWithNul },
        ],
        persistBlobs: false,
      }),
    ).rejects.toMatchObject({
      code: 'TEXT_CONTAINS_NUL_BYTE',
    });
  });

  it('17. Adversarial: Wrong magic bytes on binary file rejected with INVALID_MAGIC_BYTES', async () => {
    // Declared as .png but contains plain ASCII text
    const fakePng = Buffer.from('This is not a real PNG file!');

    await expect(
      ingestSkill({
        entries: [
          { rawPath: 'SKILL.md', buffer: Buffer.from(VALID_SKILL_MD) },
          { rawPath: 'assets/fake.png', buffer: fakePng },
        ],
        persistBlobs: false,
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_MAGIC_BYTES',
    });
  });

  it('18. Adversarial: Missing SKILL.md is rejected with SKILL_MD_MISSING', async () => {
    await expect(
      ingestSkill({
        entries: [{ rawPath: 'docs/readme.txt', buffer: Buffer.from('No skill md here') }],
        persistBlobs: false,
      }),
    ).rejects.toMatchObject({
      code: 'SKILL_MD_MISSING',
    });
  });

  it('19. Adversarial: Multiple SKILL.md rejected with MULTIPLE_SKILLS_USE_BULK_IMPORT', async () => {
    await expect(
      ingestSkill({
        entries: [
          { rawPath: 'SKILL.md', buffer: Buffer.from(VALID_SKILL_MD) },
          { rawPath: 'sub/SKILL.md', buffer: Buffer.from(VALID_SKILL_MD) },
        ],
        persistBlobs: false,
      }),
    ).rejects.toMatchObject({
      code: 'MULTIPLE_SKILLS_USE_BULK_IMPORT',
    });
  });

  it('20. Adversarial: Invalid YAML in SKILL.md frontmatter rejected with YAML_INVALID', async () => {
    const invalidYaml = `---
name: [unterminated list
description: missing bracket
---
# Body
`;
    await expect(
      ingestSkill({
        entries: [{ rawPath: 'SKILL.md', buffer: Buffer.from(invalidYaml) }],
        persistBlobs: false,
      }),
    ).rejects.toMatchObject({
      code: 'YAML_INVALID',
    });
  });

  it('21. Adversarial: Invalid name in frontmatter rejected with NAME_INVALID', async () => {
    const invalidNameYaml = `---
name: My_Invalid_Skill_Name!
description: A description
---
Body
`;
    await expect(
      ingestSkill({
        entries: [{ rawPath: 'SKILL.md', buffer: Buffer.from(invalidNameYaml) }],
        persistBlobs: false,
      }),
    ).rejects.toMatchObject({
      code: 'NAME_INVALID',
    });
  });

  it('22. Adversarial: Missing description in frontmatter rejected with DESCRIPTION_INVALID', async () => {
    const noDescYaml = `---
name: valid-name
---
Body
`;
    await expect(
      ingestSkill({
        entries: [{ rawPath: 'SKILL.md', buffer: Buffer.from(noDescYaml) }],
        persistBlobs: false,
      }),
    ).rejects.toMatchObject({
      code: 'DESCRIPTION_INVALID',
    });
  });

  it('23. Adversarial: Oversized file rejected with FILE_TOO_LARGE', async () => {
    // 250 KB buffer (> 200 KB limit)
    const largeBuffer = Buffer.alloc(250 * 1024, 0x20);

    await expect(
      ingestSkill({
        entries: [
          { rawPath: 'SKILL.md', buffer: Buffer.from(VALID_SKILL_MD) },
          { rawPath: 'data/big.txt', buffer: largeBuffer },
        ],
        persistBlobs: false,
      }),
    ).rejects.toMatchObject({
      code: 'FILE_TOO_LARGE',
    });
  });

  it('24. Slug generator: strips Vietnamese diacritics and handles collisions', async () => {
    expect(slugify('Trợ Lý Viết Mã')).toBe('tro-ly-viet-ma');
    expect(slugify('Tìm Kiếm & Phân Tích Dữ Liệu')).toBe('tim-kiem-phan-tich-du-lieu');
    expect(slugify('Đặc Biệt & Tiếng Việt')).toBe('dac-biet-tieng-viet');

    // Test collision handling mock
    const existing = new Set(['tro-ly', 'tro-ly-2']);
    const mockDb = {
      skill: {
        findFirst: async ({ where }) => {
          if (existing.has(where.slug)) {
            return { id: 'existing-id' };
          }
          return null;
        },
      },
    };

    const unique = await generateUniqueSlug(mockDb, 'Trợ Lý', 'user-123');
    expect(unique).toBe('tro-ly-3');
  });
});
