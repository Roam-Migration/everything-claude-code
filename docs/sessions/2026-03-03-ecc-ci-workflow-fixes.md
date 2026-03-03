# ECC CI Workflow Fixes — 2026-03-03

**Commit:** `c83cc3d`
**Repo:** everything-claude-code
**Files changed:** 4 (1 deleted, 3 patched)
**Tests:** 992/992 passing (was 989/992)

---

## Background

### The everything-claude-code CI pipeline

The `everything-claude-code` (ECC) repository uses a GitHub Actions workflow defined in `.github/workflows/ci.yml` to validate the repo on every push to `main` and on pull requests. The pipeline runs four jobs:

- **test** — runs `tests/run-all.js` across a matrix of OS × Node version × package manager (npm, pnpm, yarn, bun)
- **validate** — runs five `scripts/ci/validate-*.js` scripts that statically check agents, hooks, commands, skills, and rules files
- **security** — `npm audit`
- **lint** — ESLint + markdownlint

A second workflow file, `.github/workflows/copilot-setup-steps.yml`, was also present in the repo.

### How hooks work in Claude Code

Claude Code allows developers to attach shell commands to lifecycle events (e.g. `PreToolUse`, `PostToolUse`, `SessionStart`). These are configured in `hooks/hooks.json`. Each hook entry looks like:

```json
{
  "matcher": "Bash",
  "hooks": [
    {
      "type": "command",
      "command": "node -e \"let d='';process.stdin.on('data',c=>d+=c);...\""
    }
  ]
}
```

The `command` value is a **shell command string** — Claude Code invokes it via the system shell (e.g. `bash -c "..."`). Inline hooks are written as `node -e "JS_CODE"` where the JS code is embedded as a double-quoted shell argument.

The ECC repo ships several hooks, stored in `hooks/hooks.json`. At the time of this session, `PreToolUse` contained six matcher entries:

| Index | Matcher | Purpose |
|-------|---------|---------|
| 0 | Bash | Block catastrophic commands (`rm -rf /`, `DROP TABLE`, `dd`, `mkfs`) |
| 1 | Bash | Block dev servers run outside tmux |
| 2 | Bash | Remind to use tmux for long-running commands |
| 3 | Bash | Remind before `git push` |
| 4 | Write | Warn about non-standard documentation files |
| 5 | Edit\|Write | Suggest `/compact` at usage thresholds |

### The validate-hooks.js static analyser

`scripts/ci/validate-hooks.js` reads `hooks/hooks.json` and checks:
1. Each event type is valid (`PreToolUse`, `PostToolUse`, etc.)
2. Each matcher entry has a `matcher` field and a `hooks` array
3. Each hook entry has a `type` and `command` field
4. For `node -e "..."` inline commands, it **extracts and compiles the JS** using Node's `vm.Script` to catch syntax errors before deployment

The extraction and unescape logic was:
```js
const nodeEMatch = hook.command.match(/^node -e "(.*)"$/s);
if (nodeEMatch) {
  new vm.Script(
    nodeEMatch[1]
      .replace(/\\\\/g, '\\')
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')   // ← the bug
      .replace(/\\t/g, '\t')   // ← also incorrect
  );
}
```

---

## The Three Failures

### Failure 1: copilot-setup-steps.yml — "No jobs were run"

**File:** `.github/workflows/copilot-setup-steps.yml`

GitHub Actions requires a workflow file to have at minimum:
- An `on:` key (trigger definition)
- A `jobs:` key (at least one job with `runs-on` and `steps`)

The file in the repo contained only a bare `steps:` list — an auto-generated skeleton from GitHub Copilot with no trigger or jobs wrapper. GitHub's workflow parser accepted the file (valid YAML) but found no jobs to execute, producing the "No jobs were run" failure email on every push.

Additionally, the only step in the file was a Go toolchain setup (`actions/setup-go@v6.2.0`), which is entirely irrelevant — ECC is a JavaScript/Node.js project with no Go code.

### Failure 2: validate-hooks — "Invalid regular expression: missing /"

**File:** `scripts/ci/validate-hooks.js:45`

The destructive command blocker hook (index 0) contains this JS fragment:

```js
const cmd = (i.tool_input?.command || '').replace(/\n/g, ' ');
```

This is legitimate JavaScript. In the regex `/\n/g`, the `\n` is the standard regex escape for "match a newline character". The regex is valid and the code works correctly at runtime.

However, the validator's unescape step `.replace(/\\n/g, '\n')` converted the two-character sequence `\n` (backslash + n) into an actual newline character. The regex literal then became:

```
/
/g
```

A regex literal with a bare newline inside it is a JavaScript syntax error — line terminators are not allowed inside regex literals. `vm.Script` raised: `Invalid regular expression: missing /`.

**Why the unescape was wrong:** Bash double-quoted strings do NOT expand `\n` to a newline. In bash:

```bash
node -e "console.log('\n')"   # \n is passed verbatim to Node; Node interprets it as JS string escape
node -e $'console.log("\n")'  # only $'...' syntax expands \n to a real newline in bash
```

Since Claude Code invokes hook commands through the system shell, the correct simulation of what reaches `node -e` is: JSON-parse the command string (which handles JSON escaping), then apply only `\\` → `\` and `\"` → `"` (the only two escapes bash performs inside double-quoted strings). The `\n` → newline and `\t` → tab conversions were bogus.

### Failure 3: integration/hooks.test.js — blocking hook tests

**File:** `tests/integration/hooks.test.js`

Two tests — "blocking hooks output BLOCKED message" and "blocking hooks exit with code 2" — both read the hook command at index `PreToolUse[0]` and sent dev server commands (`npm run dev`, `yarn dev`) expecting exit code 2.

The tests worked when the dev server blocker was the first entry. After the destructive command blocker was added at index 0 (pushing the dev server blocker to index 1), the tests sent `npm run dev` to the wrong hook. The destructive command blocker has no pattern matching `npm run dev`, so it exited 0 instead of 2, and the assertion failed.

---

## Intuition

### The escaping layer cake

Understanding the bug requires tracing a value through three layers of escaping:

```
hooks.json (on disk)
     ↓  JSON.parse()
hook.command  (JavaScript string)
     ↓  bash -c "..."
Node.js -e argument  (the actual JS that runs)
```

Consider the regex `/\n/g` in the inline hook. Working backwards, here is how it must be encoded at each layer:

| Layer | Representation | Notes |
|-------|---------------|-------|
| Running JS | `/\n/g` | `\n` = regex newline escape |
| bash `-e` arg | `\n` | Bash double-quotes pass `\n` through unchanged |
| `hook.command` string | `\n` | Same — JSON.parse already decoded |
| hooks.json on disk | `\\n` | JSON must double-escape the backslash |

The validator, after calling `JSON.parse()`, has `hook.command` at layer 2. To get to the running JS (layer 1), it only needs to strip the outer `"..."` and unescape `\\` → `\` and `\"` → `"`. The additional `.replace(/\\n/g, '\n')` step incorrectly tried to jump from layer 3 directly to layer 1, skipping layer 2 — but `JSON.parse()` had already done that jump.

### The index shift

A simpler issue: when a hook is inserted at the front of an array, all existing integer indices shift by one. Tests that hardcode array indices are fragile to this kind of insertion. The fix is either to use a semantic lookup (find by description) or to update the index when the array changes. Here the simpler index update was the right choice.

---

## Code Walkthrough

### 1. Delete `copilot-setup-steps.yml`

The file was removed entirely. No replacement is needed — the repo has no Go code and never needed this workflow.

### 2. Fix `scripts/ci/validate-hooks.js` (line 45)

**Before:**
```js
new vm.Script(
  nodeEMatch[1]
    .replace(/\\\\/g, '\\')
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')   // injected literal newlines — broke regex literals
    .replace(/\\t/g, '\t')   // injected literal tabs — same problem class
);
```

**After:**
```js
new vm.Script(
  nodeEMatch[1]
    .replace(/\\\\/g, '\\')   // \\ → \  (bash double-quote escape)
    .replace(/\\"/g, '"')     // \" → "  (bash double-quote escape)
);
```

Only the two escapes that bash actually performs inside double-quoted strings are applied. Everything else — including `\n`, `\t`, `\b`, `\s` etc. — passes through unchanged, which is exactly what the shell would do.

### 3. Fix `tests/integration/hooks.test.js` (lines 241, 286)

Two occurrences of `hooks.hooks.PreToolUse[0]` changed to `hooks.hooks.PreToolUse[1]`:

```diff
-    const blockingCommand = hooks.hooks.PreToolUse[0].hooks[0].command;
+    const blockingCommand = hooks.hooks.PreToolUse[1].hooks[0].command;
```

Index 1 is the dev server blocker — the hook that checks for `npm run dev`, `pnpm dev`, `yarn dev`, `bun run dev` and exits with code 2 on Unix (or lets through on Windows).

### 4. Fix `tests/ci/validators.test.js` (lines 1593–1607)

The test case that was explicitly asserting the old (incorrect) `\n`→newline behaviour was updated. The command was changed from using `\n` as a statement separator to using a semicolon:

```diff
-  command: 'node -e "var a = \\"ok\\"\\nconsole.log(a)"'
+  command: 'node -e "var a = \\"ok\\"; console.log(a)"'
```

A semicolon works as a statement separator both in the validator (no escaping transformation needed) and in actual bash execution. The test name and comments were updated to reflect the corrected understanding.

---

## Verification

### Automated

The full test suite was run before and after the fix:

```
Before: 992 total, 989 passed, 3 failed
After:  992 total, 992 passed, 0 failed
```

The three previously failing tests:
- `validators.test.js` → `passes on real project hooks.json` ✓
- `integration/hooks.test.js` → `blocking hooks output BLOCKED message` ✓
- `integration/hooks.test.js` → `blocking hooks exit with code 2` ✓

### Manual QA steps

1. **Verify the validator passes cleanly:**
   ```bash
   node scripts/ci/validate-hooks.js
   # Expected: "Validated 16 hook matchers" (exit 0)
   ```

2. **Verify the integration tests pass:**
   ```bash
   node tests/integration/hooks.test.js
   # Expected: "Passed: 23 / Failed: 0"
   ```

3. **Run the full suite:**
   ```bash
   node tests/run-all.js
   # Expected: Final Results — Passed: 992, Failed: 0
   ```

4. **Confirm the workflow file is gone:**
   ```bash
   ls .github/workflows/
   # Should NOT contain copilot-setup-steps.yml
   ```

5. **Push to main and check GitHub Actions** — the "No jobs were run" and "Run failed: CI" emails should stop.

---

## Alternatives

### Alternative A: Fix validate-hooks.js by using `child_process.exec` to actually run the command

Instead of extracting and unescaping the JS manually, the validator could run the command in a subprocess with a no-op stdin input and check the exit code:

```js
const result = spawnSync('bash', ['-c', hook.command], {
  input: '{}',
  encoding: 'utf8',
  timeout: 2000
});
if (result.status !== 0 && result.stderr.includes('SyntaxError')) { ... }
```

**Pros:**
- Eliminates the escaping logic entirely — no risk of getting layer-2/3 confused
- Tests the command as it will actually run, not a simulation

**Cons:**
- Slow — spawning a subprocess per hook is expensive in CI
- Side effects — running hooks in CI could have unintended consequences (e.g. a hook that writes files)
- Fragile detection — distinguishing a legitimate `SyntaxError` from other errors at startup is unreliable
- Platform-dependent — `bash` may not be available on all CI runners (e.g. Windows)

**Verdict:** The string-based approach is preferable here. The validator's purpose is lightweight static analysis, not execution.

### Alternative B: Encode hook commands without relying on bash double-quote escaping

Instead of the `node -e "..."` shell pattern, hooks could use a file reference pattern:

```json
{ "command": "node /path/to/hook-script.js" }
```

This eliminates the escaping problem entirely — the JS is in its own file with no shell quoting involved.

**Pros:**
- No escaping layers to reason about
- JS files can be linted, formatted, and tested independently
- Easier to read and maintain

**Cons:**
- Requires shipping additional files with the plugin/package
- The `node -e` pattern is convenient for short self-contained hooks (the "destructive blocker" is ~400 characters — reasonable inline, but creates overhead as a file)
- Would require migrating all existing inline hooks

**Verdict:** A good long-term direction for complex hooks, but overkill for the short guards in this codebase. The simpler fix to the validator unescape is the right call here.

---

## Quiz

1. **Why did the `copilot-setup-steps.yml` file cause CI failures?**
   - A) It had a syntax error in the YAML
   - B) The `actions/setup-go` action version does not exist
   - C) The file lacked an `on:` trigger and a `jobs:` key, so GitHub found no jobs to run
   - D) It conflicted with the existing `ci.yml` workflow

   > **Answer: C** — GitHub Actions requires a `jobs:` map with at least one job containing `runs-on` and `steps`. The file only contained a bare `steps:` list, which is not a valid top-level key in a workflow file. GitHub parsed it successfully as YAML but found nothing to execute.

2. **After `JSON.parse()` converts the hooks.json value, what does the `command` string for the destructive blocker look like at the point the validator receives it?**
   - A) `node -e 'let d=...'` (single-quoted, as-is from disk)
   - B) `node -e "let d=..."` where `\n` is two characters: backslash and n
   - C) `node -e "let d=..."` where `\n` is a real newline character
   - D) A raw JavaScript string with no wrapping `node -e`

   > **Answer: B** — `JSON.parse()` decodes JSON escape sequences: `\\n` in the JSON file becomes `\n` (backslash + n) in the parsed string. JSON.parse does NOT produce actual newline characters from `\\n` unless the JSON contained a literal `\n` (which it did not here).

3. **What exactly did the buggy `.replace(/\\n/g, '\n')` line do to the destructive blocker hook?**
   - A) It had no effect, because there were no `\n` sequences in the command
   - B) It converted the `\n` inside `.replace(/\n/g, ' ')` into a real newline, breaking the regex literal
   - C) It removed all backslashes from the command
   - D) It caused an infinite loop in the validator

   > **Answer: B** — The inline JS contained `.replace(/\n/g, ' ')`. After the validator's `.replace(/\\n/g, '\n')` step, the `\n` inside the regex literal became a real newline character, producing `/<newline>/g` — a regex literal with an unescaped line terminator, which is a syntax error in JavaScript.

4. **Why did the integration tests for "blocking hooks" fail after the destructive command blocker was added?**
   - A) The dev server blocker was deleted from hooks.json
   - B) Both tests sent `npm run dev` to index `[0]`, which is now the destructive blocker — `npm run dev` doesn't match its patterns, so it exits 0 instead of 2
   - C) The test file didn't re-read hooks.json after the change
   - D) Node.js regex matching changed in a recent version

   > **Answer: B** — The tests hardcoded `PreToolUse[0]`. When a new hook was inserted at position 0, all subsequent hooks shifted. The dev server blocker (which the tests were targeting) moved to index 1. The destructive blocker at index 0 has no pattern for `npm run dev` or `yarn dev`, so it passes them through and exits 0.

5. **Why is using a semicolon (not `\n`) the correct way to separate statements in an inline `node -e` hook command?**
   - A) Node.js `-e` only supports single-line JavaScript
   - B) Bash double-quoted strings do not expand `\n` to a newline, so `\n` arrives at Node as a literal backslash+n, which is not a valid statement separator in JavaScript
   - C) Semicolons are faster to execute than newlines
   - D) The validator strips all newline characters before compilation

   > **Answer: B** — In bash, `\n` within a double-quoted string is not an escape sequence; it remains as two literal characters: `\` and `n`. When Node receives the `-e` argument, it sees a backslash as the start of an invalid statement, causing a syntax error. A semicolon `;` is a real JavaScript statement terminator that needs no shell interpretation at all.
