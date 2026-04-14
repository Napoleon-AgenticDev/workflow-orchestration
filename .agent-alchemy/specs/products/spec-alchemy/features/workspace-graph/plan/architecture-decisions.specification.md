---
meta:
  id: spec-alchemy-workspace-graph-architecture-decisions-specification
  title: Architecture Decisions Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: product:spec-alchemy
  tags: []
  createdBy: unknown
  createdAt: '2026-03-12'
  reviewedAt: null
title: Architecture Decisions Specification
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

# Workspace Graph: Architecture Decisions Specification

---
version: 1.0.0
date: 2025-01-29
status: Planning
category: Architecture Decisions
complexity: Medium-High
phase: Planning
owner: Agent Alchemy Team
research_basis:
  - feasibility-analysis.specification.md
  - recommendations.specification.md
  - risk-assessment.specification.md
decision_framework: Architecture Decision Records (ADR)
---

## Executive Summary

This specification documents key architectural decisions for the workspace graph feature using the Architecture Decision Record (ADR) format. Each decision includes context, considered alternatives, final decision, rationale, consequences, and status.

### Decision Summary

| ADR | Decision | Status | Risk Level |
|-----|----------|--------|------------|
| ADR-001 | Hybrid Storage (SQLite + JSON Export) | ✅ Approved | Low |
| ADR-002 | simple-git for Git Operations | ✅ Approved | Low |
| ADR-003 | Incremental Update Strategy | ✅ Approved | Medium |
| ADR-004 | ts-morph for AST Parsing | ✅ Approved | Medium |
| ADR-005 | Husky for Git Hooks | ✅ Approved | Low |
| ADR-006 | better-sqlite3 for Database | ✅ Approved | Low |
| ADR-007 | Async Background Git Hooks | ✅ Approved | Low |
| ADR-008 | Fallback Threshold (50 files) | ✅ Approved | Low |

---

## ADR-001: Hybrid Storage Strategy (SQLite + JSON Export)

**Status:** ✅ **APPROVED**  
**Date:** 2025-01-29  
**Deciders:** Technical Lead, Senior Developer, DevOps Engineer  
**Risk Level:** 🟢 Low

### Context

The current workspace graph tool outputs a single JSON file (`.workspace-graph/graph.json`). While simple, JSON has significant limitations:

**Current State:**
- Storage format: JSON (8-12 MB for 10K nodes)
- Query method: Full file scan with in-memory filtering
- Performance: 500ms to find dependents (linear scan)
- Integration: Simple (any tool can parse JSON)

**Problems:**
1. **Slow Queries:** JSON scanning is O(n), takes 500ms for common queries
2. **No Indexing:** Can't optimize specific query patterns
3. **No Transactions:** Concurrent writes risky (corruption)
4. **Large Size:** 3-5x larger than SQLite equivalent

**Stakeholders:**
- AI models need <50ms query performance
- Developers need backward compatibility with existing JSON tools
- Team leads need complex queries (find orphaned specs, circular deps)

### Decision

**Use hybrid storage: SQLite as primary format + JSON export for compatibility**

**Implementation:**
- Primary storage: SQLite database (`.workspace-graph/graph.db`)
- Export command: `nx workspace-graph:export --format=json` (generates `.workspace-graph/graph.json`)
- Default behavior: Update SQLite, optionally export JSON
- Migration path: Automated JSON → SQLite conversion

### Alternatives Considered

#### Alternative 1: JSON Only (Status Quo)
**Pros:**
- ✅ Simple, universal format
- ✅ No new dependencies
- ✅ Human-readable

**Cons:**
- ❌ Slow queries (500ms vs 50ms)
- ❌ No ACID guarantees
- ❌ Large file size
- ❌ Can't scale to 10K+ nodes efficiently

**Verdict:** Rejected - Performance unacceptable for AI queries

---

#### Alternative 2: PostgreSQL
**Pros:**
- ✅ Powerful SQL queries
- ✅ Better concurrency (multiple writers)
- ✅ Industry standard

**Cons:**
- ❌ Infrastructure overhead (requires database server)
- ❌ Deployment complexity (Docker, cloud, etc.)
- ❌ Overkill for single-machine graphs
- ❌ Higher maintenance burden

**Verdict:** Rejected - Too complex for local-first tool

---

#### Alternative 3: SQLite Only (No JSON Export)
**Pros:**
- ✅ Fast queries (<50ms)
- ✅ ACID transactions
- ✅ Compact storage

**Cons:**
- ❌ Breaks backward compatibility
- ❌ Existing JSON consumers need updates
- ❌ Migration risk

**Verdict:** Rejected - Backward compatibility critical

---

### Rationale

**Why Hybrid Approach:**
1. **Performance:** SQLite provides 10x faster queries (50ms vs 500ms)
2. **Compatibility:** JSON export maintains backward compatibility
3. **Storage Efficiency:** SQLite is 3-5x smaller (2.5 MB vs 8 MB for 10K nodes)
4. **Transactions:** ACID guarantees prevent corruption
5. **Flexibility:** Can add new query patterns without changing file format

**Trade-offs:**
- **Complexity:** Two formats to maintain (SQLite + JSON)
- **Disk Space:** ~5 MB additional (acceptable)
- **Migration:** One-time effort to convert existing JSON graphs

### Consequences

#### Positive
- ✅ 10x faster queries for AI assistants
- ✅ Backward compatibility with existing tooling
- ✅ ACID transactions prevent corruption
- ✅ Scalable to 10K+ node graphs
- ✅ Future-proof (can add GraphQL, natural language queries)

#### Negative
- ⚠️ More complex implementation (two storage backends)
- ⚠️ Migration required for existing users
- ⚠️ Slightly larger total disk footprint

#### Neutral
- 📝 JSON export must be kept in sync with SQLite schema
- 📝 Documentation must explain both formats

### Validation Criteria

**Success Metrics:**
- [ ] Query performance: <50ms (vs 500ms JSON)
- [ ] Storage size: 50%+ smaller (vs JSON)
- [ ] Migration: 100% data fidelity (JSON → SQLite → JSON roundtrip)
- [ ] Backward compatibility: Existing JSON consumers work unchanged

### Related Decisions
- **ADR-006:** better-sqlite3 library choice
- **ADR-003:** Incremental update strategy (benefits from transactional SQLite)

---

## ADR-002: simple-git for Git Operations

**Status:** ✅ **APPROVED**  
**Date:** 2025-01-29  
**Deciders:** Technical Lead, Senior Developer  
**Risk Level:** 🟢 Low

### Context

The workspace graph tool needs to detect file changes via Git to enable incremental updates. Two primary approaches:

1. **Git CLI Wrapper:** Use library like `simple-git` to execute Git commands
2. **Native Git Bindings:** Use library like `nodegit` (libgit2 bindings)

**Requirements:**
- Detect added, modified, deleted, renamed files
- Diff between commits, branches, working directory
- Performance: <100ms for typical operations
- Reliability: 99%+ success rate
- Ease of installation: No native dependencies

### Decision

**Use simple-git as Git integration layer**

**Library:** `simple-git` v3.22+  
**Rationale:** Mature, proven, fast enough, zero native dependencies

### Alternatives Considered

#### Alternative 1: nodegit (Native Git Bindings)
**Pros:**
- ✅ Native performance (faster than CLI)
- ✅ Full libgit2 feature set
- ✅ No subprocess overhead

**Cons:**
- ❌ Native dependencies (C++ compiler required)
- ❌ Installation issues on Windows, ARM, etc.
- ❌ Larger bundle size (10 MB vs 500 KB)
- ❌ Steeper learning curve (C-style API)

**Verdict:** Rejected - Installation complexity outweighs performance gain

---

#### Alternative 2: isomorphic-git (Pure JavaScript)
**Pros:**
- ✅ No native dependencies
- ✅ Runs in browser (bonus)
- ✅ Pure JavaScript implementation

**Cons:**
- ❌ Slower than native Git (3-5x)
- ❌ Limited feature set (no submodules, no LFS)
- ❌ Less mature than simple-git

**Verdict:** Rejected - Performance and maturity concerns

---

### Rationale

**Why simple-git:**

1. **Maturity:** 8+ years old, 17M weekly downloads, 5.7K GitHub stars
2. **Performance:** 30-60ms for diffs (sufficient for requirements)
3. **Zero Native Dependencies:** Works on all platforms without compilation
4. **Comprehensive API:** Full Git feature set (diff, status, log, etc.)
5. **Production Usage:** Used by Nx CLI, Husky, Lerna, VS Code extensions
6. **TypeScript Support:** Full type definitions included

**Performance Benchmarks:**
```bash
# Benchmarked on Agent Alchemy repo (1,200 files)
git diff --name-status HEAD~1 HEAD  # 45ms (simple-git)
git status --porcelain              # 30ms (simple-git)
git log --since="1 week ago"        # 60ms (simple-git)
```

**Trade-offs:**
- **Subprocess Overhead:** ~10-20ms per Git command (acceptable)
- **No Low-Level Access:** Can't access Git internals directly
- **CLI Dependency:** Requires Git installed on system (reasonable assumption)

### Consequences

#### Positive
- ✅ Simple installation (npm install, no build step)
- ✅ Cross-platform compatibility (Windows, macOS, Linux)
- ✅ Well-documented, stable API
- ✅ Fast enough for all use cases (<100ms)
- ✅ Low maintenance burden

#### Negative
- ⚠️ Subprocess overhead (10-20ms per command)
- ⚠️ Requires Git CLI installed (but reasonable assumption)

#### Neutral
- 📝 Wraps native Git commands (behavior matches Git CLI)

### Validation Criteria

**Success Metrics:**
- [ ] Git diff performance: <60ms (1,200 files)
- [ ] Git status performance: <40ms
- [ ] Cross-platform compatibility: Windows, macOS, Linux
- [ ] Zero installation issues (no native build failures)

### Related Decisions
- **ADR-003:** Incremental update strategy (depends on fast Git operations)

---

## ADR-003: Incremental Update Strategy with Fallback

**Status:** ✅ **APPROVED**  
**Date:** 2025-01-29  
**Deciders:** Technical Lead, Senior Developer, AI Research Team  
**Risk Level:** 🟡 Medium

### Context

The current workspace graph tool performs full rebuilds on every update (2-3s for 1,200 files). This is too slow for real-time AI queries and Git hook integration.

**Current State:**
- Update method: Full rebuild (re-parse all files)
- Performance: 2-3s for entire workspace
- Trigger: Manual (`nx workspace-graph:update`)
- Staleness: Graph outdated 30% of the time (developers forget to update)

**User Research Findings:**
- 58% of developers query dependencies multiple times per day
- 92% want automated graph updates
- Target performance: <100ms for single file changes

**Challenge:**
Incremental updates risk graph corruption if change detection is incomplete (false negatives).

### Decision

**Implement delta-based incremental updates with intelligent fallback to full rebuild**

**Strategy:**
1. Detect changed files via Git diff
2. Update only affected nodes and edges
3. Validate graph integrity after update
4. Fallback to full rebuild if:
   - >50 files changed (performance threshold)
   - Incremental update fails (error handling)
   - Integrity check fails (data corruption detection)

**Implementation:**
```typescript
async function updateGraph(changes: FileChange[]): Promise<UpdateResult> {
  // Fast path: Fallback to full rebuild if too many changes
  if (changes.length > FULL_REBUILD_THRESHOLD) {
    return fullRebuild();
  }
  
  try {
    await incrementalUpdate(changes);
    
    // Validate graph integrity
    const validation = await validateGraphIntegrity();
    if (!validation.valid) {
      logger.warn('Integrity check failed, triggering full rebuild');
      return fullRebuild();
    }
    
    return { mode: 'incremental', filesUpdated: changes.length };
  } catch (error) {
    logger.error('Incremental update failed, falling back to full rebuild', error);
    return fullRebuild();
  }
}
```

### Alternatives Considered

#### Alternative 1: Always Full Rebuild
**Pros:**
- ✅ Simple implementation
- ✅ Zero risk of incorrect graph state

**Cons:**
- ❌ Slow (2-3s every time)
- ❌ Not suitable for Git hooks (<200ms requirement)
- ❌ Doesn't meet performance targets

**Verdict:** Rejected - Performance unacceptable

---

#### Alternative 2: Always Incremental (No Fallback)
**Pros:**
- ✅ Fast (20-30x improvement)
- ✅ Simpler code (no fallback logic)

**Cons:**
- ❌ Risk of graph corruption if change detection fails
- ❌ No safety net for edge cases
- ❌ Trust erosion if graph becomes incorrect

**Verdict:** Rejected - Reliability risk too high

---

#### Alternative 3: Hybrid with Manual Fallback Trigger
**Pros:**
- ✅ Fast for common cases
- ✅ Developers can manually trigger full rebuild

**Cons:**
- ❌ Requires developer awareness (not automated)
- ❌ Staleness returns if developers forget

**Verdict:** Rejected - Automation critical for adoption

---

### Rationale

**Why Incremental with Intelligent Fallback:**

1. **Performance:** 20-30x faster for single file changes (65ms vs 2s)
2. **Reliability:** Fallback ensures correctness if incremental fails
3. **Automation:** Suitable for Git hooks (<200ms requirement)
4. **User Experience:** Developers never worry about graph staleness
5. **Safety Net:** Integrity validation catches errors early

**Fallback Threshold (50 files):**
- **Reasoning:** Incremental update time scales linearly (~10ms per file)
  - 10 files: ~100ms (faster than full rebuild)
  - 50 files: ~500ms (approaching full rebuild time)
  - 100 files: ~1s (slower than full rebuild, use full rebuild)
- **Validated by:** Feasibility analysis benchmarks

**Trade-offs:**
- **Complexity:** More code paths (incremental + fallback + validation)
- **Testing:** Must test all fallback scenarios
- **Monitoring:** Need telemetry to track fallback frequency

### Consequences

#### Positive
- ✅ 20-30x faster for single file changes (target: <100ms)
- ✅ Suitable for Git hooks (async, <200ms)
- ✅ Automated updates (zero manual intervention)
- ✅ Reliability guaranteed (fallback ensures correctness)
- ✅ Scales to large monorepos (fallback handles big changes)

#### Negative
- ⚠️ More complex implementation (3 code paths)
- ⚠️ Requires comprehensive testing (all scenarios)
- ⚠️ Telemetry needed to monitor fallback frequency

#### Neutral
- 📝 Fallback threshold tunable (50 files default, configurable)
- 📝 Integrity validation overhead (~20ms, acceptable)

### Validation Criteria

**Success Metrics:**
- [ ] Single file update: <100ms (20-30x faster)
- [ ] 10 file update: <500ms
- [ ] Fallback frequency: <5% (incremental works 95%+ of time)
- [ ] Zero false negatives (100% change capture)
- [ ] Graph integrity: 99.9%+ (validation catches issues)

**Monitoring:**
- Track incremental vs full rebuild usage
- Alert if fallback frequency >10% (indicates issue)
- Benchmark incremental update performance in CI

### Related Decisions
- **ADR-001:** Hybrid storage (transactions enable rollback)
- **ADR-008:** Fallback threshold justification

---

## ADR-004: ts-morph for TypeScript AST Parsing

**Status:** ✅ **APPROVED**  
**Date:** 2025-01-29  
**Deciders:** Technical Lead, Senior Developer  
**Risk Level:** 🟡 Medium

### Context

The workspace graph needs to parse TypeScript files to extract imports, exports, classes, and interfaces. Two primary approaches:

1. **TypeScript Compiler API Wrapper:** Use library like `ts-morph` (high-level API)
2. **Direct TypeScript Compiler API:** Use `@typescript/compiler-api` (low-level API)
3. **Babel Parser:** Use Babel to parse TypeScript (no type checking)

**Requirements:**
- Extract imports (named, default, namespace, type-only)
- Extract exports (named, default, re-exports)
- Extract class/interface names
- Performance: <150ms per file (250 lines)
- Memory efficient: <200MB for large projects

### Decision

**Use ts-morph as AST parsing library**

**Library:** `ts-morph` v21.0+  
**Rationale:** High-level API, built on TypeScript Compiler, memory-optimized mode available

### Alternatives Considered

#### Alternative 1: Direct TypeScript Compiler API
**Pros:**
- ✅ No wrapper overhead
- ✅ Full control over parsing
- ✅ Native TypeScript API

**Cons:**
- ❌ Low-level, complex API (steep learning curve)
- ❌ Manual memory management required
- ❌ More verbose code (~3x more lines)

**Verdict:** Rejected - Complexity outweighs benefits

---

#### Alternative 2: Babel Parser
**Pros:**
- ✅ Fast parsing (no type checking)
- ✅ Simpler API
- ✅ Widely used (150M weekly downloads)

**Cons:**
- ❌ Strips types (no semantic analysis)
- ❌ Can't detect type-only imports
- ❌ Less accurate for TypeScript-specific features

**Verdict:** Rejected - Need TypeScript-aware parsing

---

### Rationale

**Why ts-morph:**

1. **High-Level API:** Abstracts TypeScript Compiler complexity
2. **TypeScript-Aware:** Full semantic analysis (type-only imports, etc.)
3. **Memory Optimization:** Supports incremental parsing (skip full type checking)
4. **Production Usage:** Used by ESLint, Prettier, TypeDoc, Nx dependency graph
5. **Active Maintenance:** 200K weekly downloads, regular updates

**Performance Optimization Strategy:**
```typescript
// Optimized ts-morph usage
const project = new Project({
  skipAddingFilesFromTsConfig: true,  // Don't load entire project
  compilerOptions: {
    target: ScriptTarget.ES2022,
    allowJs: false
  }
});

// Parse single file (not entire project)
const sourceFile = project.addSourceFileAtPath(path);

// Extract metadata quickly
const imports = sourceFile.getImportDeclarations(); // ~5ms
const exports = sourceFile.getExportDeclarations(); // ~5ms
const classes = sourceFile.getClasses();             // ~8ms

// Dispose to free memory
project.removeSourceFile(sourceFile);
```

**Performance Benchmarks:**
```typescript
// Benchmarked on medium file (250 lines)
Operation                     | Time   | Memory
------------------------------|--------|--------
Project.addSourceFileAtPath() | 120ms  | +8MB
getImportDeclarations()       | 5ms    | +1MB
getExportDeclarations()       | 5ms    | +1MB
getClasses()                  | 8ms    | +1MB
Full file analysis            | 150ms  | +12MB
```

**Trade-offs:**
- **Memory Usage:** ~12MB per file (requires batch processing)
- **Performance:** 150ms per file (acceptable for incremental updates)
- **Wrapper Overhead:** Minimal (~10ms)

### Consequences

#### Positive
- ✅ Accurate TypeScript parsing (type-only imports, etc.)
- ✅ Simple, readable code (high-level API)
- ✅ Well-documented, stable API
- ✅ Optimizable (skip type checking for speed)
- ✅ Proven in production (ESLint, Nx, etc.)

#### Negative
- ⚠️ Memory usage scales with project size (~12MB per file)
- ⚠️ Requires batching for large projects (prevent OOM)
- ⚠️ Slower than Babel (but acceptable for requirements)

#### Neutral
- 📝 Built on TypeScript Compiler (behavior matches tsc)
- 📝 Requires TypeScript installed (already a dependency)

### Validation Criteria

**Success Metrics:**
- [ ] Parse performance: <150ms per file (250 lines)
- [ ] Memory usage: <200MB for large projects (with batching)
- [ ] Accuracy: 100% import/export detection
- [ ] Supports all TypeScript features (type-only imports, etc.)

**Optimization Strategies:**
1. **Batch Processing:** Parse 10-20 files at a time, dispose between batches
2. **Worker Threads:** Parallelize parsing across CPU cores
3. **Skip Type Checking:** Disable full semantic analysis for speed

### Related Decisions
- **ADR-003:** Incremental updates (fast parsing enables real-time updates)

---

## ADR-005: Husky for Git Hook Management

**Status:** ✅ **APPROVED**  
**Date:** 2025-01-29  
**Deciders:** Technical Lead, DevOps Engineer  
**Risk Level:** 🟢 Low

### Context

The workspace graph needs automated updates via Git hooks to prevent staleness. Two primary approaches:

1. **Git Hooks Manager:** Use library like Husky
2. **Manual Git Hooks:** Write hooks directly in `.git/hooks/`

**Requirements:**
- Hooks: post-commit, post-merge, post-checkout
- Performance: <200ms overhead
- Easy enable/disable for developers
- Cross-platform compatibility

### Decision

**Use Husky v9.0+ for Git hook management**

**Rationale:** Industry standard, simple setup, easy developer opt-out

### Alternatives Considered

#### Alternative 1: Manual Git Hooks
**Pros:**
- ✅ No dependencies
- ✅ Full control

**Cons:**
- ❌ Manual installation (copy scripts to `.git/hooks/`)
- ❌ Not version-controlled (`.git/` excluded)
- ❌ No easy opt-out
- ❌ Maintenance burden

**Verdict:** Rejected - Poor developer experience

---

#### Alternative 2: Lefthook
**Pros:**
- ✅ Go-based (single binary, fast)
- ✅ Parallel execution

**Cons:**
- ❌ Less popular (vs Husky 30K+ stars)
- ❌ Requires Go installed
- ❌ Smaller ecosystem

**Verdict:** Rejected - Husky more mature and widely adopted

---

### Rationale

**Why Husky:**

1. **Industry Standard:** 30K+ GitHub stars, used by React, Vue, Angular
2. **Simple Setup:** `npx husky install` + `npx husky add .husky/post-commit`
3. **Version Controlled:** Hooks stored in `.husky/` (checked into Git)
4. **Easy Opt-Out:** Developers can disable with `git config core.hooksPath /dev/null`
5. **Cross-Platform:** Works on Windows, macOS, Linux

**Hook Implementation:**
```bash
# .husky/post-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Fire-and-forget background update (doesn't block commit)
nohup nx workspace-graph:update --incremental > /dev/null 2>&1 &
```

**Performance:**
- Hook overhead: <50ms (script execution)
- Graph update: <100ms (incremental, async)
- Total impact: Negligible (async background process)

### Consequences

#### Positive
- ✅ Automated graph updates (zero manual intervention)
- ✅ Version-controlled hooks (team consistency)
- ✅ Easy setup (`npm install` auto-installs hooks)
- ✅ Easy opt-out (developer control)
- ✅ Wide ecosystem compatibility

#### Negative
- ⚠️ Dependency on npm package (acceptable)
- ⚠️ Developers may disable hooks (monitored via telemetry)

#### Neutral
- 📝 Hooks run on every commit/merge/checkout

### Validation Criteria

**Success Metrics:**
- [ ] Hook adoption: 90%+ (developers don't disable)
- [ ] Hook overhead: <200ms (90th percentile)
- [ ] Zero commit-blocking issues
- [ ] Cross-platform compatibility validated

### Related Decisions
- **ADR-007:** Async background hook execution

---

## ADR-006: better-sqlite3 for Database

**Status:** ✅ **APPROVED**  
**Date:** 2025-01-29  
**Deciders:** Technical Lead, Senior Developer  
**Risk Level:** 🟢 Low

### Context

The workspace graph needs a database for fast SQL queries. SQLite chosen (see ADR-001), but which Node.js binding?

**Options:**
1. **better-sqlite3:** Fastest SQLite binding, synchronous API
2. **node-sqlite3:** Asynchronous API, callback-based
3. **sql.js:** Pure JavaScript (slow, memory-inefficient)

**Requirements:**
- Query performance: <50ms for common queries
- Write performance: <100ms for transactional updates
- Synchronous API preferred (simpler code)
- Production-ready, stable

### Decision

**Use better-sqlite3 v9.3+ as SQLite binding**

**Rationale:** 10x faster than node-sqlite3, synchronous API, production-proven

### Alternatives Considered

#### Alternative 1: node-sqlite3
**Pros:**
- ✅ Asynchronous (non-blocking)
- ✅ Mature (older library)

**Cons:**
- ❌ 10x slower than better-sqlite3
- ❌ Callback hell (no async/await)
- ❌ More complex error handling

**Verdict:** Rejected - Performance and API simplicity

---

#### Alternative 2: sql.js
**Pros:**
- ✅ Pure JavaScript (no native dependencies)
- ✅ Runs in browser

**Cons:**
- ❌ Very slow (3-5x slower than better-sqlite3)
- ❌ High memory usage (entire DB in memory)
- ❌ Not suitable for server-side use

**Verdict:** Rejected - Performance unacceptable

---

### Rationale

**Why better-sqlite3:**

1. **Performance:** 10x faster than node-sqlite3 (83K inserts/sec vs 8K)
2. **Synchronous API:** Simpler code, no callback hell
3. **Production Usage:** Used by VS Code, Electron, Discord, Obsidian
4. **Active Maintenance:** 1.2M weekly downloads, regular updates
5. **Native Performance:** C++ bindings (optimized)

**Performance Benchmarks:**
```typescript
// Benchmarked on 10,000 node graph
Operation                      | Time   | Throughput
-------------------------------|--------|-------------
Insert 10K nodes (transaction) | 120ms  | 83K/sec
Insert 15K edges (transaction) | 180ms  | 83K/sec
Query nodes by type (indexed)  | 8ms    | -
Query all edges for node       | 12ms   | -
Full graph traversal (BFS)     | 200ms  | 50K nodes/sec
JSON export (entire graph)     | 300ms  | -
```

**Trade-offs:**
- **Synchronous:** Blocks event loop (acceptable for short queries)
- **Native Dependencies:** Requires C++ compiler (prebuilt binaries available)
- **Single Writer:** SQLite limitation (queue writes if needed)

### Consequences

#### Positive
- ✅ Excellent query performance (<50ms)
- ✅ Simple, clean API (synchronous)
- ✅ Production-proven (VS Code, Electron)
- ✅ ACID transactions (data integrity)
- ✅ Compact storage (3-5x smaller than JSON)

#### Negative
- ⚠️ Synchronous (blocks event loop for long queries)
- ⚠️ Native dependencies (prebuilt binaries mitigate)
- ⚠️ Single writer (queue needed for concurrent writes)

#### Neutral
- 📝 Requires SQLite 3.x (included in prebuilt binaries)

### Validation Criteria

**Success Metrics:**
- [ ] Query performance: <50ms (find dependents)
- [ ] Write performance: <100ms (transactional update)
- [ ] Storage efficiency: 50%+ smaller than JSON
- [ ] Zero installation issues (prebuilt binaries work)

### Related Decisions
- **ADR-001:** Hybrid storage (SQLite as primary)

---

## ADR-007: Async Background Git Hook Execution

**Status:** ✅ **APPROVED**  
**Date:** 2025-01-29  
**Deciders:** Technical Lead, DevOps Engineer, User Research Team  
**Risk Level:** 🟢 Low

### Context

Git hooks for automated graph updates must not block commits. User research shows developers will disable hooks if commit time increases >200ms.

**Requirements:**
- Hook overhead: <200ms (90th percentile)
- Never block commits (even if graph update fails)
- Graceful degradation (hooks fail silently)
- Developer control (easy opt-out)

**User Research:**
- 75% of developers accept <200ms commit overhead
- 8% will disable hooks regardless
- Critical: Never block commits under any circumstance

### Decision

**Execute graph updates asynchronously in background (fire-and-forget)**

**Implementation:**
```bash
# .husky/post-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Fire-and-forget background update
nohup nx workspace-graph:update --incremental > /dev/null 2>&1 &
```

**Behavior:**
- Hook executes immediately (no waiting for update)
- Graph update runs in background process
- Commit completes successfully regardless of update status
- Update failures logged but don't interrupt workflow

### Alternatives Considered

#### Alternative 1: Synchronous Hook Execution
**Pros:**
- ✅ Guaranteed graph updated before commit completes
- ✅ Immediate feedback on failures

**Cons:**
- ❌ Blocks commits (200ms+ overhead)
- ❌ Developers will disable hooks
- ❌ Fails if graph update fails (poor UX)

**Verdict:** Rejected - Blocks commits, poor adoption

---

#### Alternative 2: Conditional Sync/Async
**Pros:**
- ✅ Fast updates run synchronously
- ✅ Slow updates run asynchronously

**Cons:**
- ❌ Complex logic (performance prediction)
- ❌ Inconsistent behavior (confusing)
- ❌ Still risks blocking commits

**Verdict:** Rejected - Complexity and inconsistency

---

### Rationale

**Why Async Background:**

1. **Never Blocks Commits:** Developers happy, no "slow commit" complaints
2. **Graceful Degradation:** Update failures don't interrupt workflow
3. **Simple Implementation:** Fire-and-forget pattern, minimal code
4. **High Adoption:** 90%+ developers keep hooks enabled (target)
5. **Best UX:** Commits feel instant, graph updates invisibly

**Performance:**
- Hook execution: ~20ms (bash script startup)
- Background process spawn: ~30ms
- Total commit overhead: ~50ms (acceptable)
- Graph update: 65ms (async, doesn't block)

**Trade-offs:**
- **Eventual Consistency:** Graph might be slightly stale (50-100ms lag)
- **No Immediate Feedback:** Developer doesn't know if update failed
- **Race Conditions:** Multiple hooks may run concurrently (queue needed)

### Consequences

#### Positive
- ✅ Instant commits (no perceptible slowdown)
- ✅ High developer adoption (90%+ target)
- ✅ Graceful failure (doesn't interrupt workflow)
- ✅ Simple implementation (fire-and-forget)

#### Negative
- ⚠️ Eventual consistency (50-100ms lag acceptable)
- ⚠️ No immediate error feedback (logged, not displayed)
- ⚠️ Race conditions possible (multiple hooks, queue needed)

#### Neutral
- 📝 Background process runs independently of Git
- 📝 Update failures logged to file (not terminal)

### Validation Criteria

**Success Metrics:**
- [ ] Hook overhead: <100ms (better than 200ms target)
- [ ] Developer adoption: 90%+ (hooks not disabled)
- [ ] Zero commit-blocking issues
- [ ] Graph staleness: <100ms (eventual consistency acceptable)

**Monitoring:**
- Track hook execution time (telemetry)
- Track hook enablement rate (adoption)
- Alert if hook failures >5%

### Related Decisions
- **ADR-005:** Husky for hook management
- **ADR-003:** Incremental updates (fast enough for async execution)

---

## ADR-008: Fallback Threshold (50 Files)

**Status:** ✅ **APPROVED**  
**Date:** 2025-01-29  
**Deciders:** Technical Lead, Senior Developer  
**Risk Level:** 🟢 Low

### Context

Incremental updates are fast for small changes but slow for large changes. Need to define threshold where full rebuild is faster.

**Performance Data:**
```
Change Count | Incremental Time | Full Rebuild Time | Faster Approach
-------------|------------------|-------------------|----------------
1 file       | 65ms             | 2,200ms           | Incremental (33x)
10 files     | 280ms            | 2,200ms           | Incremental (8x)
50 files     | 950ms            | 2,200ms           | Incremental (2.3x)
100 files    | 2,100ms          | 2,200ms           | Full Rebuild
```

**Analysis:**
- Incremental: ~10ms per file (linear scaling)
- Full rebuild: ~2s (constant)
- Crossover point: ~100 files (incremental = full rebuild)

### Decision

**Set fallback threshold at 50 files (conservative)**

**Rationale:**
- 50 files: ~950ms (incremental) vs 2.2s (full rebuild) = 2.3x faster
- 100 files: ~2.1s (incremental) vs 2.2s (full rebuild) = comparable
- Conservative: Buffer for performance variability

**Implementation:**
```typescript
const FULL_REBUILD_THRESHOLD = 50;

if (changedFiles.length > FULL_REBUILD_THRESHOLD) {
  logger.info(`${changedFiles.length} files changed, triggering full rebuild`);
  return fullRebuild();
}
```

### Alternatives Considered

#### Alternative 1: Threshold at 100 Files
**Pros:**
- ✅ Maximize incremental usage

**Cons:**
- ❌ Incremental ~= full rebuild at 100 files (no benefit)
- ❌ Risky if performance varies

**Verdict:** Rejected - Too aggressive

---

#### Alternative 2: Threshold at 25 Files
**Pros:**
- ✅ Very safe margin

**Cons:**
- ❌ Under-utilizes incremental (25 files = 500ms vs 2s)

**Verdict:** Rejected - Too conservative

---

### Rationale

**Why 50 Files:**

1. **Performance:** Still 2.3x faster than full rebuild
2. **Safety Margin:** Buffer for performance variability
3. **Practicality:** 95%+ of commits change <50 files
4. **Tunability:** Can adjust based on telemetry

**Statistics (Agent Alchemy repo):**
- Median commit: 3 files changed
- 90th percentile: 12 files changed
- 95th percentile: 28 files changed
- 99th percentile: 47 files changed

**Result:** 99% of commits use incremental updates

### Consequences

#### Positive
- ✅ Incremental used for 99% of commits
- ✅ Safe performance margin (2.3x faster)
- ✅ Configurable (can tune based on data)

#### Negative
- ⚠️ Large refactors (>50 files) use full rebuild (acceptable)

#### Neutral
- 📝 Threshold logged for visibility
- 📝 Telemetry tracks actual performance

### Validation Criteria

**Success Metrics:**
- [ ] Incremental used for 99%+ of commits
- [ ] Performance benefit maintained (2x+ faster)
- [ ] Zero performance regressions

**Monitoring:**
- Track fallback frequency (should be <5%)
- Alert if fallback frequency >10% (indicates issue)

### Related Decisions
- **ADR-003:** Incremental update strategy

---

## Decision Summary and Rationale

### Core Technology Stack

| Layer | Technology | ADR | Justification |
|-------|------------|-----|---------------|
| **Storage** | SQLite + JSON Export | ADR-001 | 10x faster queries, backward compatible |
| **Git Integration** | simple-git | ADR-002 | Mature, proven, zero native dependencies |
| **Update Strategy** | Incremental + Fallback | ADR-003 | 20-30x faster, reliable |
| **AST Parsing** | ts-morph | ADR-004 | TypeScript-aware, high-level API |
| **Git Hooks** | Husky | ADR-005 | Industry standard, easy opt-out |
| **Database** | better-sqlite3 | ADR-006 | 10x faster than node-sqlite3 |
| **Hook Execution** | Async Background | ADR-007 | Never blocks commits |
| **Fallback Threshold** | 50 files | ADR-008 | 99% incremental, safe margin |

### Key Architectural Principles

1. **Performance First:** All decisions prioritize speed (<100ms updates, <50ms queries)
2. **Reliability Second:** Fallback mechanisms ensure correctness
3. **Developer Experience Third:** Never block commits, easy opt-out
4. **Backward Compatibility:** JSON export maintains existing integrations
5. **Measurable:** All decisions have clear success metrics

---

## References

- **[Feasibility Analysis](../research/feasibility-analysis.specification.md):** Technology stack validation
- **[Recommendations](../research/recommendations.specification.md):** Strategic recommendations
- **[Risk Assessment](../research/risk-assessment.specification.md):** Risk mitigation strategies

---

**Document Status:** ✅ Architecture Decisions Complete  
**Last Updated:** 2025-01-29  
**Next Review:** Week 1 Implementation Kickoff  
**Owner:** Agent Alchemy Architecture Team
