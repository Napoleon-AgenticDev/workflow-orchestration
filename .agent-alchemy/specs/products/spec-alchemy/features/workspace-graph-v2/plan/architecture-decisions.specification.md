---
meta:
  id: spec-alchemy-workspace-graph-v2-architecture-decisions-specification
  title: Architecture Decisions Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: product:spec-alchemy
  tags: [workspace-graph-v2, plan, adr, architecture-decisions]
  createdBy: Agent Alchemy Developer Agent
  createdAt: '2026-03-20'
  reviewedAt: null
title: Architecture Decisions Specification
category: Products
feature: workspace-graph-v2
lastUpdated: '2026-03-20'
source: Agent Alchemy
version: '1.0'
aiContext: true
product: spec-alchemy
phase: plan
applyTo: []
keywords: [adr, architecture-decision-records, ts-morph, mcp, sqlite-fts5]
topics: [workspace-graph-v2, architecture-decisions]
---

# Workspace Graph V2: Architecture Decisions Specification

**Version:** 1.0.0  
**Date:** 2026-03-20  
**Status:** Planning  
**Category:** Architecture Decision Records  

---

## Overview

This document contains Architecture Decision Records (ADRs) for workspace-graph-v2. Each ADR documents a significant design decision, the context in which it was made, the options considered, and the rationale for the chosen option.

---

## ADR-001: Use ts-morph for TypeScript AST Extraction (not tree-sitter)

**Status:** ACCEPTED  
**Date:** 2026-03-20  
**Deciders:** Agent Alchemy Team  
**Research Basis:** `../research/feasibility-analysis.specification.md` §2, `../research/leverage-opportunities.specification.md` §2

### Context

V1 uses regex-based text scanning for code extraction. The gap analysis identified this as the most critical deficiency. Two mature options exist for replacing it:
1. **tree-sitter** — the approach used by GitNexus (multi-language CST parser)
2. **ts-morph** — TypeScript Compiler API wrapper (TypeScript-only)

### Decision

**Use ts-morph** for TypeScript AST extraction.

### Rationale

| Criterion | ts-morph | tree-sitter | Decision Weight |
|-----------|----------|-------------|-----------------|
| Already in devDependencies | ✅ Yes | ❌ No | High |
| TypeScript semantic analysis (types, symbols) | ✅ Full | ❌ Syntactic only | Very High |
| No native bindings | ✅ Pure JS | ❌ C++/WASM binaries | High |
| Angular decorator metadata | ✅ Excellent | ⚠️ Manual queries | High |
| Multi-language support | ❌ TS/JS only | ✅ 14+ languages | Low (TS-only workspace) |
| Workspace already TypeScript-only | ✅ Perfect fit | ⚠️ Overkill | High |
| Community and maintenance | ✅ 4.5K stars, active | ✅ Mature | Neutral |

**Decisive factors:** This workspace is TypeScript-only. `ts-morph` is already present in devDependencies. The TypeScript Compiler API provides semantic understanding (type resolution, generic parameter handling) that tree-sitter cannot replicate with syntactic parsing alone.

### Consequences

- ✅ Accurate TypeScript extraction with zero new dependencies
- ✅ Full decorator argument analysis (Angular, NestJS)
- ✅ Type annotation extraction for parameters and return types
- ⚠️ Must process files in batches and call `removeSourceFile()` for memory management
- ⚠️ Cannot handle non-TypeScript files (handled by exclusion from file set)

---

## ADR-002: Use stdio Transport for MCP Server (not HTTP)

**Status:** ACCEPTED  
**Date:** 2026-03-20  
**Research Basis:** `../research/feasibility-analysis.specification.md` §3, `../research/leverage-opportunities.specification.md` §3.5

### Context

The MCP server needs a transport layer to communicate with AI agents (Claude Code, Cursor, VS Code). The MCP spec supports multiple transport options:
1. **stdio** — Process communicates via stdin/stdout
2. **HTTP SSE** — HTTP Server-Sent Events
3. **HTTP REST** — Traditional HTTP request/response

### Decision

**Use StdioServerTransport** from `@modelcontextprotocol/sdk`.

### Rationale

| Criterion | stdio | HTTP SSE | HTTP REST |
|-----------|-------|---------|-----------|
| Latency | ~1ms | ~10-50ms | ~10-50ms |
| IDE/editor support | ✅ Universal | ✅ Good | ⚠️ Custom config |
| Port management | ✅ None needed | ⚠️ Requires free port | ⚠️ Requires free port |
| Process isolation | ✅ Dies with IDE | ⚠️ Zombie risk | ⚠️ Zombie risk |
| Implementation complexity | ✅ 5 lines | ⚠️ ~50 lines | ⚠️ ~100 lines |
| Authentication | ✅ OS process isolation | ⚠️ Needs token/header | ⚠️ Needs auth layer |
| Multi-user | ❌ Single client | ✅ Multiple | ✅ Multiple |

**Decisive factor:** Single-developer local workflow does not require multi-user support. stdio has the lowest latency, simplest implementation, and best cross-IDE support.

### Consequences

- ✅ Works out-of-box with Claude Code, Cursor, Windsurf, VS Code Copilot
- ✅ No port management or firewall configuration
- ✅ Server lifecycle tied to IDE process (no zombie servers)
- ⚠️ Cannot serve multiple simultaneous clients (not required for local dev)
- ⚠️ Debugging requires special tools (`@modelcontextprotocol/inspector`)

### MCP Configuration File

```json
// .vscode/mcp.json (VS Code / Claude Code)
{
  "mcpServers": {
    "workspace-graph-v2": {
      "command": "node",
      "args": [
        "${workspaceFolder}/libs/shared/workspace-graph/workspace-graph/dist/mcp/server.js"
      ],
      "env": {
        "WORKSPACE_ROOT": "${workspaceFolder}",
        "GRAPH_DB_PATH": "${workspaceFolder}/.workspace-graph/graph.db"
      }
    }
  }
}
```

---

## ADR-003: Use SQLite FTS5 with BM25 for Full-Text Search

**Status:** ACCEPTED  
**Date:** 2026-03-20  
**Research Basis:** `../research/feasibility-analysis.specification.md` §5, `../research/recommendations.specification.md` §2.3

### Context

V1's search is O(n) `String.includes()`. V2 needs relevance-ranked full-text search. Options:
1. **SQLite FTS5** — Built into SQLite, BM25 ranking natively available
2. **MiniSearch** — Pure JavaScript in-memory search library
3. **Elasticsearch** — Distributed search engine
4. **Custom BM25** — Implement BM25 manually over SQLite index

### Decision

**Primary: SQLite FTS5** with BM25 ranking.  
**Fallback: MiniSearch** for in-memory/testing scenarios.

### Rationale

| Criterion | SQLite FTS5 | MiniSearch | Elasticsearch |
|-----------|------------|------------|---------------|
| New dependencies | ✅ Zero (built-in) | ⚠️ +1 pkg | ❌ Infrastructure |
| BM25 support | ✅ Native | ✅ TF-IDF approximation | ✅ Full BM25 |
| Persistence | ✅ Survives restart | ❌ In-memory only | ✅ Yes |
| Sync with graph writes | ✅ Triggers | ⚠️ Manual rebuild | ✅ Index API |
| Performance (10K nodes) | ✅ <10ms | ✅ <5ms (in-memory) | ✅ <5ms |
| Developer overhead | ✅ None | ✅ None | ❌ High |

**Decisive factor:** FTS5 is built into SQLite and `better-sqlite3`. Zero new dependencies, persistent, automatically kept in sync via SQL triggers.

### Implementation

```sql
-- FTS5 virtual table creation
CREATE VIRTUAL TABLE IF NOT EXISTS nodes_fts USING fts5(
  id UNINDEXED,
  label,
  type UNINDEXED,
  path,
  properties,
  content='nodes',
  content_rowid='rowid',
  tokenize='porter ascii'
);

-- Auto-sync trigger
CREATE TRIGGER nodes_ai AFTER INSERT ON nodes BEGIN
  INSERT INTO nodes_fts(rowid, id, label, type, path, properties)
  VALUES (new.rowid, new.id, new.label, new.type,
          json_extract(new.properties, '$.path'),
          new.properties);
END;

-- BM25-ranked query
SELECT n.*, bm25(nodes_fts) AS rank
FROM nodes_fts
JOIN nodes n ON n.id = nodes_fts.id
WHERE nodes_fts MATCH ?
ORDER BY rank
LIMIT ?;
```

### Consequences

- ✅ BM25-ranked search with zero new dependencies
- ✅ Persistent across process restarts
- ✅ Automatically synchronized via SQL triggers
- ⚠️ Requires SQLite 3.9+ (FTS5 available since 2015 — safe assumption)
- ⚠️ Node content table must be `nodes` (column name binding)

---

## ADR-004: Two-Phase Call Graph Resolution Strategy

**Status:** ACCEPTED  
**Date:** 2026-03-20  
**Research Basis:** `../research/leverage-opportunities.specification.md` §6.3

### Context

Building a call graph requires resolving `CallExpression` targets to specific graph nodes. The resolution complexity varies:
- **Local calls** (same file): trivial lookup
- **Cross-file calls** (imported function): requires import graph
- **External calls** (npm package): cannot resolve

Options considered:
1. **Single-pass exact match** — simple but misses most calls
2. **Two-phase (local + import-based)** — good accuracy, manageable complexity
3. **Full type-resolution (TypeScript Language Service)** — maximum accuracy, very high complexity

### Decision

**Use two-phase resolution:** local (Phase 1) then import-based cross-file (Phase 2). Unresolved calls are stored with `confidence: 0`.

### Confidence Scoring

| Resolution Type | Confidence | Description |
|----------------|------------|-------------|
| Local exact match | 1.0 | Callee defined in same file |
| Import-based cross-file | 0.85 | Callee name found in imported symbols |
| Suffix/pattern match | 0.5 | Callee name is suffix of known node name |
| Unresolved | 0.0 | Cannot resolve to workspace node |

### Consequences

- ✅ 80%+ of same-project calls resolved accurately
- ✅ Low complexity relative to full language server resolution
- ⚠️ External npm calls always unresolved (acceptable)
- ⚠️ Dynamic calls (e.g., `obj[methodName]()`) cannot be resolved

---

## ADR-005: Clean-Slate Refactor — No V1 API Lock-In

**Status:** ACCEPTED  
**Date:** 2026-03-21 (supersedes original ADR-005)

### Context

V2 is a **total refactor**, not an incremental extension. V1 used regex-based extraction,
lacked method-level nodes, had no query engine, and had no MCP interface. Keeping V1 API
shapes would lock the V2 schema to V1 limitations and prevent clean implementation of the
new 5-layer architecture.

### Decision

V2 introduces a **new public API** with no obligation to match V1 method signatures, class
names, node ID formats, or export shapes. Consumers of V1 must migrate to V2 directly —
there is no shim layer, no `@deprecated` re-export period, and no dual-builder pattern.

Specific changes from V1:
- Node ID format: `<type>:<package>:<name>` (V1 used `<type>:<name>`)
- `WorkspaceGraphBuilderV2` replaces `WorkspaceGraphBuilder` entirely — no inheritance
- `extractGraph()` returns `WorkspaceGraphV2` — `WorkspaceGraph` (V1) is removed
- `IGraphRepository` uses `WorkspaceGraphV2` types throughout
- `graph.json` schema is V2 format from day one

### Rationale

- Clean API enables the correct V2 data model (method nodes, CALLS edges, enriched metadata)
- Eliminates permanent maintenance burden of dual builder classes
- Removes the risk of V1 tests masking V2 regressions
- V2 test suite is the authoritative quality gate — V1 test coverage is not used as a proxy

### Non-Goals (from this ADR)

- No `migrateV1ToV2()` adapter function
- No `WorkspaceGraphBuilder` re-export
- No `@deprecated` shim classes
- No V1 backward-compatibility test suite

### Consequences

- ✅ V2 schema is unconstrained by V1 limitations
- ✅ Single consistent API surface for all consumers
- ✅ Test suite validates only V2 behaviour
- ⚠️ Existing scripts/CI that import V1 types must be updated — see project README migration notes

---

## ADR-006: Phased 4-Phase Rollout (not big-bang rewrite)

**Status:** ACCEPTED  
**Date:** 2026-03-20

### Context

All V2 improvements could be built simultaneously (parallel development) or sequentially (phased delivery). Risk profile differs significantly.

### Decision

**Phased delivery** with 4 sequential phases, each independently valuable:

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1: AST Foundation | 2 weeks | TypeScript Compiler API extraction (`AstExtractor`) |
| Phase 2: Query Intelligence | 2 weeks | BFS/DFS + search scoring + Call Graph (`QueryEngine`) |
| Phase 3: MCP Integration | 2 weeks | MCP server + Nx executors (`graph-build`/`graph-serve-mcp`) |
| Phase 4: Hardening | 1+ weeks | Performance benchmarks + Docs + E2E tests |

### Rationale

- Each phase delivers standalone value (Phase 1 improves graph quality even without MCP)
- Phase dependencies are respected (MCP requires Query Intelligence)
- Risk is isolated: Phase 1 failure does not affect V1 consumers
- Easier to review and test incrementally

### Consequences

- ✅ Each phase can be reviewed and validated independently
- ✅ Phase 1 value is available in Week 2 (not Week 8)
- ✅ No dual API surface — V2 is the only API from day one

---

## ADR-007: JSON Storage with Optional SQLite (V2 Schema)

**Status:** ACCEPTED

### Context

V2 uses a clean storage layer with V2 types. JSON is the default (zero extra dependencies,
human-readable, compatible with Git). SQLite with FTS5 is an optional upgrade for full-text
search on large graphs.

### Decision

**JSON-first, SQLite-optional.** V2 ships with `JsonGraphRepository` as the default
implementation of `IGraphRepository`. SQLite support is in `SqliteGraphRepository` and
is opt-in via repository factory configuration.

### Storage Layer

```typescript
// V2 storage interfaces:
export interface IGraphRepository {
  save(graph: WorkspaceGraphV2): Promise<void>;
  load(): Promise<WorkspaceGraphV2 | null>;
  exists(): Promise<boolean>;
  delete(): Promise<void>;
}

export interface INodeRepository {
  upsert(node: GraphNode): Promise<void>;
  findById(id: string): Promise<GraphNode | undefined>;
  findByType(type: NodeType): Promise<GraphNode[]>;
}

// Optional (SQLite only):
export interface ISearchRepository {
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  reindexAll(): Promise<void>;
}
```

### Consequences

- ✅ Zero runtime dependencies for default JSON path
- ✅ JSON export remains human-readable and Git-diffable
- ✅ SQLite FTS5 upgrade path available without changing consumer code
- ⚠️ Two storage representations (JSON + SQLite) must stay in sync when both are active
