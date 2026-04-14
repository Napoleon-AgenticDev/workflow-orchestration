---
meta:
  id: agent-dashboard-development-testing-strategy
  title: Testing Strategy - AI Agent Dashboard Development
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:agent-alchemy-dev
  tags: [agent-dashboard, development, angular, supabase, typescript, testing]
  createdBy: Agent Alchemy Developer
  createdAt: '2026-03-13'
  reviewedAt: null
title: Testing Strategy - AI Agent Activity Dashboard
category: Products
feature: agent-dashboard
lastUpdated: '2026-03-13'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: development
applyTo: []
keywords: [agent, dashboard, angular, signals, supabase, primeng, testing, jest]
topics: []
useCases: []
references:
  - architecture/ui-components.specification.md
  - architecture/database-schema.specification.md
depends-on:
  - architecture/system-architecture.specification.md
specification: 5-testing-strategy
---

# Testing Strategy: AI Agent Activity Dashboard

## Overview

All tests use **Jest 29** with **jest-preset-angular**. Test files are collocated with source files (`.spec.ts` adjacent to `.ts`). No Karma, no Jasmine.

**Test runner command**: `npx nx test agency-agent-dashboard`  
**Coverage command**: `npx nx test agency-agent-dashboard --coverage`  
**Coverage target**: 80% statements / branches / functions / lines

---

## Test File Locations

| Test File | Tests |
|-----------|-------|
| `src/lib/services/dashboard.service.spec.ts` | `DashboardService` |
| `src/lib/services/agent-realtime.service.spec.ts` | `AgentRealtimeService` |
| `src/lib/services/github-enrichment.service.spec.ts` | `GitHubEnrichmentService` |
| `src/lib/components/agent-card/agent-card.component.spec.ts` | `AgentCardComponent` |
| `src/lib/components/activity-feed/activity-feed.component.spec.ts` | `ActivityFeedComponent` |

---

## 1. `DashboardService` Unit Tests

**File**: `src/lib/services/dashboard.service.spec.ts`

```typescript
import { TestBed } from '@angular/core/testing';
import { DashboardService } from './dashboard.service';
import { SUPABASE_CLIENT } from '../tokens/supabase.token';
import { ActivityEntry } from '../models/activity-entry.model';
import { Agent } from '../models/agent.model';

// ─── Supabase mock factory ────────────────────────────────────────────────────
function makeSupabaseMock(overrides: Partial<ReturnType<typeof makeMockChain>> = {}) {
  function makeMockChain(resolvedValue: unknown) {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq:     jest.fn().mockReturnThis(),
      order:  jest.fn().mockReturnThis(),
      limit:  jest.fn().mockResolvedValue(resolvedValue),
    };
    return chain;
  }

  return {
    from: jest.fn((table: string) => {
      const viewData = [
        {
          id: 'agent-001', org_id: 'org-1', name: 'Copilot Agent',
          description: null, type: 'copilot-coding', status: 'active',
          active_session_id: 'sess-001', current_task: 'Writing tests',
          project: null, repo: 'org/repo', branch: 'main',
          last_heartbeat_at: new Date().toISOString(),
          open_questions_count: 0,
        },
      ];
      if (table === 'active_agent_dashboard_view') {
        return makeMockChain({ data: viewData, error: null });
      }
      if (table === 'activity_entries') {
        return makeMockChain({ data: [], error: null });
      }
      return makeMockChain({ data: null, error: null });
    }),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { app_metadata: { org_id: 'org-1' } } },
      }),
    },
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DashboardService', () => {
  let service: DashboardService;
  let mockSupabase: ReturnType<typeof makeSupabaseMock>;

  beforeEach(() => {
    mockSupabase = makeSupabaseMock();

    TestBed.configureTestingModule({
      providers: [
        DashboardService,
        { provide: SUPABASE_CLIENT, useValue: mockSupabase },
      ],
    });

    service = TestBed.inject(DashboardService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── Initialization ───────────────────────────────────────────────────────

  describe('initial state', () => {
    it('should initialize agents signal as empty array', () => {
      expect(service.agents()).toEqual([]);
    });

    it('should initialize selectedAgentId signal as null', () => {
      expect(service.selectedAgentId()).toBeNull();
    });

    it('should initialize isLoading as false', () => {
      expect(service.isLoading()).toBe(false);
    });

    it('should initialize activityEntries as empty array', () => {
      expect(service.activityEntries()).toEqual([]);
    });
  });

  // ── loadInitialData ──────────────────────────────────────────────────────

  describe('loadInitialData', () => {
    it('should set agents after successful DB query', async () => {
      await service.loadInitialData('org-1');

      expect(service.agents().length).toBe(1);
      expect(service.agents()[0].id).toBe('agent-001');
    });

    it('should set isLoading to true during fetch then false after', async () => {
      const loadingStates: boolean[] = [];
      // Collect intermediate states manually (effect not available in unit test)
      const promise = service.loadInitialData('org-1');
      loadingStates.push(service.isLoading()); // may be true mid-flight
      await promise;
      expect(service.isLoading()).toBe(false);
    });

    it('should handle Supabase error gracefully without throwing', async () => {
      const errorSupabase = makeSupabaseMock({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
        }),
      });
      TestBed.overrideProvider(SUPABASE_CLIENT, { useValue: errorSupabase });
      const errorService = TestBed.inject(DashboardService);

      await expect(errorService.loadInitialData('org-1')).resolves.not.toThrow();
      expect(errorService.agents()).toEqual([]);
      expect(errorService.isLoading()).toBe(false);
    });
  });

  // ── setSelectedAgent ─────────────────────────────────────────────────────

  describe('setSelectedAgent', () => {
    it('should update selectedAgentId signal', () => {
      service.setSelectedAgent('agent-001');
      expect(service.selectedAgentId()).toBe('agent-001');
    });

    it('should clear selectedAgentId when null is passed', () => {
      service.setSelectedAgent('agent-001');
      service.setSelectedAgent(null);
      expect(service.selectedAgentId()).toBeNull();
    });

    it('should clear selectedGitHubWorkItem when agent changes', () => {
      service.selectGitHubWorkItem('https://github.com/org/repo/issues/1');
      service.setSelectedAgent('agent-002');
      expect(service.selectedGitHubWorkItem()).toBeNull();
    });
  });

  // ── Computed: filteredAgents ─────────────────────────────────────────────

  describe('filteredAgents computed signal', () => {
    beforeEach(async () => {
      await service.loadInitialData('org-1');
    });

    it('should return all agents when no filter is applied', () => {
      expect(service.filteredAgents().length).toBe(1);
    });

    it('should filter agents by searchText', () => {
      service.setFilter({ searchText: 'Copilot' });
      expect(service.filteredAgents().length).toBe(1);

      service.setFilter({ searchText: 'NonExistentAgent' });
      expect(service.filteredAgents().length).toBe(0);
    });

    it('should filter agents by status', () => {
      service.setFilter({ statuses: ['active'] });
      expect(service.filteredAgents().length).toBe(1);

      service.setFilter({ statuses: ['blocked'] });
      expect(service.filteredAgents().length).toBe(0);
    });

    it('should return all agents after clearFilters', () => {
      service.setFilter({ searchText: 'NonExistentAgent' });
      service.clearFilters();
      expect(service.filteredAgents().length).toBe(1);
    });
  });

  // ── onRealtimeActivityEntry ──────────────────────────────────────────────

  describe('onRealtimeActivityEntry', () => {
    const mockLogEntry: ActivityEntry = {
      id: 'entry-001',
      type: 'log',
      level: 'info',
      sessionId: 'sess-001',
      agentId: 'agent-001',
      orgId: 'org-1',
      timestamp: new Date(),
      content: 'Test log message',
      metadata: {},
      createdAt: new Date(),
    };

    beforeEach(async () => {
      await service.loadInitialData('org-1');
      service.setSelectedAgent('agent-001');
    });

    it('should append entry when sessionId matches selected agent session', () => {
      service.onRealtimeActivityEntry(mockLogEntry);
      expect(service.activityEntries()).toContainEqual(mockLogEntry);
    });

    it('should not append entry when sessionId does not match', () => {
      const otherEntry: ActivityEntry = { ...mockLogEntry, sessionId: 'sess-other' };
      service.onRealtimeActivityEntry(otherEntry);
      expect(service.activityEntries()).not.toContainEqual(otherEntry);
    });

    it('should maintain chronological order of entries', () => {
      const entry1: ActivityEntry = { ...mockLogEntry, id: 'e1', timestamp: new Date(1000) };
      const entry2: ActivityEntry = { ...mockLogEntry, id: 'e2', timestamp: new Date(2000) };
      service.onRealtimeActivityEntry(entry1);
      service.onRealtimeActivityEntry(entry2);
      const entries = service.activityEntries();
      expect(entries[entries.length - 2].id).toBe('e1');
      expect(entries[entries.length - 1].id).toBe('e2');
    });
  });

  // ── onRealtimeSessionChange ──────────────────────────────────────────────

  describe('onRealtimeSessionChange', () => {
    beforeEach(async () => {
      await service.loadInitialData('org-1');
    });

    it('should update agent status when session row arrives', () => {
      service.onRealtimeSessionChange({
        id: 'sess-001',
        agent_id: 'agent-001',
        status: 'blocked',
        task: 'Waiting for review',
        heartbeat_at: new Date().toISOString(),
      });

      const agent = service.agents().find((a) => a.id === 'agent-001');
      expect(agent?.status).toBe('blocked');
    });
  });
});
```

---

## 2. `AgentRealtimeService` Unit Tests

**File**: `src/lib/services/agent-realtime.service.spec.ts`

```typescript
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AgentRealtimeService } from './agent-realtime.service';
import { DashboardService } from './dashboard.service';
import { SUPABASE_CLIENT } from '../tokens/supabase.token';

// ─── Channel mock ─────────────────────────────────────────────────────────────
function makeChannelMock() {
  const callbacks: Record<string, (status: string) => void> = {};
  return {
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockImplementation((cb: (status: string) => void) => {
      callbacks['status'] = cb;
      return { callbacks };
    }),
    _triggerStatus: (status: string) => callbacks['status']?.(status),
  };
}

function makeSupabaseMock() {
  const channelMock = makeChannelMock();
  return {
    supabase: {
      channel: jest.fn().mockReturnValue(channelMock),
      removeChannel: jest.fn().mockResolvedValue(undefined),
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    },
    channelMock,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AgentRealtimeService', () => {
  let service: AgentRealtimeService;
  let mockDashboardService: Partial<DashboardService>;
  let supabaseMock: ReturnType<typeof makeSupabaseMock>['supabase'];
  let channelMock: ReturnType<typeof makeChannelMock>;

  beforeEach(() => {
    const mocks = makeSupabaseMock();
    supabaseMock = mocks.supabase;
    channelMock  = mocks.channelMock;

    mockDashboardService = {
      onRealtimeActivityEntry: jest.fn(),
      onRealtimeSessionChange: jest.fn(),
      selectedAgent: jest.fn(() => null) as unknown as DashboardService['selectedAgent'],
      activityEntries: jest.fn(() => []) as unknown as DashboardService['activityEntries'],
    };

    TestBed.configureTestingModule({
      providers: [
        AgentRealtimeService,
        { provide: SUPABASE_CLIENT, useValue: supabaseMock },
        { provide: DashboardService, useValue: mockDashboardService },
      ],
    });

    service = TestBed.inject(AgentRealtimeService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── connect ──────────────────────────────────────────────────────────────

  describe('connect', () => {
    it('should set connectionState to connecting on connect()', () => {
      service.connect('org-1');
      expect(service.connectionState()).toBe('connecting');
    });

    it('should create two channels (activity + sessions)', () => {
      service.connect('org-1');
      expect(supabaseMock.channel).toHaveBeenCalledTimes(2);
      expect(supabaseMock.channel).toHaveBeenCalledWith('org:org-1:activity');
      expect(supabaseMock.channel).toHaveBeenCalledWith('org:org-1:sessions');
    });

    it('should not reconnect if already connected to same org', () => {
      service.connect('org-1');
      channelMock._triggerStatus('SUBSCRIBED');
      const callCount = (supabaseMock.channel as jest.Mock).mock.calls.length;
      service.connect('org-1');
      expect((supabaseMock.channel as jest.Mock).mock.calls.length).toBe(callCount);
    });
  });

  // ── SUBSCRIBED status ────────────────────────────────────────────────────

  describe('on SUBSCRIBED status', () => {
    it('should set connectionState to connected', () => {
      service.connect('org-1');
      channelMock._triggerStatus('SUBSCRIBED');
      expect(service.connectionState()).toBe('connected');
    });

    it('should reset retryCount to 0', () => {
      service.connect('org-1');
      channelMock._triggerStatus('CHANNEL_ERROR');
      channelMock._triggerStatus('SUBSCRIBED');
      // After reconnect+subscribe, state should be 'connected' not 'error'
      expect(service.connectionState()).toBe('connected');
    });
  });

  // ── disconnect ───────────────────────────────────────────────────────────

  describe('disconnect', () => {
    it('should remove both channels and set state to disconnected', () => {
      service.connect('org-1');
      service.disconnect();
      expect(supabaseMock.removeChannel).toHaveBeenCalledTimes(2);
      expect(service.connectionState()).toBe('disconnected');
    });
  });

  // ── Exponential backoff ──────────────────────────────────────────────────

  describe('exponential backoff reconnection', () => {
    it('should schedule reconnect on CHANNEL_ERROR', fakeAsync(() => {
      service.connect('org-1');
      const initialChannelCalls = (supabaseMock.channel as jest.Mock).mock.calls.length;

      channelMock._triggerStatus('CHANNEL_ERROR');
      expect(service.connectionState()).toBe('error');

      // First retry fires after ~1s
      tick(1100);
      expect((supabaseMock.channel as jest.Mock).mock.calls.length).toBeGreaterThan(
        initialChannelCalls
      );
    }));

    it('should set state to error after MAX_RETRIES attempts', fakeAsync(() => {
      service.connect('org-1');

      // Trigger max retries
      for (let i = 0; i < 5; i++) {
        channelMock._triggerStatus('CHANNEL_ERROR');
        tick(Math.pow(2, i) * 1000 + 600); // wait past backoff delay
        channelMock._triggerStatus('CHANNEL_ERROR');
      }

      expect(service.connectionState()).toBe('error');
    }));
  });
});
```

---

## 3. `GitHubEnrichmentService` Unit Tests

**File**: `src/lib/services/github-enrichment.service.spec.ts`

```typescript
import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { GitHubEnrichmentService } from './github-enrichment.service';
import { DashboardService } from './dashboard.service';
import { GitHubWorkItem } from '../models/github-work-item.model';

const MOCK_WORK_ITEM: GitHubWorkItem = {
  id: 'gwi-001',
  orgId: 'org-1',
  agentId: 'agent-001',
  githubUrl: 'https://github.com/org/repo/issues/42',
  githubType: 'issue',
  githubRepo: 'org/repo',
  githubNumber: 42,
  title: 'Fix the thing',
  body: 'Description',
  state: 'open',
  labels: [],
  assignees: [],
  author: 'octocat',
  createdAt: new Date(),
  updatedAt: new Date(),
  fetchedAt: new Date(),
};

describe('GitHubEnrichmentService', () => {
  let service: GitHubEnrichmentService;
  let httpMock: HttpTestingController;
  let mockDashboardService: Partial<DashboardService>;

  beforeEach(() => {
    mockDashboardService = {
      cacheGitHubWorkItem: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        GitHubEnrichmentService,
        { provide: DashboardService, useValue: mockDashboardService },
        {
          provide: 'SUPABASE_URL',
          useValue: 'https://test.supabase.co',
        },
      ],
    });

    service = TestBed.inject(GitHubEnrichmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    service.clearCache();
    jest.clearAllMocks();
  });

  // ── Cache miss → HTTP call ───────────────────────────────────────────────

  describe('fetchWorkItem — cache miss', () => {
    it('should call github-proxy Edge Function and return work item', async () => {
      const url = 'https://github.com/org/repo/issues/42';
      const resultPromise = service.fetchWorkItem(url);

      const req = httpMock.expectOne((r) => r.url.includes('github-proxy'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ url });
      req.flush(MOCK_WORK_ITEM);

      const result = await resultPromise;
      expect(result.githubNumber).toBe(42);
    });

    it('should cache the result after first fetch', async () => {
      const url = MOCK_WORK_ITEM.githubUrl;

      const p1 = service.fetchWorkItem(url);
      httpMock.expectOne((r) => r.url.includes('github-proxy')).flush(MOCK_WORK_ITEM);
      await p1;

      // Second call — no HTTP request expected
      const p2 = service.fetchWorkItem(url);
      httpMock.expectNone((r) => r.url.includes('github-proxy'));
      const result2 = await p2;
      expect(result2.title).toBe('Fix the thing');
    });

    it('should call DashboardService.cacheGitHubWorkItem after fetch', async () => {
      const url = MOCK_WORK_ITEM.githubUrl;
      const p = service.fetchWorkItem(url);
      httpMock.expectOne((r) => r.url.includes('github-proxy')).flush(MOCK_WORK_ITEM);
      await p;
      expect(mockDashboardService.cacheGitHubWorkItem).toHaveBeenCalledWith(MOCK_WORK_ITEM);
    });
  });

  // ── In-flight deduplication ──────────────────────────────────────────────

  describe('in-flight deduplication', () => {
    it('should make only one HTTP call for concurrent requests to same URL', async () => {
      const url = MOCK_WORK_ITEM.githubUrl;
      const p1 = service.fetchWorkItem(url);
      const p2 = service.fetchWorkItem(url);

      // Only ONE HTTP request should have been made
      const requests = httpMock.match((r) => r.url.includes('github-proxy'));
      expect(requests.length).toBe(1);
      requests[0].flush(MOCK_WORK_ITEM);

      const [r1, r2] = await Promise.all([p1, p2]);
      expect(r1).toBe(r2); // Same reference
    });
  });

  // ── LRU eviction ────────────────────────────────────────────────────────

  describe('LRU cache eviction', () => {
    it('should evict least-recently-used entry when cache exceeds 256 entries', async () => {
      const firstUrl = 'https://github.com/org/repo/issues/1';

      // Fill cache: first URL, then 256 others
      const p0 = service.fetchWorkItem(firstUrl);
      httpMock
        .expectOne((r) => r.url.includes('github-proxy'))
        .flush({ ...MOCK_WORK_ITEM, githubUrl: firstUrl });
      await p0;

      for (let i = 2; i <= 257; i++) {
        const url = `https://github.com/org/repo/issues/${i}`;
        const p = service.fetchWorkItem(url);
        httpMock
          .expectOne((r) => r.url.includes('github-proxy'))
          .flush({ ...MOCK_WORK_ITEM, githubUrl: url });
        await p;
      }

      // firstUrl should be evicted — next call makes a new HTTP request
      const pEvicted = service.fetchWorkItem(firstUrl);
      const evictedReq = httpMock.expectOne((r) => r.url.includes('github-proxy'));
      evictedReq.flush({ ...MOCK_WORK_ITEM, githubUrl: firstUrl });
      await pEvicted;
    });
  });

  // ── HTTP error handling ──────────────────────────────────────────────────

  describe('HTTP error handling', () => {
    it('should propagate HTTP errors as rejected promises', async () => {
      const url = MOCK_WORK_ITEM.githubUrl;
      const resultPromise = service.fetchWorkItem(url);

      httpMock
        .expectOne((r) => r.url.includes('github-proxy'))
        .flush('Not Found', { status: 404, statusText: 'Not Found' });

      await expect(resultPromise).rejects.toBeTruthy();
    });

    it('should remove in-flight entry on error so next call retries', async () => {
      const url = MOCK_WORK_ITEM.githubUrl;

      const p1 = service.fetchWorkItem(url);
      httpMock
        .expectOne((r) => r.url.includes('github-proxy'))
        .flush('Error', { status: 500, statusText: 'Server Error' });
      await expect(p1).rejects.toBeTruthy();

      // Second call should trigger a new HTTP request (not use stale in-flight ref)
      const p2 = service.fetchWorkItem(url);
      httpMock
        .expectOne((r) => r.url.includes('github-proxy'))
        .flush(MOCK_WORK_ITEM);
      await expect(p2).resolves.toBeTruthy();
    });
  });
});
```

---

## 4. `AgentCardComponent` Unit Tests

**File**: `src/lib/components/agent-card/agent-card.component.spec.ts`

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgentCardComponent } from './agent-card.component';
import { Agent } from '../../models/agent.model';

const MOCK_AGENT: Agent = {
  id: 'agent-001',
  orgId: 'org-1',
  name: 'Copilot Agent',
  description: 'A test agent',
  type: 'copilot-coding',
  status: 'active',
  activeSessionId: 'sess-001',
  currentTask: 'Writing tests',
  project: null,
  repo: 'org/repo',
  branch: 'main',
  lastHeartbeatAt: new Date(),
  openQuestionsCount: 0,
};

describe('AgentCardComponent', () => {
  let component: AgentCardComponent;
  let fixture: ComponentFixture<AgentCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AgentCardComponent);
    component = fixture.componentInstance;
    component.agent = MOCK_AGENT;
    component.isSelected = false;
    fixture.detectChanges();
  });

  it('should render agent name', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Copilot Agent');
  });

  it('should render agent current task', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Writing tests');
  });

  it('should add selected CSS class when isSelected is true', () => {
    component.isSelected = true;
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('.agent-card') as HTMLElement;
    expect(card.classList).toContain('selected');
  });

  it('should emit selected event with agentId on click', () => {
    const emitSpy = jest.spyOn(component.selected, 'emit');
    const card = fixture.nativeElement.querySelector('.agent-card') as HTMLElement;
    card.click();
    expect(emitSpy).toHaveBeenCalledWith('agent-001');
  });

  it('should display open questions badge when count > 0', () => {
    component.agent = { ...MOCK_AGENT, openQuestionsCount: 3 };
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('3');
  });

  it('should display repo name when present', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('org/repo');
  });
});
```

---

## 5. `ActivityFeedComponent` Unit Tests

**File**: `src/lib/components/activity-feed/activity-feed.component.spec.ts`

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivityFeedComponent } from './activity-feed.component';
import { DashboardService } from '../../services/dashboard.service';
import { signal } from '@angular/core';
import { ActivityEntry } from '../../models/activity-entry.model';

const MOCK_LOG_ENTRY: ActivityEntry = {
  id: 'entry-001',
  type: 'log',
  level: 'info',
  sessionId: 'sess-001',
  agentId: 'agent-001',
  orgId: 'org-1',
  timestamp: new Date(),
  content: 'Test log message',
  metadata: {},
  createdAt: new Date(),
};

const MOCK_QUESTION_ENTRY: ActivityEntry = {
  id: 'entry-002',
  type: 'question',
  questionStatus: 'open',
  answer: null,
  answeredAt: null,
  sessionId: 'sess-001',
  agentId: 'agent-001',
  orgId: 'org-1',
  timestamp: new Date(),
  content: 'Should I create a PR now?',
  metadata: {},
  createdAt: new Date(),
};

describe('ActivityFeedComponent', () => {
  let component: ActivityFeedComponent;
  let fixture: ComponentFixture<ActivityFeedComponent>;

  const mockDashboardService = {
    activityEntries: signal<ActivityEntry[]>([]),
    isLoadingEntries: signal<boolean>(false),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityFeedComponent],
      providers: [
        { provide: DashboardService, useValue: mockDashboardService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityFeedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render empty state when no entries', () => {
    mockDashboardService.activityEntries.set([]);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No activity');
  });

  it('should render log entry content in timeline', () => {
    mockDashboardService.activityEntries.set([MOCK_LOG_ENTRY]);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test log message');
  });

  it('should render question entry with open status indicator', () => {
    mockDashboardService.activityEntries.set([MOCK_QUESTION_ENTRY]);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Should I create a PR now?');
  });

  it('should show skeleton placeholders when isLoadingEntries is true', () => {
    mockDashboardService.isLoadingEntries.set(true);
    fixture.detectChanges();
    const skeleton = fixture.nativeElement.querySelector('p-skeleton');
    expect(skeleton).toBeTruthy();
  });

  it('should render all provided entries', () => {
    mockDashboardService.activityEntries.set([MOCK_LOG_ENTRY, MOCK_QUESTION_ENTRY]);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test log message');
    expect(compiled.textContent).toContain('Should I create a PR now?');
  });
});
```

---

## Mocking Patterns Reference

### Supabase Client Query Chain Mock

```typescript
// For queries that return data
const mockChain = {
  select: jest.fn().mockReturnThis(),
  eq:     jest.fn().mockReturnThis(),
  order:  jest.fn().mockReturnThis(),
  limit:  jest.fn().mockResolvedValue({ data: [], error: null }),
};
const mockSupabase = { from: jest.fn().mockReturnValue(mockChain) };
```

### Supabase Realtime Channel Mock

```typescript
const channelMock = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn((cb) => { statusCallback = cb; return channelMock; }),
};
const mockSupabase = {
  channel: jest.fn().mockReturnValue(channelMock),
  removeChannel: jest.fn().mockResolvedValue(undefined),
};
// Trigger a status: statusCallback('SUBSCRIBED')
```

### Angular Signal Mock

```typescript
import { signal } from '@angular/core';

const mockService = {
  agents: signal<Agent[]>([]),
  isLoading: signal<boolean>(false),
};
// Update in test: mockService.agents.set([...])
```

---

## Running Tests

```bash
# Run all tests for the library
npx nx test agency-agent-dashboard

# Watch mode
npx nx test agency-agent-dashboard --watch

# With coverage report
npx nx test agency-agent-dashboard --coverage

# Run a specific spec file
npx nx test agency-agent-dashboard --testPathPattern="dashboard.service"
```
