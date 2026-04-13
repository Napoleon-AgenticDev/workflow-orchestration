# Alchemy Flow - AI Workflow Orchestration Engine

A visual workflow orchestration tool for AI agents with drag-and-drop editor, JSON/TypeScript workflow definitions, and scheduled execution. Built with Angular + NestJS on NX workspace.

## Features

- **Visual Workflow Editor** - Drag-and-drop node-based editor for building workflows
- **Node Types**: Skill, Agent, API, Condition, Delay, Transform
- **Workflow Scheduling** - Cron-based scheduling for automated execution
- **Execution History** - Track workflow runs with detailed status
- **Type-Safe JSON** - Strongly typed workflow definitions
- **PostgreSQL Backend** - Persistent storage with TypeORM

## Tech Stack

- **Frontend**: Angular 21, standalone components
- **Backend**: NestJS, TypeORM
- **Database**: PostgreSQL
- **Build**: NX monorepo

## Quick Start

```bash
# Install dependencies
cd alchemy-flow
npm install

# Run development server (frontend)
npm start

# Run API server (needs PostgreSQL)
cd apps/server
npm run serve
```

## Database Setup

```bash
# Create PostgreSQL database
createdb alchemy_flow

# Run migrations (auto-sync enabled)
# Or use schema.sql in apps/server/src/schema.sql
```

## Environment Variables

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=alchemy_flow
PORT=3000
```

## Project Structure

```
alchemy-flow/
├── src/app/              # Angular frontend
│   ├── pages/            # Workflows, Editor, Executions, Schedules
│   ├── services/         # API service
│   └── models/           # TypeScript interfaces
├── apps/server/          # NestJS backend
│   └── src/app/
│       ├── workflows/    # Workflow CRUD
│       ├── executions/   # Execution tracking
│       └── schedules/    # Cron scheduling
└── SPEC.md              # Detailed specification
```

## GitHub Pages

The frontend builds to `dist/alchemy-flow/browser` and can be deployed to GitHub Pages.

---

**Repo**: https://github.com/Napoleon-AgenticDev/workflow-orchestration