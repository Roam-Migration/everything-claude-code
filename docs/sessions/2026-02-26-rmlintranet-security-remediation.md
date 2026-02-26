# Session: RML Intranet Security Remediation
**Date:** 2026-02-26
**Branch:** `troubleshoot/notion-integration` (Rmlintranetdesign)
**Status:** P0 + P1 complete, deployed. P2 deferred post Notion/Supabase integration.

---

## What Was Done

### Dependabot Vulnerabilities (Both Repos)
- **Rmlintranetdesign**: Added npm `overrides` for `tar >=7.5.8` (CVE-2026-26960) and `rollup >=4.59.0` (CVE-2026-27606). Also removed stale `pnpm.overrides` block (was silently ignored — project uses npm).
- **rml-shared-components**: Added npm `overrides` for `rollup >=4.59.0`, `esbuild >=0.25.0`, `minimatch >=9.0.6`, `ajv >=8.17.1`. Both repos now return `found 0 vulnerabilities`.
- Committed to `troubleshoot/notion-integration` (Intranet) and `main` (shared-components).

### Credential Rotation + Secret Manager
- Rotated all three credentials: Supabase service role key (v3), Notion API key (v3), Metabase embed secret (v1 new secret).
- Moved `METABASE_EMBED_SECRET_KEY` from plaintext in `cloudbuild.yaml` to `metabase-embed-secret:latest` in GCP Secret Manager (IAM binding granted to Cloud Build SA).
- Secret names: `supabase-service-key`, `notion-api-key`, `metabase-embed-secret`.

### P1 Code Fixes (backend/)
| File | Fix |
|---|---|
| `src/routes/notion.ts:168` | Added auth + admin role check to `POST /cache/clear` |
| `src/routes/staff.ts:140` | Removed `details: error.message` from 500 response |
| `src/routes/leave.ts:213` | Clamped `limit` param to `Math.min(Math.max(1, n), 200)` |
| `src/services/google-workspace.ts:31` | Replaced `require()` with `readFileSync` + `JSON.parse` |
| `src/routes/position-descriptions.ts` | Added `req.user` auth guards to all 4 routes |

### IAP JWT Verification (CRIT-3)
- Replaced `X-Goog-Authenticated-User-Email` (forgeable plain-text) with cryptographic verification of `X-Goog-IAP-JWT-Assertion` using `google-auth-library`.
- Public keys cached with 1-hour TTL (`https://www.gstatic.com/iap/verify/public_key`).
- Expected audience: `/projects/624089053441/global/backendServices/7767340296511524621`
- Added `IAP_EXPECTED_AUDIENCE` to `cloudbuild.yaml` env vars.
- Installed `google-auth-library` as direct backend dependency.

### Deployment
- All fixes deployed via `gcloud builds submit`. Running as revision `rml-intranet-forms-api-00050-7vd`.

---

## Remaining Security Work (Deferred — Address After Notion/Supabase Integration)

Tracked in Notion project: [RML Intranet IT Security Remediation](https://www.notion.so/313e1901e36e817d9e97fc875ad384f1)

| Task | Priority | Notion URL |
|---|---|---|
| Add Notion database ID allowlist to proxy routes | High | https://www.notion.so/313e1901e36e81458d1dec9b7aa6ad15 |
| Replace `req.body` spread with field allowlist in `POST /api/forms` | High | https://www.notion.so/313e1901e36e81cea22cf982080dc631 |
| Add Notion role re-validation to privileged staff endpoints | Normal | https://www.notion.so/313e1901e36e8119b15de8d2e5caaec7 |

## Branch Merge Required
- `troubleshoot/notion-integration` contains all security fixes but has NOT been merged to `main`.
- Merge to main after Notion/Supabase integration work is complete on this branch.
- Dependabot alerts on the default branch will auto-close once merged.
