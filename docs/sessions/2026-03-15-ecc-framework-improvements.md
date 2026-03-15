# Session Notes — 2026-03-15 — ECC Framework Improvements

## What Was Done

- **CLAUDE.md rewrite**: 523 → 130 lines. Removed verbose setup/contribution/troubleshooting sections. Added expanded auto-trigger table (10 skills), agent delegation table (7 agents), hooks activation section, commands installation section.
- **rml/CLAUDE.md created**: New RML team context file explaining how team members use it (in-ECC reference vs project CLAUDE.md sync). Contains RML Intranet context, Metabase workflow, Notion IDs, GCP infrastructure, RML-specific skills list.
- **docs/SETUP.md created**: Extracted all setup, contribution, and troubleshooting content from CLAUDE.md. Single reference for new team members.
- **scripts/install-commands.sh**: New script copying all 33 commands from `commands/` to `~/.claude/commands/`. Claude Code only auto-discovers from that path — repo root `commands/` is invisible without this.
- **scripts/install-hooks.sh**: New script merging `hooks/hooks.json` into `~/.claude/settings.json`. Initially had a critical bug (see below).
- **scripts/setup-team-environment.js**: Updated to call both install scripts as steps 4+5 of onboarding flow.
- **skills/session-closure/SKILL.md**: Added Phase 4b (update INDEX.md) and checklist item.
- **docs/sessions/INDEX.md**: New searchable one-line-per-session index. Append on every session close.
- **.cursor/ removed**: 55 files deleted. Cursor not in active use — was causing confusion alongside `.claude/`.
- **MEMORY.md trimmed**: 201 → 184 lines. Removed dead "NotebookLM OLD setup" entry, consolidated two RML Intranet entries, condensed NotebookLM to one line, updated ECC entry.

## Root Causes Diagnosed

- **`${CLAUDE_PLUGIN_ROOT}` expansion bug**: `hooks.json` template uses `${CLAUDE_PLUGIN_ROOT}/scripts/hooks/...` paths. This variable is ONLY injected by Claude Code when a hook is owned by an installed plugin. Manually-merged hooks (what `install-hooks.sh` does) never receive it — the variable expands to empty string, turning every path into `/scripts/hooks/...` (filesystem root). Symptom: `MODULE_NOT_FOUND` on `check-console-log.js`. Fix: `install-hooks.sh` now runs `sed "s|${CLAUDE_PLUGIN_ROOT}|${REPO_ROOT}|g"` before merging. The other session that encountered this already patched the live `settings.json` directly.

## Technical Patterns Learned

### CLAUDE_PLUGIN_ROOT Only Works for Plugin-Owned Hooks
Any hook command using `${CLAUDE_PLUGIN_ROOT}` MUST have that variable expanded to an absolute path at install time when installed manually. The variable is a plugin runtime injection — shell environments outside plugin context never have it.

### CLAUDE.md Context Budget
At 523 lines, CLAUDE.md consumed significant context every session before any work began. The target is ~100-150 lines of actual instructions. Setup/reference material belongs in `docs/SETUP.md` (linked, not inlined).

## Remaining Work

- [ ] Investigate and wire `continuous-learning-v2` to SessionEnd hooks — the observation script is production-ready but pattern extraction (`instinct-cli.py`) needs testing before recommending activation
- [ ] Clarify `Linux CLI Essentials.md` in ECC root (untracked, unknown origin — move or delete)
- [ ] RML Intranet has uncommitted changes from prior sessions — needs review and commit (`AdminWikiPage.tsx` + 3 modified files)
- [ ] Gull Force has two untracked scripts from prior sessions (`add-audio-section.php`, `configure-sg-optimizer.php`)

## Key IDs / References

| Resource | ID/URL |
|----------|--------|
| ECC commit (framework improvements) | `a74a06b` |
| ECC commit (bash fix) | `99ebcbd` |
| ECC commit (hooks bug fix) | `ee85e44` |
| hooks bug memory | `memory/feedback_hooks-plugin-root.md` |
