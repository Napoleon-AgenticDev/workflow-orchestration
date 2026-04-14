---
meta:
  id: spec-alchemy-workspace-graph-development-environment-specification
  title: Development Environment Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: product:spec-alchemy
  tags: []
  createdBy: unknown
  createdAt: '2026-03-12'
  reviewedAt: null
title: Development Environment Specification
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

# Workspace Graph: Development Environment Specification

---
version: 1.0.0
date: 2025-01-29
status: Development
category: Development Setup
complexity: Low
phase: Development
owner: Agent Alchemy Developer Team
related_specifications:
  - implementation-guide.specification.md
  - code-structure.specification.md
  - testing-strategy.specification.md
priority: Critical
setup_time: 30 minutes
---

## Executive Summary

Complete development environment setup for workspace graph incremental update feature, including dependencies, tools, and configuration.

### Quick Start

```bash
# Install dependencies
npm install

# Install new runtime dependencies
npm install simple-git@^3.20.0 better-sqlite3@^9.2.0

# Install new dev dependencies
npm install --save-dev @types/better-sqlite3@^9.0.0

# Run tests
npm test

# Build library
nx build workspace-graph
```

---

## 1. Runtime Dependencies

### 1.1 New Dependencies to Install

| Package | Version | Purpose | Size |
|---------|---------|---------|------|
| `simple-git` | ^3.20.0 | Git operations wrapper | ~100KB |
| `better-sqlite3` | ^9.2.0 | Native SQLite bindings | ~2MB |

**Installation:**

```bash
cd libs/shared/workspace-graph/workspace-graph
npm install simple-git@^3.20.0 better-sqlite3@^9.2.0
```

**package.json update:**

```json
{
  "name": "@buildmotion-ai/workspace-graph",
  "version": "2.0.0",
  "dependencies": {
    "simple-git": "^3.20.0",
    "better-sqlite3": "^9.2.0",
    "@buildmotion-ai/logging": "workspace:*",
    "@buildmotion-ai/foundation": "workspace:*"
  }
}
```

### 1.2 Existing Dependencies (Already Available)

```json
{
  "dependencies": {
    "@buildmotion-ai/logging": "workspace:*",
    "@buildmotion-ai/foundation": "workspace:*",
    "typescript": "~5.3.0"
  }
}
```

---

## 2. Development Dependencies

### 2.1 New Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@types/better-sqlite3` | ^9.0.0 | TypeScript definitions for better-sqlite3 |

**Installation:**

```bash
npm install --save-dev @types/better-sqlite3@^9.0.0
```

### 2.2 Existing Dev Dependencies

```json
{
  "devDependencies": {
    "@nx/jest": "^18.0.0",
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0"
  }
}
```

---

## 3. TypeScript Configuration

### 3.1 tsconfig.json (Library Config)

**File:** `libs/shared/workspace-graph/workspace-graph/tsconfig.json`

```json
{
  "extends": "../../../../tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "types": ["node", "jest"]
  },
  "files": [],
  "include": [],
  "references": [
    {
      "path": "./tsconfig.lib.json"
    },
    {
      "path": "./tsconfig.spec.json"
    }
  ]
}
```

### 3.2 tsconfig.lib.json (Build Config)

**File:** `libs/shared/workspace-graph/workspace-graph/tsconfig.lib.json`

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../../../dist/out-tsc",
    "declaration": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"],
  "exclude": [
    "jest.config.ts",
    "src/**/*.spec.ts",
    "src/**/*.test.ts",
    "src/**/*.bench.ts"
  ]
}
```

### 3.3 tsconfig.spec.json (Test Config)

**File:** `libs/shared/workspace-graph/workspace-graph/tsconfig.spec.json`

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../../../dist/out-tsc",
    "module": "commonjs",
    "types": ["jest", "node"]
  },
  "include": [
    "jest.config.ts",
    "src/**/*.test.ts",
    "src/**/*.spec.ts",
    "src/**/*.d.ts"
  ]
}
```

---

## 4. Jest Configuration

### 4.1 jest.config.ts

**File:** `libs/shared/workspace-graph/workspace-graph/jest.config.ts`

```typescript
/* eslint-disable */
export default {
  displayName: 'workspace-graph',
  preset: '../../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }]
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../../coverage/libs/shared/workspace-graph/workspace-graph',
  coverageReporters: ['html', 'lcov', 'text', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/**/*.bench.ts',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.[jt]s?(x)',
    '<rootDir>/src/**/*(*.)@(spec|test).[jt]s?(x)'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json'
    }
  }
};
```

### 4.2 Test Setup File

**File:** `libs/shared/workspace-graph/workspace-graph/src/test-setup.ts`

```typescript
/**
 * Global test setup
 * Runs before all test files
 */

// Increase Jest timeout for integration tests
jest.setTimeout(10000);

// Mock console methods to reduce noise
global.console = {
  ...console,
  debug: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
  // Keep error and warn for debugging
  error: console.error,
  warn: console.warn
};

// Global test utilities
global.beforeEach(() => {
  jest.clearAllMocks();
});
```

---

## 5. ESLint Configuration

### 5.1 .eslintrc.json

**File:** `libs/shared/workspace-graph/workspace-graph/.eslintrc.json`

```json
{
  "extends": ["../../../../.eslintrc.json"],
  "ignorePatterns": ["!**/*"],
  "overrides": [
    {
      "files": ["*.ts", "*.tsx", "*.js", "*.jsx"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/explicit-function-return-type": "error",
        "@typescript-eslint/explicit-module-boundary-types": "error",
        "@typescript-eslint/no-unused-vars": [
          "error",
          { "argsIgnorePattern": "^_" }
        ],
        "no-console": ["error", { "allow": ["warn", "error"] }],
        "prefer-const": "error",
        "no-var": "error"
      }
    },
    {
      "files": ["*.ts", "*.tsx"],
      "rules": {}
    },
    {
      "files": ["*.js", "*.jsx"],
      "rules": {}
    },
    {
      "files": ["*.spec.ts", "*.test.ts"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "off",
        "no-console": "off"
      }
    }
  ]
}
```

---

## 6. Development Tools

### 6.1 Recommended VS Code Extensions

Create `.vscode/extensions.json` (if not exists):

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "firsttris.vscode-jest-runner",
    "orta.vscode-jest",
    "ms-vscode.vscode-typescript-next",
    "nrwl.angular-console"
  ]
}
```

### 6.2 VS Code Settings

Create `.vscode/settings.json` (workspace-specific):

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "jest.autoRun": "off",
  "jest.runMode": "on-demand",
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.nx": true
  }
}
```

### 6.3 Launch Configuration (Debugging)

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest Current File",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "${fileBasenameNoExtension}",
        "--config",
        "${workspaceFolder}/libs/shared/workspace-graph/workspace-graph/jest.config.ts"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "windows": {
        "program": "${workspaceFolder}/node_modules/jest/bin/jest"
      }
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Workspace Graph CLI",
      "program": "${workspaceFolder}/libs/shared/workspace-graph/workspace-graph/src/lib/cli/cli.ts",
      "args": ["build", "--incremental"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal"
    }
  ]
}
```

---

## 7. Build Scripts

### 7.1 package.json Scripts (Library Level)

Add to `libs/shared/workspace-graph/workspace-graph/package.json`:

```json
{
  "scripts": {
    "build": "nx build workspace-graph",
    "test": "nx test workspace-graph",
    "test:watch": "nx test workspace-graph --watch",
    "test:coverage": "nx test workspace-graph --coverage",
    "lint": "nx lint workspace-graph",
    "lint:fix": "nx lint workspace-graph --fix",
    "benchmark": "node --loader ts-node/esm src/__benchmarks__/run-benchmarks.ts"
  }
}
```

### 7.2 Root-Level Scripts (Workspace)

Add to root `package.json`:

```json
{
  "scripts": {
    "workspace-graph:build": "nx build workspace-graph",
    "workspace-graph:test": "nx test workspace-graph",
    "workspace-graph:lint": "nx lint workspace-graph",
    "workspace-graph:benchmark": "nx run workspace-graph:benchmark"
  }
}
```

---

## 8. Git Configuration

### 8.1 .gitignore Updates

Ensure the following are ignored:

```gitignore
# Build outputs
dist/
*.tsbuildinfo

# Test coverage
coverage/

# SQLite databases (local development)
.workspace-graph/graph.db
.workspace-graph/graph.db-shm
.workspace-graph/graph.db-wal

# Logs
*.log
npm-debug.log*

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

### 8.2 .gitattributes (Optional)

```gitattributes
# Ensure consistent line endings
* text=auto eol=lf

# Binary files
*.db binary
*.sqlite binary
*.sqlite3 binary
```

---

## 9. Pre-commit Hooks (Optional)

### 9.1 Husky Setup

If using Husky for Git hooks:

```bash
npx husky install
npx husky add .husky/pre-commit "npm run workspace-graph:lint && npm run workspace-graph:test"
```

**File:** `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run workspace graph checks
npm run workspace-graph:lint
npm run workspace-graph:test
```

---

## 10. Docker Development Environment (Optional)

### 10.1 Dockerfile for Development

**File:** `.devcontainer/Dockerfile`

```dockerfile
FROM node:20-alpine

# Install Git and SQLite tools
RUN apk add --no-cache git sqlite

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /workspace

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy workspace
COPY . .

# Expose ports (if needed)
EXPOSE 3000

CMD ["npm", "test"]
```

### 10.2 devcontainer.json

**File:** `.devcontainer/devcontainer.json`

```json
{
  "name": "Workspace Graph Development",
  "build": {
    "dockerfile": "Dockerfile"
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "firsttris.vscode-jest-runner",
        "nrwl.angular-console"
      ]
    }
  },
  "forwardPorts": [3000],
  "postCreateCommand": "npm install",
  "remoteUser": "node"
}
```

---

## 11. Performance Benchmarking Setup

### 11.1 Benchmark Runner

**File:** `libs/shared/workspace-graph/workspace-graph/src/__benchmarks__/run-benchmarks.ts`

```typescript
import { performance } from 'perf_hooks';

/**
 * Benchmark runner utility
 */
export async function runBenchmark(
  name: string,
  fn: () => Promise<void>,
  iterations: number = 100
): Promise<void> {
  const times: number[] = [];

  // Warm-up
  for (let i = 0; i < 10; i++) {
    await fn();
  }

  // Measure
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }

  // Calculate statistics
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];

  console.log(`\n📊 Benchmark: ${name}`);
  console.log(`   Average: ${avg.toFixed(2)}ms`);
  console.log(`   Min: ${min.toFixed(2)}ms`);
  console.log(`   Max: ${max.toFixed(2)}ms`);
  console.log(`   P95: ${p95.toFixed(2)}ms`);
}
```

---

## 12. Environment Variables

### 12.1 .env.example

**File:** `.env.example`

```bash
# Workspace Graph Configuration
WORKSPACE_ROOT=/path/to/workspace
WORKSPACE_GRAPH_STORAGE_DIR=.workspace-graph

# Git Configuration
GIT_BASE_COMMIT=HEAD~1
GIT_TARGET_COMMIT=HEAD

# Performance Settings
MAX_PARALLEL_PROCESSING=4
ENABLE_VALIDATION=true

# Logging
LOG_LEVEL=info
```

### 12.2 Loading Environment Variables

```typescript
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
  workspaceRoot: process.env.WORKSPACE_ROOT ?? process.cwd(),
  storageDir: process.env.WORKSPACE_GRAPH_STORAGE_DIR ?? '.workspace-graph',
  maxParallel: parseInt(process.env.MAX_PARALLEL_PROCESSING ?? '4', 10)
};
```

---

## 13. Verification Checklist

After environment setup, verify:

```bash
# ✅ Dependencies installed
npm list simple-git better-sqlite3

# ✅ TypeScript compiles
nx build workspace-graph

# ✅ Tests pass
nx test workspace-graph

# ✅ Linting passes
nx lint workspace-graph

# ✅ Coverage meets threshold (80%)
nx test workspace-graph --coverage

# ✅ Git integration works
git --version

# ✅ SQLite available
sqlite3 --version
```

---

## 14. Troubleshooting

### 14.1 better-sqlite3 Installation Issues

**Error:** `node-gyp` build fails

**Solution:**

```bash
# Install build tools (macOS)
xcode-select --install

# Install build tools (Ubuntu/Debian)
sudo apt-get install build-essential python3

# Install build tools (Windows)
npm install --global windows-build-tools
```

**Error:** `Module did not self-register`

**Solution:**

```bash
# Rebuild native modules
npm rebuild better-sqlite3
```

### 14.2 simple-git Issues

**Error:** Git not found

**Solution:**

```bash
# Install Git (if missing)
# macOS
brew install git

# Ubuntu/Debian
sudo apt-get install git

# Verify installation
git --version
```

### 14.3 Jest Test Timeout

**Error:** Test timeout exceeded

**Solution:**

```typescript
// Increase timeout in test file
jest.setTimeout(30000); // 30 seconds

// Or per test
it('should complete long operation', async () => {
  // ...
}, 30000);
```

---

## 15. Quick Reference

### 15.1 Common Commands

```bash
# Build library
nx build workspace-graph

# Run all tests
nx test workspace-graph

# Run tests with coverage
nx test workspace-graph --coverage

# Run specific test file
nx test workspace-graph --testFile=git-change-detector.spec.ts

# Watch mode
nx test workspace-graph --watch

# Lint code
nx lint workspace-graph

# Fix linting issues
nx lint workspace-graph --fix

# Run benchmarks
npm run workspace-graph:benchmark
```

### 15.2 Dependency Management

```bash
# Add dependency
npm install <package> --workspace=@buildmotion-ai/workspace-graph

# Remove dependency
npm uninstall <package> --workspace=@buildmotion-ai/workspace-graph

# Update dependencies
npm update --workspace=@buildmotion-ai/workspace-graph

# Audit dependencies
npm audit --workspace=@buildmotion-ai/workspace-graph
```

---

## 16. Development Workflow

### 16.1 Typical Development Cycle

```bash
# 1. Create feature branch
git checkout -b feature/git-change-detector

# 2. Install dependencies (if needed)
npm install

# 3. Write code + tests
code libs/shared/workspace-graph/workspace-graph/src/lib/git/git-change-detector.ts
code libs/shared/workspace-graph/workspace-graph/src/lib/git/git-change-detector.spec.ts

# 4. Run tests in watch mode
nx test workspace-graph --watch

# 5. Check coverage
nx test workspace-graph --coverage

# 6. Lint code
nx lint workspace-graph --fix

# 7. Commit changes
git add .
git commit -m "feat: implement GitChangeDetector"

# 8. Push and create PR
git push origin feature/git-change-detector
```

---

**Document Status:** ✅ Development Environment Specification Complete  
**Last Updated:** 2025-01-29  
**Setup Verification:** Run all commands in section 13
