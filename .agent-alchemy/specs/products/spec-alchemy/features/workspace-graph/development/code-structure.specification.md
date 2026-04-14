---
meta:
  id: spec-alchemy-workspace-graph-code-structure-specification
  title: Code Structure Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: product:spec-alchemy
  tags: []
  createdBy: unknown
  createdAt: '2026-03-12'
  reviewedAt: null
title: Code Structure Specification
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

# Workspace Graph: Code Structure Specification

---
version: 1.0.0
date: 2025-01-29
status: Development
category: Code Organization
complexity: Medium
phase: Development
owner: Agent Alchemy Developer Team
architecture_basis:
  - ../architecture/component-design.specification.md (11 components)
  - ../architecture/system-architecture.specification.md (4 layers)
related_specifications:
  - implementation-guide.specification.md
  - development-environment.specification.md
  - testing-strategy.specification.md
priority: Critical
---

## Executive Summary

Defines file organization, directory structure, naming conventions, and module architecture for the workspace graph incremental update system.

### Key Principles

- **Separation of Concerns:** Each layer in separate directory
- **Colocation:** Tests adjacent to source files
- **Explicit Exports:** Barrel exports via index.ts
- **Type Safety:** Shared types in dedicated types.ts
- **Modularity:** Each component in its own file

---

## 1. Directory Structure

### 1.1 Complete File Tree

```
libs/shared/workspace-graph/workspace-graph/
├── src/
│   ├── lib/
│   │   ├── git/                           # Layer 1: Git Integration
│   │   │   ├── git-change-detector.ts     # Primary change detection
│   │   │   ├── git-change-detector.spec.ts
│   │   │   ├── git-repository.ts          # Low-level Git operations
│   │   │   ├── git-repository.spec.ts
│   │   │   └── index.ts                   # Barrel export
│   │   │
│   │   ├── incremental/                   # Layer 2: Incremental Analysis
│   │   │   ├── incremental-graph-builder.ts
│   │   │   ├── incremental-graph-builder.spec.ts
│   │   │   ├── graph-validator.ts
│   │   │   ├── graph-validator.spec.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── analysis/                      # Layer 2: AST Analysis
│   │   │   ├── ast-parser.ts
│   │   │   ├── ast-parser.spec.ts
│   │   │   ├── nx-project-reader.ts
│   │   │   ├── nx-project-reader.spec.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── storage/                       # Layer 3: Storage
│   │   │   ├── hybrid-graph-storage.ts    # Orchestrator
│   │   │   ├── hybrid-graph-storage.spec.ts
│   │   │   ├── sqlite-adapter.ts          # SQLite operations
│   │   │   ├── sqlite-adapter.spec.ts
│   │   │   ├── json-exporter.ts           # JSON export
│   │   │   ├── json-exporter.spec.ts
│   │   │   ├── migration-utils.ts         # JSON → SQLite migration
│   │   │   ├── migration-utils.spec.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── query/                         # Layer 4: Query API
│   │   │   ├── graph-query-api.ts
│   │   │   ├── graph-query-api.spec.ts
│   │   │   ├── query-builder.ts           # SQL query builder
│   │   │   ├── query-builder.spec.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── cli/                           # CLI Integration
│   │   │   ├── cli.ts                     # Enhanced CLI with --incremental
│   │   │   ├── cli.spec.ts
│   │   │   ├── commands/
│   │   │   │   ├── build-command.ts
│   │   │   │   ├── query-command.ts
│   │   │   │   └── validate-command.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── types.ts                       # Shared types (EXISTING)
│   │   ├── workspace-graph-builder.ts     # Main builder (EXISTING)
│   │   ├── workspace-graph-builder.spec.ts
│   │   └── index.ts                       # Root barrel export
│   │
│   ├── __benchmarks__/                    # Performance benchmarks
│   │   ├── git-detection.bench.ts
│   │   ├── incremental-build.bench.ts
│   │   ├── storage.bench.ts
│   │   └── end-to-end.bench.ts
│   │
│   └── __fixtures__/                      # Test fixtures
│       ├── sample-graph.json
│       ├── sample-workspace/
│       └── git-test-repo/
│
├── project.json                           # Nx project configuration
├── tsconfig.json                          # TypeScript config
├── tsconfig.lib.json                      # Library TypeScript config
├── tsconfig.spec.json                     # Test TypeScript config
├── jest.config.ts                         # Jest configuration
├── .eslintrc.json                         # ESLint configuration
└── README.md                              # Project documentation
```

---

## 2. File Naming Conventions

### 2.1 Source Files

| File Type | Pattern | Example |
|-----------|---------|---------|
| **Class Implementation** | `kebab-case.ts` | `git-change-detector.ts` |
| **Interface/Type Definitions** | `types.ts` or `kebab-case.types.ts` | `types.ts`, `git-types.ts` |
| **Unit Tests** | `kebab-case.spec.ts` | `git-change-detector.spec.ts` |
| **Integration Tests** | `kebab-case.test.ts` | `hybrid-storage.test.ts` |
| **Benchmarks** | `kebab-case.bench.ts` | `git-detection.bench.ts` |
| **Barrel Exports** | `index.ts` | `index.ts` |
| **Utilities** | `kebab-case.utils.ts` | `path-utils.ts` |

### 2.2 Class Naming

```typescript
// Class names: PascalCase
export class GitChangeDetector { }
export class IncrementalGraphBuilder { }
export class HybridGraphStorage { }
export class SQLiteAdapter { }

// Interface names: PascalCase with 'I' prefix (optional)
export interface GitChangeDetectorConfig { }
export interface GitChangeResult { }
export interface IncrementalBuildResult { }

// Type aliases: PascalCase
export type NodeType = 'file' | 'spec' | 'project' | 'guardrail';
export type EdgeType = 'imports' | 'references' | 'extends';
```

### 2.3 Function Naming

```typescript
// Public methods: camelCase, descriptive verbs
async detectChanges(): Promise<GitChangeResult>
async buildIncremental(): Promise<IncrementalBuildResult>
async saveGraph(graph: WorkspaceGraph): Promise<void>

// Private methods: camelCase with leading underscore (optional)
private async processChanges(): Promise<void>
private resolveCommit(ref: string): Promise<string>
private shouldIncludeFile(path: string): boolean

// Utility functions: camelCase
function generateNodeId(path: string): string
function matchPattern(path: string, pattern: string): boolean
```

---

## 3. Module Organization

### 3.1 Barrel Exports (index.ts)

Each directory contains an `index.ts` for clean imports:

**Example:** `libs/shared/workspace-graph/workspace-graph/src/lib/git/index.ts`

```typescript
/**
 * Git integration layer
 * 
 * Provides Git change detection and repository operations.
 */

export * from './git-change-detector';
export * from './git-repository';
```

**Example:** `libs/shared/workspace-graph/workspace-graph/src/lib/index.ts` (Root)

```typescript
/**
 * Workspace Graph Library
 * 
 * Incremental workspace graph builder with Git integration and hybrid storage.
 */

// Core types (existing)
export * from './types';

// Main builder (existing)
export * from './workspace-graph-builder';

// Layer 1: Git Integration
export * from './git';

// Layer 2: Incremental Analysis
export * from './incremental';
export * from './analysis';

// Layer 3: Storage
export * from './storage';

// Layer 4: Query API
export * from './query';

// CLI (optional - may be internal only)
// export * from './cli';
```

### 3.2 Import Conventions

```typescript
// ✅ GOOD: Import from barrel exports
import { GitChangeDetector, GitChangeResult } from '@buildmotion-ai/workspace-graph';
import { IncrementalGraphBuilder } from '@buildmotion-ai/workspace-graph';
import { HybridGraphStorage } from '@buildmotion-ai/workspace-graph';

// ✅ GOOD: Internal imports from specific files
import { GitChangeDetector } from './git/git-change-detector';
import { SQLiteAdapter } from './storage/sqlite-adapter';

// ❌ BAD: Deep imports bypass barrel exports
import { GitChangeDetector } from '@buildmotion-ai/workspace-graph/src/lib/git/git-change-detector';

// ❌ BAD: Importing from index explicitly
import { GitChangeDetector } from './git/index';
```

### 3.3 Dependency Flow

```
CLI Layer (cli/)
    ↓ depends on
Query Layer (query/)
    ↓ depends on
Storage Layer (storage/)
    ↓ depends on
Analysis Layer (incremental/, analysis/)
    ↓ depends on
Git Layer (git/)
    ↓ depends on
Shared Types (types.ts)
```

**Rule:** Lower layers MUST NOT import from higher layers (enforce with ESLint).

---

## 4. TypeScript Configuration

### 4.1 Shared Types (types.ts)

**File:** `libs/shared/workspace-graph/workspace-graph/src/lib/types.ts`

```typescript
/**
 * Core workspace graph types
 */

/**
 * Graph node representing a file, project, spec, or guardrail
 */
export interface GraphNode {
  /** Unique node identifier */
  id: string;
  /** Node type */
  type: 'file' | 'spec' | 'project' | 'guardrail';
  /** File path (workspace-relative) */
  path: string;
  /** Type-specific metadata */
  metadata: Record<string, any>;
  /** Creation timestamp (Unix epoch ms) */
  createdAt: number;
  /** Last update timestamp (Unix epoch ms) */
  updatedAt: number;
}

/**
 * Graph edge representing a relationship between nodes
 */
export interface GraphEdge {
  /** Unique edge identifier */
  id: string;
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Edge type */
  type: 'imports' | 'references' | 'extends' | 'depends-on';
  /** Edge-specific metadata */
  metadata?: Record<string, any>;
}

/**
 * Complete workspace graph
 */
export interface WorkspaceGraph {
  /** All nodes indexed by ID */
  nodes: Record<string, GraphNode>;
  /** All edges */
  edges: GraphEdge[];
  /** Graph version number */
  version: number;
  /** Graph-level metadata */
  metadata: {
    /** Git commit SHA when graph was built */
    commitSha?: string;
    /** Build timestamp */
    buildTimestamp?: number;
    /** Build mode (full | incremental) */
    buildMode?: 'full' | 'incremental';
    /** Additional metadata */
    [key: string]: any;
  };
}
```

### 4.2 TypeScript Strict Mode

All files MUST use TypeScript strict mode:

```json
// tsconfig.json
{
  "extends": "../../../../tsconfig.base.json",
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

---

## 5. Code Organization Patterns

### 5.1 Class Structure Template

```typescript
import { Logger } from '@buildmotion-ai/logging';

/**
 * Brief description of class purpose
 * 
 * Performance targets, constraints, and usage notes
 * 
 * @example
 * ```typescript
 * const instance = new ClassName(config);
 * const result = await instance.method();
 * ```
 */
export class ClassName {
  // 1. Private properties (readonly when possible)
  private readonly logger: Logger;
  private readonly config: Required<ConfigType>;

  // 2. Constructor
  constructor(config: ConfigType, logger?: Logger) {
    this.logger = logger ?? new Logger('ClassName');
    this.config = this.applyDefaults(config);
  }

  // 3. Public methods (primary API)
  async primaryMethod(): Promise<ResultType> {
    // Implementation
  }

  // 4. Public helper methods
  publicHelper(): void {
    // Implementation
  }

  // 5. Private methods (implementation details)
  private applyDefaults(config: ConfigType): Required<ConfigType> {
    // Implementation
  }

  private helperMethod(): void {
    // Implementation
  }
}
```

### 5.2 File Organization

```typescript
// 1. Imports (grouped by category)
// - Node.js built-ins
// - External dependencies
// - Internal workspace imports
// - Relative imports

import * as path from 'path';
import * as fs from 'fs/promises';

import simpleGit from 'simple-git';
import Database from 'better-sqlite3';

import { Logger } from '@buildmotion-ai/logging';

import { WorkspaceGraph } from '../types';
import { GitChangeDetector } from './git-change-detector';

// 2. Interface/Type definitions
export interface ConfigType {
  // ...
}

export interface ResultType {
  // ...
}

// 3. Constants
const DEFAULT_TIMEOUT = 5000;
const MAX_RETRIES = 3;

// 4. Class implementation
export class ClassName {
  // ...
}

// 5. Helper functions (if any)
function helperFunction(): void {
  // ...
}
```

---

## 6. Documentation Standards

### 6.1 JSDoc Comments

All public classes, interfaces, and methods MUST have JSDoc comments:

```typescript
/**
 * Detects file changes via Git diff operations.
 * 
 * Uses simple-git to identify added, modified, and deleted files
 * between two commits. Applies include/exclude pattern filters.
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
 * 
 * @see {@link GitChangeDetectorConfig} for configuration options
 * @see {@link GitChangeResult} for return type details
 */
export class GitChangeDetector {
  /**
   * Detect changed files between base and target commits.
   * 
   * Performs the following steps:
   * 1. Validates Git repository
   * 2. Resolves commit references to SHAs
   * 3. Executes git diff between commits
   * 4. Categorizes changes (added/modified/deleted)
   * 5. Applies include/exclude filters
   * 
   * @returns {Promise<GitChangeResult>} Categorized file changes
   * @throws {Error} If Git operations fail or repository is invalid
   * 
   * @example
   * ```typescript
   * const result = await detector.detectChanges();
   * console.log(`Added: ${result.added.length}`);
   * console.log(`Modified: ${result.modified.length}`);
   * console.log(`Deleted: ${result.deleted.length}`);
   * ```
   */
  async detectChanges(): Promise<GitChangeResult> {
    // Implementation
  }
}
```

### 6.2 Inline Comments

Use inline comments sparingly for complex logic:

```typescript
// ✅ GOOD: Explains WHY, not WHAT
// Use WAL mode for better concurrent read performance
this.db.pragma('journal_mode = WAL');

// Calculate edge updates by comparing ID sets
// This is more efficient than nested loops for large graphs
const oldEdgeIds = new Set(oldGraph.edges.map(e => e.id));
const newEdgeIds = new Set(newGraph.edges.map(e => e.id));

// ❌ BAD: States the obvious
// Loop through nodes
for (const node of nodes) {
  // Add node to graph
  graph.nodes[node.id] = node;
}
```

---

## 7. Error Handling Patterns

### 7.1 Custom Errors

```typescript
/**
 * Custom error for Git operations
 */
export class GitOperationError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'GitOperationError';
  }
}

/**
 * Custom error for storage operations
 */
export class StorageError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'StorageError';
  }
}
```

### 7.2 Error Handling Strategy

```typescript
async detectChanges(): Promise<GitChangeResult> {
  try {
    // Primary logic
    return result;
  } catch (error) {
    // Log with context
    this.logger.error('Git change detection failed', {
      error,
      config: this.config
    });

    // Rethrow with context
    throw new GitOperationError(
      `Git change detection failed: ${(error as Error).message}`,
      error as Error
    );
  }
}
```

---

## 8. Testing File Organization

### 8.1 Test File Structure

```typescript
// git-change-detector.spec.ts
import { GitChangeDetector, GitChangeDetectorConfig } from './git-change-detector';
import simpleGit from 'simple-git';
import { Logger } from '@buildmotion-ai/logging';

// Mock external dependencies
jest.mock('simple-git');

describe('GitChangeDetector', () => {
  let detector: GitChangeDetector;
  let mockGit: jest.Mocked<ReturnType<typeof simpleGit>>;
  let mockLogger: jest.Mocked<Logger>;
  let config: GitChangeDetectorConfig;

  // Setup
  beforeEach(() => {
    // Setup mocks
  });

  // Teardown
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test suites grouped by method
  describe('detectChanges', () => {
    it('should detect added files', async () => {
      // Arrange
      // Act
      // Assert
    });

    it('should detect modified files', async () => {
      // Test
    });

    it('should handle errors gracefully', async () => {
      // Test
    });
  });

  describe('private methods (via public API)', () => {
    it('should validate repository', async () => {
      // Test
    });
  });
});
```

---

## 9. Configuration Files

### 9.1 project.json (Nx Configuration)

```json
{
  "name": "workspace-graph",
  "$schema": "../../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/shared/workspace-graph/workspace-graph/src",
  "projectType": "library",
  "tags": ["scope:shared", "type:library"],
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/libs/shared/workspace-graph/workspace-graph",
        "tsConfig": "libs/shared/workspace-graph/workspace-graph/tsconfig.lib.json",
        "packageJson": "libs/shared/workspace-graph/workspace-graph/package.json",
        "main": "libs/shared/workspace-graph/workspace-graph/src/index.ts",
        "assets": []
      }
    },
    "test": {
      "executor": "@nx/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
      "options": {
        "jestConfig": "libs/shared/workspace-graph/workspace-graph/jest.config.ts",
        "passWithNoTests": false,
        "coverage": true,
        "coverageReporters": ["html", "lcov", "text"],
        "coverageThreshold": {
          "global": {
            "branches": 80,
            "functions": 80,
            "lines": 80,
            "statements": 80
          }
        }
      }
    },
    "lint": {
      "executor": "@nx/linter:eslint",
      "options": {
        "lintFilePatterns": [
          "libs/shared/workspace-graph/workspace-graph/**/*.ts"
        ]
      }
    }
  }
}
```

---

## 10. Migration from Existing Code

### 10.1 Backward Compatibility

Existing code locations:

```
EXISTING:
libs/shared/workspace-graph/workspace-graph/src/lib/
  ├── types.ts                      # ✅ Keep as-is
  ├── workspace-graph-builder.ts    # ✅ Enhance with incremental flag
  └── workspace-graph-builder.spec.ts

NEW (add alongside existing):
libs/shared/workspace-graph/workspace-graph/src/lib/
  ├── git/                          # ✅ New directory
  ├── incremental/                  # ✅ New directory
  ├── storage/                      # ✅ New directory
  ├── query/                        # ✅ New directory
  └── cli/                          # ✅ New directory
```

### 10.2 Integration Strategy

```typescript
// Enhanced workspace-graph-builder.ts
import { IncrementalGraphBuilder } from './incremental';
import { GitChangeDetector } from './git';
import { HybridGraphStorage } from './storage';

export class WorkspaceGraphBuilder {
  constructor(private options: { incremental?: boolean }) {}

  async build(): Promise<WorkspaceGraph> {
    if (this.options.incremental) {
      return this.buildIncremental();
    } else {
      return this.buildFull(); // Existing implementation
    }
  }

  private async buildIncremental(): Promise<WorkspaceGraph> {
    const builder = new IncrementalGraphBuilder({
      workspaceRoot: process.cwd(),
      storage: new HybridGraphStorage('.workspace-graph'),
      changeDetector: new GitChangeDetector({ workspaceRoot: process.cwd() })
    });
    
    const result = await builder.buildIncremental();
    return result.graph;
  }

  private async buildFull(): Promise<WorkspaceGraph> {
    // Existing full build implementation
  }
}
```

---

## 11. Code Quality Checklist

Before committing code, verify:

- [ ] All files follow naming conventions (kebab-case)
- [ ] All public APIs have JSDoc comments
- [ ] All imports use barrel exports where possible
- [ ] No circular dependencies between layers
- [ ] TypeScript strict mode enabled
- [ ] Test files colocated with source files
- [ ] No unused imports or variables
- [ ] ESLint passes with no warnings
- [ ] Test coverage ≥ 80%
- [ ] All async functions have proper error handling
- [ ] Logger used for all info/warn/error messages
- [ ] Performance targets documented in comments

---

**Document Status:** ✅ Code Structure Specification Complete  
**Last Updated:** 2025-01-29
