# Alchemy Agent

The **Alchemy Agent** is the top-level orchestrator for the Agent Alchemy workflow. It coordinates all sub-agents and SKILLS through a VS Code Copilot chatmode and a CLI entry point.

## Quick Start

### VS Code (Copilot Chat)

1. Open Copilot Chat (`Ctrl+Shift+I` / `Cmd+Shift+I`)
2. Click the mode selector → select **Alchemy Agent**
3. Use slash commands:

```
/research my-product my-feature
/plan my-product my-feature
/architect my-product my-feature
/develop my-product my-feature
/quality my-product my-feature
/orchestrate my-product my-feature
/validate
/analyze
```

### CLI

```bash
# Show all commands
bash .agent-alchemy/agents/alchemy-agent/run-agent.sh --help

# Run individual phases
bash .agent-alchemy/agents/alchemy-agent/run-agent.sh --research
bash .agent-alchemy/agents/alchemy-agent/run-agent.sh --plan
bash .agent-alchemy/agents/alchemy-agent/run-agent.sh --architect
bash .agent-alchemy/agents/alchemy-agent/run-agent.sh --develop
bash .agent-alchemy/agents/alchemy-agent/run-agent.sh --quality

# Run full pipeline
bash .agent-alchemy/agents/alchemy-agent/run-agent.sh --orchestrate

# Maintenance
bash .agent-alchemy/agents/alchemy-agent/run-agent.sh --validate
bash .agent-alchemy/agents/alchemy-agent/run-agent.sh --analyze
```

## Files in This Directory

| File | Purpose |
|---|---|
| `alchemy-agent.agent.md` | Agent definition with full command reference and orchestration instructions |
| `agent-config.yaml` | Intent → SKILL/agent/prompt mappings for all 12 intents |
| `run-agent.sh` | CLI entry point with help, all phase flags, and graceful error handling |
| `README.md` | This file |

## Related Files

| File | Purpose |
|---|---|
| `.github/chatmodes/alchemy-agent.chatmode.md` | VS Code Copilot chatmode definition |
| `.github/prompts/research.prompt.md` | `/research` command instructions |
| `.github/prompts/plan.prompt.md` | `/plan` command instructions |
| `.github/prompts/architect.prompt.md` | `/architect` command instructions |
| `.github/prompts/develop.prompt.md` | `/develop` command instructions |
| `.github/prompts/quality.prompt.md` | `/quality` command instructions |
| `.github/prompts/orchestrate.prompt.md` | `/orchestrate` command instructions |
| `.github/prompts/validate.prompt.md` | `/validate` command instructions |
| `.github/prompts/analyze.prompt.md` | `/analyze` command instructions |

## Workflow Pipeline

```
/orchestrate  →  /research  →  /plan  →  /architect  →  /develop  →  /quality
     (0)            (1)          (2)          (3)           (4)           (5)
```

Each phase produces specification files in:

```
.agent-alchemy/products/<product>/features/<feature>/
├── research/          (5 files — Phase 1)
├── plan/              (6 files — Phase 2)
├── architecture/      (8 files — Phase 3)
├── development/       (6 files — Phase 4)
└── quality/           (6 files — Phase 5)
```

## Constitutional Governance

All agents operate under the Agent Alchemy Constitutional Framework:

- `.agent-alchemy/CONSTITUTION.md`
- `.agent-alchemy/MANIFESTO.md`
- `.agent-alchemy/specs/guardrails/guardrails.json`
