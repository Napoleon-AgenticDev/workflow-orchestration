---
meta:
  id: agent-dashboard-constraints-dependencies
  title: Constraints and Dependencies - AI Agent Activity Dashboard
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:agent-alchemy-dev
  tags: [agent-dashboard, plan, angular, supabase, constraints, dependencies, risks, nx]
  createdBy: Agent Alchemy Plan
  createdAt: '2026-03-13'
  reviewedAt: null
title: Constraints and Dependencies - AI Agent Activity Dashboard
category: Products
feature: agent-dashboard
lastUpdated: '2026-03-13'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: plan
applyTo: []
keywords: [agent, dashboard, constraints, dependencies, nx, supabase, github, risks, security]
topics: []
useCases: []
references:
  - .agent-alchemy/specs/frameworks/angular/
  - .agent-alchemy/specs/stack/stack.json
depends-on:
  - research/feasibility-analysis.md
  - research/proposals.md
  - FEASIBILITY-SUMMARY.md
  - plan/functional-requirements.specification.md
  - plan/non-functional-requirements.specification.md
  - plan/business-rules.specification.md
specification: 6-constraints-dependencies
---

# Constraints and Dependencies: AI Agent Activity Dashboard

## Overview

**Purpose**: Document all technical constraints, external dependencies, team dependencies, business constraints, risk mitigations, and Nx workspace boundaries that bound the AI Agent Activity Dashboard implementation.

**Source**: Derived from research/feasibility-analysis.md risk matrix, FEASIBILITY-SUMMARY.md risk assessment, research/proposals.md Proposal 3 constraints, and the existing Nx monorepo structure in `apps/agent-alchemy-dev`.

**Scope**: All constraints and dependencies relevant to the `DashboardModule`, `@agent-alchemy/agent-sdk`, Supabase infrastructure, and GitHub API integration.

---

## 1. Technical Constraints

### TC-001: Supabase Free Tier Limits

**Constraint**: During MVP (pilot with ≤10 agents), the deployment must operate within Supabase free tier limits.

**Hard Limits (Free Tier)**:
| Resource | Free Tier Limit | Dashboard Usage |
|----------|----------------|-----------------|
| Database storage | 500MB | ~50MB for 90-day pilot |
| Realtime messages | 50MB/day outbound | ~5MB/day (10 agents) |
| Edge Function invocations | 500K/month | ~10K/month |
| Bandwidth | 5GB/month | <1GB/month |
| Concurrent DB connections | 60 | <20 for dashboard |

**Constraint Impact**: The MVP cannot be deployed to production with >10 active agents on the free tier without risk of exceeding Realtime message limits. At 50 active agents, Supabase Pro ($25/mo) is required.

**Monitor at**: 80% threshold on each resource (400MB storage, 40MB/day Realtime).

**Upgrade trigger**: Auto-alert when any resource reaches 80% of free tier limit. Budget for Pro plan is pre-approved per FEASIBILITY-SUMMARY.md.

### TC-002: GitHub REST API Rate Limits

**Constraint**: The GitHub REST API v3 enforces rate limits that constrain the frequency of work item enrichment.

**Rate Limit Details**:
| Authentication Type | Limit |
|--------------------|-------|
| Unauthenticated | 60 requests/hour |
| Personal Access Token (PAT) | 5,000 requests/hour |
| GitHub App Installation | 5,000 requests/hour per installation |
| GitHub App (org-level) | 15,000 requests/hour |

**Constraint Impact**: With 50 agents each referencing 5 GitHub work items, and a 5-minute cache TTL:
```
Theoretical max: 50 agents × 5 items × (60/5 refreshes) = 3,000 req/hr
With ETag caching (304 Not Modified): ~60% reduction = ~1,200 actual API calls/hr
Headroom: 3,800 calls/hr remaining on GitHub App plan
```

**Mitigation**:
- 5-minute cache TTL enforced (BR-003)
- ETag conditional requests reduce data transfer and rate limit impact
- Single GitHub App installation shared across all orgs (org-level 15K limit preferred)
- Per research/feasibility-analysis.md: "mitigated by ETag caching and Edge Function proxy"

### TC-003: Angular 18+ and Signals API

**Constraint**: The dashboard must use Angular Signals for all reactive state. RxJS is permitted only as a bridge adapter between external event sources (Supabase Realtime) and Angular Signals.

**Why This Constraint Exists**: Per research/implementation-recommendations.md and FEASIBILITY-SUMMARY.md: "Angular Signals integration (established pattern in apps/agent-alchemy-dev)". Using Signals maintains consistency with the rest of the application and avoids introducing a mixed reactive pattern.

**Permitted Patterns**:
```typescript
// ✅ PERMITTED: Angular Signals for state
readonly agents = signal<AgentCardViewModel[]>([]);
readonly selectedAgentId = signal<string | null>(null);
readonly activeAgents = computed(() => this.agents().filter(a => a.isOnline));

// ✅ PERMITTED: RxJS as bridge from external events to Signals
const realtimeObs$ = new Observable(observer => { /* Supabase listener */ });
const realtimeSignal = toSignal(realtimeObs$, { initialValue: null });

// ❌ NOT PERMITTED: RxJS BehaviorSubject for UI state
readonly agents$ = new BehaviorSubject<AgentCardViewModel[]>([]); // Prohibited
```

### TC-004: PrimeNG as UI Component Library

**Constraint**: The dashboard must use PrimeNG components exclusively for interactive UI elements. Custom CSS-only components are acceptable for layout and presentation, but form controls, overlays, badges, and data components must use PrimeNG.

**Rationale**: `apps/agent-alchemy-dev` already uses PrimeNG. Introducing a second component library (e.g., Angular Material, Kendo) would bloat the bundle and create visual inconsistency.

**Required PrimeNG Components**:
| PrimeNG Component | Dashboard Usage |
|-----------------|----------------|
| `p-timeline` | Activity feed |
| `p-tag` | Status badges, log level badges |
| `p-badge` | Open questions count |
| `p-tooltip` | Truncated text tooltips |
| `p-virtualscroller` | Large activity feed optimization |
| `p-dropdown` | Repository/project filter dropdowns |
| `p-selectbutton` | Activity type filter toggles |
| `p-datepicker` | Date range filter |
| `p-toast` | Realtime reconnection notifications |
| `p-progressspinner` | Loading states |

### TC-005: No Browser-Side GitHub Token Access

**Constraint**: Under no circumstances may a GitHub API token (PAT, GitHub App private key, installation token) be accessible in browser-side JavaScript or appear in browser network requests.

**Enforcement**:
- GitHub tokens stored exclusively in Supabase Vault
- All GitHub API calls proxied through Supabase Edge Functions (Deno runtime)
- Angular `GitHubEnrichmentService` calls only the Edge Function URL
- CORS policy on Edge Function restricts origin to the dashboard app domain
- Security audit in Sprint 7 explicitly verifies this constraint

**Test**: Open Chrome DevTools → Network → filter `api.github.com` → zero requests permitted.

### TC-006: Nx Monorepo Workspace Boundaries

**Constraint**: The dashboard code must respect the Nx workspace module boundary rules defined by `@nx/enforce-module-boundaries` ESLint configuration.

**See Section 5 (Nx Library Boundaries)** for detailed placement decisions.

---

## 2. External Dependencies

### ED-001: @supabase/supabase-js

**Dependency**: `@supabase/supabase-js ^2.52.0`  
**Status**: ✅ Already in the stack (`package.json`)  
**Purpose**: Supabase database queries, authentication, Realtime subscriptions  
**Dashboard Usage**:
- `SupabaseClient.from().select()` — initial data load
- `SupabaseClient.channel().on('postgres_changes', ...).subscribe()` — Realtime
- `SupabaseClient.auth.getSession()` — authenticated org-scoped queries

**Version Constraint**: Dashboard uses `@supabase/supabase-js ^2.52.0`. The Realtime subscription API (`supabase.channel()`) is stable as of v2.x. No upgrade required.

**Import Pattern** (for tree-shaking):
```typescript
import { createClient } from '@supabase/supabase-js';
// Prefer specific imports where available to minimize bundle
```

### ED-002: GitHub REST API v3

**Dependency**: GitHub REST API `https://api.github.com`  
**Status**: External API — not an npm package  
**Authentication**: GitHub App installation token (server-side only)  
**Usage**: Fetched exclusively from Supabase Edge Function (`github-proxy`)  
**Endpoint Coverage**:
| Endpoint | Usage |
|----------|-------|
| `GET /repos/{owner}/{repo}/issues/{issue_number}` | Issue enrichment |
| `GET /repos/{owner}/{repo}/pulls/{pull_number}` | PR enrichment |
| `GET /repos/{owner}/{repo}/issues/{issue_number}/labels` | Label data |

**Version**: REST API v3 (stable, no planned deprecation)  
**Fallback**: Cached `github_work_items.raw_data` (BR-003)

### ED-003: PrimeNG 18+

**Dependency**: `primeng ^18.x`  
**Status**: ✅ Already in the stack  
**Purpose**: UI component library for agent cards, activity timeline, filters  
**Critical Components**: `TimelineModule`, `DataViewModule`, `VirtualScrollerModule`, `TagModule`, `BadgeModule`, `ToastModule`

**Import Constraint**: Must import specific modules, not `PrimeNGModule` barrel (NFR-007.2 bundle size).

### ED-004: Tailwind CSS

**Dependency**: `tailwindcss ^3.x` (or 4.x per stack)  
**Status**: ✅ Already in the stack  
**Purpose**: Responsive grid layout for agent card grid, spacing, color utilities  
**Dashboard Usage**: Agent grid (`grid`, `grid-cols-*`, `gap-*`), card layout, responsive breakpoints

### ED-005: @deno (Supabase Edge Functions Runtime)

**Dependency**: Deno runtime (Supabase-managed)  
**Status**: Managed by Supabase — no explicit version pinning needed  
**Purpose**: Server-side runtime for `github-proxy` and `webhook-handler` Edge Functions  
**Key APIs Used**: `Deno.env.get()` for vault secrets, `fetch()` for GitHub API calls

---

## 3. Team Dependencies

### TD-001: Agent SDK Publication

**Dependency**: `@agent-alchemy/agent-sdk` must be published (to npm or internal registry) before AI agents can integrate.

**Blocking**: Yes — agents cannot post activity to the dashboard until the SDK is available.

**Timeline**: SDK core must be complete by end of Sprint 1 (Week 2). Publication to npm registry: end of Sprint 2.

**Risk**: If agent developer teams start integrating before SDK is stable, they may need to update their integration in Sprint 2. Mitigation: share the TypeScript interface early (Phase 0) so agents can write to the contract before implementation is complete.

**Owner**: Angular Developer (Sprint 1)

### TD-002: Agent Authentication Strategy Decision

**Dependency**: The authentication mechanism for agents posting data must be agreed upon before schema and SDK implementation.

**Options** (per FEASIBILITY-SUMMARY.md Q1):
| Option | Mechanism | Pros | Cons |
|--------|-----------|------|------|
| A | Service role key per org | Simple to implement | Key rotation requires agent restart |
| B | Edge Function endpoint with org-scoped tokens | More secure; rotation-friendly | Higher latency; more implementation |

**Decision Needed**: Phase 0, before Sprint 1 (Week 1)  
**Owner**: Architect  
**Default**: Option A (service role key) for MVP; migrate to Option B in v2.0 if rotation becomes a concern.

### TD-003: Supabase Project Provisioning

**Dependency**: A Supabase project for `agent-alchemy-dev` must be provisioned with Realtime enabled before Sprint 1 begins.

**Blocking**: Yes — Sprint 1 schema migration cannot run without a Supabase project.

**Prerequisites**:
- Supabase project created and URL available
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables configured in Angular app
- `SUPABASE_SERVICE_ROLE_KEY` stored securely for SDK use
- Realtime enabled on project settings
- Edge Functions deployment pipeline configured

**Owner**: DevOps  
**Deadline**: Phase 0 (before Sprint 1)

### TD-004: GitHub App or Token for Edge Function

**Dependency**: A GitHub App installation token or Personal Access Token must be available for the `github-proxy` Edge Function before Sprint 3.

**Blocking**: Sprint 3 only — GitHub work item panel requires this.

**Requirements**:
- Read access to issues, pull requests, and repositories
- Stored in Supabase Vault (not in Edge Function source code)
- Available to Edge Function via `Deno.env.get('GITHUB_TOKEN')`

**Owner**: Architect / DevOps  
**Deadline**: End of Sprint 2 (before Sprint 3 begins)

---

## 4. Business Constraints

### BC-001: No GitHub Tokens in Browser

**Constraint**: This is both a security constraint (TC-005) and a **non-negotiable business requirement**. Exposing GitHub tokens in the browser violates GitHub's terms of service for GitHub Apps and constitutes a security incident requiring token rotation.

**Impact**: All GitHub data access must be server-proxied. This adds one Edge Function to the architecture but is non-negotiable.

### BC-002: Data Privacy and Multi-Tenancy

**Constraint**: Agent activity data is proprietary to each organization. Data isolation via RLS (BR-006) is a business requirement, not merely a technical preference. A data leak between orgs would constitute a serious privacy breach.

**Impact**: RLS policies must be designed and tested before any data is written. Sprint 1 includes RLS implementation and cross-org isolation testing.

### BC-003: v1.0 Dashboard is Read-Only for Operators

**Constraint**: Per FEASIBILITY-SUMMARY.md Q5 decision: "No → read-only dashboard for v1.0". Human operators can view all agent activity but cannot issue commands, pause, or stop agents from the dashboard.

**Impact**: No `agent_commands` table or SDK "receive loop" is needed in v1.0. The dashboard is a monitoring surface only. Bidirectional control is a v2.0 candidate.

**Exception**: Answering agent QUESTION entries (setting `question_status = 'answered'`) is a future scope item, not in v1.0.

### BC-004: 90-Day Activity Retention

**Constraint**: Per FEASIBILITY-SUMMARY.md Q4: Activity entries are retained for 90 days. This is a business decision balancing storage cost against audit/compliance needs.

**Impact**: Automated retention purge required (BR-004). Session History view is bounded to 90 days for activity entries (sessions remain for 1 year).

### BC-005: Agent SDK Must Be Backward Compatible

**Constraint**: Once `@agent-alchemy/agent-sdk` v1.0 is published and agents begin integrating, the public API (`openSession()`, `log()`, `decide()`, `ask()`, `closeSession()`) must not have breaking changes in minor versions.

**Impact**: API design in Sprint 1 must be carefully reviewed. Any changes after SDK publication require a major version bump.

---

## 5. Nx Library Boundaries

### Where Dashboard Code Lives

The `agent-alchemy-dev` application is an Nx monorepo app. The dashboard feature code is organized as follows:

```
buildmotion-ai-agency/
├── apps/
│   └── agent-alchemy-dev/
│       └── src/
│           └── app/
│               └── features/
│                   └── dashboard/              ← Feature module (app-level)
│                       ├── dashboard.routes.ts
│                       ├── components/
│                       ├── services/
│                       ├── models/
│                       └── pipes/
└── libs/
    └── agent-alchemy/
        └── agent-sdk/                          ← Shared SDK library
            ├── src/
            │   └── index.ts
            └── package.json
```

### Decision: App-Level Feature vs. Shared Library

| Code Location | Rationale |
|---------------|-----------|
| `apps/agent-alchemy-dev/features/dashboard/` | Dashboard components and services are **app-specific** — they consume the Supabase schema and Angular Signals pattern specific to `agent-alchemy-dev`. Not reusable across other apps. |
| `libs/agent-alchemy/agent-sdk/` | The Agent SDK is a **standalone npm package** consumed by AI agents (not Angular apps). It belongs in `libs/` with its own `package.json` for independent publishing. |

### Nx Tags and Boundary Rules

```json
// In project.json for dashboard feature (app-level)
{
  "tags": ["scope:app", "type:feature", "app:agent-alchemy-dev"]
}

// In project.json for agent-sdk library
{
  "tags": ["scope:shared", "type:sdk", "platform:node"]
}
```

**Boundary Rules** (`.eslintrc.json` enforcement):
```json
{
  "@nx/enforce-module-boundaries": [
    "error",
    {
      "depConstraints": [
        {
          "sourceTag": "scope:app",
          "onlyDependOnLibsWithTags": ["scope:shared", "scope:app"]
        },
        {
          "sourceTag": "type:feature",
          "onlyDependOnLibsWithTags": ["type:ui", "type:data-access", "type:util", "type:sdk"]
        },
        {
          "sourceTag": "platform:node",
          "onlyDependOnLibsWithTags": ["scope:shared", "platform:node"]
        }
      ]
    }
  ]
}
```

**Key Boundary**: `apps/agent-alchemy-dev` may import from `libs/agent-alchemy/agent-sdk` only if strictly necessary. In practice, the Angular dashboard does NOT use the SDK directly — it reads from Supabase (which agents write to via the SDK). The SDK is for agent runtimes (Node.js), not for the Angular app.

### File Naming Conventions (per this Repo)

Dashboard files follow existing repo patterns:
| Type | Naming Pattern | Example |
|------|---------------|---------|
| Components | `kebab-case.component.ts/.html/.scss` | `agent-card.component.ts` |
| Services | `kebab-case.service.ts` | `dashboard.service.ts` |
| Models | `kebab-case.model.ts` | `activity-entry.model.ts` |
| Pipes | `kebab-case.pipe.ts` | `time-ago.pipe.ts` |
| Routes | `feature.routes.ts` | `dashboard.routes.ts` |

---

## 6. Risk Mitigations

### Risk Matrix

Per FEASIBILITY-SUMMARY.md risk assessment, the following risks are tracked:

| Risk | Likelihood | Impact | Category | Mitigation |
|------|-----------|--------|----------|-----------|
| GitHub App private key exposure | Low | Critical | Security | Supabase Vault; server-side only; Sprint 7 audit |
| Angular Realtime subscription memory leaks | Medium | High | Reliability | `removeAllChannels()` in ngOnDestroy; leak tests |
| Supabase Realtime channel proliferation | Medium | Medium | Performance | Single org-level channel; validated Sprint 4 |
| Agent SDK adoption below 90% | Medium | Medium | Business | Excellent docs; TypeScript types; simple 6-method API |
| Supabase free tier exhaustion | Low | Medium | Cost | 80% alert; pre-approved Pro upgrade |
| Angular OnPush + Realtime performance | Medium | High | Performance | Signal batching; throttle; virtual scroll |
| GitHub API rate limit exhaustion | Low | Medium | Reliability | ETag caching; 5-min TTL; Edge Function proxy |
| GitHub App token management complexity | Medium | Medium | Technical | Reuse patterns from existing onboarding feature |

### Risk Detail: Angular Realtime Subscription Memory Leaks

**Risk**: Supabase Realtime channels not cleaned up on component destroy lead to memory leaks and phantom subscriptions receiving events for destroyed components.

**Mitigation**:
```typescript
// In AgentRealtimeService
private channels: RealtimeChannel[] = [];

ngOnDestroy(): void {
  this.channels.forEach(channel => this.supabase.removeChannel(channel));
  this.channels = [];
}

// Alternatively, use the nuclear option:
ngOnDestroy(): void {
  this.supabase.removeAllChannels();
}
```

**Test**: Navigate to `/dashboard`, inspect Supabase Realtime channel count; navigate away; channel count drops to zero.

### Risk Detail: Supabase Realtime Channel Proliferation

**Risk**: Creating one Supabase Realtime channel per agent (50 channels for 50 agents) would exceed Supabase connection limits and degrade performance.

**Mitigation**: A single org-level channel subscribes to all `activity_entries` and `agent_sessions` changes filtered by `org_id`. Channel fanout to individual agent Signal updates happens in TypeScript, not via separate channels:

```typescript
channel.on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'activity_entries',
  filter: `org_id=eq.${orgId}`    // All agents in org, one subscription
}, (payload) => {
  // Route to correct agent's Signal in memory
  const agentId = payload.new.agent_id;
  this.updateAgentActivity(agentId, payload.new);
});
```

### Risk Detail: Angular OnPush + Realtime Performance

**Risk**: With 50 agents and rapid activity entry arrivals, Signal updates trigger too many component re-evaluations, causing UI jank.

**Mitigation Strategy**:
1. **Signal batching**: Group multiple Realtime events arriving within 100ms into a single Signal update
2. **Computed signal memoization**: Angular Signals automatically memoize computed values — unchanged derived values do not trigger re-renders
3. **Virtual scroll**: Feed rendering is bounded regardless of entry count
4. **Activity throttle**: Cap UI updates at 5 per second per agent (queue incoming events)

```typescript
// Batching strategy using RxJS debounce as bridge
const batchedEntries$ = realtimeEntries$.pipe(
  bufferTime(100),           // Collect events for 100ms
  filter(batch => batch.length > 0)
);
effect(() => {
  const batch = toSignal(batchedEntries$)();
  if (batch) {
    this.activityEntries.update(entries => [...batch, ...entries]);
  }
});
```

---

## 7. Assumption Register

The following assumptions are made in this planning phase. If assumptions prove incorrect, the implementation plan may need revision.

| ID | Assumption | Impact if Wrong | Owner to Verify |
|----|-----------|----------------|----------------|
| A-001 | Supabase free tier is sufficient for MVP (≤10 agents) | Must upgrade to Pro sooner | DevOps (Phase 0) |
| A-002 | `agent-alchemy-dev` already uses PrimeNG 18 | Must upgrade PrimeNG | Angular Dev (Phase 0) |
| A-003 | Supabase Auth is configured with `org_id` JWT claim | Must implement org claim | Backend Dev (Sprint 1) |
| A-004 | GitHub App with read access to org repos is available | Must provision GitHub App | DevOps (before Sprint 3) |
| A-005 | Agents run in Node.js environments (SDK compatibility) | May need browser SDK variant | Agent Dev Team (Phase 0) |
| A-006 | Single Supabase Realtime channel handles 50 agents | May need channel sharding | Sprint 4 performance test |
| A-007 | 90-day retention satisfies compliance requirements | Must re-evaluate retention policy | Product Owner |
| A-008 | Operators authenticate via existing Supabase Auth | Must add dashboard auth flow | Backend Dev (Sprint 1) |

---

## 8. Constraint Validation Checklist

Before each major phase, validate constraints:

**Before Sprint 1**:
- [ ] TC-001: Supabase project limits confirmed
- [ ] TC-006: Nx boundary rules updated to include dashboard feature tags
- [ ] TD-001: SDK package name and scope confirmed
- [ ] TD-002: Agent authentication strategy decided
- [ ] TD-003: Supabase project provisioned with Realtime enabled
- [ ] BC-003: Read-only v1.0 scope confirmed with stakeholders

**Before Sprint 3**:
- [ ] TC-002: GitHub App installation token in Supabase Vault
- [ ] TC-005: GitHub token isolation verified (no browser-side access)
- [ ] TD-004: GitHub App or PAT available for Edge Function

**Before Sprint 7**:
- [ ] TC-005: Security audit confirms zero GitHub tokens in browser
- [ ] TC-001: Supabase usage metrics reviewed; Pro plan upgrade if needed
- [ ] BC-005: SDK API stability review; no breaking changes planned
- [ ] TC-006: Nx boundary lint rules pass with no violations
