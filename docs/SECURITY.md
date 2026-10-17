# SkillVault Security Specification & Threat Model

SkillVault is designed from the ground up with a **security-first, default-deny** posture. This document describes the threat model, mitigation controls, and tests proving those controls.

---

## 1. Threat Model & Verification Matrix

| Asset | Threat | Mitigation Control | Proving Test Suite |
|---|---|---|---|
| **User Accounts & Sessions** | Credential stuffing & brute-force | PostgreSQL-backed rate limiting (10 attempts/15min) + generic error message | `tests/integration/auth.test.js` |
| **User Sessions** | Stale session persistence after password change | Session invalidation across all devices on password update | `tests/integration/auth.test.js` |
| **Disabled Accounts** | Continued access by disabled users | `lib/auth/session.js` validates `status === ACTIVE` against database on every request | `tests/integration/auth.test.js` |
| **Private Skill Contents** | Insecure Direct Object Reference (IDOR) | DAL queries scoped by `ownerId`; unauthorized requests return `404` to prevent leaking existence | `tests/integration/security-matrix.test.js` |
| **Public Skills** | Unauthorized modification or deletion | Route wrapper enforces `can(actor, SKILL_WRITE, skill)` returning `403 FORBIDDEN` | `tests/integration/security-matrix.test.js` |
| **Unlisted Skills** | Discovery via handle/slug or search | Unlisted skills excluded from search and `/s/[handle]/[slug]`; accessible strictly via high-entropy `shareToken` | `tests/integration/security-matrix.test.js` |
| **Skill Metadata** | Mass assignment / privilege escalation | Zod `.strict()` schemas reject `ownerId`, `deletedAt`, `shareToken`, and `forkedFromId` with `422` | `tests/integration/security-matrix.test.js` |
| **File Storage** | Path traversal (`../`, absolute paths, control chars) | `lib/skills/paths.js` normalizes Unicode NFC, strips `..`, blocks absolute paths & NUL bytes | `tests/unit/ingest.test.js` |
| **Server Resources** | ZIP bomb / decompression bomb | Streaming byte-count monitor aborts if uncompressed size > 200MB or compression ratio > 100:1 | `tests/unit/ingest.test.js` |
| **Server Security** | Malicious executable / script storage | Extension allowlist (`lib/skills/file-types.js`) rejects `.exe`, `.so`, `.sh` binaries and checks magic bytes | `tests/unit/ingest.test.js` |
| **Credentials** | Accidental commit of secrets in skills | Ingestion pipeline rejects `.env`, `.env.*`, `*.pem`, `*.key`, `id_rsa*`, `.npmrc` | `tests/unit/ingest.test.js` |
| **Local Infrastructure** | SSRF via GitHub Import | Hostname restricted to `api.github.com` & `codeload.github.com`; manual redirect validation; token isolation | `tests/integration/fork-import.test.js` |
| **Internal Secrets** | Secret leakage in logs or error messages | Universal error envelope `{ error: { code, message, traceId } }`; zero stack traces; Pino redaction | `tests/integration/security-matrix.test.js` |
| **Browser Execution** | Stored XSS via uploaded HTML/SVG files | Files served with `Content-Security-Policy: sandbox` and `X-Content-Type-Options: nosniff`; SVG download-only | `tests/integration/security-matrix.test.js` |
| **Browser Execution** | Stored XSS via Markdown preview | Rendered via `react-markdown` + `remark-gfm` + `rehype-sanitize`; `rehype-raw` strictly prohibited | `tests/integration/viewer-editor.test.js` |
| **State Mutations** | Cross-Site Request Forgery (CSRF) | All mutating Route Handlers require matching `Origin` header | `tests/integration/security-matrix.test.js` |

---

## 2. Ingestion Defense Pipeline (Rule S6)

Untrusted archives and uploaded files pass through multiple validation layers before storage:

1. **Size Limits**:
   - Max file size: 10 MB
   - Max skill total size: 50 MB
   - Max files per skill: 500
   - Max zip compressed: 50 MB
   - Max zip uncompressed: 200 MB
   - Max compression ratio: 100:1
   - Max path depth: 10 levels
   - Max path length: 255 characters
2. **Path Normalization**:
   - Normalized to Unicode NFC.
   - Forward slashes (`/`) only.
   - Rejects directory traversal (`..`), absolute paths, Windows drive letters, empty segments, and control characters.
   - Automatically strips OS metadata artifacts (`__MACOSX`, `.DS_Store`, `Thumbs.db`, `.git/`).
3. **Extension & Content Allowlist**:
   - Text files must be valid UTF-8 without NUL bytes.
   - Binary files must match validated magic bytes (PNG, JPEG, GIF, WEBP, PDF).
   - Executable files (`.exe`, `.dll`, `.so`, `.dylib`, `.jar`, `.msi`) are rejected.
4. **Secret File Rejection**:
   - Files matching `.env`, `.env.*` (except `.env.example`), `*.pem`, `*.key`, `*.p12`, `id_rsa*`, `.npmrc`, `.netrc` are immediately blocked.

---

## 3. SSRF Defense for GitHub Import (Rule S7)

When importing repositories from GitHub, the server enforces strict boundaries:

1. **URL Validation**: Must match `https://github.com/{owner}/{repo}` with optional `/tree/{ref}/{subpath}`. Userinfo, port overrides, IP addresses, and non-GitHub hostnames are rejected with 422.
2. **Host Allowlist**: The server initiates HTTP requests only to `https://api.github.com/`.
3. **Manual Redirect Inspection**: Handled manually (`redirect: 'manual'`) with a maximum of 3 hops. Every `Location` header must resolve to `codeload.github.com` or `api.github.com`.
4. **Token Isolation**: If configured, `GITHUB_TOKEN` is passed strictly to `api.github.com`. It is never forwarded to redirect targets, never logged, and never exposed to the client.

---

## 4. Content Security Policy (CSP) Justifications (Rule S5)

SkillVault enforces the following CSP header across all pages:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

- `'unsafe-eval'`: Required by CodeMirror 6's dynamic parser grammar execution in the in-browser code editor.
- `'unsafe-inline'`: Required for Tailwind CSS runtime stylesheet injections and Next.js hydration scripts.
- `frame-ancestors 'none'`: Prevents clickjacking by blocking iframe embedding everywhere.
- `Content-Security-Policy: sandbox`: Applied to all raw file download responses to neutralize script execution inside downloaded documents.

---

## 5. Vulnerability Reporting

If you discover a security vulnerability in SkillVault, please report it via private email to:

`security@skillvault.local`

Please do not open public issues for suspected vulnerabilities. We acknowledge reports within 48 hours and provide a fix timeline.
