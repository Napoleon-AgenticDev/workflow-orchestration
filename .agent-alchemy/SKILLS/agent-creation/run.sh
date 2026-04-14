#!/bin/sh
set -euo pipefail
SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$SKILL_DIR/scripts/generate-agent.sh"
if [ -x "$SCRIPT" ]; then
  "$SCRIPT" "$@"
  exit $?
else
  echo "Agent creation runner: generator script not found or not executable"
  exit 2
fi
