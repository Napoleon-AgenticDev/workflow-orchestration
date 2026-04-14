---
meta:
  id: brief
  title: Brief
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'

meta:
meta:
---

# Agent Alchemy Angular Standards Brief

## Overview

This brief defines the strategy for creating reusable **Agent Alchemy specification documents** for Angular UI patterns and behaviors. These specifications will serve as AI-readable blueprints that enable consistent implementation of common Angular features across projects.

## Purpose

Agent Alchemy specifications transform the **software development lifecycle (SDLC)** by providing **AI-driven specifications** that serve as the foundation and context layer for AI agents (GitHub Copilot, VS Code MCP, Cursor, Claude, etc.) to generate **code, documentation, tests, and deployment artifacts** with greater accuracy and consistency.

Instead of developers manually interpreting requirements or tribal standards, Agent Alchemy introduces a system of **structured specification documents** that capture Angular-specific patterns and become the **single source of truth** for AI agents.

## Target Angular Features for Specification

### 1. Light and Dark Mode Switching

**Specification Goal**: Create reusable Angular service-based theme management with reactive state, localStorage persistence, and SSR compatibility.

**Key Components**:

- `ThemeService` with BehaviorSubject state management
- Document class manipulation for CSS theme switching
- Platform detection for SSR compatibility
- localStorage persistence with fallback handling
- Component integration patterns with reactive subscriptions

### 2. Hamburger Menu and Responsive Navigation

**Specification Goal**: Create reusable Angular mobile menu service with accessibility, keyboard navigation, and responsive behavior.

**Key Components**:

- `MobileMenuService` with reactive open/close state
- Angular event binding patterns for menu interactions
- Accessibility attributes (aria-expanded, aria-label)
- Outside click detection with HostListener
- Keyboard navigation (Escape key handling)
- Responsive CSS classes with Tailwind integration

## Agent Alchemy Framework Integration

### How It Works

1. **Authoring/Generation** – Agent Alchemy generates Angular specification files from this brief, existing implementations, and templates
2. **Contextualization** – AI agents retrieve and use these specs as context when implementing Angular features
3. **Automation** – Nx generators and workflows automate Angular component/service scaffolding using these specs
4. **Continuous Learning** – Specs evolve alongside Angular projects, becoming **institutional memory** for Angular architecture patterns

### Specification Document Structure

Each Angular feature specification will include:

- **`*.specification.md`** - Complete technical specification with Angular patterns, service architecture, and implementation details
- **`*.instructions.md`** - AI agent instructions for implementing the specification with **complete, production-ready code samples** from the current BuildMotion AI Agency implementation. These instructions must include:
  - **Full service implementations** with all methods, error handling, and TypeScript types
  - **Complete component code** with lifecycle hooks, dependency injection, and reactive subscriptions
  - **Full HTML templates** with Angular event binding, property binding, and accessibility attributes
  - **CSS/SCSS snippets** with Tailwind classes and responsive design patterns
  - **Import statements and dependency setup** for proper Angular module configuration
  - **Testing examples** with service mocking and component testing patterns
  - **Implementation validation steps** with specific commands and expected outcomes
- **`*.prompt.md`** - Reusable prompt template for generating implementations from the specification across different projects

### Code Sample Requirements for Instructions

The `*.instructions.md` files must provide **explicit, copy-pasteable code examples** rather than conceptual descriptions. Each instruction file should include:

#### Service Implementation Examples

- Complete TypeScript service classes with all methods implemented
- Error handling patterns and edge case management
- RxJS operators and subscription management
- Platform-specific code (SSR compatibility, browser APIs)
- localStorage/sessionStorage integration patterns

#### Component Integration Examples

- Full component TypeScript files with proper imports and lifecycle
- Constructor injection patterns for services
- Reactive property declarations and subscription handling
- Event handler method implementations
- HostListener patterns for accessibility and UX

#### Template Implementation Examples

- Complete HTML templates with Angular directives
- Property binding examples with TypeScript expressions
- Event binding patterns with method references
- Conditional rendering with structural directives
- Accessibility attribute binding patterns

#### Styling Implementation Examples

- Tailwind CSS class combinations for responsive design
- SCSS integration patterns for component styles
- Dark mode CSS variable usage and theme switching
- Animation and transition implementations

#### Testing Implementation Examples

- Service unit tests with mocked dependencies
- Component testing with fixture setup and DOM interaction
- Integration test patterns for service-component interaction
- Accessibility testing examples with screen reader simulation

### Goals

- **Consistency**: Enforce Angular reactive patterns and service architecture across teams
- **Acceleration**: Reduce time from UI mockup → production Angular components
- **Context Engineering**: Give AI the exact Angular context it needs to generate proper TypeScript/RxJS code
- **Scalability**: Make Angular UI specifications reusable across features, projects, and clients
- **Knowledge Capture**: Prevent Angular anti-patterns by embedding best practices into living specifications

## Implementation Context from Current Project

The specifications will be based on the proven implementation patterns from the BuildMotion AI Agency project. **All `*.instructions.md` files must include the complete, working code from these implementations** to provide explicit, copy-pasteable examples for AI agents.

### Required Source Code References

The instruction files must extract and include complete code samples from these current implementation files:

- **`/libs/agency/brochure/src/lib/services/theme.service.ts`** - Full ThemeService implementation
- **`/libs/agency/brochure/src/lib/services/mobile-menu.service.ts`** - Complete MobileMenuService implementation
- **`/libs/agency/brochure/src/lib/default/default.component.ts`** - Full component integration patterns
- **`/libs/agency/brochure/src/lib/default/default.component.html`** - Complete template implementation
- **`/apps/agency/tailwind.config.js`** - Tailwind configuration with dark mode setup
- **`/apps/agency/src/styles.scss`** - SCSS integration and Tailwind imports

### Theme Service Pattern

```typescript
// Reactive service with BehaviorSubject
export class ThemeService {
  private themeSubject = new BehaviorSubject<'light' | 'dark'>('light');
  public theme$ = this.themeSubject.asObservable();
  // localStorage persistence, document class manipulation, SSR handling
}
```

**Note**: The `*.instructions.md` files must include the **complete implementation** from the actual source files, not just these conceptual examples.

### Mobile Menu Service Pattern

```typescript
// Simple reactive state management
export class MobileMenuService {
  private isOpenSubject = new BehaviorSubject<boolean>(false);
  public isOpen$ = this.isOpenSubject.asObservable();
  // toggle(), open(), close() methods
}
```

**Note**: The `*.instructions.md` files must include the **full service code** with all method implementations and TypeScript typing.

### Component Integration Pattern

```typescript
// Proper Angular lifecycle and reactive subscriptions
export class Component implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  // Reactive properties bound to template
  // Service injection and subscription management
  // HostListener patterns for accessibility
}
```

**Note**: The `*.instructions.md` files must include the **complete component implementation** with all lifecycle hooks, event handlers, and subscription management.

### Template Binding Pattern

```html
<!-- Angular event binding instead of inline JavaScript -->
<button (click)="onToggleTheme()" [attr.aria-pressed]="isDarkMode">
  <!-- Reactive CSS classes with Angular property binding -->
  <div [class.hidden]="!isMobileMenuOpen"></div>
</button>
```

**Note**: The `*.instructions.md` files must include the **full HTML template sections** with complete Angular directives and accessibility attributes.

## Specification Creation Strategy

### Input Requirements for Prompt Generation

1. **Product Brief Context** - Feature requirements and user experience goals
2. **Angular Architecture Patterns** - Service-based reactive architecture
3. **Accessibility Standards** - ARIA attributes, keyboard navigation, screen reader support
4. **CSS Framework Integration** - Tailwind CSS utility classes and responsive patterns
5. **Testing Strategies** - Unit tests for services, component testing for UI interactions

### Output Deliverables

1. **`angular-theme-switching.specification.md`** - Complete technical specification for theme management
2. **`angular-theme-switching.instructions.md`** - AI instructions for implementing theme switching
3. **`angular-theme-switching.prompt.md`** - Reusable prompt template for theme feature generation
4. **`angular-responsive-navigation.specification.md`** - Complete specification for mobile menu patterns
5. **`angular-responsive-navigation.instructions.md`** - AI instructions for navigation implementation
6. **`angular-responsive-navigation.prompt.md`** - Reusable prompt template for navigation generation

## End Vision

These Angular specifications become the **DNA of Angular projects**:

- AI-readable, human-approvable Angular blueprints that drive reactive component generation
- Integrated into Angular CLI, Nx generators, and IDE tooling
- Foundation for **Cognitive Flow Angular Development** where AI agents collaborate to deliver production-ready Angular features faster and more reliably than traditional manual coding

The specifications will enable any AI agent to generate consistent, accessible, and properly architected Angular UI features by following proven reactive patterns and service-based architecture principles.
