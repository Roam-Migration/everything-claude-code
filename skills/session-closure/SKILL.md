# Session Closure Skill

## Purpose

Structured end-of-session workflow that ensures no work is lost, session learnings are captured, and future-session context is preserved. Covers git commits, session notes, Notion task creation, ECC docs commit, and remote push.

## When to Use

- User says "close session", "wrap up", or "end session"
- User says "save session" or "create tasks for remaining work"
- Before leaving a long work session where multiple changes were made
- After completing a major phase of a project

---

## Workflow

### Phase 1: Git Status — What Needs Committing?

```bash
git status
git diff --stat HEAD
```

Identify:
- Which repo(s) have uncommitted changes? (RML Intranet, ECC, Gull Force, etc.)
- Are there staged changes that haven't been committed?
- Any new untracked files that should be committed?

**For each repo with changes:**

```bash
# In the repo with changes:
git add [specific-files]  # prefer specific files over git add -A
git commit -m "$(cat <<'EOF'
type(scope): brief description of what and why

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

**Commit message conventions:**
- `feat:` — new feature
- `fix:` — bug fix
- `refactor:` — code restructure without behavior change
- `docs:` — documentation only
- `chore:` — build, config, or tooling changes

**Gate:** All project repos at a clean commit before proceeding.

---

### Phase 2: Write Session Notes

Create a session notes file in ECC:

**File path:** `/home/jtaylor/everything-claude-code/docs/sessions/YYYY-MM-DD-brief-description.md`

Use today's date and a 2-4 word description of the session focus.

**Template:**

```markdown
# Session Notes — [Date] — [Project/Topic]

## What Was Done

- [Bullet list of completed work items]
- [Include specific file names, component names, function names]

## Root Causes Diagnosed

- **[Issue name]:** [What was wrong and why]

## Technical Patterns Learned

### [Pattern name]
[Code snippet or description]
[Why it matters]

## Remaining Work

- [ ] [Task 1 — actionable description]
- [ ] [Task 2]

## Key IDs / References

| Resource | ID/URL |
|----------|--------|
| [name] | [value] |
```

**What to include:**
- Specific bug fixes with root causes (not just "fixed a bug")
- Code patterns that weren't obvious (e.g., PostgREST UUID quoting, nginx routing gaps)
- Links to relevant Notion pages, Metabase cards, or GCP resources created
- Incomplete items with enough context to resume without re-reading the conversation

**What to omit:**
- Work that's already documented in CLAUDE.md
- Git history (covered by commit messages)
- General programming concepts (only project-specific learnings)

---

### Phase 3: Create Notion Tasks for Remaining Work

For each incomplete or future work item identified in Phase 2:

**Pre-flight:** Fetch a known Notion page to confirm token is active:
```
notion-fetch: https://www.notion.so/2ece1901e36e806e8d7ac3ebf84b9b73
```

**Get Tasks DB collection UUID:**
```
notion-fetch: https://www.notion.so/[tasks-db-page-url]
→ Find: collection://4b3348c5-136e-4339-8166-b3680e3b6396
```

**Create task with these mandatory properties:**

| Property | Value |
|----------|-------|
| Name | `[Action Verb] [Object] [Context]` (e.g., "Fix nginx routing for training form") |
| Status | `Not started` |
| Driver | Jackson (`cd2bebb6-f5c0-46aa-a3d3-86116bbdcc87`) |
| Priority | `High`, `Normal`, or `Low` — be honest |
| Project | **Mandatory** — relate to the correct project |
| Notes | Enough context to resume without reading conversation history |

**Task title format:** `[Action Verb] [Object] [Context]`
- Good: "Add nginx location block for approve-leave route"
- Bad: "Fix the bug" / "Continue intranet work"

**For each task created, note the URL in the session notes.**

---

### Phase 4: Update Memory (if needed)

If this session revealed a new pattern, gotcha, or workflow that doesn't exist in memory yet:

Check `/home/jtaylor/.claude/projects/-home-jtaylor-everything-claude-code/memory/MEMORY.md` — is the new learning already captured?

If not, update the relevant memory file or create a new one. Memory should capture:
- Non-obvious behaviors (silent bugs, silent failures)
- Credential/ID references that aren't in CLAUDE.md
- Workflow patterns proven across multiple sessions

Do NOT add to memory:
- One-time fixes specific to a single bug
- Anything already in CLAUDE.md
- General programming knowledge

---

### Phase 5: Commit ECC Docs + Memory

```bash
cd /home/jtaylor/everything-claude-code

git add docs/sessions/
git add memory/   # if memory was updated

git status  # verify only expected files staged

git commit -m "$(cat <<'EOF'
docs: session learnings — [project] ([date])

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Phase 6: Push to Team Remote

```bash
cd /home/jtaylor/everything-claude-code
git push team main
```

If push is rejected (non-fast-forward):
```bash
git pull team main --rebase
git push team main
```

**For project repos** (RML Intranet, etc.) — only push if user explicitly requests. Ask first.

---

### Phase 7: Report

Provide a concise end-of-session report:

```
Session closed.

Commits:
- [repo]: [commit hash] "[message]"

Session notes: docs/sessions/YYYY-MM-DD-description.md

Notion tasks created:
- [Task title] — [URL]
- [Task title] — [URL]

Pushed: ECC → team/main ✓
```

---

## Pre-Closure Checklist

- [ ] All project repos committed (or confirmed nothing to commit)
- [ ] Session notes written with root causes and remaining work
- [ ] Notion tasks created for all incomplete/future items
- [ ] Each Notion task has a Project relation set
- [ ] Memory updated if new patterns discovered
- [ ] ECC docs/sessions committed
- [ ] ECC pushed to team remote

---

## Error Recovery

| Issue | Fix |
|-------|-----|
| Notion token expired | `/mcp` to re-auth, then retry task creation |
| git push rejected | `git pull team main --rebase` then push again |
| Session notes file conflict | Check if file already exists (same date); append or use `-2` suffix |
| Notion task created without Project | Edit in Notion UI — there's no delete tool via MCP |
| Uncommitted changes in wrong repo | `git stash` in the wrong repo, switch to correct one, stash pop |

---

## Anti-Patterns to Avoid

❌ **Creating Notion tasks without a Project relation** — tasks become orphaned and untrackable in project views

❌ **Vague task titles** — "Continue work" or "Fix stuff" loses context; future sessions can't resume without re-reading the conversation

❌ **Skipping session notes** — the commit message captures what changed, but not why or what was learned; session notes bridge that gap

❌ **Pushing project repos without asking** — only ECC is pushed automatically; project repos (RML Intranet, etc.) need explicit user confirmation

❌ **`git add -A` without checking `git status` first** — may accidentally stage `.env` files, large binaries, or unrelated changes
