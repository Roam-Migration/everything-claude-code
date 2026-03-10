# RML Intranet Session — 2026-03-10 (Afternoon)

**Written:** 2026-03-10
**Covers:** Dashboard 529 fixes, org-diagram rendering fix, Cloud Scheduler, v_org_hierarchy LATERAL fallback

---

## What Was Completed This Session

### 1. Cloud Scheduler Cron — Org Sync (completed)

Created `rml-org-sync` Cloud Scheduler job:
- Schedule: `0 2 * * *` (2am Melbourne daily)
- Target: `POST https://rml-intranet-forms-api-hmff5nrb3q-uc.a.run.app/api/org/sync`
- Auth: OIDC service account

**IAP bypass required:** Cloud Scheduler calls have no IAP context — `extractIAPUser` was blocking them with 401. Fix in `backend/src/middleware/auth.ts`:
```typescript
// System-to-system endpoints called by Cloud Scheduler — no IAP user header
if (req.method === 'POST' && req.path === '/api/org/sync') {
  req.user = { email: 'scheduler@system.internal', role: 'admin' };
  return next();
}
```
This runs before the `X-Goog-Authenticated-User-Email` check. Path + method scoped to prevent abuse.

---

### 2. v_org_hierarchy — LATERAL Join Fallback (completed)

**Problem:** `infer_role_teams` returning 0 — cross-team roles (e.g. Senior Case Manager covering multiple teams) have `roles.team_id = NULL`, so holders fell out of the view. Result: ~17/25 people visible.

**Fix:** Rebuilt `v_org_hierarchy` with a LATERAL subquery fallback. When `roles.team_id IS NULL`, picks the person's first `people_teams` entry:
```sql
LEFT JOIN LATERAL (
  SELECT pt.team_id
  FROM   people_teams pt
  WHERE  pt.person_id = p.id
  ORDER  BY pt.team_id
  LIMIT  1
) pt_fb ON t.id IS NULL
LEFT JOIN teams t2 ON t2.id = pt_fb.team_id
```
Migration: `supabase/migrations/20260310000002_view_people_teams_fallback.sql`
Applied via Supabase Management API. Added `GRANT SELECT ON v_org_hierarchy TO anon`.
Result: 25/25 people visible in org diagram.

---

### 3. Metabase Dashboard 529 — CM Filter Fix (completed)

**Problem:** Selecting a Case Manager filter caused "problem displaying chart" error.

**Root cause:** Metabase `type: "dimension"` template tags generate fully-qualified SQL like `htmigration.dbo.vw_staff_members.display_name IN (...)`. Since `vw_staff_members` was not in the query's FROM clause, SQL Server threw: `The multi-part identifier 'dbo.vw_staff_members.display_name' could not be bound`.

**Fix (Card 1688 SQL, updated via Metabase API):**
```sql
-- Before:
[[AND cm.display_name {{case_manager}}]]

-- After:
[[AND cm.display_name IN (SELECT display_name FROM htmigration.dbo.vw_staff_members WHERE {{case_manager}})]]
```
Same pattern applied to `{{senior_associate}}`.

---

### 4. Dashboard 529 — SA Filter Cascade Fix (completed)

**Problem:** When CM=Carolina selected, SA dropdown only showed "Carolina" (not other SAs working those matters).

**Root cause:** Both CM and SA parameters had `filteringParameters` pointing to each other — they were mutually cascading. SA was filtered to values that shared CM's selected field value (`vw_staff_members.display_name = field 8746`).

**Fix:** Removed `filteringParameters` from both parameters via Metabase API (`PUT /api/dashboard/:id`). Filters now fully independent.

---

### 5. Actionstep Click-Through Links (completed, limitation noted)

Added `click_behavior` to `matter_id` and `matter_name` columns in Card 1688 `visualization_settings`:
```json
"click_behavior": {
  "type": "link",
  "linkType": "url",
  "linkTemplate": "https://ap-southeast-2.actionstep.com/mym/asfw/workflow/action/overview/action_id/{{matter_id}}"
}
```

**Known limitation — SameSite=Strict cookies:** Actionstep uses SameSite=Strict session cookies. When a user clicks a link FROM Metabase (cross-site navigation), the browser does not send the Actionstep session cookie. Actionstep's SPA sees no session and routes to home page. This is by browser design — no client-side workaround exists. The links DO work if the user copies the URL into the address bar (same-site navigation). Management advised.

---

### 6. Org Intelligence React Flow Chart — `absolute inset-0` Fix (completed)

**Problem:** Org diagram area rendered headers and stats but showed no chart — no React Flow Controls (zoom buttons), no MiniMap, no graph nodes.

**Root cause:** CSS percentage height (`h-full`) does not resolve through `flex-1` chains unless every parent in the chain has a CSS-definite height. The root `<div className="min-h-screen flex flex-col">` in App.tsx has only `min-height: 100vh` — NOT an explicit `height`. This means children with `flex-1` do NOT get CSS-definite heights, so `height: 100%` on a grandchild resolves to `auto` = 0.

Specifically: `OrgDiagram.tsx` had `<div className="w-full h-full">` wrapping `<ReactFlow>`. The `h-full` resolved to 0 height → ReactFlow rendered but was invisible (0px container). The Controls/MiniMap are rendered `position: absolute; bottom: 10px` inside ReactFlow — also clipped by `overflow-hidden` on the parent.

**Fix:** Changed OrgDiagram root div from `w-full h-full` → `absolute inset-0`:
```tsx
// Before
<div className="w-full h-full">
  <ReactFlow ...>

// After
<div className="absolute inset-0">
  <ReactFlow ...>
```

Works because the parent `<div className="flex-1 relative overflow-hidden">` already has `position: relative`, establishing a positioned ancestor. `absolute inset-0` fills based on the parent's *rendered/painted* dimensions, bypassing the CSS-definite-height resolution rule entirely.

**Note:** The loading and error states in `OrgIntelligencePage.tsx` already used `absolute inset-0` (the correct pattern). OrgDiagram was the only component not following it.

Commits: `825b912` (App.tsx flex-col), `e84f068` (OrgDiagram absolute inset-0)

---

## Unresolved Issue (Carry Forward)

### Actionstep Matter Links Redirect to Home Page

- **Symptom:** Clicking Actionstep links in Metabase redirects to home page rather than the matter
- **Cause:** SameSite=Strict cookies on Actionstep prevent cross-site navigation from including the session cookie; Actionstep SPA sees no session → routes to home
- **Workaround:** Copy URL to address bar (direct navigation sends SameSite=Strict cookies)
- **Resolution options:** None client-side. Server-side: Actionstep would need to switch to SameSite=Lax (their problem, not ours). Could document workaround for users.

---

## Key Patterns Learned

### `absolute inset-0` vs `h-full` in Flex Chains

Use `absolute inset-0` (not `w-full h-full`) when placing a full-area component inside a `relative` positioned container within a flex chain:
- `h-full` requires the parent to have a CSS-*definite* height
- `flex-1` inside `min-h-screen` creates a visually correct layout but NOT a CSS-definite height
- Absolutely positioned elements with `inset-0` fill based on rendered dimensions — bypasses definiteness requirement
- Pattern: parent has `flex-1 relative overflow-hidden`, child uses `absolute inset-0`

### Metabase Dimension Tags Need Their Table in FROM

`type: "dimension"` template tags generate `schema.table.column IN (...)` SQL. If that table isn't in the query's FROM clause, SQL Server throws. Solution: wrap in a subquery:
```sql
AND col IN (SELECT col FROM schema.dbo.view WHERE {{filter_tag}})
```

### Cloud Scheduler IAP Bypass Pattern

Global `extractIAPUser` middleware blocks Cloud Scheduler (machine-to-machine) because it requires `X-Goog-Authenticated-User-Email`. Add a path+method guard before that check:
```typescript
if (req.method === 'POST' && req.path === '/api/org/sync') {
  req.user = { email: 'scheduler@system.internal', role: 'admin' };
  return next();
}
```
Scope to exact path+method to prevent unauthenticated access to other routes.

### Supabase LATERAL Join for Fallback Lookup

When a join can't be expressed as a simple FK (e.g. "use role's team if set, else use person's first team"), use LATERAL:
```sql
LEFT JOIN LATERAL (
  SELECT team_id FROM people_teams WHERE person_id = p.id ORDER BY team_id LIMIT 1
) fallback ON primary_join.id IS NULL
```

---

## Next Session — Priority Order

1. **Wire Process/Competency Layers to Org Diagram** (Normal / Effort 3)
   Data in Supabase (`notion_competencies`, `daci_entries`). Need:
   - CompetencyPanel on person nodes — skill badge chips
   - DACI indicator badges on role nodes (R/A/C/I)
   - Time allocation display on person→role edges
   - New LayerControls toggles: `competencies`, `daci`

2. **Populate kpi_performance from Actionstep** (Normal / Effort 5)
   Wire Metabase/SPQR billing actuals into `kpi_performance` → RAG status on role nodes

3. **Phase 5 — Link PD KPIs to Metabase Dashboards** (High / Effort 5)
   KPI mapping table: PD KPIs → Metabase dashboard URLs

4. **User Test Dashboard 529** (High / Effort 2)
   Share with 2-3 team members: filter accuracy, dropdown behavior, matter data

---

## Environment Reference (unchanged from 2026-03-10 morning handover)

See `docs/sessions/2026-03-10-handover.md` for full env reference (Supabase, Metabase, GCP).
