# RML Tool Ecosystem Map

**Status:** Stub — to be completed by Aaron Taylor during ECC onboarding (T20)
**Last updated:** 2026-02-25

---

## Overview

This document maps how all RML digital tools connect to each other: what data each tool holds, what it sends to other tools, and what it receives. It serves as a reference for understanding the full system and for planning new integrations.

---

## Tool Inventory

| Tool | Category | Primary purpose | Who uses it |
|------|----------|-----------------|-------------|
| **Notion** | Project management | Tasks, projects, documents | All staff |
| **RML Intranet** | Staff portal | Internal apps, forms, platform map | All staff |
| **Metabase** | Business intelligence | Dashboards from Actionstep data | Leadership, ops |
| **Supabase** | Database | Form submissions, app state | Backend / automated |
| **Actionstep** | Matter management | Time tracking, billing, matter data | Lawyers, ops |
| **Google Workspace** | Productivity + identity | Email, calendar, drive, authentication | All staff |
| **Zapier** | Automation | Connects tools without code | Admin / ops |
| **Google App Scripts** | In-workspace automation | Google-internal automations | Admin / ops |
| **Claude Code + ECC** | Development tooling | Building and managing the above | Jackson, Aaron |

---

## Data Flow Diagram

> Complete this section during your training session (T20). Describe how data flows between tools.

```
[Actionstep] ---(SQL Server / htmigration)---> [Metabase] ---> Dashboards viewed by leadership

[Notion] ---(MCP / REST API)---> [RML Intranet Document Hub]
[Notion] ---(MCP)---> [Claude Code] ---> task creation, session notes

[RML Intranet forms] ---> [Supabase] ---> Backend API ---> ...

[Google Workspace] ---(IAP / OAuth)---> [RML Intranet] ---> access control

[Zapier] ---> connects: [add connections here]

[Google App Scripts] ---> automates within: [add here]
```

---

## Tool Details

### Notion

**Holds:** Tasks, projects, documents, meeting notes, staff directory
**Sends to:**
- RML Intranet (Document Hub pulls from Notion via REST API)
- Claude Code (via MCP, for task management)

**Receives from:**
- Claude Code (creates/updates tasks via MCP)
- [Add any Zapier automations that write to Notion]

**Key databases:**
- All Staff Tasks: `collection://4b3348c5-136e-4339-8166-b3680e3b6396`
- Projects: `collection://7e62ecf2-0379-4fa5-9a54-99788a80af99`
- Platform Features: `e38debd2-2692-4e42-ae29-5b5a13fff724`

---

### RML Intranet

**URL:** `intranet.roammigrationlaw.com`
**Holds:** Application UI, form submissions (via Supabase), platform map data
**Sends to:** Supabase (form submissions)
**Receives from:**
- Notion (Document Hub, Platform Features DB, Daily/Critical Updates)
- Google Workspace (authentication via IAP)
- Supabase (reads stored form data)

**Infrastructure:** Cloud Run (GCP project: rmlintranet), behind Google IAP

---

### Metabase

**URL:** `wealth-fish.metabaseapp.com`
**Holds:** Dashboard cards, visualisations, saved queries
**Receives from:** SQL Server (htmigration / Actionstep) — read only, DB ID 34
**Sends to:** Embedded dashboards in [add if embedded anywhere]

---

### Supabase

**Project ref:** `spybbjljplimivkiipar`
**Holds:** Form submissions, user data, app state for RML Intranet
**Receives from:** RML Intranet backend API
**Sends to:** RML Intranet frontend (via backend API)

---

### Actionstep

**Role:** Source of truth for legal matter data, time entries, billing
**Sends to:** htmigration SQL Server (synced data for Metabase)
**Does NOT connect directly to:** Notion, Intranet, Supabase (as of Feb 2026)

---

### Google Workspace

**Role:** Identity provider and productivity suite
**Sends to:**
- RML Intranet (authentication via Google IAP — @roammigrationlaw.com only)
- [Add any Zapier/App Script outbound connections]

**Receives from:**
- Google App Scripts (internal automations)
- [Add any Zapier inbound connections]

---

### Zapier

> Fill in during T18 and T20 sessions.

**Connects:** [list tool pairs]
**Active workflows:** See `docs/tools/zapier-integration.md`

---

### Google App Scripts

> Fill in during T19 and T20 sessions.

**Automates within:** [list Google Workspace tools with scripts]
**Active scripts:** See `docs/tools/google-app-scripts.md`

---

## Integration Gaps and Opportunities

> Document any manual processes that aren't yet automated, or connections that would add value.

| Manual process | Tools involved | Potential solution | Priority |
|----------------|---------------|-------------------|----------|
| | | | |

---

## Related Docs

- `docs/tools/zapier-integration.md`
- `docs/tools/google-app-scripts.md`
- `docs/notion-integration.md`
- `docs/metabase-setup-guide.md`
- `docs/sessions/` — session notes with integration details
