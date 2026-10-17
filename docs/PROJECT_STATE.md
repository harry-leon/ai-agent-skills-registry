# SkillVault — Project State

**Phase**: Phase 1 (MVP)  
**Status**: In Progress  
**Current Milestone**: M1.3 Completed, Ready for M1.4  
**Updated**: 2026-10-18

---

## 1. Executive Summary

SkillVault is a secure, multi-user web application to store, organize, search, upload, download, and clone Agent Skills for AI agents.

- **Phase 0 (Plan)**: Completed & Approved.
- **Milestone M1.1 (Foundation)**: Completed & Committed (`5a965b5`).
- **Milestone M1.2 (Authentication & Account)**: Completed & Committed (`2740e6f`).
- **Milestone M1.3 (Storage and Ingestion Core)**: Completed & Verified (Vitest 48/48, all 24 unit & adversarial ingestion test cases passing, deduplication verified, zero uncommitted binaries).

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
- **Archive download**: `archiver` 8.0.0.
- **Testing**: Vitest 5.0.3 (unit + integration on real PostgreSQL), Playwright 1.63.0 (e2e across 375px, 768px, 1440px).
- **Lint/format**: ESLint (+ eslint-config-next), Prettier.

---

## 3. Schema State

- Initial database migrations applied to local `skillvault` and `skillvault_test` databases:
  - `20261017183754_init` (enums, tables, foreign keys, base indexes)
  - `20261017183812_search_indexes` (immutable unaccent wrapper, immutable array_to_string wrapper, trigram index, weighted tsvector GIN index)

---

## 4. Milestone Progress Tracker

| Milestone   | Description                                                        | Status      | Checks                                                     |
| ----------- | ------------------------------------------------------------------ | ----------- | ---------------------------------------------------------- |
| **Phase 0** | Plan, Task List, Threat Model                                      | 🟢 Approved | Done                                                       |
| **M1.1**    | Foundation (Scaffold, Env, Logging, Error model, DB, Health)       | 🟢 Complete | lint ✔ \| tests 9/9 \| build ✔                             |
| **M1.2**    | Authentication and Account (Better Auth, Sessions, Policy, UI)     | 🟢 Complete | lint ✔ \| tests 24/24 \| e2e 6/6 (375/768/1440) \| build ✔ |
| **M1.3**    | Storage and Ingestion Core (S3/local, Zip streaming, S6 limits)    | 🟢 Complete | lint ✔ \| tests 48/48 (24 adversarial) \| build ✔          |
| **M1.4**    | Skills CRUD & Upload (Tags, Visibility, Share token, Upload UI)    | 🟡 Next     | Pending                                                    |
| **M1.5**    | Viewer and Editor (CodeMirror, Markdown preview, Archiver zip)     | ⚪ Planned  | -                                                          |
| **M1.6**    | Fork and GitHub Import (SSRF defense, Attribution, Badges)         | ⚪ Planned  | -                                                          |
| **M1.7**    | Library and Search (Full-text tsquery, unaccent, Filters, Explore) | ⚪ Planned  | -                                                          |
| **M1.8**    | Hardening, Docs, Production Build (Matrix tests, Docker, CI)       | ⚪ Planned  | -                                                          |
| **M1.9**    | Final Verification & Walkthrough (Full suite, Playwright, Audit)   | ⚪ Planned  | -                                                          |

---

## 5. Known Issues / Blockers

- None.

---

## 6. Next Actions

1. Commit Milestone M1.3.
2. Begin Milestone M1.4: Skills CRUD & Upload:
   - Implement `lib/dal/skills.js`, `lib/dal/versions.js`, `lib/dal/files.js`.
   - Implement `POST /api/skills` (creates skill + version 1 in one transaction with ingested blobs).
   - Implement `PATCH /api/skills/[id]` (tags, visibility only; owner-checked in DAL; strict zod schema).
   - Implement `DELETE /api/skills/[id]` (soft delete).
   - Implement `POST /api/skills/[id]/share-token` (enable, rotate, disable share token).
   - Implement `/skills/new` upload UI with client validation report, progress bar, drag-and-drop, and directory selection.
   - Write integration and authorization tests for skills CRUD and upload.
