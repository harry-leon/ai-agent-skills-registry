# Skillary

Open-source AI agent skills registry, package manager, and code inspector.

English | [Tiếng Việt](README.vi.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-24.x-green.svg)](package.json)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black.svg)](package.json)
[![Tests](https://img.shields.io/badge/Tests-155%20passed-success.svg)](tests/)

Skillary is a private-by-default, multi-user web application and package registry designed to publish, search, inspect, download, and fork standardized **AI Agent Skills** (`SKILL.md`).

---

## Key Capabilities

- **Unified Web & CLI Registry**: Browse curated community skills or install them directly into agent workspaces using `npx skillary add @owner/slug`.
- **Private-by-Default Architecture**: Granular visibility controls (`PRIVATE`, `UNLISTED`, `PUBLIC`) with strict IDOR prevention returning `404 Not Found` for unauthorized lookups.
- **Content-Addressed Deduplication**: File payloads are deduplicated via server-calculated SHA-256 hashes (`blobs/<sha256>`). Forking a skill creates zero blob duplicates.
- **Hardened Ingestion Pipeline**: Streaming ZIP validation that blocks Zip Slip (`../`), zip bombs, symlinks, secret files (`.env`, `id_rsa`), and executable binaries.
- **SSRF-Defended GitHub Import**: Direct repository imports with hostname validation, manual redirect caps, and isolation of personal access tokens.
- **Resource Limits & Free-Tier Optimization**: Strict 200 KB per-file ceiling, 10 MB per-account total storage quota, and 5 MB compressed package limits.
- **Bilingual Full-Text Search**: PostgreSQL full-text search vector with unaccent indexing and `pg_trgm` fuzzy matching.
- **Interactive In-Browser Editor**: Split-screen file tree navigation, CodeMirror text editing, and sanitized Markdown previewing.

---

## Quickstart

### Prerequisites

- **Node.js**: v20+ (v24 LTS recommended)
- **PostgreSQL**: 15+ with `unaccent` and `pg_trgm` extensions enabled
- **Docker** (optional): for containerized deployment

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/HarryLeon/Skillary.git
cd Skillary
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set your database connection string and a secret key with at least 32 characters:

```env
APP_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/skillary?schema=public
BETTER_AUTH_SECRET=skillary_super_secret_session_key_32_characters_minimum
STORAGE_DRIVER=local
STORAGE_LOCAL_DIR=./storage/blobs
```

### 3. Apply Database Migrations & Seed Data

```bash
npx prisma migrate dev
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Package Installation via CLI

Every public or shared unlisted skill can be added to your AI agent projects via NPX:

```bash
npx skillary add @owner/skill-name
```

To install an unlisted skill via secret share token:

```bash
npx skillary add @owner/skill-name --token <share-token>
```

---

## Storage & Ingestion Limits

Skillary is tuned for resource-conscious deployments and cloud free-tier hosting:

| Boundary | Limit | Enforced At |
| :--- | :--- | :--- |
| **Max file size** | `200 KB` | File Ingestion Pipeline & API Validation |
| **Max account storage** | `10 MB` | DAL Transaction Checks (`createSkill`, `createVersion`) |
| **Max compressed package** | `5 MB` | Upload Form & ZIP Decompressor |
| **Max uncompressed skill** | `15 MB` | Streaming Zip Reader |
| **Max files per skill** | `100` | Ingest Pipeline (`MAX_SKILL_FILES`) |
| **Allowed direct upload formats** | `.zip`, `.skill`, `.md`, `.txt` | API Route Handlers |

---

## Production Deployment (Docker)

Skillary provides a standalone production container with a non-root runtime user (`nextjs:nodejs`):

```bash
docker compose up --build -d
```

This launches:
- `skillary-app`: Next.js production server with automated healthcheck (`/api/health`)
- `skillary-db`: PostgreSQL with `unaccent` and `pg_trgm`
- `skillary-minio`: S3-compatible blob storage

For database migrations in production:

```bash
npx prisma migrate deploy
```

---

## Configuration Reference

| Variable | Required | Default | Purpose |
| :--- | :---: | :---: | :--- |
| `NODE_ENV` | Yes | `development` | Environment mode (`development`, `production`, `test`) |
| `APP_URL` | Yes | `http://localhost:3000` | Canonical origin for CSRF and link generation |
| `DATABASE_URL` | Yes | - | PostgreSQL connection URL |
| `BETTER_AUTH_SECRET` | Yes | - | Secret key for session encryption (>= 32 chars) |
| `STORAGE_DRIVER` | Yes | `local` | `local` for disk storage or `s3` for MinIO / AWS S3 / R2 |
| `MAX_FILE_BYTES` | No | `204800` (200 KB) | Maximum size per ingested file |
| `MAX_ACCOUNT_TOTAL_BYTES`| No | `10485760` (10 MB) | Total storage quota allocated per user |
| `S3_BUCKET` | If s3 | - | Bucket name for blob storage |
| `GITHUB_TOKEN` | No | - | Optional token to increase GitHub API rate limits |
| `LOG_LEVEL` | No | `info` | Logging verbosity (`debug`, `info`, `warn`, `error`) |

---

## Scripts & Verification

```bash
# Run unit and integration tests (155 tests)
npm test

# Run browser E2E test suite
npm run test:e2e

# Run linter
npm run lint

# Check code formatting
npm run format:check
```

---

## Security Architecture

- **No Arbitrary Code Execution**: Skills are passive instruction files, documentation, and prompt assets. Skillary never executes user-uploaded code on the server.
- **Defense-in-Depth Sanitization**: Markdown rendered with `react-markdown` + `rehype-sanitize`. Dangerous tags like `<script>`, `<iframe>`, and `object` are stripped.
- **Strict Download Headers**: Raw file endpoints enforce `X-Content-Type-Options: nosniff`, `Content-Security-Policy: sandbox`, and `Content-Disposition: attachment` for executable or ambiguous mime types.
- **CSRF & Origin Verification**: Mutating routes (`POST`, `PATCH`, `DELETE`) reject mismatched cross-origin calls.

---

## License

Released under the [MIT License](LICENSE).  
Copyright &copy; 2026 HarryLeon.
