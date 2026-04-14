# Agent Creation Validation Prompt

Review the agent implementations and validate they follow repository Agent standards. For each agent folder listed, verify the canonical `.agent.md` is present and that its YAML frontmatter and body meet these rules:

## Required frontmatter fields and rules

- name: present and matches filename (sanitized to /^[A-Za-z0-9._-]+$/).
- title: non-empty human-friendly title.
- description: short one-line purpose.
- version: semantic version (e.g., 0.1 or 0.1.0).
- lastUpdated: ISO date (YYYY-MM-DD) and not in the future.
- aiContext: boolean (true if agent reads workspace).
- tools: array; prefer least-privilege (avoid ['*']); valid tools only (read,search,edit,agent,execute,run).
- target: one of `vscode`, `github-copilot`, or omitted for both.
- intents: array of intent names the agent supports.
- keywords/topics: optional but recommended.
- mcp-servers: must be empty or absent for repo-level agents (org-only).
- handoffs: if present, must be array of {label, agent, prompt, send?} with sensible defaults.

## Structural & content checks

- The canonical file is `<folder>/<agent>.agent.md`; if an `AGENT.md` exists, it must be removed or contain only a pointer to canonical file.
- The `.agent.md` body must include `Usage`, `Intents & mappings`, and `Example invocation` sections.
- All referenced SKILL runner paths (e.g., `.agent-alchemy/SKILLS/.../run.sh`) must exist and be executable.
- No secrets in frontmatter or body (no raw tokens/keys).
- Filenames use allowed chars and are unique within `.agent-alchemy/agents/`.

Lint/Validation checklist (pass/fail)

- [ ] `.agent.md` exists in folder
- [ ] Frontmatter contains required fields (name,title,description,version,lastUpdated,aiContext,tools)
- [ ] `name` equals sanitized filename
- [ ] `version` is semver-like
- [ ] `lastUpdated` is valid ISO date
- [ ] `tools` is an array and not ['*'] unless reviewed
- [ ] `mcp-servers` is empty/absent for repo-level agents
- [ ] All `intents` map to existing SKILL runner paths
- [ ] All referenced files exist and have correct permissions
- [ ] No duplicate agent names across workspace
- [ ] Body includes `Usage` and `Intents & mappings`
- [ ] No secrets or PII present

## Automation suggestions (commands)

- To list agent files:
  - find .agent-alchemy/agents -name "\*.agent.md"
- To validate YAML frontmatter presence and fields (example using yq/python):
  - yq eval '.name, .title, .description, .version, .lastUpdated, .aiContext, .tools' <file>
- To check names match filenames:
  - python3 - <<'PY'
    import sys,yaml,os
    f=sys.argv[1]
    with open(f) as fh:
    d=yaml.safe_load(fh)
    name=d.get('name') or os.path.splitext(os.path.basename(f))[0]
    print(name==os.path.splitext(os.path.basename(f))[0])
    PY
- To confirm referenced SKILL runners exist and are executable:
  - grep -Eo '\.agent-alchemy/SKILLS/[^)\s]+' -R | sort -u | while read p; do test -f "$p" -a -x "$p" || echo "missing or not executable: $p"; done

## Suggested improvements to the validation task

- Make the validation task explicit (e.g., "Flag errors and suggest automated fixes").
- Require a pass/fail checklist per agent in output (machine-parseable JSON optional).
- Ask for remediation steps when checks fail (e.g., fix frontmatter, update tools to least-privilege, remove AGENT.md).

## Minimal canonical `.agent.md` template to validate against

name: my-agent
title: My Agent
description: 'Short one-line purpose'
version: '0.1'
lastUpdated: 2026-02-17
aiContext: true
tools: ['read','search']
target: vscode
intents: ['analyze-workspace']
keywords: ['copilot','agent']
topics: ['agent-creation']

---

## Wrap-up

- Produce a per-agent report (markdown or JSON) listing pass/fail checks and suggested fixes.
- Optionally run the automated checks now and produce the report for the agent folders listed.
