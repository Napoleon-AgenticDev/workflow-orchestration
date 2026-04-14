---
meta:
  id: canvas-research-angular-canvas-libraries-architecture-decisions-specification
  title: Architecture Decision Records (ADR) - Canvas Libraries for Angular
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:canvas-research
  tags: []
  createdBy: Agent Alchemy Architecture
  createdAt: 2026-02-25T00:00:00.000Z
  reviewedAt: null
title: Architecture Decision Records (ADR) - Canvas Libraries for Angular
category: Products
feature: angular-canvas-libraries
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: canvas-research
phase: architecture
applyTo: []
keywords: []
topics: []
useCases: []
references:
  - .agent-alchemy/specs/standards/architectural-guidelines.specification.md
depends-on:
  - architecture/system-architecture.specification.md
  - research-and-ideation/FEASIBILITY-SUMMARY.md
specification: 08-architecture-decisions
---

# Architecture Decision Records: Canvas Libraries for Angular

## Overview

**Purpose**: Document all major architectural decisions with context, alternatives, and rationale.

**ADR Format**: [MADR 3.0.0](https://adr.github.io/madr/) template  
**Total Decisions**: 10 ADRs covering technology, architecture, and design choices

---

## ADR-001: Canvas Library Selection (ng2-konva vs Fabric.js)

### Status: **ACCEPTED**

### Decision Date: 2026-02-25

### Context

Need to select a canvas rendering library for Angular applications to enable drawing, diagramming, and visualization features. Key considerations:
- Angular integration approach (native vs wrapper)
- TypeScript support and type safety
- Performance with 1,000-10,000 objects
- Bundle size impact
- Learning curve for Angular developers
- License and cost
- Community support and maintenance

### Decision

**Selected**: ng2-konva as primary canvas library with Fabric.js as fallback option.

### Alternatives Considered

1. **ng2-konva** (SELECTED)
   - ✅ Angular-native declarative API
   - ✅ Excellent TypeScript support
   - ✅ Free MIT license
   - ✅ 70KB gzipped (moderate size)
   - ✅ 2-3 day integration time
   - ❌ Smaller ecosystem than Fabric.js
   - ❌ Dependency on Konva.js maintenance

2. **Fabric.js**
   - ✅ Mature, feature-rich
   - ✅ Large community
   - ✅ Better for advanced design tools
   - ❌ 100KB gzipped (larger)
   - ❌ Requires custom Angular wrappers
   - ❌ More boilerplate code

3. **Native Canvas API**
   - ✅ Zero bundle cost
   - ✅ Maximum flexibility
   - ❌ $100K-$250K initial cost
   - ❌ High development time
   - ❌ Requires canvas expertise

4. **CanvasJS**
   - ✅ Good for data visualization
   - ❌ Commercial license ($239-$1,195/year)
   - ❌ Limited to chart/graph use cases

### Rationale

ng2-konva provides the best cost-to-value ratio for Angular developers:
- Familiar Angular patterns (components, directives)
- Strong typing reduces runtime errors
- Acceptable bundle size for features gained
- Free open-source license
- Proven performance for typical use cases (FR-P-002: 60fps with <1000 objects)
- Fastest time to market (2-3 days integration vs weeks for custom solution)

Fabric.js remains as documented fallback if:
- ng2-konva performance issues discovered in POC
- Advanced features unavailable in Konva required
- Migration from existing Fabric.js app

### Consequences

**Positive**:
- Reduced development time and cost ($40K-$80K vs $100K-$250K)
- Natural Angular integration approach
- Strong type safety throughout codebase
- Proven library with active maintenance

**Negative**:
- Dependency on ng2-konva + Konva.js maintenance
- Smaller ecosystem than Fabric.js
- May need to contribute upstream fixes
- Limited advanced features compared to Fabric.js

**Mitigation**:
- POC phase to validate performance (Phase 1 in implementation-sequence)
- Document Fabric.js migration path
- Monitor ng2-konva/Konva.js release cycles and CVEs
- Budget for potential library contributions

---

## ADR-002: State Management with Angular Signals

### Status: **ACCEPTED**

### Decision Date: 2026-02-25

### Context

Need to select state management approach for canvas feature. Canvas state includes:
- Objects array (potentially 10,000 items)
- Selected object IDs
- Active tool
- Canvas metadata
- Undo/redo history

Frequent updates required for drag, resize, rotate operations (60fps target).

### Decision

**Selected**: Angular Signals + RxJS for hybrid reactive state management.

### Alternatives Considered

1. **Angular Signals** (SELECTED)
   - ✅ Built-in Angular 18+, no external library
   - ✅ Better performance than Zone.js
   - ✅ Automatic dependency tracking
   - ✅ Clean API for simple state
   - ❌ Newer pattern, less community examples
   - ❌ Limited to Angular 16+

2. **NgRx (Redux pattern)**
   - ✅ Mature, well-documented
   - ✅ Time-travel debugging
   - ❌ 50KB+ bundle overhead
   - ❌ Significant boilerplate
   - ❌ Over-engineered for this use case

3. **RxJS only (BehaviorSubject)**
   - ✅ Well-known pattern
   - ✅ Flexible
   - ❌ Manual subscription management
   - ❌ Memory leak risks if not careful
   - ❌ More verbose than Signals

4. **Akita (State Management)**
   - ✅ Less boilerplate than NgRx
   - ❌ External dependency (~20KB)
   - ❌ Learning curve for team

### Rationale

Angular Signals provide optimal performance and developer experience:
- Native Angular feature (no bundle cost)
- Automatic reactivity without manual subscriptions
- Better performance than Zone.js change detection
- Perfect fit for frequently updated canvas state (FR-P-002: 60fps requirement)
- Cleaner code with computed signals for derived state
- RxJS still available for complex async operations (auto-save, export)

### Consequences

**Positive**:
- Zero bundle cost (built-in)
- Improved performance (no Zone.js thrashing)
- Reduced memory leak risk (no manual unsubscribe)
- Modern Angular patterns (future-proof)
- Easier testing (synchronous signal updates)

**Negative**:
- Team learning curve (newer pattern)
- Less community examples/Stack Overflow answers
- Requires Angular 16+ (acceptable per constraints TC-001)

**Mitigation**:
- Document signal patterns in codebase
- Provide team training on signals
- Use RxJS for async operations (familiar)
- Create reusable signal utilities

---

## ADR-003: Client-Side Only Architecture (No Backend)

### Status: **ACCEPTED**

### Decision Date: 2026-02-25

### Context

Canvas feature could be architected as:
1. Client-side only (browser storage)
2. Client + server (persistent cloud storage)
3. Hybrid (client-first, optional cloud sync)

MVP requirements focus on single-user experience without collaboration features.

### Decision

**Selected**: Client-side only architecture with browser storage (IndexedDB + LocalStorage).

### Alternatives Considered

1. **Client-side only** (SELECTED)
   - ✅ Zero server costs
   - ✅ Fastest implementation (18-21 weeks)
   - ✅ Works offline
   - ✅ User data privacy (stays local)
   - ❌ No multi-device sync
   - ❌ Limited to browser storage quota

2. **Client + Server (Supabase)**
   - ✅ Cloud sync, multi-device
   - ✅ Collaboration features possible
   - ❌ $15-50/month hosting
   - ❌ +3-4 weeks development
   - ❌ Backend authentication required
   - ❌ Data privacy concerns

3. **Hybrid (local + optional sync)**
   - ✅ Best of both worlds
   - ✅ Works offline
   - ❌ Significantly more complex
   - ❌ Sync conflict resolution needed

### Rationale

Client-side architecture aligns with MVP goals:
- Meets all functional requirements (FR-001 to FR-022)
- No server dependency reduces complexity and cost
- Faster time to market (18-21 weeks vs 25-30 weeks)
- Browser storage sufficient for typical use cases (50-100 objects per canvas)
- User maintains full control of data
- Can add cloud sync as future enhancement without breaking changes

### Consequences

**Positive**:
- Zero ongoing hosting costs
- Faster development and deployment
- Works offline (progressive web app capability)
- User data privacy (no transmission)
- Simpler architecture and testing

**Negative**:
- No multi-device synchronization
- Limited by browser storage quota (~50MB IndexedDB)
- Canvas data lost if browser cache cleared (mitigated by export/import)
- No collaboration features

**Mitigation**:
- Implement robust export/import (JSON, PNG, SVG)
- Provide clear data retention documentation
- Design for future cloud sync (data models compatible with Supabase)
- Storage quota monitoring and warnings (BR-S-002)

---

## ADR-004: IndexedDB as Primary Storage

### Status: **ACCEPTED**

### Decision Date: 2026-02-25

### Context

Need persistent storage for canvas state, auto-save, and undo/redo history. Options:
- IndexedDB (browser database)
- LocalStorage (key-value store)
- SessionStorage (temporary)
- Web SQL (deprecated)

### Decision

**Selected**: IndexedDB as primary storage with LocalStorage fallback.

### Alternatives Considered

1. **IndexedDB** (SELECTED)
   - ✅ 50MB+ storage capacity
   - ✅ Structured data with indexes
   - ✅ Transactions supported
   - ✅ Async (non-blocking)
   - ❌ More complex API
   - ❌ Requires polyfill for old browsers

2. **LocalStorage**
   - ✅ Simple API
   - ✅ Synchronous
   - ❌ 5MB limit
   - ❌ Blocks main thread
   - ❌ No indexing or queries

3. **Web SQL**
   - ❌ Deprecated
   - ❌ No future browser support

### Rationale

IndexedDB provides necessary capacity and features:
- Sufficient storage for hundreds of canvases
- Query and index support for canvas list views
- Transaction support for undo/redo consistency
- Async API won't block 60fps rendering
- LocalStorage fallback ensures compatibility

### Consequences

**Positive**:
- Adequate storage for typical usage
- Fast queries with indexes
- Non-blocking async operations
- Transaction safety for complex operations

**Negative**:
- More complex API (mitigated by idb wrapper library)
- Browser compatibility variations
- Storage quota can be exceeded

**Mitigation**:
- Use `idb` library for cleaner API
- Implement storage quota monitoring (BR-S-002)
- Provide LocalStorage fallback
- Clear documentation of storage limits

---

## ADR-005: Standalone Components (Angular 18+)

### Status: **ACCEPTED**

### Decision Date: 2026-02-25

### Context

Angular 14+ supports standalone components (no NgModule required). Angular 18 makes them the recommended approach.

### Decision

**Selected**: Use standalone components throughout canvas feature.

### Alternatives Considered

1. **Standalone Components** (SELECTED)
   - ✅ Smaller bundle size (better tree-shaking)
   - ✅ Simpler mental model
   - ✅ Faster compilation
   - ✅ Recommended Angular 18+ pattern
   - ❌ Team learning curve

2. **NgModule-based**
   - ✅ Familiar to team
   - ✅ More examples online
   - ❌ Larger bundle size
   - ❌ More boilerplate
   - ❌ Deprecated pattern in Angular 19+

### Rationale

Standalone components align with Angular 18 best practices:
- Better tree-shaking reduces bundle size (~10-15% reduction)
- Simpler component imports
- Future-proof (Angular moving toward standalone-first)
- Easier lazy loading

### Consequences

**Positive**:
- Smaller bundle size
- Simpler codebase
- Future-proof architecture
- Faster builds

**Negative**:
- Team learning curve
- Refactoring if migrating old components

---

## ADR-006: OnPush Change Detection Strategy

### Status: **ACCEPTED**

### Decision Date: 2026-02-25

### Context

Angular provides two change detection strategies:
- Default (checks all components on any event)
- OnPush (checks only when inputs change or events emit)

Canvas requires 60fps performance with frequent updates.

### Decision

**Selected**: OnPush change detection for all canvas components.

### Rationale

OnPush necessary for 60fps performance:
- Reduces change detection overhead
- Works well with Angular Signals (automatic reactivity)
- Explicit change detection when needed
- Aligns with performance requirements (NFR-001: 60fps)

### Consequences

**Positive**:
- Significant performance improvement
- Meets 60fps target with 1,000 objects
- Reduced CPU usage

**Negative**:
- Requires careful state management
- Developers must understand OnPush behavior

---

## ADR-007: PrimeNG UI Component Library

### Status: **ACCEPTED**

### Decision Date: 2026-02-25

### Context

Need UI component library for toolbar, panels, dialogs, forms. Stack already includes PrimeNG 18.0.2.

### Decision

**Selected**: PrimeNG for all UI components (already in stack.json).

### Alternatives Considered

1. **PrimeNG** (SELECTED)
   - ✅ Already in project dependencies
   - ✅ Comprehensive component set
   - ✅ Good Angular 18 support
   - ✅ Customizable theming
   - ❌ 50KB bundle impact (acceptable)

2. **Angular Material**
   - ✅ Google-backed
   - ✅ Material Design
   - ❌ Would add second UI library
   - ❌ Design doesn't match project

3. **Custom Components**
   - ✅ Minimal bundle size
   - ❌ Weeks of development time
   - ❌ Accessibility challenges

### Rationale

PrimeNG already in stack, proven, and adequate:
- No additional dependencies
- Good component coverage
- Acceptable bundle impact
- Team familiarity

---

## ADR-008: Jest for Unit Testing

### Status: **ACCEPTED**

### Decision Date: 2026-02-25

### Context

Need unit testing framework. Stack includes Jest 29.7.0 (already configured in stack.json).

### Decision

**Selected**: Jest for unit testing (existing choice from stack.json).

### Rationale

Jest already configured and working:
- Fast test execution with parallel runs
- Good TypeScript support
- Snapshot testing useful for canvas state
- Nx integration for affected tests

---

## ADR-009: Playwright for E2E Testing

### Status: **ACCEPTED**

### Decision Date: 2026-02-25

### Context

Need E2E testing for canvas interactions (mouse events, touch, drag/drop). Stack includes Playwright (configured in Nx).

### Decision

**Selected**: Playwright for E2E testing (existing Nx configuration).

### Rationale

Playwright ideal for canvas testing:
- Precise mouse/touch event simulation
- Cross-browser testing (Chrome, Firefox, Safari)
- Fast and reliable
- Screenshot comparison for visual regression
- Already configured in Nx workspace

---

## ADR-010: Vercel for Deployment

### Status: **ACCEPTED**

### Decision Date: 2026-02-25

### Context

Need deployment platform for Angular SPA. JAMstack approach (no backend).

### Decision

**Selected**: Vercel for production deployment.

### Alternatives Considered

1. **Vercel** (SELECTED)
   - ✅ Optimized for Next.js/Angular SPAs
   - ✅ Global CDN
   - ✅ Automatic HTTPS
   - ✅ Branch previews
   - ✅ Zero config
   - ❌ Vendor lock-in

2. **Netlify**
   - ✅ Similar features to Vercel
   - ✅ Good Angular support
   - ❌ Slightly slower builds

3. **AWS S3 + CloudFront**
   - ✅ Maximum control
   - ❌ Complex setup
   - ❌ Manual certificate management

### Rationale

Vercel provides optimal JAMstack deployment:
- Zero-config Angular deployment
- Automatic preview deployments for PRs
- Global CDN with edge caching
- Built-in CI/CD integration
- Excellent performance (automatic Brotli compression)

---

## Decision Summary Table

| ADR | Decision | Status | Impact | Reversibility |
|-----|----------|--------|--------|---------------|
| 001 | ng2-konva (primary canvas library) | ACCEPTED | High | Medium (Fabric.js fallback) |
| 002 | Angular Signals (state management) | ACCEPTED | High | Low (architectural change) |
| 003 | Client-side only (no backend) | ACCEPTED | High | High (can add backend later) |
| 004 | IndexedDB (primary storage) | ACCEPTED | Medium | Medium (LocalStorage fallback) |
| 005 | Standalone Components | ACCEPTED | Medium | Low (refactor required) |
| 006 | OnPush Change Detection | ACCEPTED | High | Medium (performance impact) |
| 007 | PrimeNG UI Library | ACCEPTED | Low | Medium (already in stack) |
| 008 | Jest (unit testing) | ACCEPTED | Low | Low (already in stack) |
| 009 | Playwright (E2E testing) | ACCEPTED | Low | Medium (already configured) |
| 010 | Vercel (deployment) | ACCEPTED | Medium | High (platform independent) |

## Evaluation Criteria

- [x] All major decisions documented with ADR format
- [x] Context and alternatives explained for each decision
- [x] Rationale clear and aligned with requirements
- [x] Consequences (positive and negative) identified
- [x] Mitigation strategies provided for negative consequences
- [x] Decisions traceable to plan phase requirements
- [x] Technology choices match stack.json constraints
- [x] Decision reversibility assessed
- [x] Impact on project timeline and cost considered

---

**Specification**: 08-architecture-decisions ✅  
**Architecture Phase**: COMPLETE ✅✅✅

All 8 architecture specifications created successfully!
