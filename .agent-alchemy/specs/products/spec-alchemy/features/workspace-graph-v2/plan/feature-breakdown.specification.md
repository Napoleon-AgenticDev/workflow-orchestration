---
meta:
  id: spec-alchemy-workspace-graph-v2-feature-breakdown-specification
  title: Feature Breakdown Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: product:spec-alchemy
  tags: [workspace-graph-v2, plan, features, acceptance-criteria]
  createdBy: Agent Alchemy Developer Agent
  createdAt: '2026-03-20'
  reviewedAt: null
title: Feature Breakdown Specification
category: Products
feature: workspace-graph-v2
lastUpdated: '2026-03-20'
source: Agent Alchemy
version: '1.0'
aiContext: true
product: spec-alchemy
phase: plan
applyTo: []
keywords: [features, user-stories, acceptance-criteria, priority]
topics: [workspace-graph-v2, feature-planning]
---

# Workspace Graph V2: Feature Breakdown Specification

**Version:** 1.0.0  
**Date:** 2026-03-20  
**Status:** Planning  
**Category:** Feature Breakdown  

---

## Feature Summary

| Feature ID | Feature Name | Priority | Phase | Status |
|-----------|--------------|----------|-------|--------|
| F-001 | TypeScript AST Extractor (ts-morph) | P1 Critical | 1 | Planned |
| F-002 | Decorator Analyzer | P1 Critical | 1 | Planned |
| F-003 | Import Resolver | P1 Critical | 1 | Planned |
| F-004 | WorkspaceGraphBuilderV2 | P1 Critical | 1 | Planned |
| F-005 | Graph Traversal (BFS/DFS) | P1 Critical | 2 | Planned |
| F-006 | Impact Analyzer | P1 Critical | 2 | Planned |
| F-007 | BM25 Full-Text Search | P2 High | 2 | Planned |
| F-008 | Call Graph Builder | P2 High | 2 | Planned |
| F-009 | MCP Server | P1 Critical | 3 | Planned |
| F-010 | Nx Executor: build-graph | P2 High | 3 | Planned |
| F-011 | Nx Executor: query | P2 High | 3 | Planned |
| F-012 | Nx Executor: serve-mcp | P2 High | 3 | Planned |
| F-013 | Nx Executor: check-coverage | P2 High | 3 | Planned |
| F-014 | Migration Guide + Documentation | P2 High | 4 | Planned |

---

## F-001: TypeScript AST Extractor

**Priority:** P1 Critical  
**Phase:** 1 (Weeks 1-2)  
**Owner:** Agent Alchemy Developer  
**Requirement References:** FR-001

### User Story

> As an AI agent using the workspace graph,  
> I want to query method-level information about TypeScript classes,  
> So that I can answer questions like "what public methods does UserService expose?"

### Description

Replaces V1's regex-based `extractFileElements()` and `extractExports()` with a full TypeScript Compiler API analysis using `ts-morph`. Produces semantically accurate node data with line numbers for all code entities.

### Acceptance Criteria

```gherkin
Given a TypeScript file containing a class with decorators, methods, and properties
When TypeScriptAstExtractor.extractFromFile() is called
Then the result MUST contain:
  - The class name, start line, and end line
  - All decorator names and their first argument metadata
  - All method names, access modifiers, async flags, and start lines
  - All property names, types, and modifiers
  - All import declarations with module specifiers and named imports

Given a TypeScript file that contains a syntax error
When TypeScriptAstExtractor.extractFromFile() is called
Then the extractor MUST NOT throw an exception
And MUST return a partial result with a warnings array

Given a file is extracted and then the next file is extracted
When both extractions are complete
Then memory usage MUST NOT grow between extractions
  (ts-morph project.removeSourceFile() MUST be called after each extraction)
```

### Technical Notes

```typescript
// Key implementation constraint:
// Use addFilesFromTsConfig: false to prevent loading entire workspace
this.tsProject = new TsProject({ addFilesFromTsConfig: false });

// Memory management — CRITICAL:
const sourceFile = this.tsProject.createSourceFile(filePath, content, { overwrite: true });
try {
  return this.extract(sourceFile);
} finally {
  this.tsProject.removeSourceFile(sourceFile); // prevents memory accumulation
}
```

### Definition of Done

- [ ] `TypeScriptAstExtractor` class implemented in `src/lib/ast/typescript-ast-extractor.ts`
- [ ] All 8 extraction methods implemented (classes, methods, properties, interfaces, functions, enums, imports, exports, call sites)
- [ ] Unit tests covering: class with decorators, class with inheritance, function extraction, import extraction, malformed file handling
- [ ] Test coverage ≥95%

---

## F-002: Decorator Analyzer

**Priority:** P1 Critical  
**Phase:** 1 (Week 2)  
**Requirement References:** FR-001.1

### User Story

> As an AI agent,  
> I want to know that `DashboardComponent` is an Angular component with `selector: 'app-dashboard'`,  
> So that I can generate accurate component usage guidance.

### Description

Extends the AST extractor to parse decorator argument metadata for Angular (`@Component`, `@NgModule`, `@Injectable`, `@Directive`, `@Pipe`) and NestJS (`@Controller`, `@Service`, `@Module`, `@Get`, `@Post`) decorators.

### Acceptance Criteria

```gherkin
Given a class decorated with @Component({ selector: 'app-dashboard', changeDetection: ... })
When DecoratorAnalyzer.analyze() is called
Then the result MUST include:
  - decorator name: 'Component'
  - metadata: { selector: 'app-dashboard', changeDetection: 'ChangeDetectionStrategy.OnPush' }

Given a class decorated with @Injectable({ providedIn: 'root' })
When analyzed
Then metadata MUST include: { providedIn: 'root' }

Given an unknown decorator (e.g., @CustomDecorator)
When analyzed
Then the decorator name MUST be included
And metadata MUST be an empty object {} (not null/undefined)
```

---

## F-003: Import Resolver

**Priority:** P1 Critical  
**Phase:** 1 (Week 2)  
**Requirement References:** FR-007

### User Story

> As a developer,  
> I want import edges to point to canonical file node IDs,  
> So that dependency traversal is accurate across Nx library boundaries.

### Description

Resolves raw import specifiers to canonical workspace file paths using `tsconfig.base.json` path mappings. Handles Nx `@myorg/*` aliases, relative paths, and barrel re-exports.

### Acceptance Criteria

```gherkin
Given the import: import { UserService } from '@buildmotion-ai/feature-users'
And tsconfig.base.json maps '@buildmotion-ai/feature-users' to 'libs/feature/users/src/index.ts'
When ImportResolver.resolve() is called
Then the resolved path MUST be the absolute path to 'libs/feature/users/src/index.ts'

Given the import: import { AuthService } from '../auth/auth.service'
When ImportResolver.resolve() is called from 'libs/shared/ui/src/lib/component.ts'
Then the resolved path MUST be the absolute path to 'libs/shared/ui/src/lib/../auth/auth.service.ts'

Given the import: import { Observable } from 'rxjs'
When ImportResolver.resolve() is called
Then the result MUST be null (external npm package — not a workspace node)
```

---

## F-004: WorkspaceGraphBuilderV2

**Priority:** P1 Critical  
**Phase:** 1 (Week 2)  
**Requirement References:** FR-001.8

### Description

New orchestration class that wires together `TypeScriptAstExtractor`, `DecoratorAnalyzer`,
and `ImportResolver` with `IncrementalGraphBuilder` and the repository layer.
`WorkspaceGraphBuilderV2` is the only builder class in V2 — the V1 `WorkspaceGraphBuilder`
is removed. This is the primary entry point for all V2 consumers.

### Acceptance Criteria

```gherkin
Given WorkspaceGraphBuilderV2.buildFull() is called on the workspace
Then the graph MUST contain all V2 node types (18+ types)
And the graph MUST contain CALLS edges for all resolved call sites

Given WorkspaceGraphBuilderV2.buildIncremental() is called on a set of changed files
Then the graph MUST contain all V2 node types for the changed files
And a statistics object MUST include v2.methodNodes and v2.callSites extracted counts
```

---

## F-005: Graph Traversal (BFS/DFS)

**Priority:** P1 Critical  
**Phase:** 2 (Week 3)  
**Requirement References:** FR-003

### User Story

> As an AI agent,  
> I want to find all transitive dependencies of `libs/shared/ui`,  
> So that I can understand the full impact of changing a shared utility.

### Acceptance Criteria

```gherkin
Given a graph: A → B → C → D (import chain)
When GraphTraversal.bfs('node-A', { direction: 'outbound', maxDepth: 5 }) is called
Then the result.nodes MUST contain A, B, C, D
And result.visitOrder MUST be in BFS order: [A, B, C, D]

Given the same graph
When GraphTraversal.bfs('node-D', { direction: 'inbound', maxDepth: 5 }) is called
Then the result.nodes MUST contain D, C, B, A

Given a graph with a cycle: A → B → C → A
When GraphTraversal.detectCycles() is called
Then the result MUST contain one cycle: [A, B, C, A]

Given GraphTraversal.shortestPath('node-A', 'node-D')
Then the result MUST be ['node-A', 'node-B', 'node-C', 'node-D']

Given no path exists from node-X to node-Y
Then shortestPath MUST return null
```

---

## F-006: Impact Analyzer

**Priority:** P1 Critical  
**Phase:** 2 (Week 3)  
**Requirement References:** FR-003.3

### User Story

> As an AI agent,  
> I want to know the blast radius of changing `UserService.getUser()`,  
> So that I can warn the developer about all downstream effects.

### Acceptance Criteria

```gherkin
Given UserService.getUser() is called by DashboardComponent and ProfileComponent
And DashboardComponent is used by AppComponent
When ImpactAnalyzer.getImpactRadius('method:getUser:...') is called with maxDepth=5
Then the result MUST contain: DashboardComponent, ProfileComponent, AppComponent
And each result node MUST include the hop distance from UserService.getUser()
And result.summary MUST include: { totalAffected: 3, maxHopDistance: 2 }
```

---

## F-007: BM25 Full-Text Search

**Priority:** P2 High  
**Phase:** 2 (Week 3)  
**Requirement References:** FR-004

### Acceptance Criteria

```gherkin
Given a graph with 1000 nodes including 'UserService', 'UserRepository', 'UserController'
When QueryEngine.search({ query: 'user service' }) is called
Then results MUST be ranked by BM25 relevance (UserService first)
And 'UserService' MUST appear before 'UserRepository' in the results

Given QueryEngine.search({ query: 'auth', type: 'class' })
Then results MUST contain only nodes of type 'class'
And results MUST be ordered by BM25 score

Given QueryEngine.search over 10,000 nodes
Then the query MUST complete in <10ms
```

---

## F-008: Call Graph Builder

**Priority:** P2 High  
**Phase:** 2 (Week 4)  
**Requirement References:** FR-002

### Acceptance Criteria

```gherkin
Given method A in file1.ts calls method B defined in the same file1.ts
When CallGraphBuilder.buildCallEdges() is called
Then a CALLS edge MUST exist: source=A, target=B, confidence≥0.9

Given method A calls method C imported from file2.ts
When CallGraphBuilder.buildCallEdges() is called
Then a CALLS edge MUST exist: source=A, target=C, confidence≥0.7

Given method A calls an external npm function (e.g., console.log)
Then a CALLS edge MUST exist with confidence=0 and target='unresolved:console.log'
And this edge MUST NOT appear in default traversal results
```

---

## F-009: MCP Server

**Priority:** P1 Critical  
**Phase:** 3 (Weeks 5-6)  
**Requirement References:** FR-005

### User Story

> As a developer using Claude Code,  
> I want to ask "what depends on UserService?",  
> And have Claude automatically query my workspace graph and return an accurate answer.

### Acceptance Criteria

```gherkin
Given the MCP server is started via 'nx run workspace-graph:serve-mcp'
Then the server MUST be ready within 2 seconds

Given the MCP server is running
When the 'get_dependents' tool is called with { nodeId: 'class:UserService:...' }
Then the response MUST contain all nodes that import or call UserService
And the response time MUST be <100ms

Given the MCP server is running
When the 'get_spec_coverage' tool is called with { projectName: 'agency' }
Then the response MUST include: coveredFiles, uncoveredFiles, coveragePercent, orphanedSpecs

Given an invalid nodeId is passed to any tool
Then the server MUST return an empty result (not throw an exception)
```

---

## F-010 through F-013: Nx Executors

**Priority:** P2 High  
**Phase:** 3 (Week 6)  
**Requirement References:** FR-006

### Acceptance Criteria

```gherkin
Given 'nx run workspace-graph:build-graph'
Then .workspace-graph/graph.db MUST be updated
And exit code MUST be 0 on success

Given 'nx run workspace-graph:query --query="UserService" --output=json'
Then stdout MUST contain a JSON array of matching nodes
And exit code MUST be 0

Given 'nx run workspace-graph:serve-mcp'
Then the process MUST start the MCP stdio server
And the process MUST block until SIGTERM or SIGINT

Given 'nx run workspace-graph:check-coverage' with coverage below threshold
Then exit code MUST be 1
And stdout MUST include a human-readable coverage report
```

---

## Feature Dependency Graph

```
F-003 (Import Resolver)
  └── F-001 (AST Extractor)
        └── F-002 (Decorator Analyzer)
              └── F-004 (Builder V2)
                    ├── F-005 (BFS/DFS Traversal)
                    │     └── F-006 (Impact Analyzer)
                    ├── F-007 (BM25 Search)
                    ├── F-008 (Call Graph)
                    │     └── F-005 (depends on traversal for resolution)
                    └── ─────────────────────────────────────────────
                          F-009 (MCP Server) — depends on F-005, F-006, F-007
                            ├── F-010 (build-graph executor)
                            ├── F-011 (query executor)
                            ├── F-012 (serve-mcp executor)
                            └── F-013 (check-coverage executor)
```
