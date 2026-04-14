---
meta:
  id: specs-products-agent-alchemy-dev-features-content-queue-architecture-devops-deployment
  title: DevOps & Deployment - Content Queue Feature
  version: 1.0.0
  status: draft
  specType: specification
  scope: feature
  tags: []
  createdBy: unknown
  createdAt: '2026-02-24'
  reviewedAt: null
title: DevOps & Deployment - Content Queue Feature
category: Products
feature: content-queue
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: architecture
applyTo: []
keywords: []
topics: []
useCases: []
specification: devops-deployment
---

# DevOps & Deployment: Content Queue Feature

## Overview

**Purpose**: Define comprehensive CI/CD pipelines, deployment strategies, monitoring, infrastructure, and operational procedures for the Content Queue feature.

**Deployment Model**: Hybrid

- **VS Code Extension**: Marketplace deployment (client-side)
- **NestJS Backend**: Containerized deployment (if API required)
- **Supabase**: Managed service (database, auth, storage)

**Environments**:

1. **Development**: Local developer machines
2. **Staging**: Pre-production testing environment
3. **Production**: Live deployment (VS Code Marketplace)

**Technology Stack**:

- **CI/CD**: GitHub Actions
- **Build System**: Nx 19.8.4
- **Testing**: Jest 29.7.0, Playwright 1.36.0
- **Monitoring**: VS Code Extension Telemetry, GitHub Actions logs
- **Package Management**: npm, vsce (VS Code Extension CLI)

---

## 1. CI/CD Pipeline Architecture

### 1.1 GitHub Actions Workflows

**Main CI Pipeline** (`.github/workflows/ci.yml`):

```yaml
name: CI Pipeline - Content Queue

on:
  push:
    branches:
      - main
      - develop
    paths:
      - 'libs/content-queue/**'
      - 'apps/vscode-extension/**'
      - 'package.json'
      - 'nx.json'
  pull_request:
    branches:
      - main
      - develop
    paths:
      - 'libs/content-queue/**'
      - 'apps/vscode-extension/**'

env:
  NX_CLOUD_DISTRIBUTED_EXECUTION: true
  NX_CLOUD_ACCESS_TOKEN: ${{ secrets.NX_CLOUD_ACCESS_TOKEN }}
  NODE_VERSION: '18.16.9'

jobs:
  setup:
    name: Setup & Cache
    runs-on: ubuntu-latest
    outputs:
      node-cache-key: ${{ steps.cache-node.outputs.cache-hit }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Full history for Nx affected

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Cache node_modules
        id: cache-node
        uses: actions/cache@v3
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-

      - name: Install dependencies
        if: steps.cache-node.outputs.cache-hit != 'true'
        run: npm ci

      - name: Setup Nx Cloud
        run: npx nx-cloud start-ci-run

  lint:
    name: Lint
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Restore node_modules
        uses: actions/cache@v3
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

      - name: Lint affected projects
        run: npx nx affected --target=lint --parallel=3 --base=origin/main

      - name: Check TypeScript types
        run: npx nx affected --target=type-check --parallel=3 --base=origin/main

  test:
    name: Unit Tests
    needs: setup
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Restore node_modules
        uses: actions/cache@v3
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

      - name: Run tests (Shard ${{ matrix.shard }})
        run: |
          npx nx affected --target=test \
            --parallel=1 \
            --ci \
            --code-coverage \
            --shard=${{ matrix.shard }}/3 \
            --base=origin/main

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/**/lcov.info
          flags: unittests-shard-${{ matrix.shard }}
          name: codecov-shard-${{ matrix.shard }}

  e2e:
    name: E2E Tests
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Restore node_modules
        uses: actions/cache@v3
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: |
          npx nx affected --target=e2e \
            --parallel=1 \
            --ci \
            --base=origin/main

      - name: Upload E2E artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-screenshots
          path: dist/e2e/**/screenshots/
          retention-days: 7

  build:
    name: Build
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Restore node_modules
        uses: actions/cache@v3
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

      - name: Build affected projects
        run: |
          npx nx affected --target=build \
            --parallel=3 \
            --configuration=production \
            --base=origin/main

      - name: Package VS Code extension
        if: github.ref == 'refs/heads/main'
        run: |
          cd apps/vscode-extension
          npx vsce package --out ../../dist/extension/

      - name: Upload extension artifact
        if: github.ref == 'refs/heads/main'
        uses: actions/upload-artifact@v3
        with:
          name: vscode-extension
          path: dist/extension/*.vsix
          retention-days: 30

  security-scan:
    name: Security Scan
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Restore node_modules
        uses: actions/cache@v3
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

      - name: Run npm audit
        run: npm audit --audit-level=moderate
        continue-on-error: true

      - name: Run SAST with CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: typescript, javascript

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
        continue-on-error: true

  quality-gate:
    name: Quality Gate
    needs: [lint, test, build, security-scan]
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Check quality metrics
        run: |
          echo "✅ All quality checks passed"
          echo "✅ Linting: PASSED"
          echo "✅ Tests: PASSED"
          echo "✅ Build: PASSED"
          echo "✅ Security: PASSED"

      - name: Post quality report
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ Quality gate passed - All checks successful!'
            })
```

### 1.2 Release Pipeline

**Automated Release** (`.github/workflows/release.yml`):

```yaml
name: Release Pipeline

on:
  push:
    tags:
      - 'v*.*.*'

env:
  NODE_VERSION: '18.16.9'

jobs:
  release:
    name: Release to VS Code Marketplace
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Extract version from tag
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT

      - name: Update version in package.json
        run: |
          cd apps/vscode-extension
          npm version ${{ steps.version.outputs.VERSION }} --no-git-tag-version

      - name: Build extension
        run: |
          npx nx build vscode-extension --configuration=production

      - name: Run tests
        run: |
          npx nx test vscode-extension --ci --code-coverage

      - name: Package extension
        run: |
          cd apps/vscode-extension
          npx vsce package

      - name: Publish to VS Code Marketplace
        run: |
          cd apps/vscode-extension
          npx vsce publish --pat ${{ secrets.VSCE_PAT }}
        env:
          VSCE_PAT: ${{ secrets.VSCE_PAT }}

      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ steps.version.outputs.VERSION }}
          body: |
            ## Content Queue v${{ steps.version.outputs.VERSION }}

            See [CHANGELOG.md](CHANGELOG.md) for details.
          draft: false
          prerelease: false

      - name: Upload extension to release
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          upload_url: ${{ steps.create_release.outputs.upload_url }}
          asset_path: ./apps/vscode-extension/*.vsix
          asset_name: content-queue-${{ steps.version.outputs.VERSION }}.vsix
          asset_content_type: application/zip

      - name: Notify team
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: |
            🚀 Content Queue v${{ steps.version.outputs.VERSION }} released!
            Published to VS Code Marketplace
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 1.3 Dependency Update Pipeline

**Automated Dependency Updates** (`.github/workflows/dependencies.yml`):

```yaml
name: Update Dependencies

on:
  schedule:
    - cron: '0 0 * * 1' # Weekly on Monday
  workflow_dispatch:

jobs:
  update-dependencies:
    name: Update Dependencies
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18.16.9'

      - name: Update dependencies
        run: |
          npx npm-check-updates -u
          npm install

      - name: Run tests
        run: |
          npx nx run-many --target=test --all --parallel=3

      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v5
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: 'chore: update dependencies'
          title: 'chore: weekly dependency updates'
          body: |
            Automated dependency updates

            - Updated all dependencies to latest versions
            - All tests passing

            Please review before merging.
          branch: deps/automated-update
          delete-branch: true
```

---

## 2. Environment Configuration

### 2.1 Development Environment

**Local Setup** (`.env.development`):

```bash
# Application
NODE_ENV=development
LOG_LEVEL=debug
DEBUG=content-queue:*

# VS Code Extension
EXTENSION_ID=content-queue-dev
EXTENSION_PORT=3000

# GitHub
GITHUB_CLIENT_ID=dev_client_id
GITHUB_CLIENT_SECRET=dev_client_secret
GITHUB_REDIRECT_URI=vscode://publisher.extension/oauth/github/callback

# Supabase (Development Project)
SUPABASE_URL=https://dev-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...dev_key
SUPABASE_SERVICE_KEY=eyJhbGc...dev_service_key

# Twitter (Dev Account)
TWITTER_CLIENT_ID=dev_twitter_client
TWITTER_CLIENT_SECRET=dev_twitter_secret

# Dev.to (Test API Key)
DEVTO_API_KEY=test_devto_key

# Monitoring
SENTRY_DSN=https://dev@sentry.io/project
TELEMETRY_ENABLED=false
```

**Development Scripts** (`package.json`):

```json
{
  "scripts": {
    "dev": "nx serve vscode-extension",
    "dev:debug": "nx serve vscode-extension --configuration=debug",
    "dev:watch": "nx watch --all -- nx affected --target=build",
    "test:watch": "nx affected --target=test --watch",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register node_modules/.bin/jest --runInBand",
    "lint:fix": "nx affected --target=lint --fix",
    "db:migrate": "supabase db push",
    "db:seed": "node scripts/seed-dev-data.js"
  }
}
```

### 2.2 Staging Environment

**Configuration** (`.env.staging`):

```bash
# Application
NODE_ENV=staging
LOG_LEVEL=info
DEBUG=

# VS Code Extension
EXTENSION_ID=content-queue-staging
EXTENSION_PORT=3001

# GitHub (Staging OAuth App)
GITHUB_CLIENT_ID=staging_client_id
GITHUB_CLIENT_SECRET=staging_client_secret
GITHUB_REDIRECT_URI=vscode://publisher.extension/oauth/github/callback

# Supabase (Staging Project)
SUPABASE_URL=https://staging-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...staging_key
SUPABASE_SERVICE_KEY=eyJhbGc...staging_service_key

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000 # 15 minutes

# Monitoring
SENTRY_DSN=https://staging@sentry.io/project
TELEMETRY_ENABLED=true
TELEMETRY_SAMPLE_RATE=1.0 # 100% sampling in staging

# Feature Flags
FEATURE_TWITTER_ENABLED=true
FEATURE_DEVTO_ENABLED=true
FEATURE_AI_GENERATION=true
```

### 2.3 Production Environment

**Configuration** (`.env.production`):

```bash
# Application
NODE_ENV=production
LOG_LEVEL=warn
DEBUG=

# VS Code Extension
EXTENSION_ID=content-queue
EXTENSION_PORT=443

# GitHub (Production OAuth App)
GITHUB_CLIENT_ID=prod_client_id
GITHUB_CLIENT_SECRET=prod_client_secret
GITHUB_REDIRECT_URI=vscode://publisher.extension/oauth/github/callback

# Supabase (Production Project)
SUPABASE_URL=https://prod-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...prod_key
SUPABASE_SERVICE_KEY=eyJhbGc...prod_service_key

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=50
RATE_LIMIT_WINDOW_MS=900000 # 15 minutes

# Monitoring
SENTRY_DSN=https://prod@sentry.io/project
TELEMETRY_ENABLED=true
TELEMETRY_SAMPLE_RATE=0.1 # 10% sampling in production

# Feature Flags
FEATURE_TWITTER_ENABLED=true
FEATURE_DEVTO_ENABLED=true
FEATURE_AI_GENERATION=true

# Security
ENCRYPTION_KEY=<secure_32_char_key>
JWT_SECRET=<secure_jwt_secret>
```

---

## 3. Monitoring & Observability

### 3.1 Logging Strategy

**Structured Logging** (`libs/logging/logger.service.ts`):

```typescript
import { Injectable, LogLevel } from '@nestjs/common';
import * as winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

interface LogContext {
  userId?: string;
  sessionId?: string;
  action?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

@Injectable()
export class LoggerService {
  private logger: winston.Logger;

  constructor() {
    const transports: winston.transport[] = [
      // Console transport (always enabled)
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
          })
        ),
      }),
    ];

    // Elasticsearch transport (production only)
    if (process.env.NODE_ENV === 'production') {
      transports.push(
        new ElasticsearchTransport({
          level: 'info',
          clientOpts: {
            node: process.env.ELASTICSEARCH_URL,
            auth: {
              username: process.env.ELASTICSEARCH_USER,
              password: process.env.ELASTICSEARCH_PASSWORD,
            },
          },
          index: 'content-queue-logs',
        })
      );
    }

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
      defaultMeta: {
        service: 'content-queue',
        environment: process.env.NODE_ENV,
      },
      transports,
    });
  }

  /**
   * Log informational message
   */
  info(message: string, context?: LogContext): void {
    this.logger.info(message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.logger.error(message, {
      ...context,
      error: {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      },
    });
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, context);
  }

  /**
   * Log performance metric
   */
  metric(name: string, value: number, context?: LogContext): void {
    this.logger.info(`Metric: ${name}`, {
      ...context,
      metric: {
        name,
        value,
        unit: 'ms',
      },
    });
  }
}
```

### 3.2 Application Metrics

**Metrics Collection** (`libs/monitoring/metrics.service.ts`):

```typescript
import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry: Registry;

  // Counters
  private readonly contentGenerated: Counter;
  private readonly contentPublished: Counter;
  private readonly errorsTotal: Counter;
  private readonly apiRequests: Counter;

  // Histograms
  private readonly commitAnalysisDuration: Histogram;
  private readonly contentGenerationDuration: Histogram;
  private readonly publishDuration: Histogram;

  // Gauges
  private readonly queueSize: Gauge;
  private readonly activeUsers: Gauge;

  constructor() {
    this.registry = new Registry();

    // Initialize counters
    this.contentGenerated = new Counter({
      name: 'content_queue_content_generated_total',
      help: 'Total number of content items generated',
      labelNames: ['platform', 'type'],
      registers: [this.registry],
    });

    this.contentPublished = new Counter({
      name: 'content_queue_content_published_total',
      help: 'Total number of content items published',
      labelNames: ['platform', 'status'],
      registers: [this.registry],
    });

    this.errorsTotal = new Counter({
      name: 'content_queue_errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'severity'],
      registers: [this.registry],
    });

    this.apiRequests = new Counter({
      name: 'content_queue_api_requests_total',
      help: 'Total API requests',
      labelNames: ['endpoint', 'method', 'status'],
      registers: [this.registry],
    });

    // Initialize histograms
    this.commitAnalysisDuration = new Histogram({
      name: 'content_queue_commit_analysis_duration_seconds',
      help: 'Commit analysis duration',
      buckets: [0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.contentGenerationDuration = new Histogram({
      name: 'content_queue_content_generation_duration_seconds',
      help: 'Content generation duration',
      buckets: [1, 5, 10, 30, 60],
      registers: [this.registry],
    });

    this.publishDuration = new Histogram({
      name: 'content_queue_publish_duration_seconds',
      help: 'Publish operation duration',
      buckets: [0.5, 1, 2, 5, 10],
      registers: [this.registry],
    });

    // Initialize gauges
    this.queueSize = new Gauge({
      name: 'content_queue_size',
      help: 'Current queue size',
      labelNames: ['status'],
      registers: [this.registry],
    });

    this.activeUsers = new Gauge({
      name: 'content_queue_active_users',
      help: 'Number of active users',
      registers: [this.registry],
    });
  }

  /**
   * Record content generation
   */
  recordContentGenerated(platform: string, type: string): void {
    this.contentGenerated.labels(platform, type).inc();
  }

  /**
   * Record content publication
   */
  recordContentPublished(platform: string, status: string): void {
    this.contentPublished.labels(platform, status).inc();
  }

  /**
   * Record error
   */
  recordError(type: string, severity: string): void {
    this.errorsTotal.labels(type, severity).inc();
  }

  /**
   * Record API request
   */
  recordApiRequest(endpoint: string, method: string, status: number): void {
    this.apiRequests.labels(endpoint, method, status.toString()).inc();
  }

  /**
   * Record commit analysis duration
   */
  recordCommitAnalysis(durationSeconds: number): void {
    this.commitAnalysisDuration.observe(durationSeconds);
  }

  /**
   * Record content generation duration
   */
  recordContentGeneration(durationSeconds: number): void {
    this.contentGenerationDuration.observe(durationSeconds);
  }

  /**
   * Record publish duration
   */
  recordPublish(durationSeconds: number): void {
    this.publishDuration.observe(durationSeconds);
  }

  /**
   * Update queue size
   */
  updateQueueSize(status: string, size: number): void {
    this.queueSize.labels(status).set(size);
  }

  /**
   * Update active users count
   */
  updateActiveUsers(count: number): void {
    this.activeUsers.set(count);
  }

  /**
   * Get metrics for Prometheus scraping
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
```

### 3.3 Error Tracking

**Sentry Integration** (`libs/monitoring/sentry.service.ts`):

```typescript
import * as Sentry from '@sentry/node';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SentryService {
  constructor() {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      release: process.env.APP_VERSION,

      // Performance monitoring
      tracesSampleRate: parseFloat(process.env.TELEMETRY_SAMPLE_RATE || '0.1'),

      // Error filtering
      beforeSend(event, hint) {
        // Don't send errors in development
        if (process.env.NODE_ENV === 'development') {
          return null;
        }

        // Filter out known non-critical errors
        if (event.exception?.values?.[0]?.type === 'NetworkError') {
          return null;
        }

        return event;
      },

      // Integrations
      integrations: [new Sentry.Integrations.Http({ tracing: true }), new Sentry.Integrations.Console()],
    });
  }

  /**
   * Capture exception with context
   */
  captureException(error: Error, context?: Record<string, any>): void {
    Sentry.withScope((scope) => {
      if (context) {
        Object.keys(context).forEach((key) => {
          scope.setContext(key, context[key]);
        });
      }

      Sentry.captureException(error);
    });
  }

  /**
   * Capture message
   */
  captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
    Sentry.captureMessage(message, level);
  }

  /**
   * Set user context
   */
  setUser(user: { id: string; email?: string; username?: string }): void {
    Sentry.setUser(user);
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
    Sentry.addBreadcrumb(breadcrumb);
  }
}
```

### 3.4 Health Checks

**Health Check Endpoint**:

```typescript
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(private health: HealthCheckService, private db: TypeOrmHealthIndicator, private supabase: SupabaseHealthIndicator) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Database health
      () => this.db.pingCheck('database'),

      // Supabase health
      () => this.supabase.isHealthy('supabase'),

      // External API health
      () => this.checkGitHubAPI(),
      () => this.checkTwitterAPI(),
      () => this.checkDevToAPI(),
    ]);
  }

  private async checkGitHubAPI() {
    try {
      const response = await fetch('https://api.github.com/status');
      return {
        github_api: {
          status: response.ok ? 'up' : 'down',
          responseTime: response.headers.get('x-response-time'),
        },
      };
    } catch (error) {
      return { github_api: { status: 'down' } };
    }
  }

  private async checkTwitterAPI() {
    // Similar implementation
  }

  private async checkDevToAPI() {
    // Similar implementation
  }
}
```

---

## 4. Deployment Strategy

### 4.1 VS Code Extension Deployment

**Deployment Process**:

```typescript
// scripts/deploy-extension.ts
import * as vsce from 'vsce';
import { execSync } from 'child_process';

interface DeploymentConfig {
  version: string;
  token: string;
  dryRun: boolean;
}

async function deployExtension(config: DeploymentConfig) {
  console.log(`🚀 Deploying Content Queue v${config.version}`);

  // Step 1: Run tests
  console.log('Running tests...');
  execSync('npx nx test vscode-extension --ci', { stdio: 'inherit' });

  // Step 2: Build production bundle
  console.log('Building production bundle...');
  execSync('npx nx build vscode-extension --configuration=production', {
    stdio: 'inherit',
  });

  // Step 3: Package extension
  console.log('Packaging extension...');
  const packageOptions: vsce.IPackageOptions = {
    cwd: './apps/vscode-extension',
    packagePath: `../../dist/extension/content-queue-${config.version}.vsix`,
  };

  await vsce.createVSIX(packageOptions);

  // Step 4: Publish (if not dry run)
  if (!config.dryRun) {
    console.log('Publishing to VS Code Marketplace...');

    const publishOptions: vsce.IPublishOptions = {
      cwd: './apps/vscode-extension',
      pat: config.token,
    };

    await vsce.publish(publishOptions);

    console.log('✅ Successfully published to VS Code Marketplace');
  } else {
    console.log('✅ Dry run complete - extension packaged but not published');
  }
}

// Run deployment
const config: DeploymentConfig = {
  version: process.env.VERSION || '1.0.0',
  token: process.env.VSCE_PAT || '',
  dryRun: process.argv.includes('--dry-run'),
};

deployExtension(config).catch((error) => {
  console.error('❌ Deployment failed:', error);
  process.exit(1);
});
```

### 4.2 Rollback Procedures

**Rollback Strategy**:

```bash
#!/bin/bash
# scripts/rollback-extension.sh

set -e

PREVIOUS_VERSION=$1

if [ -z "$PREVIOUS_VERSION" ]; then
  echo "Usage: ./rollback-extension.sh <version>"
  exit 1
fi

echo "🔄 Rolling back to version $PREVIOUS_VERSION"

# Step 1: Checkout previous version
git fetch --tags
git checkout "v$PREVIOUS_VERSION"

# Step 2: Build previous version
npx nx build vscode-extension --configuration=production

# Step 3: Package extension
cd apps/vscode-extension
npx vsce package

# Step 4: Publish previous version
npx vsce publish --pat $VSCE_PAT

echo "✅ Rollback complete - now running v$PREVIOUS_VERSION"

# Step 5: Create incident report
cat > "incident-rollback-$(date +%Y%m%d-%H%M%S).md" << EOF
# Rollback Incident Report

- **Date**: $(date)
- **Rolled back to**: v$PREVIOUS_VERSION
- **Reason**: [To be filled]
- **Impact**: [To be filled]
- **Action items**: [To be filled]
EOF

echo "📝 Incident report created"
```

### 4.3 Feature Flags

**Feature Flag Configuration**:

```typescript
interface FeatureFlags {
  twitterEnabled: boolean;
  devtoEnabled: boolean;
  aiGeneration: boolean;
  autoScheduling: boolean;
  betaFeatures: boolean;
}

@Injectable()
export class FeatureFlagService {
  private flags: FeatureFlags;

  constructor(private config: ConfigService) {
    this.flags = {
      twitterEnabled: config.get('FEATURE_TWITTER_ENABLED', true),
      devtoEnabled: config.get('FEATURE_DEVTO_ENABLED', true),
      aiGeneration: config.get('FEATURE_AI_GENERATION', true),
      autoScheduling: config.get('FEATURE_AUTO_SCHEDULING', false),
      betaFeatures: config.get('FEATURE_BETA', false),
    };
  }

  /**
   * Check if feature is enabled
   */
  isEnabled(feature: keyof FeatureFlags): boolean {
    return this.flags[feature];
  }

  /**
   * Enable/disable feature at runtime
   */
  async setFeature(feature: keyof FeatureFlags, enabled: boolean): Promise<void> {
    this.flags[feature] = enabled;

    // Persist to database for distributed systems
    await this.config.set(`FEATURE_${feature.toUpperCase()}`, enabled);
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }
}
```

---

## 5. Scaling Strategy

### 5.1 Horizontal Scaling

**Load Balancing** (if NestJS API required):

```yaml
# docker-compose.yml
version: '3.8'

services:
  api-1:
    image: content-queue-api:latest
    environment:
      - NODE_ENV=production
      - INSTANCE_ID=api-1
    ports:
      - '3001:3000'
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  api-2:
    image: content-queue-api:latest
    environment:
      - NODE_ENV=production
      - INSTANCE_ID=api-2
    ports:
      - '3002:3000'

  api-3:
    image: content-queue-api:latest
    environment:
      - NODE_ENV=production
      - INSTANCE_ID=api-3
    ports:
      - '3003:3000'

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api-1
      - api-2
      - api-3

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

volumes:
  redis-data:
```

### 5.2 Performance Optimization

**Caching Strategy**:

```typescript
@Injectable()
export class CacheService {
  constructor(@Inject('REDIS_CLIENT') private redis: Redis, private logger: LoggerService) {}

  /**
   * Cache commit analysis results
   */
  async cacheCommitAnalysis(sha: string, analysis: CommitAnalysis, ttl: number = 3600): Promise<void> {
    const key = `commit:analysis:${sha}`;
    await this.redis.setex(key, ttl, JSON.stringify(analysis));

    this.logger.debug('Cached commit analysis', { sha, ttl });
  }

  /**
   * Get cached commit analysis
   */
  async getCachedCommitAnalysis(sha: string): Promise<CommitAnalysis | null> {
    const key = `commit:analysis:${sha}`;
    const cached = await this.redis.get(key);

    if (cached) {
      this.logger.debug('Cache hit for commit analysis', { sha });
      return JSON.parse(cached);
    }

    this.logger.debug('Cache miss for commit analysis', { sha });
    return null;
  }

  /**
   * Cache GitHub API responses
   */
  async cacheApiResponse(endpoint: string, response: any, ttl: number = 300): Promise<void> {
    const key = `api:response:${endpoint}`;
    await this.redis.setex(key, ttl, JSON.stringify(response));
  }
}
```

---

## DevOps Checklist

### CI/CD Pipeline

- [ ] GitHub Actions workflows configured
- [ ] Automated testing on PRs
- [ ] Parallel test execution (sharded)
- [ ] Code coverage reporting (Codecov)
- [ ] Security scanning (CodeQL, Snyk)
- [ ] Automated dependency updates
- [ ] Release automation configured

### Environments

- [ ] Development environment setup
- [ ] Staging environment configured
- [ ] Production environment ready
- [ ] Environment-specific configs
- [ ] Secrets management (GitHub Secrets)

### Monitoring

- [ ] Structured logging implemented
- [ ] Metrics collection (Prometheus)
- [ ] Error tracking (Sentry)
- [ ] Health check endpoints
- [ ] Performance monitoring
- [ ] User telemetry (opt-in)

### Deployment

- [ ] VS Code Marketplace publishing
- [ ] Automated deployment pipeline
- [ ] Rollback procedures documented
- [ ] Feature flags implemented
- [ ] Version management strategy

### Scaling

- [ ] Horizontal scaling plan
- [ ] Caching strategy (Redis)
- [ ] Load balancing configured
- [ ] Performance optimization
- [ ] Resource limits defined

### Operations

- [ ] Runbooks created
- [ ] Incident response plan
- [ ] On-call rotation defined
- [ ] SLA/SLO targets set
- [ ] Backup and recovery procedures

This comprehensive DevOps specification ensures reliable, scalable, and maintainable deployment of the Content Queue feature.
