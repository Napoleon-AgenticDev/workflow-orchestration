#!/bin/bash
# Workspace Analyzer Quick Run Script
# Usage: ./scripts/run-analyzer.sh (from SKILL root) or full path from workspace root

set -e

echo "🔍 Running Workspace Specification Analysis..."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Determine workspace root robustly
# 1) Prefer git repository root when available
if WORKSPACE_ROOT="$(cd "$SCRIPT_DIR" && git rev-parse --show-toplevel 2>/dev/null)"; then
  :
else
  # 2) Fallback: walk up from SCRIPT_DIR until package.json is found
  SEARCH_DIR="$SCRIPT_DIR"
  while [ "$SEARCH_DIR" != "/" ] && [ ! -f "$SEARCH_DIR/package.json" ]; do
    SEARCH_DIR="$(dirname "$SEARCH_DIR")"
  done
  if [ -f "$SEARCH_DIR/package.json" ]; then
    WORKSPACE_ROOT="$SEARCH_DIR"
  else
    echo "❌ Error: Cannot find workspace root (package.json missing)"
    exit 1
  fi
fi
cd "$WORKSPACE_ROOT"

if [ ! -f "package.json" ]; then
  echo "❌ Error: Cannot find workspace root (package.json missing)"
  exit 1
fi

# Run analyzer using relative path from workspace root
npx ts-node --project "$SCRIPT_DIR/tsconfig.json" "$SCRIPT_DIR/workspace-analyzer.ts"

# Show latest results location
LATEST=$(ls -t .agent-alchemy/reports/specops-analysis/ 2>/dev/null | head -1)

if [ -n "$LATEST" ]; then
  echo ""
  echo "📄 Latest analysis: .agent-alchemy/reports/specops-analysis/$LATEST"
fi
