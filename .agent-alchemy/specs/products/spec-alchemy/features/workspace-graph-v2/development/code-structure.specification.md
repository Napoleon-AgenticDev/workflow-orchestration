---
meta:
  id: spec-alchemy-workspace-graph-v2-code-structure-specification
  title: Code Structure
  version: 0.1.0
  status: draft
  specType: specification
  scope: product:spec-alchemy
  tags: [code-structure, architecture, directory, naming, conventions]
  createdBy: Agent Alchemy Developer Agent
  createdAt: '2026-03-20'
  reviewedAt: null
title: Code Structure
category: Products
feature: workspace-graph-v2
lastUpdated: '2026-03-20'
source: Agent Alchemy
version: '1.0'
aiContext: true
product: spec-alchemy
phase: development
applyTo: []
keywords: [directory-structure, naming-conventions, barrel-exports, modules, imports]
topics: [code-organization, structure, naming]
useCases: [developer-onboarding, code-navigation, module-design]
---

# Workspace Graph V2 — Code Structure

This document defines the directory layout, file naming conventions, module organisation
principles, and barrel export strategy for the workspace-graph V2 library. Every developer
contributing to V2 must follow these conventions to ensure consistency across all phases.

---

## Complete V2 Directory Structure

The full library layout after all four phases are delivered. All directories are V2 implementations.

```
libs/shared/workspace-graph/workspace-graph/
│
├── src/
│   ├── lib/
│   │   │
│   │   ├── ast/                              ← NEW (Phase 1)
│   │   │   ├── typescript-ast-extractor.ts   Main AST extraction class (TypeScript Compiler API)
│   │   │   ├── call-graph-extractor.ts       Extracts CALLS edges via TypeChecker
│   │   │   ├── ast-node-types.ts             Interfaces: ClassNodeV2, MethodNodeV2, etc.
│   │   │   └── ast-extractor.spec.ts         Unit tests for ast/ module
│   │   │
│   │   ├── traversal/                        ← NEW (Phase 2)
│   │   │   ├── graph-traversal.ts            Public facade combining BFS + DFS
│   │   │   ├── bfs-algorithm.ts              BreadthFirstSearch implementation
│   │   │   ├── dfs-algorithm.ts              DepthFirstSearch with cycle detection
│   │   │   ├── impact-analyzer.ts            Change impact analysis (reverse BFS)
│   │   │   └── traversal.spec.ts             Unit tests for traversal/ module
│   │   │
│   │   ├── query/                            ← NEW (Phase 2)
│   │   │   ├── query-engine.ts               QueryEngine: search + filter APIs
│   │   │   ├── search-indexer.ts             MiniSearch index builder and manager
│   │   │   ├── query-filters.ts              QueryFilters interface and helpers
│   │   │   └── query-engine.spec.ts          Unit tests for query/ module
│   │   │
│   │   ├── mcp/                              ← NEW (Phase 3)
│   │   │   ├── workspace-graph-mcp-server.ts WorkspaceGraphMcpServer class (6 tools)
│   │   │   ├── mcp-tools.ts                  Tool schema definitions
│   │   │   ├── mcp-tool-handlers.ts          Tool handler implementations
│   │   │   ├── main.ts                       Stdio transport entry point
│   │   │   └── mcp-server.spec.ts            Unit tests for mcp/ module
│   │   │
│   │   ├── builders/                         ← V2 rewrite
│   │   │   ├── workspace-graph-builder-v2.ts Orchestrates all extractors into a graph
│   │   │   └── incremental-update-manager-v2.ts Method-level incremental re-extraction
│   │   │
│   │   ├── extractors/                       ← V2 rewrite
│   │   │   ├── nx-graph-extractor-v2.ts      Nx project topology extractor (V2 schema)
│   │   │   ├── specification-extractor.ts    Agent Alchemy spec node extractor
│   │   │   └── guardrail-extractor.ts        Engineering guardrail extractor
│   │   │
│   │   ├── storage/                          ← V2 rewrite
│   │   │   ├── graph-repository.ts           IGraphRepository interface (V2 types)
│   │   │   ├── json-storage.ts               JSON file persistence (V2 schema)
│   │   │   └── sqlite-storage.ts             SQLite persistence (V2 schema + FTS5)
│   │   │
│   │   ├── validation/                       ← V2 rewrite
│   │   │   └── graph-validator-v2.ts         Graph validation (V2 node/edge rules)
│   │   │
│   │   └── models/                           ← V2 rewrite
│   │       ├── graph-node-v2.ts              GraphNodeV2 discriminated union (18+ types)
│   │       ├── graph-edge-v2.ts              GraphEdgeV2 type (12+ edge types)
│   │       └── workspace-graph-v2.ts         WorkspaceGraphV2 root model
│   │
│   └── index.ts                              Barrel: all public exports
│
├── executors/                                ← NEW (Phase 3)
│   ├── graph-build/
│   │   ├── executor.ts                       Nx executor: builds graph.json
│   │   └── schema.json                       Executor option schema
│   │
│   ├── graph-query/
│   │   ├── executor.ts                       Nx executor: queries graph.json
│   │   └── schema.json
│   │
│   └── graph-serve-mcp/
│       ├── executor.ts                       Nx executor: starts MCP server
│       └── schema.json
│
├── skills/                                   ← NEW (Phase 2)
│   └── graph-traversal.skill.md             Agent Alchemy SKILL file
│
├── project.json                              Nx project config with all targets
├── package.json                              Library package (ts-morph, minisearch, mcp-sdk)
├── tsconfig.json                             TypeScript project config
├── tsconfig.lib.json                         Library-specific tsconfig
├── tsconfig.spec.json                        Test-specific tsconfig
└── README.md                                 Library README
```

---

## File Naming Conventions

All files in `src/lib/` follow these naming rules. Violations are caught by the ESLint
`@nx/enforce-module-boundaries` rule in CI.

| Pattern | Convention | Example |
|---------|-----------|---------|
| Source classes | `<noun>-<noun>.ts` (kebab-case) | `typescript-ast-extractor.ts` |
| Test files | Same name with `.spec.ts` suffix | `typescript-ast-extractor.spec.ts` |
| Type/interface files | `<noun>-types.ts` or `<noun>-node-types.ts` | `ast-node-types.ts` |
| Model files | `<noun>-v2.ts` for V2 models | `graph-node-v2.ts` |
| Executor entry points | `executor.ts` (always this name) | `executors/graph-build/executor.ts` |
| Executor schemas | `schema.json` (always this name) | `executors/graph-build/schema.json` |
| SKILL files | `<noun>-<noun>.skill.md` | `graph-traversal.skill.md` |
| Barrel file | `index.ts` (always this name) | `src/index.ts` |

### Class Naming Conventions

| Pattern | Convention | Example |
|---------|-----------|---------|
| Extractors | `<Subject>Extractor` | `TypeScriptAstExtractor`, `CallGraphExtractor` |
| Builders | `<Subject>BuilderV2` | `WorkspaceGraphBuilderV2` |
| Algorithms | `<Name>Algorithm` | `BfsAlgorithm`, `DfsAlgorithm` |
| Analyzers | `<Subject>Analyzer` | `ImpactAnalyzer` |
| Engines | `<Subject>Engine` | `QueryEngine` |
| Servers | `<Subject>McpServer` | `WorkspaceGraphMcpServer` |
| Indexers | `<Subject>Indexer` | `SearchIndexer` |
| Validators | `<Subject>ValidatorV2` | `GraphValidatorV2` |
| Managers | `<Subject>ManagerV2` | `IncrementalUpdateManagerV2` |

---

## Module Organisation Principles

### Single Responsibility per Module

Each subdirectory under `src/lib/` is a **module** with a single responsibility:

| Module | Responsibility | Permitted dependencies |
|--------|---------------|----------------------|
| `ast/` | Parse TypeScript source files into structured node data | `ts-morph` only |
| `traversal/` | Execute BFS/DFS algorithms on a graph | `models/` only |
| `query/` | Index and query graph nodes | `models/`, `minisearch` |
| `mcp/` | Serve graph intelligence over MCP stdio | `traversal/`, `query/`, `models/`, MCP SDK |
| `builders/` | Orchestrate extractors into a complete graph | `ast/`, `extractors/`, `models/`, `storage/` |
| `extractors/` | Domain-specific node/edge extraction | `models/` only |
| `storage/` | Persist and load graphs | `models/` only |
| `validation/` | Validate graph integrity | `models/` only |
| `models/` | Pure data type definitions | No dependencies |

### No Upward Dependencies

Lower-layer modules must **never** import from higher-layer modules:

```
models/ ← extractors/ ← builders/ ← mcp/
          traversal/  ←           ← mcp/
          query/      ←           ← mcp/
```

Circular imports between `ast/` and `traversal/` are explicitly forbidden.

### Pure Functions in Core Modules

The `ast/`, `traversal/`, `query/`, `models/`, `validation/`, and `storage/` modules
must contain **only pure functions and pure data classes**. They must not:

- Read from `process.stdin` / `process.stdout`
- Write to the filesystem (except `storage/`, which is explicitly for I/O)
- Access `process.env` directly (receive config via constructor)
- Start servers, timers, or background processes

The `mcp/` and `builders/` modules are the only permitted side-effect boundaries.

---

## Barrel Export Strategy

`src/index.ts` is the **sole public API** of the library. External code must import
from `@buildmotion-ai/workspace-graph` (the package name), never from deep paths.

### What to Export

```typescript
// src/index.ts

// ── Models (always export all public types) ──────────────────────────────────
export type { WorkspaceGraphV2 } from './lib/models/workspace-graph-v2';
export type { GraphNodeV2, NodeType } from './lib/models/graph-node-v2';
export type { GraphEdgeV2, EdgeType } from './lib/models/graph-edge-v2';

// ── AST types (export interfaces, not implementation) ────────────────────────
export type {
  AstExtractionResult,
  ClassNodeV2,
  InterfaceNodeV2,
  MethodNodeV2,
  DecoratorNodeV2,
  CallSiteNodeV2,
} from './lib/ast/ast-node-types';

// ── Core classes (export the class itself for DI and testing) ────────────────
export { TypeScriptAstExtractor } from './lib/ast/typescript-ast-extractor';
export { CallGraphExtractor } from './lib/ast/call-graph-extractor';
export { BfsAlgorithm } from './lib/traversal/bfs-algorithm';
export { DfsAlgorithm } from './lib/traversal/dfs-algorithm';
export { ImpactAnalyzer } from './lib/traversal/impact-analyzer';
export { QueryEngine } from './lib/query/query-engine';
export type { QueryFilters, SearchResult } from './lib/query/query-engine';
export { WorkspaceGraphBuilderV2 } from './lib/builders/workspace-graph-builder-v2';
export { GraphValidatorV2 } from './lib/validation/graph-validator-v2';

// ── Storage (export interface, not implementations) ──────────────────────────
export type { IGraphRepository } from './lib/storage/graph-repository';

// ── MCP server is NOT exported from the barrel ──────────────────────────────
// WorkspaceGraphMcpServer is only used by the graph-serve-mcp executor.
// It is not part of the library's public API.
```

### What NOT to Export

- `WorkspaceGraphMcpServer` — internal to the `graph-serve-mcp` executor
- `IncrementalUpdateManagerV2` — internal implementation detail of the builder
- Any `*.spec.ts` exports (Jest handles these automatically)
- Executor implementations — consumed directly by Nx, not by library users

---

## Import Conventions

### Use the Barrel for Cross-Module Imports

**Correct** — import from the package barrel:

```typescript
// In mcp/workspace-graph-mcp-server.ts
import { QueryEngine, ImpactAnalyzer, DfsAlgorithm } from '@buildmotion-ai/workspace-graph';
```

**Incorrect** — do not import from sibling relative paths across module boundaries:

```typescript
// ❌ Forbidden — crosses module boundary with relative path
import { QueryEngine } from '../query/query-engine';
// ❌ Forbidden — deep internal path from an external consumer
import { BfsAlgorithm } from 'libs/shared/workspace-graph/src/lib/traversal/bfs-algorithm';
```

**Exception** — within the same module directory, use relative paths:

```typescript
// In traversal/impact-analyzer.ts
import { BfsAlgorithm } from './bfs-algorithm'; // ✅ Same module, relative is fine
```

### Import Order

All files must follow this import order (enforced by ESLint `import/order`):

```typescript
// 1. Node.js built-ins
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';

// 2. Third-party packages
import { Project, SourceFile } from 'ts-morph';
import MiniSearch from 'minisearch';

// 3. Nx workspace packages
import type { ExecutorContext } from '@nx/devkit';

// 4. Internal workspace libraries (via @buildmotion-ai/*)
import type { WorkspaceGraphV2 } from '@buildmotion-ai/workspace-graph';

// 5. Relative imports (within same module only)
import { BfsAlgorithm } from './bfs-algorithm';
import type { BfsResult } from './bfs-algorithm';
```

---

## Migration Approach: V1 → V2

### Files Preserved Unchanged

These V1 files are carried forward without modification:

| V1 File | V2 Location | Notes |
|---------|-------------|-------|
| `specification-extractor.ts` | `extractors/specification-extractor.ts` | No changes |
| `guardrail-extractor.ts` | `extractors/guardrail-extractor.ts` | No changes |
| `graph-repository.ts` | `storage/graph-repository.ts` | Interface unchanged |
| `json-storage.ts` | `storage/json-storage.ts` | Extended, not replaced |

### Files Renamed

| V1 Name | V2 Name | Reason |
|---------|---------|--------|
| `workspace-graph-builder.ts` | `workspace-graph-builder-v2.ts` | V1 removed; V2 is the only builder |
| `graph-node.ts` | `graph-node-v2.ts` | New discriminated union with 18+ types |
| `incremental-update-manager.ts` | `incremental-update-manager-v2.ts` | Method-level granularity |
| `graph-validator.ts` | `graph-validator-v2.ts` | New validation rules and types |

### Files Replaced

| V1 File | Replaced By | Reason |
|---------|-------------|--------|
| `typescript-extractor.ts` (regex) | `ast/ast-extractor.ts` | TypeScript Compiler API replaces regex |
| `nx-graph-extractor.ts` | `extractors/nx-graph-extractor-v2.ts` | Updated for V2 node IDs and schema |

### V2 is the Authoritative API

V1 classes are removed in V2, not deprecated. The V2 barrel (`src/index.ts`) exports only V2
types and classes. Consuming code must import from the V2 API directly — there are no
`@deprecated` re-exports or shim classes.

---

## Executor Schema Conventions

Each executor's `schema.json` follows the Nx executor schema format:

```json
{
  "$schema": "http://json-schema.org/schema",
  "cli": "nx",
  "title": "Graph Build Executor",
  "description": "Builds the workspace graph and writes graph.json",
  "type": "object",
  "properties": {
    "outputPath": {
      "type": "string",
      "description": "Path to write graph.json output",
      "default": "dist/workspace-graph/graph.json"
    },
    "tsconfig": {
      "type": "string",
      "description": "Path to tsconfig.json for type resolution",
      "default": "tsconfig.base.json"
    },
    "excludePatterns": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Glob patterns to exclude from extraction",
      "default": ["node_modules/**", "dist/**", "**/*.spec.ts"]
    }
  },
  "required": ["outputPath"]
}
```

---

## Test File Location Rules

| Test Type | Location Pattern | Example |
|-----------|-----------------|---------|
| Unit tests | Co-located with source | `ast/typescript-ast-extractor.spec.ts` |
| Integration tests | `src/__tests__/integration/` | `src/__tests__/integration/graph-build.spec.ts` |
| E2E tests | `src/__tests__/e2e/` | `src/__tests__/e2e/mcp-server.e2e.spec.ts` |
| Test fixtures | `src/__tests__/fixtures/` | `src/__tests__/fixtures/simple-service.ts` |

All test helpers and shared test utilities live in `src/__tests__/helpers/`:

```
src/__tests__/
├── fixtures/
│   ├── simple-class.ts          # A class with one method
│   ├── decorated-controller.ts  # NestJS controller with decorators
│   ├── service-with-calls.ts    # Service that calls other services
│   └── interface-implementations.ts
├── helpers/
│   ├── graph-fixture-builder.ts # Builds test WorkspaceGraphV2 instances
│   └── mcp-test-client.ts       # MCP client for e2e testing
├── integration/
│   └── graph-build-pipeline.spec.ts
└── e2e/
    └── mcp-server-tools.e2e.spec.ts
```

---

## TypeScript Configuration

### tsconfig.json (library root)

```json
{
  "extends": "../../../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "target": "ES2022",
    "lib": ["ES2022"],
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "../../../../dist/libs/shared/workspace-graph"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "**/*.spec.ts"]
}
```

### tsconfig.spec.json (for tests)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../../../dist/out-tsc/spec",
    "types": ["jest", "node"]
  },
  "include": ["src/**/*.spec.ts", "src/**/__tests__/**/*.ts"]
}
```

---

## Dependency Graph Rules (ESLint enforcement)

The following `@nx/enforce-module-boundaries` constraints are added to `eslint.config.js`:

```javascript
{
  rules: {
    '@nx/enforce-module-boundaries': [
      'error',
      {
        enforceBuildableLibDependency: true,
        depConstraints: [
          {
            sourceTag: 'scope:workspace-graph',
            onlyDependOnLibsWithTags: ['scope:workspace-graph', 'scope:shared'],
          },
          {
            // ast/ module must not import from mcp/, builders/, or traversal/
            sourceTag: 'module:ast',
            onlyDependOnLibsWithTags: ['module:models'],
          },
          {
            // traversal/ module must not import from mcp/, builders/, ast/, or query/
            sourceTag: 'module:traversal',
            onlyDependOnLibsWithTags: ['module:models'],
          },
        ],
      },
    ],
  },
}
```

Because Nx tags are applied at the library level (not directory level), per-module tag
enforcement is implemented via a custom ESLint rule in `tools/eslint-rules/` that reads
the directory name and applies the module constraint check.

---

## Validation Checklist for Code Structure

Before merging any PR touching the workspace-graph library, verify:

- [ ] All new source files are in the correct module directory.
- [ ] New public classes/functions/types are exported from `src/index.ts`.
- [ ] No deep relative imports between module directories.
- [ ] All source files have a co-located `.spec.ts` test file.
- [ ] No side effects in `models/`, `ast/`, `traversal/`, `query/`, or `validation/`.
- [ ] Executor schema `schema.json` is updated when executor options change.
- [ ] `tsconfig.json` `include` array covers all new files.
- [ ] V2 replaces V1 classes entirely — no `@deprecated` re-exports remain in the barrel.
- [ ] SKILL files include valid YAML frontmatter with `skillId`, `version`, `runner`.
- [ ] Import order follows the 5-group convention enforced by ESLint `import/order`.

---

## Code Review Standards

### Reviewer Checklist for New Modules

When reviewing a PR that introduces a new module directory (e.g., `traversal/`):

1. **Cohesion** — does every file in the module relate to the same responsibility?
2. **Boundary** — does the module receive all dependencies via constructor injection?
3. **Purity** — are there any hidden I/O or side effects in public methods?
4. **Exports** — are only necessary symbols exported from `src/index.ts`?
5. **Tests** — does every exported class have a co-located spec with ≥ 80% coverage?
6. **Naming** — do all identifiers follow the naming conventions table above?
7. **Documentation** — does every exported class have a JSDoc `/** */` comment?

### Reviewer Checklist for Executor Additions

When reviewing a PR that adds a new Nx executor:

1. **Schema** — is `schema.json` complete with all option descriptions and defaults?
2. **Error handling** — does the executor handle missing files / invalid config gracefully?
3. **Output** — is the output deterministic for the same input (no timestamps in output)?
4. **Logging** — does the executor use `context.logger` (not `console.log`) for Nx output?
5. **Return value** — does the executor return `{ success: true/false }` correctly?
