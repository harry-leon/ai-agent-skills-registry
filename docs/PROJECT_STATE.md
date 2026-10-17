# SkillVault — Project State

**Phase**: Phase 0 (Planning)  
**Status**: Awaiting `APPROVED PHASE 0`  
**Current Milestone**: M0 — Implementation Plan, Task List, Threat Model  
**Updated**: 2026-10-18

---

## 1. Executive Summary

SkillVault is a secure, multi-user web application to store, organize, search, upload, download, and clone Agent Skills for AI agents.
Phase 0 deliverables have been prepared:

- `docs/MASTER_PROMPT.md` saved as the single source of truth.
- Implementation Plan Artifact (`implementation_plan.md`)
- Task List Artifact (`task_list.md`)
- Threat Model Artifact (`threat_model.md`)

No application code, package installations, or database migrations will occur until explicit user approval `APPROVED PHASE 0`.

---

## 2. Architecture & Tech Stack Decisions

- **Framework**: Next.js 15.5.27 (App Router), React 19.3.0, JavaScript ES Modules (no TypeScript source files, JSDoc for types).
- **Mutations**: 100% Next.js Route Handlers with `lib/api/route.js`. No Server Actions.
- **Database**: PostgreSQL 18 with extensions `unaccent` and `pg_trgm`, Prisma ORM 6.19.3 + Prisma Migrate (pinned to 6.19.3 for native JavaScript ES modules compatibility without TypeScript config).
- **Auth**: Better Auth 1.7.7 with Prisma adapter (`@better-auth/cli` not required, built-in adapter used), database-backed sessions, httpOnly cookies.
- **Storage**: `@aws-sdk/client-s3` for S3/MinIO/Cloudflare R2, `local` driver for development.
- **Ingestion**: `yauzl` for streaming zip decompression, `yaml` (core schema) for SKILL.md parsing, server-computed SHA-256 for content-addressed blobs.
- **UI & Markdown**: Tailwind CSS 4.3.3, shadcn/ui components, lucide-react, sonner, react-markdown + remark-gfm + rehype-sanitize (no raw HTML).
- **Editor**: CodeMirror 6 (`@codemirror/*`).
- **Archive download**: `archiver` 8.0.0.
- **Testing**: Vitest 5.0.3 (unit + integration on real PostgreSQL), Playwright 1.63.0 (e2e).

---

## 3. Schema State

- Initial database migrations applied to local `skillvault` and `skillvault_test` databases:
  - `20261017183754_init` (enums, tables, foreign keys, base indexes)
  - `20261017183812_search_indexes` (immutable unaccent wrapper, immutable array_to_string wrapper, trigram index, weighted tsvector GIN index)

---

## 4. Milestone Progress Tracker

| Milestone   | Description                                                        | Status      | Checks  |
| ----------- | ------------------------------------------------------------------ | ----------- | ------- |
| **Phase 0** | Plan, Task List, Threat Model                                      | 🟢 Approved | Done    |
| **M1.1**    | Foundation (Scaffold, Env, Logging, Error model, DB, Health)       | 🟢 Complete | lint ✔  | tests 9/9 | build ✔ |
| **M1.2**    | Authentication and Account (Better Auth, Sessions, Policy)         | 🟡 Next     | Pending |
| **M1.3**    | Storage and Ingestion Core (S3/local, Zip streaming, S6 limits)    | ⚪ Planned  | -       |
| **M1.4**    | Skills CRUD & Upload (Tags, Visibility, Share token, Upload UI)    | ⚪ Planned  | -       |
| **M1.5**    | Viewer and Editor (CodeMirror, Markdown preview, Archiver zip)     | ⚪ Planned  | -       |
| **M1.6**    | Fork and GitHub Import (SSRF defense, Attribution, Badges)         | ⚪ Planned  | -       |
| **M1.7**    | Library and Search (Full-text tsquery, unaccent, Filters, Explore) | ⚪ Planned  | -       |
| **M1.8**    | Hardening, Docs, Production Build (Matrix tests, Docker, CI)       | ⚪ Planned  | -       |
| **M1.9**    | Final Verification & Walkthrough (Full suite, Playwright, Audit)   | ⚪ Planned  | -       |

---

## 5. Known Issues / Blockers

- None at this stage.

---

## 6. Next Actions

1. Present Phase 0 Artifacts to user.
2. Await `APPROVED PHASE 0`.
3. Proceed to M1.1 upon approval.
