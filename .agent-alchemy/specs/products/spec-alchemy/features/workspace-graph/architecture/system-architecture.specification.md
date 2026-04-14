---
meta:
  id: spec-alchemy-workspace-graph-system-architecture-specification
  title: System Architecture Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: product:spec-alchemy
  tags: []
  createdBy: unknown
  createdAt: '2026-03-12'
  reviewedAt: null
title: System Architecture Specification
category: Products
feature: workspace-graph
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: '1.0'
aiContext: true
product: spec-alchemy
phase: architecture
applyTo: []
keywords: []
topics: []
useCases: []
---

# Workspace Graph: System Architecture Specification

---
version: 1.0.0
date: 2025-01-29
status: Architecture
category: System Architecture
complexity: High
phase: Architecture
owner: Agent Alchemy Architecture Team
research_basis:
  - ../research/feasibility-analysis.specification.md
  - ../research/user-research.specification.md
  - ../plan/architecture-decisions.specification.md
  - ../plan/requirements.specification.md
related_adrs:
  - ADR-001 (Hybrid Storage Strategy)
  - ADR-002 (simple-git for Git Operations)
  - ADR-003 (Incremental Update Strategy)
  - ADR-006 (better-sqlite3 for Database)
priority: Critical
---

## Executive Summary

This specification defines the high-level system architecture for the workspace graph feature, including component structure, layer boundaries, data flow patterns, and integration points. The architecture follows constitutional AI principles with clear separation of concerns between Git operations, graph analysis, storage, and query layers.

### Architecture Highlights

- **Layered Architecture:** 4 distinct layers (Git, Analysis, Storage, Query)
- **Component Count:** 8 primary components, 15 interfaces
- **Integration Points:** Nx workspace, Git repository, Agent Alchemy specs
- **Performance Target:** <100ms incremental updates, <50ms queries
- **Scalability:** Support 10,000+ files without degradation

---

## 1. System Context Diagram

### 1.1 High-Level Context

```
┌─────────────────────────────────────────────────────────────────┐
│                     WORKSPACE GRAPH SYSTEM                       │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Git Change   │  │ Incremental  │  │ Hybrid       │          │
│  │ Detector     │→ │ Graph        │→ │ Storage      │          │
│  │              │  │ Builder      │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         ↑                  ↑                  ↓                  │
│         │                  │                  │                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Git          │  │ AST Parser   │  │ Graph Query  │          │
│  │ Repository   │  │              │  │ API          │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
           ↑                                        ↓
           │                                        │
    ┌──────────────┐                      ┌──────────────┐
    │ Git Hooks    │                      │ AI Models    │
    │ (Husky)      │                      │ (Copilot)    │
    └──────────────┘                      └──────────────┘
           ↑                                        ↓
           │                                        │
    ┌──────────────┐                      ┌──────────────┐
    │ GitHub       │                      │ CLI/API      │
    │ Actions      │                      │ Consumers    │
    └──────────────┘                      └──────────────┘
```

### 1.2 External Systems and Integrations

| System | Integration Type | Data Flow | Dependency Level |
|--------|------------------|-----------|------------------|
| **Git Repository** | Read/Monitor | Git → Change Detector | Critical |
| **Nx Workspace** | Read | Nx Config → Graph Builder | Critical |
| **Agent Alchemy Specs** | Read/Parse | YAML Files → Graph Builder | High |
| **GitHub Copilot** | Query | Query API → AI Model | High |
| **Husky Git Hooks** | Trigger | Git Events → Update Process | Medium |
| **GitHub Actions** | Automation | CI Events → Update Workflow | Medium |
| **TypeScript Compiler** | Parse | TS Files → AST Parser | Critical |
| **SQLite Database** | Read/Write | Graph Data ↔ Storage | Critical |

---

## 2. Layer Architecture

### 2.1 Architectural Layers

The system follows a **4-layer architecture** with strict unidirectional dependencies:

```
┌─────────────────────────────────────────────────────────────────┐
│                         LAYER 4: QUERY API                       │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ GraphQueryAPI    │  │ CLIQueryCommand  │                    │
│  │ - findDependents │  │ - executeQuery   │                    │
│  │ - findImports    │  │ - formatOutput   │                    │
│  │ - findSpecs      │  │ - validateArgs   │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                              ↑
                              │ (uses)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        LAYER 3: STORAGE                          │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ HybridStorage    │  │ JSONExporter     │                    │
│  │ - save()         │  │ - export()       │                    │
│  │ - load()         │  │ - validate()     │                    │
│  │ - query()        │  │ - transform()    │                    │
│  └──────────────────┘  └──────────────────┘                    │
│           ↑                                                      │
│           │                                                      │
│  ┌──────────────────┐                                           │
│  │ SQLiteDatabase   │                                           │
│  │ - executeQuery() │                                           │
│  │ - transaction()  │                                           │
│  └──────────────────┘                                           │
└─────────────────────────────────────────────────────────────────┘
                              ↑
                              │ (uses)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       LAYER 2: GRAPH ANALYSIS                    │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ IncrementalGraph │  │ ASTParser        │                    │
│  │ Builder          │  │ - parseImports() │                    │
│  │ - buildGraph()   │  │ - parseExports() │                    │
│  │ - updateNodes()  │  │ - extractMeta()  │                    │
│  │ - updateEdges()  │  └──────────────────┘                    │
│  └──────────────────┘                                           │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ GraphValidator   │  │ NxProjectReader  │                    │
│  │ - validate()     │  │ - readProjects() │                    │
│  │ - checkIntegrity │  │ - readConfig()   │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                              ↑
                              │ (uses)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      LAYER 1: GIT INTEGRATION                    │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ GitChangeDetector│  │ GitRepository    │                    │
│  │ - getChanges()   │  │ - diff()         │                    │
│  │ - analyzeImpact()│  │ - status()       │                    │
│  │ - categorize()   │  │ - log()          │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Layer Responsibilities

#### Layer 1: Git Integration (Foundation)
**Purpose:** Interface with Git repository to detect file changes

**Responsibilities:**
- Execute Git commands (diff, status, log)
- Parse Git output (file changes, rename detection)
- Categorize changes (added, modified, deleted, renamed)
- Provide abstraction over raw Git operations

**Key Components:**
- `GitChangeDetector`: High-level change detection API
- `GitRepository`: Low-level Git command wrapper

**Dependencies:** `simple-git`, native Git

**Performance Constraints:**
- Git operations: <100ms
- Change detection: <60ms

---

#### Layer 2: Graph Analysis (Core Logic)
**Purpose:** Build and maintain workspace graph from file system and Git data

**Responsibilities:**
- Parse TypeScript files (imports, exports, classes)
- Read Nx project configuration
- Build graph nodes (files, projects, specs)
- Build graph edges (imports, dependencies, references)
- Validate graph integrity

**Key Components:**
- `IncrementalGraphBuilder`: Orchestrates graph construction
- `ASTParser`: Parses TypeScript AST
- `NxProjectReader`: Reads Nx workspace configuration
- `GraphValidator`: Validates graph correctness

**Dependencies:** `ts-morph`, `@nx/workspace`, Layer 1

**Performance Constraints:**
- Single file parse: <150ms
- Graph update (1 file): <100ms
- Graph validation: <200ms

---

#### Layer 3: Storage (Persistence)
**Purpose:** Persist and retrieve graph data efficiently

**Responsibilities:**
- Store graph in SQLite database
- Export graph to JSON format
- Query graph data
- Manage database transactions
- Handle migrations

**Key Components:**
- `HybridStorage`: Orchestrates SQLite + JSON export
- `SQLiteDatabase`: Low-level database operations
- `JSONExporter`: Backward-compatible JSON export

**Dependencies:** `better-sqlite3`, Layer 2

**Performance Constraints:**
- Database write: <50ms (transactional)
- Graph query: <50ms
- JSON export: <300ms (10K nodes)

---

#### Layer 4: Query API (Interface)
**Purpose:** Provide high-level API for graph queries

**Responsibilities:**
- Execute graph queries (dependents, imports, specs)
- Format query results
- Provide CLI interface
- Handle query errors

**Key Components:**
- `GraphQueryAPI`: High-level query interface
- `CLIQueryCommand`: Command-line interface

**Dependencies:** Layer 3

**Performance Constraints:**
- Query execution: <50ms
- CLI response: <100ms (including formatting)

---

## 3. Core Component Interfaces

See [Component Design Specification](./component-design.specification.md) for detailed implementations.

**Component Summary:**

| Component | Layer | Primary Responsibility | Performance SLA |
|-----------|-------|------------------------|-----------------|
| GitChangeDetector | 1 | Detect file changes via Git | <60ms |
| GitRepository | 1 | Execute Git commands | <100ms |
| IncrementalGraphBuilder | 2 | Build/update graph | <100ms (1 file) |
| ASTParser | 2 | Parse TypeScript AST | <150ms per file |
| NxProjectReader | 2 | Read Nx configuration | <200ms |
| GraphValidator | 2 | Validate graph integrity | <200ms |
| HybridStorage | 3 | Orchestrate storage | <50ms writes |
| SQLiteDatabase | 3 | Low-level DB operations | <50ms queries |
| JSONExporter | 3 | Export to JSON | <300ms (10K nodes) |
| GraphQueryAPI | 4 | High-level queries | <50ms |
| CLIQueryCommand | 4 | CLI interface | <100ms |

---

## 4. Data Flow Patterns

### 4.1 Incremental Update Flow

```
Git Commit → Git Hook → Change Detector → Graph Builder → Storage
   │            │             │                │             │
   │            │             │                │             ↓
   │            │             │                │         SQLite DB
   │            │             │                │             │
   │            │             │                ↓             │
   │            │             │           AST Parser        │
   │            │             │                │             │
   │            │             ↓                ↓             │
   │            │        File Changes → Graph Delta         │
   │            │                                            │
   │            ↓                                            ↓
   │       Async Process                            Update Complete
   │
   ↓
Developer workflow continues (non-blocking)
```

### 4.2 Query Flow

```
CLI Query → Command Parser → Query API → Storage Layer → SQLite DB
    │             │              │             │              │
    │             │              │             │              ↓
    │             │              │             │        Execute SQL
    │             │              │             │              │
    │             │              │             ↓              │
    │             │              │      Transform Results ←───┘
    │             │              │             │
    │             │              ↓             ↓
    │             │         Format Output ← Results
    │             │              │
    │             ↓              ↓
    │        Validate Args ← Formatted
    │             │
    ↓             ↓
Display Results ← Output
```

---

## 5. Integration Points

### 5.1 Nx Workspace Integration

**Purpose:** Read Nx project configuration to build project nodes

**Data Flow:**
```
nx.json → NxProjectReader → Project Nodes → Graph
project.json files → NxProjectReader → Project Metadata → Graph
```

**API Surface:**
- `NxProjectReader.readProjects()`: Read all projects
- `NxProjectReader.readConfig()`: Read Nx configuration

---

### 5.2 Agent Alchemy Specs Integration

**Purpose:** Parse specification files to create spec nodes

**Data Flow:**
```
*.specification.md → YAML Parser → Spec Metadata → Spec Nodes → Graph
```

**API Surface:**
- `SpecificationParser.parseSpec()`: Parse single spec
- `SpecificationParser.findRelated()`: Extract related specs from frontmatter

---

### 5.3 Git Hooks Integration

**Purpose:** Trigger automatic graph updates on Git events

**Hook Types:**
- `post-commit`: Update after commit
- `post-merge`: Update after merge/pull
- `post-checkout`: Update after branch switch

**Execution Mode:** Async, non-blocking

---

### 5.4 GitHub Actions Integration

**Purpose:** Automated graph updates in CI/CD

**Triggers:**
- Push to main/develop
- Pull request opened/synchronized

**Caching:** Graph database cached between runs

---

## 6. Security Architecture

### 6.1 Threat Model

| Threat | Attack Vector | Mitigation |
|--------|---------------|------------|
| SQL Injection | Malicious query input | Parameterized queries |
| Git Command Injection | Malicious commit hash | Input validation (regex) |
| Path Traversal | Malicious file path | Path resolution validation |
| Sensitive Data Leakage | Database exposure | No file contents stored |
| Database Corruption | Concurrent writes | ACID transactions, WAL mode |

### 6.2 Security Controls

**Input Validation:**
```typescript
// Validate commit hashes
const COMMIT_HASH_REGEX = /^[a-f0-9]{40}$/;
function validateCommitHash(hash: string): boolean {
  return COMMIT_HASH_REGEX.test(hash);
}

// Validate file paths
function validateFilePath(path: string, workspaceRoot: string): boolean {
  const resolved = path.resolve(workspaceRoot, path);
  return resolved.startsWith(workspaceRoot);
}
```

**Parameterized Queries:**
```typescript
// Always use parameterized queries
db.query('SELECT * FROM nodes WHERE id = ?', [nodeId]);
// Never string interpolation
// db.query(`SELECT * FROM nodes WHERE id = '${nodeId}'`); // NEVER!
```

---

## 7. Performance Architecture

### 7.1 Performance Budget

| Operation | Target | Baseline | Improvement |
|-----------|--------|----------|-------------|
| Single file update | 100ms | 2,200ms | 22x faster |
| 10 file update | 500ms | 2,200ms | 4.4x faster |
| Graph query | 50ms | 500ms | 10x faster |
| JSON export | 300ms | 100ms | 1x (acceptable) |

### 7.2 Optimization Strategies

**Caching:**
- In-memory AST parse cache (LRU)
- Query result cache (LRU, 1000 entries)
- File hash cache (avoid re-parsing)

**Indexing:**
- Database indexes on all foreign keys
- Composite indexes for common query patterns
- Path prefix indexes for spec discovery

**Parallelization:**
- Worker threads for AST parsing (large batches)
- Concurrent file reads (Promise.all)
- Async Git operations

---

## 8. Deployment Architecture

### 8.1 Local Development

```
workspace-root/
├── .workspace-graph/
│   ├── graph.db              # Primary storage (SQLite)
│   ├── graph.json            # JSON export (optional)
│   └── logs/
│       ├── update.log
│       └── hooks.log
├── .husky/
│   ├── post-commit
│   ├── post-merge
│   └── post-checkout
└── node_modules/
    └── @buildmotion-ai/workspace-graph/
```

### 8.2 CI/CD (GitHub Actions)

**Workflow:** `.github/workflows/workspace-graph.yml`

**Caching Strategy:**
- Cache key: `graph-${{ github.sha }}`
- Restore keys: `graph-${{ github.base_ref }}`
- Cached files: `.workspace-graph/graph.db`

---

## 9. Constitutional Compliance

### 9.1 Article I: Layer Boundaries ✅

- Layer 1 (Git) depends only on external libraries
- Layer 2 (Analysis) depends only on Layer 1
- Layer 3 (Storage) depends only on Layer 2
- Layer 4 (Query) depends only on Layer 3

**Validation:** Dependency graph analysis shows no circular dependencies

### 9.2 Article II: Separation of Concerns ✅

- Git operations isolated in Layer 1
- Graph logic isolated in Layer 2
- Storage logic isolated in Layer 3
- Query API isolated in Layer 4

**Validation:** Each layer has single, well-defined responsibility

### 9.3 Article III: Interface Contracts ✅

- All components have explicit interfaces
- Performance SLAs documented
- Error contracts specified
- Versioning strategy defined (semver)

---

## 10. Success Criteria

### 10.1 Architecture Validation

- [ ] All 8 core components implemented
- [ ] Layer dependencies validated (no violations)
- [ ] Performance targets met (benchmarks passing)
- [ ] Integration tests passing (Nx, Git, specs)
- [ ] Security audit passing (no critical vulnerabilities)

### 10.2 Performance Validation

- [ ] Incremental update <100ms (1 file)
- [ ] Incremental update <500ms (10 files)
- [ ] Graph query <50ms (dependents)
- [ ] JSON export <300ms (10K nodes)
- [ ] Git detection <60ms

---

## References

### Research Foundation
- **[Feasibility Analysis](../research/feasibility-analysis.specification.md):** Technology validation (95% confidence)
- **[User Research](../research/user-research.specification.md):** Pain points and requirements

### Planning Foundation
- **[Requirements](../plan/requirements.specification.md):** FR-001 to FR-010, NFR-001 to NFR-008
- **[Architecture Decisions](../plan/architecture-decisions.specification.md):** ADR-001 to ADR-008

### Related Architecture
- **[Data Models](./data-models.specification.md):** Database schema and interfaces
- **[API Contracts](./api-contracts.specification.md):** CLI and query API
- **[Component Design](./component-design.specification.md):** Detailed component implementation

---

**Document Status:** ✅ Architecture Design Complete  
**Last Updated:** 2025-01-29  
**Next Steps:** Generate component design specifications  
**Owner:** Agent Alchemy Architecture Team
