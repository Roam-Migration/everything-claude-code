# scripts/lib — Shared Hook Utilities

Four modules used by hooks in `scripts/hooks/` and CI scripts in `scripts/ci/`.
TypeScript typings are in the corresponding `.d.ts` files.

---

## utils.js — Core cross-platform utilities

The primary module. Import what you need:

```js
const { readStdinString, findAncestorDir, log, ensureDir } = require('../lib/utils');
```

### Hook I/O

| Function | Use when |
|---|---|
| `readStdinString(opts?)` | Hook needs to inspect stdin **and** pass it through to stdout unchanged. Returns raw string. |
| `readStdinJson(opts?)` | Hook only needs the parsed JSON object (no stdout passthrough needed). |
| `log(msg)` | Write to stderr (shows in Claude's terminal). |
| `output(data)` | Write JSON or string to stdout (returned to Claude's context). |

Both stdin readers accept `{ timeoutMs, maxSize }` options and never reject — safe without try/catch.

**Typical PostToolUse hook pattern:**
```js
const { readStdinString, log } = require('../lib/utils');

readStdinString().then(data => {
  try {
    const input = JSON.parse(data);
    const filePath = input.tool_input?.file_path;
    // ... do work ...
  } catch { /* pass through */ }

  process.stdout.write(data); // always forward stdin to stdout
  process.exit(0);
}).catch(() => process.exit(0));
```

**Typical Stop/SessionEnd hook pattern (no stdout passthrough needed):**
```js
const { readStdinJson, log } = require('../lib/utils');

async function main() {
  const input = await readStdinJson();
  const transcriptPath = input.transcript_path;
  // ...
}
main().catch(() => process.exit(0));
```

### File system

| Function | Description |
|---|---|
| `ensureDir(dir)` | Create directory recursively if needed. Returns the path. |
| `findAncestorDir(startDir, filename, maxDepth?)` | Walk up from `startDir` looking for an ancestor containing `filename` (e.g., `"package.json"`, `"tsconfig.json"`). Returns the directory or `null`. |
| `readFile(path)` | Read file as UTF-8 string. Returns `null` on any error. |
| `writeFile(path, content)` | Write file, creating parent dirs as needed. |
| `appendFile(path, content)` | Append to file, creating parent dirs as needed. |
| `findFiles(dir, pattern, opts?)` | Glob-style file search. Returns `[{path, mtime}]` sorted by mtime. Supports `{ maxAge, recursive }`. |
| `replaceInFile(path, search, replace, opts?)` | In-place regex/string replace. Returns `false` on error. |
| `countInFile(path, pattern)` | Count pattern occurrences in a file. |
| `grepFile(path, pattern)` | Return matching `[{lineNumber, content}]` from a file. |

### Directories

```js
getHomeDir()          // os.homedir()
getClaudeDir()        // ~/.claude
getSessionsDir()      // ~/.claude/sessions
getLearnedSkillsDir() // ~/.claude/skills/learned
getTempDir()          // os.tmpdir()
```

### Date / time

```js
getDateString()     // "2026-03-15"
getTimeString()     // "14:32"
getDateTimeString() // "2026-03-15 14:32:05"
```

### Session / project

```js
getSessionIdShort() // Last 8 chars of CLAUDE_SESSION_ID, or project name
getGitRepoName()    // basename of git root, or null
getProjectName()    // git repo name or cwd basename
```

### System

```js
commandExists(cmd)         // Check if command is in PATH (spawns which/where)
runCommand(cmd, opts?)     // execSync wrapper → { success, output }
isGitRepo()                // Check if cwd is inside a git repo
getGitModifiedFiles(pats?) // git diff --name-only HEAD, optionally filtered by regex
```

---

## session-manager.js — Session file CRUD

Sessions are stored as `~/.claude/sessions/YYYY-MM-DD-<shortId>-session.tmp`.

```js
const { getAllSessions, getSessionById, writeSessionContent } = require('../lib/session-manager');
```

Key functions: `parseSessionFilename`, `parseSessionMetadata`, `getSessionStats`,
`getAllSessions`, `getSessionById`, `getSessionTitle`, `getSessionSize`,
`writeSessionContent`, `appendSessionContent`, `deleteSession`, `sessionExists`.

---

## session-aliases.js — Named session shortcuts

Aliases are stored in `~/.claude/session-aliases.json`.

```js
const { setAlias, resolveAlias, listAliases } = require('../lib/session-aliases');
```

Key functions: `validateAliasName`, `setAlias`, `resolveAlias`, `listAliases`,
`deleteAlias`, `renameAlias`, `resolveSessionAlias`, `updateAliasTitle`,
`getAliasesForSession`, `cleanupAliases`.

---

## package-manager.js — Package manager detection

Detects the project's package manager without spawning child processes on the hot path.

```js
const { getPackageManager, getRunCommand } = require('../lib/package-manager');
```

Detection order: env var → project config → `package.json#packageManager` → lock file → global config → `npm`.

Key functions: `getPackageManager`, `setPreferredPackageManager`, `getRunCommand`,
`getExecCommand`, `detectFromLockFile`, `detectFromPackageJson`, `getCommandPattern`.

> **Warning:** `getAvailablePackageManagers()` spawns child processes — do not call from session-start or other hot-path hooks.
