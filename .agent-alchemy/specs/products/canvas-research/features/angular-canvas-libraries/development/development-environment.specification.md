---
meta:
  id: canvas-research-angular-canvas-libraries-development-environment-specification
  title: Development Environment - Canvas Libraries for Angular
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:canvas-research
  tags: []
  createdBy: Agent Alchemy Developer v2.0.0
  createdAt: 2026-02-25T00:00:00.000Z
  reviewedAt: null
title: Development Environment - Canvas Libraries for Angular
category: Products
feature: angular-canvas-libraries
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: canvas-research
phase: development
applyTo: []
keywords: []
topics: []
useCases: []
references:
  - .agent-alchemy/specs/stack/stack.json
  - .agent-alchemy/specs/standards/
depends-on:
  - plan/constraints-dependencies.specification.md
  - architecture/devops-deployment.specification.md
specification: 03-development-environment
---

# Development Environment: Canvas Libraries for Angular

## Overview

**Purpose**: Define complete development environment setup, dependencies, tooling, and configuration for canvas library development.

**Stack**: Angular 18.2+, TypeScript 5.5.2, Nx 20+, ng2-konva, Jest, Playwright  
**OS Support**: macOS, Linux, Windows (with WSL2 recommended)  
**Node**: v20.18.0 or v22.11.0  
**Package Manager**: Yarn 1.22.22

---

## Prerequisites

### Required Software

#### Node.js & Package Manager

```bash
# Check Node version (must be v20.18.0 or v22.11.0)
node --version

# Check Yarn version (must be 1.22.22)
yarn --version

# If not installed, install Node via nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20.18.0
nvm use 20.18.0

# Install Yarn globally
npm install -g yarn@1.22.22
```

#### Git

```bash
# Check Git version (2.40+ recommended)
git --version

# Configure Git (if not already configured)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

#### IDE Setup

**Recommended**: Visual Studio Code 1.85+

**Required VS Code Extensions**:
```bash
# Install via command palette or CLI
code --install-extension angular.ng-template
code --install-extension nrwl.angular-console
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension firsttris.vscode-jest-runner
code --install-extension orta.vscode-jest
code --install-extension ms-playwright.playwright
```

**Recommended VS Code Extensions**:
```bash
code --install-extension eamodio.gitlens
code --install-extension usernamehw.errorlens
code --install-extension streetsidesoftware.code-spell-checker
code --install-extension wayou.vscode-todo-highlight
code --install-extension ms-vscode.vscode-typescript-next
```

---

## Initial Setup

### Clone Repository

```bash
# Clone repository
git clone https://github.com/buildmotion-ai/buildmotion-ai-agency.git

# Navigate to project
cd buildmotion-ai-agency

# Checkout development branch (or create feature branch)
git checkout -b feature/canvas-libraries
```

### Install Dependencies

```bash
# Install all workspace dependencies
yarn install

# Verify installation
yarn nx --version

# Should output: Nx 20.x.x
```

**Expected Time**: 2-5 minutes depending on network speed

---

## Environment Configuration

### TypeScript Configuration

**Root**: `tsconfig.base.json` (already configured)

**Verify Path Mappings**:
```json
{
  "compilerOptions": {
    "paths": {
      "@buildmotion-ai/canvas-feature": [
        "libs/canvas-feature/src/index.ts"
      ]
    }
  }
}
```

### Nx Configuration

**File**: `nx.json` (already configured)

**Verify Task Targets**:
```json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "cache": true
    },
    "test": {
      "cache": true
    },
    "lint": {
      "cache": true
    }
  }
}
```

### VS Code Workspace Settings

**File**: `.vscode/settings.json`

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "html"
  ],
  "jest.autoRun": "off",
  "jest.rootPath": ".",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[html]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[scss]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

**File**: `.vscode/extensions.json`

```json
{
  "recommendations": [
    "angular.ng-template",
    "nrwl.angular-console",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "firsttris.vscode-jest-runner",
    "orta.vscode-jest",
    "ms-playwright.playwright",
    "eamodio.gitlens"
  ]
}
```

---

## Canvas Feature Library Setup

### Generate Library

```bash
# Generate canvas feature library
npx nx g @nx/angular:library canvas-feature \
  --directory=libs/canvas-feature \
  --standalone \
  --buildable \
  --publishable \
  --importPath=@buildmotion-ai/canvas-feature \
  --strict \
  --style=scss \
  --changeDetection=OnPush
```

### Install Canvas Dependencies

```bash
# Navigate to library (optional, can run from root)
cd libs/canvas-feature

# Install ng2-konva and Konva.js
yarn add ng2-konva konva

# Install TypeScript types
yarn add -D @types/konva

# Verify installation
yarn why ng2-konva
yarn why konva
```

**Expected Package Versions** (from stack.json):
- `ng2-konva`: ^8.0.0
- `konva`: ^9.3.15
- `@types/konva`: ^2.7.5

### Verify Library Build

```bash
# Build library
nx build canvas-feature

# Expected output:
# ✔ Building canvas-feature (ESM)
# ✔ Built canvas-feature successfully

# Verify dist output
ls -la dist/libs/canvas-feature/
```

---

## Development Tools

### Nx Commands

**Most Used Commands**:

```bash
# Serve application with canvas feature
nx serve agency

# Build canvas feature library
nx build canvas-feature

# Run unit tests
nx test canvas-feature

# Run tests in watch mode
nx test canvas-feature --watch

# Run tests with coverage
nx test canvas-feature --code-coverage

# Lint canvas feature
nx lint canvas-feature

# Format files
nx format:write

# Run affected tests only
nx affected:test

# Run affected lint only
nx affected:lint

# Dependency graph
nx graph

# Clear cache
nx reset
```

### npm Scripts

**File**: `package.json` (useful shortcuts)

```json
{
  "scripts": {
    "canvas:serve": "nx serve agency",
    "canvas:build": "nx build canvas-feature",
    "canvas:test": "nx test canvas-feature --watch",
    "canvas:test:coverage": "nx test canvas-feature --code-coverage",
    "canvas:lint": "nx lint canvas-feature",
    "canvas:e2e": "nx e2e canvas-feature-e2e"
  }
}
```

**Usage**:
```bash
yarn canvas:serve
yarn canvas:test
yarn canvas:build
```

---

## Testing Setup

### Jest Configuration

**File**: `libs/canvas-feature/jest.config.ts`

```typescript
export default {
  displayName: 'canvas-feature',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/libs/canvas-feature',
  coverageReporters: ['html', 'lcov', 'text-summary'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.stories.ts',
    '!src/**/index.ts',
    '!src/test-setup.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
  testMatch: [
    '<rootDir>/**/__tests__/**/*.[jt]s?(x)',
    '<rootDir>/**/*(*.)@(spec|test).[jt]s?(x)',
  ],
};
```

**File**: `libs/canvas-feature/src/test-setup.ts`

```typescript
import 'jest-preset-angular/setup-jest';

// Mock window.matchMedia (used by PrimeNG)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock HTMLCanvasElement methods (used by Konva)
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(),
  putImageData: jest.fn(),
  createImageData: jest.fn(),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
})) as any;

// Mock ResizeObserver (used by some components)
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
```

### Running Tests

```bash
# Run all tests
nx test canvas-feature

# Watch mode (auto-rerun on file changes)
nx test canvas-feature --watch

# Run specific test file
nx test canvas-feature --test-file=canvas-state.service.spec.ts

# Coverage report
nx test canvas-feature --code-coverage

# View coverage report
open coverage/libs/canvas-feature/index.html
```

### Playwright E2E Setup

**Generate E2E Project**:

```bash
# Generate Playwright E2E project
npx nx g @nx/playwright:configuration \
  --project=canvas-feature-e2e \
  --webServerCommand="nx serve agency" \
  --webServerAddress="http://localhost:4200"
```

**File**: `apps/canvas-feature-e2e/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'nx serve agency',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Running E2E Tests**:

```bash
# Run all E2E tests
nx e2e canvas-feature-e2e

# Run in headed mode (see browser)
nx e2e canvas-feature-e2e --headed

# Run in debug mode
nx e2e canvas-feature-e2e --debug

# Run specific test
nx e2e canvas-feature-e2e --grep "should create rectangle"

# Generate code (Playwright codegen)
npx playwright codegen http://localhost:4200
```

---

## Linting & Formatting

### ESLint Setup

**File**: `libs/canvas-feature/.eslintrc.json`

```json
{
  "extends": ["../../.eslintrc.json"],
  "ignorePatterns": ["!**/*"],
  "overrides": [
    {
      "files": ["*.ts"],
      "rules": {
        "@angular-eslint/directive-selector": [
          "error",
          {
            "type": "attribute",
            "prefix": "canvas",
            "style": "camelCase"
          }
        ],
        "@angular-eslint/component-selector": [
          "error",
          {
            "type": "element",
            "prefix": "canvas",
            "style": "kebab-case"
          }
        ],
        "@typescript-eslint/explicit-function-return-type": "error",
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-unused-vars": [
          "error",
          { "argsIgnorePattern": "^_" }
        ]
      }
    },
    {
      "files": ["*.html"],
      "rules": {
        "@angular-eslint/template/no-call-expression": "warn"
      }
    }
  ]
}
```

### Prettier Configuration

**File**: `.prettierrc` (root level)

```json
{
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**File**: `.prettierignore`

```
dist
coverage
node_modules
.nx
.angular
```

### Running Linting

```bash
# Lint canvas feature
nx lint canvas-feature

# Lint and auto-fix
nx lint canvas-feature --fix

# Format all files
nx format:write

# Check formatting (CI)
nx format:check

# Lint affected projects only
nx affected:lint
```

---

## Build Configuration

### Production Build

**File**: `libs/canvas-feature/project.json`

```json
{
  "name": "canvas-feature",
  "targets": {
    "build": {
      "executor": "@nx/angular:package",
      "outputs": ["{workspaceRoot}/dist/libs/canvas-feature"],
      "options": {
        "project": "libs/canvas-feature/ng-package.json"
      },
      "configurations": {
        "production": {
          "tsConfig": "libs/canvas-feature/tsconfig.lib.prod.json"
        },
        "development": {
          "tsConfig": "libs/canvas-feature/tsconfig.lib.json"
        }
      },
      "defaultConfiguration": "production"
    }
  }
}
```

**Build Commands**:

```bash
# Development build
nx build canvas-feature --configuration=development

# Production build
nx build canvas-feature --configuration=production

# Build with stats (bundle analysis)
nx build canvas-feature --stats-json

# Analyze bundle size
npx webpack-bundle-analyzer dist/libs/canvas-feature/stats.json
```

### Bundle Size Monitoring

**File**: `libs/canvas-feature/.bundlewatch.config.json`

```json
{
  "files": [
    {
      "path": "dist/libs/canvas-feature/**/*.js",
      "maxSize": "200kb",
      "compression": "gzip"
    }
  ],
  "ci": {
    "trackBranches": ["main", "develop"]
  }
}
```

**Add to package.json**:

```json
{
  "scripts": {
    "bundlewatch": "bundlewatch --config libs/canvas-feature/.bundlewatch.config.json"
  }
}
```

---

## Performance Monitoring

### Lighthouse CI Setup

**File**: `.lighthouserc.json`

```json
{
  "ci": {
    "collect": {
      "startServerCommand": "nx serve agency",
      "url": ["http://localhost:4200/canvas/editor"],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:seo": ["warn", { "minScore": 0.8 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

**Run Lighthouse**:

```bash
# Install Lighthouse CI
yarn add -D @lhci/cli

# Run Lighthouse audit
npx lhci autorun
```

### Performance Budgets

**File**: `angular.json` (or app config)

```json
{
  "configurations": {
    "production": {
      "budgets": [
        {
          "type": "initial",
          "maximumWarning": "500kb",
          "maximumError": "1mb"
        },
        {
          "type": "anyComponentStyle",
          "maximumWarning": "10kb",
          "maximumError": "20kb"
        }
      ]
    }
  }
}
```

---

## Debugging Setup

### VS Code Launch Configuration

**File**: `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Angular: Serve & Debug",
      "type": "chrome",
      "request": "launch",
      "preLaunchTask": "npm: start",
      "url": "http://localhost:4200",
      "webRoot": "${workspaceFolder}",
      "sourceMapPathOverrides": {
        "webpack:/*": "${workspaceFolder}/*"
      }
    },
    {
      "name": "Jest: Debug Current File",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "${fileBasename}",
        "--runInBand",
        "--no-cache",
        "--watchAll=false"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "windows": {
        "program": "${workspaceFolder}/node_modules/jest/bin/jest"
      }
    },
    {
      "name": "Playwright: Debug Current Test",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/playwright",
      "args": ["test", "${file}", "--debug"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Chrome DevTools

**Enable Source Maps**:

1. Open Chrome DevTools (F12)
2. Sources tab → Enable "Enable JavaScript source maps"
3. Sources tab → Enable "Enable CSS source maps"

**Performance Profiling**:

1. Open Performance tab in DevTools
2. Click Record
3. Interact with canvas (draw shapes, drag objects)
4. Stop recording
5. Analyze frame rates, scripting time, rendering time

**Memory Profiling**:

1. Open Memory tab in DevTools
2. Take Heap Snapshot
3. Interact with canvas (create 1000+ objects)
4. Take another snapshot
5. Compare snapshots to find memory leaks

---

## Common Issues & Solutions

### Issue: Konva Types Not Found

**Error**:
```
Cannot find module 'konva' or its corresponding type declarations.
```

**Solution**:
```bash
yarn add -D @types/konva

# Add to tsconfig.lib.json
{
  "compilerOptions": {
    "types": ["konva"]
  }
}
```

### Issue: Jest Canvas Mock Error

**Error**:
```
HTMLCanvasElement.prototype.getContext is not a function
```

**Solution**:
Add canvas mocks to `test-setup.ts` (see Testing Setup section above)

### Issue: Angular Standalone Component Import Error

**Error**:
```
Component 'CanvasEditorComponent' must be imported before it is referenced
```

**Solution**:
```typescript
// Ensure component is imported in the using component/module
import { CanvasEditorComponent } from '@buildmotion-ai/canvas-feature';

@Component({
  standalone: true,
  imports: [CanvasEditorComponent], // Add here
  template: '<canvas-editor></canvas-editor>'
})
```

### Issue: Nx Cache Issues

**Error**:
Stale build outputs or test failures after code changes

**Solution**:
```bash
# Clear Nx cache
nx reset

# Rebuild
nx build canvas-feature
```

### Issue: Node Version Mismatch

**Error**:
```
The engine "node" is incompatible with this module
```

**Solution**:
```bash
# Check required version in package.json
cat package.json | grep "node"

# Switch Node version
nvm use 20.18.0

# Reinstall dependencies
rm -rf node_modules
yarn install
```

---

## CI/CD Integration

### GitHub Actions Workflow

**File**: `.github/workflows/canvas-feature-ci.yml`

```yaml
name: Canvas Feature CI

on:
  push:
    branches: [main, develop]
    paths:
      - 'libs/canvas-feature/**'
      - 'apps/agency/src/app/canvas/**'
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20.18.0'
          cache: 'yarn'
      
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      
      - name: Lint canvas feature
        run: nx lint canvas-feature
      
      - name: Test canvas feature
        run: nx test canvas-feature --code-coverage
      
      - name: Build canvas feature
        run: nx build canvas-feature --configuration=production
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/libs/canvas-feature/lcov.info
          flags: canvas-feature

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20.18.0'
          cache: 'yarn'
      
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: nx e2e canvas-feature-e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: apps/canvas-feature-e2e/playwright-report/
```

---

## Environment Variables

**File**: `.env` (local development)

```bash
# Not used for client-side canvas feature (no backend required)
# Future use when adding cloud sync features

# Example for future use:
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your-anon-key
```

**File**: `.env.example` (template for team)

```bash
# Canvas Feature Environment Variables
# Copy this file to .env and fill in your values

# Future: Supabase configuration
# SUPABASE_URL=
# SUPABASE_ANON_KEY=

# Future: Analytics
# ANALYTICS_KEY=
```

---

## Quick Start Commands

### New Developer Onboarding

```bash
# 1. Clone repository
git clone https://github.com/buildmotion-ai/buildmotion-ai-agency.git
cd buildmotion-ai-agency

# 2. Install dependencies
yarn install

# 3. Run tests to verify setup
yarn canvas:test

# 4. Build library
yarn canvas:build

# 5. Start dev server
yarn canvas:serve

# Navigate to http://localhost:4200/canvas/editor
```

### Daily Development

```bash
# Start development server (with watch mode)
yarn canvas:serve

# Run tests in watch mode (in separate terminal)
yarn canvas:test

# Lint code
yarn canvas:lint

# Before committing
nx affected:test
nx affected:lint
nx format:write
```

---

## Validation Checklist

**Development Environment Setup**:

- [ ] Node.js v20.18.0 or v22.11.0 installed
- [ ] Yarn 1.22.22 installed
- [ ] VS Code with recommended extensions installed
- [ ] Repository cloned and dependencies installed
- [ ] `nx --version` shows Nx 20+
- [ ] `yarn canvas:build` succeeds
- [ ] `yarn canvas:test` passes all tests
- [ ] `yarn canvas:lint` passes without errors
- [ ] VS Code TypeScript IntelliSense working
- [ ] Debugging configuration working
- [ ] Playwright installed and E2E tests run
- [ ] Git hooks (husky) functional
- [ ] Bundle size monitoring configured
- [ ] Performance budgets configured

**Verify Installation**:

```bash
# All commands should succeed
node --version        # v20.18.0 or v22.11.0
yarn --version        # 1.22.22
nx --version          # 20.x.x
git --version         # 2.40+
npx playwright --version  # 1.40+

# Build and test
yarn canvas:build     # Should succeed
yarn canvas:test      # All tests pass
yarn canvas:lint      # No errors
```

---

**Specification Complete**: 03-development-environment ✅  
**Next**: integration-points.specification.md
