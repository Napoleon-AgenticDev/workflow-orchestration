---
meta:
  id: spec-alchemy-workspace-graph-v2-api-contracts-specification
  title: API Contracts Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: product:spec-alchemy
  tags: [workspace-graph-v2, architecture, api-contracts, typescript-interfaces]
  createdBy: Agent Alchemy Developer Agent
  createdAt: '2026-03-20'
  reviewedAt: null
title: API Contracts Specification
category: Products
feature: workspace-graph-v2
lastUpdated: '2026-03-20'
source: Agent Alchemy
version: '1.0'
aiContext: true
product: spec-alchemy
phase: architecture
applyTo: []
keywords: [api-contracts, typescript-interfaces, query-api, mcp-tools, ast-types]
topics: [workspace-graph-v2, api-design, contracts]
---

# Workspace Graph V2: API Contracts Specification

**Version:** 1.0.0  
**Date:** 2026-03-20  
**Status:** Architecture  
**Category:** API Contracts  

---

## Overview

This document defines all TypeScript interfaces and type contracts for workspace-graph-v2's public APIs. These contracts are the authoritative source of truth for component integration.

---

## 1. AST Extractor Output Types

### 1.1 Core Extraction Types

```typescript
// File: src/lib/ast/ast-types.ts

export interface ExtractedFileData {
  filePath: string;
  classes: ExtractedClass[];
  functions: ExtractedFunction[];
  interfaces: ExtractedInterface[];
  enums: ExtractedEnum[];
  typeAliases: ExtractedTypeAlias[];
  imports: ExtractedImport[];
  exports: ExtractedExport[];
  callSites: ExtractedCallSite[];
  warnings: ExtractionWarning[];
}

export interface ExtractedClass {
  name: string;
  filePath: string;
  startLine: number;
  endLine: number;
  extendsClass?: string;
  implementsInterfaces: string[];
  decorators: AnalyzedDecorator[];
  methods: ExtractedMethod[];
  properties: ExtractedProperty[];
  typeParameters: string[];
  isAbstract: boolean;
  isExported: boolean;
}

export interface ExtractedMethod {
  name: string;
  className: string;
  startLine: number;
  endLine: number;
  isPublic: boolean;
  isProtected: boolean;
  isPrivate: boolean;
  isAsync: boolean;
  isStatic: boolean;
  isAbstract: boolean;
  returnType?: string;
  parameters: ExtractedParameter[];
  decorators: AnalyzedDecorator[];
}

export interface ExtractedProperty {
  name: string;
  className: string;
  type?: string;
  isReadonly: boolean;
  isStatic: boolean;
  isOptional: boolean;
  accessModifier: 'public' | 'protected' | 'private';
  decorators: AnalyzedDecorator[];
  initializer?: string;
}

export interface ExtractedParameter {
  name: string;
  type?: string;
  isOptional: boolean;
  hasDefaultValue: boolean;
  decorators: AnalyzedDecorator[];
}

export interface ExtractedFunction {
  name: string;
  filePath: string;
  startLine: number;
  endLine: number;
  isExported: boolean;
  isAsync: boolean;
  isArrow: boolean;
  returnType?: string;
  parameters: ExtractedParameter[];
}

export interface ExtractedInterface {
  name: string;
  filePath: string;
  startLine: number;
  extendsInterfaces: string[];
  methods: Array<{ name: string; returnType?: string }>;
  properties: Array<{ name: string; type?: string; isOptional: boolean }>;
  isExported: boolean;
}

export interface ExtractedEnum {
  name: string;
  filePath: string;
  startLine: number;
  isConst: boolean;
  members: Array<{ name: string; value?: string }>;
  isExported: boolean;
}

export interface ExtractedTypeAlias {
  name: string;
  filePath: string;
  startLine: number;
  isExported: boolean;
}

export interface ExtractedImport {
  moduleSpecifier: string;
  resolvedPath?: string;       // Set by ImportResolver (null = external npm)
  namedImports: string[];
  defaultImport?: string;
  namespaceImport?: string;
  isTypeOnly: boolean;
}

export interface ExtractedExport {
  name: string;
  kind: string;               // 'ClassDeclaration', 'FunctionDeclaration', etc.
  isDefault: boolean;
}

export interface ExtractedCallSite {
  calleeName: string;
  callerClassName?: string;
  callerMethodName?: string;
  startLine: number;
  isAwait: boolean;
  argumentTexts: string[];    // Raw text of arguments (for debugging)
}

export interface AnalyzedDecorator {
  name: string;
  metadata: Record<string, unknown>;
  framework: 'angular' | 'nestjs' | 'unknown';
}

export interface ExtractionWarning {
  message: string;
  filePath: string;
  line?: number;
  entityName?: string;
}
```

---

## 2. Graph Schema Types (V2 Extensions)

### 2.1 Extended Node Types

```typescript
// File: src/lib/types/graph-types.ts
// Extends V1 NodeType enum

export type NodeTypeV1 =
  | 'project'
  | 'file'
  | 'class'
  | 'interface'
  | 'service'
  | 'function'
  | 'enum'
  | 'specification'
  | 'guardrail'
  | 'type'
  | 'component';

/** New node types added in V2 */
export type NodeTypeV2Extension =
  | 'method'          // Class method (new in V2)
  | 'property'        // Class property (new in V2)
  | 'type_alias'      // TypeScript type alias (new in V2)
  | 'decorator'       // Decorator application (new in V2)
  | 'parameter';      // Method parameter (new in V2, optional)

export type NodeType = NodeTypeV1 | NodeTypeV2Extension;
```

### 2.2 Extended Edge Types

```typescript
export type EdgeTypeV1 =
  | 'contains'         // project → file
  | 'imports'          // file → file
  | 'exports'          // file → class/function
  | 'specifies'        // specification → code entity
  | 'enforces'         // guardrail → code entity
  | 'validates'        // guardrail → code entity
  | 'extends'          // class → class
  | 'implements'       // class → interface
  | 'depends-on';      // project → project

/** New edge types added in V2 */
export type EdgeTypeV2Extension =
  | 'CALLS'            // method/function → method/function (new in V2)
  | 'OVERRIDES'        // method → method (V3 planned)
  | 'HAS_METHOD'       // class → method (new in V2)
  | 'HAS_PROPERTY';    // class → property (new in V2)

export type EdgeType = EdgeTypeV1 | EdgeTypeV2Extension;
```

### 2.3 V2 Node Property Schemas

```typescript
// Method node properties
export interface MethodNodeProperties {
  name: string;
  className: string;
  filePath: string;
  startLine: number;
  endLine: number;
  isPublic: boolean;
  isAsync: boolean;
  isStatic: boolean;
  returnType?: string;
  decorators: string[];
}

// CALLS edge properties
export interface CallsEdgeProperties {
  line: number;
  confidence: number;      // 0.0 (unresolved) to 1.0 (exact)
  callerMethod?: string;
  resolved: boolean;
}

// V2-enriched class node properties (extends V1)
export interface ClassNodePropertiesV2 {
  name: string;
  filePath: string;
  startLine: number;
  endLine: number;
  extendsClass?: string;
  implementsInterfaces: string[];
  decorators: string[];
  decoratorMetadata: Record<string, Record<string, unknown>>;
  isAbstract: boolean;
  methodCount: number;
  publicMethodCount: number;
}
```

---

## 3. Query API Contracts

### 3.1 GraphTraversal Interface

```typescript
// File: src/lib/query/graph-traversal.ts

export interface TraversalOptions {
  maxDepth?: number;                      // Default: 5, Max: 20
  edgeTypes?: EdgeType[];                 // Filter to specific edge types
  direction?: 'outbound' | 'inbound';    // Default: 'outbound'
  includeUnresolved?: boolean;           // Include CALLS edges with confidence=0
  visitedSet?: Set<string>;              // For composing traversals
}

export interface TraversalResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  visitOrder: string[];
  depth: number;
  cycles: string[][];
  truncated: boolean;         // true if maxDepth was hit
}

export interface IGraphTraversal {
  bfs(startNodeId: string, options?: TraversalOptions): Promise<TraversalResult>;
  dfs(startNodeId: string, options?: TraversalOptions): Promise<TraversalResult>;
  shortestPath(fromId: string, toId: string): Promise<string[] | null>;
  detectCycles(edgeTypes?: EdgeType[]): Promise<string[][]>;
  getTransitiveDeps(nodeId: string): Promise<string[]>;
  getTransitiveDependents(nodeId: string): Promise<string[]>;
}
```

### 3.2 ImpactAnalyzer Interface

```typescript
export interface ImpactResult {
  sourceNodeId: string;
  affectedNodes: ImpactedNode[];
  summary: ImpactSummary;
}

export interface ImpactedNode {
  node: GraphNode;
  hopDistance: number;
  pathFromSource: string[];         // node IDs in path
  edgeTypesOnPath: EdgeType[];
}

export interface ImpactSummary {
  totalAffected: number;
  maxHopDistance: number;
  affectedByType: Record<string, number>;
  affectedProjects: string[];
  directDependents: number;
  transitiveDependents: number;
}

export interface IImpactAnalyzer {
  getImpactRadius(nodeId: string, maxDepth?: number): Promise<ImpactResult>;
}
```

### 3.3 QueryEngine Interface (V2 Enhanced)

```typescript
export interface SearchOptions {
  query: string;
  type?: NodeType;
  projectName?: string;
  limit?: number;                  // Default: 20, Max: 100
  includeProperties?: boolean;    // Include properties in search text
}

export interface SearchResult {
  node: GraphNode;
  rank: number;                    // BM25 relevance score (lower = better match)
  matchedFields: string[];
}

export interface SpecCoverageResult {
  projectName: string;
  coveredFiles: string[];
  uncoveredFiles: string[];
  coveragePercent: number;
  specNodes: GraphNode[];
  orphanedSpecs: GraphNode[];      // Spec nodes with no target in graph
}

export interface IQueryEngineV2 extends IQueryEngine {
  // V2 additions:
  search(options: SearchOptions): Promise<SearchResult[]>;
  getDependencies(nodeId: string, depth?: number): Promise<TraversalResult>;
  getDependents(nodeId: string, depth?: number): Promise<TraversalResult>;
  getImpact(nodeId: string, maxDepth?: number): Promise<ImpactResult>;
  getSpecCoverage(projectName?: string): Promise<SpecCoverageResult>;
  getGuardrails(nodeId?: string, severity?: string): Promise<GraphNode[]>;
  getNxTopology(projectName?: string): Promise<NxTopologyResult>;
}
```

---

## 4. MCP Tool Input/Output Contracts

### 4.1 Tool: query_nodes

```typescript
// Input schema
export interface QueryNodesInput {
  query?: string;            // BM25 search text
  type?: NodeType;           // Filter by node type
  projectName?: string;      // Filter to Nx project
  limit?: number;            // Default: 20, Max: 100
}

// Output
export interface QueryNodesOutput {
  results: Array<{
    id: string;
    type: NodeType;
    label: string;
    path?: string;
    rank: number;
    properties: Record<string, unknown>;
  }>;
  total: number;
  queryTime: number;         // ms
}
```

### 4.2 Tool: get_dependencies

```typescript
// Input schema
export interface GetDependenciesInput {
  nodeId: string;            // Required
  depth?: number;            // Default: 1, Max: 10
  edgeTypes?: EdgeType[];    // Filter to specific edge types
}

// Output
export interface GetDependenciesOutput {
  sourceNode: { id: string; label: string; type: NodeType };
  dependencies: Array<{
    node: { id: string; label: string; type: NodeType };
    edge: { type: EdgeType; properties: Record<string, unknown> };
    hopDistance: number;
  }>;
  total: number;
  depth: number;
}
```

### 4.3 Tool: get_impact

```typescript
// Input schema
export interface GetImpactInput {
  nodeId: string;
  maxDepth?: number;         // Default: 5
}

// Output
export interface GetImpactOutput {
  sourceNode: { id: string; label: string; type: NodeType };
  impact: ImpactResult;
  recommendation: string;   // Human-readable summary for AI context
}
```

### 4.4 Tool: get_spec_coverage

```typescript
// Input schema
export interface GetSpecCoverageInput {
  projectName?: string;       // null = all projects
  includeOrphaned?: boolean;  // Default: true
}

// Output
export interface GetSpecCoverageOutput {
  coverage: SpecCoverageResult;
  message: string;            // Human-readable summary
}
```

---

## 5. Nx Executor Schemas

```typescript
// build-graph executor options
export interface BuildGraphExecutorSchema {
  workspaceRoot: string;
  outputPath: string;       // Default: '{workspaceRoot}/.workspace-graph'
  incremental: boolean;     // Default: true
  verbose: boolean;         // Default: false
}

// query executor options
export interface QueryExecutorSchema {
  query: string;
  type?: NodeType;
  limit?: number;            // Default: 20
  output: 'table' | 'json'; // Default: 'table'
}

// serve-mcp executor options
export interface ServeMcpExecutorSchema {
  transport: 'stdio';        // Only stdio supported in V2
  graphDbPath?: string;      // Default: '{workspaceRoot}/.workspace-graph/graph.db'
}

// check-coverage executor options
export interface CheckCoverageExecutorSchema {
  minCoveragePercent: number; // Default: 80
  projectName?: string;       // null = all projects
  outputReport?: string;      // Path to write JSON report
  failOnOrphaned: boolean;    // Default: false
}
```

---

## 6. Configuration Types

```typescript
export interface WorkspaceGraphV2Config extends WorkspaceGraphConfig {
  // V2 additions
  ast?: {
    batchSize?: number;            // Files per ts-morph batch (default: 50)
    includeCallGraph?: boolean;    // Build CALLS edges (default: true)
    callGraphConfidenceThreshold?: number; // Min confidence to persist (default: 0.3)
  };
  search?: {
    enableFts5?: boolean;          // Use SQLite FTS5 (default: true)
    fallbackToMiniSearch?: boolean; // Fallback if FTS5 unavailable (default: true)
  };
  mcp?: {
    toolTimeout?: number;          // Max ms per tool call (default: 5000)
    maxResultsPerTool?: number;    // Max items per tool response (default: 100)
  };
}
```

---

## 7. Public Library Exports

```typescript
// File: src/index.ts — Public API barrel (V2 only)

// V2 builder and extractors
export { WorkspaceGraphBuilderV2 } from './lib/builder/workspace-graph-builder-v2';
export { AstExtractor } from './lib/ast/ast-extractor';
export { DecoratorAnalyzer } from './lib/ast/decorator-analyzer';
export { ImportResolver } from './lib/ast/import-resolver';
export { GraphTraversal } from './lib/query/graph-traversal';
export { ImpactAnalyzer } from './lib/query/impact-analyzer';
export { QueryEngine } from './lib/query/query-engine';
export { CallGraphBuilder } from './lib/call-graph/call-graph-builder';
export { WorkspaceGraphMcpServer } from './lib/mcp/workspace-graph-mcp-server';

// V2 type exports
export type * from './lib/ast/ast-types';
export type { TraversalOptions, TraversalResult, ImpactResult } from './lib/query/types';
export type { McpServerConfig } from './lib/mcp/types';
export type { WorkspaceGraphV2, WorkspaceGraphV2Config } from './lib/types/config-types';
export type { GraphNodeV2, GraphEdgeV2, NodeType, RelationType } from './lib/types/graph-types';
```
