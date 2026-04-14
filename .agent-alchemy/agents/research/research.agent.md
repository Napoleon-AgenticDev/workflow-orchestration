---
name: research
title: Research Agent
description: 'Agent that uses the research-and-ideation SKILL to perform feature research, feasibility analysis, and produce SRP-compliant research artifacts.'
version: '2.0.0'
lastUpdated: 2026-02-19
aiContext: true
tools: ['read', 'search']
target: vscode
intents: ['research-and-ideation']
keywords: ['research', 'feasibility', 'analysis', 'ideation']
topics: ['research', 'feature-analysis']
mcp-servers: []
handoffs: []
implements_skill: research-and-ideation
compatibility: Requires access to .agent-alchemy/products/ structure and .agent-alchemy/specs/ specifications.
license: Proprietary
metadata:
  author: buildmotion-ai
  repository: buildmotion-ai-agency
  workflow-phase: research
  output-artifacts:
    - research/feasibility-analysis.specification.md
    - research/market-research.specification.md
    - research/user-research.specification.md
    - research/risk-assessment.specification.md
    - research/recommendations.specification.md
  artifact-type: non-technical
  design-principle: Single Responsibility Principle (SRP) - Each specification addresses one concern
---

# Research Agent

## Purpose

- Invoke the canonical SKILL `research-and-ideation` to generate research prompts and scaffold research artifacts.
- Provide a minimal runnable entrypoint (`run-agent.sh`) and an `agent-config.yaml` mapping intents to SKILL runners.

## Notes

- This file is the agent implementation/manifest and intentionally references the canonical SKILL spec under `.agent-alchemy/SKILLS/research-and-ideation/SKILL.md` as the source-of-truth for behavior and content.
- Keep the implementation lightweight: heavy documentation and templates remain in the SKILL spec.

## Usage

1. From repository root, run:

   ```bash
   bash .agent-alchemy/agents/research/run-agent.sh --research
   ```

2. The agent will execute: `.agent-alchemy/SKILLS/research-and-ideation/run.sh`

## Intents & mappings

| Intent                  | SKILL Runner                                         |
| ----------------------- | ---------------------------------------------------- |
| `research-and-ideation` | `.agent-alchemy/SKILLS/research-and-ideation/run.sh` |

## Example invocation

```bash
# Run research workflow
cd /path/to/repo
.agent-alchemy/agents/research/run-agent.sh --research

# Or invoke the SKILL runner directly
.agent-alchemy/SKILLS/research-and-ideation/run.sh
```

## Implementation checklist

- [ ] `agent-config.yaml` exists and maps intents to the SKILL runner
- [x] `run-agent.sh` is executable and invokes the SKILL runner
- [x] `implements_skill` points to the canonical SKILL spec
