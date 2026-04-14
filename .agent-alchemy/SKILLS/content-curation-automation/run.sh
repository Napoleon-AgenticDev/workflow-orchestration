#!/bin/sh
# Lightweight SKILL runner wrapper for content-curation-automation
set -euo pipefail
SKILL_DIR="$(dirname "$0")"
MAIN_SCRIPT="$SKILL_DIR/scripts/run-curation.sh"
if [ -x "$MAIN_SCRIPT" ]; then
  "$MAIN_SCRIPT" "$@"
  exit $?
fi
echo "Content curation runner placeholder: no run script found"
exit 0
