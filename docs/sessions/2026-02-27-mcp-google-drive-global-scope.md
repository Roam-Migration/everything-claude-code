# Session: MCP Google Drive Global Scope

**Date:** 2026-02-27
**Branch:** fix/p1-documentation-updates

---

## What Was Accomplished

Investigated why another Claude session couldn't surface the Google Drive MCP, and expanded the MCP registration to all folders via user-scope.

---

## Problem

Another Claude Code session was unable to access Google Drive (and other) MCP tools. The `@piotr-agier/google-drive-mcp` server was installed but only registered at `local` scope under three specific project paths:

- `/home/jtaylor`
- `/home/jtaylor/everything-claude-code`
- `/tmp/Rmlintranetdesign`

Any session running from a different directory had no access to the tools.

---

## Root Cause

Claude Code MCP servers registered at `local` scope are stored under the matching `projects[path].mcpServers` key in `~/.claude.json`. They are only active when the session's working directory matches that path. Sessions in unlisted directories see no MCP tools at all.

---

## Solution

Re-registered the Google Drive MCP at **user scope** using:

```bash
claude mcp add google-drive \
  --scope user \
  -e GOOGLE_DRIVE_OAUTH_CREDENTIALS=/home/jtaylor/.config/google-drive-mcp/gcp-oauth.keys.json \
  -e GOOGLE_DRIVE_MCP_TOKEN_PATH=/home/jtaylor/.config/google-drive-mcp/tokens.json \
  -e GOOGLE_DRIVE_MCP_SCOPES=drive.readonly,spreadsheets,calendar.readonly \
  -- npx -y @piotr-agier/google-drive-mcp
```

User-scope entries are stored in a top-level `mcpServers` key in `~/.claude.json`, making them available in every session regardless of working directory.

---

## MCP Scope Reference

| Scope | Storage location | Available in |
|-------|-----------------|--------------|
| `local` | `~/.claude.json` under `projects[path].mcpServers` | That directory only |
| `user` | `~/.claude.json` top-level `mcpServers` | All sessions |
| `project` | `.mcp.json` at repo root | Anyone who checks out the repo |

---

## Follow-up

- The per-project `google-drive` entries in `~/.claude.json` are now redundant (user-scope supersedes them) but harmless — no cleanup required
- Other sessions just need to restart Claude Code to pick up the new user-scope registration
