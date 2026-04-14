---
meta:
  id: specification-validation-skill
  title: Specification Validation SKILL
  version: 0.1.0
  status: draft
  specType: skill
  scope: skill
  tags:
    - validation
    - specifications
    - metadata
    - frontmatter
    - specification-authoring
    - ci
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
name: spec-validation
description: ''
category: SKILLS
aiContext: true
keywords:
  - validation
  - specifications
  - metadata
  - frontmatter
topics:
  - specification-authoring
  - validation
  - ci
useCases: []
---

# Specification Validation SKILL

## Purpose

This SKILL provides an automated way to validate specification frontmatter and metadata across the repository. It ships with its own schema validator (`scripts/validate-frontmatter-schema.js`) that runs inside the SKILL directory and enforces the contract defined in `.agent-alchemy/schemas/spec-meta.schema.json`, then exposes a simple runner that returns structured JSON output and an appropriate exit code so it can be used interactively or from CI.

## Usage

- Run locally from repository root:

  bash .agent-alchemy/SKILLS/spec-validation/run.sh

- To apply safe autofix suggestions (adds placeholders for missing required fields):

  bash .agent-alchemy/SKILLS/spec-validation/run.sh --fix

## Validation Flow

1. `run.sh` (this SKILL’s runner) optionally executes `autofix.sh` when `--fix` is supplied.
2. The Node-based validator at `scripts/validate-frontmatter-schema.js` scans `.agent-alchemy/**/*.specification.md`, parses the YAML frontmatter, and validates the `meta` block with AJV against `.agent-alchemy/schemas/spec-meta.schema.json`.
3. All console output from the validator is wrapped into a JSON payload so that CI pipelines and other SKILLs can consume the exit code and raw logs reliably.

## Intents

- validate-specs: Run metadata validation for all `.specification.md` files and report results.

## Outputs

- JSON object with keys:
  - `exitCode` (0 on success, non-zero on failures)
  - `output` (raw console output from the validator)

## Notes

- The SKILL intentionally delegates validation rules to the existing script in `.agent-alchemy/specs/scripts/validate-metadata.sh` to keep behaviour consistent with the standards document.
- Autofix only applies conservative, review-required placeholders (e.g., adds `title: 'TODO: ...'`) and should be reviewed by a human.

## Security

- The runner executes repository scripts; review changes to `.agent-alchemy/specs/scripts/validate-metadata.sh` before accepting PRs that modify it.
