# Workspace Graph V2: Development Summary

> **Audience:** All engineering stakeholders — leads, developers, QA, and DevOps.
> **Purpose:** Concise authoritative overview of what is being built, why, and how.

---

## 1. Overview

The **workspace-graph** library gives Agent Alchemy a structured, queryable model of the
entire codebase. Every Angular component, NestJS service, TypeScript interface, Nx library,
Agent Alchemy specification, and engineering guardrail becomes a **node**. The relationships
between them — imports, implements, extends, depends-on, enforces, specifies — become
**edges**. Together they form a directed graph that AI agents and developer tooling can
traverse to answer questions like:

- _"What code will break if I change `UserService`?"_
- _"Which specifications have drifted from their implementation?"_
- _"What is the full dependency chain of `AuthModule`?"_
- _"Which guardrails apply to `PaymentController`?"_

### V1 vs V2 at a Glance

| Dimension | V1 | V2 |
|-----------|----|----|
| Extraction method | Regex heuristics | ts-morph AST (type-resolved) |
| Node types | 11 | 18+ |
| Edge types | 6 | 12+ (incl. CALLS) |
| Graph traversal | None | BFS + DFS algorithms |
| Search | None | MiniSearch full-text index |
| AI integration | None | MCP server (6 tools) |
| Nx executor targets | graph-build | graph-build, graph-query, graph-serve-mcp |
| Incremental updates | File-level only | Method-level granularity |
| Test coverage | ~60% | Target 80%+ |
| SKILL files | 0 | 1+ (graph-traversal) |

---

## 2. What's New in V2

### ts-morph AST Extraction (replaces regex)

V1 used regular expressions to identify classes, decorators, and imports. This approach
was fragile — it broke on multi-line decorators, template literals, and complex generics.

V2 uses **ts-morph**, a TypeScript compiler API wrapper, to parse source files through the
actual TypeScript compiler front-end. This means:

- Decorator arguments are correctly parsed (including complex objects).
- Generic type parameters are captured accurately.
- Method signatures include full parameter type information.
- Import paths are resolved to their canonical module identifiers.

### 18+ Node Types

V2 adds the following node types on top of V1's 11:

- `MethodNode` — individual class methods with signature metadata
- `DecoratorNode` — TypeScript decorators with argument capture
- `InterfaceNode` — TypeScript interfaces (separate from classes)
- `TypeAliasNode` — `type Foo = ...` declarations
- `EnumNode` — TypeScript enum declarations
- `GenericTypeNode` — reusable generic type references
- `CallSiteNode` — a specific call expression at a source location

### 12+ Edge Types Including CALLS

New edge types in V2:

- `CALLS` — method A calls method B (extracted by ts-morph TypeChecker)
- `IMPLEMENTS` — class implements interface
- `EXTENDS` — class extends another class
- `DECORATES` — decorator applied to class or method
- `RETURNS` — method returns a specific type node
- `PARAMETER_OF` — type node is a parameter of a method
- `OVERRIDES` — method overrides a parent method

Preserved edge types from V1:

- `DEPENDS_ON`, `IMPORTS`, `EXPORTS`, `SPECIFIES`, `ENFORCES`, `CONTAINS`

### BFS/DFS Graph Traversal Algorithms

Two foundational graph algorithms are implemented as first-class library exports:

- **BreadthFirstSearch (`BfsAlgorithm`)** — explores all nodes at distance N before distance N+1.
  Used for impact analysis: "what is immediately affected, then transitively affected?"
- **DepthFirstSearch (`DfsAlgorithm`)** — follows one path to its end before backtracking.
  Used for dependency chain resolution and cycle detection.

Both algorithms return structured result objects with visited node lists, path arrays, depth
maps (BFS), and cycle detection flags (DFS).

### MCP Server with 6 Tools

A **Model Context Protocol** server exposes graph intelligence to AI coding assistants:

| Tool | Description |
|------|-------------|
| `workspace_graph_query` | Full-text and type-filtered node search |
| `workspace_graph_impact` | BFS-based change impact analysis |
| `workspace_graph_context` | Rich context for a single node (neighbors, metadata) |
| `workspace_graph_dependencies` | DFS-based full dependency chain resolution |
| `workspace_graph_staleness` | Spec-to-implementation alignment check |
| `workspace_graph_skill` | List available Agent Alchemy SKILL files |

The server communicates over **stdio** using the `@modelcontextprotocol/sdk`, requiring zero
network configuration. Claude Code and Cursor both support stdio MCP servers.

### Full-Text Search via MiniSearch

The `QueryEngine` builds an in-memory **MiniSearch** index over all graph nodes, enabling:

- Fuzzy full-text search across node names, file paths, and descriptions.
- Filtered queries by node type, file pattern, or package scope.
- Sub-millisecond query latency for monorepo-scale graphs.

### Nx Executor Targets

Three new Nx executor targets make the graph lifecycle scriptable:

- `graph-build` — builds `graph.json` from the workspace.
- `graph-query` — CLI query interface for CI and scripting.
- `graph-serve-mcp` — starts the long-running MCP server.

### Incremental Update Support

V2 improves the incremental update pipeline to operate at **method granularity** rather than
file granularity. When a single method changes, only nodes and edges related to that method
are re-extracted and merged into the graph, dramatically reducing build times for large
workspaces.

---

## 3. V2 Feature Continuity

The following capabilities are included in V2 (not inherited from V1 — they are rebuilt with
richer V2 schemas):

### Agent Alchemy Specification Nodes

V2 `SpecificationNode` uses the V2 schema with richer `specifies` edge metadata including
spec version, staleness score, and last-validated timestamp.

### Engineering Guardrail Tracking

Guardrail nodes (`GuardrailNode`) and `enforces` edges gain richer edge metadata in V2:
spec version, staleness score, and last-validated timestamp. V2 also adds method-level
granularity so guardrails can target individual methods, not just classes.

### Nx Project Topology

`NxGraphExtractor` is rewritten in V2 to use the TypeScript Compiler API directly. Nx project
nodes, library nodes, and application nodes follow the new `GraphNode` V2 schema with enriched
metadata. The `depends-on` edge semantics are retained.

### Repository Pattern Abstraction

`IGraphRepository` is reimplemented in V2 with an asynchronous interface and V2 node/edge
types. V2 uses `Map<string, GraphNode>` / `Map<string, GraphEdge>` instead of plain object maps
for O(1) node lookups.

### Graph Validation

`GraphValidator` is rewritten in V2 with rules for method nodes, CALLS edges, and spec staleness.
V2 validation errors are now structured objects (`ValidationIssue`) rather than plain strings.

---

## 4. Quick Start for Developers

### Install dependencies

```bash
# From workspace root
yarn install

# Add new V2 dependencies if not already in package.json
yarn add ts-morph minisearch @modelcontextprotocol/sdk
```

### Run the graph builder

```bash
# Build graph.json from the workspace
nx run workspace-graph:graph-build

# Watch output
cat dist/workspace-graph/graph.json | python3 -m json.tool | head -100
```

### Query the graph

```bash
# Find all NestJS services
nx run workspace-graph:graph-query -- --type=NestjsService

# Find nodes related to "UserService"
nx run workspace-graph:graph-query -- --search="UserService"

# Get impact of changing a specific node
nx run workspace-graph:graph-query -- --impact="node:UserService"
```

### Start the MCP server

```bash
# Start MCP server (stays running)
nx run workspace-graph:graph-serve-mcp

# In Claude Code, configure the MCP server (see integration-points doc)
```

### Run tests

```bash
# Unit tests only
nx run workspace-graph:test

# Unit tests with coverage
nx run workspace-graph:test --coverage

# Integration tests
nx run workspace-graph:test --testPathPattern=integration
```

---

## 5. Directory Structure

The complete V2 library layout after all 6 phases are delivered:

```
libs/shared/workspace-graph/workspace-graph/
├── src/
│   ├── lib/
│   │   ├── ast/                         ← NEW (Phase 1)
│   │   │   ├── typescript-ast-extractor.ts
│   │   │   ├── call-graph-extractor.ts
│   │   │   ├── ast-node-types.ts
│   │   │   └── ast-extractor.spec.ts
│   │   │
│   │   ├── traversal/                   ← NEW (Phase 2)
│   │   │   ├── graph-traversal.ts
│   │   │   ├── bfs-algorithm.ts
│   │   │   ├── dfs-algorithm.ts
│   │   │   ├── impact-analyzer.ts
│   │   │   └── traversal.spec.ts
│   │   │
│   │   ├── query/                       ← NEW (Phase 3)
│   │   │   ├── query-engine.ts
│   │   │   ├── search-indexer.ts
│   │   │   ├── query-filters.ts
│   │   │   └── query-engine.spec.ts
│   │   │
│   │   ├── mcp/                         ← NEW (Phase 4)
│   │   │   ├── workspace-graph-mcp-server.ts
│   │   │   ├── mcp-tools.ts
│   │   │   ├── mcp-tool-handlers.ts
│   │   │   └── mcp-server.spec.ts
│   │   │
│   │   ├── builders/                    ← V2 rewrite
│   │   │   ├── workspace-graph-builder-v2.ts
│   │   │   └── incremental-update-manager-v2.ts
│   │   │
│   │   ├── extractors/                  ← V2 rewrite
│   │   │   ├── nx-graph-extractor-v2.ts
│   │   │   ├── specification-extractor.ts
│   │   │   └── guardrail-extractor.ts
│   │   │
│   │   ├── storage/                     ← V2 rewrite
│   │   │   ├── graph-repository.ts
│   │   │   ├── json-storage.ts
│   │   │   └── sqlite-storage.ts
│   │   │
│   │   ├── validation/                  ← V2 rewrite
│   │   │   └── graph-validator-v2.ts
│   │   │
│   │   └── models/                      ← V2 rewrite
│   │       ├── graph-node-v2.ts
│   │       ├── graph-edge-v2.ts
│   │       └── workspace-graph-v2.ts
│   │
│   └── index.ts                         ← barrel exports
│
├── executors/                           ← NEW (Phase 3)
│   ├── graph-build/
│   │   ├── executor.ts
│   │   └── schema.json
│   ├── graph-query/
│   │   ├── executor.ts
│   │   └── schema.json
│   └── graph-serve-mcp/
│       ├── executor.ts
│       └── schema.json
│
└── skills/                              ← NEW (Phase 2)
    └── graph-traversal.skill.md
```

---

## 6. Key Architectural Changes

### From Regex to AST

The most significant change in V2 is replacing the regex-based extractor with ts-morph.
The `TypeScriptAstExtractor` initialises a ts-morph `Project` from the workspace tsconfig,
parses every source file into an AST, and walks the tree using strongly-typed node selectors
(`ClassDeclaration`, `MethodDeclaration`, `Decorator`, etc.). This produces extraction
results that are correct-by-construction rather than approximate.

### Graph Model Extension

V2 extends the `GraphNodeV2` discriminated union with new variant types. The graph model
remains a pure in-memory data structure — a plain object with `nodes: Map<string, GraphNodeV2>`
and `edges: Map<string, GraphEdgeV2>`. The storage layer serialises this to JSON or SQLite.

### Traversal as First-Class Operations

BFS and DFS are implemented as stateless functions that take a graph and a start node ID and
return structured result objects. They do not mutate the graph. This makes them easy to test
in isolation and compose into higher-level operations like impact analysis.

### MCP as the AI Integration Boundary

Rather than exposing graph data through a REST API (which requires a running server and
network configuration), V2 uses the MCP stdio transport. The AI assistant spawns the MCP
process and communicates through stdin/stdout, which is zero-config and works in any
environment where Node.js is available.

---

## 7. Testing Approach

### Unit Tests

Every module in `src/lib/` has a co-located `.spec.ts` file. Unit tests use in-memory
TypeScript source code strings as fixtures — they never read from the real filesystem.
The ts-morph `Project` can be initialised with `useInMemoryFileSystem: true` for testing.

```bash
# Run all unit tests
nx run workspace-graph:test

# Run tests for a specific module
nx run workspace-graph:test --testPathPattern=ast-extractor

# Run with coverage report
nx run workspace-graph:test --coverage --coverageReporters=text,html
```

### Integration Tests

Integration tests exercise multiple modules together against real workspace files. They
live in `src/__tests__/integration/` and are tagged with `@group integration`.

```bash
nx run workspace-graph:test --testPathPattern=integration
```

### End-to-End Tests

E2E tests exercise the full pipeline: parse workspace → build graph → query → MCP response.
They run against a known subset of the workspace to ensure deterministic outputs.

```bash
nx run workspace-graph:test --testPathPattern=e2e
```

---

## 8. Phase Delivery Plan

| Phase | Name | Weeks | Key Deliverable | Dependencies |
|-------|------|-------|-----------------|--------------|
| 1 | AST Foundation | 1–2 | `TypeScriptAstExtractor`, 18+ node types | ts-morph installed |
| 2 | Graph Traversal | 2–3 | BFS, DFS, `ImpactAnalyzer`, SKILL file | Phase 1 complete |
| 3 | Query API | 3–4 | `QueryEngine`, MiniSearch, `graph-query` executor | Phase 1 complete |
| 4 | MCP Server | 4–5 | 6 MCP tools, `graph-serve-mcp` executor | Phase 2+3 complete |
| 5 | CALLS Edges | 5–6 | `CallGraphExtractor`, cross-file resolution | Phase 1 complete |
| 6 | Incremental V2 | 6–7 | Method-level invalidation, file watcher | All prior phases |

---

## 9. Non-Goals (Explicitly Excluded from V2)

The following capabilities are **out of scope** for Workspace Graph V2. Including them would
spread development effort across too many axes and dilute the focused V2 mission of delivering
accurate TypeScript/TSX analysis, fast traversal queries, and MCP-based AI tool integration.

| Excluded Capability | Deferred To | Rationale |
|---------------------|-------------|-----------|
| ❌ Community detection (Leiden algorithm) | V3 | Requires graph partitioning runtime not yet selected |
| ❌ Vector embeddings / semantic search | V3 | Needs embedding model + vector store — architectural separation from static analysis |
| ❌ Execution flow tracing (runtime call graphs) | V3 | Requires instrumentation or profiling hooks outside static analysis scope |
| ❌ Multi-language support (Python, Go, Rust …) | V3 | Only TypeScript / TSX in scope; language detection adds significant AST router complexity |
| ❌ Web UI / graph visualization | V3 | Rendering concerns are separate from the analysis library; not part of this workspace |
| ❌ Multi-workspace / monorepo federation | V3 | Cross-workspace linking requires a network service layer beyond local stdio MCP |

> **Note:** These items are explicitly excluded from V2 acceptance criteria, test plans, and
> delivery timelines. Any PR that introduces them will be blocked until a V3 planning cycle
> is opened.

---

## 10. MCP Integration Roadmap

The MCP (Model Context Protocol) server is the primary **consumer interface** for V2 — it
exposes the `QueryEngine` and `AstExtractor` to AI coding tools (Claude Code, Cursor, VS Code
Copilot) via a stdio JSON-RPC transport. Integration is phased across three stages.

### Stage 1 — Library is complete (Phases 1–3 of V2)

Prerequisites: `AstExtractor` + `QueryEngine` + `graph-build` executor all pass tests.

Actions:
1. Build the `WorkspaceGraphMcpServer` class in `src/lib/mcp/`.
2. Implement the 6 MCP tools listed in `integration-points.specification.md §4`.
3. Add the `graph-serve-mcp` Nx executor that starts the server.
4. Add the `@modelcontextprotocol/sdk ^0.6.0` dependency.
5. Write an `mcp-server.spec.ts` with tool integration tests (mocked graph fixture).

### Stage 2 — Local developer integration

Actions:
1. Add `.cursor/mcp.json` to the monorepo root pointing to `nx run workspace-graph:graph-serve-mcp`.
2. Document `~/.claude/claude_desktop_config.json` setup in `documentation/technical/workspace-graph/README.md`.
3. Add a `graph-build` pre-push git hook (see `integration-points.specification.md §5`).
4. Validate the 6 tool workflows end-to-end against a real repo graph.

### Stage 3 — CI/CD integration

Actions:
1. Add `graph-build` step to the CI pipeline after `nx build` succeeds.
2. Upload `graph.json` as a CI artifact for downstream jobs.
3. Add a drift-detection CI job that fails if spec staleness score > threshold.
4. Document MCP server security constraints (stdio-only, no network socket).

### MCP Tool Summary

| MCP Tool | Purpose |
|----------|---------|
| `workspace_graph_query` | Find nodes by type, pattern, or metadata |
| `workspace_graph_impact` | BFS impact analysis from a changed node |
| `workspace_graph_context` | All neighbors + edges for a node (C4-level view) |
| `workspace_graph_dependencies` | Full dependency chain (DFS) |
| `workspace_graph_staleness` | Spec nodes whose `specifies` edge is stale |
| `workspace_graph_skill` | List available Agent Alchemy SKILL nodes |

---

## 11. Getting Help

| Resource | Location |
|----------|---------|
| Research documents | [`../research/`](../research/) |
| Planning documents | [`../plan/`](../plan/) |
| Architecture decisions | [`../plan/architecture-decisions.spec.md`](../plan/architecture-decisions.spec.md) |
| Implementation guide | [`./implementation-guide.specification.md`](./implementation-guide.specification.md) |
| Testing guide | [`./testing-strategy.specification.md`](./testing-strategy.specification.md) |
| Integration guide | [`./integration-points.specification.md`](./integration-points.specification.md) |
| GitHub Issues | `label:workspace-graph-v2` |
| Team Slack | `#workspace-graph-v2` |
