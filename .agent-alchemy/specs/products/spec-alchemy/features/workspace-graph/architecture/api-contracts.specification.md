---
meta:
  id: spec-alchemy-workspace-graph-api-contracts-specification
  title: Api Contracts Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: product:spec-alchemy
  tags: []
  createdBy: unknown
  createdAt: '2026-03-12'
  reviewedAt: null
title: Api Contracts Specification
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

# Workspace Graph: API Contracts Specification

---
version: 1.0.0
date: 2025-01-29
status: Architecture
category: API Contracts
complexity: Medium
phase: Architecture
owner: Agent Alchemy Architecture Team
related_specifications:
  - system-architecture.specification.md (Layer 4 Query API)
  - data-models.specification.md (Request/Response types)
priority: Critical
---

## Executive Summary

This specification defines all API contracts for the workspace graph system, including CLI commands, query API methods, error handling, and request/response formats. The API design prioritizes simplicity, performance, and backward compatibility.

### API Highlights

- **CLI Commands:** 5 primary commands (update, query, export, validate, migrate)
- **Query API Methods:** 8 graph query operations
- **Error Codes:** 15 standardized error codes
- **Performance SLAs:** <100ms CLI response, <50ms query execution
- **Versioning Strategy:** Semantic versioning (v2.0.0)

---

## 1. CLI API

### 1.1 Update Command

```bash
nx workspace-graph:update [options]

Options:
  --incremental          Use incremental update (default: true)
  --full                 Force full rebuild
  --from <commit>        Source commit/branch for diff
  --to <commit>          Target commit/branch for diff
  --hook <name>          Hook that triggered update (post-commit, post-merge)
  --verbose              Enable verbose logging

Examples:
  # Incremental update (auto-detect changes)
  nx workspace-graph:update

  # Full rebuild
  nx workspace-graph:update --full

  # Update from specific commit range
  nx workspace-graph:update --from=HEAD~5 --to=HEAD

Exit Codes:
  0 - Success
  1 - Update failed
  2 - Validation failed
  3 - Git error
```

**Performance SLA:** <100ms for single file, <500ms for 10 files

---

### 1.2 Query Command

```bash
nx workspace-graph:query <query-type> <target> [options]

Query Types:
  --dependents <path>       Find all files that depend on target
  --imports <path>          Find all files that target imports
  --specs <feature>         Find all specifications for feature
  --projects               List all projects
  --circular               Find circular dependencies
  --orphans [type]         Find orphaned nodes

Options:
  --depth <number>         Traversal depth (default: 1, use Infinity for transitive)
  --format <format>        Output format (text, json, tree) (default: text)
  --output <file>          Write results to file

Examples:
  # Find all dependents of a file
  nx workspace-graph:query --dependents=libs/auth/user.service.ts

  # Find transitive dependents (2 levels deep)
  nx workspace-graph:query --dependents=libs/auth/user.service.ts --depth=2

  # Find all specs for authentication feature
  nx workspace-graph:query --specs=auth

  # Find circular dependencies
  nx workspace-graph:query --circular

  # Export as JSON
  nx workspace-graph:query --dependents=file.ts --format=json > results.json

Exit Codes:
  0 - Query successful
  1 - Query failed
  2 - Target not found
  3 - Invalid query parameters
```

**Performance SLA:** <50ms query execution, <100ms total CLI response

---

### 1.3 Export Command

```bash
nx workspace-graph:export [options]

Options:
  --format <format>        Export format (json, graphml, dot) (default: json)
  --output <file>          Output file path (default: .workspace-graph/graph.json)
  --filter <type>          Filter by node type (file, project, spec)
  --validate               Validate export against schema

Examples:
  # Export as JSON (default)
  nx workspace-graph:export

  # Export only spec nodes
  nx workspace-graph:export --filter=spec --output=specs.json

  # Export with validation
  nx workspace-graph:export --validate

Exit Codes:
  0 - Export successful
  1 - Export failed
  2 - Validation failed
```

**Performance SLA:** <300ms for 10K nodes

---

### 1.4 Validate Command

```bash
nx workspace-graph:validate [options]

Options:
  --fix                    Auto-fix issues (orphaned edges, missing nodes)
  --verbose                Show detailed validation results

Examples:
  # Validate graph integrity
  nx workspace-graph:validate

  # Validate and auto-fix issues
  nx workspace-graph:validate --fix

Exit Codes:
  0 - Graph valid
  1 - Validation errors found
  2 - Cannot auto-fix errors
```

**Performance SLA:** <200ms for integrity checks

---

### 1.5 Migrate Command

```bash
nx workspace-graph:migrate <source> <target> [options]

Options:
  --validate               Validate migration (roundtrip test)
  --backup                 Create backup before migration

Examples:
  # Migrate from JSON to SQLite
  nx workspace-graph:migrate --from=json --to=sqlite

  # Migrate with validation
  nx workspace-graph:migrate --from=json --to=sqlite --validate

Exit Codes:
  0 - Migration successful
  1 - Migration failed
  2 - Validation failed
```

**Performance SLA:** <5s for 10K nodes

---

## 2. Programmatic API

### 2.1 Query API Methods

```typescript
/**
 * High-level graph query API.
 */
export class GraphQueryAPI {
  /**
   * Find all dependents of a node.
   * @param nodeId - Node ID or file path
   * @param depth - Traversal depth (1 = direct, Infinity = transitive)
   * @returns Dependent nodes
   * @performance <50ms for depth=1
   */
  async findDependents(
    nodeId: string,
    depth: number = 1
  ): Promise<GraphNode[]>;

  /**
   * Find all imports of a node.
   * @param nodeId - Node ID or file path
   * @returns Imported nodes
   * @performance <30ms
   */
  async findImports(nodeId: string): Promise<GraphNode[]>;

  /**
   * Find all specifications for a feature.
   * @param featurePath - Feature directory path
   * @returns Spec nodes
   * @performance <200ms
   */
  async findSpecs(featurePath: string): Promise<GraphNode[]>;

  /**
   * Find all projects in workspace.
   * @returns Project nodes
   * @performance <50ms
   */
  async findProjects(): Promise<GraphNode[]>;

  /**
   * Find circular dependencies.
   * @returns Circular dependency cycles
   * @performance <180ms for 10K nodes
   */
  async findCircularDependencies(): Promise<CircularDependency[]>;

  /**
   * Find orphaned nodes (no edges).
   * @param nodeType - Optional type filter
   * @returns Orphaned nodes
   * @performance <50ms
   */
  async findOrphans(nodeType?: NodeType): Promise<GraphNode[]>;

  /**
   * Find path between two nodes (shortest path).
   * @param sourceId - Source node ID
   * @param targetId - Target node ID
   * @returns Path (array of node IDs) or null
   * @performance <100ms
   */
  async findPath(
    sourceId: string,
    targetId: string
  ): Promise<string[] | null>;

  /**
   * Get node by ID or path.
   * @param idOrPath - Node ID or file path
   * @returns Node or null
   * @performance <10ms
   */
  async getNode(idOrPath: string): Promise<GraphNode | null>;
}
```

---

### 2.2 Update API Methods

```typescript
/**
 * Graph update API.
 */
export class GraphUpdateAPI {
  /**
   * Update graph incrementally based on Git changes.
   * @param from - Source commit/branch
   * @param to - Target commit/branch
   * @returns Update result
   * @performance <100ms for 1 file, <500ms for 10 files
   */
  async updateIncremental(
    from: string = 'HEAD',
    to?: string
  ): Promise<UpdateResult>;

  /**
   * Rebuild graph from scratch.
   * @returns Build result
   * @performance 2-3s for 1,200 files
   */
  async buildFull(): Promise<BuildResult>;

  /**
   * Validate graph integrity.
   * @returns Validation result
   * @performance <200ms
   */
  async validate(): Promise<ValidationResult>;
}
```

---

### 2.3 Export API Methods

```typescript
/**
 * Graph export API.
 */
export class GraphExportAPI {
  /**
   * Export graph to JSON format.
   * @param outputPath - Output file path
   * @param filter - Optional node type filter
   * @performance <300ms for 10K nodes
   */
  async exportJSON(
    outputPath: string,
    filter?: NodeTypeFilter
  ): Promise<void>;

  /**
   * Export graph to GraphML format (for visualization).
   * @param outputPath - Output file path
   * @performance <500ms for 10K nodes
   */
  async exportGraphML(outputPath: string): Promise<void>;

  /**
   * Export graph to DOT format (Graphviz).
   * @param outputPath - Output file path
   * @performance <400ms for 10K nodes
   */
  async exportDOT(outputPath: string): Promise<void>;
}
```

---

## 3. Request/Response Formats

### 3.1 CLI Output Formats

**Text Format (Default):**
```
✓ Found 12 dependents (8ms)

Direct Dependencies (8):
  libs/features/login/src/lib/login.component.ts
  libs/features/profile/src/lib/profile.service.ts
  libs/features/admin/src/lib/user-management.component.ts
  ...

Transitive Dependencies (4):
  apps/web/src/app/app.component.ts
  apps/admin/src/app/app.component.ts
  ...
```

**JSON Format:**
```json
{
  "query": {
    "type": "dependents",
    "target": "libs/auth/user.service.ts",
    "depth": 1
  },
  "results": {
    "direct": [
      {
        "id": "node_libs_features_login_login.component.ts",
        "path": "libs/features/login/src/lib/login.component.ts",
        "type": "file"
      }
    ],
    "transitive": [ /* ... */ ]
  },
  "metadata": {
    "executionTimeMs": 8,
    "resultCount": 12,
    "timestamp": 1706558400000
  }
}
```

**Tree Format:**
```
libs/auth/user.service.ts
├── libs/features/login/src/lib/login.component.ts
│   └── apps/web/src/app/app.component.ts
├── libs/features/profile/src/lib/profile.service.ts
│   └── apps/web/src/app/profile/profile.component.ts
└── libs/features/admin/src/lib/user-management.component.ts
    └── apps/admin/src/app/admin.component.ts
```

---

## 4. Error Handling

### 4.1 Error Codes

| Code | Name | Description | HTTP Status |
|------|------|-------------|-------------|
| `GRAPH_NOT_FOUND` | Graph Not Found | Graph database not initialized | 404 |
| `NODE_NOT_FOUND` | Node Not Found | Specified node does not exist | 404 |
| `INVALID_NODE_TYPE` | Invalid Node Type | Node type not recognized | 400 |
| `INVALID_QUERY` | Invalid Query | Query parameters invalid | 400 |
| `GIT_ERROR` | Git Error | Git command failed | 500 |
| `DATABASE_ERROR` | Database Error | SQLite error | 500 |
| `PARSE_ERROR` | Parse Error | AST parsing failed | 500 |
| `VALIDATION_ERROR` | Validation Error | Graph integrity check failed | 422 |
| `MIGRATION_ERROR` | Migration Error | JSON to SQLite migration failed | 500 |
| `CIRCULAR_DEPENDENCY` | Circular Dependency | Circular import detected | 422 |

### 4.2 Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: string;
    suggestions?: string[];
  };
  metadata: {
    timestamp: number;
    requestId?: string;
  };
}
```

**Example:**
```json
{
  "error": {
    "code": "NODE_NOT_FOUND",
    "message": "Node 'FakeService' not found in graph",
    "details": "No node with ID or path matching 'FakeService'",
    "suggestions": [
      "UserService (libs/auth/user.service.ts)",
      "AuthService (libs/auth/auth.service.ts)"
    ]
  },
  "metadata": {
    "timestamp": 1706558400000
  }
}
```

---

## 5. API Versioning

### 5.1 Versioning Strategy

**Semantic Versioning:** `MAJOR.MINOR.PATCH`

- **MAJOR:** Breaking API changes
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes (backward compatible)

**Current Version:** v2.0.0

### 5.2 Version Compatibility

| Version | CLI Compatibility | JSON Format | Database Schema |
|---------|-------------------|-------------|-----------------|
| v1.0.0 | ✅ | JSON only | N/A |
| v2.0.0 | ✅ (extends v1.0.0) | JSON (backward compatible) | SQLite v1 |

---

## 6. Performance SLAs

| Operation | Target | Measurement Method |
|-----------|--------|-------------------|
| CLI update (1 file) | <100ms | End-to-end benchmark |
| CLI update (10 files) | <500ms | End-to-end benchmark |
| CLI query (dependents) | <100ms | End-to-end (query + format) |
| Query API (findDependents) | <50ms | Query execution only |
| JSON export (10K nodes) | <300ms | Full export benchmark |
| Graph validation | <200ms | Integrity check benchmark |

---

## References

- **[System Architecture](./system-architecture.specification.md):** Layer 4 Query API design
- **[Data Models](./data-models.specification.md):** Request/response types
- **[Requirements](../plan/requirements.specification.md):** FR-005 (CLI Interface)

---

**Document Status:** ✅ API Contracts Complete  
**Last Updated:** 2025-01-29  
**Owner:** Agent Alchemy Architecture Team
