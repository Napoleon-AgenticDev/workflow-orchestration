---
meta:
  id: agent-dashboard-business-rules
  title: Business Rules - AI Agent Activity Dashboard
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:agent-alchemy-dev
  tags: [agent-dashboard, plan, angular, supabase, business-rules, data-governance]
  createdBy: Agent Alchemy Plan
  createdAt: '2026-03-13'
  reviewedAt: null
title: Business Rules - AI Agent Activity Dashboard
category: Products
feature: agent-dashboard
lastUpdated: '2026-03-13'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: plan
applyTo: []
keywords: [agent, dashboard, business-rules, data-governance, security, supabase, rls, retention]
topics: []
useCases: []
references:
  - .agent-alchemy/specs/frameworks/angular/
  - .agent-alchemy/specs/stack/stack.json
depends-on:
  - research/feasibility-analysis.md
  - research/data-model-research.md
  - FEASIBILITY-SUMMARY.md
specification: 3-business-rules
---

# Business Rules: AI Agent Activity Dashboard

## Overview

**Purpose**: Define the business logic rules, data governance policies, and operational constraints that govern the AI Agent Activity Dashboard's behavior. These rules encode domain knowledge that must be correctly implemented regardless of technology choices.

**Source**: Derived from research/data-model-research.md schema constraints, FEASIBILITY-SUMMARY.md stakeholder decisions (Q4 retention, Q5 bidirectional control), and research/implementation-recommendations.md security requirements.

**Scope**: All business rules applicable to the `@agent-alchemy/agent-sdk`, Supabase schema constraints, Angular dashboard behavior, and Edge Function logic.

**Note**: Business rules define invariants — they must hold true at all times. Violations represent incorrect system behavior, not just poor UX.

---

## BR-001: Activity Entry Ownership

**Rule**: Every activity entry posted to the system must include a valid `agentId`, `sessionId`, `orgId`, and `timestamp`. Entries without these fields must be rejected.

**Rationale**: The dashboard's core value proposition — attributing activity to specific agents at specific points in time — breaks down without complete ownership metadata. Entries without an agentId cannot be assigned to an agent card, and entries without a timestamp cannot be placed in the chronological feed.

**Formal Statement**:
```
∀ entry ∈ activity_entries:
  entry.agentId ≠ NULL
  ∧ entry.sessionId ≠ NULL
  ∧ entry.orgId ≠ NULL
  ∧ entry.timestamp ≠ NULL
  ∧ entry.type ∈ { 'log', 'decision', 'question', 'status_change', 'github_action', 'error', 'milestone' }
```

**Enforcement Points**:
- Supabase PostgreSQL: `NOT NULL` constraints on `agent_id`, `session_id`, `org_id`, `timestamp` columns
- Supabase check constraint: `type IN (...)` enum check
- Agent SDK: Validates required fields before posting; throws `AgentSDKValidationError` if missing
- Edge Function (if applicable): Validates ownership before write operations

**SQL Enforcement**:
```sql
ALTER TABLE activity_entries
  ADD CONSTRAINT activity_entries_required_fields
  CHECK (
    agent_id IS NOT NULL
    AND session_id IS NOT NULL
    AND org_id IS NOT NULL
    AND timestamp IS NOT NULL
    AND type IN ('log','decision','question','status_change','github_action','error','milestone')
  );
```

**Agent SDK Behavior**:
```typescript
// SDK validates before posting
async log(content: string, level: LogLevel = 'info'): Promise<void> {
  if (!this.currentSessionId) {
    throw new AgentSDKError('Cannot log without an open session. Call openSession() first.');
  }
  if (!content || content.trim().length === 0) {
    throw new AgentSDKValidationError('Log content cannot be empty.');
  }
  // proceeds to insert
}
```

---

## BR-002: Session Lifecycle

**Rule**: Agent sessions follow a defined state machine. Transitions must only occur in valid directions, and an agent may only have one ACTIVE or IDLE session at a time.

**Session States**:
| State | Code | Meaning |
|-------|------|---------|
| Active | `active` | Agent is executing tasks and posting activity |
| Idle | `idle` | Agent is waiting (for input, for task, for resource) |
| Blocked | `blocked` | Agent cannot proceed without human intervention |
| Completed | `completed` | Session ended successfully |
| Failed | `failed` | Session ended due to unrecoverable error |
| Cancelled | `cancelled` | Session explicitly cancelled by operator or agent |

**Valid State Transitions**:
```
         ┌──────────────────────────────────────────────────────┐
         │                  Session State Machine               │
         │                                                      │
         │  openSession()                                       │
         │      │                                               │
         │      ▼                                               │
         │  [active] ◄──────────────────── [idle]              │
         │      │              resume()         │               │
         │      │ idle()                        │               │
         │      └──────────────────────────────┘               │
         │                                                      │
         │  [active] ──block()──► [blocked]                     │
         │  [blocked] ──unblock()──► [active]                   │
         │                                                      │
         │  [active] ──close('success')──► [completed]         │
         │  [idle]   ──close('success')──► [completed]         │
         │  [blocked]──close('failed')───► [failed]            │
         │  [active] ──close('failed')───► [failed]            │
         │  [*]      ──close('cancelled')─► [cancelled]        │
         └──────────────────────────────────────────────────────┘

Valid transitions:
  active → idle          (updateStatus('idle'))
  idle → active          (updateStatus('active') / new activity)
  active → blocked       (updateStatus('blocked'))
  blocked → active       (unblock / operator resolution)
  active → completed     (closeSession('success'))
  idle → completed       (closeSession('success'))
  active → failed        (closeSession('failed'))
  blocked → failed       (closeSession('failed'))
  * → cancelled          (closeSession('cancelled'))

Invalid transitions (rejected):
  completed → * (terminal state — cannot reopen)
  failed → *    (terminal state — must start new session)
```

**Enforcement**:
- Supabase check constraint on `agent_sessions.status`
- Agent SDK `updateStatus()` validates transition before DB write
- Dashboard read-only display: terminal-state sessions are rendered in "history" mode

**Single Active Session Rule**:
```sql
-- Partial unique index: at most one non-terminal session per agent
CREATE UNIQUE INDEX agent_one_active_session
ON agent_sessions (agent_id)
WHERE status NOT IN ('completed', 'failed', 'cancelled');
```

**Business Rationale**: An agent with two "active" sessions would produce ambiguous dashboard state — two cards for the same agent, unclear which is current. The partial unique index prevents this at the database level.

---

## BR-003: GitHub Data Enrichment Cache

**Rule**: GitHub work item data fetched from the GitHub REST API must be cached in `github_work_items.raw_data` for a minimum of **5 minutes** before a re-fetch is permitted.

**Rationale**: GitHub REST API v3 has a rate limit of 5,000 authenticated requests per hour per installation. With 50 agents potentially referencing multiple GitHub issues and PRs, unbounded re-fetching would exhaust this limit. Per FEASIBILITY-SUMMARY.md: "GitHub API rate limit exhaustion (mitigated by ETag caching and Edge Function proxy)".

**Cache TTL Logic**:
```
IF (now() - github_work_items.synced_at) < 5 minutes:
  RETURN cached data from github_work_items.raw_data
  DO NOT call GitHub API

ELSE IF (now() - github_work_items.synced_at) >= 5 minutes:
  CALL GitHub API via Edge Function
  UPDATE github_work_items SET raw_data = response, synced_at = now()
  RETURN fresh data
```

**ETag Conditional Requests**:
- The Edge Function stores the ETag header from the last GitHub API response alongside `raw_data`
- Subsequent requests use `If-None-Match: {etag}` header
- On GitHub 304 Not Modified: update `synced_at` but retain existing `raw_data`; counts against rate limit but returns no data body
- On GitHub 200 OK: update both `raw_data` and `synced_at` with fresh response

**Rate Limit Budget**:
```
Max GitHub API requests from dashboard:
  = (50 agents × 5 work items per session × 60/5 refreshes/hour)
  = 3,000 requests/hour (within 5,000 limit with 40% headroom)
```

**Enforcement**: Cache TTL check is implemented in the Supabase Edge Function `github-proxy`. Angular's `GitHubEnrichmentService` passes the `github_url` and the service decides whether to return cached or fresh data.

---

## BR-004: Data Retention Policy

**Rule**: Activity entries and session data are retained according to the following schedule. Expired data must be purged automatically.

**Retention Schedule**:
| Data Type | Table | Retention Period | Action After Expiry |
|-----------|-------|-----------------|---------------------|
| Activity entries | `activity_entries` | 90 days | Soft-archived then hard-deleted after 1 year |
| Agent sessions | `agent_sessions` | 1 year | Retained indefinitely (compressed metadata only) |
| GitHub work item cache | `github_work_items` | 30 days since last reference | Hard-deleted (re-fetchable from GitHub) |
| Agent registry | `agents` | Indefinite | Never purged |

**Rationale**: Per FEASIBILITY-SUMMARY.md Q4 decision: "90 days" for activity entries. Sessions are kept longer for audit and compliance purposes. GitHub cache is ephemeral by nature.

**Soft-Delete Mechanism**:
```sql
-- Soft archive step (day 90): mark entries as archived
UPDATE activity_entries
SET is_archived = true
WHERE created_at < now() - INTERVAL '90 days'
  AND is_archived = false;

-- Hard delete step (day 365): remove archived entries
DELETE FROM activity_entries
WHERE is_archived = true
  AND created_at < now() - INTERVAL '365 days';
```

**Automated Purge**: A Supabase Edge Function (`retention-purge`) runs on a daily schedule at 02:00 UTC.

**Dashboard Behavior**:
- Archived entries are excluded from the live activity feed
- Historical session view shows entries up to 90 days old
- Sessions older than 1 year do not appear in the history list

---

## BR-005: Rate Limiting for Agent SDK

**Rule**: Each agent (identified by `agentId`) is limited to **100 activity entry insertions per minute**. Requests exceeding this limit are rejected with HTTP 429.

**Rationale**: Prevents runaway agents from flooding the database (e.g., an agent in an infinite loop posting entries continuously). At 100 entries/min, an agent can log one entry every 600ms — sufficient for highly active agents. Per FEASIBILITY-SUMMARY.md: "Rate limiting — agents limited to 100 entries per minute."

**Rate Limit Calculation**:
```
Allowed: 100 entries/min per agentId
Storage impact if exceeded: 100 entries × 500 bytes = 50KB/min = 3MB/hr per agent
  → For 50 agents at max rate: 150MB/hr → unacceptable; rate limit is necessary

Reasonable burst: 100 entries in 60 seconds is generous for agent activity
Typical agent rate: 5–20 entries/min during active execution
```

**Enforcement Options**:

*Option A* (Supabase Edge Function middleware):
```typescript
// Edge Function: agent-activity-proxy
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 100;

export async function checkRateLimit(agentId: string, supabase: SupabaseClient): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count } = await supabase
    .from('activity_entries')
    .select('id', { count: 'exact', head: true })
    .eq('agent_id', agentId)
    .gte('created_at', windowStart);

  return (count ?? 0) < RATE_LIMIT_MAX;
}
```

*Option B* (PostgreSQL trigger — preferred for enforcement closest to data):
```sql
CREATE OR REPLACE FUNCTION check_activity_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM activity_entries
  WHERE agent_id = NEW.agent_id
    AND created_at > NOW() - INTERVAL '1 minute';

  IF recent_count >= 100 THEN
    RAISE EXCEPTION 'Rate limit exceeded: agent % has posted % entries in the last minute',
      NEW.agent_id, recent_count
      USING ERRCODE = 'too_many_requests';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_agent_rate_limit
  BEFORE INSERT ON activity_entries
  FOR EACH ROW EXECUTE FUNCTION check_activity_rate_limit();
```

**SDK Handling**: When a 429 is received, the SDK logs locally and queues the entry for retry after 60 seconds. It does not raise an exception in the agent process.

**Dashboard Display**: Rate limit events appear in the activity feed as a special `SYSTEM` entry: "⏱ Rate limit reached — 23 entries queued".

---

## BR-006: Multi-Tenancy via Row Level Security

**Rule**: All data access must be strictly isolated by `org_id`. No user or agent must ever be able to read or write data belonging to another organization.

**Rationale**: Agent Alchemy serves multiple customer organizations. A misconfigured query must never return cross-org data. Per research/implementation-recommendations.md: "RLS patterns are established in the existing GitHub App onboarding feature."

**RLS Policy Requirements**:

```sql
-- ── agents table ──
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Operators can read their org's agents
CREATE POLICY "org_read_agents" ON agents
  FOR SELECT USING (org_id = (auth.jwt() ->> 'org_id'));

-- Only service role can write agents (agent SDK registration)
CREATE POLICY "service_write_agents" ON agents
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
    OR (auth.jwt() ->> 'agent_write') = 'true'
  );

-- ── agent_sessions table ──
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_read_sessions" ON agent_sessions
  FOR SELECT USING (org_id = (auth.jwt() ->> 'org_id'));

CREATE POLICY "service_write_sessions" ON agent_sessions
  FOR ALL USING (
    auth.role() = 'service_role'
    OR (auth.jwt() ->> 'agent_write') = 'true'
  );

-- ── activity_entries table ──
ALTER TABLE activity_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_read_entries" ON activity_entries
  FOR SELECT USING (org_id = (auth.jwt() ->> 'org_id'));

CREATE POLICY "service_write_entries" ON activity_entries
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
    OR (auth.jwt() ->> 'agent_write') = 'true'
  );
```

**Authentication Roles**:
| Role | Access Level | User |
|------|-------------|------|
| `anon` (with org JWT) | Read own org data | Human operators in Angular app |
| `agent-write` JWT | Write to own org tables | Agent SDK sessions |
| `service_role` | Full access | Admin scripts, Edge Functions |

**Organization ID Claim**: The JWT `org_id` claim is set during Supabase Auth sign-in via a custom hook or database function. It is immutable once set.

**Testing Requirement**: Integration tests must verify that user A's JWT cannot access user B's org data, even when the correct table columns are queried.

---

## BR-007: Activity Entry Immutability

**Rule**: Activity entries in `activity_entries` cannot be modified or deleted by operators or agents after creation. Only the `question_status` and `answer` fields of QUESTION entries may be updated.

**Rationale**: The activity log is an audit trail for autonomous agent behavior. The integrity of this log requires that entries are not retroactively altered. Post-hoc edits could cover up mistakes or misrepresent an agent's actual reasoning trail.

**Allowed Mutations**:
| Field | Update Allowed | Condition |
|-------|---------------|-----------|
| `question_status` | ✅ Yes | QUESTION type entries only; can change `open` → `answered` |
| `answer` | ✅ Yes | QUESTION type entries only; set when question is answered |
| `answered_at` | ✅ Yes | QUESTION type entries only; set to `now()` when answered |
| All other columns | ❌ No | Immutable after insert |

**Enforcement (PostgreSQL)**:
```sql
CREATE OR REPLACE FUNCTION enforce_entry_immutability()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow only question_status, answer, answered_at to be updated for QUESTION entries
  IF OLD.type = 'question' THEN
    IF (
      NEW.session_id != OLD.session_id OR
      NEW.agent_id != OLD.agent_id OR
      NEW.org_id != OLD.org_id OR
      NEW.timestamp != OLD.timestamp OR
      NEW.content != OLD.content OR
      NEW.type != OLD.type
    ) THEN
      RAISE EXCEPTION 'Immutable fields of activity_entries cannot be modified';
    END IF;
    RETURN NEW;
  ELSE
    -- Non-question entries: no updates allowed at all
    RAISE EXCEPTION 'activity_entries are immutable except for question answer fields';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_entry_mutation
  BEFORE UPDATE ON activity_entries
  FOR EACH ROW EXECUTE FUNCTION enforce_entry_immutability();
```

**Delete Policy**:
```sql
-- Operators cannot delete entries; only the retention purge service role can
CREATE POLICY "no_operator_delete_entries" ON activity_entries
  FOR DELETE USING (auth.role() = 'service_role');
```

**Impact on Dashboard**: The "Answer question" feature in the dashboard (future scope) is the only write-back path from the dashboard UI to the database. It sets `question_status = 'answered'` and `answer = '<text>'`.

---

## BR-008: Realtime Subscription Scope

**Rule**: Supabase Realtime subscriptions created by the Angular dashboard must be scoped to the authenticated user's organization. Global subscriptions (without org_id filter) are prohibited.

**Rationale**: An unfiltered subscription would deliver every organization's activity to every connected client, violating BR-006 multi-tenancy rules. Even if RLS prevents the data from being readable via direct query, Realtime channel membership must also be org-scoped.

**Compliant Channel Configuration**:
```typescript
// Compliant: org-scoped channel name + row filter
private subscribeToOrgActivity(orgId: string): void {
  const channel = this.supabase
    .channel(`org-activity:${orgId}`)       // Channel name scoped to org
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_entries',
        filter: `org_id=eq.${orgId}`         // Row-level filter
      },
      (payload) => this.handleNewEntry(payload)
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'agent_sessions',
        filter: `org_id=eq.${orgId}`         // Row-level filter
      },
      (payload) => this.handleSessionUpdate(payload)
    )
    .subscribe();
}
```

**Non-Compliant Pattern** (must never be implemented):
```typescript
// ❌ PROHIBITED: Unfiltered global subscription
this.supabase.channel('activity-all')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_entries' }, ...)
  .subscribe();
```

**Channel Cleanup**: When the dashboard component is destroyed (navigation away), all Realtime channels must be unsubscribed:
```typescript
ngOnDestroy(): void {
  this.supabase.removeAllChannels();
}
```

**Number of Channels**: A maximum of 2 Realtime channels per dashboard session:
1. `org-activity:{orgId}` — subscribes to `activity_entries` (INSERT) and `agent_sessions` (INSERT/UPDATE)
2. `org-github:{orgId}` — subscribes to `github_work_items` (INSERT/UPDATE) for live GitHub status changes

---

## BR-009: Agent Identity Uniqueness

**Rule**: An `agentId` must be unique within an organization. Attempting to register a duplicate `agentId` for the same `org_id` updates the agent's metadata (upsert), not creates a duplicate.

**Rationale**: The agent card grid identifies agents by their `agentId`. Duplicate IDs would render two identical cards and cause ambiguous Realtime filtering.

**Enforcement**:
```sql
-- Primary key on agents.id provides uniqueness across the entire table
-- The agent SDK uses UPSERT to handle re-registration:
INSERT INTO agents (id, org_id, name, description, type, version, ...)
VALUES (?, ?, ?, ?, ?, ?, ...)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      version = EXCLUDED.version,
      updated_at = now()
WHERE agents.org_id = EXCLUDED.org_id; -- Only update if same org owns the id
```

**Cross-Org Collision**: If `agentId` "copilot-agent-alpha" exists in org A, org B can also register an agent with the same ID — they are different rows because `org_id` differs. The primary key is `id` which is unique globally, but we enforce org-namespacing via the `WHERE` clause in the UPSERT. To be safe, consider using `org_id:agent_id` as the effective unique key.

---

## BR-010: Question Answer Protocol

**Rule**: An open QUESTION entry (`question_status = 'open'`) can only be answered once. Once answered, its status is immutable.

**Rationale**: Prevents conflicting answers from multiple operators or accidental re-answering. Per BR-007, activity entries are otherwise immutable; this rule further constrains the one mutable path.

**State Machine**:
```
QUESTION entry created → question_status = 'open'
                                 │
                    Operator provides answer
                                 │
                                 ▼
                    question_status = 'answered'
                    answer = '<answer text>'
                    answered_at = now()
                                 │
                    (TERMINAL STATE — no further updates)
```

**Enforcement (PostgreSQL)**:
```sql
CREATE OR REPLACE FUNCTION enforce_question_answer_protocol()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.type = 'question' AND OLD.question_status = 'answered' THEN
    RAISE EXCEPTION 'Cannot modify an already-answered question entry (id: %)', OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_question_re_answer
  BEFORE UPDATE ON activity_entries
  FOR EACH ROW
  WHEN (OLD.type = 'question')
  EXECUTE FUNCTION enforce_question_answer_protocol();
```

---

## BR-011: Agent Session Heartbeat Protocol

**Rule**: An active agent session must update `heartbeat_at` at least every 60 seconds. Sessions with `heartbeat_at` older than 120 seconds are considered offline.

**Rationale**: Distinguishes agents that are silently stuck (process crash, network disconnect) from intentionally idle agents. Without heartbeat monitoring, a crashed agent would remain showing "Executing" indefinitely.

**Heartbeat Thresholds**:
| Time Since Last Heartbeat | Session UI State | Dashboard Action |
|--------------------------|-----------------|-----------------|
| 0–60s | Active/normal | No change |
| 60–120s | Active/warning | Subtle pulse animation |
| 120s–300s | Offline (soft) | Grey "Offline" badge; card dimmed |
| > 300s | Offline (hard) | "Suspected crash" warning badge |

**SDK Automatic Heartbeat**:
```typescript
// Agent SDK sends heartbeat every 60s while session is open
private startHeartbeat(): void {
  this.heartbeatInterval = setInterval(async () => {
    await this.supabase
      .from('agent_sessions')
      .update({ heartbeat_at: new Date().toISOString() })
      .eq('id', this.sessionId)
      .eq('org_id', this.orgId);
  }, 60_000); // every 60 seconds
}

private stopHeartbeat(): void {
  if (this.heartbeatInterval) {
    clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = null;
  }
}
```

**Dashboard Detection (Angular computed signal)**:
```typescript
// Computed signal derives online status from heartbeat_at
readonly isOnline = computed(() => {
  const heartbeat = this.session()?.heartbeatAt;
  if (!heartbeat) return false;
  const secondsAgo = (Date.now() - new Date(heartbeat).getTime()) / 1000;
  return secondsAgo < 120;
});
```

---

## Business Rules Summary

| Rule | Enforcement Layer | Priority |
|------|------------------|----------|
| BR-001: Entry ownership | DB constraints + SDK validation | Critical |
| BR-002: Session lifecycle | DB check constraint + SDK state machine | Critical |
| BR-003: GitHub cache TTL | Edge Function logic | High |
| BR-004: Data retention | Scheduled Edge Function | High |
| BR-005: Rate limiting | DB trigger or Edge Function | High |
| BR-006: Multi-tenancy RLS | PostgreSQL RLS policies | Critical |
| BR-007: Entry immutability | PostgreSQL trigger + RLS | Critical |
| BR-008: Realtime scope | Angular service implementation | Critical |
| BR-009: Agent uniqueness | DB primary key + UPSERT logic | High |
| BR-010: Question answer protocol | PostgreSQL trigger | Medium |
| BR-011: Heartbeat protocol | SDK timer + Angular computed signal | High |

---

## Business Rules Validation Checklist

For each Sprint, the following business rules must be validated before marking tasks complete:

**Sprint 1 (Schema + SDK)**:
- [ ] BR-001: `NOT NULL` constraints tested with missing agentId/sessionId
- [ ] BR-002: Session state machine enforced; partial unique index verified
- [ ] BR-006: RLS policies block cross-org reads in integration tests
- [ ] BR-009: Duplicate agentId registration performs upsert, not insert

**Sprint 2–3 (Core UI + GitHub)**:
- [ ] BR-003: GitHub cache respects 5-minute TTL; stale data shown with warning
- [ ] BR-007: Attempting to update immutable entry fields returns DB error
- [ ] BR-010: Answering an already-answered question returns error

**Sprint 4 (Realtime)**:
- [ ] BR-008: Realtime channel uses org-scoped filter; global subscription does not exist
- [ ] BR-011: Agent offline detection triggers at 120s heartbeat gap

**Sprint 5–6 (Filtering, History)**:
- [ ] BR-004: Retention purge runs correctly; 91-day-old entries are archived
- [ ] BR-005: Rate limit trigger prevents >100 entries/min per agent
