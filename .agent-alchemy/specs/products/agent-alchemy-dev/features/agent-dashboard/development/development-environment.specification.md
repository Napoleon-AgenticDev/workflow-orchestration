---
meta:
  id: agent-dashboard-development-environment
  title: Development Environment - AI Agent Dashboard Development
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:agent-alchemy-dev
  tags: [agent-dashboard, development, angular, supabase, typescript]
  createdBy: Agent Alchemy Developer
  createdAt: '2026-03-13'
  reviewedAt: null
title: Development Environment - AI Agent Activity Dashboard
category: Products
feature: agent-dashboard
lastUpdated: '2026-03-13'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: development
applyTo: []
keywords: [agent, dashboard, angular, signals, supabase, primeng, environment, setup]
topics: []
useCases: []
references:
  - architecture/ui-components.specification.md
  - architecture/database-schema.specification.md
depends-on:
  - architecture/system-architecture.specification.md
specification: 3-development-environment
---

# Development Environment: AI Agent Activity Dashboard

## Overview

Everything needed to scaffold, configure, and run the `@buildmotion-ai/agent-dashboard` library in the existing Nx monorepo. No new tooling is introduced — the library follows the exact same patterns as `libs/agency/canvas-feature/`.

---

## Prerequisites

### Runtime Versions

| Tool | Required Version | Check Command |
|------|-----------------|---------------|
| Node.js | ≥ 20 LTS | `node --version` |
| Yarn | ≥ 1.22 (classic) | `yarn --version` |
| Nx CLI | 19.8.4 (workspace) | `npx nx --version` |
| Angular CLI | 18.2.x (devDep) | `npx ng version` |

> **Note**: Do **not** install a global `nx` or `ng` — use the workspace-local versions via `npx nx` or the `nx` script in `package.json`.

### Already-Installed Dependencies

The following are already present in the workspace `package.json` and **do not need to be installed**:

```json
{
  "@angular/core": "~18.2.0",
  "@angular/common": "~18.2.0",
  "@angular/compiler": "~18.2.0",
  "@angular/forms": "~18.2.0",
  "@supabase/supabase-js": "^2.52.0",
  "primeng": "18.0.2",
  "@primeng/themes": "18.0.2",
  "tailwindcss": "3.4.10",
  "typescript": "~5.5.2",
  "@nx/angular": "19.8.4",
  "jest": "^29.7.0",
  "jest-preset-angular": "^14.2.4"
}
```

---

## Step 1 — Scaffold the Library Directory

There is no Nx generator available for this pattern; create the directory tree manually:

```bash
# from workspace root
LIBROOT="libs/agency/agent-dashboard"

mkdir -p $LIBROOT/src/lib/tokens
mkdir -p $LIBROOT/src/lib/models
mkdir -p $LIBROOT/src/lib/services
mkdir -p $LIBROOT/src/lib/components/dashboard
mkdir -p $LIBROOT/src/lib/components/agent-grid
mkdir -p $LIBROOT/src/lib/components/agent-card
mkdir -p $LIBROOT/src/lib/components/activity-panel
mkdir -p $LIBROOT/src/lib/components/activity-feed
mkdir -p $LIBROOT/src/lib/components/activity-entry
mkdir -p $LIBROOT/src/lib/components/github-work-item
mkdir -p $LIBROOT/src/lib/components/filter-sidebar
mkdir -p $LIBROOT/src/lib/components/agent-status-badge
mkdir -p $LIBROOT/src/lib/components/empty-state

# create test-setup file
touch $LIBROOT/src/test-setup.ts
```

**`src/test-setup.ts` content** (identical to canvas-feature):

```typescript
import 'jest-preset-angular/setup-jest';
```

---

## Step 2 — Create `project.json`

Path: `libs/agency/agent-dashboard/project.json`

```json
{
  "name": "agency-agent-dashboard",
  "$schema": "../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/agency/agent-dashboard/src",
  "prefix": "lib",
  "projectType": "library",
  "tags": ["scope:agency", "type:feature"],
  "targets": {
    "build": {
      "executor": "@nx/angular:ng-packagr-lite",
      "outputs": ["{workspaceRoot}/dist/{projectRoot}"],
      "options": {
        "project": "libs/agency/agent-dashboard/ng-package.json"
      },
      "configurations": {
        "production": {
          "tsConfig": "libs/agency/agent-dashboard/tsconfig.lib.prod.json"
        },
        "development": {
          "tsConfig": "libs/agency/agent-dashboard/tsconfig.lib.json"
        }
      },
      "defaultConfiguration": "production"
    },
    "test": {
      "executor": "@nx/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
      "options": {
        "jestConfig": "libs/agency/agent-dashboard/jest.config.ts"
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint"
    }
  }
}
```

---

## Step 3 — Create TypeScript Config Files

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "es2022",
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "files": [],
  "include": [],
  "references": [
    { "path": "./tsconfig.lib.json" },
    { "path": "./tsconfig.spec.json" }
  ],
  "extends": "../../../tsconfig.base.json",
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}
```

### `tsconfig.lib.json`

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../../dist/out-tsc",
    "declaration": true,
    "declarationMap": true,
    "inlineSources": true,
    "types": []
  },
  "exclude": ["src/test-setup.ts", "**/*.spec.ts", "**/*.test.ts"],
  "include": ["**/*.ts"]
}
```

### `tsconfig.lib.prod.json`

```json
{
  "extends": "./tsconfig.lib.json",
  "compilerOptions": {
    "declarationMap": false
  },
  "angularCompilerOptions": {
    "compilationMode": "partial"
  }
}
```

### `tsconfig.spec.json`

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../../dist/out-tsc",
    "module": "commonjs",
    "types": ["jest", "node"]
  },
  "files": ["src/test-setup.ts"],
  "include": ["**/*.spec.ts", "**/*.test.ts", "**/*.d.ts"]
}
```

---

## Step 4 — Create `ng-package.json`

```json
{
  "$schema": "../../../node_modules/ng-packagr/ng-package.schema.json",
  "dest": "../../../dist/libs/agency/agent-dashboard",
  "lib": {
    "entryFile": "src/index.ts"
  }
}
```

---

## Step 5 — Create `jest.config.ts`

```typescript
export default {
  displayName: 'agency-agent-dashboard',
  preset: '../../../jest.preset.js',
  setupFilesAfterFramework: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../../coverage/libs/agency/agent-dashboard',
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
};
```

---

## Step 6 — Create `eslint.config.js`

```javascript
const { FlatCompat } = require('@eslint/eslintrc');
const baseConfig = require('../../../eslint.config.js');

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {},
  },
  {
    files: ['**/*.html'],
    rules: {},
  },
];
```

---

## Step 7 — Create `package.json`

```json
{
  "name": "@buildmotion-ai/agent-dashboard",
  "version": "0.1.0",
  "peerDependencies": {
    "@angular/common": "~18.2.0",
    "@angular/core": "~18.2.0",
    "@supabase/supabase-js": "^2.52.0",
    "primeng": "18.0.2"
  },
  "dependencies": {},
  "sideEffects": false
}
```

---

## Step 8 — Add tsconfig Path Mapping

Edit `tsconfig.base.json` in the workspace root. Add one entry to `compilerOptions.paths`:

```json
{
  "compilerOptions": {
    "paths": {
      "@buildmotion-ai/agent-dashboard": [
        "libs/agency/agent-dashboard/src/index.ts"
      ]
    }
  }
}
```

> **Tip**: Find the existing `"@buildmotion-ai/canvas-feature"` entry and add the new entry directly below it for easy diff review.

---

## Step 9 — Add the `/dashboard` Route

Edit `apps/agent-alchemy-dev/src/app/app.routes.ts`:

```typescript
import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('@buildmotion-ai/agency-layouts').then(
        (m) => m.LandingPageComponent
      ),
  },
  {
    path: 'canvas',
    loadComponent: () =>
      import('@buildmotion-ai/canvas-feature').then(
        (m) => m.CanvasEditorComponent
      ),
  },
  {
    path: 'world-viewport',
    loadComponent: () =>
      import('@buildmotion-ai/canvas-feature').then(
        (m) => m.WorldViewportComponent
      ),
  },
  // ── NEW: Agent Activity Dashboard ──────────────────────────────────────────
  {
    path: 'dashboard',
    loadComponent: () =>
      import('@buildmotion-ai/agent-dashboard').then(
        (m) => m.DashboardComponent
      ),
  },
];
```

---

## Step 10 — Provide `SUPABASE_CLIENT` Token

The library services inject a `SupabaseClient` via the `SUPABASE_CLIENT` token. The app already provides `SUPABASE_CONFIG` and has `@buildmotion-ai/agency-supabase` registered. Add a provider to `apps/agent-alchemy-dev/src/app/app.config.ts` that creates and provides a `SupabaseClient`:

```typescript
// In app.config.ts providers array — add after the existing 'SUPABASE_CONFIG' provider:
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '@buildmotion-ai/agent-dashboard';

// Inside the providers array:
{
  provide: SUPABASE_CLIENT,
  useFactory: () =>
    createClient(
      APP_CONFIG.supabase.supabaseUrl,
      APP_CONFIG.supabase.supabaseAnonKey
    ),
},
```

---

## Step 11 — Environment Variables

The following values must be present in the Supabase project before running locally. They are **not** checked into source control.

### Angular App (`apps/agent-alchemy-dev/src/config/app-config.ts`)

The existing `APP_CONFIG.supabase` object must contain:

| Property | Description | Example |
|----------|-------------|---------|
| `supabaseUrl` | Supabase project API URL | `https://xxxx.supabase.co` |
| `supabaseAnonKey` | Public anon key (safe to commit) | `eyJhbGci...` |

### Supabase Edge Functions Secrets

Set via `supabase secrets set` (never stored in code):

| Secret Name | Description |
|-------------|-------------|
| `GITHUB_TOKEN` | GitHub PAT with `read:org`, `repo` scopes for `github-proxy` |
| `AGENT_JWT_SECRET` | HS256 signing key for `agent-auth` Edge Function |
| `WEBHOOK_SECRET` | GitHub webhook HMAC secret for `webhook-handler` |

---

## Step 12 — Verify Setup

```bash
# From workspace root

# 1. Verify Nx recognises the new project
npx nx show project agency-agent-dashboard

# 2. Lint
npx nx lint agency-agent-dashboard

# 3. Test
npx nx test agency-agent-dashboard

# 4. Build
npx nx build agency-agent-dashboard

# 5. Serve the app with the new /dashboard route
npx nx serve agent-alchemy-dev
# Navigate to http://localhost:4200/dashboard
```

---

## PrimeNG Modules Already Available

`providePrimeNG()` is already called in `app.config.ts`. The following PrimeNG standalone component modules are used by the dashboard and need **only to be imported in each standalone component** — no additional `NgModule` registration required:

| Module | Import from | Used in |
|--------|------------|---------|
| `TagModule` | `primeng/tag` | `AgentStatusBadgeComponent`, `AgentCardComponent`, `ActivityEntryComponent` |
| `BadgeModule` | `primeng/badge` | `AgentCardComponent` |
| `ButtonModule` | `primeng/button` | `ActivityEntryComponent`, `GitHubWorkItemComponent`, `FilterSidebarComponent` |
| `CardModule` | `primeng/card` | `GitHubWorkItemComponent` |
| `CheckboxModule` | `primeng/checkbox` | `FilterSidebarComponent` |
| `DropdownModule` | `primeng/dropdown` | `FilterSidebarComponent` |
| `InputTextModule` | `primeng/inputtext` | `FilterSidebarComponent` |
| `SkeletonModule` | `primeng/skeleton` | `DashboardComponent`, `ActivityFeedComponent`, `GitHubWorkItemComponent` |
| `TimelineModule` | `primeng/timeline` | `ActivityFeedComponent` |
| `TooltipModule` | `primeng/tooltip` | `AgentCardComponent` |

---

## Troubleshooting

### `Cannot find module '@buildmotion-ai/agent-dashboard'`

1. Verify `tsconfig.base.json` has the path mapping (Step 8).
2. Run `npx nx reset` to clear Nx cache.
3. Restart the TypeScript language server in VS Code: `Cmd+Shift+P → TypeScript: Restart TS Server`.

### `SupabaseClient not provided`

Ensure `SUPABASE_CLIENT` is provided in `app.config.ts` (Step 10). All three dashboard services inject this token.

### Realtime WebSocket 401 Unauthorized

The Supabase JWT must include the user's `org_id` in `app_metadata`. Ensure the user was created via the correct Supabase Auth flow and `org_id` is set in `app_metadata`.

### `p-timeline` not rendering

Confirm `TimelineModule` is imported in `ActivityFeedComponent`'s `imports` array.
