---
meta:
  id: agent-dashboard-data-model-research
  title: AI Agent Dashboard — Data Model Research
  version: 0.1.0
  status: draft
  scope: research
  tags: [agent-dashboard, data-model, supabase, postgresql, github, real-time, schema]
  createdBy: Agent Alchemy Research SKILL
  createdAt: '2026-07-10'
---

# AI Agent Dashboard — Data Model Research

**Research Phase**: Discovery  
**Date**: 2026-07-10  
**Status**: Complete  
**Researcher**: Agent Alchemy Research & Ideation SKILL

---

## Executive Summary

This document investigates data model options for persisting and querying AI agent activity in the context of the Agent Dashboard. The research evaluates three schema design approaches, selects **Event-Sourced Log** as the recommended pattern, and defines the complete Supabase PostgreSQL schema including table structures, indexes, RLS policies, and real-time configuration.

The recommended schema uses four core tables: `agents`, `agent_sessions`, `activity_entries`, and `github_work_items`, with a materialized view `agent_dashboard_summary` for fast dashboard initial load.

---

## 1. Agent Activity Data Requirements

### 1.1 What Data Must the Dashboard Show?

Based on the feature requirements, the dashboard must display:

| Data Category | Required Fields | Data Source |
|---------------|-----------------|-------------|
| **Agent Identity** | Name, ID, type/version, description | Supabase `agents` table |
| **Session Status** | Online/offline, last heartbeat, session start | Supabase `agent_sessions` table |
| **Project Context** | Project name, repository, active branch, active task | `agent_sessions` + `activity_entries` |
| **Activity Log** | Timestamped developer-log entries | Supabase `activity_entries` table |
| **Decisions Made** | Decision text, rationale, timestamp | `activity_entries` (type=decision) |
| **Questions Asked** | Question text, status (open/answered), timestamp | `activity_entries` (type=question) |
| **GitHub Work Items** | Issue/PR title, status, labels, URL | Supabase `github_work_items` + GitHub API |
| **Status Updates** | Agent status (idle/planning/executing/blocked/done) | `agent_sessions.status` |
| **Comments** | Free-text notes, observations | `activity_entries` (type=log) |

### 1.2 Data Lifecycle

```
Agent Registration (once)
       │
       ▼
Session Open (per work session)
       │
       ├──→ Activity Entries (many per session)
       │         ├── log entries
       │         ├── decision entries
       │         ├── question entries
       │         ├── github_action entries
       │         └── status_change entries
       │
       ├──→ GitHub Work Item References (many per session)
       │
       └──→ Session Close (with outcome)
```

### 1.3 Query Patterns

The dashboard must efficiently execute these queries:

| Query | Frequency | Performance Requirement |
|-------|-----------|------------------------|
| Load all active agents for org | On load, every 60s | < 200ms |
| Load recent activity for selected agent | On agent select | < 300ms |
| Stream new activity entries (Realtime) | Continuous | < 100ms delivery |
| Stream session status changes (Realtime) | Continuous | < 100ms delivery |
| Load GitHub work item details | On demand | < 500ms (cached) |
| Count activity entries by type per session | Dashboard metrics | < 100ms |
| Find agents with open questions | Filter operation | < 200ms |

---

## 2. Schema Design Options

### Option A: Flat Event Log (Simple)

All agent activity stored in a single `agent_events` table with a `type` discriminator column.

```sql
-- Option A: Single flat table
create table agent_events (
  id          uuid primary key default gen_random_uuid(),
  org_id      text not null,
  agent_id    text not null,
  session_id  text,
  timestamp   timestamptz not null default now(),
  type        text not null, -- 'session_open', 'log', 'decision', 'question', 'github_action', 'session_close'
  payload     jsonb not null,
  created_at  timestamptz not null default now()
);
```

**Pros**:
- Simplest schema — one table, one insert pattern
- Trivial event sourcing (all events in sequence)
- Easy to add new event types without schema migration

**Cons**:
- `payload` is untyped JSONB — loses TypeScript type safety
- Dashboard queries require complex JSONB extraction for filtering
- Agent "current status" requires scanning all events to find latest status_change
- Poor performance for "give me last 50 log entries" without materialized state
- No referential integrity for agent_id / session_id

**Verdict**: ❌ Too simple for dashboard query patterns; poor performance at scale

---

### Option B: Separate Tables Per Activity Type (Rigid)

Separate tables for each activity type: `agent_log_entries`, `agent_decisions`, `agent_questions`, `agent_github_actions`.

```sql
-- Option B: Separate tables per type
create table agent_log_entries (
  id uuid, agent_id text, session_id text, timestamp timestamptz,
  content text, level text -- 'info', 'warn', 'error', 'debug'
);

create table agent_decisions (
  id uuid, agent_id text, session_id text, timestamp timestamptz,
  decision text, rationale text, confidence decimal
);

create table agent_questions (
  id uuid, agent_id text, session_id text, timestamp timestamptz,
  question text, status text, answer text, answered_at timestamptz
);

create table agent_github_actions (
  id uuid, agent_id text, session_id text, timestamp timestamptz,
  action_type text, -- 'issue_created', 'pr_opened', 'comment_posted', etc.
  github_url text, github_id text, repo text
);
```

**Pros**:
- Strong typing per activity type
- Clean, clear schema
- Easy to query specific activity types
- Referential integrity per table

**Cons**:
- Unified activity timeline requires UNION queries across 4+ tables
- Adding new activity types requires schema migration
- Realtime subscription requires subscribing to 4+ tables for complete feed
- More complex agent SDK (different method → different table)
- Pagination across mixed activity types is complex

**Verdict**: ❌ Too rigid; unified timeline is a core UI requirement and UNION queries are costly

---

### Option C: Normalized Event-Sourced Log (Recommended) ⭐

A normalized approach with a central `activity_entries` table using a `type` discriminator, plus separate tables for agents and sessions, and a dedicated `github_work_items` cache table.

```sql
-- Option C: Normalized event-sourced log with typed entries
create table agents (
  id          text primary key, -- e.g., 'agent-x-002'
  org_id      text not null,
  name        text not null,
  description text,
  type        text not null, -- 'copilot-coding', 'custom', 'specialized'
  version     text,
  config      jsonb default '{}',
  registered_at timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table agent_sessions (
  id          uuid primary key default gen_random_uuid(),
  agent_id    text not null references agents(id),
  org_id      text not null,
  status      text not null default 'active', -- 'active', 'idle', 'blocked', 'completed', 'failed'
  project     text,
  repo        text, -- 'owner/repo' format
  branch      text,
  task        text, -- current task description
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  heartbeat_at timestamptz not null default now(),
  outcome     text, -- 'success', 'partial', 'failed', 'cancelled'
  metadata    jsonb default '{}'
);

create table activity_entries (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references agent_sessions(id),
  agent_id    text not null references agents(id),
  org_id      text not null,
  timestamp   timestamptz not null default now(),
  type        text not null, -- 'log', 'decision', 'question', 'status_change', 'github_action', 'milestone'
  -- Type-specific payload columns (nullable, only populated for relevant type)
  content     text,          -- log: message text, decision: decision text, question: question text
  level       text,          -- log: 'info'|'warn'|'error'|'debug'
  rationale   text,          -- decision: rationale
  question_status text,      -- question: 'open'|'answered'
  answer      text,          -- question: answer text
  answered_at timestamptz,   -- question: when answered
  old_status  text,          -- status_change: previous status
  new_status  text,          -- status_change: new status
  github_url  text,          -- github_action: link to GitHub artifact
  github_type text,          -- github_action: 'issue_created'|'pr_opened'|'comment_posted'|'pr_merged'
  github_repo text,          -- github_action: 'owner/repo'
  github_id   text,          -- github_action: GitHub artifact ID or number
  metadata    jsonb default '{}',
  created_at  timestamptz not null default now()
);

create table github_work_items (
  id          uuid primary key default gen_random_uuid(),
  org_id      text not null,
  agent_id    text references agents(id),
  github_url  text not null unique,
  github_type text not null, -- 'issue', 'pull_request', 'comment'
  github_repo text not null,
  github_number integer,
  title       text,
  body        text,
  state       text, -- 'open', 'closed', 'merged', 'draft'
  labels      jsonb default '[]',
  assignees   jsonb default '[]',
  created_at_github timestamptz,
  updated_at_github timestamptz,
  synced_at   timestamptz not null default now(),
  raw_data    jsonb        -- full GitHub API response for enrichment
);
```

**Pros**:
- ✅ Unified `activity_entries` table → single subscription for complete feed
- ✅ Type discriminator + nullable type-specific columns → clean queries with type guard
- ✅ Strong referential integrity (agents → sessions → activity_entries)
- ✅ GitHub cache table decoupled from activity (can be updated independently)
- ✅ Supabase Realtime on `activity_entries` → single channel for all activity types
- ✅ Easy to query "all entries for this session ordered by timestamp"
- ✅ Materialized summary view possible for fast dashboard load

**Cons**:
- Nullable columns for type-specific fields (acceptable; enforced at application layer)
- `activity_entries` table grows large over time → need retention/archival strategy

**Verdict**: ✅ **Recommended** — best balance of flexibility, performance, and real-time compatibility

---

## 3. Recommended Schema: Complete Definition

### 3.1 Full Supabase Schema

```sql
-- ============================================================
-- AI Agent Dashboard Schema
-- Supabase PostgreSQL
-- Generated: 2026-07-10
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for text search

-- ============================================================
-- Table: agents
-- Agent identity registry
-- ============================================================
create table public.agents (
  id            text primary key check (char_length(id) <= 100),
  org_id        text not null,
  name          text not null check (char_length(name) <= 200),
  description   text,
  type          text not null default 'custom'
                  check (type in ('copilot-coding', 'custom', 'specialized', 'orchestrator')),
  version       text,
  capabilities  text[] default '{}',
  config        jsonb not null default '{}',
  is_active     boolean not null default true,
  registered_at timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.agents is 'Registered AI agent identities';
comment on column public.agents.id is 'Agent unique identifier, e.g. agent-x-002';
comment on column public.agents.org_id is 'Organization owning this agent';
comment on column public.agents.type is 'Agent classification: copilot-coding, custom, specialized, orchestrator';

-- ============================================================
-- Table: agent_sessions
-- Agent work sessions with heartbeat tracking
-- ============================================================
create table public.agent_sessions (
  id            uuid primary key default gen_random_uuid(),
  agent_id      text not null references public.agents(id) on delete cascade,
  org_id        text not null,
  status        text not null default 'active'
                  check (status in ('active', 'idle', 'planning', 'executing', 'reviewing', 'blocked', 'completed', 'failed', 'cancelled')),
  project       text,
  repo          text,    -- 'owner/repo' format, nullable (agent may span repos)
  branch        text,
  task          text,    -- Human-readable current task description
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  heartbeat_at  timestamptz not null default now(),
  outcome       text check (outcome in ('success', 'partial', 'failed', 'cancelled')),
  metadata      jsonb not null default '{}'
);

comment on table public.agent_sessions is 'Active and historical agent work sessions';
comment on column public.agent_sessions.heartbeat_at is 'Updated by agent SDK keep-alive; used to detect offline agents';
comment on column public.agent_sessions.status is 'Current agent work state: active|idle|planning|executing|reviewing|blocked|completed|failed|cancelled';

-- ============================================================
-- Table: activity_entries
-- Event-sourced log of all agent activity
-- This is the main table subscribed to via Supabase Realtime
-- ============================================================
create table public.activity_entries (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references public.agent_sessions(id) on delete cascade,
  agent_id        text not null references public.agents(id) on delete cascade,
  org_id          text not null,
  timestamp       timestamptz not null default now(),
  type            text not null
                    check (type in ('log', 'decision', 'question', 'status_change', 'github_action', 'milestone', 'error')),
  -- Common fields
  content         text,         -- Primary human-readable text for this entry
  metadata        jsonb not null default '{}',
  -- Type: log
  level           text check (level in ('info', 'warn', 'error', 'debug') or level is null),
  -- Type: decision
  rationale       text,
  confidence      decimal(3,2) check (confidence between 0 and 1 or confidence is null),
  -- Type: question
  question_status text check (question_status in ('open', 'answered', 'dismissed') or question_status is null),
  answer          text,
  answered_at     timestamptz,
  -- Type: status_change
  old_status      text,
  new_status      text,
  -- Type: github_action
  github_url      text,
  github_type     text check (github_type in ('issue_created', 'issue_updated', 'pr_opened', 'pr_updated', 'pr_merged', 'comment_posted', 'review_submitted') or github_type is null),
  github_repo     text,
  github_number   integer,
  github_id       text,
  -- Type: milestone
  milestone_name  text,
  -- Audit
  created_at      timestamptz not null default now()
);

comment on table public.activity_entries is 'Event-sourced log of all agent activity. Primary table for Realtime subscriptions.';
comment on column public.activity_entries.type is 'Entry type: log|decision|question|status_change|github_action|milestone|error';
comment on column public.activity_entries.content is 'Primary human-readable text for this entry type';

-- ============================================================
-- Table: github_work_items
-- GitHub API response cache for dashboard enrichment
-- ============================================================
create table public.github_work_items (
  id                  uuid primary key default gen_random_uuid(),
  org_id              text not null,
  agent_id            text references public.agents(id) on delete set null,
  github_url          text not null,
  github_type         text not null check (github_type in ('issue', 'pull_request', 'comment', 'commit')),
  github_repo         text not null,
  github_number       integer,
  title               text,
  body                text,
  state               text,
  state_reason        text,
  labels              jsonb not null default '[]',
  assignees           jsonb not null default '[]',
  author              text,
  created_at_github   timestamptz,
  updated_at_github   timestamptz,
  merged_at           timestamptz,
  closed_at           timestamptz,
  pr_draft            boolean,
  pr_merged           boolean,
  pr_review_state     text,
  checks_status       text,   -- 'pending', 'success', 'failure', 'neutral'
  comment_count       integer default 0,
  synced_at           timestamptz not null default now(),
  raw_data            jsonb,  -- Full GitHub API response
  constraint uq_github_work_items_url unique (github_url)
);

comment on table public.github_work_items is 'Cached GitHub issue/PR data fetched via Edge Function proxy';
comment on column public.github_work_items.synced_at is 'Last time this record was refreshed from GitHub API';
comment on column public.github_work_items.raw_data is 'Full GitHub API response; used for detailed enrichment';
```

### 3.2 Indexes

```sql
-- agents
create index idx_agents_org_id on public.agents(org_id);
create index idx_agents_is_active on public.agents(is_active) where is_active = true;

-- agent_sessions
create index idx_agent_sessions_agent_id on public.agent_sessions(agent_id);
create index idx_agent_sessions_org_id on public.agent_sessions(org_id);
create index idx_agent_sessions_status on public.agent_sessions(status);
create index idx_agent_sessions_heartbeat on public.agent_sessions(heartbeat_at);
create index idx_agent_sessions_active on public.agent_sessions(org_id, status)
  where status in ('active', 'executing', 'planning', 'reviewing', 'blocked');

-- activity_entries
create index idx_activity_entries_session_id on public.activity_entries(session_id);
create index idx_activity_entries_agent_id on public.activity_entries(agent_id);
create index idx_activity_entries_org_id on public.activity_entries(org_id);
create index idx_activity_entries_type on public.activity_entries(type);
create index idx_activity_entries_timestamp on public.activity_entries(timestamp desc);
create index idx_activity_entries_session_time on public.activity_entries(session_id, timestamp desc);
create index idx_activity_entries_questions on public.activity_entries(org_id, question_status)
  where type = 'question' and question_status = 'open';

-- github_work_items
create index idx_github_work_items_agent_id on public.github_work_items(agent_id);
create index idx_github_work_items_org_id on public.github_work_items(org_id);
create index idx_github_work_items_repo on public.github_work_items(github_repo);
create index idx_github_work_items_synced on public.github_work_items(synced_at);
```

### 3.3 Row Level Security Policies

```sql
-- Enable RLS on all tables
alter table public.agents enable row level security;
alter table public.agent_sessions enable row level security;
alter table public.activity_entries enable row level security;
alter table public.github_work_items enable row level security;

-- Helper function: get user's org_ids
create or replace function auth.user_org_ids()
returns text[] language sql stable
as $$
  select array_agg(org_id)
  from public.user_organizations
  where user_id = auth.uid()
$$;

-- agents: users see their org's agents
create policy "users_select_own_org_agents"
  on public.agents for select
  using (org_id = any(auth.user_org_ids()));

create policy "service_role_all_agents"
  on public.agents for all
  using (auth.role() = 'service_role');

-- agent_sessions: users see their org's sessions
create policy "users_select_own_org_sessions"
  on public.agent_sessions for select
  using (org_id = any(auth.user_org_ids()));

create policy "service_role_all_sessions"
  on public.agent_sessions for all
  using (auth.role() = 'service_role');

-- activity_entries: users see their org's entries
create policy "users_select_own_org_activity"
  on public.activity_entries for select
  using (org_id = any(auth.user_org_ids()));

create policy "service_role_all_activity"
  on public.activity_entries for all
  using (auth.role() = 'service_role');

-- github_work_items: users see their org's cached items
create policy "users_select_own_org_github_items"
  on public.github_work_items for select
  using (org_id = any(auth.user_org_ids()));

create policy "service_role_all_github_items"
  on public.github_work_items for all
  using (auth.role() = 'service_role');
```

### 3.4 Dashboard Summary View

```sql
-- Materialized view for fast dashboard initial load
create materialized view public.agent_dashboard_summary as
select
  a.id as agent_id,
  a.org_id,
  a.name as agent_name,
  a.type as agent_type,
  a.version,
  s.id as session_id,
  s.status as session_status,
  s.project,
  s.repo,
  s.branch,
  s.task,
  s.started_at,
  s.heartbeat_at,
  -- Time since last heartbeat (for offline detection)
  extract(epoch from (now() - s.heartbeat_at)) as seconds_since_heartbeat,
  -- Activity counts for this session
  count(ae.id) filter (where ae.type = 'log') as log_count,
  count(ae.id) filter (where ae.type = 'decision') as decision_count,
  count(ae.id) filter (where ae.type = 'question' and ae.question_status = 'open') as open_questions,
  count(ae.id) filter (where ae.type = 'github_action') as github_action_count,
  -- Latest activity entry
  max(ae.timestamp) as last_activity_at,
  -- Latest log entry content (for card preview)
  (
    select content from public.activity_entries
    where session_id = s.id and type = 'log'
    order by timestamp desc limit 1
  ) as latest_log_content
from public.agents a
left join public.agent_sessions s on s.agent_id = a.id
  and s.status != 'completed' and s.status != 'cancelled'
left join public.activity_entries ae on ae.session_id = s.id
where a.is_active = true
group by a.id, a.org_id, a.name, a.type, a.version,
         s.id, s.status, s.project, s.repo, s.branch, s.task,
         s.started_at, s.heartbeat_at;

-- Refresh function (call via pg_cron or manually)
create or replace function refresh_agent_dashboard_summary()
returns void language sql as $$
  refresh materialized view concurrently public.agent_dashboard_summary;
$$;
```

### 3.5 Supabase Realtime Configuration

```sql
-- Enable Realtime on the primary tables
alter publication supabase_realtime add table public.activity_entries;
alter publication supabase_realtime add table public.agent_sessions;

-- Note: Do NOT enable Realtime on github_work_items (high volume cache updates)
-- Note: Do NOT enable Realtime on agents (rare changes, not latency-sensitive)
```

---

## 4. TypeScript Type Definitions

### 4.1 Core Types (Agent SDK & Angular)

```typescript
// packages/agent-sdk/src/types.ts

export type AgentType = 'copilot-coding' | 'custom' | 'specialized' | 'orchestrator';

export type SessionStatus =
  | 'active' | 'idle' | 'planning' | 'executing'
  | 'reviewing' | 'blocked' | 'completed' | 'failed' | 'cancelled';

export type ActivityEntryType =
  | 'log' | 'decision' | 'question' | 'status_change'
  | 'github_action' | 'milestone' | 'error';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export type QuestionStatus = 'open' | 'answered' | 'dismissed';

export type GitHubActionType =
  | 'issue_created' | 'issue_updated'
  | 'pr_opened' | 'pr_updated' | 'pr_merged'
  | 'comment_posted' | 'review_submitted';

export interface Agent {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  type: AgentType;
  version?: string;
  capabilities: string[];
  config: Record<string, unknown>;
  isActive: boolean;
  registeredAt: string;
  updatedAt: string;
}

export interface AgentSession {
  id: string;
  agentId: string;
  orgId: string;
  status: SessionStatus;
  project?: string;
  repo?: string;
  branch?: string;
  task?: string;
  startedAt: string;
  endedAt?: string;
  heartbeatAt: string;
  outcome?: 'success' | 'partial' | 'failed' | 'cancelled';
  metadata: Record<string, unknown>;
}

export interface ActivityEntry {
  id: string;
  sessionId: string;
  agentId: string;
  orgId: string;
  timestamp: string;
  type: ActivityEntryType;
  content?: string;
  metadata: Record<string, unknown>;
  // Log-specific
  level?: LogLevel;
  // Decision-specific
  rationale?: string;
  confidence?: number;
  // Question-specific
  questionStatus?: QuestionStatus;
  answer?: string;
  answeredAt?: string;
  // Status change-specific
  oldStatus?: SessionStatus;
  newStatus?: SessionStatus;
  // GitHub action-specific
  githubUrl?: string;
  githubType?: GitHubActionType;
  githubRepo?: string;
  githubNumber?: number;
  githubId?: string;
  // Milestone-specific
  milestoneName?: string;
  // Audit
  createdAt: string;
}

export interface GitHubWorkItem {
  id: string;
  orgId: string;
  agentId?: string;
  githubUrl: string;
  githubType: 'issue' | 'pull_request' | 'comment' | 'commit';
  githubRepo: string;
  githubNumber?: number;
  title?: string;
  body?: string;
  state?: string;
  stateReason?: string;
  labels: GitHubLabel[];
  assignees: GitHubUser[];
  author?: string;
  createdAtGithub?: string;
  updatedAtGithub?: string;
  mergedAt?: string;
  closedAt?: string;
  prDraft?: boolean;
  prMerged?: boolean;
  prReviewState?: string;
  checksStatus?: 'pending' | 'success' | 'failure' | 'neutral';
  commentCount: number;
  syncedAt: string;
}

// Dashboard summary (from materialized view)
export interface AgentDashboardSummary {
  agentId: string;
  orgId: string;
  agentName: string;
  agentType: AgentType;
  version?: string;
  sessionId?: string;
  sessionStatus?: SessionStatus;
  project?: string;
  repo?: string;
  branch?: string;
  task?: string;
  startedAt?: string;
  heartbeatAt?: string;
  secondsSinceHeartbeat?: number;
  logCount: number;
  decisionCount: number;
  openQuestions: number;
  githubActionCount: number;
  lastActivityAt?: string;
  latestLogContent?: string;
}
```

### 4.2 Agent SDK API

```typescript
// packages/agent-sdk/src/agent-session.ts

export class AgentSession {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly sessionId: string,
    private readonly agentId: string,
    private readonly orgId: string
  ) {}

  /** Post a developer-log style message */
  async log(content: string, level: LogLevel = 'info', metadata?: Record<string, unknown>): Promise<void> {
    await this.insertEntry({ type: 'log', content, level, metadata });
  }

  /** Record a decision made by the agent */
  async decide(decision: string, rationale?: string, confidence?: number): Promise<void> {
    await this.insertEntry({ type: 'decision', content: decision, rationale, confidence });
  }

  /** Post a question requiring human input */
  async ask(question: string, metadata?: Record<string, unknown>): Promise<string> {
    const entry = await this.insertEntry({
      type: 'question',
      content: question,
      questionStatus: 'open',
      metadata
    });
    return entry.id;
  }

  /** Record a GitHub action (issue created, PR opened, etc.) */
  async recordGitHubAction(
    githubType: GitHubActionType,
    githubUrl: string,
    githubRepo: string,
    githubNumber?: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.insertEntry({
      type: 'github_action',
      githubType,
      githubUrl,
      githubRepo,
      githubNumber,
      content: `${githubType.replace('_', ' ')} in ${githubRepo}`,
      metadata
    });
  }

  /** Update agent session status */
  async updateStatus(newStatus: SessionStatus, task?: string): Promise<void> {
    const { data: session } = await this.supabase
      .from('agent_sessions')
      .select('status')
      .eq('id', this.sessionId)
      .single();

    const oldStatus = session?.status as SessionStatus;

    await this.supabase.from('agent_sessions').update({
      status: newStatus,
      task: task ?? undefined,
      heartbeat_at: new Date().toISOString()
    }).eq('id', this.sessionId);

    await this.insertEntry({
      type: 'status_change',
      oldStatus,
      newStatus,
      content: `Status changed: ${oldStatus} → ${newStatus}`
    });
  }

  /** Send heartbeat to indicate agent is still active */
  async heartbeat(): Promise<void> {
    await this.supabase.from('agent_sessions').update({
      heartbeat_at: new Date().toISOString()
    }).eq('id', this.sessionId);
  }

  /** Mark session as complete */
  async close(outcome: 'success' | 'partial' | 'failed' | 'cancelled'): Promise<void> {
    await this.supabase.from('agent_sessions').update({
      status: 'completed',
      ended_at: new Date().toISOString(),
      outcome
    }).eq('id', this.sessionId);

    await this.insertEntry({
      type: 'milestone',
      milestoneName: `Session ${outcome}`,
      content: `Session completed with outcome: ${outcome}`
    });
  }

  private async insertEntry(
    entry: Partial<ActivityEntry>
  ): Promise<ActivityEntry> {
    const { data, error } = await this.supabase
      .from('activity_entries')
      .insert({
        session_id: this.sessionId,
        agent_id: this.agentId,
        org_id: this.orgId,
        timestamp: new Date().toISOString(),
        ...entry
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to insert activity entry: ${error.message}`);
    return data as ActivityEntry;
  }
}
```

---

## 5. Real-time Update Patterns

### 5.1 Angular Supabase Realtime Subscription Pattern

```typescript
@Injectable({ providedIn: 'root' })
export class AgentRealtimeService {
  private readonly supabase = inject(SupabaseService).client;
  private channels = new Map<string, RealtimeChannel>();

  // Subscribe to all session updates for an org
  subscribeToOrgSessions(orgId: string): Observable<AgentSession> {
    return new Observable(observer => {
      const channel = this.supabase
        .channel(`org-sessions-${orgId}`)
        .on<AgentSession>('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'agent_sessions',
          filter: `org_id=eq.${orgId}`
        }, payload => observer.next(payload.new))
        .subscribe();

      return () => channel.unsubscribe();
    });
  }

  // Subscribe to activity entries for a specific agent session
  subscribeToSessionActivity(sessionId: string): Observable<ActivityEntry> {
    return new Observable(observer => {
      const channel = this.supabase
        .channel(`session-activity-${sessionId}`)
        .on<ActivityEntry>('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_entries',
          filter: `session_id=eq.${sessionId}`
        }, payload => observer.next(payload.new))
        .subscribe();

      return () => channel.unsubscribe();
    });
  }
}
```

### 5.2 Offline Agent Detection

```typescript
// Agents are considered offline if heartbeat is > 2 minutes old
const OFFLINE_THRESHOLD_SECONDS = 120;

export function isAgentOnline(summary: AgentDashboardSummary): boolean {
  if (!summary.heartbeatAt) return false;
  return (summary.secondsSinceHeartbeat ?? Infinity) < OFFLINE_THRESHOLD_SECONDS;
}

// In the component, use a computed signal
readonly onlineStatus = computed(() =>
  this.agents().map(a => ({
    ...a,
    isOnline: isAgentOnline(a)
  }))
);
```

---

## 6. Data Retention & Archival Strategy

### 6.1 Retention Policy

| Table | Retention | Strategy |
|-------|-----------|---------|
| `agents` | Indefinite | Never deleted while org active |
| `agent_sessions` (active) | Indefinite | Never deleted |
| `agent_sessions` (completed) | 90 days | Archive to cold storage after 90 days |
| `activity_entries` | 30 days | Delete entries older than 30 days |
| `github_work_items` | 7 days (stale) | Re-fetch or delete if `synced_at` > 7 days |

### 6.2 Archival SQL

```sql
-- Delete old completed sessions and cascade activity entries (via FK)
delete from public.agent_sessions
where status in ('completed', 'cancelled', 'failed')
  and ended_at < now() - interval '90 days';

-- Delete old activity entries not covered by session cascade
delete from public.activity_entries
where created_at < now() - interval '30 days';

-- Refresh stale GitHub work items
delete from public.github_work_items
where synced_at < now() - interval '7 days';
```

---

## 7. Conclusion

The **Normalized Event-Sourced Log** (Option C) with four tables — `agents`, `agent_sessions`, `activity_entries`, `github_work_items` — is the recommended data model for the AI Agent Dashboard. It provides:

- A unified `activity_entries` table for efficient Supabase Realtime subscriptions
- Strong typing via discriminator column with nullable type-specific columns
- PostgreSQL RLS for multi-tenant security
- A materialized summary view for fast dashboard initial load
- A clean TypeScript type system for both the Angular frontend and agent SDK

The schema is designed to be extended in future phases (e.g., adding `agent_commands` for bidirectional control, `agent_metrics` for performance tracking).

---

**Document generated by**: Agent Alchemy Research & Ideation SKILL  
**Date**: 2026-07-10  
**Version**: 0.1.0
