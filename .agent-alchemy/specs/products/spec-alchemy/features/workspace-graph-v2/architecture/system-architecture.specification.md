---
meta:
  id: spec-alchemy-workspace-graph-v2-system-architecture-specification
  title: System Architecture Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: product:spec-alchemy
  tags: [workspace-graph-v2, architecture, system-design, layers]
  createdBy: Agent Alchemy Developer Agent
  createdAt: '2026-03-20'
  reviewedAt: null
title: System Architecture Specification
category: Products
feature: workspace-graph-v2
lastUpdated: '2026-03-20'
source: Agent Alchemy
version: '1.0'
aiContext: true
product: spec-alchemy
phase: architecture
applyTo: []
keywords: [system-architecture, 5-layer, mcp, ast, query-layer]
topics: [workspace-graph-v2, architecture, design]
---

# Workspace Graph V2: System Architecture Specification

**Version:** 1.0.0  
**Date:** 2026-03-20  
**Status:** Architecture  
**Category:** System Architecture  
**Complexity:** High  

---

## Executive Summary

This document defines the V2 system architecture as a **5-layer clean-slate design**.
V2 replaces V1 entirely: the old regex-based extractor, V1 builder class, and V1 node schemas
are all removed and rebuilt with the correct abstractions. The 5-layer architecture is:

1. **Storage** — Repository pattern (`IGraphRepository`) with JSON default, SQLite optional
2. **AST Extraction** — TypeScript Compiler API (`AstExtractor`)
3. **Graph Construction** — `WorkspaceGraphBuilderV2` + `CallGraphBuilder`
4. **Query Engine** — `QueryEngine` (BFS/DFS/impact/search/shortest-path)
5. **Integration** — `WorkspaceGraphMcpServer` + Nx executors

### Architecture Highlights

- **5-layer architecture** with clear separation of concerns
- **Clean-slate V2 API** — no V1 backward-compatibility shim
- **Integration points:** Claude Code, Cursor, VS Code Copilot (via MCP), Nx CLI, CI/CD
- **Performance target:** <50ms queries, <100ms MCP tool response

---

## 1. System Context Diagram

### 1.1 High-Level Context

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        WORKSPACE GRAPH V2 SYSTEM                          │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                   LAYER 5: INTEGRATION LAYER                       │   │
│  │                                                                    │   │
│  │  ┌─────────────────────────┐   ┌──────────────────────────────┐   │   │
│  │  │  WorkspaceGraphMcpServer │   │  Nx Executors                │   │   │
│  │  │  (stdio transport)       │   │  (build-graph/query/serve)   │   │   │
│  │  └─────────────────────────┘   └──────────────────────────────┘   │   │
│  └───────────────────────────┬────────────────────────────────────────┘   │
│                               │                                            │
│  ┌────────────────────────────▼───────────────────────────────────────┐   │
│  │                   LAYER 4: QUERY LAYER                             │   │
│  │                                                                    │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐    │   │
│  │  │ GraphTraversal│  │ ImpactAnalyzer│  │ QueryEngine (BM25)   │    │   │
│  │  │ (BFS/DFS)    │  │               │  │ + FTS5               │    │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘    │   │
│  └───────────────────────────┬────────────────────────────────────────┘   │
│                               │                                            │
│  ┌────────────────────────────▼───────────────────────────────────────┐   │
│  │                   LAYER 3: GRAPH LAYER                             │   │
│  │                                                                    │   │
│  │  ┌─────────────────────────────┐  ┌────────────────────────────┐  │   │
│  │  │ WorkspaceGraphBuilderV2      │  │ CallGraphBuilder            │  │   │
│  │  │ (orchestration)              │  │ (CALLS edges)               │  │   │
│  │  └─────────────────────────────┘  └────────────────────────────┘  │   │
│  └───────────────────────────┬────────────────────────────────────────┘   │
│                               │                                            │
│  ┌────────────────────────────▼───────────────────────────────────────┐   │
│  │                   LAYER 2: AST LAYER  [NEW IN V2]                  │   │
│  │                                                                    │   │
│  │  ┌──────────────────────┐  ┌──────────────┐  ┌─────────────────┐ │   │
│  │  │TypeScriptAstExtractor│  │ DecoratorAna- │  │ ImportResolver  │ │   │
│  │  │ (ts-morph)           │  │ lyzer         │  │ (tsconfig paths)│ │   │
│  │  └──────────────────────┘  └──────────────┘  └─────────────────┘ │   │
│  └───────────────────────────┬────────────────────────────────────────┘   │
│                               │                                            │
│  ┌────────────────────────────▼───────────────────────────────────────┐   │
│  │              LAYER 1: STORAGE LAYER  [V1 PRESERVED]                │   │
│  │                                                                    │   │
│  │  ┌──────────────────────┐  ┌──────────────────┐  ┌─────────────┐ │   │
│  │  │ HybridGraphStorage   │  │ SQLiteRepository  │  │ JsonStorage │ │   │
│  │  │ (JSON + SQLite)      │  │ + FTS5 (NEW)      │  │ (V1)        │ │   │
│  │  └──────────────────────┘  └──────────────────┘  └─────────────┘ │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
         ↑                                                    ↓
         │ Triggers (git hooks)                               │ Queries
    ┌────┴────────┐                               ┌───────────┴──────────┐
    │ Git Repo    │                               │ AI Agents            │
    │ (simple-git)│                               │ (Claude Code, Cursor │
    └─────────────┘                               │  VS Code Copilot)    │
         ↑                                        └──────────────────────┘
    ┌────┴────────┐
    │ Nx Workspace│
    │ (nx-graph)  │
    └─────────────┘
```

---

## 2. Layer Descriptions

### Layer 1: Storage Layer (V1 Preserved)

**Purpose:** Persist and retrieve graph data in both SQLite (queryable) and JSON (exportable) formats.

**V2 Additions:**
- FTS5 virtual table in SQLite schema for BM25 search
- Auto-sync SQL triggers for FTS5 index
- `ISearchRepository` interface (new)

**V1 Components Preserved:**
- `HybridGraphStorage`
- `SqliteGraphRepository`
- `JsonGraphRepository`
- `IGraphRepository`, `INodeRepository`, `IEdgeRepository`, `IQueryRepository`

### Layer 2: AST Layer (New in V2)

**Purpose:** Extract semantic TypeScript code structure from source files using the TypeScript Compiler API. Replaces V1's regex extraction.

**Components:**
- `TypeScriptAstExtractor` — Core ts-morph extraction (classes, methods, imports, call sites)
- `DecoratorAnalyzer` — Angular/NestJS decorator metadata extraction
- `ImportResolver` — Nx path alias resolution via tsconfig.base.json

**Data flow:** Source file (string) → `ExtractedFileData` (structured semantic data)

### Layer 3: Graph Layer (Enhanced V1 + New)

**Purpose:** Build and maintain the workspace graph using AST data (V2) and project topology (V1).

**V2 Components:**
- `WorkspaceGraphBuilderV2` — Orchestrates V2 layers using the full V2 API
- `CallGraphBuilder` — Builds CALLS edges from extracted call sites

**V1 Components Enhanced:**
- `IncrementalGraphBuilder` — Now receives `ExtractedFileData` instead of regex results
- `GitChangeDetector` — Unchanged

### Layer 4: Query Layer (New in V2)

**Purpose:** Enable multi-hop graph traversal, impact analysis, and relevance-ranked full-text search.

**Components:**
- `GraphTraversal` — BFS, DFS, shortest path, cycle detection
- `ImpactAnalyzer` — Wraps inbound BFS for blast-radius analysis
- `QueryEngine` — Enhanced with FTS5 BM25 search + traversal integration

### Layer 5: Integration Layer (New in V2)

**Purpose:** Expose the graph to external consumers — AI agents (via MCP) and developers (via Nx CLI).

**Components:**
- `WorkspaceGraphMcpServer` — 7-tool MCP server with stdio transport
- Nx Executors — `build-graph`, `query`, `serve-mcp`, `check-coverage`

---

## 3. Data Flow Diagrams

### 3.1 Graph Build Flow

```
Git Change Detection
        │
        ▼
Changed File Paths
        │
        ▼
TypeScriptAstExtractor.extractFromFile(path, content)
        │
        ├── DecoratorAnalyzer.analyze(decorators)
        └── ImportResolver.resolve(importSpecifiers)
        │
        ▼
ExtractedFileData { classes, methods, imports, callSites, ... }
        │
        ▼
WorkspaceGraphBuilderV2.buildNodes(extractedData)
        │
        ├── Create/update: class nodes, method nodes, property nodes
        ├── Create/update: import edges (resolved)
        └── Create/update: decorator metadata on class nodes
        │
        ▼
CallGraphBuilder.buildCallEdges(extractedData, nodeRegistry)
        │
        ├── Phase 1: local resolution
        └── Phase 2: import-based cross-file resolution
        │
        ▼
GraphEdge[] (CALLS edges with confidence scores)
        │
        ▼
HybridGraphStorage.persist(nodes, edges)
        │
        ├── SQLite: INSERT/UPSERT into nodes table
        ├── SQLite FTS5: auto-indexed via trigger
        └── JSON: updated graph.json export
```

### 3.2 MCP Query Flow

```
AI Agent (Claude Code / Cursor)
        │ calls MCP tool
        ▼
WorkspaceGraphMcpServer.handleToolCall(name, args)
        │
        ├── query_nodes → QueryEngine.search(args) → FTS5 BM25 query
        ├── get_dependencies → GraphTraversal.bfs(id, {outbound})
        ├── get_dependents → GraphTraversal.bfs(id, {inbound})
        ├── get_impact → ImpactAnalyzer.getImpactRadius(id)
        ├── get_spec_coverage → QueryEngine.getSpecCoverage(project)
        ├── get_guardrails → QueryEngine.getGuardrails(nodeId)
        └── get_nx_topology → QueryEngine.getNxTopology(project)
        │
        ▼
MCP Tool Response (JSON)
        │
        ▼
AI Agent processes results, provides context-aware guidance
```

---

## 4. Integration Points

### 4.1 AI Agent Integration (MCP)

| AI Agent | Protocol | Configuration File | Status |
|----------|----------|-------------------|--------|
| Claude Code | MCP stdio | `.vscode/mcp.json` | ✅ Supported |
| Cursor | MCP stdio | `.cursor/mcp.json` | ✅ Supported |
| Windsurf | MCP stdio | `.windsurf/mcp.json` | ✅ Supported |
| VS Code Copilot | MCP stdio | `.vscode/mcp.json` | ✅ Supported |

### 4.2 Nx Workspace Integration

| Integration | Method | Configuration |
|-------------|--------|---------------|
| Build graph | `nx run workspace-graph:build-graph` | `project.json` executor |
| Query | `nx run workspace-graph:query` | `project.json` executor |
| Serve MCP | `nx run workspace-graph:serve-mcp` | `project.json` executor |
| Coverage check | `nx run workspace-graph:check-coverage` | `project.json` executor |
| CI/CD trigger | `nx affected --target=build-graph` | GitHub Actions workflow |

### 4.3 Git Integration (V1 Preserved)

| Integration | Component | V2 Change |
|-------------|-----------|-----------|
| Changed file detection | `GitChangeDetector` | Unchanged from V1 |
| Pre-commit hook | Husky + `build-graph` executor | New in V2 |
| CI/CD graph refresh | GitHub Actions + `build-graph` | New in V2 |

---

## 5. Security Architecture

### 5.1 MCP Server Security

The MCP server runs as a local process with the developer's file system permissions. Security constraints:

```typescript
// PROHIBITED operations in MCP tool handlers:
// 1. Writing to files outside .workspace-graph/
// 2. Executing shell commands
// 3. Making network requests
// 4. Loading/evaluating dynamic code

// ENFORCED safeguards:
// 1. All SQL queries use parameterized statements (no string concatenation)
// 2. Tool input schemas validated by @modelcontextprotocol/sdk
// 3. File path inputs sanitized against path traversal
// 4. Query result sizes capped by 'limit' parameter (max: 100)
```

### 5.2 SQL Injection Prevention

```typescript
// ✅ CORRECT: Parameterized query
const results = db.prepare(`
  SELECT * FROM nodes_fts
  WHERE nodes_fts MATCH ?
  LIMIT ?
`).all(sanitizedQuery, limit);

// ❌ WRONG (never do this):
// const results = db.exec(`SELECT * FROM nodes_fts WHERE nodes_fts MATCH '${query}'`);
```

---

## 6. V1 → V2 Architecture Comparison

| Dimension | V1 Architecture | V2 Architecture |
|-----------|----------------|-----------------|
| **Layers** | 2 (Storage + Builder) | 5 (+ AST + Query + Integration) |
| **Code extraction** | Regex + string scanning | ts-morph TypeScript Compiler API |
| **Storage** | JSON + SQLite | JSON + SQLite + FTS5 (new) |
| **Graph traversal** | None (single-hop only) | BFS + DFS + shortest path + cycles |
| **Search** | O(n) String.includes() | O(log n) BM25 FTS5 |
| **AI integration** | None | MCP server (7 tools) |
| **CLI** | Manual `generate-graph` | Nx executor targets |
| **Call graph** | None | CALLS edges (two-phase) |
| **Node types** | 11 types | 17+ types |
| **Edge types** | 9 types | 12+ types |

---

## 7. Non-Functional Architecture

### 7.1 Scalability Profile

| Scale | Storage | Query Performance | Notes |
|-------|---------|------------------|-------|
| Small (< 500 files) | JSON | Excellent | Both backends work well |
| Medium (500-5K files) | SQLite + FTS5 | Excellent | Optimal operating range |
| Large (5K-20K files) | SQLite + FTS5 | Good | ts-morph batch processing required |
| Very Large (> 20K files) | SQLite + FTS5 | Acceptable | Performance profiling required |

### 7.2 Reliability

- **Graceful degradation:** If ts-morph fails on a file (syntax error), log warning and use V1 regex fallback
- **Idempotency:** Running build twice produces identical output
- **Atomicity:** SQLite transactions ensure partial writes don't corrupt the graph
- **Recovery:** If `.workspace-graph/graph.db` is corrupted, `build-graph` rebuilds from scratch
