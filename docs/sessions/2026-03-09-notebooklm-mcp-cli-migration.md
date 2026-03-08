# Session: NotebookLM MCP CLI Migration

**Date:** 2026-03-09
**Project:** NotebookLM MCP tooling
**Status:** Complete

## Summary

Evaluated and migrated NotebookLM MCP from the fragile npx/patchright setup to the `jacob-bd/notebooklm-mcp-cli` Python package. The old setup required patching two JS files in the npx cache on every cache refresh; the new setup requires zero runtime patching.

## What Was Done

### Research
- Reviewed `jacob-bd/notebooklm-mcp-cli` (2.2k stars, v0.4.3, 74 packages, 29 MCP tools)
- Confirmed architecture difference: cookie extraction at login vs. live browser automation
- Identified this as a direct fix for the Crostini fragility documented in memory

### Installation
- Installed `uv` at `~/.local/bin/uv` (astral.sh installer, aarch64 build)
- `uv tool install notebooklm-mcp-cli` → v0.4.3, 74 packages
- `nlm setup add claude-code` → auto-registered `notebooklm-mcp` in `~/.claude.json`

### Authentication
- `nlm login` opened Crostini Chrome, extracted 42 cookies via CDP
- Stored at `~/.notebooklm-mcp-cli/profiles/default`
- Verified: j.taylor@roammigrationlaw.com, 2 notebooks found

### Cleanup
- Removed old `notebooklm` MCP entry (npx/patchright) from `~/.claude.json`
- Updated MEMORY.md with new setup details and re-auth command

## Comparison

| | Old | New |
|--|--|--|
| Package | `notebooklm-mcp@latest` (npx) | `notebooklm-mcp-cli` v0.4.3 (uv) |
| Auth | patchright live browser automation | Cookie extraction at login only |
| Patching | 2 JS files, lost on cache refresh | None required |
| MCP entry key | `notebooklm` | `notebooklm-mcp` |
| Runtime deps | Chromium running per call | Zero — plain HTTP |
| Tools | ~10 | 29 MCP tools + 40+ CLI commands |

## Notebooks

- Business Advisory — 17 sources (last updated 2026-03-06)
- Jackson Taylor's Dual Leadership — 15 sources (last updated 2025-09-05)

## Re-auth

When cookies expire:
```bash
source ~/.local/bin/env && nlm login
# Takes ~5 seconds, opens Crostini Chrome briefly
nlm login --check  # verify
```

## Key Files Changed

- `~/.claude.json` — removed `notebooklm` entry, `notebooklm-mcp` entry added by `nlm setup`
- `~/.notebooklm-mcp-cli/profiles/default` — cookie store
- `~/.local/bin/uv`, `~/.local/bin/uvx`, `~/.local/bin/nlm`, `~/.local/bin/notebooklm-mcp` — new binaries
- `memory/MEMORY.md` — updated NotebookLM section

## Next Steps

- Restart Claude Code to activate the new MCP server
- Test NotebookLM MCP tools in-session (notebook list, query, source add)
- Consider adding `source ~/.local/bin/env` to `.bashrc` so `nlm`/`uv` are always on PATH
