---
meta:
  id: spec-alchemy-workspace-graph-v2-leverage-opportunities-specification
  title: Leverage Opportunities Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: product:spec-alchemy
  tags: [workspace-graph-v2, research, leverage, gitnexus]
  createdBy: Agent Alchemy Developer Agent
  createdAt: '2026-03-20'
  reviewedAt: null
title: Leverage Opportunities Specification
category: Products
feature: workspace-graph-v2
lastUpdated: '2026-03-20'
source: Agent Alchemy
version: '1.0'
aiContext: true
product: spec-alchemy
phase: research
applyTo: []
keywords: [ts-morph, mcp, graph-traversal, bfs-dfs, call-graph, bm25, nx-executor]
topics: [workspace-graph-v2, gitnexus-adoption, priority-matrix]
---

# Workspace Graph V2: Leverage Opportunities Specification

**Version:** 1.0.0  
**Date:** 2026-03-20  
**Status:** Research Complete  
**Category:** Leverage Opportunities  
**Complexity:** High  

---

## Executive Summary

This document translates the gap analysis findings into concrete, prioritized implementation opportunities. Each opportunity is scored by effort, impact, and strategic fit, drawing directly from the GitNexus comparative research at `libs/shared/workspace-graph/workspace-graph/research/gitnexus-analysis/leverage-opportunities.md`.

### Priority Matrix Overview

| Priority | Opportunity | Effort | Impact | Source Pattern |
|----------|-------------|--------|--------|----------------|
| 🔴 P1 | TypeScript AST extraction (ts-morph) | Medium | Critical | GitNexus `src/core/tree-sitter/` (adapted) |
| 🔴 P1 | MCP server for workspace graph queries | Medium | Critical | GitNexus `src/mcp/` |
| 🔴 P1 | Graph traversal algorithms (BFS/DFS) | Low | Critical | GitNexus traversal patterns |
| 🟠 P2 | Query API with BM25/full-text search | Medium | High | GitNexus `src/core/search/hybrid-search.ts` (adapted) |
| 🟠 P2 | Call graph extraction (CALLS edges) | High | High | GitNexus `src/core/ingestion/call-processor.ts` (adapted) |
| 🟠 P2 | Nx executor targets for graph queries | Low | High | Nx custom executor pattern |
| 🟡 P3 | Import path resolution (tsconfig aliases) | Medium | Medium | GitNexus `src/core/ingestion/import-processor.ts` |
| 🟡 P3 | Edge confidence scores | Low | Low-Medium | GitNexus `src/core/graph/types.ts` |
| 🟢 P4 | Community detection (Leiden) | High | Medium | GitNexus `src/core/ingestion/community-processor.ts` |
| 🟢 P4 | Vector embeddings (semantic search) | Very High | Medium | GitNexus + HuggingFace |

---

## 1. Priority Framework

### 1.1 Scoring Criteria

**Impact Score (1-10):**
- 10: Fundamentally transforms AI agent capability
- 8-9: Enables major new use cases
- 6-7: Significantly improves existing use cases
- 4-5: Moderate improvement, nice-to-have
- 1-3: Minor enhancement

**Effort Score (1-10):**
- 1-2: Hours of work
- 3-4: 1-3 days
- 5-6: 1 week
- 7-8: 2 weeks
- 9-10: 3+ weeks

**Strategic Fit Score (1-10):**
- 10: Directly enhances Agent Alchemy's unique capabilities
- 8-9: Strongly aligned with product vision
- 6-7: Compatible but not differentiating
- 4-5: Neutral
- 1-3: Potentially conflicts with design

---

## 2. 🔴 P1: TypeScript AST Extraction (ts-morph)

### 2.1 Opportunity Description

Replace the V1 regex-based extraction with full TypeScript Compiler API analysis via `ts-morph`. This is the root fix that unlocks all other improvements.

### 2.2 Scoring

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Impact | 10/10 | Fixes the fundamental data quality problem (~80% semantic gap) |
| Effort | 6/10 | 2 weeks; `ts-morph` is already in devDependencies |
| Strategic Fit | 10/10 | Directly improves spec-to-code correlation accuracy |
| **ROI** | **High** | Maximum impact for acceptable effort |

### 2.3 GitNexus Source Reference

GitNexus uses tree-sitter (multi-language CST parser). We **adapt but do not copy** this pattern using `ts-morph` instead, which is superior for TypeScript-only workspaces.

**Why ts-morph instead of tree-sitter:**
1. `ts-morph` is already in `devDependencies` — zero procurement risk
2. `ts-morph` provides full TypeScript semantic analysis (type resolution, symbol lookup)
3. No native bindings — pure npm install, no CI build issues
4. Handles TypeScript generics, decorators, and type annotations natively
5. Better Angular/NestJS decorator extraction (understands `@Component`, `@Injectable`)

### 2.4 What to Build

```typescript
// New file: libs/shared/workspace-graph/workspace-graph/src/lib/ast/
// ├── typescript-ast-extractor.ts     ← Core ts-morph extraction
// ├── ast-types.ts                    ← TypeScript interfaces for extracted data
// ├── decorator-analyzer.ts           ← Angular/NestJS decorator semantic analysis
// ├── import-resolver.ts              ← Resolve aliases to canonical paths
// └── index.ts                        ← Barrel export

export class TypeScriptAstExtractor {
  private tsProject: TsProject;
  private decoratorAnalyzer: DecoratorAnalyzer;
  private importResolver: ImportResolver;

  constructor(workspaceRoot: string) {
    this.tsProject = new TsProject({ addFilesFromTsConfig: false });
    this.decoratorAnalyzer = new DecoratorAnalyzer();
    this.importResolver = new ImportResolver(workspaceRoot);
  }

  /**
   * Extract all semantic information from a TypeScript source file.
   * Replaces V1's regex-based extractFileElements() and extractExports().
   */
  extractFromFile(filePath: string, content: string): ExtractedFileData {
    const sourceFile = this.tsProject.createSourceFile(filePath, content, {
      overwrite: true,
    });

    try {
      return {
        filePath,
        classes: this.extractClasses(sourceFile, filePath),
        functions: this.extractFunctions(sourceFile),
        interfaces: this.extractInterfaces(sourceFile),
        enums: this.extractEnums(sourceFile),
        imports: this.extractImports(sourceFile),
        exports: this.extractExports(sourceFile),
        callSites: this.extractCallSites(sourceFile),
      };
    } finally {
      this.tsProject.removeSourceFile(sourceFile); // Memory management
    }
  }
}
```

### 2.5 Node Type Additions in V2

```typescript
// New node types enabled by ts-morph:
export type NodeType =
  | 'project'       // Nx project (V1)
  | 'file'          // Source file (V1)
  | 'class'         // TypeScript class (V1 partial → V2 full)
  | 'interface'     // TypeScript interface (V1 partial → V2 full)
  | 'function'      // Top-level function (V1 partial → V2 full)
  | 'method'        // Class method (NEW in V2)
  | 'property'      // Class property (NEW in V2)
  | 'enum'          // TypeScript enum (V1 partial → V2 full)
  | 'specification' // Agent Alchemy spec file (V1)
  | 'guardrail'     // Engineering guardrail (V1)
  | 'decorator'     // Angular/NestJS decorator metadata (NEW in V2)
  | 'type_alias';   // TypeScript type alias (NEW in V2)
```

---

## 3. 🔴 P1: MCP Server for Workspace Graph

### 3.1 Opportunity Description

Build a Model Context Protocol server that exposes the workspace graph to AI agents via stdio transport. Enables Claude Code, Cursor, Windsurf, and VS Code Copilot to query the graph in real-time during coding sessions.

### 3.2 Scoring

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Impact | 10/10 | Transforms graph from offline artifact to live AI knowledge base |
| Effort | 6/10 | 1.5 weeks; MCP SDK is straightforward |
| Strategic Fit | 10/10 | Core Agent Alchemy + AI coding assistant integration |
| **ROI** | **High** | Maximum strategic value |

### 3.3 GitNexus Source Reference

GitNexus `src/mcp/` provides 7 tools, 7 resources, and 2 prompts. We adopt the **tool pattern** but implement our own domain-specific tools (spec coverage, guardrails, Nx topology).

### 3.4 V2 MCP Tool Set

```typescript
// Tool 1: Query nodes (general search)
{
  name: 'query_nodes',
  description: 'Search workspace graph nodes by type, name, or path using BM25 ranking',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search text (BM25 ranked)' },
      type: { type: 'string', enum: ['project', 'file', 'class', 'method', ...] },
      projectName: { type: 'string', description: 'Filter by Nx project' },
      limit: { type: 'number', default: 20, maximum: 100 }
    }
  }
}

// Tool 2: Get dependencies (outbound traversal)
{
  name: 'get_dependencies',
  description: 'Get all dependencies of a node (what does it depend on)',
  inputSchema: {
    type: 'object',
    required: ['nodeId'],
    properties: {
      nodeId: { type: 'string' },
      depth: { type: 'number', default: 1, maximum: 10 },
      edgeTypes: { type: 'array', items: { type: 'string' } }
    }
  }
}

// Tool 3: Get dependents (inbound traversal — blast radius)
{
  name: 'get_dependents',
  description: 'Get all nodes that depend on this node (impact analysis)',
  inputSchema: {
    type: 'object',
    required: ['nodeId'],
    properties: {
      nodeId: { type: 'string' },
      depth: { type: 'number', default: 3, maximum: 10 }
    }
  }
}

// Tool 4: Impact analysis
{
  name: 'get_impact',
  description: 'Full blast-radius analysis: all nodes affected if this node changes',
  inputSchema: {
    type: 'object',
    required: ['nodeId'],
    properties: {
      nodeId: { type: 'string' },
      maxDepth: { type: 'number', default: 5 }
    }
  }
}

// Tool 5: Agent Alchemy spec coverage (UNIQUE TO OUR SYSTEM)
{
  name: 'get_spec_coverage',
  description: 'Get specification coverage for a project (unique to Agent Alchemy)',
  inputSchema: {
    type: 'object',
    properties: {
      projectName: { type: 'string' },
      includeOrphaned: { type: 'boolean', default: true }
    }
  }
}

// Tool 6: Guardrails for a project (UNIQUE TO OUR SYSTEM)
{
  name: 'get_guardrails',
  description: 'Get active guardrails enforced on a project or file',
  inputSchema: {
    type: 'object',
    properties: {
      nodeId: { type: 'string' },
      severity: { type: 'string', enum: ['error', 'warning', 'info'] }
    }
  }
}

// Tool 7: Nx project topology
{
  name: 'get_nx_topology',
  description: 'Get Nx project boundaries, tags, targets, and implicit dependencies',
  inputSchema: {
    type: 'object',
    properties: {
      projectName: { type: 'string' },
      includeTargets: { type: 'boolean', default: false }
    }
  }
}
```

### 3.5 MCP Server mcp.json Configuration

```json
{
  "mcpServers": {
    "workspace-graph-v2": {
      "command": "node",
      "args": ["libs/shared/workspace-graph/workspace-graph/dist/mcp/server.js"],
      "env": {
        "WORKSPACE_ROOT": "${workspaceFolder}",
        "GRAPH_DB_PATH": "${workspaceFolder}/.workspace-graph/graph.db"
      }
    }
  }
}
```

---

## 4. 🔴 P1: Graph Traversal Algorithms (BFS/DFS)

### 4.1 Opportunity Description

Implement Breadth-First Search and Depth-First Search traversal algorithms over the workspace graph. Enables dependency chain exploration, impact analysis, and cycle detection.

### 4.2 Scoring

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Impact | 9/10 | Prerequisite for MCP impact tools and intelligent refactoring guidance |
| Effort | 3/10 | BFS/DFS are well-understood; ~1 week including SQLite integration |
| Strategic Fit | 9/10 | Foundational capability for all graph intelligence features |
| **ROI** | **Very High** | Low effort, high impact |

### 4.3 Algorithms to Implement

```typescript
export class GraphTraversal {
  // Breadth-First Search (bidirectional support)
  async bfs(startNodeId: string, options: TraversalOptions): Promise<TraversalResult>;

  // Depth-First Search with cycle detection
  async dfs(startNodeId: string, options: TraversalOptions): Promise<TraversalResult>;

  // Impact radius (inbound BFS from a node)
  async getImpactRadius(nodeId: string, maxDepth?: number): Promise<ImpactResult>;

  // Shortest path between two nodes
  async shortestPath(fromId: string, toId: string): Promise<string[] | null>;

  // Cycle detection in import graph
  async detectCycles(): Promise<CycleResult[]>;

  // Transitive dependency closure (all indirect dependencies)
  async getTransitiveDeps(nodeId: string): Promise<string[]>;
}
```

---

## 5. 🟠 P2: Query API with BM25/Full-Text Search

### 5.1 Opportunity Description

Replace V1's `String.includes()` linear scan with SQLite FTS5 full-text search (BM25 ranking). Provides relevance-ranked results and dramatically better query performance at scale.

### 5.2 Scoring

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Impact | 8/10 | 10-100x faster queries; dramatically better result quality |
| Effort | 5/10 | SQLite FTS5 is built-in; ~1.5 weeks to integrate properly |
| Strategic Fit | 9/10 | MCP tools depend on fast, accurate search |
| **ROI** | **High** | Directly enables MCP tool quality |

### 5.3 SQLite FTS5 Implementation

```sql
-- Create FTS5 virtual table (V2 schema addition)
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

-- Trigger to keep FTS in sync with nodes table
CREATE TRIGGER nodes_ai AFTER INSERT ON nodes BEGIN
  INSERT INTO nodes_fts(rowid, id, label, type, path, properties)
  VALUES (new.rowid, new.id, new.label, new.type,
          json_extract(new.properties, '$.path'),
          new.properties);
END;

-- BM25-ranked search query
SELECT n.id, n.type, n.label, n.properties, bm25(nodes_fts) AS rank
FROM nodes_fts
JOIN nodes n ON n.id = nodes_fts.id
WHERE nodes_fts MATCH :query
  AND (:type IS NULL OR n.type = :type)
ORDER BY rank
LIMIT :limit;
```

---

## 6. 🟠 P2: Call Graph Extraction (CALLS Edges)

### 6.1 Opportunity Description

Use ts-morph's `CallExpression` extraction to build a call graph (CALLS edges between method/function nodes). Enables impact analysis and execution flow tracing.

### 6.2 Scoring

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Impact | 8/10 | Enables blast-radius analysis and dead code detection |
| Effort | 8/10 | Cross-file resolution is complex; ~1.5 weeks |
| Strategic Fit | 8/10 | Prerequisite for execution flow MCP tools |
| **ROI** | **Medium-High** | High impact but high effort |

### 6.3 Two-Phase Resolution Strategy

```typescript
export class CallGraphBuilder {
  /**
   * Phase 1: Local resolution
   * Match call names against nodes defined in the same file.
   */
  resolveLocalCalls(
    filePath: string,
    callSites: ExtractedCallSite[],
    localNodes: Map<string, GraphNode>
  ): ResolvedCall[];

  /**
   * Phase 2: Import-based cross-file resolution
   * Trace import declarations to resolve cross-file call targets.
   */
  resolveCrossFileCalls(
    filePath: string,
    callSites: ExtractedCallSite[],
    importEdges: GraphEdge[],
    globalNodeIndex: Map<string, GraphNode>
  ): ResolvedCall[];

  /**
   * Build all CALLS edges for the entire workspace.
   */
  buildCallEdges(
    allFiles: ExtractedFileData[],
    nodeRegistry: Map<string, GraphNode>
  ): GraphEdge[];
}

export interface ResolvedCall {
  callerId: string;    // Node ID of the calling method
  calleeId: string;   // Node ID of the called method/function
  line: number;
  confidence: number; // 0.0 (unresolved) to 1.0 (exact match)
}
```

---

## 7. 🟠 P2: Nx Executor Targets

### 7.1 Opportunity Description

Add Nx executor targets for common workspace graph V2 operations. Enables `nx run workspace-graph-v2:query`, `nx run workspace-graph-v2:build`, and `nx run workspace-graph-v2:serve-mcp`.

### 7.2 Scoring

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Impact | 7/10 | Dramatically improves developer ergonomics |
| Effort | 2/10 | ~0.5 weeks; straightforward Nx executor pattern |
| Strategic Fit | 9/10 | Native Nx integration is a key differentiator |
| **ROI** | **Very High** | Very low effort, high strategic fit |

### 7.3 Target Definitions

```json
// project.json additions for workspace-graph-v2
{
  "targets": {
    "build-graph": {
      "executor": "./src/executors/build-graph/executor",
      "options": {
        "workspaceRoot": "{workspaceRoot}",
        "outputPath": "{workspaceRoot}/.workspace-graph",
        "incremental": true
      }
    },
    "query": {
      "executor": "./src/executors/query/executor",
      "options": {
        "output": "table",
        "limit": 20
      }
    },
    "serve-mcp": {
      "executor": "./src/executors/serve-mcp/executor",
      "options": {
        "transport": "stdio"
      }
    },
    "check-coverage": {
      "executor": "./src/executors/check-coverage/executor",
      "options": {
        "minCoveragePercent": 80,
        "outputReport": "coverage-report.json"
      }
    }
  }
}
```

---

## 8. 🟡 P3: Import Path Resolution

### 8.1 Opportunity Description

Resolve Nx path aliases (`@myorg/shared/utils`) to canonical file paths using `tsconfig.base.json` path mappings. Fixes ~40% of unresolved import edges.

### 8.2 Implementation Approach

```typescript
export class ImportResolver {
  private pathMappings: Map<string, string>;

  constructor(workspaceRoot: string) {
    const tsConfig = JSON.parse(
      fs.readFileSync(`${workspaceRoot}/tsconfig.base.json`, 'utf-8')
    );
    this.pathMappings = this.buildPathMappings(
      tsConfig.compilerOptions?.paths ?? {}
    );
  }

  resolve(importSpecifier: string, fromFile: string): string | null {
    // 1. Check Nx path alias mappings
    for (const [alias, targets] of this.pathMappings) {
      const pattern = new RegExp(`^${alias.replace('*', '(.*)')}$`);
      const match = importSpecifier.match(pattern);
      if (match) {
        const target = targets[0].replace('*', match[1] ?? '');
        return path.resolve(this.workspaceRoot, target);
      }
    }

    // 2. Resolve relative paths
    if (importSpecifier.startsWith('.')) {
      return path.resolve(path.dirname(fromFile), importSpecifier);
    }

    return null; // External npm package — not in graph
  }
}
```

---

## 9. 🟢 P4: Future Opportunities (Deferred)

### 9.1 Community Detection (Leiden Algorithm)

| Dimension | Assessment |
|-----------|------------|
| Impact | Medium — groups related code into functional clusters |
| Effort | Very High — requires `graphology` library and Leiden implementation |
| Decision | **Defer to V3** |

### 9.2 Vector Embeddings (Semantic Search)

| Dimension | Assessment |
|-----------|------------|
| Impact | High — enables "find code similar to this pattern" |
| Effort | Very High — requires HuggingFace Transformers.js or WASM runtime |
| Decision | **Defer to V3** |

---

## 10. Implementation Priority Ordering

The following sequence maximizes value delivery while managing dependencies:

```
Week 1-2:  P1 — TypeScript AST Extraction (ts-morph)
           P3 — Import Path Resolution (natural extension)
Week 3-4:  P1 — Graph Traversal (BFS/DFS)
           P2 — Query API with BM25 (FTS5)
           P2 — Call Graph (CALLS edges)
Week 5-6:  P1 — MCP Server (depends on P2 Query API)
           P2 — Nx Executor Targets
           P3 — Edge Confidence Scores
```

**Dependency graph for implementation:**

```
ts-morph AST Extractor ──────────────────────────────┐
                                                      │
Import Resolver (P3) ──── Import Edge Quality ────────┤
                                                      │
Call Graph Builder (P2) ── CALLS edges ───────────────┤
                                                      │
Graph Traversal (P1) ──── BFS/DFS ───────────────────┤
                                                      │
Query API / FTS5 (P2) ──── Search ───────────────────┤
                                                      ▼
                                          MCP Server (P1)
                                                      │
                                    Nx Executor Targets (P2)
```

---

## Conclusion

The six P1/P2 opportunities in this document, implemented in the order specified, will transform the workspace graph from a static offline artifact into a living, queryable knowledge layer for AI agents. The ts-morph AST extractor is the linchpin — it unblocks call graph, import resolution, and accurate node modeling, which in turn enables the MCP server to deliver genuinely useful query results.

**See:** [`recommendations.specification.md`](./recommendations.specification.md) for the final synthesis and action plan.
