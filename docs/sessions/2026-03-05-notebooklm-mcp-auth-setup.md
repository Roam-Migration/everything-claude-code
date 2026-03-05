# Session: NotebookLM MCP Auth Setup

**Date:** 2026-03-05
**Duration:** Multi-session debugging
**Outcome:** NotebookLM MCP authenticated successfully

---

## Problem

`setup_auth` consistently returned "Authentication failed or was cancelled" in under 200ms — far too fast for any browser interaction. The browser was never actually appearing.

## Root Causes (in order discovered)

### 1. Wrong env var name
`~/.claude.json` had `NOTEBOOKLM_HEADLESS=false` — the package reads `HEADLESS`, not `NOTEBOOKLM_HEADLESS`. The default is `headless: true`.

**Fix:** Added `HEADLESS=false` to the `env` block in `~/.claude.json` for the notebooklm MCP server.

### 2. Missing patchright browser
Patchright (playwright fork) requires its own specific browser revision. The installed package expected `chromium-1200` but only `chromium-1208` was present at `~/.cache/ms-playwright/`.

**Fix:**
```bash
cd /home/jtaylor/.npm/_npx/[hash]/node_modules/notebooklm-mcp
npx patchright install chromium
```

### 3. Missing --disable-gpu and --no-sandbox flags
On this system (ChromeOS Crostini / arm64), Chromium fails without these flags. GPU rendering is unavailable.

**Fix:** Patched `dist/auth/auth-manager.js` in both active npx cache dirs to add these to the launch args.

### 4. `channel: "chrome"` — the real blocker
The auth-manager used `channel: "chrome"` in `launchPersistentContext`. Patchright's channel option has **hardcoded OS paths** — on Linux it looks for Chrome at `/opt/google/chrome/chrome`. This path doesn't exist on this system (`google-chrome` is at `/usr/bin/google-chrome`). The browser launch threw immediately, causing the <200ms failure.

**Fix:** Patched `dist/auth/auth-manager.js` to remove `channel: "chrome"` entirely. Without a channel, patchright uses its own bundled Chromium (which was installed in step 2).

## Diagnosis Method
- Checked `headless` field in `get_health` response — confirmed `false` after env var fix
- Observed tool completion time (~40-200ms) — far too fast, indicating pre-browser failure
- Ran patchright directly in Node.js to isolate launch errors:
  ```js
  // Without channel: "chrome" → SUCCESS
  // With channel: "chrome" → "Chromium distribution 'chrome' is not found at /opt/google/chrome/chrome"
  ```

## Current State (Fragile)
The patches are applied to two npx cache directories:
- `/home/jtaylor/.npm/_npx/0d29dd9f4e472da9/`
- `/home/jtaylor/.npm/_npx/16baa19dd5d31de6/`

**These patches will be lost** if:
- The npx cache is cleared (`npm cache clean`)
- `notebooklm-mcp@latest` resolves to a new version (new cache hash)
- System is reimaged

A durable fix is needed — see Notion task.

## `~/.claude.json` Config (current working state)
```json
{
  "type": "stdio",
  "command": "npx",
  "args": ["notebooklm-mcp@latest"],
  "env": {
    "NOTEBOOKLM_HEADLESS": "false",
    "HEADLESS": "false",
    "PUPPETEER_EXECUTABLE_PATH": "/usr/bin/chromium",
    "CHROME_PATH": "/usr/bin/chromium"
  }
}
```

## Key Insight: Playwright `channel` Option
Playwright/patchright's `channel` option does NOT use `$PATH` or system browser detection. It maps to hardcoded paths:
- `chrome` → `/opt/google/chrome/chrome` (Linux)
- `msedge` → `/opt/microsoft/msedge/msedge` (Linux)

If your system Chrome is elsewhere, omit `channel` and let patchright use its own bundled browser.
