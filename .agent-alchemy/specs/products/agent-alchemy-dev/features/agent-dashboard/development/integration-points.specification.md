---
meta:
  id: agent-dashboard-development-integration-points
  title: Integration Points - AI Agent Dashboard Development
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:agent-alchemy-dev
  tags: [agent-dashboard, development, angular, supabase, typescript]
  createdBy: Agent Alchemy Developer
  createdAt: '2026-03-13'
  reviewedAt: null
title: Integration Points - AI Agent Activity Dashboard
category: Products
feature: agent-dashboard
lastUpdated: '2026-03-13'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: development
applyTo: []
keywords: [agent, dashboard, angular, signals, supabase, primeng, integration]
topics: []
useCases: []
references:
  - architecture/ui-components.specification.md
  - architecture/database-schema.specification.md
depends-on:
  - architecture/system-architecture.specification.md
specification: 4-integration-points
---

# Integration Points: AI Agent Activity Dashboard

## Overview

How all pieces of `@buildmotion-ai/agent-dashboard` connect: Angular routing, Supabase Realtime channels, the GitHub proxy Edge Function, Signal coordination between services, error handling patterns, and the Supabase client token bridge.

---

## 1. Lazy-Loading `DashboardComponent` via `app.routes.ts`

### Route Registration

```typescript
// apps/agent-alchemy-dev/src/app/app.routes.ts
{
  path: 'dashboard',
  loadComponent: () =>
    import('@buildmotion-ai/agent-dashboard').then((m) => m.DashboardComponent),
}
```

### What Happens at Route Activation

1. Angular Router requests the `dashboard` chunk from the build output.
2. `@buildmotion-ai/agent-dashboard` chunk is fetched (first navigation only).
3. `DashboardComponent` is instantiated; Angular injects `DashboardService` and `AgentRealtimeService` (both `providedIn: 'root'`).
4. `DashboardComponent.ngOnInit()` is called:
   - Reads `orgId` from `DashboardService.currentOrgId()`.
   - Calls `DashboardService.loadInitialData(orgId)` — fires async Supabase query.
   - Calls `AgentRealtimeService.connect(orgId)` — opens WebSocket channels.
5. `DashboardComponent.ngOnDestroy()` is called when leaving the route:
   - Calls `AgentRealtimeService.disconnect()` — closes channels and stops retry timer.

### `orgId` Initialization

`DashboardService` reads `orgId` from the authenticated Supabase session JWT. This happens in `DashboardService.initOrgId()`, called lazily before `loadInitialData`:

```typescript
// Inside DashboardService
private async initOrgId(): Promise<string> {
  const { data: { user } } = await this.supabase.auth.getUser();
  const orgId = (user?.app_metadata?.['org_id'] as string) ?? '';
  this._currentOrgId.set(orgId);
  return orgId;
}

async loadInitialData(orgId?: string): Promise<void> {
  const resolvedOrgId = orgId ?? await this.initOrgId();
  // ...rest of loadInitialData
}
```

---

## 2. `AgentRealtimeService` — Supabase Realtime Channel Subscription

### Channel Architecture

| Channel Name | Table | Events | Purpose |
|---|---|---|---|
| `org:{orgId}:activity` | `activity_entries` | `INSERT` | New activity entries |
| `org:{orgId}:sessions` | `agent_sessions` | `INSERT`, `UPDATE` | Session state changes |

### Subscription Code Pattern

```typescript
// agent-realtime.service.ts
private subscribeToChannels(orgId: string): void {
  // ─── Activity entries channel ─────────────────────────────────────────
  this.activityChannel = this.supabase
    .channel(`org:${orgId}:activity`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_entries',
        filter: `org_id=eq.${orgId}`,
      },
      (payload) => this.handleActivityEntry(payload.new as Record<string, unknown>)
    )
    .subscribe((status) => this.handleChannelStatus(status, 'activity'));

  // ─── Sessions channel ─────────────────────────────────────────────────
  this.sessionsChannel = this.supabase
    .channel(`org:${orgId}:sessions`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'agent_sessions',
        filter: `org_id=eq.${orgId}`,
      },
      (payload) => this.handleSessionChange(payload.new as Record<string, unknown>)
    )
    .subscribe((status) => this.handleChannelStatus(status, 'sessions'));
}
```

### Realtime → Signal Data Flow

```
Supabase Realtime (WebSocket)
  └─► RealtimeChannel.on('postgres_changes', ...)
        └─► AgentRealtimeService.handleActivityEntry(row)
              └─► mapRowToActivityEntry(row)  [activity-entry.model.ts]
                    └─► DashboardService.onRealtimeActivityEntry(entry)
                          └─► _activityEntries.update(entries => [...entries, entry])
                                └─► ActivityFeedComponent reads activityEntries()
                                      └─► Template re-renders new entry
```

### Reconnection Strategy

```
Channel status: 'CHANNEL_ERROR' or 'TIMED_OUT'
  └─► AgentRealtimeService._connectionState.set('error')
  └─► scheduleReconnect():
        retryCount=0 → delay 1s
        retryCount=1 → delay 2s
        retryCount=2 → delay 4s
        retryCount=3 → delay 8s
        retryCount=4 → delay 16s
        retryCount=5 → MAX_RETRIES reached → state = 'error' (manual reconnect required)

On each reconnect attempt:
  └─► disconnect() [remove old channels]
  └─► subscribeToChannels(orgId)
  └─► On 'SUBSCRIBED':
        └─► retryCount = 0
        └─► state = 'connected'
        └─► catchUpOnMissedEntries()
```

### Catch-Up Query on Reconnect

When the Realtime connection is re-established after a disconnect, the service queries for any entries that arrived during the gap:

```typescript
private async catchUpOnMissedEntries(): Promise<void> {
  const agent = this.dashboardService.selectedAgent();
  if (!agent?.activeSessionId) return;

  const entries = this.dashboardService.activityEntries();
  const lastTimestamp = entries.at(-1)?.timestamp ?? new Date(Date.now() - 60_000);

  const { data } = await this.supabase
    .from('activity_entries')
    .select('*')
    .eq('session_id', agent.activeSessionId)
    .gt('timestamp', lastTimestamp.toISOString())
    .order('timestamp', { ascending: true });

  (data ?? [])
    .map(mapRowToActivityEntry)
    .forEach((e) => this.dashboardService.onRealtimeActivityEntry(e));
}
```

---

## 3. `GitHubEnrichmentService` — Edge Function Integration

### Request Flow

```
ActivityEntryComponent: user clicks GitHub link
  └─► DashboardService.selectGitHubWorkItem(url)
        └─► _selectedGitHubUrl.set(url)
              └─► GitHubWorkItemComponent reads selectedGitHubWorkItem()
                    └─► On ngOnChanges: GitHubEnrichmentService.fetchWorkItem(url)
                          └─► LRU cache hit? → return cached GitHubWorkItem
                          └─► In-flight? → return existing Promise
                          └─► Cache miss:
                                └─► POST /functions/v1/github-proxy
                                      └─► Edge Function calls GitHub REST API
                                            └─► 200 OK: map to GitHubWorkItem
                                                  └─► DashboardService.cacheGitHubWorkItem(item)
                                                  └─► GitHubWorkItemComponent signal updated
```

### Edge Function Call

```typescript
// github-enrichment.service.ts
private async callGithubProxy(githubUrl: string): Promise<GitHubWorkItem> {
  const supabaseUrl = inject(APP_CONFIG_TOKEN).supabase.supabaseUrl;
  const anonKey    = inject(APP_CONFIG_TOKEN).supabase.supabaseAnonKey;

  const response = await this.http.post<GitHubWorkItem>(
    `${supabaseUrl}/functions/v1/github-proxy`,
    { url: githubUrl },
    {
      headers: {
        'Authorization': `Bearer ${await this.getAccessToken()}`,
        'apikey': anonKey,
      },
    }
  ).toPromise();

  if (!response) throw new Error('Empty response from github-proxy');
  return response;
}
```

### LRU Cache Implementation

```typescript
// 256-entry LRU — array-based, O(n) for simplicity at this size
private readonly cache: Array<{ key: string; value: GitHubWorkItem }> = [];
private readonly MAX_CACHE_SIZE = 256;

private getFromCache(url: string): GitHubWorkItem | null {
  const index = this.cache.findIndex((e) => e.key === url);
  if (index === -1) return null;
  // Move to front (most-recently-used)
  const [entry] = this.cache.splice(index, 1);
  this.cache.unshift(entry);
  return entry.value;
}

private addToCache(url: string, item: GitHubWorkItem): void {
  this.cache.unshift({ key: url, value: item });
  if (this.cache.length > this.MAX_CACHE_SIZE) {
    this.cache.pop(); // evict least-recently-used
  }
}
```

### In-Flight Deduplication

```typescript
private readonly inFlight = new Map<string, Promise<GitHubWorkItem>>();

async fetchWorkItem(githubUrl: string): Promise<GitHubWorkItem> {
  const cached = this.getFromCache(githubUrl);
  if (cached) return cached;

  const existing = this.inFlight.get(githubUrl);
  if (existing) return existing;

  const promise = this.callGithubProxy(githubUrl)
    .then((item) => {
      this.addToCache(githubUrl, item);
      this.dashboardService.cacheGitHubWorkItem(item);
      return item;
    })
    .finally(() => this.inFlight.delete(githubUrl));

  this.inFlight.set(githubUrl, promise);
  return promise;
}
```

---

## 4. `DashboardService` — Signal Coordination

### Signal Graph

```
_currentOrgId ──────────────────────────────────────► loadInitialData()
                                                            └─► _agents.set([])
                                                            └─► _isLoading.set(true/false)

_selectedAgentId ──────────────────────► selectedAgent (computed)
                                              └─► effect() → loadActivityForAgent()
                                                    └─► _activityEntries.set([])
                                                    └─► _isLoadingEntries.set(true/false)

_agents ──────────────────────────────► filteredAgents (computed, depends on _filterConfig)
        └───────────────────────────── alertAgents (computed)
        └───────────────────────────── openQuestionsCount (computed)

_filterConfig ─────────────────────────► filteredAgents (computed, depends on _agents)

_selectedGitHubUrl ────────────────────► selectedGitHubWorkItem (computed, depends on _gitHubWorkItems)
_gitHubWorkItems ──────────────────────┘

AgentRealtimeService (session INSERT/UPDATE)
  └─► onRealtimeSessionChange() → _agents.update()

AgentRealtimeService (activity INSERT)
  └─► onRealtimeActivityEntry() → _activityEntries.update()

GitHubWorkItemComponent (after enrichment)
  └─► cacheGitHubWorkItem() → _gitHubWorkItems.update()
```

### `effect()` for Side Effects

Angular's `effect()` is used **once** in `DashboardService` constructor to react to `selectedAgent` changes:

```typescript
constructor() {
  effect(() => {
    const agent = this.selectedAgent(); // reads signal — registers dependency
    if (agent?.activeSessionId) {
      void this.loadActivityForAgent(agent.id, agent.activeSessionId);
    } else {
      this._activityEntries.set([]);
    }
  });
}
```

**Rule**: `effect()` is for loading side effects triggered by signal changes. It is not used for synchronous derived values — those use `computed()`.

---

## 5. Error Handling Patterns

### Service-Level Errors (async/await + try/catch)

Every async service method follows this pattern:

```typescript
async loadInitialData(orgId: string): Promise<void> {
  this._isLoading.set(true);
  try {
    const { data, error } = await this.supabase
      .from('active_agent_dashboard_view')
      .select('*')
      .eq('org_id', orgId);

    if (error) throw error;
    this._agents.set((data ?? []).map(mapViewRowToAgent));
  } catch (err) {
    // Log with structured context; do NOT rethrow — set error signal instead
    console.error('[DashboardService] loadInitialData error:', err);
    this._error.set(err instanceof Error ? err.message : 'Failed to load agents');
  } finally {
    this._isLoading.set(false);
  }
}
```

### `_error` Signal

`DashboardService` exposes a readonly `error: Signal<string | null>` that templates display as a non-blocking toast or banner:

```typescript
private readonly _error = signal<string | null>(null);
readonly error = this._error.asReadonly();
```

### Realtime Connection Errors

`DashboardComponent` template reads `connectionState()` and renders a banner when state is `'error'`:

```html
@if (connectionState() === 'error') {
  <div class="connection-error-banner" role="alert">
    Realtime connection lost.
    <button (click)="onReconnect()">Reconnect</button>
  </div>
}
```

`DashboardComponent.onReconnect()` calls `AgentRealtimeService.manualReconnect()`, which resets `retryCount` and calls `subscribeToChannels()` again.

### GitHub Enrichment Errors

`GitHubWorkItemComponent` renders an error state on HTTP failure:

```typescript
protected async loadWorkItem(url: string): Promise<void> {
  this._isLoading.set(true);
  this._error.set(null);
  try {
    const item = await this.enrichmentService.fetchWorkItem(url);
    this._workItem.set(item);
  } catch {
    this._error.set('Failed to load GitHub details');
  } finally {
    this._isLoading.set(false);
  }
}
```

---

## 6. Supabase Client Initialization

### Token Definition (in library)

```typescript
// libs/agency/agent-dashboard/src/lib/tokens/supabase.token.ts
import { InjectionToken } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient>(
  'SUPABASE_CLIENT'
);
```

### Provider (in app)

Added to `apps/agent-alchemy-dev/src/app/app.config.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '@buildmotion-ai/agent-dashboard';

// In providers array:
{
  provide: SUPABASE_CLIENT,
  useFactory: () =>
    createClient(
      APP_CONFIG.supabase.supabaseUrl,
      APP_CONFIG.supabase.supabaseAnonKey
    ),
},
```

### Usage in Services

```typescript
// In DashboardService, AgentRealtimeService:
private readonly supabase = inject<SupabaseClient>(SUPABASE_CLIENT);
```

This pattern keeps the `SupabaseClient` singleton out of the library itself (no `createClient` calls inside the library), ensuring testability and compatibility with the app's existing Supabase configuration.

---

## 7. Component Input/Output Wiring Summary

| Parent | Child | Data Flows In | Events Out |
|--------|-------|--------------|------------|
| `DashboardComponent` | `AgentGridComponent` | `agents: Agent[]`, `selectedAgentId: string\|null` | `agentSelected: string` |
| `DashboardComponent` | `ActivityPanelComponent` | `agent: Agent` | — |
| `DashboardComponent` | `FilterSidebarComponent` | — | `filterChanged: Partial<FilterConfig>` |
| `DashboardComponent` | `EmptyStateComponent` | `message: string` | — |
| `AgentGridComponent` | `AgentCardComponent` | `agent: Agent`, `isSelected: boolean` | `selected: string` |
| `AgentCardComponent` | `AgentStatusBadgeComponent` | `status: AgentStatus` | — |
| `ActivityPanelComponent` | `ActivityFeedComponent` | — | `githubLinkClicked: string` |
| `ActivityFeedComponent` | `ActivityEntryComponent` | `entry: ActivityEntry` | `githubLinkClicked: string` |
| `ActivityPanelComponent` | `GitHubWorkItemComponent` | `githubUrl: string\|null` | — |

All services are injected directly; no `@Input()` wiring for service data except `DashboardComponent → AgentGridComponent` (agents list) and `DashboardComponent → ActivityPanelComponent` (selected agent). All other components read directly from injected `DashboardService` signals.
