# RML Intranet — Notion Core Data Restructure

**Date:** 2026-03-03
**Repo:** everything-claude-code
**Notion page:** https://www.notion.so/2ece1901e36e806e8d7ac3ebf84b9b73

---

## Session Goal

Restructure the `Intranet - Core Data` Notion page to mirror the intranet's 8-section platform map, making it the single ops-accessible hub for all Notion databases that back the live intranet.

---

## What Was Built

### Page structure

`Intranet - Core Data` (`2ece1901-e36e-806e-8d7a-c3ebf84b9b73`) was fully restructured from a flat "People Databases" list into 8 colour-coded sections matching the platform map exactly:

| Section | Route | Status | Databases embedded |
|---|---|---|---|
| Home | `/` | Functional ✅ | Daily Updates, Critical Updates |
| Legal Hub | `/legal-hub` | Partial 🚧 | None (static content only) |
| People & Culture | `/people` | Partial 🚧 | Roles, Teams, Department, Position Descriptions, Time Allocation, DACI Matrix, Competencies, Leave Requests, Staff Directory (retired, collapsed) |
| Core Operations | `/core-operations` | Stub 🔲 | Document Hub |
| Training & Competency | `/training-competency` | Stub 🔲 | None (planned) |
| Sales & Marketing | `/sales-marketing` | Stub 🔲 | None (planned) |
| Finance | `/finance` | Stub 🔲 | None (planned) |
| Business Intelligence | `/business-intelligence` | Partial 🚧 | KPI Definitions, KPI Reports, KPI Tracking |

At the top: the `RML Platform Features` DB is embedded as a live status tracker — any status changes here propagate directly to the intranet's `/platform-map` page.

### Databases moved to Core Data (became children)

| Database | Moved from | Reason |
|---|---|---|
| RML Platform Features | JT WIP private space → Intranet (Rmlintranetdesign) | Inaccessible to ops team |
| Daily Updates | Intranet Launch project (Projects DB record) | Inaccessible for linked views |
| Critical Updates | Intranet Launch project (Projects DB record) | Inaccessible for linked views |
| Document Hub | Workspace root (floating) | Centralise with other intranet DBs |

### KPI cluster restructured

KPI Definitions, KPI Reports, KPI Tracking moved from the People & Culture section into Business Intelligence, where they belong logically.

---

## Technical Learnings

### Notion embed: `url=` vs `data-source-url=`

Critical distinction when writing Notion page content via MCP:

- `<database url="{{https://...}}">` — **moves** the database to be a child of the current page. Use when the database IS (or should be) a child.
- `<database data-source-url="collection://...">` — creates a **linked view** of a database that lives elsewhere. Does NOT move it.

**Gotcha**: linked views (`data-source-url`) only work for databases in accessible shared spaces. Databases under private pages, project records, or floating at workspace root cannot be linked — they must be moved first.

**Preserve check**: `replace_content` fails if child databases aren't included in the new content. Use `url=` for every child database, or set `allow_deleting_content: true` (which deletes them — almost never correct).

### `insert_content_after` puts content inside callout blocks

When the target text lives inside a callout, `insert_content_after` inserts as a child of the callout, not after it. To avoid this: either use `replace_content_range` to rewrite the whole callout + content together, or do a full `replace_content` after all moves are complete.

### Notion linked view restriction

Databases that live inside database record pages (e.g., a page inside the Projects database) cannot be linked to from other pages using `data-source-url`. The only solutions are:
1. Move the database to a standalone page or shared space
2. Use `<mention-database>` for a clickable link without embed

---

## Future Workflow: New Intranet Notion Databases

**Rule:** Any new Notion database that backs an intranet feature MUST be created as a child of the Core Data page.

**Why:** Databases created as children of Core Data are automatically:
- Accessible to all ops team members with access to Core Data
- Embeddable on Core Data without moves
- Centralised alongside all other intranet data

**How to add a new database:**
1. Navigate to Core Data: https://www.notion.so/2ece1901e36e806e8d7ac3ebf84b9b73
2. Create the database directly on that page (or create elsewhere and move using `notion-move-pages`)
3. Add `<database url="{{https://...}}">` to the relevant section in the page content
4. Update the section's callout status if applicable
5. Confirm the DB ID in `backend/cloudbuild.yaml` env vars if the intranet app will query it

---

## Database ID Reference (Intranet Notion DBs)

All now children of Core Data page `2ece1901-e36e-806e-8d7a-c3ebf84b9b73`:

| Database | Page URL | Collection ID | Intranet env var |
|---|---|---|---|
| RML Platform Features | `69eba1aab2ba46578130db2b74dd686d` | `e38debd2-2692-4e42-ae29-5b5a13fff724` | `VITE_NOTION_PLATFORM_FEATURES_DB` |
| Daily Updates | `312e1901e36e8104b227e867fbfa3356` | `312e1901-e36e-813b-bbda-000bfec9cf5b` | `NOTION_DAILY_UPDATES_DB_ID` |
| Critical Updates | `312e1901e36e819f973acce6d01a80e9` | `312e1901-e36e-81b7-90cc-000b9e36313e` | `NOTION_CRITICAL_UPDATES_DB_ID` |
| Document Hub | `29ae1901e36e804a91d9dd85c8f331d4` | `29ae1901-e36e-80eb-a289-000b6f194afb` | `NOTION_DOCUMENTS_DB_ID` |
| Position Descriptions | `1ba77069f47043c7b5268713aedefb0e` | `72ce8cde-f3e5-40f5-b278-13a614cdcfbc` | `VITE_NOTION_POSITIONS_DB` |
| Roles | `1f9f8607d1c6409f92b6633a8a05b2ce` | `9cd79b7e-39f9-4033-8a7a-b309c0780bd6` | — |
| Teams | `a8bb7cf9751b427eb9cd86543241570e` | `83793035-0ed4-46df-b076-2f090fc22415` | — |
| Department | `2a1f27d399e446159718d63ede7c3253` | `ad5189c0-0d6c-42f3-8896-733d61d00521` | — |
| Time Allocation | `8500d38720b948dd9a9a9b5e495ebd97` | `9f83acf7-fbe3-4cd7-84fc-66aad0e8de7c` | — |
| DACI Matrix | `1cb5ebe5b0c34044b6350c20d58ac5dc` | `43a430e8-8106-41f0-a88d-fd87e1719a91` | — |
| Competencies | `4d6d704507e8425f95d2edb0c8b23641` | `19818b48-5b16-4648-8d0a-82cbcd97b85d` | — |
| Leave Requests | `07d88effa5ec415c82156165536b8f43` | `425bb426-1680-49e2-a827-4605c55f11d7` | — |
| KPI Definitions | `746a969996f549dd87684e9abc74028d` | `ed3ab14b-a61c-4f37-a907-a2f17b58dfd8` | — |
| KPI Reports | `b236ddf7d1834e85ab2487cef468c614` | `4fe81903-faee-4e7e-8850-c92090eeed6e` | — |
| KPI Tracking | `8eca91b12d77411688bc462183dab70b` | `fbd52be8-dfb5-4edf-b52d-610f24232f6b` | `VITE_NOTION_KPI_DB` |
| Staff Directory (retired) | `36c5a71323a947b5bbd0b8d715d72056` | `607e1339-3e1b-4ed4-b8dc-679be8f0c842` | — |
