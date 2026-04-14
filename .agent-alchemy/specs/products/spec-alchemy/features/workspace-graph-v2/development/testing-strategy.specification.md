---
meta:
  id: spec-alchemy-workspace-graph-v2-testing-strategy-specification
  title: Testing Strategy
  version: 0.1.0
  status: draft
  specType: specification
  scope: product:spec-alchemy
  tags: [testing, jest, unit-tests, integration-tests, coverage, fixtures]
  createdBy: Agent Alchemy Developer Agent
  createdAt: '2026-03-20'
  reviewedAt: null
title: Testing Strategy
category: Products
feature: workspace-graph-v2
lastUpdated: '2026-03-20'
source: Agent Alchemy
version: '1.0'
aiContext: true
product: spec-alchemy
phase: development
applyTo: []
keywords: [jest, unit-tests, integration-tests, coverage, fixtures, mocking]
topics: [testing, quality, validation]
useCases: [test-driven-development, ci-quality-gate, coverage-reporting]
---

# Workspace Graph V2 — Testing Strategy

## Testing Philosophy

Workspace-graph V2 is the foundational data layer for Agent Alchemy's code intelligence.
Correctness is non-negotiable. Every algorithm, extractor, and query handler must have
comprehensive tests that cover the happy path, edge cases, and failure modes.

The testing strategy is organised around the **testing pyramid**:

```
          ┌─────────┐
          │   E2E   │  Few, slow, high confidence (MCP server pipeline)
          └────┬────┘
         ┌─────┴──────┐
         │ Integration │  Some, moderate speed (cross-module flows)
         └──────┬──────┘
        ┌───────┴────────┐
        │   Unit Tests   │  Many, fast, isolated (each module)
        └────────────────┘
```

The vast majority of tests are **unit tests** with in-memory fixtures. They run in under
one second per module and give immediate feedback during development.

---

## Coverage Requirements

| Module | Line Coverage | Branch Coverage | Notes |
|--------|--------------|-----------------|-------|
| `ast/` | ≥ 85% | ≥ 80% | High: correctness critical |
| `traversal/` | ≥ 90% | ≥ 85% | High: algorithms must be exact |
| `query/` | ≥ 80% | ≥ 75% | Medium: search is probabilistic |
| `mcp/` | ≥ 75% | ≥ 70% | Medium: I/O boundary, harder to test |
| `builders/` | ≥ 80% | ≥ 75% | High: integration orchestrator |
| `extractors/` | ≥ 80% | ≥ 75% | Medium: some branches are Nx version-dependent |
| `storage/` | ≥ 80% | ≥ 75% | Medium: mostly I/O, use in-memory |
| `validation/` | ≥ 90% | ≥ 85% | High: must catch all invalid states |
| `models/` | N/A | N/A | Pure types, no executable code |

Run coverage locally:

```bash
nx run workspace-graph:test --coverage --coverageReporters=text,html,lcov
# HTML report: coverage/libs/shared/workspace-graph/index.html
```

---

## Test Fixture Files

All fixture TypeScript source code lives in `src/__tests__/fixtures/`. Fixtures are
real TypeScript strings that ts-morph can parse via `useInMemoryFileSystem: true`.

### Fixture 1: `simple-service.ts`

A minimal Angular/NestJS service with two methods.

```typescript
// src/__tests__/fixtures/simple-service.ts
export const SIMPLE_SERVICE_FIXTURE = `
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  private users: string[] = [];

  getUser(id: number): string | undefined {
    return this.users[id];
  }

  addUser(name: string): void {
    this.users.push(name);
  }
}
`;
```

### Fixture 2: `decorated-controller.ts`

A NestJS controller with multiple decorators on class and methods.

```typescript
// src/__tests__/fixtures/decorated-controller.ts
export const DECORATED_CONTROLLER_FIXTURE = `
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@Controller('users')
@ApiTags('Users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  findAll(): string[] {
    return [];
  }

  @Get(':id')
  findOne(@Param('id') id: string): string {
    return id;
  }

  @Post()
  create(@Body() body: CreateUserDto): void {
    this.userService.addUser(body.name);
  }
}
`;
```

### Fixture 3: `service-with-calls.ts`

A service that calls methods on injected dependencies, for CALLS edge testing.

```typescript
// src/__tests__/fixtures/service-with-calls.ts
export const SERVICE_WITH_CALLS_FIXTURE = `
import { Injectable } from '@nestjs/common';
import { EmailService } from './email.service';
import { AuditService } from './audit.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {}

  processOrder(orderId: string): void {
    this.emailService.sendConfirmation(orderId);
    this.auditService.log('order.processed', { orderId });
    const status = this.getStatus(orderId);
    console.log(status);
  }

  private getStatus(orderId: string): string {
    return 'pending';
  }
}
`;
```

### Graph Fixture Builder

`src/__tests__/helpers/graph-fixture-builder.ts` creates small `WorkspaceGraphV2` instances
for traversal and query tests without needing real file extraction:

```typescript
import type { WorkspaceGraphV2, GraphNodeV2, GraphEdgeV2 } from '../../lib/models/workspace-graph-v2';

export function buildFiveNodeGraph(): WorkspaceGraphV2 {
  const nodes = new Map<string, GraphNodeV2>([
    ['node:A', { id: 'node:A', type: 'NestjsService', name: 'A', filePath: 'a.ts', metadata: {} }],
    ['node:B', { id: 'node:B', type: 'NestjsService', name: 'B', filePath: 'b.ts', metadata: {} }],
    ['node:C', { id: 'node:C', type: 'NestjsService', name: 'C', filePath: 'c.ts', metadata: {} }],
    ['node:D', { id: 'node:D', type: 'NestjsModule', name: 'D', filePath: 'd.ts', metadata: {} }],
    ['node:E', { id: 'node:E', type: 'NestjsModule', name: 'E', filePath: 'e.ts', metadata: {} }],
  ]);

  // A → B → D
  // A → C → D
  // D → E
  const edges = new Map<string, GraphEdgeV2>([
    ['e1', { id: 'e1', type: 'DEPENDS_ON', sourceId: 'node:A', targetId: 'node:B', metadata: {} }],
    ['e2', { id: 'e2', type: 'DEPENDS_ON', sourceId: 'node:A', targetId: 'node:C', metadata: {} }],
    ['e3', { id: 'e3', type: 'DEPENDS_ON', sourceId: 'node:B', targetId: 'node:D', metadata: {} }],
    ['e4', { id: 'e4', type: 'DEPENDS_ON', sourceId: 'node:C', targetId: 'node:D', metadata: {} }],
    ['e5', { id: 'e5', type: 'DEPENDS_ON', sourceId: 'node:D', targetId: 'node:E', metadata: {} }],
    ['e6', { id: 'e6', type: 'CONTAINS',   sourceId: 'node:E', targetId: 'node:A', metadata: {} }],
  ]);

  return { nodes, edges, metadata: { version: '2.0', builtAt: new Date().toISOString() } };
}

export function buildCyclicGraph(): WorkspaceGraphV2 {
  const nodes = new Map<string, GraphNodeV2>([
    ['node:X', { id: 'node:X', type: 'NestjsService', name: 'X', filePath: 'x.ts', metadata: {} }],
    ['node:Y', { id: 'node:Y', type: 'NestjsService', name: 'Y', filePath: 'y.ts', metadata: {} }],
    ['node:Z', { id: 'node:Z', type: 'NestjsService', name: 'Z', filePath: 'z.ts', metadata: {} }],
  ]);
  // X → Y → Z → X  (cycle)
  const edges = new Map<string, GraphEdgeV2>([
    ['cx1', { id: 'cx1', type: 'DEPENDS_ON', sourceId: 'node:X', targetId: 'node:Y', metadata: {} }],
    ['cx2', { id: 'cx2', type: 'DEPENDS_ON', sourceId: 'node:Y', targetId: 'node:Z', metadata: {} }],
    ['cx3', { id: 'cx3', type: 'DEPENDS_ON', sourceId: 'node:Z', targetId: 'node:X', metadata: {} }],
  ]);
  return { nodes, edges, metadata: { version: '2.0', builtAt: new Date().toISOString() } };
}
```

---

## Unit Tests

### TypeScriptAstExtractor Tests

Full test suite in `src/lib/ast/ast-extractor.spec.ts`:

```typescript
import { TypeScriptAstExtractor } from './typescript-ast-extractor';
import {
  SIMPLE_SERVICE_FIXTURE,
  DECORATED_CONTROLLER_FIXTURE,
  SERVICE_WITH_CALLS_FIXTURE,
} from '../../__tests__/fixtures';

describe('TypeScriptAstExtractor', () => {
  let extractor: TypeScriptAstExtractor;

  beforeEach(() => {
    extractor = new TypeScriptAstExtractor('tsconfig.json', true);
  });

  describe('class extraction', () => {
    it('should extract class name and export status', () => {
      extractor.addInMemorySourceFile('svc.ts', SIMPLE_SERVICE_FIXTURE);
      const result = extractor.extractFromFile('svc.ts');

      expect(result.classes).toHaveLength(1);
      expect(result.classes[0].name).toBe('UserService');
      expect(result.classes[0].isExported).toBe(true);
    });

    it('should extract class decorators with name and arguments', () => {
      extractor.addInMemorySourceFile('ctrl.ts', DECORATED_CONTROLLER_FIXTURE);
      const result = extractor.extractFromFile('ctrl.ts');
      const cls = result.classes[0];

      const controllerDec = cls.decorators.find((d) => d.name === 'Controller');
      expect(controllerDec).toBeDefined();
      expect(controllerDec?.arguments).toContain("'users'");
    });

    it('should extract method-level decorators', () => {
      extractor.addInMemorySourceFile('ctrl.ts', DECORATED_CONTROLLER_FIXTURE);
      const result = extractor.extractFromFile('ctrl.ts');
      const cls = result.classes[0];
      const findAllMethod = cls.methods.find((m) => m.name === 'findAll');

      expect(findAllMethod?.decorators.map((d) => d.name)).toContain('Get');
    });

    it('should extract method parameters with types', () => {
      extractor.addInMemorySourceFile('ctrl.ts', DECORATED_CONTROLLER_FIXTURE);
      const result = extractor.extractFromFile('ctrl.ts');
      const cls = result.classes[0];
      const findOneMethod = cls.methods.find((m) => m.name === 'findOne');

      expect(findOneMethod?.parameters).toHaveLength(1);
      expect(findOneMethod?.parameters[0].name).toBe('id');
      expect(findOneMethod?.parameters[0].type).toBe('string');
    });

    it('should detect call expressions within methods', () => {
      extractor.addInMemorySourceFile('ord.ts', SERVICE_WITH_CALLS_FIXTURE);
      const result = extractor.extractFromFile('ord.ts');

      expect(result.callSites.length).toBeGreaterThan(0);
      const calledTexts = result.callSites.map((cs) => cs.calleeText);
      expect(calledTexts.some((t) => t.includes('sendConfirmation'))).toBe(true);
    });
  });

  describe('interface extraction', () => {
    it('should extract interface declarations', () => {
      extractor.addInMemorySourceFile(
        'iface.ts',
        `export interface IUserService { getUser(id: number): string; }`,
      );
      const result = extractor.extractFromFile('iface.ts');

      expect(result.interfaces).toHaveLength(1);
      expect(result.interfaces[0].name).toBe('IUserService');
      expect(result.interfaces[0].isExported).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should return empty result for non-existent file and record error', () => {
      const result = extractor.extractFromFile('/does/not/exist.ts');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.classes).toHaveLength(0);
    });
  });
});
```

### BFS Traversal Tests

```typescript
import { BfsAlgorithm } from './bfs-algorithm';
import { buildFiveNodeGraph } from '../../__tests__/helpers/graph-fixture-builder';

describe('BfsAlgorithm', () => {
  let bfs: BfsAlgorithm;
  let graph: WorkspaceGraphV2;

  beforeEach(() => {
    bfs = new BfsAlgorithm();
    graph = buildFiveNodeGraph();
  });

  it('should visit all reachable nodes from node:A', () => {
    const result = bfs.bfs('node:A', graph);
    expect(result.visited).toContain('node:A');
    expect(result.visited).toContain('node:B');
    expect(result.visited).toContain('node:C');
    expect(result.visited).toContain('node:D');
    expect(result.visited).toContain('node:E');
  });

  it('should assign correct depths from start node', () => {
    const result = bfs.bfs('node:A', graph);
    expect(result.depth.get('node:A')).toBe(0);
    expect(result.depth.get('node:B')).toBe(1);
    expect(result.depth.get('node:C')).toBe(1);
    expect(result.depth.get('node:D')).toBe(2);
    expect(result.depth.get('node:E')).toBe(3);
  });

  it('should respect maxDepth option', () => {
    const result = bfs.bfs('node:A', graph, { maxDepth: 1 });
    expect(result.visited).not.toContain('node:D');
    expect(result.visited).not.toContain('node:E');
  });

  it('should return empty result for unknown start node', () => {
    const result = bfs.bfs('node:UNKNOWN', graph);
    expect(result.visited).toHaveLength(0);
  });

  it('should traverse incoming edges when direction=in', () => {
    const result = bfs.bfs('node:D', graph, { direction: 'in' });
    // B and C both point to D
    expect(result.visited).toContain('node:B');
    expect(result.visited).toContain('node:C');
  });
});
```

### DFS Traversal Tests

```typescript
import { DfsAlgorithm } from './dfs-algorithm';
import { buildFiveNodeGraph, buildCyclicGraph } from '../../__tests__/helpers/graph-fixture-builder';

describe('DfsAlgorithm', () => {
  let dfs: DfsAlgorithm;

  beforeEach(() => { dfs = new DfsAlgorithm(); });

  it('should visit all reachable nodes from node:A', () => {
    const result = dfs.dfs('node:A', buildFiveNodeGraph());
    expect(result.visited).toContain('node:E');
  });

  it('should detect a cycle in a cyclic graph', () => {
    const result = dfs.dfs('node:X', buildCyclicGraph());
    expect(result.cyclesDetected).toBe(true);
    expect(result.cyclePaths.length).toBeGreaterThan(0);
  });

  it('should not report cycles in an acyclic graph', () => {
    // Five-node graph has a CONTAINS back edge from E to A — this creates a cycle
    // Use a fresh acyclic 3-node graph
    const g = {
      nodes: new Map([
        ['p', { id: 'p', type: 'NestjsService', name: 'P', filePath: 'p.ts', metadata: {} }],
        ['q', { id: 'q', type: 'NestjsService', name: 'Q', filePath: 'q.ts', metadata: {} }],
        ['r', { id: 'r', type: 'NestjsService', name: 'R', filePath: 'r.ts', metadata: {} }],
      ]),
      edges: new Map([
        ['pq', { id: 'pq', type: 'DEPENDS_ON', sourceId: 'p', targetId: 'q', metadata: {} }],
        ['qr', { id: 'qr', type: 'DEPENDS_ON', sourceId: 'q', targetId: 'r', metadata: {} }],
      ]),
      metadata: { version: '2.0', builtAt: '' },
    } as WorkspaceGraphV2;

    const result = dfs.dfs('p', g);
    expect(result.cyclesDetected).toBe(false);
  });
});
```

### QueryEngine Tests

```typescript
import { QueryEngine } from './query-engine';

describe('QueryEngine', () => {
  let engine: QueryEngine;
  let graph: WorkspaceGraphV2;

  beforeEach(() => {
    graph = buildFiveNodeGraph();
    engine = new QueryEngine(graph);
    engine.buildIndex();
  });

  it('should find a node by name via full-text search', () => {
    const results = engine.search('A');
    expect(results.some((r) => r.nodeId === 'node:A')).toBe(true);
  });

  it('should filter results by node type', () => {
    const results = engine.findByType('NestjsService');
    expect(results.every((n) => n.type === 'NestjsService')).toBe(true);
    expect(results.length).toBe(3); // A, B, C
  });

  it('should find nodes by file path substring', () => {
    const results = engine.findByFile('b.ts');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('B');
  });

  it('should return incoming and outgoing edges for findNeighbors', () => {
    const neighbors = engine.findNeighbors('node:B');
    // B is targeted by A (incoming) and targets D (outgoing)
    expect(neighbors.in.some((e) => e.sourceId === 'node:A')).toBe(true);
    expect(neighbors.out.some((e) => e.targetId === 'node:D')).toBe(true);
  });

  it('should rebuild index after buildIndex is called again', () => {
    engine.buildIndex(); // second call should not throw
    const results = engine.search('E');
    expect(results.length).toBeGreaterThan(0);
  });
});
```

### MCP Tool Handler Tests

```typescript
import { WorkspaceGraphMcpServer } from './workspace-graph-mcp-server';
import { buildFiveNodeGraph } from '../../__tests__/helpers/graph-fixture-builder';

describe('WorkspaceGraphMcpServer handlers', () => {
  let server: WorkspaceGraphMcpServer;

  beforeEach(() => {
    server = new WorkspaceGraphMcpServer(buildFiveNodeGraph());
  });

  it('handleQuery should return matched nodes as JSON', async () => {
    const result = await (server as any).handleQuery({ query: 'A', limit: 5 });
    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(Array.isArray(parsed)).toBe(true);
  });

  it('handleImpact should return impact analysis result', async () => {
    const result = await (server as any).handleImpact({ nodeId: 'node:D' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toHaveProperty('directDependents');
    expect(parsed).toHaveProperty('transitiveDependents');
  });

  it('handleContext should return node with neighbors', async () => {
    const result = await (server as any).handleContext({ nodeId: 'node:B' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.node.id).toBe('node:B');
    expect(parsed.neighbors).toHaveProperty('in');
    expect(parsed.neighbors).toHaveProperty('out');
  });

  it('handleContext should return not-found message for unknown node', async () => {
    const result = await (server as any).handleContext({ nodeId: 'node:UNKNOWN' });
    expect(result.content[0].text).toContain('not found');
  });

  it('handleSkillList should return array of skills', async () => {
    const result = await (server as any).handleSkillList();
    const skills = JSON.parse(result.content[0].text);
    expect(Array.isArray(skills)).toBe(true);
    expect(skills[0]).toHaveProperty('skillId');
  });
});
```

---

## Integration Tests

### Graph Build Pipeline Integration Test

`src/__tests__/integration/graph-build-pipeline.spec.ts`:

```typescript
import { TypeScriptAstExtractor } from '../../lib/ast/typescript-ast-extractor';
import { BfsAlgorithm } from '../../lib/traversal/bfs-algorithm';
import { QueryEngine } from '../../lib/query/query-engine';
import { SIMPLE_SERVICE_FIXTURE, SERVICE_WITH_CALLS_FIXTURE } from '../fixtures';

describe('Graph Build Pipeline (integration)', () => {
  it('should parse fixture files and produce a queryable graph', () => {
    // Arrange
    const extractor = new TypeScriptAstExtractor('tsconfig.json', true);
    extractor.addInMemorySourceFile('user-service.ts', SIMPLE_SERVICE_FIXTURE);
    extractor.addInMemorySourceFile('order-service.ts', SERVICE_WITH_CALLS_FIXTURE);

    // Act: extract and manually build a minimal graph
    const svcResult = extractor.extractFromFile('user-service.ts');
    const ordResult = extractor.extractFromFile('order-service.ts');

    const nodes = new Map();
    const edges = new Map();
    [...svcResult.classes, ...ordResult.classes].forEach((c) => {
      nodes.set(c.id, { id: c.id, type: 'NestjsService', name: c.name, filePath: c.filePath, metadata: {} });
    });

    const graph = { nodes, edges, metadata: { version: '2.0', builtAt: '' } } as WorkspaceGraphV2;

    // Assert: QueryEngine finds both services
    const qe = new QueryEngine(graph);
    qe.buildIndex();
    const results = qe.search('Service');
    expect(results.length).toBeGreaterThanOrEqual(2);
  });

  it('should run BFS traversal on graph after build', () => {
    const extractor = new TypeScriptAstExtractor('tsconfig.json', true);
    extractor.addInMemorySourceFile('a.ts', SIMPLE_SERVICE_FIXTURE);
    const result = extractor.extractFromFile('a.ts');

    const nodes = new Map<string, any>();
    result.classes.forEach((c) => {
      nodes.set(c.id, { id: c.id, type: 'NestjsService', name: c.name, filePath: c.filePath, metadata: {} });
    });
    const graph = { nodes, edges: new Map(), metadata: { version: '2.0', builtAt: '' } } as WorkspaceGraphV2;

    const bfs = new BfsAlgorithm();
    const startId = result.classes[0].id;
    const traversal = bfs.bfs(startId, graph);
    expect(traversal.visited).toContain(startId);
  });
});
```

---

## CI Integration

### Jest Configuration

`jest.config.ts` for the workspace-graph library:

```typescript
export default {
  displayName: 'workspace-graph',
  preset: '../../../../jest.preset.js',
  testEnvironment: 'node',
  transform: { '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }] },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../../coverage/libs/shared/workspace-graph',
  collectCoverageFrom: [
    'src/lib/**/*.ts',
    '!src/lib/**/*.spec.ts',
    '!src/lib/**/index.ts',
    '!src/lib/**/__tests__/**',
  ],
  coverageThresholds: {
    global: { lines: 80, branches: 75, functions: 80, statements: 80 },
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  testMatch: [
    '<rootDir>/src/**/*.spec.ts',
    '<rootDir>/src/**/__tests__/**/*.spec.ts',
  ],
};
```

### GitHub Actions Quality Gate

The CI pipeline enforces coverage thresholds:

```yaml
- name: Test workspace-graph with coverage
  run: nx run workspace-graph:test --coverage --ci

- name: Upload coverage report
  uses: actions/upload-artifact@v3
  with:
    name: workspace-graph-coverage
    path: coverage/libs/shared/workspace-graph/
```

If coverage drops below the thresholds, Jest exits with code 1 and the workflow fails.
