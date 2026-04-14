---
meta:
  id: agent-creation-skill
  title: Agent Creation Skill Specification
  version: 0.1.0
  status: draft
  specType: skill
  scope: skill
  tags:
    - copilot
    - agent
    - custom-agent
    - agent-creation
    - automation
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
name: agent-creation
description: >-
  Scaffold repository-level Copilot custom agents using repository conventions and templates. Generates `.agent.md`
  profiles, optional MCP stubs, and README references.
category: SKILLS
aiContext: true
keywords:
  - copilot
  - agent
  - custom-agent
  - agent-creation
topics:
  - agent-creation
  - copilot
  - automation
useCases: []
---

# Agent Creation SKILL

Purpose

- Scaffold repository-level Copilot custom agents (`.agent.md`) using approved naming conventions and configuration options.
- Generate a minimal agent profile, optional MCP server stub, and a brief README entry linking to Copilot docs.

Usage

- From repository root, run the SKILL runner to create a new agent profile:

  bash .agent-alchemy/SKILLS/agent-creation/run.sh --name my-agent --description "Agent description" --tools "read,edit,search" --target vscode

Outputs

- Creates `.agent-alchemy/agents/<agent-name>.agent.md` (workspace level) by default. For org-level agents, move file to `agents/` root as documented.
- Optionally creates `.agent-alchemy/agents/mcp-<agent-name>.json` stub when `--mcp` is passed.

Notes

- This SKILL follows the Copilot custom agent schema and VS Code agent conventions documented by GitHub and Microsoft. See references in `README.md`.
