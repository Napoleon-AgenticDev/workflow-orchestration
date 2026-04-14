---
meta:
  id: spec-alchemy-workspace-graph-v2-success-metrics-specification
  title: Success Metrics Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: product:spec-alchemy
  tags: [workspace-graph-v2, plan, kpi, metrics, success-criteria]
  createdBy: Agent Alchemy Developer Agent
  createdAt: '2026-03-20'
  reviewedAt: null
title: Success Metrics Specification
category: Products
feature: workspace-graph-v2
lastUpdated: '2026-03-20'
source: Agent Alchemy
version: '1.0'
aiContext: true
product: spec-alchemy
phase: plan
applyTo: []
keywords: [kpi, metrics, performance, test-coverage, accuracy]
topics: [workspace-graph-v2, success-measurement, benchmarks]
---

# Workspace Graph V2: Success Metrics Specification

**Version:** 1.0.0  
**Date:** 2026-03-20  
**Status:** Planning  
**Category:** Success Metrics and KPIs  

---

## Overview

This document defines quantitative success metrics for workspace-graph-v2 across four dimensions: **Performance**, **Accuracy**, **Integration Quality**, and **Code Quality**. Each metric includes a target, a measurement methodology, and the phase when it first becomes measurable.

---

## 1. Performance Metrics

### KPI-P1: AST Extraction Per-File Performance

| Metric | Target | Failure Threshold | Phase |
|--------|--------|------------------|-------|
| Time to extract a 500-line TypeScript file | <50ms | >200ms | Phase 1 |
| Time to extract 200 files (full scan) | <30 seconds | >120 seconds | Phase 4 |
| Memory usage during 200-file extraction | <500MB peak | >1GB | Phase 4 |
| Memory after extraction (no leaks) | <150MB (baseline) | Grows unbounded | Phase 4 |

**Measurement method:**

```typescript
// Jest benchmark test in ast/typescript-ast-extractor.spec.ts
describe('Performance', () => {
  it('extracts a 500-line file in <50ms', () => {
    const content = readFileSync('test-fixtures/large-service.ts', 'utf-8');
    const start = performance.now();
    const extractor = new TypeScriptAstExtractor();
    extractor.extractFromFile('test.ts', content);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(50); // ms
  });
});
```

---

### KPI-P2: BFS/DFS Traversal Performance

| Metric | Target | Failure Threshold | Phase |
|--------|--------|------------------|-------|
| BFS traversal, 5 hops, 1,000 connected nodes | <50ms | >200ms | Phase 2 |
| BFS traversal, 3 hops, 10,000 node graph | <100ms | >500ms | Phase 2 |
| Cycle detection on 10,000-node import graph | <200ms | >1 second | Phase 2 |
| Shortest path, 10-hop graph | <100ms | >500ms | Phase 2 |

**Measurement method:**

```typescript
// Synthetic graph performance benchmark
describe('GraphTraversal Performance', () => {
  let graph: TestGraph;

  beforeAll(() => {
    graph = TestGraphFactory.createLinearChain(1000); // 1000 nodes, 5 hops deep
  });

  it('completes BFS 5-hop traversal in <50ms', async () => {
    const traversal = new GraphTraversal(graph.nodeRepo, graph.edgeRepo);
    const start = performance.now();
    await traversal.bfs('node-0', { maxDepth: 5 });
    expect(performance.now() - start).toBeLessThan(50);
  });
});
```

---

### KPI-P3: BM25 Search Performance

| Metric | Target | Failure Threshold | Phase |
|--------|--------|------------------|-------|
| BM25 search, 1,000 nodes | <5ms | >50ms | Phase 2 |
| BM25 search, 10,000 nodes | <10ms | >100ms | Phase 2 |
| BM25 search, 100,000 nodes | <20ms | >200ms | Phase 2 |

**Note:** SQLite FTS5 is O(log n) via inverted index; these targets are achievable on standard developer hardware.

---

### KPI-P4: MCP Server Response Latency

| Metric | Target | Failure Threshold | Phase |
|--------|--------|------------------|-------|
| Server startup time (first response) | <2 seconds | >5 seconds | Phase 3 |
| `query_nodes` tool latency (10K nodes) | <50ms | >200ms | Phase 3 |
| `get_dependencies` tool latency (3 hops) | <100ms | >300ms | Phase 3 |
| `get_impact` tool latency (5 hops, 1K nodes) | <150ms | >500ms | Phase 3 |
| `get_spec_coverage` tool latency | <200ms | >1 second | Phase 3 |

**Measurement method:**

```typescript
// MCP integration test with timing
it('query_nodes responds within 50ms', async () => {
  const start = Date.now();
  const response = await mcpClient.callTool('query_nodes', {
    query: 'UserService',
    limit: 20,
  });
  const elapsed = Date.now() - start;

  expect(response.content).toBeDefined();
  expect(elapsed).toBeLessThan(50);
});
```

---

## 2. Accuracy Metrics

### KPI-A1: AST Extraction Accuracy

| Metric | Target | Failure Threshold | Phase |
|--------|--------|------------------|-------|
| Class extraction recall | >98% | <90% | Phase 1 |
| Method extraction recall | >95% | <85% | Phase 1 |
| Decorator name extraction recall | >99% | <95% | Phase 1 |
| Decorator metadata accuracy | >90% | <80% | Phase 1 |
| Line number accuracy | 100% (exact) | <99% | Phase 1 |
| Import specifier extraction recall | >99% | <95% | Phase 1 |

**Measurement method:**

```typescript
// Manual audit of 20 real TypeScript files from the monorepo:
// 1. Run TypeScriptAstExtractor on each file
// 2. Manually count expected classes/methods/decorators
// 3. Compare against extracted counts
// Recall = extracted / expected

// Automated proxy: compare against ts-morph's own getClasses() count
it('extracts the same number of classes as ts-morph reports', () => {
  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(realFilePath);
  const expectedCount = sourceFile.getClasses().length;

  const extractor = new TypeScriptAstExtractor();
  const result = extractor.extractFromFile(realFilePath, content);

  expect(result.classes.length).toBe(expectedCount);
});
```

---

### KPI-A2: Call Graph Resolution Accuracy

| Metric | Target | Failure Threshold | Phase |
|--------|--------|------------------|-------|
| Same-file call resolution rate (confidence ≥0.9) | >90% | <70% | Phase 2 |
| Cross-file call resolution rate (confidence ≥0.7) | >70% | <50% | Phase 2 |
| Overall call resolution rate (confidence >0) | >80% | <60% | Phase 2 |
| False positive rate (wrong target linked) | <5% | >15% | Phase 2 |

**Measurement method:**

```typescript
// Sample audit: manually verify 50 call sites from a known service file
// Correct = call edge points to the expected method node
// Resolution rate = correctly resolved / total call sites

const auditResults = await runCallGraphAudit({
  testFile: 'libs/agency/supabase/src/lib/services/supabase.service.ts',
  expectedCalls: KNOWN_CALLS_FOR_SUPABASE_SERVICE, // manually defined
});

expect(auditResults.resolutionRate).toBeGreaterThan(0.8);
expect(auditResults.falsePositiveRate).toBeLessThan(0.05);
```

---

### KPI-A3: Import Resolution Accuracy

| Metric | Target | Failure Threshold | Phase |
|--------|--------|------------------|-------|
| Nx path alias resolution rate | >95% | <80% | Phase 1 |
| Relative import resolution rate | >99% | <95% | Phase 1 |
| External npm import correctly flagged as null | 100% | <99% | Phase 1 |

---

### KPI-A4: MCP Tool Correctness

| Tool | Correctness Target | Measurement |
|------|--------------------|-------------|
| `query_nodes` | Results are valid graph nodes | Integration test: known nodes always returned |
| `get_dependencies` | Returns all direct dependencies | Compare with known import graph |
| `get_dependents` | Returns all direct dependents | Reverse of `get_dependencies` verification |
| `get_impact` | Correct transitive closure | Unit test with known impact set |
| `get_spec_coverage` | Matches spec edge count in graph | SQL count vs MCP response |
| `get_guardrails` | Returns all relevant guardrail nodes | Known guardrail fixture |
| `get_nx_topology` | Matches nx-graph.json data | Direct comparison |

---

## 3. Integration Quality Metrics

### KPI-I1: V1 Backward Compatibility

| Metric | Target | Phase |
|--------|--------|-------|
| V1 unit test pass rate | **100%** (no regressions) | Phase 1 |
| V1 integration test pass rate | **100%** | Phase 1 |
| V1 `graph.json` format validity | **100%** | Phase 1 |
| V1 node types present in V2 output | **100%** | Phase 1 |

This is a hard gate: **zero regressions allowed.**

---

### KPI-I2: Nx Executor Quality

| Metric | Target | Phase |
|--------|--------|-------|
| `build-graph` success rate | >99% (no crashes) | Phase 3 |
| `query` produces valid JSON output | 100% | Phase 3 |
| `serve-mcp` starts within 2 seconds | 100% | Phase 3 |
| `check-coverage` exits with correct code | 100% | Phase 3 |

---

### KPI-I3: MCP IDE Integration

| IDE | Integration Test | Target |
|-----|-----------------|--------|
| VS Code / Claude Code | All 7 tools queryable from chat | ✅ Pass |
| Cursor | All 7 tools queryable from chat | ✅ Pass |

---

## 4. Code Quality Metrics

### KPI-Q1: Test Coverage

| Module | Minimum Coverage | Target Coverage |
|--------|-----------------|-----------------|
| `ast/typescript-ast-extractor.ts` | 80% | 90% |
| `ast/decorator-analyzer.ts` | 80% | 90% |
| `ast/import-resolver.ts` | 80% | 90% |
| `query/graph-traversal.ts` | 85% | 95% |
| `query/impact-analyzer.ts` | 80% | 90% |
| `query/bm25-search-engine.ts` | 80% | 90% |
| `call-graph/call-graph-builder.ts` | 75% | 85% |
| `mcp/workspace-graph-mcp-server.ts` | 75% | 85% |
| `executors/*/executor.ts` | 70% | 80% |
| **Overall V2 modules** | **80%** | **88%** |

**CI Enforcement:**

```json
// jest.config.ts coverage threshold
coverageThreshold: {
  global: {
    branches: 75,
    functions: 80,
    lines: 80,
    statements: 80
  },
  './src/lib/ast/': {
    branches: 80,
    functions: 85,
    lines: 85,
    statements: 85
  }
}
```

---

### KPI-Q2: Code Health

| Metric | Target | Tool |
|--------|--------|------|
| TypeScript `strict` mode compliance | 100% | tsc --noEmit |
| No usage of `any` type (without justification) | 0 violations | ESLint `@typescript-eslint/no-explicit-any` |
| JSDoc on all public classes and methods | 100% | ESLint `jsdoc/require-jsdoc` |
| No circular dependencies between V2 modules | 0 | madge or eslint-plugin-import |

---

### KPI-Q3: Specification Coverage

| Metric | Target | Measurement |
|--------|--------|-------------|
| V2 modules covered by Agent Alchemy specs | 100% | `nx run workspace-graph:check-coverage` |
| Orphaned specs (specs with no code target) | 0 | `get_spec_coverage` MCP tool |

---

## 5. Metrics Dashboard (Target State)

After M4 completion, running `nx run workspace-graph:check-coverage` should produce:

```
workspace-graph-v2 Success Metrics Dashboard
==============================================

PERFORMANCE
  ✅ AST extraction per file:     12ms avg     [target: <50ms]
  ✅ Full workspace build:         18s           [target: <30s]
  ✅ BFS traversal (5-hop):        8ms           [target: <50ms]
  ✅ BM25 search (10K nodes):      3ms           [target: <10ms]
  ✅ MCP tool avg latency:         42ms          [target: <100ms]

ACCURACY
  ✅ AST class extraction recall:  98.2%        [target: >95%]
  ✅ Method extraction recall:     96.8%        [target: >95%]
  ✅ Import resolution rate:       97.4%        [target: >95%]
  ✅ Call graph resolution:        83.1%        [target: >80%]

INTEGRATION QUALITY
  ✅ V1 test pass rate:            100%         [target: 100%]
  ✅ MCP tools passing:            7/7          [target: 7/7]
  ✅ Nx executors working:         4/4          [target: 4/4]

CODE QUALITY
  ✅ Test coverage (V2 modules):   84.3%        [target: >80%]
  ✅ TypeScript strict:            100%         [target: 100%]
  ✅ Spec coverage:                100%         [target: 100%]
  ✅ Orphaned specs:               0            [target: 0]

OVERALL STATUS: 🟢 GREEN — All targets met
```

---

## 6. Regression Prevention

Once M4 is reached, the following metrics become **CI gates** (build fails if violated):

| Gate | Threshold | Action on Failure |
|------|-----------|-----------------|
| V1 test pass rate | <100% | Block merge |
| V2 test coverage | <80% | Block merge |
| TypeScript strict violations | >0 | Block merge |
| MCP integration tests | <7/7 | Block merge |
| AST extraction accuracy | <90% | Alert + manual review |

These gates ensure V2 quality does not regress as new features are added in V3 and beyond.
