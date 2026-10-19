import { PrismaClient } from '@prisma/client';
import crypto from 'node:crypto';
import { storage } from '../lib/storage/index.js';

const prisma = new PrismaClient();

function calculateSha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function calculateDirContentHash(files) {
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));
  const hasher = crypto.createHash('sha256');
  for (const f of sorted) {
    hasher.update(`${f.path}:${f.sha256}\n`);
  }
  return hasher.digest('hex');
}

const OFFICIAL_SKILLS = [
  {
    name: 'code-reviewer',
    slug: 'code-reviewer',
    description:
      'Autonomous peer code reviewer assessing architecture, security red flags, performance bottlenecks, and idiomatic maintainability.',
    tags: ['code-review', 'quality', 'architecture', 'best-practices'],
    files: [
      {
        path: 'SKILL.md',
        content: `---
name: code-reviewer
description: "Autonomous peer code reviewer assessing architecture, security red flags, performance bottlenecks, and idiomatic maintainability."
---

# Code Reviewer Skill for AI Agents

## Overview
This skill instructs autonomous AI coding agents to perform comprehensive, constructive, and highly technical peer code reviews on incoming pull requests or modified files.

## Review Pillars
1. **Correctness & Edge Cases**:
   - Verify null/undefined checks, boundary conditions, race conditions, and error propagation.
2. **Security & Data Integrity**:
   - Check for SQL injection, cross-site scripting (XSS), path traversal, IDOR, SSRF, and unvetted regex execution.
3. **Architecture & Idiomatic Design**:
   - Single responsibility principle (SRP), dependency inversion, repository-first abstractions, and cohesive layer boundaries.
4. **Performance & Scalability**:
   - Avoid N+1 queries, unindexed filter conditions, blocking I/O on event loops, and excessive memory allocations.

## Output Format
Every review must be structured with:
- **Summary**: High-level verdict (Approve / Request Changes / Comment).
- **Critical Findings**: Security vulnerabilities or bugs breaking functionality.
- **Nitpicks & Suggestions**: Idiomatic improvements or micro-optimizations.
- **Example Diffs**: Concrete code snippets showing how to implement the suggested fix.
`,
      },
      {
        path: 'references/review-checklist.md',
        content: `# Code Review Checklist

- [ ] Does every external input have strict schema validation (Zod, Pydantic, etc.)?
- [ ] Are database transactions scoped appropriately with sensible timeouts?
- [ ] Are async operations handled with adequate error boundaries?
- [ ] Is sensitive telemetry scrubbed of PII and authorization credentials?
`,
      },
    ],
  },
  {
    name: 'security-auditor',
    slug: 'security-auditor',
    description:
      'Deep security analysis agent auditing codebases against OWASP Top 10 vulnerabilities, secret leakage, and privilege escalation.',
    tags: ['security', 'owasp', 'audit', 'vulnerability', 'devsecops'],
    files: [
      {
        path: 'SKILL.md',
        content: `---
name: security-auditor
description: "Deep security analysis agent auditing codebases against OWASP Top 10 vulnerabilities, secret leakage, and privilege escalation."
---

# Security Auditor Skill

## Target Vulnerability Classes
- **A01: Broken Access Control**: Verify IDOR protections, horizontal privilege escalation, and route policy enforcements.
- **A02: Cryptographic Failures**: Audit hashing algorithms (prefer Argon2id, bcrypt, scrypt), TLS enforcement, and secure token generation.
- **A03: Injection**: Inspect SQL, NoSQL, OS Command, and LDAP queries for unparameterized inputs.
- **A04: Insecure Design**: Check defense-in-depth principles, rate limiting thresholds, and fail-safe defaults.
- **A05: Security Misconfiguration**: Check CORS origins, CSP headers, default credentials, and debug modes.

## Audit Workflow
1. Enumerate all attack surfaces (HTTP endpoints, WebSocket channels, file upload parsers).
2. Trace untrusted data sources to execution sinks.
3. Verify sanitation, authorization, and rate limiting layers.
4. Report CVSS vector and mitigation steps.
`,
      },
      {
        path: 'rules/owasp-top10.md',
        content: `# OWASP Top 10 Reference

1. Broken Access Control (Rule R4)
2. Cryptographic Failures (Rule S1)
3. Injection (Rule R5)
4. Insecure Design (Rule R1)
5. Security Misconfiguration (Rule S9)
6. Vulnerable Components
7. Identification and Authentication Failures (Rule S1)
8. Software and Data Integrity Failures (Rule S7)
9. Security Logging and Monitoring Failures (Rule S10)
10. Server-Side Request Forgery (SSRF) (Rule S8)
`,
      },
    ],
  },
  {
    name: 'pr-describer',
    slug: 'pr-describer',
    description:
      'Generates structured, semantic Pull Request descriptions and release changelogs directly from Git diffs and commit messages.',
    tags: ['git', 'github', 'pull-request', 'documentation', 'productivity'],
    files: [
      {
        path: 'SKILL.md',
        content: `---
name: pr-describer
description: "Generates structured, semantic Pull Request descriptions and release changelogs directly from Git diffs and commit messages."
---

# PR Describer Skill

## Purpose
Inspect the current branch's git diff against the target base branch (e.g. \`main\`) and output a well-structured Pull Request description following Conventional Commits format.

## Prompt Guidelines
When generating PR descriptions:
1. **Context & Motivation**: Why is this change being made? What problem does it solve?
2. **Key Changes**: Categorized bullet points grouped by module or component.
3. **Verification Steps**: Exact test commands and manual verification procedures.
4. **Breaking Changes**: Clear callout if any API contracts, database schemas, or configs changed.
`,
      },
      {
        path: 'templates/pr-template.md',
        content: `## What does this PR do?
<!-- Brief summary of changes -->

## Motivation & Context
<!-- Link to issue or ticket -->

## Key Changes
- **Module A**: Description of changes
- **Module B**: Description of changes

## How has this been tested?
- [ ] Unit tests pass (\`npm test\`)
- [ ] E2E browser verification pass
- [ ] Manual smoke test in local environment

## Breaking Changes?
- [ ] No
- [ ] Yes (explain migration path below)
`,
      },
    ],
  },
  {
    name: 'sql-optimizer',
    slug: 'sql-optimizer',
    description:
      'PostgreSQL query optimizer and index design consultant interpreting EXPLAIN ANALYZE plans and diagnosing slow queries.',
    tags: ['database', 'sql', 'postgresql', 'performance', 'indexing'],
    files: [
      {
        path: 'SKILL.md',
        content: `---
name: sql-optimizer
description: "PostgreSQL query optimizer and index design consultant interpreting EXPLAIN ANALYZE plans and diagnosing slow queries."
---

# SQL Optimizer Skill

## Core Capabilities
- Analyze query execution plans generated by \`EXPLAIN (ANALYZE, BUFFERS, VERBOSE, SETTINGS)\`.
- Identify sequential scans (\`Seq Scan\`) on large tables.
- Recommend optimal index strategies:
  - B-tree for equality and range queries.
  - GIN / GiST for full-text search, JSONB, arrays, and trigrams.
  - Partial / Filtered indexes for common boolean flags.
- Detect and eliminate N+1 query patterns in ORM access layers.
- Optimize lock contention and long-running transactions.
`,
      },
      {
        path: 'references/index-patterns.md',
        content: `# PostgreSQL Indexing Best Practices

- Always index foreign key columns used in joins.
- Use multi-column indexes adhering to left-prefix matching rule.
- Use \`CONCURRENTLY\` in production when adding indexes to avoid blocking writes.
- Keep track of index bloat using \`pg_stat_user_indexes\`.
`,
      },
    ],
  },
  {
    name: 'docker-architect',
    slug: 'docker-architect',
    description:
      'Expert DevOps agent creating production-ready multi-stage Dockerfiles, rootless security configurations, and docker-compose setups.',
    tags: ['docker', 'devops', 'containers', 'infrastructure', 'security'],
    files: [
      {
        path: 'SKILL.md',
        content: `---
name: docker-architect
description: "Expert DevOps agent creating production-ready multi-stage Dockerfiles, rootless security configurations, and docker-compose setups."
---

# Docker Architect Skill

## Engineering Principles
1. **Multi-Stage Builds**: Separate build-time dependencies (compilers, devDependencies, test runners) from lean runtime artifacts.
2. **Rootless Security**: Never run containers as root (\`USER node\` or \`USER 10001\`).
3. **Layer Caching Optimization**: Copy dependency manifests first (\`package.json\`, \`go.mod\`, \`requirements.txt\`) before copying full application source.
4. **Signals & PID 1**: Use \`dumb-init\` or \`tini\` when appropriate to handle \`SIGTERM\` / \`SIGINT\` gracefully.
5. **Health Checks**: Include native container healthchecks (\`HEALTHCHECK\`) with sensible intervals and start periods.
`,
      },
      {
        path: 'templates/Dockerfile.node',
        content: `# Production Multi-Stage Dockerfile for Node.js
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 appuser
USER appuser
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "start"]
`,
      },
    ],
  },
];

async function seed() {
  console.log('--- Seeding Official Curated English Skills ---');

  // 1. Ensure official owner user exists
  let officialUser = await prisma.user.findFirst({
    where: { handle: 'skillvault' },
  });

  if (!officialUser) {
    officialUser = await prisma.user.create({
      data: {
        email: 'official@skillvault.dev',
        name: 'SkillVault Team',
        handle: 'skillvault',
        status: 'ACTIVE',
        emailVerified: true,
      },
    });
    console.log(`Created official user: @${officialUser.handle} (${officialUser.id})`);
  } else {
    console.log(`Using existing official user: @${officialUser.handle} (${officialUser.id})`);
  }

  for (const skillData of OFFICIAL_SKILLS) {
    console.log(`Seeding skill: @${officialUser.handle}/${skillData.slug}...`);

    // Prepare files with sha256
    const processedFiles = [];
    for (const f of skillData.files) {
      const buffer = Buffer.from(f.content, 'utf-8');
      const sha256 = calculateSha256(buffer);
      await storage.putBlob(sha256, buffer);

      // Upsert blob in DB
      await prisma.blob.upsert({
        where: { sha256 },
        create: {
          sha256,
          size: buffer.length,
          storageKey: `blobs/${sha256}`,
        },
        update: {},
      });

      processedFiles.push({
        path: f.path,
        sha256,
        size: buffer.length,
        isText: true,
        buffer,
      });
    }

    const contentHash = calculateDirContentHash(processedFiles);

    // Extract search text from SKILL.md
    const skillMd = skillData.files.find((f) => f.path === 'SKILL.md');
    const searchText = skillMd ? skillMd.content.slice(0, 50000) : '';

    // Check if skill already exists
    let skill = await prisma.skill.findFirst({
      where: {
        ownerId: officialUser.id,
        slug: skillData.slug,
        deletedAt: null,
      },
    });

    if (skill) {
      console.log(`  Updating existing skill ${skillData.slug}...`);
      // Create new version
      const latestVer = await prisma.skillVersion.findFirst({
        where: { skillId: skill.id },
        orderBy: { number: 'desc' },
      });
      const nextNum = (latestVer?.number || 1) + 1;

      const version = await prisma.skillVersion.create({
        data: {
          skillId: skill.id,
          number: nextNum,
          message: 'Curated official update',
          contentHash,
          createdById: officialUser.id,
        },
      });

      for (const pf of processedFiles) {
        await prisma.skillFile.create({
          data: {
            versionId: version.id,
            path: pf.path,
            blobSha256: pf.sha256,
            size: pf.size,
            mimeType: 'text/markdown',
            isText: true,
          },
        });
      }

      await prisma.skill.update({
        where: { id: skill.id },
        data: {
          name: skillData.name,
          description: skillData.description,
          tags: skillData.tags,
          visibility: 'PUBLIC',
          currentVersionId: version.id,
          searchText,
        },
      });
    } else {
      console.log(`  Creating new skill ${skillData.slug}...`);
      skill = await prisma.skill.create({
        data: {
          ownerId: officialUser.id,
          slug: skillData.slug,
          name: skillData.name,
          description: skillData.description,
          tags: skillData.tags,
          visibility: 'PUBLIC',
          searchText,
        },
      });

      const version = await prisma.skillVersion.create({
        data: {
          skillId: skill.id,
          number: 1,
          message: 'Official initial release',
          contentHash,
          createdById: officialUser.id,
        },
      });

      for (const pf of processedFiles) {
        await prisma.skillFile.create({
          data: {
            versionId: version.id,
            path: pf.path,
            blobSha256: pf.sha256,
            size: pf.size,
            mimeType: 'text/markdown',
            isText: true,
          },
        });
      }

      await prisma.skill.update({
        where: { id: skill.id },
        data: {
          currentVersionId: version.id,
        },
      });
    }

    console.log(`  [OK] Skill @${officialUser.handle}/${skillData.slug} ready!`);
  }

  console.log('--- Seeding Completed Successfully! ---');
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
