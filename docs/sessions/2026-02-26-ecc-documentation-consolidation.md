# Session: ECC Documentation Consolidation

**Date:** 2026-02-26
**Branch:** fix/p1-documentation-updates
**Commit:** 6c57a25

---

## What Was Accomplished

Audited all files outside the ECC repo (home directory and /tmp) and transferred reusable documentation, prompts, and templates into the shared repo. 56 files committed and pushed to team remote.

---

## Files Audited

### Home Directory (`~/`)
- CMS task import scripts (20+ files) — assessed as one-off bulk imports, not transferred
- `spqr-troubleshooting-guide.md` — transferred
- `spqr-fixes/` — DEPLOYMENT-CHECKLIST.md and backend debugging guide transferred; .ts/.tsx fix files left (project-specific code)
- `share-database-instructions.md` — **skipped, contained hardcoded Notion API token**
- `RML-Intranet-02-15-2026_01_24_PM.png`, `Roam-Operating-Architecture-System-2026.pptx` — scratch artifacts, not transferred

### /tmp
- `/tmp/rml-claude-prompts/` — independent git repo, transferred to `prompts/rml-ops/`
- `/tmp/rml-deployment-templates/` — independent git repo, transferred to `templates/deployment/`
- `/tmp/rml-infrastructure/` — independent git repo, transferred to `docs/infrastructure/`
- SQL working files, JSON scratch data, logs, screenshots — not transferred (ephemeral artifacts)

---

## New ECC Structure

```
prompts/rml-ops/           # 6 standardised Claude Code prompts for RML work
templates/deployment/      # GCP Cloud Run templates (Vite SPA + Next.js SSR)
  ├── vite-react-spa/      # Dockerfile, cloudbuild.yaml, deploy.sh, nginx.conf
  ├── nextjs-ssr/          # Dockerfile, cloudbuild.yaml, deploy.sh
  └── scripts/             # map-domain.sh, setup-iap.sh, rollback.sh
docs/infrastructure/       # IAP handover, Cloud Run pattern, SSL runbook, admin fix report
docs/integrations/         # Google Workspace integration docs
docs/SPQR Dashboards/      # SPQR troubleshooting, deployment checklist, iteration summary
docs/projects/kuremara/    # NDIS model diagram + generation script (moved from repo root)
docs/projects/rml-intranet-cms/  # CMS project import and strategic docs
assets/images/             # Roam brand assets
```

---

## Key Decisions

- **`/tmp/rml-*` git repos**: Copied files only (not `.git` dirs) to keep ECC history clean. The source repos in /tmp are now superseded — can be deleted.
- **`share-database-instructions.md` skipped**: Contained hardcoded Notion API token (`ntn_60549...`). Likely expired but bad practice to commit.
- **Kuremara files moved from repo root**: `kuremara_*.py/.pdf/.png` were sitting loose in the repo root — relocated to `docs/projects/kuremara/`.

---

## Follow-up Tasks

- Update CLAUDE.md to document `prompts/rml-ops/` and `templates/deployment/` sections
- Delete source repos in `/tmp` (rml-claude-prompts, rml-deployment-templates, rml-infrastructure) now that content is in ECC
- Clean up home directory CMS scripts once confirmed they're not needed
- Consider adding a `docs/projects/kuremara/README.md` to explain the NDIS model project context
