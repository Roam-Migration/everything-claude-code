# Session: Org Intelligence — Supabase Schema, Population & Deployment

**Date:** 2026-03-09
**Project:** RML Intranet — Org Intelligence page
**Status:** Live at `/org-intelligence`

---

## What Was Built

A multi-layer interactive org diagram embedded in the RML Intranet, backed by Supabase (PostgreSQL). The diagram visualises people, roles, teams/departments, and KPIs using React Flow with a Dagre hierarchical layout.

### Components Delivered

| Component | Location | Notes |
|---|---|---|
| Supabase schema | `supabase/migrations/20260309000001_org_schema.sql` | 12 tables + 2 views + RLS |
| Supabase seed data | `supabase/migrations/20260309000002_org_seed.sql` | 6 teams + 6 KPI definitions |
| TypeScript types | `src/app/types/org.ts` | Full type hierarchy |
| Data service | `src/app/services/org.ts` | Parallel Supabase fetches + assembly |
| Dagre layout | `src/app/components/org-diagram/layout.ts` | TB direction, 220px wide nodes |
| Custom nodes | `src/app/components/org-diagram/nodes/` | TeamNode, RoleNode, PersonNode, KpiNode |
| Diagram component | `src/app/components/org-diagram/OrgDiagram.tsx` | React Flow v12 (`@xyflow/react`) |
| Layer controls | `src/app/components/org-diagram/LayerControls.tsx` | Teams/Roles/People/KPIs toggles |
| Page | `src/app/pages/OrgIntelligencePage.tsx` | Route `/org-intelligence`, stats bar |
| Supabase client | `src/app/lib/supabaseClient.ts` | VITE env var initialisation |

### Data Populated (via Management API)

- **6 roles** with fixed UUIDs (`10000000-0000-0000-0000-000000000001` through `...006`)
- **16 people** (all active RML staff from Actionstep `participant_kpis` 2026)
- **16 people_roles** (primary role assignments)
- **12 kpi_owners** (team + role ownership per KPI)

Staff map:
- `participant_id 63` → Jackson Taylor → Director (Leadership)
- `participant_ids 1683, 3687, 2494, 1836, 62843` → Senior Migration Agents (Legal)
- `participant_ids 3733, 30734, 175, 3688, 24002, 1767, 22684, 18227, 14729` → Migration Agents (Legal)
- `participant_id 64691` → Taashahyani Parmeswaran → Paralegal (Legal)

---

## Key Technical Patterns

### Supabase Management API for DDL

Cannot use Supabase CLI for migrations when remote has schema divergence or IPv6-only DB host. Use Management API directly:

```bash
curl -X POST "https://api.supabase.com/v1/projects/{ref}/database/query" \
  -H "Authorization: Bearer sbp_YOUR_PAT" \
  -H "Content-Type: application/json" \
  -d @payload.json
```

Always build JSON payload via `python3 -c "import json; ..."` or save to file first — shell heredoc quoting breaks JSON strings with special characters.

### RLS and the Anon Key

**Critical pattern:** Supabase views with `SECURITY DEFINER` bypass RLS on underlying tables. Direct table queries respect RLS. The anon key gets neither `auth.uid()` nor `authenticated` role — only `anon` role.

- `v_org_hierarchy` returned data ✓ (view = SECURITY DEFINER)
- `teams`, `roles` returned `[]` ✗ (direct table, RLS blocked anon)

Fix: `CREATE POLICY anon_read_X ON public.X FOR SELECT TO anon USING (true);`

RLS policies take effect immediately — no redeployment needed.

### Cloud Build + Secret Manager (VITE env vars)

**Problem:** Substitution variables default to `''` unless passed via `--substitutions` flag at CLI call time. GCP Secret Manager secrets are not automatically available as substitution values.

**Wrong approach:**
```yaml
substitutions:
  _SUPABASE_ANON_KEY: ''  # always blank unless --substitutions passed
```

**Correct approach** (`availableSecrets`):
```yaml
availableSecrets:
  secretManager:
    - versionName: projects/PROJECT/secrets/my-secret/versions/latest
      env: 'MY_SECRET'

steps:
  - name: 'gcr.io/cloud-builders/docker'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        docker build \
          --build-arg VITE_MY_VAR=$$MY_SECRET \
          .
    secretEnv: ['MY_SECRET']
```

Key points:
- `$$` (double-dollar) prevents Cloud Build variable substitution — lets the shell see `$MY_SECRET`
- Step must declare `secretEnv` matching the `env` name in `availableSecrets`
- Switch `args` from array format to `entrypoint: bash` + `-c` shell string (required to access env vars)

### Fixed UUID Convention for Seed Data

Using fixed UUID prefixes makes debugging trivial:
- `00000000-0000-0000-0000-000000000001` = Leadership team
- `10000000-0000-0000-0000-000000000001` = Director role
- `20000000-0000-0000-0000-000000000063` = Jackson Taylor (63 = Actionstep participant_id)

The `metadata: jsonb` column on `people` stores `{"actionstep_participant_id": N}` as a bridge key for future Metabase joins.

### React Flow v12 (`@xyflow/react`) + Dagre

```typescript
import dagre from '@dagrejs/dagre';

const g = new dagre.graphlib.Graph();
g.setDefaultEdgeLabel(() => ({}));
g.setGraph({ rankdir: 'TB', ranksep: 60, nodesep: 40 });

// Add nodes with dimensions
for (const node of nodes) {
  g.setNode(node.id, { width: 220, height: getHeight(node.type) });
}

// Layout and apply positions
dagre.layout(g);
return nodes.map(node => {
  const { x, y } = g.node(node.id);
  return { ...node, position: { x: x - 110, y: y - height/2 } };
});
```

Node types must be defined outside component to prevent re-renders:
```typescript
const NODE_TYPES = { teamNode: TeamNode, roleNode: RoleNode, ... };
// NOT inside the component function
```

---

## Bugs Encountered

| Bug | Root Cause | Fix |
|---|---|---|
| `VITE_SUPABASE_ANON_KEY` blank at runtime | Substitution variable `_SUPABASE_ANON_KEY: ''` default never overridden | Switch to `availableSecrets` + `secretEnv` in cloudbuild.yaml |
| Controls render but no nodes visible | RLS blocked anon key from reading `teams`/`roles` tables; `data.teams=[]` → `buildGraph` looped 0 times | Add `FOR SELECT TO anon` RLS policies on all org tables |
| Supabase migration CLI conflict | Remote had timestamp-format migration, local had sequential number format | Bypassed CLI entirely, used Management API for DDL |
| IPv6-only Supabase DB host | `db.spybbjljplimivkiipar.supabase.co` resolves to IPv6 only — unreachable from Crostini | Used Management API instead of direct psql |
| 403 from Python urllib | Cloudflare bot block | Use curl with file-based JSON payload (`-d @file.json`) |

---

## Open Tasks / Next Steps

1. **Add KPI actuals to Supabase** — `kpi_performance` table is empty; RAG status shows `no_data` for all KPIs. Source data is in Actionstep via Metabase (`participant_kpis` table).
2. **Wire Actionstep KPI data → Supabase** — script to pull `participant_kpis` monthly actuals and upsert into `kpi_performance`, matching via `metadata.actionstep_participant_id`.
3. **Add admin UI** for managing people/roles/teams without direct DB access.
4. **Department structure** — Operations Manager and Finance Manager roles have no people assigned. Add those staff once identified.
5. **Process and competency layers** — schema tables exist (`processes`, `competencies`, etc.), layer controls stubbed but not yet wired in diagram.
6. **`h-screen` layout review** — OrgIntelligencePage uses `h-screen` inside app's `main.flex-1`; may cause subtle scroll behaviour on smaller viewports. Consider replacing with `flex-1 flex flex-col` pattern matching the app shell.

---

## Supabase Project Reference

| Item | Value |
|---|---|
| Project ref | `spybbjljplimivkiipar` |
| Region | Northeast Asia (Seoul) |
| Anon key | GCP Secret: `supabase-anon-key` |
| Service key | GCP Secret: `supabase-service-key` |
| Management API | `https://api.supabase.com/v1/projects/spybbjljplimivkiipar/database/query` |
| Auth | PAT: `sbp_0ccef04aee...` (stored in session only) |
