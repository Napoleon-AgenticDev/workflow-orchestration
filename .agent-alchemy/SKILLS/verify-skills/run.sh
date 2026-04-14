#!/bin/sh
set -euo pipefail
SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"

# Run AJV validator first (SKILL-local scripts folder)
node "$SKILL_DIR/scripts/validate-spec-frontmatter-ajv.js"

# Then run metadata checks (legacy shell script) for deeper recommendations
if [ -x "$SKILL_DIR/scripts/validate-metadata.sh" ]; then
  "$SKILL_DIR/scripts/validate-metadata.sh" "$@"
else
  echo "Warning: validate-metadata.sh not found or not executable in $SKILL_DIR/scripts"
fi

exit 0
