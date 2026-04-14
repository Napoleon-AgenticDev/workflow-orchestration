---
meta:
  id: spec-alchemy-workspace-graph-v2-plan-readme
  title: Workspace Graph V2 Plan Index
  version: 0.1.0
  status: draft
  specType: index
  scope: product:spec-alchemy
  tags: [workspace-graph-v2, plan, index]
  createdBy: Agent Alchemy Developer Agent
  createdAt: '2026-03-20'
  reviewedAt: null
title: Workspace Graph V2 Plan Index
category: Products
feature: workspace-graph-v2
lastUpdated: '2026-03-20'
source: Agent Alchemy
version: '1.0'
aiContext: true
product: spec-alchemy
phase: plan
---

# Workspace Graph V2 — Plan Index

**Version:** 1.0.0  
**Date:** 2026-03-20  
**Status:** Planning  
**Phase:** Plan  

## Overview

This directory contains the complete planning corpus for the `workspace-graph-v2` feature. All documents in this directory are grounded in the research phase findings and provide actionable blueprints for implementation.

---

## Plan Documents

| Document | Description | Status |
|----------|-------------|--------|
| [`project-overview.specification.md`](./project-overview.specification.md) | V2 vision, strategic goals, success criteria summary | ✅ Complete |
| [`requirements.specification.md`](./requirements.specification.md) | Functional and non-functional requirements (FR-001 to FR-015, NFR-001 to NFR-010) | ✅ Complete |
| [`feature-breakdown.specification.md`](./feature-breakdown.specification.md) | Feature list with priorities, stories, and acceptance criteria | ✅ Complete |
| [`architecture-decisions.specification.md`](./architecture-decisions.specification.md) | Architecture Decision Records (ADR-001 to ADR-007) | ✅ Complete |
| [`timeline-milestones.specification.md`](./timeline-milestones.specification.md) | 6-week phased implementation timeline with milestones and gate criteria | ✅ Complete |
| [`success-metrics.specification.md`](./success-metrics.specification.md) | KPIs, performance benchmarks, and measurement methodology | ✅ Complete |

---

## Key Planning Decisions

| Decision | Choice | ADR Reference |
|----------|--------|---------------|
| AST technology | TypeScript Compiler API (not ts-morph, not tree-sitter) | ADR-001 |
| MCP transport | stdio (not HTTP) | ADR-002 |
| Search backend | SQLite FTS5 + BM25 | ADR-003 |
| Call graph resolution | Two-phase (local + import-based) | ADR-004 |
| V2 refactor approach | Clean-slate — no V1 backward compatibility | ADR-005 |
| Rollout strategy | 4-phase, 6-week | ADR-006 |
| Storage | JSON-first, SQLite optional (V2 schema) | ADR-007 |

---

## Timeline Summary

| Phase | Duration | Key Deliverable |
|-------|----------|-----------------|
| Phase 1: AST Foundation | Weeks 1-2 | `AstExtractor` (TypeScript Compiler API) |
| Phase 2: Query Intelligence | Weeks 3-4 | BFS/DFS + search scoring + Call Graph |
| Phase 3: MCP Integration | Weeks 5-6 | MCP server + Nx executors |
| Phase 4: Hardening | Week 7+ | Performance, docs, ≥95% coverage gate |

---

## Research → Plan Traceability

| Research Finding | Plan Document | Requirement |
|-----------------|---------------|-------------|
| G-001: AST gap | `requirements.specification.md` | FR-001 |
| G-002: No call graph | `requirements.specification.md` | FR-002 |
| G-003: No MCP server | `requirements.specification.md` | FR-005 |
| G-004: Weak search | `requirements.specification.md` | FR-004 |
| G-005: No traversal | `requirements.specification.md` | FR-003 |
| P1 ts-morph | `architecture-decisions.specification.md` | ADR-001 |
| P1 MCP stdio | `architecture-decisions.specification.md` | ADR-002 |
| P2 BM25 | `architecture-decisions.specification.md` | ADR-003 |

---

## Navigation

- **[← Research Documents](../research/README.md)**
- **[→ Architecture Documents](../architecture/README.md)**
- **[→ Development Documents](../development/README.md)**
