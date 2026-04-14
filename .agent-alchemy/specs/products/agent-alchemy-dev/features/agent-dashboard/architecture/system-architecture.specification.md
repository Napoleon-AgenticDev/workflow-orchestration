---
meta:
  id: agent-dashboard-system-architecture
  title: System Architecture - AI Agent Activity Dashboard
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:agent-alchemy-dev
  tags: [agent-dashboard, architecture, angular, supabase, github, c4, system-design]
  createdBy: Agent Alchemy Architecture
  createdAt: '2026-03-13'
  reviewedAt: null
title: System Architecture - AI Agent Activity Dashboard
category: Products
feature: agent-dashboard
lastUpdated: '2026-03-13'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: architecture
applyTo: []
keywords: [agent, dashboard, monitoring, supabase, github, angular, signals, realtime, c4]
topics: []
useCases: []
references:
  - .agent-alchemy/specs/frameworks/angular/
  - .agent-alchemy/specs/stack/stack.json
depends-on:
  - plan/functional-requirements.specification.md
  - plan/non-functional-requirements.specification.md
  - research/data-model-research.md
  - research/implementation-recommendations.md
specification: 01-system-architecture
---

# System Architecture: AI Agent Activity Dashboard

## Overview

**Purpose**: Define the high-level system architecture using the C4 model for the AI Agent Activity Dashboard feature within `apps/agent-alchemy-dev`.

**Architecture Decision**: Hybrid Supabase Realtime Dashboard (Proposal 3), selected per `FEASIBILITY-SUMMARY.md`.

**Technology Stack** (from `stack.json`):
| Concern | Technology | Version |
|---------|-----------|---------|
| Frontend framework | Angular | ~18.2.0 |
| Language | TypeScript | ~5.5.2 |
| Build system | Nx | 19.8.4 |
| UI components | PrimeNG | 18.0.2 |
| Realtime / DB | Supabase (`@supabase/supabase-js`) | ^2.52.0 |
| State management | Angular Signals | Angular 18 built-in |
| Styling | TailwindCSS | 3.4.10 |
| Testing | Jest | ^29.7.0 |
| Error tracking | Datadog Browser RUM | 4.18.1 |
| Package manager | Yarn | — |

**Scope**: `apps/agent-alchemy-dev` Angular SPA + Supabase project (PostgreSQL + Realtime + Edge Functions) + GitHub REST API v3.

**Complexity**: Medium-High — real-time data transport, multi-agent concurrent state, org-scoped multi-tenancy, GitHub API enrichment.

**Estimated Effort**: 14 weeks (per `plan/implementation-sequence.specification.md`).

---

## C4 Architecture Diagrams

### Level 1: System Context Diagram

**Purpose**: Show how the AI Agent Activity Dashboard fits into the broader ecosystem of actors and external systems.

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                       C4 Level 1 — System Context                               ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║   [Person]                                                                       ║
║   Human Operator                                                                 ║
║   Engineer / Team Lead                     ┌────────────────────────────┐        ║
║   oversees autonomous                      │                            │        ║
║   AI agents                   ─── HTTP ──► │   Agent Activity           │        ║
║                                            │   Dashboard System         │        ║
║   [Person]                                 │                            │        ║
║   AI Agent Developer          ─── SDK ───► │  apps/agent-alchemy-dev   │        ║
║   integrates Agent SDK                     │  (Angular 18 SPA)         │        ║
║   into new agents                          │  +                         │        ║
║                                            │  Supabase Project          │        ║
║   [Software System]                        │  (PostgreSQL + Realtime    │        ║
║   AI Agents                  ─── REST ───► │  + Edge Functions)         │        ║
║   (any runtime: Node.js,                   │                            │        ║
║   Python, Copilot Coding Agent, etc.)      └──────────────┬─────────────┘        ║
║   Post activity via                                       │                      ║
║   @agent-alchemy/agent-sdk                               │ GitHub REST API v3    ║
║                                                          ▼                       ║
║                                               [Software System]                  ║
║                                               GitHub REST API                    ║
║                                               Issues, PRs, comments              ║
║                                               github.com/api/v3                  ║
╚══════════════════════════════════════════════════════════════════════════════════╝

Key Relationships:
  Human Operator   →  Dashboard      : Views agent status and activity via browser
  AI Agent Dev     →  Dashboard      : Accesses SDK docs; validates integration
  AI Agents        →  Dashboard      : POST activity entries via Supabase REST API
  Dashboard System →  GitHub API     : Proxied via Edge Function (server-side token)
```

**Key Actors**:
| Actor | Type | Role |
|-------|------|------|
| Human Operator | Person | Views real-time agent activity; responds to questions; monitors blockers |
| AI Agent Developer | Person | Integrates `@agent-alchemy/agent-sdk`; validates SDK behaviour |
| AI Agents | External Software System | Posts activity entries, heartbeats, session lifecycle events |
| GitHub REST API | External Software System | Source of issue/PR data; accessed via Edge Function proxy |

---

### Level 2: Container Diagram

**Purpose**: Show the high-level technical containers (deployable/runnable units) within the system boundary.

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                          C4 Level 2 — Container Diagram                              ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  ┌─────────────────────────────────────────────────────────────────────────────┐    ║
║  │  SYSTEM BOUNDARY: AI Agent Activity Dashboard                                │    ║
║  │                                                                               │    ║
║  │  ┌────────────────────────────────────────────────────────────────────────┐  │    ║
║  │  │ Container: Angular SPA                                                 │  │    ║
║  │  │ apps/agent-alchemy-dev                                                 │  │    ║
║  │  │ Technology: Angular 18 + TypeScript + PrimeNG + TailwindCSS           │  │    ║
║  │  │ Role: Browser-based dashboard UI; Supabase Realtime subscriber         │  │    ║
║  │  │                                                                        │  │    ║
║  │  │  Lazy-loaded DashboardModule (/dashboard route)                        │  │    ║
║  │  │  ├─ DashboardComponent (two-panel shell)                               │  │    ║
║  │  │  ├─ AgentGridComponent + AgentCardComponent[]                          │  │    ║
║  │  │  ├─ ActivityPanelComponent + ActivityFeedComponent                     │  │    ║
║  │  │  ├─ DashboardService (Signal coordination)                             │  │    ║
║  │  │  ├─ AgentRealtimeService (Realtime channels)                           │  │    ║
║  │  │  └─ GitHubEnrichmentService (calls github-proxy Edge Fn)              │  │    ║
║  │  └──────────────────────┬────────────────┬────────────────────────────────┘  │    ║
║  │                         │  Supabase JS   │  Supabase JS                      │    ║
║  │                  REST API + Auth    Realtime WS                               │    ║
║  │                         │                │                                    │    ║
║  │  ┌──────────────────────▼────────────────▼────────────────────────────────┐  │    ║
║  │  │ Container: Supabase Project                                             │  │    ║
║  │  │ Technology: PostgreSQL 15 + Supabase Realtime + Deno Edge Functions    │  │    ║
║  │  │                                                                         │  │    ║
║  │  │  ┌──────────────────────────────────────────────────────────────────┐  │  │    ║
║  │  │  │ Sub-container: PostgreSQL Database                                │  │  │    ║
║  │  │  │  Tables:                                                          │  │  │    ║
║  │  │  │    agent_registry       — registered agent identities            │  │  │    ║
║  │  │  │    agent_sessions       — per-session work state + heartbeat     │  │  │    ║
║  │  │  │    activity_entries     — event-sourced immutable activity log   │  │  │    ║
║  │  │  │    github_work_items    — cached GitHub issue/PR data            │  │  │    ║
║  │  │  │  Views:                                                           │  │  │    ║
║  │  │  │    active_agent_dashboard_view — joined sessions + last activity │  │  │    ║
║  │  │  └──────────────────────────────────────────────────────────────────┘  │  │    ║
║  │  │                                                                         │  │    ║
║  │  │  ┌──────────────────────────────────────────────────────────────────┐  │  │    ║
║  │  │  │ Sub-container: Supabase Realtime                                  │  │  │    ║
║  │  │  │  Channels (PostgreSQL CDC via logical replication):               │  │  │    ║
║  │  │  │    org:{orgId}:activity  — INSERT on activity_entries            │  │  │    ║
║  │  │  │    org:{orgId}:sessions  — INSERT/UPDATE on agent_sessions       │  │  │    ║
║  │  │  └──────────────────────────────────────────────────────────────────┘  │  │    ║
║  │  │                                                                         │  │    ║
║  │  │  ┌──────────────────────────────────────────────────────────────────┐  │  │    ║
║  │  │  │ Sub-container: Supabase Edge Functions (Deno runtime)            │  │  │    ║
║  │  │  │  Functions:                                                       │  │  │    ║
║  │  │  │    github-proxy        — proxies GitHub REST API calls           │  │  │    ║
║  │  │  │    webhook-handler     — processes GitHub webhooks               │  │  │    ║
║  │  │  │    agent-auth          — authenticates agents, issues JWTs       │  │  │    ║
║  │  │  └──────────────────────────────────────────────────────────────────┘  │  │    ║
║  │  └─────────────────────────────────────────────────────────────────────────┘  │    ║
║  │                                                                               │    ║
║  └─────────────────────────────────────────────────────────────────────────────┘    ║
║                                         │                                            ║
║                                  HTTPS (github-proxy)                                ║
║                                         │                                            ║
║                              ┌──────────▼──────────┐                                ║
║                              │  GitHub REST API v3   │                                ║
║                              │  api.github.com       │                                ║
║                              └──────────────────────┘                                ║
║                                                                                      ║
║  ┌──────────────────────────────────────────────────────────────────────────────┐   ║
║  │  EXTERNAL: AI Agents                                                          │   ║
║  │  Technology: Node.js / Python / any runtime with @agent-alchemy/agent-sdk   │   ║
║  │  Role: Writes activity_entries, agent_sessions; sends heartbeats             │   ║
║  │  Transport: Supabase REST API (POST to activity_entries, agent_sessions)    │   ║
║  └────────────────────────────────────────────────────────────────┬─────────────┘   ║
║                                                                    │                 ║
║                                              Supabase REST (JWT-authenticated)       ║
║                                                                    ▼                 ║
║                                                    Supabase PostgreSQL               ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

**Container Responsibilities**:

| Container | Technology | Responsibility |
|-----------|-----------|----------------|
| Angular SPA | Angular 18, PrimeNG, TailwindCSS | Dashboard UI, Realtime subscription, GitHub enrichment |
| Supabase PostgreSQL | PostgreSQL 15 + RLS | Durable storage, multi-tenant data isolation |
| Supabase Realtime | WebSocket / CDC | Live push of activity and session events to dashboard |
| Edge Functions | Deno / TypeScript | GitHub API proxy, webhook ingestion, agent auth |
| GitHub REST API | External | Source of issue/PR enrichment data |
| AI Agents | Node.js / Python / any | Write activity entries; maintain heartbeat |

---

### Level 3: Component Diagram — Angular SPA

**Purpose**: Show the major Angular components, services, and their relationships within the `apps/agent-alchemy-dev` SPA.

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                  C4 Level 3 — Angular SPA Component Diagram                       ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║  Angular Router (/dashboard route — lazy loaded)                                 ║
║         │                                                                         ║
║         ▼                                                                         ║
║  ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║  │ DashboardComponent (shell)                                                  │ ║
║  │ ChangeDetection: OnPush                                                     │ ║
║  │ Layout: two-panel (60% agents grid | 40% activity panel)                   │ ║
║  │ State: selectedAgentId signal → dispatched to DashboardService             │ ║
║  │                                                                             │ ║
║  │   ┌───────────────────────────────┐   ┌─────────────────────────────────┐  │ ║
║  │   │ AgentGridComponent            │   │ ActivityPanelComponent          │  │ ║
║  │   │ OnPush                        │   │ OnPush                          │  │ ║
║  │   │ Input: agents signal          │   │ Input: selectedAgent signal     │  │ ║
║  │   │ Input: filterConfig signal    │   │                                 │  │ ║
║  │   │ Output: agentSelected event   │   │  ┌──────────────────────────┐  │  │ ║
║  │   │                               │   │  │ ActivityFeedComponent    │  │  │ ║
║  │   │  ┌─────────────────────────┐  │   │  │ OnPush                   │  │  │ ║
║  │   │  │ AgentCardComponent      │  │   │  │ PrimeNG Timeline         │  │  │ ║
║  │   │  │ (×N, one per agent)     │  │   │  │ Virtual scroll           │  │  │ ║
║  │   │  │ OnPush                  │  │   │  │ Input: entries signal    │  │  │ ║
║  │   │  │ Input: agent            │  │   │  └──────────────────────────┘  │  │ ║
║  │   │  │ Input: isSelected       │  │   │                                 │  │ ║
║  │   │  │ Output: selected        │  │   │  ┌──────────────────────────┐  │  │ ║
║  │   │  │                         │  │   │  │ GitHubWorkItemComponent  │  │  │ ║
║  │   │  │  AgentStatusBadge       │  │   │  │ OnPush                   │  │  │ ║
║  │   │  │  (reusable sub)         │  │   │  │ Input: workItem signal   │  │  │ ║
║  │   │  └─────────────────────────┘  │   │  └──────────────────────────┘  │  │ ║
║  │   └───────────────────────────────┘   └─────────────────────────────────┘  │ ║
║  │                                                                             │ ║
║  │   ┌───────────────────────────────┐                                         │ ║
║  │   │ FilterSidebarComponent        │                                         │ ║
║  │   │ OnPush                        │                                         │ ║
║  │   │ Output: filterChanged event   │                                         │ ║
║  │   └───────────────────────────────┘                                         │ ║
║  └─────────────────────────────────────────────────────────────────────────────┘ ║
║                           │                       │                  │            ║
║                           ▼                       ▼                  ▼            ║
║  ┌─────────────────────┐  ┌────────────────────┐  ┌──────────────────────────┐   ║
║  │ DashboardService    │  │ AgentRealtimeService│  │ GitHubEnrichmentService  │   ║
║  │                     │  │                    │  │                          │   ║
║  │ Signals:            │  │ Signals:           │  │ LRU cache (50 items)     │   ║
║  │  agents()           │  │  connectionState() │  │ 5-min TTL                │   ║
║  │  selectedAgentId()  │  │  activityStream()  │  │ Queue deduplication      │   ║
║  │  filterConfig()     │  │                    │  │                          │   ║
║  │  filteredAgents()   │  │ connect(orgId)     │  │ getWorkItem(owner, repo, │   ║
║  │  selectedAgent()    │  │ disconnect()       │  │   number, type)          │   ║
║  │  activityEntries()  │  │ isConnected()      │  │                          │   ║
║  └──────────┬──────────┘  └──────────┬─────────┘  └──────────────┬───────────┘   ║
║             │                        │                            │               ║
║             │ Supabase REST          │ Supabase Realtime WS       │ HTTPS         ║
║             ▼                        ▼                            ▼               ║
║  ┌────────────────────────────────────────────────────────────────────────────┐   ║
║  │  Supabase Client (@supabase/supabase-js ^2.52.0)                          │   ║
║  │  Initialized with SUPABASE_URL + SUPABASE_ANON_KEY                        │   ║
║  └──────────────────────────────────────┬─────────────────────────────────────┘   ║
║                                         │                                          ║
║        ┌────────────────────────────────┼─────────────────────────────────┐       ║
║        ▼                                ▼                                  ▼       ║
║  PostgreSQL REST              Realtime WebSocket              Edge Functions       ║
║  (activity, sessions)        (org channels)                  (github-proxy)        ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## Technology Choices and Rationale

### Frontend: Angular 18 + Signals

**Decision**: Angular 18 with Signal-based state management.

**Rationale**:
- `apps/agent-alchemy-dev` is an existing Angular 18 application; no framework switch required.
- Angular Signals provide fine-grained reactivity without RxJS subscription management overhead.
- OnPush change detection + Signals enables handling 50+ concurrent agent updates efficiently.
- PrimeNG 18 is already installed and provides Timeline, DataView, Badge, Tag, and VirtualScroll.

**Trade-offs**:
- Signals are Angular 18+; not portable to older Angular versions (acceptable — project is on 18.2.0).
- Some Supabase Realtime stream-to-Signal bridging requires care (see `business-logic.specification.md`).

---

### Realtime Transport: Supabase Realtime

**Decision**: Supabase Realtime via PostgreSQL Change Data Capture (CDC) / logical replication.

**Rationale**:
- `@supabase/supabase-js ^2.52.0` is already a project dependency.
- No additional infrastructure (no custom WebSocket server, no Redis pub/sub).
- Tight integration with the same PostgreSQL database used for persistence.
- org-namespaced channels provide built-in multi-tenancy partitioning.
- Automatic reconnection with backfill is built into the Supabase client.

**Trade-offs**:
- Supabase Realtime has a maximum concurrent connection limit per project tier.
- CDC-based delivery is not strictly ordered under high concurrency (acceptable for dashboard UX).

---

### API Proxy: Supabase Edge Functions (Deno)

**Decision**: GitHub API calls proxied via Supabase Edge Functions.

**Rationale**:
- GitHub Personal Access Token or GitHub App token never exposed to the browser.
- Edge Functions run in Deno, co-located with the Supabase project, minimising latency.
- ETag-based HTTP caching at the Edge Function layer reduces GitHub API rate limit consumption.
- Single deployment target (no separate backend service to maintain).

**Trade-offs**:
- Cold start latency for Edge Functions (~100-200ms); acceptable for enrichment (not on critical path).
- Deno runtime differences from Node.js; requires Deno-compatible dependencies.

---

### Database: Supabase PostgreSQL with RLS

**Decision**: PostgreSQL 15 with Row Level Security for multi-tenancy.

**Rationale**:
- Durable, queryable event log with full SQL capabilities (indexes, views, aggregations).
- RLS enforces org-scoped data isolation at the database layer (not application layer).
- PostgreSQL's JSONB support handles `metadata` and type-specific payload fields.
- 90-day retention with `created_at` index enables efficient time-range queries.

**Trade-offs**:
- RLS adds per-query overhead (~10-15%); acceptable given the query volumes.
- Schema migrations require careful coordination with running agents.

---

### Agent SDK: `@agent-alchemy/agent-sdk`

**Decision**: Thin SDK wrapper over Supabase REST API, published as a separate `libs/` package.

**Rationale**:
- Stable API contract for agent developers independent of dashboard UI changes.
- TypeScript-first with full type definitions for all activity entry types.
- Wraps Supabase auth (agent JWT) and REST calls; agents never interact with Supabase directly.
- Enables versioning: SDK v1.x can be pinned while dashboard evolves to v2.

**Trade-offs**:
- Additional package to publish and version.
- SDK + dashboard must stay in sync on TypeScript types (mitigated by shared `libs/` types package).

---

## Data Flow Diagrams

### Flow 1: Agent Posting Activity (Write Path)

```
AI Agent (Node.js)
     │
     │  AgentSession.log("Starting code analysis")
     ▼
@agent-alchemy/agent-sdk
     │
     │  POST /rest/v1/activity_entries
     │  Authorization: Bearer <agent-jwt>
     │  body: { type: 'log', content: '...', session_id: '...' }
     ▼
Supabase REST API
     │
     │  RLS check: agent_id matches JWT claim
     ▼
PostgreSQL activity_entries table
     │
     │  logical replication / CDC
     ▼
Supabase Realtime
     │
     │  broadcast to channel org:{orgId}:activity
     ▼
Angular SPA (AgentRealtimeService)
     │
     │  onActivityEntry handler
     ▼
Signal update: activityEntries()
     │
     │  Angular change detection (OnPush)
     ▼
ActivityFeedComponent renders new entry
```

### Flow 2: Dashboard Initial Load (Read Path)

```
User navigates to /dashboard
     │
     ▼
DashboardComponent ngOnInit
     │
     │  DashboardService.loadInitialData(orgId)
     ▼
Supabase REST: GET active_agent_dashboard_view
     │  filter: org_id=eq.{orgId}
     ▼
agents() signal populated
     │
     ▼
AgentGridComponent renders agent cards
     │
User clicks agent card
     │
     ▼
DashboardService.setSelectedAgent(agentId)
     │
     ▼
Supabase REST: GET activity_entries
     │  filter: agent_id=eq.{agentId}&session_id=eq.{sessionId}
     │  order: timestamp.desc, limit: 50
     ▼
activityEntries() signal populated
     │
     ▼
ActivityFeedComponent renders timeline
```

### Flow 3: GitHub Work Item Enrichment

```
ActivityFeedComponent renders entry with type='github_action'
     │
     │  entry.github_url = 'https://github.com/owner/repo/issues/123'
     ▼
GitHubEnrichmentService.getWorkItem('owner', 'repo', 123, 'issue')
     │
     │  Cache hit? → return cached GitHubWorkItem
     │  Cache miss? → HTTP POST to Edge Function
     ▼
POST /functions/v1/github-proxy
     │  { endpoint: '/repos/owner/repo/issues/123', method: 'GET' }
     ▼
Supabase Edge Function: github-proxy (Deno)
     │
     │  Reads GITHUB_TOKEN from Supabase secrets
     │  GET https://api.github.com/repos/owner/repo/issues/123
     │  Authorization: token {GITHUB_TOKEN}
     ▼
GitHub REST API v3
     │  Returns: { title, state, labels, assignees, body, html_url }
     ▼
Edge Function returns GitHub response
     │
     ▼
GitHubEnrichmentService caches result (LRU, 5-min TTL)
     │
     ▼
GitHubWorkItemComponent renders issue details panel
```

---

## Non-Functional Architecture Considerations

### Performance

- **OnPush change detection** on all components: limits re-rendering to signal changes only.
- **PrimeNG VirtualScroll** in `ActivityFeedComponent`: renders only visible entries; handles 1000+ entries.
- **LRU cache** in `GitHubEnrichmentService`: avoids repeated Edge Function calls for same work item.
- **`active_agent_dashboard_view`** DB view with index on `org_id, heartbeat_at`: dashboard load < 200ms target.
- **Supabase Realtime channel namespacing by `org_id`**: limits broadcast scope to relevant subscribers.

### Resilience

- **Exponential backoff** in `AgentRealtimeService`: reconnects with backoff after WebSocket failure.
- **Catch-up query on reconnect**: loads entries created during disconnection window.
- **Agent heartbeat timeout detection**: client-side computed signal marks agents offline after 2 min.
- **GitHub enrichment degraded mode**: on Edge Function failure, show placeholder instead of blocking feed.

### Security

- **RLS on all tables**: org-scoped isolation; agents can only write their own sessions.
- **GitHub token in Supabase secrets**: never in Angular build or browser.
- **Agent JWT scoped to org**: issued by `agent-auth` Edge Function; short TTL (1 hour).
- See `security-architecture.specification.md` for full threat model and STRIDE analysis.

### Scalability

- **Supabase PostgreSQL**: scales to production workloads with index optimisation.
- **90-day retention policy**: prevents unbounded table growth; older entries archived.
- **Horizontal read scaling**: Supabase read replicas (when needed) for dashboard queries.
- **Edge Function autoscaling**: Supabase manages Deno isolate scaling automatically.

---

## Architectural Principles Applied

| Principle | Application |
|-----------|------------|
| **Single Responsibility** | Each service owns one concern; 8 spec files each cover one architectural domain |
| **Open/Closed** | Activity entry type discriminated union; new types added without changing existing code |
| **Dependency Inversion** | Components depend on signal abstractions from services, not Supabase directly |
| **Separation of Concerns** | Read path (dashboard) and write path (agent SDK) are completely separate |
| **Event Sourcing** | `activity_entries` is append-only; full audit trail; no mutable state in the log |
| **Defense in Depth** | RLS + JWT scoping + org-namespaced channels = three independent auth layers |
| **Fail Safe** | GitHub enrichment failure → degraded mode; Realtime disconnect → catch-up query |

---

## References

- `plan/functional-requirements.specification.md` — FR-001 through FR-008 drive architecture choices
- `plan/non-functional-requirements.specification.md` — NFR-001 (performance), NFR-003 (security)
- `research/data-model-research.md` — Schema Option C (Normalized Event-Sourced Log) selected
- `research/implementation-recommendations.md` — Technology choices table and phased delivery plan
- `research/proposals.md` — Proposal 3: Hybrid Supabase Realtime Dashboard
- `.agent-alchemy/specs/stack/stack.json` — Angular 18.2.0, PrimeNG 18.0.2, @supabase/supabase-js ^2.52.0
