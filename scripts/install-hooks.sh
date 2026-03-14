#!/usr/bin/env bash
# Merge ECC hooks/hooks.json into ~/.claude/settings.json
# Activates: destructive command blocking, auto-format, TypeScript checks,
# tmux enforcement, strategic compact suggestions, session state persistence.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOKS_SRC="${REPO_ROOT}/hooks/hooks.json"
SETTINGS_FILE="${HOME}/.claude/settings.json"

if [ ! -f "$HOOKS_SRC" ]; then
  echo "ERROR: hooks/hooks.json not found at ${HOOKS_SRC}" >&2
  exit 1
fi

mkdir -p "${HOME}/.claude"

if [ ! -f "$SETTINGS_FILE" ]; then
  cp "$HOOKS_SRC" "$SETTINGS_FILE"
  echo "Created ${SETTINGS_FILE} from hooks template."
else
  HOOKS_SRC="$HOOKS_SRC" SETTINGS_FILE="$SETTINGS_FILE" python3 - <<'PYEOF'
import json, os

hooks_src = os.environ['HOOKS_SRC']
settings_file = os.environ['SETTINGS_FILE']

with open(hooks_src) as f:
    template = json.load(f)
with open(settings_file) as f:
    existing = json.load(f)

template_hooks = template.get('hooks', {})
existing_hooks = existing.get('hooks', {})
merged_hooks = dict(existing_hooks)

for event, hook_list in template_hooks.items():
    if event not in merged_hooks:
        merged_hooks[event] = hook_list
    else:
        existing_descs = {h.get('description') for h in merged_hooks[event]}
        for hook in hook_list:
            if hook.get('description') not in existing_descs:
                merged_hooks[event].append(hook)

existing['hooks'] = merged_hooks

with open(settings_file, 'w') as f:
    json.dump(existing, f, indent=2)
    f.write('\n')

print(f"Merged hooks into {settings_file}")
PYEOF
fi

echo "Restart Claude Code for hooks to take effect."
echo ""
echo "Active hooks:"
echo "  - Destructive command blocking (rm -rf /, DROP TABLE, dd, mkfs)"
echo "  - Dev server must run in tmux"
echo "  - Auto-format JS/TS after edits"
echo "  - TypeScript check after editing .ts/.tsx"
echo "  - Strategic compact suggestions at 50 tool calls"
echo "  - Session state persistence on end"
