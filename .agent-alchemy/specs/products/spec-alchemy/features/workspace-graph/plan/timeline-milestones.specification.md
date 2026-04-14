---
meta:
  id: spec-alchemy-workspace-graph-timeline-milestones-specification
  title: Timeline Milestones Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: product:spec-alchemy
  tags: []
  createdBy: unknown
  createdAt: '2026-03-12'
  reviewedAt: null
title: Timeline Milestones Specification
category: Products
feature: workspace-graph
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: '1.0'
aiContext: true
product: spec-alchemy
phase: plan
applyTo: []
keywords: []
topics: []
useCases: []
---

# Workspace Graph: Timeline and Milestones Specification

---
version: 1.0.0
date: 2025-01-29
status: Planning
category: Timeline and Milestones
complexity: Medium
phase: Planning
owner: Agent Alchemy Team
research_basis:
  - feasibility-analysis.specification.md
  - recommendations.specification.md
timeline: 8-10 weeks
team_size: 1 senior developer
---

## Executive Summary

This specification defines the detailed timeline, milestones, and deliverables for the workspace graph feature over an 8-10 week development period. The project is organized into 3 major phases with weekly milestones, dependencies tracked, and buffer time allocated for unknowns.

### Timeline Overview

| Phase | Duration | Focus Area | Key Deliverables |
|-------|----------|------------|------------------|
| **Phase 1** | Weeks 1-3 | Git Integration & Incremental Updates | Git change detection, incremental updater, AST parser |
| **Phase 2** | Weeks 4-6 | SQLite Storage & Query API | Database schema, migration, query API, JSON export |
| **Phase 3** | Weeks 7-10 | Automation & Polish | Git hooks, GitHub Actions, spec tracking, documentation |
| **Buffer** | +1.5-2 weeks | Risk mitigation | Built into timeline (25% buffer) |

**Total Timeline:** 8-10 weeks (conservative estimate with buffer)

---

## Phase 1: Foundation (Weeks 1-3)

**Objective:** Build Git-aware incremental update engine with <100ms performance

### Week 1: Git Integration & Project Setup

**Focus:** Git change detection and project infrastructure

#### Day 1-2: Project Initialization
**Tasks:**
- [ ] Create project in Nx workspace (`libs/shared/workspace-graph`)
- [ ] Set up package.json with dependencies (simple-git, ts-morph, better-sqlite3)
- [ ] Configure TypeScript (tsconfig.json, strict mode)
- [ ] Set up Jest testing infrastructure
- [ ] Configure ESLint and Prettier
- [ ] Create README with architecture overview

**Deliverables:**
- ✅ Project scaffolding complete
- ✅ Dependencies installed and verified
- ✅ Build and test scripts working
- ✅ Initial documentation

**Success Criteria:**
- `nx build workspace-graph` succeeds
- `nx test workspace-graph` runs (0 tests)
- All linting passes

---

#### Day 3-5: Git Change Detector Service
**Tasks:**
- [ ] Implement GitChangeDetectorService class
- [ ] Method: `getChangedFiles(from, to)` using simple-git
- [ ] Method: `getWorkingDirectoryChanges()` for uncommitted files
- [ ] Handle all change types (add, modify, delete, rename)
- [ ] Write unit tests (90%+ coverage)
- [ ] Write integration tests with real Git repository
- [ ] Benchmark performance (<60ms for 1,200 files)

**Deliverables:**
- ✅ GitChangeDetectorService implemented
- ✅ Unit tests: 90%+ coverage
- ✅ Integration tests passing
- ✅ Performance benchmark: <60ms

**Success Criteria:**
- All tests passing
- Detects renamed files correctly
- Handles edge cases (submodules, symlinks)

---

**Week 1 Exit Criteria:**
- [ ] Git change detection working end-to-end
- [ ] Performance: <60ms for typical diffs
- [ ] Test coverage: 90%+
- [ ] Weekly demo to stakeholders

**Risks:**
- Git library integration issues (Mitigation: Use simple-git, well-tested)
- Performance slower than expected (Mitigation: Optimize with caching)

---

### Week 2: Incremental Update Algorithm

**Focus:** Core algorithm for delta-based graph updates

#### Day 1-3: Incremental Update Logic
**Tasks:**
- [ ] Implement IncrementalGraphUpdater class
- [ ] Method: `updateGraph(changes)` with transactional updates
- [ ] Method: `handleAddedFile(change)` - create node and edges
- [ ] Method: `handleModifiedFile(change)` - update node, rebuild edges
- [ ] Method: `handleDeletedFile(change)` - cascade delete
- [ ] Method: `handleRenamedFile(change)` - update paths, preserve edges
- [ ] Implement fallback threshold logic (50 files)
- [ ] Write unit tests for each change type

**Deliverables:**
- ✅ IncrementalGraphUpdater implemented
- ✅ Handles all change types correctly
- ✅ Transactional updates (rollback on failure)
- ✅ Unit tests: 85%+ coverage

**Success Criteria:**
- Single file update: <100ms
- 10 file update: <500ms
- Fallback triggers at 50+ files

---

#### Day 4-5: Graph Integrity Validation
**Tasks:**
- [ ] Implement validateGraphIntegrity() function
- [ ] Check 1: Orphaned edges detection
- [ ] Check 2: Missing files detection
- [ ] Check 3: Foreign key violations
- [ ] Auto-trigger full rebuild if critical issues found
- [ ] Write validation tests

**Deliverables:**
- ✅ Integrity validation working
- ✅ Auto-fallback on validation failure
- ✅ Tests for all validation scenarios

**Success Criteria:**
- Detects all integrity issues
- Never leaves graph in corrupted state
- Validation runs in <20ms

---

**Week 2 Exit Criteria:**
- [ ] Incremental updates working for all change types
- [ ] Performance: <100ms for single file
- [ ] Graph integrity guaranteed (validation passing)
- [ ] Test coverage: 85%+

**Risks:**
- Complexity of edge update logic (Mitigation: Incremental testing)
- Performance budget exceeded (Mitigation: Optimize transactional writes)

---

### Week 3: AST Parsing & Benchmarking

**Focus:** TypeScript parsing and performance validation

#### Day 1-3: TypeScript AST Parser
**Tasks:**
- [ ] Implement TypeScriptAstParser class
- [ ] Method: `parseFile(path)` using ts-morph
- [ ] Extract imports (named, default, namespace, type-only)
- [ ] Extract exports (named, default, re-exports)
- [ ] Extract classes and interfaces
- [ ] Memory optimization (dispose Project after each file)
- [ ] Write unit tests with fixture files

**Deliverables:**
- ✅ TypeScriptAstParser implemented
- ✅ All import/export types detected
- ✅ Memory efficient (<200MB)
- ✅ Unit tests: 90%+ coverage

**Success Criteria:**
- Parse performance: <150ms per file
- Memory usage: <200MB for large projects
- 100% accuracy on import/export detection

---

#### Day 4-5: Performance Benchmarking & CI Integration
**Tasks:**
- [ ] Create automated performance benchmarks
- [ ] Benchmark: Single file update (<100ms)
- [ ] Benchmark: 10 file update (<500ms)
- [ ] Benchmark: Git diff (<60ms)
- [ ] Benchmark: AST parsing (<150ms per file)
- [ ] Integrate benchmarks into CI (fail build if exceeded)
- [ ] Set up performance monitoring dashboard

**Deliverables:**
- ✅ Performance benchmarks passing
- ✅ CI enforces performance budgets
- ✅ Dashboard shows performance trends

**Success Criteria:**
- All benchmarks passing
- CI fails if performance regresses >20%
- Dashboard operational

---

**Week 3 Exit Criteria:**
- [ ] Phase 1 complete: Git + Incremental + AST working
- [ ] Performance targets met (<100ms single file)
- [ ] Test coverage: 80%+ (overall)
- [ ] Code review approved
- [ ] Demo to stakeholders

**Phase 1 Retrospective:**
- What went well?
- What could be improved?
- Adjust Phase 2 plan if needed

---

## Phase 2: Storage (Weeks 4-6)

**Objective:** Migrate to SQLite storage with 10x query performance improvement

### Week 4: SQLite Schema & Database Setup

**Focus:** Database schema design and implementation

#### Day 1-2: Schema Design & Creation
**Tasks:**
- [ ] Design database schema (nodes, edges, graph_versions)
- [ ] Create SQL schema file with indexes and constraints
- [ ] Implement DatabaseService class (better-sqlite3)
- [ ] Method: `initializeSchema()` - create tables and indexes
- [ ] Method: `insertNode(node)` - with validation
- [ ] Method: `insertEdge(edge)` - with foreign key checks
- [ ] Write unit tests for database operations

**Deliverables:**
- ✅ Schema SQL file created
- ✅ DatabaseService implemented
- ✅ All tables and indexes created
- ✅ Unit tests: 90%+ coverage

**Success Criteria:**
- Schema supports all node/edge types
- Indexes created for fast queries
- Foreign key constraints enforced

---

#### Day 3-5: JSON to SQLite Migration
**Tasks:**
- [ ] Implement GraphMigrator class
- [ ] Method: `migrateJsonToSqlite(jsonPath, dbPath)`
- [ ] Load existing JSON graph files
- [ ] Insert nodes and edges into SQLite (transactional)
- [ ] Validate migration (roundtrip test: JSON → SQLite → JSON)
- [ ] Handle large graphs (10K+ nodes) without OOM
- [ ] Write migration tests with realistic data

**Deliverables:**
- ✅ GraphMigrator implemented
- ✅ Migration tested on real Agent Alchemy graph
- ✅ Validation passing (100% data fidelity)
- ✅ Performance: <3s for 10K nodes

**Success Criteria:**
- Migration completes without data loss
- Handles large graphs (10K+ nodes)
- Rollback if migration fails

---

**Week 4 Exit Criteria:**
- [ ] SQLite database operational
- [ ] Migration from JSON validated
- [ ] Database integrity checks passing
- [ ] Weekly demo (show SQLite queries)

**Risks:**
- Migration bugs (Mitigation: Comprehensive testing with real data)
- Database performance issues (Mitigation: Proper indexing)

---

### Week 5: Query API & Performance Optimization

**Focus:** SQL-based query API and performance validation

#### Day 1-3: Query API Implementation
**Tasks:**
- [ ] Implement GraphQueryAPI class
- [ ] Method: `findDependents(nodeId, depth)` - recursive CTE
- [ ] Method: `findImports(nodeId)` - simple join
- [ ] Method: `findSpecs(feature)` - full-text search
- [ ] Method: `findCircularDependencies()` - cycle detection
- [ ] Method: `findOrphanedSpecs()` - left join
- [ ] Write unit tests for all queries
- [ ] Write integration tests with realistic graph data

**Deliverables:**
- ✅ GraphQueryAPI implemented
- ✅ All query methods working
- ✅ Unit tests: 90%+ coverage
- ✅ Integration tests passing

**Success Criteria:**
- findDependents: <50ms
- findImports: <30ms
- findSpecs: <200ms
- All queries return correct results

---

#### Day 4-5: Query Performance Benchmarks
**Tasks:**
- [ ] Create automated query benchmarks
- [ ] Benchmark: findDependents (<50ms)
- [ ] Benchmark: findImports (<30ms)
- [ ] Benchmark: findSpecs (<200ms)
- [ ] Compare with JSON scanning (validate 10x speedup)
- [ ] Optimize indexes if benchmarks fail
- [ ] Integrate query benchmarks into CI

**Deliverables:**
- ✅ Query benchmarks passing
- ✅ 10x speedup vs JSON validated
- ✅ CI enforces query performance budgets

**Success Criteria:**
- All query benchmarks passing
- Performance regression detection in CI
- Dashboard shows query performance trends

---

**Week 5 Exit Criteria:**
- [ ] Query API operational
- [ ] Performance: <50ms for common queries
- [ ] 10x faster than JSON scanning
- [ ] Weekly demo (live query examples)

**Risks:**
- Query performance below targets (Mitigation: Index optimization, CTE tuning)

---

### Week 6: JSON Export & Graph Versioning

**Focus:** Backward compatibility and optional features

#### Day 1-3: JSON Export (Backward Compatibility)
**Tasks:**
- [ ] Implement GraphExporter class
- [ ] Method: `exportToJson(filter)` - SQLite → JSON
- [ ] Ensure JSON format identical to v1.x (backward compatible)
- [ ] Support filtered export (e.g., only specs, only files)
- [ ] Handle large graphs (10K+ nodes) without OOM
- [ ] Write export tests (validate schema)

**Deliverables:**
- ✅ GraphExporter implemented
- ✅ JSON format backward compatible
- ✅ Performance: <300ms for 10K nodes
- ✅ Tests validate JSON schema

**Success Criteria:**
- JSON output matches v1.x format
- Existing JSON consumers work unchanged
- Performance acceptable (<300ms)

---

#### Day 4-5: Graph Versioning (Optional)
**Tasks:**
- [ ] Implement graph versioning in graph_versions table
- [ ] Record version on every update (commit hash, timestamp, stats)
- [ ] Method: `getGraphAtCommit(commitHash)` - historical query
- [ ] Method: `compareGraphs(commit1, commit2)` - diff
- [ ] Write versioning tests

**Deliverables:**
- ✅ Graph versioning implemented
- ✅ Historical queries working
- ✅ Graph comparison functional
- ✅ Tests covering versioning scenarios

**Success Criteria:**
- Versions recorded correctly
- Historical retrieval: <1s
- Graph comparison accurate

---

**Week 6 Exit Criteria:**
- [ ] Phase 2 complete: SQLite + Query API + Export
- [ ] JSON export backward compatible
- [ ] Graph versioning operational (if time permits)
- [ ] Code review approved
- [ ] Demo to stakeholders

**Phase 2 Retrospective:**
- Performance targets met?
- Any technical debt to address?
- Adjust Phase 3 plan if needed

---

## Phase 3: Automation & Polish (Weeks 7-10)

**Objective:** Automate graph updates and provide 100% spec visibility

### Week 7: Git Hooks Integration

**Focus:** Husky hooks for automated updates

#### Day 1-2: Husky Setup & Hook Scripts
**Tasks:**
- [ ] Install Husky (npx husky install)
- [ ] Create post-commit hook script
- [ ] Create post-merge hook script
- [ ] Create post-checkout hook script
- [ ] Implement async background update (nohup)
- [ ] Write hook integration tests

**Deliverables:**
- ✅ Husky hooks installed
- ✅ All 3 hooks functional
- ✅ Async updates working
- ✅ Tests validate hook behavior

**Success Criteria:**
- Hooks run on commit/merge/checkout
- Background updates don't block commits
- Hook overhead: <100ms

---

#### Day 3-5: CLI Setup Commands & Developer UX
**Tasks:**
- [ ] Implement `nx workspace-graph:setup-hooks` command
- [ ] Implement `nx workspace-graph:disable-hooks` command
- [ ] Implement `nx workspace-graph:init` command (create database)
- [ ] Implement `nx workspace-graph:update` command (manual update)
- [ ] Add clear success/error messages
- [ ] Write CLI tests

**Deliverables:**
- ✅ CLI commands implemented
- ✅ User-friendly messages
- ✅ Help text and documentation
- ✅ Tests for all commands

**Success Criteria:**
- CLI commands work correctly
- Error messages actionable
- User testing validates UX

---

**Week 7 Exit Criteria:**
- [ ] Git hooks operational
- [ ] CLI setup commands working
- [ ] Developer adoption target: 90%+ (internal testing)
- [ ] Weekly demo (live hook demonstration)

**Risks:**
- Developer resistance to hooks (Mitigation: Make opt-in, easy disable)

---

### Week 8: GitHub Actions & CI/CD Integration

**Focus:** Automated graph updates in CI pipeline

#### Day 1-3: GitHub Actions Workflow
**Tasks:**
- [ ] Create `.github/workflows/workspace-graph-update.yml`
- [ ] Configure workflow triggers (push, PR)
- [ ] Implement cache restoration (graph-{sha})
- [ ] Run incremental update based on git diff
- [ ] Upload graph artifact
- [ ] Test workflow on real PRs

**Deliverables:**
- ✅ GitHub Actions workflow operational
- ✅ Caching working correctly
- ✅ Artifacts uploaded successfully
- ✅ Workflow tested on multiple PRs

**Success Criteria:**
- Workflow executes in <60s
- 95%+ success rate
- Cache hit rate: 80%+

---

#### Day 4-5: Workflow Optimization & Monitoring
**Tasks:**
- [ ] Optimize cache strategy (size, TTL)
- [ ] Add workflow monitoring (execution time, success rate)
- [ ] Implement failure notifications
- [ ] Write workflow documentation

**Deliverables:**
- ✅ Workflow optimized (<60s)
- ✅ Monitoring dashboard operational
- ✅ Alerts configured for failures
- ✅ Documentation complete

**Success Criteria:**
- Execution time: <60s
- Success rate: 95%+
- Alerts working correctly

---

**Week 8 Exit Criteria:**
- [ ] GitHub Actions workflow operational
- [ ] Performance: <60s per run
- [ ] Success rate: 95%+
- [ ] Weekly demo (show CI integration)

**Risks:**
- GitHub Actions quota exceeded (Mitigation: Optimize caching, selective triggers)

---

### Week 9: Specification Tracking & Polish

**Focus:** Spec tracking and final feature polish

#### Day 1-3: Specification File Tracking
**Tasks:**
- [ ] Implement SpecificationTracker class
- [ ] Detect `.spec.md` files (spec nodes)
- [ ] Detect `.instructions.md` files (guardrail nodes)
- [ ] Parse YAML frontmatter (category, status, tags)
- [ ] Create reference edges (specs → implementing code)
- [ ] Implement `findOrphanedSpecs()` query
- [ ] Write spec tracking tests

**Deliverables:**
- ✅ SpecificationTracker implemented
- ✅ Spec files tracked as nodes
- ✅ Orphaned spec detection working
- ✅ Tests covering all scenarios

**Success Criteria:**
- 100% spec coverage visibility
- findSpecs query: <200ms
- Orphaned spec detection accurate

---

#### Day 4-5: Feature Polish & Bug Fixes
**Tasks:**
- [ ] Fix any remaining bugs from backlog
- [ ] Improve error messages based on user feedback
- [ ] Add fuzzy matching for CLI queries
- [ ] Optimize performance hot paths
- [ ] Write additional tests for edge cases

**Deliverables:**
- ✅ All P0 bugs fixed
- ✅ Error messages improved
- ✅ Performance optimizations applied
- ✅ Test coverage: 80%+ (overall)

**Success Criteria:**
- Zero P0 bugs remaining
- User testing validates improvements
- Performance targets maintained

---

**Week 9 Exit Criteria:**
- [ ] Spec tracking operational
- [ ] All critical bugs fixed
- [ ] Code quality high (linting passing, tests green)
- [ ] Weekly demo (show spec tracking)

**Risks:**
- Bug queue growing (Mitigation: Daily triage, prioritize P0/P1)

---

### Week 10: Documentation & Launch Preparation

**Focus:** Comprehensive documentation and launch readiness

#### Day 1-3: Documentation
**Tasks:**
- [ ] Write comprehensive README (overview, quick start, installation)
- [ ] Write getting-started guide (step-by-step setup)
- [ ] Write architecture documentation (diagrams, design decisions)
- [ ] Write API reference (all queries, CLI commands)
- [ ] Write migration guide (JSON to SQLite)
- [ ] Write troubleshooting guide (common issues)
- [ ] Create 5+ code examples (basic usage, GitHub Actions, AI integration)

**Deliverables:**
- ✅ README complete
- ✅ All documentation written
- ✅ Examples working and tested
- ✅ Troubleshooting guide complete

**Success Criteria:**
- Documentation covers all features
- Examples run successfully
- User feedback positive

---

#### Day 4-5: Launch Preparation & Final Testing
**Tasks:**
- [ ] Final end-to-end testing (all features)
- [ ] Performance validation (all benchmarks passing)
- [ ] Security audit (no secrets in database)
- [ ] Publish npm package (@buildmotion-ai/workspace-graph)
- [ ] Prepare launch blog post
- [ ] Update repository README
- [ ] Create GitHub release (v1.0.0)

**Deliverables:**
- ✅ All tests passing (unit, integration, e2e)
- ✅ npm package published
- ✅ Blog post ready
- ✅ GitHub release created

**Success Criteria:**
- Zero critical bugs
- npm package installs correctly
- Launch materials ready

---

**Week 10 Exit Criteria:**
- [ ] Phase 3 complete: Automation + Spec Tracking + Documentation
- [ ] All features tested and validated
- [ ] Documentation comprehensive
- [ ] Launch preparation complete

**Phase 3 Retrospective:**
- Overall project review
- Lessons learned
- Post-launch roadmap

---

## Buffer Weeks (Weeks 11-12, if needed)

**Allocated Time:** 1.5-2 weeks  
**Purpose:** Risk mitigation and unknowns

**Potential Uses:**
- Address unforeseen technical challenges
- Fix critical bugs discovered late
- Additional performance optimization
- Extra documentation and examples
- User testing and feedback incorporation

**Criteria for Using Buffer:**
- Phase slippage >1 week
- Critical bugs requiring extensive refactoring
- Performance targets not met (require optimization)

---

## Critical Path Analysis

### Dependencies

```
Week 1 (Git Change Detector) ──┐
                               ├──> Week 2 (Incremental Updater) ──┐
Week 3 (AST Parser) ───────────┘                                    │
                                                                     v
                                                        Week 4 (SQLite Schema) ──┐
                                                                                 ├──> Week 5 (Query API)
                                                                                 │
                                                                                 └──> Week 6 (JSON Export)
                                                                                              │
                                                                                              v
Week 2 (Incremental Updater) ──────────────────────────────────────┬──> Week 7 (Git Hooks)
                                                                     │
                                                                     └──> Week 8 (GitHub Actions)

Week 4 (SQLite Schema) ────────────────────────────────────────────────> Week 9 (Spec Tracking)

All Features ──────────────────────────────────────────────────────────> Week 10 (Documentation)
```

**Critical Path:**
1. Week 1 → Week 2 → Week 4 → Week 5 → Week 10 (cannot be parallelized)
2. Total: 5 weeks (minimum with perfect execution)
3. Actual: 10 weeks (with buffer and realistic execution)

**Parallelization Opportunities:**
- Week 3 (AST Parser) can overlap with Week 2 (Incremental Updater)
- Week 7 (Git Hooks) can overlap with Week 8 (GitHub Actions)
- Week 9 (Spec Tracking) can start during Week 8

---

## Risk-Adjusted Timeline

### Optimistic Scenario (8 weeks)
- No major blockers
- Performance targets met on first try
- All tests passing without rework
- Minimal bug fixing required

**Probability:** 30%

---

### Realistic Scenario (9-10 weeks)
- Minor blockers resolved within days
- Performance targets require some optimization
- Standard bug fixing and rework
- Documentation takes full week

**Probability:** 60%

---

### Pessimistic Scenario (11-12 weeks)
- Major blocker requiring week+ of work
- Performance targets require significant optimization
- Extensive bug fixing and refactoring
- Additional user testing and feedback incorporation

**Probability:** 10%

---

## Milestone Tracking and Reporting

### Weekly Demo Schedule

| Week | Demo Focus | Stakeholders | Success Criteria |
|------|------------|--------------|------------------|
| 1 | Git change detection working | Tech Lead, Developers | Detects all change types, <60ms |
| 2 | Incremental updates functional | Tech Lead, Developers | <100ms single file update |
| 3 | Phase 1 complete demo | Leadership, Developers | All performance targets met |
| 4 | SQLite migration validated | Tech Lead, Developers | Migration working, no data loss |
| 5 | Query API operational | AI Team, Developers | <50ms query performance |
| 6 | Phase 2 complete demo | Leadership, Developers | 10x query speedup demonstrated |
| 7 | Git hooks working | Developers | 90%+ adoption (internal) |
| 8 | GitHub Actions workflow | DevOps, Leadership | <60s execution time |
| 9 | Spec tracking demo | Team Leads, Leadership | 100% spec visibility |
| 10 | Launch readiness review | All Stakeholders | Ready for external release |

---

### Progress Metrics

**Tracked Weekly:**
- Tasks completed vs planned
- Test coverage (target: 80%+)
- Performance benchmarks status
- Bug count (P0, P1, P2)
- Risk register updates

**Reported to Leadership:**
- Phase completion percentage
- Risk mitigation status
- Timeline confidence (on track / at risk / delayed)
- Next week priorities

---

## References

- **[Feasibility Analysis](../research/feasibility-analysis.specification.md):** Timeline estimation methodology
- **[Recommendations](../research/recommendations.specification.md):** Phased rollout strategy
- **[Requirements](./requirements.specification.md):** Feature scope and acceptance criteria
- **[Feature Breakdown](./feature-breakdown.specification.md):** Detailed task breakdown

---

**Document Status:** ✅ Timeline Complete  
**Last Updated:** 2025-01-29  
**Next Review:** Weekly during development  
**Owner:** Agent Alchemy Project Manager
