---
meta:
  id: spec-alchemy-workspace-graph-v2-gap-analysis-specification
  title: Gap Analysis Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: product:spec-alchemy
  tags: [workspace-graph-v2, research, gap-analysis]
  createdBy: Agent Alchemy Developer Agent
  createdAt: '2026-03-20'
  reviewedAt: null
title: Gap Analysis Specification
category: Products
feature: workspace-graph-v2
lastUpdated: '2026-03-20'
source: Agent Alchemy
version: '1.0'
aiContext: true
product: spec-alchemy
phase: research
applyTo: []
keywords: [gap-analysis, ast-parsing, mcp-server, call-graph, search, bfs-dfs]
topics: [workspace-graph-v2, v1-limitations, gitnexus-comparison]
---

# Workspace Graph V2: Gap Analysis Specification

**Version:** 1.0.0  
**Date:** 2026-03-20  
**Status:** Research Complete  
**Category:** Gap Analysis  
**Complexity:** High  

---

## Executive Summary

This document provides a systematic inventory of deficiencies in the V1 `workspace-graph` implementation, derived from the GitNexus comparative analysis at `libs/shared/workspace-graph/workspace-graph/research/gitnexus-analysis/gap-analysis.md`. The analysis identifies **6 critical gaps** that collectively prevent the workspace graph from serving as an effective knowledge layer for AI agents and developers.

### Gap Summary

| Gap ID | Category | Severity | Impact on AI Agents | V2 Fix |
|--------|----------|----------|--------------------|---------| 
| G-001 | AST Parsing | 🔴 Critical | ~80% of semantic relationships missing | ts-morph extractor |
| G-002 | Call Graph (CALLS edges) | 🔴 Critical | No impact analysis possible | CallGraphBuilder |
| G-003 | MCP Server | 🔴 Critical | No real-time AI agent access | McpServer (stdio) |
| G-004 | Search Quality | 🟠 High | Poor query relevance, O(n) scan | BM25 / SQLite FTS5 |
| G-005 | Graph Traversal | 🟠 High | No dependency chain exploration | BFS/DFS algorithms |
| G-006 | Import Resolution | 🟡 Medium | ~40% of imports unresolved | ts-morph resolution |

---

## 1. Methodology

### 1.1 Analysis Approach

This gap analysis compares V1 capabilities against GitNexus's production implementation across four dimensions:

1. **Code analysis depth** — What semantic information is extracted from source files
2. **Graph completeness** — What node and edge types are available
3. **Query capabilities** — How efficiently the graph can be searched and traversed
4. **AI integration surface** — How AI agents access the graph in real-time

### 1.2 Source Documents

| Source | Description |
|--------|-------------|
| `libs/shared/workspace-graph/workspace-graph/research/gitnexus-analysis/gap-analysis.md` | Primary gap inventory |
| `libs/shared/workspace-graph/workspace-graph/research/gitnexus-analysis/executive-summary.md` | High-level comparison |
| `libs/shared/workspace-graph/workspace-graph/research/gitnexus-analysis/leverage-opportunities.md` | Prioritized adoption list |
| `libs/shared/workspace-graph/workspace-graph/src/lib/` | V1 source code |

---

## 2. Gap G-001: AST-Level Code Parsing

### 2.1 Description

**Severity: 🔴 CRITICAL**  
**Impact: ~80% of semantic relationships missing from the graph**

V1 uses regular expressions on raw TypeScript text to extract code structure. This approach fundamentally cannot capture the semantics of a TypeScript program.

### 2.2 Current V1 Behavior

```typescript
// V1 extraction in workspace-graph-builder.ts (simplified)
const classRegex = /export\s+(?:abstract\s+)?class\s+(\w+)/g;
const interfaceRegex = /export\s+interface\s+(\w+)/g;
const decoratorRegex = /@(\w+)\s*\(/g;

// Problems with this approach:
// 1. Misses method-level granularity entirely
// 2. No line numbers for most extractions
// 3. Cannot detect class inheritance across multiple lines
// 4. Decorator extraction is fragile (false positives in comments)
// 5. Template literals and multi-line strings cause false matches
// 6. No type information or semantic resolution
```

### 2.3 What Is Missing

| Missing Capability | AI Agent Impact |
|-------------------|-----------------|
| Method-level nodes | Cannot answer "what public methods does class X expose?" |
| Line numbers on all nodes | Cannot navigate to exact symbol definition |
| Inheritance chain analysis | Cannot understand class hierarchy for refactoring |
| Decorator semantic meaning | Cannot identify Angular components, NestJS controllers |
| Type annotation extraction | Cannot reason about parameter/return types |
| Property declarations | Cannot model class state or dependencies |
| Generic type parameters | Cannot understand template patterns |

### 2.4 Comparison: V1 vs V2 Node Output

**V1 output for an Angular component:**
```json
{
  "id": "file:apps/agency/src/app/dashboard.component.ts",
  "type": "file",
  "properties": {
    "path": "apps/agency/src/app/dashboard.component.ts",
    "exports": ["DashboardComponent"]
  }
}
```

**V2 target output (with ts-morph):**
```json
{
  "id": "class:DashboardComponent:apps/agency/src/app/dashboard.component.ts",
  "type": "class",
  "properties": {
    "name": "DashboardComponent",
    "filePath": "apps/agency/src/app/dashboard.component.ts",
    "startLine": 12,
    "endLine": 87,
    "decorators": ["Component"],
    "decoratorMetadata": {
      "Component": {
        "selector": "app-dashboard",
        "changeDetection": "ChangeDetectionStrategy.OnPush"
      }
    },
    "extendsClass": null,
    "implementsInterfaces": ["OnInit", "OnDestroy"],
    "methods": [
      { "name": "ngOnInit", "isPublic": true, "isAsync": false, "startLine": 34 },
      { "name": "ngOnDestroy", "isPublic": true, "isAsync": false, "startLine": 41 },
      { "name": "loadData", "isPublic": false, "isAsync": true, "startLine": 47 }
    ],
    "properties": [
      { "name": "destroy$", "type": "Subject<void>", "isReadonly": true },
      { "name": "isLoading", "type": "boolean", "isReadonly": false }
    ]
  }
}
```

### 2.5 V1 Node Type Coverage vs Target

| Node Type | V1 Coverage | V2 Target | Gap |
|-----------|-------------|-----------|-----|
| file | ✅ Full | ✅ Full | None |
| project | ✅ Full | ✅ Full | None |
| class | ⚠️ Name only | ✅ Full (methods, props, decorators) | Large |
| interface | ⚠️ Name only | ✅ Full (methods, extends) | Large |
| function | ⚠️ Name only | ✅ Full (params, return type, line) | Large |
| **method** | ❌ Missing | ✅ New in V2 | New |
| **property** | ❌ Missing | ✅ New in V2 | New |
| enum | ⚠️ Name only | ✅ Full (members) | Medium |
| specification | ✅ Full | ✅ Full | None |
| guardrail | ✅ Full | ✅ Full | None |

---

## 3. Gap G-002: Function Call Graph (CALLS Edges)

### 3.1 Description

**Severity: 🔴 CRITICAL**  
**Impact: No basis for impact analysis, dead code detection, or execution flow tracing**

V1 has no concept of function/method call relationships. This is the most significant structural gap in the graph model.

### 3.2 GitNexus Comparison

GitNexus's `call-processor.ts` (38KB) implements a sophisticated multi-tier call resolution strategy:

1. **Exact match** — Callee name matches a known node ID exactly
2. **Suffix match** — Callee name is a suffix of a known node path
3. **Fuzzy global match** — Levenshtein distance against all node names
4. **Unresolved** — Edge created with `confidence: 0`

V1 has **zero** call detection logic.

### 3.3 Missing Edge Types

| Edge Type | Direction | Meaning | V2 Priority |
|-----------|-----------|---------|-------------|
| `CALLS` | method → method | Method A calls method B | P2 |
| `OVERRIDES` | method → method | Subclass overrides parent method | P3 |
| `CONSTRUCTS` | method → class | Factory method creates instance | P3 |

### 3.4 Impact on Use Cases

```
Without CALLS edges, the following questions are UNANSWERABLE:

Q: "If I change the signature of UserService.getUser(), what methods will break?"
A: Cannot answer — no call graph exists.

Q: "What is the execution path from login button click to JWT token storage?"
A: Cannot answer — no execution flow data.

Q: "Which functions in this codebase are never called (dead code)?"
A: Cannot answer — no call graph.

Q: "What is the blast radius of deleting the AuthService class?"
A: Cannot answer — no inbound call edges.
```

### 3.5 V2 Edge Coverage Gap

| Edge Type | V1 Coverage | V2 Target |
|-----------|-------------|-----------|
| `contains` (project→file) | ✅ | ✅ |
| `imports` (file→file) | ✅ | ✅ |
| `specifies` (spec→code) | ✅ | ✅ |
| `enforces` (guardrail→code) | ✅ | ✅ |
| `extends` (class→class) | ⚠️ Partial | ✅ |
| `implements` (class→interface) | ⚠️ Partial | ✅ |
| **`CALLS`** (method→method) | ❌ Missing | ✅ P2 |
| **`OVERRIDES`** | ❌ Missing | ✅ P3 |

---

## 4. Gap G-003: MCP Server

### 4.1 Description

**Severity: 🔴 CRITICAL**  
**Impact: No AI agent can query the workspace graph in real-time**

V1 has no MCP server. The workspace graph is consumed only by scripts that read the JSON/SQLite file on disk. There is no way for Claude Code, Cursor, Windsurf, or VS Code Copilot to query the graph during an active coding session.

### 4.2 GitNexus Comparison

GitNexus provides a full MCP server with:
- **7 tools:** `query`, `context`, `impact`, `detect_changes`, `rename`, `cypher`, `search`
- **7 resource templates:** Schema, node types, edge types, statistics, etc.
- **2 prompts:** Code review, architecture analysis

V1 has **zero** MCP integration.

### 4.3 AI Agent Workflow Without MCP

**Current V1 workflow (manual, slow):**
```
1. Developer manually runs: nx run workspace-graph:generate-graph
2. Developer opens graph.json (~2MB)
3. Developer manually pastes relevant sections into AI chat
4. AI provides guidance based on stale, manually curated context
```

**V2 target workflow (automatic, real-time):**
```
1. Developer asks AI: "What depends on UserService?"
2. AI agent calls MCP tool: get_dependents({ nodeId: "class:UserService:..." })
3. MCP server queries SQLite graph: returns 12 dependents in 8ms
4. AI provides precise, current, comprehensive answer in <1 second
```

### 4.4 Missing MCP Tools (V2 Target)

| Tool Name | Description | Priority |
|-----------|-------------|----------|
| `query_nodes` | Search nodes by type/name/path | P1 |
| `get_dependencies` | Outbound dependency traversal | P1 |
| `get_dependents` | Inbound reverse-dependency traversal | P1 |
| `get_impact` | Blast-radius impact analysis | P1 |
| `get_spec_coverage` | Spec coverage for a project | P2 |
| `get_call_chain` | Execution path between two nodes | P2 |
| `get_guardrails` | Active guardrails for a file/project | P2 |

---

## 5. Gap G-004: Search Quality

### 5.1 Description

**Severity: 🟠 HIGH**  
**Impact: Poor query relevance, no ranking, O(n) linear scan**

V1's `searchNodes` implementation performs a case-sensitive `String.includes()` scan over all node properties. This approach:

- Has O(n) time complexity (linear over all nodes)
- Returns results in arbitrary order (no relevance ranking)
- Supports only exact substring matches (no fuzzy matching)
- Has no concept of query intent or semantic similarity

### 5.2 V1 Search Implementation

```typescript
// V1 searchNodes in graph-query-api.ts (simplified)
searchNodes(query: string): GraphNode[] {
  return this.allNodes.filter(node =>
    JSON.stringify(node.properties).includes(query) // O(n), no ranking
  );
}
```

### 5.3 GitNexus Comparison

GitNexus implements **Hybrid Search** using:
- **BM25** full-text search (from LadybugDB FTS)
- **Vector similarity** search (HuggingFace Transformers.js)
- **Reciprocal Rank Fusion (RRF)** to merge both result sets

For V2, the target is BM25-ranked search via SQLite FTS5 (no vector embeddings needed for V2; P4 future enhancement).

### 5.4 Search Performance Comparison

| Metric | V1 | V2 Target |
|--------|-----|-----------|
| Query complexity | O(n) linear scan | O(log n) FTS5 index |
| Result ranking | None (arbitrary) | BM25 relevance score |
| Fuzzy matching | None | Porter stemming |
| Query time (1K nodes) | ~15ms | <5ms |
| Query time (10K nodes) | ~150ms | <10ms |
| Query time (100K nodes) | ~1500ms | <20ms |

---

## 6. Gap G-005: Graph Traversal Algorithms

### 6.1 Description

**Severity: 🟠 HIGH**  
**Impact: Cannot explore dependency chains or compute reachability**

V1 has no BFS (Breadth-First Search) or DFS (Depth-First Search) traversal algorithms. The query API can fetch direct neighbors (one hop) but cannot traverse dependency chains.

### 6.2 Missing Traversal Capabilities

| Use Case | Algorithm Needed | V1 Support | V2 Target |
|----------|-----------------|------------|-----------|
| "Find all transitive dependencies of library X" | BFS outbound | ❌ | ✅ |
| "Find all files affected by changing interface Y" | BFS inbound | ❌ | ✅ |
| "What is the shortest import path from A to B?" | Dijkstra/BFS | ❌ | ✅ |
| "Detect circular dependencies" | DFS cycle detection | ❌ | ✅ |
| "List all projects that transitively depend on core-utils" | BFS inbound | ❌ | ✅ |
| "Compute blast radius of deleting a service" | BFS inbound multi-hop | ❌ | ✅ |

---

## 7. Gap G-006: Import Resolution

### 7.1 Description

**Severity: 🟡 MEDIUM**  
**Impact: ~40% of import edges point to unresolved targets**

V1 extracts import statements but does not fully resolve them to canonical node IDs. Imports using Nx path aliases (`@myorg/shared/ui`), barrel re-exports (`index.ts`), and TypeScript path mappings are often stored as raw strings rather than resolved to the correct file node.

### 7.2 Unresolved Import Examples

```typescript
// V1 creates an edge:
// source: "file:libs/feature/dashboard/src/lib/dashboard.service.ts"
// target: "@myorg/shared/data-access"  ← UNRESOLVED (should be file node ID)
// type: "imports"

// V2 resolves via tsconfig.base.json paths:
// source: "file:libs/feature/dashboard/src/lib/dashboard.service.ts"
// target: "file:libs/shared/data-access/src/index.ts"  ← RESOLVED
// type: "imports"
```

### 7.3 Impact

- Import graph is incomplete — ~40% of edges are dangling
- Dependency traversal is broken for cross-library imports
- Nx project topology cannot be fully validated against import graph

---

## 8. Gaps NOT Pursuing in V2

The following GitNexus capabilities are explicitly out of scope for V2:

| GitNexus Feature | V2 Decision | Rationale |
|-----------------|-------------|-----------|
| Community detection (Leiden algorithm) | **Defer to V3** | High complexity, medium value |
| Execution flow / process tracing | **Defer to V3** | Very high complexity |
| Vector embeddings (HuggingFace) | **Defer to V3** | Infrastructure dependency |
| Method Resolution Order (MRO) | **Defer to V3** | Low frequency use case |
| Multi-language support (tree-sitter) | **Not adopting** | TypeScript-only workspace |
| LadybugDB/Cypher | **Not adopting** | License risk (PolyForm) |
| Web UI / graph visualization | **Not adopting** | Out of scope |

---

## 9. V1 Strengths to Preserve

**These V1 capabilities are NOT gaps — they are competitive advantages to keep:**

| V1 Capability | Description | V2 Action |
|---------------|-------------|-----------|
| Agent Alchemy spec nodes | `specification` nodes + `specifies` edges | ✅ Preserve and enhance |
| Guardrails tracking | `guardrail` nodes + `enforces`/`validates` edges | ✅ Preserve and enhance |
| Nx project topology | `project` nodes from `nx-graph.json` | ✅ Preserve and enhance |
| Repository pattern | `IGraphRepository`, `INodeRepository` etc. | ✅ Preserve and extend |
| Graph validation | Schema validation on writes | ✅ Preserve and extend |
| Incremental updates | `GitChangeDetector` + `IncrementalGraphBuilder` | ✅ Preserve and improve |
| Hybrid storage | JSON + SQLite | ✅ Preserve |

---

## 10. Gap Remediation Mapping

| Gap | Responsible Component | Implementation Phase |
|-----|----------------------|---------------------|
| G-001 (AST Parsing) | `TypeScriptAstExtractor` | Phase 1 (Weeks 1-2) |
| G-002 (Call Graph) | `CallGraphBuilder` | Phase 2 (Weeks 3-4) |
| G-003 (MCP Server) | `WorkspaceGraphMcpServer` | Phase 3 (Weeks 5-6) |
| G-004 (Search Quality) | `QueryEngine` with FTS5 | Phase 2 (Weeks 3-4) |
| G-005 (Graph Traversal) | `GraphTraversal` (BFS/DFS) | Phase 2 (Week 3) |
| G-006 (Import Resolution) | `ImportResolver` | Phase 1 (Week 2) |

---

## Conclusion

The 6 gaps identified in this analysis collectively explain why V1 is inadequate as an AI agent knowledge layer. The most critical gap is AST parsing (G-001), as it is the root cause of call graph absence (G-002), poor import resolution (G-006), and limited node granularity. Fixing G-001 unlocks remediation of G-002 and G-006 as natural extensions.

**See:** [`leverage-opportunities.specification.md`](./leverage-opportunities.specification.md) for prioritized implementation guidance.
