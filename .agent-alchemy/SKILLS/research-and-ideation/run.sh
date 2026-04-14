#!/bin/sh
# Lightweight SKILL runner wrapper for research-and-ideation
set -euo pipefail
SKILL_DIR="$(dirname "$0")"
ANALYZER="$SKILL_DIR/scripts/generate-research-prompt.sh"
if [ -x "$ANALYZER" ]; then
  "$ANALYZER" "$@"
  exit $?
fi
# Fallback: exit with success but no-op
echo "Research runner placeholder: no generator script detected"
exit 0
