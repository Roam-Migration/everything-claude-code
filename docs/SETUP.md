# ECC Setup, Contribution & Troubleshooting Guide

Full reference for setting up, contributing to, and troubleshooting everything-claude-code.

---

## New Team Member Setup

### 1. Clone Repository
```bash
git clone https://github.com/Roam-Migration/everything-claude-code.git
cd everything-claude-code
```

### 2. Run Setup Script
```bash
node scripts/setup-team-environment.js
```

This will:
- Check for required plugins
- Copy configuration templates
- Install MCP servers
- Install commands to `~/.claude/commands/`
- Activate hooks in `~/.claude/settings.json`

### 3. Install Required Plugins

```bash
/plugin install Notion@claude-plugins-official
/plugin install context7@claude-plugins-official
/plugin install frontend-design@claude-plugins-official
```

Optional: `supabase@claude-plugins-official`

> GitHub: use `gh` CLI instead — pre-authenticated, same capability.

### 4. Configure Personal Settings

```bash
cp .claude/settings.example.json .claude/settings.json
# Edit if needed — this file is gitignored
```

### 5. Configure Metabase MCP (RML only)

```bash
cp mcp-servers/metabase/.mcp.json.example mcp-servers/metabase/.mcp.json
nano mcp-servers/metabase/.mcp.json  # Add your API key and database ID
cd mcp-servers/metabase && npm install && npm run build
```

### 6. Verify Setup
```bash
node scripts/verify-environment.js
```

---

## Manual Component Installation

### Commands (Slash Commands)
```bash
node scripts/install-commands.sh
# Copies commands/ → ~/.claude/commands/
```

### Hooks
```bash
node scripts/install-hooks.sh
# Merges hooks/hooks.json into ~/.claude/settings.json
```

### MCP Server (Metabase)
```bash
cd mcp-servers/metabase && npm install && npm run build
```

---

## Contributing

### Adding a New Skill

```bash
# 1. Create skill directory
mkdir skills/my-skill
# Write skills/my-skill/SKILL.md

# 2. If it should auto-trigger, add it to CLAUDE.md trigger table

# 3. Commit and push
git add skills/my-skill/
git commit -m "feat: add my-skill for [purpose]"
git push team main
```

### Adding a New Slash Command

```bash
# 1. Create command file
nano commands/my-command.md

# 2. Install it
node scripts/install-commands.sh

# 3. Commit
git add commands/my-command.md
git commit -m "feat: add /my-command for [purpose]"
```

### Adding a New MCP Server

```bash
# 1. Create and build server
mkdir mcp-servers/my-server
# ... build ...

# 2. Create credential template
cp mcp-servers/my-server/.mcp.json mcp-servers/my-server/.mcp.json.example
# Remove credentials from .example

# 3. Gitignore credentials
echo "mcp-servers/my-server/.mcp.json" >> .gitignore

# 4. Document in mcp-servers/my-server/README.md

# 5. Commit (without credentials)
git add mcp-servers/my-server/
git commit -m "feat: add my-server MCP"
```

### Updating RML Context

When you learn a new RML pattern or workflow:
1. Project-specific → update that project's CLAUDE.md
2. Cross-project RML standard → update `rml/CLAUDE.md`
3. Reusable workflow → create/update a skill in `skills/`

---

## Plugin Settings Reference

`~/.claude/settings.json` controls plugin enable/disable. Template: `.claude/settings.example.json`.

This file is **gitignored** — do not commit it. To propose team-level changes, edit `.claude/settings.example.json`.

---

## Troubleshooting

### "Metabase tools not available"
```bash
cd mcp-servers/metabase
node dist/index.js
# Should output: "Metabase MCP Server running on stdio"
# If not: npm install && npm run build
```

### "Notion MCP not working"
```bash
/mcp
# Follow OAuth flow to re-authenticate
```

### "Hooks not firing"
```bash
node scripts/install-hooks.sh
# Then restart Claude Code
```

### "Slash command not found"
```bash
node scripts/install-commands.sh
# Then restart Claude Code
```

### "Setup script fails"
Run steps manually:
```bash
/plugin install Notion@claude-plugins-official
/plugin install context7@claude-plugins-official
cp .claude/settings.example.json .claude/settings.json
cp mcp-servers/metabase/.mcp.json.example mcp-servers/metabase/.mcp.json
cd mcp-servers/metabase && npm install && npm run build
node scripts/install-commands.sh
node scripts/install-hooks.sh
```

---

## Success Metrics

**Metabase Integration:** Query error rate <10% (from 40%), first-deploy success >80%
**Team Onboarding:** New member productive in <30 min, setup issues <5%
