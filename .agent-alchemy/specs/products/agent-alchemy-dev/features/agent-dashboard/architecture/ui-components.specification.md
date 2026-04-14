---
meta:
  id: agent-dashboard-ui-components
  title: UI Components Architecture - AI Agent Activity Dashboard
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:agent-alchemy-dev
  tags: [agent-dashboard, architecture, angular, components, signals, primeng, ui]
  createdBy: Agent Alchemy Architecture
  createdAt: '2026-03-13'
  reviewedAt: null
title: UI Components Architecture - AI Agent Activity Dashboard
category: Products
feature: agent-dashboard
lastUpdated: '2026-03-13'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: architecture
applyTo: []
keywords: [agent, dashboard, angular, signals, components, primeng, onpush, realtime]
topics: []
useCases: []
references:
  - .agent-alchemy/specs/frameworks/angular/
  - .agent-alchemy/specs/stack/stack.json
depends-on:
  - plan/functional-requirements.specification.md
  - plan/ui-ux-workflows.specification.md
  - architecture/system-architecture.specification.md
specification: 02-ui-components
---

# UI Components Architecture: AI Agent Activity Dashboard

## Overview

**Purpose**: Define the Angular component tree, Signal-based state management patterns, PrimeNG component usage, and routing configuration for the AI Agent Activity Dashboard.

**Design Principles**:
- All components use `ChangeDetectionStrategy.OnPush`
- All reactive state uses Angular Signals (no RxJS in component layer)
- Components are standalone (Angular 18 standalone API)
- Container/Presentation separation: smart components own services; presentational components receive signals/inputs
- PrimeNG 18 for UI primitives (Timeline, DataView, Tag, Badge, Card, VirtualScroll)
- TailwindCSS 3.4 for layout and utility styling

---

## Feature Library Structure

The dashboard feature lives in a dedicated Nx library:

```
libs/agency/agent-dashboard/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.component.ts
│   │   │   │   ├── dashboard.component.html
│   │   │   │   └── dashboard.component.scss
│   │   │   ├── agent-grid/
│   │   │   │   ├── agent-grid.component.ts
│   │   │   │   ├── agent-grid.component.html
│   │   │   │   └── agent-grid.component.scss
│   │   │   ├── agent-card/
│   │   │   │   ├── agent-card.component.ts
│   │   │   │   ├── agent-card.component.html
│   │   │   │   └── agent-card.component.scss
│   │   │   ├── activity-panel/
│   │   │   │   ├── activity-panel.component.ts
│   │   │   │   ├── activity-panel.component.html
│   │   │   │   └── activity-panel.component.scss
│   │   │   ├── activity-feed/
│   │   │   │   ├── activity-feed.component.ts
│   │   │   │   ├── activity-feed.component.html
│   │   │   │   └── activity-feed.component.scss
│   │   │   ├── activity-entry/
│   │   │   │   ├── activity-entry.component.ts
│   │   │   │   ├── activity-entry.component.html
│   │   │   │   └── activity-entry.component.scss
│   │   │   ├── github-work-item/
│   │   │   │   ├── github-work-item.component.ts
│   │   │   │   ├── github-work-item.component.html
│   │   │   │   └── github-work-item.component.scss
│   │   │   ├── filter-sidebar/
│   │   │   │   ├── filter-sidebar.component.ts
│   │   │   │   ├── filter-sidebar.component.html
│   │   │   │   └── filter-sidebar.component.scss
│   │   │   ├── agent-status-badge/
│   │   │   │   ├── agent-status-badge.component.ts
│   │   │   │   └── agent-status-badge.component.html
│   │   │   └── empty-state/
│   │   │       ├── empty-state.component.ts
│   │   │       └── empty-state.component.html
│   │   ├── services/
│   │   │   ├── dashboard.service.ts
│   │   │   ├── agent-realtime.service.ts
│   │   │   └── github-enrichment.service.ts
│   │   ├── models/
│   │   │   ├── agent.model.ts
│   │   │   ├── activity-entry.model.ts
│   │   │   ├── github-work-item.model.ts
│   │   │   └── filter-config.model.ts
│   │   └── index.ts
│   └── index.ts
├── project.json
└── tsconfig.json
```

---

## Angular Routing Configuration

**Target location**: `apps/agent-alchemy-dev/src/app/app.routes.ts` (document only; do not modify)

```typescript
// app.routes.ts — target configuration (documentation only)
import { Routes } from '@angular/router';
import { AuthGuard } from '@buildmotion/auth'; // existing auth guard

export const appRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('@buildmotion-ai/agent-dashboard').then(
        (m) => m.DashboardComponent
      ),
    canActivate: [AuthGuard],
    title: 'Agent Activity Dashboard',
  },
  // ... other existing routes
];
```

**Notes**:
- Route is lazy-loaded via `loadComponent` (standalone component API).
- `AuthGuard` is the existing auth guard in the application — the dashboard requires authentication.
- The `DashboardComponent` is the single entry point exported from the `@buildmotion-ai/agent-dashboard` library.

---

## Signal-Based State Management Pattern

All state is managed through Angular Signals. The pattern avoids RxJS in the component layer:

```typescript
// Pattern: Signal-first reactive state (no RxJS subscriptions in components)

// 1. Service exposes writable signals (internal) + readonly computed signals (public API)
@Injectable({ providedIn: 'root' })
export class DashboardService {
  // Private writable signals (state owned by service)
  private readonly _agents = signal<Agent[]>([]);
  private readonly _selectedAgentId = signal<string | null>(null);
  private readonly _filterConfig = signal<FilterConfig>(DEFAULT_FILTER_CONFIG);

  // Public readonly computed signals (component API)
  readonly agents = this._agents.asReadonly();
  readonly selectedAgentId = this._selectedAgentId.asReadonly();
  readonly filterConfig = this._filterConfig.asReadonly();

  // Derived computed signals
  readonly filteredAgents = computed(() => applyFilter(this._agents(), this._filterConfig()));
  readonly selectedAgent = computed(() =>
    this._agents().find((a) => a.id === this._selectedAgentId()) ?? null
  );

  // Mutator methods
  setSelectedAgent(id: string | null): void { this._selectedAgentId.set(id); }
  setFilter(config: Partial<FilterConfig>): void {
    this._filterConfig.update((c) => ({ ...c, ...config }));
  }
}

// 2. Components read signals directly (no subscribe, no async pipe)
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (agent of filteredAgents(); track agent.id) {
      <app-agent-card [agent]="agent" [isSelected]="agent.id === selectedAgentId()" />
    }
  `,
})
export class AgentGridComponent {
  protected readonly filteredAgents = this.dashboardService.filteredAgents;
  protected readonly selectedAgentId = this.dashboardService.selectedAgentId;
  constructor(private readonly dashboardService: DashboardService) {}
}
```

---

## Component Specifications

---

### 1. DashboardComponent

**Role**: Lazy-loaded shell component. Owns the two-panel layout. Bootstraps dashboard services on init.

```typescript
// dashboard.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
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
  private readonly realtimeService = inject(AgentRealtimeService);

  // Expose service signals to template
  protected readonly filteredAgents = this.dashboardService.filteredAgents;
  protected readonly selectedAgent = this.dashboardService.selectedAgent;
  protected readonly connectionState = this.realtimeService.connectionState;
  protected readonly isLoading = this.dashboardService.isLoading;

  ngOnInit(): void {
    const orgId = this.dashboardService.currentOrgId();
    this.dashboardService.loadInitialData(orgId);
    this.realtimeService.connect(orgId);
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
}
```

**Template Structure**:
```html
<!-- dashboard.component.html -->
<div class="dashboard-shell h-screen flex flex-col">
  <!-- Top bar: connection indicator + org info -->
  <header class="dashboard-header flex items-center justify-between px-4 py-2 border-b">
    <h1 class="text-lg font-semibold">Agent Activity Dashboard</h1>
    <div class="connection-indicator" [class]="'state-' + connectionState()">
      {{ connectionState() === 'connected' ? '● Live' : '○ Reconnecting...' }}
    </div>
  </header>

  <!-- Main body: sidebar + two panels -->
  <div class="dashboard-body flex flex-1 overflow-hidden">
    <!-- Left sidebar: filters -->
    <aside class="w-56 border-r overflow-y-auto">
      <app-filter-sidebar (filterChanged)="onFilterChanged($event)" />
    </aside>

    <!-- Centre-left: agent grid -->
    <main class="flex-1 overflow-y-auto p-4" aria-label="Agent grid">
      @if (isLoading()) {
        <p-skeleton count="6" />
      } @else if (filteredAgents().length === 0) {
        <app-empty-state message="No active agents" />
      } @else {
        <app-agent-grid
          [agents]="filteredAgents()"
          [selectedAgentId]="selectedAgent()?.id ?? null"
          (agentSelected)="onAgentSelected($event)"
        />
      }
    </main>

    <!-- Right panel: activity feed -->
    <aside class="w-2/5 border-l overflow-hidden flex flex-col" aria-label="Activity panel">
      @if (selectedAgent()) {
        <app-activity-panel [agent]="selectedAgent()!" />
      } @else {
        <app-empty-state message="Select an agent to view activity" />
      }
    </aside>
  </div>
</div>
```

**PrimeNG Components Used**: `p-skeleton`, `p-card` (via sub-components)

---

### 2. AgentGridComponent

**Role**: Renders the responsive grid of `AgentCardComponent` instances. Receives agents and filter config as signal-derived inputs.

```typescript
// agent-grid.component.ts
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

**Template Structure**:
```html
<!-- agent-grid.component.html -->
<div
  class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4"
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

---

### 3. AgentCardComponent

**Role**: Displays a single agent's current status, identity, and metadata. Pure presentational component.

```typescript
// agent-card.component.ts
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
import { AvatarModule } from 'primeng/avatar';
import { AgentStatusBadgeComponent } from '../agent-status-badge/agent-status-badge.component';
import { Agent, AgentStatus } from '../../models/agent.model';

@Component({
  selector: 'app-agent-card',
  standalone: true,
  imports: [
    CommonModule,
    TagModule,
    BadgeModule,
    AvatarModule,
    AgentStatusBadgeComponent,
  ],
  templateUrl: './agent-card.component.html',
  styleUrls: ['./agent-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentCardComponent {
  @Input({ required: true }) agent!: Agent;
  @Input() isSelected = false;

  @Output() selected = new EventEmitter<string>();

  protected get cardClasses(): string {
    return [
      'agent-card cursor-pointer rounded-lg border p-4 transition-all',
      this.isSelected ? 'border-primary-500 bg-primary-50 shadow-md' : 'border-gray-200 hover:border-gray-400',
      this.agent.status === 'offline' ? 'opacity-60' : 'opacity-100',
    ].join(' ');
  }

  protected get openQuestionsCount(): number {
    return this.agent.openQuestionsCount ?? 0;
  }

  protected onCardClick(): void {
    this.selected.emit(this.agent.id);
  }
}
```

**Template Structure**:
```html
<!-- agent-card.component.html -->
<div
  [class]="cardClasses"
  (click)="onCardClick()"
  (keydown.enter)="onCardClick()"
  [attr.aria-selected]="isSelected"
  [attr.aria-label]="'Agent ' + agent.name + ', status: ' + agent.status"
  tabindex="0"
  role="option"
>
  <!-- Header row: avatar + name + status badge -->
  <div class="flex items-center gap-3 mb-3">
    <p-avatar
      [label]="agent.name.charAt(0).toUpperCase()"
      shape="circle"
      size="normal"
      [style]="{ 'background-color': agent.avatarColor }"
    />
    <div class="flex-1 min-w-0">
      <div class="font-medium text-sm truncate">{{ agent.name }}</div>
      <div class="text-xs text-gray-500 truncate">{{ agent.type }}</div>
    </div>
    <app-agent-status-badge [status]="agent.status" />
  </div>

  <!-- Current task (if active) -->
  @if (agent.currentTask) {
    <p class="text-xs text-gray-600 truncate mb-2" title="{{ agent.currentTask }}">
      {{ agent.currentTask }}
    </p>
  }

  <!-- Metadata row: repo + last active -->
  <div class="flex items-center justify-between text-xs text-gray-400 mt-2">
    @if (agent.repo) {
      <span class="truncate max-w-[60%]">{{ agent.repo }}</span>
    }
    <span>{{ agent.lastHeartbeatAt | date:'shortTime' }}</span>
  </div>

  <!-- Open questions badge -->
  @if (openQuestionsCount > 0) {
    <p-badge
      [value]="openQuestionsCount.toString()"
      severity="warning"
      class="absolute top-2 right-2"
      [attr.aria-label]="openQuestionsCount + ' open questions'"
    />
  }
</div>
```

**State**: Purely input-driven; no internal signals.

---

### 4. ActivityPanelComponent

**Role**: Right-panel container for the selected agent's activity. Loads activity entries for the selected agent and renders feed + GitHub work items.

```typescript
// activity-panel.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityFeedComponent } from '../activity-feed/activity-feed.component';
import { GitHubWorkItemComponent } from '../github-work-item/github-work-item.component';
import { DashboardService } from '../../services/dashboard.service';
import { Agent } from '../../models/agent.model';
import { ActivityEntry } from '../../models/activity-entry.model';

@Component({
  selector: 'app-activity-panel',
  standalone: true,
  imports: [CommonModule, ActivityFeedComponent, GitHubWorkItemComponent],
  templateUrl: './activity-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityPanelComponent implements OnChanges {
  @Input({ required: true }) agent!: Agent;

  private readonly dashboardService = inject(DashboardService);

  protected readonly activityEntries = this.dashboardService.activityEntries;
  protected readonly isLoadingEntries = this.dashboardService.isLoadingEntries;
  protected readonly selectedGitHubWorkItem = this.dashboardService.selectedGitHubWorkItem;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['agent'] && this.agent) {
      this.dashboardService.loadActivityForAgent(this.agent.id, this.agent.activeSessionId);
    }
  }

  protected onWorkItemSelected(url: string): void {
    this.dashboardService.selectGitHubWorkItem(url);
  }
}
```

**Template Structure**:
```html
<!-- activity-panel.component.html -->
<div class="activity-panel flex flex-col h-full">
  <!-- Panel header: agent name + session info -->
  <div class="panel-header border-b px-4 py-3 shrink-0">
    <h2 class="font-semibold text-sm">{{ agent.name }}</h2>
    <p class="text-xs text-gray-500">{{ agent.currentTask ?? 'No active task' }}</p>
  </div>

  <!-- Split: activity feed (top 60%) + GitHub panel (bottom 40%) -->
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Activity feed -->
    <div class="flex-[3] overflow-hidden">
      @if (isLoadingEntries()) {
        <div class="p-4"><p-skeleton count="5" /></div>
      } @else {
        <app-activity-feed
          [entries]="activityEntries()"
          (workItemSelected)="onWorkItemSelected($event)"
        />
      }
    </div>

    <!-- GitHub work item panel (conditional) -->
    @if (selectedGitHubWorkItem()) {
      <div class="flex-[2] border-t overflow-y-auto">
        <app-github-work-item [workItem]="selectedGitHubWorkItem()!" />
      </div>
    }
  </div>
</div>
```

---

### 5. ActivityFeedComponent

**Role**: Scrollable, real-time activity timeline using PrimeNG Timeline. Renders an `ActivityEntryComponent` for each entry.

```typescript
// activity-feed.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ElementRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineModule } from 'primeng/timeline';
import { ScrollerModule } from 'primeng/scroller';
import { ActivityEntryComponent } from '../activity-entry/activity-entry.component';
import { ActivityEntry } from '../../models/activity-entry.model';

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [CommonModule, TimelineModule, ScrollerModule, ActivityEntryComponent],
  templateUrl: './activity-feed.component.html',
  styleUrls: ['./activity-feed.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityFeedComponent implements OnChanges {
  @Input({ required: true }) entries: ActivityEntry[] = [];

  @Output() workItemSelected = new EventEmitter<string>();

  @ViewChild('feedContainer') feedContainer!: ElementRef<HTMLDivElement>;

  protected isAutoScrollPaused = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entries'] && !this.isAutoScrollPaused) {
      // Scroll to bottom when new entries arrive (deferred to next tick)
      setTimeout(() => this.scrollToBottom(), 0);
    }
  }

  protected onScroll(): void {
    // Pause auto-scroll if user has scrolled up
    const el = this.feedContainer?.nativeElement;
    if (el) {
      const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50;
      this.isAutoScrollPaused = !isAtBottom;
    }
  }

  protected onWorkItemClicked(url: string): void {
    this.workItemSelected.emit(url);
  }

  protected trackByEntryId(_index: number, entry: ActivityEntry): string {
    return entry.id;
  }

  private scrollToBottom(): void {
    const el = this.feedContainer?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
```

**Template Structure**:
```html
<!-- activity-feed.component.html -->
<div
  #feedContainer
  class="activity-feed h-full overflow-y-auto px-4 py-2"
  (scroll)="onScroll()"
  aria-live="polite"
  aria-label="Agent activity timeline"
>
  @if (entries.length === 0) {
    <div class="text-center text-gray-400 mt-8 text-sm">No activity yet</div>
  } @else {
    <p-timeline [value]="entries" align="left">
      <ng-template pTemplate="content" let-entry>
        <app-activity-entry
          [entry]="entry"
          (workItemClicked)="onWorkItemClicked($event)"
        />
      </ng-template>
      <ng-template pTemplate="marker" let-entry>
        <span
          class="activity-marker rounded-full w-3 h-3 inline-block"
          [class]="'marker-' + entry.type"
          [attr.aria-label]="entry.type"
        ></span>
      </ng-template>
    </p-timeline>
  }

  @if (isAutoScrollPaused) {
    <button
      class="sticky bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-600 text-white text-xs rounded-full shadow"
      (click)="isAutoScrollPaused = false; scrollToBottom()"
    >
      ↓ Jump to latest
    </button>
  }
</div>
```

**PrimeNG Components**: `p-timeline`, `p-scroller`

---

### 6. ActivityEntryComponent

**Role**: Renders a single timeline entry. Uses a discriminated union to render the appropriate template per entry type.

```typescript
// activity-entry.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TagModule } from 'primeng/tag';
import {
  ActivityEntry,
  LogEntry,
  DecisionEntry,
  QuestionEntry,
  GitHubActionEntry,
  StatusChangeEntry,
  ErrorEntry,
} from '../../models/activity-entry.model';

@Component({
  selector: 'app-activity-entry',
  standalone: true,
  imports: [CommonModule, DatePipe, TagModule],
  templateUrl: './activity-entry.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityEntryComponent {
  @Input({ required: true }) entry!: ActivityEntry;

  @Output() workItemClicked = new EventEmitter<string>();

  protected isLogEntry(e: ActivityEntry): e is LogEntry { return e.type === 'log'; }
  protected isDecisionEntry(e: ActivityEntry): e is DecisionEntry { return e.type === 'decision'; }
  protected isQuestionEntry(e: ActivityEntry): e is QuestionEntry { return e.type === 'question'; }
  protected isGitHubActionEntry(e: ActivityEntry): e is GitHubActionEntry { return e.type === 'github_action'; }
  protected isStatusChangeEntry(e: ActivityEntry): e is StatusChangeEntry { return e.type === 'status_change'; }
  protected isErrorEntry(e: ActivityEntry): e is ErrorEntry { return e.type === 'error'; }

  protected onWorkItemClick(url: string): void {
    this.workItemClicked.emit(url);
  }

  protected get entryLevelSeverity(): 'info' | 'warn' | 'danger' | 'secondary' {
    if (this.isLogEntry(this.entry)) {
      const map: Record<string, 'info' | 'warn' | 'danger' | 'secondary'> = {
        info: 'info', warn: 'warn', error: 'danger', debug: 'secondary',
      };
      return map[this.entry.level] ?? 'info';
    }
    return 'info';
  }
}
```

**Template Structure**:
```html
<!-- activity-entry.component.html -->
<div class="activity-entry text-sm mb-1" [attr.data-type]="entry.type">
  <!-- Timestamp -->
  <span class="text-xs text-gray-400 block mb-0.5">{{ entry.timestamp | date:'HH:mm:ss' }}</span>

  <!-- Log entry -->
  @if (isLogEntry(entry)) {
    <p-tag [value]="entry.level.toUpperCase()" [severity]="entryLevelSeverity" class="mr-2" />
    <span>{{ entry.content }}</span>
  }

  <!-- Decision entry -->
  @if (isDecisionEntry(entry)) {
    <p-tag value="DECISION" severity="success" class="mr-2" />
    <strong>{{ entry.content }}</strong>
    @if (entry.rationale) {
      <p class="text-xs text-gray-500 mt-1 ml-2">↳ {{ entry.rationale }}</p>
    }
  }

  <!-- Question entry -->
  @if (isQuestionEntry(entry)) {
    <p-tag
      [value]="entry.questionStatus === 'answered' ? 'ANSWERED' : 'QUESTION'"
      [severity]="entry.questionStatus === 'answered' ? 'success' : 'warning'"
      class="mr-2"
    />
    <span>{{ entry.content }}</span>
    @if (entry.answer) {
      <p class="text-xs text-green-600 mt-1 ml-2">✓ {{ entry.answer }}</p>
    }
  }

  <!-- GitHub action entry -->
  @if (isGitHubActionEntry(entry)) {
    <p-tag value="GITHUB" severity="secondary" class="mr-2" />
    <button
      class="text-blue-600 hover:underline"
      (click)="onWorkItemClick(entry.githubUrl)"
      [attr.aria-label]="'Open ' + entry.githubType + ': ' + entry.content"
    >
      {{ entry.content }}
    </button>
  }

  <!-- Status change entry -->
  @if (isStatusChangeEntry(entry)) {
    <span class="text-gray-400 text-xs italic">
      Status: {{ entry.oldStatus }} → {{ entry.newStatus }}
    </span>
  }

  <!-- Error entry -->
  @if (isErrorEntry(entry)) {
    <p-tag value="ERROR" severity="danger" class="mr-2" />
    <span class="text-red-700">{{ entry.content }}</span>
  }
</div>
```

---

### 7. GitHubWorkItemComponent

**Role**: Shows enriched GitHub issue/PR details for the selected work item URL.

```typescript
// github-work-item.component.ts
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
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { GitHubEnrichmentService } from '../../services/github-enrichment.service';
import { GitHubWorkItem } from '../../models/github-work-item.model';

@Component({
  selector: 'app-github-work-item',
  standalone: true,
  imports: [CommonModule, TagModule, ChipModule, DividerModule],
  templateUrl: './github-work-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GitHubWorkItemComponent implements OnChanges {
  @Input({ required: true }) workItem!: GitHubWorkItem;

  private readonly enrichmentService = inject(GitHubEnrichmentService);

  protected readonly enrichedData = signal<GitHubWorkItem | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['workItem'] && this.workItem) {
      this.loadEnrichedData();
    }
  }

  private async loadEnrichedData(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const data = await this.enrichmentService.getWorkItem(
        this.workItem.owner,
        this.workItem.repo,
        this.workItem.number,
        this.workItem.type
      );
      this.enrichedData.set(data);
    } catch {
      this.error.set('Unable to load GitHub data');
      this.enrichedData.set(this.workItem); // fallback to cached
    } finally {
      this.isLoading.set(false);
    }
  }
}
```

**Template Structure**:
```html
<!-- github-work-item.component.html -->
<div class="github-panel p-4">
  @if (isLoading()) {
    <p-skeleton height="4rem" />
  } @else if (enrichedData(); as item) {
    <div class="flex items-start gap-2 mb-2">
      <p-tag
        [value]="item.type === 'issue' ? 'ISSUE' : 'PR'"
        [severity]="item.state === 'open' ? 'success' : 'secondary'"
      />
      <a
        [href]="item.htmlUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="font-medium text-sm hover:underline flex-1"
      >
        #{{ item.number }} {{ item.title }}
      </a>
    </div>
    @if (item.labels.length > 0) {
      <div class="flex flex-wrap gap-1 mb-2">
        @for (label of item.labels; track label.name) {
          <p-chip [label]="label.name" />
        }
      </div>
    }
    <p class="text-xs text-gray-500">{{ item.updatedAt | date:'medium' }}</p>
  } @else if (error()) {
    <p class="text-red-500 text-xs">{{ error() }}</p>
  }
</div>
```

---

### 8. FilterSidebarComponent

**Role**: Provides filter controls for the agent grid. Outputs filter change events.

```typescript
// filter-sidebar.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { FilterConfig, AgentStatusFilter } from '../../models/filter-config.model';

@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectButtonModule,
    InputTextModule,
    DropdownModule,
  ],
  templateUrl: './filter-sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterSidebarComponent {
  @Output() filterChanged = new EventEmitter<Partial<FilterConfig>>();

  protected readonly searchText = signal('');
  protected readonly selectedStatuses = signal<AgentStatusFilter[]>([]);
  protected readonly selectedRepo = signal<string | null>(null);

  protected readonly statusOptions: { label: string; value: AgentStatusFilter }[] = [
    { label: 'Executing', value: 'executing' },
    { label: 'Idle', value: 'idle' },
    { label: 'Blocked', value: 'blocked' },
    { label: 'Error', value: 'error' },
    { label: 'Offline', value: 'offline' },
  ];

  protected onSearchChange(value: string): void {
    this.searchText.set(value);
    this.emitFilter();
  }

  protected onStatusChange(statuses: AgentStatusFilter[]): void {
    this.selectedStatuses.set(statuses);
    this.emitFilter();
  }

  protected onRepoChange(repo: string | null): void {
    this.selectedRepo.set(repo);
    this.emitFilter();
  }

  protected clearFilters(): void {
    this.searchText.set('');
    this.selectedStatuses.set([]);
    this.selectedRepo.set(null);
    this.emitFilter();
  }

  private emitFilter(): void {
    this.filterChanged.emit({
      searchText: this.searchText(),
      statuses: this.selectedStatuses(),
      repo: this.selectedRepo(),
    });
  }
}
```

---

### 9. AgentStatusBadgeComponent

**Role**: Reusable presentational component. Renders a coloured PrimeNG `p-tag` for an agent's status.

```typescript
// agent-status-badge.component.ts
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { AgentStatus } from '../../models/agent.model';

interface StatusConfig {
  label: string;
  severity: 'success' | 'warning' | 'danger' | 'info' | 'secondary';
  icon: string;
}

const STATUS_CONFIG: Record<AgentStatus, StatusConfig> = {
  executing: { label: 'Executing', severity: 'success',   icon: 'pi pi-play' },
  idle:      { label: 'Idle',      severity: 'warning',   icon: 'pi pi-pause' },
  blocked:   { label: 'Blocked',   severity: 'danger',    icon: 'pi pi-exclamation-triangle' },
  error:     { label: 'Error',     severity: 'danger',    icon: 'pi pi-times-circle' },
  offline:   { label: 'Offline',   severity: 'secondary', icon: 'pi pi-power-off' },
  completed: { label: 'Done',      severity: 'info',      icon: 'pi pi-check-circle' },
  planning:  { label: 'Planning',  severity: 'info',      icon: 'pi pi-lightbulb' },
  reviewing: { label: 'Reviewing', severity: 'info',      icon: 'pi pi-eye' },
};

@Component({
  selector: 'app-agent-status-badge',
  standalone: true,
  imports: [CommonModule, TagModule],
  template: `
    <p-tag
      [value]="config.label"
      [severity]="config.severity"
      [icon]="config.icon"
      [attr.aria-label]="'Status: ' + config.label"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentStatusBadgeComponent {
  @Input({ required: true }) status!: AgentStatus;

  protected get config(): StatusConfig {
    return STATUS_CONFIG[this.status] ?? STATUS_CONFIG['offline'];
  }
}
```

---

### 10. EmptyStateComponent

**Role**: Reusable empty/error state with configurable message and optional action.

```typescript
// empty-state.component.ts
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <div
      class="empty-state flex flex-col items-center justify-center h-full gap-4 text-gray-400 p-8"
      role="status"
      [attr.aria-label]="message"
    >
      <i [class]="icon + ' text-4xl'"></i>
      <p class="text-sm text-center">{{ message }}</p>
      @if (actionLabel) {
        <p-button
          [label]="actionLabel"
          [severity]="'secondary'"
          [outlined]="true"
          (onClick)="action.emit()"
        />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  @Input() message = 'Nothing here yet';
  @Input() icon = 'pi pi-inbox';
  @Input() actionLabel: string | null = null;

  @Output() action = new EventEmitter<void>();
}
```

---

## TypeScript Model Definitions

### Agent Model

```typescript
// models/agent.model.ts
export type AgentStatus =
  | 'executing'
  | 'idle'
  | 'planning'
  | 'reviewing'
  | 'blocked'
  | 'error'
  | 'offline'
  | 'completed';

export interface Agent {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  type: 'copilot-coding' | 'custom' | 'specialized' | 'orchestrator';
  version: string | null;
  status: AgentStatus;
  currentTask: string | null;
  repo: string | null;
  branch: string | null;
  project: string | null;
  activeSessionId: string | null;
  lastHeartbeatAt: Date;
  startedAt: Date;
  openQuestionsCount: number;
  avatarColor: string; // derived client-side from agent ID
}
```

### FilterConfig Model

```typescript
// models/filter-config.model.ts
export type AgentStatusFilter = Exclude<AgentStatus, 'planning' | 'reviewing'>;

export interface FilterConfig {
  searchText: string;
  statuses: AgentStatusFilter[];
  repo: string | null;
  project: string | null;
  activityTypes: ActivityEntryType[];
  dateRange: { from: Date | null; to: Date | null };
}

export const DEFAULT_FILTER_CONFIG: FilterConfig = {
  searchText: '',
  statuses: [],
  repo: null,
  project: null,
  activityTypes: [],
  dateRange: { from: null, to: null },
};
```

---

## PrimeNG Component Usage Summary

| PrimeNG Component | Used In | Purpose |
|-------------------|---------|---------|
| `p-timeline` | `ActivityFeedComponent` | Chronological activity log display |
| `p-tag` | `ActivityEntryComponent`, `AgentStatusBadgeComponent` | Entry type labels, status display |
| `p-badge` | `AgentCardComponent` | Open questions count indicator |
| `p-avatar` | `AgentCardComponent` | Agent initial avatar |
| `p-skeleton` | `DashboardComponent`, `ActivityPanelComponent` | Loading placeholders |
| `p-card` | General layout | Container panels |
| `p-button` | `EmptyStateComponent`, `FilterSidebarComponent` | Actions and filter reset |
| `p-chip` | `GitHubWorkItemComponent` | GitHub label chips |
| `p-select-button` | `FilterSidebarComponent` | Status filter multi-select |
| `p-dropdown` | `FilterSidebarComponent` | Repo filter select |
| `p-scroller` | `ActivityFeedComponent` | Virtual scroll for 1000+ entries |
| `p-divider` | `GitHubWorkItemComponent` | Section separators |

---

## Accessibility Requirements

- All interactive elements have ARIA labels and roles
- Keyboard navigation: agent cards focusable via Tab; Enter/Space to select
- `aria-live="polite"` on activity feed for screen reader announcements
- Colour is not the sole status indicator (icon + text accompanies all status badges)
- Focus management: selecting an agent moves focus to activity panel header
- WCAG 2.1 AA compliance target per `plan/non-functional-requirements.specification.md`

---

## References

- `plan/functional-requirements.specification.md` — FR-001 (status display), FR-002 (activity feed), FR-003 (GitHub enrichment)
- `plan/ui-ux-workflows.specification.md` — Two-panel layout, agent card design, activity timeline UX
- `architecture/system-architecture.specification.md` — Component diagram (C4 Level 3)
- `research/implementation-recommendations.md` — PrimeNG Timeline, DataView, Angular Signals choice
