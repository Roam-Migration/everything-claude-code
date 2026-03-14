#!/usr/bin/env bash
# Install ECC slash commands to ~/.claude/commands/
# Claude Code auto-discovers commands from ~/.claude/commands/ (user scope)
# and .claude/commands/ (project scope). The ECC commands/ directory at repo
# root is NOT auto-discovered — this script bridges that gap.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMMANDS_SRC="${REPO_ROOT}/commands"
COMMANDS_DEST="${HOME}/.claude/commands"

if [ ! -d "$COMMANDS_SRC" ]; then
  echo "ERROR: commands/ directory not found at ${COMMANDS_SRC}" >&2
  exit 1
fi

mkdir -p "$COMMANDS_DEST"

count=0
for file in "${COMMANDS_SRC}"/*.md; do
  [ -f "$file" ] || continue
  name="$(basename "$file")"
  cp "$file" "${COMMANDS_DEST}/${name}"
  echo "Installed: ${name}"
  count=$((count + 1))
done

echo ""
echo "${count} command(s) installed to ${COMMANDS_DEST}"
echo "Restart Claude Code for new commands to take effect."
