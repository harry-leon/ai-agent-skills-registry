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

const REAL_SKILLS = [
  {
    ownerHandle: 'skillvault',
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
allowed_tools: [readFile, runCommand, grepSearch]
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
    ownerHandle: 'skillvault',
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
allowed_tools: [readFile, grepSearch]
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
    ownerHandle: 'skillvault',
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
allowed_tools: [readFile, runCommand]
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
    ownerHandle: 'skillvault',
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
allowed_tools: [readFile, runCommand]
---

# Docker Architect Skill

## Engineering Principles
1. **Multi-Stage Builds**: Separate build-time dependencies from lean runtime artifacts.
2. **Rootless Security**: Never run containers as root (\`USER node\` or \`USER 10001\`).
3. **Layer Caching Optimization**: Copy dependency manifests first before copying application source.
4. **Signals & PID 1**: Use \`dumb-init\` or \`tini\` when appropriate to handle \`SIGTERM\` / \`SIGINT\` gracefully.
5. **Health Checks**: Include native container healthchecks (\`HEALTHCHECK\`) with sensible intervals.
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
  {
    ownerHandle: 'skillvault',
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
allowed_tools: [runCommand]
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
    ownerHandle: 'skillvault',
    name: 'secure-api-designer',
    slug: 'secure-api-designer',
    description:
      'REST API security architect enforcing Zod input validation, JWT session handling, rate-limiting, and error boundaries.',
    tags: ['api', 'security', 'zod', 'rest', 'backend', 'auth'],
    files: [
      {
        path: 'SKILL.md',
        content: `---
name: secure-api-designer
description: "REST API security architect enforcing Zod input validation, JWT session handling, rate-limiting, and error boundaries."
allowed_tools: [readFile, grepSearch]
---

# Secure API Designer Skill

## Requirements for Every Endpoint
1. **Strict Input Validation**:
   - Parse and validate all \`body\`, \`query\`, and \`params\` with Zod.
   - Reject unexpected properties with \`.strict()\`.
2. **Explicit Authorization Access**:
   - Declare whether route is \`public\`, \`user\`, or \`admin\`.
   - Never trust client-supplied user IDs; resolve identity from verified session tokens.
3. **Information Disclosure Prevention**:
   - Catch internal exceptions and return normalized error codes (\`VALIDATION_FAILED\`, \`UNAUTHENTICATED\`, \`FORBIDDEN\`, \`NOT_FOUND\`).
   - Never leak database stack traces, table names, or internal connection strings to clients.
4. **Rate Limiting**:
   - Guard mutation endpoints (login, register, password reset, upload) with token-bucket or sliding-window rate limiters.
`,
      },
      {
        path: 'references/api-standards.md',
        content: `# API Design Standards

- Use standard HTTP status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable, 429 Rate Limited.
- Standard error envelope: \`{ "error": { "code": "...", "message": "...", "details": [...] } }\`
- Always set \`Content-Type: application/json; charset=utf-8\`.
`,
      },
    ],
  },
  {
    ownerHandle: 'skillvault',
    name: 'nextjs-architect',
    slug: 'nextjs-architect',
    description:
      'Next.js 15 App Router specialist guiding Server Components, streaming SSR, parallel routes, Route Handlers, and cache policies.',
    tags: ['nextjs', 'react', 'fullstack', 'typescript', 'frontend'],
    files: [
      {
        path: 'SKILL.md',
        content: `---
name: nextjs-architect
description: "Next.js 15 App Router specialist guiding Server Components, streaming SSR, parallel routes, Route Handlers, and cache policies."
allowed_tools: [readFile, runCommand]
---

# Next.js 15 Architect Skill

## Core Principles
1. **Server-First by Default**:
   - Keep data fetching inside React Server Components (RSC) to minimize client bundle size.
   - Only add \`'use client'\` when utilizing browser events, React state, or effects.
2. **Granular Suspense Boundaries**:
   - Wrap slow asynchronous data fetches in \`<Suspense fallback={<Skeleton />}>\` to stream UI progressively.
3. **Route Handlers**:
   - Place REST endpoints in \`app/api/**/route.js\`.
   - Handle preflight CORS, cookies, and cache-control headers explicitly.
4. **Caching & Revalidation**:
   - Explicitly define \`export const dynamic = 'force-dynamic'\` or configure \`revalidateTag\` / \`revalidatePath\`.
`,
      },
      {
        path: 'references/rsc-guidelines.md',
        content: `# React Server Components Guidelines

- Don't import client-only packages in Server Components.
- Don't pass functions or non-serializable objects across the server-client boundary.
- Colocate client components as leaf nodes at the edge of the component tree.
`,
      },
    ],
  },
  {
    ownerHandle: 'skillvault',
    name: 'playwright-automation',
    slug: 'playwright-automation',
    description:
      'End-to-end browser automation expert designing resilient locators, cross-viewport suites, and authentication state fixtures.',
    tags: ['testing', 'playwright', 'e2e', 'automation', 'qa'],
    files: [
      {
        path: 'SKILL.md',
        content: `---
name: playwright-automation
description: "End-to-end browser automation expert designing resilient locators, cross-viewport suites, and authentication state fixtures."
allowed_tools: [readFile, runCommand]
---

# Playwright Automation Skill

## Locator Philosophy
1. **User-Facing Roles & Labels**:
   - Prefer \`page.getByRole('button', { name: 'Submit' })\` or \`page.getByLabel('Email')\`.
   - Use stable IDs (\`#email\`, \`#password\`) when testing complex custom input containers.
2. **Never Use Fragile XPath or Deep CSS**:
   - Avoid \`div > div:nth-child(3) > span\`.
3. **Deterministic Waiting**:
   - Rely on auto-waiting assertions (\`await expect(locator).toBeVisible()\`).
   - Never use arbitrary \`page.waitForTimeout(3000)\`.
4. **Cross-Viewport Coverage**:
   - Always verify flows across Mobile (375px), Tablet (768px), and Desktop (1440px).
`,
      },
      {
        path: 'templates/e2e-template.spec.js',
        content: `import { test, expect } from '@playwright/test';

test.describe('Feature End-to-End Flow', () => {
  test('User completes primary workflow', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });
});
`,
      },
    ],
  },
  {
    ownerHandle: 'skillvault',
    name: 'prisma-database-pro',
    slug: 'prisma-database-pro',
    description:
      'Prisma ORM schema modeling, migrations, pg_trgm full-text indexing, relation cascades, and connection pooling.',
    tags: ['database', 'prisma', 'orm', 'postgresql', 'backend'],
    files: [
      {
        path: 'SKILL.md',
        content: `---
name: prisma-database-pro
description: "Prisma ORM schema modeling, migrations, pg_trgm full-text indexing, relation cascades, and connection pooling."
allowed_tools: [readFile, runCommand]
---

# Prisma Database Pro Skill

## Schema Design Rules
1. **UUID Primary Keys**:
   - Use \`@id @default(uuid()) @db.Uuid\` for all entities to prevent ID enumeration attacks.
2. **Explicit Cascade Policies**:
   - Declare \`onDelete: Cascade\` for dependent ownership relationships (e.g. User -> Sessions).
   - Use \`onDelete: Restrict\` or \`SetNull\` for audit trails and immutable logs.
3. **Indexing Strategy**:
   - Add \`@@index\` on foreign keys and commonly filtered fields.
   - Use PostgreSQL GIN indexes for array columns and trigram search.
4. **Prisma Client Singleton**:
   - Ensure a single cached instance in development to avoid exhausting PostgreSQL connection pools.
`,
      },
      {
        path: 'references/prisma-checklist.md',
        content: `# Prisma Migration Checklist

- [ ] Run \`npx prisma validate\` to check schema syntax.
- [ ] Use \`prisma migrate dev\` in development to record SQL migrations.
- [ ] Inspect generated SQL before running in production.
- [ ] Ensure indexes are applied before deploying large volume queries.
`,
      },
    ],
  },
  {
    ownerHandle: 'skillvault',
    name: 'tailwind-design-system',
    slug: 'tailwind-design-system',
    description:
      'Design system consultant building accessible tokenized interfaces with Tailwind CSS, subtle dark mode palettes, and Radix primitives.',
    tags: ['tailwind', 'css', 'design-system', 'ui', 'frontend'],
    files: [
      {
        path: 'SKILL.md',
        content: `---
name: tailwind-design-system
description: "Design system consultant building accessible tokenized interfaces with Tailwind CSS, subtle dark mode palettes, and Radix primitives."
allowed_tools: [readFile]
---

# Tailwind Design System Skill

## Craft Guidelines
1. **Subtle Elevation & Contrast**:
   - Use dark neutral slate/navy backgrounds (\`#0b0f17\`, \`#111624\`) with fine borders (\`border-[#1c2536]\`).
   - Reserve vibrant accent colors (blue/cyan) strictly for interactive primary actions and active states.
2. **Consistent Border Radius & Padding**:
   - Use \`rounded-xl\` or \`rounded-2xl\` for cards and input containers.
   - Maintain generous breathing room (\`px-4 py-3\`, \`gap-3\`).
3. **Typography Hierarchy**:
   - Clear weight separation (\`font-semibold\`, \`font-bold\`).
   - Use \`font-mono\` for handles, hashes, versions, and terminal code snippets.
4. **Interactive Micro-States**:
   - Provide smooth \`transition-colors\` or \`active:scale-[0.98]\` feedback on buttons and links.
`,
      },
    ],
  },
  {
    ownerHandle: 'skillvault',
    name: 'vitest-unit-tester',
    slug: 'vitest-unit-tester',
    description:
      'Unit and integration test authoring with Vitest, featuring deterministic assertions, mock fixtures, and concurrency optimizations.',
    tags: ['testing', 'vitest', 'unit-test', 'javascript', 'typescript'],
    files: [
      {
        path: 'SKILL.md',
        content: `---
name: vitest-unit-tester
description: "Unit and integration test authoring with Vitest, featuring deterministic assertions, mock fixtures, and concurrency optimizations."
allowed_tools: [readFile, runCommand]
---

# Vitest Unit Tester Skill

## Guidelines
1. **Isolated Test State**:
   - Clear test databases, caches, and mocks in \`beforeEach\` / \`afterEach\` hooks.
2. **Fast & Deterministic**:
   - Prefer in-memory mocks for third-party HTTP services (GitHub API, Stripe, AWS S3).
   - Use \`vi.useFakeTimers()\` for rate limiting or time-based expiration assertions.
3. **Meaningful Assertions**:
   - Test both happy paths and security boundary conditions (wrong password, expired token, malformed payload).
`,
      },
    ],
  },
  {
    ownerHandle: 'skillvault',
    name: 'git-workflow-automator',
    slug: 'git-workflow-automator',
    description:
      'Git workflow expert guiding rebase strategies, conventional commit histories, branch protection, and release workflows.',
    tags: ['git', 'version-control', 'devops', 'workflow'],
    files: [
      {
        path: 'SKILL.md',
        content: `---
name: git-workflow-automator
description: "Git workflow expert guiding rebase strategies, conventional commit histories, branch protection, and release workflows."
allowed_tools: [runCommand]
---

# Git Workflow Automator Skill

## Best Practices
- **Atomic Commits**: Each commit should do one thing completely.
- **Conventional Commits**: \`feat:\`, \`fix:\`, \`chore:\`, \`docs:\`, \`refactor:\`, \`test:\`.
- **Rebase over Merge**: Keep a clean linear history on feature branches before opening PRs.
- **Never Force Push to Main**: Always protect main branches with pull request requirements and CI checks.
`,
      },
    ],
  },
  {
    ownerHandle: 'demouser',
    name: 'graphql-api-architect',
    slug: 'graphql-api-architect',
    description:
      'Type-safe GraphQL schema design, resolvers, DataLoader N+1 query batching, and schema federation standards.',
    tags: ['graphql', 'api', 'backend', 'typescript', 'performance'],
    files: [
      {
        path: 'SKILL.md',
        content: `---
name: graphql-api-architect
description: "Type-safe GraphQL schema design, resolvers, DataLoader N+1 query batching, and schema federation standards."
allowed_tools: [readFile]
---

# GraphQL API Architect Skill

## Core Engineering Rules
1. **DataLoader for Batching**: Always wrap database fetches in DataLoader to eliminate N+1 queries.
2. **Nullability Best Practice**: Make fields nullable unless they are guaranteed to exist even during partial system degradation.
3. **Query Complexity & Depth Limiting**: Reject queries that exceed depth thresholds to guard against denial-of-service.
4. **Relay Cursor Pagination**: Use \`first\`, \`after\`, \`edges\`, and \`pageInfo\` for scalable pagination.
`,
      },
    ],
  },
  {
    ownerHandle: 'demouser',
    name: 'kubernetes-operator',
    slug: 'kubernetes-operator',
    description:
      'Kubernetes manifests, Deployments, StatefulSets, Ingress configs, ConfigMaps, Secrets, and container health probes.',
    tags: ['kubernetes', 'k8s', 'devops', 'cloud', 'containers'],
    files: [
      {
        path: 'SKILL.md',
        content: `---
name: kubernetes-operator
description: "Kubernetes manifests, Deployments, StatefulSets, Ingress configs, ConfigMaps, Secrets, and container health probes."
allowed_tools: [readFile]
---

# Kubernetes Operator Skill

## Manifest Standards
1. **Resource Limits**: Always declare \`requests\` and \`limits\` for CPU and memory.
2. **Liveness & Readiness Probes**: Configure HTTP probes with appropriate \`initialDelaySeconds\` and \`periodSeconds\`.
3. **Security Context**: Enforce \`readOnlyRootFilesystem: true\` and \`runAsNonRoot: true\`.
4. **Graceful Termination**: Allow sufficient \`terminationGracePeriodSeconds\` for inflight connections to drain.
`,
      },
    ],
  },
  {
    ownerHandle: 'skillvault',
    name: 'accessibility-auditor',
    slug: 'accessibility-auditor',
    description:
      'WCAG 2.1 AA accessibility auditing: semantic HTML5, ARIA roles, keyboard focus traps, screen-reader announcements, and tap targets.',
    tags: ['accessibility', 'a11y', 'wcag', 'frontend', 'html'],
    files: [
      {
        path: 'SKILL.md',
        content: `---
name: accessibility-auditor
description: "WCAG 2.1 AA accessibility auditing: semantic HTML5, ARIA roles, keyboard focus traps, screen-reader announcements, and tap targets."
allowed_tools: [readFile, grepSearch]
---

# Accessibility Auditor Skill

## Audit Checklist
1. **Semantic Structure**: Use correct heading levels (\`h1\` through \`h6\`) and landmarks (\`main\`, \`nav\`, \`aside\`, \`header\`, \`footer\`).
2. **Keyboard Navigation**: All interactive elements must be focusable via Tab and activatable with Enter or Space. Focus rings must be visibly prominent.
3. **Color Contrast**: Text must meet minimum 4.5:1 contrast ratio against background (3:1 for large text).
4. **Touch Targets**: Minimum 44x44px clickable area on mobile viewports.
5. **Screen Reader Announcements**: Use \`aria-live="polite"\` for dynamic status updates.
`,
      },
    ],
  },
];

async function run() {
  console.log('=== Step 1: Cleaning up test artifacts and obsolete mock skills ===');

  // Find all test/mock skills to delete:
  // e.g. owners starting with u-, usra, usrb, sk-, ed-, srchu, or skills with test patterns
  const testSkills = await prisma.skill.findMany({
    where: {
      OR: [
        { name: { startsWith: 'agent-skill-' } },
        { name: { startsWith: 'source-skill-' } },
        { name: { startsWith: 'tk-public-' } },
        { slug: { startsWith: 'agent-skill-' } },
        { slug: { startsWith: 'source-skill-' } },
        { slug: { startsWith: 'tk-public-' } },
        { slug: 'data-analyst-pro' },
        { slug: 'code-assistant' },
        { owner: { handle: { startsWith: 'u-' } } },
        { owner: { handle: { startsWith: 'usra' } } },
        { owner: { handle: { startsWith: 'usrb' } } },
        { owner: { handle: { startsWith: 'sk-' } } },
        { owner: { handle: { startsWith: 'ed-' } } },
        { owner: { handle: { startsWith: 'srchu' } } },
      ],
    },
    select: { id: true, name: true, slug: true },
  });

  console.log(`Found ${testSkills.length} test/mock skills to purge.`);

  for (const s of testSkills) {
    // Delete files, versions, and skill
    await prisma.skillFile.deleteMany({ where: { version: { skillId: s.id } } });
    await prisma.favoriteSkill.deleteMany({ where: { skillId: s.id } });
    await prisma.skillVersion.deleteMany({ where: { skillId: s.id } });
    await prisma.skill.delete({ where: { id: s.id } });
  }

  // Also purge orphaned test users
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      OR: [
        { handle: { startsWith: 'u-' } },
        { handle: { startsWith: 'usra' } },
        { handle: { startsWith: 'usrb' } },
        { handle: { startsWith: 'sk-' } },
        { handle: { startsWith: 'ed-' } },
        { handle: { startsWith: 'srchu' } },
      ],
    },
  });
  console.log(`Purged ${deletedUsers.count} test users.`);

  console.log('=== Step 2: Ensuring system owners (@skillvault and @demouser) exist ===');

  let officialUser = await prisma.user.findFirst({ where: { handle: 'skillvault' } });
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
  }

  let demoUser = await prisma.user.findFirst({ where: { handle: 'demouser' } });
  if (!demoUser) {
    demoUser = await prisma.user.create({
      data: {
        email: 'demo@skillvault.local',
        name: 'Demo User',
        handle: 'demouser',
        status: 'ACTIVE',
        emailVerified: true,
      },
    });
  }

  console.log('=== Step 3: Seeding 15 Real-World Production AI Agent Skills ===');

  for (const skillData of REAL_SKILLS) {
    const owner = skillData.ownerHandle === 'demouser' ? demoUser : officialUser;
    console.log(`Seeding @${owner.handle}/${skillData.slug}...`);

    const processedFiles = [];
    for (const f of skillData.files) {
      const buffer = Buffer.from(f.content, 'utf-8');
      const sha256 = calculateSha256(buffer);
      await storage.putBlob(sha256, buffer);

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
    const skillMd = skillData.files.find((f) => f.path === 'SKILL.md');
    const searchText = skillMd ? skillMd.content.slice(0, 50000) : '';

    let existingSkill = await prisma.skill.findFirst({
      where: {
        ownerId: owner.id,
        slug: skillData.slug,
        deletedAt: null,
      },
    });

    if (existingSkill) {
      // Update metadata and version
      const latestVer = await prisma.skillVersion.findFirst({
        where: { skillId: existingSkill.id },
        orderBy: { number: 'desc' },
      });
      const nextNum = (latestVer?.number || 1) + 1;

      const version = await prisma.skillVersion.create({
        data: {
          skillId: existingSkill.id,
          number: nextNum,
          message: 'Production curated update',
          contentHash,
          createdById: owner.id,
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
        where: { id: existingSkill.id },
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
      const skill = await prisma.skill.create({
        data: {
          ownerId: owner.id,
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
          message: 'Initial production release',
          contentHash,
          createdById: owner.id,
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
  }

  const finalPublicCount = await prisma.skill.count({
    where: { visibility: 'PUBLIC', deletedAt: null },
  });
  console.log(`=== Done! Public skills in library: ${finalPublicCount} ===`);
}

run()
  .catch((e) => {
    console.error('Error running seed script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
