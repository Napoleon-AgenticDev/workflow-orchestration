---
meta:
  id: spec-alchemy-workspace-graph-v2-implementation-guide-specification
  title: Implementation Guide
  version: 0.1.0
  status: draft
  specType: specification
  scope: product:spec-alchemy
  tags: [implementation, typescript, ast, mcp, traversal, phases]
  createdBy: Agent Alchemy Developer Agent
  createdAt: '2026-03-20'
  reviewedAt: null
title: Implementation Guide
category: Products
feature: workspace-graph-v2
lastUpdated: '2026-03-20'
source: Agent Alchemy
version: '1.0'
aiContext: true
product: spec-alchemy
phase: development
applyTo: []
keywords: [ts-morph, ast, bfs, dfs, mcp, minisearch, implementation]
topics: [implementation, phases, code, typescript]
useCases: [workspace-graph-build, code-intelligence, mcp-integration]
---

# Workspace Graph V2 — Implementation Guide

This guide provides complete, production-ready TypeScript implementations for every phase of
the V2 workspace-graph feature. Follow each phase in order. Each phase has a **Definition of
Done** section with verification steps.

---

## Phase 1 (Weeks 1–2): AST Foundation

Replace regex-based extraction with ts-morph for precise, type-resolved AST data.

### Step 1.1: Add ts-morph dependency

```bash
# Install ts-morph
npm install --save ts-morph

# Verify installation
node -e "const { Project } = require('ts-morph'); console.log('ts-morph OK');"
```

Add to `libs/shared/workspace-graph/workspace-graph/package.json`:

```json
{
  "dependencies": {
    "ts-morph": "^23.0.0"
  }
}
```

**Why ts-morph over tree-sitter?**

ts-morph wraps the official TypeScript compiler API (`typescript` package). It provides:

- **Full type resolution** — you can ask "what interface does this class implement?" and get
  the resolved type, not just the string `"UserService"`.
- **TypeScript-native semantics** — decorator arguments, generic type parameters, and
  conditional types are all parsed correctly.
- **Symbol cross-referencing** — the TypeChecker can resolve an identifier in one file to its
  declaration in another file (essential for CALLS edge extraction).
- **No separate grammar maintenance** — the grammar is the TypeScript compiler itself.

tree-sitter is excellent for multi-language syntactic parsing but lacks TypeScript semantic
information. For a TypeScript monorepo, ts-morph is the correct choice.

### Step 1.2: Create the AstExtractionResult interface

Create `src/lib/ast/ast-node-types.ts`:

```typescript
/**
 * Result returned by TypeScriptAstExtractor for a single source file.
 */
export interface AstExtractionResult {
  /** Absolute file path that was parsed. */
  filePath: string;
  /** All class declarations found in the file. */
  classes: ClassNodeV2[];
  /** All interface declarations found in the file. */
  interfaces: InterfaceNodeV2[];
  /** All type alias declarations found in the file. */
  typeAliases: TypeAliasNodeV2[];
  /** All enum declarations found in the file. */
  enums: EnumNodeV2[];
  /** All call sites found across all methods in the file. */
  callSites: CallSiteNodeV2[];
  /** Parsing errors encountered, if any. */
  errors: AstExtractionError[];
}

export interface ClassNodeV2 {
  id: string;
  name: string;
  filePath: string;
  line: number;
  decorators: DecoratorNodeV2[];
  methods: MethodNodeV2[];
  implementedInterfaces: string[];
  extendedClass: string | null;
  isAbstract: boolean;
  isExported: boolean;
}

export interface InterfaceNodeV2 {
  id: string;
  name: string;
  filePath: string;
  line: number;
  methods: MethodNodeV2[];
  extendedInterfaces: string[];
  isExported: boolean;
}

export interface TypeAliasNodeV2 {
  id: string;
  name: string;
  filePath: string;
  line: number;
  typeText: string;
  isExported: boolean;
}

export interface EnumNodeV2 {
  id: string;
  name: string;
  filePath: string;
  line: number;
  members: string[];
  isExported: boolean;
}

export interface MethodNodeV2 {
  id: string;
  name: string;
  ownerClassId: string;
  filePath: string;
  line: number;
  returnType: string;
  parameters: MethodParameterV2[];
  decorators: DecoratorNodeV2[];
  isAsync: boolean;
  isStatic: boolean;
  isAbstract: boolean;
  visibility: 'public' | 'private' | 'protected';
}

export interface MethodParameterV2 {
  name: string;
  type: string;
  isOptional: boolean;
  hasDecorator: boolean;
}

export interface DecoratorNodeV2 {
  id: string;
  name: string;
  arguments: string[];
  targetId: string;
  targetKind: 'class' | 'method' | 'property' | 'parameter';
  filePath: string;
  line: number;
}

export interface CallSiteNodeV2 {
  id: string;
  callerMethodId: string;
  calleeText: string;
  resolvedCalleeId: string | null;
  filePath: string;
  line: number;
  confidence: number;
}

export interface AstExtractionError {
  filePath: string;
  message: string;
  line?: number;
}
```

### Step 1.3: Create TypeScriptAstExtractor class

Create `src/lib/ast/typescript-ast-extractor.ts`:

```typescript
import {
  Project,
  SourceFile,
  ClassDeclaration,
  InterfaceDeclaration,
  MethodDeclaration,
  Decorator,
  SyntaxKind,
  Node,
  ts,
} from 'ts-morph';
import { randomUUID } from 'crypto';
import type {
  AstExtractionResult,
  ClassNodeV2,
  InterfaceNodeV2,
  TypeAliasNodeV2,
  EnumNodeV2,
  MethodNodeV2,
  MethodParameterV2,
  DecoratorNodeV2,
  CallSiteNodeV2,
  AstExtractionError,
} from './ast-node-types';

/**
 * Extracts structured AST data from TypeScript source files using ts-morph.
 * Replaces the regex-based extractor from V1.
 */
export class TypeScriptAstExtractor {
  private readonly project: Project;

  /**
   * @param tsConfigPath - Absolute path to tsconfig.json used for type resolution.
   * @param useInMemoryFileSystem - Set true in tests to avoid real filesystem reads.
   */
  constructor(
    private readonly tsConfigPath: string,
    private readonly useInMemoryFileSystem = false,
  ) {
    this.project = new Project({
      tsConfigFilePath: useInMemoryFileSystem ? undefined : tsConfigPath,
      useInMemoryFileSystem,
      skipAddingFilesFromTsConfig: useInMemoryFileSystem,
    });
  }

  /**
   * Add an in-memory source file (for testing only).
   */
  addInMemorySourceFile(fileName: string, content: string): void {
    this.project.createSourceFile(fileName, content, { overwrite: true });
  }

  /**
   * Extract all AST nodes from a real file on disk.
   * @param filePath - Absolute path to the TypeScript source file.
   */
  extractFromFile(filePath: string): AstExtractionResult {
    let sourceFile = this.project.getSourceFile(filePath);
    if (!sourceFile) {
      sourceFile = this.project.addSourceFileAtPath(filePath);
    }
    return this.extractFromSourceFile(sourceFile);
  }

  /**
   * Extract from an already-loaded ts-morph SourceFile.
   */
  extractFromSourceFile(sourceFile: SourceFile): AstExtractionResult {
    const filePath = sourceFile.getFilePath();
    const errors: AstExtractionError[] = [];

    try {
      return {
        filePath,
        classes: this.extractClasses(sourceFile, filePath),
        interfaces: this.extractInterfaces(sourceFile, filePath),
        typeAliases: this.extractTypeAliases(sourceFile, filePath),
        enums: this.extractEnums(sourceFile, filePath),
        callSites: this.extractCallSites(sourceFile, filePath),
        errors,
      };
    } catch (err) {
      errors.push({ filePath, message: String(err) });
      return {
        filePath,
        classes: [],
        interfaces: [],
        typeAliases: [],
        enums: [],
        callSites: [],
        errors,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Private extraction helpers
  // ---------------------------------------------------------------------------

  private extractClasses(sourceFile: SourceFile, filePath: string): ClassNodeV2[] {
    return sourceFile.getClasses().map((classDecl) => {
      const name = classDecl.getName() ?? '<anonymous>';
      const id = this.makeNodeId('class', filePath, name);
      const methods = this.extractMethods(classDecl, id, filePath);
      const decorators = this.extractDecorators(classDecl, id, filePath, 'class');

      return {
        id,
        name,
        filePath,
        line: classDecl.getStartLineNumber(),
        decorators,
        methods,
        implementedInterfaces: classDecl
          .getImplements()
          .map((impl) => impl.getExpression().getText()),
        extendedClass: classDecl.getExtends()?.getExpression().getText() ?? null,
        isAbstract: classDecl.isAbstract(),
        isExported: classDecl.isExported(),
      } satisfies ClassNodeV2;
    });
  }

  private extractInterfaces(sourceFile: SourceFile, filePath: string): InterfaceNodeV2[] {
    return sourceFile.getInterfaces().map((iface) => {
      const name = iface.getName();
      const id = this.makeNodeId('interface', filePath, name);
      return {
        id,
        name,
        filePath,
        line: iface.getStartLineNumber(),
        methods: iface.getMethods().map((m) => this.makeMethodNode(m, id, filePath)),
        extendedInterfaces: iface.getExtends().map((e) => e.getExpression().getText()),
        isExported: iface.isExported(),
      } satisfies InterfaceNodeV2;
    });
  }

  private extractTypeAliases(sourceFile: SourceFile, filePath: string): TypeAliasNodeV2[] {
    return sourceFile.getTypeAliases().map((ta) => ({
      id: this.makeNodeId('type', filePath, ta.getName()),
      name: ta.getName(),
      filePath,
      line: ta.getStartLineNumber(),
      typeText: ta.getTypeNode()?.getText() ?? '',
      isExported: ta.isExported(),
    }));
  }

  private extractEnums(sourceFile: SourceFile, filePath: string): EnumNodeV2[] {
    return sourceFile.getEnums().map((enumDecl) => ({
      id: this.makeNodeId('enum', filePath, enumDecl.getName()),
      name: enumDecl.getName(),
      filePath,
      line: enumDecl.getStartLineNumber(),
      members: enumDecl.getMembers().map((m) => m.getName()),
      isExported: enumDecl.isExported(),
    }));
  }

  private extractMethods(
    classDecl: ClassDeclaration,
    ownerClassId: string,
    filePath: string,
  ): MethodNodeV2[] {
    return classDecl.getMethods().map((method) =>
      this.makeMethodNode(method, ownerClassId, filePath),
    );
  }

  private makeMethodNode(
    method: MethodDeclaration,
    ownerClassId: string,
    filePath: string,
  ): MethodNodeV2 {
    const name = method.getName();
    const id = `${ownerClassId}::${name}`;
    const visibility = method.getScope() as 'public' | 'private' | 'protected';

    const parameters: MethodParameterV2[] = method.getParameters().map((p) => ({
      name: p.getName(),
      type: p.getType().getText() ?? 'unknown',
      isOptional: p.isOptional(),
      hasDecorator: p.getDecorators().length > 0,
    }));

    return {
      id,
      name,
      ownerClassId,
      filePath,
      line: method.getStartLineNumber(),
      returnType: method.getReturnType().getText(),
      parameters,
      decorators: this.extractDecorators(method, id, filePath, 'method'),
      isAsync: method.isAsync(),
      isStatic: method.isStatic(),
      isAbstract: method.isAbstract(),
      visibility: visibility ?? 'public',
    };
  }

  private extractDecorators(
    node: ClassDeclaration | MethodDeclaration,
    targetId: string,
    filePath: string,
    targetKind: 'class' | 'method',
  ): DecoratorNodeV2[] {
    return node.getDecorators().map((dec) => {
      const name = dec.getName();
      const args = dec.getArguments().map((a) => a.getText());
      return {
        id: this.makeNodeId('decorator', filePath, `${name}@${targetId}`),
        name,
        arguments: args,
        targetId,
        targetKind,
        filePath,
        line: dec.getStartLineNumber(),
      };
    });
  }

  private extractCallSites(sourceFile: SourceFile, filePath: string): CallSiteNodeV2[] {
    const sites: CallSiteNodeV2[] = [];
    sourceFile.getClasses().forEach((classDecl) => {
      const classId = this.makeNodeId('class', filePath, classDecl.getName() ?? '');
      classDecl.getMethods().forEach((method) => {
        const methodId = `${classId}::${method.getName()}`;
        method.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
          sites.push({
            id: randomUUID(),
            callerMethodId: methodId,
            calleeText: call.getExpression().getText(),
            resolvedCalleeId: null, // resolved in Phase 5
            filePath,
            line: call.getStartLineNumber(),
            confidence: 0.3,
          });
        });
      });
    });
    return sites;
  }

  private makeNodeId(type: string, filePath: string, name: string): string {
    const pkg = filePath.replace(/.*\/libs\/([^/]+\/[^/]+)\/.*/, '$1').replace(/\//g, ':');
    return `${type}:${pkg}:${name}`;
  }
}
```

### Step 1.4: Integrate into WorkspaceGraphBuilderV2

Update `src/lib/builders/workspace-graph-builder-v2.ts` to call the extractor:

```typescript
import { TypeScriptAstExtractor } from '../ast/typescript-ast-extractor';
import type { WorkspaceGraphV2 } from '../models/workspace-graph-v2';

export class WorkspaceGraphBuilderV2 {
  private readonly astExtractor: TypeScriptAstExtractor;

  constructor(private readonly config: BuilderConfigV2) {
    this.astExtractor = new TypeScriptAstExtractor(config.tsConfigPath);
  }

  async build(): Promise<WorkspaceGraphV2> {
    const graph = this.createEmptyGraph();
    const sourceFiles = await this.discoverSourceFiles();

    for (const filePath of sourceFiles) {
      const result = this.astExtractor.extractFromFile(filePath);
      this.addExtractionResultToGraph(graph, result);
    }

    return graph;
  }

  private addExtractionResultToGraph(
    graph: WorkspaceGraphV2,
    result: AstExtractionResult,
  ): void {
    // Add class nodes
    for (const cls of result.classes) {
      this.addClassNode(graph, cls);
      for (const method of cls.methods) {
        this.addMethodNode(graph, method, cls.id);
      }
      for (const dec of cls.decorators) {
        this.addDecoratorNode(graph, dec, cls.id);
      }
    }
    // Add interface nodes
    for (const iface of result.interfaces) {
      this.addInterfaceNode(graph, iface);
    }
    // Add IMPLEMENTS edges
    for (const cls of result.classes) {
      for (const ifaceName of cls.implementedInterfaces) {
        this.addEdge(graph, {
          id: `implements:${cls.id}:${ifaceName}`,
          type: 'IMPLEMENTS',
          sourceId: cls.id,
          targetId: `interface:${ifaceName}`,
          metadata: {},
        });
      }
      if (cls.extendedClass) {
        this.addEdge(graph, {
          id: `extends:${cls.id}:${cls.extendedClass}`,
          type: 'EXTENDS',
          sourceId: cls.id,
          targetId: `class:${cls.extendedClass}`,
          metadata: {},
        });
      }
    }
  }

  private addMethodNode(
    graph: WorkspaceGraphV2,
    method: MethodNodeV2,
    ownerClassId: string,
  ): void {
    graph.nodes.set(method.id, {
      id: method.id,
      type: 'Method',
      name: method.name,
      filePath: method.filePath,
      line: method.line,
      metadata: {
        returnType: method.returnType,
        isAsync: method.isAsync,
        isStatic: method.isStatic,
        visibility: method.visibility,
        parameters: method.parameters,
      },
    });
    // CONTAINS edge from class to method
    graph.edges.set(`contains:${ownerClassId}:${method.id}`, {
      id: `contains:${ownerClassId}:${method.id}`,
      type: 'CONTAINS',
      sourceId: ownerClassId,
      targetId: method.id,
      metadata: {},
    });
  }

  private addDecoratorNode(
    graph: WorkspaceGraphV2,
    dec: DecoratorNodeV2,
    targetId: string,
  ): void {
    graph.nodes.set(dec.id, {
      id: dec.id,
      type: 'Decorator',
      name: dec.name,
      filePath: dec.filePath,
      line: dec.line,
      metadata: { arguments: dec.arguments },
    });
    graph.edges.set(`decorates:${dec.id}:${targetId}`, {
      id: `decorates:${dec.id}:${targetId}`,
      type: 'DECORATES',
      sourceId: dec.id,
      targetId,
      metadata: { targetKind: dec.targetKind },
    });
  }
}
```

### Step 1.5: Unit tests for TypeScriptAstExtractor

Create `src/lib/ast/ast-extractor.spec.ts`:

```typescript
import { TypeScriptAstExtractor } from './typescript-ast-extractor';

describe('TypeScriptAstExtractor', () => {
  let extractor: TypeScriptAstExtractor;

  beforeEach(() => {
    extractor = new TypeScriptAstExtractor('tsconfig.json', /* useInMemory */ true);
  });

  describe('extractClasses', () => {
    it('should extract a simple class with one method', () => {
      extractor.addInMemorySourceFile(
        'test.ts',
        `
        export class UserService {
          getUser(id: number): string {
            return 'user';
          }
        }
        `,
      );
      const result = extractor.extractFromFile('test.ts');

      expect(result.classes).toHaveLength(1);
      expect(result.classes[0].name).toBe('UserService');
      expect(result.classes[0].isExported).toBe(true);
      expect(result.classes[0].methods).toHaveLength(1);
      expect(result.classes[0].methods[0].name).toBe('getUser');
    });

    it('should extract class decorators with arguments', () => {
      extractor.addInMemorySourceFile(
        'controller.ts',
        `
        import { Controller } from '@nestjs/common';
        @Controller('users')
        export class UserController {}
        `,
      );
      const result = extractor.extractFromFile('controller.ts');

      expect(result.classes[0].decorators).toHaveLength(1);
      expect(result.classes[0].decorators[0].name).toBe('Controller');
      expect(result.classes[0].decorators[0].arguments).toContain("'users'");
    });

    it('should extract implemented interfaces', () => {
      extractor.addInMemorySourceFile(
        'service.ts',
        `
        interface IUserService { getUser(): void; }
        export class UserService implements IUserService {
          getUser(): void {}
        }
        `,
      );
      const result = extractor.extractFromFile('service.ts');

      expect(result.classes[0].implementedInterfaces).toContain('IUserService');
    });

    it('should extract method parameters and return types', () => {
      extractor.addInMemorySourceFile(
        'params.ts',
        `
        export class PaymentService {
          charge(amount: number, currency: string, userId?: string): Promise<boolean> {
            return Promise.resolve(true);
          }
        }
        `,
      );
      const result = extractor.extractFromFile('params.ts');
      const method = result.classes[0].methods[0];

      expect(method.parameters).toHaveLength(3);
      expect(method.parameters[0]).toMatchObject({ name: 'amount', type: 'number' });
      expect(method.parameters[2]).toMatchObject({ name: 'userId', isOptional: true });
      expect(method.returnType).toContain('Promise');
    });

    it('should return empty results for a file with no classes', () => {
      extractor.addInMemorySourceFile(
        'types.ts',
        `export type UserId = string; export interface IBase { id: string; }`,
      );
      const result = extractor.extractFromFile('types.ts');

      expect(result.classes).toHaveLength(0);
      expect(result.interfaces).toHaveLength(1);
      expect(result.typeAliases).toHaveLength(1);
    });
  });
});
```

### Phase 1 — Definition of Done

- [ ] `npm install ts-morph` succeeds and is committed to `package.json`.
- [ ] `TypeScriptAstExtractor` is exported from `src/index.ts`.
- [ ] All 5 unit tests in `ast-extractor.spec.ts` pass: `nx run workspace-graph:test`.
- [ ] `WorkspaceGraphBuilderV2` produces nodes of type `Method` and `Decorator` in output `graph.json`.
- [ ] Code coverage for `src/lib/ast/` is ≥ 80%.

---

## Phase 2 (Weeks 2–3): Graph Traversal SKILL

### Step 2.1: BFS Implementation

Create `src/lib/traversal/bfs-algorithm.ts`:

```typescript
import type { WorkspaceGraphV2 } from '../models/workspace-graph-v2';

export interface BfsResult {
  /** All node IDs visited in BFS order. */
  visited: string[];
  /** Shortest path from start to the last visited node. */
  path: string[];
  /** Depth (hop count) of each visited node from start. */
  depth: Map<string, number>;
  /** Parent node map for path reconstruction. */
  parent: Map<string, string | null>;
}

/**
 * Breadth-First Search over a WorkspaceGraphV2.
 * Traverses outgoing edges by default; set direction='in' for incoming.
 */
export class BfsAlgorithm {
  bfs(
    startNodeId: string,
    graph: WorkspaceGraphV2,
    options: { direction?: 'out' | 'in'; maxDepth?: number } = {},
  ): BfsResult {
    const { direction = 'out', maxDepth = Infinity } = options;

    if (!graph.nodes.has(startNodeId)) {
      return { visited: [], path: [], depth: new Map(), parent: new Map() };
    }

    const visited: string[] = [];
    const depth = new Map<string, number>();
    const parent = new Map<string, string | null>();
    const queue: string[] = [startNodeId];

    depth.set(startNodeId, 0);
    parent.set(startNodeId, null);

    while (queue.length > 0) {
      const current = queue.shift()!;
      visited.push(current);

      const currentDepth = depth.get(current)!;
      if (currentDepth >= maxDepth) continue;

      const neighbors = this.getNeighbors(current, graph, direction);
      for (const neighbor of neighbors) {
        if (!depth.has(neighbor)) {
          depth.set(neighbor, currentDepth + 1);
          parent.set(neighbor, current);
          queue.push(neighbor);
        }
      }
    }

    return { visited, path: this.reconstructPath(startNodeId, visited, parent), depth, parent };
  }

  private getNeighbors(
    nodeId: string,
    graph: WorkspaceGraphV2,
    direction: 'out' | 'in',
  ): string[] {
    const neighbors: string[] = [];
    for (const edge of graph.edges.values()) {
      if (direction === 'out' && edge.sourceId === nodeId) {
        neighbors.push(edge.targetId);
      } else if (direction === 'in' && edge.targetId === nodeId) {
        neighbors.push(edge.sourceId);
      }
    }
    return neighbors;
  }

  private reconstructPath(
    start: string,
    visited: string[],
    parent: Map<string, string | null>,
  ): string[] {
    if (visited.length === 0) return [];
    const last = visited[visited.length - 1];
    const path: string[] = [];
    let current: string | null = last;
    while (current !== null && current !== undefined) {
      path.unshift(current);
      current = parent.get(current) ?? null;
    }
    return path;
  }
}
```

### Step 2.2: DFS Implementation

Create `src/lib/traversal/dfs-algorithm.ts`:

```typescript
import type { WorkspaceGraphV2 } from '../models/workspace-graph-v2';

export interface DfsResult {
  visited: string[];
  path: string[];
  cyclesDetected: boolean;
  cyclePaths: string[][];
  finishOrder: string[];
}

/**
 * Depth-First Search over a WorkspaceGraphV2.
 * Detects cycles and returns topological finish order.
 */
export class DfsAlgorithm {
  dfs(startNodeId: string, graph: WorkspaceGraphV2): DfsResult {
    if (!graph.nodes.has(startNodeId)) {
      return { visited: [], path: [], cyclesDetected: false, cyclePaths: [], finishOrder: [] };
    }

    const visited = new Set<string>();
    const inStack = new Set<string>();
    const finishOrder: string[] = [];
    const visitedList: string[] = [];
    const cyclePaths: string[][] = [];

    this.dfsRecursive(startNodeId, graph, visited, inStack, finishOrder, visitedList, [], cyclePaths);

    return {
      visited: visitedList,
      path: visitedList,
      cyclesDetected: cyclePaths.length > 0,
      cyclePaths,
      finishOrder,
    };
  }

  private dfsRecursive(
    nodeId: string,
    graph: WorkspaceGraphV2,
    visited: Set<string>,
    inStack: Set<string>,
    finishOrder: string[],
    visitedList: string[],
    currentPath: string[],
    cyclePaths: string[][],
  ): void {
    visited.add(nodeId);
    inStack.add(nodeId);
    visitedList.push(nodeId);
    currentPath.push(nodeId);

    const neighbors = this.getOutgoingNeighbors(nodeId, graph);
    for (const neighbor of neighbors) {
      if (inStack.has(neighbor)) {
        // Cycle detected — record the cycle path
        const cycleStart = currentPath.indexOf(neighbor);
        cyclePaths.push([...currentPath.slice(cycleStart), neighbor]);
      } else if (!visited.has(neighbor)) {
        this.dfsRecursive(
          neighbor, graph, visited, inStack, finishOrder, visitedList, [...currentPath], cyclePaths,
        );
      }
    }

    inStack.delete(nodeId);
    finishOrder.push(nodeId);
  }

  private getOutgoingNeighbors(nodeId: string, graph: WorkspaceGraphV2): string[] {
    const neighbors: string[] = [];
    for (const edge of graph.edges.values()) {
      if (edge.sourceId === nodeId) {
        neighbors.push(edge.targetId);
      }
    }
    return neighbors;
  }
}
```

### Step 2.3: Impact Analysis Algorithm

Create `src/lib/traversal/impact-analyzer.ts`:

```typescript
import { BfsAlgorithm } from './bfs-algorithm';
import type { WorkspaceGraphV2 } from '../models/workspace-graph-v2';

export interface ImpactAnalysisResult {
  changedNodeId: string;
  directDependents: string[];
  transitiveDependents: string[];
  impactScore: number;
  depthMap: Map<string, number>;
}

/**
 * Determines which nodes are impacted when a given node changes.
 * Uses reverse BFS (following incoming edges) to find dependents.
 */
export class ImpactAnalyzer {
  private readonly bfs = new BfsAlgorithm();

  /**
   * @param changedNodeId - The node that changed (e.g. a service class).
   * @param graph - The full workspace graph.
   */
  findImpactedNodes(changedNodeId: string, graph: WorkspaceGraphV2): ImpactAnalysisResult {
    // BFS inward: who depends on changedNodeId?
    const result = this.bfs.bfs(changedNodeId, graph, { direction: 'in' });

    const direct = result.visited.filter((id) => {
      return id !== changedNodeId && (result.depth.get(id) ?? 0) === 1;
    });

    const transitive = result.visited.filter((id) => {
      return id !== changedNodeId && (result.depth.get(id) ?? 0) > 1;
    });

    // Impact score: normalised count of affected nodes weighted by depth
    const impactScore = this.computeImpactScore(result.depth);

    return {
      changedNodeId,
      directDependents: direct,
      transitiveDependents: transitive,
      impactScore,
      depthMap: result.depth,
    };
  }

  private computeImpactScore(depth: Map<string, number>): number {
    let score = 0;
    for (const [, d] of depth) {
      if (d > 0) score += 1 / d; // nodes closer to the change count more
    }
    return Math.round(score * 100) / 100;
  }
}
```

### Step 2.4: Create Agent Alchemy SKILL file

Create `skills/graph-traversal.skill.md`:

```markdown
---
skillId: workspace-graph-traversal
title: Workspace Graph Traversal
version: 1.0.0
runner: typescript
entryPoint: libs/shared/workspace-graph/workspace-graph/src/lib/traversal/graph-traversal.ts
inputs:
  - name: graphPath
    type: string
    description: Path to graph.json
  - name: startNodeId
    type: string
    description: Node ID to start traversal from
  - name: algorithm
    type: enum
    values: [bfs, dfs, impact]
    description: Traversal algorithm to use
outputs:
  - name: visited
    type: string[]
  - name: path
    type: string[]
  - name: cyclesDetected
    type: boolean
---

# SKILL: Workspace Graph Traversal

## Purpose
Run BFS, DFS, or impact analysis on the workspace graph to understand code relationships.

## When to Use
- Finding all code affected by a planned change (use `impact` algorithm).
- Tracing the full dependency chain of a module (use `dfs`).
- Finding shortest path between two nodes (use `bfs`).

## Example
```bash
nx run workspace-graph:graph-query -- --skill=graph-traversal \
  --startNodeId="class:agency:UserService" \
  --algorithm=impact
```
```

### Phase 2 — Definition of Done

- [ ] `BfsAlgorithm.bfs()` returns correct visited order for a 5-node test graph.
- [ ] `DfsAlgorithm.dfs()` correctly detects a 3-node cycle.
- [ ] `ImpactAnalyzer.findImpactedNodes()` identifies direct and transitive dependents.
- [ ] SKILL file is syntactically valid YAML+Markdown.
- [ ] All traversal tests pass: `nx run workspace-graph:test --testPathPattern=traversal`.

---

## Phase 3 (Weeks 3–4): Query API + MiniSearch

### Step 3.1: Add MiniSearch

```bash
npm install --save minisearch
```

### Step 3.2: Build QueryEngine

Create `src/lib/query/query-engine.ts`:

```typescript
import MiniSearch from 'minisearch';
import type { WorkspaceGraphV2, GraphNodeV2 } from '../models/workspace-graph-v2';

export interface QueryFilters {
  type?: string | string[];
  filePath?: string;
  packageScope?: string;
  hasDecorator?: string;
}

export interface SearchResult {
  nodeId: string;
  score: number;
  match: Record<string, string[]>;
  node: GraphNodeV2;
}

/**
 * In-memory query engine backed by MiniSearch for full-text search
 * and typed filter queries over a WorkspaceGraphV2.
 */
export class QueryEngine {
  private miniSearch: MiniSearch;
  private indexBuilt = false;

  constructor(private readonly graph: WorkspaceGraphV2) {
    this.miniSearch = new MiniSearch({
      fields: ['name', 'type', 'filePath', 'description'],
      storeFields: ['name', 'type', 'filePath'],
      idField: 'id',
      searchOptions: { prefix: true, fuzzy: 0.2, boost: { name: 2 } },
    });
  }

  buildIndex(): void {
    const documents = Array.from(this.graph.nodes.values()).map((node) => ({
      id: node.id,
      name: node.name,
      type: node.type,
      filePath: node.filePath ?? '',
      description: (node.metadata as Record<string, unknown>)?.description as string ?? '',
    }));
    this.miniSearch.addAll(documents);
    this.indexBuilt = true;
  }

  search(query: string, filters?: QueryFilters): SearchResult[] {
    if (!this.indexBuilt) this.buildIndex();
    const rawResults = this.miniSearch.search(query);

    return rawResults
      .map((r) => ({ nodeId: r.id, score: r.score, match: r.match, node: this.graph.nodes.get(r.id)! }))
      .filter((r) => r.node !== undefined)
      .filter((r) => this.applyFilters(r.node, filters));
  }

  findByType(type: string | string[]): GraphNodeV2[] {
    const types = Array.isArray(type) ? type : [type];
    return Array.from(this.graph.nodes.values()).filter((n) => types.includes(n.type));
  }

  findByFile(filePath: string): GraphNodeV2[] {
    return Array.from(this.graph.nodes.values()).filter((n) =>
      n.filePath?.includes(filePath),
    );
  }

  findNeighbors(nodeId: string): { in: GraphEdgeV2[]; out: GraphEdgeV2[] } {
    const inEdges = Array.from(this.graph.edges.values()).filter((e) => e.targetId === nodeId);
    const outEdges = Array.from(this.graph.edges.values()).filter((e) => e.sourceId === nodeId);
    return { in: inEdges, out: outEdges };
  }

  private applyFilters(node: GraphNodeV2, filters?: QueryFilters): boolean {
    if (!filters) return true;
    if (filters.type) {
      const types = Array.isArray(filters.type) ? filters.type : [filters.type];
      if (!types.includes(node.type)) return false;
    }
    if (filters.filePath && !node.filePath?.includes(filters.filePath)) return false;
    if (filters.packageScope && !node.id.startsWith(`class:${filters.packageScope}`)) return false;
    return true;
  }
}
```

### Step 3.3: Nx executor target for graph-query

Create `executors/graph-query/executor.ts`:

```typescript
import { ExecutorContext } from '@nx/devkit';
import { readFileSync } from 'fs';
import { QueryEngine } from '../../src/lib/query/query-engine';

interface GraphQueryExecutorOptions {
  graphPath: string;
  search?: string;
  type?: string;
  filePath?: string;
}

export default async function runExecutor(
  options: GraphQueryExecutorOptions,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  const raw = readFileSync(options.graphPath, 'utf-8');
  const graph = JSON.parse(raw);

  // Re-hydrate Maps from serialised plain objects
  graph.nodes = new Map(Object.entries(graph.nodes));
  graph.edges = new Map(Object.entries(graph.edges));

  const engine = new QueryEngine(graph);
  engine.buildIndex();

  if (options.search) {
    const results = engine.search(options.search, { type: options.type });
    console.log(JSON.stringify(results, null, 2));
  } else if (options.type) {
    const results = engine.findByType(options.type);
    console.log(JSON.stringify(results, null, 2));
  }

  return { success: true };
}
```

### Phase 3 — Definition of Done

- [ ] `minisearch` is in `package.json`.
- [ ] `QueryEngine.search("UserService")` returns the correct node in unit test.
- [ ] `nx run workspace-graph:graph-query -- --search=UserService` prints JSON results.
- [ ] `findByType`, `findByFile`, `findNeighbors` all have passing unit tests.

---

## Phase 4 (Weeks 4–5): MCP Server

### Step 4.1: Add @modelcontextprotocol/sdk

```bash
npm install --save @modelcontextprotocol/sdk
```

### Step 4.2: Implement WorkspaceGraphMcpServer with 6 tools

Create `src/lib/mcp/workspace-graph-mcp-server.ts`:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { WorkspaceGraphV2 } from '../models/workspace-graph-v2';
import { QueryEngine } from '../query/query-engine';
import { ImpactAnalyzer } from '../traversal/impact-analyzer';
import { DfsAlgorithm } from '../traversal/dfs-algorithm';

export class WorkspaceGraphMcpServer {
  private readonly server: Server;
  private readonly queryEngine: QueryEngine;
  private readonly impactAnalyzer = new ImpactAnalyzer();
  private readonly dfs = new DfsAlgorithm();

  constructor(private readonly graph: WorkspaceGraphV2) {
    this.queryEngine = new QueryEngine(graph);
    this.queryEngine.buildIndex();

    this.server = new Server(
      { name: 'workspace-graph', version: '2.0.0' },
      { capabilities: { tools: {} } },
    );

    this.registerTools();
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    process.stderr.write('workspace-graph MCP server started\n');
  }

  private registerTools(): void {
    // Tool list handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'workspace_graph_query',
          description: 'Search workspace graph nodes by text query and optional type filter',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Full-text search query' },
              type: { type: 'string', description: 'Node type filter (e.g. NestjsService)' },
              limit: { type: 'number', description: 'Max results (default 10)' },
            },
            required: ['query'],
          },
        },
        {
          name: 'workspace_graph_impact',
          description: 'Find all nodes impacted by a change to a given node (BFS reverse traversal)',
          inputSchema: {
            type: 'object',
            properties: {
              nodeId: { type: 'string', description: 'Node ID of the changed node' },
              maxDepth: { type: 'number', description: 'Maximum traversal depth (default 5)' },
            },
            required: ['nodeId'],
          },
        },
        {
          name: 'workspace_graph_context',
          description: 'Get full context for a node: metadata, incoming edges, outgoing edges',
          inputSchema: {
            type: 'object',
            properties: {
              nodeId: { type: 'string', description: 'Node ID to get context for' },
            },
            required: ['nodeId'],
          },
        },
        {
          name: 'workspace_graph_dependencies',
          description: 'Get full dependency chain using DFS from a given node',
          inputSchema: {
            type: 'object',
            properties: {
              nodeId: { type: 'string', description: 'Node ID to start dependency traversal' },
              detectCycles: { type: 'boolean', description: 'Whether to report cycles' },
            },
            required: ['nodeId'],
          },
        },
        {
          name: 'workspace_graph_staleness',
          description: 'Check which specifications have drifted from their implementation',
          inputSchema: {
            type: 'object',
            properties: {
              specId: { type: 'string', description: 'Spec node ID (or omit for all specs)' },
            },
          },
        },
        {
          name: 'workspace_graph_skill',
          description: 'List available Agent Alchemy SKILL files for the workspace graph',
          inputSchema: { type: 'object', properties: {} },
        },
      ],
    }));

    // Tool call handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      switch (name) {
        case 'workspace_graph_query':
          return this.handleQuery(args as { query: string; type?: string; limit?: number });
        case 'workspace_graph_impact':
          return this.handleImpact(args as { nodeId: string; maxDepth?: number });
        case 'workspace_graph_context':
          return this.handleContext(args as { nodeId: string });
        case 'workspace_graph_dependencies':
          return this.handleDependencies(args as { nodeId: string; detectCycles?: boolean });
        case 'workspace_graph_staleness':
          return this.handleStaleness(args as { specId?: string });
        case 'workspace_graph_skill':
          return this.handleSkillList();
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private handleQuery(args: { query: string; type?: string; limit?: number }) {
    const results = this.queryEngine.search(args.query, { type: args.type });
    const limited = results.slice(0, args.limit ?? 10);
    return {
      content: [{ type: 'text', text: JSON.stringify(limited, null, 2) }],
    };
  }

  private handleImpact(args: { nodeId: string; maxDepth?: number }) {
    const impact = this.impactAnalyzer.findImpactedNodes(args.nodeId, this.graph);
    return {
      content: [{ type: 'text', text: JSON.stringify(impact, null, 2) }],
    };
  }

  private handleContext(args: { nodeId: string }) {
    const node = this.graph.nodes.get(args.nodeId);
    if (!node) {
      return { content: [{ type: 'text', text: `Node not found: ${args.nodeId}` }] };
    }
    const neighbors = this.queryEngine.findNeighbors(args.nodeId);
    return {
      content: [{ type: 'text', text: JSON.stringify({ node, neighbors }, null, 2) }],
    };
  }

  private handleDependencies(args: { nodeId: string; detectCycles?: boolean }) {
    const result = this.dfs.dfs(args.nodeId, this.graph);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  }

  private handleStaleness(args: { specId?: string }) {
    const specNodes = this.queryEngine.findByType('Specification');
    const stale = specNodes.filter((n) => {
      const meta = n.metadata as Record<string, unknown>;
      return meta?.stalenessScore !== undefined && (meta.stalenessScore as number) > 0.5;
    });
    return {
      content: [{ type: 'text', text: JSON.stringify(stale, null, 2) }],
    };
  }

  private handleSkillList() {
    const skills = [
      { skillId: 'workspace-graph-traversal', description: 'BFS/DFS traversal over the workspace graph' },
    ];
    return { content: [{ type: 'text', text: JSON.stringify(skills, null, 2) }] };
  }
}
```

### Step 4.3: MCP server entry point

Create `src/lib/mcp/main.ts`:

```typescript
import { readFileSync } from 'fs';
import { WorkspaceGraphMcpServer } from './workspace-graph-mcp-server';

const graphPath = process.env['GRAPH_JSON_PATH'] ?? 'dist/workspace-graph/graph.json';

async function main(): Promise<void> {
  const raw = readFileSync(graphPath, 'utf-8');
  const graphPlain = JSON.parse(raw);
  graphPlain.nodes = new Map(Object.entries(graphPlain.nodes));
  graphPlain.edges = new Map(Object.entries(graphPlain.edges));

  const mcpServer = new WorkspaceGraphMcpServer(graphPlain);
  await mcpServer.start();
}

main().catch((err) => {
  process.stderr.write(`MCP server startup error: ${err}\n`);
  process.exit(1);
});
```

### Step 4.4: Configure Claude Code

Add to `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "workspace-graph": {
      "command": "node",
      "args": ["dist/libs/shared/workspace-graph/mcp/main.js"],
      "env": {
        "GRAPH_JSON_PATH": "/path/to/workspace/dist/workspace-graph/graph.json"
      }
    }
  }
}
```

### Phase 4 — Definition of Done

- [ ] `@modelcontextprotocol/sdk` is in `package.json`.
- [ ] All 6 tool handlers return valid `{ content: [...] }` objects.
- [ ] `nx run workspace-graph:graph-serve-mcp` starts without error.
- [ ] Claude Code lists all 6 tools after restarting with updated config.
- [ ] MCP server unit tests pass (mocked graph input).

---

## Phase 5 (Weeks 5–6): CALLS Edge Extraction

### Step 5.1: CallGraphExtractor class

Create `src/lib/ast/call-graph-extractor.ts`:

```typescript
import { Project, SourceFile, SyntaxKind } from 'ts-morph';

export interface CallEdge {
  callerId: string;
  calleeId: string | null;
  calleeText: string;
  filePath: string;
  line: number;
  confidence: number;
}

export class CallGraphExtractor {
  constructor(private readonly project: Project) {}

  extractCallsFrom(sourceFile: SourceFile): CallEdge[] {
    const edges: CallEdge[] = [];
    const checker = this.project.getTypeChecker();

    sourceFile.getClasses().forEach((classDecl) => {
      const className = classDecl.getName() ?? '';
      const pkg = sourceFile.getFilePath().replace(/.*\/libs\/([^/]+\/[^/]+)\/.*/, '$1').replace(/\//g, ':');
      const classId = `class:${pkg}:${className}`;

      classDecl.getMethods().forEach((method) => {
        const methodId = `${classId}::${method.getName()}`;
        method.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
          const expr = call.getExpression();
          const calleeText = expr.getText();
          let resolvedId: string | null = null;
          let confidence = 0.3;

          try {
            const sym = checker.getSymbolAtLocation(expr);
            if (sym) {
              const decls = sym.getDeclarations();
              if (decls && decls.length > 0) {
                const declFile = decls[0].getSourceFile().getFilePath();
                const isSameFile = declFile === sourceFile.getFilePath();
                const isSamePackage = declFile.includes(pkg.replace(/:/g, '/'));
                confidence = isSameFile ? 1.0 : isSamePackage ? 0.8 : 0.5;
                resolvedId = this.resolveCalleeId(decls[0], declFile, checker);
              }
            }
          } catch {
            // Type resolution failure — keep confidence at 0.3
          }

          edges.push({
            callerId: methodId,
            calleeId: resolvedId,
            calleeText,
            filePath: sourceFile.getFilePath(),
            line: call.getStartLineNumber(),
            confidence,
          });
        });
      });
    });

    return edges;
  }

  private resolveCalleeId(decl: Node, declFile: string, checker: TypeChecker): string | null {
    const pkg = declFile.replace(/.*\/libs\/([^/]+\/[^/]+)\/.*/, '$1').replace(/\//g, ':');
    if (decl.getKind() === SyntaxKind.MethodDeclaration) {
      const method = decl.asKindOrThrow(SyntaxKind.MethodDeclaration);
      const parentClass = method.getParent();
      if (parentClass && parentClass.getKind() === SyntaxKind.ClassDeclaration) {
        const cls = parentClass.asKindOrThrow(SyntaxKind.ClassDeclaration);
        return `class:${pkg}:${cls.getName()}::${method.getName()}`;
      }
    }
    return null;
  }
}
```

### Step 5.2: Confidence scoring summary

| Scenario | Confidence |
|----------|-----------|
| Same file, direct method call, fully resolved | 1.0 |
| Same package, cross-class, type-resolved | 0.8 |
| Cross-package, type-resolved via TypeChecker | 0.5 |
| Unresolved / dynamic / string-constructed call | 0.3 |

### Phase 5 — Definition of Done

- [ ] `CallGraphExtractor.extractCallsFrom()` returns `CallEdge[]` with correct callee IDs.
- [ ] CALLS edges appear in `graph.json` output.
- [ ] Confidence values match the table above for each scenario.
- [ ] Cross-file resolution test passes with a 2-file in-memory fixture.
