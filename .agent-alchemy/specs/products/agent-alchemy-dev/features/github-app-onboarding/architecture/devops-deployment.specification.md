---
meta:
  id: specs-products-agent-alchemy-dev-features-github-app-onboarding-architecture-devops-deployment
  title: GitHub App Onboarding - DevOps & Deployment
  version: 1.0.0
  status: draft
  specType: specification
  scope: feature
  tags: []
  createdBy: unknown
  createdAt: '2026-02-08'
  reviewedAt: null
title: GitHub App Onboarding - DevOps & Deployment
category: architecture
feature: github-app-onboarding
lastUpdated: '2026-02-08'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: architecture
applyTo: []
keywords: []
topics: []
useCases: []
---

# GitHub App Onboarding - DevOps & Deployment Specification

## Executive Summary

This specification defines the complete DevOps pipeline, infrastructure, and deployment strategy for GitHub App integration. It covers CI/CD workflows, containerization, environment management, monitoring, and disaster recovery.

**Key Components**:
- **CI/CD**: GitHub Actions with Nx Cloud caching
- **Containerization**: Docker multi-stage builds
- **Frontend Deployment**: Vercel (serverless)
- **Backend Deployment**: Railway or Google Cloud Run
- **Infrastructure as Code**: Terraform (optional)
- **Monitoring**: Sentry, DataDog, New Relic

---

## 1. CI/CD Pipeline

### 1.1 GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NX_CLOUD_ACCESS_TOKEN: ${{ secrets.NX_CLOUD_ACCESS_TOKEN }}

jobs:
  setup:
    runs-on: ubuntu-latest
    outputs:
      affected: ${{ steps.set-affected.outputs.affected }}
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - uses: nrwl/nx-set-shas@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'yarn'
      
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      
      - name: Check affected projects
        id: set-affected
        run: |
          affected=$(yarn nx print-affected --select=projects)
          echo "affected=$affected" >> $GITHUB_OUTPUT

  lint:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - uses: nrwl/nx-set-shas@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'yarn'
      
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      
      - name: Run linting
        run: yarn nx affected --target=lint --parallel=3

  test:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - uses: nrwl/nx-set-shas@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'yarn'
      
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      
      - name: Run tests
        run: yarn nx affected --target=test --parallel=3 --ci --code-coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/**/coverage-final.json

  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    strategy:
      matrix:
        project: [agency, api]
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'yarn'
      
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      
      - name: Build ${{ matrix.project }}
        run: yarn nx build ${{ matrix.project }} --configuration=production
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.project }}-build
          path: dist/${{ matrix.project }}

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy Frontend to Vercel Staging
        run: |
          # Vercel deployment
          npx vercel --token=${{ secrets.VERCEL_TOKEN }} --yes
      
      - name: Deploy Backend to Railway Staging
        run: |
          # Railway deployment
          railway up --service=api --environment=staging

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy Frontend to Vercel Production
        run: |
          npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }} --yes
      
      - name: Deploy Backend to Railway Production
        run: |
          railway up --service=api --environment=production
```

---

## 2. Docker Containerization

### 2.1 Backend Dockerfile (Multi-Stage Build)

```dockerfile
# syntax=docker/dockerfile:1

# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source
COPY . .

# Build application
RUN yarn nx build api --configuration=production

# Stage 2: Production
FROM node:18-alpine AS production
WORKDIR /app

# Install production dependencies only
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

# Copy built application from builder
COPY --from=builder /app/dist/apps/api ./dist

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/main.js"]
```

### 2.2 Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/agentalchemy_dev
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./apps/api:/app/apps/api
      - /app/node_modules

  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=agentalchemy_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## 3. Environment Configuration

### 3.1 Environment Variables

**Development (.env.development)**:
```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agentalchemy_dev

# Redis
REDIS_URL=redis://localhost:6379

# GitHub OAuth
GITHUB_CLIENT_ID=Iv1.dev_client_id
GITHUB_CLIENT_SECRET=dev_client_secret
GITHUB_WEBHOOK_SECRET=dev_webhook_secret

# JWT
JWT_PRIVATE_KEY_PATH=./keys/jwt-private.pem
JWT_PUBLIC_KEY_PATH=./keys/jwt-public.pem

# Encryption
ENCRYPTION_KEY=dev_encryption_key_32_bytes_base64

# Frontend
FRONTEND_URL=http://localhost:4200
```

**Production (Managed via Secrets Manager)**:
- Stored in AWS Secrets Manager or environment-specific secret stores
- Injected at runtime via environment variables
- Rotated regularly (encryption keys, API keys)

---

## 4. Deployment Platforms

### 4.1 Frontend Deployment (Vercel)

**vercel.json**:
```json
{
  "version": 2,
  "buildCommand": "yarn nx build agency --configuration=production",
  "outputDirectory": "dist/apps/agency",
  "framework": "angular",
  "regions": ["iad1", "sfo1", "lhr1"],
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "NX_CLOUD_ACCESS_TOKEN": "@nx-cloud-token"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### 4.2 Backend Deployment (Railway/Cloud Run)

**railway.json**:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "numReplicas": 2,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3,
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300
  }
}
```

**Google Cloud Run (cloudrun.yaml)**:
```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: agent-alchemy-api
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "2"
        autoscaling.knative.dev/maxScale: "10"
    spec:
      containers:
      - image: gcr.io/project-id/agent-alchemy-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-url
              key: latest
        resources:
          limits:
            cpu: "2"
            memory: "2Gi"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
```

---

## 5. Monitoring & Observability

### 5.1 Application Monitoring

**Sentry Configuration**:
```typescript
// main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Postgres(),
    new Sentry.Integrations.Express({ app })
  ]
});
```

**DataDog APM**:
```typescript
// tracer.ts
import tracer from 'dd-trace';

tracer.init({
  service: 'agent-alchemy-api',
  env: process.env.NODE_ENV,
  analytics: true,
  runtimeMetrics: true
});

export default tracer;
```

### 5.2 Log Aggregation

**Winston Logger Configuration**:
```typescript
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

WinstonModule.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

---

## 6. Backup & Disaster Recovery

### 6.1 Database Backup

**Automated Backups (Supabase)**:
- Daily automated backups (7-day retention)
- Point-in-Time Recovery (PITR) enabled
- Manual snapshots before releases

**Backup Script**:
```bash
#!/bin/bash
# backup-database.sh

BACKUP_DIR=/backups
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE=$BACKUP_DIR/db_backup_$DATE.dump

pg_dump $DATABASE_URL -F c -b -v -f $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE s3://backups-bucket/databases/

# Retain last 30 backups
find $BACKUP_DIR -type f -mtime +30 -delete
```

### 6.2 Rollback Procedures

**Application Rollback**:
```bash
# Vercel
vercel rollback --token=$VERCEL_TOKEN

# Railway
railway rollback --service=api

# Cloud Run
gcloud run services update-traffic agent-alchemy-api --to-revisions=PREVIOUS=100
```

---

## 7. Acceptance Criteria

- [ ] CI/CD pipeline runs on all commits
- [ ] Docker containers build successfully
- [ ] Frontend deploys to Vercel automatically
- [ ] Backend deploys to Railway/Cloud Run
- [ ] Environment variables managed securely
- [ ] Monitoring captures all errors
- [ ] Logs aggregated centrally
- [ ] Database backups run daily
- [ ] Rollback procedures tested successfully

---

**Document Status**: Draft v1.0.0  
**Next Review**: 2026-03-08  
**Maintained By**: Agent Alchemy DevOps Team
