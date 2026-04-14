---
meta:
  id: agent-dashboard-implementation-recommendations
  title: AI Agent Dashboard — Implementation Recommendations
  version: 0.1.0
  status: draft
  scope: research
  tags: [agent-dashboard, recommendations, implementation, angular, supabase, github]
  createdBy: Agent Alchemy Research SKILL
  createdAt: '2026-07-10'
---

# AI Agent Dashboard — Implementation Recommendations

**Research Phase**: Discovery  
**Date**: 2026-07-10  
**Status**: Complete  
**Researcher**: Agent Alchemy Research & Ideation SKILL

---

## Executive Summary

After completing feasibility analysis, architectural proposal evaluation, data model research, and competitive analysis, the research phase produces a clear recommendation: **implement the Hybrid Supabase Realtime Dashboard (Proposal 3)** using a phased delivery approach that provides value within 5-6 weeks and reaches full capability by week 14.

The recommendation combines:
- **Supabase Realtime** for agent-activity data transport and persistence (from Proposal 3)
- **GitHub REST API proxy** via Supabase Edge Functions for secure issue/PR enrichment (from Proposal 3)
- **Event-sourced normalized log schema** for agent activity data (from data model research)
- **Two-panel layout** with status card grid and real-time activity feed (from competitive analysis)
- **PrimeNG Timeline + DataView** components with Angular Signals for reactive UI (from tech stack)

---

## 1. Recommended Architecture

### 1.1 System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Recommended Architecture                             │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  apps/agent-alchemy-dev (Angular 18)                           │    │
│  │                                                                 │    │
│  │  DashboardModule (lazy-loaded)                                 │    │
│  │  ├── DashboardComponent (shell, two-panel layout)              │    │
│  │  ├── AgentGridComponent (left panel, agent cards grid)         │    │
│  │  │   └── AgentCardComponent (status card per agent)           │    │
│  │  ├── ActivityPanelComponent (right panel, selected agent)      │    │
│  │  │   ├── ActivityFeedComponent (PrimeNG Timeline)             │    │
│  │  │   └── GitHubWorkItemComponent (issue/PR panel)             │    │
│  │  └── Services:                                                 │    │
│  │      ├── DashboardService (Signals, coordination)              │    │
│  │      ├── AgentRealtimeService (Supabase Realtime channels)    │    │
│  │      └── GitHubEnrichmentService (HTTP → Edge Function)       │    │
│  └───────────────────────┬─────────────────────────────────────────┘    │
│                           │                                              │
│              ┌────────────▼──────────────────────┐                      │
│              │  Supabase Project                  │                      │
│              │  ┌──────────────────────────────┐  │                      │
│              │  │  PostgreSQL (4 tables + view) │  │                      │
│              │  │  Realtime (activity_entries,  │  │                      │
│              │  │           agent_sessions)     │  │                      │
│              │  └──────────────────────────────┘  │                      │
│              │  ┌──────────────────────────────┐  │                      │
│              │  │  Edge Functions (Deno)        │  │                      │
│              │  │  - github-proxy               │  │                      │
│              │  │  - webhook-handler            │  │                      │
│              │  └──────────────────────────────┘  │                      │
│              └────────────┬──────────────────────┘                      │
│                           │                                              │
│              ┌────────────▼──────────────────────┐                      │
│              │  AI Agents (any runtime)           │                      │
│              │  @agent-alchemy/agent-sdk          │                      │
│              │  ├── openSession()                 │                      │
│              │  ├── log() / decide() / ask()      │                      │
│              │  ├── recordGitHubAction()          │                      │
│              │  └── closeSession()                │                      │
│              └───────────────────────────────────┘                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Choices

| Concern | Recommended Technology | Rationale |
|---------|----------------------|-----------|
| Real-time data transport | Supabase Realtime | Already in stack; PostgreSQL-backed; no custom server |
| Agent activity persistence | Supabase PostgreSQL | Durable, queryable, full history |
| GitHub API calls | Supabase Edge Function proxy | Security (token server-side); caching; rate limit management |
| GitHub webhooks | Supabase Edge Function handler | Signature validation; event-to-DB routing |
| Angular state management | Angular Signals + RxJS | Signals for UI state; RxJS for Supabase stream → Signal bridge |
| UI components | PrimeNG 18 | Already in stack; Timeline, DataView, Badge, Tag, VirtualScroll |
| Responsive layout | Tailwind CSS | Already in stack; grid utilities for multi-agent layout |
| Agent SDK | Custom npm package `@agent-alchemy/agent-sdk` | Stable API contract; thin Supabase wrapper |
| Authentication | Supabase Auth + RLS | Existing auth pattern; org-based data isolation |
| Change detection | OnPush everywhere | Performance requirement for 50+ concurrent agent updates |

---

## 2. Phased Implementation Plan

### 2.1 Phase 0: Pre-work (1 week, before sprint 1)

**Goal**: Ensure prerequisites are in place before development begins.

| Task | Owner | Effort |
|------|-------|--------|
| Confirm Supabase project exists for `agent-alchemy-dev` | DevOps | 1 day |
| Enable Supabase Realtime on project | DevOps | 1 hour |
| Agree on agent authentication strategy (service role key vs. anon key + RLS) | Architect | 1 day |
| Draft agent SDK interface with agent developer team | Architect + Agent Dev | 2 days |
| Create GitHub App permission review for dashboard read access | Architect | 1 day |
| Set up Supabase Edge Function deployment pipeline | DevOps | 1 day |

---

### 2.2 Phase 1: Foundation MVP (Weeks 1-6)

**Goal**: Working dashboard with static mock data → real data with polling (no Realtime yet)

**Sprint 1 (Weeks 1-2): Schema + Agent SDK + Angular Module**

| Task | Effort | Deliverable |
|------|--------|-------------|
| Create Supabase migration: `agents`, `agent_sessions`, `activity_entries`, `github_work_items` | 3 days | SQL migration files |
| Configure RLS policies for all tables | 2 days | Secure multi-tenant data isolation |
| Create `@agent-alchemy/agent-sdk` npm package skeleton | 2 days | TypeScript package with `AgentSession` class |
| Implement `openSession()`, `log()`, `decide()`, `ask()`, `closeSession()` in SDK | 2 days | Agent SDK core API |
| Create `DashboardModule` lazy-loaded feature module in `apps/agent-alchemy-dev` | 1 day | Route `'/dashboard'` → `DashboardComponent` |

**Sprint 2 (Weeks 3-4): Core UI Components**

| Task | Effort | Deliverable |
|------|--------|-------------|
| `AgentGridComponent`: Tailwind CSS grid, responsive breakpoints, mock data | 3 days | Grid renders 3-4 agent cards from mock |
| `AgentCardComponent`: Status badge (PrimeNG Tag), agent name, task, last-active | 3 days | Card matches competitive analysis design |
| `ActivityFeedComponent`: PrimeNG Timeline, entry type icons, relative timestamps | 3 days | Feed renders 10 mock activity entries |
| `DashboardService`: Supabase queries for initial data load (no Realtime yet) | 2 days | Real data from Supabase DB |
| `DashboardComponent`: Two-panel layout, Signals for selected agent | 1 day | Clicking card shows activity panel |

**Sprint 3 (Weeks 5-6): GitHub Enrichment + Polish**

| Task | Effort | Deliverable |
|------|--------|-------------|
| `github-proxy` Edge Function: GitHub REST API call with ETag caching | 3 days | Returns cached issue/PR data |
| `GitHubWorkItemComponent`: Displays issue/PR title, status, labels, link | 2 days | GitHub panel renders alongside activity feed |
| `GitHubEnrichmentService`: Angular HTTP service calling Edge Function | 1 day | Service fetches GitHub data per work item URL |
| Error handling: per-agent card error state, toast for Supabase errors | 1 day | Dashboard is resilient to partial failures |
| **Phase 1 Review**: Working dashboard with real data, polling refresh | - | **MVP Demo** |

---

### 2.3 Phase 2: Real-time Integration (Weeks 7-10)

**Goal**: Live updates via Supabase Realtime; heartbeat-based online/offline detection

**Sprint 4 (Weeks 7-8): Supabase Realtime Subscriptions**

| Task | Effort | Deliverable |
|------|--------|-------------|
| `AgentRealtimeService`: Subscribe to `agent_sessions` INSERT/UPDATE for org | 2 days | Agent card status updates live |
| Subscribe to `activity_entries` INSERT for selected agent session | 2 days | Activity feed populates in real-time |
| Signal integration: `fromEvent` → `toSignal` bridge pattern | 1 day | Clean reactive data flow |
| Catch-up query on reconnect (load entries missed during disconnection) | 2 days | No missed entries after browser reconnect |
| `heartbeat_at` polling: detect offline agents (>2 min no heartbeat) | 1 day | Agent card shows 💤 offline state |

**Sprint 5 (Weeks 9-10): Enhanced Activity Feed + Filtering**

| Task | Effort | Deliverable |
|------|--------|-------------|
| Pause/resume auto-scroll on activity feed | 1 day | User can read history while agent is active |
| Activity entry type filtering (show only decisions, questions, etc.) | 2 days | Filter toggles per entry type |
| Open questions badge on agent card (count from Signal) | 1 day | ❓ badge shows on cards with open questions |
| Filter bar: filter by status, repo, project | 2 days | Dashboard filtered client-side |
| Agent card animation: pulse for active, fade for idle | 1 day | Visual aliveness indication |
| `webhook-handler` Edge Function: GitHub webhooks → `github_work_items` UPDATE | 2 days | PR status updates propagate to dashboard |

---

### 2.4 Phase 3: Polish & Production (Weeks 11-14)

**Goal**: Production-ready, performant, tested, accessible, documented

**Sprint 6 (Weeks 11-12): Performance + Testing**

| Task | Effort | Deliverable |
|------|--------|-------------|
| PrimeNG VirtualScroll for activity feed (handle 1000+ entries) | 2 days | Feed renders efficiently at scale |
| Unit tests: `DashboardService`, `AgentRealtimeService`, `GitHubEnrichmentService` | 3 days | >80% service test coverage |
| Component tests: `AgentCardComponent`, `ActivityFeedComponent` | 2 days | >70% component test coverage |
| E2E tests: Playwright — dashboard load, agent selection, real-time update simulation | 2 days | E2E coverage for critical paths |

**Sprint 7 (Weeks 13-14): Responsive + Documentation + Launch**

| Task | Effort | Deliverable |
|------|--------|-------------|
| Mobile responsive design (single-column, collapsible panels) | 2 days | Dashboard usable on tablet/mobile |
| Accessibility audit (WCAG 2.1 AA): keyboard nav, ARIA labels, focus management | 2 days | Accessible dashboard |
| `@agent-alchemy/agent-sdk` v1.0 documentation | 1 day | Agent developers can self-serve |
| Dashboard user guide (how to interpret agent status, entry types) | 1 day | Operators can use dashboard without training |
| Production RLS security audit | 1 day | No data leakage between orgs |
| Performance testing: 50 concurrent agent simulations | 1 day | Dashboard handles expected load |
| **Production deployment** | - | **v1.0 GA** |

---

## 3. Angular Architecture Recommendations

### 3.1 Component Hierarchy

```typescript
// Dashboard module structure (lazy-loaded)
// apps/agent-alchemy-dev/src/app/features/dashboard/

dashboard/
├── dashboard.routes.ts              // Route config
├── dashboard.module.ts              // Module declaration
├── components/
│   ├── dashboard/
│   │   ├── dashboard.component.ts   // Shell, two-panel layout
│   │   ├── dashboard.component.html
│   │   └── dashboard.component.scss
│   ├── agent-grid/
│   │   ├── agent-grid.component.ts  // Tailwind grid, filter bar
│   │   └── agent-grid.component.html
│   ├── agent-card/
│   │   ├── agent-card.component.ts  // Status badge, metadata
│   │   └── agent-card.component.html
│   ├── activity-panel/
│   │   ├── activity-panel.component.ts // Right panel, selected agent
│   │   └── activity-panel.component.html
│   ├── activity-feed/
│   │   ├── activity-feed.component.ts  // PrimeNG Timeline
│   │   └── activity-feed.component.html
│   ├── activity-entry/
│   │   ├── activity-entry.component.ts // Single entry renderer
│   │   └── activity-entry.component.html
│   └── github-work-item/
│       ├── github-work-item.component.ts // Issue/PR panel
│       └── github-work-item.component.html
├── services/
│   ├── dashboard.service.ts         // Coordination, Signals
│   ├── agent-realtime.service.ts    // Supabase Realtime subscriptions
│   └── github-enrichment.service.ts // HTTP → Edge Function
├── models/
│   ├── agent.model.ts               // TypeScript interfaces
│   ├── activity-entry.model.ts
│   └── github-work-item.model.ts
└── pipes/
    ├── time-ago.pipe.ts             // "2 min ago" formatting
    └── entry-type-icon.pipe.ts      // Entry type → PrimeIcon name
```

### 3.2 Dashboard Service (Signals Architecture)

```typescript
@Injectable({ providedIn: 'root' })
export class DashboardService implements OnDestroy {
  private readonly supabase = inject(SupabaseService).client;
  private readonly realtimeService = inject(AgentRealtimeService);

  // ── Core Signals ────────────────────────────────────────────────
  readonly agents = signal<AgentDashboardSummary[]>([]);
  readonly selectedAgentId = signal<string | null>(null);
  readonly activityEntries = signal<ActivityEntry[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  // ── Derived/Computed Signals ─────────────────────────────────────
  readonly selectedAgent = computed(() =>
    this.agents().find(a => a.agentId === this.selectedAgentId()) ?? null
  );

  readonly activeAgents = computed(() =>
    this.agents().filter(a =>
      a.sessionStatus && !['completed', 'cancelled'].includes(a.sessionStatus)
    )
  );

  readonly agentsWithOpenQuestions = computed(() =>
    this.agents().filter(a => (a.openQuestions ?? 0) > 0)
  );

  readonly onlineAgents = computed(() =>
    this.agents().filter(a => (a.secondsSinceHeartbeat ?? Infinity) < 120)
  );

  // ── Initialization ───────────────────────────────────────────────
  constructor() {
    this.loadInitialData();
    this.subscribeToSessionUpdates();
  }

  selectAgent(agentId: string): void {
    this.selectedAgentId.set(agentId);
    this.loadActivityEntries(agentId);
    this.subscribeToAgentActivity(agentId);
  }

  private async loadInitialData(): Promise<void> {
    this.isLoading.set(true);
    const { data, error } = await this.supabase
      .from('agent_dashboard_summary')
      .select('*')
      .order('last_activity_at', { ascending: false });

    if (error) {
      this.error.set(error.message);
    } else {
      this.agents.set(data as AgentDashboardSummary[]);
    }
    this.isLoading.set(false);
  }

  private subscribeToSessionUpdates(): void {
    this.realtimeService
      .subscribeToOrgSessions(this.currentOrgId)
      .pipe(takeUntilDestroyed())
      .subscribe(updatedSession => {
        this.agents.update(agents =>
          agents.map(a =>
            a.agentId === updatedSession.agentId
              ? { ...a, sessionStatus: updatedSession.status, heartbeatAt: updatedSession.heartbeatAt }
              : a
          )
        );
      });
  }

  private subscribeToAgentActivity(agentId: string): void {
    const session = this.agents().find(a => a.agentId === agentId);
    if (!session?.sessionId) return;

    this.realtimeService
      .subscribeToSessionActivity(session.sessionId)
      .pipe(takeUntilDestroyed())
      .subscribe(newEntry => {
        this.activityEntries.update(entries => [newEntry, ...entries]);
        // Update open question count on agent card
        if (newEntry.type === 'question') {
          this.agents.update(agents =>
            agents.map(a =>
              a.agentId === agentId
                ? { ...a, openQuestions: (a.openQuestions ?? 0) + 1 }
                : a
            )
          );
        }
      });
  }

  private get currentOrgId(): string {
    // Get from auth context
    return inject(AuthService).currentOrgId();
  }

  ngOnDestroy(): void {
    this.realtimeService.unsubscribeAll();
  }
}
```

### 3.3 Agent Card Component

```typescript
@Component({
  selector: 'app-agent-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="agent-card"
         [class]="statusClass()"
         (click)="select.emit(agent().agentId)">

      <!-- Status indicator + name -->
      <div class="card-header">
        <span class="status-dot" [class]="statusDotClass()"></span>
        <span class="agent-name">{{ agent().agentName }}</span>
        <p-badge *ngIf="agent().openQuestions"
                 [value]="agent().openQuestions"
                 severity="warning"
                 title="Open questions needing human input">
        </p-badge>
      </div>

      <!-- Current task -->
      <div class="card-task" *ngIf="agent().task">
        <i class="pi pi-cog"></i>
        <span>{{ agent().task }}</span>
      </div>

      <!-- Repository + branch -->
      <div class="card-context" *ngIf="agent().repo">
        <code>{{ agent().repo }}</code>
        <span *ngIf="agent().branch">  {{ agent().branch }}</span>
      </div>

      <!-- Session metadata -->
      <div class="card-meta">
        <span *ngIf="agent().startedAt">
          Session: {{ sessionDuration() }}
        </span>
        <span *ngIf="agent().lastActivityAt">
          Last: {{ agent().lastActivityAt | timeAgo }}
        </span>
      </div>

      <!-- Activity counts -->
      <div class="card-counts">
        <span title="Log entries">📝 {{ agent().logCount }}</span>
        <span title="Decisions made">🤔 {{ agent().decisionCount }}</span>
        <span title="Open questions" [class.open-questions]="agent().openQuestions">
          ❓ {{ agent().openQuestions }}
        </span>
        <span title="GitHub actions">🔗 {{ agent().githubActionCount }}</span>
      </div>
    </div>
  `
})
export class AgentCardComponent {
  readonly agent = input.required<AgentDashboardSummary>();
  readonly select = output<string>();

  readonly statusClass = computed(() => `agent-card--${this.agent().sessionStatus ?? 'idle'}`);

  readonly statusDotClass = computed(() => {
    const status = this.agent().sessionStatus;
    const secondsSince = this.agent().secondsSinceHeartbeat ?? Infinity;
    if (secondsSince > 120) return 'status-offline';
    if (status === 'executing') return 'status-active';
    if (status === 'blocked') return 'status-blocked';
    if (status === 'planning' || status === 'reviewing') return 'status-working';
    return 'status-idle';
  });

  readonly sessionDuration = computed(() => {
    if (!this.agent().startedAt) return '';
    const seconds = Math.floor(
      (Date.now() - new Date(this.agent().startedAt!).getTime()) / 1000
    );
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  });
}
```

---

## 4. Supabase Edge Function Recommendations

### 4.1 GitHub API Proxy (`github-proxy`)

```typescript
// supabase/functions/github-proxy/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CACHE_TTL_SECONDS = 300; // 5 minutes

serve(async (req: Request) => {
  const { githubUrl } = await req.json();

  if (!githubUrl?.startsWith('https://api.github.com/')) {
    return new Response('Invalid GitHub URL', { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Check cache
  const { data: cached } = await supabase
    .from('github_work_items')
    .select('raw_data, synced_at')
    .eq('github_url', githubUrl)
    .single();

  if (cached && cached.raw_data) {
    const ageSeconds = (Date.now() - new Date(cached.synced_at).getTime()) / 1000;
    if (ageSeconds < CACHE_TTL_SECONDS) {
      return new Response(JSON.stringify(cached.raw_data), {
        headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
      });
    }
  }

  // Fetch from GitHub with installation token
  const installationToken = await getInstallationToken();
  const response = await fetch(githubUrl, {
    headers: {
      Authorization: `Bearer ${installationToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  if (!response.ok) {
    return new Response(
      JSON.stringify({ error: `GitHub API error: ${response.status}` }),
      { status: response.status }
    );
  }

  const data = await response.json();

  // Update cache
  await supabase.from('github_work_items').upsert({
    github_url: githubUrl,
    github_type: inferType(githubUrl),
    github_repo: extractRepo(githubUrl),
    title: data.title,
    state: data.state,
    labels: data.labels ?? [],
    synced_at: new Date().toISOString(),
    raw_data: data
  }, { onConflict: 'github_url' });

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
  });
});
```

---

## 5. Agent SDK Recommendations

### 5.1 Package Structure

```
packages/agent-sdk/
├── src/
│   ├── index.ts              // Public API exports
│   ├── client.ts             // AgentAlchemySdk class
│   ├── session.ts            // AgentSession class
│   ├── types.ts              // TypeScript interfaces
│   └── errors.ts             // SDK error classes
├── package.json
├── tsconfig.json
└── README.md
```

### 5.2 Public API Design

```typescript
// Minimal, ergonomic API for agent developers
const sdk = new AgentAlchemySdk({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY!,
  agentId: 'agent-x-002',
  orgId: 'buildmotion'
});

// Open a work session
const session = await sdk.openSession({
  project: 'agent-alchemy',
  repo: 'buildmotion/agency',
  task: 'Fix failing tests in user.service.spec.ts',
  branch: 'fix/user-service-tests'
});

// Log activity (developer-log style)
await session.log('Found 3 failing tests in user.service.spec.ts');
await session.log('HttpClient mock is missing from TestBed', 'warn');

// Record decisions
await session.decide(
  'Add HttpClientTestingModule to TestBed imports',
  'Standard Angular testing pattern for services using HttpClient'
);

// Ask a question (human input required)
const questionId = await session.ask(
  'Should I also update the integration tests in user.service.e2e.ts?'
);

// Record GitHub actions
await session.recordGitHubAction(
  'pr_opened',
  'https://api.github.com/repos/buildmotion/agency/pulls/42',
  'buildmotion/agency',
  42
);

// Update status
await session.updateStatus('reviewing', 'Reviewing PR #42 before merge');

// Heartbeat (call every 60 seconds)
setInterval(() => session.heartbeat(), 60_000);

// Close session
await session.close('success');
```

### 5.3 Heartbeat Strategy

Agents must call `session.heartbeat()` every 60 seconds while active. The SDK should handle this automatically via `startAutoHeartbeat(intervalMs = 60_000)`:

```typescript
// Auto-heartbeat with automatic cleanup
const session = await sdk.openSession({ ... });
session.startAutoHeartbeat(); // Starts 60s interval

// On process exit, close session gracefully
process.on('SIGTERM', async () => {
  session.stopAutoHeartbeat();
  await session.close('cancelled');
  process.exit(0);
});
```

---

## 6. Security Recommendations

### 6.1 Agent Authentication

**Recommendation**: Use **Supabase service role key** for agent-to-Supabase writes, scoped by `org_id`.

**Rationale**:
- Agents need to INSERT into `agents`, `agent_sessions`, `activity_entries`
- RLS policies with `service_role` bypass are acceptable for server-side agent SDK
- The service role key must be stored as an environment variable, never in code
- Each organization's agents should use a separate Supabase service role key OR a scoped JWT

**Alternative** (if service role key sharing is a concern): Create a Supabase Edge Function `agent-write` endpoint that accepts an org-scoped bearer token and proxies inserts:

```typescript
// Agent SDK calls Edge Function instead of Supabase directly
// This allows token rotation without SDK updates
const response = await fetch(`${supabaseUrl}/functions/v1/agent-write`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${orgAgentToken}` },
  body: JSON.stringify({ type: 'activity_entry', data: entry })
});
```

### 6.2 Dashboard User Authentication

- **Use Supabase Auth** (existing pattern in `apps/agent-alchemy-dev`)
- RLS policies enforce: users only see data where `org_id = any(auth.user_org_ids())`
- Dashboard route should be protected by `AuthGuard`

### 6.3 GitHub App Token Security

- GitHub App private key stored in **Supabase Vault** (environment secret)
- Installation tokens fetched and cached server-side in Edge Function
- **Never** pass installation tokens to Angular browser client
- Token refresh handled automatically in Edge Function (tokens expire after 1 hour)

---

## 7. Testing Strategy

### 7.1 Unit Testing (Jest)

```typescript
// DashboardService: mock Supabase client
describe('DashboardService', () => {
  let service: DashboardService;
  let mockSupabase: jest.Mocked<SupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient(); // helper returns jest mock
    service = new DashboardService(mockSupabase);
  });

  it('should load agents on initialization', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: mockAgents, error: null })
      })
    });

    await service.loadInitialData();
    expect(service.agents()).toHaveLength(mockAgents.length);
  });

  it('should update agent status on session change event', () => {
    service.agents.set([mockAgent]);
    service.handleSessionChange({
      ...mockAgent.session,
      status: 'blocked'
    });
    expect(service.agents()[0].sessionStatus).toBe('blocked');
  });
});
```

### 7.2 Integration Testing

- Test Supabase Realtime subscription setup and teardown
- Verify catch-up query on reconnect
- Test RLS policy enforcement (user cannot see other org's data)

### 7.3 E2E Testing (Playwright)

| Scenario | Test Steps |
|----------|------------|
| Dashboard loads with agents | Navigate to `/dashboard`; verify agent cards rendered |
| Agent selection shows activity feed | Click agent card; verify activity panel updates |
| Real-time update appears | Insert activity entry via SDK; verify feed updates without refresh |
| Offline agent detected | Stop heartbeat; verify card shows offline status after 2 min |
| Filter by status | Click "Blocked" filter; verify only blocked agents shown |
| GitHub panel enrichment | Select agent with github_action entry; verify PR panel loads |

---

## 8. Final Recommendation Summary

### 8.1 Go/No-Go Decision

**Recommendation**: ✅ **PROCEED** with full implementation of AI Agent Dashboard

**Justification**:
- Critical operational need: operators cannot effectively manage autonomous agents without a dashboard
- Low infrastructure risk: Supabase is already proven in the stack
- Competitive differentiation: no mature multi-agent dashboard with GitHub integration exists
- Clear MVP path: Phase 1 delivers value in 5-6 weeks without Realtime complexity
- Manageable development cost: $72K-$96K for a production-ready dashboard is reasonable

### 8.2 Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Proposal 3 (Hybrid Supabase Realtime) | Stack alignment, cost, real-time capability |
| Data model | Normalized Event-Sourced Log | Unified timeline, Realtime-compatible, extensible |
| GitHub integration | Edge Function proxy | Security (token isolation), caching, rate management |
| Agent SDK | `@agent-alchemy/agent-sdk` npm package | Stable contract, auto-heartbeat, type safety |
| UI framework | PrimeNG Timeline + DataView | Already in stack, production-grade |
| State management | Angular Signals + RxJS | Signals for UI, RxJS for async stream bridging |
| Change detection | OnPush throughout | Performance with 50+ concurrent agent streams |
| Authentication | Supabase service role (agents) + JWT (users) | Security separation, existing pattern |
| Delivery | Phased: MVP (5-6 wks) → Full (14 wks) | Value delivered early; complexity introduced gradually |

### 8.3 Success Metrics

| Metric | Target | Measurement |
|--------|--------|------------|
| Dashboard load time | <500ms | Lighthouse, Playwright timing |
| Activity update latency | <3s from agent action | Timestamp comparison |
| Agent card refresh time | <100ms on Signal update | Angular DevTools |
| Concurrent agents supported | 50+ | Load test with simulated agents |
| Open question notification | <5s from SDK post | E2E timing test |
| GitHub data freshness | <5min (cached) / <30s (live) | Edge Function cache headers |
| Test coverage | >80% services, >70% components | Jest coverage reports |
| WCAG compliance | 2.1 AA | Axe audit |

---

**Document generated by**: Agent Alchemy Research & Ideation SKILL  
**Date**: 2026-07-10  
**Version**: 0.1.0
