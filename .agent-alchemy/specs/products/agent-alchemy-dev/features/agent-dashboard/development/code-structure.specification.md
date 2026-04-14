---
meta:
  id: agent-dashboard-development-code-structure
  title: Code Structure - AI Agent Dashboard Development
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:agent-alchemy-dev
  tags: [agent-dashboard, development, angular, supabase, typescript]
  createdBy: Agent Alchemy Developer
  createdAt: '2026-03-13'
  reviewedAt: null
title: Code Structure - AI Agent Activity Dashboard
category: Products
feature: agent-dashboard
lastUpdated: '2026-03-13'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: development
applyTo: []
keywords: [agent, dashboard, angular, signals, supabase, primeng, code-structure]
topics: []
useCases: []
references:
  - architecture/ui-components.specification.md
  - architecture/database-schema.specification.md
depends-on:
  - architecture/system-architecture.specification.md
specification: 2-code-structure
---

# Code Structure: AI Agent Activity Dashboard

## Overview

Complete file-by-file inventory for `libs/agency/agent-dashboard/`. Every path, purpose, public exports, imported dependencies, and estimated line-of-code count.

**Library import path**: `@buildmotion-ai/agent-dashboard`  
**Nx project name**: `agency-agent-dashboard`  
**Root**: `libs/agency/agent-dashboard/`

---

## Directory Tree

```
libs/agency/agent-dashboard/
├── README.md                              (library docs)
├── eslint.config.js                       (ESLint extends workspace config)
├── jest.config.ts                         (Jest configuration)
├── ng-package.json                        (ng-packagr entry point)
├── package.json                           (library package descriptor)
├── project.json                           (Nx project configuration)
├── tsconfig.json                          (TypeScript project references root)
├── tsconfig.lib.json                      (build tsconfig)
├── tsconfig.lib.prod.json                 (production build tsconfig)
├── tsconfig.spec.json                     (test tsconfig)
└── src/
    ├── index.ts                           (public API barrel)
    └── lib/
        ├── tokens/
        │   └── supabase.token.ts          (InjectionToken for SupabaseClient)
        ├── models/
        │   ├── agent.model.ts
        │   ├── activity-entry.model.ts
        │   ├── session.model.ts
        │   ├── github-work-item.model.ts
        │   └── filter-config.model.ts
        ├── services/
        │   ├── dashboard.service.ts
        │   ├── dashboard.service.spec.ts
        │   ├── agent-realtime.service.ts
        │   ├── agent-realtime.service.spec.ts
        │   ├── github-enrichment.service.ts
        │   └── github-enrichment.service.spec.ts
        └── components/
            ├── dashboard/
            │   ├── dashboard.component.ts
            │   ├── dashboard.component.html
            │   └── dashboard.component.scss
            ├── agent-grid/
            │   ├── agent-grid.component.ts
            │   ├── agent-grid.component.html
            │   └── agent-grid.component.scss
            ├── agent-card/
            │   ├── agent-card.component.ts
            │   ├── agent-card.component.html
            │   ├── agent-card.component.scss
            │   └── agent-card.component.spec.ts
            ├── activity-panel/
            │   ├── activity-panel.component.ts
            │   ├── activity-panel.component.html
            │   └── activity-panel.component.scss
            ├── activity-feed/
            │   ├── activity-feed.component.ts
            │   ├── activity-feed.component.html
            │   ├── activity-feed.component.scss
            │   └── activity-feed.component.spec.ts
            ├── activity-entry/
            │   ├── activity-entry.component.ts
            │   ├── activity-entry.component.html
            │   └── activity-entry.component.scss
            ├── github-work-item/
            │   ├── github-work-item.component.ts
            │   ├── github-work-item.component.html
            │   └── github-work-item.component.scss
            ├── filter-sidebar/
            │   ├── filter-sidebar.component.ts
            │   ├── filter-sidebar.component.html
            │   └── filter-sidebar.component.scss
            ├── agent-status-badge/
            │   ├── agent-status-badge.component.ts
            │   ├── agent-status-badge.component.html
            │   └── agent-status-badge.component.scss
            └── empty-state/
                ├── empty-state.component.ts
                ├── empty-state.component.html
                └── empty-state.component.scss
```

---

## Configuration Files

### `project.json`

| Property | Value |
|----------|-------|
| **Name** | `agency-agent-dashboard` |
| **Type** | library |
| **Source root** | `libs/agency/agent-dashboard/src` |
| **Build executor** | `@nx/angular:ng-packagr-lite` |
| **Build output** | `dist/libs/agency/agent-dashboard` |
| **Test executor** | `@nx/jest:jest` |
| **Lint executor** | `@nx/eslint:lint` |
| **Tags** | `scope:agency, type:feature` |

---

### `tsconfig.json`

Root tsconfig with project references to `tsconfig.lib.json` and `tsconfig.spec.json`. Extends `../../../../tsconfig.base.json`. Angular compiler options: `strictTemplates: true`, `strictInjectionParameters: true`.

---

### `ng-package.json`

| Property | Value |
|----------|-------|
| `$schema` | `../../../../node_modules/ng-packagr/ng-package.schema.json` |
| `dest` | `../../../../dist/libs/agency/agent-dashboard` |
| `lib.entryFile` | `src/index.ts` |

---

### `jest.config.ts`

| Property | Value |
|----------|-------|
| `displayName` | `agency-agent-dashboard` |
| `preset` | `../../../../jest.preset.js` |
| `setupFilesAfterFramework` | `<rootDir>/src/test-setup.ts` |
| `coverageDirectory` | `../../../../coverage/libs/agency/agent-dashboard` |

---

## Source Files

### `src/index.ts` — Public API Barrel

**Purpose**: Single export point. Consumers import from `@buildmotion-ai/agent-dashboard`.  
**Exports**: `DashboardComponent`, all models, all services, `SUPABASE_CLIENT` token.  
**LOC estimate**: ~25

---

### `src/lib/tokens/supabase.token.ts`

**Purpose**: Angular `InjectionToken<SupabaseClient>` used by all services to receive the Supabase client instance from the app's DI configuration.  
**Exports**: `SUPABASE_CLIENT: InjectionToken<SupabaseClient>`  
**Dependencies**: `@angular/core`, `@supabase/supabase-js`  
**LOC estimate**: ~10

---

## Model Files

### `src/lib/models/agent.model.ts`

**Purpose**: Domain model for an AI agent as displayed on the dashboard. Mapped from `active_agent_dashboard_view` rows.

**Key Exports**:
| Export | Kind | Description |
|--------|------|-------------|
| `AgentStatus` | type alias | Union of all valid status strings |
| `AgentType` | type alias | `copilot-coding \| custom \| specialized \| orchestrator` |
| `Agent` | interface | Full agent display model |
| `mapViewRowToAgent` | function | DB row → `Agent` mapper |

**Dependencies**: none (pure TypeScript)  
**LOC estimate**: ~70

---

### `src/lib/models/activity-entry.model.ts`

**Purpose**: Discriminated union `ActivityEntry` with 7 concrete variants. Row-to-domain mapper. Type guards.

**Key Exports**:
| Export | Kind | Description |
|--------|------|-------------|
| `ActivityEntryType` | type alias | `'log' \| 'decision' \| ...` |
| `LogLevel` | type alias | `'debug' \| 'info' \| 'warn' \| 'error'` |
| `QuestionStatus` | type alias | `'open' \| 'answered' \| 'dismissed'` |
| `GitHubActionType` | type alias | 10-variant GitHub action union |
| `ActivityEntry` | union type | Main discriminated union |
| `LogEntry` | interface | extends `BaseActivityEntry` |
| `DecisionEntry` | interface | extends `BaseActivityEntry` |
| `QuestionEntry` | interface | extends `BaseActivityEntry` |
| `GitHubActionEntry` | interface | extends `BaseActivityEntry` |
| `StatusChangeEntry` | interface | extends `BaseActivityEntry` |
| `MilestoneEntry` | interface | extends `BaseActivityEntry` |
| `ErrorEntry` | interface | extends `BaseActivityEntry` |
| `isLogEntry` | type guard | narrowing function |
| `isDecisionEntry` | type guard | narrowing function |
| `isQuestionEntry` | type guard | narrowing function |
| `isGitHubActionEntry` | type guard | narrowing function |
| `isStatusChangeEntry` | type guard | narrowing function |
| `isMilestoneEntry` | type guard | narrowing function |
| `isErrorEntry` | type guard | narrowing function |
| `mapRowToActivityEntry` | function | DB row → `ActivityEntry` mapper |

**Dependencies**: none (pure TypeScript)  
**LOC estimate**: ~160

---

### `src/lib/models/session.model.ts`

**Purpose**: Domain model for `agent_sessions` rows (used internally by `DashboardService`).

**Key Exports**:
| Export | Kind | Description |
|--------|------|-------------|
| `SessionStatus` | type alias | All 9 session status values |
| `SessionOutcome` | type alias | `'success' \| 'partial' \| 'failed' \| 'cancelled'` |
| `AgentSession` | interface | Full session model |
| `mapRowToSession` | function | DB row → `AgentSession` mapper |

**LOC estimate**: ~55

---

### `src/lib/models/github-work-item.model.ts`

**Purpose**: Enriched GitHub issue/PR data fetched via the `github-proxy` Edge Function.

**Key Exports**:
| Export | Kind | Description |
|--------|------|-------------|
| `GitHubWorkItemType` | type alias | `'issue' \| 'pull_request'` |
| `GitHubWorkItemState` | type alias | `'open' \| 'closed' \| 'merged'` |
| `GitHubWorkItem` | interface | Enriched issue/PR with labels, assignees |

**LOC estimate**: ~45

---

### `src/lib/models/filter-config.model.ts`

**Purpose**: Shape of the filter state owned by `DashboardService`.

**Key Exports**:
| Export | Kind | Description |
|--------|------|-------------|
| `FilterConfig` | interface | All filter dimensions |
| `DEFAULT_FILTER_CONFIG` | const | Empty/no-filter default |

**LOC estimate**: ~30

---

## Service Files

### `src/lib/services/dashboard.service.ts`

**Purpose**: Central coordination service. Owns all writable Signals. Coordinates `AgentRealtimeService` and `GitHubEnrichmentService` outputs.

**Key Exports**: `DashboardService`

**Public Signal API**:
| Signal | Type | Description |
|--------|------|-------------|
| `agents` | `Signal<Agent[]>` | All agents from DB view |
| `selectedAgentId` | `Signal<string \| null>` | Currently selected agent |
| `selectedAgent` | `Signal<Agent \| null>` | Computed: full Agent object |
| `filteredAgents` | `Signal<Agent[]>` | Computed: agents after filter |
| `alertAgents` | `Signal<Agent[]>` | Computed: blocked/error agents |
| `openQuestionsCount` | `Signal<number>` | Computed: total open questions |
| `activityEntries` | `Signal<ActivityEntry[]>` | Entries for selected session |
| `filterConfig` | `Signal<FilterConfig>` | Current filter config |
| `isLoading` | `Signal<boolean>` | Initial data loading state |
| `isLoadingEntries` | `Signal<boolean>` | Activity entries loading state |
| `currentOrgId` | `Signal<string>` | Current organization ID |
| `selectedGitHubWorkItem` | `Signal<GitHubWorkItem \| null>` | Computed: enriched GitHub item |

**Public Methods**:
| Method | Description |
|--------|-------------|
| `loadInitialData(orgId)` | Loads `active_agent_dashboard_view` |
| `loadActivityForAgent(agentId, sessionId)` | Loads 100 most-recent entries |
| `setSelectedAgent(agentId)` | Updates selection signal |
| `setFilter(config)` | Partial filter update |
| `clearFilters()` | Resets to `DEFAULT_FILTER_CONFIG` |
| `selectGitHubWorkItem(url)` | Sets GitHub panel URL |
| `onRealtimeActivityEntry(entry)` | Called by `AgentRealtimeService` |
| `onRealtimeSessionChange(row)` | Called by `AgentRealtimeService` |
| `cacheGitHubWorkItem(item)` | Called by `GitHubWorkItemComponent` |

**Dependencies**: `@angular/core`, `@supabase/supabase-js`, all models, `SUPABASE_CLIENT`  
**LOC estimate**: ~250

---

### `src/lib/services/agent-realtime.service.ts`

**Purpose**: Manages Supabase Realtime WebSocket connections for `org:{orgId}:activity` and `org:{orgId}:sessions` channels. Implements exponential-backoff reconnection.

**Key Exports**: `AgentRealtimeService`, `ConnectionState`

**Public Signal API**:
| Signal | Type | Description |
|--------|------|-------------|
| `connectionState` | `Signal<ConnectionState>` | `connecting \| connected \| error \| disconnected` |

**Public Methods**:
| Method | Description |
|--------|-------------|
| `connect(orgId)` | Subscribes to both Realtime channels |
| `disconnect()` | Removes all channels; clears retry timer |
| `manualReconnect()` | Resets retry counter and reconnects |

**Reconnection Strategy**: Exponential backoff — delays 1 s, 2 s, 4 s, 8 s, 16 s (5 attempts). Jitter ±500 ms per retry. After max retries, sets state to `'error'` and requires manual reconnect.

**Catch-up on reconnect**: After `SUBSCRIBED`, queries `activity_entries` for entries since the last seen timestamp to recover any missed events during disconnection.

**Dependencies**: `@angular/core`, `@supabase/supabase-js`, `DashboardService`, `SUPABASE_CLIENT`  
**LOC estimate**: ~200

---

### `src/lib/services/github-enrichment.service.ts`

**Purpose**: Fetches enriched GitHub issue/PR data via the `github-proxy` Supabase Edge Function. Implements 256-entry LRU cache. Deduplicated in-flight requests.

**Key Exports**: `GitHubEnrichmentService`

**Public Methods**:
| Method | Description |
|--------|-------------|
| `fetchWorkItem(githubUrl)` | Returns `Promise<GitHubWorkItem>` — cache-first |
| `prefetchWorkItems(urls)` | Eager-fetch multiple URLs |
| `clearCache()` | Empties LRU cache (used in tests) |

**LRU Cache**: Array-based, maximum 256 entries. On cache hit, moves entry to front. On overflow, evicts last entry.

**In-flight deduplication**: Stores `Promise` references in a `Map<string, Promise<GitHubWorkItem>>` so concurrent requests for the same URL share one HTTP call.

**Dependencies**: `@angular/core`, `@angular/common/http`, `DashboardService`, `APP_CONFIG` (for `supabaseUrl`)  
**LOC estimate**: ~180

---

## Component Files

### `dashboard/dashboard.component.ts`

**Purpose**: Lazy-loaded shell. Two-panel layout. Bootstraps Realtime connection on `ngOnInit`, disconnects on `ngOnDestroy`.

**Selector**: `app-dashboard`  
**Inputs**: none (reads from injected services)  
**Outputs**: none  
**Imports (standalone)**: `CommonModule`, `AgentGridComponent`, `ActivityPanelComponent`, `FilterSidebarComponent`, `EmptyStateComponent`, `SkeletonModule`  
**Change Detection**: `OnPush`  
**LOC estimate**: ~60 TS / ~45 HTML / ~30 SCSS

---

### `agent-grid/agent-grid.component.ts`

**Purpose**: Responsive CSS grid of `AgentCardComponent`. Pure presentational component.

**Selector**: `app-agent-grid`  
**Inputs**: `agents: Agent[]` (required), `selectedAgentId: string | null`  
**Outputs**: `agentSelected: EventEmitter<string>`  
**Imports**: `CommonModule`, `AgentCardComponent`  
**Change Detection**: `OnPush`  
**LOC estimate**: ~35 TS / ~20 HTML / ~15 SCSS

---

### `agent-card/agent-card.component.ts`

**Purpose**: Displays a single agent — name, status badge, task, repo, heartbeat age. Emits selection on click.

**Selector**: `app-agent-card`  
**Inputs**: `agent: Agent` (required), `isSelected: boolean`  
**Outputs**: `selected: EventEmitter<string>`  
**Imports**: `CommonModule`, `TagModule`, `BadgeModule`, `TooltipModule`, `AgentStatusBadgeComponent`  
**Change Detection**: `OnPush`  
**LOC estimate**: ~80 TS / ~55 HTML / ~40 SCSS

---

### `activity-panel/activity-panel.component.ts`

**Purpose**: Right-panel container. Shows selected agent header, `ActivityFeedComponent`, and optionally `GitHubWorkItemComponent`.

**Selector**: `app-activity-panel`  
**Inputs**: `agent: Agent` (required)  
**Imports**: `CommonModule`, `ActivityFeedComponent`, `GitHubWorkItemComponent`, `TagModule`  
**Change Detection**: `OnPush`  
**LOC estimate**: ~45 TS / ~40 HTML / ~20 SCSS

---

### `activity-feed/activity-feed.component.ts`

**Purpose**: Scrollable PrimeNG Timeline of `ActivityEntryComponent` instances. Auto-scrolls to bottom on new entries.

**Selector**: `app-activity-feed`  
**Inputs**: none (reads `activityEntries` and `isLoadingEntries` from `DashboardService`)  
**Imports**: `CommonModule`, `TimelineModule`, `SkeletonModule`, `ActivityEntryComponent`, `EmptyStateComponent`  
**Change Detection**: `OnPush`  
**LOC estimate**: ~75 TS / ~50 HTML / ~30 SCSS

---

### `activity-entry/activity-entry.component.ts`

**Purpose**: Renders a single `ActivityEntry` — switches on `entry.type` to render appropriate icon, colour, and content.

**Selector**: `app-activity-entry`  
**Inputs**: `entry: ActivityEntry` (required)  
**Outputs**: `githubLinkClicked: EventEmitter<string>` (URL string)  
**Imports**: `CommonModule`, `TagModule`, `ButtonModule`, all type-guard functions  
**Change Detection**: `OnPush`  
**LOC estimate**: ~65 TS / ~80 HTML / ~25 SCSS

---

### `github-work-item/github-work-item.component.ts`

**Purpose**: Enrichment panel that displays fetched GitHub issue/PR details. Triggers `GitHubEnrichmentService.fetchWorkItem` on input change.

**Selector**: `app-github-work-item`  
**Inputs**: `githubUrl: string | null`  
**Imports**: `CommonModule`, `CardModule`, `TagModule`, `SkeletonModule`, `ButtonModule`  
**Change Detection**: `OnPush`  
**LOC estimate**: ~70 TS / ~65 HTML / ~20 SCSS

---

### `filter-sidebar/filter-sidebar.component.ts`

**Purpose**: Status checkboxes, text search input, repo/project dropdowns. Emits partial `FilterConfig` on change.

**Selector**: `app-filter-sidebar`  
**Inputs**: none  
**Outputs**: `filterChanged: EventEmitter<Partial<FilterConfig>>`  
**Imports**: `CommonModule`, `ReactiveFormsModule`, `CheckboxModule`, `InputTextModule`, `DropdownModule`, `ButtonModule`  
**Change Detection**: `OnPush`  
**LOC estimate**: ~90 TS / ~80 HTML / ~20 SCSS

---

### `agent-status-badge/agent-status-badge.component.ts`

**Purpose**: PrimeNG `p-tag` wrapper with status-specific colour, icon, and label. Used by `AgentCardComponent`.

**Selector**: `app-agent-status-badge`  
**Inputs**: `status: AgentStatus` (required)  
**Imports**: `CommonModule`, `TagModule`  
**Change Detection**: `OnPush`  
**LOC estimate**: ~55 TS / ~15 HTML / ~10 SCSS

---

### `empty-state/empty-state.component.ts`

**Purpose**: Reusable empty-state placeholder with configurable message and optional icon.

**Selector**: `app-empty-state`  
**Inputs**: `message: string`, `icon?: string`  
**Imports**: `CommonModule`  
**Change Detection**: `OnPush`  
**LOC estimate**: ~20 TS / ~15 HTML / ~10 SCSS

---

## Test Files

### `services/dashboard.service.spec.ts`

**Tests**: Signal initialization, `loadInitialData`, `setSelectedAgent`, `onRealtimeActivityEntry`, `applyFilter`, `setFilter`.  
**Mocks**: `SupabaseClient` (jest.fn() for `.from().select().eq()`).  
**LOC estimate**: ~200

---

### `services/agent-realtime.service.spec.ts`

**Tests**: Channel subscription setup, `handleChannelStatus` transitions, exponential backoff timing, `disconnect` cleanup.  
**Mocks**: `SupabaseClient.channel()`, `DashboardService`.  
**LOC estimate**: ~180

---

### `services/github-enrichment.service.spec.ts`

**Tests**: Cache hit/miss, LRU eviction at 256 entries, in-flight deduplication, HTTP error handling.  
**Mocks**: `HttpClient`.  
**LOC estimate**: ~160

---

### `components/agent-card/agent-card.component.spec.ts`

**Tests**: Renders agent name and status, emits `selected` on click, `isSelected` adds active CSS class.  
**LOC estimate**: ~80

---

### `components/activity-feed/activity-feed.component.spec.ts`

**Tests**: Renders timeline entries, shows skeleton on `isLoadingEntries`, renders empty state when no entries.  
**LOC estimate**: ~90

---

## Total Estimated Lines of Code

| Category | Files | Est. LOC |
|----------|-------|----------|
| Configuration | 7 | ~150 |
| Public barrel | 1 | ~25 |
| Models | 5 | ~360 |
| Services | 3 | ~630 |
| Components (TS) | 10 | ~595 |
| Components (HTML) | 10 | ~465 |
| Components (SCSS) | 10 | ~220 |
| Test specs | 5 | ~710 |
| **Total** | **51** | **~3,155** |
