# Session: Dependabot High Vulnerability Triage

**Date:** 2026-03-11
**Repo:** Roam-Migration/Rmlintranetdesign
**Task:** Triage Dependabot high vulnerabilities (Notion task)

---

## What Was Done

### Vulnerabilities Addressed

| Alert | Package | Location | CVE | Fix |
|---|---|---|---|---|
| #4 (tar) | `tar` | Frontend `package.json` | GHSA-qffp-2rhf-9h96, GHSA-9ppj-qmqm-q256 | Bumped override `>=7.5.8` → `>=7.5.11` |
| #5, #6, #7 (minimatch) | `minimatch` | Backend `package.json` | ReDoS via wildcards/extglobs/GLOBSTAR | Added override `>=9.0.7` |

### Root Cause Analysis

**tar (frontend):** `@tailwindcss/oxide` (transitive dep of `@tailwindcss/vite`) pulled in `tar@7.5.9`. An existing override `>=7.5.8` was already present but too permissive — npm resolved 7.5.9 (still in vulnerable range `<=7.5.10`). Fix: tighten to `>=7.5.11`.

**minimatch (backend):** `google-auth-library` → `gaxios` → `rimraf` → `glob` → `minimatch@9.0.5`. No override existed. Fix: add `"overrides": { "minimatch": ">=9.0.7" }` to `backend/package.json`.

### Key Discovery

`npm audit` run from the repo root only scans the frontend package. Dependabot independently scans `backend/package-lock.json`, which is why it found 4 alerts while root-level `npm audit` only showed 1. **Always run `npm audit` from each package directory in a monorepo.**

### Commits

- `c8c2f08` — `fix: bump tar override to >=7.5.11 to patch path traversal CVEs`
- `658af90` — `fix(backend): override minimatch to >=9.0.7 to patch ReDoS CVEs`

Both pushed to `origin/main`. Post-push: 0 open Dependabot alerts confirmed via `gh api`.

---

## Patterns Confirmed

- **npm `overrides`** field forces a specific version floor for transitive deps without touching the direct dep.
- **Dependabot vs npm audit scope**: Dependabot scans all lockfiles in the repo; `npm audit` is package-root-scoped.
- **Override range too wide**: `>=7.5.8` resolved to 7.5.9 at install time. Use the exact patched version floor.

---

## Pre-existing Uncommitted Work (Not Part of This Session)

`LegalHubPage.tsx`, `LegalHubSection.tsx`, and `FeeCalculatorPage.tsx` have uncommitted in-progress changes (Fee Calculator routing). Left as-is.
