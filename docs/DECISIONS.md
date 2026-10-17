# Architectural Decision Records (ADRs)

This document records the architectural and technology decisions made for SkillVault, along with their context, rationale, and consequences.

---

## ADR-001: Next.js App Router with Route Handlers Only (No Server Actions)

### Status
Accepted

### Context
SkillVault requires strict control over HTTP requests, including custom rate limiting, CSRF origin verification, standardized error envelopes, and request tracing. Next.js Server Actions abstract HTTP transport, making header assertions, status codes, and fine-grained middleware integration opaque and harder to audit.

### Decision
All state mutations and queries are implemented using standard Next.js Route Handlers (`app/api/*`) wrapped by a universal route wrapper (`lib/api/route.js`). Server Actions are strictly forbidden. Source code is written in modern JavaScript (ES Modules) with JSDoc annotations; no TypeScript source files are introduced to keep the build fast, simple, and dependency-light.

### Consequences
- **Positive**: Full visibility over HTTP request headers, status codes, and response envelopes. Clear, testable endpoints using standard `fetch` and Vitest integration tests.
- **Negative**: Requires writing standard API wrapper functions and JSON schemas manually.

---

## ADR-002: Better Auth with Database-Backed Sessions as Single Source of Truth

### Status
Accepted

### Context
Session persistence and authorization state must be instant, revocable, and immune to stale cookie tampering. User accounts can be disabled, and password updates must immediately invalidate sessions across all devices.

### Decision
Better Auth is configured with the Prisma adapter to store sessions directly in PostgreSQL. Sessions are tracked via httpOnly, secure, SameSite=Lax cookies. On every request, the database validates that the session exists and that the user's status is `ACTIVE`. Permissions are never baked into cookies or JWT tokens.

### Consequences
- **Positive**: Immediate revocation on password change or account disablement. Zero token staleness issues.
- **Negative**: One database lookup per authenticated request (mitigated by indexed `Session.token`).

---

## ADR-003: Content-Addressed Blob Storage with Zero-Copy Forking

### Status
Accepted

### Context
Users frequently duplicate, version, or fork skills with minor modifications or identical assets. Storing duplicate copies of large files consumes excessive storage and network bandwidth.

### Decision
SkillVault stores all file payloads in a content-addressed `Blob` table keyed by server-computed SHA-256 (`blobs/<sha256>`). `SkillFile` rows link a specific skill version to a blob. When a skill is forked, new `SkillFile` rows point directly to existing blobs, achieving zero storage duplication and instantaneous cloning.

### Consequences
- **Positive**: Eliminates file redundancy. Fast, zero-byte forks. Content integrity guaranteed by SHA-256.
- **Negative**: Requires orphan cleanup (garbage collection script) when skills or versions are permanently deleted.

---

## ADR-004: Centralized Policy Engine (`can(actor, action, resource)`)

### Status
Accepted

### Context
Access control scattered across UI components and database queries leads to IDOR vulnerabilities and inconsistent permissions.

### Decision
All permission rules are consolidated into a single pure module (`lib/auth/policy.js`). Functions take the form `can(actor, action, resource)`. UI components use this for visual rendering, while the Data Access Layer (DAL) enforces it inside SQL queries. If an actor has no permission to read a `PRIVATE` or `UNLISTED` resource, the system returns `404 NOT_FOUND` rather than `403` to prevent leaking existence.

### Consequences
- **Positive**: Single point of audit for all authorization logic. Strong IDOR immunity.
- **Negative**: Requires disciplined use of the policy function in all DAL methods.

---

## ADR-005: Dual Storage Drivers (`s3` and `local`)

### Status
Accepted

### Context
Developers need a frictionless setup that runs locally without external cloud dependencies, while production requires scalable S3-compatible storage (AWS S3, MinIO, Cloudflare R2).

### Decision
A unified storage interface (`lib/storage/index.js`) dispatches to either `@aws-sdk/client-s3` (`s3.js`) or local disk (`local.js`) based on `STORAGE_DRIVER`. In production (`NODE_ENV=production`), `STORAGE_DRIVER=local` is rejected at startup.

### Consequences
- **Positive**: Zero-config local development; drop-in S3 compatibility for production.
- **Negative**: Both drivers must maintain identical streaming semantics.

---

## ADR-006: Streaming Decompression with Active Byte Accounting

### Status
Accepted

### Context
Malicious ZIP files (zip bombs, excessive compression ratios, or directory traversal headers) can cause denial-of-service or disk exhaustion. Declared headers in archives cannot be trusted.

### Decision
`lib/skills/ingest.js` streams decompressed bytes using `yauzl`, tracking actual uncompressed byte counts in real time. If total bytes exceed 200MB, or compression ratio exceeds 100:1, the stream is aborted immediately before allocating disk or memory.

### Consequences
- **Positive**: Complete defense against zip bombs and lying headers.
- **Negative**: Requires streaming pipe management and manual abort controllers.

---

## ADR-007: PostgreSQL Full-Text Search with Unaccent Wrapper & Keyset Pagination

### Status
Accepted

### Context
Searching Agent Skills requires multilingual support (including Vietnamese accents), high performance, and deterministic pagination without the operational overhead of external search engines like Elasticsearch.

### Decision
PostgreSQL full-text search vector with `websearch_to_tsquery('simple', ...)` combined with an `immutable_unaccent()` wrapper and `pg_trgm` GIN index. Keyset cursor pagination uses composite tie-breakers on `(updatedAt, id)`.

### Consequences
- **Positive**: Zero additional infrastructure; fast, accent-insensitive search; resilient pagination.
- **Negative**: Requires PostgreSQL extensions (`unaccent`, `pg_trgm`) to be enabled in migrations.
