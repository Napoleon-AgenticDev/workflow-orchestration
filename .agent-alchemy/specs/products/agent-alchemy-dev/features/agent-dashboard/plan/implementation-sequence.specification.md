---
meta:
  id: agent-dashboard-implementation-sequence
  title: Implementation Sequence - AI Agent Activity Dashboard
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:agent-alchemy-dev
  tags: [agent-dashboard, plan, angular, supabase, implementation, sprints, roadmap]
  createdBy: Agent Alchemy Plan
  createdAt: '2026-03-13'
  reviewedAt: null
title: Implementation Sequence - AI Agent Activity Dashboard
category: Products
feature: agent-dashboard
lastUpdated: '2026-03-13'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: plan
applyTo: []
keywords: [agent, dashboard, monitoring, sprints, roadmap, supabase, angular, implementation, sequencing]
topics: []
useCases: []
references:
  - .agent-alchemy/specs/frameworks/angular/
  - .agent-alchemy/specs/stack/stack.json
depends-on:
  - research/feasibility-analysis.md
  - research/implementation-recommendations.md
  - research/proposals.md
  - FEASIBILITY-SUMMARY.md
  - plan/functional-requirements.specification.md
  - plan/non-functional-requirements.specification.md
  - plan/business-rules.specification.md
specification: 5-implementation-sequence
---

# Implementation Sequence: AI Agent Activity Dashboard

## Overview

**Purpose**: Define the phased, sprint-by-sprint delivery plan for the AI Agent Activity Dashboard, sequencing work to deliver value incrementally while managing dependencies and risk.

**Source**: Per research/feasibility-analysis.md Section 2 (Work Breakdown Structure) and research/implementation-recommendations.md Section 2 (Phased Implementation Plan). The 7-sprint sequence delivers Hybrid Supabase Realtime Dashboard (Proposal 3).

**Total Timeline**: 14 weeks (7 × 2-week sprints)  
**Team**: 1 Senior Angular Developer + 0.5 Backend/Supabase Developer  
**Sprint Duration**: 2 weeks  
**Estimated Cost**: $72K–$96K (per FEASIBILITY-SUMMARY.md)

---

## Delivery Overview

```
Week:  1    2    3    4    5    6    7    8    9    10   11   12   13   14
       ├────────┤├────────┤├────────┤├────────┤├────────┤├────────┤├────────┤
       Sprint 1  Sprint 2  Sprint 3  Sprint 4  Sprint 5  Sprint 6  Sprint 7

Phase: ├──── MVP Foundation ────────────────┤├── Realtime ──┤├ GitHub ┤├ Filter/History ┤├ Polish ┤
                                                                            ↑
       MVP Demo (polling)                   │               │        GA Release
       milestone                   Realtime milestone   Filter milestone
```

**Phase Summary**:
| Phase | Sprints | Goal | Milestone |
|-------|---------|------|-----------|
| MVP Foundation | 1–3 | Schema + SDK + Angular UI with polling | Working dashboard with real data |
| Realtime Integration | 4 | Supabase Realtime subscriptions + live updates | Live dashboard |
| GitHub Integration | 5 | Edge Function proxy + GitHub work item display | GitHub-enriched dashboard |
| Filtering & History | 6 | Filter UI + session history browsing | Full-featured dashboard |
| Polish & Production | 7 | Performance, accessibility, testing, docs | v1.0 GA |

---

## Phase 0: Pre-work (Week 0 — Before Sprint 1)

**Goal**: Ensure all infrastructure prerequisites are in place before development begins.

**Duration**: 1 week (parallel with research review)

### Tasks

| Task | Owner | Effort | Outcome |
|------|-------|--------|---------|
| Confirm Supabase project exists for `agent-alchemy-dev` | DevOps | 2h | Project URL and credentials available |
| Enable Supabase Realtime on project | DevOps | 1h | Realtime configuration confirmed |
| Enable PostgreSQL extensions: `uuid-ossp`, `pg_trgm` | DevOps | 1h | Extensions enabled |
| Agree on agent authentication strategy (service role vs. agent-write JWT) | Architect | 4h | Auth decision documented |
| Draft agent SDK interface with agent developer team | Architect + Agent Dev | 1 day | `AgentSession` API contract agreed |
| Create GitHub App or Personal Access Token for Edge Function | Architect | 2h | Token stored in Supabase Vault |
| Set up Supabase Edge Function CLI deployment pipeline | DevOps | 2h | `supabase functions deploy` works |
| Create `libs/agent-alchemy/agent-sdk` Nx library skeleton | Angular Dev | 2h | Empty npm package with correct structure |
| Create `apps/agent-alchemy-dev/src/app/features/dashboard` directory | Angular Dev | 1h | Feature directory exists |

### Phase 0 Decision Gate

**Before Sprint 1 begins, confirm**:
- [ ] Supabase project credentials available in team password manager
- [ ] Agent authentication strategy: `service_role` key per org (selected for MVP simplicity)
- [ ] `@agent-alchemy/agent-sdk` package name and npm scope confirmed
- [ ] Feature flag or nav link for `/dashboard` route agreed

---

## Sprint 1–2: MVP Foundation — Schema + SDK + Angular Module

### Sprint 1 (Weeks 1–2)

**Goal**: Supabase schema deployed + Agent SDK core API + Angular DashboardModule scaffolded.

**Deliverables**:
1. Supabase database schema with all 4 tables, indexes, and RLS policies
2. `@agent-alchemy/agent-sdk` with `openSession()`, `log()`, `decide()`, `ask()`, `closeSession()`
3. Lazy-loaded `DashboardModule` at `/dashboard` route with mock data shell
4. Agent heartbeat mechanism in SDK

### Sprint 1 Task Breakdown

| Task | FR / BR / NFR | Effort | Assignee |
|------|--------------|--------|----------|
| **Schema: Create Supabase migration for `agents` table** | BR-001, BR-009 | 0.5d | Backend Dev |
| **Schema: Create migration for `agent_sessions` table** | BR-001, BR-002, BR-011 | 0.5d | Backend Dev |
| **Schema: Create migration for `activity_entries` table** | BR-001, BR-005, BR-007 | 1d | Backend Dev |
| **Schema: Create migration for `github_work_items` table** | BR-003 | 0.5d | Backend Dev |
| **Schema: RLS policies for all 4 tables** | BR-006, NFR-003.2 | 1d | Backend Dev |
| **Schema: Indexes for performance** | NFR-001.2 | 0.5d | Backend Dev |
| **Schema: Partial unique index for single active session** | BR-002 | 0.5d | Backend Dev |
| **Schema: Immutability trigger on activity_entries** | BR-007 | 0.5d | Backend Dev |
| **SDK: AgentSession class skeleton + TypeScript interfaces** | FR-010 | 0.5d | Angular Dev |
| **SDK: `openSession()` + `closeSession()` implementation** | FR-007, FR-010 | 1d | Angular Dev |
| **SDK: `log()`, `decide()`, `ask()` activity posting** | FR-006, FR-010 | 1d | Angular Dev |
| **SDK: Automatic heartbeat timer** | BR-011, FR-010 | 0.5d | Angular Dev |
| **SDK: Error handling + retry logic (3 retries, exponential backoff)** | FR-010, NFR-005.3 | 0.5d | Angular Dev |
| **Angular: Create DashboardModule lazy-loaded route** | NFR-006.3 | 0.5d | Angular Dev |
| **Angular: DashboardComponent shell (two-panel layout, mock data)** | UX-001 | 0.5d | Angular Dev |

**Sprint 1 Acceptance Criteria**:
```gherkin
Given the Supabase migration is applied
When an agent calls openSession() followed by log('Hello world')
Then a row exists in agent_sessions and activity_entries in Supabase

Given an authenticated browser user
When they navigate to /dashboard
Then the DashboardComponent renders without errors
And the two-panel layout is visible with mock agent data

Given two org-A users and one org-B user are authenticated
When they query activity_entries
Then org-A users can only see org-A entries (RLS verified)
```

**Dependencies**: Phase 0 complete; Supabase project credentials available.

---

### Sprint 2 (Weeks 3–4)

**Goal**: Core dashboard UI components rendering real data from Supabase via polling.

**Deliverables**:
1. `AgentGridComponent` with real agent data from Supabase
2. `AgentCardComponent` with status badges, project/repo display, open questions count
3. `ActivityFeedComponent` with PrimeNG Timeline rendering real activity entries
4. `DashboardService` querying Supabase (no Realtime yet — polling every 30s)
5. `ActivityEntryComponent` rendering all 7 entry types

### Sprint 2 Task Breakdown

| Task | FR / NFR / UX | Effort | Assignee |
|------|--------------|--------|----------|
| **AgentGridComponent**: Tailwind grid, responsive, read from `DashboardService` | FR-001, FR-005, UX-001 | 2d | Angular Dev |
| **AgentCardComponent**: Status badge (PrimeNG Tag), name, project, repo, task | FR-002, UX-002 | 2d | Angular Dev |
| **AgentCardComponent**: Open questions badge, duration, heartbeat display | FR-002, BR-011 | 1d | Angular Dev |
| **DashboardService**: Signals architecture — `agents`, `selectedAgentId`, `activityEntries` signals | NFR-006.1 | 1d | Angular Dev |
| **DashboardService**: Supabase query for `agent_dashboard_summary` view (initial load) | FR-001, NFR-001.1 | 0.5d | Angular Dev |
| **DashboardService**: `selectAgent()` method — loads activity entries for selected agent | FR-002 | 0.5d | Angular Dev |
| **ActivityFeedComponent**: PrimeNG Timeline integration, type discriminator rendering | FR-003, UX-003 | 2d | Angular Dev |
| **ActivityEntryComponent**: Renders all 7 entry types with correct icons and colors | FR-006, UX-003 | 1d | Angular Dev |
| **ActivityEntryComponent**: Decision rationale expand/collapse | UX-003 | 0.5d | Angular Dev |
| **ActivityEntryComponent**: Question open/answered badge | FR-006, UX-003 | 0.5d | Angular Dev |
| **TimeAgoPipe**: Relative timestamp formatting ("2 min ago") | UX-002 | 0.5d | Angular Dev |
| **OnPush change detection**: Apply to all components | NFR-006.2 | 0.5d | Angular Dev |

**Sprint 2 Acceptance Criteria**:
```gherkin
Given agent "Copilot Alpha" has 10 activity entries in Supabase
When I navigate to /dashboard
Then I see the agent card with correct status, project, and repo

When I click on the agent card
Then the activity feed loads showing 10 entries in chronological order
And each entry type has the correct icon and color

Given entries of all 7 types are in the feed
Then each type renders correctly with its distinct visual treatment
```

**Dependencies**: Sprint 1 complete; schema deployed; SDK can post entries.

---

## Sprint 3: MVP Foundation — GitHub Enrichment + Polish

### Sprint 3 (Weeks 5–6)

**Goal**: GitHub work item display via Edge Function proxy. MVP demo-ready dashboard.

**Deliverables**:
1. `github-proxy` Supabase Edge Function
2. `GitHubEnrichmentService` in Angular
3. `GitHubWorkItemPanelComponent` displaying issues/PRs
4. Empty states and error states for all major failure scenarios
5. **MVP Demo Milestone**: End-to-end working dashboard with real agent data and GitHub context

### Sprint 3 Task Breakdown

| Task | FR / BR / NFR | Effort | Assignee |
|------|--------------|--------|----------|
| **Edge Function: `github-proxy`** — call GitHub REST API with ETag caching | FR-004, BR-003, NFR-003.1 | 2d | Backend Dev |
| **Edge Function: `github-proxy`** — read/write `github_work_items` cache table | BR-003 | 0.5d | Backend Dev |
| **Edge Function: CORS configuration** — restrict to app origin | NFR-003.1 | 0.5d | Backend Dev |
| **GitHubEnrichmentService**: Angular HttpClient calling Edge Function | FR-004 | 0.5d | Angular Dev |
| **GitHubEnrichmentService**: Cache-aware: check `synced_at` before requesting | BR-003 | 0.5d | Angular Dev |
| **GitHubWorkItemPanelComponent**: Issue/PR cards, state badges, label chips | FR-004, UX-004 | 2d | Angular Dev |
| **GitHubWorkItemCardComponent**: Title link, state badge, labels, comments count, GitHub link | UX-004 | 1d | Angular Dev |
| **Empty states**: No active agents, no activity yet, agent offline | UX-007 | 1d | Angular Dev |
| **Error states**: Connection lost banner, GitHub unavailable panel | UX-008 | 1d | Angular Dev |
| **Error handling**: Per-agent card error boundary (partial failure tolerance) | NFR-005.3 | 0.5d | Angular Dev |
| **DashboardHeaderComponent**: Connection status indicator, agent counts | UX-010 | 0.5d | Angular Dev |

**Sprint 3 Acceptance Criteria**:
```gherkin
Given an agent created PR #43 in "acme/billing"
When I view the GitHub work items panel
Then I see PR #43 with title, state badge, and labels
And no request to api.github.com appears in the browser network tab

Given the GitHub Edge Function returns an error
When I view the GitHub panel
Then cached data is shown with a "⚠ May be stale" warning
And the dashboard continues to function

Given the Supabase connection is lost
When I view the dashboard
Then a "Connection lost" banner appears
And last-known agent states are displayed
```

**MVP Demo Milestone**: After Sprint 3, the team can demonstrate a live dashboard showing real agent activity with GitHub context using polling-based updates.

---

## Sprint 4: Realtime Integration

### Sprint 4 (Weeks 7–8)

**Goal**: Replace polling with Supabase Realtime subscriptions. Live agent status updates and activity feed.

**Deliverables**:
1. `AgentRealtimeService` with org-scoped Supabase Realtime subscriptions
2. Live agent status updates (agent card badge changes without page reload)
3. Live activity feed (new entries appear in real-time)
4. Heartbeat-based offline detection
5. Catch-up query on Realtime reconnect
6. Connection status indicator (connected/reconnecting/offline)

### Sprint 4 Task Breakdown

| Task | FR / BR / NFR | Effort | Assignee |
|------|--------------|--------|----------|
| **AgentRealtimeService**: Supabase channel setup for `agent_sessions` | FR-001, BR-008 | 1d | Angular Dev |
| **AgentRealtimeService**: `activity_entries` INSERT subscription | FR-003, BR-008 | 1d | Angular Dev |
| **AgentRealtimeService**: `fromEvent` → `toSignal` bridge for Signal integration | NFR-006.1 | 1d | Angular Dev |
| **AgentRealtimeService**: Org-scoped filter on all subscriptions | BR-008, NFR-003.3 | 0.5d | Angular Dev |
| **AgentRealtimeService**: Catch-up query on reconnect | NFR-005.2 | 1d | Angular Dev |
| **AgentRealtimeService**: `removeAllChannels()` in `ngOnDestroy` | NFR-006.1 | 0.5d | Angular Dev |
| **DashboardService**: Replace polling with Realtime-driven Signal updates | NFR-006.1 | 1d | Angular Dev |
| **Heartbeat detection**: Computed signal for `isOnline` (heartbeat < 120s) | BR-011 | 0.5d | Angular Dev |
| **AgentCardComponent**: Pulse animation on new entry arrival | UX-002 | 0.5d | Angular Dev |
| **Connection status**: Header indicator (green/yellow/red dot) | UX-010, NFR-009.1 | 0.5d | Angular Dev |
| **Reconnect banner**: "Reconnecting..." / "Connection lost" banners | UX-008, NFR-005.2 | 0.5d | Angular Dev |
| **Activity feed**: Auto-scroll with pause-on-user-scroll | UX-003 | 1d | Angular Dev |

**Sprint 4 Acceptance Criteria**:
```gherkin
Given I am viewing the dashboard
When an agent updates its status to "blocked"
Then the agent card badge changes to "⚠ Blocked" within 3 seconds
And no page reload was required

Given I am viewing an agent's activity feed
When the agent posts a new log entry via the SDK
Then the entry appears at the top of the feed within 3 seconds

Given the Supabase Realtime connection drops
When it reconnects 90 seconds later
Then the dashboard loads all entries that arrived during the outage
And a "Reconnected" toast notification confirms recovery

Given browser DevTools → Network tab is open
When I view the dashboard subscriptions
Then exactly 1 Realtime channel is open (not 50 per agent)
And the channel name includes the org_id
```

**Realtime Milestone**: After Sprint 4, the dashboard is a live, real-time mission control surface.

---

## Sprint 5: GitHub Integration Enhancement

### Sprint 5 (Weeks 9–10)

**Goal**: Full GitHub integration — webhooks, enriched work items, GitHub-sourced status updates.

**Deliverables**:
1. `webhook-handler` Supabase Edge Function for GitHub events
2. Real-time GitHub work item status updates (via webhook → Supabase → Realtime)
3. Activity feed open-questions badge on agent cards
4. Activity entry filter chips in feed header
5. Agent grid filter bar with status, repo, project filters

### Sprint 5 Task Breakdown

| Task | FR / BR / NFR | Effort | Assignee |
|------|--------------|--------|----------|
| **Edge Function: `webhook-handler`** — GitHub webhook signature verification | NFR-003.1 | 1d | Backend Dev |
| **Edge Function: `webhook-handler`** — Route PR/issue events to `github_work_items` UPDATE | FR-004 | 1d | Backend Dev |
| **AgentRealtimeService**: Subscribe to `github_work_items` changes | FR-004 | 0.5d | Angular Dev |
| **Open questions badge**: Computed signal counts open QUESTION entries per agent | FR-003, UX-002 | 0.5d | Angular Dev |
| **Activity feed filter chips**: Toggle by entry type | FR-008, UX-005 | 1d | Angular Dev |
| **Activity feed filter**: Log level (info/warn/error/debug) toggles | FR-008, UX-005 | 0.5d | Angular Dev |
| **Agent grid filter bar**: Search by agent name | FR-008, UX-005 | 0.5d | Angular Dev |
| **Agent grid filter bar**: Multi-select by status | FR-008, UX-005 | 0.5d | Angular Dev |
| **Agent grid filter bar**: Multi-select by repository | FR-008, UX-005 | 0.5d | Angular Dev |
| **Agent grid filter bar**: Multi-select by project | FR-008, UX-005 | 0.5d | Angular Dev |
| **Filter state persistence**: Active filters survive agent card selection | FR-008 | 0.5d | Angular Dev |
| **Filter clear**: "Clear All Filters" resets all filters | FR-008 | 0.5d | Angular Dev |
| **Rate limit display**: System entry in feed when agent is rate limited | BR-005, UX-008 | 0.5d | Angular Dev |

**Sprint 5 Acceptance Criteria**:
```gherkin
Given a GitHub webhook fires for PR #43 state change (draft → open)
When the webhook reaches the Edge Function
Then the github_work_items row for PR #43 is updated
And the GitHub panel on the dashboard reflects the new state within 5 seconds

Given 12 agents with mixed statuses
When I select "Blocked" and "Error" in the status filter
Then only agents with those statuses are visible
And a chip shows "Status: Blocked, Error"

Given the activity feed has LOG, DECISION, QUESTION entries
When I toggle off LOG entries
Then log entries are hidden and other types remain visible
```

---

## Sprint 6: Filtering and Session History

### Sprint 6 (Weeks 11–12)

**Goal**: Session history browsing. Performance optimization for large feeds (virtual scroll).

**Deliverables**:
1. Session History view with paginated list and filtering
2. Historical session detail view (read-only activity feed)
3. Session summary statistics
4. PrimeNG VirtualScroller for activity feeds with 1000+ entries
5. Unit tests for all services (≥80% coverage)
6. Component tests for critical components (≥70% coverage)

### Sprint 6 Task Breakdown

| Task | FR / NFR / UX | Effort | Assignee |
|------|--------------|--------|----------|
| **SessionHistoryComponent**: Paginated session list | FR-009, UX-006 | 2d | Angular Dev |
| **SessionHistoryComponent**: Filter by agent, date range, outcome | FR-009, UX-006 | 1d | Angular Dev |
| **SessionDetailComponent**: Read-only activity feed for past session | FR-009, UX-006 | 1d | Angular Dev |
| **SessionDetailComponent**: Session summary statistics | FR-009, UX-006 | 0.5d | Angular Dev |
| **Historical session banner**: "Historical View — No live updates" indicator | UX-006 | 0.5d | Angular Dev |
| **Virtual scroll**: Integrate PrimeNG VirtualScroller into ActivityFeedComponent | NFR-001.4 | 1d | Angular Dev |
| **Virtual scroll**: Item height configuration for accurate scroll calculation | NFR-001.4 | 0.5d | Angular Dev |
| **Unit tests: DashboardService** — all public methods, Signal state | NFR-006.4 | 1.5d | Angular Dev |
| **Unit tests: AgentRealtimeService** — mock Supabase client, Realtime events | NFR-006.4 | 1d | Angular Dev |
| **Unit tests: GitHubEnrichmentService** — mock HttpClient, cache logic | NFR-006.4 | 0.5d | Angular Dev |
| **Component tests: AgentCardComponent** — status variations, open questions | NFR-006.4 | 0.5d | Angular Dev |
| **Component tests: ActivityFeedComponent** — entry type rendering | NFR-006.4 | 0.5d | Angular Dev |

**Sprint 6 Acceptance Criteria**:
```gherkin
Given 3 completed sessions in Supabase
When I navigate to Session History
Then I see all 3 sessions with start time, duration, and outcome

When I click on a completed session
Then the activity feed shows the historical entries
And "Historical View" banner confirms no live updates

Given a session with 1000 activity entries
When I scroll through the activity feed
Then scrolling is smooth at ≥ 30fps (virtual scroll active)
And DOM node count does not grow unboundedly

Given DashboardService unit tests
Then coverage report shows ≥ 80% statement coverage
```

---

## Sprint 7: Polish and Production Readiness

### Sprint 7 (Weeks 13–14)

**Goal**: Production-ready dashboard — performance, accessibility, testing, security audit, documentation.

**Deliverables**:
1. Mobile responsive layout
2. WCAG 2.1 AA accessibility audit and fixes
3. E2E tests (5 critical paths via Playwright)
4. Production Supabase RLS security audit
5. Performance testing with 50 simulated agents
6. `@agent-alchemy/agent-sdk` v1.0 documentation
7. Dashboard user guide
8. **v1.0 GA Release**

### Sprint 7 Task Breakdown

| Task | NFR / UX | Effort | Assignee |
|------|---------|--------|----------|
| **Mobile responsive**: Single-panel layout < 768px | UX-009 | 1d | Angular Dev |
| **Mobile**: Tab bar (Agents / History) on mobile | UX-009 | 0.5d | Angular Dev |
| **Mobile**: Touch interactions (swipe, tap) | UX-009 | 0.5d | Angular Dev |
| **Accessibility audit**: Run axe-core, manual keyboard nav test | NFR-004.1 | 1d | Angular Dev |
| **Accessibility fixes**: ARIA labels, focus management, contrast ratios | NFR-004.1–004.4 | 1d | Angular Dev |
| **Accessibility**: Live region announcements for status changes and new entries | NFR-004.3 | 0.5d | Angular Dev |
| **E2E: Dashboard loads with active agents** | NFR-006.4 | 0.5d | Angular Dev |
| **E2E: Agent status updates in real-time** | NFR-006.4 | 0.5d | Angular Dev |
| **E2E: Activity feed updates when agent posts** | NFR-006.4 | 0.5d | Angular Dev |
| **E2E: Agent card selection opens correct panel** | NFR-006.4 | 0.5d | Angular Dev |
| **E2E: Filtering by status shows correct agents** | NFR-006.4 | 0.5d | Angular Dev |
| **Performance test**: Simulate 50 concurrent agents; measure CPU/memory | NFR-001.3 | 1d | Angular Dev |
| **Bundle analysis**: Verify dashboard chunk ≤ 150KB gzipped | NFR-007.1 | 0.5d | Angular Dev |
| **Security audit**: Review all RLS policies; test cross-org isolation | BR-006, NFR-003 | 1d | Backend Dev |
| **Security audit**: Verify zero GitHub tokens in browser network | NFR-003.1 | 0.5d | Backend Dev |
| **SDK docs**: `@agent-alchemy/agent-sdk` README and API reference | FR-010 | 1d | Angular Dev |
| **User guide**: Dashboard operator guide (entry types, status meanings) | - | 0.5d | Angular Dev |
| **Production deployment**: Supabase Pro upgrade + environment config | - | 0.5d | DevOps |
| **v1.0 GA tag + release notes** | - | 0.5d | Angular Dev |

**Sprint 7 Acceptance Criteria**:
```gherkin
Given a browser at 375px width (mobile)
When I navigate to /dashboard
Then agent cards display in a single-column stack
And an "Activity" tab reveals the activity panel
And no horizontal scrolling is required

Given an axe-core accessibility scan of the dashboard
When it runs against all major views
Then zero critical or serious violations are found

Given 50 simulated agents posting 10 entries/min
When I monitor browser CPU via Chrome DevTools
Then CPU usage stays below 50% on a mid-range laptop

Given DashboardComponent bundle analysis
When I run `nx build agent-alchemy-dev --stats-json`
Then the dashboard lazy chunk is ≤ 150KB gzipped
```

---

## Dependencies and Sequencing Rationale

### Critical Path

```
Phase 0 (Pre-work)
    │
    ▼
Sprint 1 (Schema + SDK) ─────────────────────────────────────────────────┐
    │                                                                      │
    ▼                                                                      │
Sprint 2 (Core UI) ──────────────────────────────────────────────────┐   │
    │                                                                  │   │
    ▼                                                                  │   │
Sprint 3 (GitHub Edge Function) ─────────────────────────────────┐   │   │
    │                                                              │   │   │
    ▼                                                              │   │   │
Sprint 4 (Realtime)                                               │   │   │
    │                                                              │   │   │
    ▼                                                              │   │   │
Sprint 5 (GitHub Webhooks + Filters) ◄────────────────────────────┘   │   │
    │                                                                   │   │
    ▼                                                                   │   │
Sprint 6 (History + Tests) ◄───────────────────────────────────────────┘   │
    │                                                                        │
    ▼                                                                        │
Sprint 7 (Polish + Production) ◄────────────────────────────────────────────┘
```

### Sprint Dependencies Matrix

| Sprint | Depends On | Rationale |
|--------|-----------|-----------|
| Sprint 1 | Phase 0 | Schema cannot be written without Supabase project |
| Sprint 2 | Sprint 1 | UI cannot render real data without schema and SDK |
| Sprint 3 | Sprint 1 | Edge Function uses `github_work_items` table (Sprint 1) |
| Sprint 4 | Sprint 2 | Realtime replaces polling introduced in Sprint 2 |
| Sprint 5 | Sprints 3+4 | GitHub webhooks need Edge Function (S3) + Realtime channel (S4) |
| Sprint 6 | Sprints 2+5 | History view uses same ActivityFeed (S2), filters (S5) |
| Sprint 7 | Sprint 6 | Polish only possible when all features are implemented |

### Parallel Work Opportunities

During Sprint 3, the Backend Dev can begin scaffolding the Realtime subscription service (Sprint 4) in parallel with the Angular Dev implementing Sprint 3 UI components.

During Sprint 4, the Backend Dev can begin the `webhook-handler` Edge Function (Sprint 5) while the Angular Dev implements Realtime subscriptions.

---

## Risk Mitigation per Sprint

| Sprint | Top Risk | Mitigation |
|--------|----------|-----------|
| Sprint 1 | Supabase RLS misconfiguration | Integration tests verify cross-org isolation before Sprint 2 |
| Sprint 2 | PrimeNG Timeline + Signals integration complexity | Prototype Timeline with mock data in first day |
| Sprint 3 | GitHub Edge Function cold starts (>500ms) | Warm up function with scheduled ping; accept latency for initial load |
| Sprint 4 | Supabase Realtime channel proliferation | Single org-level channel from day 1; no per-agent channels |
| Sprint 4 | Memory leaks in Realtime subscriptions | `removeAllChannels()` in `ngOnDestroy`; leak test via Chrome Memory tab |
| Sprint 5 | GitHub webhook signature verification | Use Supabase's built-in HMAC helpers; test with GitHub webhook simulator |
| Sprint 6 | Virtual scroll breaking Timeline layout | Implement with fixed row heights; test with 1000 synthetic entries |
| Sprint 7 | Performance with 50 agents failing threshold | Reduce to 30fps minimum; optimize signal batching if needed |

---

## Definition of Done (Per Sprint)

Every sprint is complete only when ALL of the following are true:

- [ ] All sprint tasks merged to main branch via PR
- [ ] All PRs pass CI (lint + build + test)
- [ ] New code has adequate test coverage (unit tests for new services/components)
- [ ] No TypeScript errors or lint violations introduced
- [ ] CHANGELOG.md updated with sprint deliverables
- [ ] Feature flag or route guard confirms stable routing
- [ ] Relevant business rules from business-rules.specification.md validated
- [ ] Sprint demo conducted with stakeholder representative
- [ ] Next sprint dependencies confirmed ready

---

## Versioning and Release Strategy

| Version | Sprint | Description |
|---------|--------|-------------|
| `v0.1.0-alpha` | End Sprint 2 | Internal only — schema + polling UI |
| `v0.2.0-alpha` | End Sprint 3 | MVP demo — GitHub enrichment + polling |
| `v0.3.0-beta` | End Sprint 4 | Realtime enabled — early adopter testing |
| `v0.4.0-beta` | End Sprint 5 | GitHub webhooks + filtering |
| `v0.5.0-rc` | End Sprint 6 | History + tests — release candidate |
| `v1.0.0` | End Sprint 7 | **GA Release** — production-ready |
