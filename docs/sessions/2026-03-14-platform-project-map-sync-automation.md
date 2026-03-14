# Session Notes — 2026-03-14 — Platform Map + Project Map Sync Automation

## What Was Done

### Goal
Ensure future RML Intranet changes automatically update both the Platform Map (Notion DB of all features) and the Project Map (React Flow visualization of Projects DB), with a structural relationship between them.

### 1. Notion Data Model — "Project" relation on Platform Map DB

Added a **DUAL relation** from `RML Platform Features` → `Projects DB` using `notion-update-data-source`:

```
ADD COLUMN "Project" RELATION('7e62ecf2-0379-4fa5-9a54-99788a80af99', DUAL 'Platform Features' 'platform_features')
```

Result:
- Every Platform Map entry now has a "Project" field (select from Projects DB)
- Every Project in the Projects DB now has a "Platform Features" back-reference
- This structurally connects the two maps at the Notion data level

### 2. Platform Map Entry for `/project-map`

Created the pending Platform Map entry from today's earlier session (was listed as "follow-up" in session notes):
- Name: Project Map | Section: Admin Hub | Status: Functional | Route: /project-map
- Data Source: Notion | Priority: Medium | Visible: Yes
- Project relation: Intranet Launch
- Notion URL: https://www.notion.so/323e1901e36e81278d9ffed60abc622d

### 3. `rml-intranet-sync` Skill

Created `/home/jtaylor/everything-claude-code/skills/rml-intranet-sync/SKILL.md` — a 5-phase systematic post-session sync workflow:

- **Phase 1** — `git diff` → map file changes to sync action types
- **Phase 2** — Platform Map sync (create/update entries with Project relation)
- **Phase 3** — Project Map sync (update Notion Projects DB → auto-reflects in React Flow)
- **Phase 4** — Cross-link audit (verify all new entries have Project relation set)
- **Phase 5** — Verify in `/platform-map`

### 4. CLAUDE.md Updates (Rmlintranetdesign)

- All Platform Map entry creation steps now require **"Project relation set — MANDATORY"**
- New trigger: "After completing a project phase" → update Notion Projects DB status
- Added Projects DB collection ID + Intranet Launch project URL to Key IDs
- Added `/api/projects` to backend routes table
- Added `ProjectMapPage.tsx`, `projects.ts` service to frontend key files table
- Added skill reference: "Run rml-intranet-sync at end of any session where changes were made"

### 5. ECC CLAUDE.md Skill Triggers

Added two new auto-apply triggers:
- End of any RML Intranet session → `skills/rml-intranet-sync/SKILL.md`
- Adding a form to the RML Intranet → `skills/rml-form-integration/SKILL.md`

### 6. Committed Stale OperationsPage Changes

Found uncommitted changes from an earlier session:
- `OperationsPage.tsx` — "Project & Task Management" section with Project Map card
- `navigation.ts` — nav item for "Project & Task Management"
- **Route mismatch noted**: link points to `/operations/project-map` but Project Map is at `/admin/project-map`

---

## Remaining Work

- [ ] Fix route in OperationsPage.tsx: change `/operations/project-map` → `/admin/project-map` (or confirm correct route)
- [ ] Deploy Project Map to production (frontend + backend `gcloud builds submit`)
- [ ] Populate Department relation on existing IT projects in Notion: SPQR, Gmail Plugin, Security Remediation — link to Technology & BI row so they appear correctly in Project Map
- [ ] Populate remaining Departments DB rows (Operations, Sales & Marketing, Finance, People & Culture) — find IDs by opening DB directly in Notion
- [ ] Delete orphan page "RML Canonical Departments & Teams" (`323e1901-e36e-81ca-b7b0-e59d0be3d4c9`) — manual delete in Notion UI
- [ ] Backfill "Project" relation on existing Platform Map entries (they currently have no project linked)

---

## Key IDs / References

| Resource | ID/URL |
|----------|--------|
| Platform Map DB | `collection://e38debd2-2692-4e42-ae29-5b5a13fff724` |
| Projects DB | `collection://7e62ecf2-0379-4fa5-9a54-99788a80af99` |
| Intranet Launch project | https://www.notion.so/2ece1901e36e819c8ee2d7ad5c1d0209 |
| Project Map Platform Map entry | https://www.notion.so/323e1901e36e81278d9ffed60abc622d |
| rml-intranet-sync skill | `skills/rml-intranet-sync/SKILL.md` in ECC |
