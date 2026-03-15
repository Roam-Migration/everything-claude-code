# Everything Claude Code

**Purpose:** Production-ready agents, skills, hooks, commands, rules, and MCP configurations for the Roam Migration Law team.

> Full setup guide: `docs/SETUP.md` | RML team context: `rml/CLAUDE.md`

---

## Auto-Triggers

When the conditions below are met, apply the corresponding skill **without waiting to be asked**.

| Trigger | Skill |
|---------|-------|
| "close session", "wrap up", "end session", "save session" | `skills/session-closure/SKILL.md` |
| About to write to any Notion database via MCP | `skills/notion-mcp-write-workflow/SKILL.md` (Phases 1–3 first) |
| Creating a Metabase card or dashboard | `skills/metabase-card-creation/SKILL.md` |
| Writing SQL for Metabase | `skills/metabase-sql-server-patterns/SKILL.md` |
| End of any RML Intranet session (pages/routes/forms changed) | `skills/rml-intranet-sync/SKILL.md` |
| Adding a form to the RML Intranet | `skills/rml-form-integration/SKILL.md` |
| Deploying to Cloud Run | `skills/cloud-run-vite-deployment/SKILL.md` |
| Database schema changes or migrations | `skills/database-migrations/SKILL.md` |
| Context is large or a major phase just completed | `skills/strategic-compact/SKILL.md` |
| Security review before any production deployment | `skills/security-review/SKILL.md` |

## Agent Delegation

Delegate to these agents for specialised tasks rather than handling inline.

| When | Agent |
|------|-------|
| Code review requested | `agents/code-reviewer` |
| Architecture or system design decision | `agents/architect` |
| Database schema / query optimisation | `agents/database-reviewer` |
| Security audit | `agents/security-reviewer` |
| Writing or structuring tests | `agents/tdd-guide` |
| Refactoring or cleanup | `agents/refactor-cleaner` |
| Build error diagnosis | `agents/build-error-resolver` |

---

## Critical Rules

**Security**
- NEVER commit credentials. Use environment variables or gitignored configs.
- VALIDATE all user inputs. REVIEW MCP server code before deployment.

**Code Style**
- No emojis in code, comments, or documentation unless explicitly requested.
- Immutability always — never mutate objects or arrays.
- Proper error handling with try/catch. Input validation at system boundaries only.

**Git**
- Prefer specific file staging over `git add -A`. Check `git status` first.
- Commit message format: `type(scope): what and why`. Co-Author: Claude Sonnet 4.6.
- Never force-push `main`. Never skip hooks (`--no-verify`).

**MCP / Notion**
- Build MCP servers after pulling: `npm run build` in `mcp-servers/[server]/`.
- Keep credentials in `.mcp.json` (gitignored). Never hardcode API keys.
- Notion token expires silently — always preflight with `notion-fetch` before writes.

**Skills**
- Follow skill workflows exactly. Do not skip validation phases.
- Do not assume PostgreSQL syntax on SQL Server.

---

## Hooks Activation

`hooks/hooks.json` is a **template** — it must be merged into your active Claude Code config.

```bash
# One-time setup (run from repo root):
bash scripts/install-hooks.sh
```

What activates:
- Destructive command blocking (`rm -rf /`, `DROP TABLE`, `dd`, `mkfs`)
- Dev server enforcement (must run in tmux)
- Auto-format JS/TS after edits (Biome/Prettier)
- TypeScript check after editing `.ts/.tsx`
- Strategic compact suggestions at 50 tool calls
- Session state persistence on end

---

## Commands

Slash commands must be installed to `~/.claude/commands/` to be auto-discovered.

```bash
# Install all commands (run from repo root):
bash scripts/install-commands.sh
```

Key commands: `build-fix`, `evolve`, `learn`, `code-review`, `checkpoint`, `instinct-status`

---

## Repository Structure

```
everything-claude-code/
├── agents/          # 14 specialist subagents
├── commands/        # 17 slash commands (install via scripts/install-commands.sh)
├── docs/
│   ├── SETUP.md     # Full setup, contribution, troubleshooting guide
│   └── sessions/    # Timestamped session notes + INDEX.md
├── hooks/
│   └── hooks.json   # Hook templates (activate via scripts/install-hooks.sh)
├── mcp-servers/
│   └── metabase/    # Custom SQL Server MCP (build: npm run build)
├── prompts/
│   └── rml-ops/     # 6 standardised RML deployment prompts
├── rml/
│   └── CLAUDE.md    # RML team context (skills, IDs, workflows)
├── rules/           # Language-specific rules (common, go, python, swift, ts)
├── scripts/
│   ├── install-commands.sh       # Copy commands to ~/.claude/commands/
│   ├── install-hooks.sh          # Merge hooks into ~/.claude/settings.json
│   └── setup-team-environment.js # Full onboarding automation
├── skills/          # 80+ workflow definitions (SKILL.md per skill)
└── templates/
    └── deployment/  # GCP Cloud Run templates (Vite SPA, Next.js SSR)
```

---

**Last Updated:** 2026-03-15 | **Maintained by:** Jackson (j.taylor@roammigrationlaw.com)
