---
meta:
  id: agent-dashboard-development-implementation-guide
  title: Implementation Guide - AI Agent Dashboard Development
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:agent-alchemy-dev
  tags: [agent-dashboard, development, angular, supabase, typescript]
  createdBy: Agent Alchemy Developer
  createdAt: '2026-03-13'
  reviewedAt: null
title: Implementation Guide - AI Agent Activity Dashboard
category: Products
feature: agent-dashboard
lastUpdated: '2026-03-13'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: development
applyTo: []
keywords: [agent, dashboard, angular, signals, supabase, primeng, implementation]
topics: []
useCases: []
references:
  - architecture/ui-components.specification.md
  - architecture/database-schema.specification.md
depends-on:
  - architecture/system-architecture.specification.md
specification: 1-implementation-guide
---

# Implementation Guide: AI Agent Activity Dashboard

## Overview

Complete step-by-step implementation guide for `libs/agency/agent-dashboard/`. Every TypeScript class, HTML template, and SCSS file is provided in full — copy each block directly into the corresponding file.

**Reading order**: Phase 1 (library structure) → Phase 2 (models) → Phase 3 (services) → Phase 4 (components) → Phase 5 (public barrel).

---

## Phase 1 — Library Scaffold

Create configuration files per `development-environment.specification.md`. The `src/lib/` directory tree must exist before copying any source code below.

---

## Phase 2 — Models

### File: `src/lib/tokens/supabase.token.ts`

```typescript
import { InjectionToken } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';

/** Injection token for the Supabase client instance provided by the app. */
export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient>('SUPABASE_CLIENT');
```

---

### File: `src/lib/models/agent.model.ts`

```typescript
/** All valid agent session status values. */
export type AgentStatus =
  | 'active'
  | 'idle'
  | 'planning'
  | 'executing'
  | 'reviewing'
  | 'blocked'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'offline'
  | 'error';

/** Agent classification type. */
export type AgentType =
  | 'copilot-coding'
  | 'custom'
  | 'specialized'
  | 'orchestrator';

/**
 * Domain model for an AI agent as displayed on the dashboard.
 * Mapped from `active_agent_dashboard_view` rows.
 */
export interface Agent {
  readonly id: string;
  readonly orgId: string;
  readonly name: string;
  readonly description: string | null;
  readonly type: AgentType;
  readonly status: AgentStatus;
  readonly activeSessionId: string | null;
  readonly currentTask: string | null;
  readonly project: string | null;
  readonly repo: string | null;
  readonly branch: string | null;
  readonly lastHeartbeatAt: Date;
  readonly openQuestionsCount: number;
}

/**
 * Maps a row from `active_agent_dashboard_view` to the `Agent` domain model.
 *
 * @param row - Raw Supabase REST/Realtime row object.
 * @returns Typed `Agent` domain object.
 */
export function mapViewRowToAgent(row: Record<string, unknown>): Agent {
  return {
    id:                 row['id'] as string,
    orgId:              row['org_id'] as string,
    name:               row['name'] as string,
    description:        (row['description'] as string) ?? null,
    type:               (row['type'] as AgentType) ?? 'custom',
    status:             (row['status'] as AgentStatus) ?? 'idle',
    activeSessionId:    (row['active_session_id'] as string) ?? null,
    currentTask:        (row['current_task'] as string) ?? null,
    project:            (row['project'] as string) ?? null,
    repo:               (row['repo'] as string) ?? null,
    branch:             (row['branch'] as string) ?? null,
    lastHeartbeatAt:    new Date((row['last_heartbeat_at'] as string) ?? Date.now()),
    openQuestionsCount: (row['open_questions_count'] as number) ?? 0,
  };
}
```

---

### File: `src/lib/models/activity-entry.model.ts`

```typescript
/** Discriminator values for all activity entry types. */
export type ActivityEntryType =
  | 'log'
  | 'decision'
  | 'question'
  | 'status_change'
  | 'github_action'
  | 'milestone'
  | 'error';

/** Log severity levels. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Question lifecycle states. */
export type QuestionStatus = 'open' | 'answered' | 'dismissed';

/** All valid GitHub action sub-types. */
export type GitHubActionType =
  | 'issue_created'
  | 'issue_updated'
  | 'issue_closed'
  | 'pr_opened'
  | 'pr_updated'
  | 'pr_merged'
  | 'pr_closed'
  | 'comment_posted'
  | 'review_submitted'
  | 'branch_created';

// ── Base ──────────────────────────────────────────────────────────────────────

interface BaseActivityEntry {
  readonly id: string;
  readonly sessionId: string;
  readonly agentId: string;
  readonly orgId: string;
  readonly timestamp: Date;
  readonly content: string | null;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly createdAt: Date;
}

// ── Concrete variants ─────────────────────────────────────────────────────────

/** A log-level message from the agent. */
export interface LogEntry extends BaseActivityEntry {
  readonly type: 'log';
  readonly level: LogLevel;
}

/** A reasoning decision made by the agent, optionally with confidence score. */
export interface DecisionEntry extends BaseActivityEntry {
  readonly type: 'decision';
  readonly rationale: string | null;
  readonly confidence: number | null;
}

/** A question the agent needs a human to answer. */
export interface QuestionEntry extends BaseActivityEntry {
  readonly type: 'question';
  readonly questionStatus: QuestionStatus;
  readonly answer: string | null;
  readonly answeredAt: Date | null;
}

/** A GitHub artifact action (issue created, PR merged, etc.). */
export interface GitHubActionEntry extends BaseActivityEntry {
  readonly type: 'github_action';
  readonly githubUrl: string;
  readonly githubType: GitHubActionType;
  readonly githubRepo: string;
  readonly githubId: string | null;
}

/** An agent status transition. */
export interface StatusChangeEntry extends BaseActivityEntry {
  readonly type: 'status_change';
  readonly oldStatus: string;
  readonly newStatus: string;
}

/** A significant milestone in the agent's work. */
export interface MilestoneEntry extends BaseActivityEntry {
  readonly type: 'milestone';
}

/** An error condition reported by the agent. */
export interface ErrorEntry extends BaseActivityEntry {
  readonly type: 'error';
  readonly level: 'error';
}

// ── Union ─────────────────────────────────────────────────────────────────────

/**
 * Discriminated union of all possible activity entry types.
 * Use `entry.type` to narrow to a specific variant.
 */
export type ActivityEntry =
  | LogEntry
  | DecisionEntry
  | QuestionEntry
  | GitHubActionEntry
  | StatusChangeEntry
  | MilestoneEntry
  | ErrorEntry;

// ── Type guards ───────────────────────────────────────────────────────────────

export const isLogEntry          = (e: ActivityEntry): e is LogEntry          => e.type === 'log';
export const isDecisionEntry     = (e: ActivityEntry): e is DecisionEntry     => e.type === 'decision';
export const isQuestionEntry     = (e: ActivityEntry): e is QuestionEntry     => e.type === 'question';
export const isGitHubActionEntry = (e: ActivityEntry): e is GitHubActionEntry => e.type === 'github_action';
export const isStatusChangeEntry = (e: ActivityEntry): e is StatusChangeEntry => e.type === 'status_change';
export const isMilestoneEntry    = (e: ActivityEntry): e is MilestoneEntry    => e.type === 'milestone';
export const isErrorEntry        = (e: ActivityEntry): e is ErrorEntry        => e.type === 'error';

// ── Mapper ────────────────────────────────────────────────────────────────────

/**
 * Maps a raw Supabase row to a strongly-typed `ActivityEntry`.
 * Unknown `type` values degrade to a `LogEntry` with level `'info'`
 * to prevent the dashboard crashing on unsupported future types.
 *
 * @param row - Raw row from `activity_entries` via REST or Realtime.
 * @returns Typed `ActivityEntry` discriminated union member.
 */
export function mapRowToActivityEntry(row: Record<string, unknown>): ActivityEntry {
  const base: BaseActivityEntry = {
    id:        row['id'] as string,
    sessionId: row['session_id'] as string,
    agentId:   row['agent_id'] as string,
    orgId:     row['org_id'] as string,
    timestamp: new Date(row['timestamp'] as string),
    content:   (row['content'] as string) ?? null,
    metadata:  (row['metadata'] as Record<string, unknown>) ?? {},
    createdAt: new Date(row['created_at'] as string),
  };

  const type = row['type'] as ActivityEntryType;

  switch (type) {
    case 'log':
      return { ...base, type: 'log', level: (row['level'] as LogLevel) ?? 'info' };
    case 'decision':
      return {
        ...base, type: 'decision',
        rationale:  (row['rationale'] as string) ?? null,
        confidence: (row['confidence'] as number) ?? null,
      };
    case 'question':
      return {
        ...base, type: 'question',
        questionStatus: (row['question_status'] as QuestionStatus) ?? 'open',
        answer:         (row['answer'] as string) ?? null,
        answeredAt:     row['answered_at'] ? new Date(row['answered_at'] as string) : null,
      };
    case 'github_action':
      return {
        ...base, type: 'github_action',
        githubUrl:  row['github_url']  as string,
        githubType: row['github_type'] as GitHubActionType,
        githubRepo: row['github_repo'] as string,
        githubId:   (row['github_id']  as string) ?? null,
      };
    case 'status_change':
      return {
        ...base, type: 'status_change',
        oldStatus: (row['old_status'] as string) ?? '',
        newStatus: (row['new_status'] as string) ?? '',
      };
    case 'milestone':
      return { ...base, type: 'milestone' };
    case 'error':
      return { ...base, type: 'error', level: 'error' };
    default:
      return { ...base, type: 'log', level: 'info' };
  }
}
```

---

### File: `src/lib/models/session.model.ts`

```typescript
/** All valid session status values. */
export type SessionStatus =
  | 'active'
  | 'idle'
  | 'planning'
  | 'executing'
  | 'reviewing'
  | 'blocked'
  | 'completed'
  | 'failed'
  | 'cancelled';

/** Session outcome recorded on close. */
export type SessionOutcome = 'success' | 'partial' | 'failed' | 'cancelled';

/** Domain model for a single agent work session. */
export interface AgentSession {
  readonly id: string;
  readonly agentId: string;
  readonly orgId: string;
  readonly status: SessionStatus;
  readonly project: string | null;
  readonly repo: string | null;
  readonly branch: string | null;
  readonly task: string | null;
  readonly startedAt: Date;
  readonly endedAt: Date | null;
  readonly heartbeatAt: Date;
  readonly outcome: SessionOutcome | null;
  readonly metadata: Readonly<Record<string, unknown>>;
}

/**
 * Maps a raw Supabase `agent_sessions` row to the `AgentSession` domain model.
 *
 * @param row - Raw row from `agent_sessions`.
 * @returns Typed `AgentSession` domain object.
 */
export function mapRowToSession(row: Record<string, unknown>): AgentSession {
  return {
    id:          row['id'] as string,
    agentId:     row['agent_id'] as string,
    orgId:       row['org_id'] as string,
    status:      (row['status'] as SessionStatus) ?? 'active',
    project:     (row['project'] as string) ?? null,
    repo:        (row['repo'] as string) ?? null,
    branch:      (row['branch'] as string) ?? null,
    task:        (row['task'] as string) ?? null,
    startedAt:   new Date(row['started_at'] as string),
    endedAt:     row['ended_at'] ? new Date(row['ended_at'] as string) : null,
    heartbeatAt: new Date(row['heartbeat_at'] as string),
    outcome:     (row['outcome'] as SessionOutcome) ?? null,
    metadata:    (row['metadata'] as Record<string, unknown>) ?? {},
  };
}
```

---

### File: `src/lib/models/github-work-item.model.ts`

```typescript
/** GitHub artifact type. */
export type GitHubWorkItemType = 'issue' | 'pull_request';

/** GitHub item open/closed/merged state. */
export type GitHubWorkItemState = 'open' | 'closed' | 'merged';

/** A label on a GitHub issue or PR. */
export interface GitHubLabel {
  readonly name: string;
  readonly color: string;
}

/** An assignee on a GitHub issue or PR. */
export interface GitHubAssignee {
  readonly login: string;
  readonly avatarUrl: string;
}

/** Enriched GitHub issue or PR data fetched via the `github-proxy` Edge Function. */
export interface GitHubWorkItem {
  readonly id: string;
  readonly orgId: string;
  readonly agentId: string | null;
  readonly githubUrl: string;
  readonly githubType: GitHubWorkItemType;
  readonly githubRepo: string;
  readonly githubNumber: number | null;
  readonly title: string | null;
  readonly body: string | null;
  readonly state: GitHubWorkItemState | null;
  readonly labels: readonly GitHubLabel[];
  readonly assignees: readonly GitHubAssignee[];
  readonly author: string | null;
  readonly createdAt: Date | null;
  readonly updatedAt: Date | null;
  readonly fetchedAt: Date;
}
```

---

### File: `src/lib/models/filter-config.model.ts`

```typescript
import { AgentStatus } from './agent.model';

/** All dimensions on which the agent list can be filtered. */
export interface FilterConfig {
  /** Free-text search across agent name, task, and repo. */
  readonly searchText: string;
  /** Status values to include. Empty array = all statuses. */
  readonly statuses: AgentStatus[];
  /** Filter to a specific repository (`owner/repo`). Empty = all repos. */
  readonly repo: string;
  /** Filter to a specific project name. Empty = all projects. */
  readonly project: string;
  /** When true, hide agents that appear offline (heartbeat > 120s stale). */
  readonly hideOffline: boolean;
}

/** Default filter config — no active filters applied. */
export const DEFAULT_FILTER_CONFIG: FilterConfig = {
  searchText: '',
  statuses:   [],
  repo:       '',
  project:    '',
  hideOffline: false,
};
```

---

## Phase 3 — Services

### File: `src/lib/services/dashboard.service.ts`

```typescript
import {
  Injectable,
  Signal,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../tokens/supabase.token';
import { Agent, mapViewRowToAgent } from '../models/agent.model';
import { ActivityEntry, mapRowToActivityEntry } from '../models/activity-entry.model';
import { FilterConfig, DEFAULT_FILTER_CONFIG } from '../models/filter-config.model';
import { GitHubWorkItem } from '../models/github-work-item.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly supabase = inject<SupabaseClient>(SUPABASE_CLIENT);

  // ── Private writable signals ───────────────────────────────────────────────
  private readonly _agents            = signal<Agent[]>([]);
  private readonly _selectedAgentId   = signal<string | null>(null);
  private readonly _activityEntries   = signal<ActivityEntry[]>([]);
  private readonly _filterConfig      = signal<FilterConfig>(DEFAULT_FILTER_CONFIG);
  private readonly _isLoading         = signal<boolean>(false);
  private readonly _isLoadingEntries  = signal<boolean>(false);
  private readonly _currentOrgId      = signal<string>('');
  private readonly _selectedGitHubUrl = signal<string | null>(null);
  private readonly _gitHubWorkItems   = signal<Map<string, GitHubWorkItem>>(new Map());
  private readonly _error             = signal<string | null>(null);

  // ── Public readonly signals ────────────────────────────────────────────────
  readonly agents            = this._agents.asReadonly();
  readonly selectedAgentId   = this._selectedAgentId.asReadonly();
  readonly activityEntries   = this._activityEntries.asReadonly();
  readonly filterConfig      = this._filterConfig.asReadonly();
  readonly isLoading         = this._isLoading.asReadonly();
  readonly isLoadingEntries  = this._isLoadingEntries.asReadonly();
  readonly currentOrgId      = this._currentOrgId.asReadonly();
  readonly error             = this._error.asReadonly();

  // ── Computed signals ───────────────────────────────────────────────────────

  /** Currently selected agent or null if none selected. */
  readonly selectedAgent: Signal<Agent | null> = computed(() =>
    this._agents().find((a) => a.id === this._selectedAgentId()) ?? null
  );

  /** Agents after applying all active filter dimensions. */
  readonly filteredAgents: Signal<Agent[]> = computed(() => {
    const agents = this._agents();
    const filter = this._filterConfig();
    return agents.filter((a) => this.agentMatchesFilter(a, filter));
  });

  /** Agents currently in a blocked or error state. */
  readonly alertAgents: Signal<Agent[]> = computed(() =>
    this._agents().filter((a) => a.status === 'blocked' || a.status === 'error')
  );

  /** Total count of open questions across all agents. */
  readonly openQuestionsCount: Signal<number> = computed(() =>
    this._agents().reduce((sum, a) => sum + (a.openQuestionsCount ?? 0), 0)
  );

  /** Enriched GitHub work item for the currently selected URL, or null. */
  readonly selectedGitHubWorkItem: Signal<GitHubWorkItem | null> = computed(() => {
    const url = this._selectedGitHubUrl();
    if (!url) return null;
    return this._gitHubWorkItems().get(url) ?? null;
  });

  constructor() {
    // Load activity entries whenever the selected agent changes.
    effect(() => {
      const agent = this.selectedAgent();
      if (agent?.activeSessionId) {
        void this.loadActivityForAgent(agent.id, agent.activeSessionId);
      } else {
        this._activityEntries.set([]);
      }
    });
  }

  // ── Public mutators ────────────────────────────────────────────────────────

  /**
   * Loads the initial agent list from `active_agent_dashboard_view`.
   * Sets `isLoading` during the fetch. On error, sets the `error` signal.
   *
   * @param orgId - Organization identifier from the authenticated JWT.
   */
  async loadInitialData(orgId: string): Promise<void> {
    this._currentOrgId.set(orgId);
    this._isLoading.set(true);
    this._error.set(null);
    try {
      const { data, error } = await this.supabase
        .from('active_agent_dashboard_view')
        .select('*')
        .eq('org_id', orgId);

      if (error) throw error;
      this._agents.set((data ?? []).map(mapViewRowToAgent));
    } catch (err) {
      console.error('[DashboardService] loadInitialData error:', err);
      this._error.set(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Loads the 100 most-recent activity entries for the given session.
   *
   * @param agentId - Agent ID (for logging context).
   * @param sessionId - Session UUID whose entries to load.
   */
  async loadActivityForAgent(agentId: string, sessionId: string): Promise<void> {
    this._isLoadingEntries.set(true);
    try {
      const { data, error } = await this.supabase
        .from('activity_entries')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true })
        .limit(100);

      if (error) throw error;
      this._activityEntries.set((data ?? []).map(mapRowToActivityEntry));
    } catch (err) {
      console.error(`[DashboardService] loadActivityForAgent (${agentId}) error:`, err);
    } finally {
      this._isLoadingEntries.set(false);
    }
  }

  /**
   * Sets the currently selected agent. Triggers activity load via `effect()`.
   * Clears the GitHub work item panel.
   *
   * @param agentId - Agent ID to select, or null to deselect.
   */
  setSelectedAgent(agentId: string | null): void {
    this._selectedAgentId.set(agentId);
    this._selectedGitHubUrl.set(null);
  }

  /**
   * Merges a partial filter config into the current filter config.
   *
   * @param config - Partial filter dimensions to update.
   */
  setFilter(config: Partial<FilterConfig>): void {
    this._filterConfig.update((current) => ({ ...current, ...config }));
  }

  /** Resets all filter dimensions to no-filter defaults. */
  clearFilters(): void {
    this._filterConfig.set({ ...DEFAULT_FILTER_CONFIG });
  }

  /**
   * Sets the GitHub URL for the enrichment panel.
   *
   * @param url - Full GitHub issue or PR URL.
   */
  selectGitHubWorkItem(url: string): void {
    this._selectedGitHubUrl.set(url);
  }

  /**
   * Appends a Realtime activity entry to `activityEntries` if it belongs
   * to the currently selected agent's session.
   *
   * @param entry - Parsed `ActivityEntry` from a Supabase Realtime INSERT.
   */
  onRealtimeActivityEntry(entry: ActivityEntry): void {
    const selected = this.selectedAgent();
    if (!selected || entry.sessionId !== selected.activeSessionId) return;
    this._activityEntries.update((entries) => [...entries, entry]);
  }

  /**
   * Updates agent status/task/heartbeat from a Supabase Realtime
   * INSERT or UPDATE on `agent_sessions`.
   *
   * @param sessionRow - Raw Realtime payload row.
   */
  onRealtimeSessionChange(sessionRow: Record<string, unknown>): void {
    const agentId     = sessionRow['agent_id'] as string;
    const status      = sessionRow['status'] as Agent['status'];
    const task        = (sessionRow['task'] as string) ?? null;
    const heartbeatAt = sessionRow['heartbeat_at'] as string;
    const sessionId   = sessionRow['id'] as string;

    this._agents.update((agents) =>
      agents.map((a) =>
        a.id === agentId
          ? { ...a, status, currentTask: task, lastHeartbeatAt: new Date(heartbeatAt), activeSessionId: sessionId }
          : a
      )
    );
  }

  /**
   * Adds a resolved GitHub work item to the cache map.
   *
   * @param item - Enriched `GitHubWorkItem` returned by `GitHubEnrichmentService`.
   */
  cacheGitHubWorkItem(item: GitHubWorkItem): void {
    this._gitHubWorkItems.update((cache) => {
      const next = new Map(cache);
      next.set(item.githubUrl, item);
      return next;
    });
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private agentMatchesFilter(agent: Agent, filter: FilterConfig): boolean {
    if (filter.searchText) {
      const q = filter.searchText.toLowerCase();
      const hit =
        agent.name.toLowerCase().includes(q) ||
        (agent.currentTask?.toLowerCase().includes(q) ?? false) ||
        (agent.repo?.toLowerCase().includes(q) ?? false);
      if (!hit) return false;
    }

    if (filter.statuses.length > 0 && !filter.statuses.includes(agent.status)) {
      return false;
    }

    if (filter.repo && agent.repo !== filter.repo) return false;
    if (filter.project && agent.project !== filter.project) return false;

    if (filter.hideOffline) {
      const twoMinutesAgo = new Date(Date.now() - 120_000);
      if (agent.lastHeartbeatAt < twoMinutesAgo && agent.status !== 'completed') {
        return false;
      }
    }

    return true;
  }
}
```

---

### File: `src/lib/services/agent-realtime.service.ts`

```typescript
import { Injectable, Signal, inject, signal } from '@angular/core';
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  SupabaseClient,
} from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../tokens/supabase.token';
import { DashboardService } from './dashboard.service';
import { mapRowToActivityEntry } from '../models/activity-entry.model';

/** Supabase Realtime WebSocket connection state. */
export type ConnectionState = 'connecting' | 'connected' | 'error' | 'disconnected';

@Injectable({ providedIn: 'root' })
export class AgentRealtimeService {
  private readonly supabase          = inject<SupabaseClient>(SUPABASE_CLIENT);
  private readonly dashboardService  = inject(DashboardService);

  private activityChannel: RealtimeChannel | null = null;
  private sessionsChannel: RealtimeChannel | null = null;
  private currentOrgId: string | null = null;
  private retryCount = 0;
  private readonly MAX_RETRIES = 5;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly _connectionState = signal<ConnectionState>('disconnected');

  /** Current Supabase Realtime connection state. */
  readonly connectionState: Signal<ConnectionState> = this._connectionState.asReadonly();

  /**
   * Opens Supabase Realtime subscriptions for activity entries and agent
   * sessions scoped to the given organization. No-op if already connected
   * to the same `orgId`.
   *
   * @param orgId - Organization ID used to scope channel names.
   */
  connect(orgId: string): void {
    if (this.currentOrgId === orgId && this._connectionState() === 'connected') return;
    this.currentOrgId = orgId;
    this.retryCount = 0;
    this._connectionState.set('connecting');
    this.subscribeToChannels(orgId);
  }

  /**
   * Removes all active channels and cancels any pending retry timer.
   * Sets `connectionState` to `'disconnected'`.
   */
  disconnect(): void {
    this.clearRetryTimer();
    this.removeChannels();
    this._connectionState.set('disconnected');
    this.currentOrgId = null;
  }

  /**
   * Resets the retry counter and immediately reconnects. Use after
   * `connectionState` reaches `'error'` to trigger a fresh attempt.
   */
  manualReconnect(): void {
    if (!this.currentOrgId) return;
    this.retryCount = 0;
    this.removeChannels();
    this._connectionState.set('connecting');
    this.subscribeToChannels(this.currentOrgId);
  }

  // ── Private: channel setup ─────────────────────────────────────────────────

  private subscribeToChannels(orgId: string): void {
    this.activityChannel = this.supabase
      .channel(`org:${orgId}:activity`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_entries', filter: `org_id=eq.${orgId}` },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) =>
          this.handleActivityEntry(payload.new as Record<string, unknown>)
      )
      .subscribe((status) => this.handleChannelStatus(status, 'activity'));

    this.sessionsChannel = this.supabase
      .channel(`org:${orgId}:sessions`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agent_sessions', filter: `org_id=eq.${orgId}` },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) =>
          this.handleSessionChange(payload.new as Record<string, unknown>)
      )
      .subscribe((status) => this.handleChannelStatus(status, 'sessions'));
  }

  private handleActivityEntry(row: Record<string, unknown>): void {
    try {
      const entry = mapRowToActivityEntry(row);
      this.dashboardService.onRealtimeActivityEntry(entry);
    } catch (err) {
      console.error('[AgentRealtimeService] Parse error (activity entry):', err);
    }
  }

  private handleSessionChange(row: Record<string, unknown>): void {
    try {
      this.dashboardService.onRealtimeSessionChange(row);
    } catch (err) {
      console.error('[AgentRealtimeService] Parse error (session change):', err);
    }
  }

  // ── Private: connection state machine ─────────────────────────────────────

  private handleChannelStatus(status: string, channel: 'activity' | 'sessions'): void {
    if (status === 'SUBSCRIBED') {
      this.retryCount = 0;
      this._connectionState.set('connected');
      if (channel === 'activity') void this.catchUpOnMissedEntries();
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      this._connectionState.set('error');
      this.scheduleReconnect();
    } else if (status === 'CLOSED') {
      this._connectionState.set('disconnected');
    }
  }

  // ── Private: exponential backoff reconnection ──────────────────────────────

  /**
   * Schedules a reconnection attempt using exponential backoff with jitter.
   *
   * Delays: ~1s, ~2s, ~4s, ~8s, ~16s (max 5 retries).
   * Jitter ±500ms prevents thundering-herd after network partitions.
   * After MAX_RETRIES, state is set to 'error' — requires manual reconnect.
   */
  private scheduleReconnect(): void {
    if (this.retryCount >= this.MAX_RETRIES) {
      console.error('[AgentRealtimeService] Max retries reached. Manual reconnect required.');
      this._connectionState.set('error');
      return;
    }

    const baseDelay = Math.pow(2, this.retryCount) * 1000;
    const jitter    = Math.random() * 500;
    const delay     = baseDelay + jitter;
    this.retryCount++;

    this.retryTimer = setTimeout(() => {
      this.removeChannels();
      if (this.currentOrgId) this.subscribeToChannels(this.currentOrgId);
    }, delay);
  }

  private clearRetryTimer(): void {
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  private removeChannels(): void {
    if (this.activityChannel) {
      this.supabase.removeChannel(this.activityChannel);
      this.activityChannel = null;
    }
    if (this.sessionsChannel) {
      this.supabase.removeChannel(this.sessionsChannel);
      this.sessionsChannel = null;
    }
  }

  // ── Private: catch-up on reconnect ────────────────────────────────────────

  /** Queries for any entries missed during a disconnection window. */
  private async catchUpOnMissedEntries(): Promise<void> {
    const agent = this.dashboardService.selectedAgent();
    if (!agent?.activeSessionId) return;

    const entries     = this.dashboardService.activityEntries();
    const lastTs      = entries.at(-1)?.timestamp ?? new Date(Date.now() - 60_000);

    try {
      const { data } = await this.supabase
        .from('activity_entries')
        .select('*')
        .eq('session_id', agent.activeSessionId)
        .gt('timestamp', lastTs.toISOString())
        .order('timestamp', { ascending: true });

      (data ?? [])
        .map(mapRowToActivityEntry)
        .forEach((e) => this.dashboardService.onRealtimeActivityEntry(e));
    } catch (err) {
      console.error('[AgentRealtimeService] Catch-up query failed:', err);
    }
  }
}
```

---

### File: `src/lib/services/github-enrichment.service.ts`

```typescript
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DashboardService } from './dashboard.service';
import { GitHubWorkItem } from '../models/github-work-item.model';
import { SUPABASE_CLIENT } from '../tokens/supabase.token';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * LRU cache entry.
 * @internal
 */
interface CacheEntry {
  key: string;
  value: GitHubWorkItem;
}

@Injectable({ providedIn: 'root' })
export class GitHubEnrichmentService {
  private readonly http             = inject(HttpClient);
  private readonly dashboardService = inject(DashboardService);
  private readonly supabase         = inject<SupabaseClient>(SUPABASE_CLIENT);

  /**
   * Array-based LRU cache (max 256 entries).
   * cache[0] = most-recently-used.
   * cache[length-1] = least-recently-used.
   */
  private readonly cache: CacheEntry[] = [];
  private readonly MAX_CACHE_SIZE = 256;

  /** In-flight promise map — deduplicates concurrent requests for the same URL. */
  private readonly inFlight = new Map<string, Promise<GitHubWorkItem>>();

  /**
   * Returns enriched GitHub issue/PR data for the given URL.
   * Resolution order: LRU cache → in-flight dedup → HTTP fetch.
   *
   * @param githubUrl - Full GitHub issue or PR URL.
   * @returns Resolved `GitHubWorkItem`.
   * @throws {Error} If the `github-proxy` Edge Function returns a non-2xx status.
   */
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

  /**
   * Eagerly prefetches multiple GitHub work items in parallel.
   * Individual errors are caught and logged without rejecting the call.
   *
   * @param urls - Array of GitHub URLs to prefetch.
   */
  async prefetchWorkItems(urls: string[]): Promise<void> {
    await Promise.allSettled(
      urls.map((url) =>
        this.fetchWorkItem(url).catch((err) =>
          console.warn(`[GitHubEnrichmentService] Prefetch failed for ${url}:`, err)
        )
      )
    );
  }

  /** Clears the LRU cache. Used in tests to ensure a clean state. */
  clearCache(): void {
    this.cache.length = 0;
    this.inFlight.clear();
  }

  // ── Private: HTTP ──────────────────────────────────────────────────────────

  private async callGithubProxy(githubUrl: string): Promise<GitHubWorkItem> {
    const { data: { session } } = await this.supabase.auth.getSession();
    const accessToken = session?.access_token ?? '';

    // Derive Supabase project URL from the supabase client URL
    const supabaseUrl = (this.supabase as unknown as { supabaseUrl: string }).supabaseUrl ?? '';
    const anonKey     = (this.supabase as unknown as { supabaseKey: string }).supabaseKey ?? '';

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`,
      'apikey':        anonKey,
      'Content-Type':  'application/json',
    });

    return firstValueFrom(
      this.http.post<GitHubWorkItem>(
        `${supabaseUrl}/functions/v1/github-proxy`,
        { url: githubUrl },
        { headers }
      )
    );
  }

  // ── Private: LRU cache ─────────────────────────────────────────────────────

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
      this.cache.pop(); // evict LRU
    }
  }
}
```

---

## Phase 4 — Components

### File: `src/lib/components/dashboard/dashboard.component.ts`

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { AgentGridComponent } from '../agent-grid/agent-grid.component';
import { ActivityPanelComponent } from '../activity-panel/activity-panel.component';
import { FilterSidebarComponent } from '../filter-sidebar/filter-sidebar.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { DashboardService } from '../../services/dashboard.service';
import { AgentRealtimeService } from '../../services/agent-realtime.service';
import { FilterConfig } from '../../models/filter-config.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    SkeletonModule,
    AgentGridComponent,
    ActivityPanelComponent,
    FilterSidebarComponent,
    EmptyStateComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private readonly realtimeService  = inject(AgentRealtimeService);

  protected readonly filteredAgents   = this.dashboardService.filteredAgents;
  protected readonly selectedAgent    = this.dashboardService.selectedAgent;
  protected readonly connectionState  = this.realtimeService.connectionState;
  protected readonly isLoading        = this.dashboardService.isLoading;
  protected readonly alertAgents      = this.dashboardService.alertAgents;
  protected readonly openQuestionsCount = this.dashboardService.openQuestionsCount;

  ngOnInit(): void {
    void this.dashboardService.loadInitialData(this.dashboardService.currentOrgId());
    this.realtimeService.connect(this.dashboardService.currentOrgId());
  }

  ngOnDestroy(): void {
    this.realtimeService.disconnect();
  }

  protected onAgentSelected(agentId: string): void {
    this.dashboardService.setSelectedAgent(agentId);
  }

  protected onFilterChanged(config: Partial<FilterConfig>): void {
    this.dashboardService.setFilter(config);
  }

  protected onReconnect(): void {
    this.realtimeService.manualReconnect();
  }
}
```

### File: `src/lib/components/dashboard/dashboard.component.html`

```html
<div class="dashboard-shell h-screen flex flex-col bg-surface-ground">
  <!-- Top bar -->
  <header class="dashboard-header flex items-center justify-between px-4 py-2 border-b border-surface-border bg-surface-0 shadow-sm">
    <div class="flex items-center gap-3">
      <h1 class="text-lg font-semibold text-color">Agent Activity Dashboard</h1>
      @if (alertAgents().length > 0) {
        <span class="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
          {{ alertAgents().length }} alert{{ alertAgents().length !== 1 ? 's' : '' }}
        </span>
      }
      @if (openQuestionsCount() > 0) {
        <span class="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
          {{ openQuestionsCount() }} question{{ openQuestionsCount() !== 1 ? 's' : '' }}
        </span>
      }
    </div>
    <div class="flex items-center gap-3">
      <span
        class="text-sm font-medium"
        [class.text-green-600]="connectionState() === 'connected'"
        [class.text-yellow-600]="connectionState() === 'connecting'"
        [class.text-red-600]="connectionState() === 'error'"
        [class.text-surface-500]="connectionState() === 'disconnected'"
        aria-live="polite"
        aria-label="Connection status: {{ connectionState() }}"
      >
        @switch (connectionState()) {
          @case ('connected')    { ● Live }
          @case ('connecting')   { ○ Connecting… }
          @case ('error')        { ✕ Connection lost }
          @case ('disconnected') { ○ Disconnected }
        }
      </span>
      @if (connectionState() === 'error') {
        <button
          class="text-xs px-2 py-1 rounded border border-red-400 text-red-600 hover:bg-red-50"
          (click)="onReconnect()"
          type="button"
        >
          Reconnect
        </button>
      }
    </div>
  </header>

  <!-- Main layout -->
  <div class="dashboard-body flex flex-1 overflow-hidden">
    <!-- Filter sidebar -->
    <aside class="w-56 border-r border-surface-border overflow-y-auto bg-surface-0">
      <app-filter-sidebar (filterChanged)="onFilterChanged($event)" />
    </aside>

    <!-- Agent grid -->
    <main
      class="flex-1 overflow-y-auto p-4"
      aria-label="Agent grid"
    >
      @if (isLoading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          @for (_ of [1, 2, 3, 4, 5, 6]; track $index) {
            <p-skeleton height="120px" borderRadius="8px" />
          }
        </div>
      } @else if (filteredAgents().length === 0) {
        <app-empty-state message="No active agents match your filters" icon="pi pi-robot" />
      } @else {
        <app-agent-grid
          [agents]="filteredAgents()"
          [selectedAgentId]="selectedAgent()?.id ?? null"
          (agentSelected)="onAgentSelected($event)"
        />
      }
    </main>

    <!-- Activity panel -->
    <aside
      class="w-2/5 border-l border-surface-border overflow-hidden flex flex-col bg-surface-0"
      aria-label="Activity panel"
    >
      @if (selectedAgent()) {
        <app-activity-panel [agent]="selectedAgent()!" />
      } @else {
        <div class="flex items-center justify-center h-full">
          <app-empty-state message="Select an agent to view activity" icon="pi pi-list" />
        </div>
      }
    </aside>
  </div>
</div>
```

### File: `src/lib/components/dashboard/dashboard.component.scss`

```scss
.dashboard-shell {
  font-family: var(--font-family, system-ui, sans-serif);
}

.dashboard-header {
  min-height: 48px;
  z-index: 10;
}
```

---

### File: `src/lib/components/agent-grid/agent-grid.component.ts`

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgentCardComponent } from '../agent-card/agent-card.component';
import { Agent } from '../../models/agent.model';

@Component({
  selector: 'app-agent-grid',
  standalone: true,
  imports: [CommonModule, AgentCardComponent],
  templateUrl: './agent-grid.component.html',
  styleUrls: ['./agent-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentGridComponent {
  @Input({ required: true }) agents: Agent[] = [];
  @Input() selectedAgentId: string | null = null;
  @Output() agentSelected = new EventEmitter<string>();

  protected trackByAgentId(_index: number, agent: Agent): string {
    return agent.id;
  }

  protected onCardSelected(agentId: string): void {
    this.agentSelected.emit(agentId);
  }
}
```

### File: `src/lib/components/agent-grid/agent-grid.component.html`

```html
<div
  class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
  role="list"
  aria-label="Active agents"
>
  @for (agent of agents; track trackByAgentId($index, agent)) {
    <app-agent-card
      [agent]="agent"
      [isSelected]="agent.id === selectedAgentId"
      (selected)="onCardSelected($event)"
      role="listitem"
    />
  }
</div>
```

### File: `src/lib/components/agent-grid/agent-grid.component.scss`

```scss
:host { display: block; }
```

---

### File: `src/lib/components/agent-card/agent-card.component.ts`

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { Agent, AgentStatus } from '../../models/agent.model';
import { AgentStatusBadgeComponent } from '../agent-status-badge/agent-status-badge.component';

@Component({
  selector: 'app-agent-card',
  standalone: true,
  imports: [CommonModule, TagModule, BadgeModule, TooltipModule, AgentStatusBadgeComponent],
  templateUrl: './agent-card.component.html',
  styleUrls: ['./agent-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentCardComponent implements OnChanges {
  @Input({ required: true }) agent!: Agent;
  @Input() isSelected = false;
  @Output() selected = new EventEmitter<string>();

  private readonly _agent = signal<Agent | null>(null);

  protected readonly heartbeatAge = computed(() => {
    const a = this._agent();
    if (!a) return null;
    const ms = Date.now() - a.lastHeartbeatAt.getTime();
    const s = Math.floor(ms / 1000);
    if (s < 60)  return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60)  return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  });

  protected readonly isOffline = computed(() => {
    const a = this._agent();
    if (!a || a.status === 'completed') return false;
    return Date.now() - a.lastHeartbeatAt.getTime() > 120_000;
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['agent']) {
      this._agent.set(this.agent);
    }
  }

  protected onCardClick(): void {
    this.selected.emit(this.agent.id);
  }
}
```

### File: `src/lib/components/agent-card/agent-card.component.html`

```html
<div
  class="agent-card cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md"
  [class.selected]="isSelected"
  [class.border-primary]="isSelected"
  [class.border-surface-border]="!isSelected"
  [class.opacity-60]="isOffline()"
  (click)="onCardClick()"
  role="button"
  [attr.aria-pressed]="isSelected"
  [attr.aria-label]="'Agent ' + agent.name"
>
  <!-- Header: name + status -->
  <div class="flex items-start justify-between gap-2 mb-2">
    <div class="flex-1 min-w-0">
      <p class="font-semibold text-sm text-color truncate" [title]="agent.name">
        {{ agent.name }}
      </p>
      <p class="text-xs text-surface-500 truncate" [title]="agent.id">
        {{ agent.id }}
      </p>
    </div>
    <app-agent-status-badge [status]="isOffline() ? 'offline' : agent.status" />
  </div>

  <!-- Current task -->
  @if (agent.currentTask) {
    <p
      class="text-xs text-color-secondary truncate mb-2"
      [title]="agent.currentTask"
      pTooltip="{{ agent.currentTask }}"
      tooltipPosition="bottom"
    >
      {{ agent.currentTask }}
    </p>
  }

  <!-- Footer: repo + heartbeat + questions badge -->
  <div class="flex items-center justify-between mt-2">
    <div class="flex items-center gap-1 text-xs text-surface-400">
      @if (agent.repo) {
        <i class="pi pi-github text-xs"></i>
        <span class="truncate max-w-24" [title]="agent.repo">{{ agent.repo }}</span>
      }
    </div>
    <div class="flex items-center gap-2">
      @if (agent.openQuestionsCount > 0) {
        <span
          class="text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full px-1.5 py-0.5"
          [title]="agent.openQuestionsCount + ' open question(s)'"
        >
          {{ agent.openQuestionsCount }}?
        </span>
      }
      <span class="text-xs text-surface-400" [title]="'Last heartbeat: ' + agent.lastHeartbeatAt.toISOString()">
        {{ heartbeatAge() }}
      </span>
    </div>
  </div>
</div>
```

### File: `src/lib/components/agent-card/agent-card.component.scss`

```scss
.agent-card {
  background: var(--surface-card, #fff);
  &.selected {
    background: var(--primary-50, #eff6ff);
    border-color: var(--primary-500, #3b82f6) !important;
  }
  &:focus-visible {
    outline: 2px solid var(--primary-500, #3b82f6);
    outline-offset: 2px;
  }
}
```

---

### File: `src/lib/components/agent-status-badge/agent-status-badge.component.ts`

```typescript
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { AgentStatus } from '../../models/agent.model';

type Severity = 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' | undefined;

@Component({
  selector: 'app-agent-status-badge',
  standalone: true,
  imports: [CommonModule, TagModule],
  template: `
    <p-tag
      [value]="label"
      [severity]="severity"
      [rounded]="true"
      styleClass="text-xs"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentStatusBadgeComponent {
  @Input({ required: true }) status!: AgentStatus;

  get label(): string {
    return STATUS_LABELS[this.status] ?? this.status;
  }

  get severity(): Severity {
    return STATUS_SEVERITIES[this.status] ?? 'secondary';
  }
}

const STATUS_LABELS: Record<AgentStatus, string> = {
  active:     'Active',
  idle:       'Idle',
  planning:   'Planning',
  executing:  'Executing',
  reviewing:  'Reviewing',
  blocked:    'Blocked',
  completed:  'Done',
  failed:     'Failed',
  cancelled:  'Cancelled',
  offline:    'Offline',
  error:      'Error',
};

const STATUS_SEVERITIES: Record<AgentStatus, Severity> = {
  active:     'success',
  idle:       'secondary',
  planning:   'info',
  executing:  'info',
  reviewing:  'info',
  blocked:    'warning',
  completed:  'success',
  failed:     'danger',
  cancelled:  'secondary',
  offline:    'secondary',
  error:      'danger',
};
```

---

### File: `src/lib/components/activity-panel/activity-panel.component.ts`

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { ActivityFeedComponent } from '../activity-feed/activity-feed.component';
import { GitHubWorkItemComponent } from '../github-work-item/github-work-item.component';
import { AgentStatusBadgeComponent } from '../agent-status-badge/agent-status-badge.component';
import { Agent } from '../../models/agent.model';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-activity-panel',
  standalone: true,
  imports: [
    CommonModule,
    TagModule,
    ActivityFeedComponent,
    GitHubWorkItemComponent,
    AgentStatusBadgeComponent,
  ],
  templateUrl: './activity-panel.component.html',
  styleUrls: ['./activity-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityPanelComponent {
  private readonly dashboardService = inject(DashboardService);

  @Input({ required: true }) agent!: Agent;

  protected readonly selectedGitHubUrl = this.dashboardService.selectedGitHubWorkItem;

  protected onGitHubLinkClicked(url: string): void {
    this.dashboardService.selectGitHubWorkItem(url);
  }
}
```

### File: `src/lib/components/activity-panel/activity-panel.component.html`

```html
<div class="activity-panel flex flex-col h-full">
  <!-- Agent header -->
  <div class="panel-header flex items-center gap-3 px-4 py-3 border-b border-surface-border bg-surface-50">
    <div class="flex-1 min-w-0">
      <p class="font-semibold text-sm text-color truncate">{{ agent.name }}</p>
      @if (agent.currentTask) {
        <p class="text-xs text-surface-500 truncate" [title]="agent.currentTask">
          {{ agent.currentTask }}
        </p>
      }
    </div>
    <app-agent-status-badge [status]="agent.status" />
  </div>

  <!-- Activity feed -->
  <div class="flex-1 overflow-hidden flex flex-col">
    <app-activity-feed (githubLinkClicked)="onGitHubLinkClicked($event)" />
  </div>

  <!-- GitHub work item enrichment panel (slide-in when URL selected) -->
  @if (selectedGitHubUrl()) {
    <div class="border-t border-surface-border max-h-72 overflow-y-auto">
      <app-github-work-item [githubUrl]="selectedGitHubUrl()!.githubUrl" />
    </div>
  }
</div>
```

---

### File: `src/lib/components/activity-feed/activity-feed.component.ts`

```typescript
import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineModule } from 'primeng/timeline';
import { SkeletonModule } from 'primeng/skeleton';
import { ActivityEntryComponent } from '../activity-entry/activity-entry.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [
    CommonModule,
    TimelineModule,
    SkeletonModule,
    ActivityEntryComponent,
    EmptyStateComponent,
  ],
  templateUrl: './activity-feed.component.html',
  styleUrls: ['./activity-feed.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityFeedComponent implements AfterViewChecked {
  private readonly dashboardService = inject(DashboardService);

  @Output() githubLinkClicked = new EventEmitter<string>();
  @ViewChild('feedContainer') feedContainer?: ElementRef<HTMLDivElement>;

  protected readonly activityEntries  = this.dashboardService.activityEntries;
  protected readonly isLoadingEntries = this.dashboardService.isLoadingEntries;

  private lastEntryCount = 0;

  ngAfterViewChecked(): void {
    const count = this.activityEntries().length;
    if (count !== this.lastEntryCount) {
      this.lastEntryCount = count;
      this.scrollToBottom();
    }
  }

  protected onGitHubLinkClicked(url: string): void {
    this.githubLinkClicked.emit(url);
  }

  private scrollToBottom(): void {
    if (this.feedContainer) {
      this.feedContainer.nativeElement.scrollTop =
        this.feedContainer.nativeElement.scrollHeight;
    }
  }
}
```

### File: `src/lib/components/activity-feed/activity-feed.component.html`

```html
<div class="activity-feed-wrapper flex flex-col h-full">
  @if (isLoadingEntries()) {
    <div class="p-4 space-y-3">
      @for (_ of [1, 2, 3]; track $index) {
        <p-skeleton height="60px" borderRadius="6px" />
      }
    </div>
  } @else if (activityEntries().length === 0) {
    <div class="flex-1 flex items-center justify-center">
      <app-empty-state message="No activity yet" icon="pi pi-clock" />
    </div>
  } @else {
    <div
      #feedContainer
      class="flex-1 overflow-y-auto p-4"
      aria-label="Activity feed"
      aria-live="polite"
    >
      <p-timeline [value]="activityEntries()">
        <ng-template pTemplate="content" let-entry>
          <app-activity-entry
            [entry]="entry"
            (githubLinkClicked)="onGitHubLinkClicked($event)"
          />
        </ng-template>
        <ng-template pTemplate="marker" let-entry>
          <span class="entry-marker" [class]="'type-' + entry.type"></span>
        </ng-template>
      </p-timeline>
    </div>
  }
</div>
```

### File: `src/lib/components/activity-feed/activity-feed.component.scss`

```scss
.activity-feed-wrapper { height: 100%; }
.entry-marker {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--primary-400, #60a5fa);
  &.type-error, &.type-blocked   { background: var(--red-400, #f87171); }
  &.type-question                 { background: var(--yellow-400, #facc15); }
  &.type-decision                 { background: var(--purple-400, #a78bfa); }
  &.type-github_action            { background: var(--green-400, #4ade80); }
  &.type-milestone                { background: var(--indigo-400, #818cf8); }
  &.type-status_change            { background: var(--surface-400, #94a3b8); }
}
```

---

### File: `src/lib/components/activity-entry/activity-entry.component.ts`

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import {
  ActivityEntry,
  isLogEntry,
  isDecisionEntry,
  isGitHubActionEntry,
  isQuestionEntry,
  isStatusChangeEntry,
  isMilestoneEntry,
  isErrorEntry,
} from '../../models/activity-entry.model';

@Component({
  selector: 'app-activity-entry',
  standalone: true,
  imports: [CommonModule, TagModule, ButtonModule],
  templateUrl: './activity-entry.component.html',
  styleUrls: ['./activity-entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityEntryComponent {
  @Input({ required: true }) entry!: ActivityEntry;
  @Output() githubLinkClicked = new EventEmitter<string>();

  protected readonly isLogEntry          = isLogEntry;
  protected readonly isDecisionEntry     = isDecisionEntry;
  protected readonly isGitHubActionEntry = isGitHubActionEntry;
  protected readonly isQuestionEntry     = isQuestionEntry;
  protected readonly isStatusChangeEntry = isStatusChangeEntry;
  protected readonly isMilestoneEntry    = isMilestoneEntry;
  protected readonly isErrorEntry        = isErrorEntry;

  protected onGitHubClick(url: string): void {
    this.githubLinkClicked.emit(url);
  }
}
```

### File: `src/lib/components/activity-entry/activity-entry.component.html`

```html
<div class="activity-entry text-sm" [class]="'entry-type-' + entry.type">
  <div class="flex items-start gap-2">
    <!-- Timestamp -->
    <span class="text-xs text-surface-400 whitespace-nowrap mt-0.5">
      {{ entry.timestamp | date:'HH:mm:ss' }}
    </span>

    <div class="flex-1 min-w-0">
      @if (isLogEntry(entry)) {
        <div class="flex items-center gap-1">
          <p-tag
            [value]="entry.level.toUpperCase()"
            [severity]="entry.level === 'error' ? 'danger' : entry.level === 'warn' ? 'warning' : 'info'"
            styleClass="text-xs"
          />
          <span class="text-color break-words">{{ entry.content }}</span>
        </div>
      }

      @if (isDecisionEntry(entry)) {
        <div>
          <div class="flex items-center gap-1 mb-1">
            <span class="text-xs font-medium text-purple-600">Decision</span>
            @if (entry.confidence !== null) {
              <span class="text-xs text-surface-400">
                ({{ (entry.confidence * 100) | number:'1.0-0' }}% confidence)
              </span>
            }
          </div>
          <p class="text-color break-words">{{ entry.content }}</p>
          @if (entry.rationale) {
            <p class="text-xs text-surface-500 mt-1 italic">{{ entry.rationale }}</p>
          }
        </div>
      }

      @if (isQuestionEntry(entry)) {
        <div>
          <div class="flex items-center gap-1 mb-1">
            <span class="text-xs font-medium text-yellow-600">Question</span>
            <p-tag
              [value]="entry.questionStatus"
              [severity]="entry.questionStatus === 'open' ? 'warning' : 'success'"
              styleClass="text-xs"
            />
          </div>
          <p class="text-color break-words font-medium">{{ entry.content }}</p>
          @if (entry.answer) {
            <p class="text-xs text-green-700 mt-1">→ {{ entry.answer }}</p>
          }
        </div>
      }

      @if (isGitHubActionEntry(entry)) {
        <div>
          <div class="flex items-center gap-1 flex-wrap">
            <span class="text-xs font-medium text-green-600">GitHub</span>
            <p-tag [value]="entry.githubType" severity="success" styleClass="text-xs" />
            <span class="text-color break-words">{{ entry.content }}</span>
          </div>
          <button
            pButton
            type="button"
            class="p-button-text p-button-sm mt-1 text-xs text-blue-600 hover:underline p-0"
            (click)="onGitHubClick(entry.githubUrl)"
          >
            <i class="pi pi-external-link mr-1 text-xs"></i>
            {{ entry.githubRepo }}
          </button>
        </div>
      }

      @if (isStatusChangeEntry(entry)) {
        <div class="flex items-center gap-2 text-xs text-surface-500">
          <span>Status:</span>
          <span class="font-medium text-surface-700">{{ entry.oldStatus }}</span>
          <i class="pi pi-arrow-right text-xs"></i>
          <span class="font-medium text-color">{{ entry.newStatus }}</span>
          @if (entry.content) {
            <span class="italic">— {{ entry.content }}</span>
          }
        </div>
      }

      @if (isMilestoneEntry(entry)) {
        <div class="flex items-center gap-2">
          <i class="pi pi-flag text-indigo-500"></i>
          <span class="font-medium text-color">{{ entry.content }}</span>
        </div>
      }

      @if (isErrorEntry(entry)) {
        <div class="flex items-center gap-1">
          <p-tag value="ERROR" severity="danger" styleClass="text-xs" />
          <span class="text-red-700 break-words">{{ entry.content }}</span>
        </div>
      }
    </div>
  </div>
</div>
```

---

### File: `src/lib/components/filter-sidebar/filter-sidebar.component.ts`

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FilterConfig, DEFAULT_FILTER_CONFIG } from '../../models/filter-config.model';
import { AgentStatus } from '../../models/agent.model';
import { Subject, takeUntil, debounceTime } from 'rxjs';

const FILTERABLE_STATUSES: AgentStatus[] = [
  'active', 'idle', 'planning', 'executing', 'reviewing', 'blocked',
];

@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CheckboxModule, InputTextModule, ButtonModule],
  templateUrl: './filter-sidebar.component.html',
  styleUrls: ['./filter-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterSidebarComponent implements OnInit, OnDestroy {
  @Output() filterChanged = new EventEmitter<Partial<FilterConfig>>();

  protected readonly filterableStatuses = FILTERABLE_STATUSES;
  protected form!: FormGroup;

  private readonly destroy$ = new Subject<void>();

  constructor(private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      searchText:  [DEFAULT_FILTER_CONFIG.searchText],
      statuses:    [DEFAULT_FILTER_CONFIG.statuses],
      hideOffline: [DEFAULT_FILTER_CONFIG.hideOffline],
    });

    this.form.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((v) => this.filterChanged.emit(v as Partial<FilterConfig>));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected clearFilters(): void {
    this.form.reset({
      searchText:  DEFAULT_FILTER_CONFIG.searchText,
      statuses:    DEFAULT_FILTER_CONFIG.statuses,
      hideOffline: DEFAULT_FILTER_CONFIG.hideOffline,
    });
  }
}
```

### File: `src/lib/components/filter-sidebar/filter-sidebar.component.html`

```html
<div class="filter-sidebar p-4 space-y-5">
  <div class="flex items-center justify-between">
    <h2 class="text-sm font-semibold text-color">Filters</h2>
    <button
      pButton
      type="button"
      class="p-button-text p-button-sm text-xs"
      (click)="clearFilters()"
    >
      Clear
    </button>
  </div>

  <form [formGroup]="form" class="space-y-4">
    <!-- Search -->
    <div>
      <label class="text-xs font-medium text-surface-600 block mb-1">Search</label>
      <input
        pInputText
        type="text"
        formControlName="searchText"
        placeholder="Name, task, repo…"
        class="w-full text-sm"
        aria-label="Search agents"
      />
    </div>

    <!-- Status filters -->
    <div>
      <p class="text-xs font-medium text-surface-600 mb-2">Status</p>
      <div class="space-y-1">
        @for (status of filterableStatuses; track status) {
          <div class="flex items-center gap-2">
            <p-checkbox
              [formControlName]="'statuses'"
              [value]="status"
              [inputId]="'status-' + status"
            />
            <label [for]="'status-' + status" class="text-sm text-color capitalize cursor-pointer">
              {{ status }}
            </label>
          </div>
        }
      </div>
    </div>

    <!-- Hide offline -->
    <div class="flex items-center gap-2">
      <p-checkbox
        formControlName="hideOffline"
        [binary]="true"
        inputId="hide-offline"
      />
      <label for="hide-offline" class="text-sm text-color cursor-pointer">
        Hide offline
      </label>
    </div>
  </form>
</div>
```

---

### File: `src/lib/components/github-work-item/github-work-item.component.ts`

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ButtonModule } from 'primeng/button';
import { GitHubEnrichmentService } from '../../services/github-enrichment.service';
import { GitHubWorkItem } from '../../models/github-work-item.model';

@Component({
  selector: 'app-github-work-item',
  standalone: true,
  imports: [CommonModule, CardModule, TagModule, SkeletonModule, ButtonModule],
  templateUrl: './github-work-item.component.html',
  styleUrls: ['./github-work-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GitHubWorkItemComponent implements OnChanges {
  private readonly enrichmentService = inject(GitHubEnrichmentService);

  @Input() githubUrl: string | null = null;

  protected readonly workItem  = signal<GitHubWorkItem | null>(null);
  protected readonly isLoading = signal<boolean>(false);
  protected readonly error     = signal<string | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['githubUrl'] && this.githubUrl) {
      void this.loadWorkItem(this.githubUrl);
    }
  }

  private async loadWorkItem(url: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const item = await this.enrichmentService.fetchWorkItem(url);
      this.workItem.set(item);
    } catch {
      this.error.set('Failed to load GitHub details');
    } finally {
      this.isLoading.set(false);
    }
  }
}
```

### File: `src/lib/components/github-work-item/github-work-item.component.html`

```html
<div class="github-work-item p-4">
  @if (isLoading()) {
    <div class="space-y-2">
      <p-skeleton height="16px" width="70%" />
      <p-skeleton height="12px" width="40%" />
      <p-skeleton height="48px" />
    </div>
  } @else if (error()) {
    <div class="text-red-600 text-sm flex items-center gap-2">
      <i class="pi pi-exclamation-circle"></i>
      <span>{{ error() }}</span>
    </div>
  } @else if (workItem()) {
    <div class="space-y-2">
      <!-- Title + state -->
      <div class="flex items-start gap-2">
        <p-tag
          [value]="workItem()!.state ?? 'unknown'"
          [severity]="workItem()!.state === 'open' ? 'success' : workItem()!.state === 'merged' ? 'info' : 'secondary'"
          styleClass="text-xs"
        />
        <p class="text-sm font-semibold text-color leading-tight">
          {{ workItem()!.title }}
        </p>
      </div>

      <!-- Repo + number -->
      <p class="text-xs text-surface-500">
        {{ workItem()!.githubRepo }}
        @if (workItem()!.githubNumber) { #{{ workItem()!.githubNumber }} }
      </p>

      <!-- Labels -->
      @if (workItem()!.labels.length > 0) {
        <div class="flex flex-wrap gap-1">
          @for (label of workItem()!.labels; track label.name) {
            <span
              class="px-1.5 py-0.5 text-xs rounded-full font-medium"
              [style.background]="'#' + label.color + '33'"
              [style.color]="'#' + label.color"
            >
              {{ label.name }}
            </span>
          }
        </div>
      }

      <!-- Open in GitHub link -->
      <a
        [href]="workItem()!.githubUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
      >
        <i class="pi pi-external-link text-xs"></i>
        Open in GitHub
      </a>
    </div>
  }
</div>
```

---

### File: `src/lib/components/empty-state/empty-state.component.ts`

```typescript
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state flex flex-col items-center justify-center gap-2 py-10 text-surface-400">
      @if (icon) {
        <i [class]="icon + ' text-3xl'"></i>
      }
      <p class="text-sm">{{ message }}</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  @Input({ required: true }) message!: string;
  @Input() icon?: string;
}
```

---

## Phase 5 — Public Barrel

### File: `src/index.ts`

```typescript
// Public API for @buildmotion-ai/agent-dashboard

// Token
export { SUPABASE_CLIENT } from './lib/tokens/supabase.token';

// Models
export type { Agent, AgentStatus, AgentType } from './lib/models/agent.model';
export { mapViewRowToAgent } from './lib/models/agent.model';

export type {
  ActivityEntry,
  ActivityEntryType,
  LogEntry,
  DecisionEntry,
  QuestionEntry,
  GitHubActionEntry,
  StatusChangeEntry,
  MilestoneEntry,
  ErrorEntry,
  LogLevel,
  QuestionStatus,
  GitHubActionType,
} from './lib/models/activity-entry.model';
export {
  isLogEntry,
  isDecisionEntry,
  isQuestionEntry,
  isGitHubActionEntry,
  isStatusChangeEntry,
  isMilestoneEntry,
  isErrorEntry,
  mapRowToActivityEntry,
} from './lib/models/activity-entry.model';

export type { AgentSession, SessionStatus, SessionOutcome } from './lib/models/session.model';
export { mapRowToSession } from './lib/models/session.model';

export type {
  GitHubWorkItem,
  GitHubWorkItemType,
  GitHubWorkItemState,
  GitHubLabel,
  GitHubAssignee,
} from './lib/models/github-work-item.model';

export type { FilterConfig } from './lib/models/filter-config.model';
export { DEFAULT_FILTER_CONFIG } from './lib/models/filter-config.model';

// Services
export { DashboardService } from './lib/services/dashboard.service';
export { AgentRealtimeService } from './lib/services/agent-realtime.service';
export type { ConnectionState } from './lib/services/agent-realtime.service';
export { GitHubEnrichmentService } from './lib/services/github-enrichment.service';

// Entry-point component
export { DashboardComponent } from './lib/components/dashboard/dashboard.component';
```
