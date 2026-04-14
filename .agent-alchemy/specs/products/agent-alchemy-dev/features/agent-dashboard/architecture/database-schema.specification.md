---
meta:
  id: agent-dashboard-database-schema
  title: Database Schema - AI Agent Activity Dashboard
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:agent-alchemy-dev
  tags: [agent-dashboard, architecture, database, postgresql, supabase, rls, schema]
  createdBy: Agent Alchemy Architecture
  createdAt: '2026-03-13'
  reviewedAt: null
title: Database Schema - AI Agent Activity Dashboard
category: Products
feature: agent-dashboard
lastUpdated: '2026-03-13'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: architecture
applyTo: []
keywords: [database, postgresql, supabase, schema, rls, realtime, migrations, indexing]
topics: []
useCases: []
references:
  - .agent-alchemy/specs/stack/stack.json
depends-on:
  - plan/functional-requirements.specification.md
  - research/data-model-research.md
  - architecture/system-architecture.specification.md
specification: 03-database-schema
---

# Database Schema: AI Agent Activity Dashboard

## Overview

**Purpose**: Define the complete PostgreSQL schema for the AI Agent Activity Dashboard including DDL, Row Level Security policies, Supabase Realtime publication, TypeScript interfaces, migration strategy, and performance considerations.

**Schema Design**: Option C — Normalized Event-Sourced Log (per `research/data-model-research.md`).  
**Database**: Supabase PostgreSQL 15.  
**Multi-tenancy**: `org_id` column on every table; enforced via Row Level Security.  
**Realtime**: `activity_entries` and `agent_sessions` published to Supabase Realtime.

---

## Entity Relationship Diagram

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                      AI Agent Dashboard — ERD                                    ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║  ┌──────────────────────────┐                                                   ║
║  │ agent_registry           │                                                   ║
║  │ ─────────────────────── │                                                   ║
║  │ id (PK)       text       │◄──────────────────────────────┐                   ║
║  │ org_id        text       │                               │                   ║
║  │ name          text       │                               │                   ║
║  │ description   text?      │                               │                   ║
║  │ type          text       │                               │                   ║
║  │ version       text?      │                               │                   ║
║  │ capabilities  text[]     │                               │                   ║
║  │ config        jsonb      │                               │                   ║
║  │ is_active     boolean    │                               │                   ║
║  │ registered_at timestamptz│                               │                   ║
║  │ updated_at    timestamptz│                               │                   ║
║  └──────────────────────────┘                               │                   ║
║           │ 1                                               │                   ║
║           │                                                 │                   ║
║           │ N                                               │                   ║
║  ┌──────────────────────────┐                               │ N                 ║
║  │ agent_sessions           │                               │                   ║
║  │ ─────────────────────── │                               │                   ║
║  │ id (PK)       uuid       │◄──────────────────────────────┼────────────────┐  ║
║  │ agent_id (FK) text       │─────────────────────────────►─┘                │  ║
║  │ org_id        text       │                                                 │  ║
║  │ status        text       │                                                 │  ║
║  │ project       text?      │                                                 │  ║
║  │ repo          text?      │                                                 │  ║
║  │ branch        text?      │                                                 │  ║
║  │ task          text?      │                                                 │  ║
║  │ started_at    timestamptz│                                                 │  ║
║  │ ended_at      timestamptz│                                                 │  ║
║  │ heartbeat_at  timestamptz│                                                 │  ║
║  │ outcome       text?      │                                                 │  ║
║  │ metadata      jsonb      │                                                 │  ║
║  └──────────────────────────┘                                                 │  ║
║           │ 1                                                                 │  ║
║           │                                                                   │  ║
║           │ N                                                                 │  ║
║  ┌──────────────────────────────────────────────────────────────────────────┐ │  ║
║  │ activity_entries                                                          │ │  ║
║  │ ───────────────────────────────────────────────────────────────────────  │ │  ║
║  │ id (PK)          uuid          session_id (FK) uuid                      │─┘  ║
║  │ agent_id (FK)    text          org_id          text                      │    ║
║  │ timestamp        timestamptz   type            text (discriminator)      │    ║
║  │ content          text?         metadata        jsonb                     │    ║
║  │ level            text?         rationale       text?                     │    ║
║  │ confidence       decimal?      question_status text?                     │    ║
║  │ answer           text?         answered_at     timestamptz?              │    ║
║  │ old_status       text?         new_status      text?                     │    ║
║  │ github_url       text?         github_type     text?                     │    ║
║  │ github_repo      text?         github_id       text?                     │    ║
║  │ created_at       timestamptz                                             │    ║
║  └──────────────────────────────────────────────────────────────────────────┘    ║
║                                                                                  ║
║  ┌──────────────────────────────────────────────────────────────────────────┐    ║
║  │ github_work_items                                                         │    ║
║  │ ───────────────────────────────────────────────────────────────────────  │    ║
║  │ id (PK)              uuid          org_id         text                   │    ║
║  │ agent_id (FK)        text?         github_url     text (unique)          │    ║
║  │ github_type          text          github_repo    text                   │    ║
║  │ github_number        integer?      title          text?                  │    ║
║  │ body                 text?         state          text?                  │    ║
║  │ labels               jsonb         assignees      jsonb                  │    ║
║  │ created_at_github    timestamptz?  updated_at_github timestamptz?        │    ║
║  │ synced_at            timestamptz   raw_data       jsonb?                 │    ║
║  └──────────────────────────────────────────────────────────────────────────┘    ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

## Complete DDL

### Setup: Extensions and Configuration

```sql
-- ============================================================
-- Migration: 001_setup_extensions.sql
-- Enable required PostgreSQL extensions
-- ============================================================

create extension if not exists "uuid-ossp";    -- UUID generation
create extension if not exists "pg_trgm";       -- Trigram text search
create extension if not exists "btree_gin";     -- GIN index for composite lookups
```

---

### Table 1: agent_registry

```sql
-- ============================================================
-- Migration: 002_create_agent_registry.sql
-- Registered AI agent identities
-- ============================================================

create table public.agent_registry (
  -- Primary key: human-readable, set by agent developer
  id              text        primary key
                              check (char_length(id) between 1 and 100),

  -- Multi-tenancy partition key
  org_id          text        not null
                              check (char_length(org_id) between 1 and 100),

  -- Agent identity
  name            text        not null
                              check (char_length(name) between 1 and 200),
  description     text        check (description is null or char_length(description) <= 2000),

  -- Classification
  type            text        not null default 'custom'
                              check (type in ('copilot-coding', 'custom', 'specialized', 'orchestrator')),
  version         text        check (version is null or char_length(version) <= 50),
  capabilities    text[]      not null default '{}',

  -- Configuration (non-sensitive; no secrets)
  config          jsonb       not null default '{}',

  -- Lifecycle
  is_active       boolean     not null default true,
  registered_at   timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Documentation
comment on table  public.agent_registry              is 'Registered AI agent identities. One row per unique agent.';
comment on column public.agent_registry.id           is 'Unique agent identifier, e.g. "agent-x-002". Set by agent developer.';
comment on column public.agent_registry.org_id       is 'Organization owning this agent. All data access is partitioned by org_id.';
comment on column public.agent_registry.type         is 'Agent classification: copilot-coding | custom | specialized | orchestrator';
comment on column public.agent_registry.capabilities is 'List of capability tags, e.g. ["code-generation", "pr-review"]';
comment on column public.agent_registry.config       is 'Non-sensitive agent configuration. Never store secrets here.';

-- Indexes
create index idx_agent_registry_org_id    on public.agent_registry (org_id);
create index idx_agent_registry_is_active on public.agent_registry (org_id, is_active);

-- Auto-update updated_at
create or replace function public.update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_agent_registry_updated_at
  before update on public.agent_registry
  for each row execute function public.update_updated_at_column();
```

**TypeScript Interface**:
```typescript
// models/agent-registry.model.ts
export type AgentType = 'copilot-coding' | 'custom' | 'specialized' | 'orchestrator';

export interface AgentRegistry {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  type: AgentType;
  version: string | null;
  capabilities: string[];
  config: Record<string, unknown>;
  isActive: boolean;
  registeredAt: string; // ISO 8601
  updatedAt: string;    // ISO 8601
}

export interface CreateAgentRegistryDto {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  type: AgentType;
  version?: string;
  capabilities?: string[];
  config?: Record<string, unknown>;
}
```

---

### Table 2: agent_sessions

```sql
-- ============================================================
-- Migration: 003_create_agent_sessions.sql
-- Agent work sessions with heartbeat tracking
-- ============================================================

create table public.agent_sessions (
  id              uuid        primary key default gen_random_uuid(),

  -- Foreign key to registering agent
  agent_id        text        not null
                              references public.agent_registry (id)
                              on delete cascade,

  -- Multi-tenancy partition key (denormalized for RLS + index performance)
  org_id          text        not null
                              check (char_length(org_id) between 1 and 100),

  -- Session work state
  status          text        not null default 'active'
                              check (status in (
                                'active', 'idle', 'planning', 'executing',
                                'reviewing', 'blocked', 'completed', 'failed', 'cancelled'
                              )),

  -- Work context (all nullable: agent may not always have repo/project context)
  project         text        check (project is null or char_length(project) <= 500),
  repo            text        check (repo is null or repo ~ '^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$'),
  branch          text        check (branch is null or char_length(branch) <= 300),
  task            text        check (task is null or char_length(task) <= 1000),

  -- Lifecycle timestamps
  started_at      timestamptz not null default now(),
  ended_at        timestamptz check (ended_at is null or ended_at >= started_at),
  heartbeat_at    timestamptz not null default now(),

  -- Outcome (set when session closes)
  outcome         text        check (outcome is null or outcome in ('success', 'partial', 'failed', 'cancelled')),

  -- Extensible metadata
  metadata        jsonb       not null default '{}'
);

comment on table  public.agent_sessions                is 'Active and historical agent work sessions. One row per work session.';
comment on column public.agent_sessions.agent_id       is 'References agent_registry.id. Agent must be registered before opening a session.';
comment on column public.agent_sessions.org_id         is 'Denormalized from agent_registry for RLS and index performance.';
comment on column public.agent_sessions.status         is 'Current session state. Updated by agent heartbeat and explicit status changes.';
comment on column public.agent_sessions.heartbeat_at   is 'Updated by agent SDK keep-alive every 30s. Dashboard computes offline state client-side if >120s stale.';
comment on column public.agent_sessions.repo           is 'GitHub repo in owner/repo format. Nullable: agent may work across repos.';
comment on column public.agent_sessions.outcome        is 'Set when session ends: success|partial|failed|cancelled. Null while session is open.';

-- Indexes for dashboard queries
create index idx_agent_sessions_org_status
  on public.agent_sessions (org_id, status)
  where ended_at is null;                           -- Partial index: only active sessions

create index idx_agent_sessions_agent_id
  on public.agent_sessions (agent_id, started_at desc);

create index idx_agent_sessions_heartbeat
  on public.agent_sessions (org_id, heartbeat_at desc)
  where ended_at is null;                           -- For offline detection queries

create index idx_agent_sessions_repo
  on public.agent_sessions (org_id, repo)
  where repo is not null;
```

**TypeScript Interface**:
```typescript
// models/agent-session.model.ts
export type SessionStatus =
  | 'active' | 'idle' | 'planning' | 'executing'
  | 'reviewing' | 'blocked' | 'completed' | 'failed' | 'cancelled';

export type SessionOutcome = 'success' | 'partial' | 'failed' | 'cancelled';

export interface AgentSession {
  id: string;          // UUID
  agentId: string;
  orgId: string;
  status: SessionStatus;
  project: string | null;
  repo: string | null;
  branch: string | null;
  task: string | null;
  startedAt: string;   // ISO 8601
  endedAt: string | null;
  heartbeatAt: string; // ISO 8601
  outcome: SessionOutcome | null;
  metadata: Record<string, unknown>;
}

export interface CreateAgentSessionDto {
  agentId: string;
  orgId: string;
  project?: string;
  repo?: string;
  branch?: string;
  task?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateAgentSessionDto {
  status?: SessionStatus;
  task?: string;
  branch?: string;
  heartbeatAt?: string;
  endedAt?: string;
  outcome?: SessionOutcome;
  metadata?: Record<string, unknown>;
}
```

---

### Table 3: activity_entries

```sql
-- ============================================================
-- Migration: 004_create_activity_entries.sql
-- Event-sourced immutable activity log (APPEND-ONLY)
-- This is the primary table for Supabase Realtime subscription
-- ============================================================

create table public.activity_entries (
  id                  uuid        primary key default gen_random_uuid(),

  -- Foreign keys
  session_id          uuid        not null
                                  references public.agent_sessions (id)
                                  on delete cascade,
  agent_id            text        not null
                                  references public.agent_registry (id)
                                  on delete cascade,

  -- Multi-tenancy partition key
  org_id              text        not null
                                  check (char_length(org_id) between 1 and 100),

  -- Event time (set by agent; may differ from created_at under clock skew)
  timestamp           timestamptz not null default now(),

  -- Activity type discriminator
  type                text        not null
                                  check (type in (
                                    'log', 'decision', 'question',
                                    'status_change', 'github_action',
                                    'milestone', 'error'
                                  )),

  -- ── Common fields ───────────────────────────────────────────────────────────
  -- Primary human-readable text for this entry (used by all types)
  content             text        check (content is null or char_length(content) <= 10000),
  metadata            jsonb       not null default '{}',

  -- ── Type: log ───────────────────────────────────────────────────────────────
  level               text        check (
                                    level is null or
                                    level in ('debug', 'info', 'warn', 'error')
                                  ),

  -- ── Type: decision ──────────────────────────────────────────────────────────
  rationale           text        check (rationale is null or char_length(rationale) <= 5000),
  confidence          decimal(3,2) check (confidence is null or (confidence >= 0 and confidence <= 1)),

  -- ── Type: question ──────────────────────────────────────────────────────────
  question_status     text        check (
                                    question_status is null or
                                    question_status in ('open', 'answered', 'dismissed')
                                  ),
  answer              text        check (answer is null or char_length(answer) <= 5000),
  answered_at         timestamptz,

  -- ── Type: status_change ─────────────────────────────────────────────────────
  old_status          text,
  new_status          text,

  -- ── Type: github_action ─────────────────────────────────────────────────────
  github_url          text        check (github_url is null or github_url ~* '^https://github\\.com/'),
  github_type         text        check (
                                    github_type is null or
                                    github_type in (
                                      'issue_created', 'issue_updated', 'issue_closed',
                                      'pr_opened', 'pr_updated', 'pr_merged', 'pr_closed',
                                      'comment_posted', 'review_submitted', 'branch_created'
                                    )
                                  ),
  github_repo         text        check (github_repo is null or github_repo ~ '^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$'),
  github_id           text,

  -- Row creation time (immutable — do not use for event ordering; use timestamp instead)
  created_at          timestamptz not null default now()
);

comment on table  public.activity_entries              is 'Append-only event-sourced log of all agent activity. Never UPDATE or DELETE rows.';
comment on column public.activity_entries.timestamp    is 'Agent-reported event time. Use this for ordering, not created_at.';
comment on column public.activity_entries.type         is 'Entry type discriminator: log|decision|question|status_change|github_action|milestone|error';
comment on column public.activity_entries.content      is 'Primary human-readable text. Populated for all entry types.';
comment on column public.activity_entries.level        is 'Log level (type=log only): debug|info|warn|error';
comment on column public.activity_entries.confidence   is 'Decision confidence 0.0-1.0 (type=decision only)';
comment on column public.activity_entries.github_url   is 'GitHub artifact URL (type=github_action only). Must start with https://github.com/';

-- Primary dashboard query: all entries for a session, recent first
create index idx_activity_entries_session_ts
  on public.activity_entries (session_id, timestamp desc);

-- Realtime + filter by type
create index idx_activity_entries_org_type
  on public.activity_entries (org_id, type, timestamp desc);

-- Agent-level activity view
create index idx_activity_entries_agent_ts
  on public.activity_entries (agent_id, timestamp desc);

-- Open questions dashboard query
create index idx_activity_entries_open_questions
  on public.activity_entries (org_id, question_status)
  where type = 'question' and question_status = 'open';

-- GitHub work item cross-reference
create index idx_activity_entries_github_url
  on public.activity_entries (github_url)
  where github_url is not null;

-- Time-range queries (for 90-day retention window)
create index idx_activity_entries_created_at
  on public.activity_entries (created_at);

-- Prevent UPDATE and DELETE on activity_entries (append-only enforcement)
create rule no_update_activity_entries as on update to public.activity_entries do instead nothing;
create rule no_delete_activity_entries as on delete to public.activity_entries do instead nothing;
```

**TypeScript Interfaces — Discriminated Union**:
```typescript
// models/activity-entry.model.ts
export type ActivityEntryType =
  | 'log' | 'decision' | 'question'
  | 'status_change' | 'github_action'
  | 'milestone' | 'error';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type QuestionStatus = 'open' | 'answered' | 'dismissed';
export type GitHubActionType =
  | 'issue_created' | 'issue_updated' | 'issue_closed'
  | 'pr_opened' | 'pr_updated' | 'pr_merged' | 'pr_closed'
  | 'comment_posted' | 'review_submitted' | 'branch_created';

interface BaseActivityEntry {
  id: string;
  sessionId: string;
  agentId: string;
  orgId: string;
  timestamp: string;     // ISO 8601
  content: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface LogEntry extends BaseActivityEntry {
  type: 'log';
  level: LogLevel;
}

export interface DecisionEntry extends BaseActivityEntry {
  type: 'decision';
  rationale: string | null;
  confidence: number | null; // 0.0 – 1.0
}

export interface QuestionEntry extends BaseActivityEntry {
  type: 'question';
  questionStatus: QuestionStatus;
  answer: string | null;
  answeredAt: string | null;
}

export interface GitHubActionEntry extends BaseActivityEntry {
  type: 'github_action';
  githubUrl: string;
  githubType: GitHubActionType;
  githubRepo: string;
  githubId: string | null;
}

export interface StatusChangeEntry extends BaseActivityEntry {
  type: 'status_change';
  oldStatus: string;
  newStatus: string;
}

export interface MilestoneEntry extends BaseActivityEntry {
  type: 'milestone';
}

export interface ErrorEntry extends BaseActivityEntry {
  type: 'error';
  level: 'error';
}

export type ActivityEntry =
  | LogEntry
  | DecisionEntry
  | QuestionEntry
  | GitHubActionEntry
  | StatusChangeEntry
  | MilestoneEntry
  | ErrorEntry;

// Type guard helpers
export const isLogEntry = (e: ActivityEntry): e is LogEntry => e.type === 'log';
export const isDecisionEntry = (e: ActivityEntry): e is DecisionEntry => e.type === 'decision';
export const isQuestionEntry = (e: ActivityEntry): e is QuestionEntry => e.type === 'question';
export const isGitHubActionEntry = (e: ActivityEntry): e is GitHubActionEntry => e.type === 'github_action';
export const isStatusChangeEntry = (e: ActivityEntry): e is StatusChangeEntry => e.type === 'status_change';
```

---

### Table 4: github_work_items

```sql
-- ============================================================
-- Migration: 005_create_github_work_items.sql
-- Cached GitHub issue and pull request data
-- Updated by webhook-handler Edge Function and github-proxy cache writes
-- ============================================================

create table public.github_work_items (
  id                  uuid        primary key default gen_random_uuid(),

  -- Multi-tenancy
  org_id              text        not null,

  -- Optional agent association (which agent first referenced this work item)
  agent_id            text        references public.agent_registry (id)
                                  on delete set null,

  -- GitHub identity (unique per org per URL)
  github_url          text        not null,
  github_type         text        not null
                                  check (github_type in ('issue', 'pull_request', 'comment')),
  github_repo         text        not null
                                  check (github_repo ~ '^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$'),
  github_number       integer     check (github_number > 0),

  -- Cached fields (from GitHub API)
  title               text        check (title is null or char_length(title) <= 500),
  body                text        check (body is null or char_length(body) <= 100000),
  state               text        check (state is null or state in ('open', 'closed', 'merged', 'draft')),
  labels              jsonb       not null default '[]',
  assignees           jsonb       not null default '[]',

  -- GitHub timestamps
  created_at_github   timestamptz,
  updated_at_github   timestamptz,

  -- Cache management
  synced_at           timestamptz not null default now(),

  -- Full GitHub API response (for additional field access)
  raw_data            jsonb,

  -- Uniqueness: one cache entry per URL per org
  constraint uq_github_work_items_org_url unique (org_id, github_url)
);

comment on table  public.github_work_items            is 'Cached GitHub issue and PR data. Updated by webhook-handler and github-proxy Edge Functions.';
comment on column public.github_work_items.github_url is 'Full GitHub HTML URL, e.g. https://github.com/owner/repo/issues/123. Unique per org.';
comment on column public.github_work_items.synced_at  is 'When this cache entry was last updated from GitHub API.';
comment on column public.github_work_items.raw_data   is 'Full GitHub API response JSON. Allows access to fields not in dedicated columns.';

create index idx_github_work_items_org        on public.github_work_items (org_id);
create index idx_github_work_items_repo       on public.github_work_items (org_id, github_repo);
create index idx_github_work_items_agent      on public.github_work_items (agent_id);
create index idx_github_work_items_synced     on public.github_work_items (synced_at);
```

**TypeScript Interface**:
```typescript
// models/github-work-item.model.ts
export type GitHubWorkItemType = 'issue' | 'pull_request' | 'comment';
export type GitHubWorkItemState = 'open' | 'closed' | 'merged' | 'draft';

export interface GitHubLabel {
  name: string;
  color: string;
  description: string | null;
}

export interface GitHubAssignee {
  login: string;
  avatarUrl: string;
  htmlUrl: string;
}

export interface GitHubWorkItem {
  id: string;
  orgId: string;
  agentId: string | null;
  // Parsed from github_url for convenience
  owner: string;
  repo: string;
  number: number;
  // DB columns
  githubUrl: string;
  type: GitHubWorkItemType;
  githubRepo: string;
  githubNumber: number | null;
  title: string | null;
  body: string | null;
  state: GitHubWorkItemState | null;
  labels: GitHubLabel[];
  assignees: GitHubAssignee[];
  htmlUrl: string;
  createdAtGithub: string | null;
  updatedAt: string | null;
  syncedAt: string;
}
```

---

## Dashboard View

```sql
-- ============================================================
-- Migration: 006_create_dashboard_view.sql
-- Materialized view for fast dashboard initial load
-- Joins active sessions with latest activity entry and agent info
-- ============================================================

create view public.active_agent_dashboard_view as
select
  ar.id                         as agent_id,
  ar.org_id,
  ar.name                       as agent_name,
  ar.description                as agent_description,
  ar.type                       as agent_type,
  ar.version                    as agent_version,
  ar.is_active,

  -- Session info (most recent open session per agent)
  s.id                          as session_id,
  s.status                      as session_status,
  s.project,
  s.repo,
  s.branch,
  s.task                        as current_task,
  s.started_at                  as session_started_at,
  s.heartbeat_at,

  -- Last activity entry (for "last action" display on agent card)
  ae.id                         as last_entry_id,
  ae.type                       as last_entry_type,
  ae.content                    as last_entry_content,
  ae.timestamp                  as last_entry_timestamp,

  -- Open question count (for badge on agent card)
  (
    select count(*)
    from public.activity_entries q
    where q.session_id = s.id
      and q.type = 'question'
      and q.question_status = 'open'
  )::integer                    as open_questions_count

from public.agent_registry ar

-- Join most recent open session per agent
left join lateral (
  select *
  from public.agent_sessions sess
  where sess.agent_id = ar.id
    and sess.ended_at is null
  order by sess.started_at desc
  limit 1
) s on true

-- Join most recent activity entry for that session
left join lateral (
  select *
  from public.activity_entries entry
  where entry.session_id = s.id
  order by entry.timestamp desc
  limit 1
) ae on true

where ar.is_active = true;

comment on view public.active_agent_dashboard_view is
  'Denormalized view for fast dashboard initial load. '
  'Returns one row per active agent with their most recent session and last activity entry. '
  'Filter by org_id using RLS.';
```

---

## Row Level Security Policies

```sql
-- ============================================================
-- Migration: 007_row_level_security.sql
-- Row Level Security for multi-tenant data isolation
-- All policies enforce org_id partitioning
-- ============================================================

-- Enable RLS on all tables
alter table public.agent_registry     enable row level security;
alter table public.agent_sessions     enable row level security;
alter table public.activity_entries   enable row level security;
alter table public.github_work_items  enable row level security;

-- ────────────────────────────────────────────────────────────
-- agent_registry policies
-- ────────────────────────────────────────────────────────────

-- Human operators: read agents in their org
create policy "operators_read_own_org_agents"
  on public.agent_registry for select
  using (
    org_id = (auth.jwt() ->> 'org_id')
  );

-- Agents: read their own registration (to validate identity)
create policy "agents_read_own_registration"
  on public.agent_registry for select
  using (
    id = (auth.jwt() ->> 'agent_id')
    and org_id = (auth.jwt() ->> 'org_id')
  );

-- Agents: can only insert their own registration (via Edge Function)
create policy "agents_register_self"
  on public.agent_registry for insert
  with check (
    id = (auth.jwt() ->> 'agent_id')
    and org_id = (auth.jwt() ->> 'org_id')
  );

-- ────────────────────────────────────────────────────────────
-- agent_sessions policies
-- ────────────────────────────────────────────────────────────

-- Human operators: read all sessions for their org
create policy "operators_read_org_sessions"
  on public.agent_sessions for select
  using (
    org_id = (auth.jwt() ->> 'org_id')
  );

-- Agents: read their own sessions
create policy "agents_read_own_sessions"
  on public.agent_sessions for select
  using (
    agent_id = (auth.jwt() ->> 'agent_id')
    and org_id = (auth.jwt() ->> 'org_id')
  );

-- Agents: open new sessions for themselves only
create policy "agents_insert_own_sessions"
  on public.agent_sessions for insert
  with check (
    agent_id = (auth.jwt() ->> 'agent_id')
    and org_id = (auth.jwt() ->> 'org_id')
  );

-- Agents: update only their own open sessions (heartbeat, status, task)
create policy "agents_update_own_sessions"
  on public.agent_sessions for update
  using (
    agent_id = (auth.jwt() ->> 'agent_id')
    and org_id = (auth.jwt() ->> 'org_id')
  )
  with check (
    agent_id = (auth.jwt() ->> 'agent_id')
    and org_id = (auth.jwt() ->> 'org_id')
  );

-- ────────────────────────────────────────────────────────────
-- activity_entries policies
-- ────────────────────────────────────────────────────────────

-- Human operators: read all activity for their org
create policy "operators_read_org_activity"
  on public.activity_entries for select
  using (
    org_id = (auth.jwt() ->> 'org_id')
  );

-- Agents: read their own activity entries
create policy "agents_read_own_activity"
  on public.activity_entries for select
  using (
    agent_id = (auth.jwt() ->> 'agent_id')
    and org_id = (auth.jwt() ->> 'org_id')
  );

-- Agents: insert activity entries only for their own sessions
create policy "agents_insert_own_activity"
  on public.activity_entries for insert
  with check (
    agent_id = (auth.jwt() ->> 'agent_id')
    and org_id = (auth.jwt() ->> 'org_id')
    -- Verify the session belongs to this agent
    and exists (
      select 1 from public.agent_sessions s
      where s.id = session_id
        and s.agent_id = (auth.jwt() ->> 'agent_id')
        and s.ended_at is null   -- cannot write to closed sessions
    )
  );

-- ────────────────────────────────────────────────────────────
-- github_work_items policies
-- ────────────────────────────────────────────────────────────

-- All authenticated org members: read cached GitHub data
create policy "org_members_read_github_items"
  on public.github_work_items for select
  using (
    org_id = (auth.jwt() ->> 'org_id')
  );

-- Edge Functions (service role) can upsert GitHub work items
-- Applied via supabase service_role key — bypasses RLS
```

---

## Supabase Realtime Publication

```sql
-- ============================================================
-- Migration: 008_realtime_publication.sql
-- Enable Supabase Realtime on activity tables
-- ============================================================

-- Add tables to the realtime publication
-- Note: Supabase auto-creates the 'supabase_realtime' publication
alter publication supabase_realtime add table public.activity_entries;
alter publication supabase_realtime add table public.agent_sessions;

-- Row-level filtering is handled by RLS + channel naming (org:{orgId}:*)
-- The Angular client subscribes to specific channels; Supabase Realtime
-- applies RLS before broadcasting events to subscribers.
```

**Angular Channel Configuration** (in `AgentRealtimeService`):
```typescript
// Channel names — org-namespaced for multi-tenancy isolation
const activityChannel = supabase.channel(`org:${orgId}:activity`);
const sessionsChannel  = supabase.channel(`org:${orgId}:sessions`);

activityChannel
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'activity_entries',
    filter: `org_id=eq.${orgId}`,
  }, handleActivityEntry)
  .subscribe();

sessionsChannel
  .on('postgres_changes', {
    event: '*',   // INSERT and UPDATE
    schema: 'public',
    table: 'agent_sessions',
    filter: `org_id=eq.${orgId}`,
  }, handleSessionChange)
  .subscribe();
```

---

## Migration Strategy

### File Naming Convention

```
supabase/migrations/
├── 20260313000001_setup_extensions.sql
├── 20260313000002_create_agent_registry.sql
├── 20260313000003_create_agent_sessions.sql
├── 20260313000004_create_activity_entries.sql
├── 20260313000005_create_github_work_items.sql
├── 20260313000006_create_dashboard_view.sql
├── 20260313000007_row_level_security.sql
└── 20260313000008_realtime_publication.sql
```

**Naming convention**: `YYYYMMDDHHMMSS_description.sql` — Supabase CLI ordering by timestamp prefix.

### Migration Execution

```bash
# Apply all pending migrations (CI/CD)
supabase db push --linked

# Local development
supabase db reset   # Drops and recreates local DB, applies all migrations

# Validate migration (dry-run)
supabase db diff --linked
```

### Rollback Strategy

Supabase does not support automatic rollbacks. Each migration should include a corresponding rollback comment:

```sql
-- ROLLBACK:
-- drop view if exists public.active_agent_dashboard_view;
-- drop table if exists public.github_work_items cascade;
-- drop table if exists public.activity_entries cascade;
-- drop table if exists public.agent_sessions cascade;
-- drop table if exists public.agent_registry cascade;
```

---

## 90-Day Retention Policy

```sql
-- ============================================================
-- Migration: 009_retention_policy.sql
-- Automated cleanup of activity_entries older than 90 days
-- ============================================================

-- Partition strategy: For MVP, use a scheduled function via pg_cron (if available)
-- or an external cron job calling a Supabase Edge Function

-- Archive function (soft approach: move to archive table before delete)
create or replace function public.archive_old_activity_entries()
returns void language plpgsql security definer as $$
begin
  -- Move entries older than 90 days to archive (if archive table exists)
  -- For MVP: simple delete
  delete from public.activity_entries
  where created_at < now() - interval '90 days';

  -- Vacuum to reclaim space
  -- Note: Supabase runs auto-vacuum; manual vacuum not needed here
end;
$$;

comment on function public.archive_old_activity_entries() is
  'Archives/deletes activity_entries older than 90 days. '
  'Called by scheduled Edge Function or pg_cron.';
```

---

## Index Strategy Summary

| Index | Table | Columns | Purpose |
|-------|-------|---------|---------|
| `idx_agent_registry_org_id` | `agent_registry` | `org_id` | Filter by org |
| `idx_agent_registry_is_active` | `agent_registry` | `(org_id, is_active)` | Active agents query |
| `idx_agent_sessions_org_status` | `agent_sessions` | `(org_id, status)` WHERE ended_at IS NULL | Active sessions dashboard load |
| `idx_agent_sessions_agent_id` | `agent_sessions` | `(agent_id, started_at DESC)` | Per-agent session history |
| `idx_agent_sessions_heartbeat` | `agent_sessions` | `(org_id, heartbeat_at DESC)` WHERE ended_at IS NULL | Offline detection |
| `idx_activity_entries_session_ts` | `activity_entries` | `(session_id, timestamp DESC)` | Feed query (primary) |
| `idx_activity_entries_org_type` | `activity_entries` | `(org_id, type, timestamp DESC)` | Type-filtered feed |
| `idx_activity_entries_open_questions` | `activity_entries` | `(org_id, question_status)` WHERE type='question' AND question_status='open' | Open questions badge |
| `idx_activity_entries_created_at` | `activity_entries` | `created_at` | 90-day retention cleanup |
| `idx_github_work_items_repo` | `github_work_items` | `(org_id, github_repo)` | Repo filter |

---

## References

- `research/data-model-research.md` — Schema Option C selection and rationale
- `plan/functional-requirements.specification.md` — FR-004 (activity log), FR-006 (GitHub enrichment)
- `plan/business-rules.specification.md` — BR-007 (append-only log), BR-008 (90-day retention)
- `architecture/system-architecture.specification.md` — Container diagram: Supabase PostgreSQL
