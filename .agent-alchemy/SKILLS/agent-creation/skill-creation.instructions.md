---
meta:
  id: skill-creation-instructions
  title: Skill Creation Instructions
  version: 0.1.0
  status: draft
  scope: skill
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'
meta:
  id: skill-creation-instructions
  title: Skill Creation Instructions
  version: 0.1.0
  status: draft
  scope: skill
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'
title: Agent Creation - Custom Agent Standards
applyTo: ['.agent-alchemy/agents/**/*.agent.md', '.agent-alchemy/agents/**/*.md', '**/*.agent.md']
---

# Purpose

This document captures a concise, repository-specific summary of the GitHub and VS Code custom-agent standards (naming, frontmatter, formatting, tools, MCP and handoffs). Use it as the authoritative guide for the `agent-creation` SKILL generator and for reviewing generated `.agent.md` files before committing them.

## Naming conventions

- Filename extension: use `.agent.md` for VS Code / GitHub custom agents.
- Allowed characters: letters, numbers, `-`, `_`, and `.` (regex: `^[A-Za-z0-9._-]+$`).
- File location:
  - Workspace-level agents: place in `.agent-alchemy/agents/` (detected by VS Code / Copilot).
  - Organization/enterprise-level agents: place in `agents/` at repo root or organization-level store.
- Conflict resolution: the filename (minus `.agent.md`) is used for deduplication; lower-level (workspace) overrides higher-level (org/enterprise).

## Frontmatter (YAML) - required and recommended fields

- `name` (optional): machine-friendly id. If omitted, the filename is used.
- `title` (recommended): human-friendly title for UI lists.
- `description` (required): short one-line purpose; shown as placeholder text.
- `tools` (optional): YAML array or comma-separated string of tool names or aliases.
  - Omit `tools` or use `['*']` to allow all available tools.
  - Use `[]` to explicitly disable all tools.
- `target` (optional): `vscode` | `github-copilot`. If unset, agent is available in both.
- `model` (optional): single model or prioritized array.
- `mcp-servers` (optional; org/enterprise only at profile-level): configure MCP servers and their tools.
- `handoffs` (optional): list of {label, agent, prompt, send (bool), model} for guided transitions.
- `intents`, `keywords`, `topics` (optional): metadata to aid discovery and mapping to SKILL intents.
- `version`, `lastUpdated`, `aiContext`, `user-invokable`, `disable-model-invocation` (optional): recommended metadata fields for governance.

Notes:

- For GitHub coding agent, some VS Code fields (e.g., `argument-hint`, `handoffs.send/model`) may be ignored.
- Prompt body length: max ~30,000 characters (implementation limit).

## Formatting & body

- Place YAML frontmatter at the top of the file delimited by `---`.
- The body should be Markdown describing the agent's behavior, inputs, outputs, constraints, and example invocations.
- Reference other files via Markdown links. To reference tools in the body, use `#tool:<tool-name>` (VS Code guidance).

## Tools & aliases

- Use canonical tool names or aliases (case-insensitive): e.g. `read`, `edit`, `search`, `agent`, `execute`.
- MCP tools may be referenced as `mcp-name/tool-name` or `mcp-name/*`.
- If `tools` is not present, agent receives access to all repository-available tools.

## MCP servers and secrets

- Repository-level agents cannot define `mcp-servers`; only organization/enterprise-level profiles can embed MCP configs directly.
- If MCP servers are required, prefer configuring them in repository settings and reference tools in `tools` using `mcp-name/<tool>`.
- Never embed raw secrets in agent profiles; use repo/organization MCP secret replacement syntaxes (see GitHub docs) and validate with reviewers.

## Handoffs

- Define `handoffs` as an array of objects with `label`, `agent`, optional `prompt`, and optional `send` (bool).
- Keep handoff prompts short and include context variables if needed. Require human review for auto-send (`send: true`).

## Security & review checklist

- Review `tools` and `mcp-servers` to ensure least privilege (avoid `['*']` unless necessary).
- Confirm `description` accurately describes capabilities and limitations.
- Verify `name`/filename allowed characters and uniqueness across levels.
- Review `handoffs` to ensure downstream agents do not escalate privileges unexpectedly.

## Generator requirements (what the `agent-creation` SKILL should produce)

- Filename: `<safe-name>.agent.md` (sanitized to allowed chars).
- YAML frontmatter including at minimum `name` (or filename) and `description`.
- Recommended defaults: `version: '0.1'`, `lastUpdated: <today>`, `aiContext: true`, `tools: ['read']`.
- If `--mcp` flag passed, produce an MCP stub (`mcp-<name>.json`) under `.agent-alchemy/agents/` or as organization-level artifact.
- Add a short body section with usage hints and review checklist.

## Example snippet

```yaml
---
name: my-agent
title: My Agent
description: 'Assist with repository analysis and scaffold tasks.'
version: '0.1'
lastUpdated: 2026-02-16
aiContext: true
tools: ['read','search']
target: vscode
intents: ['analyze-workspace']
---

You are a repo analysis assistant... (instructions here)
```

## Maintenance

- Update this instructions file when upstream docs change.
- Run the `spec-validation` SKILL to verify generated agent files conform to this guidance before committing.
