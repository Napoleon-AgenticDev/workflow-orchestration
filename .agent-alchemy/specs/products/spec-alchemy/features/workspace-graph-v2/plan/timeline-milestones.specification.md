---
meta:
  id: spec-alchemy-workspace-graph-v2-timeline-milestones-specification
  title: Timeline and Milestones Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: product:spec-alchemy
  tags: [workspace-graph-v2, plan, timeline, milestones]
  createdBy: Agent Alchemy Developer Agent
  createdAt: '2026-03-20'
  reviewedAt: null
title: Timeline and Milestones Specification
category: Products
feature: workspace-graph-v2
lastUpdated: '2026-03-20'
source: Agent Alchemy
version: '1.0'
aiContext: true
product: spec-alchemy
phase: plan
applyTo: []
keywords: [timeline, milestones, phases, 6-week, delivery-plan]
topics: [workspace-graph-v2, project-planning, milestones]
---

# Workspace Graph V2: Timeline and Milestones Specification

**Version:** 1.0.0  
**Date:** 2026-03-20  
**Status:** Planning  
**Category:** Timeline and Milestones  
**Total Duration:** 6-7 weeks (4 phases)  

---

## Executive Summary

A phased 6-week implementation plan delivering workspace-graph-v2 as four independently valuable increments. Each phase ends with a milestone that demonstrates working software.

### Timeline Overview

```
Week 1  ████████ Phase 1: AST Foundation (TypeScriptAstExtractor + ImportResolver)
Week 2  ████████ Phase 1 cont. (DecoratorAnalyzer + WorkspaceGraphBuilderV2 + tests)
Week 3  ████████ Phase 2: Query Intelligence (GraphTraversal + ImpactAnalyzer + BM25)
Week 4  ████████ Phase 2 cont. (CallGraphBuilder + CALLS edges + QueryEngine update)
Week 5  ████████ Phase 3: MCP Integration (WorkspaceGraphMcpServer + tool handlers)
Week 6  ████████ Phase 3 cont. (Nx executors + mcp.json + integration tests)
Week 7+ ████████ Phase 4: Hardening (performance profiling + docs + migration guide)
```

### Milestone Summary

| Milestone | Week | Gate Criteria |
|-----------|------|---------------|
| M1: AST Foundation | End Week 2 | ts-morph extractor passes test suite; V1 tests still pass |
| M2: Query Intelligence | End Week 4 | BFS/DFS + BM25 operational; call graph at 70%+ accuracy |
| M3: MCP Live | End Week 6 | All 7 MCP tools respond correctly; Nx executors work |
| M4: Production Ready | Week 7+ | 80%+ test coverage; docs complete; E2E test passes |

---

## Phase 1: AST Foundation (Weeks 1-2)

### Objective

Replace V1 regex extraction with TypeScript Compiler API (ts-morph). Deliver method-level granularity, line numbers, and decorator metadata for all TypeScript files.

### Week 1 Tasks

| Task | Owner | Effort | Deliverable |
|------|-------|--------|-------------|
| 1.1 Create `src/lib/ast/` directory structure | Dev | 0.5h | Directory + barrel exports |
| 1.2 Implement `ast-types.ts` interfaces | Dev | 2h | `ExtractedFileData`, `ExtractedClass`, `ExtractedMethod` |
| 1.3 Implement `TypeScriptAstExtractor` core | Dev | 1.5d | `extractFromFile()` method |
| 1.4 Implement class extraction + tests | Dev | 1d | `extractClasses()` + 8 unit tests |
| 1.5 Implement method + property extraction + tests | Dev | 0.5d | `extractMethods()`, `extractProperties()` + 6 tests |
| 1.6 Implement import extraction + call site extraction | Dev | 0.5d | `extractImports()`, `extractCallSites()` + 4 tests |
| 1.7 Memory management validation | Dev | 0.5d | Benchmark: no memory growth over 50 iterations |

**Week 1 checkpoint:** `TypeScriptAstExtractor.extractFromFile()` handles a real Angular component file correctly with all class/method/property/decorator data.

### Week 2 Tasks

| Task | Owner | Effort | Deliverable |
|------|-------|--------|-------------|
| 2.1 Implement `DecoratorAnalyzer` | Dev | 1d | Angular/NestJS decorator metadata extraction |
| 2.2 Implement `ImportResolver` | Dev | 1d | tsconfig.base.json alias resolution |
| 2.3 Implement `WorkspaceGraphBuilderV2` | Dev | 1d | V2 builder using TypeScript Compiler API |
| 2.4 Wire V2 builder into incremental update pipeline | Dev | 0.5d | `buildIncremental()` uses V2 node types |
| 2.5 V2 integration test: extract real workspace file | Dev | 0.5d | End-to-end test using a real `.ts` file |

### Milestone M1: AST Foundation Complete

**Gate Criteria:**
- [ ] `TypeScriptAstExtractor.extractFromFile()` correctly extracts classes, methods, properties, decorators, imports, call sites from 5 real TypeScript files in the monorepo
- [ ] `ImportResolver.resolve()` correctly resolves Nx path aliases from `tsconfig.base.json`
- [ ] `DecoratorAnalyzer` correctly extracts metadata for `@Component`, `@Injectable`, `@Controller`
- [ ] All V1 unit tests pass without modification (100%)
- [ ] `WorkspaceGraphBuilderV2.buildIncremental()` produces V2 node types for changed files
- [ ] Memory profiling shows no accumulation over 50 extraction cycles
- [ ] New code coverage ≥80%

**Value delivered after M1:**  
Graph nodes now include method-level granularity, line numbers, and decorator metadata. AI agents can query "what methods does X expose?" accurately.

---

## Phase 2: Query Intelligence (Weeks 3-4)

### Objective

Add BFS/DFS graph traversal, BM25 full-text search, and CALLS edge extraction. Enable impact analysis and multi-hop dependency chain exploration.

### Week 3 Tasks

| Task | Owner | Effort | Deliverable |
|------|-------|--------|-------------|
| 3.1 Create `src/lib/query/` directory structure | Dev | 0.5h | Directory + barrel |
| 3.2 Implement `GraphTraversal.bfs()` | Dev | 1d | BFS with direction + maxDepth + edgeType filter |
| 3.3 Implement `GraphTraversal.dfs()` | Dev | 0.5d | DFS with cycle guard |
| 3.4 Implement `GraphTraversal.detectCycles()` | Dev | 0.5d | Cycle detection in import graph |
| 3.5 Implement `GraphTraversal.shortestPath()` | Dev | 0.5d | Dijkstra/BFS shortest path |
| 3.6 Implement `ImpactAnalyzer` | Dev | 0.5d | Inbound BFS wrapper with summary stats |
| 3.7 Add FTS5 virtual table to SQLite schema | Dev | 0.5d | Migration script + trigger creation |
| 3.8 Implement `Bm25SearchEngine.search()` | Dev | 0.5d | FTS5 query wrapper in QueryEngine |
| 3.9 Unit tests: traversal algorithms | Dev | 1d | 15+ tests covering all edge cases |

**Week 3 checkpoint:** BFS/DFS traversal works on a synthetic 100-node test graph. BM25 search returns ranked results.

### Week 4 Tasks

| Task | Owner | Effort | Deliverable |
|------|-------|--------|-------------|
| 4.1 Create `src/lib/call-graph/` directory | Dev | 0.5h | Directory + barrel |
| 4.2 Implement `CallGraphBuilder.buildCallEdges()` | Dev | 1.5d | Two-phase call resolution |
| 4.3 Implement local call resolution (Phase 1) | Dev | 0.5d | Exact match within same file |
| 4.4 Implement cross-file call resolution (Phase 2) | Dev | 0.5d | Import-based resolution |
| 4.5 Wire call graph builder into V2 builder | Dev | 0.5d | `buildIncremental()` generates CALLS edges |
| 4.6 Update QueryEngine with traversal + search | Dev | 0.5d | `QueryEngine.search()`, `QueryEngine.getDependents()` |
| 4.7 Unit tests: call graph builder | Dev | 1d | 10+ tests including unresolved calls |
| 4.8 Benchmark: query performance measurement | Dev | 0.5d | Perf report: search <10ms, BFS <50ms |

### Milestone M2: Query Intelligence Complete

**Gate Criteria:**
- [ ] `GraphTraversal.bfs()` correctly traverses a 5-hop dependency chain in <50ms
- [ ] `GraphTraversal.detectCycles()` correctly identifies circular imports
- [ ] BM25 search returns results ranked by relevance (not alphabetical)
- [ ] BM25 search over 10,000 nodes completes in <10ms
- [ ] `CallGraphBuilder` resolves >80% of same-project method calls with confidence ≥0.85
- [ ] CALLS edges present in graph after `buildIncremental()`
- [ ] `ImpactAnalyzer.getImpactRadius()` returns correct transitive dependents
- [ ] New code coverage ≥80%

**Value delivered after M2:**  
AI agents can answer multi-hop dependency questions. Impact analysis is operational. Full-text search returns ranked, relevant results.

---

## Phase 3: MCP Integration (Weeks 5-6)

### Objective

Expose the V2 graph to AI agents via MCP stdio server. Add Nx executor targets for common operations.

### Week 5 Tasks

| Task | Owner | Effort | Deliverable |
|------|-------|--------|-------------|
| 5.1 Create `src/lib/mcp/` directory structure | Dev | 0.5h | Directory + barrel |
| 5.2 Implement `WorkspaceGraphMcpServer` skeleton | Dev | 0.5d | Server class with lifecycle methods |
| 5.3 Implement `query_nodes` tool handler | Dev | 0.5d | BM25 search integration |
| 5.4 Implement `get_dependencies` tool handler | Dev | 0.5d | Outbound BFS integration |
| 5.5 Implement `get_dependents` tool handler | Dev | 0.5d | Inbound BFS integration |
| 5.6 Implement `get_impact` tool handler | Dev | 0.5d | ImpactAnalyzer integration |
| 5.7 Implement `get_spec_coverage` tool handler | Dev | 0.5d | Spec node query integration |
| 5.8 Implement `get_guardrails` tool handler | Dev | 0.5d | Guardrail node query |
| 5.9 Implement `get_nx_topology` tool handler | Dev | 0.5d | Nx project metadata query |

**Week 5 checkpoint:** All 7 MCP tools respond correctly in unit test environment.

### Week 6 Tasks

| Task | Owner | Effort | Deliverable |
|------|-------|--------|-------------|
| 6.1 Create `src/executors/` directory structure | Dev | 0.5h | Directory + 4 executor subdirs |
| 6.2 Implement `build-graph` executor | Dev | 0.5d | Nx executor + options schema |
| 6.3 Implement `query` executor | Dev | 0.5d | CLI query with table/JSON output |
| 6.4 Implement `serve-mcp` executor | Dev | 0.5d | Starts MCP stdio server |
| 6.5 Implement `check-coverage` executor | Dev | 0.5d | Coverage gate with configurable threshold |
| 6.6 Update `project.json` with executor targets | Dev | 1h | Register all 4 executor targets |
| 6.7 Create `.vscode/mcp.json` configuration | Dev | 1h | VS Code / Claude Code MCP config |
| 6.8 MCP integration tests (all 7 tools) | Dev | 1d | End-to-end MCP tool test suite |
| 6.9 Nx executor smoke tests | Dev | 0.5d | Each executor passes basic invocation test |

### Milestone M3: MCP Live

**Gate Criteria:**
- [ ] All 7 MCP tools pass integration tests with real graph data
- [ ] `nx run workspace-graph:serve-mcp` starts successfully and responds to tool calls
- [ ] `nx run workspace-graph:query --query="UserService"` returns correct results
- [ ] `nx run workspace-graph:build-graph` produces valid `.workspace-graph/graph.db`
- [ ] MCP server starts in <2 seconds
- [ ] Tool response latency <100ms for standard queries
- [ ] `.vscode/mcp.json` tested with Claude Code
- [ ] New code coverage ≥80%

**Value delivered after M3:**  
AI agents can query the workspace graph in real-time via MCP. Developers can run graph operations via `nx` commands.

---

## Phase 4: Hardening (Week 7+)

### Objective

Production readiness: performance profiling, documentation, migration guide, E2E test with full workspace.

### Week 7+ Tasks

| Task | Owner | Effort | Deliverable |
|------|-------|--------|-------------|
| 7.1 Performance profiling with 200-file subset | Dev | 1d | Profiling report + optimizations |
| 7.2 Memory leak verification | Dev | 0.5d | Heap snapshot before/after 1000-file run |
| 7.3 MCP setup documentation | Dev | 0.5d | README update with VS Code/Cursor/Claude Code setup |
| 7.4 E2E test: full monorepo graph build | Dev | 1d | Integration test using actual workspace files |
| 7.5 Coverage report and gap filling | Dev | 1d | Bring all modules to ≥95% |
| 7.6 `DEVELOPMENT-SUMMARY.md` update | Dev | 0.5d | Comprehensive V2 implementation summary |

### Milestone M4: Production Ready

**Gate Criteria:**
- [ ] Full workspace graph build (200+ TypeScript files) completes in <30 seconds
- [ ] No memory leaks detected (heap stable after 1000-file run)
- [ ] All V2 tests passing at ≥95% coverage
- [ ] E2E test passes on full monorepo data
- [ ] MCP setup documented for 3 IDEs (VS Code, Cursor, Claude Code)
- [ ] `DEVELOPMENT-SUMMARY.md` reflects final implementation

---

## Risk and Contingency Plan

### Risk R1: Phase 1 Takes Longer Than 2 Weeks

**Mitigation:** If AST extraction takes 3 weeks instead of 2, Phase 2 is delayed by 1 week. Phase 3 (MCP) is most valuable for AI agent scenarios and remains the target.

**Contingency:** Skip `DecoratorAnalyzer` in Phase 1; implement as P2 in Phase 2.

### Risk R2: Call Graph Accuracy Below 70%

**Mitigation:** Lower confidence threshold to 0.5 for reporting; mark unresolved calls clearly.

**Contingency:** Ship Phase 2 without call graph if accuracy is not acceptable; add to Phase 4.

### Risk R3: MCP Protocol Version Breaking Change

**Mitigation:** Pin `@modelcontextprotocol/sdk` to specific version. Add version check on startup.

---

## Success Gate Summary

| Gate | Check | Target |
|------|-------|--------|
| M1-G1 | AST accuracy | >95% on sample files |
| M1-G2 | V2 test coverage | ≥95% (AST module) |
| M2-G1 | BFS traversal | Correct for 5-hop chain |
| M2-G2 | Search performance | <10ms at 10K nodes |
| M3-G1 | MCP tools | All 6 passing integration tests |
| M3-G2 | Startup time | <2 seconds |
| M4-G1 | Test coverage | ≥95% all new modules |
| M4-G2 | E2E build time | <30 seconds full workspace |
