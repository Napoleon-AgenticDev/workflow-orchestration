#!/bin/sh
set -euo pipefail
SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SKILL_DIR/../.." && pwd)"

usage(){
  cat <<EOF
Usage: $0 --id my-skill --title "My Skill" --createdBy team
Creates: .agent-alchemy/SKILLS/<id>/SKILL.md with structured front-matter (meta block)
EOF
  exit 1
}

ID=""
TITLE=""
CREATED_BY=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --id) ID="$2"; shift 2;;
    --title) TITLE="$2"; shift 2;;
    --createdBy) CREATED_BY="$2"; shift 2;;
    -h|--help) usage;;
    *) echo "Unknown arg: $1"; usage;;
  esac
done

if [ -z "$ID" ] || [ -z "$TITLE" ] || [ -z "$CREATED_BY" ]; then
  usage
fi

SAFE_ID=$(echo "$ID" | tr ' ' '-' | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]//g')
OUT_DIR="$ROOT/.agent-alchemy/SKILLS/$SAFE_ID"
mkdir -p "$OUT_DIR"
OUT_FILE="$OUT_DIR/SKILL.md"

NOW=$(date -u +%F)

cat > "$OUT_FILE" <<EOF
---
meta:
  id: ${SAFE_ID}
  title: "${TITLE}"
  version: "0.1.0"
  status: "draft"
  scope: "skill"
  tags: []
  createdBy: "${CREATED_BY}"
  createdAt: "${NOW}"
specType: "instruction"
copilot:
  reference: ".agent-alchemy/SKILLS/${SAFE_ID}"
---

# ${TITLE}

Describe the SKILL here.

## Intents

- intent-name

## Runner

Include a runner script under `scripts/` and set `runner: './run.sh'` in the meta or top-level fields as preferred.

EOF

echo "Created SKILL: $OUT_FILE"

# Validate
echo "Validating created SKILL with AJV..."
node "$ROOT/.agent-alchemy/SKILLS/verify-skills/scripts/validate-spec-frontmatter-ajv.js"

echo "Done. Review and commit the new SKILL folder: $OUT_DIR"

exit 0
