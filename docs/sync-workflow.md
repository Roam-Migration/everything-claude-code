# Sync Workflow - Keeping Local and GitHub in Sync

## Overview

The local `/home/jtaylor/everything-claude-code` repository is the **source of truth** for:
- Metabase MCP server and skills
- Notion integration documentation
- Team setup scripts and guides
- Custom configurations and prompts

**This must stay synced with GitHub** so the team has access to latest resources.

---

## Repository Structure

```
Local: /home/jtaylor/everything-claude-code
   ↕ git pull/push
GitHub: https://github.com/Roam-Migration/everything-claude-code
   ↕ team members clone
Deployed: ~/.claude/skills/, ~/.claude/mcp-servers/
```

---

## Daily Sync Workflow

### Morning: Pull Team Updates

```bash
cd /home/jtaylor/everything-claude-code

# Pull latest from team
git pull team main

# If on feature branch
git pull team fix/p1-documentation-updates

# Update dependencies if MCP servers changed
cd mcp-servers/metabase && npm install && npm run build
```

### During Work: Track Changes

```bash
# Check what you've modified
git status

# Review changes
git diff
```

### End of Day: Push Contributions

```bash
# Stage changes
git add path/to/changed/files

# Commit with clear message
git commit -m "feat: add X" # or "fix:", "docs:", etc.

# Push to team repo
git push team feature-branch
```

---

## Quick Reference

```bash
# Daily sync
cd /home/jtaylor/everything-claude-code && git pull team main

# Push changes
git add . && git commit -m "feat: description" && git push team branch

# Check status
git status && git log --oneline -5

# Update MCP servers after pull
cd mcp-servers/metabase && npm install && npm run build

# Deploy skills after pull
cp -r skills/* ~/.claude/skills/
```

---

## Why This Matters

1. **Team Access**: Changes you make locally won't help the team until pushed
2. **Consistency**: Everyone works from same codebase
3. **Backup**: Git protects against local file loss
4. **History**: Track what changed, when, and why
5. **Collaboration**: Multiple people can contribute safely

**Golden Rule:** Local repo is source → Git is sync → `~/.claude/` is deployment

Keep them in sync for best team productivity! 🔄
