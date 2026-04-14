---
meta:
  id: agent-template-agent
  title: Agent Template Agent
  version: 0.1.0
  status: draft
  scope: skill
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'
meta:
  id: agent-template-agent
  title: Agent Template Agent
  version: 0.1.0
  status: draft
  scope: skill
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'
name: example-agent
title: Example Agent
description: 'Example custom agent - replace with real values'
version: '0.1'
lastUpdated: 2026-02-17
aiContext: true
tools: ['read', 'search', 'edit']
target: vscode
mcp-servers: []
handoffs: []
intents: ['assist', 'scaffold']
keywords: ['copilot', 'agent', 'scaffold']
topics: ['agent-creation', 'automation']
---

# Example Agent

Use this template as the basis for new custom agents. Replace the YAML frontmatter values with
accurate metadata and add detailed instructions in the body describing the agent's responsibilities,
expected inputs, and handoffs. Recommended frontmatter fields:

- `name` (required): short machine-friendly id
- `title` (recommended): human-friendly title
- `description` (required): short description of the agent's purpose
- `version` (recommended): semantic version
- `lastUpdated` (recommended): ISO date
- `aiContext` (boolean): whether the agent expects contextual workspace analysis
- `tools`: array of allowed tools (read, search, edit, run, etc.)
- `target`: runtime/platform (vscode, github-copilot, cli)
- `mcp-servers`: optional list of MCP server configs for handoffs
- `handoffs`: list of other agents or processes this agent delegates to
- `intents`: array of intent names this agent supports

Body guidelines

- Describe the inputs (file paths, prompts, options)
- Define expected outputs and file locations
- List constraints, safety checks, and review requirements
- Provide example invocations if applicable

Example usage (after generation):

bash .agent-alchemy/SKILLS/agent-creation/run.sh --name my-agent --description "Assist with testing" --tools "read,search" --target vscode

After running, review and update the frontmatter values before committing.
