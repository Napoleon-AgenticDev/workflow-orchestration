---
meta:
  id: agent-dashboard-api-specifications
  title: API Specifications - AI Agent Activity Dashboard
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:agent-alchemy-dev
  tags: [agent-dashboard, architecture, api, rest, supabase, edge-functions, typescript]
  createdBy: Agent Alchemy Architecture
  createdAt: '2026-03-13'
  reviewedAt: null
title: API Specifications - AI Agent Activity Dashboard
category: Products
feature: agent-dashboard
lastUpdated: '2026-03-13'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: architecture
applyTo: []
keywords: [api, rest, supabase, edge-functions, agent-sdk, authentication, typescript]
topics: []
useCases: []
references:
  - .agent-alchemy/specs/stack/stack.json
depends-on:
  - plan/functional-requirements.specification.md
  - architecture/system-architecture.specification.md
  - architecture/database-schema.specification.md
specification: 04-api-specifications
---

# API Specifications: AI Agent Activity Dashboard

## Overview

**Purpose**: Document all APIs consumed and exposed by the AI Agent Activity Dashboard — including the Agent SDK REST calls to Supabase, Supabase Edge Functions, and Angular service method contracts.

**API Surface**:
1. **Agent SDK → Supabase REST API**: What AI agents call to write activity data
2. **Supabase Edge Functions**: `github-proxy`, `agent-auth`, `webhook-handler`
3. **Angular Service Methods**: Public TypeScript API within the dashboard

**Base URLs**:
- Supabase REST: `https://{project-ref}.supabase.co/rest/v1/`
- Supabase Edge Functions: `https://{project-ref}.supabase.co/functions/v1/`
- Supabase Realtime: `wss://{project-ref}.supabase.co/realtime/v1/`

---

## 1. Agent SDK REST API

AI agents interact with Supabase PostgreSQL via the standard Supabase REST API (PostgREST). All calls are authenticated with an agent JWT obtained from the `agent-auth` Edge Function.

**Common Headers (all agent requests)**:
```
Authorization: Bearer {agent-jwt}
Content-Type: application/json
apikey: {SUPABASE_ANON_KEY}
```

---

### POST /rest/v1/agent_registry

Register an agent identity (called once at agent startup if not already registered).

**Method**: `POST`  
**Path**: `/rest/v1/agent_registry`  
**Auth**: Agent JWT  
**Idempotency**: `Prefer: resolution=merge-duplicates` header for upsert behaviour

**Request Body**:
```typescript
interface RegisterAgentRequest {
  id: string;           // Agent ID, e.g. "agent-x-002"
  org_id: string;       // Organization ID
  name: string;         // Human-readable name
  description?: string;
  type: 'copilot-coding' | 'custom' | 'specialized' | 'orchestrator';
  version?: string;     // e.g. "1.2.3"
  capabilities?: string[];
  config?: Record<string, unknown>; // Non-sensitive config only
}
```

**Response** (201 Created):
```typescript
interface RegisterAgentResponse {
  id: string;
  org_id: string;
  name: string;
  registered_at: string; // ISO 8601
}
```

**Error Responses**:
| Code | Condition |
|------|-----------|
| 400 | Invalid agent ID format or required field missing |
| 401 | Missing or invalid JWT |
| 403 | RLS violation: agent_id in body does not match JWT claim |
| 409 | Agent ID already registered to a different org |

---

### POST /rest/v1/agent_sessions

Open a new work session. Called when an agent begins a new task.

**Method**: `POST`  
**Path**: `/rest/v1/agent_sessions`  
**Auth**: Agent JWT  
**Headers**: `Prefer: return=representation`

**Request Body**:
```typescript
interface OpenSessionRequest {
  agent_id: string;      // Must match JWT claim
  org_id: string;        // Must match JWT claim
  project?: string;      // Optional project name
  repo?: string;         // Optional 'owner/repo' format
  branch?: string;       // Optional git branch
  task?: string;         // Optional human-readable task description
  metadata?: Record<string, unknown>;
}
```

**Response** (201 Created):
```typescript
interface OpenSessionResponse {
  id: string;           // UUID — session ID (store for subsequent activity entries)
  agent_id: string;
  org_id: string;
  status: string;       // 'active'
  started_at: string;   // ISO 8601
  heartbeat_at: string; // ISO 8601
}
```

**Error Responses**:
| Code | Condition |
|------|-----------|
| 400 | Missing agent_id or org_id |
| 401 | Missing or invalid JWT |
| 403 | agent_id does not match JWT; agent not registered |

---

### PATCH /rest/v1/agent_sessions?id=eq.{sessionId}

Update session status, heartbeat, task context, or close the session.

**Method**: `PATCH`  
**Path**: `/rest/v1/agent_sessions?id=eq.{sessionId}`  
**Auth**: Agent JWT (must own the session)  
**Headers**: `Prefer: return=minimal`

**Request Body** (all fields optional — only provided fields are updated):
```typescript
interface UpdateSessionRequest {
  status?: 'active' | 'idle' | 'planning' | 'executing' | 'reviewing' | 'blocked' | 'completed' | 'failed' | 'cancelled';
  task?: string;             // Update current task description
  branch?: string;           // Update active branch
  heartbeat_at?: string;     // ISO 8601 — set to now() for heartbeat
  ended_at?: string;         // ISO 8601 — set to close session
  outcome?: 'success' | 'partial' | 'failed' | 'cancelled';
  metadata?: Record<string, unknown>;
}
```

**Response** (204 No Content on success with `Prefer: return=minimal`)

**Usage Examples**:
```typescript
// Heartbeat (every 30 seconds)
PATCH /rest/v1/agent_sessions?id=eq.{sessionId}
body: { heartbeat_at: new Date().toISOString() }

// Status change
PATCH /rest/v1/agent_sessions?id=eq.{sessionId}
body: { status: 'blocked', task: 'Awaiting review of PR #42' }

// Close session
PATCH /rest/v1/agent_sessions?id=eq.{sessionId}
body: { status: 'completed', ended_at: new Date().toISOString(), outcome: 'success' }
```

**Error Responses**:
| Code | Condition |
|------|-----------|
| 400 | Invalid status value |
| 401 | Missing or invalid JWT |
| 403 | Session belongs to a different agent |
| 404 | Session ID not found |

---

### POST /rest/v1/activity_entries

Post a new activity entry to the session log. This is the primary write operation in the Agent SDK.

**Method**: `POST`  
**Path**: `/rest/v1/activity_entries`  
**Auth**: Agent JWT  
**Headers**: `Prefer: return=representation`

**Request Body — Log Entry**:
```typescript
interface PostLogEntryRequest {
  session_id: string;    // UUID from openSession()
  agent_id: string;      // Must match JWT claim
  org_id: string;        // Must match JWT claim
  type: 'log';
  content: string;       // Log message text
  level: 'debug' | 'info' | 'warn' | 'error';
  timestamp?: string;    // ISO 8601 — defaults to now()
  metadata?: Record<string, unknown>;
}
```

**Request Body — Decision Entry**:
```typescript
interface PostDecisionEntryRequest {
  session_id: string;
  agent_id: string;
  org_id: string;
  type: 'decision';
  content: string;       // Decision text
  rationale?: string;    // Why this decision was made
  confidence?: number;   // 0.0 – 1.0
  timestamp?: string;
  metadata?: Record<string, unknown>;
}
```

**Request Body — Question Entry**:
```typescript
interface PostQuestionEntryRequest {
  session_id: string;
  agent_id: string;
  org_id: string;
  type: 'question';
  content: string;           // Question text
  question_status: 'open';   // Always 'open' when first posted
  timestamp?: string;
  metadata?: Record<string, unknown>;
}
```

**Request Body — GitHub Action Entry**:
```typescript
interface PostGitHubActionEntryRequest {
  session_id: string;
  agent_id: string;
  org_id: string;
  type: 'github_action';
  content: string;       // Human-readable description, e.g. "Created PR #42"
  github_url: string;    // Full GitHub URL, must start with https://github.com/
  github_type: 'issue_created' | 'issue_updated' | 'issue_closed' |
               'pr_opened' | 'pr_updated' | 'pr_merged' | 'pr_closed' |
               'comment_posted' | 'review_submitted' | 'branch_created';
  github_repo: string;   // 'owner/repo' format
  github_id?: string;    // GitHub issue/PR number as string
  timestamp?: string;
  metadata?: Record<string, unknown>;
}
```

**Request Body — Status Change Entry**:
```typescript
interface PostStatusChangeEntryRequest {
  session_id: string;
  agent_id: string;
  org_id: string;
  type: 'status_change';
  content?: string;     // Optional description of why status changed
  old_status: string;
  new_status: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}
```

**Response** (201 Created):
```typescript
interface PostActivityEntryResponse {
  id: string;           // UUID — entry ID
  session_id: string;
  agent_id: string;
  type: string;
  timestamp: string;    // ISO 8601
  created_at: string;   // ISO 8601
}
```

**Error Responses**:
| Code | Condition |
|------|-----------|
| 400 | Missing required field; invalid type; content too long |
| 401 | Missing or invalid JWT |
| 403 | agent_id does not match JWT; session is closed or belongs to different agent |
| 422 | github_url does not start with `https://github.com/` |

---

### GET /rest/v1/active_agent_dashboard_view (Dashboard Read Path)

Used by the dashboard to load initial agent data. Not used by agents.

**Method**: `GET`  
**Path**: `/rest/v1/active_agent_dashboard_view?select=*&org_id=eq.{orgId}`  
**Auth**: Human operator JWT (Supabase Auth)

**Response** (200 OK):
```typescript
type ActiveAgentDashboardView = {
  agent_id: string;
  org_id: string;
  agent_name: string;
  agent_description: string | null;
  agent_type: string;
  agent_version: string | null;
  is_active: boolean;
  session_id: string | null;
  session_status: string | null;
  project: string | null;
  repo: string | null;
  branch: string | null;
  current_task: string | null;
  session_started_at: string | null;
  heartbeat_at: string | null;
  last_entry_id: string | null;
  last_entry_type: string | null;
  last_entry_content: string | null;
  last_entry_timestamp: string | null;
  open_questions_count: number;
}[];
```

---

### GET /rest/v1/activity_entries (Dashboard Activity Feed)

Used by the dashboard to load activity entries for the selected agent's session.

**Method**: `GET`  
**Path**: `/rest/v1/activity_entries`  
**Auth**: Human operator JWT  
**Query Parameters**:
```
session_id=eq.{sessionId}
&order=timestamp.desc
&limit=50
&offset=0
```

**Optional type filter**:
```
&type=in.(log,decision,question)
```

**Response** (200 OK): Array of `ActivityEntry` objects (see `database-schema.specification.md` for full TypeScript definition).

---

## 2. Supabase Edge Functions

Edge Functions are Deno TypeScript functions deployed alongside the Supabase project.

---

### POST /functions/v1/agent-auth

Authenticates an AI agent and issues a scoped Supabase JWT.

**Method**: `POST`  
**Path**: `/functions/v1/agent-auth`  
**Auth**: None (authentication happens in this function)  
**Rate limit**: 10 requests/minute per agent ID

**Request Body**:
```typescript
interface AgentAuthRequest {
  agentId: string;     // Agent ID, e.g. "agent-x-002"
  agentSecret: string; // Agent API secret (bcrypt-hashed at rest)
  orgId: string;       // Organization ID
}
```

**Response** (200 OK):
```typescript
interface AgentAuthResponse {
  accessToken: string;   // Supabase JWT — short-lived, scoped to agent+org
  expiresAt: number;     // Unix timestamp (seconds)
  tokenType: 'bearer';
  agentId: string;
  orgId: string;
}
```

**JWT Claims Structure**:
```typescript
interface AgentJwtClaims {
  sub: string;         // agent_id
  org_id: string;      // organization ID
  agent_id: string;    // agent ID (same as sub)
  role: 'authenticated';
  iss: 'supabase';
  exp: number;         // 1 hour from issuance
  iat: number;
}
```

**Error Responses**:
| Code | Body | Condition |
|------|------|-----------|
| 400 | `{ error: 'MISSING_FIELDS' }` | agentId, agentSecret, or orgId missing |
| 401 | `{ error: 'INVALID_CREDENTIALS' }` | Secret does not match stored hash |
| 403 | `{ error: 'AGENT_INACTIVE' }` | Agent registration is_active = false |
| 404 | `{ error: 'AGENT_NOT_FOUND' }` | agentId not in agent_registry |
| 429 | `{ error: 'RATE_LIMITED' }` | Too many auth attempts |

**Implementation Notes** (Deno/TypeScript):
```typescript
// supabase/functions/agent-auth/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verify } from 'https://deno.land/x/bcrypt/mod.ts';

Deno.serve(async (req: Request): Promise<Response> => {
  const { agentId, agentSecret, orgId }: AgentAuthRequest = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Service role to bypass RLS for auth check
  );

  // Fetch agent's stored secret hash
  const { data: agent } = await supabase
    .from('agent_registry')
    .select('id, org_id, is_active, config')
    .eq('id', agentId)
    .eq('org_id', orgId)
    .single();

  if (!agent) return Response.json({ error: 'AGENT_NOT_FOUND' }, { status: 404 });
  if (!agent.is_active) return Response.json({ error: 'AGENT_INACTIVE' }, { status: 403 });

  const secretHash = agent.config.secretHash as string;
  const isValid = await verify(agentSecret, secretHash);
  if (!isValid) return Response.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 });

  // Issue JWT using Supabase Admin API
  const { data: { user } } = await supabase.auth.admin.createUser({
    email: `${agentId}@agent.internal`,
    app_metadata: { agent_id: agentId, org_id: orgId },
    user_metadata: { agent_id: agentId, org_id: orgId },
  });

  const { data: { session } } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: user!.email!,
  });

  return Response.json({
    accessToken: session!.access_token,
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    tokenType: 'bearer',
    agentId,
    orgId,
  });
});
```

---

### POST /functions/v1/github-proxy

Proxies GitHub REST API calls from the Angular dashboard. The GitHub token never leaves the server.

**Method**: `POST`  
**Path**: `/functions/v1/github-proxy`  
**Auth**: Human operator JWT (Supabase Auth)

**Request Body**:
```typescript
interface GitHubProxyRequest {
  endpoint: string;      // GitHub API path, e.g. '/repos/owner/repo/issues/123'
  method?: 'GET' | 'POST' | 'PATCH'; // Default: 'GET'
  params?: Record<string, string>;    // Query parameters
  body?: Record<string, unknown>;     // Request body (for POST/PATCH)
}
```

**Allowed Endpoints** (whitelist enforced in Edge Function):
```typescript
const ALLOWED_ENDPOINT_PATTERNS = [
  /^\/repos\/[^/]+\/[^/]+\/issues\/\d+$/,      // GET issue
  /^\/repos\/[^/]+\/[^/]+\/pulls\/\d+$/,        // GET PR
  /^\/repos\/[^/]+\/[^/]+\/issues\/\d+\/comments$/, // GET issue comments
  /^\/repos\/[^/]+\/[^/]+\/pulls\/\d+\/reviews$/, // GET PR reviews
  /^\/repos\/[^/]+\/[^/]+$/,                    // GET repo info
  /^\/users\/[^/]+$/,                           // GET user info
];
```

**Response** (200 OK):
```typescript
// Returns the raw GitHub API response for the requested endpoint
// Examples:

// For GET /repos/owner/repo/issues/123:
interface GitHubIssueResponse {
  number: number;
  title: string;
  state: 'open' | 'closed';
  body: string;
  html_url: string;
  labels: Array<{ name: string; color: string; description: string | null }>;
  assignees: Array<{ login: string; avatar_url: string; html_url: string }>;
  created_at: string;
  updated_at: string;
  user: { login: string; avatar_url: string };
}

// For GET /repos/owner/repo/pulls/42:
interface GitHubPullRequestResponse {
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  draft: boolean;
  body: string;
  html_url: string;
  merged: boolean;
  mergeable: boolean | null;
  labels: Array<{ name: string; color: string }>;
  assignees: Array<{ login: string; avatar_url: string }>;
  head: { ref: string; sha: string };
  base: { ref: string };
  created_at: string;
  updated_at: string;
}
```

**Error Responses**:
| Code | Body | Condition |
|------|------|-----------|
| 400 | `{ error: 'INVALID_ENDPOINT' }` | Endpoint not in whitelist |
| 401 | `{ error: 'UNAUTHENTICATED' }` | Missing/invalid operator JWT |
| 403 | `{ error: 'FORBIDDEN_ENDPOINT' }` | Endpoint pattern not allowed |
| 502 | `{ error: 'GITHUB_ERROR', details: '...' }` | GitHub API returned error |
| 504 | `{ error: 'GITHUB_TIMEOUT' }` | GitHub API request timed out |

**Implementation Notes** (ETag caching):
```typescript
// supabase/functions/github-proxy/index.ts
Deno.serve(async (req: Request): Promise<Response> => {
  const { endpoint, method = 'GET', params }: GitHubProxyRequest = await req.json();

  // Validate endpoint against whitelist
  const isAllowed = ALLOWED_ENDPOINT_PATTERNS.some((p) => p.test(endpoint));
  if (!isAllowed) return Response.json({ error: 'INVALID_ENDPOINT' }, { status: 400 });

  const githubToken = Deno.env.get('GITHUB_TOKEN')!;
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  const url = `https://api.github.com${endpoint}${queryString}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `token ${githubToken}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'agent-alchemy-dashboard/1.0',
    },
  });

  if (!response.ok) {
    return Response.json(
      { error: 'GITHUB_ERROR', details: await response.text() },
      { status: 502 }
    );
  }

  const data = await response.json();
  return Response.json(data, {
    headers: {
      'Cache-Control': 'public, max-age=300', // 5-minute cache
      ETag: response.headers.get('ETag') ?? '',
    },
  });
});
```

---

### POST /functions/v1/webhook-handler

Processes incoming GitHub webhook events and updates the `github_work_items` cache table.

**Method**: `POST`  
**Path**: `/functions/v1/webhook-handler`  
**Auth**: GitHub webhook HMAC-SHA256 signature (not Supabase Auth)

**Request Headers**:
```
X-GitHub-Event: issues | pull_request | issue_comment
X-Hub-Signature-256: sha256={hmac}
Content-Type: application/json
```

**Request Body**: Standard GitHub webhook payload (per GitHub API docs).

**Processing Logic**:
```typescript
// Events handled:
// issues: opened, edited, closed, reopened, labeled, assigned
// pull_request: opened, edited, closed, merged, review_requested
// issue_comment: created (for question answer detection)

Deno.serve(async (req: Request): Promise<Response> => {
  // 1. Verify HMAC signature
  const signature = req.headers.get('X-Hub-Signature-256') ?? '';
  const body = await req.text();
  const expectedSig = await computeHmac(body, Deno.env.get('GITHUB_WEBHOOK_SECRET')!);
  if (!timingSafeEqual(signature, expectedSig)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const event = req.headers.get('X-GitHub-Event');
  const payload = JSON.parse(body);

  // 2. Upsert github_work_items (service role bypasses RLS)
  const supabase = createClient(url, serviceRoleKey);
  await supabase
    .from('github_work_items')
    .upsert({
      github_url: payload.issue?.html_url ?? payload.pull_request?.html_url,
      github_type: event === 'pull_request' ? 'pull_request' : 'issue',
      github_repo: payload.repository.full_name,
      github_number: payload.issue?.number ?? payload.pull_request?.number,
      title: payload.issue?.title ?? payload.pull_request?.title,
      state: payload.issue?.state ?? payload.pull_request?.state,
      labels: payload.issue?.labels ?? payload.pull_request?.labels ?? [],
      assignees: payload.issue?.assignees ?? payload.pull_request?.assignees ?? [],
      updated_at_github: payload.issue?.updated_at ?? payload.pull_request?.updated_at,
      synced_at: new Date().toISOString(),
      raw_data: payload,
    }, { onConflict: 'org_id, github_url' });

  return new Response('OK', { status: 200 });
});
```

**Error Responses**:
| Code | Condition |
|------|-----------|
| 401 | HMAC signature invalid |
| 422 | Unhandled event type (returns 200 to prevent GitHub retry) |

---

## 3. Angular Service Method API

These are the TypeScript method signatures that components call. Full implementation is in `business-logic.specification.md`.

---

### DashboardService

```typescript
// libs/agency/agent-dashboard/src/lib/services/dashboard.service.ts

@Injectable({ providedIn: 'root' })
export class DashboardService {
  // ── Read-only Signals (public API) ────────────────────────────────────────

  /** All agents for the current org (after initial load + realtime updates) */
  readonly agents: Signal<Agent[]>;

  /** Agents after client-side filter is applied */
  readonly filteredAgents: Signal<Agent[]>;

  /** Currently selected agent (null if none selected) */
  readonly selectedAgent: Signal<Agent | null>;

  /** Currently selected agent ID */
  readonly selectedAgentId: Signal<string | null>;

  /** Activity entries for the selected agent's active session */
  readonly activityEntries: Signal<ActivityEntry[]>;

  /** Selected GitHub work item (for right-panel enrichment display) */
  readonly selectedGitHubWorkItem: Signal<GitHubWorkItem | null>;

  /** Current filter configuration */
  readonly filterConfig: Signal<FilterConfig>;

  /** Initial data loading state */
  readonly isLoading: Signal<boolean>;

  /** Activity entries loading state */
  readonly isLoadingEntries: Signal<boolean>;

  /** Current authenticated org ID */
  readonly currentOrgId: Signal<string>;

  // ── Mutator Methods ───────────────────────────────────────────────────────

  /**
   * Load initial agent data from active_agent_dashboard_view.
   * Sets isLoading signal during fetch.
   */
  loadInitialData(orgId: string): void;

  /**
   * Load activity entries for an agent's session.
   * Sets isLoadingEntries during fetch.
   */
  loadActivityForAgent(agentId: string, sessionId: string): void;

  /**
   * Set the selected agent. Triggers activity entries load.
   * Pass null to deselect.
   */
  setSelectedAgent(agentId: string | null): void;

  /**
   * Apply partial filter configuration. Merges with existing config.
   */
  setFilter(config: Partial<FilterConfig>): void;

  /**
   * Reset all filters to defaults.
   */
  clearFilters(): void;

  /**
   * Select a GitHub work item URL to display in the enrichment panel.
   */
  selectGitHubWorkItem(url: string): void;

  /**
   * Called by AgentRealtimeService when a new activity entry arrives.
   * Updates activityEntries signal if it matches the selected agent's session.
   */
  onRealtimeActivityEntry(entry: ActivityEntry): void;

  /**
   * Called by AgentRealtimeService when a session changes.
   * Updates agents signal.
   */
  onRealtimeSessionChange(session: AgentSession): void;
}
```

---

### AgentRealtimeService

```typescript
// libs/agency/agent-dashboard/src/lib/services/agent-realtime.service.ts

export type ConnectionState = 'connecting' | 'connected' | 'error' | 'disconnected';

@Injectable({ providedIn: 'root' })
export class AgentRealtimeService {
  // ── Read-only Signals (public API) ────────────────────────────────────────

  /** Current WebSocket connection state */
  readonly connectionState: Signal<ConnectionState>;

  /** Whether the service is actively subscribed to Realtime channels */
  readonly isConnected: Signal<boolean>;

  // ── Methods ───────────────────────────────────────────────────────────────

  /**
   * Connect to Supabase Realtime channels for the given org.
   * Subscribes to: org:{orgId}:activity, org:{orgId}:sessions
   * Sets up reconnection with exponential backoff.
   */
  connect(orgId: string): void;

  /**
   * Disconnect from all channels and clean up subscriptions.
   * Called on DashboardComponent.ngOnDestroy().
   */
  disconnect(): void;

  /**
   * Returns a signal that emits the latest activity entry received via Realtime.
   * Consumers (DashboardService) should effect() on this to update state.
   */
  latestActivityEntry: Signal<ActivityEntry | null>;

  /**
   * Returns a signal that emits the latest session change received via Realtime.
   */
  latestSessionChange: Signal<AgentSession | null>;
}
```

---

### GitHubEnrichmentService

```typescript
// libs/agency/agent-dashboard/src/lib/services/github-enrichment.service.ts

export type WorkItemType = 'issue' | 'pull_request';

@Injectable({ providedIn: 'root' })
export class GitHubEnrichmentService {
  // ── Methods ───────────────────────────────────────────────────────────────

  /**
   * Fetch enriched GitHub work item data.
   * LRU cache: 50 items, 5-minute TTL.
   * Deduplicates concurrent requests for the same work item.
   *
   * @param owner  - Repository owner, e.g. 'octocat'
   * @param repo   - Repository name, e.g. 'hello-world'
   * @param number - Issue or PR number
   * @param type   - 'issue' or 'pull_request'
   * @returns Resolved GitHubWorkItem or null on failure
   */
  getWorkItem(
    owner: string,
    repo: string,
    number: number,
    type: WorkItemType
  ): Promise<GitHubWorkItem | null>;

  /**
   * Parse a GitHub URL into its components.
   * Returns null if the URL is not a recognized GitHub issue/PR URL.
   *
   * @example
   * parseGitHubUrl('https://github.com/owner/repo/issues/42')
   * // => { owner: 'owner', repo: 'repo', number: 42, type: 'issue' }
   */
  parseGitHubUrl(url: string): {
    owner: string;
    repo: string;
    number: number;
    type: WorkItemType;
  } | null;

  /**
   * Clear all cached entries (useful for testing or manual refresh).
   */
  clearCache(): void;

  /**
   * Returns cache statistics for debugging.
   */
  getCacheStats(): { size: number; hitRate: number };
}
```

---

## 4. Agent SDK TypeScript API

The `@agent-alchemy/agent-sdk` provides the high-level API that AI agents use. This wraps the raw Supabase REST calls.

```typescript
// @agent-alchemy/agent-sdk — Public API

export interface AgentSDKConfig {
  agentId: string;
  agentSecret: string;
  orgId: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export class AgentSession {
  readonly sessionId: string;
  readonly agentId: string;

  constructor(private readonly config: AgentSDKConfig) {}

  /**
   * Authenticate and open a new work session.
   */
  static async open(
    config: AgentSDKConfig,
    context?: { project?: string; repo?: string; branch?: string; task?: string }
  ): Promise<AgentSession>;

  /**
   * Post a log entry (most common operation).
   */
  log(
    message: string,
    level: 'debug' | 'info' | 'warn' | 'error' = 'info',
    metadata?: Record<string, unknown>
  ): Promise<void>;

  /**
   * Record a decision with optional rationale.
   */
  decide(
    decision: string,
    options?: { rationale?: string; confidence?: number; metadata?: Record<string, unknown> }
  ): Promise<void>;

  /**
   * Ask a question for human review.
   */
  ask(
    question: string,
    metadata?: Record<string, unknown>
  ): Promise<void>;

  /**
   * Record a GitHub action (issue created, PR opened, etc.).
   */
  recordGitHubAction(
    description: string,
    options: {
      githubUrl: string;
      githubType: GitHubActionType;
      githubRepo: string;
      githubId?: string;
    }
  ): Promise<void>;

  /**
   * Update session status.
   */
  setStatus(
    status: 'active' | 'idle' | 'planning' | 'executing' | 'reviewing' | 'blocked',
    task?: string
  ): Promise<void>;

  /**
   * Send a heartbeat to prevent offline detection.
   * Call every 30 seconds.
   */
  heartbeat(): Promise<void>;

  /**
   * Close the session with an outcome.
   */
  close(outcome: 'success' | 'partial' | 'failed' | 'cancelled'): Promise<void>;
}

// Usage example:
// const session = await AgentSession.open(config, { repo: 'owner/repo', task: 'Fix auth bug' });
// await session.log('Starting code analysis');
// await session.decide('Use bcrypt for password hashing', { rationale: 'Industry standard' });
// await session.recordGitHubAction('Created PR #42', { githubUrl: '...', githubType: 'pr_opened', githubRepo: 'owner/repo' });
// await session.close('success');
```

---

## API Versioning Strategy

| API | Versioning Approach |
|-----|-------------------|
| Supabase REST | PostgREST versioning via table/view renames with backward compatibility |
| Edge Functions | URL-path versioned: `/functions/v1/` → `/functions/v2/` on breaking changes |
| Agent SDK | Semantic versioning (`^1.0.0`); major version bump for breaking changes |
| Angular Services | Internal library; no public versioning |

---

## References

- `architecture/database-schema.specification.md` — Table DDL and TypeScript interfaces
- `architecture/security-architecture.specification.md` — JWT structure and RLS policies
- `plan/functional-requirements.specification.md` — FR-001 through FR-008
- `research/implementation-recommendations.md` — Agent SDK design and Edge Function recommendations
