# Architecture Phase: AI Agent Activity Dashboard

## Overview

This directory contains the 8 architecture specification artifacts for the **AI Agent Activity Dashboard** feature in the `agent-alchemy-dev` product. These specifications define the complete technical design for a real-time dashboard that surfaces AI agent activity including developer-log notes, GitHub work items, decisions, questions, and per-agent metadata across multiple concurrent agents.

**Architecture Decision**: Hybrid Supabase Realtime Dashboard (Proposal 3)  
**Application**: `apps/agent-alchemy-dev` (Angular 18)  
**Phase**: Architecture (Phase 3 of Agent Alchemy workflow)  
**Status**: Draft — ready for Developer phase

---

## Technology Choices

| Concern | Technology | Version | Rationale |
|---------|-----------|---------|-----------|
| Frontend framework | Angular | ~18.2.0 | Existing app; Signals support |
| UI components | PrimeNG | 18.0.2 | Timeline, DataView, Tag — already installed |
| State management | Angular Signals | Built-in | Fine-grained reactivity; no RxJS in components |
| Styling | TailwindCSS | 3.4.10 | Utility-first; existing in stack |
| Realtime transport | Supabase Realtime | Supabase project | CDC-based; zero new infrastructure |
| Database | Supabase PostgreSQL | 15 | Durable event log; SQL analytics; RLS |
| Serverless functions | Supabase Edge Functions | Deno | GitHub proxy; agent auth; webhook handler |
| Build system | Nx | 19.8.4 | Monorepo; affected commands; library structure |
| Error tracking | Datadog Browser RUM | 4.18.1 | Already in stack |
| Hosting | Vercel | — | Existing deployment target |
| Agent SDK | `@agent-alchemy/agent-sdk` | 1.0.0 | Typed write API for AI agents |

---

## Specification Files

### 01 — System Architecture
**File**: [`system-architecture.specification.md`](./system-architecture.specification.md)

Defines the complete system design using the C4 model:
- **C4 Level 1** (System Context): External actors (human operators, AI agents, GitHub API) and system boundary
- **C4 Level 2** (Container Diagram): Angular SPA, Supabase PostgreSQL, Supabase Realtime, Edge Functions
- **C4 Level 3** (Component Diagram): Angular component tree, service dependencies, Supabase client wiring
- Technology choices with rationale for all major decisions
- Data flow diagrams: agent write path, dashboard read path, GitHub enrichment path
- Non-functional architecture considerations: performance, resilience, security, scalability

---

### 02 — UI Components Architecture
**File**: [`ui-components.specification.md`](./ui-components.specification.md)

Defines every Angular component with full specifications:
- **10 components**: `DashboardComponent`, `AgentGridComponent`, `AgentCardComponent`, `ActivityPanelComponent`, `ActivityFeedComponent`, `ActivityEntryComponent`, `GitHubWorkItemComponent`, `FilterSidebarComponent`, `AgentStatusBadgeComponent`, `EmptyStateComponent`
- Full TypeScript class signatures, Input/Output signals, HTML template structure
- `ChangeDetectionStrategy.OnPush` on all components
- Signal-based state management patterns (no RxJS in component layer)
- Angular routing configuration (lazy-loaded `/dashboard` route — documented, not modified)
- PrimeNG component usage summary (Timeline, Tag, Badge, Avatar, Skeleton, etc.)
- TypeScript model definitions (`Agent`, `FilterConfig`)
- Accessibility requirements (ARIA, keyboard navigation, WCAG 2.1 AA)

---

### 03 — Database Schema
**File**: [`database-schema.specification.md`](./database-schema.specification.md)

Complete PostgreSQL schema with full DDL:
- **4 tables**: `agent_registry`, `agent_sessions`, `activity_entries`, `github_work_items`
- Full `CREATE TABLE` DDL with constraints, check constraints, comments, and triggers
- Row Level Security (RLS) policies for all 4 tables (org-scoped isolation)
- Supabase Realtime publication configuration
- TypeScript interface definitions for all tables
- `active_agent_dashboard_view` — denormalized view for fast initial load
- Migration file naming strategy and execution commands
- Index strategy for dashboard queries (9 targeted indexes)
- 90-day retention policy with cleanup function
- Entity Relationship Diagram (ASCII art)

---

### 04 — API Specifications
**File**: [`api-specifications.specification.md`](./api-specifications.specification.md)

Documents all APIs in the system:
- **Agent SDK REST API** (5 Supabase REST endpoints with full request/response TypeScript types):
  - `POST /rest/v1/agent_registry` — register agent
  - `POST /rest/v1/agent_sessions` — open session
  - `PATCH /rest/v1/agent_sessions?id=eq.{id}` — heartbeat/status/close
  - `POST /rest/v1/activity_entries` — post activity (log, decision, question, github_action, status_change)
  - `GET /rest/v1/active_agent_dashboard_view` — dashboard initial load
- **3 Edge Functions** (`agent-auth`, `github-proxy`, `webhook-handler`) with full implementation notes
- **Angular Service Methods** (DashboardService, AgentRealtimeService, GitHubEnrichmentService)
- **Agent SDK TypeScript API** (`AgentSession.open()`, `.log()`, `.decide()`, `.ask()`, `.close()`)
- Error codes and HTTP status codes for all endpoints

---

### 05 — Security Architecture
**File**: [`security-architecture.specification.md`](./security-architecture.specification.md)

Complete security design:
- **4 authentication layers**: Human operators (Supabase Auth), AI agents (API key → JWT), GitHub proxy (server-side PAT), webhooks (HMAC-SHA256)
- JWT claims structure for both operator and agent JWTs
- Authorization matrix (operator / agent / service role permissions)
- Data protection: sensitive data inventory, content sanitization patterns, Realtime channel isolation
- **STRIDE threat model** across 5 attack surfaces (AS-1 through AS-5)
- Security configuration checklist (RLS verification, CSP headers, Vercel headers config)
- Secret rotation procedures for all credentials
- Compliance considerations (GDPR, SOC 2)

---

### 06 — Business Logic
**File**: [`business-logic.specification.md`](./business-logic.specification.md)

Complete Angular service implementation logic:
- **`ActivityEntry` discriminated union** type system: `LogEntry | DecisionEntry | QuestionEntry | GitHubActionEntry | StatusChangeEntry | MilestoneEntry | ErrorEntry` with type guards and DB row mapper
- **`DashboardService`**: Full implementation with Signal state (`_agents`, `_selectedAgentId`, `_filterConfig`, `_activityEntries`), computed signals (`filteredAgents`, `selectedAgent`, `alertAgents`, `openQuestionsCount`), `effect()` for auto-loading activity on agent selection
- **`AgentRealtimeService`**: Supabase Realtime channel setup, `handleActivityEntry`/`handleSessionChange` handlers, exponential backoff reconnection (max 5 retries, 1s/2s/4s/8s/16s delays with ±500ms jitter), catch-up query on reconnect
- **`GitHubEnrichmentService`**: LRU cache (50 items, 5-min TTL), in-flight deduplication Map, `parseGitHubUrl()` parser
- Business rules implementation summary table (10 rules mapped to code locations)
- `FilterConfig` logic (AND-based filtering, empty = show all)
- Offline detection (client-side, heartbeat age > 2 minutes)

---

### 07 — DevOps and Deployment
**File**: [`devops-deployment.specification.md`](./devops-deployment.specification.md)

Infrastructure and deployment configuration:
- **Nx library structure**: `libs/agency/agent-dashboard/` with `project.json` targets (build, test, lint), import path `@buildmotion-ai/agent-dashboard`, public API exports
- **`tsconfig.base.json`** path mapping addition
- **Supabase setup**: Environment variables, secrets configuration, project setup commands
- **Migration workflow**: File naming, `supabase db push`, local reset, validation
- **Edge Functions deployment**: `supabase functions deploy`, local serve commands
- **3 GitHub Actions workflows**: CI (lint/test/build affected), Production deploy (Supabase migrations + Vercel), Staging deploy
- Environment strategy (local/staging/production) with Supabase project separation
- Required GitHub Secrets table (12 secrets with scope and description)
- Local development setup commands (start Supabase, apply migrations, serve functions, run Angular)
- Monitoring: Datadog custom metrics, connection health indicator component, Supabase dashboard metrics, alerting rules
- Agent SDK package deployment workflow
- Performance SLOs table

---

### 08 — Architecture Decisions (ADRs)
**File**: [`architecture-decisions.specification.md`](./architecture-decisions.specification.md)

10 Architecture Decision Records (MADR format):

| ADR | Decision |
|-----|---------|
| ADR-001 | Supabase Realtime for agent-to-dashboard transport |
| ADR-002 | Angular Signals over RxJS for state management |
| ADR-003 | PrimeNG Timeline for activity feed |
| ADR-004 | Supabase Edge Functions as GitHub API proxy |
| ADR-005 | Event-sourced append-only activity log |
| ADR-006 | Row Level Security for multi-tenancy |
| ADR-007 | Agent SDK as separate `libs/` package |
| ADR-008 | PostgreSQL for activity persistence |
| ADR-009 | Read-only dashboard in v1.0 |
| ADR-010 | Lazy-loaded `/dashboard` route |

Each ADR includes: context, options considered, decision, rationale (5 points), and consequences (positive and negative).

---

## Architecture Principles Applied

| Principle | How Applied |
|-----------|------------|
| **Single Responsibility** | Each of the 8 spec files covers exactly one architectural domain; each Angular service owns one concern |
| **Open/Closed** | `ActivityEntry` discriminated union: new types added without modifying existing type guards or components |
| **Dependency Inversion** | Components depend on Signal abstractions from services, not on Supabase directly; `SUPABASE_CLIENT` injection token |
| **Separation of Concerns** | Read path (dashboard UI + Realtime) and write path (agent SDK + REST) are completely separate systems |
| **Event Sourcing** | `activity_entries` is append-only; complete audit trail; no mutable state in the event log |
| **Defence in Depth** | RLS + JWT org claim + org-namespaced Realtime channels = three independent isolation layers |
| **Fail Safe** | GitHub enrichment failure → degraded mode (URL only); Realtime disconnect → catch-up query on reconnect |
| **Least Privilege** | Agents can only write their own sessions; operators read-only; GitHub token scoped to read |

---

## Plan Phase References

These architecture specifications are derived from and traceable to:

| Plan Artifact | Key Decisions Derived |
|--------------|----------------------|
| `plan/functional-requirements.specification.md` | FR-001 (agent cards) → AgentCardComponent; FR-002 (activity feed) → ActivityFeedComponent; FR-003 (GitHub enrichment) → GitHubEnrichmentService |
| `plan/non-functional-requirements.specification.md` | NFR-001 (performance) → OnPush + VirtualScroll + LRU cache; NFR-003 (security) → STRIDE model, RLS, JWT |
| `plan/ui-ux-workflows.specification.md` | Two-panel layout → DashboardComponent; agent card metadata → AgentCardComponent fields |
| `plan/business-rules.specification.md` | BR-007 (append-only) → ADR-005; BR-008 (90-day retention) → retention policy SQL |
| `plan/implementation-sequence.specification.md` | 14-week phases → library structure; Phase 1 = DB migrations, Phase 2 = services, Phase 3 = components |
| `plan/constraints-dependencies.specification.md` | `@supabase/supabase-js ^2.52.0` already installed → no version conflicts; Angular 18 required |
| `research/data-model-research.md` | Schema Option C (Normalized Event-Sourced) → `database-schema.specification.md` DDL |
| `research/implementation-recommendations.md` | PrimeNG Timeline, Angular Signals, Edge Function proxy → technology choices in all specs |

---

## Next Steps: Developer Phase (Phase 4)

The Developer Agent will implement the specifications in this directory in the following order:

1. **Supabase Database Migrations** (Phase 4, Week 1-2)
   - Execute `supabase/migrations/20260313*.sql` in order
   - Verify RLS policies with test queries
   - Enable Realtime publication

2. **Supabase Edge Functions** (Phase 4, Week 2-3)
   - Implement `agent-auth`, `github-proxy`, `webhook-handler`
   - Deploy to staging Supabase project
   - Test with `supabase functions invoke`

3. **Nx Library Scaffold** (Phase 4, Week 3)
   - Create `libs/agency/agent-dashboard/` with `project.json`
   - Add `tsconfig.base.json` path mapping
   - Create barrel `index.ts`

4. **Models and Services** (Phase 4, Week 4-6)
   - Implement `ActivityEntry` discriminated union + `mapRowToActivityEntry()`
   - Implement `DashboardService` with Signals
   - Implement `AgentRealtimeService` with reconnection
   - Implement `GitHubEnrichmentService` with LRU cache

5. **Angular Components** (Phase 4, Week 7-10)
   - Implement all 10 components in order (bottom-up: badges/empty → cards → grid → feed → panels → shell)
   - Unit tests for all components and services

6. **Agent SDK** (Phase 4, Week 11-12)
   - Create `libs/agent-alchemy/agent-sdk/`
   - Implement `AgentSession` class
   - Publish to npm (internal or public)

7. **Integration Testing and Polish** (Phase 4, Week 13-14)
   - End-to-end test with real Supabase project
   - Performance testing (50 concurrent agents)
   - Accessibility audit (WCAG 2.1 AA)
   - Security review

---

*Generated by Agent Alchemy Architecture Agent — Phase 3*  
*Date: 2026-03-13*  
*Product: agent-alchemy-dev*  
*Feature: agent-dashboard*
