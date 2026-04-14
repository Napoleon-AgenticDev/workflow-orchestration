---
meta:
  id: spec-alchemy-workspace-graph-v2-performance-design-specification
  title: "Performance Design"
  version: 0.1.0
  status: draft
  specType: specification
  scope: "product:spec-alchemy"
  createdBy: "Agent Alchemy Developer Agent"
  createdAt: '2026-03-20'
  category: Products
  feature: workspace-graph-v2
  phase: architecture
---

# Performance Design Specification — workspace-graph-v2

| Field    | Value           |
| -------- | --------------- |
| version  | 1.0.0           |
| date     | 2026-03-20      |
| status   | Draft           |
| category | Architecture    |

---

## Executive Summary

The V2 graph engine must be measurably faster than V1 for every user-facing operation while supporting a richer data model (18 node types, 15 edge types). This specification defines concrete latency targets, explains the optimisation strategies employed to hit them, and establishes a benchmark methodology for regression detection in CI.

The dominant cost drivers are:

1. **ts-morph AST extraction** — CPU-bound; optimised via batching and project caching.
2. **In-memory graph construction** — allocation-heavy; optimised via Map-based indexes.
3. **MCP tool call latency** — I/O + serialisation; optimised via query caching and SQLite prepared statements.
4. **MiniSearch full-text queries** — CPU-bound; optimised via field boosting and index pre-warming.

---

## Section 1: Performance Targets

All targets are measured on a mid-range developer machine (Apple M2 Pro, 16 GB RAM, NVMe SSD) unless otherwise noted. CI measurements run on GitHub Actions `ubuntu-latest` (4 vCPU, 16 GB RAM).

| Operation                               | Target p50 | Target p99 | V1 Baseline | Improvement Factor |
| --------------------------------------- | ---------- | ---------- | ----------- | ------------------ |
| Full graph build — small repo (~100 files)  | 2s         | 5s         | 3s          | 1.5×               |
| Full graph build — medium repo (~500 files) | 8s         | 15s        | 18s         | 2.25×              |
| Full graph build — large repo (~1 000 files)| 20s        | 35s        | 55s         | 2.75×              |
| Incremental update (1–5 changed files)  | 200ms      | 500ms      | 2 500ms     | 12.5×              |
| BFS impact query                        | 10ms       | 50ms       | 80ms        | 8×                 |
| DFS dependency chain                    | 15ms       | 50ms       | 90ms        | 6×                 |
| MiniSearch full-text query              | 5ms        | 20ms       | 30ms        | 6×                 |
| MCP tool call (end-to-end)              | 50ms       | 100ms      | 350ms       | 7×                 |
| Nx executor — full build target         | 30s (p50)  | 60s        | 75s         | 2.5×               |
| Graph serialisation to JSON             | 500ms      | 1 200ms    | 2 000ms     | 4×                 |
| SQLite bulk insert (1 000 nodes)        | 100ms      | 250ms      | N/A (new)   | —                  |
| MiniSearch index build (~500 nodes)     | 50ms       | 150ms      | N/A (new)   | —                  |

### 1.1 SLA Definitions

- **p50 (median):** 50% of measurements fall at or below this value.
- **p99:** 99% of measurements fall at or below this value. Used as the "worst-case acceptable" bound.
- **Baseline V1:** Measured from the current production `workspace-graph` package using the V1 extractor.
- **Improvement Factor:** `V1 baseline p50 / V2 target p50`.

---

## Section 2: ts-morph Extraction Optimisation

The ts-morph `Project` is the most expensive object to initialise (type-checking, tsconfig loading). The V2 extractor applies four strategies to minimise repeated work.

### 2.1 Project Instance Caching

A single `Project` instance is created per full-build session and reused across all file extractions. The instance is invalidated only when `tsconfig.base.json` changes.

```typescript
import { Project, ProjectOptions } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';

export class TsMorphProjectCache {
  private static instance: Project | null = null;
  private static tsConfigMtime: number = 0;

  static getOrCreate(workspaceRoot: string): Project {
    const tsConfigPath = path.join(workspaceRoot, 'tsconfig.base.json');
    const currentMtime = fs.statSync(tsConfigPath).mtimeMs;

    if (TsMorphProjectCache.instance && currentMtime === TsMorphProjectCache.tsConfigMtime) {
      return TsMorphProjectCache.instance;
    }

    const options: ProjectOptions = {
      tsConfigFilePath: tsConfigPath,
      skipAddingFilesFromTsConfig: true,   // We control which files to add
      skipFileDependencyResolution: false,
      compilerOptions: {
        skipLibCheck: true,
        noEmit: true,
      },
    };

    TsMorphProjectCache.instance = new Project(options);
    TsMorphProjectCache.tsConfigMtime = currentMtime;
    return TsMorphProjectCache.instance;
  }

  static invalidate(): void {
    TsMorphProjectCache.instance = null;
  }
}
```

### 2.2 Batched File Processing

Files are added to the `Project` in a single `addSourceFilesAtPaths()` call rather than one-by-one. This allows ts-morph to share type resolution context across the batch.

```typescript
import { Project, SourceFile } from 'ts-morph';

export interface BatchExtractionOptions {
  filePaths: string[];
  batchSize: number;  // recommended: 50-100
  onBatchComplete?: (batchIndex: number, totalBatches: number) => void;
}

export async function extractInBatches(
  project: Project,
  options: BatchExtractionOptions,
  extractor: (sourceFile: SourceFile) => Promise<void>,
): Promise<void> {
  const { filePaths, batchSize, onBatchComplete } = options;
  const totalBatches = Math.ceil(filePaths.length / batchSize);

  for (let i = 0; i < filePaths.length; i += batchSize) {
    const batch = filePaths.slice(i, i + batchSize);
    const batchIndex = Math.floor(i / batchSize);

    // Add entire batch in one call — shares internal file graph
    project.addSourceFilesAtPaths(batch);

    // Process each file in the batch
    for (const filePath of batch) {
      const sourceFile = project.getSourceFile(filePath);
      if (sourceFile) {
        await extractor(sourceFile);
      }
    }

    // Remove processed files to free memory before next batch
    for (const filePath of batch) {
      const sourceFile = project.getSourceFile(filePath);
      if (sourceFile) {
        project.removeSourceFile(sourceFile);
      }
    }

    onBatchComplete?.(batchIndex, totalBatches);
  }
}
```

### 2.3 Incremental Parsing

For incremental updates (1–5 changed files), the V2 engine re-uses the cached `Project` and adds only the changed files:

```typescript
export class IncrementalExtractor {
  private readonly project: Project;

  constructor(workspaceRoot: string) {
    this.project = TsMorphProjectCache.getOrCreate(workspaceRoot);
  }

  async processChangedFiles(
    changedFilePaths: string[],
    graph: WorkspaceGraphV2Runtime,
  ): Promise<IncrementalUpdateResult> {
    const start = Date.now();
    const addedNodes: GraphNodeV2[] = [];
    const removedNodeIds: string[] = [];
    const addedEdges: GraphEdgeV2[] = [];
    const removedEdgeIds: string[] = [];

    for (const filePath of changedFilePaths) {
      // Remove all nodes and edges associated with this file
      const staleIds = this.evictFileFromGraph(filePath, graph);
      removedNodeIds.push(...staleIds.nodeIds);
      removedEdgeIds.push(...staleIds.edgeIds);

      // Re-extract the file
      let sourceFile = this.project.getSourceFile(filePath);
      if (sourceFile) {
        // Refresh the file content from disk
        await sourceFile.refreshFromFileSystem();
      } else {
        sourceFile = this.project.addSourceFileAtPath(filePath);
      }

      // Run V2 extractor on refreshed file
      const extracted = this.extractFile(sourceFile);
      addedNodes.push(...extracted.nodes);
      addedEdges.push(...extracted.edges);
    }

    // Apply changes to the runtime graph
    for (const id of removedNodeIds) { graph.nodes.delete(id); }
    for (const id of removedEdgeIds) { graph.edges.delete(id); }
    for (const node of addedNodes) { graph.nodes.set(node.id, node); }
    for (const edge of addedEdges) { graph.edges.set(edge.id, edge); }

    return {
      changedFiles: changedFilePaths,
      addedNodeCount: addedNodes.length,
      removedNodeCount: removedNodeIds.length,
      addedEdgeCount: addedEdges.length,
      removedEdgeCount: removedEdgeIds.length,
      durationMs: Date.now() - start,
    };
  }

  private evictFileFromGraph(filePath: string, graph: WorkspaceGraphV2Runtime): {
    nodeIds: string[];
    edgeIds: string[];
  } {
    const nodeIds: string[] = [];
    const edgeIds: string[] = [];

    graph.nodes.forEach((node, id) => {
      if ('filePath' in node && node.filePath === filePath) {
        nodeIds.push(id);
      }
    });

    graph.edges.forEach((edge, id) => {
      if (nodeIds.includes(edge.sourceId) || nodeIds.includes(edge.targetId)) {
        edgeIds.push(id);
      }
    });

    return { nodeIds, edgeIds };
  }

  private extractFile(_sourceFile: unknown): { nodes: GraphNodeV2[]; edges: GraphEdgeV2[] } {
    // Delegated to V2ExtractorService
    return { nodes: [], edges: [] };
  }
}

export interface IncrementalUpdateResult {
  changedFiles: string[];
  addedNodeCount: number;
  removedNodeCount: number;
  addedEdgeCount: number;
  removedEdgeCount: number;
  durationMs: number;
}
```

### 2.4 Worker Threads Consideration

For repos with 1 000+ files, extraction can be parallelised across worker threads. Each worker receives a batch of file paths and a serialisable project configuration. The main thread merges results.

> **Decision:** Worker threads are planned for V2.1. V2.0 uses the single-threaded batched approach above, which meets the p99 targets for repos up to 1 000 files.

---

## Section 3: Graph In-Memory Optimisation

### 3.1 Map-Based Index Strategy

The runtime graph uses `Map<string, T>` for all primary indexes instead of plain objects. JavaScript `Map` has O(1) amortised get/set and avoids prototype chain lookups on large key sets.

```typescript
export function buildRuntimeGraph(serialised: WorkspaceGraphV2): WorkspaceGraphV2Runtime {
  const nodes = new Map<string, GraphNodeV2>(Object.entries(serialised.nodes));
  const edges = new Map<string, GraphEdgeV2>(Object.entries(serialised.edges));

  // Adjacency lists
  const outgoing = new Map<string, Set<string>>();
  const incoming = new Map<string, Set<string>>();

  edges.forEach((edge, edgeId) => {
    if (!outgoing.has(edge.sourceId)) outgoing.set(edge.sourceId, new Set());
    if (!incoming.has(edge.targetId)) incoming.set(edge.targetId, new Set());
    outgoing.get(edge.sourceId)!.add(edgeId);
    incoming.get(edge.targetId)!.add(edgeId);
  });

  // File index
  const fileIndex = new Map<string, string>();
  nodes.forEach((node, id) => {
    if ('filePath' in node && node.filePath) {
      fileIndex.set(node.filePath, id);
    }
  });

  // Type index
  const typeIndex = new Map<NodeType, Set<string>>();
  nodes.forEach((node, id) => {
    if (!typeIndex.has(node.type)) typeIndex.set(node.type, new Set());
    typeIndex.get(node.type)!.add(id);
  });

  return {
    meta: {
      schemaVersion: serialised.schemaVersion,
      builtAt: serialised.builtAt,
      workspaceRoot: serialised.workspaceRoot,
      fileCount: serialised.fileCount,
    },
    nodes,
    edges,
    outgoing,
    incoming,
    fileIndex,
    typeIndex,
  };
}
```

### 3.2 Adjacency List Representation

Graph traversal uses the `outgoing` and `incoming` adjacency maps to avoid full-edge scans:

```typescript
export function getOutgoingEdges(
  graph: WorkspaceGraphV2Runtime,
  nodeId: string,
  edgeTypeFilter?: EdgeType,
): GraphEdgeV2[] {
  const edgeIds = graph.outgoing.get(nodeId) ?? new Set<string>();
  const result: GraphEdgeV2[] = [];

  edgeIds.forEach(edgeId => {
    const edge = graph.edges.get(edgeId);
    if (edge && (!edgeTypeFilter || edge.type === edgeTypeFilter)) {
      result.push(edge);
    }
  });

  return result;
}

export function getNeighbourNodes(
  graph: WorkspaceGraphV2Runtime,
  nodeId: string,
  direction: 'outgoing' | 'incoming' | 'both',
  edgeTypeFilter?: EdgeType,
): GraphNodeV2[] {
  const neighbourIds = new Set<string>();

  if (direction === 'outgoing' || direction === 'both') {
    getOutgoingEdges(graph, nodeId, edgeTypeFilter)
      .forEach(e => neighbourIds.add(e.targetId));
  }

  if (direction === 'incoming' || direction === 'both') {
    const edgeIds = graph.incoming.get(nodeId) ?? new Set<string>();
    edgeIds.forEach(edgeId => {
      const edge = graph.edges.get(edgeId);
      if (edge && (!edgeTypeFilter || edge.type === edgeTypeFilter)) {
        neighbourIds.add(edge.sourceId);
      }
    });
  }

  return Array.from(neighbourIds)
    .map(id => graph.nodes.get(id))
    .filter((n): n is GraphNodeV2 => n !== undefined);
}
```

### 3.3 Memory Footprint Estimates

| Repo Size    | Approx Node Count | Approx Edge Count | Est. Heap (Map-based) | Est. Heap (Object-based) |
| ------------ | ----------------- | ----------------- | --------------------- | ------------------------ |
| ~100 files   | ~1 500            | ~3 000            | ~25 MB                | ~35 MB                   |
| ~500 files   | ~8 000            | ~18 000           | ~90 MB                | ~130 MB                  |
| ~1 000 files | ~16 000           | ~38 000           | ~180 MB               | ~260 MB                  |

Estimates assume average node JSON size of ~500 bytes and edge JSON size of ~200 bytes, plus V8 object overhead. The Map-based representation reduces per-entry overhead by ~30% compared to a plain object record.

---

## Section 4: MCP Response Time Budget

Every MCP tool call must complete within **100ms at p99**. The budget is broken down as follows:

| Phase                      | Budget p50 | Budget p99 | Notes |
| -------------------------- | ---------- | ---------- | ----- |
| Argument parsing / validation | 2ms     | 5ms        | JSON schema check on incoming args |
| Graph lookup / traversal      | 10ms    | 30ms       | BFS/DFS or Map lookup |
| Result filtering / projection | 3ms     | 10ms       | Trim to requested fields |
| JSON serialisation            | 5ms     | 15ms       | `JSON.stringify` on result set |
| MCP transport overhead        | 5ms     | 20ms       | stdio / IPC framing |
| **Total**                     | **25ms** | **80ms**  | 20ms headroom before p99 SLA |

### 4.1 Staying Within Budget

**Avoid full graph scans.** All hot-path queries must use the type index or adjacency maps:

```typescript
// ✅ Fast — uses typeIndex: O(1) set lookup
function getServiceNodes(graph: WorkspaceGraphV2Runtime): GraphNodeV2[] {
  const ids = graph.typeIndex.get('service') ?? new Set();
  return Array.from(ids).map(id => graph.nodes.get(id)!);
}

// ❌ Slow — scans all nodes: O(n)
function getServiceNodesSlow(graph: WorkspaceGraphV2Runtime): GraphNodeV2[] {
  return Array.from(graph.nodes.values()).filter(n => n.type === 'service');
}
```

**Cap result sets.** MCP tools accept a `limit` parameter (default 50, max 200) to prevent unbounded serialisation cost.

**Pre-serialise hot responses.** Frequently requested subtrees (e.g. project overview) are serialised once and cached.

---

## Section 5: MiniSearch Index Optimisation

### 5.1 Fields and Boost Values

```typescript
import MiniSearch from 'minisearch';

export interface SearchDocument {
  id: string;           // node id
  name: string;         // node name
  filePath: string;     // relative file path
  description: string;  // JSDoc or spec description
  nodeType: string;     // node type string
  keywords: string;     // space-separated extracted keywords
}

export function createMiniSearchIndex(): MiniSearch<SearchDocument> {
  return new MiniSearch<SearchDocument>({
    fields: ['name', 'description', 'keywords', 'filePath', 'nodeType'],
    storeFields: ['id', 'name', 'filePath', 'nodeType'],
    searchOptions: {
      boost: {
        name: 4,          // Exact name matches are most relevant
        keywords: 2,      // Extracted keywords are second
        description: 1.5, // Description is third
        filePath: 1,      // Path matches are lower priority
        nodeType: 0.5,    // Type filter is applied separately
      },
      fuzzy: 0.2,         // Allow slight fuzzy matching
      prefix: true,       // Enable prefix search for partial input
    },
    idField: 'id',
  });
}
```

### 5.2 Index Build and Serialisation

```typescript
export class SearchIndexManager {
  private index: MiniSearch<SearchDocument>;
  private readonly indexPath: string;

  constructor(workspaceRoot: string) {
    this.index = createMiniSearchIndex();
    this.indexPath = path.join(workspaceRoot, '.workspace-graph-v2-index.json');
  }

  buildFromGraph(graph: WorkspaceGraphV2Runtime): void {
    const documents: SearchDocument[] = [];

    graph.nodes.forEach((node) => {
      const doc: SearchDocument = {
        id: node.id,
        name: node.name,
        filePath: ('filePath' in node ? node.filePath : '') ?? '',
        description: ('jsdoc' in node ? node.jsdoc : '') ?? '',
        nodeType: node.type,
        keywords: this.extractKeywords(node),
      };
      documents.push(doc);
    });

    this.index.addAll(documents);
  }

  serialise(): void {
    const serialised = JSON.stringify(this.index);
    const tmpPath = `${this.indexPath}.tmp`;
    fs.writeFileSync(tmpPath, serialised, 'utf-8');
    fs.renameSync(tmpPath, this.indexPath);
  }

  loadFromDisk(): boolean {
    if (!fs.existsSync(this.indexPath)) return false;
    const raw = fs.readFileSync(this.indexPath, 'utf-8');
    this.index = MiniSearch.loadJSON<SearchDocument>(raw, createMiniSearchIndex().options as never);
    return true;
  }

  search(query: string, limit = 50): SearchDocument[] {
    return this.index.search(query, { limit }) as unknown as SearchDocument[];
  }

  private extractKeywords(node: GraphNodeV2): string {
    const tokens: string[] = [node.name];
    if ('returnType' in node) tokens.push(node.returnType);
    if ('propertyType' in node) tokens.push(node.propertyType);
    if ('parameterType' in node) tokens.push(node.parameterType);
    return tokens.filter(Boolean).join(' ');
  }
}
```

### 5.3 Index Size Estimates

| Repo Size    | Document Count | Estimated Index Size (disk) | Load Time (p50) |
| ------------ | -------------- | --------------------------- | --------------- |
| ~100 files   | ~1 500         | ~300 KB                     | 15ms            |
| ~500 files   | ~8 000         | ~1.5 MB                     | 40ms            |
| ~1 000 files | ~16 000        | ~3.2 MB                     | 80ms            |

The index is pre-warmed on MCP server startup by loading from `.workspace-graph-v2-index.json`.

---

## Section 6: Query Result Caching

### 6.1 LRU Cache Strategy

Frequent read-only queries (e.g. "list all services", "get methods of X", "BFS from node Y") are cached in an in-process LRU cache keyed by a deterministic query fingerprint.

```typescript
export interface CacheEntry<T> {
  result: T;
  createdAt: number;
  hitCount: number;
}

export interface QueryCacheOptions {
  maxSize: number;      // maximum number of entries (recommended: 500)
  ttlMs: number;        // TTL for cache entries (recommended: 60_000ms)
}

export class QueryCache<T> {
  private readonly cache: Map<string, CacheEntry<T>>;
  private readonly accessOrder: string[];  // tracks LRU order

  constructor(private readonly options: QueryCacheOptions) {
    this.cache = new Map();
    this.accessOrder = [];
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check TTL
    if (Date.now() - entry.createdAt > this.options.ttlMs) {
      this.delete(key);
      return undefined;
    }

    // Update LRU order
    const idx = this.accessOrder.indexOf(key);
    if (idx > -1) this.accessOrder.splice(idx, 1);
    this.accessOrder.push(key);

    entry.hitCount++;
    return entry.result;
  }

  set(key: string, result: T): void {
    if (this.cache.size >= this.options.maxSize) {
      // Evict least-recently used
      const lruKey = this.accessOrder.shift();
      if (lruKey) this.cache.delete(lruKey);
    }

    this.cache.set(key, { result, createdAt: Date.now(), hitCount: 0 });
    this.accessOrder.push(key);
  }

  delete(key: string): void {
    this.cache.delete(key);
    const idx = this.accessOrder.indexOf(key);
    if (idx > -1) this.accessOrder.splice(idx, 1);
  }

  invalidateByPrefix(prefix: string): void {
    for (const key of Array.from(this.cache.keys())) {
      if (key.startsWith(prefix)) this.delete(key);
    }
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.length = 0;
  }

  get size(): number {
    return this.cache.size;
  }
}
```

### 6.2 Cache Invalidation on Graph Updates

Whenever the graph is updated (full rebuild or incremental), the query cache is selectively invalidated:

```typescript
export class GraphQueryService {
  private readonly cache: QueryCache<unknown>;

  constructor(
    private readonly graph: WorkspaceGraphV2Runtime,
    cacheOptions: QueryCacheOptions = { maxSize: 500, ttlMs: 60_000 },
  ) {
    this.cache = new QueryCache(cacheOptions);
  }

  onIncrementalUpdate(changedFilePaths: string[]): void {
    // Invalidate all cache entries that may reference changed files
    for (const filePath of changedFilePaths) {
      // Simple strategy: invalidate by file path prefix in key
      this.cache.invalidateByPrefix(`file:${filePath}`);
    }
    // Always invalidate structural queries that span the whole graph
    this.cache.invalidateByPrefix('graph:summary');
    this.cache.invalidateByPrefix('bfs:');
    this.cache.invalidateByPrefix('dfs:');
  }

  onFullRebuild(): void {
    this.cache.clear();
  }

  getNodesByType(nodeType: NodeType): GraphNodeV2[] {
    const key = `type:${nodeType}`;
    const cached = this.cache.get(key) as GraphNodeV2[] | undefined;
    if (cached) return cached;

    const ids = this.graph.typeIndex.get(nodeType) ?? new Set<string>();
    const result = Array.from(ids)
      .map(id => this.graph.nodes.get(id))
      .filter((n): n is GraphNodeV2 => n !== undefined);

    this.cache.set(key, result);
    return result;
  }
}
```

---

## Section 7: SQLite Query Optimisation

### 7.1 Index Strategy

The SQLite schema (defined in `data-models.specification.md`) includes the following indexes that cover the hot query paths:

| Index Name              | Table     | Columns            | Query Pattern                          |
| ----------------------- | --------- | ------------------ | -------------------------------------- |
| `idx_nodes_v2_type`     | `nodes_v2` | `type`            | "Give me all nodes of type X"          |
| `idx_nodes_v2_file`     | `nodes_v2` | `file_path`       | "Give me all nodes in file Y"          |
| `idx_nodes_v2_parent`   | `nodes_v2` | `parent_id`       | "Give me all methods of class Z"       |
| `idx_edges_v2_src_type` | `edges_v2` | `source_id, type` | "Outgoing CALLS from method M"         |
| `idx_edges_v2_tgt_type` | `edges_v2` | `target_id, type` | "Incoming DECORATES on class C"        |

### 7.2 WAL Mode Configuration

```typescript
import Database from 'better-sqlite3';

export function openDatabase(dbPath: string): Database.Database {
  const db = new Database(dbPath);

  // Enable WAL for concurrent reads without blocking writes
  db.pragma('journal_mode = WAL');

  // Reduce fsync overhead on NVMe — acceptable for a build artefact DB
  db.pragma('synchronous = NORMAL');

  // Increase page cache to ~64 MB
  db.pragma('cache_size = -65536');

  // Enable foreign key constraints
  db.pragma('foreign_keys = ON');

  // Larger mmap for read-heavy workload
  db.pragma('mmap_size = 268435456'); // 256 MB

  return db;
}
```

### 7.3 Prepared Statements

All hot-path queries use prepared statements to avoid repeated SQL parsing:

```typescript
export class NodeRepository {
  private readonly stmts: {
    getById: Database.Statement;
    getByType: Database.Statement;
    getByFile: Database.Statement;
    getByParent: Database.Statement;
    upsert: Database.Statement;
    deleteByFile: Database.Statement;
  };

  constructor(private readonly db: Database.Database) {
    this.stmts = {
      getById: db.prepare('SELECT data FROM nodes_v2 WHERE id = ?'),
      getByType: db.prepare('SELECT data FROM nodes_v2 WHERE type = ? LIMIT ?'),
      getByFile: db.prepare('SELECT data FROM nodes_v2 WHERE file_path = ?'),
      getByParent: db.prepare('SELECT data FROM nodes_v2 WHERE parent_id = ?'),
      upsert: db.prepare(
        'INSERT OR REPLACE INTO nodes_v2 (id, type, name, file_path, parent_id, data, updated_at) ' +
        'VALUES (?, ?, ?, ?, ?, ?, unixepoch())'
      ),
      deleteByFile: db.prepare('DELETE FROM nodes_v2 WHERE file_path = ?'),
    };
  }

  getById(id: string): GraphNodeV2 | undefined {
    const row = this.stmts.getById.get(id) as { data: string } | undefined;
    return row ? JSON.parse(row.data) : undefined;
  }

  getByType(nodeType: NodeType, limit = 200): GraphNodeV2[] {
    const rows = this.stmts.getByType.all(nodeType, limit) as { data: string }[];
    return rows.map(r => JSON.parse(r.data));
  }

  upsert(node: GraphNodeV2): void {
    const parentId = 'parentId' in node ? node.parentId : null;
    const filePath = 'filePath' in node ? node.filePath : null;
    this.stmts.upsert.run(
      node.id,
      node.type,
      node.name,
      filePath,
      parentId,
      JSON.stringify(node),
    );
  }

  bulkUpsert(nodes: GraphNodeV2[]): void {
    const tx = this.db.transaction((items: GraphNodeV2[]) => {
      for (const node of items) this.upsert(node);
    });
    tx(nodes);
  }

  deleteByFile(filePath: string): number {
    const result = this.stmts.deleteByFile.run(filePath);
    return result.changes;
  }
}
```

---

## Section 8: Benchmark Methodology

### 8.1 Measuring Each Operation

Each operation is measured using `performance.now()` (Node.js `perf_hooks`) in a dedicated benchmark harness:

```typescript
import { performance, PerformanceObserver } from 'perf_hooks';

export interface BenchmarkSample {
  operation: string;
  durationMs: number;
  timestamp: number;
}

export interface BenchmarkResult {
  operation: string;
  samples: number;
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
}

export function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export class BenchmarkHarness {
  private readonly samples: Map<string, number[]> = new Map();

  async measure<T>(
    operation: string,
    fn: () => Promise<T> | T,
    iterations = 100,
  ): Promise<BenchmarkResult> {
    const timings: number[] = [];

    // Warm-up: 5 iterations not recorded
    for (let i = 0; i < 5; i++) {
      await fn();
    }

    // Measured iterations
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      timings.push(performance.now() - start);
    }

    const sorted = [...timings].sort((a, b) => a - b);
    const result: BenchmarkResult = {
      operation,
      samples: iterations,
      p50: percentile(sorted, 50),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };

    this.samples.set(operation, sorted);
    return result;
  }

  printReport(results: BenchmarkResult[]): void {
    console.table(
      results.map(r => ({
        operation: r.operation,
        'p50 (ms)': r.p50.toFixed(2),
        'p95 (ms)': r.p95.toFixed(2),
        'p99 (ms)': r.p99.toFixed(2),
        'min (ms)': r.min.toFixed(2),
        'max (ms)': r.max.toFixed(2),
      }))
    );
  }
}
```

### 8.2 Benchmark Suite

```typescript
import { BenchmarkHarness } from './benchmark-harness';

async function runV2BenchmarkSuite(workspaceRoot: string): Promise<void> {
  const harness = new BenchmarkHarness();
  const results: BenchmarkResult[] = [];

  // Fixture: load pre-built medium-repo graph (~500 files)
  const graphJson = fs.readFileSync(
    path.join(workspaceRoot, '.workspace-graph-v2.json'),
    'utf-8',
  );

  // Benchmark 1: JSON deserialisation + runtime build
  results.push(await harness.measure(
    'buildRuntimeGraph (500 files)',
    () => buildRuntimeGraph(JSON.parse(graphJson)),
    20, // Fewer iterations — this is slow
  ));

  const runtimeGraph = buildRuntimeGraph(JSON.parse(graphJson));

  // Benchmark 2: Type index lookup
  results.push(await harness.measure(
    'getNodesByType(service)',
    () => {
      const ids = runtimeGraph.typeIndex.get('service') ?? new Set();
      return Array.from(ids).map(id => runtimeGraph.nodes.get(id)!);
    },
    1000,
  ));

  // Benchmark 3: BFS impact query
  const sampleNodeId = Array.from(runtimeGraph.typeIndex.get('service') ?? [])[0] ?? '';
  results.push(await harness.measure(
    'BFS impact query',
    () => bfsImpact(runtimeGraph, sampleNodeId, 3),
    500,
  ));

  // Benchmark 4: MiniSearch query
  const searchManager = new SearchIndexManager(workspaceRoot);
  searchManager.loadFromDisk();
  results.push(await harness.measure(
    'MiniSearch.search("user")',
    () => searchManager.search('user', 50),
    500,
  ));

  harness.printReport(results);
}
```

### 8.3 CI Integration for Regression Detection

The benchmark suite runs as part of the `bench` Nx target. Results are written to `benchmark-results.json` and compared against the committed baseline:

```typescript
export function assertNoBenchmarkRegressions(
  baseline: BenchmarkResult[],
  current: BenchmarkResult[],
  allowedRegressionFactor = 1.2, // 20% regression tolerance
): void {
  for (const currentResult of current) {
    const baselineResult = baseline.find(b => b.operation === currentResult.operation);
    if (!baselineResult) continue; // New benchmark — no regression check

    const p99Ratio = currentResult.p99 / baselineResult.p99;
    if (p99Ratio > allowedRegressionFactor) {
      throw new Error(
        `Performance regression in "${currentResult.operation}": ` +
        `p99 is ${currentResult.p99.toFixed(2)}ms vs baseline ${baselineResult.p99.toFixed(2)}ms ` +
        `(${(p99Ratio * 100 - 100).toFixed(1)}% slower)`
      );
    }
  }
}
```

**CI step in `.github/workflows/ci.yml`:**

```yaml
- name: Run Performance Benchmarks
  run: npx nx run spec-alchemy-graph-engine:bench --output-path=benchmark-results.json

- name: Check for Regressions
  run: node tools/scripts/check-bench-regressions.js
```

---

## Section 9: Memory Profiling

### 9.1 Target Memory Ceiling

| Repo Size    | Max Heap Allocation | Notes                                    |
| ------------ | ------------------- | ---------------------------------------- |
| Small (~100 files)   | 100 MB     | Well within Node.js defaults             |
| Medium (~500 files)  | 250 MB     | Within V8 default heap (~1.5 GB)         |
| Large (~1 000 files) | 500 MB     | Hard ceiling; trigger warning if exceeded|

The **500 MB ceiling** for large repos applies to the sum of: runtime graph maps + MiniSearch index + query cache + Node.js baseline overhead (~50 MB).

### 9.2 Heap Snapshot Approach

Memory profiling is performed using Node.js built-in `v8.writeHeapSnapshot()`:

```typescript
import * as v8 from 'v8';
import * as path from 'path';

export function captureHeapSnapshot(label: string, outputDir: string): string {
  const snapshotPath = v8.writeHeapSnapshot(
    path.join(outputDir, `heap-${label}-${Date.now()}.heapsnapshot`)
  );
  console.log(`Heap snapshot written: ${snapshotPath}`);
  return snapshotPath;
}

export async function profileGraphBuildMemory(workspaceRoot: string): Promise<void> {
  const snapshotDir = path.join(workspaceRoot, '.bench', 'heap-snapshots');

  // Snapshot 1: Before graph load
  captureHeapSnapshot('before-load', snapshotDir);

  const graphJson = JSON.parse(
    fs.readFileSync(path.join(workspaceRoot, '.workspace-graph-v2.json'), 'utf-8')
  );

  // Snapshot 2: After JSON parse
  captureHeapSnapshot('after-json-parse', snapshotDir);

  const runtimeGraph = buildRuntimeGraph(graphJson);

  // Snapshot 3: After runtime graph build
  captureHeapSnapshot('after-runtime-build', snapshotDir);

  // Log Map sizes
  console.log(`Node map size: ${runtimeGraph.nodes.size}`);
  console.log(`Edge map size: ${runtimeGraph.edges.size}`);
  console.log(`Type index entries: ${runtimeGraph.typeIndex.size}`);

  void runtimeGraph; // prevent GC before snapshot
}
```

### 9.3 Memory Monitoring in Production

The MCP server reports its memory usage on each graph load:

```typescript
export function logMemoryUsage(label: string): void {
  const memUsage = process.memoryUsage();
  console.log(`[${label}] Memory usage:`, {
    rss: `${(memUsage.rss / 1024 / 1024).toFixed(1)} MB`,
    heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(1)} MB`,
    heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(1)} MB`,
    external: `${(memUsage.external / 1024 / 1024).toFixed(1)} MB`,
  });

  const heapUsedMb = memUsage.heapUsed / 1024 / 1024;
  if (heapUsedMb > 450) {
    console.warn(`[${label}] ⚠️  Heap approaching 500 MB ceiling: ${heapUsedMb.toFixed(1)} MB`);
  }
}
```

---

*End of Performance Design Specification — workspace-graph-v2*
