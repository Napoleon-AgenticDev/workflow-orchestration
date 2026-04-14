---
meta:
  id: spec-alchemy-workspace-graph-v2-component-design-specification
  title: Component Design Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: product:spec-alchemy
  tags: [workspace-graph-v2, architecture, component-design]
  createdBy: Agent Alchemy Developer Agent
  createdAt: '2026-03-20'
  reviewedAt: null
title: Component Design Specification
category: Products
feature: workspace-graph-v2
lastUpdated: '2026-03-20'
source: Agent Alchemy
version: '1.0'
aiContext: true
product: spec-alchemy
phase: architecture
applyTo: []
keywords: [component-design, typescript-ast-extractor, query-engine, mcp-server, graph-traversal]
topics: [workspace-graph-v2, components, design]
---

# Workspace Graph V2: Component Design Specification

**Version:** 1.0.0  
**Date:** 2026-03-20  
**Status:** Architecture  
**Category:** Component Design  
**Complexity:** High  

---

## Overview

This document describes the design of all 8 new V2 components. For each component, the specification covers: responsibility, public interface, key design decisions, and integration with other components.

---

## 1. TypeScriptAstExtractor

**Layer:** AST Layer (Layer 2)  
**File:** `src/lib/ast/typescript-ast-extractor.ts`  
**Phase:** Phase 1

### 1.1 Responsibility

Single responsibility: extract all semantic information from a TypeScript source file string using the `ts-morph` TypeScript Compiler API. Replaces V1's `extractFileElements()` and `extractExports()` regex methods.

### 1.2 Design Principles

- **Stateless per extraction:** Each `extractFromFile()` call creates and destroys a source file in the ts-morph project
- **Memory-safe:** Calls `tsProject.removeSourceFile()` in a `finally` block
- **Fault-tolerant:** Catches extraction errors per-entity; never throws from `extractFromFile()`
- **Composable:** Returns plain data (`ExtractedFileData`); does NOT write to graph

### 1.3 Public Interface

```typescript
export class TypeScriptAstExtractor {
  constructor(options?: AstExtractorOptions);

  /**
   * Extract all semantic data from a TypeScript source file.
   * @param filePath - Absolute path to the file (used as source file ID)
   * @param content - Raw TypeScript source content
   * @returns Structured extraction result, never throws
   */
  extractFromFile(filePath: string, content: string): ExtractedFileData;

  /**
   * Process multiple files in memory-efficient batches.
   * @param files - Array of { path, content } objects
   * @param batchSize - Files per batch (default: 50)
   */
  extractBatch(
    files: Array<{ path: string; content: string }>,
    batchSize?: number
  ): ExtractedFileData[];
}
```

### 1.4 Key Implementation Detail: Memory Management

```typescript
extractFromFile(filePath: string, content: string): ExtractedFileData {
  const sourceFile = this.tsProject.createSourceFile(filePath, content, {
    overwrite: true,
    scriptKind: ScriptKind.TSX, // handles .tsx files automatically
  });

  try {
    return {
      filePath,
      classes: this.extractClasses(sourceFile, filePath),
      functions: this.extractFunctions(sourceFile),
      interfaces: this.extractInterfaces(sourceFile),
      enums: this.extractEnums(sourceFile),
      typeAliases: this.extractTypeAliases(sourceFile),
      imports: this.extractImports(sourceFile),
      exports: this.extractExports(sourceFile),
      callSites: this.extractCallSites(sourceFile),
      warnings: [],
    };
  } catch (error) {
    return this.createEmptyResult(filePath, error as Error);
  } finally {
    // CRITICAL: prevents memory accumulation across many files
    this.tsProject.removeSourceFile(sourceFile);
  }
}
```

---

## 2. DecoratorAnalyzer

**Layer:** AST Layer (Layer 2)  
**File:** `src/lib/ast/decorator-analyzer.ts`  
**Phase:** Phase 1

### 2.1 Responsibility

Parse Angular and NestJS decorator argument metadata from decorator AST nodes. Converts `@Component({ selector: 'app-foo' })` into a structured metadata object `{ selector: 'app-foo' }`.

### 2.2 Supported Decorators

| Framework | Decorators | Extracted Metadata |
|-----------|-----------|-------------------|
| Angular | `@Component` | selector, changeDetection, template |
| Angular | `@NgModule` | declarations (count), imports (count) |
| Angular | `@Injectable` | providedIn |
| Angular | `@Directive` | selector |
| Angular | `@Pipe` | name, pure |
| NestJS | `@Controller` | path |
| NestJS | `@Get`, `@Post`, etc. | path |
| NestJS | `@Module` | (presence only) |
| Any | Unknown | Name recorded; metadata: {} |

### 2.3 Public Interface

```typescript
export class DecoratorAnalyzer {
  /**
   * Analyze all decorators on a class node.
   * @returns Array of analyzed decorator records
   */
  analyzeClassDecorators(classNode: ClassDeclaration): AnalyzedDecorator[];

  /**
   * Analyze a single decorator node.
   */
  analyzeDecorator(decorator: Decorator): AnalyzedDecorator;
}

export interface AnalyzedDecorator {
  name: string;
  metadata: Record<string, unknown>;
  framework: 'angular' | 'nestjs' | 'unknown';
}
```

---

## 3. ImportResolver

**Layer:** AST Layer (Layer 2)  
**File:** `src/lib/ast/import-resolver.ts`  
**Phase:** Phase 1

### 3.1 Responsibility

Resolve raw import specifiers to canonical absolute file paths using:
1. `tsconfig.base.json` path alias mappings (Nx `@myorg/*` aliases)
2. Relative path resolution (`./`, `../`)
3. Returns `null` for external npm packages

### 3.2 Public Interface

```typescript
export class ImportResolver {
  constructor(workspaceRoot: string);

  /**
   * Resolve an import specifier to a canonical file path.
   * @returns Absolute file path, or null for external packages
   */
  resolve(importSpecifier: string, fromFilePath: string): string | null;

  /**
   * Resolve multiple imports at once.
   */
  resolveAll(
    imports: Array<{ specifier: string; fromFile: string }>
  ): Array<{ specifier: string; resolvedPath: string | null }>;
}
```

### 3.3 Path Alias Resolution Algorithm

```typescript
resolve(importSpecifier: string, fromFilePath: string): string | null {
  // Step 1: Check tsconfig.base.json path mappings
  for (const [pattern, targets] of this.pathMappings) {
    const regex = new RegExp(`^${pattern.replace(/\*/g, '(.*)')}$`);
    const match = importSpecifier.match(regex);
    if (match) {
      const resolvedTarget = targets[0].replace('*', match[1] ?? '');
      const absolutePath = path.join(this.workspaceRoot, resolvedTarget);
      return this.resolveWithExtensions(absolutePath);
    }
  }

  // Step 2: Relative imports
  if (importSpecifier.startsWith('.')) {
    const base = path.join(path.dirname(fromFilePath), importSpecifier);
    return this.resolveWithExtensions(base);
  }

  // Step 3: External npm package — not in graph
  return null;
}

private resolveWithExtensions(basePath: string): string | null {
  const extensions = ['.ts', '.tsx', '/index.ts', '/index.tsx'];
  for (const ext of extensions) {
    const candidate = basePath + ext;
    if (fs.existsSync(candidate)) return candidate;
  }
  if (fs.existsSync(basePath)) return basePath;
  return null;
}
```

---

## 4. WorkspaceGraphBuilderV2

**Layer:** Graph Layer (Layer 3)  
**File:** `src/lib/builder/workspace-graph-builder-v2.ts`  
**Phase:** Phase 1

### 4.1 Responsibility

Primary V2 orchestration class. Wires the TypeScript Compiler API extractor, graph builder,
query engine, and MCP server together. This is the only builder class in V2 — the V1
`WorkspaceGraphBuilder` is removed.

### 4.2 Public Interface

```typescript
export class WorkspaceGraphBuilderV2 {
  constructor(config: WorkspaceGraphV2Config, options?: V2BuilderOptions);

  // Core V2 methods:
  buildFull(): Promise<WorkspaceGraphV2>;
  buildIncremental(changedFiles: string[]): Promise<void>;

  // V2-only accessors:
  getQueryEngine(): QueryEngine;
  getTraversal(): GraphTraversal;
  getMcpServer(): WorkspaceGraphMcpServer;
  getImpactAnalyzer(): ImpactAnalyzer;
}
```

### 4.3 V2 Build Pipeline

```typescript
async buildIncremental(changedFiles: string[]): Promise<void> {
  // Phase 1: Read changed files
  const fileContents = await this.readFiles(changedFiles);

  // Phase 2: AST extraction (V2 new)
  const extractedData = this.astExtractor.extractBatch(fileContents);

  // Phase 3: Resolve imports (V2 new)
  const resolvedImports = this.importResolver.resolveAll(
    extractedData.flatMap(f => f.imports.map(i => ({ specifier: i.moduleSpecifier, fromFile: f.filePath })))
  );

  // Phase 4: Build/update graph nodes (V1 enhanced with V2 node types)
  await this.nodeBuilder.buildFromExtracted(extractedData, resolvedImports);

  // Phase 5: Build call edges (V2 new)
  const callEdges = this.callGraphBuilder.buildCallEdges(extractedData, await this.getNodeRegistry());
  await this.edgeRepo.upsertBatch(callEdges);

  // Phase 6: Persist (V2 storage layer)
  await this.storage.flush();
}
```

---

## 5. CallGraphBuilder

**Layer:** Graph Layer (Layer 3)  
**File:** `src/lib/call-graph/call-graph-builder.ts`  
**Phase:** Phase 2

### 5.1 Responsibility

Build `CALLS` edges from extracted call sites using a two-phase resolution strategy. Produces confidence-scored edges that represent method-to-method calling relationships.

### 5.2 Public Interface

```typescript
export class CallGraphBuilder {
  /**
   * Build all CALLS edges for a set of extracted files.
   * @param allFiles - Extracted data for all files being processed
   * @param nodeRegistry - Map of nodeId → GraphNode for the entire graph
   * @returns Array of CALLS edges with confidence scores
   */
  buildCallEdges(
    allFiles: ExtractedFileData[],
    nodeRegistry: Map<string, GraphNode>
  ): GraphEdge[];

  /**
   * Resolve a single call site to a graph node ID.
   * @returns { targetNodeId, confidence } or { targetNodeId: null, confidence: 0 }
   */
  resolveCall(
    callSite: ExtractedCallSite,
    fromFile: ExtractedFileData,
    nodeRegistry: Map<string, GraphNode>
  ): CallResolution;
}
```

### 5.3 Resolution Strategy

```
Phase 1: Local resolution (same file)
  - callee name is the name of a class/function/method in the same file
  - Confidence: 1.0

Phase 2: Import-based cross-file resolution
  - callee name appears in the namedImports of an import declaration
  - The import's resolved path points to a known graph node
  - Confidence: 0.85

Phase 3: Suffix matching
  - callee name is a suffix of a known node's qualified name
  - e.g., 'getUser' matches 'UserService.getUser'
  - Confidence: 0.5

Unresolved:
  - No match found in any phase
  - target: "unresolved:{calleeName}", confidence: 0.0
  - Stored but excluded from traversal by default
```

---

## 6. GraphTraversal

**Layer:** Query Layer (Layer 4)  
**File:** `src/lib/query/graph-traversal.ts`  
**Phase:** Phase 2

### 6.1 Responsibility

Provide BFS, DFS, shortest path, and cycle detection algorithms over the graph. All traversals are parameterized by direction, edge type filters, and depth limits.

### 6.2 Public Interface

```typescript
export interface TraversalOptions {
  maxDepth?: number;          // default: 5
  edgeTypes?: string[];       // filter to specific edge types
  direction?: 'outbound' | 'inbound'; // default: 'outbound'
  includeUnresolved?: boolean; // include CALLS edges with confidence=0
}

export interface TraversalResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  visitOrder: string[];       // node IDs in visit order
  depth: number;              // actual max depth reached
  cycles: string[][];         // cycles detected during traversal
}

export class GraphTraversal {
  constructor(nodeRepo: INodeRepository, edgeRepo: IEdgeRepository);

  bfs(startNodeId: string, options?: TraversalOptions): Promise<TraversalResult>;
  dfs(startNodeId: string, options?: TraversalOptions): Promise<TraversalResult>;
  shortestPath(fromId: string, toId: string): Promise<string[] | null>;
  detectCycles(edgeTypes?: string[]): Promise<string[][]>;
  getTransitiveDeps(nodeId: string): Promise<string[]>;
}
```

---

## 7. ImpactAnalyzer

**Layer:** Query Layer (Layer 4)  
**File:** `src/lib/query/impact-analyzer.ts`  
**Phase:** Phase 2

### 7.1 Responsibility

Provide blast-radius impact analysis: given a node that might change, identify all nodes transitively affected by that change. Wraps inbound `GraphTraversal.bfs()` with impact-specific scoring.

### 7.2 Public Interface

```typescript
export interface ImpactResult {
  sourceNodeId: string;
  affectedNodes: Array<{
    node: GraphNode;
    hopDistance: number;
    pathFromSource: string[];
  }>;
  summary: {
    totalAffected: number;
    maxHopDistance: number;
    affectedByType: Record<string, number>;
    affectedProjects: string[];
  };
}

export class ImpactAnalyzer {
  constructor(traversal: GraphTraversal, nodeRepo: INodeRepository);

  getImpactRadius(nodeId: string, maxDepth?: number): Promise<ImpactResult>;
  compareImpact(nodeIdA: string, nodeIdB: string): Promise<ImpactComparison>;
}
```

---

## 8. WorkspaceGraphMcpServer

**Layer:** Integration Layer (Layer 5)  
**File:** `src/lib/mcp/workspace-graph-mcp-server.ts`  
**Phase:** Phase 3

### 8.1 Responsibility

Expose the workspace graph to AI agents via the Model Context Protocol using stdio transport. Provides 7 domain-specific tools covering search, traversal, impact analysis, spec coverage, and Nx topology.

### 8.2 Component Dependencies

```typescript
export class WorkspaceGraphMcpServer {
  constructor(
    private readonly queryEngine: QueryEngine,
    private readonly traversal: GraphTraversal,
    private readonly impactAnalyzer: ImpactAnalyzer,
    private readonly nodeRepo: INodeRepository,
    private readonly config: McpServerConfig
  );

  async start(): Promise<void>; // connects stdio transport, blocks until shutdown
  async stop(): Promise<void>;
}
```

### 8.3 Tool Handler Architecture

```typescript
// Each tool is a separate handler class:
// src/lib/mcp/handlers/
//   ├── query-nodes.handler.ts
//   ├── get-dependencies.handler.ts
//   ├── get-dependents.handler.ts
//   ├── get-impact.handler.ts
//   ├── get-spec-coverage.handler.ts
//   ├── get-guardrails.handler.ts
//   └── get-nx-topology.handler.ts

export interface McpToolHandler<TInput, TOutput> {
  toolName: string;
  inputSchema: JSONSchema;
  execute(input: TInput): Promise<TOutput>;
}
```

### 8.4 Error Handling Strategy

```typescript
// All tool handlers follow this pattern:
async execute(input: TInput): Promise<MpcToolResponse> {
  try {
    const result = await this.doWork(input);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    // Never throw from MCP tools — return empty result with error note
    this.logger.warn(`MCP tool ${this.toolName} failed`, { input, error });
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ error: (error as Error).message, results: [] }),
      }],
    };
  }
}
```

---

## Component Dependency Matrix

| Component | Depends On |
|-----------|-----------|
| `TypeScriptAstExtractor` | `ts-morph` (external) |
| `DecoratorAnalyzer` | `TypeScriptAstExtractor` (ts-morph nodes) |
| `ImportResolver` | fs, path (Node built-ins) |
| `WorkspaceGraphBuilderV2` | `TypeScriptAstExtractor`, `DecoratorAnalyzer`, `ImportResolver`, `CallGraphBuilder` |
| `CallGraphBuilder` | `TypeScriptAstExtractor` output, `INodeRepository` |
| `GraphTraversal` | `INodeRepository`, `IEdgeRepository` |
| `ImpactAnalyzer` | `GraphTraversal`, `INodeRepository` |
| `QueryEngine` | `INodeRepository`, SQLite FTS5, `GraphTraversal` |
| `WorkspaceGraphMcpServer` | `QueryEngine`, `GraphTraversal`, `ImpactAnalyzer`, `@modelcontextprotocol/sdk` |

All components are V2 implementations using V2 types throughout.
