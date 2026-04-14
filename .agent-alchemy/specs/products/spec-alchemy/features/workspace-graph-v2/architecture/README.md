---
meta:
  id: spec-alchemy-workspace-graph-v2-architecture-readme
  title: Workspace Graph V2 Architecture Index
  version: 0.1.0
  status: draft
  specType: index
  scope: product:spec-alchemy
  tags: [workspace-graph-v2, architecture, index]
  createdBy: Agent Alchemy Developer Agent
  createdAt: '2026-03-20'
  reviewedAt: null
title: Workspace Graph V2 Architecture Index
category: Products
feature: workspace-graph-v2
lastUpdated: '2026-03-20'
source: Agent Alchemy
version: '1.0'
aiContext: true
product: spec-alchemy
phase: architecture
---

# Workspace Graph V2 — Architecture Index

**Version:** 1.0.0  
**Date:** 2026-03-20  
**Status:** Architecture  
**Phase:** Architecture  

## Overview

This directory contains the complete architecture corpus for workspace-graph-v2. The architecture is defined as a 5-layer system built on top of the existing V1 2-layer foundation.

---

## Architecture Documents

| Document | Description | Status |
|----------|-------------|--------|
| [`system-architecture.specification.md`](./system-architecture.specification.md) | 5-layer V2 system overview, context diagram, integration points | ✅ Complete |
| [`component-design.specification.md`](./component-design.specification.md) | Component descriptions, interfaces, responsibilities for all 8 V2 components | ✅ Complete |
| [`api-contracts.specification.md`](./api-contracts.specification.md) | TypeScript interfaces for Query API, MCP tools, AST extractor output | ✅ Complete |
| [`data-models.specification.md`](./data-models.specification.md) | Updated graph schema with new V2 node/edge types, SQLite schema | ✅ Complete |
| [`performance-design.specification.md`](./performance-design.specification.md) | Performance targets, strategies, and benchmark methodology | ✅ Complete |

---

## Architecture Summary

### 5-Layer Architecture

```
Layer 5: Integration Layer    [MCP Server, Nx Executors]
Layer 4: Query Layer          [GraphTraversal, QueryEngine, ImpactAnalyzer]
Layer 3: Graph Layer          [WorkspaceGraphBuilderV2, CallGraphBuilder]
Layer 2: AST Layer            [TypeScriptAstExtractor, DecoratorAnalyzer, ImportResolver]
Layer 1: Storage Layer        [JSON-first (IGraphRepository), optional SQLite + FTS5]
```

### Key Architecture Decisions

| ADR | Decision | Document |
|-----|----------|---------|
| ADR-001 | TypeScript Compiler API for AST (not ts-morph or tree-sitter) | `system-architecture.specification.md` §2 |
| ADR-002 | stdio MCP transport | `component-design.specification.md` §6 |
| ADR-003 | SQLite FTS5 + BM25 | `data-models.specification.md` §3 |
| ADR-004 | Two-phase call graph resolution | `component-design.specification.md` §5 |
| ADR-005 | Clean-slate V2 refactor — no V1 backward compatibility | `../plan/architecture-decisions.specification.md` §ADR-005 |

---

## Navigation

- **[← Plan Documents](../plan/README.md)**
- **[→ Development Documents](../development/README.md)**
- **[← Research Documents](../research/README.md)**
