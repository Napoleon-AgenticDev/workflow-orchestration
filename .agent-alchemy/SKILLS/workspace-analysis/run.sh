#!/bin/sh
# Lightweight SKILL runner wrapper for workspace-analysis
set -euo pipefail
SKILL_DIR="$(dirname "$0")"
ANALYZER="$SKILL_DIR/scripts/run-analyzer.sh"
if [ ! -x "$ANALYZER" ]; then
  echo "⚠️ Analyzer script not executable. Attempting to run with sh"
  sh "$ANALYZER" "$@"
  exit $?
else
  "$ANALYZER" "$@"
  exit $?
fi
