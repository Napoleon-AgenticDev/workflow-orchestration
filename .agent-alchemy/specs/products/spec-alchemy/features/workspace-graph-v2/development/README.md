---
meta:
  id: spec-alchemy-workspace-graph-v2-development-readme-specification
  title: Development Documentation Index
  version: 0.1.0
  status: draft
  specType: readme
  scope: product:spec-alchemy
  tags: [workspace-graph, v2, development, index]
  createdBy: Agent Alchemy Developer Agent
  createdAt: '2026-03-20'
  reviewedAt: null
title: Development Documentation Index
category: Products
feature: workspace-graph-v2
lastUpdated: '2026-03-20'
source: Agent Alchemy
version: '1.0'
aiContext: true
product: spec-alchemy
phase: development
applyTo: []
keywords: [workspace-graph, v2, development, typescript, ast, mcp, traversal]
topics: [development, implementation, workspace-graph]
useCases: [workspace-analysis, code-intelligence, ai-context]
---

# Workspace Graph V2 — Development Documentation Index

## Introduction

This directory contains all development artifacts for the **workspace-graph V2** implementation.
These documents guide engineering teams through the complete development lifecycle: from
environment setup and architecture decisions through phase-by-phase implementation, testing,
and integration with the broader Agent Alchemy platform.

V2 represents a significant evolution of the workspace graph capability. Where V1 used
regular-expression heuristics to extract code structure, V2 uses **ts-morph AST extraction**
for precise, type-resolved node and edge data. The result is a richer graph with 18+ node
types, 12+ edge types, full BFS/DFS traversal support, a Model Context Protocol (MCP) server
exposing graph intelligence to AI coding assistants, and an integrated full-text search index.

---

## Document Navigation

| # | Document | Purpose | Min Lines |
|---|----------|---------|-----------|
| 1 | [DEVELOPMENT-SUMMARY.md](./DEVELOPMENT-SUMMARY.md) | High-level overview of V2 for all stakeholders | 400+ |
| 2 | [implementation-guide.specification.md](./implementation-guide.specification.md) | Phase-by-phase implementation with full TypeScript code | 1000+ |
| 3 | [code-structure.specification.md](./code-structure.specification.md) | Directory layout, naming conventions, barrel exports | 500+ |
| 4 | [testing-strategy.specification.md](./testing-strategy.specification.md) | Unit, integration, e2e tests with fixture code | 600+ |
| 5 | [integration-points.specification.md](./integration-points.specification.md) | Nx, MCP integration plan (4-stage roadmap), CI/CD, git hooks | 600+ |
| 6 | [README.md](./README.md) _(this file)_ | Navigation index and quick-start | 300+ |

### Parent Directory Links

| Directory | Purpose |
|-----------|---------|
| [../](../) | Feature root: workspace-graph-v2 |
| [../plan/](../plan/) | Planning documents (roadmap, ADRs, milestones) |
| [../research/](../research/) | Research spikes (ts-morph, MCP, MiniSearch) |
| [../architecture/](../architecture/) | Architecture diagrams and decision records |

---

## Quick Start for Developers

### Step 1 — Clone and install dependencies

```bash
# From workspace root
yarn install

# Install V2-specific dependencies
yarn add ts-morph minisearch @modelcontextprotocol/sdk

# Verify ts-morph is available
yarn ts-morph --version
```

### Step 2 — Build the workspace-graph library

```bash
# Build the library with Nx
nx run workspace-graph:build

# Run the graph-build executor to generate graph.json
nx run workspace-graph:graph-build

# Verify output
ls -lh dist/libs/shared/workspace-graph/graph.json
```

### Step 3 — Start the MCP server and validate

```bash
# Start the MCP server (long-running target)
nx run workspace-graph:graph-serve-mcp

# In another terminal, test with a simple JSON-RPC ping
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
  | node dist/libs/shared/workspace-graph/mcp/main.js

# Or query the graph
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"workspace_graph_query","arguments":{"query":"UserService"}}}' \
  | node dist/libs/shared/workspace-graph/mcp/main.js
```

---

## Implementation Status Dashboard

Track overall V2 delivery progress across all six phases.

| Phase | Name | Status | Completion | Key Deliverable |
|-------|------|--------|------------|-----------------|
| 1 | AST Foundation | 🔲 Not Started | 0% | `TypeScriptAstExtractor` with ts-morph |
| 2 | Graph Traversal SKILL | 🔲 Not Started | 0% | BFS, DFS, `ImpactAnalyzer` |
| 3 | Query API + MiniSearch | 🔲 Not Started | 0% | `QueryEngine`, `graph-query` executor |
| 4 | MCP Server | 🔲 Not Started | 0% | 6 MCP tools, `graph-serve-mcp` executor |
| 5 | CALLS Edge Extraction | 🔲 Not Started | 0% | `CallGraphExtractor`, cross-file resolution |
| 6 | Incremental Updates V2 | 🔲 Not Started | 0% | File-watcher, partial re-build pipeline |

**Status legend:** 🔲 Not Started · 🔄 In Progress · ✅ Complete · ⚠️ Blocked

---

## Prerequisites

All developers working on workspace-graph V2 must have the following installed and configured.

### Runtime Requirements

| Requirement | Minimum Version | Purpose |
|-------------|-----------------|---------|
| Node.js | 18.x LTS | Runtime for all tooling and executors |
| TypeScript | 5.x | Language for all V2 source code |
| npm | 9.x | Package management |
| Nx | 19.x | Monorepo task runner and executor host |

### Key New Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `ts-morph` | ^21.0.0 | TypeScript AST extraction (replaces regex) |
| `minisearch` | ^7.0.0 | In-memory full-text search index |
| `@modelcontextprotocol/sdk` | ^0.6.0 | MCP server SDK for Claude Code / Cursor integration |

### Existing Dependencies (unchanged from V1)

| Package | Purpose |
|---------|---------|
| `@nx/devkit` | Nx executor APIs |
| `@nx/workspace` | Nx project graph access |
| `better-sqlite3` | SQLite-based graph persistence (optional) |
| `glob` | File discovery patterns |
| `jest` | Unit and integration test runner |

---

## Development Environment Setup

### Install all workspace dependencies

```bash
# From workspace root — installs everything including V2 additions
yarn install

# If ts-morph is not yet in package.json, add it:
yarn add ts-morph minisearch @modelcontextprotocol/sdk
yarn add --dev @types/better-sqlite3
```

### Environment Variables

Create a `.env.local` file in the workspace root (never commit this):

```dotenv
# workspace-graph V2 configuration
GRAPH_OUTPUT_DIR=dist/workspace-graph
GRAPH_JSON_PATH=dist/workspace-graph/graph.json
GRAPH_SQLITE_PATH=dist/workspace-graph/graph.db
MCP_SERVER_PORT=3333
MCP_LOG_LEVEL=info

# ts-morph configuration
TSCONFIG_PATH=tsconfig.base.json
AST_EXCLUDE_PATTERNS=node_modules/**,dist/**,*.spec.ts
```

### Nx project configuration

Add the following targets to `libs/shared/workspace-graph/workspace-graph/project.json`:

```json
{
  "targets": {
    "graph-build": {
      "executor": "./executors/graph-build:executor",
      "options": {
        "outputPath": "dist/workspace-graph/graph.json",
        "tsconfig": "tsconfig.base.json"
      }
    },
    "graph-query": {
      "executor": "./executors/graph-query:executor",
      "options": {
        "graphPath": "dist/workspace-graph/graph.json"
      }
    },
    "graph-serve-mcp": {
      "executor": "./executors/graph-serve-mcp:executor",
      "options": {
        "graphPath": "dist/workspace-graph/graph.json",
        "port": 3333
      }
    }
  }
}
```

---

## Key Architectural Decisions

Six Architecture Decision Records (ADRs) govern V2 design choices.  
Full text is in [`../plan/architecture-decisions.spec.md`](../plan/architecture-decisions.spec.md).

| ADR | Decision | Rationale |
|-----|----------|-----------|
| ADR-001 | Use ts-morph for AST extraction | TypeScript-native semantics, full type resolution, no regex fragility |
| ADR-002 | MCP over REST API for AI integration | Stdio transport, no server overhead, Claude Code / Cursor native support |
| ADR-003 | MiniSearch for in-memory search | Zero external dependencies, embedable in process, sufficient for monorepo scale |
| ADR-004 | Immutable graph + event-sourced updates | Enables reproducible builds, auditability, incremental re-computation |
| ADR-005 | BFS for impact analysis, DFS for dependency chains | BFS optimally finds shortest affected paths; DFS finds full cycle-aware chains |
| ADR-006 | SQLite optional, JSON default storage | JSON is universally readable; SQLite adds query performance for large repos |

---

## Development Guidelines

### Coding Standards

- All new code must be **TypeScript strict mode** (`"strict": true` in tsconfig).
- No use of `any` type — use `unknown` or properly typed generics.
- All public classes and methods must have **JSDoc** documentation.
- Function bodies must not exceed **30 lines** — extract helpers liberally.
- Prefer **pure functions** in the `ast/`, `traversal/`, and `query/` modules.
- The `mcp/` module is the only module permitted to have side effects (stdio I/O).

### Naming Conventions

| Pattern | Example |
|---------|---------|
| AST node types | `ClassNodeV2`, `MethodNodeV2` |
| Graph node types | `GraphNodeV2` |
| Extractor classes | `TypeScriptAstExtractor`, `CallGraphExtractor` |
| Algorithm classes | `BfsAlgorithm`, `DfsAlgorithm`, `ImpactAnalyzer` |
| Query classes | `QueryEngine`, `SearchIndexer` |
| MCP classes | `WorkspaceGraphMcpServer` |
| Executor entry points | `executor.ts` in `executors/<name>/` |

### Testing Requirements

- **Unit tests** must accompany every new class in `src/lib/`.
- All unit tests live in `<module>.spec.ts` adjacent to the source file.
- **Integration tests** for cross-module flows live in `src/__tests__/integration/`.
- Minimum coverage: **80%** lines, **75%** branches per module.
- Mock all file I/O in unit tests — use in-memory fixtures.
- See [testing-strategy.specification.md](./testing-strategy.specification.md) for full details.

### Git Workflow

```bash
# Feature branches follow the convention:
git checkout -b feat/workspace-graph-v2-phase-<N>-<short-description>

# Commit messages follow Conventional Commits:
git commit -m "feat(workspace-graph): add TypeScriptAstExtractor with ts-morph"
git commit -m "feat(workspace-graph): implement BFS/DFS traversal algorithms"
git commit -m "feat(workspace-graph): add 6-tool MCP server with stdio transport"

# Open PR against main when phase deliverables are all green:
gh pr create --title "feat: workspace-graph v2 phase 1 — AST foundation"
```

---

## Related Documentation

### Planning Documents

- [`../plan/`](../plan/) — Roadmap, milestones, risk register
- [`../plan/architecture-decisions.spec.md`](../plan/architecture-decisions.spec.md) — All 6 ADRs

### Research Documents

- [`../research/`](../research/) — Technology spikes and evaluation
- [`../research/ts-morph-evaluation.spec.md`](../research/ts-morph-evaluation.spec.md) — ts-morph vs tree-sitter comparison
- [`../research/mcp-protocol-research.spec.md`](../research/mcp-protocol-research.spec.md) — MCP protocol analysis
- [`../research/minisearch-evaluation.spec.md`](../research/minisearch-evaluation.spec.md) — Search library comparison

### Architecture Documents

- [`../architecture/`](../architecture/) — System diagrams
- [`../architecture/component-diagram.spec.md`](../architecture/component-diagram.spec.md) — V2 component overview

### Parent Feature Documents

- [`../workspace-graph-v2.brief.md`](../workspace-graph-v2.brief.md) — Feature brief
- [`../workspace-graph-v2.specification.md`](../workspace-graph-v2.specification.md) — Full specification

---

## Feedback and Contributions

All development questions, blockers, and proposals should be tracked in GitHub Issues with the
label `workspace-graph-v2`. Tag relevant ADR numbers in issue descriptions when discussing
architectural trade-offs. PR reviews require at least one approval from a workspace-graph
module owner before merge.
