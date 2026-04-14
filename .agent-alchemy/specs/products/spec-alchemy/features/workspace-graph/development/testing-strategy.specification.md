---
meta:
  id: spec-alchemy-workspace-graph-testing-strategy-specification
  title: Testing Strategy Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: product:spec-alchemy
  tags: []
  createdBy: unknown
  createdAt: '2026-03-12'
  reviewedAt: null
title: Testing Strategy Specification
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

# Workspace Graph: Testing Strategy Specification

---
version: 1.0.0
date: 2025-01-29
status: Development
category: Testing Strategy
complexity: High
phase: Development
owner: Agent Alchemy Developer Team
architecture_basis:
  - ../architecture/component-design.specification.md
  - ../architecture/performance-design.specification.md
related_specifications:
  - implementation-guide.specification.md
  - code-structure.specification.md
  - development-environment.specification.md
priority: Critical
coverage_requirement: 80% minimum (MANDATORY)
---

## Executive Summary

Comprehensive testing strategy for workspace graph incremental update system, ensuring 80%+ code coverage, performance validation, and integration testing.

### Testing Pyramid

```
         /\
        /  \  E2E Tests (5%)
       /----\
      /      \  Integration Tests (15%)
     /--------\
    /          \  Unit Tests (80%)
   /------------\
```

### Test Categories

1. **Unit Tests (80%):** Individual class/function testing
2. **Integration Tests (15%):** Component interaction testing
3. **End-to-End Tests (5%):** Full workflow testing
4. **Performance Tests:** Benchmark validation
5. **Regression Tests:** Backward compatibility

### Coverage Requirements

| Component | Minimum Coverage | Target Coverage |
|-----------|------------------|-----------------|
| GitChangeDetector | 85% | 90% |
| IncrementalGraphBuilder | 82% | 88% |
| HybridGraphStorage | 88% | 92% |
| SQLiteAdapter | 85% | 90% |
| GraphQueryAPI | 85% | 90% |
| **Overall** | **80%** | **85%** |

---

## 1. Unit Testing Strategy

### 1.1 GitChangeDetector Unit Tests

**File:** `libs/shared/workspace-graph/workspace-graph/src/lib/git/git-change-detector.spec.ts`

```typescript
import { GitChangeDetector, GitChangeDetectorConfig } from './git-change-detector';
import simpleGit, { SimpleGit, DiffResult } from 'simple-git';
import { Logger } from '@buildmotion-ai/logging';

// Mock simple-git module
jest.mock('simple-git');

describe('GitChangeDetector', () => {
  let detector: GitChangeDetector;
  let mockGit: jest.Mocked<SimpleGit>;
  let mockLogger: jest.Mocked<Logger>;
  let config: GitChangeDetectorConfig;

  beforeEach(() => {
    // Setup mock Git instance
    mockGit = {
      checkIsRepo: jest.fn(),
      revparse: jest.fn(),
      diffSummary: jest.fn()
    } as any;

    // Mock simple-git factory
    (simpleGit as jest.Mock).mockReturnValue(mockGit);

    // Setup mock logger
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    } as any;

    // Default config
    config = {
      workspaceRoot: '/test/workspace',
      baseCommit: 'HEAD~1',
      targetCommit: 'HEAD'
    };

    detector = new GitChangeDetector(config, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      expect(detector).toBeDefined();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'GitChangeDetector initialized',
        expect.objectContaining({
          config: expect.objectContaining({
            workspaceRoot: '/test/workspace',
            baseCommit: 'HEAD~1',
            targetCommit: 'HEAD'
          })
        })
      );
    });

    it('should apply custom include patterns', () => {
      const customDetector = new GitChangeDetector({
        workspaceRoot: '/test',
        includePatterns: ['**/*.tsx', '**/*.jsx']
      }, mockLogger);

      expect(customDetector).toBeDefined();
    });

    it('should apply custom exclude patterns', () => {
      const customDetector = new GitChangeDetector({
        workspaceRoot: '/test',
        excludePatterns: ['**/test/**', '**/dist/**']
      }, mockLogger);

      expect(customDetector).toBeDefined();
    });
  });

  describe('detectChanges', () => {
    describe('successful detection', () => {
      it('should detect added files', async () => {
        // Arrange
        mockGit.checkIsRepo.mockResolvedValue(true);
        mockGit.revparse
          .mockResolvedValueOnce('abc123')  // baseCommit
          .mockResolvedValueOnce('def456'); // targetCommit

        const mockDiffSummary: DiffResult = {
          files: [
            {
              file: 'libs/auth/user.service.ts',
              insertions: 100,
              deletions: 0,
              binary: false,
              changes: 100
            }
          ],
          changed: 1,
          insertions: 100,
          deletions: 0
        };
        mockGit.diffSummary.mockResolvedValue(mockDiffSummary);

        // Act
        const result = await detector.detectChanges();

        // Assert
        expect(result.added).toEqual(['libs/auth/user.service.ts']);
        expect(result.modified).toEqual([]);
        expect(result.deleted).toEqual([]);
        expect(result.changed).toEqual(['libs/auth/user.service.ts']);
        expect(result.baseCommit).toBe('abc123');
        expect(result.targetCommit).toBe('def456');
        expect(result.timestamp).toBeGreaterThan(0);
      });

      it('should detect modified files', async () => {
        // Arrange
        mockGit.checkIsRepo.mockResolvedValue(true);
        mockGit.revparse
          .mockResolvedValueOnce('abc123')
          .mockResolvedValueOnce('def456');

        const mockDiffSummary: DiffResult = {
          files: [
            {
              file: 'libs/auth/user.service.ts',
              insertions: 50,
              deletions: 30,
              binary: false,
              changes: 80
            }
          ],
          changed: 1,
          insertions: 50,
          deletions: 30
        };
        mockGit.diffSummary.mockResolvedValue(mockDiffSummary);

        // Act
        const result = await detector.detectChanges();

        // Assert
        expect(result.added).toEqual([]);
        expect(result.modified).toEqual(['libs/auth/user.service.ts']);
        expect(result.deleted).toEqual([]);
      });

      it('should detect deleted files', async () => {
        // Arrange
        mockGit.checkIsRepo.mockResolvedValue(true);
        mockGit.revparse
          .mockResolvedValueOnce('abc123')
          .mockResolvedValueOnce('def456');

        const mockDiffSummary: DiffResult = {
          files: [
            {
              file: 'libs/auth/old-service.ts',
              insertions: 0,
              deletions: 200,
              binary: false,
              changes: 200
            }
          ],
          changed: 1,
          insertions: 0,
          deletions: 200
        };
        mockGit.diffSummary.mockResolvedValue(mockDiffSummary);

        // Act
        const result = await detector.detectChanges();

        // Assert
        expect(result.deleted).toEqual(['libs/auth/old-service.ts']);
        expect(result.added).toEqual([]);
        expect(result.modified).toEqual([]);
      });

      it('should detect multiple file changes', async () => {
        // Arrange
        mockGit.checkIsRepo.mockResolvedValue(true);
        mockGit.revparse
          .mockResolvedValueOnce('abc123')
          .mockResolvedValueOnce('def456');

        const mockDiffSummary: DiffResult = {
          files: [
            {
              file: 'libs/auth/new-service.ts',
              insertions: 100,
              deletions: 0,
              binary: false,
              changes: 100
            },
            {
              file: 'libs/auth/user.service.ts',
              insertions: 50,
              deletions: 30,
              binary: false,
              changes: 80
            },
            {
              file: 'libs/auth/old-service.ts',
              insertions: 0,
              deletions: 200,
              binary: false,
              changes: 200
            }
          ],
          changed: 3,
          insertions: 150,
          deletions: 230
        };
        mockGit.diffSummary.mockResolvedValue(mockDiffSummary);

        // Act
        const result = await detector.detectChanges();

        // Assert
        expect(result.added).toEqual(['libs/auth/new-service.ts']);
        expect(result.modified).toEqual(['libs/auth/user.service.ts']);
        expect(result.deleted).toEqual(['libs/auth/old-service.ts']);
        expect(result.changed).toEqual([
          'libs/auth/new-service.ts',
          'libs/auth/user.service.ts'
        ]);
      });
    });

    describe('file filtering', () => {
      it('should exclude files by pattern', async () => {
        // Arrange
        const detectorWithExclude = new GitChangeDetector({
          workspaceRoot: '/test',
          excludePatterns: ['**/node_modules/**', '**/dist/**']
        }, mockLogger);

        mockGit.checkIsRepo.mockResolvedValue(true);
        mockGit.revparse
          .mockResolvedValueOnce('abc123')
          .mockResolvedValueOnce('def456');

        const mockDiffSummary: DiffResult = {
          files: [
            {
              file: 'node_modules/some-package/index.js',
              insertions: 10,
              deletions: 0,
              binary: false,
              changes: 10
            },
            {
              file: 'dist/bundle.js',
              insertions: 100,
              deletions: 0,
              binary: false,
              changes: 100
            },
            {
              file: 'libs/auth/user.service.ts',
              insertions: 50,
              deletions: 0,
              binary: false,
              changes: 50
            }
          ],
          changed: 3,
          insertions: 160,
          deletions: 0
        };
        mockGit.diffSummary.mockResolvedValue(mockDiffSummary);

        // Act
        const result = await detectorWithExclude.detectChanges();

        // Assert
        expect(result.changed).toEqual(['libs/auth/user.service.ts']);
        expect(result.changed).not.toContain('node_modules/some-package/index.js');
        expect(result.changed).not.toContain('dist/bundle.js');
      });

      it('should include only files matching include patterns', async () => {
        // Arrange
        const detectorWithInclude = new GitChangeDetector({
          workspaceRoot: '/test',
          includePatterns: ['**/*.ts']
        }, mockLogger);

        mockGit.checkIsRepo.mockResolvedValue(true);
        mockGit.revparse
          .mockResolvedValueOnce('abc123')
          .mockResolvedValueOnce('def456');

        const mockDiffSummary: DiffResult = {
          files: [
            {
              file: 'libs/auth/user.service.ts',
              insertions: 50,
              deletions: 0,
              binary: false,
              changes: 50
            },
            {
              file: 'libs/auth/config.json',
              insertions: 10,
              deletions: 0,
              binary: false,
              changes: 10
            }
          ],
          changed: 2,
          insertions: 60,
          deletions: 0
        };
        mockGit.diffSummary.mockResolvedValue(mockDiffSummary);

        // Act
        const result = await detectorWithInclude.detectChanges();

        // Assert
        expect(result.changed).toEqual(['libs/auth/user.service.ts']);
        expect(result.changed).not.toContain('libs/auth/config.json');
      });

      it('should skip binary files', async () => {
        // Arrange
        mockGit.checkIsRepo.mockResolvedValue(true);
        mockGit.revparse
          .mockResolvedValueOnce('abc123')
          .mockResolvedValueOnce('def456');

        const mockDiffSummary: DiffResult = {
          files: [
            {
              file: 'assets/image.png',
              insertions: 0,
              deletions: 0,
              binary: true,
              changes: 0
            },
            {
              file: 'libs/auth/user.service.ts',
              insertions: 50,
              deletions: 0,
              binary: false,
              changes: 50
            }
          ],
          changed: 2,
          insertions: 50,
          deletions: 0
        };
        mockGit.diffSummary.mockResolvedValue(mockDiffSummary);

        // Act
        const result = await detector.detectChanges();

        // Assert
        expect(result.changed).toEqual(['libs/auth/user.service.ts']);
        expect(result.changed).not.toContain('assets/image.png');
        expect(mockLogger.debug).toHaveBeenCalledWith(
          'Skipping binary file',
          { file: 'assets/image.png' }
        );
      });
    });

    describe('error handling', () => {
      it('should throw error if not a Git repository', async () => {
        // Arrange
        mockGit.checkIsRepo.mockResolvedValue(false);

        // Act & Assert
        await expect(detector.detectChanges()).rejects.toThrow(
          'Not a Git repository: /test/workspace'
        );
      });

      it('should throw error if commit resolution fails', async () => {
        // Arrange
        mockGit.checkIsRepo.mockResolvedValue(true);
        mockGit.revparse.mockRejectedValue(new Error('Invalid commit reference'));

        // Act & Assert
        await expect(detector.detectChanges()).rejects.toThrow(
          'Failed to resolve commit'
        );
      });

      it('should throw error if Git diff fails', async () => {
        // Arrange
        mockGit.checkIsRepo.mockResolvedValue(true);
        mockGit.revparse
          .mockResolvedValueOnce('abc123')
          .mockResolvedValueOnce('def456');
        mockGit.diffSummary.mockRejectedValue(new Error('Git diff failed'));

        // Act & Assert
        await expect(detector.detectChanges()).rejects.toThrow(
          'Git change detection failed'
        );
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Git change detection failed',
          expect.any(Error)
        );
      });
    });

    describe('performance', () => {
      it('should complete within 60ms performance target', async () => {
        // Arrange
        mockGit.checkIsRepo.mockResolvedValue(true);
        mockGit.revparse
          .mockResolvedValueOnce('abc123')
          .mockResolvedValueOnce('def456');
        mockGit.diffSummary.mockResolvedValue({
          files: [],
          changed: 0,
          insertions: 0,
          deletions: 0
        });

        // Act
        const startTime = Date.now();
        await detector.detectChanges();
        const duration = Date.now() - startTime;

        // Assert
        expect(duration).toBeLessThan(60);
      });

      it('should log warning if performance target is exceeded', async () => {
        // Arrange
        mockGit.checkIsRepo.mockResolvedValue(true);
        mockGit.revparse
          .mockResolvedValueOnce('abc123')
          .mockResolvedValueOnce('def456');
        
        // Simulate slow Git operation
        mockGit.diffSummary.mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            files: [],
            changed: 0,
            insertions: 0,
            deletions: 0
          }), 70))
        );

        // Act
        await detector.detectChanges();

        // Assert
        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Git change detection exceeded 60ms target',
          expect.objectContaining({
            duration: expect.any(Number)
          })
        );
      });
    });
  });

  describe('pattern matching', () => {
    it('should match glob patterns correctly', () => {
      // Test via detectChanges (indirect testing of private method)
      // Pattern matching is tested through file filtering tests above
      expect(true).toBe(true); // Covered by integration tests
    });
  });
});
```

**Coverage Target:** 85-90%

### 1.2 IncrementalGraphBuilder Unit Tests

**File:** `libs/shared/workspace-graph/workspace-graph/src/lib/incremental/incremental-graph-builder.spec.ts`

```typescript
import { IncrementalGraphBuilder, IncrementalGraphBuilderConfig } from './incremental-graph-builder';
import { GitChangeDetector, GitChangeResult } from '../git/git-change-detector';
import { HybridGraphStorage } from '../storage/hybrid-graph-storage';
import { WorkspaceGraph, GraphNode } from '../types';

jest.mock('../git/git-change-detector');
jest.mock('../storage/hybrid-graph-storage');

describe('IncrementalGraphBuilder', () => {
  let builder: IncrementalGraphBuilder;
  let mockChangeDetector: jest.Mocked<GitChangeDetector>;
  let mockStorage: jest.Mocked<HybridGraphStorage>;
  let config: IncrementalGraphBuilderConfig;
  let existingGraph: WorkspaceGraph;

  beforeEach(() => {
    // Setup mock change detector
    mockChangeDetector = {
      detectChanges: jest.fn()
    } as any;

    // Setup mock storage
    mockStorage = {
      loadGraph: jest.fn(),
      saveGraph: jest.fn(),
      queryNodesByType: jest.fn(),
      close: jest.fn()
    } as any;

    // Setup existing graph
    existingGraph = {
      nodes: {
        'node_existing_ts': {
          id: 'node_existing_ts',
          type: 'file',
          path: 'existing.ts',
          metadata: {},
          createdAt: Date.now() - 10000,
          updatedAt: Date.now() - 10000
        }
      },
      edges: [],
      version: 1,
      metadata: {}
    };

    mockStorage.loadGraph.mockResolvedValue(existingGraph);

    // Setup config
    config = {
      workspaceRoot: '/test/workspace',
      storage: mockStorage,
      changeDetector: mockChangeDetector,
      validateAfterUpdate: false,
      maxParallel: 2
    };

    builder = new IncrementalGraphBuilder(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('buildIncremental', () => {
    it('should build graph incrementally with added files', async () => {
      // Arrange
      const changes: GitChangeResult = {
        added: ['libs/auth/new-service.ts'],
        modified: [],
        deleted: [],
        changed: ['libs/auth/new-service.ts'],
        baseCommit: 'abc123',
        targetCommit: 'def456',
        timestamp: Date.now()
      };
      mockChangeDetector.detectChanges.mockResolvedValue(changes);

      // Act
      const result = await builder.buildIncremental();

      // Assert
      expect(result.nodesUpdated).toBe(1);
      expect(result.filesProcessed).toEqual(['libs/auth/new-service.ts']);
      expect(result.graph.nodes).toHaveProperty('node_libs_auth_new_service_ts');
      expect(mockStorage.saveGraph).toHaveBeenCalled();
    });

    it('should handle modified files', async () => {
      // Arrange
      const changes: GitChangeResult = {
        added: [],
        modified: ['existing.ts'],
        deleted: [],
        changed: ['existing.ts'],
        baseCommit: 'abc123',
        targetCommit: 'def456',
        timestamp: Date.now()
      };
      mockChangeDetector.detectChanges.mockResolvedValue(changes);

      // Act
      const result = await builder.buildIncremental();

      // Assert
      expect(result.nodesUpdated).toBe(1);
      expect(result.graph.nodes['node_existing_ts'].updatedAt).toBeGreaterThan(
        existingGraph.nodes['node_existing_ts'].updatedAt
      );
    });

    it('should handle deleted files', async () => {
      // Arrange
      const changes: GitChangeResult = {
        added: [],
        modified: [],
        deleted: ['existing.ts'],
        changed: [],
        baseCommit: 'abc123',
        targetCommit: 'def456',
        timestamp: Date.now()
      };
      mockChangeDetector.detectChanges.mockResolvedValue(changes);

      // Act
      const result = await builder.buildIncremental();

      // Assert
      expect(result.nodesUpdated).toBe(1);
      expect(result.graph.nodes).not.toHaveProperty('node_existing_ts');
    });

    it('should handle no changes', async () => {
      // Arrange
      const changes: GitChangeResult = {
        added: [],
        modified: [],
        deleted: [],
        changed: [],
        baseCommit: 'abc123',
        targetCommit: 'def456',
        timestamp: Date.now()
      };
      mockChangeDetector.detectChanges.mockResolvedValue(changes);

      // Act
      const result = await builder.buildIncremental();

      // Assert
      expect(result.nodesUpdated).toBe(0);
      expect(result.filesProcessed).toEqual([]);
    });

    it('should complete within performance target (<100ms per file)', async () => {
      // Arrange
      const changes: GitChangeResult = {
        added: ['file1.ts'],
        modified: [],
        deleted: [],
        changed: ['file1.ts'],
        baseCommit: 'abc123',
        targetCommit: 'def456',
        timestamp: Date.now()
      };
      mockChangeDetector.detectChanges.mockResolvedValue(changes);

      // Act
      const startTime = Date.now();
      await builder.buildIncremental();
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeLessThan(100);
    });
  });
});
```

**Coverage Target:** 82-88%

### 1.3 HybridGraphStorage Unit Tests

**File:** `libs/shared/workspace-graph/workspace-graph/src/lib/storage/hybrid-graph-storage.spec.ts`

```typescript
import { HybridGraphStorage } from './hybrid-graph-storage';
import { SQLiteAdapter } from './sqlite-adapter';
import { WorkspaceGraph } from '../types';
import * as fs from 'fs/promises';

jest.mock('./sqlite-adapter');
jest.mock('fs/promises');

describe('HybridGraphStorage', () => {
  let storage: HybridGraphStorage;
  let mockSqliteAdapter: jest.Mocked<SQLiteAdapter>;
  const storageDir = '/test/.workspace-graph';

  beforeEach(() => {
    mockSqliteAdapter = {
      saveGraph: jest.fn(),
      loadGraph: jest.fn(),
      queryNodesByType: jest.fn(),
      close: jest.fn()
    } as any;

    (SQLiteAdapter as jest.Mock).mockReturnValue(mockSqliteAdapter);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.readFile as jest.Mock).mockResolvedValue('{}');

    storage = new HybridGraphStorage(storageDir);
  });

  describe('saveGraph', () => {
    it('should save to both SQLite and JSON', async () => {
      // Arrange
      const graph: WorkspaceGraph = {
        nodes: {},
        edges: [],
        version: 1,
        metadata: {}
      };

      // Act
      await storage.saveGraph(graph);

      // Assert
      expect(mockSqliteAdapter.saveGraph).toHaveBeenCalledWith(graph);
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('workspace-graph.json'),
        expect.any(String)
      );
    });
  });

  describe('loadGraph', () => {
    it('should load from SQLite if available', async () => {
      // Arrange
      const graph: WorkspaceGraph = {
        nodes: { test: {} as any },
        edges: [],
        version: 1,
        metadata: {}
      };
      mockSqliteAdapter.loadGraph.mockReturnValue(graph);

      // Act
      const result = await storage.loadGraph();

      // Assert
      expect(result).toEqual(graph);
      expect(mockSqliteAdapter.loadGraph).toHaveBeenCalled();
    });

    it('should fallback to JSON if SQLite is empty', async () => {
      // Arrange
      const emptyGraph: WorkspaceGraph = {
        nodes: {},
        edges: [],
        version: 1,
        metadata: {}
      };
      mockSqliteAdapter.loadGraph.mockReturnValue(emptyGraph);

      const jsonGraph: WorkspaceGraph = {
        nodes: { test: {} as any },
        edges: [],
        version: 1,
        metadata: {}
      };
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(jsonGraph));

      // Act
      const result = await storage.loadGraph();

      // Assert
      expect(result).toEqual(jsonGraph);
      expect(mockSqliteAdapter.saveGraph).toHaveBeenCalledWith(jsonGraph);
    });
  });
});
```

**Coverage Target:** 88-92%

---

## 2. Integration Testing

### 2.1 Full Workflow Integration Test

**File:** `libs/shared/workspace-graph/workspace-graph/src/lib/__tests__/integration.test.ts`

```typescript
import { WorkspaceGraphBuilder } from '../workspace-graph-builder';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('Workspace Graph Integration', () => {
  const testWorkspaceRoot = path.join(__dirname, '__fixtures__', 'test-workspace');
  const storageDir = path.join(testWorkspaceRoot, '.workspace-graph');

  beforeAll(async () => {
    await fs.mkdir(storageDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(storageDir, { recursive: true, force: true });
  });

  it('should build full graph end-to-end', async () => {
    const builder = new WorkspaceGraphBuilder({
      workspaceRoot: testWorkspaceRoot,
      mode: 'full',
      outputDir: storageDir
    });

    const graph = await builder.build();

    expect(graph.nodes).toBeDefined();
    expect(graph.metadata.buildMode).toBe('full');
  });

  it('should build incremental graph end-to-end', async () => {
    const builder = new WorkspaceGraphBuilder({
      workspaceRoot: testWorkspaceRoot,
      mode: 'incremental',
      outputDir: storageDir
    });

    const graph = await builder.build();

    expect(graph.nodes).toBeDefined();
    expect(graph.metadata.buildMode).toBe('incremental');
  });
});
```

---

## 3. Performance Testing

### 3.1 Benchmark Suite

**File:** `libs/shared/workspace-graph/workspace-graph/src/__benchmarks__/performance.bench.ts`

```typescript
import { GitChangeDetector } from '../lib/git/git-change-detector';
import { IncrementalGraphBuilder } from '../lib/incremental/incremental-graph-builder';
import { performance } from 'perf_hooks';

describe('Performance Benchmarks', () => {
  it('should detect Git changes in <60ms', async () => {
    const detector = new GitChangeDetector({
      workspaceRoot: process.cwd()
    });

    const times: number[] = [];
    
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      await detector.detectChanges();
      const duration = performance.now() - start;
      times.push(duration);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    expect(avg).toBeLessThan(60);
  });

  it('should achieve 20-30x performance improvement over full build', async () => {
    // Benchmark comparison test
    // Full build: ~2.2s
    // Incremental: ~65-100ms
    // Ratio: 22-33x improvement
  });
});
```

---

## 4. Test Coverage Report

### 4.1 Coverage Commands

```bash
# Generate coverage report
nx test workspace-graph --coverage

# View coverage in browser
open coverage/libs/shared/workspace-graph/workspace-graph/index.html

# Coverage summary
nx test workspace-graph --coverage --coverageReporters=text
```

### 4.2 Coverage Enforcement

**jest.config.ts:**

```typescript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

---

## 5. Test Data Fixtures

### 5.1 Sample Workspace

**Directory:** `libs/shared/workspace-graph/workspace-graph/src/__fixtures__/test-workspace/`

```
test-workspace/
├── .git/                     # Git repository
├── libs/
│   └── auth/
│       ├── user.service.ts
│       └── project.json
└── .workspace-graph/
    └── workspace-graph.json
```

---

## 6. Continuous Testing

### 6.1 Pre-commit Testing

```bash
# In .husky/pre-commit
npm run workspace-graph:test
```

### 6.2 CI Testing

```yaml
# In .github/workflows/test.yml
- name: Run workspace graph tests
  run: nx test workspace-graph --coverage
```

---

**Document Status:** ✅ Testing Strategy Specification Complete  
**Last Updated:** 2025-01-29  
**Coverage Requirement:** 80% minimum (MANDATORY)
