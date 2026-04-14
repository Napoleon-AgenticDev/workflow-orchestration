---
meta:
  id: specs-products-agent-alchemy-dev-features-content-queue-architecture-architecture-decisions
  title: Architecture Decisions (ADR) - Content Queue Feature
  version: 1.0.0
  status: draft
  specType: specification
  scope: feature
  tags: []
  createdBy: unknown
  createdAt: '2026-02-24'
  reviewedAt: null
title: Architecture Decisions (ADR) - Content Queue Feature
category: Products
feature: content-queue
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: architecture
applyTo: []
keywords: []
topics: []
useCases: []
specification: architecture-decisions
---

# Architecture Decision Records: Content Queue Feature

## Overview

**Purpose**: Document major architectural decisions, their context, rationale, alternatives considered, and consequences for the Content Queue feature.

**ADR Format**: Each ADR follows the standard template:

1. **Context**: What forces are at play
2. **Decision**: What was decided
3. **Rationale**: Why this decision was made
4. **Alternatives**: What other options were considered
5. **Consequences**: What are the positive and negative impacts
6. **Status**: Accepted, Superseded, Deprecated
7. **Date**: When the decision was made

**ADR Index**:

1. File System vs Database Storage
2. GitHub Copilot API Selection
3. NestJS Framework Choice
4. VS Code Extension Architecture
5. Platform Selection (Twitter/Dev.to First)
6. State Management Approach
7. Monorepo with Nx
8. TypeScript-Only Codebase

---

## ADR-001: File System vs Database Storage

### Status

**Accepted** - 2026-02-10

### Context

The Content Queue feature needs to store:

- Content opportunities (discovered commits/PRs)
- Generated content drafts
- User settings and preferences
- Publishing history

**Storage Options Considered**:

1. **File System** (YAML/Markdown files)
2. **Database** (PostgreSQL via Supabase)
3. **Hybrid** (Files + Database)

**Forces**:

- Developer workflow integration (Git-versioned content)
- Offline capability requirement
- Data portability and ownership
- Query performance for analytics
- Backup and recovery complexity
- Multi-device synchronization

### Decision

**Use Hybrid Approach**:

- **File System**: Primary storage for content (YAML/Markdown)
- **Supabase PostgreSQL**: Metadata, user settings, analytics

```typescript
// File System Structure
.content-queue/
  opportunities/
    2026-02-10-feat-add-auth.yaml
    2026-02-09-fix-validation.yaml
  queue/
    2026-02-11-twitter-thread.md
    2026-02-12-blog-post.md
  published/
    2026-02-08-tweet-123456.md
  settings/
    user-preferences.yaml
    platform-config.yaml

// Database Schema
content_opportunities_metadata
  - id (PK)
  - file_path (indexed)
  - commit_sha
  - score
  - created_at
  - indexed_at

content_queue_metadata
  - id (PK)
  - file_path (indexed)
  - platform
  - status
  - scheduled_at
  - published_at

user_settings
  - user_id (PK)
  - timezone
  - excluded_repos
  - rate_limits
  - preferences_json
```

### Rationale

**Why Hybrid**:

1. **Developer-Friendly**: Files in `.content-queue/` can be versioned with Git
2. **Portability**: Users own their content as portable files
3. **Offline-First**: File system works without internet
4. **Query Performance**: Database handles complex queries and analytics
5. **Synchronization**: Supabase enables multi-device sync via metadata
6. **Best of Both Worlds**: Files for content, database for structure

**Why Not Pure File System**:

- Complex queries would be slow (scanning all files)
- No built-in synchronization across devices
- Difficult to implement real-time features

**Why Not Pure Database**:

- Loses developer workflow integration (Git)
- Content locked in proprietary format
- Requires constant internet connection
- Migration complexity for users

### Alternatives Considered

**Alternative 1: Pure File System (Git-Versioned)**

- **Pros**: Simple, portable, Git-integrated, offline
- **Cons**: Slow queries, no sync, complex analytics
- **Rejected**: Poor performance for large datasets

**Alternative 2: Pure Database (Supabase Only)**

- **Pros**: Fast queries, real-time sync, built-in auth
- **Cons**: Not Git-versioned, requires internet, vendor lock-in
- **Rejected**: Breaks developer workflow integration

**Alternative 3: IndexedDB (Browser/Extension Storage)**

- **Pros**: Built-in to VS Code extensions, structured
- **Cons**: Not Git-versioned, limited capacity, complex sync
- **Rejected**: Doesn't fit developer content workflow

### Consequences

**Positive**:

- ✅ Best developer experience (Git-versioned content)
- ✅ User owns content (portable Markdown/YAML files)
- ✅ Fast queries via database indexes
- ✅ Offline-first with online sync capability
- ✅ Easy backup (files + database export)

**Negative**:

- ⚠️ Increased complexity (dual storage systems)
- ⚠️ Synchronization logic required (file ↔ database)
- ⚠️ Potential consistency issues if file/DB out of sync
- ⚠️ Two systems to monitor and maintain

**Mitigation**:

- Implement file watcher for automatic sync
- Use file path as canonical reference
- Database stores metadata only (not full content)
- Regular consistency checks and repair

### Validation

**Success Criteria**:

- [ ] Files can be committed to Git and synced
- [ ] Database queries return results < 100ms
- [ ] Offline mode works without database
- [ ] Multi-device sync tested and working
- [ ] Backup/restore tested for both systems

---

## ADR-002: GitHub Copilot API Selection

### Status

**Accepted** - 2026-02-10

### Context

AI content generation is core to the Content Queue feature. Need to select an AI provider for:

- Commit analysis and summarization
- Content generation (tweets, blog posts)
- Content quality improvement suggestions

**API Options**:

1. **GitHub Copilot API** (GPT-4 via GitHub)
2. **OpenAI API** (Direct GPT-4 access)
3. **Anthropic Claude API**
4. **Local LLM** (Ollama, llama.cpp)

**Forces**:

- Cost (API usage pricing)
- Developer experience (already using GitHub)
- Rate limits and quotas
- Model quality and capabilities
- Authentication complexity
- Vendor lock-in concerns

### Decision

**Use GitHub Copilot API**

```typescript
interface CopilotConfig {
  endpoint: 'https://api.github.com/copilot/completions';
  model: 'gpt-4' | 'gpt-3.5-turbo';
  authentication: 'github-oauth'; // User's existing GitHub token
  rateLimit: {
    requestsPerHour: 50;
    tokensPerRequest: 8000;
  };
}

@Injectable()
export class CopilotService {
  constructor(private githubAuth: GitHubAuthService) {}

  async generateContent(prompt: string): Promise<string> {
    const token = await this.githubAuth.getAccessToken();

    const response = await fetch('https://api.github.com/copilot/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a developer advocate...' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    return response.json();
  }
}
```

### Rationale

**Why GitHub Copilot API**:

1. **Unified Authentication**: Uses same GitHub OAuth token
2. **Developer Experience**: Natural fit for GitHub-centric workflow
3. **Cost Efficiency**: Included in GitHub Copilot subscription
4. **Trust**: GitHub is already trusted by target users
5. **Integration**: Seamless with GitHub commit data access
6. **Quality**: GPT-4 powered, same as OpenAI

**Why Not OpenAI Direct**:

- Requires separate API key management
- Additional cost on top of GitHub subscription
- More authentication complexity

**Why Not Claude**:

- Another separate API key to manage
- Less familiar to target developer audience
- No cost advantage

**Why Not Local LLM**:

- Quality significantly lower than GPT-4
- Requires local compute resources
- Slower inference times

### Alternatives Considered

**Alternative 1: OpenAI API (Direct)**

- **Pros**: Direct access, more control, potentially faster
- **Cons**: Separate API key, additional cost, duplicate auth
- **Rejected**: Adds complexity without benefits

**Alternative 2: Anthropic Claude API**

- **Pros**: High quality, competitive pricing
- **Cons**: Another API key, less known to developers
- **Rejected**: No compelling advantage over Copilot

**Alternative 3: Local LLM (Ollama)**

- **Pros**: No API costs, privacy, offline
- **Cons**: Lower quality, requires resources, slower
- **Rejected**: Quality not sufficient for production

**Alternative 4: Multi-Provider (Abstract)**

- **Pros**: Flexibility, vendor independence
- **Cons**: Significantly more complex, auth for multiple providers
- **Rejected**: Over-engineering for MVP

### Consequences

**Positive**:

- ✅ No additional API keys or costs
- ✅ Unified authentication flow
- ✅ Trusted by target users (GitHub)
- ✅ High quality (GPT-4)
- ✅ Simple implementation

**Negative**:

- ⚠️ Vendor lock-in to GitHub ecosystem
- ⚠️ Rate limits tied to GitHub Copilot quota
- ⚠️ Requires active Copilot subscription
- ⚠️ Switching providers later requires refactor

**Mitigation**:

- Document API interface clearly for future abstraction
- Monitor rate limits and implement queuing
- Plan for future multi-provider support if needed
- Ensure users understand Copilot subscription requirement

### Validation

**Success Criteria**:

- [ ] Content generation quality matches expectations
- [ ] Rate limits are sufficient for typical usage
- [ ] Authentication flow works seamlessly
- [ ] Error handling for quota exceeded implemented
- [ ] User feedback on AI quality is positive

---

## ADR-003: NestJS Framework Choice

### Status

**Accepted** - 2026-02-10

### Context

Need backend framework for:

- API endpoints (if required)
- Background job processing
- Service layer architecture
- Dependency injection
- Testing infrastructure

**Framework Options**:

1. **NestJS** (TypeScript, Angular-inspired)
2. **Express** (Minimal, flexible)
3. **Fastify** (High performance)
4. **Hono** (Edge-first)

**Forces**:

- TypeScript-first design
- Dependency injection pattern
- Testing capabilities
- Documentation quality
- Community and ecosystem
- Learning curve for team

### Decision

**Use NestJS 10.0.2**

```typescript
// Module organization
@Module({
  imports: [ConfigModule.forRoot(), TypeOrmModule.forRoot(databaseConfig), ContentDiscoveryModule, ContentGenerationModule, PublishingModule],
  providers: [AppService],
  controllers: [AppController],
})
export class AppModule {}

// Service with DI
@Injectable()
export class ContentService {
  constructor(
    private readonly copilot: CopilotService,
    private readonly github: GitHubService,
    private readonly scorer: CommitScoringService,
    private readonly logger: LoggerService
  ) {}

  async processCommit(commitSha: string): Promise<ContentOpportunity> {
    const commit = await this.github.getCommit(commitSha);
    const analysis = await this.scorer.analyzeCommit(commit);

    if (analysis.score >= 50) {
      return this.createOpportunity(commit, analysis);
    }

    return null;
  }
}
```

### Rationale

**Why NestJS**:

1. **TypeScript-First**: Excellent TS support, decorators, strong typing
2. **DI Pattern**: Familiar to Angular developers (target audience)
3. **Modular Architecture**: Clear separation of concerns
4. **Testing**: Built-in testing utilities, Jest integration
5. **Documentation**: Comprehensive, well-maintained docs
6. **Ecosystem**: Mature packages for common needs
7. **Scalability**: Supports microservices, GraphQL, WebSockets

**Why Not Express**:

- No built-in structure or DI
- Manual setup for everything
- Less opinionated (more decisions required)

**Why Not Fastify**:

- Smaller ecosystem
- Less Angular-like (target audience familiarity)
- Similar but less popular than NestJS

**Why Not Hono**:

- Too new, smaller community
- Edge-first not needed for this use case
- Less enterprise features

### Alternatives Considered

**Alternative 1: Express with TypeScript**

- **Pros**: Minimal, flexible, well-known
- **Cons**: No DI, manual structure, more boilerplate
- **Rejected**: Too much manual setup

**Alternative 2: Fastify**

- **Pros**: Fast, schema validation, plugin system
- **Cons**: Less familiar to Angular devs, smaller ecosystem
- **Rejected**: No significant advantage over NestJS

**Alternative 3: Standalone Services (No Framework)**

- **Pros**: No framework overhead, full control
- **Cons**: Reinvent DI, routing, testing utilities
- **Rejected**: Not worth the effort

### Consequences

**Positive**:

- ✅ Familiar to Angular developers (same DI pattern)
- ✅ Strong TypeScript support and type safety
- ✅ Modular architecture scales well
- ✅ Excellent testing utilities
- ✅ Comprehensive documentation
- ✅ Active community and ecosystem

**Negative**:

- ⚠️ Heavier than Express (larger bundle)
- ⚠️ More opinionated (less flexibility)
- ⚠️ Learning curve for non-Angular developers
- ⚠️ Decorator-heavy code style

**Mitigation**:

- Leverage existing Angular knowledge
- Use NestJS CLI for consistency
- Follow official documentation patterns
- Keep modules focused and small

### Validation

**Success Criteria**:

- [ ] DI working correctly across all services
- [ ] Test coverage > 80%
- [ ] Module boundaries clear and enforced
- [ ] Build time < 30 seconds
- [ ] Developer onboarding < 1 day

---

## ADR-004: VS Code Extension Architecture

### Status

**Accepted** - 2026-02-10

### Context

Need to decide architectural pattern for VS Code extension:

- **Webview Panel** (HTML/CSS/JS UI)
- **Tree View** (Native VS Code UI)
- **Status Bar + Commands** (Minimal UI)
- **Sidebar Panel** (Persistent view)

**Forces**:

- User experience (familiar vs custom UI)
- Development complexity
- Maintenance burden
- Performance and responsiveness
- VS Code API limitations

### Decision

**Use Hybrid Approach**:

1. **Sidebar Panel**: Primary interface (queue view, status)
2. **Webview Panel**: Content editor (rich editing)
3. **Status Bar**: Quick status indicators
4. **Commands**: Keyboard shortcuts and command palette

```typescript
// Extension architecture
export function activate(context: vscode.ExtensionContext) {
  // Sidebar panel (Tree View)
  const queueProvider = new ContentQueueProvider();
  vscode.window.registerTreeDataProvider('contentQueue', queueProvider);

  // Webview panel (Content Editor)
  const editorPanel = new ContentEditorPanel(context.extensionUri);

  // Status bar
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.text = '$(check) Content Queue';
  statusBar.show();

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('contentQueue.generate', async () => {
      await queueProvider.generateFromCommit();
    })
  );
}

// Sidebar panel provider
class ContentQueueProvider implements vscode.TreeDataProvider<ContentItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  getChildren(element?: ContentItem): ContentItem[] {
    if (!element) {
      // Root level: show categories
      return [
        new ContentItem('Opportunities', vscode.TreeItemCollapsibleState.Expanded),
        new ContentItem('Queue', vscode.TreeItemCollapsibleState.Expanded),
        new ContentItem('Published', vscode.TreeItemCollapsibleState.Collapsed),
      ];
    }

    // Child level: show content items
    return this.getContentItems(element.label);
  }
}
```

### Rationale

**Why Hybrid Approach**:

1. **Tree View**: Native, performant, familiar for list/hierarchy
2. **Webview**: Rich editing, preview, formatting controls
3. **Status Bar**: Always visible, quick feedback
4. **Commands**: Power users, automation, keyboard shortcuts

**Component Selection**:

- **Sidebar Panel**: Content queue is persistent, always accessible
- **Webview**: Rich text editing requires HTML/CSS control
- **Tree View**: Content hierarchy (opportunities → queue → published)
- **Status Bar**: Queue size, next publish time

### Alternatives Considered

**Alternative 1: Pure Tree View**

- **Pros**: Native, fast, simple
- **Cons**: Limited rich editing, no preview
- **Rejected**: Poor content editing experience

**Alternative 2: Pure Webview**

- **Pros**: Full UI control, rich features
- **Cons**: Performance overhead, non-native feel
- **Rejected**: Doesn't feel like VS Code

**Alternative 3: External Web App**

- **Pros**: Unlimited UI capabilities
- **Cons**: Breaks VS Code workflow integration
- **Rejected**: Defeats purpose of extension

### Consequences

**Positive**:

- ✅ Native feel for navigation (Tree View)
- ✅ Rich editing experience (Webview)
- ✅ Quick status feedback (Status Bar)
- ✅ Power user support (Commands)
- ✅ Best of all UI paradigms

**Negative**:

- ⚠️ More complex (multiple UI components)
- ⚠️ State synchronization between components
- ⚠️ Larger codebase to maintain
- ⚠️ Testing more complex

**Mitigation**:

- Centralized state management (Angular Signals)
- Clear component boundaries
- Comprehensive E2E tests
- Document UI architecture clearly

### Validation

**Success Criteria**:

- [ ] Navigation feels native and responsive
- [ ] Content editing is rich and intuitive
- [ ] Status bar provides useful at-a-glance info
- [ ] Commands work from keyboard shortcuts
- [ ] User feedback is positive

---

## ADR-005: Platform Selection (Twitter/Dev.to First)

### Status

**Accepted** - 2026-02-10

### Context

Need to prioritize which social platforms to support first:

- **Twitter/X** (short-form, real-time)
- **Dev.to** (long-form, developer blog)
- **LinkedIn** (professional network)
- **Medium** (blogging platform)
- **Hashnode** (developer blog)

**Forces**:

- Developer audience preferences
- API availability and quality
- Authentication complexity
- Content format differences
- Maintenance burden

### Decision

**Phase 1: Twitter + Dev.to**

- Twitter for short-form (threads)
- Dev.to for long-form (articles)

**Phase 2 (Future): LinkedIn, Hashnode**

```typescript
enum SupportedPlatform {
  TWITTER = 'twitter', // ✅ Phase 1
  DEVTO = 'devto', // ✅ Phase 1
  LINKEDIN = 'linkedin', // 🔜 Phase 2
  HASHNODE = 'hashnode', // 🔜 Phase 2
}

interface PlatformConfig {
  platform: SupportedPlatform;
  authType: 'oauth2' | 'api-key';
  contentFormats: ContentFormat[];
  charLimit?: number;
  phase: 1 | 2;
}

const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    platform: SupportedPlatform.TWITTER,
    authType: 'oauth2',
    contentFormats: ['tweet', 'thread'],
    charLimit: 280,
    phase: 1,
  },
  {
    platform: SupportedPlatform.DEVTO,
    authType: 'api-key',
    contentFormats: ['article'],
    charLimit: undefined, // No limit
    phase: 1,
  },
];
```

### Rationale

**Why Twitter First**:

1. **Reach**: Largest developer audience on social
2. **Real-Time**: Immediate feedback and engagement
3. **Format**: Perfect for commit summaries and quick shares
4. **API**: Well-documented, OAuth 2.0 support
5. **Frequency**: Supports high-frequency posting

**Why Dev.to First**:

1. **Developer-Focused**: 100% developer audience
2. **Long-Form**: Perfect for detailed technical posts
3. **Simple Auth**: API key only (no OAuth complexity)
4. **Markdown**: Native Markdown support (matches our files)
5. **Community**: Active, engaged developer community

**Why Not LinkedIn First**:

- More professional, less casual content
- API more restrictive
- Lower engagement for technical posts

**Why Not Medium First**:

- Paywall issues
- Less developer-focused
- API less accessible

**Why Not Hashnode First**:

- Smaller audience than Dev.to
- Similar to Dev.to (redundant for Phase 1)

### Alternatives Considered

**Alternative 1: Twitter + LinkedIn**

- **Pros**: Professional + casual coverage
- **Cons**: LinkedIn less technical audience
- **Rejected**: Dev.to better fit for long-form technical

**Alternative 2: All Platforms Simultaneously**

- **Pros**: Maximum reach immediately
- **Cons**: Development complexity, maintenance burden
- **Rejected**: Violates MVP principle

**Alternative 3: Twitter Only (Minimal)**

- **Pros**: Simplest implementation
- **Cons**: No long-form capability
- **Rejected**: Limits use cases significantly

### Consequences

**Positive**:

- ✅ Covers both short-form and long-form content
- ✅ Reaches primary developer audiences
- ✅ Simpler to implement and maintain (2 vs 5 platforms)
- ✅ Validates product-market fit before expanding
- ✅ Different auth types (OAuth + API key) tested

**Negative**:

- ⚠️ Users on LinkedIn/Medium/Hashnode not supported yet
- ⚠️ Feature requests for other platforms expected
- ⚠️ Content may need reformatting for future platforms

**Mitigation**:

- Design platform abstraction for easy additions
- Document roadmap clearly (Phase 1 vs 2)
- Collect feedback on platform priorities
- Validate Phase 1 success before Phase 2

### Validation

**Success Criteria**:

- [ ] Twitter publishing works reliably
- [ ] Dev.to publishing works reliably
- [ ] User satisfaction with both platforms
- [ ] < 10% requests for other platforms
- [ ] Ready to add Phase 2 platforms in 3 months

---

## ADR-006: State Management Approach

### Status

**Accepted** - 2026-02-10

### Context

VS Code extension needs state management for:

- Content queue items
- User preferences
- Authentication status
- UI state (selected items, filters)
- Real-time updates

**State Management Options**:

1. **Angular Signals** (Reactive, built-in)
2. **NgRx** (Redux pattern)
3. **RxJS BehaviorSubject** (Observable-based)
4. **React Context** (If using React)
5. **MobX** (Observable state)

**Forces**:

- Reactivity requirements
- Complexity vs simplicity
- Testing ease
- Performance
- Learning curve

### Decision

**Use Angular Signals**

```typescript
// State service with Signals
@Injectable({
  providedIn: 'root',
})
export class ContentQueueState {
  // Writable signals for mutable state
  private readonly opportunitiesSignal = signal<ContentOpportunity[]>([]);
  private readonly queueSignal = signal<QueueItem[]>([]);
  private readonly selectedIdSignal = signal<string | null>(null);

  // Read-only computed signals
  readonly opportunities = this.opportunitiesSignal.asReadonly();
  readonly queue = this.queueSignal.asReadonly();
  readonly selectedId = this.selectedIdSignal.asReadonly();

  // Computed signals (derived state)
  readonly selectedOpportunity = computed(() => {
    const id = this.selectedId();
    return this.opportunities().find((o) => o.id === id) || null;
  });

  readonly queueSize = computed(() => this.queue().length);

  readonly nextScheduled = computed(() => {
    const items = this.queue();
    return items.filter((item) => item.scheduledAt).sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())[0];
  });

  // Actions to update state
  addOpportunity(opportunity: ContentOpportunity): void {
    this.opportunitiesSignal.update((items) => [...items, opportunity]);
  }

  removeOpportunity(id: string): void {
    this.opportunitiesSignal.update((items) => items.filter((o) => o.id !== id));
  }

  selectOpportunity(id: string | null): void {
    this.selectedIdSignal.set(id);
  }

  moveToQueue(opportunityId: string, queueItem: QueueItem): void {
    this.removeOpportunity(opportunityId);
    this.queueSignal.update((items) => [...items, queueItem]);
  }
}

// Component using signals
@Component({
  selector: 'app-queue-view',
  template: `
    <div class="queue-status">Queue: {{ queueSize() }} items Next: {{ nextScheduled()?.scheduledAt | date }}</div>

    <div class="opportunities">
      @for (opp of opportunities(); track opp.id) {
      <div class="opportunity" [class.selected]="opp.id === selectedId()" (click)="selectOpportunity(opp.id)">
        {{ opp.title }}
      </div>
      }
    </div>

    <div class="details">
      @if (selectedOpportunity(); as opp) {
      <app-opportunity-details [opportunity]="opp" />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueueViewComponent {
  protected readonly state = inject(ContentQueueState);

  protected readonly queueSize = this.state.queueSize;
  protected readonly nextScheduled = this.state.nextScheduled;
  protected readonly opportunities = this.state.opportunities;
  protected readonly selectedId = this.state.selectedId;
  protected readonly selectedOpportunity = this.state.selectedOpportunity;

  selectOpportunity(id: string): void {
    this.state.selectOpportunity(id);
  }
}
```

### Rationale

**Why Angular Signals**:

1. **Built-In**: No additional dependencies
2. **Reactive**: Automatic change detection
3. **Performant**: Fine-grained reactivity, minimal re-renders
4. **Simple API**: Easy to learn and use
5. **Type-Safe**: Full TypeScript support
6. **Computed Values**: Derived state handled elegantly
7. **Modern**: Angular's future direction (v16+)

**Why Not NgRx**:

- Too complex for extension use case
- Boilerplate-heavy
- Overkill for relatively simple state

**Why Not RxJS Only**:

- More verbose than Signals
- Subscription management overhead
- Signals integrate better with Angular templates

**Why Not MobX**:

- Additional dependency
- Not Angular-native
- Less community support in Angular ecosystem

### Alternatives Considered

**Alternative 1: NgRx (Redux Pattern)**

- **Pros**: Proven pattern, time-travel debugging, Redux DevTools
- **Cons**: Massive boilerplate, complex for small app, steep learning curve
- **Rejected**: Over-engineering for use case

**Alternative 2: RxJS BehaviorSubject**

- **Pros**: Well-known, flexible, powerful
- **Cons**: Manual subscription management, more verbose
- **Rejected**: Signals provide better DX

**Alternative 3: Local Component State**

- **Pros**: Simplest, no shared state complexity
- **Cons**: State lost on navigation, duplicated logic
- **Rejected**: Need shared state across views

### Consequences

**Positive**:

- ✅ Simple, intuitive API
- ✅ Automatic change detection
- ✅ Excellent performance (fine-grained updates)
- ✅ No boilerplate
- ✅ Type-safe
- ✅ Future-proof (Angular direction)

**Negative**:

- ⚠️ Signals are new (Angular 16+)
- ⚠️ Less Stack Overflow answers than NgRx
- ⚠️ No time-travel debugging (like Redux DevTools)
- ⚠️ Learning curve for non-Angular devs

**Mitigation**:

- Document signal patterns clearly
- Provide examples for common operations
- Use RxJS where it makes sense (HTTP, timers)
- Keep state structure simple

### Validation

**Success Criteria**:

- [ ] All UI reactively updates on state changes
- [ ] No manual change detection needed
- [ ] State logic is testable in isolation
- [ ] Component code is clean and readable
- [ ] Performance meets requirements (< 16ms renders)

---

## ADR-007: Monorepo with Nx

### Status

**Accepted** - 2026-02-10

### Context

Project structure decision:

- **Monorepo** (all code in one repo)
- **Multi-repo** (separate repos for each package)
- **Mono-monolith** (single package)

**Forces**:

- Code sharing between VS Code extension and services
- CI/CD complexity
- Developer experience
- Build performance
- Versioning strategy

### Decision

**Use Nx Monorepo 19.8.4**

```
buildmotion-ai-agency/
  apps/
    vscode-extension/        # VS Code extension
    content-queue-api/       # Optional NestJS API
  libs/
    content-queue/
      discovery/             # Commit/PR discovery logic
      generation/            # AI content generation
      publishing/            # Platform publishing
      shared/                # Shared types, utils
  tools/
    scripts/                 # Build scripts
  .github/
    workflows/               # CI/CD pipelines
  nx.json                    # Nx configuration
  tsconfig.base.json         # Shared TypeScript config
```

### Rationale

**Why Nx Monorepo**:

1. **Code Sharing**: Easily share types, utils, services
2. **Consistent Tooling**: One build system, one test runner
3. **Affected Commands**: Only build/test what changed
4. **Caching**: Nx Cloud speeds up CI dramatically
5. **DX**: Single repo, simplified developer experience
6. **Refactoring**: Easy to move code between packages

**Why Not Multi-Repo**:

- Code duplication
- Version synchronization complexity
- Cross-repo changes are painful

**Why Not Mono-Monolith**:

- Poor organization at scale
- All-or-nothing builds/tests
- Difficult to enforce module boundaries

### Consequences

**Positive**:

- ✅ Fast CI (only affected projects)
- ✅ Easy code sharing
- ✅ Consistent tooling
- ✅ Simple developer onboarding

**Negative**:

- ⚠️ Larger repository size
- ⚠️ Nx learning curve
- ⚠️ More configuration

---

## ADR-008: TypeScript-Only Codebase

### Status

**Accepted** - 2026-02-10

### Context

Language choice for entire codebase:

- **TypeScript** (typed superset of JavaScript)
- **JavaScript** (dynamic, no types)
- **Mixed** (TS + JS)

**Forces**:

- Type safety vs development speed
- Maintainability
- Refactoring confidence
- IDE support

### Decision

**100% TypeScript 5.5.2**

```typescript
// Strict configuration
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Rationale

**Why TypeScript**:

1. **Type Safety**: Catch errors at compile time
2. **Refactoring**: Safe renames and moves
3. **IDE Support**: IntelliSense, auto-completion
4. **Documentation**: Types serve as docs
5. **Maintenance**: Easier to maintain over time

### Consequences

**Positive**:

- ✅ Fewer runtime errors
- ✅ Better refactoring experience
- ✅ Self-documenting code

**Negative**:

- ⚠️ Compilation step required
- ⚠️ Learning curve for type system

---

## Summary of Decisions

| ADR | Decision                    | Status   | Impact |
| --- | --------------------------- | -------- | ------ |
| 001 | Hybrid Storage (Files + DB) | Accepted | High   |
| 002 | GitHub Copilot API          | Accepted | High   |
| 003 | NestJS Framework            | Accepted | Medium |
| 004 | Hybrid VS Code UI           | Accepted | Medium |
| 005 | Twitter + Dev.to First      | Accepted | High   |
| 006 | Angular Signals             | Accepted | Medium |
| 007 | Nx Monorepo                 | Accepted | High   |
| 008 | TypeScript Only             | Accepted | Low    |

---

## Decision Review Process

**When to Create an ADR**:

- Making architectural choices with long-term impact
- Selecting between multiple valid alternatives
- Decisions that affect multiple components
- Choices that are difficult to reverse

**ADR Review Cycle**:

1. **Quarterly Review**: Review all ADRs for relevance
2. **Status Update**: Mark as Superseded if replaced
3. **Lessons Learned**: Document what worked and what didn't
4. **New Context**: Update if assumptions changed

**ADR Maintenance**:

- Keep ADRs up to date with reality
- Don't delete old ADRs (mark as Superseded)
- Link related ADRs
- Update consequences if new information emerges

This comprehensive set of ADRs documents all major architectural decisions for the Content Queue feature, providing context and rationale for future maintainers.
