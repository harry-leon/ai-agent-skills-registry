# SkillVault Architecture

This document describes the architectural principles, data flow, component boundaries, and security patterns of SkillVault.

---

## 1. System Topology

SkillVault is architected as a **single deployable** container running Next.js App Router on Node.js, backed by PostgreSQL and an S3-compatible object store.

```mermaid
flowchart TD
    Client["Client Browser / HTTP Client"]
    App["SkillVault Container (Next.js 15 Standalone)"]
    DB[("PostgreSQL 18 (unaccent + pg_trgm)")]
    Storage[("S3 Storage (MinIO / Cloudflare R2 / AWS S3)")]

    Client -->|"HTTPS / Cookie Session"| App
    App -->|"Prisma ORM & Parameterized SQL"| DB
    App -->|"S3 SDK (Streaming Upload / Download)"| Storage
```

---

## 2. Component Layering and Isolation

SkillVault strictly enforces layered boundaries. The frontend, route handlers, data access layer, policy engine, and database communicate in one direction only:

```mermaid
flowchart TD
    subgraph Presentation
        Page["Server & Client Components (app/*)"]
    end

    subgraph API
        Route["Route Handlers (app/api/*)"]
        Wrapper["API Route Wrapper (lib/api/route.js)"]
    end

    subgraph Business["Business & Data Layer"]
        Policy["Policy Engine (lib/auth/policy.js)"]
        DAL["Data Access Layer (lib/dal/*)"]
        Ingest["Ingestion Pipeline (lib/skills/ingest.js)"]
        Storage["Storage Driver (lib/storage/*)"]
    end

    subgraph Infrastructure
        Prisma["Prisma Client (lib/db.js)"]
        Postgres[("PostgreSQL Database")]
    end

    Page --> Route
    Route --> Wrapper
    Wrapper --> DAL
    DAL --> Policy
    DAL --> Prisma
    DAL --> Ingest
    Ingest --> Storage
    Prisma --> Postgres
```

### Strict Layering Rules (Enforced by ESLint)

1. **Prisma Client Isolation**: Only `lib/dal/*` and `lib/auth/*` may import `lib/db.js`. Route handlers and UI components are strictly forbidden from calling Prisma or raw database queries directly.
2. **Actor Scoping**: Every function in `lib/dal/*` accepts `actor` (the authenticated user object or `null`) as its first parameter and applies ownership and visibility filters directly inside the SQL `where` clause.
3. **No Server Actions**: All state mutations must flow through explicit HTTP Route Handlers wrapped by `lib/api/route.js`. This ensures predictable CSRF origin checks, schema validation, rate limiting, and centralized error logging.

---

## 3. Authentication & Authorization Flow

SkillVault treats the **PostgreSQL database as the sole source of truth for identity and permissions**.

```mermaid
sequenceDiagram
    autonumber
    actor User as Client Browser
    participant Wrapper as Route Wrapper (lib/api/route.js)
    participant Auth as Better Auth / DB Session
    participant DAL as Data Access Layer (lib/dal/*)
    participant Policy as Policy Engine (lib/auth/policy.js)
    participant DB as PostgreSQL Database

    User->>Wrapper: HTTP Request (Cookie: session_token)
    Wrapper->>Auth: Resolve Session from DB
    Auth-->>Wrapper: Actor Object (id, handle, role, status)
    
    alt Status is DISABLED
        Wrapper-->>User: 401 UNAUTHENTICATED
    end

    Wrapper->>DAL: Call DAL Function(actor, resourceId, input)
    DAL->>DB: Query Resource (scoped by actor & visibility)
    DAL->>Policy: can(actor, ACTION, resource)
    
    alt Unauthorized & Resource is PRIVATE/UNLISTED
        DAL-->>Wrapper: Throw 404 NOT_FOUND (IDOR Protection)
        Wrapper-->>User: 404 Standard Error Shape
    else Unauthorized & Resource is PUBLIC
        DAL-->>Wrapper: Throw 403 FORBIDDEN
        Wrapper-->>User: 403 Standard Error Shape
    else Authorized
        DAL->>DB: Execute Mutation / Query
        DAL-->>Wrapper: Result Data
        Wrapper-->>User: 200 OK / 201 Created
    end
```

### Authorization Rules (`lib/auth/policy.js`)

- `SKILL_READ`: Owner can read any skill; anyone can read `PUBLIC` skills; `UNLISTED` skills are accessible only with the exact `shareToken`; `PRIVATE` skills are invisible to everyone except the owner.
- `SKILL_WRITE` & `SKILL_DELETE`: Only the owning user may modify metadata, upload new versions, or soft-delete a skill.
- `SKILL_FORK`: Permitted for the owner, for any logged-in user on a `PUBLIC` skill, and via valid `shareToken` for an `UNLISTED` skill.

---

## 4. Ingestion Streaming Pipeline

Untrusted skill archives and files are ingested via a unified streaming pipeline (`lib/skills/ingest.js`):

```mermaid
flowchart TD
    Upload["Input ZIP Stream / Multipart Files"]
    StreamGuard["Streaming Limit Monitor (10MB file / 50MB skill / 100:1 ratio)"]
    PathNorm["Path Normalization (Unicode NFC, no .., no absolute, no control chars)"]
    FilterList["Security Deny List (.env, *.pem, id_rsa*, executables)"]
    Frontmatter["SKILL.md Validator (YAML parser, name regex, length bounds)"]
    Hasher["SHA-256 Content-Addressed Hash Generator"]
    BlobStorage["Blob Storage (blobs/<sha256>)"]
    DBTransaction["Atomic DB Transaction (Skill, SkillVersion, SkillFile)"]

    Upload --> StreamGuard
    StreamGuard --> PathNorm
    PathNorm --> FilterList
    FilterList --> Frontmatter
    Frontmatter --> Hasher
    Hasher --> BlobStorage
    BlobStorage --> DBTransaction
```

### Deduplication and Content Addressing

- Every file is hashed with server-calculated SHA-256 (`blobSha256`).
- Identical files across multiple skills or versions point to the same row in `Blob`.
- Forking a skill creates a new `Skill` and `SkillVersion` record, but reuses existing `SkillFile` rows pointing to existing blobs without duplicating storage.

---

## 5. Full-Text Search Architecture

Search across public skills (`/explore`) and owner libraries (`/dashboard`) is powered by PostgreSQL full-text search:

```mermaid
flowchart LR
    SearchQuery["Search Input: 'tim kiem'"]
    Unaccent["immutable_unaccent()"]
    TsQuery["websearch_to_tsquery('simple', ...)"]
    GINIndex["Weighted GIN tsvector Index (Name: A, Desc: B, Tags: B, Body: C)"]
    Results["Ranked Matching Skills"]

    SearchQuery --> Unaccent
    Unaccent --> TsQuery
    TsQuery --> GINIndex
    GINIndex --> Results
```

1. **Accents Invariance**: The database uses an `immutable_unaccent` function wrapper to ensure searches like `tim kiem` match `tìm kiếm`.
2. **Deterministic Cursor Pagination**: Results are paginated via keyset cursor pagination with composite tie-breakers on `(updatedAt, id)` or `(name, id)` to prevent duplicate or skipped items across pages.
