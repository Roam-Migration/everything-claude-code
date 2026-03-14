# RML Team Context

This file contains Roam Migration Law-specific context for Claude Code sessions.

## How This Works

**ECC repository** (`everything-claude-code`) is used in two ways:

1. **As a framework** — generic agents, skills, hooks, commands, and rules that any developer can use.
2. **As RML's team environment** — when working in this repo, `rml/CLAUDE.md` is available as an `@` reference for RML-specific context.

**For RML project work** (e.g., Rmlintranetdesign, Gull Force), the relevant CLAUDE.md lives *in that project's repo*. This file is a shared source of truth for RML standards and IDs that can be referenced or synced to project-level CLAUDE.md files.

**To reference this file in a session:**
```
@rml/CLAUDE.md — apply RML context for this work
```

---

## Active RML Projects

| Project | Repo Location | Purpose |
|---------|--------------|---------|
| RML Intranet | `/tmp/Rmlintranetdesign` | Internal staff portal (React, Vite, Cloud Run) |
| Gull Force WP | `/home/jtaylor/gull-force-wp` | External WordPress site |
| ECC | `/home/jtaylor/everything-claude-code` | This repo — team Claude Code environment |

---

## RML Intranet — Key Context

**Stack:** React Router v7, Vite, Tailwind v4, TypeScript
**Production:** `intranet.roammigrationlaw.com`
**Deploy:** `gcloud builds submit --config=cloudbuild.yaml --project=rmlintranet` (run from repo root)
**Backend deploy:** `cd backend/ && gcloud builds submit --config cloudbuild.yaml --project=rmlintranet`

**Automatic sync obligations** (no prompt needed — fire when triggered):
- Adding a form → update `AdminPage.tsx` + create Platform Map Notion entry + update `docs/FORMS-REGISTER.md`
- Adding a page → create Platform Map Notion entry
- Status change → update Platform Map entry

**VITE env vars:** `.env` never reaches Cloud Build — add to Dockerfile `ARG`/`ENV` + `cloudbuild.yaml --build-arg`

---

## Metabase / SPQR

**Required:** Metabase MCP server (`mcp-servers/metabase/`)
**Workflow:**
1. Explore schema with `get-database-schema`
2. Write query in SQL Server syntax (not PostgreSQL)
3. Validate: `validate-sql-server-query`
4. Test: `test-metabase-query`
5. Deploy via Python scripts

**Skills:** `skills/metabase-card-creation/` (7-phase) | `skills/metabase-sql-server-patterns/` (SQL templates)

---

## Notion Workspace

**Tasks DB:** `collection://4b3348c5-136e-4339-8166-b3680e3b6396`
**Projects DB:** `collection://7e62ecf2-0379-4fa5-9a54-99788a80af99`
**Jackson user ID:** `cd2bebb6-f5c0-46aa-a3d3-86116bbdcc87`
**Status options:** Not started, Proposed, On hold, In progress, For Review, Approved, Changes Required, Done, Deprecated
**Task title format:** `[Action Verb] [Object] [Context]`

**Pre-flight required before any Notion write:** `notion-fetch` a known page first — token expires silently.

See: `docs/notion-integration.md` for full schemas.

---

## GCP Infrastructure

**Project:** `rmlintranet` | **Region:** `us-central1`
**Intranet URL:** `intranet.roammigrationlaw.com` → Cloud Run (`rml-intranet`) via Global LB + IAP

**Deployment Templates** (`templates/deployment/`):
- `vite-react-spa/` — Dockerfile, nginx.conf, cloudbuild.yaml, deploy.sh
- `nextjs-ssr/` — Corresponding files for Next.js SSR

**RML Ops Prompts** (`prompts/rml-ops/`):

| Prompt | Use When |
|--------|----------|
| `project-init.md` | Starting a new RML internal app |
| `deploy-to-gcp.md` | Deploying to Cloud Run |
| `component-generation.md` | Creating new React components |
| `security-audit.md` | Before deploying to production |
| `troubleshoot-iap.md` | Debugging IAP 403 / redirect errors |
| `add-shared-component.md` | Adding to `@roam-migration/components` |

**Usage:**
```
@claude, follow the instructions in prompts/rml-ops/deploy-to-gcp.md
```

---

## RML-Specific Skills

These skills exist in `skills/` and are specific to RML workflows:

| Skill | Purpose |
|-------|---------|
| `skills/rml-intranet-sync/` | Post-change audit for pages/routes/forms |
| `skills/rml-form-integration/` | Form integration workflow |
| `skills/metabase-card-creation/` | SPQR Metabase card creation |
| `skills/metabase-sql-server-patterns/` | SQL Server query patterns |
| `skills/metabase-data-studio/` | Metabase data studio workflow |
| `skills/actionstep-api/` | Actionstep API integration patterns |
| `skills/supabase-postgrest-patterns/` | Supabase/PostgREST query patterns |
| `skills/cloud-run-vite-deployment/` | GCP Cloud Run deployment for Vite apps |
| `skills/wordpress-elementor-patterns/` | Gull Force WordPress patterns |

---

## Contributing RML Context

When you learn a new RML pattern, gotcha, or workflow:
1. If it's a project-specific pattern → update that project's `CLAUDE.md` directly
2. If it's a cross-project RML standard → update this file (`rml/CLAUDE.md`)
3. If it's a reusable workflow → create or update a skill in `skills/`
4. Commit and push to team remote: `git push team main`
