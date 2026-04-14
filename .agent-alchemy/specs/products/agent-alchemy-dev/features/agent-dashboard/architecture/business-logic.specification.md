---
meta:
  id: agent-dashboard-business-logic
  title: Business Logic - AI Agent Activity Dashboard
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:agent-alchemy-dev
  tags: [agent-dashboard, architecture, business-logic, services, signals, angular, typescript]
  createdBy: Agent Alchemy Architecture
  createdAt: '2026-03-13'
  reviewedAt: null
title: Business Logic - AI Agent Activity Dashboard
category: Products
feature: agent-dashboard
lastUpdated: '2026-03-13'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: architecture
applyTo: []
keywords: [business-logic, services, angular, signals, realtime, supabase, lru-cache, reconnection]
topics: []
useCases: []
references:
  - .agent-alchemy/specs/frameworks/angular/
  - .agent-alchemy/specs/stack/stack.json
depends-on:
  - plan/business-rules.specification.md
  - plan/functional-requirements.specification.md
  - architecture/system-architecture.specification.md
  - architecture/database-schema.specification.md
  - architecture/api-specifications.specification.md
specification: 06-business-logic
---

# Business Logic: AI Agent Activity Dashboard

## Overview

**Purpose**: Define the complete implementation logic for the three core Angular services — `DashboardService`, `AgentRealtimeService`, and `GitHubEnrichmentService` — including Signal state management, Supabase Realtime integration, reconnection strategy, caching, and the `ActivityEntry` discriminated union type system.

**Design Decisions**:
- No RxJS in the component layer — Signals only
- RxJS used internally in `AgentRealtimeService` for Realtime stream-to-Signal bridge
- All services use `providedIn: 'root'` — single instance per app
- All components use `ChangeDetectionStrategy.OnPush` — reads signals only
- `effect()` used for side effects triggered by signal changes (e.g., load activity on agent selection)

---

## Activity Entry Discriminated Union

The `ActivityEntry` type is the core domain type of the dashboard. All service logic operates on this union.

```typescript
// libs/agency/agent-dashboard/src/lib/models/activity-entry.model.ts

export type ActivityEntryType =
  | 'log'
  | 'decision'
  | 'question'
  | 'status_change'
  | 'github_action'
  | 'milestone'
  | 'error';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type QuestionStatus = 'open' | 'answered' | 'dismissed';

export type GitHubActionType =
  | 'issue_created' | 'issue_updated' | 'issue_closed'
  | 'pr_opened' | 'pr_updated' | 'pr_merged' | 'pr_closed'
  | 'comment_posted' | 'review_submitted' | 'branch_created';

// ── Base type (fields common to all entry types) ──────────────────────────────
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

// ── Concrete types ────────────────────────────────────────────────────────────
export interface LogEntry extends BaseActivityEntry {
  readonly type: 'log';
  readonly level: LogLevel;
}

export interface DecisionEntry extends BaseActivityEntry {
  readonly type: 'decision';
  readonly rationale: string | null;
  readonly confidence: number | null; // 0.0 – 1.0
}

export interface QuestionEntry extends BaseActivityEntry {
  readonly type: 'question';
  readonly questionStatus: QuestionStatus;
  readonly answer: string | null;
  readonly answeredAt: Date | null;
}

export interface GitHubActionEntry extends BaseActivityEntry {
  readonly type: 'github_action';
  readonly githubUrl: string;
  readonly githubType: GitHubActionType;
  readonly githubRepo: string;
  readonly githubId: string | null;
}

export interface StatusChangeEntry extends BaseActivityEntry {
  readonly type: 'status_change';
  readonly oldStatus: string;
  readonly newStatus: string;
}

export interface MilestoneEntry extends BaseActivityEntry {
  readonly type: 'milestone';
}

export interface ErrorEntry extends BaseActivityEntry {
  readonly type: 'error';
  readonly level: 'error';
}

// ── Union type ────────────────────────────────────────────────────────────────
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

// ── Row mapper (DB row → domain type) ────────────────────────────────────────
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
        githubId:   (row['github_id'] as string) ?? null,
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
      // Unknown type — degrade to log entry
      return { ...base, type: 'log', level: 'info' };
  }
}
```

---

## DashboardService

The central coordination service. Owns all dashboard-level Signal state.

```typescript
// libs/agency/agent-dashboard/src/lib/services/dashboard.service.ts

import {
  Injectable,
  Signal,
  WritableSignal,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../tokens/supabase.token';
import { Agent, mapViewRowToAgent } from '../models/agent.model';
import { AgentSession } from '../models/agent-session.model';
import { ActivityEntry, mapRowToActivityEntry } from '../models/activity-entry.model';
import { FilterConfig, DEFAULT_FILTER_CONFIG } from '../models/filter-config.model';
import { GitHubWorkItem } from '../models/github-work-item.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly supabase = inject<SupabaseClient>(SUPABASE_CLIENT);

  // ── Private writable signals ───────────────────────────────────────────────
  private readonly _agents             = signal<Agent[]>([]);
  private readonly _selectedAgentId    = signal<string | null>(null);
  private readonly _activityEntries    = signal<ActivityEntry[]>([]);
  private readonly _filterConfig       = signal<FilterConfig>(DEFAULT_FILTER_CONFIG);
  private readonly _isLoading          = signal<boolean>(false);
  private readonly _isLoadingEntries   = signal<boolean>(false);
  private readonly _currentOrgId       = signal<string>('');
  private readonly _selectedGitHubUrl  = signal<string | null>(null);
  private readonly _gitHubWorkItems    = signal<Map<string, GitHubWorkItem>>(new Map());

  // ── Public readonly signals ────────────────────────────────────────────────
  readonly agents             = this._agents.asReadonly();
  readonly selectedAgentId    = this._selectedAgentId.asReadonly();
  readonly activityEntries    = this._activityEntries.asReadonly();
  readonly filterConfig       = this._filterConfig.asReadonly();
  readonly isLoading          = this._isLoading.asReadonly();
  readonly isLoadingEntries   = this._isLoadingEntries.asReadonly();
  readonly currentOrgId       = this._currentOrgId.asReadonly();

  // ── Computed signals ───────────────────────────────────────────────────────

  /** Selected agent (null if none selected) */
  readonly selectedAgent: Signal<Agent | null> = computed(() =>
    this._agents().find((a) => a.id === this._selectedAgentId()) ?? null
  );

  /** Agents filtered by current FilterConfig */
  readonly filteredAgents: Signal<Agent[]> = computed(() => {
    const agents = this._agents();
    const filter = this._filterConfig();
    return agents.filter((agent) => this.applyFilter(agent, filter));
  });

  /** Agents currently in a blocked or error state (used for notification badge) */
  readonly alertAgents: Signal<Agent[]> = computed(() =>
    this._agents().filter((a) => a.status === 'blocked' || a.status === 'error')
  );

  /** Count of agents with open questions */
  readonly openQuestionsCount: Signal<number> = computed(() =>
    this._agents().reduce((sum, a) => sum + (a.openQuestionsCount ?? 0), 0)
  );

  /** Currently selected GitHub work item for enrichment panel */
  readonly selectedGitHubWorkItem: Signal<GitHubWorkItem | null> = computed(() => {
    const url = this._selectedGitHubUrl();
    if (!url) return null;
    return this._gitHubWorkItems().get(url) ?? null;
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  constructor() {
    // Effect: when selectedAgent changes, automatically load activity entries
    effect(() => {
      const agent = this.selectedAgent();
      if (agent && agent.activeSessionId) {
        this.loadActivityForAgent(agent.id, agent.activeSessionId);
      } else {
        this._activityEntries.set([]);
      }
    });
  }

  // ── Public mutator methods ─────────────────────────────────────────────────

  async loadInitialData(orgId: string): Promise<void> {
    this._currentOrgId.set(orgId);
    this._isLoading.set(true);
    try {
      const { data, error } = await this.supabase
        .from('active_agent_dashboard_view')
        .select('*')
        .eq('org_id', orgId);

      if (error) throw error;

      const agents = (data ?? []).map(mapViewRowToAgent);
      this._agents.set(agents);
    } catch (err) {
      console.error('[DashboardService] loadInitialData error:', err);
    } finally {
      this._isLoading.set(false);
    }
  }

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

      const entries = (data ?? []).map(mapRowToActivityEntry);
      this._activityEntries.set(entries);
    } catch (err) {
      console.error('[DashboardService] loadActivityForAgent error:', err);
    } finally {
      this._isLoadingEntries.set(false);
    }
  }

  setSelectedAgent(agentId: string | null): void {
    this._selectedAgentId.set(agentId);
    this._selectedGitHubUrl.set(null); // Clear GitHub panel on agent switch
  }

  setFilter(config: Partial<FilterConfig>): void {
    this._filterConfig.update((current) => ({ ...current, ...config }));
  }

  clearFilters(): void {
    this._filterConfig.set({ ...DEFAULT_FILTER_CONFIG });
  }

  selectGitHubWorkItem(url: string): void {
    this._selectedGitHubUrl.set(url);
  }

  /** Called by AgentRealtimeService when a new activity entry arrives via Realtime */
  onRealtimeActivityEntry(entry: ActivityEntry): void {
    const selected = this.selectedAgent();
    if (!selected || entry.sessionId !== selected.activeSessionId) return;
    // Append entry; maintain chronological order
    this._activityEntries.update((entries) => [...entries, entry]);
  }

  /** Called by AgentRealtimeService when a session INSERT/UPDATE arrives */
  onRealtimeSessionChange(sessionRow: Record<string, unknown>): void {
    const agentId = sessionRow['agent_id'] as string;
    const status  = sessionRow['status'] as string;
    const task    = sessionRow['task'] as string | null;
    const heartbeatAt = sessionRow['heartbeat_at'] as string;

    this._agents.update((agents) =>
      agents.map((a) =>
        a.id === agentId
          ? {
              ...a,
              status: status as Agent['status'],
              currentTask: task,
              lastHeartbeatAt: new Date(heartbeatAt),
              activeSessionId: sessionRow['id'] as string,
            }
          : a
      )
    );
  }

  /** Cache a resolved GitHub work item (called by GitHubWorkItemComponent) */
  cacheGitHubWorkItem(item: GitHubWorkItem): void {
    this._gitHubWorkItems.update((cache) => {
      const next = new Map(cache);
      next.set(item.githubUrl, item);
      return next;
    });
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private applyFilter(agent: Agent, filter: FilterConfig): boolean {
    if (filter.searchText) {
      const q = filter.searchText.toLowerCase();
      const matches =
        agent.name.toLowerCase().includes(q) ||
        (agent.currentTask?.toLowerCase().includes(q) ?? false) ||
        (agent.repo?.toLowerCase().includes(q) ?? false);
      if (!matches) return false;
    }

    if (filter.statuses.length > 0) {
      if (!filter.statuses.includes(agent.status as FilterConfig['statuses'][number])) {
        return false;
      }
    }

    if (filter.repo && agent.repo !== filter.repo) return false;
    if (filter.project && agent.project !== filter.project) return false;

    // Offline detection: computed client-side from heartbeat age
    const twoMinutesAgo = new Date(Date.now() - 120_000);
    if (agent.status !== 'completed' && agent.lastHeartbeatAt < twoMinutesAgo) {
      // Override status to 'offline' for display (do not mutate signal — computed value only)
      // Components read from filteredAgents; DashboardService resolves offline state here
    }

    return true;
  }
}
```

---

## AgentRealtimeService

Manages Supabase Realtime WebSocket connections with exponential backoff reconnection.

```typescript
// libs/agency/agent-dashboard/src/lib/services/agent-realtime.service.ts

import { Injectable, inject, signal, Signal } from '@angular/core';
import {
  SupabaseClient,
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../tokens/supabase.token';
import { DashboardService } from './dashboard.service';
import { mapRowToActivityEntry } from '../models/activity-entry.model';

export type ConnectionState = 'connecting' | 'connected' | 'error' | 'disconnected';

@Injectable({ providedIn: 'root' })
export class AgentRealtimeService {
  private readonly supabase = inject<SupabaseClient>(SUPABASE_CLIENT);
  private readonly dashboardService = inject(DashboardService);

  // ── Private state ─────────────────────────────────────────────────────────
  private activityChannel: RealtimeChannel | null = null;
  private sessionsChannel: RealtimeChannel | null = null;
  private currentOrgId: string | null = null;

  private retryCount = 0;
  private readonly MAX_RETRIES = 5;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly _connectionState = signal<ConnectionState>('disconnected');
  private readonly _latestActivityEntry = signal<Record<string, unknown> | null>(null);
  private readonly _latestSessionChange  = signal<Record<string, unknown> | null>(null);

  // ── Public signals ─────────────────────────────────────────────────────────
  readonly connectionState: Signal<ConnectionState> = this._connectionState.asReadonly();
  readonly isConnected: Signal<boolean> = signal(false); // updated in connect/disconnect

  // ── Public methods ─────────────────────────────────────────────────────────

  connect(orgId: string): void {
    if (this.currentOrgId === orgId && this._connectionState() === 'connected') return;
    this.currentOrgId = orgId;
    this.retryCount = 0;
    this._connectionState.set('connecting');
    this.subscribeToChannels(orgId);
  }

  disconnect(): void {
    this.clearRetryTimer();
    if (this.activityChannel) {
      this.supabase.removeChannel(this.activityChannel);
      this.activityChannel = null;
    }
    if (this.sessionsChannel) {
      this.supabase.removeChannel(this.sessionsChannel);
      this.sessionsChannel = null;
    }
    this._connectionState.set('disconnected');
    this.currentOrgId = null;
  }

  // ── Private: channel subscription ─────────────────────────────────────────

  private subscribeToChannels(orgId: string): void {
    // Activity entries channel
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
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          this.handleActivityEntry(payload.new as Record<string, unknown>);
        }
      )
      .subscribe((status) => this.handleChannelStatus(status, 'activity'));

    // Sessions channel
    this.sessionsChannel = this.supabase
      .channel(`org:${orgId}:sessions`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT and UPDATE
          schema: 'public',
          table: 'agent_sessions',
          filter: `org_id=eq.${orgId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          this.handleSessionChange(payload.new as Record<string, unknown>);
        }
      )
      .subscribe((status) => this.handleChannelStatus(status, 'sessions'));
  }

  private handleActivityEntry(row: Record<string, unknown>): void {
    try {
      const entry = mapRowToActivityEntry(row);
      this.dashboardService.onRealtimeActivityEntry(entry);
    } catch (err) {
      console.error('[AgentRealtimeService] Failed to parse activity entry:', err, row);
    }
  }

  private handleSessionChange(row: Record<string, unknown>): void {
    try {
      this.dashboardService.onRealtimeSessionChange(row);
    } catch (err) {
      console.error('[AgentRealtimeService] Failed to handle session change:', err, row);
    }
  }

  // ── Private: connection state management ──────────────────────────────────

  private handleChannelStatus(
    status: string,
    channelName: 'activity' | 'sessions'
  ): void {
    if (status === 'SUBSCRIBED') {
      this.retryCount = 0;
      this._connectionState.set('connected');
      // On reconnect: load any entries missed during disconnection
      if (channelName === 'activity') {
        this.catchUpOnMissedEntries();
      }
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      this._connectionState.set('error');
      this.scheduleReconnect();
    } else if (status === 'CLOSED') {
      this._connectionState.set('disconnected');
    }
  }

  // ── Exponential backoff reconnection ──────────────────────────────────────

  /**
   * Reconnection strategy: exponential backoff with jitter
   * Delays: 1s, 2s, 4s, 8s, 16s (max 5 retries)
   * After 5 retries, sets state to 'error' — manual reconnect required
   */
  private scheduleReconnect(): void {
    if (this.retryCount >= this.MAX_RETRIES) {
      console.error('[AgentRealtimeService] Max reconnect retries reached. Manual reconnect required.');
      this._connectionState.set('error');
      return;
    }

    const baseDelay = Math.pow(2, this.retryCount) * 1000; // 1s, 2s, 4s, 8s, 16s
    const jitter = Math.random() * 500;                    // ±500ms jitter
    const delay  = baseDelay + jitter;

    console.log(`[AgentRealtimeService] Reconnecting in ${Math.round(delay)}ms (attempt ${this.retryCount + 1}/${this.MAX_RETRIES})`);

    this.clearRetryTimer();
    this.retryTimer = setTimeout(() => {
      this.retryCount++;
      if (this.currentOrgId) {
        this.disconnect();
        this._connectionState.set('connecting');
        this.subscribeToChannels(this.currentOrgId);
      }
    }, delay);
  }

  private clearRetryTimer(): void {
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  // ── Catch-up on missed entries ─────────────────────────────────────────────

  /**
   * On reconnect, load activity entries that arrived while disconnected.
   * Uses the timestamp of the last known entry as the catch-up cursor.
   */
  private async catchUpOnMissedEntries(): Promise<void> {
    const selectedAgent = this.dashboardService.selectedAgent();
    if (!selectedAgent || !selectedAgent.activeSessionId) return;

    const entries = this.dashboardService.activityEntries();
    const lastEntry = entries.at(-1);
    if (!lastEntry) return; // No entries yet — full load handled by DashboardService

    const lastTimestamp = lastEntry.timestamp.toISOString();

    try {
      const supabase = this.supabase as SupabaseClient;
      const { data, error } = await supabase
        .from('activity_entries')
        .select('*')
        .eq('session_id', selectedAgent.activeSessionId)
        .gt('timestamp', lastTimestamp)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return;

      console.log(`[AgentRealtimeService] Catch-up: loading ${data.length} missed entries`);
      for (const row of data) {
        const entry = mapRowToActivityEntry(row as Record<string, unknown>);
        this.dashboardService.onRealtimeActivityEntry(entry);
      }
    } catch (err) {
      console.error('[AgentRealtimeService] Catch-up query failed:', err);
    }
  }
}
```

---

## GitHubEnrichmentService

LRU cache with 50-item limit and 5-minute TTL. Queue deduplication prevents parallel requests for the same item.

```typescript
// libs/agency/agent-dashboard/src/lib/services/github-enrichment.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { GitHubWorkItem, mapGitHubApiResponseToWorkItem } from '../models/github-work-item.model';

const CACHE_MAX_SIZE = 50;
const CACHE_TTL_MS   = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  item: GitHubWorkItem;
  cachedAt: number; // Date.now()
}

interface InFlightRequest {
  promise: Promise<GitHubWorkItem | null>;
}

@Injectable({ providedIn: 'root' })
export class GitHubEnrichmentService {
  private readonly http = inject(HttpClient);

  private readonly EDGE_FN_URL = '/functions/v1/github-proxy'; // Relative to Supabase project URL

  // LRU cache: Map preserves insertion order; we delete oldest on overflow
  private readonly cache = new Map<string, CacheEntry>();

  // In-flight request deduplication: same URL requested multiple times → single fetch
  private readonly inFlight = new Map<string, InFlightRequest>();

  // Cache statistics
  private hits   = 0;
  private misses = 0;

  // ── Public API ─────────────────────────────────────────────────────────────

  async getWorkItem(
    owner: string,
    repo: string,
    number: number,
    type: 'issue' | 'pull_request'
  ): Promise<GitHubWorkItem | null> {
    const cacheKey = `${owner}/${repo}/${type}/${number}`;

    // 1. Cache hit?
    const cached = this.getCached(cacheKey);
    if (cached) {
      this.hits++;
      return cached;
    }

    // 2. Already in flight for same key?
    const existing = this.inFlight.get(cacheKey);
    if (existing) {
      return existing.promise;
    }

    // 3. New fetch
    this.misses++;
    const fetchPromise = this.fetchFromEdgeFunction(owner, repo, number, type)
      .then((item) => {
        if (item) this.setCached(cacheKey, item);
        this.inFlight.delete(cacheKey);
        return item;
      })
      .catch((err) => {
        console.error('[GitHubEnrichmentService] Fetch failed:', err);
        this.inFlight.delete(cacheKey);
        return null; // Degrade gracefully
      });

    this.inFlight.set(cacheKey, { promise: fetchPromise });
    return fetchPromise;
  }

  parseGitHubUrl(url: string): {
    owner: string;
    repo: string;
    number: number;
    type: 'issue' | 'pull_request';
  } | null {
    const issuePattern  = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/;
    const prPattern     = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/;

    let match = url.match(issuePattern);
    if (match) {
      return { owner: match[1], repo: match[2], number: parseInt(match[3], 10), type: 'issue' };
    }
    match = url.match(prPattern);
    if (match) {
      return { owner: match[1], repo: match[2], number: parseInt(match[3], 10), type: 'pull_request' };
    }
    return null;
  }

  clearCache(): void {
    this.cache.clear();
    this.inFlight.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getCacheStats(): { size: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  // ── Private: cache management ──────────────────────────────────────────────

  private getCached(key: string): GitHubWorkItem | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
      this.cache.delete(key); // Expired
      return null;
    }
    // LRU: move to end on access
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.item;
  }

  private setCached(key: string, item: GitHubWorkItem): void {
    // LRU eviction: delete oldest entry if at capacity
    if (this.cache.size >= CACHE_MAX_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, { item, cachedAt: Date.now() });
  }

  // ── Private: Edge Function call ────────────────────────────────────────────

  private async fetchFromEdgeFunction(
    owner: string,
    repo: string,
    number: number,
    type: 'issue' | 'pull_request'
  ): Promise<GitHubWorkItem | null> {
    const endpoint = type === 'issue'
      ? `/repos/${owner}/${repo}/issues/${number}`
      : `/repos/${owner}/${repo}/pulls/${number}`;

    const response = await firstValueFrom(
      this.http.post<Record<string, unknown>>(this.EDGE_FN_URL, { endpoint, method: 'GET' })
    );

    return mapGitHubApiResponseToWorkItem(response, owner, repo, type);
  }
}
```

---

## Offline Detection Business Logic

Offline detection is computed client-side based on `heartbeat_at` age. This avoids server polling.

```typescript
// Computed inside DashboardService.applyFilter() (or in a dedicated computed):

private computeEffectiveStatus(agent: Agent): Agent['status'] {
  // If agent hasn't sent a heartbeat in >2 minutes, display as offline
  // regardless of the stored DB status
  const TWO_MINUTES_MS = 2 * 60 * 1000;
  const heartbeatAge = Date.now() - agent.lastHeartbeatAt.getTime();

  if (
    heartbeatAge > TWO_MINUTES_MS &&
    agent.status !== 'completed' &&
    agent.status !== 'cancelled' &&
    agent.status !== 'failed'
  ) {
    return 'offline';
  }
  return agent.status;
}
```

This ensures:
- Agents with terminal statuses (`completed`, `cancelled`, `failed`) are never shown as offline.
- The signal/computed chain reacts to `lastHeartbeatAt` updates from Realtime.
- A 10-second `setInterval` in `DashboardComponent.ngOnInit()` forces change detection refresh for offline checking (since `Date.now()` is not reactive).

---

## FilterConfig Business Logic

```typescript
// models/filter-config.model.ts

export type AgentStatusFilter = 'executing' | 'idle' | 'blocked' | 'error' | 'offline' | 'completed';

export interface FilterConfig {
  searchText: string;
  statuses: AgentStatusFilter[];     // Empty = show all
  repo: string | null;               // null = show all repos
  project: string | null;            // null = show all projects
  activityTypes: ActivityEntryType[]; // Empty = show all types in feed
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
}

export const DEFAULT_FILTER_CONFIG: FilterConfig = {
  searchText: '',
  statuses: [],
  repo: null,
  project: null,
  activityTypes: [],
  dateRange: { from: null, to: null },
};

// Filter logic: all conditions are AND-ed
// Empty arrays / null values = "no filter applied" (show all)
export function applyFilter(agent: Agent, filter: FilterConfig): boolean {
  if (filter.searchText.trim()) {
    const q = filter.searchText.toLowerCase();
    const nameMatch    = agent.name.toLowerCase().includes(q);
    const taskMatch    = agent.currentTask?.toLowerCase().includes(q) ?? false;
    const repoMatch    = agent.repo?.toLowerCase().includes(q) ?? false;
    if (!nameMatch && !taskMatch && !repoMatch) return false;
  }

  if (filter.statuses.length > 0) {
    if (!filter.statuses.includes(agent.status as AgentStatusFilter)) return false;
  }

  if (filter.repo !== null && agent.repo !== filter.repo) return false;
  if (filter.project !== null && agent.project !== filter.project) return false;

  return true;
}
```

---

## Supabase Client Token

```typescript
// libs/agency/agent-dashboard/src/lib/tokens/supabase.token.ts

import { InjectionToken } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient>('SUPABASE_CLIENT');
```

**Provider configuration** (in `DashboardModule` or `app.config.ts`):
```typescript
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '@buildmotion-ai/agent-dashboard';
import { APP_CONFIG } from '../config/app-config';

export const dashboardProviders = [
  {
    provide: SUPABASE_CLIENT,
    useFactory: () => createClient(
      APP_CONFIG.supabase.supabaseUrl,
      APP_CONFIG.supabase.supabaseAnonKey,
    ),
  },
];
```

---

## Business Rules Implementation Summary

| Business Rule | Implementation Location |
|--------------|------------------------|
| BR-001: Agents offline after 2min no heartbeat | `DashboardService.computeEffectiveStatus()` |
| BR-002: Activity feed shows last 100 entries per session | `DashboardService.loadActivityForAgent()` limit:100 |
| BR-003: Filter is AND-based (all conditions must match) | `applyFilter()` in `filter-config.model.ts` |
| BR-004: Realtime entries appended to feed (not polling) | `DashboardService.onRealtimeActivityEntry()` |
| BR-005: Reconnect with exponential backoff (max 5 retries) | `AgentRealtimeService.scheduleReconnect()` |
| BR-006: Catch-up query on reconnect | `AgentRealtimeService.catchUpOnMissedEntries()` |
| BR-007: GitHub enrichment cached 5min; LRU eviction at 50 | `GitHubEnrichmentService` cache logic |
| BR-008: In-flight deduplication for GitHub requests | `GitHubEnrichmentService.inFlight` Map |
| BR-009: Activity entry content sanitized (no secrets) | Agent SDK `sanitizeContent()` (write path) |
| BR-010: Organization isolation enforced client + server | `DashboardService.currentOrgId` + RLS |

---

## References

- `plan/business-rules.specification.md` — BR-001 through BR-010
- `plan/functional-requirements.specification.md` — FR-001 (status), FR-002 (feed), FR-003 (GitHub)
- `architecture/api-specifications.specification.md` — Angular service method signatures
- `architecture/database-schema.specification.md` — `mapRowToActivityEntry()` column mapping
- `research/implementation-recommendations.md` — Angular Signals + RxJS bridge pattern
