---
meta:
  id: spec-alchemy-workspace-graph-implementation-guide-specification
  title: Implementation Guide Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: product:spec-alchemy
  tags: []
  createdBy: unknown
  createdAt: '2026-03-12'
  reviewedAt: null
title: Implementation Guide Specification
category: Products
feature: workspace-graph
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: '1.0'
aiContext: true
product: spec-alchemy
phase: development
applyTo: []
keywords: []
topics: []
useCases: []
---

# Workspace Graph: Implementation Guide Specification

---
version: 1.0.0
date: 2025-01-29
status: Development
category: Implementation Guide
complexity: High
phase: Development
owner: Agent Alchemy Developer Team
research_basis:
  - ../research/feasibility-analysis.specification.md (95% technical feasibility)
  - ../plan/requirements.specification.md (FR-001 to FR-010)
  - ../plan/architecture-decisions.specification.md (ADR-001 to ADR-008)
architecture_basis:
  - ../architecture/system-architecture.specification.md (4-layer architecture)
  - ../architecture/component-design.specification.md (11 core components)
  - ../architecture/data-models.specification.md (SQLite schema)
  - ../architecture/performance-design.specification.md (20-30x targets)
related_specifications:
  - code-structure.specification.md
  - development-environment.specification.md
  - integration-points.specification.md
  - testing-strategy.specification.md
priority: Critical
estimated_effort: 8-10 weeks (3 phases)
---

## Executive Summary

Step-by-step implementation guide for building the workspace graph incremental update system. This guide transforms architectural designs into executable development tasks across 5 major phases.

### Implementation Phases

**Phase 1: Git Integration Layer (Weeks 1-2)**
- GitChangeDetector class with simple-git integration
- File change detection (<60ms)
- Git repository wrapper

**Phase 2: Incremental Analysis (Weeks 3-4)**
- IncrementalGraphBuilder with partial re-analysis
- AST parser optimization
- Graph validation

**Phase 3: Hybrid Storage (Weeks 5-6)**
- HybridGraphStorage with SQLite + JSON
- Migration utilities
- Backward compatibility

**Phase 4: Query API (Week 7)**
- GraphQueryAPI implementation
- Performance optimization (<50ms queries)

**Phase 5: CLI Integration (Week 8)**
- CLI enhancements (--incremental, --validate)
- Integration with existing workspace-graph-builder.ts

### Success Criteria

- ✅ 20-30x performance improvement (2.2s → 65-100ms)
- ✅ 80%+ test coverage (MANDATORY)
- ✅ 100% backward compatible with JSON output
- ✅ All 18 requirements (10 functional + 8 non-functional) met
- ✅ Constitutional AI compliance

---

## 1. Phase 1: Git Integration Layer (Weeks 1-2)

### 1.1 GitChangeDetector Implementation

**Objective:** Detect changed files via Git diff with <60ms performance target.

#### Step 1.1.1: Create GitChangeDetector Class

**File:** `libs/shared/workspace-graph/workspace-graph/src/lib/git/git-change-detector.ts`

```typescript
import simpleGit, { SimpleGit, DiffResult } from 'simple-git';
import { Logger } from '@buildmotion-ai/logging';

/**
 * Git change detection configuration
 */
export interface GitChangeDetectorConfig {
  /** Workspace root directory (absolute path) */
  workspaceRoot: string;
  /** Base commit for diff comparison (default: 'HEAD~1') */
  baseCommit?: string;
  /** Target commit for diff comparison (default: 'HEAD') */
  targetCommit?: string;
  /** File patterns to include (default: ['**/*.ts', '**/*.md']) */
  includePatterns?: string[];
  /** File patterns to exclude (default: ['**/node_modules/**']) */
  excludePatterns?: string[];
}

/**
 * Git change detection result
 */
export interface GitChangeResult {
  /** Files added since baseCommit */
  added: string[];
  /** Files modified since baseCommit */
  modified: string[];
  /** Files deleted since baseCommit */
  deleted: string[];
  /** All changed files (added + modified) */
  changed: string[];
  /** Base commit SHA */
  baseCommit: string;
  /** Target commit SHA */
  targetCommit: string;
  /** Detection timestamp (Unix epoch ms) */
  timestamp: number;
}

/**
 * Detects file changes via Git diff operations.
 * 
 * Performance Target: <60ms for typical repository
 * 
 * @example
 * ```typescript
 * const detector = new GitChangeDetector({
 *   workspaceRoot: '/path/to/workspace',
 *   baseCommit: 'HEAD~5',
 *   includePatterns: ['**\/*.ts']
 * });
 * 
 * const changes = await detector.detectChanges();
 * console.log(`Changed files: ${changes.changed.length}`);
 * ```
 */
export class GitChangeDetector {
  private readonly git: SimpleGit;
  private readonly logger: Logger;
  private readonly config: Required<GitChangeDetectorConfig>;

  constructor(config: GitChangeDetectorConfig, logger?: Logger) {
    this.logger = logger ?? new Logger('GitChangeDetector');
    
    // Apply defaults
    this.config = {
      workspaceRoot: config.workspaceRoot,
      baseCommit: config.baseCommit ?? 'HEAD~1',
      targetCommit: config.targetCommit ?? 'HEAD',
      includePatterns: config.includePatterns ?? ['**/*.ts', '**/*.md', '**/project.json'],
      excludePatterns: config.excludePatterns ?? ['**/node_modules/**', '**/dist/**']
    };

    // Initialize simple-git
    this.git = simpleGit({
      baseDir: this.config.workspaceRoot,
      binary: 'git',
      maxConcurrentProcesses: 6,
      trimmed: true
    });

    this.logger.debug('GitChangeDetector initialized', { config: this.config });
  }

  /**
   * Detect changed files between base and target commits.
   * 
   * @returns GitChangeResult with categorized file changes
   * @throws Error if Git operations fail or repository is invalid
   */
  async detectChanges(): Promise<GitChangeResult> {
    const startTime = Date.now();

    try {
      // Validate repository
      await this.validateRepository();

      // Resolve commit SHAs
      const baseCommitSha = await this.resolveCommit(this.config.baseCommit);
      const targetCommitSha = await this.resolveCommit(this.config.targetCommit);

      this.logger.debug('Detecting changes', { baseCommitSha, targetCommitSha });

      // Get diff summary
      const diffSummary = await this.git.diffSummary([
        baseCommitSha,
        targetCommitSha,
        '--'
      ]);

      // Categorize changes
      const added: string[] = [];
      const modified: string[] = [];
      const deleted: string[] = [];

      for (const file of diffSummary.files) {
        const relativePath = file.file;

        // Apply include/exclude filters
        if (!this.shouldIncludeFile(relativePath)) {
          continue;
        }

        // Categorize by change type
        if (file.binary) {
          this.logger.debug('Skipping binary file', { file: relativePath });
          continue;
        }

        // Detect file status from insertions/deletions
        const fileDeleted = file.deletions > 0 && file.insertions === 0;
        const fileAdded = file.insertions > 0 && file.deletions === 0;

        if (fileDeleted) {
          deleted.push(relativePath);
        } else if (fileAdded) {
          added.push(relativePath);
        } else {
          modified.push(relativePath);
        }
      }

      const result: GitChangeResult = {
        added,
        modified,
        deleted,
        changed: [...added, ...modified],
        baseCommit: baseCommitSha,
        targetCommit: targetCommitSha,
        timestamp: Date.now()
      };

      const duration = Date.now() - startTime;
      this.logger.info('Git change detection complete', {
        duration,
        changedFiles: result.changed.length,
        added: added.length,
        modified: modified.length,
        deleted: deleted.length
      });

      // Performance assertion
      if (duration > 60) {
        this.logger.warn('Git change detection exceeded 60ms target', { duration });
      }

      return result;
    } catch (error) {
      this.logger.error('Git change detection failed', error as Error);
      throw new Error(`Git change detection failed: ${(error as Error).message}`);
    }
  }

  /**
   * Validate that the workspace is a valid Git repository.
   * 
   * @throws Error if repository is invalid or Git is not available
   */
  private async validateRepository(): Promise<void> {
    try {
      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) {
        throw new Error(`Not a Git repository: ${this.config.workspaceRoot}`);
      }
    } catch (error) {
      throw new Error(`Git repository validation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Resolve commit reference to SHA.
   * 
   * @param commitRef - Commit reference (e.g., 'HEAD', 'HEAD~1', SHA)
   * @returns Resolved commit SHA
   */
  private async resolveCommit(commitRef: string): Promise<string> {
    try {
      const sha = await this.git.revparse([commitRef]);
      return sha.trim();
    } catch (error) {
      throw new Error(`Failed to resolve commit '${commitRef}': ${(error as Error).message}`);
    }
  }

  /**
   * Check if file should be included based on include/exclude patterns.
   * 
   * @param filePath - Relative file path
   * @returns true if file should be included
   */
  private shouldIncludeFile(filePath: string): boolean {
    // Check exclude patterns
    for (const pattern of this.config.excludePatterns) {
      if (this.matchPattern(filePath, pattern)) {
        return false;
      }
    }

    // Check include patterns
    for (const pattern of this.config.includePatterns) {
      if (this.matchPattern(filePath, pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Match file path against glob pattern.
   * 
   * @param filePath - File path to test
   * @param pattern - Glob pattern (supports ** and *)
   * @returns true if path matches pattern
   */
  private matchPattern(filePath: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }
}
```

#### Step 1.1.2: Create Unit Tests

**File:** `libs/shared/workspace-graph/workspace-graph/src/lib/git/git-change-detector.spec.ts`

See testing-strategy.specification.md for complete test implementation.

---

## 2. Phase 2: Incremental Graph Builder (Weeks 3-4)

### 2.1 IncrementalGraphBuilder Implementation

**File:** `libs/shared/workspace-graph/workspace-graph/src/lib/incremental/incremental-graph-builder.ts`

```typescript
import { Logger } from '@buildmotion-ai/logging';
import { GitChangeDetector, GitChangeResult } from '../git/git-change-detector';
import { HybridGraphStorage } from '../storage/hybrid-graph-storage';
import { WorkspaceGraph, GraphNode, GraphEdge } from '../types';

/**
 * Incremental graph builder configuration
 */
export interface IncrementalGraphBuilderConfig {
  /** Workspace root directory */
  workspaceRoot: string;
  /** Storage instance */
  storage: HybridGraphStorage;
  /** Git change detector instance */
  changeDetector: GitChangeDetector;
  /** Enable validation after updates (default: true) */
  validateAfterUpdate?: boolean;
  /** Maximum parallel file processing (default: 4) */
  maxParallel?: number;
}

/**
 * Incremental build result
 */
export interface IncrementalBuildResult {
  /** Updated graph */
  graph: WorkspaceGraph;
  /** Number of nodes updated */
  nodesUpdated: number;
  /** Number of edges updated */
  edgesUpdated: number;
  /** Files processed */
  filesProcessed: string[];
  /** Build duration (ms) */
  duration: number;
  /** Validation result (if enabled) */
  validationResult?: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}

/**
 * Builds workspace graph incrementally based on Git changes.
 * 
 * Performance Target: <100ms per file update
 * 
 * @example
 * ```typescript
 * const builder = new IncrementalGraphBuilder({
 *   workspaceRoot: '/workspace',
 *   storage: hybridStorage,
 *   changeDetector: gitDetector
 * });
 * 
 * const result = await builder.buildIncremental();
 * console.log(`Updated ${result.nodesUpdated} nodes in ${result.duration}ms`);
 * ```
 */
export class IncrementalGraphBuilder {
  private readonly logger: Logger;
  private readonly config: Required<IncrementalGraphBuilderConfig>;

  constructor(config: IncrementalGraphBuilderConfig) {
    this.logger = new Logger('IncrementalGraphBuilder');
    
    this.config = {
      workspaceRoot: config.workspaceRoot,
      storage: config.storage,
      changeDetector: config.changeDetector,
      validateAfterUpdate: config.validateAfterUpdate ?? true,
      maxParallel: config.maxParallel ?? 4
    };
  }

  /**
   * Build graph incrementally based on Git changes.
   * 
   * @returns IncrementalBuildResult with updated graph
   */
  async buildIncremental(): Promise<IncrementalBuildResult> {
    const startTime = Date.now();

    try {
      // Step 1: Detect changes
      this.logger.info('Detecting Git changes...');
      const changes = await this.config.changeDetector.detectChanges();

      this.logger.info('Git changes detected', {
        added: changes.added.length,
        modified: changes.modified.length,
        deleted: changes.deleted.length
      });

      // Step 2: Load existing graph
      const existingGraph = await this.config.storage.loadGraph();

      // Step 3: Process changes
      const updatedGraph = await this.processChanges(existingGraph, changes);

      // Step 4: Save updated graph
      await this.config.storage.saveGraph(updatedGraph);

      const result: IncrementalBuildResult = {
        graph: updatedGraph,
        nodesUpdated: changes.changed.length + changes.deleted.length,
        edgesUpdated: this.calculateEdgeUpdates(existingGraph, updatedGraph),
        filesProcessed: changes.changed,
        duration: Date.now() - startTime
      };

      this.logger.info('Incremental build complete', {
        duration: result.duration,
        nodesUpdated: result.nodesUpdated,
        edgesUpdated: result.edgesUpdated
      });

      return result;
    } catch (error) {
      this.logger.error('Incremental build failed', error as Error);
      throw new Error(`Incremental build failed: ${(error as Error).message}`);
    }
  }

  /**
   * Process file changes and update graph.
   */
  private async processChanges(
    graph: WorkspaceGraph,
    changes: GitChangeResult
  ): Promise<WorkspaceGraph> {
    const updatedGraph = { ...graph };

    // Process deletions first
    for (const deletedFile of changes.deleted) {
      this.removeNode(updatedGraph, deletedFile);
    }

    // Process additions and modifications
    for (const file of changes.changed) {
      await this.processFile(updatedGraph, file);
    }

    return updatedGraph;
  }

  /**
   * Process single file and update graph.
   */
  private async processFile(graph: WorkspaceGraph, filePath: string): Promise<void> {
    try {
      const nodeId = this.generateNodeId(filePath);
      const node: GraphNode = {
        id: nodeId,
        type: this.determineNodeType(filePath),
        path: filePath,
        metadata: {},
        createdAt: graph.nodes[nodeId]?.createdAt ?? Date.now(),
        updatedAt: Date.now()
      };

      graph.nodes[nodeId] = node;
    } catch (error) {
      this.logger.error(`Failed to process file: ${filePath}`, error as Error);
    }
  }

  /**
   * Remove node and associated edges from graph.
   */
  private removeNode(graph: WorkspaceGraph, filePath: string): void {
    const nodeId = this.generateNodeId(filePath);
    delete graph.nodes[nodeId];
    graph.edges = graph.edges.filter(
      edge => edge.source !== nodeId && edge.target !== nodeId
    );
  }

  /**
   * Generate node ID from file path.
   */
  private generateNodeId(filePath: string): string {
    return `node_${filePath.replace(/[/\\]/g, '_').replace(/\./g, '_')}`;
  }

  /**
   * Determine node type from file path.
   */
  private determineNodeType(filePath: string): 'file' | 'spec' | 'project' {
    if (filePath.endsWith('project.json')) return 'project';
    if (filePath.includes('.specification.md')) return 'spec';
    return 'file';
  }

  /**
   * Calculate number of edge updates between graphs.
   */
  private calculateEdgeUpdates(oldGraph: WorkspaceGraph, newGraph: WorkspaceGraph): number {
    const oldEdgeIds = new Set(oldGraph.edges.map(e => e.id));
    const newEdgeIds = new Set(newGraph.edges.map(e => e.id));
    
    let updates = 0;
    newEdgeIds.forEach(id => {
      if (!oldEdgeIds.has(id)) updates++;
    });
    oldEdgeIds.forEach(id => {
      if (!newEdgeIds.has(id)) updates++;
    });
    
    return updates;
  }
}
```

---

## 3. Phase 3: Hybrid Storage (Weeks 5-6)

### 3.1 SQLiteAdapter Implementation

**File:** `libs/shared/workspace-graph/workspace-graph/src/lib/storage/sqlite-adapter.ts`

```typescript
import Database from 'better-sqlite3';
import { Logger } from '@buildmotion-ai/logging';
import { WorkspaceGraph, GraphNode, GraphEdge } from '../types';

/**
 * SQLite database adapter for workspace graph storage.
 * 
 * Performance Targets:
 * - Query: <50ms
 * - Insert: <100ms
 * - Full graph load: <300ms
 */
export class SQLiteAdapter {
  private db: Database.Database;
  private readonly logger: Logger;

  constructor(dbPath: string, logger?: Logger) {
    this.logger = logger ?? new Logger('SQLiteAdapter');
    
    this.db = new Database(dbPath);
    this.initializeDatabase();
  }

  /**
   * Initialize database schema with tables and indexes.
   */
  private initializeDatabase(): void {
    // Enable optimizations
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('temp_store = MEMORY');
    this.db.pragma('foreign_keys = ON');

    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS nodes (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('project', 'file', 'spec', 'guardrail')),
        path TEXT NOT NULL UNIQUE,
        metadata JSON,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS edges (
        id TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        target TEXT NOT NULL,
        type TEXT NOT NULL,
        metadata JSON,
        FOREIGN KEY (source) REFERENCES nodes(id) ON DELETE CASCADE,
        FOREIGN KEY (target) REFERENCES nodes(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS graph_versions (
        version INTEGER PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        commit_sha TEXT,
        node_count INTEGER NOT NULL,
        edge_count INTEGER NOT NULL,
        metadata JSON
      );

      CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(type);
      CREATE INDEX IF NOT EXISTS idx_nodes_path ON nodes(path);
      CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source);
      CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target);
      CREATE INDEX IF NOT EXISTS idx_edges_type ON edges(type);
    `);

    this.logger.info('SQLite database initialized');
  }

  /**
   * Save complete graph to database.
   */
  saveGraph(graph: WorkspaceGraph): void {
    const transaction = this.db.transaction(() => {
      // Clear existing data
      this.db.prepare('DELETE FROM edges').run();
      this.db.prepare('DELETE FROM nodes').run();

      // Insert nodes
      const insertNode = this.db.prepare(`
        INSERT INTO nodes (id, type, path, metadata, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const node of Object.values(graph.nodes)) {
        insertNode.run(
          node.id,
          node.type,
          node.path,
          JSON.stringify(node.metadata),
          node.createdAt,
          node.updatedAt
        );
      }

      // Insert edges
      const insertEdge = this.db.prepare(`
        INSERT INTO edges (id, source, target, type, metadata)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const edge of graph.edges) {
        insertEdge.run(
          edge.id,
          edge.source,
          edge.target,
          edge.type,
          JSON.stringify(edge.metadata ?? {})
        );
      }
    });

    transaction();
    this.logger.info('Graph saved to SQLite');
  }

  /**
   * Load complete graph from database.
   */
  loadGraph(): WorkspaceGraph {
    const nodes: Record<string, GraphNode> = {};
    const nodeRows = this.db.prepare('SELECT * FROM nodes').all() as any[];

    for (const row of nodeRows) {
      nodes[row.id] = {
        id: row.id,
        type: row.type,
        path: row.path,
        metadata: JSON.parse(row.metadata),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    }

    const edges: GraphEdge[] = [];
    const edgeRows = this.db.prepare('SELECT * FROM edges').all() as any[];

    for (const row of edgeRows) {
      edges.push({
        id: row.id,
        source: row.source,
        target: row.target,
        type: row.type,
        metadata: JSON.parse(row.metadata)
      });
    }

    return {
      nodes,
      edges,
      version: 1,
      metadata: {}
    };
  }

  /**
   * Query nodes by type.
   */
  queryNodesByType(type: string): GraphNode[] {
    const rows = this.db.prepare('SELECT * FROM nodes WHERE type = ?').all(type) as any[];
    
    return rows.map(row => ({
      id: row.id,
      type: row.type,
      path: row.path,
      metadata: JSON.parse(row.metadata),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  /**
   * Close database connection.
   */
  close(): void {
    this.db.close();
  }
}
```

### 3.2 HybridGraphStorage Implementation

**File:** `libs/shared/workspace-graph/workspace-graph/src/lib/storage/hybrid-graph-storage.ts`

```typescript
import { SQLiteAdapter } from './sqlite-adapter';
import { WorkspaceGraph } from '../types';
import { Logger } from '@buildmotion-ai/logging';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Hybrid storage combining SQLite (primary) and JSON (export).
 */
export class HybridGraphStorage {
  private readonly sqliteAdapter: SQLiteAdapter;
  private readonly logger: Logger;
  private readonly jsonPath: string;

  constructor(
    private readonly storageDir: string,
    logger?: Logger
  ) {
    this.logger = logger ?? new Logger('HybridGraphStorage');

    const dbPath = path.join(storageDir, 'graph.db');
    this.jsonPath = path.join(storageDir, 'workspace-graph.json');

    this.sqliteAdapter = new SQLiteAdapter(dbPath, this.logger);
  }

  /**
   * Save graph to both SQLite and JSON.
   */
  async saveGraph(graph: WorkspaceGraph): Promise<void> {
    // Save to SQLite (primary storage)
    this.sqliteAdapter.saveGraph(graph);

    // Export to JSON (backward compatibility)
    await fs.writeFile(this.jsonPath, JSON.stringify(graph, null, 2));
  }

  /**
   * Load graph from SQLite (fallback to JSON if SQLite empty).
   */
  async loadGraph(): Promise<WorkspaceGraph> {
    try {
      const graph = this.sqliteAdapter.loadGraph();
      
      if (Object.keys(graph.nodes).length > 0) {
        return graph;
      }

      // Fallback to JSON if SQLite is empty
      const jsonContent = await fs.readFile(this.jsonPath, 'utf-8');
      const jsonGraph = JSON.parse(jsonContent);
      
      // Migrate to SQLite
      this.sqliteAdapter.saveGraph(jsonGraph);
      return jsonGraph;
    } catch (error) {
      return { nodes: {}, edges: [], version: 1, metadata: {} };
    }
  }

  /**
   * Query nodes by type (uses SQLite).
   */
  queryNodesByType(type: string): GraphNode[] {
    return this.sqliteAdapter.queryNodesByType(type);
  }

  /**
   * Close storage connections.
   */
  close(): void {
    this.sqliteAdapter.close();
  }
}
```

---

## 4. Phase 4: Query API (Week 7)

**File:** `libs/shared/workspace-graph/workspace-graph/src/lib/query/graph-query-api.ts`

```typescript
import { HybridGraphStorage } from '../storage/hybrid-graph-storage';
import { GraphNode } from '../types';
import { Logger } from '@buildmotion-ai/logging';

/**
 * Query API for workspace graph.
 * 
 * Performance Target: <50ms per query
 */
export class GraphQueryAPI {
  constructor(
    private readonly storage: HybridGraphStorage,
    private readonly logger?: Logger
  ) {}

  /**
   * Get all nodes of a specific type.
   */
  async getNodesByType(type: string): Promise<GraphNode[]> {
    const startTime = Date.now();
    const nodes = this.storage.queryNodesByType(type);
    
    const duration = Date.now() - startTime;
    this.logger?.debug('Query nodes by type', { type, count: nodes.length, duration });
    
    return nodes;
  }

  /**
   * Get node dependencies (outgoing edges).
   */
  async getNodeDependencies(nodeId: string): Promise<GraphNode[]> {
    const graph = await this.storage.loadGraph();
    
    const dependencyIds = graph.edges
      .filter(edge => edge.source === nodeId)
      .map(edge => edge.target);
    
    return dependencyIds.map(id => graph.nodes[id]).filter(Boolean);
  }
}
```

---

## 5. Phase 5: CLI Integration (Week 8)

Add incremental flag to existing CLI:

```typescript
// In existing CLI file
program
  .command('build')
  .option('--incremental', 'Use incremental build based on Git changes')
  .action(async (options) => {
    if (options.incremental) {
      const builder = new IncrementalGraphBuilder({
        workspaceRoot: process.cwd(),
        storage: new HybridGraphStorage('.workspace-graph'),
        changeDetector: new GitChangeDetector({ workspaceRoot: process.cwd() })
      });

      const result = await builder.buildIncremental();
      console.log(`✅ Updated ${result.nodesUpdated} nodes in ${result.duration}ms`);
    }
  });
```

---

## Success Criteria

| Requirement | Target | Validation |
|-------------|--------|------------|
| Git detection performance | <60ms | Performance tests |
| Incremental update performance | <100ms/file | Benchmarks |
| Query performance | <50ms | Load tests |
| Test coverage | 80%+ | Jest reports |
| Backward compatibility | 100% | Integration tests |

---

**Document Status:** ✅ Implementation Guide Complete  
**Last Updated:** 2025-01-29
