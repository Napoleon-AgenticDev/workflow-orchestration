#!/bin/sh
set -euo pipefail
ROOT="$(pwd)"

usage() {
  echo "Usage: $0 [--research]"
  exit 1
}

if [ "$#" -eq 0 ]; then
  usage
fi

while [ "$#" -gt 0 ]; do
  case "$1" in
    --research)
      echo "Running research-and-ideation SKILL..."
      bash .agent-alchemy/SKILLS/research-and-ideation/run.sh || true
      shift
      ;;
    *)
      usage
      ;;
  esac
done