---
meta:
  id: create-skill-skill
  title: Create Skill Skill Specification
  version: 0.1.0
  status: draft
  specType: skill
  scope: skill
  tags: []
  createdBy: unknown
  createdAt: '2026-03-12'
  reviewedAt: null
name: create-skill
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
  id: create-skill-skill
  title: create-skill SKILL
  version: 0.1.0
  status: draft
  scope: skill
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'

---

---

meta:
id: create-skill-skill
title: create-skill SKILL
version: 0.1.0
status: draft
scope: skill
tags: []
createdBy: unknown
createdAt: '2026-02-23'

---

# create-skill SKILL

Purpose

- Automate creation of new SKILL markdown artifacts under `.agent-alchemy/SKILLS/` using the repository SKILL conventions and front-matter schema.

Behavior

- Generates a new folder under `.agent-alchemy/SKILLS/<skill-name>/` with a `SKILL.md` file containing validated YAML front-matter `meta` and a basic implementation template.
- Validates the generated `SKILL.md` front-matter against `.agent-alchemy/schemas/spec-meta.schema.json` using the AJV validator.

Policy

- Generated SKILLs include a `meta` front-matter block (id, title, version, status, scope, tags, createdBy, createdAt). SKILLs are agent-facing and must include `meta` so agents can discover and use them. README.md files remain optional and are not enforced.

Usage

1. Run the skill locally (script will be provided in repo) or use the provided template and fill in details.
2. Ensure `meta.id` is unique and kebab-case and `meta.specType` is set to `instruction` or `specification` as appropriate.

Implementation notes

- The SKILL should call the AJV validator in the `verify-skills` SKILL (`.agent-alchemy/SKILLS/verify-skills/scripts/validate-spec-frontmatter-ajv.js`) to validate the created SKILL.
- For CI validation, the `verify-skills` SKILL (below) integrates the AJV validator into the pipeline.
