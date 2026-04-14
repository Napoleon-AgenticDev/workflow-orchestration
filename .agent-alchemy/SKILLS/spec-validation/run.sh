#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SCHEMA_VALIDATOR="$SCRIPT_DIR/scripts/validate-frontmatter-schema.js"

if [ ! -f "$SCHEMA_VALIDATOR" ]; then
  echo "Schema validator not found: $SCHEMA_VALIDATOR" >&2
  exit 2
fi

FIX_MODE=0
if [ "${1:-}" = "--fix" ]; then
  FIX_MODE=1
fi

if [ "$FIX_MODE" -eq 1 ]; then
  AUTOFIX="$SCRIPT_DIR/autofix.sh"
  if [ -f "$AUTOFIX" ]; then
    echo "🔧 Running autofix suggestions..."
    AUTOFIX_OUT="$($AUTOFIX 2>&1)" || AUTOFIX_RC=$?
    AUTOFIX_RC=${AUTOFIX_RC:-0}
    echo "$AUTOFIX_OUT"
    if [ "$AUTOFIX_RC" -ne 0 ]; then
      echo "Autofix reported issues (exit $AUTOFIX_RC)"
    fi
  else
    echo "No autofix script found: $AUTOFIX"
  fi
fi

# Run validator and capture output and exit code
OUTPUT="$(node "$SCHEMA_VALIDATOR" 2>&1)" || RC=$?
RC=${RC:-0}

# Emit structured JSON (exitCode + raw output). Write temp file then use Python to read it.
TMP_OUT=$(mktemp)
printf "%s" "$OUTPUT" > "$TMP_OUT"
python3 - <<PY
import sys, json
rc = ${RC}
with open('${TMP_OUT}', 'r', encoding='utf-8') as f:
  out = f.read()
print(json.dumps({"exitCode": rc, "output": out}, indent=2))
sys.exit(rc)
PY
rm -f "$TMP_OUT"
