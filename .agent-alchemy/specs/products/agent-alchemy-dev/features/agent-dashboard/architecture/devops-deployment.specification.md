---
meta:
  id: agent-dashboard-devops-deployment
  title: DevOps and Deployment - AI Agent Activity Dashboard
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:agent-alchemy-dev
  tags: [agent-dashboard, architecture, devops, deployment, nx, ci-cd, supabase, monitoring]
  createdBy: Agent Alchemy Architecture
  createdAt: '2026-03-13'
  reviewedAt: null
title: DevOps and Deployment - AI Agent Activity Dashboard
category: Products
feature: agent-dashboard
lastUpdated: '2026-03-13'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: architecture
applyTo: []
keywords: [devops, deployment, nx, ci-cd, supabase, migrations, edge-functions, monitoring, datadog]
topics: []
useCases: []
references:
  - .agent-alchemy/specs/stack/stack.json
depends-on:
  - plan/constraints-dependencies.specification.md
  - plan/implementation-sequence.specification.md
  - architecture/system-architecture.specification.md
  - architecture/database-schema.specification.md
specification: 07-devops-deployment
---

# DevOps and Deployment: AI Agent Activity Dashboard

## Overview

**Purpose**: Define the Nx library structure, Supabase infrastructure setup, CI/CD pipelines, environment configuration, and monitoring strategy for the AI Agent Activity Dashboard.

**Monorepo**: Nx 19.8.4 with Yarn  
**Hosting**: Vercel (Angular SPA per existing stack)  
**Database/Realtime/Edge Functions**: Supabase  
**Error Tracking**: Datadog Browser RUM (already in stack)

---

## Nx Library Structure

### New Library: `libs/agency/agent-dashboard`

The dashboard feature is extracted into a dedicated Nx library following the existing `libs/agency/` pattern.

```
libs/agency/agent-dashboard/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.component.ts
│   │   │   │   ├── dashboard.component.html
│   │   │   │   └── dashboard.component.scss
│   │   │   ├── agent-grid/
│   │   │   ├── agent-card/
│   │   │   ├── activity-panel/
│   │   │   ├── activity-feed/
│   │   │   ├── activity-entry/
│   │   │   ├── github-work-item/
│   │   │   ├── filter-sidebar/
│   │   │   ├── agent-status-badge/
│   │   │   └── empty-state/
│   │   ├── services/
│   │   │   ├── dashboard.service.ts
│   │   │   ├── agent-realtime.service.ts
│   │   │   └── github-enrichment.service.ts
│   │   ├── models/
│   │   │   ├── agent.model.ts
│   │   │   ├── agent-session.model.ts
│   │   │   ├── activity-entry.model.ts
│   │   │   ├── github-work-item.model.ts
│   │   │   └── filter-config.model.ts
│   │   ├── tokens/
│   │   │   └── supabase.token.ts
│   │   └── index.ts              ← Library public API barrel
│   └── index.ts
├── project.json
├── tsconfig.json
├── tsconfig.lib.json
├── tsconfig.spec.json
└── jest.config.ts
```

### `project.json` — Library Project Configuration

```json
{
  "name": "agent-dashboard",
  "projectType": "library",
  "sourceRoot": "libs/agency/agent-dashboard/src",
  "prefix": "app",
  "targets": {
    "build": {
      "executor": "@nx/angular:ng-packagr-lite",
      "outputs": ["{workspaceRoot}/dist/libs/agency/agent-dashboard"],
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
      "outputs": ["{workspaceRoot}/coverage/libs/agency/agent-dashboard"],
      "options": {
        "jestConfig": "libs/agency/agent-dashboard/jest.config.ts",
        "passWithNoTests": true
      }
    },
    "lint": {
      "executor": "@nx/linter:eslint",
      "outputs": ["{options.outputFile}"],
      "options": {
        "lintFilePatterns": [
          "libs/agency/agent-dashboard/**/*.ts",
          "libs/agency/agent-dashboard/**/*.html"
        ]
      }
    }
  },
  "tags": ["scope:agent-dashboard", "type:feature", "scope:agency"]
}
```

### `tsconfig.base.json` Path Mapping Addition

```json
// Add to compilerOptions.paths in tsconfig.base.json:
{
  "@buildmotion-ai/agent-dashboard": [
    "libs/agency/agent-dashboard/src/index.ts"
  ]
}
```

### Library Public API (`index.ts`)

```typescript
// libs/agency/agent-dashboard/src/index.ts — Public exports

// Primary component (entry point for lazy-loaded route)
export { DashboardComponent } from './lib/components/dashboard/dashboard.component';

// Services (for provider injection in consuming app)
export { DashboardService } from './lib/services/dashboard.service';
export { AgentRealtimeService } from './lib/services/agent-realtime.service';
export { GitHubEnrichmentService } from './lib/services/github-enrichment.service';

// Tokens
export { SUPABASE_CLIENT } from './lib/tokens/supabase.token';

// Models (for consuming app type usage)
export type { Agent, AgentStatus, AgentType } from './lib/models/agent.model';
export type {
  ActivityEntry,
  LogEntry,
  DecisionEntry,
  QuestionEntry,
  GitHubActionEntry,
  StatusChangeEntry,
  MilestoneEntry,
  ErrorEntry,
  ActivityEntryType,
  LogLevel,
  QuestionStatus,
  GitHubActionType,
} from './lib/models/activity-entry.model';
export type { GitHubWorkItem } from './lib/models/github-work-item.model';
export type { FilterConfig } from './lib/models/filter-config.model';

// Provider factory for app.config.ts integration
export { dashboardProviders } from './lib/providers/dashboard.providers';
```

---

## Supabase Infrastructure Setup

### Environment Configuration

```bash
# Required environment variables (set in .env.local for development)
SUPABASE_URL=https://{project-ref}.supabase.co
SUPABASE_ANON_KEY=eyJ...  # Public anon key (safe to include in Angular build)
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # NEVER include in Angular build — Edge Functions only

# GitHub integration
GITHUB_TOKEN=ghp_...           # GitHub PAT or GitHub App token
GITHUB_WEBHOOK_SECRET=...      # HMAC secret for webhook validation

# Application config (apps/agency/src/config/app-config.ts)
# SUPABASE_URL and SUPABASE_ANON_KEY are the only Supabase values in the Angular build
```

**Angular Environment Configuration** (in `apps/agent-alchemy-dev/src/config/app-config.ts`):
```typescript
// This is the ONLY place Supabase credentials appear in the Angular app
export const APP_CONFIG: IConfiguration = {
  supabase: {
    supabaseUrl: process.env['SUPABASE_URL'] ?? '',
    supabaseAnonKey: process.env['SUPABASE_ANON_KEY'] ?? '',
  },
  // ...other config
};
```

### Supabase Project Setup (One-time)

```bash
# 1. Install Supabase CLI
npm install -g supabase@latest

# 2. Login and link to project
supabase login
supabase link --project-ref {project-ref}

# 3. Enable Realtime on project (Supabase Dashboard → Database → Replication)
# Tables to enable: agent_sessions, activity_entries

# 4. Set secrets for Edge Functions
supabase secrets set GITHUB_TOKEN=ghp_xxxxxxxxx
supabase secrets set GITHUB_WEBHOOK_SECRET=your-webhook-secret
# SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-available in Edge Functions

# 5. Verify secrets
supabase secrets list
```

### Database Migration Workflow

```
supabase/migrations/
├── 20260313000001_setup_extensions.sql
├── 20260313000002_create_agent_registry.sql
├── 20260313000003_create_agent_sessions.sql
├── 20260313000004_create_activity_entries.sql
├── 20260313000005_create_github_work_items.sql
├── 20260313000006_create_dashboard_view.sql
├── 20260313000007_row_level_security.sql
└── 20260313000008_realtime_publication.sql
```

```bash
# Apply migrations to linked project (dev)
supabase db push

# Apply migrations in CI (production)
supabase db push --linked --include-seed

# Generate migration from local changes
supabase db diff --schema public > supabase/migrations/$(date +%Y%m%d%H%M%S)_description.sql

# Reset local dev database (full re-apply all migrations)
supabase db reset

# Validate migration (shows diff without applying)
supabase db diff --linked
```

### Edge Functions Deployment

```
supabase/functions/
├── agent-auth/
│   ├── index.ts
│   └── deno.json
├── github-proxy/
│   ├── index.ts
│   └── deno.json
└── webhook-handler/
    ├── index.ts
    └── deno.json
```

```bash
# Deploy all Edge Functions
supabase functions deploy

# Deploy single function
supabase functions deploy github-proxy

# Serve functions locally for development
supabase functions serve

# Invoke function locally (test)
supabase functions invoke agent-auth --body '{"agentId":"test","agentSecret":"test","orgId":"test"}'

# View Edge Function logs
supabase functions logs github-proxy --scroll
```

---

## CI/CD Pipeline

### GitHub Actions Workflows

#### Workflow 1: Main CI (lint, test, build)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for Nx affected

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - uses: nrwl/nx-set-shas@v4

      # Run affected lint, test, build
      - name: Lint affected
        run: npx nx affected --target=lint --parallel=3

      - name: Test affected
        run: npx nx affected --target=test --parallel=3 --ci --coverage

      - name: Build affected
        run: npx nx affected --target=build --parallel=3
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL_DEV }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY_DEV }}

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          directory: ./coverage
```

#### Workflow 2: Deploy to Production (on merge to main)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

env:
  SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
  SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID_PROD }}

jobs:
  deploy-supabase:
    runs-on: ubuntu-latest
    name: Deploy Supabase (migrations + Edge Functions)
    steps:
      - uses: actions/checkout@v4

      - uses: supabase/setup-cli@v1
        with:
          version: latest

      # Apply database migrations
      - name: Apply database migrations
        run: supabase db push --linked
        env:
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD_PROD }}

      # Deploy Edge Functions
      - name: Deploy Edge Functions
        run: supabase functions deploy --project-ref ${{ secrets.SUPABASE_PROJECT_ID_PROD }}

      # Verify deployment
      - name: Verify migrations applied
        run: supabase db diff --linked --schema public
        # Should output "No schema changes" after successful push

  deploy-angular:
    runs-on: ubuntu-latest
    name: Deploy Angular SPA to Vercel
    needs: deploy-supabase  # Ensure DB is ready before deploying new frontend
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Build agent-alchemy-dev
        run: npx nx build agent-alchemy-dev --configuration=production
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL_PROD }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY_PROD }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: dist/apps/agent-alchemy-dev
```

#### Workflow 3: Supabase Staging Deploy (on push to develop)

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy Staging

on:
  push:
    branches: [develop]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    env:
      SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID_STAGING }}
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      - name: Push migrations to staging
        run: supabase db push --linked
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD_STAGING }}
      - name: Deploy Edge Functions to staging
        run: supabase functions deploy --project-ref ${{ secrets.SUPABASE_PROJECT_ID_STAGING }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

---

## Environment Strategy

### Three Environments

| Environment | Purpose | Supabase Project | Angular Build |
|------------|---------|-----------------|--------------|
| `local` | Developer workstation | Supabase CLI local (`localhost:54321`) | `ng serve` / Nx serve |
| `staging` | Integration testing; QA | Separate Supabase project (`staging-*`) | Vercel preview |
| `production` | Live dashboard | Production Supabase project | Vercel production |

### Required GitHub Secrets

| Secret Name | Scope | Description |
|------------|-------|------------|
| `SUPABASE_ACCESS_TOKEN` | Shared | Supabase CLI auth token for deployments |
| `SUPABASE_PROJECT_ID_PROD` | Production | Supabase project reference (prod) |
| `SUPABASE_PROJECT_ID_STAGING` | Staging | Supabase project reference (staging) |
| `SUPABASE_URL_PROD` | Production | Supabase project URL (prod) |
| `SUPABASE_ANON_KEY_PROD` | Production | Supabase anon key (prod — safe to include in build) |
| `SUPABASE_URL_DEV` | CI | Supabase project URL (staging — used in CI builds) |
| `SUPABASE_ANON_KEY_DEV` | CI | Supabase anon key (staging) |
| `SUPABASE_DB_PASSWORD_PROD` | Production | DB password for migration push |
| `SUPABASE_DB_PASSWORD_STAGING` | Staging | DB password for migration push |
| `VERCEL_TOKEN` | Shared | Vercel deployment token |
| `VERCEL_ORG_ID` | Shared | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Shared | Vercel project ID for `agent-alchemy-dev` |

### Local Development Setup

```bash
# 1. Start local Supabase stack
supabase start
# Outputs:
# API URL: http://localhost:54321
# Anon key: eyJ...
# Studio URL: http://localhost:54323

# 2. Apply migrations
supabase db reset

# 3. Copy local credentials to .env.local
echo "SUPABASE_URL=http://localhost:54321" >> .env.local
echo "SUPABASE_ANON_KEY=<local-anon-key>" >> .env.local

# 4. Serve Edge Functions locally
supabase functions serve &

# 5. Run Angular dev server
npx nx serve agent-alchemy-dev

# 6. Access dashboard at http://localhost:4200/dashboard
```

---

## Monitoring and Observability

### Datadog Browser RUM (existing in stack)

```typescript
// apps/agent-alchemy-dev/src/main.ts — existing Datadog setup
import { datadogRum } from '@datadog/browser-rum';

datadogRum.init({
  applicationId: APP_CONFIG.datadog.applicationId,
  clientToken: APP_CONFIG.datadog.clientToken,
  site: 'datadoghq.com',
  service: 'agent-alchemy-dashboard',
  env: APP_CONFIG.environment,
  version: APP_CONFIG.version,
  sessionSampleRate: 100,
  sessionReplaySampleRate: 20,
  trackUserInteractions: true,
  trackResources: true,
  trackLongTasks: true,
  defaultPrivacyLevel: 'mask-user-input',
});
```

**Dashboard-specific Datadog custom metrics** (add to `AgentRealtimeService`):
```typescript
import { datadogRum } from '@datadog/browser-rum';

// Track Realtime connection events
datadogRum.addAction('realtime_connected', { orgId });
datadogRum.addAction('realtime_disconnected', { retryCount });
datadogRum.addAction('realtime_error', { retryCount });

// Track activity entry receive latency
datadogRum.addTiming('activity_entry_received');

// Track GitHub enrichment cache performance
datadogRum.addTiming('github_enrichment_fetch');
```

### Realtime Connection Health Indicator

The `DashboardComponent` displays the connection state via the `connectionState` signal:

```html
<!-- dashboard.component.html — connection indicator -->
<div
  class="connection-indicator text-xs px-2 py-1 rounded-full"
  [ngClass]="{
    'bg-green-100 text-green-700': connectionState() === 'connected',
    'bg-yellow-100 text-yellow-700': connectionState() === 'connecting',
    'bg-red-100 text-red-700': connectionState() === 'error',
    'bg-gray-100 text-gray-500': connectionState() === 'disconnected'
  }"
  role="status"
  [attr.aria-label]="'Realtime: ' + connectionState()"
>
  <span class="connection-dot mr-1">
    {{ connectionState() === 'connected' ? '●' : '○' }}
  </span>
  @switch (connectionState()) {
    @case ('connected') { Live }
    @case ('connecting') { Connecting... }
    @case ('error') { Connection lost — <button (click)="reconnect()">Retry</button> }
    @case ('disconnected') { Offline }
  }
</div>
```

### Supabase Dashboard Metrics

Monitor via Supabase project dashboard:
- **DB metrics**: Query execution times, connection pool utilization, table sizes
- **Realtime metrics**: Active subscriptions, message delivery latency
- **Edge Function metrics**: Invocation count, execution time, error rate
- **Auth metrics**: Login success/failure rate, active sessions

### Alerting (Datadog)

Define alerts for:
1. **Realtime reconnect rate > 5/hour** — potential WebSocket instability
2. **GitHub proxy error rate > 10%** — GitHub API or token issue
3. **Angular JS errors > 0.1% of sessions** — dashboard bugs
4. **Dashboard load time > 3s** — performance regression

---

## Agent SDK Package Deployment

The `@agent-alchemy/agent-sdk` is a separate npm package used by AI agents:

```
libs/agent-alchemy/agent-sdk/       ← New Nx library (separate from dashboard lib)
├── src/
│   ├── lib/
│   │   ├── agent-session.ts        ← Core AgentSession class
│   │   ├── types.ts                ← Shared type definitions
│   │   └── sanitize.ts             ← Content sanitization
│   └── index.ts
├── package.json                    ← { "name": "@agent-alchemy/agent-sdk", "version": "1.0.0" }
└── project.json
```

**Publishing workflow**:
```yaml
# .github/workflows/publish-sdk.yml
name: Publish Agent SDK

on:
  push:
    tags:
      - 'agent-sdk/v*'  # Triggered by: git tag agent-sdk/v1.0.0

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: yarn install --frozen-lockfile
      - run: npx nx build agent-sdk
      - run: npm publish dist/libs/agent-alchemy/agent-sdk --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## Performance Targets and SLOs

| Metric | Target | Measurement |
|--------|--------|-------------|
| Dashboard initial load | < 2s | Datadog RUM LCP |
| Agent card update (Realtime) | < 3s end-to-end | Agent post → card update |
| Activity feed load (50 entries) | < 500ms | `loadActivityForAgent()` |
| GitHub enrichment (cache miss) | < 2s | `getWorkItem()` timing |
| Realtime reconnect | < 30s | Max backoff with jitter |
| Angular bundle size (lazy chunk) | < 300KB gzipped | Nx build output |

---

## Dependency Updates

Since `@supabase/supabase-js ^2.52.0` is already in `package.json`, no new dependencies need to be added to the root. The library uses peer dependencies:

```json
// libs/agency/agent-dashboard/package.json (for publishable lib)
{
  "peerDependencies": {
    "@angular/core": "~18.2.0",
    "@angular/common": "~18.2.0",
    "@supabase/supabase-js": "^2.52.0",
    "primeng": "^18.0.2"
  }
}
```

---

## References

- `plan/constraints-dependencies.specification.md` — Technology constraints and existing dependencies
- `plan/implementation-sequence.specification.md` — 14-week delivery phases
- `architecture/database-schema.specification.md` — Migration file list
- `architecture/security-architecture.specification.md` — Secret rotation, CSP headers
- `.agent-alchemy/specs/stack/stack.json` — Nx 19.8.4, Yarn, Angular 18.2.0, Datadog 4.18.1
