---
meta:
  id: verify-skills-skill
  title: Verify Skills Skill Specification
  version: 0.1.0
  status: draft
  specType: skill
  scope: skill
  tags: []
  createdBy: unknown
  createdAt: '2026-03-12'
  reviewedAt: null
name: verify-skills
description: ''
category: SKILLS
aiContext: true
keywords: []
topics: []
useCases: []
---

---
meta:
  id: skill
  title: SKILL
  version: 0.1.0
  status: draft
  scope: skill
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'
meta:
  id: verify-skills-skill
  title: verify-skills SKILL
  version: 0.1.0
  status: draft
  scope: skill
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'

---

---

meta:
id: verify-skills-skill
title: verify-skills SKILL
version: 0.1.0
status: draft
scope: skill
tags: []
createdBy: unknown
createdAt: '2026-02-23'

---

# verify-skills SKILL

Purpose

- Verify that all SKILL and spec artifacts in `.agent-alchemy/SKILLS/` and `.agent-alchemy/specs/` conform to the required front-matter schema and repository practices.

What it does

- Runs the AJV validator located in this SKILL's `scripts/` folder (`scripts/validate-spec-frontmatter-ajv.js`) to perform strict schema validation using AJV.
- Optionally runs the lightweight fixer `scripts/validate-spec-frontmatter.js --fix` to add minimal front-matter for files that lack any.
- Emits a report listing files with errors, YAML parse issues, or schema validation problems.

Integration

- The verify-skills SKILL is intended to be run in CI (see `.github/workflows/validate-specs.yml`) and locally by maintainers as part of pre-merge checks.

Runner

- Run locally via: `bash .agent-alchemy/SKILLS/verify-skills/run.sh` which executes the AJV validator and the legacy metadata checks located in this SKILL's `scripts/` folder.

Notes

- This SKILL centralizes the validation behavior; you can extend it to include additional checks (e.g., uniqueness of meta.id across specs, cross-reference checks against a manifest, or alignment with external SpecAlchemy standards).

Policy

- README.md files are developer-facing documentation and are optional: they are not required to contain `meta` front-matter and are skipped by the validator by design.
- Agent-facing artifacts (must include a `meta` block): `*.spec.md`, files named `SKILL.md` inside `.agent-alchemy/SKILLS/`, and any files with the `.SKILL.md` suffix. The validator enforces `meta` only on those files.

Files

- `scripts/validate-metadata.sh` — moved here from the specs area; performs more opinionated checks and reporting.
