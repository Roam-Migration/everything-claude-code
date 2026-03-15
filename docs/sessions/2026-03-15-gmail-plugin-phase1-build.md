# Session Notes — 2026-03-15 — AS Gmail Plugin Phase 1 Build

## What Was Done

### Repo: Roam-Migration/Gmailaddonv3

Implemented all Phase 1 code tasks for the AS Gmail Chrome Extension (v3).
The `build/` directory now produces a complete, loadable MV3 extension.

**[1.3] Side panel entry point** (`sidepanel.html`, `src/sidepanel/main.tsx`, `src/sidepanel/SidePanelApp.tsx`)
- `sidepanel.html` — Chrome loads this as the side panel page
- `SidePanelApp.tsx` — full state machine: idle/inbox → landing screen, compose/reply → ComposeAssistantSidebar, unlinked email → ActionstepSidebarUnlinked, linked email → ActionstepSidebar with all sub-views (file note, time entry, task modal, attachments)
- All 9 mockup states from the Figma wireframe wired up
- Dev fallback: `DEV_MOCK_CONTEXT` shows matter view when chrome APIs absent (vite dev server)

**[1.4] Content script** (`src/content/content.ts`)
- Parses Gmail view from URL hash: `#inbox`, `#inbox/threadId`, `#compose`, etc.
- Intercepts `history.pushState` / `replaceState` for SPA navigation
- `hashchange` listener for primary navigation
- Debounced `MutationObserver` (300ms) for compose/reply DOM overlay detection
- Deduplication: only sends to background when context actually changes

**[1.5] Background service worker** (`src/background/background.ts`)
- `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })` on install
- `chrome.tabs.onUpdated` — enables panel on Gmail tabs, attempts auto-open on load
- `chrome.runtime.onMessage` — receives from content script, persists to `chrome.storage.local`, forwards to open side panel
- MV3 lifecycle safety: storage is the primary channel (survives service worker restart)

**[1.1] Vite multi-entry build** (`vite.config.ts`, `scripts/build-workers.mjs`)
- `vite.config.ts`: rollupOptions.input points only to `sidepanel.html` (extension build)
- `vite dev` still serves `index.html` / Figma mockup unchanged
- `scripts/build-workers.mjs`: esbuild builds `background.js` (ESM) and `content.js` (IIFE)
- `npm run build` = Vite side panel + esbuild workers → complete `build/` directory
- esbuild added as explicit devDependency

**[1.2] MV3 manifest** (`public/manifest.json`)
- Permissions: `sidePanel`, `storage`, `tabs`
- Host permissions: `https://mail.google.com/*`
- Background service worker with `"type": "module"`
- Content script: `run_at: document_idle`, IIFE format
- Side panel: `default_path: sidepanel.html`
- No icons (Phase 6 — Polish)

**Shared types** (`src/types.ts`)
- `GmailContext`, `GmailMode`, `ExtensionMessage` — imported by all three entry points

## Technical Patterns Learned

### Chrome Extension MV3 — Mixed Output Format Problem
Vite cannot produce IIFE (content script) and ESM (background worker) in the same build pass.
**Solution**: Vite builds the HTML/React side panel; esbuild builds workers separately via `scripts/build-workers.mjs`.
- Background: `format: 'esm'` (MV3 `"type": "module"` service worker)
- Content: `format: 'iife'` (Chrome content_scripts are classic scripts — `export {}` would be a SyntaxError)

### MV3 Service Worker Lifecycle — Storage-First Communication
Service workers terminate after ~30s idle. `chrome.runtime.sendMessage` from background to side panel fails silently if:
- The panel wasn't open when the content script fired, or
- The service worker was restarted between content script message and panel open

**Pattern**: Background always writes to `chrome.storage.local`. Side panel reads on mount + watches `chrome.storage.onChanged`. `chrome.runtime.onMessage` is kept as a fast-path for when the panel is already open.

### MutationObserver in Gmail — Debounce is Critical
Gmail fires hundreds of DOM mutations per navigation. Without debouncing, the content script would flood the background worker.
300ms debounce + deduplication (compare serialised context) keeps message volume negligible.

### `public/` Directory in Vite — Static Asset Passthrough
Files in `public/` are copied verbatim to `build/` at the end of every Vite build. `manifest.json` goes here so it references final output filenames (`background.js`, `content.js`, `sidepanel.html`) without needing a transform step.

## Remaining Work

- [ ] [1.6] Load unpacked verification — load `build/` at chrome://extensions, verify side panel opens on Gmail with mock data (manual step, requires Chrome)
- [ ] Next session: Build Postman collection for Actionstep API endpoints (Phase 2 prep, blocked on AS OAuth redirect URI approval)
- [ ] Phase 6: Create extension icons (48x48, 128x128 PNG) for manifest

## Key IDs / References

| Resource | Value |
|---|---|
| GitHub repo | https://github.com/Roam-Migration/Gmailaddonv3 |
| Notion project page | https://www.notion.so/311e1901e36e805c98e4cb1b55ebe88a |
| Figma wireframe | https://www.figma.com/make/09bEGdQeDmaFvwEQ7tZGrv/High-Fidelity-Gmail-Wireframe |
| AS OAuth client (v2, approved) | CLIENT_ID: 16929HammondBC2E11460FE6F5AE2751 |
| Commits this session | `2094887` (1.3), `305f900` (1.4/1.5), `64a704c` (1.1/1.2) |
