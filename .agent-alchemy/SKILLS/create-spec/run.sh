#!/bin/sh
# Runner for the create-spec SKILL
# Usage: bash .agent-alchemy/SKILLS/create-spec/run.sh [--mode new|review|improve] [--topic "Topic Name"] [--output path/to/output]
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"

# If a generator script exists in the future, delegate to it
GENERATOR="$SKILL_DIR/scripts/generate-spec.sh"
if [ -x "$GENERATOR" ]; then
  "$GENERATOR" "$@"
  exit $?
fi

# Fallback: print invocation guidance
echo ""
echo "create-spec SKILL"
echo "================="
echo ""
echo "This SKILL is designed to be invoked via GitHub Copilot Chat."
echo ""
echo "Invocation:"
echo "  @workspace run create-spec"
echo ""
echo "Modes:"
echo "  new     — Create a new specification from scratch (guided interview)"
echo "  review  — Audit an existing specification for completeness"
echo "  improve — Fill gaps in a draft specification"
echo ""
echo "The SKILL.md at $SKILL_DIR/SKILL.md contains full instructions for the agent."
echo ""
exit 0
