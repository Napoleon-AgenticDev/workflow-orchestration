---
meta:
  id: specification-metadata-standard-specification
  title: Specification Metadata Standard Specification
  version: 1.0.0
  status: stable
  specType: specification
  scope: standards
  tags:
    - metadata
    - frontmatter
    - spec-index
    - schema
  createdBy: buildmotion-ai
  createdAt: '2026-02-23'
  reviewedAt: '2026-03-12'
title: Specification Metadata Standard
category: Standards
feature: Specification Quality
lastUpdated: '2026-03-12'
source: Agent Alchemy Standards
version: '1.0'
aiContext: true
applyTo:
  - '**/*.specification.md'
  - '**/*.spec.md'
  - .agent-alchemy/SKILLS/**/SKILL.md
  - .agent-alchemy/SKILLS/**/*.SKILL.md
keywords:
  - metadata
  - frontmatter
  - schema
  - consistency
  - spec-index
topics:
  - specification-authoring
  - schema-validation
  - context-indexing
useCases:
  - Build a consistent spec-index from all specifications and SKILL specs
  - Validate metadata quality in CI
  - Query specifications by type/category/topic/intent
---

# Specification Metadata Standard

## Purpose

Define one canonical frontmatter contract for:
- product/engineering specifications, and
- SKILL specifications.

This metadata is the primary substrate for `spec-index` generation and queryability.

## Canonical Contract

All specification files MUST include:

1. `meta` object (identity + governance)
2. Query context fields (`keywords`, `topics`, `useCases`)
3. Type-specific required fields enforced by JSON Schema

Schema source of truth:
- `.agent-alchemy/schemas/spec-meta.schema.json`

## `meta` Required Fields

```yaml
meta:
  id: kebab-case-id
  title: Human readable title
  version: 1.0.0
  status: draft|stable|deprecated
  specType: specification|skill
  scope: standards|frameworks|product:<name>|skill|...
  tags: [array, of, tags]
  createdBy: owner
  createdAt: YYYY-MM-DD
  reviewedAt: YYYY-MM-DD|null
```

## Type: `specification`

Required top-level fields:
- `title`
- `category`
- `feature`
- `lastUpdated`
- `source`
- `version`
- `aiContext: true`
- `applyTo`
- `keywords`
- `topics`
- `useCases`

Optional but recommended:
- `product`
- `phase`
- `references`
- `depends-on`

## Type: `skill`

Required top-level fields:
- `name`
- `description`
- `category: SKILLS`
- `aiContext: true`
- `keywords`
- `topics`
- `useCases`

## Why This Matters

1. **Deterministic indexing**: `spec-index` can parse every spec type without heuristics.
2. **Reliable retrieval**: agents can query by intent (`keywords/useCases`) and domain (`category/feature`).
3. **Quality governance**: CI can fail fast when frontmatter drifts.
4. **Cross-type consistency**: product specs and SKILL specs participate in one query model.

## Validation

Use:

```bash
yarn specs:validate
```

Validation enforces:
- frontmatter presence + YAML validity
- schema compliance by `meta.specType`
- duplicate `meta.id` detection
