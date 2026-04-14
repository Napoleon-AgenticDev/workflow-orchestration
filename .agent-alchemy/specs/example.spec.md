---
meta:
  id: example-example-specification
  title: Example Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-03-12'
  reviewedAt: null
title: Example Specification
category: Example.Spec.Md
feature: Example
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: '1.0'
aiContext: true
applyTo: []
keywords: []
topics: []
useCases: []
---

---
meta:
  id: example-spec
  title: Example Spec
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'

meta:
  reviewedAt: '2026-02-22'
  specType: specification
meta:
    - security
    - auth
  reviewedAt: '2026-02-22'
  specType: specification
copilot:
  reference: '.agent-alchemy/specs/'
  spec-id: 'agent-auth'
  notes: 'Reference for implementing auth guards and strategies in NestJS'
---

# Agent Auth Patterns

This specification documents recommended authentication patterns for agents and services.

Summary

- Use JWT for service-to-service tokens
- Provide an extensible Guard implementation for NestJS

See `.agent-alchemy/schemas/spec-meta.schema.json` for the required front-matter fields.
