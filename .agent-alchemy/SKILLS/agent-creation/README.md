# Agent Creation SKILL

This SKILL helps scaffold GitHub Copilot custom agents (`.agent.md`) following GitHub and VS Code conventions.

Quick start

Generate a new agent:

```sh
bash .agent-alchemy/SKILLS/agent-creation/run.sh --name my-agent --description "Assist with testing" --tools "read,search" --target vscode
```

This will create `.agent-alchemy/agents/my-agent.agent.md`.

References

- GitHub: Creating custom agents — <https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents>
- GitHub: Custom agents configuration — <https://docs.github.com/en/copilot/reference/custom-agents-configuration>
- VS Code: Custom agents file structure — <https://code.visualstudio.com/docs/copilot/customization/custom-agents#_custom-agent-file-structure>

Frontmatter guidance

The generated `.agent.md` includes a YAML frontmatter block. After generation, update the frontmatter to include accurate metadata. Recommended fields (the template already includes these):

- `name` (required) — short machine-friendly id
- `title` (recommended) — human-friendly title
- `description` (required) — one-line purpose
- `version` (recommended) — semantic version
- `lastUpdated` (recommended) — ISO date
- `aiContext` (boolean) — whether the agent expects workspace context
- `tools` — allowed tool set (e.g., `read`, `search`, `edit`)
- `target` — target runtime (e.g., `vscode`, `github-copilot`)
- `mcp-servers` — optional MCP handoff configuration
- `handoffs` — other agents or processes this agent delegates to
- `intents` — intent names the agent supports

After generation, review the agent body and frontmatter carefully — especially `tools`, `mcp-servers`, and `handoffs` — because they determine the agent's privileges and integrations.
