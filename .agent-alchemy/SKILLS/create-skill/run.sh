#!/bin/sh
set -euo pipefail
SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$SKILL_DIR/scripts/generate-skill.sh"
if [ -x "$SCRIPT" ]; then
  "$SCRIPT" "$@"
  exit $?
else
  echo "create-skill runner: generator script not found or not executable"
  exit 2
fi
