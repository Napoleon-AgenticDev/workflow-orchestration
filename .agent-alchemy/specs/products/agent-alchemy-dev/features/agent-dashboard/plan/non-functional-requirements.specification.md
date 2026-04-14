---
meta:
  id: agent-dashboard-non-functional-requirements
  title: Non-Functional Requirements - AI Agent Activity Dashboard
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:agent-alchemy-dev
  tags: [agent-dashboard, plan, angular, supabase, non-functional, performance, security, accessibility]
  createdBy: Agent Alchemy Plan
  createdAt: '2026-03-13'
  reviewedAt: null
title: Non-Functional Requirements - AI Agent Activity Dashboard
category: Products
feature: agent-dashboard
lastUpdated: '2026-03-13'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: plan
applyTo: []
keywords: [agent, dashboard, monitoring, performance, security, accessibility, wcag, supabase, angular]
topics: []
useCases: []
references:
  - .agent-alchemy/specs/frameworks/angular/
  - .agent-alchemy/specs/stack/stack.json
depends-on:
  - research/feasibility-analysis.md
  - research/proposals.md
  - FEASIBILITY-SUMMARY.md
specification: 2-non-functional-requirements
---

# Non-Functional Requirements: AI Agent Activity Dashboard

## Overview

**Purpose**: Define the quality attributes, constraints, and system characteristics that govern HOW the AI Agent Activity Dashboard must perform, not merely what it does.

**Source**: Requirements derived from research/feasibility-analysis.md performance targets, FEASIBILITY-SUMMARY.md success criteria, and research/implementation-recommendations.md architecture decisions.

**Scope**: All non-functional quality attributes applicable to the `DashboardModule`, `AgentRealtimeService`, `GitHubEnrichmentService`, `@agent-alchemy/agent-sdk`, and supporting Supabase infrastructure.

**Architecture Context**: Per research/proposals.md Proposal 3, the system uses Supabase Realtime (WebSocket), Angular Signals with OnPush change detection, PrimeNG VirtualScroller, and Supabase Edge Functions for GitHub API proxying. All NFRs align with these technology choices.

---

## NFR-001: Performance

### NFR-001.1: Dashboard Initial Load Time

**Requirement**: The dashboard must complete its initial load and render all agent cards within **500ms** of navigation for up to 50 active agents.

**Rationale**: Operators need near-immediate situational awareness upon opening the dashboard. Per FEASIBILITY-SUMMARY.md success criteria: "Dashboard load time: <500ms".

**Targets**:
| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| Time to First Contentful Paint (FCP) | < 300ms | Lighthouse / Chrome DevTools |
| Time to Interactive (TTI) | < 500ms | Lighthouse |
| Dashboard API query (initial load) | < 200ms | Supabase query logs |
| Agent cards render (50 agents) | < 200ms after data load | Angular performance profiler |

**Implementation Notes**:
- Use `agent_dashboard_summary` materialized view for fast initial load query (per research/data-model-research.md)
- Dashboard route is lazy-loaded via Angular `loadChildren` — bundle loaded only when needed
- Agent card grid uses `OnPush` change detection to prevent unnecessary re-renders
- Supabase anon key uses Row Level Security; no auth round-trip needed before data fetch

### NFR-001.2: Real-time Update Latency

**Requirement**: Agent status changes and new activity entries must appear on the dashboard within **1-3 seconds** of being written to Supabase.

**Rationale**: Per FEASIBILITY-SUMMARY.md: "Real-time latency: 1-3s" for Proposal 3. This is the accepted trade-off between Supabase Realtime's WebSocket delivery and WebSocket Server's <1s latency.

**Targets**:
| Event | Target Latency | Measured From |
|-------|---------------|---------------|
| Agent status change | < 2s | `agent_sessions` UPDATE → badge change in UI |
| New activity entry | < 3s | `activity_entries` INSERT → entry visible in feed |
| Agent goes offline (heartbeat) | < 5s | Last heartbeat > 120s → UI shows "Offline" |
| GitHub work item refresh | < 1s (from cache) / < 3s (from Edge Function) | User action → data displayed |

**Implementation Notes**:
- Single org-level Realtime channel filters by `org_id` (per FEASIBILITY-SUMMARY.md risk mitigation)
- Supabase Realtime delivers payloads over WebSocket — latency is network + Postgres WAL propagation
- Angular Signal updates are synchronous once data arrives — no additional async delay
- `fromEvent` → `toSignal` bridge (per research/implementation-recommendations.md) ensures efficient Signal updates

### NFR-001.3: Concurrent Agent Scale

**Requirement**: The dashboard must handle **50 simultaneous active agents** without CPU usage exceeding 50% on a mid-range developer machine (2019 MacBook Pro equivalent).

**Targets**:
| Metric | Target | Notes |
|--------|--------|-------|
| Agent cards in grid | 50 | Using OnPush + virtual grid if needed |
| Realtime channels open | 1 (org-level) | Not 50 individual channels |
| Angular change detection cycles | Minimized via Signals + OnPush | No zone.js overhead in critical paths |
| JS heap size (steady state) | < 150MB | Chrome DevTools memory profile |
| Frame rate during updates | ≥ 30fps | Chrome Performance panel |

### NFR-001.4: Activity Feed Performance

**Requirement**: The activity feed must render smoothly for sessions with **1000+ entries** using PrimeNG VirtualScroller.

**Targets**:
| Metric | Target |
|--------|--------|
| Initial feed render (first 50 entries) | < 300ms |
| Scroll performance with 1000 entries | ≥ 60fps using virtual scroll |
| New entry insertion at top of feed | < 100ms Signal update |
| Memory per rendered entry (average) | < 10KB DOM nodes |

---

## NFR-002: Scalability

### NFR-002.1: Supabase Free Tier MVP

**Requirement**: The MVP deployment must operate within Supabase free tier limits (500MB database, 2GB file storage, 50MB/day Realtime messages).

**Rationale**: Per FEASIBILITY-SUMMARY.md: "$0/mo infrastructure for MVP". The free tier is sufficient for initial pilot with fewer than 10 agents.

**Capacity Planning**:
| Resource | Free Tier Limit | Estimated Usage (10 agents, 90 days) |
|----------|----------------|--------------------------------------|
| Database storage | 500MB | ~50MB (activity entries at ~500 bytes each, 1000/day) |
| Realtime messages | 50MB/day | ~5MB/day (10 agents × 10 events/hr × 500 bytes) |
| Edge Function invocations | 500K/month | ~10K/month (GitHub proxy) |
| Auth users | 50K | <100 (operators only) |

**Monitoring**: Alert when database reaches 80% of tier limit (400MB). Upgrade to Supabase Pro ($25/mo) at this threshold.

### NFR-002.2: Supabase Pro Production Scale

**Requirement**: Production deployment (50+ agents) must function correctly on Supabase Pro plan.

**Capacity Planning**:
| Resource | Pro Tier | Estimated Usage (50 agents, production) |
|----------|----------|-----------------------------------------|
| Database storage | 8GB | ~2GB/year (50 agents × 100 events/hr × 90 day retention) |
| Realtime messages | Unlimited | Covered by Pro |
| Edge Function invocations | 2M/month | ~500K/month (GitHub enrichment) |
| Concurrent connections | 500 | Well within limit |

### NFR-002.3: Data Retention and Archival

**Requirement**: The system must implement automated data retention to prevent unbounded database growth.

**Retention Policy**:
| Data | Retention Period | Archival Action |
|------|-----------------|-----------------|
| `activity_entries` | 90 days | Soft-delete (is_archived = true), hard-delete after 1 year |
| `agent_sessions` | 1 year | Retain for audit; compress metadata after 90 days |
| `github_work_items` | 30 days since last reference | Purge cached records no longer referenced |
| `agents` registry | Indefinite | Never purged (identity record) |

**Implementation**: Supabase scheduled Edge Function runs nightly to archive entries older than retention period.

---

## NFR-003: Security

### NFR-003.1: GitHub Token Isolation

**Requirement**: GitHub API access tokens must **never** be present in browser-side JavaScript code, network requests from the browser, or Angular service implementations.

**Rationale**: Per FEASIBILITY-SUMMARY.md high risk: "GitHub App private key exposure (mitigation: Supabase Vault; never client-side)". This is a non-negotiable security boundary.

**Implementation Requirements**:
- GitHub tokens are stored exclusively in Supabase Vault (server-side encrypted storage)
- All GitHub API calls originate from Supabase Edge Functions (Deno server runtime)
- Angular's `GitHubEnrichmentService` calls the Edge Function endpoint only — never `api.github.com` directly
- CORS headers on the Edge Function restrict access to the `agent-alchemy-dev` application origin
- Network tab in browser DevTools must show zero requests to `api.github.com`

**Verification Test**:
```
GIVEN the dashboard is loaded and an agent has GitHub work items
WHEN I open Chrome DevTools → Network tab → filter by "github.com"
THEN zero requests to api.github.com appear
AND all GitHub-related requests go to the Supabase Edge Function URL
```

### NFR-003.2: Row Level Security (RLS)

**Requirement**: Supabase Row Level Security must be enabled on all tables to ensure an authenticated user can only read/write data for their own organization.

**RLS Policy Requirements**:
| Table | Read Policy | Write Policy |
|-------|------------|-------------|
| `agents` | `org_id = auth.jwt().org_id` | Service role only (agent SDK) |
| `agent_sessions` | `org_id = auth.jwt().org_id` | Service role only (agent SDK) |
| `activity_entries` | `org_id = auth.jwt().org_id` | Service role only (agent SDK) |
| `github_work_items` | `org_id = auth.jwt().org_id` | Edge Function only |

**Implementation Notes**:
- Dashboard users (human operators) authenticate via Supabase Auth with JWT containing `org_id` claim
- Agent SDK uses a separate `AGENT_SUPABASE_KEY` (service role key or anon key with RLS) per org
- No org can query another org's data regardless of key possession

### NFR-003.3: Realtime Subscription Scope

**Requirement**: Supabase Realtime subscriptions must be scoped to the authenticated user's organization via RLS filter.

**Requirement Detail**:
```typescript
// Compliant: subscription filtered by org_id
const channel = supabase.channel(`org:${orgId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'activity_entries',
    filter: `org_id=eq.${orgId}`
  }, handler)
  .subscribe();

// Non-compliant: unfiltered subscription (must never be used)
// const channel = supabase.channel('all-activity').on('postgres_changes', { ... })
```

### NFR-003.4: Agent SDK Key Management

**Requirement**: The Agent SDK must support key rotation without requiring SDK upgrades or agent restarts.

**Requirements**:
- Keys are injected via environment variable (`AGENT_SUPABASE_KEY`) or SDK constructor config
- Keys are never hardcoded in agent source code
- Key rotation invalidates the old key within 1 hour (Supabase JWT TTL)
- SDK handles 401 responses gracefully (log error, do not crash)

### NFR-003.5: Input Sanitization

**Requirement**: All user-generated content displayed in the dashboard (agent log messages, decisions, questions) must be sanitized to prevent XSS.

**Implementation**: Angular's template binding (`{{ }}` and `[textContent]`) automatically HTML-escapes content. Avoid `[innerHTML]` bindings. If rich text is needed, use Angular's `DomSanitizer.sanitizeHtml()`.

---

## NFR-004: Accessibility

### NFR-004.1: WCAG 2.1 AA Compliance

**Requirement**: The entire dashboard UI must comply with **WCAG 2.1 Level AA** accessibility standards.

**Rationale**: Enterprise operators may include users with disabilities. Compliance is a baseline requirement per the Angular Development Instructions in this repository.

**Key WCAG 2.1 AA Requirements**:

| Criterion | Level | Implementation |
|-----------|-------|----------------|
| 1.1.1 Non-text Content | A | All icons have `aria-label` or paired visible text |
| 1.3.1 Info and Relationships | A | Semantic HTML: `<main>`, `<nav>`, `<article>`, `<section>` |
| 1.4.3 Contrast (Minimum) | AA | 4.5:1 contrast ratio for text; 3:1 for large text |
| 1.4.4 Resize Text | AA | Dashboard readable at 200% zoom |
| 2.1.1 Keyboard | A | All interactive elements keyboard-accessible (Tab, Enter, Escape) |
| 2.1.2 No Keyboard Trap | A | Focus can always escape modals/overlays |
| 2.4.3 Focus Order | A | Logical tab order through agent cards and panels |
| 2.4.7 Focus Visible | AA | Focus ring visible on all interactive elements |
| 3.1.1 Language of Page | A | `<html lang="en">` set |
| 3.2.1 On Focus | A | No unexpected context changes on focus |
| 4.1.2 Name, Role, Value | A | ARIA roles on custom components (status badges, timeline) |

### NFR-004.2: Keyboard Navigation

**Requirement**: All dashboard interactions must be achievable via keyboard alone.

**Keyboard Shortcut Specification**:
| Key | Action |
|-----|--------|
| `Tab` | Move focus to next interactive element |
| `Shift+Tab` | Move focus to previous interactive element |
| `Arrow Keys` | Navigate between agent cards in grid |
| `Enter` / `Space` | Select focused agent card |
| `Escape` | Close active overlay, panel, or modal |
| `F` | Focus filter search box |

### NFR-004.3: Screen Reader Support

**Requirement**: Dashboard state changes must be announced to screen readers via ARIA live regions.

**Implementation Requirements**:
- Agent status changes: `aria-live="polite"` region announces new status
- New activity entries: `aria-live="polite"` region announces entry count (e.g., "3 new entries")
- Error states: `aria-live="assertive"` for connection errors
- Agent card selected state: `aria-selected="true"` on selected card
- Status badges: `role="status"` with descriptive `aria-label`

```html
<!-- Example: Live region for new activity entries -->
<div aria-live="polite" aria-atomic="false" class="sr-only" id="activity-announcer">
  <!-- Updated by Angular when new entries arrive -->
</div>
```

### NFR-004.4: Color Independence

**Requirement**: Status information must not rely solely on color to convey meaning.

**Implementation**: Status badges use both color AND text (and optionally icon). Example: a "Blocked" status shows orange color + "⚠ Blocked" text — not just an orange dot.

---

## NFR-005: Reliability

### NFR-005.1: Uptime Target

**Requirement**: The dashboard service must achieve **99.5% uptime** (excluding Supabase planned maintenance).

**Calculation**: 99.5% uptime = ~3.65 hours downtime per month.

**Dependency Uptime**:
| Dependency | Supabase SLA | Risk |
|------------|-------------|------|
| Supabase Database | 99.9% (Pro) | Low |
| Supabase Realtime | 99.9% (Pro) | Low |
| Supabase Edge Functions | 99.5% | Medium |
| GitHub REST API | ~99.95% | Low |

### NFR-005.2: Graceful Degradation on Realtime Disconnect

**Requirement**: If the Supabase Realtime WebSocket connection drops, the dashboard must degrade gracefully and recover without page reload.

**Degradation Behavior**:
| Condition | Dashboard Behavior |
|-----------|-------------------|
| Realtime disconnected (< 30s) | Connection indicator shows yellow "Reconnecting..." |
| Realtime disconnected (30s–2min) | Yellow banner: "Live updates paused — reconnecting" |
| Realtime disconnected (> 2min) | Orange banner: "Connection lost — click to retry" |
| Realtime reconnected | Green flash + catch-up query loads missed entries |
| Realtime reconnected | "Reconnected" toast notification |

**Catch-up Query**: On reconnect, the dashboard queries `activity_entries` for entries with `created_at > lastKnownEntryTimestamp` to fill gaps.

### NFR-005.3: Partial Failure Tolerance

**Requirement**: A failure in one agent's data should not prevent other agents from displaying correctly.

**Implementation**: Each `AgentCardComponent` has its own error boundary. If one agent's session query fails, that card shows an error state while other cards continue functioning normally.

### NFR-005.4: GitHub Enrichment Failure Handling

**Requirement**: If the GitHub Edge Function is unavailable, the dashboard must continue functioning using cached `github_work_items` data.

**Behavior**:
- Cached data (≤ 5 min old): display with "✓ Fresh" indicator
- Cached data (5–60 min old): display with "⚠ May be stale" indicator
- Cached data (> 60 min old): display with "⚠ Stale — last synced X ago" warning
- No cached data + Edge Function unavailable: show "GitHub data unavailable" placeholder

---

## NFR-006: Maintainability

### NFR-006.1: Angular Signals Architecture

**Requirement**: All reactive state in the dashboard must use Angular Signals (not RxJS BehaviorSubjects) for UI state management.

**Rationale**: Per research/implementation-recommendations.md Section 3.2 and FEASIBILITY-SUMMARY.md: "Angular Signals integration (established pattern in apps/agent-alchemy-dev)". Signals provide simpler reactivity without subscription management overhead.

**Signal Naming Convention**:
```typescript
// Correct: Angular Signals for all component state
readonly agents = signal<AgentCardViewModel[]>([]);
readonly selectedAgentId = signal<string | null>(null);
readonly activityEntries = signal<ActivityEntry[]>([]);
readonly isLoading = signal(false);

// Correct: Computed signals for derived state
readonly activeAgents = computed(() => this.agents().filter(a => a.isOnline));
readonly openQuestionsCount = computed(() =>
  this.agents().reduce((sum, a) => sum + a.openQuestionsCount, 0)
);

// Avoid: RxJS BehaviorSubject for UI state
// readonly agents$ = new BehaviorSubject<AgentCardViewModel[]>([]); // ❌
```

**Supabase-to-Signal Bridge**: Supabase Realtime emits events in RxJS-compatible callbacks. Use `fromEvent`/`toSignal` pattern:
```typescript
// Bridge Supabase Realtime events to Angular Signals
const realtimeObservable$ = new Observable(observer => {
  channel.on('postgres_changes', { ... }, payload => observer.next(payload));
  return () => supabase.removeChannel(channel);
});
const realtimeSignal = toSignal(realtimeObservable$, { initialValue: null });
```

### NFR-006.2: OnPush Change Detection

**Requirement**: All dashboard components must use `ChangeDetectionStrategy.OnPush`.

**Rationale**: With 50 active agents potentially updating simultaneously, default change detection would be prohibitively expensive. OnPush combined with Signals ensures only components whose input signals change are re-rendered.

**Enforcement**: ESLint rule `@angular-eslint/prefer-on-push-component-change-detection` enabled for the `features/dashboard/` directory.

### NFR-006.3: Lazy-Loaded Feature Module

**Requirement**: The dashboard must be a lazy-loaded Angular route module (`DashboardModule`) that does not increase the app's initial bundle.

**Route Configuration**:
```typescript
// In app.routes.ts
{
  path: 'dashboard',
  loadChildren: () =>
    import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
}
```

**Impact**: The dashboard chunk is only loaded when the user navigates to `/dashboard`. All other app users are unaffected.

### NFR-006.4: Test Coverage Requirements

**Requirement**: The dashboard feature must achieve minimum test coverage thresholds.

| Layer | Minimum Coverage | Tool |
|-------|-----------------|------|
| Services (DashboardService, AgentRealtimeService, GitHubEnrichmentService) | 80% | Jest |
| Components (AgentCardComponent, ActivityFeedComponent, etc.) | 70% | Jest + Angular Testing Utils |
| Agent SDK (@agent-alchemy/agent-sdk) | 85% | Jest |
| E2E critical paths | 5 scenarios | Playwright |

**Critical Test Scenarios** (must have E2E coverage):
1. Dashboard loads with active agents
2. Agent status updates in real-time
3. Activity feed updates when agent posts an entry
4. Agent card selection opens correct activity panel
5. Filtering by status shows only matching agents

### NFR-006.5: Component API Documentation

**Requirement**: All public component `@Input()` and `@Output()` properties, and all service public methods, must have JSDoc documentation.

```typescript
/**
 * Displays a single agent's status card in the agent grid.
 * Updates automatically when the agent's session signal changes.
 */
@Component({ ... })
export class AgentCardComponent {
  /** The agent card data including status, project, and open question count. */
  @Input({ required: true }) agent!: AgentCardViewModel;

  /** Emits the agentId when this card is clicked. */
  @Output() agentSelected = new EventEmitter<string>();
}
```

---

## NFR-007: Bundle Size

### NFR-007.1: Dashboard Feature Bundle Limit

**Requirement**: The lazy-loaded dashboard feature chunk must not exceed **150KB gzipped**.

**Budget Breakdown**:
| Component | Estimated Gzipped Size |
|-----------|----------------------|
| Angular dashboard components (8 components) | ~30KB |
| Dashboard services (3 services) | ~10KB |
| PrimeNG Timeline component (if tree-shaken) | ~25KB |
| PrimeNG DataView (if tree-shaken) | ~20KB |
| @supabase/realtime-js (Realtime only) | ~35KB |
| Models, pipes, utils | ~5KB |
| **Total** | **~125KB** (within 150KB budget) |

**Note**: `@supabase/supabase-js` is already in the main bundle — only the Realtime subscription overhead is additional. PrimeNG components must be imported individually (not from `primeng` barrel).

### NFR-007.2: Tree-Shaking

**Requirement**: Unused PrimeNG components must be tree-shaken from the dashboard bundle.

**Implementation**: Import specific PrimeNG modules, not `PrimeNGModule`:
```typescript
// Correct: Individual module imports
import { TimelineModule } from 'primeng/timeline';
import { DataViewModule } from 'primeng/dataview';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';

// Incorrect: Barrel import (includes entire PrimeNG library)
// import { PrimeNGModule } from 'primeng'; // ❌
```

---

## NFR-008: Browser Support

### NFR-008.1: Target Browser Matrix

**Requirement**: The dashboard must function correctly on the following browsers.

| Browser | Minimum Version | Market Share Justification |
|---------|----------------|---------------------------|
| Chrome | 90+ | Primary development browser; V8 engine |
| Firefox | 88+ | WebSocket + Realtime API parity |
| Safari | 14+ | macOS/iOS developer primary browser |
| Edge | 90+ | Windows enterprise users |

**Features Required**:
- WebSocket (for Supabase Realtime): All supported browsers ✓
- CSS Grid + Flexbox: All supported browsers ✓
- ES2020+ (optional chaining, nullish coalescing): All supported browsers ✓
- CSS Custom Properties: All supported browsers ✓
- Intersection Observer (for virtual scroll): All supported browsers ✓

### NFR-008.2: No Internet Explorer Support

**Requirement**: IE11 and below are explicitly out of scope. No polyfills for IE will be added.

---

## NFR-009: Observability

### NFR-009.1: Dashboard Health Indicators

**Requirement**: The dashboard must display its own health status to operators.

**Health Indicators**:
| Indicator | Location | Condition |
|-----------|----------|-----------|
| Realtime Connection | Top-right status dot | Green = connected, Yellow = reconnecting, Red = disconnected |
| Last data refresh | Footer | "Data refreshed 30s ago" |
| Agent count | Header | "12 Active Agents" |
| Open questions count | Header badge | "❓ 5 Open Questions" |

### NFR-009.2: Error Logging

**Requirement**: JavaScript errors in the dashboard must be caught and logged for debugging.

**Implementation**:
- Angular global `ErrorHandler` catches uncaught errors
- Errors are logged to the browser console (development) or a logging service (production)
- Supabase Realtime errors surface as in-app notifications (not silent failures)

---

## Summary Table

| NFR | Category | Target | Priority |
|-----|----------|--------|----------|
| NFR-001.1 | Performance | Dashboard loads < 500ms | Critical |
| NFR-001.2 | Performance | Updates visible < 3s | Critical |
| NFR-001.3 | Performance | 50 agents, CPU < 50% | High |
| NFR-001.4 | Performance | 1000+ entries scroll at 60fps | High |
| NFR-002.1 | Scalability | Works on Supabase free tier | High |
| NFR-002.2 | Scalability | Scales to Pro plan for 50+ agents | High |
| NFR-002.3 | Scalability | 90-day activity retention | Medium |
| NFR-003.1 | Security | Zero GitHub tokens in browser | Critical |
| NFR-003.2 | Security | RLS on all tables | Critical |
| NFR-003.3 | Security | Realtime scoped to org | Critical |
| NFR-004.1 | Accessibility | WCAG 2.1 AA | High |
| NFR-004.2 | Accessibility | Full keyboard navigation | High |
| NFR-004.3 | Accessibility | Screen reader support | High |
| NFR-005.1 | Reliability | 99.5% uptime | High |
| NFR-005.2 | Reliability | Graceful Realtime reconnect | High |
| NFR-005.3 | Reliability | Partial failure isolation | High |
| NFR-006.1 | Maintainability | Angular Signals only | High |
| NFR-006.2 | Maintainability | OnPush change detection | High |
| NFR-006.3 | Maintainability | Lazy-loaded module | Medium |
| NFR-006.4 | Maintainability | 80% service test coverage | High |
| NFR-007.1 | Bundle Size | < 150KB gzipped feature chunk | Medium |
| NFR-008.1 | Browser Support | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ | High |
| NFR-009.1 | Observability | Health indicators visible | Medium |
