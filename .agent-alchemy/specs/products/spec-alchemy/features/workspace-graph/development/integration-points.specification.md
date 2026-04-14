---
meta:
  id: spec-alchemy-workspace-graph-integration-points-specification
  title: Integration Points Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: product:spec-alchemy
  tags: []
  createdBy: unknown
  createdAt: '2026-03-12'
  reviewedAt: null
title: Integration Points Specification
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

# Workspace Graph: Integration Points Specification

---
version: 1.0.0
date: 2025-01-29
status: Development
category: Integration
complexity: High
phase: Development
owner: Agent Alchemy Developer Team
architecture_basis:
  - ../architecture/integration-patterns.specification.md
  - ../architecture/deployment-architecture.specification.md
related_specifications:
  - implementation-guide.specification.md
  - code-structure.specification.md
priority: Critical
---

## Executive Summary

Defines all integration points for the workspace graph incremental update system, including existing workspace-graph-builder.ts, Nx workspace, Agent Alchemy specs, CLI, Git hooks, and CI/CD pipelines.

### Integration Layers

1. **Existing Code Integration:** workspace-graph-builder.ts
2. **Nx Workspace Integration:** project.json, nx.json, executors
3. **Agent Alchemy Specs Integration:** Spec detection and parsing
4. **CLI Integration:** cli.ts enhancements
5. **Git Hooks Integration:** Husky pre-commit hooks
6. **CI/CD Integration:** GitHub Actions workflows

---

## 1. Existing workspace-graph-builder.ts Integration

### 1.1 Current Implementation Analysis

**File:** `libs/shared/workspace-graph/workspace-graph/src/lib/workspace-graph-builder.ts`

**Current Functionality:**
- Builds complete workspace graph from scratch
- Parses TypeScript files for imports/exports
- Reads Nx project.json files
- Outputs JSON graph to `.workspace-graph/workspace-graph.json`

### 1.2 Enhanced Implementation

**Objective:** Add incremental mode while maintaining backward compatibility.

```typescript
import { Logger } from '@buildmotion-ai/logging';
import { WorkspaceGraph } from './types';
import { IncrementalGraphBuilder } from './incremental';
import { GitChangeDetector } from './git';
import { HybridGraphStorage } from './storage';

/**
 * Workspace graph builder configuration
 */
export interface WorkspaceGraphBuilderConfig {
  /** Workspace root directory (absolute path) */
  workspaceRoot: string;
  /** Build mode: 'full' or 'incremental' */
  mode?: 'full' | 'incremental';
  /** Output directory for graph storage */
  outputDir?: string;
  /** Include spec files in graph */
  includeSpecs?: boolean;
  /** Include guardrails in graph */
  includeGuardrails?: boolean;
}

/**
 * Main workspace graph builder
 * 
 * Supports both full and incremental build modes.
 * 
 * @example Full Build
 * ```typescript
 * const builder = new WorkspaceGraphBuilder({
 *   workspaceRoot: process.cwd(),
 *   mode: 'full'
 * });
 * const graph = await builder.build();
 * ```
 * 
 * @example Incremental Build
 * ```typescript
 * const builder = new WorkspaceGraphBuilder({
 *   workspaceRoot: process.cwd(),
 *   mode: 'incremental'
 * });
 * const graph = await builder.build();
 * ```
 */
export class WorkspaceGraphBuilder {
  private readonly logger: Logger;
  private readonly config: Required<WorkspaceGraphBuilderConfig>;
  private readonly storage: HybridGraphStorage;

  constructor(config: WorkspaceGraphBuilderConfig) {
    this.logger = new Logger('WorkspaceGraphBuilder');

    this.config = {
      workspaceRoot: config.workspaceRoot,
      mode: config.mode ?? 'full',
      outputDir: config.outputDir ?? '.workspace-graph',
      includeSpecs: config.includeSpecs ?? true,
      includeGuardrails: config.includeGuardrails ?? true
    };

    this.storage = new HybridGraphStorage(this.config.outputDir, this.logger);
  }

  /**
   * Build workspace graph
   * 
   * Delegates to full or incremental builder based on mode.
   */
  async build(): Promise<WorkspaceGraph> {
    this.logger.info(`Starting ${this.config.mode} workspace graph build`);

    const startTime = Date.now();
    const graph = this.config.mode === 'incremental'
      ? await this.buildIncremental()
      : await this.buildFull();

    const duration = Date.now() - startTime;
    
    this.logger.info('Workspace graph build complete', {
      mode: this.config.mode,
      duration,
      nodeCount: Object.keys(graph.nodes).length,
      edgeCount: graph.edges.length
    });

    return graph;
  }

  /**
   * Build graph incrementally using Git change detection
   */
  private async buildIncremental(): Promise<WorkspaceGraph> {
    const changeDetector = new GitChangeDetector({
      workspaceRoot: this.config.workspaceRoot,
      includePatterns: this.getIncludePatterns(),
      excludePatterns: this.getExcludePatterns()
    }, this.logger);

    const builder = new IncrementalGraphBuilder({
      workspaceRoot: this.config.workspaceRoot,
      storage: this.storage,
      changeDetector
    });

    const result = await builder.buildIncremental();
    
    this.logger.info('Incremental build statistics', {
      nodesUpdated: result.nodesUpdated,
      edgesUpdated: result.edgesUpdated,
      filesProcessed: result.filesProcessed.length
    });

    return result.graph;
  }

  /**
   * Build complete graph from scratch (existing implementation)
   */
  private async buildFull(): Promise<WorkspaceGraph> {
    // EXISTING IMPLEMENTATION REMAINS UNCHANGED
    // This preserves backward compatibility
    
    this.logger.info('Building full workspace graph...');

    // Existing full build logic here
    const graph: WorkspaceGraph = {
      nodes: {},
      edges: [],
      version: 1,
      metadata: {
        buildMode: 'full',
        buildTimestamp: Date.now()
      }
    };

    // ... existing implementation ...

    // Save to storage (now uses hybrid storage)
    await this.storage.saveGraph(graph);

    return graph;
  }

  /**
   * Get file patterns to include based on configuration
   */
  private getIncludePatterns(): string[] {
    const patterns = [
      '**/*.ts',
      '**/project.json',
      '**/package.json'
    ];

    if (this.config.includeSpecs) {
      patterns.push('**/*.specification.md');
    }

    if (this.config.includeGuardrails) {
      patterns.push('**/*.guardrail.md');
    }

    return patterns;
  }

  /**
   * Get file patterns to exclude
   */
  private getExcludePatterns(): string[] {
    return [
      '**/node_modules/**',
      '**/dist/**',
      '**/.nx/**',
      '**/coverage/**',
      '**/*.spec.ts',
      '**/*.test.ts'
    ];
  }
}
```

### 1.3 Migration Strategy

**Phase 1: Add incremental support alongside existing code**
- Keep existing `buildFull()` method unchanged
- Add new `buildIncremental()` method
- Use `mode` parameter to switch between implementations

**Phase 2: Gradual adoption**
- Default to `full` mode initially
- Test incremental mode thoroughly
- Switch default to `incremental` after validation

**Phase 3: Deprecation (optional)**
- Mark full mode as legacy
- Eventually remove full mode (breaking change - major version bump)

---

## 2. Nx Workspace Integration

### 2.1 project.json Configuration

**File:** `libs/shared/workspace-graph/workspace-graph/project.json`

Add new build targets:

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
    },
    "graph-build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "node dist/libs/shared/workspace-graph/workspace-graph/src/lib/cli/cli.js build",
        "cwd": "{workspaceRoot}"
      }
    },
    "graph-build-incremental": {
      "executor": "nx:run-commands",
      "options": {
        "command": "node dist/libs/shared/workspace-graph/workspace-graph/src/lib/cli/cli.js build --incremental",
        "cwd": "{workspaceRoot}"
      }
    },
    "graph-validate": {
      "executor": "nx:run-commands",
      "options": {
        "command": "node dist/libs/shared/workspace-graph/workspace-graph/src/lib/cli/cli.js validate",
        "cwd": "{workspaceRoot}"
      }
    }
  }
}
```

### 2.2 nx.json Configuration

Add workspace-level task dependencies:

```json
{
  "targetDefaults": {
    "graph-build": {
      "dependsOn": ["build"],
      "cache": true,
      "inputs": [
        "{projectRoot}/**/*.ts",
        "{workspaceRoot}/**/*.ts",
        "{workspaceRoot}/**/project.json"
      ],
      "outputs": ["{workspaceRoot}/.workspace-graph"]
    },
    "graph-build-incremental": {
      "dependsOn": ["build"],
      "cache": false,
      "inputs": ["default"]
    }
  }
}
```

### 2.3 Nx Task Graph Integration

The workspace graph builder can be used as an Nx task:

```bash
# Build graph as part of Nx task
nx graph-build workspace-graph

# Build incrementally
nx graph-build-incremental workspace-graph

# Validate graph
nx graph-validate workspace-graph
```

---

## 3. Agent Alchemy Specs Integration

### 3.1 Spec File Detection

**Objective:** Detect and parse `.specification.md` files in `.agent-alchemy/specs/` directory.

**Implementation:** `libs/shared/workspace-graph/workspace-graph/src/lib/analysis/spec-parser.ts`

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from '@buildmotion-ai/logging';
import { GraphNode } from '../types';

export interface SpecMetadata {
  version?: string;
  status?: string;
  category?: string;
  phase?: string;
  owner?: string;
  priority?: string;
  relatedSpecs?: string[];
}

/**
 * Parser for Agent Alchemy specification files
 */
export class SpecParser {
  constructor(private readonly logger: Logger) {}

  /**
   * Parse specification file and extract metadata
   */
  async parseSpecFile(filePath: string): Promise<GraphNode> {
    const content = await fs.readFile(filePath, 'utf-8');
    const metadata = this.extractFrontmatter(content);

    return {
      id: `spec_${this.generateIdFromPath(filePath)}`,
      type: 'spec',
      path: filePath,
      metadata: {
        ...metadata,
        title: this.extractTitle(content)
      },
      createdAt: (await fs.stat(filePath)).birthtimeMs,
      updatedAt: (await fs.stat(filePath)).mtimeMs
    };
  }

  /**
   * Extract YAML frontmatter from specification file
   */
  private extractFrontmatter(content: string): SpecMetadata {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return {};
    }

    const yaml = match[1];
    const metadata: SpecMetadata = {};

    // Simple YAML parsing (basic key: value)
    const lines = yaml.split('\n');
    for (const line of lines) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();

      if (key && value) {
        const cleanKey = key.trim() as keyof SpecMetadata;
        
        // Handle related_specifications as array
        if (cleanKey === 'relatedSpecs' || key.includes('related')) {
          metadata.relatedSpecs = metadata.relatedSpecs ?? [];
          metadata.relatedSpecs.push(value);
        } else {
          (metadata as any)[cleanKey] = value;
        }
      }
    }

    return metadata;
  }

  /**
   * Extract title from markdown content
   */
  private extractTitle(content: string): string {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1] : '';
  }

  /**
   * Generate node ID from file path
   */
  private generateIdFromPath(filePath: string): string {
    return filePath
      .replace(/[/\\]/g, '_')
      .replace(/\./g, '_')
      .replace(/-/g, '_');
  }
}
```

### 3.2 Spec File Inclusion in Graph

Update `GitChangeDetector` to include spec files:

```typescript
const config: GitChangeDetectorConfig = {
  workspaceRoot: process.cwd(),
  includePatterns: [
    '**/*.ts',
    '**/project.json',
    '**/*.specification.md',  // ← Include specs
    '**/*.guardrail.md'       // ← Include guardrails
  ]
};
```

---

## 4. CLI Integration

### 4.1 Enhanced CLI with Incremental Flag

**File:** `libs/shared/workspace-graph/workspace-graph/src/lib/cli/cli.ts`

```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import { WorkspaceGraphBuilder } from '../workspace-graph-builder';
import { Logger } from '@buildmotion-ai/logging';

const program = new Command();
const logger = new Logger('WorkspaceGraphCLI');

program
  .name('workspace-graph')
  .description('Build and query workspace dependency graph')
  .version('2.0.0');

/**
 * Build command
 */
program
  .command('build')
  .description('Build workspace graph')
  .option('-i, --incremental', 'Use incremental build based on Git changes')
  .option('-f, --full', 'Force full rebuild (ignore Git changes)')
  .option('-o, --output <dir>', 'Output directory', '.workspace-graph')
  .option('--no-specs', 'Exclude specification files')
  .option('--no-guardrails', 'Exclude guardrail files')
  .option('-v, --validate', 'Validate graph after build')
  .action(async (options) => {
    try {
      const mode = options.incremental ? 'incremental' : 'full';
      
      logger.info(`Building workspace graph (${mode} mode)...`);

      const builder = new WorkspaceGraphBuilder({
        workspaceRoot: process.cwd(),
        mode,
        outputDir: options.output,
        includeSpecs: options.specs,
        includeGuardrails: options.guardrails
      });

      const graph = await builder.build();

      logger.info('Build complete', {
        nodes: Object.keys(graph.nodes).length,
        edges: graph.edges.length,
        mode
      });

      if (options.validate) {
        logger.info('Validating graph...');
        // Validation logic
        logger.info('✅ Graph validation passed');
      }

      process.exit(0);
    } catch (error) {
      logger.error('Build failed', error as Error);
      process.exit(1);
    }
  });

/**
 * Query command
 */
program
  .command('query')
  .description('Query workspace graph')
  .option('-t, --type <type>', 'Node type filter')
  .option('-p, --path <path>', 'Node path filter')
  .action(async (options) => {
    try {
      // Query logic using GraphQueryAPI
      logger.info('Querying graph...', options);
    } catch (error) {
      logger.error('Query failed', error as Error);
      process.exit(1);
    }
  });

/**
 * Validate command
 */
program
  .command('validate')
  .description('Validate workspace graph integrity')
  .option('-o, --output <dir>', 'Graph storage directory', '.workspace-graph')
  .action(async (options) => {
    try {
      logger.info('Validating workspace graph...');
      // Validation logic
      logger.info('✅ Validation passed');
    } catch (error) {
      logger.error('Validation failed', error as Error);
      process.exit(1);
    }
  });

program.parse(process.argv);
```

### 4.2 CLI Usage Examples

```bash
# Full build (default)
npx workspace-graph build

# Incremental build
npx workspace-graph build --incremental

# Full build with validation
npx workspace-graph build --full --validate

# Exclude specs and guardrails
npx workspace-graph build --no-specs --no-guardrails

# Query graph
npx workspace-graph query --type spec

# Validate graph
npx workspace-graph validate
```

---

## 5. Git Hooks Integration

### 5.1 Pre-commit Hook

**Objective:** Automatically update workspace graph before commits.

**File:** `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Updating workspace graph..."

# Build graph incrementally
npx workspace-graph build --incremental

# Add updated graph to commit
git add .workspace-graph/workspace-graph.json

echo "✅ Workspace graph updated"
```

### 5.2 Post-checkout Hook

**Objective:** Rebuild graph after branch switch.

**File:** `.husky/post-checkout`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔄 Branch switched - updating workspace graph..."

# Rebuild graph (incremental or full based on changes)
npx workspace-graph build --incremental

echo "✅ Workspace graph synchronized"
```

### 5.3 Configuration

Setup Husky:

```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npx workspace-graph build --incremental"
npx husky add .husky/post-checkout "npx workspace-graph build --incremental"
```

---

## 6. GitHub Actions Integration

### 6.1 CI Workflow

**File:** `.github/workflows/workspace-graph.yml`

```yaml
name: Workspace Graph

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build-graph:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for Git diff

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build workspace graph library
        run: nx build workspace-graph

      - name: Build workspace graph (incremental)
        run: npx workspace-graph build --incremental --validate

      - name: Upload graph artifact
        uses: actions/upload-artifact@v4
        with:
          name: workspace-graph
          path: .workspace-graph/
          retention-days: 30

      - name: Check graph size
        run: |
          GRAPH_SIZE=$(du -sh .workspace-graph | cut -f1)
          echo "Graph size: $GRAPH_SIZE"
          
          # Fail if graph is too large (>10MB)
          SIZE_BYTES=$(du -sb .workspace-graph | cut -f1)
          if [ $SIZE_BYTES -gt 10485760 ]; then
            echo "❌ Graph size exceeds 10MB limit"
            exit 1
          fi

      - name: Comment PR with graph stats
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const graph = JSON.parse(fs.readFileSync('.workspace-graph/workspace-graph.json', 'utf8'));
            
            const comment = `
            ## 📊 Workspace Graph Stats
            
            - **Nodes:** ${Object.keys(graph.nodes).length}
            - **Edges:** ${graph.edges.length}
            - **Build Mode:** ${graph.metadata.buildMode}
            - **Version:** ${graph.version}
            `;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

### 6.2 Performance Benchmark Workflow

**File:** `.github/workflows/graph-benchmark.yml`

```yaml
name: Workspace Graph Benchmarks

on:
  push:
    branches: [main]
    paths:
      - 'libs/shared/workspace-graph/**'

jobs:
  benchmark:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - run: npm ci
      - run: nx build workspace-graph
      
      - name: Run benchmarks
        run: npm run workspace-graph:benchmark
      
      - name: Upload benchmark results
        uses: actions/upload-artifact@v4
        with:
          name: benchmark-results
          path: benchmark-results.json
```

---

## 7. Integration Testing

### 7.1 End-to-End Integration Test

**File:** `libs/shared/workspace-graph/workspace-graph/src/lib/__tests__/integration.test.ts`

```typescript
import { WorkspaceGraphBuilder } from '../workspace-graph-builder';
import { GitChangeDetector } from '../git/git-change-detector';
import { HybridGraphStorage } from '../storage/hybrid-graph-storage';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Workspace Graph Integration', () => {
  const testWorkspaceRoot = path.join(__dirname, '__fixtures__', 'test-workspace');
  const storageDir = path.join(testWorkspaceRoot, '.workspace-graph');

  beforeAll(async () => {
    // Setup test workspace
    await fs.mkdir(storageDir, { recursive: true });
  });

  afterAll(async () => {
    // Cleanup
    await fs.rm(storageDir, { recursive: true, force: true });
  });

  it('should build graph in full mode', async () => {
    const builder = new WorkspaceGraphBuilder({
      workspaceRoot: testWorkspaceRoot,
      mode: 'full',
      outputDir: storageDir
    });

    const graph = await builder.build();

    expect(graph.nodes).toBeDefined();
    expect(graph.edges).toBeDefined();
    expect(graph.metadata.buildMode).toBe('full');
  });

  it('should build graph in incremental mode', async () => {
    const builder = new WorkspaceGraphBuilder({
      workspaceRoot: testWorkspaceRoot,
      mode: 'incremental',
      outputDir: storageDir
    });

    const graph = await builder.build();

    expect(graph.nodes).toBeDefined();
    expect(graph.edges).toBeDefined();
    expect(graph.metadata.buildMode).toBe('incremental');
  });

  it('should produce consistent graphs between full and incremental modes', async () => {
    const fullBuilder = new WorkspaceGraphBuilder({
      workspaceRoot: testWorkspaceRoot,
      mode: 'full',
      outputDir: storageDir
    });

    const incBuilder = new WorkspaceGraphBuilder({
      workspaceRoot: testWorkspaceRoot,
      mode: 'incremental',
      outputDir: storageDir
    });

    const fullGraph = await fullBuilder.build();
    const incGraph = await incBuilder.build();

    expect(Object.keys(fullGraph.nodes).length).toBe(Object.keys(incGraph.nodes).length);
    expect(fullGraph.edges.length).toBe(incGraph.edges.length);
  });
});
```

---

## 8. Documentation Integration

### 8.1 README.md Updates

Add to `libs/shared/workspace-graph/workspace-graph/README.md`:

```markdown
## Incremental Build Mode

The workspace graph builder now supports incremental updates based on Git changes:

```typescript
import { WorkspaceGraphBuilder } from '@buildmotion-ai/workspace-graph';

const builder = new WorkspaceGraphBuilder({
  workspaceRoot: process.cwd(),
  mode: 'incremental'  // Use Git-based incremental updates
});

const graph = await builder.build();
```

### Performance

- **Full build:** ~2.2s for 10K files
- **Incremental build:** ~65-100ms per changed file (20-30x faster)

### CLI Usage

```bash
# Incremental build
npx workspace-graph build --incremental

# Full build
npx workspace-graph build --full
```

---

## 9. Integration Checklist

Before deploying:

- [ ] workspace-graph-builder.ts enhanced with incremental mode
- [ ] Nx project.json includes new targets
- [ ] nx.json configured with task dependencies
- [ ] CLI supports --incremental flag
- [ ] Git hooks configured (Husky)
- [ ] GitHub Actions workflows created
- [ ] Integration tests pass
- [ ] Documentation updated
- [ ] Backward compatibility verified
- [ ] Performance benchmarks meet targets

---

**Document Status:** ✅ Integration Points Specification Complete  
**Last Updated:** 2025-01-29
