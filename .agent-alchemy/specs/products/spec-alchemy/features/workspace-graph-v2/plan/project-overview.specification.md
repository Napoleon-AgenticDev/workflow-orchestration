---
meta:
  id: spec-alchemy-workspace-graph-v2-project-overview-specification
  title: Project Overview Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: product:spec-alchemy
  tags: [workspace-graph-v2, plan, project-overview]
  createdBy: Agent Alchemy Developer Agent
  createdAt: '2026-03-20'
  reviewedAt: null
title: Project Overview Specification
category: Products
feature: workspace-graph-v2
lastUpdated: '2026-03-20'
source: Agent Alchemy
version: '1.0'
aiContext: true
product: spec-alchemy
phase: plan
applyTo: []
keywords: [project-overview, vision, goals, success-criteria]
topics: [workspace-graph-v2, planning, strategic]
---

# Workspace Graph V2: Project Overview Specification

---
version: 2.0.0
date: 2026-03-20
status: Planning
category: Project Overview
complexity: High
phase: Planning
owner: Agent Alchemy Team
research_basis:
  - ../research/feasibility-analysis.specification.md
  - ../research/gap-analysis.specification.md
  - ../research/leverage-opportunities.specification.md
  - ../research/recommendations.specification.md
---

## Executive Summary

The **Workspace Graph V2** feature transforms the existing `libs/shared/workspace-graph/workspace-graph` library from a regex-based, offline graph generator into a **TypeScript AST-powered, real-time, AI-queryable knowledge layer** for the Agent Alchemy monorepo. This V2 is an evolutionary enhancement of V1 — not a rewrite — adding three new capability layers while preserving all existing functionality.

### Vision Statement

**"Enable AI agents and developers to query workspace structure with genuine semantic depth (<50ms), powered by TypeScript Compiler API extraction, graph traversal algorithms, and a native MCP server — while preserving Agent Alchemy's unique specification correlation and Nx topology insights."**

### V1 → V2 Transformation

| Dimension | V1 (Current) | V2 (Target) | Improvement |
|-----------|-------------|-------------|-------------|
| **Code analysis** | Regex on raw text | TypeScript Compiler API (ts-morph) | Semantic accuracy: 20% → 95%+ |
| **Node granularity** | File + class names | Methods, properties, decorators, line numbers | 11 types → 17+ types |
| **Search** | O(n) `String.includes()` | BM25-ranked SQLite FTS5 | 10-100x faster, relevance-ranked |
| **Graph traversal** | Single-hop only | BFS/DFS, impact analysis, cycle detection | Multi-hop reasoning enabled |
| **Call graph** | None | CALLS edges (two-phase resolution) | Impact analysis enabled |
| **AI integration** | None (JSON file only) | MCP server with 7 tools | Real-time AI agent access |
| **Nx integration** | CLI only | Nx executor targets | Native Nx workflow |

---

## 1. Strategic Context

### 1.1 Agent Alchemy Mission Alignment

**Mission:** "Empower developers with AI-enhanced tools that understand codebase structure and enforce architectural principles."

**V2 Supports:**
- ✅ **Codebase Understanding:** Semantic node extraction enables AI to answer "what methods does X expose?"
- ✅ **Architectural Enforcement:** Guardrail tracking + spec coverage with precise file/line references
- ✅ **Developer Productivity:** Real-time graph queries through MCP eliminate manual context curation
- ✅ **AI Context Quality:** TypeScript-accurate node data for superior AI completions and guidance

### 1.2 Problem Statement

The current V1 workspace graph cannot serve as an effective AI agent knowledge layer because:

1. **Semantic shallowness:** Regex extraction misses ~80% of code semantics (no methods, properties, line numbers, type info)
2. **No real-time access:** AI agents cannot query the graph during active coding — they must consume stale JSON snapshots
3. **Weak search:** Linear O(n) scan with no relevance ranking
4. **No impact analysis:** No call graph means no answer to "what breaks if I change X?"
5. **No dependency chain exploration:** Single-hop queries only — no transitive dependency traversal

### 1.3 Competitive Context

| Tool | AST Depth | MCP Server | Nx Awareness | Spec Correlation |
|------|-----------|------------|--------------|-----------------|
| **GitNexus** | ✅ tree-sitter (14 langs) | ✅ 7 tools | ❌ None | ❌ None |
| **Nx Project Graph** | ⚠️ Project level only | ❌ None | ✅ Native | ❌ None |
| **Madge** | ⚠️ Import level only | ❌ None | ❌ None | ❌ None |
| **V1 workspace-graph** | ❌ Regex only | ❌ None | ✅ Full | ✅ Full |
| **V2 workspace-graph** | ✅ ts-morph (TS only) | ✅ 7 tools | ✅ Full | ✅ Full |

**V2 occupies a unique niche:** The only tool that combines deep TypeScript AST analysis with Nx project awareness, Agent Alchemy specification correlation, and real-time AI agent access.

---

## 2. Goals and Success Criteria

### 2.1 Primary Goals

#### Goal 1: Semantic Code Analysis (Phase 1)
Enable extraction of complete TypeScript code structure with method-level granularity, line numbers, decorator metadata, and type annotations.

**Success criteria:**
- 95%+ of classes, methods, properties, and decorators correctly extracted
- All extracted nodes have file path and line number
- Angular `@Component`, NestJS `@Controller`, etc. have full decorator metadata

#### Goal 2: Graph Intelligence (Phase 2)
Enable multi-hop graph traversal, blast-radius impact analysis, and relevance-ranked search.

**Success criteria:**
- BFS/DFS traversal correct for 5-hop dependency chains
- Query performance <50ms for 10,000-node graphs
- Call graph accuracy >80% resolved for same-project calls

#### Goal 3: AI Agent Integration (Phase 3)
Enable real-time workspace graph queries from Claude Code, Cursor, Windsurf, and VS Code Copilot.

**Success criteria:**
- 7 MCP tools working and tested
- MCP server starts in <2 seconds via `nx run workspace-graph:serve-mcp`
- Tool response time <100ms round-trip

### 2.2 Non-Goals (Explicitly Excluded from V2)

- ❌ Community detection (Leiden algorithm) — V3
- ❌ Vector embeddings / semantic search — V3
- ❌ Execution flow tracing — V3
- ❌ Multi-language support (only TypeScript/TSX in scope)
- ❌ Web UI / graph visualization
- ❌ Multi-workspace / monorepo federation

---

## 3. Stakeholders

| Stakeholder | Role | Interest |
|-------------|------|----------|
| Agent Alchemy Developer Team | Implementor | Clear requirements, phased delivery |
| AI Agents (Claude, Copilot) | Primary Consumer | Fast, accurate, structured query results |
| Developers using Agent Alchemy | End User | Better AI suggestions based on real codebase context |
| Nx Workspace Maintainer | Integrator | Backward compatibility, no Nx version regressions |

---

## 4. Constraints

### 4.1 Technical Constraints

| Constraint | Impact |
|------------|--------|
| TypeScript-only workspace | Only TypeScript/TSX source files are in scope; other languages deferred to V3 |
| Node.js 18+ runtime | Compatible with all selected dependencies |
| V2 is a clean-slate refactor | No obligation to preserve V1 API shapes, class names, or node ID formats |
| Nx 18+ build system | Executor API must target Nx 18 `@nx/devkit` |
| SQLite via better-sqlite3 | FTS5 must be available (included by default since SQLite 3.9+) |

### 4.2 Business Constraints

| Constraint | Impact |
|------------|--------|
| 6-week timeline | Phased delivery; Phase 1 + 2 = MVP |
| No external infrastructure | MCP server must be local (stdio) — no cloud services |
| MIT-compatible licenses | No PolyForm or GPL dependencies |

---

## 5. Assumptions and Dependencies

### 5.1 Assumptions

1. TypeScript Compiler API (`typescript` package) is already a workspace dependency — no new installs
2. SQLite version includes FTS5 (standard since 3.9.0, released 2015)
3. `@modelcontextprotocol/sdk` ^0.6.0 is available in npm registry
4. Phase 1 (AST) will be complete before Phase 3 (MCP) begins
5. V2 test suite (≥95% coverage) is the authoritative quality gate — no V1 compatibility tests needed

### 5.2 External Dependencies

| Dependency | Version | Purpose | Risk |
|------------|---------|---------|------|
| `typescript` | (workspace version) | TypeScript Compiler API for AST extraction | Zero — already installed |
| `@modelcontextprotocol/sdk` | ^0.6.0 | MCP server implementation | Low (mature SDK) |
| `minisearch` | ^7.0.0 | In-memory search fallback | Low |

### 5.3 Internal Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `better-sqlite3` | ^9.3.0 | SQLite storage + FTS5 |
| `simple-git` | ^3.22.0 | Git change detection |
| `@nx/devkit` | ^18.0.0 | Nx executor API |

---

## 6. Feature List Summary

| Feature | Priority | Phase | Description |
|---------|----------|-------|-------------|
| TypeScript AST Extractor | P1 | Phase 1 | ts-morph based extraction replacing regex |
| Decorator Analyzer | P1 | Phase 1 | Angular/NestJS decorator metadata |
| Import Resolver | P1 | Phase 1 | tsconfig.base.json alias resolution |
| Graph Traversal (BFS/DFS) | P1 | Phase 2 | Multi-hop dependency traversal |
| Impact Analyzer | P1 | Phase 2 | Blast-radius analysis for a node |
| BM25 Full-Text Search | P2 | Phase 2 | SQLite FTS5 with relevance ranking |
| Call Graph Builder | P2 | Phase 2 | CALLS edge extraction + resolution |
| MCP Server | P1 | Phase 3 | 7-tool MCP server via stdio transport |
| Nx Executors | P2 | Phase 3 | `build-graph`, `query`, `serve-mcp` |
| V2 Graph Builder | P1 | Phase 4 | Orchestration wrapper using all V2 layers |

---

## 7. Project Timeline Overview

```
Weeks 1-2:  Phase 1 — AST Foundation
            [TypeScriptAstExtractor] [DecoratorAnalyzer] [ImportResolver]

Weeks 3-4:  Phase 2 — Query Intelligence
            [GraphTraversal] [ImpactAnalyzer] [BM25Search] [CallGraphBuilder]

Weeks 5-6:  Phase 3 — MCP Integration
            [WorkspaceGraphMcpServer] [NxExecutors] [McpToolHandlers]

Week 7+:    Phase 4 — Hardening
            [Performance] [Migration Guide] [E2E Tests] [Documentation]
```

**See:** [`timeline-milestones.specification.md`](./timeline-milestones.specification.md) for detailed phase breakdowns.

---

## 8. Success Metrics Summary

| KPI | Target | Baseline | Improvement |
|-----|--------|----------|-------------|
| **AST extraction accuracy** | >95% | ~20% (regex) | 4.75x |
| **Node granularity** | 17+ types | 11 types | +6 new types |
| **Search performance** (10K nodes) | <10ms | ~150ms | 15x faster |
| **BFS traversal depth** | 5-hop correct | 1-hop only | 5x deeper |
| **MCP tool latency** | <100ms | N/A | New capability |
| **Call graph resolution** | >80% | 0% | New capability |
| **Test coverage** | >80% | varies | Enforced gate |

**See:** [`success-metrics.specification.md`](./success-metrics.specification.md) for measurement methodology.

---

## Conclusion

Workspace Graph V2 is a focused, achievable enhancement to a strong V1 foundation. The six-week phased plan delivers each capability as a independently releasable increment. The result is a genuine competitive advantage: the only workspace graph tool that combines TypeScript semantic depth with Agent Alchemy specification awareness and native MCP integration.

**Next:** See [`requirements.specification.md`](./requirements.specification.md) for detailed functional and non-functional requirements.
