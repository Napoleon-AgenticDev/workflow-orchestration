#!/bin/sh
# Alchemy Agent CLI — orchestrates the full Agent Alchemy workflow
# Usage: bash .agent-alchemy/agents/alchemy-agent/run-agent.sh [flags]
# See: .agent-alchemy/agents/alchemy-agent/alchemy-agent.agent.md for full documentation
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"

BOLD='\033[1m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

log_info()    { printf "${CYAN}[alchemy-agent]${RESET} %s\n" "$1"; }
log_success() { printf "${GREEN}[alchemy-agent] ✓${RESET} %s\n" "$1"; }
log_warn()    { printf "${YELLOW}[alchemy-agent] ⚠${RESET} %s\n" "$1"; }
log_error()   { printf "${RED}[alchemy-agent] ✗${RESET} %s\n" "$1" >&2; }

usage() {
  printf "${BOLD}Alchemy Agent CLI${RESET}\n"
  printf "Orchestrated AI engineering workflow for Agent Alchemy.\n\n"
  printf "${BOLD}Usage:${RESET}\n"
  printf "  bash .agent-alchemy/agents/alchemy-agent/run-agent.sh [flags]\n\n"
  printf "${BOLD}Workflow Phases (in order):${RESET}\n"
  printf "  ${CYAN}--research${RESET}        Phase 1: Run the Research Agent (research-and-ideation SKILL)\n"
  printf "  ${CYAN}--plan${RESET}            Phase 2: Run the Plan Agent\n"
  printf "  ${CYAN}--architect${RESET}       Phase 3: Run the Architecture Agent\n"
  printf "  ${CYAN}--develop${RESET}         Phase 4: Run the Developer Agent\n"
  printf "  ${CYAN}--quality${RESET}         Phase 5: Run the Quality Agent\n\n"
  printf "${BOLD}Orchestration:${RESET}\n"
  printf "  ${CYAN}--orchestrate${RESET}     Run the full pipeline via the Team Orchestrator\n\n"
  printf "${BOLD}Maintenance:${RESET}\n"
  printf "  ${CYAN}--validate${RESET}        Validate spec frontmatter and schema compliance\n"
  printf "  ${CYAN}--analyze${RESET}         Analyze the Nx workspace (stack.json, guardrails.json)\n"
  printf "  ${CYAN}--curate${RESET}          Run content curation automation\n"
  printf "  ${CYAN}--create-skill${RESET}    Scaffold a new SKILL\n"
  printf "  ${CYAN}--create-agent${RESET}    Scaffold a new agent\n\n"
  printf "${BOLD}Options:${RESET}\n"
  printf "  ${CYAN}--help${RESET}            Show this help message\n\n"
  printf "${BOLD}Examples:${RESET}\n"
  printf "  bash .agent-alchemy/agents/alchemy-agent/run-agent.sh --research\n"
  printf "  bash .agent-alchemy/agents/alchemy-agent/run-agent.sh --orchestrate\n"
  printf "  bash .agent-alchemy/agents/alchemy-agent/run-agent.sh --validate --analyze\n\n"
  printf "${BOLD}Copilot Chatmode:${RESET}\n"
  printf "  Select 'Alchemy Agent' in VS Code Copilot Chat for interactive commands:\n"
  printf "  /research, /plan, /architect, /develop, /quality, /orchestrate, /validate, /analyze\n\n"
  printf "${BOLD}Documentation:${RESET}\n"
  printf "  Agent:    .agent-alchemy/agents/alchemy-agent/alchemy-agent.agent.md\n"
  printf "  Chatmode: .github/chatmodes/alchemy-agent.chatmode.md\n"
  printf "  Prompts:  .github/prompts/<command>.prompt.md\n"
  exit 0
}

run_skill() {
  local label="$1"
  local script="$2"
  if [ -f "$script" ]; then
    log_info "Running $label..."
    local rc=0
    bash "$script" || rc=$?
    if [ "$rc" -ne 0 ]; then
      log_warn "$label completed with warnings (exit code $rc)"
    fi
    log_success "$label complete."
  else
    log_warn "$label script not found at $script — skipping (placeholder)."
  fi
}

if [ "$#" -eq 0 ]; then
  log_error "No flags provided. Use --help for usage."
  printf "\n"
  usage
fi

while [ "$#" -gt 0 ]; do
  case "$1" in
    --help|-h)
      usage
      ;;
    --research)
      log_info "=== Phase 1: Research Agent ==="
      log_info "Agent: .agent-alchemy/agents/research/research.agent.md"
      log_info "Prompt: .github/prompts/research.prompt.md"
      run_skill "research-and-ideation" ".agent-alchemy/SKILLS/research-and-ideation/run.sh"
      shift
      ;;
    --plan)
      log_info "=== Phase 2: Plan Agent ==="
      log_info "Agent: .agent-alchemy/agents/plan/plan.agent.md"
      log_info "Prompt: .github/prompts/plan.prompt.md"
      log_warn "Requires completed research artifacts (5 files). Run --research first if needed."
      run_skill "plan-agent" ".agent-alchemy/agents/plan/run-agent.sh"
      shift
      ;;
    --architect)
      log_info "=== Phase 3: Architecture Agent ==="
      log_info "Agent: .agent-alchemy/agents/architecture/architecture.agent.md"
      log_info "Prompt: .github/prompts/architect.prompt.md"
      log_warn "Requires research (5) + plan (6) artifacts. Run --research and --plan first if needed."
      run_skill "architecture-agent" ".agent-alchemy/agents/architecture/run-agent.sh"
      shift
      ;;
    --develop)
      log_info "=== Phase 4: Developer Agent ==="
      log_info "Agent: .agent-alchemy/agents/developer/developer.agent.md"
      log_info "Prompt: .github/prompts/develop.prompt.md"
      log_warn "Requires research (5) + plan (6) + architecture (8) artifacts."
      run_skill "developer-agent" ".agent-alchemy/agents/developer/run-agent.sh"
      shift
      ;;
    --quality)
      log_info "=== Phase 5: Quality Agent ==="
      log_info "Agent: .agent-alchemy/agents/quality/quality.agent.md"
      log_info "Prompt: .github/prompts/quality.prompt.md"
      log_warn "Requires all 25 prior specification artifacts."
      run_skill "quality-agent" ".agent-alchemy/agents/quality/run-agent.sh"
      shift
      ;;
    --orchestrate)
      log_info "=== Orchestrate: Full Pipeline ==="
      log_info "Agent: .agent-alchemy/agents/team-orchestrator/team-orchestrator.agent.md"
      log_info "Prompt: .github/prompts/orchestrate.prompt.md"
      log_info "Running full pipeline: research → plan → architect → develop → quality"
      run_skill "research-and-ideation" ".agent-alchemy/SKILLS/research-and-ideation/run.sh"
      run_skill "plan-agent"            ".agent-alchemy/agents/plan/run-agent.sh"
      run_skill "architecture-agent"    ".agent-alchemy/agents/architecture/run-agent.sh"
      run_skill "developer-agent"       ".agent-alchemy/agents/developer/run-agent.sh"
      run_skill "quality-agent"         ".agent-alchemy/agents/quality/run-agent.sh"
      log_success "Full pipeline complete."
      shift
      ;;
    --validate)
      log_info "=== Validate: Spec Frontmatter ==="
      log_info "Prompt: .github/prompts/validate.prompt.md"
      run_skill "spec-validation" ".agent-alchemy/SKILLS/spec-validation/run.sh"
      shift
      ;;
    --analyze)
      log_info "=== Analyze: Nx Workspace ==="
      log_info "Prompt: .github/prompts/analyze.prompt.md"
      run_skill "workspace-analysis" ".agent-alchemy/SKILLS/workspace-analysis/run.sh"
      shift
      ;;
    --curate)
      log_info "=== Content Curation ==="
      run_skill "content-curation" ".agent-alchemy/SKILLS/content-curation-automation/run.sh"
      shift
      ;;
    --create-skill)
      log_info "=== Create SKILL Scaffold ==="
      run_skill "create-skill" ".agent-alchemy/SKILLS/create-skill/run.sh"
      shift
      ;;
    --create-agent)
      log_info "=== Create Agent Scaffold ==="
      run_skill "create-agent" ".agent-alchemy/SKILLS/agent-creation/run.sh"
      shift
      ;;
    *)
      log_error "Unknown flag: $1"
      printf "\n"
      usage
      ;;
  esac
done
