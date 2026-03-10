# Notion → Supabase Org Sync

**Date:** 2026-03-10
**Project:** RML Intranet / Org Intelligence

---

## Completed This Session

### 1. h-screen Layout Fix

`SidebarLayout.tsx`: `<main className="flex-1 min-h-screen">` → `<main className="flex-1 min-h-screen flex flex-col">`.

`OrgIntelligencePage.tsx`: `className="flex flex-col h-screen bg-gray-50"` → `className="flex-1 flex flex-col overflow-hidden bg-gray-50"`.

---

### 2. Schema Migration

Applied `supabase/migrations/20260310000001_notion_sync_schema.sql` via Supabase Management API.

**New tables:**
- `departments` — name, color, notion_id, synced_at
- `people_teams` — person_id, team_id, allocation_pct, is_primary
- `time_allocations` — person_id, role_id, allocation_pct, effective_date, notion_id
- `daci_entries` — matter/project scope, role category, person_id, notion_id
- `notion_competencies` — person_id, competency name/level, notion_id

**Extended existing tables:**
- `teams`: +notion_id, department_id, active, synced_at
- `roles`: +notion_id, department_id, notion_tier, notion_level, registration_required[], reports_to_role_id, active, synced_at
- `people`: +notion_id, employment_status, synced_at

**Constraint added:**
`UNIQUE (person_id, role_id)` on `people_roles` — was missing from original schema; caused upsert failures with `onConflict:'person_id,role_id'`.

**View updated (`v_org_hierarchy`):**
- Added dept_id, dept_name, dept_color columns
- Added employment_status, person_notion_id, notion_level, notion_tier columns
- Changed `p.employment_status = 'active'` → `LOWER(p.employment_status) = 'active'` for case-insensitive match

---

### 3. Notion → Supabase Sync Service

File: `backend/src/services/notion-sync.ts`

**10-step sync sequence:**
1. departments
2. teams
3. roles (2-pass: first insert all, second pass resolves `reports_to_role_id` FK)
4. people
5. people_roles
6. people_teams
7. infer_role_teams (infers team membership from people_roles + people_teams)
8. time_allocations
9. daci_entries
10. competencies → deactivate_stale

**Key implementation notes:**
- Uses `@notionhq/client` v5.x API: `(notion as any).dataSources.query({ data_source_id })` (NOT `notion.databases.query` — renamed in v5)
- Response shape: `{ results: any[], has_more: boolean, next_cursor: string | null }` — cast as `any`
- `@Name` mention-format: v5 returns privacy-masked person names as `@Name` (not `@Anonymous`). Detection: any `@` prefix. Fix: strip `@`, derive last_name from email domain username.
- `employment_status` normalized to lowercase before upsert
- Pre-deletes legacy seed people (`employment_status='legacy' AND notion_id IS NULL`) before upsert to avoid email UNIQUE conflicts
- `deactivateStale`: uses `.not('notion_id', 'in', `(${ids.join(',')})`)` — UUIDs WITHOUT single quotes (see bug table below)

---

### 4. Backend Route

File: `backend/src/routes/org-sync.ts`

`POST /api/org/sync` → returns 202 immediately, runs sync in background.

Registered in `backend/src/index.ts` as `/api/org`.

---

### 5. Frontend Updates

**Types** (`src/app/types/org.ts`):
- New: `Department`, `DiagramDepartment`
- Updated: `DiagramLayers` (+departments), `OrgDiagramData` (+departments), Team/Role/Person interfaces with sync columns (notion_id, active, synced_at, etc.)

**Service** (`src/app/services/org.ts`):
- Added `fetchDepartments()`
- Filters `active=true` for teams and roles
- Assembles 4-level dept→team hierarchy

**New component** (`src/app/components/org-diagram/nodes/DepartmentNode.tsx`):
- Wide banner node (280px) with department color bar

**Updated components:**
- `OrgDiagram.tsx` — 4-level `buildGraph`: Dept → Team → Role → Person
- `LayerControls.tsx` — Departments toggle added
- `layout.ts` — per-node width support (deptNode=280px, others=220px)
- `OrgIntelligencePage.tsx` — `departments: true` in DEFAULT_LAYERS

---

### 6. Sync Results

| Entity | Count |
|--------|-------|
| Departments | 7 |
| Teams | 8 |
| Roles | 18 |
| People | 25 |
| Time Allocations | 49 |
| DACI Entries | 16 |
| Competencies | 86 |

---

## Bugs Encountered and Fixed

| Bug | Cause | Fix |
|-----|-------|-----|
| All teams `active:false` after sync | `deactivateStale` passed `'${id}'` (single-quoted UUIDs) to `.not('notion_id', 'in', ...)` — PostgREST reads these as literal `'id'` strings, not matching bare UUIDs, so ALL rows matched the NOT IN condition | Remove single quotes: `` `.not('notion_id', 'in', `(${ids.join(',')})`)` `` |
| `roles: 0` — upsert failed | `RoleRow.name` but Supabase `roles` table uses `title` column | Changed `RoleRow.name` → `RoleRow.title`; `intermediates.push({title: name, ...})` |
| `people: 0` — email UNIQUE conflict | Seeded people had `notion_id=NULL`; sync tried to INSERT new rows for same emails | Pre-delete `people WHERE employment_status='legacy' AND notion_id IS NULL` before upsert |
| `people_roles` empty after rebuild | `people_roles` lacked UNIQUE constraint on `(person_id, role_id)` — upsert with `onConflict:'person_id,role_id'` returned PostgREST error | Added `ALTER TABLE people_roles ADD CONSTRAINT people_roles_person_role_unique UNIQUE (person_id, role_id)` |
| `role_title: null` in v_org_hierarchy | Sync set `is_primary: false` but view filters `is_primary = true` | Changed sync to `is_primary: true` |
| `v_org_hierarchy` empty despite people in DB | Notion `employment_status` stored as "Active" (capital A); view compared to lowercase `'active'` | Changed sync to `.toLowerCase()` + updated view: `LOWER(p.employment_status) = 'active'` |
| Names like "@Jackson" instead of "Jackson" | `@notionhq/client` v5.x returns mention-format names as `@Name` for privacy-masked pages | Detect any `@` prefix → strip `@`, derive last_name from email |
| `notion.databases.query` not found | v5.x renamed: `databases.query` → `dataSources.query({ data_source_id })` | Updated `queryAll` to use `(notion as any).dataSources.query({ data_source_id })` |

---

## Final State

- Live at `/org-intelligence` on intranet.roammigrationlaw.com
- 4-level diagram: Dept → Team → Role → Person
- Daily sync: POST `/api/org/sync` — manually triggered; Cloud Scheduler not yet configured
- Sync endpoint: `https://rml-intranet-forms-api-hmff5nrb3q-uc.a.run.app/api/org/sync` (requires `X-Goog-Authenticated-User-Email` header)

---

## Remaining Tasks

- Set up Cloud Scheduler daily cron for `/api/org/sync`
- Investigate `infer_role_teams: 0` — no roles matched inference logic; roles may need explicit team assignments in Notion
- Some roles show `team_name: null` (e.g. Senior Case Manager) — not linked to teams in Notion; need team assignments added
- KPI layer (task 4): populate `kpi_performance` from Actionstep data

---

## Key Files

- `backend/src/services/notion-sync.ts` — sync service (10 steps)
- `backend/src/routes/org-sync.ts` — POST /api/org/sync route
- `supabase/migrations/20260310000001_notion_sync_schema.sql` — schema migration
- `src/app/types/org.ts` — updated types
- `src/app/services/org.ts` — updated fetch functions
- `src/app/components/org-diagram/nodes/DepartmentNode.tsx` — new dept node
- `src/app/components/org-diagram/OrgDiagram.tsx` — 4-level graph builder
