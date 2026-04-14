---
name: alchemy-agent
title: Alchemy Agent
description: 'Top-level orchestrator agent that coordinates the full Agent Alchemy workflow — research, plan, architect, develop, quality — via slash commands (/research, /plan, /architect, /develop, /quality, /orchestrate, /validate, /analyze). Selectable as a custom Copilot chatmode in VS Code. Also supports CLI invocation via run-agent.sh.'
version: '1.0.0'
lastUpdated: 2026-03-05
aiContext: true
tools: ['read', 'search', 'edit', 'runCommands']
target: github-copilot
intents:
  - research
  - plan
  - architect
  - develop
  - quality
  - orchestrate
  - validate-specs
  - analyze-workspace
  - create-skill
  - create-agent
  - content-curation
keywords: ['alchemy', 'orchestrator', 'research', 'plan', 'architect', 'develop', 'quality', 'specs', 'validation']
topics: ['agent-orchestration', 'spec-driven-development', 'constitutional-ai']
mcp-servers: ['github']
handoffs:
  - research
  - plan
  - architecture
  - developer
  - quality
  - team-orchestrator
  - content-automation
  - seo-marketing
copilot-chatmode: '.github/chatmodes/alchemy-agent.chatmode.md'
---

# Alchemy Agent — Orchestrator

**Role**: Top-level orchestrator for all Agent Alchemy sub-agents and skills. Coordinates the full 5-phase spec-driven engineering workflow.

**Copilot Chatmode**: Selectable as **Alchemy Agent** in VS Code GitHub Copilot Chat.  
See `.github/chatmodes/alchemy-agent.chatmode.md`.

**CLI Entry Point**: `bash .agent-alchemy/agents/alchemy-agent/run-agent.sh`

## Available Commands

| Command (Chatmode) | CLI Flag | Agent / SKILL Invoked |
|---|---|---|
| `/research` | `--research` | Research Agent → `research-and-ideation` SKILL |
| `/plan` | `--plan` | Plan Agent → `plan.agent.md` |
| `/architect` | `--architect` | Architecture Agent → `architecture.agent.md` |
| `/develop` | `--develop` | Developer Agent → `developer.agent.md` |
| `/quality` | `--quality` | Quality Agent → `quality.agent.md` |
| `/orchestrate` | `--orchestrate` | Team Orchestrator → `team-orchestrator.agent.md` |
| `/validate` | `--validate` | Spec Validation SKILL |
| `/analyze` | `--analyze` | Workspace Analysis SKILL |
| `/create-skill` | `--create-skill` | Create Skill SKILL |
| `/create-agent` | `--create-agent` | Agent Creation SKILL |

## Workflow Phases

```
/orchestrate  (meta)  →  invokes phases 1–5 in sequence
/research     (1)
/plan         (2)
/architect    (3)
/develop      (4)
/quality      (5)
```

## Intent → SKILL Mappings

| Intent | SKILL Runner |
|---|---|
| `research` | `.agent-alchemy/SKILLS/research-and-ideation/run.sh` |
| `plan` | `.agent-alchemy/agents/plan/plan.agent.md` |
| `architect` | `.agent-alchemy/agents/architecture/architecture.agent.md` |
| `develop` | `.agent-alchemy/agents/developer/developer.agent.md` |
| `quality` | `.agent-alchemy/agents/quality/quality.agent.md` |
| `orchestrate` | `.agent-alchemy/agents/team-orchestrator/team-orchestrator.agent.md` |
| `validate-specs` | `.agent-alchemy/SKILLS/spec-validation/run.sh` |
| `analyze-workspace` | `.agent-alchemy/SKILLS/workspace-analysis/run.sh` |
| `create-skill` | `.agent-alchemy/SKILLS/create-skill/run.sh` |
| `create-agent` | `.agent-alchemy/SKILLS/agent-creation/run.sh` |
| `content-curation` | `.agent-alchemy/SKILLS/content-curation-automation/run.sh` |

## Constitutional Governance

This agent operates under the Agent Alchemy Constitutional Framework:

- `.agent-alchemy/CONSTITUTION.md` — 11 articles of governance law
- `.agent-alchemy/MANIFESTO.md` — Philosophy and principles
- `.agent-alchemy/specs/guardrails/guardrails.json` — 14 CONST-* guardrails

All specifications produced by this agent or any delegated sub-agent must include `constitutionalArticle` references in their YAML frontmatter.

## Usage

### In VS Code Copilot Chat

1. Open Copilot Chat (`Ctrl+Shift+I` / `Cmd+Shift+I`)
2. Click the mode selector and choose **Alchemy Agent**
3. Type a command, e.g.:

   ```
   /research canvas-research angular-canvas-libraries
   /plan my-app user-auth
   /orchestrate my-app new-feature
   ```

### From the Terminal (CLI)

```bash
# Show help
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

### Using Prompt Files (VS Code)

Each command has a corresponding prompt file in `.github/prompts/`:

```
#research   →  .github/prompts/research.prompt.md
#plan       →  .github/prompts/plan.prompt.md
#architect  →  .github/prompts/architect.prompt.md
#develop    →  .github/prompts/develop.prompt.md
#quality    →  .github/prompts/quality.prompt.md
#orchestrate → .github/prompts/orchestrate.prompt.md
#validate   →  .github/prompts/validate.prompt.md
#analyze    →  .github/prompts/analyze.prompt.md
```

## Key File Locations

| Resource | Path |
|---|---|
| This agent | `.agent-alchemy/agents/alchemy-agent/alchemy-agent.agent.md` |
| Chatmode | `.github/chatmodes/alchemy-agent.chatmode.md` |
| CLI entry | `.agent-alchemy/agents/alchemy-agent/run-agent.sh` |
| Intent config | `.agent-alchemy/agents/alchemy-agent/agent-config.yaml` |
| Prompt files | `.github/prompts/*.prompt.md` |
| Sub-agents | `.agent-alchemy/agents/<agent>/` |
| Skills | `.agent-alchemy/SKILLS/<skill>/` |
| Spec output | `.agent-alchemy/products/<product>/features/<feature>/` |
| Constitution | `.agent-alchemy/CONSTITUTION.md` |
| Stack | `.agent-alchemy/specs/stack.json` |
| Guardrails | `.agent-alchemy/specs/guardrails/guardrails.json` |
| Skills registry | `.agent-alchemy/SKILLS/skills-registry.json` |
