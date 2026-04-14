---
meta:
  id: agent-dashboard-development-documentation-requirements
  title: Documentation Requirements - AI Agent Dashboard Development
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:agent-alchemy-dev
  tags: [agent-dashboard, development, angular, supabase, typescript, documentation]
  createdBy: Agent Alchemy Developer
  createdAt: '2026-03-13'
  reviewedAt: null
title: Documentation Requirements - AI Agent Activity Dashboard
category: Products
feature: agent-dashboard
lastUpdated: '2026-03-13'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: development
applyTo: []
keywords: [agent, dashboard, angular, signals, supabase, documentation, jsdoc]
topics: []
useCases: []
references:
  - architecture/ui-components.specification.md
  - architecture/database-schema.specification.md
depends-on:
  - architecture/system-architecture.specification.md
specification: 6-documentation-requirements
---

# Documentation Requirements: AI Agent Activity Dashboard

## Overview

Documentation standards for `@buildmotion-ai/agent-dashboard`. Covers JSDoc for all public service methods, the library README, and inline comments for complex logic (Realtime reconnection, LRU cache, discriminated union mapping).

---

## 1. JSDoc Requirements

### Rule: Every Public Service Method

All `public` and `protected` methods on `DashboardService`, `AgentRealtimeService`, and `GitHubEnrichmentService` must have a JSDoc block with:

- One-sentence description
- `@param` for each parameter
- `@returns` (or `@returns void` explicitly)
- `@throws` if the method can reject/throw under documented conditions

**Standard template:**

```typescript
/**
 * [One-sentence description of what the method does.]
 *
 * @param paramName - Description of the parameter.
 * @returns Description of the return value.
 * @throws {Error} When [condition that causes rejection].
 */
```

---

### `DashboardService` — JSDoc Samples

```typescript
/**
 * Loads the initial agent list from `active_agent_dashboard_view` for the
 * specified organization and populates the `agents` signal.
 *
 * Sets `isLoading` to `true` during the fetch and `false` on completion
 * (success or error). On Supabase error, logs to console and sets the
 * `error` signal; does not throw.
 *
 * @param orgId - Organization identifier. Must match the authenticated user's JWT claim.
 * @returns Promise that resolves when the fetch completes (or silently on error).
 */
async loadInitialData(orgId: string): Promise<void>

/**
 * Loads up to 100 activity entries for a specific session, ordered by
 * `timestamp ASC`, and replaces the `activityEntries` signal.
 *
 * @param agentId - ID of the owning agent (used for logging context only).
 * @param sessionId - UUID of the session whose entries to load.
 * @returns Promise that resolves when the fetch completes.
 */
async loadActivityForAgent(agentId: string, sessionId: string): Promise<void>

/**
 * Sets the currently selected agent ID, which triggers the `effect()` in
 * the constructor to automatically load that agent's activity entries.
 * Clears the GitHub work item panel selection on agent switch.
 *
 * @param agentId - Agent ID to select, or `null` to deselect.
 */
setSelectedAgent(agentId: string | null): void

/**
 * Applies a partial filter configuration update. Only the provided keys
 * are changed; all other filter dimensions remain unchanged.
 *
 * @param config - Partial filter config to merge with the current config.
 */
setFilter(config: Partial<FilterConfig>): void

/**
 * Resets all filter dimensions to their default (no-filter) values.
 */
clearFilters(): void

/**
 * Sets the GitHub URL for the enrichment panel. The `selectedGitHubWorkItem`
 * computed signal resolves this URL against the cache map.
 *
 * @param url - Full GitHub issue or PR URL, e.g. `https://github.com/org/repo/issues/42`.
 */
selectGitHubWorkItem(url: string): void

/**
 * Appends a new activity entry from a Supabase Realtime INSERT event to
 * the `activityEntries` signal. Silently ignores entries whose `sessionId`
 * does not match the currently selected agent's active session.
 *
 * Called exclusively by `AgentRealtimeService`.
 *
 * @param entry - Parsed `ActivityEntry` domain object.
 */
onRealtimeActivityEntry(entry: ActivityEntry): void

/**
 * Updates the matching agent's `status`, `currentTask`, and `lastHeartbeatAt`
 * in the `agents` signal when a session INSERT or UPDATE arrives via
 * Supabase Realtime.
 *
 * Called exclusively by `AgentRealtimeService`.
 *
 * @param sessionRow - Raw Supabase Realtime payload row from `agent_sessions`.
 */
onRealtimeSessionChange(sessionRow: Record<string, unknown>): void

/**
 * Stores a resolved `GitHubWorkItem` in the in-memory cache map, making it
 * available to the `selectedGitHubWorkItem` computed signal.
 *
 * Called by `GitHubWorkItemComponent` after enrichment completes.
 *
 * @param item - Enriched GitHub work item to cache.
 */
cacheGitHubWorkItem(item: GitHubWorkItem): void
```

---

### `AgentRealtimeService` — JSDoc Samples

```typescript
/**
 * Opens Supabase Realtime WebSocket subscriptions for the given organization's
 * activity entries and agent sessions. A no-op if already connected to the
 * same `orgId`.
 *
 * Sets `connectionState` to `'connecting'` immediately. Transitions to
 * `'connected'` on successful subscription or `'error'` on failure.
 * Exponential-backoff reconnection is applied automatically on errors.
 *
 * @param orgId - Organization ID used to scope both channel names
 *   (`org:{orgId}:activity`, `org:{orgId}:sessions`).
 */
connect(orgId: string): void

/**
 * Removes all active Realtime channels and cancels any pending retry
 * timers. Sets `connectionState` to `'disconnected'`.
 *
 * Safe to call multiple times; idempotent if already disconnected.
 */
disconnect(): void

/**
 * Resets the retry counter and immediately attempts to reconnect. Intended
 * for manual reconnect triggered by the user after `connectionState` reaches
 * `'error'` following the maximum number of automatic retries.
 */
manualReconnect(): void
```

---

### `GitHubEnrichmentService` — JSDoc Samples

```typescript
/**
 * Fetches enriched GitHub issue or PR details for the given URL.
 *
 * Resolution priority:
 * 1. **LRU cache** — returns immediately if previously fetched.
 * 2. **In-flight deduplication** — if a fetch for the same URL is already
 *    in progress, returns the existing Promise (no duplicate HTTP call).
 * 3. **HTTP fetch** — calls the `github-proxy` Supabase Edge Function,
 *    caches the result, and notifies `DashboardService.cacheGitHubWorkItem`.
 *
 * @param githubUrl - Full GitHub URL, e.g. `https://github.com/org/repo/issues/42`.
 * @returns Promise resolving to the enriched `GitHubWorkItem`.
 * @throws {HttpErrorResponse} When the Edge Function returns a non-2xx status.
 */
fetchWorkItem(githubUrl: string): Promise<GitHubWorkItem>

/**
 * Eagerly prefetches multiple GitHub work items in parallel. Each URL is
 * subject to the same LRU cache and in-flight deduplication as `fetchWorkItem`.
 * Errors from individual URLs are caught and logged; they do not reject the
 * overall call.
 *
 * @param urls - Array of GitHub URLs to prefetch.
 * @returns Promise that resolves when all fetches have settled.
 */
prefetchWorkItems(urls: string[]): Promise<void>

/**
 * Clears the LRU cache. Primarily used in tests to ensure a clean state
 * between test cases.
 */
clearCache(): void
```

---

## 2. Inline Comments for Complex Logic

### Realtime Reconnection — `agent-realtime.service.ts`

```typescript
/**
 * Exponential backoff with jitter for Supabase Realtime reconnection.
 *
 * Strategy:
 *   Attempt 0 → ~1 s delay
 *   Attempt 1 → ~2 s delay
 *   Attempt 2 → ~4 s delay
 *   Attempt 3 → ~8 s delay
 *   Attempt 4 → ~16 s delay
 *   Attempt 5 → MAX_RETRIES reached: state = 'error', no further retries
 *
 * The ±500ms jitter prevents "thundering herd" problems when multiple
 * browser tabs attempt to reconnect simultaneously after a network partition.
 *
 * After each successful 'SUBSCRIBED' event, retryCount is reset to 0 so
 * that a subsequent transient failure starts the backoff sequence fresh.
 */
private scheduleReconnect(): void {
  if (this.retryCount >= this.MAX_RETRIES) {
    // Give up: require manual intervention.
    // DashboardComponent will show a "Reconnect" button in this state.
    this._connectionState.set('error');
    return;
  }

  const baseDelay = Math.pow(2, this.retryCount) * 1000;
  const jitter    = Math.random() * 500; // ±500ms
  const delay     = baseDelay + jitter;

  this.retryCount++;

  this.retryTimer = setTimeout(() => {
    // Dispose of stale channels before creating new subscriptions.
    // Supabase JS v2 does not auto-close old channels on re-subscribe.
    this.removeChannels();
    this.subscribeToChannels(this.currentOrgId!);
  }, delay);
}
```

### LRU Cache — `github-enrichment.service.ts`

```typescript
/**
 * Array-based LRU (Least-Recently-Used) cache.
 *
 * Why array instead of Map + doubly-linked list?
 * At ≤256 entries the O(n) splice is negligible (~microseconds).
 * An array is simpler to implement, inspect in DevTools, and test.
 *
 * Invariant: cache[0] is the most-recently-used entry.
 * Invariant: cache[cache.length - 1] is the least-recently-used entry.
 * Invariant: cache.length ≤ MAX_CACHE_SIZE (256).
 *
 * On GET (cache hit):
 *   1. Find index via linear scan.
 *   2. splice(index, 1) to remove the entry.
 *   3. unshift() to move it to position 0 (MRU).
 *
 * On PUT (cache miss after HTTP fetch):
 *   1. unshift() to insert at position 0 (MRU).
 *   2. If length > MAX_CACHE_SIZE: pop() to remove LRU entry.
 */
```

### ActivityEntry Discriminated Union Mapper — `activity-entry.model.ts`

```typescript
/**
 * Maps a raw Supabase row (`Record<string, unknown>`) to a strongly-typed
 * `ActivityEntry` discriminated union member.
 *
 * Why `Record<string, unknown>` and not a generated Supabase schema type?
 * Supabase Realtime payloads arrive as plain objects at runtime; the generated
 * `Database` types are compile-time only. Casting via `Record<string, unknown>`
 * plus explicit `as` casts at each field is the safest approach until
 * Supabase provides typed Realtime payloads.
 *
 * Unknown `type` values are degraded to a `LogEntry` with level `'info'` rather
 * than throwing. This prevents the dashboard from crashing when the backend
 * introduces a new entry type before the frontend is deployed with support for it.
 */
export function mapRowToActivityEntry(row: Record<string, unknown>): ActivityEntry
```

---

## 3. Library README

**File**: `libs/agency/agent-dashboard/README.md`

```markdown
# @buildmotion-ai/agent-dashboard

Real-time AI Agent Activity Dashboard for `apps/agent-alchemy-dev`.

Built with Angular 18 Signals, PrimeNG 18, Supabase Realtime, and TailwindCSS.

## Usage

### Route Registration

```typescript
// app.routes.ts
{
  path: 'dashboard',
  loadComponent: () =>
    import('@buildmotion-ai/agent-dashboard').then((m) => m.DashboardComponent),
}
```

### Required Providers

Add to `app.config.ts` providers array:

```typescript
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '@buildmotion-ai/agent-dashboard';

{
  provide: SUPABASE_CLIENT,
  useFactory: () => createClient(SUPABASE_URL, SUPABASE_ANON_KEY),
},
```

### Public API

```typescript
import {
  DashboardComponent,
  DashboardService,
  AgentRealtimeService,
  GitHubEnrichmentService,
  SUPABASE_CLIENT,

  // Models
  Agent,
  AgentStatus,
  ActivityEntry,
  LogEntry,
  DecisionEntry,
  QuestionEntry,
  GitHubActionEntry,
  StatusChangeEntry,
  MilestoneEntry,
  ErrorEntry,
  FilterConfig,
  GitHubWorkItem,

  // Type guards
  isLogEntry,
  isDecisionEntry,
  isQuestionEntry,
  isGitHubActionEntry,
  isStatusChangeEntry,
  isMilestoneEntry,
  isErrorEntry,
} from '@buildmotion-ai/agent-dashboard';
```

## Architecture

- **`DashboardService`** — central Signal store; coordinates all dashboard state
- **`AgentRealtimeService`** — Supabase Realtime WebSocket with exponential backoff
- **`GitHubEnrichmentService`** — GitHub issue/PR enrichment with 256-entry LRU cache

## Design Constraints

- **No RxJS in components** — Angular Signals only
- **OnPush change detection** on all components
- **`providedIn: 'root'`** for all services — singleton per app instance
- **Signals are read-only outside the service** — mutators are explicit methods

## Development

```bash
npx nx test agency-agent-dashboard       # run tests
npx nx test agency-agent-dashboard --coverage
npx nx build agency-agent-dashboard      # build library
npx nx lint agency-agent-dashboard       # lint
```

## Dependencies

| Package | Version |
|---------|---------|
| `@angular/core` | ~18.2.0 |
| `@supabase/supabase-js` | ^2.52.0 |
| `primeng` | 18.0.2 |
| `tailwindcss` | 3.4.10 |

## Related Architecture Docs

- [`architecture/system-architecture.specification.md`](../.agent-alchemy/specs/products/agent-alchemy-dev/features/agent-dashboard/architecture/system-architecture.specification.md)
- [`architecture/ui-components.specification.md`](../.agent-alchemy/specs/products/agent-alchemy-dev/features/agent-dashboard/architecture/ui-components.specification.md)
- [`architecture/database-schema.specification.md`](../.agent-alchemy/specs/products/agent-alchemy-dev/features/agent-dashboard/architecture/database-schema.specification.md)
```

---

## 4. Documentation Completeness Checklist

Before marking Phase 4 (Developer Agent) complete, verify:

- [ ] Every `public` method on `DashboardService` has a JSDoc block
- [ ] Every `public` method on `AgentRealtimeService` has a JSDoc block
- [ ] Every `public` method on `GitHubEnrichmentService` has a JSDoc block
- [ ] `scheduleReconnect()` has the backoff strategy comment block
- [ ] `cache` array in `GitHubEnrichmentService` has the LRU invariant comment
- [ ] `mapRowToActivityEntry()` has the union-mapping rationale comment
- [ ] `SUPABASE_CLIENT` injection token has a one-line JSDoc
- [ ] `libs/agency/agent-dashboard/README.md` exists with usage example
- [ ] All `ActivityEntry` variant interfaces are documented with field descriptions
- [ ] `FilterConfig` fields are documented with their filtering semantics
