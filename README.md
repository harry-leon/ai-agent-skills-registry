# SkillVault

SkillVault is a secure, private-by-default, multi-user web application designed to store, organize, search, upload, download, and clone **Agent Skills** for AI agents.

An Agent Skill is a standardized folder containing a `SKILL.md` file (YAML frontmatter + Markdown body) along with optional scripts, reference documents, and assets.

---

## Features

- **Single Deployable Architecture**: Built on Next.js 15 (App Router), React 19, and JavaScript (ES Modules). No separate backend service or microservice complexity.
- **Robust Authentication & Session Management**: Powered by Better Auth with the Prisma PostgreSQL adapter. Database-backed sessions stored in `httpOnly`, `SameSite=Lax`, secure cookies.
- **Strict Authorization & IDOR Defense**: Uniform access control implemented in `lib/auth/policy.js` (`can(actor, action, resource)`). Missing permissions return `404` to prevent leaking private resource existence.
- **Content-Addressed Blob Storage**: Files are deduplicated globally via server-calculated SHA-256 hashes (`blobs/<sha256>`). Forking skills creates zero blob copies.
- **Streaming Ingestion & ZIP Security**: Ingestion pipeline (`lib/skills/ingest.js`) protects against path traversal (`../`), zip bombs, excessive compression ratios, symlinks, secret files (`.env`, `id_rsa`), and executable extensions.
- **SSRF-Defended GitHub Import**: Strict URL parsing and allowlists (`api.github.com` and `codeload.github.com`), manual redirect hops validation, and token isolation.
- **Full-Text Vietnamese Search**: PostgreSQL full-text search vector with `simple` configuration, immutable unaccent wrapper, and `pg_trgm` GIN indexes.
- **Developer-Centric Code Editor**: In-browser viewing and editing powered by CodeMirror 6 and GFM-compliant sanitized Markdown preview.

---

## Quickstart (Local Development)

### Prerequisites

- Node.js LTS (v24.x recommended)
- PostgreSQL 18 with `unaccent` and `pg_trgm` extensions enabled
- Docker (optional, for running local PostgreSQL & MinIO via `docker compose`)

### 1. Clone & Install

```bash
git clone https://github.com/your-org/skillvault.git
cd skillvault
npm ci
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Ensure `DATABASE_URL` points to your PostgreSQL instance, and `BETTER_AUTH_SECRET` has at least 32 characters:

```env
APP_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/skillvault?schema=public
BETTER_AUTH_SECRET=skillvault_super_secret_session_key_32_characters_minimum
STORAGE_DRIVER=local
```

### 3. Run Migrations

```bash
npx prisma migrate dev
```

### 4. Start the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Production Deployment (Docker)

SkillVault is packaged into a production-ready, multi-stage Docker container utilizing Next.js `standalone` output and non-root execution (`nextjs:nodejs`).

### 1. Launch with Docker Compose

```bash
docker compose up --build -d
```

This brings up:
1. `skillvault-db`: PostgreSQL 18 with persistent volume
2. `skillvault-minio`: MinIO S3-compatible object storage
3. `skillvault-minio-init`: One-off bucket provisioning
4. `skillvault-app`: SkillVault Next.js container on port 3000 with automatic healthcheck (`/api/health`)

### 2. Production Database Migrations

In production, **NEVER** run `prisma db push` or `prisma migrate dev`. Always run:

```bash
npx prisma migrate deploy
```

---

## Environment Variables Reference

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `NODE_ENV` | Yes | `development` | Runtime environment (`development`, `production`, `test`) |
| `APP_URL` | Yes | `http://localhost:3000` | Canonical application URL (used for CORS/CSRF origin checks) |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | - | 32+ character secret for session token hashing |
| `STORAGE_DRIVER` | Yes | `local` | `local` (dev only) or `s3` (production/MinIO/R2) |
| `S3_ENDPOINT` | If s3 | - | Custom S3 endpoint URL (e.g. MinIO or Cloudflare R2) |
| `S3_REGION` | If s3 | `us-east-1` | S3 region |
| `S3_BUCKET` | If s3 | - | Target blob bucket name |
| `S3_ACCESS_KEY_ID` | If s3 | - | AWS/S3 access key ID |
| `S3_SECRET_ACCESS_KEY` | If s3 | - | AWS/S3 secret access key |
| `S3_FORCE_PATH_STYLE` | No | `false` | Set to `true` for MinIO path-style bucket URLs |
| `SMTP_HOST` | No | - | SMTP server hostname for transactional emails |
| `SMTP_PORT` | No | `587` | SMTP server port |
| `SMTP_USER` | No | - | SMTP username |
| `SMTP_PASSWORD` | No | - | SMTP password |
| `MAIL_FROM` | No | `noreply@skillvault.local` | Sender address for transactional emails |
| `REQUIRE_EMAIL_VERIFICATION` | No | `false` (dev) / `true` (prod) | Enforce email verification before login |
| `TRUSTED_PROXY_HEADER` | No | - | Header containing real client IP (e.g. `cf-connecting-ip`) |
| `GITHUB_TOKEN` | No | - | Optional GitHub Personal Access Token to raise rate limits |
| `LOG_LEVEL` | No | `info` | Pino logging level (`trace`, `debug`, `info`, `warn`, `error`) |

---

## Available Scripts

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `next dev` | Start development server with hot-reload |
| `npm run build` | `next build` | Create optimized production standalone build |
| `npm start` | `next start` | Run production server |
| `npm run lint` | `eslint .` | Lint codebase with ESLint layering rules |
| `npm run format:check` | `prettier --check .` | Check code formatting |
| `npm run format:write` | `prettier --write .` | Format all source files |
| `npm test` | `vitest run` | Run full unit and integration test suite on real PostgreSQL |
| `npm run test:e2e` | `playwright test` | Run Playwright browser test suite across 375px, 768px, 1440px |

---

## Security Architecture

- **No Server-Side Execution**: Uploaded or imported skills are treated as strictly passive text and assets. Code from skills is never executed, evaluated, or shelled out to.
- **Layering Boundary**: Only `lib/dal/*` and `lib/auth/*` may import Prisma (`lib/db.js`). Route Handlers and Server Components never execute raw database queries.
- **Universal Error Envelope**: Every endpoint returns `{ error: { code, message, traceId, details } }`. No stack traces, file paths, or SQL queries are exposed.
- **Sanitized Markdown Rendering**: Rendered via `react-markdown` + `remark-gfm` + `rehype-sanitize`. Raw HTML (`rehype-raw`) is strictly prohibited.
