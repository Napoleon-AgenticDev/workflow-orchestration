---
meta:
  id: agent-dashboard-architecture-decisions
  title: Architecture Decisions (ADRs) - AI Agent Activity Dashboard
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:agent-alchemy-dev
  tags: [agent-dashboard, architecture, adr, decisions, rationale]
  createdBy: Agent Alchemy Architecture
  createdAt: '2026-03-13'
  reviewedAt: null
title: Architecture Decisions (ADRs) - AI Agent Activity Dashboard
category: Products
feature: agent-dashboard
lastUpdated: '2026-03-13'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: architecture
applyTo: []
keywords: [adr, architecture-decisions, supabase, angular, signals, primeng, realtime, rls]
topics: []
useCases: []
references:
  - .agent-alchemy/specs/stack/stack.json
depends-on:
  - plan/functional-requirements.specification.md
  - plan/non-functional-requirements.specification.md
  - research/implementation-recommendations.md
  - architecture/system-architecture.specification.md
specification: 08-architecture-decisions
---

# Architecture Decisions (ADRs): AI Agent Activity Dashboard

## Overview

**Purpose**: Document the 10 key architecture decisions made for the AI Agent Activity Dashboard, each with context, decision rationale, and consequences (positive and negative).

**Format**: [MADR-style](https://adr.github.io/madr/) — Markdown Architectural Decision Records.

**Status**: All ADRs in this document have status **Accepted** unless otherwise noted.

---

## ADR Index

| ADR | Decision | Status |
|-----|---------|--------|
| ADR-001 | Use Supabase Realtime for agent-to-dashboard transport | Accepted |
| ADR-002 | Angular Signals over RxJS for dashboard state management | Accepted |
| ADR-003 | PrimeNG Timeline for activity feed rendering | Accepted |
| ADR-004 | Supabase Edge Functions as GitHub API proxy | Accepted |
| ADR-005 | Event-sourced immutable activity log (append-only) | Accepted |
| ADR-006 | Row Level Security for multi-tenancy (not application-layer auth) | Accepted |
| ADR-007 | Agent SDK as separate `libs/` package | Accepted |
| ADR-008 | PostgreSQL for activity persistence (not Redis/in-memory) | Accepted |
| ADR-009 | Read-only dashboard in v1.0 (no agent control plane) | Accepted |
| ADR-010 | Lazy-loaded `/dashboard` route (not standalone page) | Accepted |

---

## ADR-001: Use Supabase Realtime for Agent-to-Dashboard Transport

**Date**: 2026-03-13  
**Status**: Accepted  
**Deciders**: Architecture Agent (Phase 3)  
**Related to**: `architecture/system-architecture.specification.md`, `research/implementation-recommendations.md`

### Context

The AI Agent Activity Dashboard requires real-time updates from potentially 50+ concurrent AI agents posting activity entries continuously. Multiple transport options were evaluated:

| Option | Description |
|--------|------------|
| A | Custom WebSocket server (Node.js/Socket.io) |
| B | Server-Sent Events (SSE) from a custom backend |
| **C** | **Supabase Realtime (PostgreSQL CDC / logical replication)** |
| D | Polling (HTTP GET every N seconds) |
| E | Redis pub/sub + custom server |

### Decision

**Use Supabase Realtime** (Option C) for real-time agent activity delivery to the dashboard.

Agents write activity entries to Supabase PostgreSQL via REST API. The Supabase Realtime service automatically delivers INSERT events to subscribed dashboard clients via WebSocket using PostgreSQL Change Data Capture (CDC).

### Rationale

1. **No additional infrastructure**: `@supabase/supabase-js ^2.52.0` is already a declared dependency. Zero new packages required.
2. **Tight integration with persistence**: The same database that stores entries broadcasts their creation — no synchronization lag between stored data and live updates.
3. **Managed WebSocket server**: Supabase handles connection management, reconnection, and scaling — no custom server to maintain.
4. **org_id filtered channels**: Built-in multi-tenant partitioning via `filter: org_id=eq.{orgId}` prevents cross-org event leakage.
5. **Automatic catch-up**: On reconnect, the dashboard performs a catch-up query using the last known timestamp — no events lost during brief disconnections.

### Consequences

**Positive**:
- Dashboard and agents share one infrastructure provider (Supabase) — reduced operational complexity.
- Realtime delivery latency is typically < 100ms for INSERT events.
- No server-side code needed for the transport layer itself.
- RLS enforced on Realtime events — same security model as REST.

**Negative**:
- Supabase Realtime concurrent connection limits vary by project tier (Free: 200, Pro: 500, Team: 1000). Large deployments may need tier upgrades.
- CDC-based delivery does not guarantee strict ordering under very high write concurrency (> 100 inserts/second per table). Acceptable for dashboard UX — chronological ordering is maintained by `timestamp` field, not delivery order.
- Supabase Realtime is a managed service — outages are outside our control. Mitigation: exponential backoff reconnection + catch-up query.
- Dashboard is coupled to Supabase as a vendor. Switching would require replacing both DB and Realtime transport.

---

## ADR-002: Angular Signals over RxJS for Dashboard State Management

**Date**: 2026-03-13  
**Status**: Accepted  
**Deciders**: Architecture Agent (Phase 3)  
**Related to**: `architecture/ui-components.specification.md`, `architecture/business-logic.specification.md`

### Context

The dashboard needs to manage complex, frequently-changing state from multiple sources (initial DB load, Realtime stream, user interactions). Angular 18 offers two paradigms:

| Option | Description |
|--------|------------|
| A | RxJS BehaviorSubjects + async pipe |
| **B** | **Angular Signals (signal, computed, effect)** |
| C | NgRx Store (Redux pattern) |
| D | Hybrid: Signals in components, RxJS in services |

The codebase is Angular 18.2.0 — Signals are stable and production-ready.

### Decision

**Use Angular Signals exclusively** for all dashboard state. RxJS is permitted only within `AgentRealtimeService` internals for bridging Supabase Realtime events to signals.

### Rationale

1. **No subscription management**: Signals are automatically tracked; no `takeUntil`, `destroy$`, or `async` pipe required. Fewer memory leak opportunities.
2. **OnPush + Signals is optimal for high-frequency updates**: Angular's change detection only re-runs component views when signals accessed in the template change. With 50 agents each sending updates every few seconds, this avoids unnecessary re-renders.
3. **Fine-grained reactivity**: `computed()` signals only recalculate when their dependencies change — `filteredAgents` only recomputes when `_agents` or `_filterConfig` signals change.
4. **Simpler mental model for developers**: `signal()`, `computed()`, `effect()` — three primitives. No operators, mergeMap, switchMap, or marble diagrams.
5. **Angular 18 idiomatic**: Angular is moving towards Signals as the primary reactivity primitive. No RxJS dependencies needed for new Angular 18+ code.

### Consequences

**Positive**:
- Components are simpler (no `| async` pipe, no subscription cleanup).
- State changes are predictable and traceable.
- `computed()` prevents redundant computation automatically.
- Testing is straightforward: set signal values, assert computed outputs.

**Negative**:
- Angular Signals require Angular 18+. Not portable to Angular 16 or earlier.
- Bridging Supabase Realtime events (callback-based) to Signals requires `NgZone.run()` or `effect()` to trigger Angular change detection outside Angular's zone. Requires care to avoid `ExpressionChangedAfterItHasBeenCheckedError`.
- Developers unfamiliar with Signals need a learning curve (estimated < 1 day).
- No built-in time-travel debugging or DevTools equivalent to NgRx Store DevTools (acceptable — dashboard is not a financial system).

---

## ADR-003: PrimeNG Timeline for Activity Feed Rendering

**Date**: 2026-03-13  
**Status**: Accepted  
**Deciders**: Architecture Agent (Phase 3)  
**Related to**: `architecture/ui-components.specification.md`

### Context

The activity feed requires a chronological, visually distinct timeline of entries with support for:
- Different entry types (log, decision, question, GitHub action)
- High entry counts (100+ visible, 1000+ per session)
- Real-time appending of new entries
- Custom content per entry type

Options evaluated:

| Option | Description |
|--------|------------|
| A | Custom CSS `<ul>/<li>` timeline |
| **B** | **PrimeNG `p-timeline`** |
| C | Angular Material CDK virtual scroll list |
| D | Custom D3.js timeline |

### Decision

**Use PrimeNG `p-timeline`** for activity feed display, combined with PrimeNG `p-scroller` for virtual scrolling when entry count exceeds visible area.

### Rationale

1. **Already installed**: PrimeNG 18.0.2 is in `package.json`. Zero additional bundle impact.
2. **Angular 18 compatible**: PrimeNG 18 is built specifically for Angular 18 with standalone component support.
3. **Template customization**: `p-timeline` supports `ng-template` for content and marker slots — each entry type can have a fully custom template.
4. **Alignment support**: Left-aligned timeline (single column) fits the narrow right panel layout.
5. **Accessibility**: PrimeNG timeline includes ARIA roles for screen reader accessibility.
6. **Consistent UI**: Using PrimeNG throughout (Tag, Badge, Card, Timeline) maintains design system consistency.

### Consequences

**Positive**:
- Significant UI code reduction vs. custom implementation.
- Built-in marker styling and connector lines.
- PrimeNG's virtual scroller handles 1000+ entries without layout jank.

**Negative**:
- PrimeNG `p-timeline` does not natively support "append to end" without a full re-render. Workaround: use `trackBy` on the `@for` loop over entries to minimize DOM mutations.
- PrimeNG theming requires configuration in `angular.json` (PrimeNG CSS bundle). May require CSS custom properties override for brand colours.
- PrimeNG adds ~50KB gzipped to the lazy-loaded chunk. Acceptable given the feature's scope.

---

## ADR-004: Supabase Edge Functions as GitHub API Proxy

**Date**: 2026-03-13  
**Status**: Accepted  
**Deciders**: Architecture Agent (Phase 3)  
**Related to**: `architecture/security-architecture.specification.md`, `architecture/api-specifications.specification.md`

### Context

The dashboard needs to display enriched GitHub issue/PR data. Calling the GitHub API directly from the browser requires a GitHub token in the Angular build or exposes a user OAuth flow. Options:

| Option | Description |
|--------|------------|
| A | GitHub OAuth in browser (user grants token) |
| B | GitHub App with server-side token exchange |
| **C** | **Supabase Edge Function proxy (server-side PAT)** |
| D | No GitHub enrichment (show only URL links) |

### Decision

**Use Supabase Edge Functions** (`github-proxy`) as a server-side proxy for all GitHub API calls. A GitHub Personal Access Token (or GitHub App token) is stored as a Supabase secret and used exclusively within the Edge Function.

### Rationale

1. **GitHub token never in browser**: The PAT is stored in Supabase secrets vault; the Angular app never receives it.
2. **Co-location**: Edge Functions run within the same Supabase project as the database — no separate backend service to deploy or manage.
3. **SSRF-safe**: The Edge Function implements a strict endpoint whitelist, preventing SSRF attacks.
4. **ETag caching**: Edge Functions can cache GitHub API responses with HTTP ETags to reduce rate limit consumption.
5. **Deno runtime**: Edge Functions run in Deno — V8 isolates with fast cold starts (~100-200ms) — acceptable for the enrichment use case (not on critical render path).

### Consequences

**Positive**:
- Clean security boundary — GitHub credentials never touch the browser.
- Easy to rotate GitHub token without redeploying the Angular app.
- Webhook-handler Edge Function can also update the `github_work_items` cache, so frequently-referenced items are pre-warmed.

**Negative**:
- Edge Function cold start latency (~100-200ms) on first call. Subsequent calls are warm.
- Supabase Edge Functions use Deno, not Node.js — some Node.js packages are incompatible. GitHub API calls use native Deno `fetch()` — fully compatible.
- Edge Functions have a default 4-second timeout. Complex GitHub API chains must complete within this limit.
- GitHub PAT has org-wide read access — if leaked from Supabase secrets, it could read all repos. Mitigation: use a scoped GitHub App token or fine-grained PAT in production.

---

## ADR-005: Event-Sourced Immutable Activity Log (Append-Only)

**Date**: 2026-03-13  
**Status**: Accepted  
**Deciders**: Architecture Agent (Phase 3)  
**Related to**: `architecture/database-schema.specification.md`, `plan/business-rules.specification.md`

### Context

The `activity_entries` table must store a complete history of AI agent actions. Two design approaches were considered:

| Option | Description |
|--------|------------|
| A | Mutable state table (UPDATE rows to change status, answer questions) |
| **B** | **Append-only event log (never UPDATE, never DELETE in normal flow)** |

### Decision

**Adopt an append-only event log pattern** for `activity_entries`. The table is never updated (except by service role for retention cleanup). Question answers are stored in the initial entry row (not via UPDATE — the SDK posts the answer via a new PATCH operation to the activity_entries row for the question entry).

Note: `question_status` and `answer` fields in `activity_entries` are technically updated by the `service_role` when a question is answered. This is the only exception to append-only, and it is enforced by only granting UPDATE to the service role.

### Rationale

1. **Complete audit trail**: Every agent action is permanently recorded. Operators can reconstruct exactly what an agent did and why at any point in time.
2. **Realtime compatibility**: INSERT-based events are the natural trigger for Supabase Realtime CDC. UPDATE events are also supported but add complexity.
3. **Simpler conflict resolution**: No UPDATE races between concurrent agents. Each agent only inserts its own rows.
4. **Event sourcing enables replay**: If the dashboard view logic changes, historical entries can be reprocessed to build new derived views.
5. **PostgreSQL rules enforce constraint**: `no_update_activity_entries` and `no_delete_activity_entries` rules prevent accidental modifications at the DB level.

### Consequences

**Positive**:
- Perfect audit trail — complete session history always available.
- No UPDATE lock contention in high-write scenarios.
- Enables future analytics (e.g., "decisions per agent per day").
- Aligns with CQRS pattern — clean separation of write (agent SDK) and read (dashboard).

**Negative**:
- Table grows continuously — requires 90-day retention policy and regular cleanup.
- Cannot "undo" a mistakenly posted entry without service role access. Agents must post a corrective entry instead.
- Schema migrations that add new columns to `activity_entries` require careful backward compatibility (new columns must be nullable to avoid breaking existing agents).

---

## ADR-006: Row Level Security for Multi-Tenancy (Not Application-Layer Auth)

**Date**: 2026-03-13  
**Status**: Accepted  
**Deciders**: Architecture Agent (Phase 3)  
**Related to**: `architecture/security-architecture.specification.md`, `architecture/database-schema.specification.md`

### Context

The dashboard must support multiple organizations (`org_id`) with strict data isolation. Approaches:

| Option | Description |
|--------|------------|
| A | Application-layer filtering: all queries include `WHERE org_id = ?` |
| **B** | **PostgreSQL RLS: org_id isolation enforced at DB layer** |
| C | Separate database per org |
| D | Schema-per-org (PostgreSQL schema isolation) |

### Decision

**Use PostgreSQL Row Level Security (RLS)** on all four tables. `org_id` isolation is enforced at the database layer — not in application code.

### Rationale

1. **Defense in depth**: Even if application code has a bug omitting the `org_id` filter, RLS prevents cross-org data leakage at the database layer.
2. **JWT claim integration**: Supabase RLS reads `(auth.jwt() ->> 'org_id')` directly from the authenticated JWT — no application-layer org management needed.
3. **Supabase native**: Supabase is designed around RLS — the `anon` key + RLS is the standard pattern. Aligns with Supabase documentation and best practices.
4. **Simpler application code**: Services don't need to include `org_id` filters in every query — RLS applies transparently.
5. **No per-org infrastructure**: One Supabase project serves all orgs. No provisioning required when a new org is onboarded.

### Consequences

**Positive**:
- Org isolation is guaranteed at the database layer — cannot be bypassed by application bugs.
- New orgs are automatically isolated without any code changes.
- Auditing org access is possible via Supabase audit logs.

**Negative**:
- RLS adds per-query overhead (~10-15% latency increase). Acceptable for dashboard query volumes.
- RLS policies must be tested carefully — a misconfigured policy can silently return no data or expose wrong data.
- Developers must understand RLS to write correct policies and test them in isolation.
- Service Role bypass is powerful — Edge Functions using service role must be carefully scoped to prevent accidental cross-org access.

---

## ADR-007: Agent SDK as Separate `libs/` Package

**Date**: 2026-03-13  
**Status**: Accepted  
**Deciders**: Architecture Agent (Phase 3)  
**Related to**: `architecture/api-specifications.specification.md`, `architecture/devops-deployment.specification.md`

### Context

AI agents need a way to post activity to the dashboard. Two approaches:

| Option | Description |
|--------|------------|
| A | Agents call Supabase REST API directly (no SDK) |
| B | SDK embedded in each agent's codebase (copy-pasted) |
| **C** | **Separate npm package `@agent-alchemy/agent-sdk` published from `libs/`** |

### Decision

**Create a separate Nx library** (`libs/agent-alchemy/agent-sdk`) and publish it as `@agent-alchemy/agent-sdk` on npm. Agents install the package and use its typed API rather than calling Supabase REST directly.

### Rationale

1. **Stable API contract**: Agents depend on the SDK's semantic version, not on internal Supabase table structures. Breaking DB changes don't break agents immediately.
2. **Content sanitization**: The SDK sanitizes activity entry content (removes secrets) before posting. Without SDK enforcement, agents might inadvertently log credentials.
3. **Authentication abstraction**: The SDK handles JWT acquisition and refresh transparently. Agents provide `agentId` + `agentSecret` once; the SDK manages token lifecycle.
4. **TypeScript-first**: Full type definitions for all entry types (`LogEntry`, `DecisionEntry`, etc.). Agents get IDE autocomplete and compile-time safety.
5. **Versioning**: `@agent-alchemy/agent-sdk@1.x` is a stable contract. The dashboard can evolve to v2 internally without forcing all agents to update immediately.

### Consequences

**Positive**:
- Agent developers have a simple, documented API: `session.log()`, `session.decide()`, `session.ask()`.
- Secrets are never exposed in activity content — enforced at the SDK layer.
- SDK abstracts Supabase specifics — if Supabase is replaced, only the SDK changes.

**Negative**:
- Additional package to publish, version, and maintain.
- SDK and dashboard must share TypeScript type definitions (mitigated by a shared `libs/agent-alchemy/types` package).
- Agents must `npm install @agent-alchemy/agent-sdk` — adds a production dependency.
- Breaking SDK changes require a major version bump and coordinated agent updates.

---

## ADR-008: PostgreSQL for Activity Persistence (Not Redis/In-Memory)

**Date**: 2026-03-13  
**Status**: Accepted  
**Deciders**: Architecture Agent (Phase 3)  
**Related to**: `architecture/database-schema.specification.md`

### Context

Activity entries need to be stored somewhere. Alternatives:

| Option | Description |
|--------|------------|
| A | Redis pub/sub + in-memory state (no persistence) |
| B | Redis + RDB snapshots (semi-persistent) |
| **C** | **PostgreSQL (Supabase managed) — durable persistence** |
| D | MongoDB/document store |
| E | Apache Kafka + ClickHouse |

### Decision

**Use Supabase PostgreSQL** for all activity persistence.

### Rationale

1. **Durable, queryable history**: PostgreSQL stores the complete 90-day activity history. Operators can query historical sessions, filter by type, export data.
2. **SQL for analytics**: Future analytics features (e.g., agent performance metrics, decision confidence trends) can be built with SQL queries and views.
3. **JSONB flexibility**: The `metadata` JSONB column allows type-specific extensions without schema migrations.
4. **ACID transactions**: Session opens, heartbeats, and activity entries have consistent transactional semantics.
5. **One infrastructure provider**: PostgreSQL is already in use via Supabase. No additional infrastructure (Redis, Kafka) to operate.
6. **Realtime integration**: Supabase Realtime reads from PostgreSQL CDC — persistence and real-time delivery are unified.

### Consequences

**Positive**:
- Full activity history queryable at any time.
- Built-in backup and point-in-time recovery (Supabase managed).
- Standard SQL tooling for debugging and analytics.

**Negative**:
- Higher write latency than Redis (~5-15ms vs ~1ms). Acceptable — agents don't need sub-millisecond write acknowledgement.
- PostgreSQL requires careful index management for high-write workloads.
- 90-day retention policy required to prevent unbounded table growth.
- Schema migrations require coordination with running agents.

---

## ADR-009: Read-Only Dashboard in v1.0 (No Agent Control Plane)

**Date**: 2026-03-13  
**Status**: Accepted  
**Deciders**: Architecture Agent (Phase 3), Product (per `plan/functional-requirements.specification.md`)  
**Related to**: `plan/functional-requirements.specification.md`, `plan/non-functional-requirements.specification.md`

### Context

The dashboard could provide operator controls to interact with running agents:
- Cancel / pause an agent's session
- Dismiss questions automatically
- Send commands to agents

Operators specifically requested agent visibility — not a control plane — in the initial requirements.

### Decision

**v1.0 dashboard is read-only**. Operators can view agent status and activity but cannot send commands to, pause, or terminate agents. Question answering is explicitly excluded from v1.0 scope (per `plan/functional-requirements.specification.md`).

### Rationale

1. **Scope control**: A control plane requires bidirectional communication (agent must receive and process commands), significantly increasing SDK complexity and safety requirements.
2. **Safety**: Operators accidentally cancelling or modifying agent state could cause data loss or incomplete work. Read-only prevents accidental harm.
3. **Faster delivery**: Read-only MVP can be delivered in 14 weeks (per `plan/implementation-sequence.specification.md`). Adding control plane adds estimated 6+ weeks.
4. **Requirements alignment**: `plan/functional-requirements.specification.md` FR-008 explicitly states "operators can view open questions; answering questions is out of scope for v1.0."
5. **Clean architecture**: Read path (dashboard) and write path (agents) are cleanly separated. Adding control plane later is a well-defined extension point.

### Consequences

**Positive**:
- Simpler architecture — no bidirectional agent communication protocol needed.
- No accidental agent interference by operators.
- Faster delivery of core visibility value.

**Negative**:
- Operators cannot directly respond to agent questions in v1.0 — must use out-of-band communication (Slack, etc.).
- Agents blocked on questions will remain blocked until they time out or the agent developer intervenes.
- v2.0 control plane feature will require SDK upgrades for all deployed agents.

**v2.0 Extension Point**: A `agent_commands` table and corresponding Realtime channel can be added without modifying any v1.0 tables or APIs.

---

## ADR-010: Lazy-Loaded `/dashboard` Route (Not Standalone Page)

**Date**: 2026-03-13  
**Status**: Accepted  
**Deciders**: Architecture Agent (Phase 3)  
**Related to**: `architecture/ui-components.specification.md`, `architecture/devops-deployment.specification.md`

### Context

The dashboard could be deployed as:

| Option | Description |
|--------|------------|
| A | Standalone SPA (separate `apps/` app at its own URL) |
| **B** | **Lazy-loaded route `/dashboard` within `apps/agent-alchemy-dev`** |
| C | Micro-frontend (Module Federation) |

### Decision

**Implement dashboard as a lazy-loaded route** within the existing `apps/agent-alchemy-dev` Angular application, accessible at `/dashboard`.

### Rationale

1. **Existing app investment**: `apps/agent-alchemy-dev` already has authentication, routing, and Supabase integration. Reusing this infrastructure avoids duplicating auth setup.
2. **Shared dependencies**: Angular, PrimeNG, TailwindCSS, and Supabase client are already bundled. The lazy-loaded dashboard chunk is incremental.
3. **Nx monorepo alignment**: The dashboard library (`libs/agency/agent-dashboard`) is co-located with other `agency` libraries — consistent with the existing library organization.
4. **Single deployment**: One Vercel deployment serves all app routes including `/dashboard`. No separate deployment pipeline for a standalone page.
5. **Auth continuity**: Users already authenticated to `agent-alchemy-dev` automatically have access to `/dashboard` (subject to route guard). No separate login.

### Consequences

**Positive**:
- Shared auth session — no re-login for operators already using the app.
- Angular Router handles navigation between dashboard and other app features naturally.
- Single CSP header configuration covers all routes.
- Smaller initial bundle — dashboard code is loaded only when the user navigates to `/dashboard`.

**Negative**:
- Dashboard is coupled to `apps/agent-alchemy-dev` release cycle. Independent dashboard deployments are not possible without additional configuration.
- If `apps/agent-alchemy-dev` is down, the dashboard is also unavailable. Acceptable — both serve the same users.
- Lazy-loaded chunk must be < 300KB gzipped to meet performance targets (monitored via Nx build output).

---

## Decision Summary Matrix

| ADR | Options Considered | Chosen | Primary Driver |
|-----|------------------|--------|----------------|
| ADR-001 | Custom WS, SSE, Supabase Realtime, Polling, Redis | Supabase Realtime | Zero additional infra; CDC integration |
| ADR-002 | RxJS, Signals, NgRx, Hybrid | Angular Signals | OnPush + fine-grained reactivity; no subscription management |
| ADR-003 | Custom CSS, PrimeNG Timeline, CDK, D3 | PrimeNG Timeline | Already installed; template customization |
| ADR-004 | Browser OAuth, GitHub App, Edge Function proxy, No enrichment | Edge Function proxy | GitHub token never in browser |
| ADR-005 | Mutable state, Append-only event log | Append-only | Complete audit trail; INSERT-based Realtime |
| ADR-006 | App-layer filtering, RLS, Separate DB, Schema-per-org | RLS | Defense in depth; Supabase native |
| ADR-007 | Direct REST, Copy-paste, Separate npm package | Separate npm package | Stable API contract; content sanitization |
| ADR-008 | Redis, PostgreSQL, MongoDB, Kafka | PostgreSQL | Durable history; SQL analytics; unified with Realtime |
| ADR-009 | Read-only, Control plane | Read-only v1.0 | Scope control; safety; 14-week delivery |
| ADR-010 | Standalone app, Lazy route, Micro-frontend | Lazy route | Shared auth; existing infrastructure; single deployment |

---

## References

- `plan/functional-requirements.specification.md` — Feature scope driving ADR-009
- `plan/non-functional-requirements.specification.md` — Performance and security requirements driving ADR-001, ADR-006
- `research/implementation-recommendations.md` — Technology selection analysis
- `research/proposals.md` — Proposal 3 (Hybrid Supabase Realtime) selection
- `architecture/system-architecture.specification.md` — C4 diagrams reflecting these decisions
