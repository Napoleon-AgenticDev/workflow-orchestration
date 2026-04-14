---
meta:
  id: spec-alchemy-workspace-graph-v2-research-readme
  title: Workspace Graph V2 Research Index
  version: 0.1.0
  status: draft
  specType: index
  scope: product:spec-alchemy
  tags: [workspace-graph-v2, research, index]
  createdBy: Agent Alchemy Developer Agent
  createdAt: '2026-03-20'
  reviewedAt: null
title: Workspace Graph V2 Research Index
category: Products
feature: workspace-graph-v2
lastUpdated: '2026-03-20'
source: Agent Alchemy
version: '1.0'
aiContext: true
product: spec-alchemy
phase: research
---

# Workspace Graph V2 — Research Index

**Version:** 1.0.0  
**Date:** 2026-03-20  
**Status:** Research Complete  
**Phase:** Research  

## Overview

This directory contains the complete research corpus for the `workspace-graph-v2` feature — a ground-up V2 redesign of the `libs/shared/workspace-graph/workspace-graph` library. The research is grounded in a systematic analysis of [GitNexus](https://github.com/buildmotion/GitNexus), a production-grade polyglot knowledge-graph engine, and its comparison against our existing V1 implementation.

**Research Basis:** `libs/shared/workspace-graph/workspace-graph/research/gitnexus-analysis/`

---

## Research Documents

| Document | Description | Status |
|----------|-------------|--------|
| [`feasibility-analysis.specification.md`](./feasibility-analysis.specification.md) | Technical feasibility of all V2 improvements (AST parsing, MCP server, Query API). **Conclusion: BUILD with 95% confidence.** | ✅ Complete |
| [`gap-analysis.specification.md`](./gap-analysis.specification.md) | Detailed inventory of gaps between V1 and V2 target, derived from GitNexus comparison. Covers AST parsing, call graph, search, and MCP deficiencies. | ✅ Complete |
| [`leverage-opportunities.specification.md`](./leverage-opportunities.specification.md) | Prioritized list of GitNexus patterns to adopt, with P1/P2/P3/P4 priorities and effort/impact scoring. | ✅ Complete |
| [`recommendations.specification.md`](./recommendations.specification.md) | Final actionable recommendations synthesizing all research findings. Technology choices, rollout strategy, and risk mitigations. | ✅ Complete |

---

## Key Research Findings

### 1. Critical Gaps (P1 — Must Fix)

| Gap | V1 Limitation | V2 Target |
|-----|---------------|-----------|
| **AST Parsing** | Regex on raw text, no line numbers | `ts-morph` TypeScript Compiler API |
| **MCP Server** | No AI agent integration | Full MCP server with 5+ tools |
| **Graph Traversal** | No BFS/DFS algorithms | Impact analysis, dependency chains |

### 2. High-Value Improvements (P2 — Should Add)

| Improvement | Current State | V2 Target |
|-------------|--------------|-----------|
| **Query API** | Simple `String.includes()` | BM25 full-text search + Query DSL |
| **Call Graph** | No CALLS edges | `CALLS` edges from ts-morph |
| **Nx Executor Targets** | Manual CLI only | `nx run workspace-graph-v2:query` |

### 3. Unique Strengths to Preserve (V1 → V2)

- ✅ **Agent Alchemy Specification nodes** (`specifies` edges)
- ✅ **Engineering Guardrails tracking** (`enforces`/`validates` edges)
- ✅ **Nx Project topology** (project types, tags, targets, implicit dependencies)
- ✅ **Repository pattern abstraction** (swappable storage backends)
- ✅ **Graph validation** layer

---

## Research → Plan Traceability

| Research Finding | Plan Document | Feature |
|-----------------|---------------|---------|
| AST extraction via ts-morph | `plan/architecture-decisions.specification.md` ADR-001 | Phase 1 |
| MCP stdio transport | `plan/architecture-decisions.specification.md` ADR-002 | Phase 3 |
| JSON + SQLite hybrid storage | `plan/architecture-decisions.specification.md` ADR-003 | Inherited V1 |
| BM25 full-text search | `plan/requirements.specification.md` FR-004 | Phase 2 |
| Graph traversal (BFS/DFS) | `plan/requirements.specification.md` FR-003 | Phase 2 |
| 6-week timeline | `plan/timeline-milestones.specification.md` | All phases |

---

## Source Research Files

The raw research that underpins all documents in this directory is located at:

```
libs/shared/workspace-graph/workspace-graph/research/gitnexus-analysis/
├── README.md                  — Overview and navigation
├── executive-summary.md       — High-level comparison findings
├── gap-analysis.md            — Detailed V1 vs GitNexus gap inventory
├── leverage-opportunities.md  — Prioritized adoption recommendations
└── technical-deep-dive.md     — Implementation details and code samples
```

---

## Navigation

- **[← Back to workspace-graph-v2 root](../)**
- **[→ Plan Documents](../plan/README.md)**
- **[→ Architecture Documents](../architecture/README.md)**
- **[→ Development Documents](../development/README.md)**
