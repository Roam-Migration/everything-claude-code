# Session: Notion Projects Review + Intranet Project Map

**Date:** 2026-03-14
**Repo:** `/tmp/Rmlintranetdesign` (RML Intranet) + Notion

---

## What Was Done

### 1. Notion Projects Cleanup

- **Intranet Launch page** (`2ece1901-e36e-819c-8ee2-d7ad5c1d0209`): Replaced stale Next.js/Vercel planning doc with accurate post-launch documentation reflecting the real stack (React Router v7, Vite, Tailwind v4, GCP Cloud Run, IAP, Supabase) and all 9 delivered pages.
- **AS API Integration** (`31ae1901-e36e-818c-8715-e98a6b18ee39`): Status restored from Deprecated → On-hold. Jackson noted learning Postman/REST API basics is a prerequisite before implementing.
- **Foresee (4C) Dashboard** (`246e1901-e36e-8086-a4ea-cea86945f967`): Moved under 2026 Planning Implementation (`2ece1901-e36e-8148-b147-c2e33b7a6697`).

### 2. Departments DB — Taxonomy Extension

User redirected from creating a standalone "Canonical Departments" page to adding fields directly to the existing Departments DB (`collection://ad5189c0-0d6c-42f3-8896-733d61d00521`).

Added 3 new columns: `Shortcode` (rich text), `Head` (rich text), `Scope` (rich text).

Populated for known rows:
| Department | Shortcode | Head | ID |
|---|---|---|---|
| Technology & BI | TECH | Sochan → Jackson | `ee1acebf737e4577ad7dd6ff455d10d7` |
| Legal | LEGAL | Jackson | `8bc6de47-5f7f-4a1a-9ba9-16f408c3c728` |

**Still needed:** Operations, Sales & Marketing, Finance, People & Culture rows — must find IDs by opening DB directly in Notion and populate Shortcode/Head/Scope.

**Orphan to delete:** "RML Canonical Departments & Teams" page (`323e1901-e36e-81ca-b7b0-e59d0be3d4c9`) — created before user redirected approach. Delete manually in Notion UI (no MCP delete tool).

### 3. RML Intranet — Project Map Page (`/project-map`)

Built full-stack interactive project visualisation using React Flow v12 (`@xyflow/react`).

**Architecture:**
- `GET /api/projects/map` — backend route queries Notion Projects DB, resolves dept names, returns `{ projects, lastUpdated }`
- React Flow canvas: department columns as parent group nodes, project cards as positioned child nodes
- Filters: search, department dropdown, Show Done, Show Deprecated toggles
- Click any card → opens Notion page in new tab

**Files created:**
| File | Purpose |
|---|---|
| `backend/src/routes/projects.ts` | Express route + Notion query + dept resolution |
| `src/app/types/projects.ts` | `ProjectStatus`, `ProjectType`, `ProjectData`, `ProjectMapData`, `DepartmentGroup` |
| `src/app/services/projects.ts` | `fetchProjectMapData()` |
| `src/app/components/project-map/ProjectDiagram.tsx` | React Flow layout engine + filter logic |
| `src/app/components/project-map/nodes/ProjectNode.tsx` | Card component |
| `src/app/components/project-map/nodes/DepartmentGroupNode.tsx` | Coloured group header |
| `src/app/pages/ProjectMapPage.tsx` | Page with header controls |

**Files modified:**
- `backend/src/index.ts` — registered `/api/projects` router
- `nginx.conf.template` — added `/api/projects/` proxy block (GET+OPTIONS)
- `src/app/App.tsx` — added lazy `<Route path="/project-map" ...>`

**Simplify fixes applied (post-build):**
- UUID normalisation: Notion returns IDs with/without dashes inconsistently — strip dashes before all map lookups
- `departmentIds` stripped from API response (internal detail, never used client-side)
- `buildLayout` returns `Node[]` directly (removed unnecessary `{ nodes }` wrapper)
- Dead `groupY = 0` variable removed
- `search.toLowerCase()` hoisted above filter loop

---

## Key Learnings

### Notion v5 @notionhq/client API
- `databases.query()` renamed → `dataSources.query({ data_source_id })`
- Cast as `(notion as any).dataSources.query(...)` since TypeScript types haven't caught up
- Response: `{ results, has_more, next_cursor }` — must cast return type explicitly

### replace_content with child databases
When using `notion-update-page` to replace a page that contains embedded databases, the `<database>` tag requires BOTH attributes:
```
<database url="https://www.notion.so/PAGE_ID" inline="false" data-source-url="collection://UUID">Name</database>
```
Missing either attribute causes the API to reject with a validation error about deleting child databases.

### React Flow — `absolute inset-0` Pattern
`h-full` fails inside `flex-1` chains when the root flex container uses `min-height` rather than `height`. Fix: wrapper uses `flex-1 relative overflow-hidden`, canvas uses `absolute inset-0`.

### UUID Format Inconsistency (Notion)
Notion returns page IDs with dashes in some contexts (`pages.retrieve` results, relation arrays on some endpoints) but without dashes in others. Always normalise to a consistent format (no-dash) before using as map keys.

---

## Pending / Follow-Up

1. **Populate remaining Departments DB rows**: Operations, Sales & Marketing, Finance, People & Culture — find IDs by opening DB in Notion, then add Shortcode, Head, Scope
2. **Delete orphan page**: "RML Canonical Departments & Teams" (`323e1901-e36e-81ca-b7b0-e59d0be3d4c9`) — manual delete in Notion UI
3. **Populate Department relation on IT projects**: SPQR, Gmail Plugin, Security Remediation, CMS Transformation, Document Automation — link to Technology & BI row so they appear in the correct column on the Project Map
4. **Deploy Project Map to production**: Run `gcloud builds submit` for both frontend and backend, register Platform Map Notion entry
5. **AS API Integration**: Jackson to learn Postman/REST API basics before implementing Actionstep OAuth deep link flow
