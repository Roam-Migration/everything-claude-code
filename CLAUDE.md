# Everything Claude Code - Project Configuration

**Repository:** everything-claude-code (fork)
**Purpose:** Production-ready agents, skills, hooks, commands, rules, and MCP configurations

---

## Required Plugins

**CRITICAL:** This project requires specific plugins to function correctly. Install these before contributing:

### Core Plugins (Required)

| Plugin | Purpose | Installation |
|--------|---------|--------------|
| **Notion** | Task/project management integration. Required for Notion skills and prompts. | `/plugin install Notion@claude-plugins-official` |
| **context7** | Live documentation lookup. Essential for library references. | `/plugin install context7@claude-plugins-official` |
| **github** | ~~GitHub MCP plugin~~ — use `gh` CLI instead (pre-authenticated, same capability) | `gh auth status` to verify |
| **supabase** | Database operations. Required for Supabase-related work. | `/plugin install supabase@claude-plugins-official` |

### Recommended Plugins

| Plugin | Purpose | Installation |
|--------|---------|--------------|
| **frontend-design** | UI/UX development assistance | `/plugin install frontend-design@claude-plugins-official` |

---

## MCP Servers

### Metabase (Custom)

**Required for:** SQL Server query validation and Metabase card creation

**Setup:**
```bash
cd mcp-servers/metabase
npm install
npm run build
cp .mcp.json.example .mcp.json
# Edit .mcp.json with your Metabase credentials
```

**Tools provided:**
- `get-database-schema` - Explore database structure
- `validate-sql-server-query` - Check SQL Server syntax
- `test-metabase-query` - Execute queries live
- `get-existing-cards` - Learn from examples
- `get-sql-server-syntax-guide` - Reference patterns

See: `mcp-servers/metabase/README.md`

---

## CLI Tools

### Notion CLI (Custom)

**Required for:** Automated Notion task creation during session closure

**Location:** `~/.claude/tools/notion-cli/`

**Setup:**
```bash
cd ~/.claude/tools/notion-cli
npm install
npm run build
npm link  # Makes globally available as 'notion-cli'
```

**Usage:**
```bash
# Bulk create tasks from JSON
notion-cli bulk-create session-tasks.json

# Create single task
notion-cli create-task --title "Task name" --effort 3 --priority "High"

# Query your tasks
notion-cli query-tasks --driver "me" --status "Not started,In progress"
```

**Tools provided:**
- `init` - Initialize configuration
- `create-task` - Create single task
- `bulk-create` - Create multiple tasks from JSON
- `query-tasks` - Query and filter tasks

**Integration:** Automatically uses Notion plugin OAuth authentication. No additional token required.

See: `docs/tools/notion-cli-integration.md`

---

## Project Setup (New Team Members)

### 1. Clone Repository
```bash
git clone https://github.com/jtaylorcomplize/everything-claude-code.git
cd everything-claude-code
```

### 2. Run Setup Script
```bash
node scripts/setup-team-environment.js
```

This will:
- ✅ Check for required plugins
- ✅ Copy configuration templates
- ✅ Install MCP servers
- ✅ Verify environment is ready

### 3. Configure Personal Settings

**Plugin configuration:**
```bash
# Template already copied by setup script
nano .claude/settings.json
# Enable/disable optional plugins
```

**Metabase credentials:**
```bash
nano mcp-servers/metabase/.mcp.json
# Add your API key and database ID
```

### 4. Verify Setup
```bash
node scripts/verify-environment.js
```

Should output:
```
✅ All required plugins installed
✅ Configuration files present
✅ MCP servers built
✅ Environment ready
```

---

## Project-Level Configuration

### Plugin Settings (`.claude/settings.json`)

**This file is gitignored.** Team members create it from template:
```bash
cp .claude/settings.example.json .claude/settings.json
```

**Required plugins in template:**
```json
{
  "enabledPlugins": {
    "Notion@claude-plugins-official": true,
    "context7@claude-plugins-official": true,
    "github@claude-plugins-official": true,
    "supabase@claude-plugins-official": true,
    "frontend-design@claude-plugins-official": true
  }
}
```

**Why project-level?**
- Different projects need different tools
- Global settings don't scale across diverse projects
- Project context determines optimal plugin set

---

## Skill Triggers

When the conditions below are met, proactively apply the corresponding skill **without waiting to be asked**. Read the skill file and follow its workflow.

| Trigger | Skill to apply |
|---------|---------------|
| User says "close session", "wrap up", "end session", or "save session" | `skills/session-closure/SKILL.md` |
| About to write to any Notion database via MCP | Run Phase 1–3 of `skills/notion-mcp-write-workflow/SKILL.md` first (token check + UUID discovery + schema) |
| User asks to create a Metabase card or dashboard | `skills/metabase-card-creation/SKILL.md` |
| Writing SQL for Metabase | Reference `skills/metabase-sql-server-patterns/SKILL.md` |
| End of any RML Intranet session where pages/routes/forms were added or statuses changed | `skills/rml-intranet-sync/SKILL.md` |
| Adding a form to the RML Intranet | `skills/rml-form-integration/SKILL.md` |

---

## Skills and Workflows

### Metabase Development

**Required:** Metabase MCP server + skills

**Workflow:**
1. Explore schema: `"Show me the actions table structure"`
2. Write query using SQL Server syntax
3. Validate: `"Validate this SQL Server query"`
4. Test: `"Test this query against Metabase"`
5. Deploy via Python scripts

**Skills:**
- `skills/metabase-card-creation/` - 7-phase workflow
- `skills/metabase-sql-server-patterns/` - Query templates

### Notion Task Management

**Required:** Notion plugin

**Workflow:**
1. Use prompts from `prompts/notion-*.md` as templates
2. Reference `docs/notion-integration.md` for schemas
3. Claude Browser creates tasks via MCP

### RML Ops Prompts

**Location:** `prompts/rml-ops/`

Standardized prompts that enforce consistent Claude Code behavior across all developers. Reference them explicitly in your session to ensure Claude follows RML patterns.

| Prompt | Use When |
|--------|----------|
| `project-init.md` | Starting a new RML internal app |
| `deploy-to-gcp.md` | Deploying to Google Cloud Run |
| `component-generation.md` | Creating new React components |
| `security-audit.md` | Before deploying to production |
| `troubleshoot-iap.md` | Debugging IAP 403 / redirect errors |
| `add-shared-component.md` | Adding to `@roam-migration/components` |

**Usage:**
```
@claude, follow the instructions in prompts/rml-ops/deploy-to-gcp.md
```

See: `prompts/rml-ops/README.md`

### GCP Deployment Templates

**Location:** `templates/deployment/`

Copy-paste Cloud Run configurations for RML apps. Avoids repeating deployment setup from scratch.

**Templates:**
- `vite-react-spa/` - Dockerfile, nginx.conf, cloudbuild.yaml, deploy.sh for Vite/React SPAs
- `nextjs-ssr/` - Dockerfile, cloudbuild.yaml, deploy.sh for Next.js SSR apps

**Scripts:**
- `scripts/setup-iap.sh` - Configure IAP + Google Workspace SSO
- `scripts/map-domain.sh` - Map custom domain, provision SSL
- `scripts/rollback.sh` - Roll back to a previous Cloud Run revision

**Quick start:**
```bash
cp -r templates/deployment/vite-react-spa/* /path/to/your-app/
cd /path/to/your-app
./deploy.sh --service=your-app-name
```

See: `templates/deployment/README.md`


---

## Repository Structure

```
everything-claude-code/
├── .claude/
│   ├── settings.example.json      # Plugin template (committed)
│   ├── settings.json               # Your config (gitignored)
│   └── README.md                   # Configuration guide
├── agents/                         # Specialized subagents
├── skills/                         # Workflow definitions
│   ├── metabase-card-creation/     # Metabase workflows
│   └── metabase-sql-server-patterns/  # SQL patterns
├── commands/                       # Slash commands
├── rules/                          # Always-follow guidelines
├── hooks/                          # Trigger-based automations
├── mcp-servers/
│   └── metabase/                   # Custom Metabase MCP
│       ├── .mcp.json.example       # Config template (committed)
│       └── .mcp.json               # Your credentials (gitignored)
├── docs/
│   ├── metabase-setup-guide.md    # Metabase integration
│   ├── notion-integration.md       # Notion schemas
│   └── team-sync-guide.md         # Team collaboration
├── prompts/                        # Prompt templates
│   └── rml-ops/                    # 6 standardized RML Claude Code prompts
├── templates/
│   └── deployment/                 # GCP Cloud Run templates (Vite SPA, Next.js SSR)
│       └── scripts/                # setup-iap.sh, map-domain.sh, rollback.sh
├── scripts/
│   ├── setup-team-environment.js   # Onboarding automation
│   └── verify-environment.js       # Environment validation
├── CLAUDE.md                       # This file
└── README.md                       # Repository documentation
```

---

## Critical Rules

### 1. Plugin Management

**DO:**
- ✅ Install required plugins (Notion, context7, github, supabase)
- ✅ Keep `.claude/settings.json` in sync with team needs
- ✅ Use `/plugin list` to verify installations
- ✅ Restart Claude Code after plugin changes

**DON'T:**
- ❌ Commit `.claude/settings.json` (use `.example` for team changes)
- ❌ Skip plugin installation (skills will fail silently)
- ❌ Enable conflicting plugins (review before enabling new ones)

### 2. MCP Server Management

**DO:**
- ✅ Build MCP servers after pulling updates: `npm run build`
- ✅ Keep credentials in `.mcp.json` (gitignored)
- ✅ Test MCP tools before using in production
- ✅ Update `.mcp.json.example` if new config options added

**DON'T:**
- ❌ Commit `.mcp.json` with credentials
- ❌ Hardcode API keys in source code
- ❌ Skip `npm install` after pulling MCP updates

### 3. Skill Usage

**DO:**
- ✅ Follow skill workflows exactly (e.g., metabase-card-creation)
- ✅ Use validation tools before deployment
- ✅ Reference skill documentation when uncertain
- ✅ Contribute improvements back to skills

**DON'T:**
- ❌ Skip validation steps (causes deployment failures)
- ❌ Assume PostgreSQL syntax works on SQL Server
- ❌ Deploy without testing queries first

### 4. Code Style

- No emojis in code, comments, or documentation (unless user explicitly requests)
- Immutability always - never mutate objects or arrays
- Proper error handling with try/catch
- Input validation where appropriate

### 5. Security

- **NEVER** commit credentials (API keys, tokens, passwords)
- **ALWAYS** use environment variables or gitignored configs
- **VALIDATE** all user inputs
- **REVIEW** MCP server code before deployment

---

## Contribution Workflow

### Adding New Skills

```bash
# 1. Create skill directory
mkdir skills/my-skill
nano skills/my-skill/SKILL.md

# 2. Test locally
cp -r skills/my-skill ~/.claude/skills/
# Test with Claude Code

# 3. Commit and push
git add skills/my-skill/
git commit -m "feat: add my-skill for X"
git push fork feature/my-skill
gh pr create
```

### Updating Documentation

```bash
# 1. Update docs
nano docs/my-guide.md

# 2. Commit
git add docs/my-guide.md
git commit -m "docs: update my-guide with X"
git push fork main
```

### Adding MCP Servers

```bash
# 1. Create server
mkdir mcp-servers/my-server
# ... build server ...

# 2. Create template
cp .mcp.json .mcp.json.example
# Remove credentials from .example

# 3. Update .gitignore
echo "mcp-servers/my-server/.mcp.json" >> .gitignore

# 4. Document
nano mcp-servers/my-server/README.md

# 5. Commit (without credentials)
git add mcp-servers/my-server/
git commit -m "feat: add my-server MCP integration"
```

---

## Troubleshooting

### "Metabase tools not available"

**Check plugin:**
```bash
/plugin list | grep -i metabase
# MCP server, not a plugin
```

**Check MCP server:**
```bash
cd mcp-servers/metabase
node dist/index.js
# Should output: "Metabase MCP Server running on stdio"
```

**Restart Claude Code:**
```bash
/exit
# Restart claude
```

### "Notion MCP not working"

**Verify plugin installed:**
```bash
/plugin list | grep -i notion
# Should show: Notion@claude-plugins-official (enabled)
```

**Re-authenticate:**
```bash
/mcp
# Follow OAuth flow for Notion
```

### "Skills not loading"

**Check installation:**
```bash
ls ~/.claude/skills/metabase-*
# Should show: metabase-card-creation, metabase-sql-server-patterns
```

**Reinstall from repo:**
```bash
cp -r skills/metabase-* ~/.claude/skills/
```

### "Setup script fails"

**Run manually:**
```bash
# Install plugins one by one
/plugin install Notion@claude-plugins-official
/plugin install context7@claude-plugins-official
/plugin install github@claude-plugins-official
/plugin install supabase@claude-plugins-official

# Copy templates
cp .claude/settings.example.json .claude/settings.json
cp mcp-servers/metabase/.mcp.json.example mcp-servers/metabase/.mcp.json

# Build MCP servers
cd mcp-servers/metabase && npm install && npm run build
```

---

## Environment Variables

None required at project level. MCP servers use their own `.mcp.json` configs.

---

## Success Metrics

**For Metabase Integration:**
- Query syntax error rate: <10% (down from 40%)
- First-deployment success: >80%
- Iteration velocity: 2-3x faster

**For Team Onboarding:**
- New member productive: <30 minutes
- Plugin setup issues: <5% of team
- Configuration conflicts: 0%

---

## Resources

- **Main README:** `README.md` - Repository overview
- **Team Sync Guide:** `docs/team-sync-guide.md` - Collaboration strategy
- **Metabase Guide:** `docs/metabase-setup-guide.md` - Complete Metabase integration
- **Notion Guide:** `docs/notion-integration.md` - Notion workspace schemas
- **Setup Scripts:** `scripts/` - Automation tools

---

## Questions?

- **Plugin issues:** Check `/plugin list` and reinstall if needed
- **MCP server issues:** See `mcp-servers/[server]/README.md`
- **Skill usage:** Read skill's `SKILL.md` documentation
- **Team collaboration:** See `docs/team-sync-guide.md`

---

**Last Updated:** 2026-02-14
**Maintained By:** Jackson (j.taylor@roammigrationlaw.com)
