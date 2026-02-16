# Team Sync Guide - Managing Shared vs Personal Config

## Overview

This repository uses a **template pattern** to separate team-wide configurations from user-specific settings. This allows team members to:
- ✅ Pull shared templates and documentation
- ✅ Customize settings for their environment
- ✅ Avoid conflicts from personal configurations
- ✅ Contribute improvements back to team templates

## File Categories

### 🟢 Team-Wide (Committed)

**Always committed to Git and synced:**

| Path | Purpose |
|------|---------|
| `agents/` | Specialized subagents for delegation |
| `skills/` | Workflow definitions and domain knowledge |
| `commands/` | Slash commands for quick execution |
| `rules/` | Always-follow guidelines |
| `hooks/` | Trigger-based automations |
| `mcp-configs/` | MCP server reference configurations |
| `mcp-servers/` | Custom MCP server implementations (with `.example` configs) |
| `docs/` | Documentation and handover guides |
| `prompts/*.md` | Prompt templates (except `.draft.md`) |
| `.claude/settings.example.json` | Plugin configuration template |
| `.claude/package-manager.json` | Default package manager |
| `.claude/README.md` | Configuration guide |

### 🔴 User-Specific (Gitignored)

**Never committed - stays local only:**

| Pattern | Purpose |
|---------|---------|
| `.claude/settings.json` | Your plugin configuration |
| `.claude/settings.local.json` | Local overrides |
| `.claude/*.local.json` | Machine-specific configs |
| `prompts/*.draft.md` | Work-in-progress prompts |
| `prompts/*.local.md` | Machine-specific prompts |
| `prompts/*.tmp` | Temporary working files |
| `personal/` | Personal notes/configs |
| `private/` | Private files |
| `.env*` | Environment variables |
| `*.key`, `*.pem` | Credentials |

### 🟡 Special Cases

**MCP Server configurations:**
- **Committed:** `mcp-servers/metabase/.mcp.json.example` (template)
- **Gitignored:** `mcp-servers/metabase/.mcp.json` (with your API keys)

**Documentation:**
- **Committed:** `docs/notion-integration.md` (workspace structure, schemas)
- **Not committed:** API keys, personal tokens (use environment variables)

## Workflow

### Initial Setup (New Team Member)

```bash
# 1. Clone the fork
git clone https://github.com/jtaylorcomplize/everything-claude-code.git
cd everything-claude-code

# 2. Set up personal configs from templates
cp .claude/settings.example.json .claude/settings.json
# Edit .claude/settings.json to enable/disable plugins

# 3. Set up MCP servers
cd mcp-servers/metabase
npm install
cp .mcp.json.example .mcp.json
# Edit .mcp.json with your Metabase credentials

# 4. Install to Claude Code
cp -r . ~/.claude/mcp-servers/metabase/
# Follow installation instructions in README.md

# 5. Install skills, commands, etc. (via plugin or manually)
```

### Daily Development

**Pulling team updates:**
```bash
git pull fork main
# Your personal .claude/settings.json won't be affected
# Team changes to .claude/settings.example.json are pulled
```

**Making personal customizations:**
```bash
# Edit gitignored files - they stay local
nano .claude/settings.json
nano prompts/my-draft.draft.md
```

**Contributing improvements:**
```bash
# Add new skill or documentation
git add skills/my-new-skill/
git commit -m "feat: add my-new-skill for X"
git push fork my-feature-branch
```

### Sync Strategy

```
┌─────────────────────────────────────────────────────────┐
│ GitHub Fork (jtaylorcomplize/everything-claude-code)   │
├─────────────────────────────────────────────────────────┤
│ ✅ agents/, skills/, commands/, rules/, hooks/         │
│ ✅ mcp-servers/ (with .example configs)                │
│ ✅ docs/, prompts/ (team templates)                    │
│ ✅ .claude/settings.example.json                       │
│ ❌ .claude/settings.json (gitignored)                  │
│ ❌ prompts/*.draft.md (gitignored)                     │
└─────────────────────────────────────────────────────────┘
                        ↕ git pull/push
┌─────────────────────────────────────────────────────────┐
│ Local Clone (/home/jtaylor/everything-claude-code)     │
├─────────────────────────────────────────────────────────┤
│ ✅ All team files (tracked)                            │
│ ➕ .claude/settings.json (your config)                 │
│ ➕ .claude/settings.local.json (local overrides)       │
│ ➕ prompts/*.draft.md (your drafts)                    │
│ ➕ mcp-servers/*/.mcp.json (your credentials)          │
└─────────────────────────────────────────────────────────┘
                        ↕ cp -r
┌─────────────────────────────────────────────────────────┐
│ Claude Code Home (~/.claude/)                           │
├─────────────────────────────────────────────────────────┤
│ ✅ Installed skills, commands, agents                  │
│ ✅ MCP servers (with your credentials)                 │
│ ➕ Your session history, memory, todos                 │
└─────────────────────────────────────────────────────────┘
```

## Common Scenarios

### Scenario 1: Updating Recommended Plugins

**Team lead wants to add new recommended plugin:**

```bash
# Edit the template
nano .claude/settings.example.json
# Add new plugin to enabledPlugins

git add .claude/settings.example.json
git commit -m "docs: recommend new plugin for X"
git push fork main
```

**Team members pull the update:**
```bash
git pull fork main
# Check what changed
cat .claude/settings.example.json
# Manually update their settings.json if desired
```

### Scenario 2: Sharing a New Skill

**Developer creates new skill:**
```bash
mkdir skills/my-skill
nano skills/my-skill/SKILL.md
# Write skill content

git add skills/my-skill/
git commit -m "feat: add my-skill for database patterns"
git push fork feature/my-skill
gh pr create
```

### Scenario 3: Documenting API Integration

**Add documentation (team-wide):**
```bash
nano docs/api-integration.md
git add docs/api-integration.md
git commit -m "docs: add API integration guide"
git push fork main
```

**Add prompt template (team-wide):**
```bash
nano prompts/api-task-template.md
git add prompts/api-task-template.md
git commit -m "feat: add API task prompt template"
git push fork main
```

**Create personal draft (stays local):**
```bash
nano prompts/my-specific-task.draft.md
# Not committed - .draft.md is gitignored
```

### Scenario 4: Updating MCP Server

**Update server code (team-wide):**
```bash
nano mcp-servers/metabase/src/index.ts
cd mcp-servers/metabase && npm run build
git add mcp-servers/metabase/src/
git add mcp-servers/metabase/dist/
git commit -m "fix: improve Metabase validation"
git push fork main
```

**Update credentials (stays local):**
```bash
nano mcp-servers/metabase/.mcp.json
# Not committed - .mcp.json is gitignored
# Only .mcp.json.example is tracked
```

## Best Practices

### ✅ Do

- **Commit** reusable templates, skills, documentation
- **Commit** `.example` configuration files
- **Use** environment variables for secrets
- **Document** recommended settings in `.example` files
- **Pull** regularly to get team updates
- **Review** `.gitignore` before committing new file types

### ❌ Don't

- **Commit** personal API keys or credentials
- **Commit** `.claude/settings.json` (use `.example` instead)
- **Commit** work-in-progress prompt drafts (use `.draft.md`)
- **Hardcode** credentials in MCP server code
- **Skip** `.example` files (they're the team source of truth)

## Troubleshooting

### "My settings.json got committed!"
```bash
git rm --cached .claude/settings.json
git commit -m "fix: remove user-specific settings"
git push fork main
```

### "I accidentally committed credentials!"
```bash
# 1. Remove from Git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/file" HEAD

# 2. Rotate the credentials immediately
# 3. Force push (if necessary and safe)
# 4. Update .gitignore to prevent recurrence
```

### "Team template conflicts with my local config"
```bash
# Your settings.json is gitignored, so no conflict
# But if template changed:
cat .claude/settings.example.json
# Manually merge desired changes into your settings.json
```

### "How do I share my settings without committing?"
```bash
# Export your config (without secrets)
cp .claude/settings.json /tmp/my-settings.json
# Share file directly with team member
# Or submit PR to update settings.example.json
```

## Migration from Unstructured Setup

If you have existing mixed team/personal configs:

```bash
# 1. Identify team-wide content
# Review each untracked file:
git status --short

# 2. Move personal configs to gitignored names
mv .claude/settings.json .claude/settings.json.backup
cp .claude/settings.example.json .claude/settings.json
# Merge your customizations from backup

# 3. Commit team-wide content only
git add docs/notion-integration.md
git add prompts/notion-*.md
git add .claude/settings.example.json
git commit -m "docs: add team documentation and templates"

# 4. Verify nothing personal was committed
git diff HEAD~1 --name-only
git show HEAD
```

## Team Tools

### Notion CLI

**Purpose:** Automate Notion task creation during session closure

**Location:** `~/.claude/tools/notion-cli/`

**Installation:**
```bash
cd ~/.claude/tools/notion-cli
npm install
npm run build
npm link  # Makes globally available
```

**Usage:**
```bash
# Bulk create tasks
notion-cli bulk-create session-tasks.json

# Query tasks
notion-cli query-tasks --driver "me" --status "Not started"
```

**Documentation:** See `docs/tools/notion-cli-integration.md`

**Status:** ✅ Committed to repository, team-wide tool

---

## Updating This Guide

This guide should be updated when:
- New file categories are added
- Gitignore patterns change
- New sync workflows emerge
- Team conventions evolve

**To update:**
```bash
nano docs/team-sync-guide.md
git add docs/team-sync-guide.md
git commit -m "docs: update team sync guide"
git push fork main
```

## Summary

| Want to... | Action | Committed? |
|------------|--------|------------|
| Share a skill with team | Add to `skills/` | ✅ Yes |
| Configure my plugins | Edit `.claude/settings.json` | ❌ No |
| Recommend plugin to team | Edit `.claude/settings.example.json` | ✅ Yes |
| Document API integration | Add to `docs/` | ✅ Yes |
| Draft a prompt | Use `.draft.md` suffix | ❌ No |
| Share prompt template | Use `.md` without `.draft` | ✅ Yes |
| Store API key | Use `.env` or `.mcp.json` | ❌ No |
| Template API config | Use `.example` suffix | ✅ Yes |

**Golden Rule:** If it has secrets or is personal preference → gitignore it. If it helps the team → commit it.
