# Session: Gmail Plugin v3 — Chrome Extension Planning

**Date:** 2026-02-25
**Branch:** fix/p1-documentation-updates
**Duration:** ~1 session
**Outcome:** Full project plan documented in Notion, 33 tasks created

---

## What Was Accomplished

1. **Explored the Gmailaddonv3 wireframe** — read all 35 components from `Roam-Migration/Gmailaddonv3` (internal GitHub repo). Mapped the full feature inventory, state architecture, component hierarchy, and implied Actionstep API calls.

2. **Designed the Chrome Extension deployment plan** — decided on Chrome Side Panel (MV3) approach over content script DOM injection. Documented architecture, 6 phases, 33 tasks, prerequisites, risks, and mitigations.

3. **Documented in Notion:**
   - Updated existing project page "AS Google Suite integration" → renamed to "AS Gmail Plugin — Chrome Extension (v3)"
   - Set project status to In progress, marked as Active Initiative, linked GitHub repo
   - Wrote full scope documentation: business objective, architecture, phase plan, risk register, reference links
   - Created 33 tasks across 6 phases (0.1 → 6.5), all with phase-numbered names, summaries, priorities, effort estimates, Driver = Jackson, Project linked

---

## Technical Decisions Made

### Architecture: Chrome Side Panel (MV3) — not DOM injection
- React app loads as a proper extension page in Chrome's native 400px side panel
- Full Chrome API access — not subject to Gmail's Content Security Policy
- Not fragile to Gmail DOM changes (content script only does lightweight view detection)
- Requires Chrome 114+ — safe for corporate use

### Extension Components
```
manifest.json (MV3)
├── sidepanel.html       → existing React SPA (Gmailaddonv3 components)
├── popup.html           → settings, login/logout
├── background.js        → service worker: Actionstep API proxy, OAuth2, storage
└── content.js           → Gmail: URL/view detection, attachment metadata, DOM tags
```

### Email Data Strategy
- Phase 1-2: DOM parsing for email context (fast path, no Gmail API setup)
- Future: migrate to Gmail API for structured data (more reliable)

### Actionstep Integration
- All API calls proxied through background service worker (CORS, token security)
- OAuth2 via `chrome.identity.launchWebAuthFlow`
- Tokens stored in `chrome.storage.sync` (encrypted, synced across devices)

### Distribution
- **Private / domain-restricted** to `@roammigrationlaw.com`
- Avoids public Chrome Web Store review delays
- Staff install via org admin push or direct link

### Smart Compose
- Claude API called from background service worker (API key never in content scripts)
- Email context + matter data sent as structured prompt
- Generated draft rendered in `ComposeSidebarSmartCompose`

---

## Wireframe Analysis (Key Findings)

**Repo:** `Roam-Migration/Gmailaddonv3` (internal, TypeScript/React SPA)
**Source:** Figma Make export — https://www.figma.com/design/09bEGdQeDmaFvwEQ7tZGrv/High-Fidelity-Gmail-Wireframe

The repo is a **static wireframe**, not a deployed plugin. All data is hardcoded. Converting to a real extension requires:
1. Multi-entry Vite build (background.js, content.js, sidepanel.html, popup.html)
2. Actionstep API integration replacing all hardcoded fixtures
3. `manifest.json` + Chrome-specific messaging layer
4. Gmail DOM parsing for email context

**Feature inventory (33 tasks mapped):**
- Matter context sidebar: info card, quick actions (Timer/Note/Task/Files/Open), recent notes, tasks, participants
- Unlinked email flow: matter search + link + create
- File note creation (pre-populated from email)
- Time entry (live timer + save)
- Task creation modal
- Attachment save to matter
- Compose assistant: templates, snippets, variables, AI smart compose
- Inbox tagging: matter tag chips, tag settings, bulk action bar

---

## Challenges

- **Notion MCP token expired** mid-session — required `/mcp` re-auth before task creation could proceed
- **Google Drive folder** (existing plugin scope) was behind auth — couldn't access. Relied on GitHub repo exploration instead.
- **Actionstep API access** not yet confirmed — blocks Phases 2–5. Phase 1 (shell) can proceed independently.

---

## Phase Summary

| Phase | Tasks | Focus | Blocker |
|---|---|---|---|
| 0 | 1 | API credentials | Awaiting authority |
| 1 | 6 | Extension shell (no API needed) | None — start now |
| 2 | 5 | Actionstep auth + live matter data | Needs Phase 0 |
| 3 | 6 | Core actions (notes, time, tasks, files) | Needs Phase 2 |
| 4 | 5 | Compose assistant | Needs Phase 2 |
| 5 | 5 | Inbox tagging | Needs Phase 2 |
| 6 | 5 | Polish + Chrome Web Store | Needs all phases |

**Estimated total: ~9 weeks**

---

## Notion Links

- **Project page:** https://www.notion.so/311e1901e36e805c98e4cb1b55ebe88a
- **Tasks database:** https://www.notion.so/502c024ad46441a4938ca25e852e4f91

---

## Reusable Patterns

- **Chrome Extension MV3 architecture pattern** for internal tools: Side Panel + Background Worker + minimal Content Script is the cleanest approach for Gmail integrations
- **Private CWS distribution** (domain-restricted) is strongly preferred for internal tools — avoids public review, no public listing needed, install via Workspace admin
- **MV3 service worker statelessness**: all state must be in `chrome.storage`, never in-memory variables — service worker is terminated between events
