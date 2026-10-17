# SkillVault — Project State

**Phase**: Phase 1 (MVP)  
**Status**: In Progress  
**Current Milestone**: M1.6 Completed, Ready for M1.7  
**Updated**: 2026-10-18

---

## 1. Executive Summary

SkillVault is a secure, multi-user web application to store, organize, search, upload, download, and clone Agent Skills for AI agents.

- **Phase 0 (Plan)**: Completed & Approved.
- **Milestone M1.1 (Foundation)**: Completed & Committed (`5a965b5`).
- **Milestone M1.2 (Authentication & Account)**: Completed & Committed (`2740e6f`).
- **Milestone M1.3 (Storage and Ingestion Core)**: Completed & Committed (`22519f8`).
- **Milestone M1.4 (Skills CRUD & Upload)**: Completed & Committed (`129bdbd`).
- **Milestone M1.5 (Viewer and Editor)**: Completed & Committed (`e1f4a67`).
- **Milestone M1.6 (Fork and GitHub Import)**: Completed & Verified (Vitest 93/93, Playwright 15/15 across 375px/768px/1440px, build ✔).

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
- **Forking**: Clones skill with `PRIVATE` visibility, points `SkillFile` rows at existing blob SHA-256 hashes (zero blob duplication), records attribution snapshot (`forkedFromSnapshot`), assigns unique slug suffix.
- **GitHub Import**: SSRF-defended parser (`lib/skills/github.js`), manual redirect checks (strict `api.github.com` and `codeload.github.com` allowlist), token never forwarded to non-API hosts, 100MB download abort guard, subpath re-rooting into S6 pipeline.
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
| **M1.6**    | Fork and GitHub Import (SSRF defense, Attribution, Badges)         | 🟢 Complete | lint ✔ \| tests 93/93 \| e2e 15/15 (375/768/1440) \| build ✔          |
| **M1.7**    | Library and Search (Full-text tsquery, unaccent, Filters, Explore) | 🟡 Next     | Pending                                                               |
| **M1.8**    | Hardening, Docs, Production Build (Matrix tests, Docker, CI)       | ⚪ Planned  | -                                                                     |
| **M1.9**    | Final Verification & Walkthrough (Full suite, Playwright, Audit)   | ⚪ Planned  | -                                                                     |

---

## 5. Known Issues / Blockers

- None.

---

## 6. Next Actions

1. Begin Milestone M1.7: Library and Search:
   - Implement `lib/dal/search.js`: full-text search using `websearch_to_tsquery` with `simple` config + `unaccent` + `pg_trgm` GIN index.
   - Implement `GET /api/skills`: search and filter public skills (query `q`, tag filter, sort by updated or name, cursor-based pagination, default limit 20, max 50).
   - Implement `GET /api/me/skills`: caller's private/unlisted/public skills with search and tag filters.
   - Build `/explore` page with search input, tag filter pills, sort dropdown, responsive grid/list view, empty states.
   - Upgrade `/dashboard` page to include instant search, tag filter pills, and sort order.
   - Write integration tests for search: accent insensitivity ("tim kiem" finds "tìm kiếm"), private/unlisted isolation, SQL injection payload inertness.
   - Write Playwright E2E tests for explore and dashboard search flows across 375px, 768px, 1440px.
