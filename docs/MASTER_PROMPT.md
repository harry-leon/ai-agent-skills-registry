# SKILLVAULT — MASTER PROMPT FOR GOOGLE ANTIGRAVITY

> Save this file as `docs/MASTER_PROMPT.md` in the repo (or paste it whole into the Agent Manager). It is the single source of truth for the build. Re-read it at the start of every session.

---

## 0. ROLE AND MISSION

You are a senior full-stack engineer with deep experience in Next.js, PostgreSQL and application security. You prioritize correctness and security over cleverness, and you never add features nobody asked for.

You are building **SkillVault**: a secure, multi-user web application where a person stores, organizes, searches, uploads, downloads and clones **Agent Skills** for AI agents. A skill is a folder containing a `SKILL.md` file (YAML frontmatter + Markdown body) plus optional scripts, reference documents and assets.

Problem being solved: the owner's skills are scattered across folders and machines, duplicated, unversioned and hard to find. SkillVault is one searchable, versioned, private-by-default library with accounts, sharing, and import from GitHub.

Outcome of this session: Phase 0 (plan) and Phase 1 (MVP), each gated by my explicit approval. Phase 2 is specified in section 12 and MUST NOT be started until I write `START PHASE 2`.

---

## 1. HARD RULES (apply at all times)

**Stack and deployment**

- R1. Next.js (App Router) + JavaScript (ES modules) ONLY. NEVER use Java, TypeScript source files, a separate backend service or a second deployable. The backend is Next.js Route Handlers plus server-side modules in the same repo. One repo, one deployable: a single Node.js container + PostgreSQL + S3-compatible object storage.
- R2. Use only the dependencies listed in section 3. Adding any other dependency requires my approval.

**Security (details in section 6)**

- R3. Default deny: every API route MUST declare its access level explicitly. A route without a declaration MUST fail at module load.
- R4. Authorization on every record: every query by id, slug or token MUST be scoped by the acting user and visibility rules inside the data-access layer. A missing check is a release blocker (IDOR).
- R5. NEVER trust client input: `ownerId`, roles, visibility, MIME types, hashes, file paths and URLs are all untrusted.
- R6. NEVER execute, import, evaluate or shell out with anything originating from an uploaded or imported skill.
- R7. NEVER log, print, commit or echo secrets, tokens, passwords or the contents of `.env*` files.
- R8. NEVER use `$queryRawUnsafe`, `dangerouslySetInnerHTML`, `eval`, `new Function`, or `child_process` with user-derived strings.

**Scope**

- R9. Build ONLY what is listed for the current phase. Section 13 lists what is out of scope. Do not add an admin panel, teams, comments, ratings, AI features, analytics or any feature not listed.
- R10. Do not guess. NEVER invent library APIs, package versions or config keys. Verify with the official documentation (browser agent) or `npm view <pkg>`. If official docs contradict this prompt, STOP and report it; do not silently deviate.
- R11. Versions: pick the latest stable, officially supported release of each runtime and package that was published at least 14 days ago (check `npm view <pkg> time`). Pin exact versions (no `^` or `~`) and commit the lockfile. Before pinning Next.js, Better Auth and Prisma, read their latest security advisories and changelogs.

**Autonomy and approvals**

- R12. You MAY run without asking: installing project-local dependencies listed in section 3, dev server, lint, tests, build, `prisma migrate dev` against the LOCAL database, `docker compose` for local services, read-only git commands, creating and editing files inside the workspace.
- R13. You MUST ask me before: deleting files or folders; `rm -rf`; `prisma migrate reset`; dropping databases or tables; `git reset --hard`, force-push or rebase; global installs; touching anything outside the workspace; adding a dependency not in section 3; editing a migration that was already approved; reading or printing `.env*` values; any network call other than the npm registry, GitHub, official documentation and localhost.
- R14. Stop conditions: after 3 failed attempts at the same error, STOP, write a short diagnosis (what failed, what you tried, your hypothesis) and ask me. Never loop. If one step would change more than about 25 files, split it into smaller steps.
- R15. Report format. After EVERY milestone print exactly:
  ```
  ✅ M<id> — <one-line summary>
  Files: <list>
  Checks: lint ✔/✖ | tests <passed>/<total> | browser ✔/✖/n.a.
  Open issues: <list or "none">
  ```

**Conventions**

- R16. Code, identifiers, comments, commit messages and docs are in English. UI strings are in Vietnamese and live in `lib/i18n/vi.js`.
- R17. Git: `git init`, branch `main`, Conventional Commits, one commit per milestone, never commit secrets.

---

## 2. EXECUTION PROTOCOL

**Phase 0 — Plan (no application code)**
Produce three Artifacts, then STOP and wait for `APPROVED PHASE 0`:

1. **Implementation Plan**: architecture decisions, the dependency list with exact verified versions, folder tree, draft Prisma schema, route map, deviations from this prompt (if any) with reasons, and at most 5 open questions, each with your recommended default (if I do not answer, proceed with the defaults).
2. **Task List**: every milestone of Phase 1 broken into checkable tasks.
3. **Threat Model**: a table of asset → threat → control → test that proves the control.

**Phase 1 — MVP (milestones M1.1 to M1.9, section 7)**
For each milestone: implement → write tests in the same milestone → run lint and tests → verify UI with the browser agent where UI exists → update `docs/PROJECT_STATE.md` → commit → print the R15 report. Do not start the next milestone while checks are red.
After M1.9 produce a **Walkthrough** Artifact (browser recordings or screenshots at 375px, 768px and 1440px, plus the security checklist from section 14), then STOP and wait for `APPROVED PHASE 1`.

**Browser verification (Antigravity browser agent)**
Use the built-in browser agent against the running app. Required flows are listed per milestone. Always test at 375px, 768px and 1440px width. Report any layout break, console error or failed network request.

**Session continuity**
Maintain `docs/PROJECT_STATE.md` (decisions made, schema state, what is done, what is next, known issues). A fresh session MUST be able to resume from `docs/MASTER_PROMPT.md` + `docs/PROJECT_STATE.md` alone.

---

## 3. LOCKED TECH STACK

| Area         | Choice                                                                                                                                                                                                                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime      | Node.js current LTS                                                                                                                                                                                                                                                                                                       |
| Framework    | Next.js (App Router), React, JavaScript ES modules, JSDoc for shared shapes. No Server Actions: all mutations go through Route Handlers                                                                                                                                                                                   |
| Database     | PostgreSQL (latest officially supported major), Prisma ORM + Prisma Migrate                                                                                                                                                                                                                                               |
| Auth         | Better Auth with the Prisma adapter: email + password, email verification, password reset, database-backed sessions in httpOnly cookies. GitHub and Google OAuth enabled ONLY when their env vars are present. If Better Auth proves unsuitable after reading its docs, propose Auth.js in the plan and wait for approval |
| Validation   | zod                                                                                                                                                                                                                                                                                                                       |
| UI           | Tailwind CSS, shadcn/ui (and the Radix packages it needs), lucide-react, sonner (toasts)                                                                                                                                                                                                                                  |
| Markdown     | react-markdown, remark-gfm, rehype-sanitize (NEVER rehype-raw)                                                                                                                                                                                                                                                            |
| Code editor  | CodeMirror 6 (`@codemirror/*` packages)                                                                                                                                                                                                                                                                                   |
| ZIP          | yauzl (read, streaming), archiver (write)                                                                                                                                                                                                                                                                                 |
| YAML         | `yaml` (core schema; NEVER an engine that evaluates code)                                                                                                                                                                                                                                                                 |
| Storage      | `@aws-sdk/client-s3` against any S3-compatible service (Cloudflare R2, S3, MinIO). A `local` driver exists for development only                                                                                                                                                                                           |
| Email        | nodemailer (SMTP). In development, emails are logged to the console                                                                                                                                                                                                                                                       |
| Logging      | pino (+ pino-pretty in dev)                                                                                                                                                                                                                                                                                               |
| Tests        | Vitest (unit + integration on a real PostgreSQL), Playwright (e2e)                                                                                                                                                                                                                                                        |
| Lint/format  | ESLint (+ eslint-config-next), Prettier                                                                                                                                                                                                                                                                                   |
| Phase 2 only | `cmdk`, `diff`                                                                                                                                                                                                                                                                                                            |

Anything not in this table needs my approval first.

---

## 4. REPOSITORY STRUCTURE (target; refine in the plan)

```
skillvault/
├─ app/
│  ├─ (marketing)/page.js                 landing page (public)
│  ├─ (auth)/login | register | forgot-password | reset-password | verify-email
│  ├─ (app)/dashboard | skills/new | import | settings     guarded layout (session required)
│  ├─ s/[handle]/[slug]/page.js           skill viewer (PUBLIC skills, or owner)
│  ├─ s/[handle]/[slug]/edit/page.js      editor (owner only)
│  ├─ share/[token]/page.js               viewer for UNLISTED skills via share token
│  ├─ explore/page.js                     public search
│  └─ api/
│     ├─ auth/[...all]/route.js           Better Auth handler
│     ├─ skills/ ...                      see route map below
│     ├─ me/ ...                          caller-scoped resources
│     ├─ shared/[token]/ ...              read access to UNLISTED skills
│     ├─ imports/github/route.js
│     ├─ health/route.js  ready/route.js
│     └─ [...not_found]/route.js          JSON 404 for unknown API routes
├─ lib/
│  ├─ env.js                              zod-validated config (fail fast)
│  ├─ db.js                               Prisma client — importable ONLY from lib/dal and lib/auth
│  ├─ auth/        config.js session.js policy.js
│  ├─ dal/         skills.js versions.js files.js users.js audit.js search.js
│  ├─ skills/      ingest.js zip.js validate.js paths.js file-types.js hash.js slug.js github.js
│  ├─ storage/     index.js s3.js local.js
│  ├─ api/         route.js errors.js responses.js
│  ├─ rate-limit/  index.js config.js
│  ├─ mail/        index.js
│  ├─ i18n/        vi.js
│  └─ logger.js
├─ components/                             UI components
├─ prisma/         schema.prisma  migrations/
├─ tests/          unit/  integration/  e2e/  fixtures/
├─ docs/           MASTER_PROMPT.md  PROJECT_STATE.md  ARCHITECTURE.md  SECURITY.md  DECISIONS.md
├─ instrumentation.js                      runs env validation at startup
├─ Dockerfile  docker-compose.yml  .env.example  .github/workflows/ci.yml
```

**Layering rules (enforce with ESLint `no-restricted-imports` and `react/no-danger`)**

- Only `lib/dal/*` and `lib/auth/*` may import `lib/db`.
- Route Handlers and Server Components call `lib/dal/*`; they never call Prisma directly.
- Every `lib/dal/*` function takes `actor` (user or `null`) as its first parameter and enforces policy inside the query.

**URL rules**

- URLs describe resources, never the caller. NEVER put a role in a URL (`/admin/...`, `?role=...`). Caller-scoped resources use `/api/me/...`.
- API addresses skills by their random `id`. Human-readable `/s/[handle]/[slug]` is used for pages only.

**Route map (draft)**

| Method + path                                      | Access                  | Purpose                                                                            |
| -------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------- |
| `POST /api/skills`                                 | user                    | Create a skill from a zip, from files/folder (multipart), or from a blank template |
| `GET /api/skills?q&tag&sort&cursor`                | public                  | Search PUBLIC skills only                                                          |
| `GET /api/me/skills?q&tag&visibility&sort&cursor`  | user                    | The caller's library                                                               |
| `GET /api/skills/{id}`                             | public (policy decides) | Skill metadata + current version file list                                         |
| `PATCH /api/skills/{id}`                           | user                    | Change `tags` and `visibility` only                                                |
| `DELETE /api/skills/{id}`                          | user                    | Soft delete                                                                        |
| `POST /api/skills/{id}/versions`                   | user                    | Save changes as a new immutable version                                            |
| `GET /api/skills/{id}/files?path&version&inline`   | public (policy decides) | Read one file                                                                      |
| `GET /api/skills/{id}/download?version`            | public (policy decides) | Whole skill as zip                                                                 |
| `POST /api/skills/{id}/fork`                       | user                    | Fork into the caller's library                                                     |
| `POST /api/skills/{id}/share` / `DELETE`           | user                    | Enable/rotate or disable the share token (UNLISTED)                                |
| `GET /api/shared/{token}` + `/files` + `/download` | public                  | Read an UNLISTED skill by share token                                              |
| `POST /api/imports/github`                         | user                    | Import from a GitHub URL                                                           |
| `GET /api/health`, `GET /api/ready`                | public                  | Liveness, readiness (DB check)                                                     |
| `/api/auth/*`                                      | per Better Auth         | Authentication                                                                     |

Any endpoint not in the public column MUST return 401 without a valid session.

---

## 5. DATA MODEL (draft; refine in the plan)

- IDs are random UUID v4 (never sequential). All timestamps UTC.
- **User** (Better Auth tables + extra columns): `handle` (unique, 3–30 chars, `[a-z0-9-]`, no leading/trailing hyphen, reserved words blocked: admin, api, explore, settings, login, register, dashboard, import, share, s, www), `status` (`ACTIVE | DISABLED`).
- **Skill**: `id`, `ownerId`, `slug` (unique per owner, stable after creation, diacritics stripped), `name` and `description` (derived from SKILL.md frontmatter), `tags String[]` (max 10, each `[a-z0-9-]`, ≤ 30 chars), `visibility` (`PRIVATE | UNLISTED | PUBLIC`, default `PRIVATE`), `shareToken` (nullable unique, 128-bit random base64url, only set while `UNLISTED`), `currentVersionId`, `forkedFromId` (SET NULL on delete), `forkedFromVersionId`, `forkedFromSnapshot` (JSON: handle, slug, name at fork time), `sourceUrl`, `sourceCommit`, `searchText` (SKILL.md body, first 50k chars), `deletedAt`, `createdAt`, `updatedAt`.
- **SkillVersion** (IMMUTABLE): `id`, `skillId`, `number` (unique per skill), `message`, `contentHash`, `createdById`, `createdAt`. `contentHash` = SHA-256 of the sorted lines `"<path>\0<sha256>\n"`.
- **SkillFile**: `id`, `versionId`, `path` (normalized, `/` separators), `blobSha256`, `size`, `mimeType`, `isText`. Unique `(versionId, path)`.
- **Blob** (content-addressed): `sha256` (PK), `size`, `storageKey` (`blobs/<sha256>`), `createdAt`.
- **RateLimitBucket**: `key`, `windowStart`, `count`; PK `(key, windowStart)`.
- **AuditLog** (append-only: no update or delete code paths): `id`, `actorId`, `action`, `targetType`, `targetId`, `ip`, `userAgent`, `metadata` (JSON, never secrets), `createdAt`.
- Editing a skill = creating a new `SkillVersion` and moving `currentVersionId` in ONE transaction. Versions are never modified.
- Indexes: `Skill(ownerId, deletedAt)`, `Skill(visibility, deletedAt)`, GIN on `tags`, GIN on the search vector, trigram on `name`.
- Search: PostgreSQL full-text with the `simple` configuration + `unaccent` (wrapped in an IMMUTABLE SQL function) + `pg_trgm`, created in a migration. Weights: name A, tags and description B, `searchText` C. A search for "tim kiem" MUST match "tìm kiếm". Queries use `websearch_to_tsquery` and parameterized tagged-template raw SQL only.

---

## 6. SECURITY SPECIFICATION (non-negotiable)

**S1. Authentication**

- Better Auth, database-backed sessions. Cookie flags: `httpOnly`, `Secure` in production, `SameSite=Lax`. Session lifetime 7 days.
- Password: minimum 10 and maximum 128 characters. Login errors are generic ("Email hoặc mật khẩu không đúng"). Forgot-password returns the same response whether or not the email exists.
- Email verification and password reset (single-use tokens, expire in 1 hour) controlled by `REQUIRE_EMAIL_VERIFICATION` (default `true` in production). Changing the password revokes all other sessions.
- A `DISABLED` user is rejected on every request even with a valid session.
- **Source of truth for permissions: the database.** The session is resolved from the database on every request; no permissions are cached in cookies or tokens. Document this in `docs/ARCHITECTURE.md`.

**S2. Authorization**

- `lib/auth/policy.js`: pure functions `can(actor, action, resource)` with actions named `RESOURCE_ACTION`: `SKILL_READ`, `SKILL_WRITE`, `SKILL_DELETE`, `SKILL_FORK`, `SKILL_SET_VISIBILITY`. Check permissions, not role names, in business code. All rules live in this one module.
- Rules: the owner can do everything to their skill. PUBLIC skills are readable by anyone and forkable by any logged-in user. UNLISTED skills are readable ONLY through the share token (never through `/s/[handle]/[slug]` or `/api/skills/{id}` for non-owners). PRIVATE skills are readable only by the owner. Soft-deleted skills are invisible to everyone (including the owner, until Phase 2 trash).
- Response rule: if the actor cannot read the record, return **404** (do not reveal existence). If the actor can read but cannot modify, return **403**.
- The DAL enforces ownership and visibility inside the query (`where` clause), not after fetching.
- Mass assignment: zod schemas use `.strict()`. `ownerId`, `deletedAt`, `currentVersionId`, `shareToken`, `forkedFrom*` are NEVER accepted from the client.
- UI hiding of buttons is UX only. The server is the only enforcement.

**S3. API wrapper and error model**

- `lib/api/route.js` exports `route({ access: 'public' | 'user', rateLimit, schema }, handler)`. `access` is REQUIRED; a missing value throws at module load. The wrapper creates a `traceId` (also returned in the `x-trace-id` header), resolves the session, applies rate limiting, parses input with zod, and maps errors.
- CSRF: cookie-authenticated mutating requests (POST, PATCH, PUT, DELETE) MUST have an `Origin` header equal to the app origin, else 403 `CSRF_ORIGIN_MISMATCH`. No CORS headers are sent (same-origin only).
- ONE error shape for the whole API, including errors thrown in the wrapper and the catch-all route:
  `{ "error": { "code": "SKILL_NOT_FOUND", "message": "...", "traceId": "...", "details": [{ "field": "...", "message": "..." }] } }`
- Stable codes live in `lib/api/errors.js`. Required mappings: invalid JSON → 400 `INVALID_JSON`; zod failure → 422 `VALIDATION_FAILED` (details contain field and message, NEVER the submitted value); no session → 401 `UNAUTHENTICATED`; forbidden → 403 `FORBIDDEN`; hidden or missing → 404; unknown API route → 404 `ROUTE_NOT_FOUND`; Prisma unique violation → 409 `CONFLICT`; body too large → 413 `PAYLOAD_TOO_LARGE`; rate limited → 429 `RATE_LIMITED` + `Retry-After`; anything else → 500 `INTERNAL` with a generic message while the full error is logged server-side with the `traceId`.
- NEVER return stack traces, SQL, file paths or class names.

**S4. Rate limiting**

- PostgreSQL-backed fixed window (`RateLimitBucket`). Keys use IP and/or user id.
- IP source: if `TRUSTED_PROXY_HEADER` is set use that header, otherwise the socket address. NEVER trust `X-Forwarded-For` by default.
- Defaults (constants in `lib/rate-limit/config.js`): login 10 per 15 min per IP+email; register 5 per hour per IP; forgot-password 5 per hour per IP; upload/create/new-version 30 per hour per user; GitHub import 10 per hour per user; fork 60 per hour per user; share-token reads 120 per minute per IP; other authenticated API 120 per minute per user.
- If the limiter's database call fails: auth endpoints fail CLOSED (503), others log and continue.
- Include a cleanup of expired buckets.

**S5. Headers and browser hardening**

- Via `next.config.js` and/or middleware: `Content-Security-Policy` per the official Next.js CSP guide (nonce-based if feasible; any `unsafe-*` must be justified in `docs/SECURITY.md`), `img-src 'self' data:`, `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (deny camera, microphone, geolocation), HSTS in production.
- Do NOT rely on middleware alone for access control. Authorization is enforced in the DAL and route wrapper.

**S6. Ingestion pipeline (`lib/skills/ingest.js`)**
ONE module used by file upload, zip upload, GitHub import and (Phase 2) bulk import. Input: a stream of entries `{path, bytes}`. Output: a validated manifest + stored blobs. Rules:

1. Limits (all env-configurable, defaults): max file 10 MB; max skill total 50 MB; max 500 files per skill; max zip 50 MB compressed; max 200 MB uncompressed; max compression ratio 100:1; max zip entries 5000; max path depth 10; max path length 255.
2. Enforce limits on the ACTUAL decompressed bytes while streaming and abort immediately when exceeded. Declared sizes in zip headers can lie.
3. Normalize every path: Unicode NFC, backslash → `/`. REJECT: absolute paths, drive letters, `..` segments, empty segments, NUL or control characters, case-insensitive duplicates. Silently drop `__MACOSX/`, `.DS_Store`, `Thumbs.db`, `.git/`.
4. REJECT symlinks, hard links and device entries (check zip external attributes).
5. Extension allowlist in `lib/skills/file-types.js`. Text: md, markdown, txt, json, yaml, yml, toml, csv, tsv, xml, html, css, js, mjs, cjs, ts, py, sh, bash, ps1, rb, go, rs, sql, ini, cfg. Binary: png, jpg, jpeg, gif, webp, pdf, svg. Text files MUST be valid UTF-8 without NUL bytes. Binary files MUST match their magic bytes (SVG is XML text and download-only). REJECT executables and archives (exe, dll, so, dylib, bin, jar, msi, dmg, apk, zip nested, etc.).
6. REJECT secret-bearing filenames: `.env`, `.env.*` (except `.env.example`), `*.pem`, `*.key`, `*.p12`, `id_rsa*`, `.npmrc`, `.netrc`. Return a clear error so users do not store credentials by accident.
7. After stripping ONE wrapping top-level folder (only if every entry shares it), the skill MUST contain exactly one `SKILL.md` at the root (case-sensitive). Zero → `SKILL_MD_MISSING`. More than one → `MULTIPLE_SKILLS_USE_BULK_IMPORT` (bulk import arrives in Phase 2).
8. SKILL.md frontmatter: YAML block between `---` fences at the top, parsed with `yaml`. Errors (block creation): missing/invalid YAML, `name` not matching `^[a-z0-9]+(-[a-z0-9]+)*$` or longer than 64 chars, `description` missing/empty or longer than 1024 chars. Warnings (do not block): description shorter than 20 chars, empty body, SKILL.md over 500 lines. Return errors and warnings as a structured report that the UI renders.
9. Compute SHA-256 server-side. NEVER trust a client-supplied hash, MIME type or size. Store as `blobs/<sha256>` if absent.
10. Create `Skill`, `SkillVersion`, `SkillFile` rows in ONE transaction after blobs are stored. Orphaned blobs after a failure are acceptable (cleaned by a GC script in Phase 2).
11. Nothing from an uploaded skill is ever executed, imported or interpreted by the server.

**S7. GitHub import (SSRF defence)**

- Accept only `https://github.com/{owner}/{repo}` optionally followed by `/tree/{ref}/{subpath}`. `ref` is the FIRST path segment after `/tree/` (branch names containing `/` are unsupported in Phase 1; return a helpful error and suggest a tag or commit SHA).
- Parse with `new URL()`. Require protocol `https:`, hostname EXACTLY `github.com`, no username/password, port empty or 443. `owner` and `repo` must match `^[A-Za-z0-9_.-]{1,100}$`. `subpath` goes through the same path normalization as S6. Anything else → 422 `INVALID_GITHUB_URL`.
- The server may fetch ONLY `https://api.github.com/repos/{owner}/{repo}` (default branch, visibility) and `https://api.github.com/repos/{owner}/{repo}/zipball/{ref}`. Handle redirects MANUALLY (`redirect: 'manual'`): max 3 hops, each `Location` must be `https:` with hostname exactly `codeload.github.com` or `api.github.com`. Timeout 30 s. Abort once the downloaded bytes exceed `GITHUB_IMPORT_MAX_BYTES` (default 100 MB).
- Optional `GITHUB_TOKEN` env raises the server's API rate limit. It is sent ONLY to `api.github.com`, NEVER to other hosts, NEVER logged, NEVER exposed to the client. Public repositories only; private or missing repos return a friendly error. Handle GitHub 403/429 gracefully.
- Feed the extracted subpath into the S6 pipeline. Record `sourceUrl` and `sourceCommit` (parsed from the zipball's top folder name).

**S8. Serving files and rendering**

- Files are served ONLY through authorized routes. The storage bucket is private. NEVER return storage keys or presigned URLs to clients.
- Every file response: `X-Content-Type-Options: nosniff`, `Content-Security-Policy: sandbox`. Default `Content-Disposition: attachment; filename*=UTF-8''<encoded>`. Inline is allowed ONLY for text files up to 1 MB (served as `text/plain; charset=utf-8`) and raster images (png, jpeg, gif, webp). SVG, HTML and PDF are download-only.
- Preview text is rendered through React escaping only. Markdown uses react-markdown + remark-gfm + rehype-sanitize (default schema, no raw HTML); external links get `rel="noopener noreferrer nofollow" target="_blank"`; relative links to files inside the same skill become internal viewer links; remote images are not loaded (show the link instead).

**S9. Configuration and secrets**

- `lib/env.js` parses `process.env` with zod and is invoked from `instrumentation.js`. On failure log the NAMES of invalid variables (never values) and exit with code 1.
- `.env.example` contains placeholders only. `.env*` is git-ignored except `.env.example`. In production `BETTER_AUTH_SECRET` must be at least 32 chars and `STORAGE_DRIVER=local` is rejected.
- Env variables: `NODE_ENV`, `APP_URL`, `DATABASE_URL`, `BETTER_AUTH_SECRET`, `STORAGE_DRIVER`, `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`, `REQUIRE_EMAIL_VERIFICATION`, `TRUSTED_PROXY_HEADER`, `GITHUB_TOKEN`, `GITHUB_CLIENT_ID/SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `LOG_LEVEL`, and the limits from S6.

**S10. Logging and audit**

- pino JSON logs, one request log line per request: method, path, status, duration, `traceId`, userId. Redact `authorization`, `cookie`, `password`, `token`, `secret`. NEVER log request bodies or file contents.
- Authorization denials (403 and hidden-404) are logged at `warn` with actor id and resource id, to detect scanning.
- Write an `AuditLog` row for: register, login success, password change, password reset, session revoke, account delete, skill create, skill delete, visibility change, share token enable/rotate/disable, fork, GitHub import, new version.

**S11. Dependencies and supply chain**

- `npm ci` in CI. `npm audit --omit=dev --audit-level=high` MUST pass. Add `.github/dependabot.yml` for npm and GitHub Actions.

**S12. Account deletion**

- Settings page offers delete-account with password re-entry. It removes the user's sessions and skills (cascade) and writes an audit row. Blobs become orphans for the GC script.

---

## 7. PHASE 1 — MVP MILESTONES

Each milestone is outcome-based. A milestone is done only when ALL its acceptance criteria are true and its tests are green.

**M1.1 Foundation**

- Outcome: a running Next.js app with config validation, logging, error model, health endpoints, local infrastructure and CI.
- Includes: scaffold; ESLint (layering rules from section 4) + Prettier; `lib/env.js` + `instrumentation.js`; pino logger; `lib/api/route.js`, `errors.js`, catch-all 404; `docker-compose.yml` (app, PostgreSQL, MinIO with bucket bootstrap, and a separate `db_test` service); Prisma init + first migration (extensions `unaccent`, `pg_trgm`); `/api/health`, `/api/ready`; security headers; `.github/workflows/ci.yml`; `.env.example`.
- Accept when: `docker compose up` brings up all services; `/api/health` → 200; `/api/ready` → 200 only when the DB answers; an unknown `/api/x` → 404 in the standard error shape; the app exits with code 1 and names the variable when a required env var is missing.

**M1.2 Authentication and account**

- Outcome: users can register, verify email, log in, log out, reset password, manage sessions and delete their account.
- Includes: Better Auth configuration per S1; `handle` chosen at registration; pages login/register/forgot/reset/verify; guarded `(app)` layout; settings (change password, list and revoke sessions, delete account); mail driver (console in dev, SMTP in prod); rate limits per S4; audit events per S10; `lib/auth/policy.js` with its unit tests.
- Accept when: wrong password shows the generic message; the 11th login attempt in 15 minutes → 429; forgot-password response is identical for existing and unknown emails; a `DISABLED` user gets 401 with a previously valid session; unauthenticated access to `/dashboard` redirects to `/login`.
- Browser flow: register → verify (read the link from the dev console) → login → logout → reset password.

**M1.3 Storage and ingestion core**

- Outcome: a hardened pipeline that turns untrusted files or zips into validated, content-addressed skill versions.
- Includes: storage drivers (`s3`, `local`) behind one interface; all of S6; frontmatter validator with structured report; slug generator (strip Vietnamese diacritics, collision suffix `-2`, `-3`).
- Accept when: every adversarial case in section 9 is rejected with the right code and no blob is written for rejected input; a valid skill zip yields the expected manifest and `contentHash`; identical file content is stored once.

**M1.4 Skills: create, upload, metadata**

- Outcome: a user can create skills from a zip or `.skill` file, from multiple files or a whole folder (drag and drop, `webkitdirectory`), or from a blank template, and manage tags and visibility.
- Includes: `POST /api/skills`; `PATCH /api/skills/{id}` (tags, visibility only); `DELETE` (soft); share-token enable/rotate/disable; DAL + policy + audit; upload UI with progress and a per-file validation report (errors block, warnings inform); `/skills/new` page.
- Accept when: user B cannot read, patch or delete user A's PRIVATE skill (404) and cannot patch or delete A's PUBLIC skill (403); an UNLISTED skill is unreachable at `/s/<handle>/<slug>` for non-owners but readable at `/share/<token>`; rotating the token invalidates the old link at once; sending `ownerId` or `deletedAt` in a body is rejected.

**M1.5 Viewer and editor**

- Outcome: browse and edit a skill in the browser.
- Includes: viewer with file tree (keyboard navigable) and preview (rendered SKILL.md by default, text with line numbers, raster images, download-only for others); download single file; download skill as zip (`/download`, built with archiver, paths preserved); editor with CodeMirror for text files, add/remove/rename files, upload binary files, version message; saving creates a new immutable version via `POST /api/skills/{id}/versions`; name/description re-derived from SKILL.md on save.
- Accept when: a saved edit increments the version number and leaves older versions byte-identical; editing SKILL.md into invalid frontmatter is blocked with the validation report; the downloaded zip re-uploads successfully as a new skill with the same `contentHash`.
- Browser flow at 375/768/1440px: open a skill, navigate the tree with the keyboard, edit, save, download.

**M1.6 Fork and GitHub import**

- Outcome: clone skills into the user's library from inside the app or from GitHub.
- Includes: `POST /api/skills/{id}/fork` (allowed for the owner, for PUBLIC skills, and via share token for UNLISTED; the fork is PRIVATE; `SkillFile` rows point at the same blobs; attribution via `forkedFrom*` and the snapshot; slug collision handled); `POST /api/imports/github` per S7; import page with URL field and result report; "Forked from @handle/slug" and "Imported from GitHub" badges.
- Accept when: editing a fork never changes the source; deleting the source keeps the fork and its snapshot label; every URL case in section 9 (SSRF tests) behaves as specified; importing a small public repository that contains a `SKILL.md` (use `/tree/<ref>/<subpath>` form as well) succeeds in the browser.

**M1.7 Library and search**

- Outcome: users can find any skill fast.
- Includes: dashboard (grid and list view, filters by tag and visibility, sort by updated or name, cursor pagination, page size 20, max 50); `/explore` for PUBLIC skills; `GET /api/me/skills`; `GET /api/skills`; full-text search per section 5.
- Accept when: a PRIVATE or UNLISTED skill NEVER appears in `/explore` or in another user's results; accent-insensitive search works ("tim kiem" finds "tìm kiếm"); search input is parameterized (a SQL-injection payload returns normal results, never an error).

**M1.8 Hardening, docs, production build**

- Includes: complete the authorization matrix and error-case tests for EVERY endpoint; header assertions; Dockerfile (multi-stage, `output: 'standalone'`, non-root user, `HEALTHCHECK` on `/api/health`, no secrets baked in); `prisma migrate deploy` documented as the production migration step (NEVER `db push`); README, ARCHITECTURE, SECURITY, DECISIONS, PROJECT_STATE.
- Accept when: `docker compose up --build` from a clean checkout serves a working app; CI is green including `npm audit --omit=dev --audit-level=high`.

**M1.9 Final verification**

- Run the whole test suite and Playwright e2e (flows: register → create skill from zip → view → edit → download; second user forks a PUBLIC skill; GitHub import). Produce the Walkthrough Artifact and the section 14 checklist. STOP.

---

## 8. UI / UX REQUIREMENTS

- Tailwind + shadcn/ui. Clean, dense, readable "developer tool" look. Light and dark themes following the system preference, with a manual toggle.
- All UI strings in Vietnamese via `lib/i18n/vi.js`. Map every API error `code` to a Vietnamese message; unknown codes show a generic message plus the `traceId` for support.
- Responsive and verified at 375px, 768px, 1440px. No horizontal scroll on the page body (wide code or tables scroll inside their own container). Touch targets at least 44px on mobile.
- Accessibility: semantic HTML, visible focus states, labelled form fields, keyboard-operable file tree and dialogs, WCAG AA contrast.
- Every list has an empty state, a loading skeleton and an error state. Success and failure use toasts. Destructive actions (delete skill, delete account, rotate share link) use a confirmation dialog.
- Skill card: name, two-line description, tags, visibility badge, relative updated time, file count and size, fork/import badge.
- Skill page: header (name, `@owner`, visibility, version number), actions shown only when the policy allows (Download, Fork, Edit, Delete, Share), file tree on the left, preview on the right with SKILL.md rendered by default.
- Pages: landing, login, register, forgot/reset password, verify email, dashboard, new skill, import, settings, explore, skill viewer, skill editor, share viewer, a friendly 404 and error page.

---

## 9. TESTING REQUIREMENTS

Commands that MUST exist: `npm run lint`, `npm run test` (unit + integration on a REAL PostgreSQL from `db_test`, never a mock database), `npm run test:e2e` (Playwright), `npm run build`. Tests are written in the same milestone as the feature.

1. **Authorization matrix for EVERY endpoint**: no session → 401; invalid or expired session → 401; user A on user B's PRIVATE skill → 404; user A on B's PUBLIC skill: read OK, write and delete → 403; UNLISTED: unreachable by slug for non-owners, readable by token, absent from search; disabled user → 401; revoked permission or visibility change takes effect on the very next request.
2. **Mass assignment**: bodies containing `ownerId`, `deletedAt`, `currentVersionId`, `shareToken`, `forkedFromId` → 422.
3. **Error shape**: malformed JSON, missing fields, wrong types, unknown route, unique violation, oversized body, rate limit → correct 4xx with the standard shape, never 500.
4. **Ingestion fixtures (generated inside the tests, no committed binaries)**: `../` traversal, absolute path, backslash path, symlink entry, zip bomb (high ratio), lying declared size, too many entries, case-insensitive collision, duplicate entries, non-UTF-8 text, NUL byte in text, wrong magic bytes, forbidden filenames (`.env`, `id_rsa`, `*.pem`), executable extension, missing SKILL.md, multiple SKILL.md, invalid frontmatter, oversized file. Each must be rejected with the specified code and leave no stored blob.
5. **GitHub URL and fetch (mock `fetch`)**: accept `https://github.com/o/r`, `/tree/ref`, `/tree/ref/sub/path`; reject `http://`, `github.com.evil.com`, `https://user@github.com/o/r`, port 8443, IP hosts, other hosts, `..` in subpath, branch refs containing `/`; a redirect to any host other than `codeload.github.com` or `api.github.com` is aborted; download over the byte limit is aborted; the token is never sent to a non-GitHub host.
6. **Rate limit**: the 11th login attempt within the window → 429 with `Retry-After`.
7. **Search**: private and unlisted skills never leak; accent-insensitive; injection payloads are inert.
8. **Fork**: policy per source visibility, attribution, shared blobs, independent edits, source deletion.
9. **Headers**: security headers present on HTML, API and file responses.
10. **Policy unit tests**: a table-driven matrix of actor × action × visibility.

---

## 10. DEVOPS

- Dockerfile: multi-stage, `output: 'standalone'`, non-root user, `HEALTHCHECK`, no secrets in the image.
- `docker-compose.yml`: app, PostgreSQL, MinIO (+ bucket init), named volumes, everything driven by `.env`.
- CI (GitHub Actions): `npm ci` → lint → tests with a PostgreSQL service → build → `npm audit --omit=dev --audit-level=high`.
- Migrations: committed SQL, `prisma migrate deploy` in production, NEVER `prisma db push`, never edit an applied migration.
- README deployment section: Docker on a VPS is the primary target. Note that serverless platforms with small request-body limits need a direct-to-storage upload flow, which is NOT built in Phase 1.

---

## 11. DOCUMENTATION DELIVERABLES

- `README.md`: quick start (local), env variable table, scripts, deployment.
- `docs/ARCHITECTURE.md`: Mermaid diagram; decisions: single deployable, DB as the source of truth for sessions and permissions, content-addressed blobs, immutable versions, why Route Handlers only.
- `docs/SECURITY.md`: threat model, each control mapped to the test that proves it, CSP justifications, how to report a vulnerability.
- `docs/DECISIONS.md`: short ADR log. `docs/PROJECT_STATE.md`: resume file (updated every milestone).

---

## 12. PHASE 2 — DO NOT START UNTIL I WRITE `START PHASE 2`

Run Phase 2 in a NEW session: read `docs/MASTER_PROMPT.md` and `docs/PROJECT_STATE.md` first, then produce a Phase 2 Implementation Plan Artifact and wait for approval. Same rules, report format and gates apply. Schema changes only via NEW migrations.

- **M2.1 Version history UI**: list versions, open any version, line diff for text files (`diff`), rollback (creates a NEW version copying the old one; never mutates history), version messages.
- **M2.2 Bulk import**: a zip or folder containing many skills → discovery → dry-run preview table (path, name, validation status, duplicate flag by `contentHash` and by name) → user selects → create. Uses an `ImportSession` row with 1-hour TTL; max 50 skills per import; the S6 pipeline is reused.
- **M2.3 Collections**: private collections (name, description, ordered skills), add/remove/reorder, download a collection as a zip with one folder per skill. Tables `Collection`, `CollectionItem`.
- **M2.4 API tokens and `/api/v1`**: tokens `svt_` + 32 random bytes (base64url); store ONLY the SHA-256 hash, a short prefix and last 4 characters; show the full token once; scopes `skills:read` and `skills:write`; optional expiry; revoke; last-used time. Bearer-only endpoints: `GET /api/v1/skills`, `GET /api/v1/skills/{id}`, `GET /api/v1/skills/{id}/download`, `POST /api/v1/skills` (zip upload, needs `skills:write`). Rate-limit per token, audit token create/revoke, publish `docs/openapi.yaml`. Tests: 401 for invalid, revoked or expired tokens; 403 for insufficient scope; tokens never appear in logs.
- **M2.5 Quality of life**: favorites and pinning, recently opened, Ctrl+K command palette (`cmdk`) over the user's library, trash with restore for 30 days, `npm run purge:trash` and `npm run gc:blobs` (dry-run by default, `--apply` to act).
- **M2.6 Upstream tracking**: a "Có bản cập nhật" badge on forks and GitHub imports when upstream has a newer version or commit; "Sync" creates a new version if the fork has no local changes, otherwise shows a diff and requires an explicit choice.

---

## 13. OUT OF SCOPE (NEVER build unless I say so)

Admin panel; teams or workspaces; comments or ratings; billing; email notifications beyond auth emails; AI features; CLI or MCP server; security scanner for skill contents; two-factor authentication; SSO beyond env-gated GitHub/Google OAuth; analytics or telemetry; TypeScript migration; microservices; Redis; Elasticsearch; direct-to-storage presigned upload; any server-side execution of skill code.

---

## 14. DEFINITION OF DONE (Phase 1 checklist, reported in the Walkthrough)

- [ ] No URL contains a role or actor name; caller-scoped routes use `/api/me/...`.
- [ ] Every route declares `access`; the public list equals the route map exactly.
- [ ] Every endpoint taking an id, slug or token has a test "user A cannot read or modify user B's data".
- [ ] All error cases in section 9 return the standard error shape, never a 500.
- [ ] Responses and logs contain no passwords, tokens, secrets or stack traces.
- [ ] Schema exists only through migrations; migrations run from an empty database.
- [ ] `npm run lint`, `npm run test`, `npm run test:e2e`, `npm run build` all pass.
- [ ] No hardcoded secret; `.env.example` complete; startup fails fast on bad config.
- [ ] `npm audit --omit=dev --audit-level=high` passes; versions pinned and checked for support.
- [ ] Browser agent verified the required flows at 375px, 768px and 1440px with zero console errors.
- [ ] `docker compose up --build` works from a clean checkout.
- [ ] Docs in section 11 exist and match the code.

---

## 15. START

Begin NOW with **Phase 0**. Until I reply `APPROVED PHASE 0` you may create only files under `docs/` and the three Artifacts. Do not write application code, install packages or run migrations before that approval.
