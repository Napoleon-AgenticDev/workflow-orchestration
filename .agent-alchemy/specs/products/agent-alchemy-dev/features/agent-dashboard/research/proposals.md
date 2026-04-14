---
meta:
  id: agent-dashboard-proposals
  title: AI Agent Dashboard — Architectural Proposals
  version: 0.1.0
  status: draft
  scope: research
  tags: [agent-dashboard, proposals, architecture, angular, supabase, github, websocket]
  createdBy: Agent Alchemy Research SKILL
  createdAt: '2026-07-10'
---

# AI Agent Dashboard — Architectural Proposals

**Research Phase**: Discovery  
**Date**: 2026-07-10  
**Status**: Complete  
**Researcher**: Agent Alchemy Research & Ideation SKILL

---

## Overview

This document presents three distinct architectural proposals for the AI Agent Dashboard. Each proposal has been designed to address the core requirement of displaying real-time AI agent activity (developer-log notes, GitHub work items, decisions, questions) for multiple concurrent agents.

### Evaluation Criteria

Each proposal is evaluated against:

| Criterion | Weight | Description |
|-----------|--------|-------------|
| **Data freshness** | High | How quickly do dashboard updates reflect agent actions? |
| **Developer-log capability** | High | Can agents post free-text notes beyond GitHub data? |
| **Infrastructure complexity** | Medium | How much custom infrastructure must be built/maintained? |
| **GitHub integration depth** | Medium | How richly can GitHub issue/PR data be displayed? |
| **Scalability** | Medium | How many agents/repositories can the dashboard support? |
| **Cost (dev + infra)** | Medium | Total investment over 3 years |
| **Stack alignment** | High | Fit with existing Angular, Supabase, PrimeNG stack |
| **Security** | High | Data isolation, token management, multi-tenancy |

---

## Proposal 1: GitHub-Centric Pull Dashboard

### Concept

The Angular application polls the **GitHub API directly** for all data. The dashboard displays only information that exists on GitHub — issues, PRs, comments, and labels. Agent activity is expressed entirely through GitHub artifacts (issue comments, PR descriptions, labels like `agent:working`, `agent:blocked`, `agent:waiting`).

Agents communicate their status by creating/updating GitHub issues and adding structured comments. The Angular app polls the GitHub API every 30-60 seconds to refresh the dashboard.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   Proposal 1: GitHub Pull                    │
│                                                              │
│  Angular App (agent-alchemy-dev)                            │
│  ┌─────────────────────────────────────────────┐            │
│  │  DashboardComponent                         │            │
│  │    ├── AgentGridComponent                   │            │
│  │    │     └── AgentCardComponent             │            │
│  │    └── GitHubIssueListComponent             │            │
│  │          └── GitHubIssueItemComponent       │            │
│  └──────────────────┬──────────────────────────┘            │
│                     │ poll every 30-60s                      │
│                     ▼                                        │
│  ┌─────────────────────────────────────────────┐            │
│  │  GitHubApiService                           │            │
│  │  - GET /repos/{owner}/{repo}/issues         │            │
│  │  - GET /repos/{owner}/{repo}/pulls          │            │
│  │  - GET /repos/{owner}/{repo}/issues/comments│            │
│  │  - ETag-based conditional requests          │            │
│  └──────────────────┬──────────────────────────┘            │
│                     │ HTTP (GitHub API v3)                   │
└─────────────────────┼───────────────────────────────────────┘
                      │
                      ▼
             ┌──────────────────┐
             │  GitHub REST API │
             │  (5000 req/hr)   │
             └──────────────────┘
                      ↑
             ┌──────────────────┐
             │   AI Agents      │
             │  - Create issues │
             │  - Post comments │
             │  - Add labels    │
             │  - Open PRs      │
             └──────────────────┘
```

### Data Flow

1. **Agent reports activity** by creating a GitHub issue comment with structured text:
   ```
   <!-- agent-activity-log -->
   **Agent**: agent-x-002
   **Status**: executing
   **Activity**: Analyzing test failures in `src/services/user.service.spec.ts`
   **Log**: Found 3 failing tests related to missing mock for `HttpClient`. Investigating whether the issue is in the test setup or service implementation.
   ```

2. **Angular polls GitHub API** every 30 seconds for issues/PRs with label `agent:active` across configured repositories

3. **Dashboard renders** issues grouped by assigned agent (determined by `assignee` field or label convention like `assigned-to:agent-x-002`)

4. **Angular parses** structured comments to extract activity log entries for display

### Angular Implementation Sketch

```typescript
@Injectable({ providedIn: 'root' })
export class GitHubDashboardService {
  private readonly repos = signal<string[]>([]);
  private readonly agentIssues = signal<GitHubIssue[]>([]);

  constructor(private readonly http: HttpClient) {}

  startPolling(repos: string[]): void {
    this.repos.set(repos);
    interval(30_000).pipe(
      startWith(0),
      switchMap(() => this.fetchAllAgentIssues()),
      takeUntilDestroyed()
    ).subscribe(issues => this.agentIssues.set(issues));
  }

  private fetchAllAgentIssues(): Observable<GitHubIssue[]> {
    return forkJoin(
      this.repos().map(repo =>
        this.http.get<GitHubIssue[]>(
          `https://api.github.com/repos/${repo}/issues`,
          {
            headers: { 'If-None-Match': this.getETag(repo) ?? '' },
            params: { labels: 'agent:active', state: 'open' }
          }
        )
      )
    ).pipe(map(results => results.flat()));
  }
}
```

### Pros

- ✅ **Simplest architecture** — no backend infrastructure beyond GitHub App token management
- ✅ **GitHub as single source of truth** — no data synchronization challenges
- ✅ **Minimal infrastructure cost** — GitHub API is free within rate limits
- ✅ **Agents use native GitHub** — no custom SDK needed; agents already interact with GitHub
- ✅ **Audit trail built-in** — GitHub comments/issues are naturally persistent
- ✅ **Fastest MVP** — can be built in 3-4 weeks

### Cons

- ❌ **No developer-log-style notes** — agents can only communicate through GitHub artifacts (structured comments are a workaround, not a native feature)
- ❌ **Data staleness** — 30-second polling means up to 30s lag between agent action and dashboard update
- ❌ **Rate limit risk** — Monitoring 20 repos with multiple label queries = ~120 API calls/30s = 14,400 calls/2 hours (approaching limits)
- ❌ **GitHub token exposure** — If Angular calls GitHub API directly, installation token is visible in browser network tab
- ❌ **Limited agent metadata** — No agent name, version, project association beyond what fits in issue fields
- ❌ **Parsing fragility** — Structured comment parsing is brittle; breaks if agent format changes
- ❌ **Not scalable to 50+ repos** — Rate limits become unmanageable

### Best Fit Scenarios

- **MVP/prototype** where speed is paramount and full feature set is secondary
- **1-5 agents** monitoring a small number of repositories
- **Agents that already have rich GitHub activity** (many comments, detailed PR descriptions)
- **No budget for Supabase** or backend infrastructure

### Effort Estimate

| Phase | Duration | Notes |
|-------|----------|-------|
| Angular dashboard (static) | 1.5 weeks | Components, layout, mock data |
| GitHub API service + polling | 1 week | HttpClient, ETag, error handling |
| Comment parsing service | 1 week | Structured comment extraction |
| Agent label conventions | 0.5 week | Define and document label schema |
| **Total** | **4 weeks** | 1 Angular developer |

**Cost**: $30K–$40K development + $0/mo infrastructure

---

## Proposal 2: Real-time WebSocket Dashboard

### Concept

A dedicated **WebSocket server** (built with Node.js/NestJS) acts as the hub for all agent activity. Agents connect via WebSocket and push structured activity events in real-time. The Angular dashboard subscribes to an authenticated WebSocket endpoint and receives live updates as agents work.

GitHub data is fetched separately via the GitHub API (cached server-side) and enriches the activity stream with issue/PR context.

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                    Proposal 2: WebSocket Server                       │
│                                                                        │
│  Angular App (agent-alchemy-dev)                                      │
│  ┌─────────────────────────────────────────────────────────────┐      │
│  │  DashboardComponent                                         │      │
│  │    ├── AgentGridComponent (Signals)                        │      │
│  │    └── ActivityFeedComponent (RxJS stream → Signal)        │      │
│  └────────────────────────┬────────────────────────────────────┘      │
│                           │ WebSocket (wss://api.agent-alchemy.dev)    │
└───────────────────────────┼────────────────────────────────────────── ┘
                            │
               ┌────────────▼─────────────┐
               │   NestJS WebSocket       │
               │   Gateway Server         │
               │                          │
               │  ┌────────────────────┐  │
               │  │ AgentGateway       │  │
               │  │ (WebSocket events) │  │
               │  └────────────────────┘  │
               │  ┌────────────────────┐  │
               │  │ ActivityService    │  │
               │  │ (event routing)    │  │
               │  └────────────────────┘  │
               │  ┌────────────────────┐  │
               │  │ GitHubService      │  │
               │  │ (API + caching)    │  │
               │  └────────────────────┘  │
               │  ┌────────────────────┐  │
               │  │ PostgreSQL / Redis  │  │
               │  │ (activity storage) │  │
               │  └────────────────────┘  │
               └────────────┬─────────────┘
                            │
               ┌────────────▼─────────────┐
               │  AI Agents               │
               │  (WebSocket client SDK)  │
               │  - Connect on startup    │
               │  - Push activity events  │
               │  - Receive ack/commands  │
               └──────────────────────────┘
```

### Data Flow

1. **Agent connects** to WebSocket server using JWT token, registers identity
2. **Agent pushes events** as they occur (no buffering needed):
   ```json
   {
     "type": "activity",
     "agentId": "agent-x-002",
     "sessionId": "sess-abc123",
     "timestamp": "2026-07-10T14:23:45Z",
     "entryType": "log",
     "content": "Analyzing test failures in user.service.spec.ts",
     "metadata": {
       "repo": "buildmotion/agency",
       "branch": "fix/user-service-tests",
       "file": "src/services/user.service.spec.ts"
     }
   }
   ```
3. **Gateway broadcasts** the event to all Angular clients subscribed to that agent's channel
4. **Angular receives** the event via RxJS `fromEvent` / `WebSocket` observable and updates Signals

### Angular WebSocket Service

```typescript
@Injectable({ providedIn: 'root' })
export class AgentWebSocketService {
  private socket: WebSocket | null = null;
  private readonly messageSubject = new Subject<AgentEvent>();
  readonly messages$ = this.messageSubject.asObservable();

  connect(authToken: string): void {
    this.socket = new WebSocket(
      `wss://api.agent-alchemy.dev/dashboard?token=${authToken}`
    );

    fromEvent<MessageEvent>(this.socket, 'message').pipe(
      map(e => JSON.parse(e.data) as AgentEvent),
      takeUntilDestroyed()
    ).subscribe(event => this.messageSubject.next(event));

    fromEvent(this.socket, 'close').pipe(
      delay(3000),
      takeUntilDestroyed()
    ).subscribe(() => this.connect(authToken)); // reconnect
  }

  subscribeToAgent(agentId: string): Observable<AgentEvent> {
    return this.messages$.pipe(
      filter(e => e.agentId === agentId)
    );
  }
}
```

### NestJS Gateway Sketch

```typescript
@WebSocketGateway({ cors: true })
export class AgentGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('activity')
  async handleActivity(
    @ConnectedSocket() client: Socket,
    @MessageBody() event: AgentActivityEvent
  ): Promise<void> {
    // Store in PostgreSQL
    await this.activityService.save(event);
    // Broadcast to dashboard subscribers
    this.server.to(`org:${event.orgId}`).emit('agent-activity', event);
  }

  @SubscribeMessage('heartbeat')
  handleHeartbeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: HeartbeatPayload
  ): void {
    this.agentSessionService.updateHeartbeat(data.agentId, data.sessionId);
    this.server.to(`org:${data.orgId}`).emit('agent-heartbeat', data);
  }
}
```

### Pros

- ✅ **True real-time** — sub-second latency from agent action to dashboard update
- ✅ **Rich agent metadata** — full developer-log-style notes, decisions, questions, structured events
- ✅ **Full control** — custom message format, event types, acknowledgment protocol
- ✅ **Bidirectional** — can send commands TO agents (pause, stop, query)
- ✅ **No vendor lock-in** — no dependency on Supabase Realtime limits
- ✅ **Scalable with load balancing** — WebSocket servers horizontally scalable with sticky sessions or Redis adapter

### Cons

- ❌ **Highest complexity** — custom WebSocket server, agent SDK, JWT auth, connection pooling
- ❌ **Significant ops burden** — server must be deployed, monitored, scaled, and maintained
- ❌ **Highest development cost** — 7-9 sprints vs. 5-7 for Proposal 3
- ❌ **Agent SDK effort** — all agents must integrate the WebSocket SDK (vs. simple HTTP inserts)
- ❌ **No built-in persistence** — must implement PostgreSQL/Redis storage for event history
- ❌ **Not in current stack** — introduces NestJS API server (`apps/agent-alchemy-dev-api` exists but adding WebSocket Gateway has overhead)

### Best Fit Scenarios

- **High-frequency agents** posting 10+ events/second
- **Bidirectional control** needed (send commands to agents)
- **Ultra-low latency** requirement (<100ms dashboard update)
- **>500 agents** where Supabase Realtime connection limits are a concern
- **Custom protocol** requirements beyond what Supabase supports

### Effort Estimate

| Phase | Duration | Notes |
|-------|----------|-------|
| NestJS WebSocket Gateway | 2 weeks | @nestjs/websockets, agent auth, heartbeat |
| Agent SDK (@agent-alchemy/agent-sdk) | 2 weeks | TS library, reconnect, buffering |
| PostgreSQL schema + migrations | 1 week | Activity storage, sessions, agents |
| Angular WebSocket service | 1 week | Reconnection, Signal integration |
| Angular dashboard UI | 2 weeks | Components, layout |
| GitHub enrichment service | 1 week | Server-side API calls, caching |
| Infrastructure (deploy, SSL, monitoring) | 1.5 weeks | Docker, Railway/Fly.io |
| Testing & polish | 1.5 weeks | Unit, integration, E2E |
| **Total** | **14-15 weeks** | 2 developers |

**Cost**: $105K–$130K development + $20-$80/mo infrastructure

---

## Proposal 3: Hybrid Supabase Realtime Dashboard ⭐ RECOMMENDED

### Concept

**Supabase** serves as both the persistent data store and real-time transport for agent activity data. Agents post activity entries directly to Supabase (via the agent SDK using `@supabase/supabase-js`). The Angular dashboard subscribes to Supabase Realtime channels and receives live database change events (INSERT on `activity_entries` table) as agents work.

**GitHub API data** is fetched via a **Supabase Edge Function** that acts as a secure proxy, caching responses in the Supabase database to minimize rate limit usage and keep the GitHub App installation token server-side.

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                    Proposal 3: Hybrid Supabase Realtime               │
│                                                                        │
│  Angular App (agent-alchemy-dev)                                      │
│  ┌─────────────────────────────────────────────────────────────┐      │
│  │  DashboardComponent                                         │      │
│  │    ├── AgentGridComponent                                  │      │
│  │    │     └── AgentCardComponent (Signal per agent)         │      │
│  │    └── ActivityFeedComponent                               │      │
│  │          └── ActivityEntryComponent                        │      │
│  └──────────────────┬──────────────────────────────────────────┘      │
│                     │ Supabase Realtime (WSS)                         │
│                     │ + REST queries (initial load)                   │
└─────────────────────┼──────────────────────────────────────────────── ┘
                      │
         ┌────────────▼─────────────────────────────────────┐
         │              Supabase Project                      │
         │                                                    │
         │  ┌───────────────────────────────────────────┐    │
         │  │  PostgreSQL Database                       │    │
         │  │  ┌─────────────┐  ┌──────────────────┐    │    │
         │  │  │   agents    │  │  agent_sessions   │    │    │
         │  │  └─────────────┘  └──────────────────┘    │    │
         │  │  ┌──────────────────────┐                  │    │
         │  │  │  activity_entries    │◄── Realtime      │    │
         │  │  │  (INSERT triggers    │                  │    │
         │  │  │   Realtime events)   │                  │    │
         │  │  └──────────────────────┘                  │    │
         │  │  ┌──────────────────────┐                  │    │
         │  │  │  github_work_items   │                  │    │
         │  │  │  (cached GitHub data)│                  │    │
         │  │  └──────────────────────┘                  │    │
         │  └───────────────────────────────────────────┘    │
         │                                                    │
         │  ┌───────────────────────────────────────────┐    │
         │  │  Edge Functions (Deno)                    │    │
         │  │  - github-proxy: GitHub API proxy + cache │    │
         │  │  - webhook-handler: GitHub webhooks → DB  │    │
         │  └───────────────────────┬───────────────────┘    │
         └──────────────────────────┼────────────────────────┘
                                    │
         ┌──────────────────────────▼────────────────────────┐
         │              External Services                      │
         │  ┌───────────────────┐  ┌────────────────────────┐│
         │  │  GitHub REST API  │  │  GitHub Webhooks        ││
         │  │  (Issue/PR data)  │  │  (push_event, issues,   ││
         │  └───────────────────┘  │   pull_request, etc.)   ││
         │                         └────────────────────────┘│
         └───────────────────────────────────────────────────┘
                      ↑
         ┌────────────┴──────────────────────────────────────┐
         │  AI Agents (any runtime: Node.js, Python, etc.)   │
         │  Using @agent-alchemy/agent-sdk                   │
         │  - openSession() → INSERT agent_sessions         │
         │  - logActivity() → INSERT activity_entries       │
         │  - postQuestion() → INSERT activity_entries      │
         │  - closeSession() → UPDATE agent_sessions        │
         └───────────────────────────────────────────────────┘
```

### Data Flow

#### Agent Activity Flow

1. **Agent starts**: SDK calls `openSession()` → INSERT into `agent_sessions`
2. **Agent works**: SDK calls `logActivity()`, `postDecision()`, `askQuestion()` → INSERT into `activity_entries`
3. **Supabase Realtime**: Angular app receives INSERT events on `activity_entries` for subscribed sessions
4. **Angular updates**: New entry appended to agent's `ActivityFeedComponent` via Signal update

```typescript
// Agent SDK usage (agents use this, not Angular)
const sdk = new AgentAlchemySdk({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
  agentId: 'agent-x-002',
  orgId: 'buildmotion'
});

const session = await sdk.openSession({
  project: 'agent-alchemy',
  repo: 'buildmotion/agency',
  task: 'Fix failing tests in user.service.spec.ts'
});

await session.log('Analyzing test failures in user.service.spec.ts');
await session.log('Found 3 failing tests. HttpClient mock missing.');
await session.decide('Will add HttpClientTestingModule to TestBed imports');

const pr = await session.createPR({ title: 'fix: add HttpClientTestingModule to user.service tests' });
await session.linkGitHubItem({ type: 'pull_request', url: pr.url });

await session.close({ outcome: 'success' });
```

#### GitHub Enrichment Flow

1. **Angular requests GitHub data** for a specific issue/PR URL found in an activity entry
2. **Request goes to Supabase Edge Function** `github-proxy` (not directly to GitHub API)
3. **Edge Function checks cache** in `github_work_items` table (< 5 min old → return cached)
4. **If stale/missing**: Edge Function calls GitHub REST API with installation token
5. **Response cached** in `github_work_items` with `synced_at` timestamp
6. **Angular receives** normalized issue/PR data for display

### Angular Dashboard Implementation

```typescript
// dashboard.service.ts
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly supabase = inject(SupabaseService).client;

  // Signals for reactive state
  readonly agents = signal<AgentWithSession[]>([]);
  readonly selectedAgentId = signal<string | null>(null);
  readonly activityFeed = signal<ActivityEntry[]>([]);
  readonly loading = signal(false);

  constructor() {
    this.loadAgents();
    this.subscribeToSessionUpdates();
    this.subscribeToActivityEntries();
  }

  private subscribeToSessionUpdates(): void {
    this.supabase
      .channel('agent-sessions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agent_sessions',
        filter: `org_id=eq.${this.currentOrgId}`
      }, (payload) => {
        this.handleSessionChange(payload);
      })
      .subscribe();
  }

  private subscribeToActivityEntries(): void {
    const agentId = this.selectedAgentId();
    if (!agentId) return;

    this.supabase
      .channel(`activity-${agentId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_entries',
        filter: `agent_id=eq.${agentId}`
      }, (payload) => {
        this.activityFeed.update(feed => [
          ...feed,
          payload.new as ActivityEntry
        ]);
      })
      .subscribe();
  }

  private handleSessionChange(payload: RealtimePostgresChangesPayload<AgentSession>): void {
    this.agents.update(agents =>
      agents.map(a =>
        a.session?.id === payload.new.id
          ? { ...a, session: payload.new as AgentSession }
          : a
      )
    );
  }
}
```

### Supabase Realtime Configuration

```sql
-- Enable Realtime on tables
alter publication supabase_realtime add table activity_entries;
alter publication supabase_realtime add table agent_sessions;

-- RLS policies ensure users only receive their org's data
create policy "Users see their org activity"
  on activity_entries for select
  using (
    org_id = (
      select org_id from user_organizations
      where user_id = auth.uid()
    )
  );
```

### Pros

- ✅ **Already in stack** — `@supabase/supabase-js ^2.52.0` is an existing dependency
- ✅ **Real-time built-in** — Supabase Realtime over WebSocket without custom server
- ✅ **PostgreSQL persistence** — all activity entries stored durably; queryable history; audit trail
- ✅ **Rich agent metadata** — full developer-log entries, decisions, questions, GitHub refs
- ✅ **Built-in security** — Row Level Security isolates org data
- ✅ **Minimal infra** — no custom WebSocket server; Edge Functions for GitHub proxy
- ✅ **Agent SDK is thin** — just Supabase JS inserts with session management
- ✅ **Lower cost** — $0 MVP, $25/mo production vs. $20-$80/mo for custom server
- ✅ **Reuses patterns** from GitHub App onboarding (already established)
- ✅ **Connection handling** — Supabase JS handles reconnection automatically

### Cons

- ❌ **Supabase vendor lock-in** — deeper dependency on Supabase (acceptable given existing usage)
- ❌ **Realtime message limits** — Supabase free tier: 2M messages/month; Pro: unlimited
- ❌ **Edge Function cold starts** — 50-100ms latency on first GitHub proxy call per 10min window
- ❌ **Table-level Realtime** — can't subscribe to computed views; must subscribe to base tables
- ❌ **Service role key in SDK** — agents need service role key OR a custom Edge Function endpoint for inserts
- ❌ **More complex than Proposal 1** — requires Supabase schema, RLS, Edge Functions

### Best Fit Scenarios (Recommended)

- **5-100 agents** across multiple repositories
- **Full developer-log notes** required (beyond GitHub data)
- **Moderate update frequency** (1-5 events/minute per agent)
- **Existing Supabase investment** (already in stack)
- **Production-grade security** (RLS, JWT auth)
- **Budget-conscious** deployment (free tier for MVP)

### Effort Estimate

| Phase | Duration | Notes |
|-------|----------|-------|
| Supabase schema + RLS + migrations | 1 week | 4 tables, policies, indexes |
| Agent SDK (`@agent-alchemy/agent-sdk`) | 1 week | TS lib, session, activity types |
| Angular dashboard module + routing | 0.5 week | Lazy-loaded feature module |
| AgentGridComponent + AgentCardComponent | 1.5 weeks | PrimeNG DataView, status badge |
| ActivityFeedComponent | 1.5 weeks | PrimeNG Timeline, entry types |
| DashboardService (Supabase Realtime) | 1 week | Subscriptions, Signal integration |
| GitHub Proxy Edge Function | 1 week | Deno, GitHub API, ETag caching |
| GitHub Webhook Edge Function | 0.5 week | Signature validation, event routing |
| Tests (unit + integration + E2E) | 1.5 weeks | Jest, Playwright |
| Polish (mobile, a11y, docs) | 1 week | Responsive, WCAG AA |
| **Total** | **11-12 weeks** | 1.5 developers (overlap) |

**Cost**: $75K–$100K development + $0–$25/mo infrastructure

---

## Proposal Comparison Matrix

| Criterion | P1: GitHub Pull | P2: WebSocket | P3: Hybrid Supabase ⭐ |
|-----------|----------------|---------------|----------------------|
| **Real-time latency** | 30-60s (polling) | <1s | 1-3s (Realtime) |
| **Developer-log notes** | ❌ Workaround only | ✅ Native | ✅ Native |
| **GitHub data depth** | ✅ Full (native) | Medium (proxy) | ✅ Full (proxy) |
| **Infrastructure complexity** | Low | High | Low-Medium |
| **Scalability** | Low (rate limits) | High | Medium-High |
| **Dev cost** | $30K–$40K | $105K–$130K | $75K–$100K |
| **Infra cost/mo** | $0 | $20–$80 | $0–$25 |
| **3yr TCO** | $60K–$87.5K | $135K–$205K | $93.6K–$155K |
| **Stack alignment** | Low | Medium | ✅ High |
| **Security (tokens)** | ❌ Token in browser | ✅ Server-side | ✅ Server-side |
| **Persistence/history** | ✅ GitHub | Custom DB | ✅ Supabase PostgreSQL |
| **Agent SDK effort** | Minimal (none) | High | Low |
| **Time to MVP** | 4 weeks | 14-15 weeks | 10-12 weeks |
| **Bidirectional (commands)** | ❌ | ✅ | Partial (via DB triggers) |
| **Multi-org support** | Medium | ✅ | ✅ (RLS) |

---

## Recommendation

**Use Proposal 3: Hybrid Supabase Realtime Dashboard**

**Rationale**:

1. Supabase is an existing committed dependency — no new vendor introduction
2. Provides true developer-log-style notes (critical requirement not met by P1)
3. Real-time updates at 1-3s latency (sufficient for monitoring use case)
4. GitHub security best practices: installation token never reaches browser
5. Best 3-year TCO among proposals that meet full requirements
6. Lowest infrastructure complexity vs. Proposal 2 (no custom WebSocket server)
7. Reuses established patterns from GitHub App onboarding feature

**When to reconsider Proposal 2 (WebSocket)**:
- If agent count exceeds 200 active simultaneous connections
- If bidirectional command-and-control of agents is required
- If sub-second latency becomes a hard requirement

**When to consider Proposal 1 (GitHub Pull)**:
- As a quick MVP/prototype in <4 weeks to validate dashboard value
- Can be evolved into Proposal 3 later by adding Supabase layer

---

**Document generated by**: Agent Alchemy Research & Ideation SKILL  
**Date**: 2026-07-10  
**Version**: 0.1.0
