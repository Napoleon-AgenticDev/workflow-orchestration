---
meta:
  id: copilot-spec-integration-skill
  title: Skills Skill Specification
  version: 0.1.0
  status: draft
  specType: skill
  scope: skill
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
name: skills
description: ''
category: SKILLS
aiContext: true
keywords: []
topics: []
useCases: []
---

# Copilot Spec Integration SKILL

Purpose

- Describe how Copilot (and other automated agents) should examine, retrieve, and use specification files stored under `.agent-alchemy/specs/`.

Quick rules

- Specs use markdown files with `.spec.md` or `.specification.md` suffix.
- Each spec MUST include a YAML front-matter `meta` block validated by `/.agent-alchemy/schemas/spec-meta.schema.json`.
- Provide a `copilot` block in front-matter with `reference` and optional `spec-id` to help programmatic discovery.

Example directives for AI agents

- copilot: reference .agent-alchemy/specs/
- copilot: spec-id: <meta.id>

Usage

1. Search for specs by file glob: `.agent-alchemy/specs/**/*.spec.md`.
2. Parse the YAML front-matter and validate with the JSON Schema at `.agent-alchemy/schemas/spec-meta.schema.json`.
3. Use `meta.scope`, `meta.tags`, and `meta.specType` to determine how to apply the spec (e.g., Angular patterns, NestJS, testing).
4. When generating code, include a comment linking to `meta.id` and `meta.version`.

Best practices

- Keep `meta.id` stable and unique (kebab-case). Use semantic versioning in `meta.version`.
- Keep the `copilot.reference` path present so Copilot can find the spec directory.
- Update `reviewedAt` when a spec is validated by humans.

Automation hooks

- Editors: map `**/*.spec.md` to the schema for validation (see `.vscode/settings.json`).
- CI: add a check that validates front-matter against the schema.

Minimal example front-matter (see `example.spec.md` in same folder)
