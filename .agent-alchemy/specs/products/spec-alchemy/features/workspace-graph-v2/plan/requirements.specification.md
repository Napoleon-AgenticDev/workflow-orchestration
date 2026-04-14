---
meta:
  id: spec-alchemy-workspace-graph-v2-requirements-specification
  title: Requirements Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: product:spec-alchemy
  tags: [workspace-graph-v2, plan, requirements]
  createdBy: Agent Alchemy Developer Agent
  createdAt: '2026-03-20'
  reviewedAt: null
title: Requirements Specification
category: Products
feature: workspace-graph-v2
lastUpdated: '2026-03-20'
source: Agent Alchemy
version: '1.0'
aiContext: true
product: spec-alchemy
phase: plan
applyTo: []
keywords: [requirements, functional, non-functional, fr, nfr]
topics: [workspace-graph-v2, requirements-engineering]
---

# Workspace Graph V2: Requirements Specification

**Version:** 1.0.0  
**Date:** 2026-03-20  
**Status:** Planning  
**Category:** Requirements  
**Complexity:** High  

---

## Executive Summary

This document defines all functional requirements (FR) and non-functional requirements (NFR) for workspace-graph-v2. Requirements are traced to research findings and prioritized using MoSCoW notation.

**MoSCoW Key:**
- **M (Must Have):** Critical; system fails without it
- **S (Should Have):** High value; expected in V2
- **C (Could Have):** Nice to have; fit if time allows
- **W (Won't Have):** Explicitly deferred to V3

---

## 1. Functional Requirements

### FR-001: TypeScript AST Extraction

**Priority:** M (Must Have)  
**Source:** Gap G-001 in `../research/gap-analysis.specification.md`  
**Phase:** Phase 1 (Weeks 1-2)

#### FR-001.1 — Class Extraction
The system MUST extract all TypeScript class declarations with:
- Class name
- File path and line range (start line, end line)
- `extends` clause (parent class name)
- `implements` clause (all interface names)
- All decorator names and their first argument metadata

```typescript
// Acceptance: Given this file...
@Injectable({ providedIn: 'root' })
export class UserService extends BaseService implements IUserService {
  // ...
}

// The extractor MUST produce:
{
  name: 'UserService',
  startLine: 2,
  endLine: 4,
  extendsClass: 'BaseService',
  implementsInterfaces: ['IUserService'],
  decorators: ['Injectable'],
  decoratorMetadata: { Injectable: { providedIn: 'root' } }
}
```

#### FR-001.2 — Method Extraction
The system MUST extract all class methods with:
- Method name
- Start line number
- Access modifier (public/protected/private)
- `async` flag
- Parameter list with names and type annotations
- Return type annotation (if present)

#### FR-001.3 — Property Extraction
The system MUST extract all class properties with:
- Property name
- Type annotation (if present)
- `readonly` flag
- `static` flag
- Access modifier

#### FR-001.4 — Interface Extraction
The system MUST extract all TypeScript interfaces with:
- Interface name
- File path and start line
- `extends` clause (all parent interface names)
- Method signatures (names only)

#### FR-001.5 — Function Extraction
The system MUST extract all top-level function declarations with:
- Function name
- Start line number
- `export` flag
- `async` flag
- Parameter list

#### FR-001.6 — Enum Extraction
The system MUST extract all TypeScript enums with:
- Enum name
- All member names (not required to resolve values in V2)

#### FR-001.7 — Import Extraction
The system MUST extract all import declarations with:
- Module specifier (raw value)
- Named imports list
- Default import name (if present)
- Namespace import name (if present)

#### FR-001.8 — Complete V2 Node Type Coverage
The V2 extractor MUST produce the full set of 18+ node types defined in the V2 data model,
including method nodes, parameter nodes, and enriched decorator metadata. There is no
requirement to match or preserve V1 node type schemas.

---

### FR-002: Call Graph Extraction (CALLS Edges)

**Priority:** S (Should Have)  
**Source:** Gap G-002 in `../research/gap-analysis.specification.md`  
**Phase:** Phase 2 (Week 4)

#### FR-002.1 — Call Site Extraction
The system MUST extract all `CallExpression` nodes from TypeScript source files via the
TypeScript Compiler API, including:
- Callee expression text
- Caller method name (enclosing method, if applicable)
- Call site line number

#### FR-002.2 — Local Call Resolution
The system MUST resolve call targets to existing graph nodes when the callee name matches a function or method defined in the same file. Resolved edges MUST have `confidence >= 0.9`.

#### FR-002.3 — Cross-File Call Resolution
The system SHOULD resolve call targets when the callee name matches a function/method imported from another file. Resolution uses the extracted import declarations. Resolved edges MUST have `confidence >= 0.7`.

#### FR-002.4 — Unresolved Call Handling
When a call cannot be resolved (e.g., external npm package calls), the system MUST create a `CALLS` edge with `confidence: 0` and `target: "unresolved:{calleeName}"`. These edges MUST be excluded from traversal queries by default (opt-in via `includeUnresolved: true`).

#### FR-002.5 — CALLS Edge Schema
Every CALLS edge MUST conform to the GraphEdge interface with `type: 'CALLS'` and properties:
```typescript
{ line: number; confidence: number; callerMethod?: string }
```

---

### FR-003: Graph Traversal

**Priority:** M (Must Have)  
**Source:** Gap G-005 in `../research/gap-analysis.specification.md`  
**Phase:** Phase 2 (Week 3)

#### FR-003.1 — BFS Traversal
The system MUST provide a Breadth-First Search traversal starting from a given node ID, supporting:
- `maxDepth` option (default: 5, max: 20)
- `edgeTypes` filter (traverse only specified edge types)
- `direction` option: `'outbound'` (dependencies) or `'inbound'` (dependents)

The traversal MUST return: visited nodes, traversed edges, actual depth reached, and visit order.

#### FR-003.2 — DFS Traversal
The system MUST provide a Depth-First Search traversal with the same options as BFS.

#### FR-003.3 — Impact Analysis
The system MUST provide an `getImpactRadius(nodeId, maxDepth)` function that performs inbound BFS to identify all nodes transitively affected by a change to the given node.

#### FR-003.4 — Shortest Path
The system MUST provide a `shortestPath(fromId, toId)` function returning the shortest sequence of node IDs, or `null` if no path exists.

#### FR-003.5 — Cycle Detection
The system MUST provide a `detectCycles()` function that identifies circular dependencies in the import graph. Each cycle MUST be returned as an ordered array of node IDs.

#### FR-003.6 — Performance
BFS/DFS traversal on a 5-hop chain of 1,000 connected nodes MUST complete in <50ms.

---

### FR-004: Full-Text Search (BM25)

**Priority:** S (Should Have)  
**Source:** Gap G-004 in `../research/gap-analysis.specification.md`  
**Phase:** Phase 2 (Week 3)

#### FR-004.1 — BM25-Ranked Search
The system MUST support full-text search over node labels and properties using BM25 ranking via SQLite FTS5.

#### FR-004.2 — Type Filter
Search queries MUST support filtering by node type (e.g., only search `class` nodes).

#### FR-004.3 — Result Ranking
Search results MUST be ordered by BM25 relevance score (most relevant first).

#### FR-004.4 — Porter Stemming
The FTS5 tokenizer MUST use Porter stemming to handle inflected words (e.g., "running" matches "run").

#### FR-004.5 — Performance
Full-text search over 10,000 nodes MUST complete in <10ms.

#### FR-004.6 — In-Memory Fallback
The system MUST provide a MiniSearch in-memory fallback when SQLite FTS5 is unavailable.

---

### FR-005: MCP Server

**Priority:** M (Must Have)  
**Source:** Gap G-003 in `../research/gap-analysis.specification.md`  
**Phase:** Phase 3 (Weeks 5-6)

#### FR-005.1 — stdio Transport
The MCP server MUST use `StdioServerTransport` from `@modelcontextprotocol/sdk`.

#### FR-005.2 — Tool: query_nodes
The MCP server MUST expose a `query_nodes` tool that accepts `{ query?, type?, projectName?, limit? }` and returns matching graph nodes with BM25 ranking.

#### FR-005.3 — Tool: get_dependencies
The MCP server MUST expose a `get_dependencies` tool that accepts `{ nodeId, depth?, edgeTypes? }` and returns outbound BFS traversal results.

#### FR-005.4 — Tool: get_dependents
The MCP server MUST expose a `get_dependents` tool that accepts `{ nodeId, depth? }` and returns inbound BFS traversal results (nodes that depend on the given node).

#### FR-005.5 — Tool: get_impact
The MCP server MUST expose a `get_impact` tool that accepts `{ nodeId, maxDepth? }` and returns the full blast-radius impact analysis.

#### FR-005.6 — Tool: get_spec_coverage
The MCP server MUST expose a `get_spec_coverage` tool that accepts `{ projectName? }` and returns specification coverage statistics including uncovered files and orphaned specs.

#### FR-005.7 — Tool: get_guardrails
The MCP server MUST expose a `get_guardrails` tool that accepts `{ nodeId?, severity? }` and returns active guardrails enforced on the given node.

#### FR-005.8 — Tool: get_nx_topology
The MCP server MUST expose a `get_nx_topology` tool that accepts `{ projectName? }` and returns Nx project metadata (type, tags, targets, implicit deps).

#### FR-005.9 — Startup Time
The MCP server MUST be ready to accept tool calls within 2 seconds of process start.

#### FR-005.10 — Tool Response Latency
Each MCP tool MUST respond within 100ms for typical queries (<10,000 nodes, <5 BFS hops).

---

### FR-006: Nx Executor Targets

**Priority:** S (Should Have)  
**Phase:** Phase 3 (Week 6)

#### FR-006.1 — build-graph Executor
`nx run {project}:build-graph` MUST trigger a full incremental graph build and persist results to `.workspace-graph/graph.db`.

#### FR-006.2 — query Executor
`nx run {project}:query --query="UserService" --type="class"` MUST execute a BM25 search and print results to stdout in table or JSON format.

#### FR-006.3 — serve-mcp Executor
`nx run {project}:serve-mcp` MUST start the MCP server in stdio mode and block until interrupted.

#### FR-006.4 — check-coverage Executor
`nx run {project}:check-coverage` MUST compute spec coverage and fail (exit code 1) if coverage is below the configured threshold.

---

### FR-007: Import Resolution

**Priority:** S (Should Have)  
**Source:** Gap G-006 in `../research/gap-analysis.specification.md`  
**Phase:** Phase 1 (Week 2)

#### FR-007.1 — tsconfig.base.json Path Aliases
The system MUST resolve Nx path aliases from `tsconfig.base.json` `compilerOptions.paths` to canonical file node IDs.

#### FR-007.2 — Relative Import Resolution
The system MUST resolve relative imports (starting with `./` or `../`) to canonical file paths.

#### FR-007.3 — Unresolvable Imports
Imports to external npm packages MUST be stored as-is (e.g., `rxjs`, `@angular/core`) and NOT create file nodes for them.

---

## 2. Non-Functional Requirements

### NFR-001: Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| AST extraction per file | <50ms | Unit benchmark |
| Full workspace AST extraction (200 files) | <10 seconds | Integration benchmark |
| BFS traversal (5 hops, 1K nodes) | <50ms | Unit benchmark |
| BM25 search (10K nodes) | <10ms | Unit benchmark |
| MCP tool response (typical query) | <100ms | Integration test |
| SQLite graph write (1K nodes/edges batch) | <500ms | Integration benchmark |

### NFR-002: Memory

| Scenario | Limit |
|----------|-------|
| ts-morph project in memory during extraction | <500MB for 200-file batch |
| MCP server steady-state memory | <200MB |
| Graph traversal working set | <100MB for 10K-node graph |

The system MUST call `tsProject.removeSourceFile()` after extracting each file to prevent memory accumulation.

### NFR-003: Reliability

- The system MUST handle malformed TypeScript files gracefully (log warning, continue processing)
- The system MUST handle `undefined`/`null` gracefully from ts-morph API calls
- The system MUST be idempotent: running graph build twice on unchanged files MUST produce identical output

### NFR-004: Backward Compatibility

- All V1 node types MUST continue to be produced by V2
- All V1 edge types MUST continue to be produced by V2
- The `graph.json` export format MUST remain valid
- All V1 unit tests MUST pass without modification

### NFR-005: Test Coverage

- All new V2 modules (ast/, query/, call-graph/, mcp/) MUST have ≥80% line coverage
- All MCP tools MUST have at least one integration test each
- All traversal algorithms MUST have unit tests for edge cases (empty graph, cycles, unreachable nodes)

### NFR-006: Security

- The MCP server MUST NOT expose any mechanism to write or modify files outside `.workspace-graph/`
- The MCP server MUST NOT execute arbitrary code or shell commands
- All user-supplied query strings MUST be parameterized in SQLite queries (no string concatenation)

### NFR-007: Observability

- All MCP tool calls MUST be logged with tool name, parameters summary, and response time
- Graph build operations MUST emit progress events with counts (nodes processed, edges created)
- Errors MUST include the file path and, where applicable, the line number

### NFR-008: License Compatibility

- All V2 dependencies MUST use MIT, Apache-2.0, ISC, or BSD licenses
- No PolyForm, GPL, or LGPL dependencies (license audit required in CI)

### NFR-009: Node.js Compatibility

- The system MUST support Node.js 18 LTS and Node.js 20 LTS
- The system MUST work on Linux (CI), macOS (developer machines), and Windows (optional)

### NFR-010: Documentation

- All public classes and methods MUST have JSDoc documentation
- A `README.md` update MUST document MCP setup for VS Code, Cursor, and Claude Code
- A migration guide MUST document V1 → V2 behavioral changes

---

## 3. Non-Goals (Explicitly Excluded from V2)

The following are **not requirements** for V2. Any PR introducing these features MUST be
blocked and redirected to a V3 planning issue.

| Non-Goal | Reason for Exclusion |
|----------|----------------------|
| Community detection (Leiden / Louvain algorithm) | Requires graph partitioning runtime not yet selected |
| Vector embeddings / semantic search | Needs embedding model + vector store — separate architectural layer |
| Execution flow tracing (runtime call graphs) | Requires profiling/instrumentation hooks outside static analysis scope |
| Multi-language support (Python, Go, Rust, etc.) | Only TypeScript / TSX in scope — multi-language adds AST router complexity |
| Web UI / graph visualization | Rendering concerns are separate from the analysis library |
| Multi-workspace / monorepo federation | Cross-workspace linking requires a network service layer beyond local stdio MCP |
| V1 backward compatibility | V2 is a clean-slate refactor; no shim layer, no deprecated re-exports |

---

## 4. Requirements Traceability Matrix

| Requirement | Research Source | Architecture Component | Phase |
|-------------|----------------|----------------------|-------|
| FR-001 (AST Extraction) | Gap G-001 | `TypeScriptAstExtractor` | 1 |
| FR-002 (Call Graph) | Gap G-002 | `CallGraphBuilder` | 2 |
| FR-003 (Graph Traversal) | Gap G-005 | `GraphTraversal` | 2 |
| FR-004 (BM25 Search) | Gap G-004 | `QueryEngine` (FTS5) | 2 |
| FR-005 (MCP Server) | Gap G-003 | `WorkspaceGraphMcpServer` | 3 |
| FR-006 (Nx Executors) | Leverage P2 | `executors/` directory | 3 |
| FR-007 (Import Resolution) | Gap G-006 | `ImportResolver` | 1 |
| NFR-001 (Performance) | Research benchmarks | All components | All |
| NFR-002 (Memory) | Feasibility R1 | `TypeScriptAstExtractor` | 1 |
| NFR-004 (Test Coverage ≥95%) | Standards | CI pipeline gate | All |
| NFR-005 (Test Coverage) | Standards | CI pipeline gate | All |
