# SkillVault — Project State

**Phase**: Phase 1 (MVP)  
**Status**: 🟢 Complete — Awaiting Approval  
**Current Milestone**: M1.9 Completed  
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
- **Milestone M1.6 (Fork and GitHub Import)**: Completed & Committed (`4506cf8`).
- **Milestone M1.7 (Library and Search)**: Completed & Committed (`8f727fe`).
- **Milestone M1.8 (Hardening, Docs, Production Build)**: Completed & Verified (Vitest 146/146, Playwright 18/18 across 375px/768px/1440px, build ✔, audit ✔).

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
- **Search & Discovery**: Weighted full-text search vector + `immutable_unaccent` + `websearch_to_tsquery('simple', ...)` with `pg_trgm` fallback in `lib/dal/search.js`. Keyset cursor pagination with deterministic tie-breaking on `(updatedAt, id)`. Public `/explore` discovery and caller `/dashboard` library filtering.
- **Security Matrix & Response Hardening**: Full automated authorization matrix in `tests/integration/security-matrix.test.js` (38 tests) verifying unauthenticated 401s, IDOR hidden existence (404 for private/unlisted, 403 for public mutations), mass assignment rejection (422), and response security headers (`X-Content-Type-Options: nosniff`, `Content-Security-Policy: sandbox`, `Content-Disposition`, `x-trace-id`).
- **Documentation & Deployment**: Complete `README.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/DECISIONS.md`, production `Dockerfile` (standalone runner), `docker-compose.yml`, GitHub Actions CI workflow, and Dependabot config.
- **Testing**: Vitest 5.0.3 (146/146 unit + integration on real PostgreSQL), Playwright 1.63.0 (18/18 e2e across 375px, 768px, 1440px).
- **Lint/format**: ESLint (+ eslint-config-next), Prettier.

---

## 3. Schema State

- Initial database migrations applied to local `skillvault` and `skillvault_test` databases:
  - `20261017183754_init` (enums, tables, foreign keys, base indexes)
  - `20261017183812_search_indexes` (immutable unaccent wrapper, immutable array_to_string wrapper, trigram index, weighted tsvector GIN index)

---

## 4. Milestone Progress Tracker

| Milestone   | Description                                                        | Status      | Checks                                                         |
| ----------- | ------------------------------------------------------------------ | ----------- | -------------------------------------------------------------- |
| **Phase 0** | Plan, Task List, Threat Model                                      | 🟢 Approved | Done                                                           |
| **M1.1**    | Foundation (Scaffold, Env, Logging, Error model, DB, Health)       | 🟢 Complete | lint ✔ \| tests 9/9 \| build ✔                                 |
| **M1.2**    | Authentication and Account (Better Auth, Sessions, Policy, UI)     | 🟢 Complete | lint ✔ \| tests 24/24 \| e2e 6/6 (375/768/1440) \| build ✔     |
| **M1.3**    | Storage and Ingestion Core (S3/local, Zip streaming, S6 limits)    | 🟢 Complete | lint ✔ \| tests 48/48 (24 adversarial) \| build ✔              |
| **M1.4**    | Skills CRUD & Upload (Tags, Visibility, Share token, Upload UI)    | 🟢 Complete | lint ✔ \| tests 55/55 \| e2e 9/9 (375/768/1440) \| build ✔     |
| **M1.5**    | Viewer and Editor (CodeMirror, Markdown preview, Archiver zip)     | 🟢 Complete | lint ✔ \| tests 66/66 \| e2e 12/12 (375/768/1440) \| build ✔   |
| **M1.6**    | Fork and GitHub Import (SSRF defense, Attribution, Badges)         | 🟢 Complete | lint ✔ \| tests 93/93 \| e2e 15/15 (375/768/1440) \| build ✔   |
| **M1.7**    | Library and Search (Full-text tsquery, unaccent, Filters, Explore) | 🟢 Complete | lint ✔ \| tests 108/108 \| e2e 18/18 (375/768/1440) \| build ✔ |
| **M1.8**    | Hardening, Docs, Production Build (Matrix tests, Docker, CI)       | 🟢 Complete | lint ✔ \| tests 146/146 \| e2e 18/18 \| build ✔ \| audit ✔     |
| **M1.9**    | Final Verification & Walkthrough (Definition of Done, Walkthrough) | 🟢 Complete | lint ✔ \| tests 146/146 \| e2e 18/18 \| build ✔ \| audit ✔     |

---

## 5. Known Issues / Blockers

- None.

---

## 6. Next Actions

1. Await user command: `APPROVED PHASE 1` before proceeding to Phase 2 (specified in Section 12).

