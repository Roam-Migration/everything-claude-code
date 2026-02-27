# Session: ECC CLAUDE.md Documentation Updates

**Date:** 2026-02-27
**Branch:** fix/p1-documentation-updates
**Notion task:** Update CLAUDE.md to document prompts/rml-ops and templates/deployment

---

## What Was Accomplished

Added documentation to `CLAUDE.md` for two directories that were added in the previous session (2026-02-26) but left undocumented:

- `prompts/rml-ops/` — 6 standardized Claude Code prompts
- `templates/deployment/` — GCP Cloud Run deployment templates

---

## Changes Made

### `CLAUDE.md`

**Added: `### RML Ops Prompts` section** (under Skills and Workflows)
- Table of all 6 prompts with when-to-use context
- Usage example showing how to reference prompts explicitly in a session
- Link to `prompts/rml-ops/README.md`

**Added: `### GCP Deployment Templates` section** (under Skills and Workflows)
- Lists two app templates (vite-react-spa, nextjs-ssr) with what each includes
- Lists three shared scripts (setup-iap.sh, map-domain.sh, rollback.sh)
- Quick-start copy-paste command
- Link to `templates/deployment/README.md`

**Updated: Repository Structure tree**
- Added `rml-ops/` under `prompts/`
- Added `templates/deployment/` and `templates/deployment/scripts/` entries

---

## Context

This session directly completed the follow-up task listed in the 2026-02-26-ecc-documentation-consolidation.md session notes:

> "Update CLAUDE.md to document `prompts/rml-ops/` and `templates/deployment/` sections"

The content already existed — this session added the discovery layer so team members (Sochan etc.) know these resources are available and how to use them.

---

## No Follow-up Tasks

- CLAUDE.md is now current with the repo structure
- The Notion task "Update CLAUDE.md to document prompts/rml-ops and templates/deployment" can be marked Done
