# RML Intranet Sync Skill

## Purpose

Systematic post-change audit workflow that ensures every RML Intranet change is reflected in both the **Platform Map** (Notion DB of all features) and the **Project Map** (React Flow visualization of Notion Projects DB), with correct cross-links between them.

Run this skill after any session where intranet code was changed. It is the authoritative checklist for keeping the three sources of truth in sync:

| Source | What it tracks | How to update |
|--------|---------------|---------------|
| **Platform Map DB** | All intranet features and their status | Create/update Notion entries via MCP |
| **Project Map** | All RML projects, their status, and department | Update Notion Projects DB entries via MCP |
| **Cross-link** | Which platform features belong to which project | Set "Project" relation on Platform Map entries |

---

## When to Run

- After adding a new intranet page or route
- After adding a new form
- After changing a feature's functional status
- After completing or starting a project phase
- At the end of any substantial intranet session (as part of session closure)

---

## Pre-Flight

Verify Notion token is active before any writes:
```
notion-fetch: https://www.notion.so/2ece1901e36e806e8d7ac3ebf84b9b73
```
If this fails with 401, re-auth via `/mcp` before continuing.

---

## Phase 1: Detect What Changed

Run against the intranet repo to identify change types:

```bash
cd /tmp/Rmlintranetdesign
git diff --name-only HEAD~1 HEAD
# Or for multiple commits since last sync:
git log --oneline --name-only [last-sync-hash]..HEAD
```

**Map file changes to sync actions:**

| Files changed | Sync action needed |
|--------------|-------------------|
| `src/app/pages/[New]Page.tsx` added | Platform Map entry (new feature) |
| `src/app/App.tsx` — new `<Route>` | Platform Map entry (new route) |
| `backend/src/routes/[new].ts` | Platform Map entry (new form/endpoint) |
| `nginx.conf.template` — new location | Platform Map entry |
| Feature changed status (stub → functional) | Update Platform Map entry Status field |
| `src/app/pages/[Existing]Page.tsx` major update | Platform Map entry status review |
| Project phase completed (e.g., deploy) | Update Notion Projects DB entry status |

---

## Phase 2: Platform Map Sync

For **each new feature or changed status**, update the Platform Map Notion DB.

### 2a. Get current entries (avoid duplicates)

Fetch the Platform Map DB to see existing entries:
```
notion-fetch: https://www.notion.so/69eba1aab2ba46578130db2b74dd686d
```

### 2b. Create new entry (for new pages/features)

Use `notion-create-pages` with `data_source_id: e38debd2-2692-4e42-ae29-5b5a13fff724`:

**Required fields:**
| Property | Value |
|----------|-------|
| Name | Feature display name (e.g., "Project Map") |
| Section | One of: `Home` · `Legal Hub` · `People & Culture` · `Core Operations` · `Training & Competency` · `Sales & Marketing` · `Finance` · `Business Intelligence` · `My Workspace` · `Admin Hub` |
| Status | `Functional` · `Partial` · `Stub` · `Planned` |
| Route | e.g., `/project-map` |
| Data Source | `Notion` · `Metabase` · `Supabase` · `External` · `LocalStorage` · `Static` · `None` |
| Description | Staff-facing one-liner |
| Notes | Internal wiring notes (component filename, API path, DB IDs, build decisions) |
| Visible | `__YES__` (default) or `__NO__` |
| **Project** | Relation URL to parent project in Projects DB — **MANDATORY for new entries** |

**Key IDs:**
- Platform Map DB: `collection://e38debd2-2692-4e42-ae29-5b5a13fff724`
- Platform Map page: `https://www.notion.so/69eba1aab2ba46578130db2b74dd686d`

### 2c. Update existing entry (for status changes)

Find the entry by Route or Name, then use `notion-update-page`:
```
notion-update-page: [entry-page-url]
Update: Status → [new status]
```

---

## Phase 3: Project Map Sync

The Project Map auto-reflects the Notion Projects DB — to keep it current, update the Projects DB.

### 3a. Find the relevant project

The Intranet Launch project is at: `https://www.notion.so/2ece1901e36e819c8ee2d7ad5c1d0209`

Other projects: fetch `collection://7e62ecf2-0379-4fa5-9a54-99788a80af99` to browse.

### 3b. When to update the Projects DB

| Intranet event | Projects DB action |
|---------------|-------------------|
| New major feature shipped and deployed | Update project Status (e.g., Planning → In progress → Done) |
| New project/initiative started for the intranet | Create a new Projects DB entry, set Department to "Technology & BI" |
| Project phase completed (all features in section are Functional) | Consider updating project Status to Done |
| New work identified that warrants its own project | Create Projects DB entry + link tasks |

### 3c. Update a project

Use `notion-update-page` on the project page URL:
```
notion-update-page: https://www.notion.so/[project-page-id]
Update: Status → [new status]
```

Or create a new project entry if one doesn't exist for the work being done.

---

## Phase 4: Link Platform Features to Projects

Every Platform Map entry should have the "Project" relation set.

### 4a. Check which entries lack a Project relation

After creating/updating entries, verify they have a Project value. If not:

1. Find the correct project in the Projects DB
2. Update the Platform Map entry with the project's page URL as the "Project" relation

### 4b. Standard project URLs for intranet features

| Work type | Project |
|-----------|---------|
| Core intranet pages (Home, Legal Hub, etc.) | Intranet Launch: `https://www.notion.so/2ece1901e36e819c8ee2d7ad5c1d0209` |
| SPQR/Metabase BI features | AS SPQR BI Dashboard project |
| Org Intelligence features | Separate Org Intelligence project (or Intranet Launch) |
| New standalone tools | Create a new Projects DB entry |

---

## Phase 5: Verify

After all sync actions:

- [ ] Every new page/form has a Platform Map entry
- [ ] Every Platform Map entry has Status, Section, Data Source, Route set
- [ ] Every Platform Map entry has a "Project" relation
- [ ] Project Map reflects current project statuses in Notion Projects DB
- [ ] No duplicate entries in Platform Map (new entry + stale pre-existing entry for same feature)

Open the Platform Map page in the intranet (`/platform-map`) and verify new entries appear correctly. If not visible, check the `Visible` checkbox is set to `__YES__`.

---

## Pre-Sync Checklist

- [ ] Notion token active (preflight fetch succeeded)
- [ ] git diff reviewed — all changed files identified
- [ ] Change types mapped to sync actions
- [ ] Platform Map entries created/updated
- [ ] Project Map (Projects DB) updated if project status changed
- [ ] Project relation set on all new Platform Map entries
- [ ] Visible field set to `__YES__` on all new entries
- [ ] `/platform-map` in intranet shows new entries correctly

---

## Anti-Patterns to Avoid

**Platform Map:**
- Creating a Platform Map entry without a "Project" relation — orphaned features can't be traced to work
- Using the collection ID (e38debd2) as a page URL in the "Project" relation — always use the project's actual page URL
- Skipping the Notes field — notes are the primary way developers understand the wiring of each feature
- Forgetting to set `Visible: __YES__` — new entries default to hidden

**Project Map:**
- Assuming the Project Map updates automatically from code changes — it only reflects the Notion Projects DB, which must be manually updated
- Creating Projects DB entries without a Department relation — they'll appear in an "Unknown" column on the Project Map

---

## Key IDs

| Resource | ID / URL |
|----------|----------|
| Platform Map DB | `collection://e38debd2-2692-4e42-ae29-5b5a13fff724` |
| Platform Map page | `https://www.notion.so/69eba1aab2ba46578130db2b74dd686d` |
| Projects DB | `collection://7e62ecf2-0379-4fa5-9a54-99788a80af99` |
| Intranet Launch project | `https://www.notion.so/2ece1901e36e819c8ee2d7ad5c1d0209` |
| Core Data page | `https://www.notion.so/2ece1901e36e806e8d7ac3ebf84b9b73` |
| Technology & BI dept | `https://www.notion.so/ee1acebf737e4577ad7dd6ff455d10d7` |
