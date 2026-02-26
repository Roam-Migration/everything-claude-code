# Session: Claude Code Permissions Hardening

**Date:** 2026-02-26
**Branch:** fix/p1-documentation-updates

---

## What Was Accomplished

Researched and implemented a three-layer permission architecture for Claude Code to allow broader autonomous operation while preventing destructive actions.

**Files changed:**
- `.claude/settings.example.json` — added `permissions` block
- `hooks/hooks.json` — added destructive command blocker hook

---

## Technical Decisions

### Three-Layer Model

1. **Permissions (settings.json)** — broad allow patterns + outright deny for force-push
2. **PreToolUse hooks** — runtime regex interception of destructive Bash patterns
3. **CLAUDE.md behavioral rules** — reasoning-level guardrails (already in place)

### Allow Pattern Design

Used 21 broad tool-category patterns (`Bash(git *)`, `Bash(gcloud *)`, `Read`, `Write`, etc.) instead of accumulating individual command approvals. This replaces the 240-line `settings.local.json` pattern that grows organically over sessions.

`deny` entries in settings take precedence over `allow` — used for `git push --force` which should never be auto-approved.

### Destructive Command Blocker Hook

Positioned as first PreToolUse hook so it evaluates before any other hook:

| Behaviour | Patterns | Rationale |
|---|---|---|
| Hard block (exit 2) | `rm -rf /~`, `rm --no-preserve-root`, `DROP TABLE/DATABASE`, `dd if=`, `mkfs` | Catastrophic, no legitimate use case in this workflow |
| Soft warn (continues) | `git reset --hard`, `chmod -R 777 /` | Legitimate uses exist; Claude sees warning as context |

`git push --force` handled at the permissions `deny` layer (earlier in the pipeline) rather than the hook layer.

### Exit Code Semantics

- `exit(2)` from PreToolUse = block + feed stderr to Claude as context
- `exit(1)` = hook error (treated differently)
- `exit(0)` / stdout passthrough = allow

---

## Key Insight: settings.local.json Accumulation

The 240-line `settings.local.json` is a symptom of Claude Code's default approval-memory mechanism — each "Allow" click adds a new entry. The fix is intentional broad patterns in `settings.example.json` (committed, team-shared) which make individual approvals unnecessary for safe tools.

---

## Lessons Learned

- Hooks run in declaration order — put safety checks first
- `deny` in permissions is absolute (overrides any `allow`)
- The Write hook blocking `.md` creation (except README/CLAUDE/AGENTS/CONTRIBUTING) may conflict with session note creation — worth reviewing if session workflow fails silently
