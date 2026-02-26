# Notion Task: Evaluate Supabase + Tiptap as In-App Notion Replacement

**For:** Claude Browser (Notion access)
**Action:** Create a new task in the All Staff Tasks database
**Database Collection ID:** `4b3348c5-136e-4339-8166-b3680e3b6396`

---

## Task Properties

| Property | Value |
|----------|-------|
| **Task** (Title) | Evaluate Supabase + Tiptap stack as in-app Notion replacement for Intranet |
| **Status** | Proposed |
| **Priority** | ⚪ Low |
| **Effort** | 5 |
| **Driver** | Jackson (`cd2bebb6-f5c0-46aa-a3d3-86116bbdcc87`) |
| **Project** | Intranet Launch (search Projects database for match) |
| **Tags** | Website, KPI |

---

## Task Description (paste as page content)

Evaluate and prototype replacing Notion API integration with a self-hosted Supabase + Tiptap stack to provide Notion-like functionality directly within the Intranet app. This would eliminate the external Notion dependency and give us full control over data, UI, and real-time collaboration.

## Proposed Stack

| Layer | Tool | Replaces |
|-------|------|----------|
| Structured data (tasks, projects, KPIs) | **Supabase** (PostgreSQL + real-time + row-level security) | Notion databases |
| Rich text / wiki / documents | **Tiptap** (ProseMirror-based block editor) | Notion pages |
| Table views (filter, sort, paginate) | **TanStack Table** + shadcn/ui components | Notion database views |
| Kanban boards | **@dnd-kit** | Notion board view |
| KPI dashboards | **Recharts** | Notion dashboard widgets |

### Why Tiptap

- Headless, framework-agnostic editor built on ProseMirror
- Extensive extension ecosystem (tables, task lists, code blocks, mentions, slash commands)
- Collaboration-ready via Yjs or Hocuspocus
- Used in production by GitLab, Substack, and others
- React integration is first-class
- Commercial support available if needed (Tiptap Cloud)

### Reference: La Suite Numerique (French Government)

The French government's **La Suite** project (https://github.com/suitenumerique) is a sovereign open-source digital workspace built for 500,000+ civil servants across 15 ministries. Their **Docs** product (https://github.com/suitenumerique/docs) is a collaborative document/wiki platform built with Django + Next.js + BlockNote (which itself is built on Tiptap/ProseMirror) + Yjs for real-time collaboration.

La Suite demonstrates that a Tiptap/ProseMirror-based editor stack can scale to government-grade production use. Their architecture (editor + PostgreSQL backend + real-time sync) closely mirrors our proposed Supabase + Tiptap approach. Franco-German joint initiative focused on digital sovereignty — aligns with our goal of owning our own data rather than depending on Notion's API.

Key La Suite components worth studying:
- **Docs** — collaborative wiki/notes (Django + Next.js + BlockNote/Tiptap)
- **Grist** — open-source spreadsheet/database (like Airtable)
- Architecture patterns for real-time collaboration at scale

### Why This Matters

Current Notion integration has structural limitations:
1. API key exposed in browser (`VITE_NOTION_API_KEY`)
2. No backend proxy — all calls go client-to-Notion
3. No pagination, no SDK, rate limit concerns
4. Notion schema drift breaks queries silently
5. Can't customize UI beyond what Notion API returns

Supabase + Tiptap gives us:
- Data in PostgreSQL we fully control
- Row-level security tied to IAP auth
- Real-time subscriptions (instant updates)
- Custom UI using our shadcn component library
- No third-party API rate limits or vendor lock-in

## Steps

- Research Supabase self-hosting on GCP (Cloud Run or GCE)
- Prototype Tiptap editor integration in Intranet (basic rich text page)
- Design PostgreSQL schema for tasks, projects, KPIs (mirror current Notion structure)
- Build proof-of-concept: one database view (e.g., tasks table) powered by Supabase
- Evaluate real-time collaboration needs (Yjs/Hocuspocus)
- Compare cost/effort vs continuing with Notion API

## Context

This is a future consideration, not immediate priority. Current Notion integration works for basic use cases. This task is about evaluating the path forward if we want richer in-app functionality (documents, task boards, KPI dashboards) without the constraints of the Notion API.

The shared component library (@roam-migration/components v0.2.0) already has shadcn/ui components that would be used for building these views.

## Definition of Done

- [ ] Supabase self-hosting feasibility documented (GCP deployment options, cost estimate)
- [ ] Tiptap editor prototype running in Intranet (basic page creation/editing)
- [ ] PostgreSQL schema draft for tasks + projects (mapping from current Notion properties)
- [ ] Written recommendation: migrate vs. stay on Notion, with timeline estimate
- [ ] La Suite architecture reviewed for applicable patterns

## Links

- La Suite (French Gov OSS): https://github.com/suitenumerique
- La Suite Docs: https://github.com/suitenumerique/docs
- Tiptap: https://tiptap.dev
- Tiptap Notion-like template: https://tiptap.dev/docs/ui-components/templates/notion-like-editor
- Supabase: https://supabase.com
- Supabase self-hosting: https://supabase.com/docs/guides/self-hosting
- Shared components PR: https://github.com/Roam-Migration/rml-shared-components/pull/5
- Notion integration handover: /home/jtaylor/everything-claude-code/docs/notion-integration.md
