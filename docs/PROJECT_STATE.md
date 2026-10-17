# SkillVault — Project State

**Phase**: Phase 1 (MVP)  
**Status**: In Progress  
**Current Milestone**: M1.5 Completed, Ready for M1.6  
**Updated**: 2026-10-18

---

## 1. Executive Summary

SkillVault is a secure, multi-user web application to store, organize, search, upload, download, and clone Agent Skills for AI agents.

- **Phase 0 (Plan)**: Completed & Approved.
- **Milestone M1.1 (Foundation)**: Completed & Committed (`5a965b5`).
- **Milestone M1.2 (Authentication & Account)**: Completed & Committed (`2740e6f`).
- **Milestone M1.3 (Storage and Ingestion Core)**: Completed & Committed (`22519f8`).
- **Milestone M1.4 (Skills CRUD & Upload)**: Completed & Committed (`129bdbd`).
- **Milestone M1.5 (Viewer and Editor)**: Completed & Verified (Vitest 66/66, Playwright 12/12 across 375px/768px/1440px, build ✔).

---

## 2. Architecture & Tech Stack Decisions

- **Framework**: Next.js 15.5.27 (App Router), React 19.3.0, JavaScript ES Modules (no TypeScript source files, JSDoc for types).
- **Mutations**: 100% Next.js Route Handlers with `lib/api/route.js`. No Server Actions.
- **Database**: PostgreSQL 18 with extensions `unaccent` and `pg_trgm`, Prisma ORM 6.19.3 + Prisma Migrate.
- **Auth**: Better Auth 1.7.7 with Prisma adapter, database-backed sessions in httpOnly cookies, UUID ID generation, rate-limited auth endpoints, and pure RBAC/ABAC policy engine (`lib/auth/policy.js`).
- **Storage**: `@aws-sdk/client-s3` for S3/MinIO/Cloudflare R2, `local` driver for development (`lib/storage/index.js`, `s3.js`, `local.js`).
- **Ingestion**: `yauzl` for streaming zip decompression, `yaml` (core schema) for SKILL.md parsing, server-computed SHA-256 for content-addressed blobs (`lib/skills/ingest.js`).
- **UI & Markdown**: Tailwind CSS 4.3.3, shadcn/ui components, lucide-react, sonner, react-markdown + remark-gfm + rehype-sanitize (no raw HTML).
- **Editor**: CodeMirror 6 (`@codemirror/*`).
- **Archive download**: `archiver` 8.0.0 (`ZipArchive` streaming with `Readable.toWeb`).
- **Testing**: Vitest 5.0.3 (unit + integration on real PostgreSQL), Playwright 1.63.0 (e2e across 375px, 768px, 1440px).
- **Lint/format**: ESLint (+ eslint-config-next), Prettier.

---

## 3. Schema State

- Initial database migrations applied to local `skillvault` and `skillvault_test` databases:
  - `20261017183754_init` (enums, tables, foreign keys, base indexes)
  - `20261017183812_search_indexes` (immutable unaccent wrapper, immutable array_to_string wrapper, trigram index, weighted tsvector GIN index)

---

## 4. Milestone Progress Tracker

| Milestone   | Description                                                        | Status      | Checks                                                                |
| ----------- | ------------------------------------------------------------------ | ----------- | --------------------------------------------------------------------- |
| **Phase 0** | Plan, Task List, Threat Model                                      | 🟢 Approved | Done                                                                  |
| **M1.1**    | Foundation (Scaffold, Env, Logging, Error model, DB, Health)       | 🟢 Complete | lint ✔ \| tests 9/9 \| build ✔                                        |
| **M1.2**    | Authentication and Account (Better Auth, Sessions, Policy, UI)     | 🟢 Complete | lint ✔ \| tests 24/24 \| e2e 6/6 (375/768/1440) \| build ✔            |
| **M1.3**    | Storage and Ingestion Core (S3/local, Zip streaming, S6 limits)    | 🟢 Complete | lint ✔ \| tests 48/48 (24 adversarial) \| build ✔                     |
| **M1.4**    | Skills CRUD & Upload (Tags, Visibility, Share token, Upload UI)    | 🟢 Complete | lint ✔ \| tests 55/55 \| e2e 9/9 (375/768/1440) \| build ✔            |
| **M1.5**    | Viewer and Editor (CodeMirror, Markdown preview, Archiver zip)     | 🟢 Complete | lint ✔ \| tests 66/66 \| e2e 12/12 (375/768/1440) \| build ✔          |
| **M1.6**    | Fork and GitHub Import (SSRF defense, Attribution, Badges)         | 🟡 Next     | Pending                                                               |
| **M1.7**    | Library and Search (Full-text tsquery, unaccent, Filters, Explore) | ⚪ Planned  | -                                                                     |
| **M1.8**    | Hardening, Docs, Production Build (Matrix tests, Docker, CI)       | ⚪ Planned  | -                                                                     |
| **M1.9**    | Final Verification & Walkthrough (Full suite, Playwright, Audit)   | ⚪ Planned  | -                                                                     |

---

## 5. Known Issues / Blockers

- None.

---

## 6. Next Actions

1. Begin Milestone M1.6: Fork and GitHub Import:
   - Implement `lib/skills/github.js`: SSRF-defended GitHub URL parser and archive fetcher (Section S7, Rule R4, R6, R8).
   - Implement `POST /api/skills/[id]/fork`: clone skill into user library, point `SkillFile` rows at existing blobs, record attribution (`forkedFrom*`), handle slug collisions.
   - Implement `POST /api/imports/github`: import public GitHub repository containing `SKILL.md` (supports `/tree/ref/subpath`).
   - Implement `/import` page with URL input, branch/subpath options, and import progress report.
   - Add "Forked from @handle/slug" and "Imported from GitHub" badges to skill cards and viewer.
   - Write integration tests for SSRF URL validation matrix and fork attribution.
   - Write Playwright E2E tests for fork and GitHub import flows across 375px, 768px, 1440px.
