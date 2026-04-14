# Technology Stack Specification

**Generated:** 2026-01-15
**Repository:** https://github.com/buildmotion/buildmotion
**Purpose:** Comprehensive technology stack documentation for AI agents, developers, and tooling

---

## Executive Summary

The BuildMotion monorepo is an **Angular 18 + Nx 19** enterprise monorepo focused on Clean Architecture patterns for reusable Angular libraries. The stack emphasizes:

- **Modern Angular** (18.2.9) with standalone APIs and signals
- **Nx Monorepo** (19.8.4) for build orchestration and code generation
- **TypeScript** (5.5.4) with strict type checking
- **Jest** (29.7.0) for comprehensive testing
- **DataDog Integration** for production monitoring
- **NPM Publishing** with local Verdaccio testing

---

## 1. Core Framework & Runtime

### 1.1 Angular Framework

**Version:** 18.2.9 (aligned across all packages)

**Core Packages:**

```json
{
  "@angular/core": "18.2.9",
  "@angular/common": "18.2.9",
  "@angular/compiler": "18.2.9",
  "@angular/platform-browser": "18.2.9",
  "@angular/platform-browser-dynamic": "18.2.9",
  "@angular/router": "18.2.9",
  "@angular/forms": "18.2.9",
  "@angular/animations": "18.2.9"
}
```

**Key Features:**

- ✅ **Standalone APIs** - Components, directives, pipes without NgModules
- ✅ **Signals** - Modern reactive primitive (Angular 16+)
- ✅ **inject()** function - Functional dependency injection
- ✅ **Reactive Forms** - Strongly-typed forms
- ✅ **Router** - Lazy loading with loadChildren
- ✅ **Animations** - Motion and transitions

**Angular CLI:** ~16.2.10
**Compiler:** 18.2.9 (AOT compilation)
**Language Service:** 18.2.9 (IDE support)

**Compatibility Notes:**

- Angular 18 requires Node.js ^18.19.1 || ^20.11.1 || ^22.0.0
- Current Node version: 18.20.7 (.nvmrc) ✅
- Zone.js 0.14.8 (required for change detection)

---

### 1.2 Node.js Runtime

**Version:** 18.20.7 (from .nvmrc)

**Rationale:**

- LTS (Long Term Support) version
- Compatible with Angular 18.2.9
- Security updates through October 2025

**Package Manager:** Yarn (v1.x based on yarn.lock)

**Alternative Package Managers:**

- NPM supported (package-lock.json present)
- PNPM not configured

**Registry Configuration:**

- Default: https://registry.yarnpkg.com
- Local: Verdaccio 5.0.4 (.npmrc.local)
- Switchable: `yarn registry:npmjs` / `yarn registry:yarnpkg`

---

### 1.3 TypeScript

**Version:** 5.5.4

**Compiler Configuration (tsconfig.base.json):**

```json
{
  "target": "es2015",
  "module": "esnext",
  "lib": ["es2017", "dom"],
  "moduleResolution": "node",
  "experimentalDecorators": true,
  "emitDecoratorMetadata": true,
  "importHelpers": true,
  "sourceMap": true,
  "skipLibCheck": true,
  "removeComments": true
}
```

**Key Features Used:**

- ✅ **Decorators** - Angular classes and DI
- ✅ **Strict Mode** - Type safety
- ✅ **Path Aliases** - @buildmotion/\* imports
- ✅ **Source Maps** - Debugging support
- ✅ **Import Helpers** - tslib for code reuse

**Type Definitions:**

- @types/node ^18.16.9
- @types/jest 29.5.14

---

## 2. Monorepo & Build System

### 2.1 Nx Workspace

**Version:** 19.8.4 (aligned across all packages)

**Workspace Type:** Integrated Monorepo

- Apps: 1 (buildmotion-docs)
- Libraries: 17 (all publishable)

**Nx Packages:**

```json
{
  "@nx/angular": "19.8.4",
  "@nx/js": "19.8.4",
  "@nx/node": "19.8.4",
  "@nx/plugin": "19.8.4",
  "@nx/jest": "19.8.4",
  "@nx/linter": "19.8.4",
  "@nx/eslint-plugin": "19.8.4",
  "@nx/workspace": "19.8.4"
}
```

**Key Features:**

- ✅ **Computation Caching** - Build, test, lint caching
- ✅ **Affected Commands** - Only build/test changed code
- ✅ **Dependency Graph** - Visualize project dependencies
- ✅ **Code Generators** - Schematics for consistency
- ✅ **Task Orchestration** - Parallel execution
- ✅ **Nx Cloud** - Distributed caching (configured)

**Build Executors:**

1. **@nx/angular:package** (12 libraries)

   - Uses ng-packagr 18.2.1
   - Generates Angular Package Format (APF)
   - Outputs: ESM2022, FESM2022, types, metadata

2. **@nx/js:tsc** (5 libraries)
   - Direct TypeScript compilation
   - Lighter weight, framework-agnostic
   - Faster builds for non-Angular libs

**Cache Configuration:**

- Inputs: `production` (source files + production assets)
- Outputs: `dist/libs/{name}`
- Cache Location: `.nx/cache`

---

### 2.2 Build Tooling

**Angular Build System:**

- **@angular-devkit/build-angular** 18.2.9
- **ng-packagr** 18.2.1 (library packaging)

**Compilation:**

- **SWC** (Speedy Web Compiler)

  - @swc/core ~1.5.7
  - @swc-node/register ~1.9.1
  - Fast TypeScript/JavaScript compilation
  - Used for development and builds

- **ts-node** 10.9.1
  - TypeScript execution for Node.js
  - Used for build scripts and tooling

**CSS Processing:**

- **PostCSS** ^8.4.5
- **autoprefixer** ^10.4.0
- **postcss-preset-env** ~7.5.0
- **postcss-import** ~14.1.0
- **postcss-url** ~10.1.3

**Styling Strategy:**

- CSS (default per nx.json generators)
- Component-scoped styles
- Global styles in applications

---

## 3. State Management & Data Flow

### 3.1 Reactive Programming

**RxJS:** 7.8.1

**Usage Patterns:**

- ✅ **HTTP responses** - Observable-based
- ✅ **Event streams** - User interactions, state changes
- ✅ **Async operations** - Data fetching, side effects
- ✅ **Operators** - map, filter, switchMap, catchError, etc.

**Libraries Using RxJS:**

- `@buildmotion/http-service` - Observable HTTP client
- `@buildmotion/actions` - Action results as Observables
- All Angular services

---

### 3.2 Angular Signals (Modern Approach)

**Version:** Built into Angular 18.2.9

**Usage Patterns:**

- ✅ **Component State** - Local reactive state
- ✅ **Computed Values** - Derived state
- ✅ **Effects** - Side effects from signal changes
- ✅ **HTTP Services** - `@buildmotion/http-service-signals`

**Libraries Using Signals:**

- `@buildmotion/http-service-signals` - Signal-based HTTP
- `@buildmotion/inactivity-monitor` - Activity tracking
- `@buildmotion/state-machine` - Workflow state

**Migration Strategy:**

- Observable-based code remains supported
- New features prefer Signals where appropriate
- Hybrid approach: RxJS for async, Signals for state

---

### 3.3 State Machine (Workflow State)

**Library:** `@buildmotion/state-machine`

**Purpose:**

- Multi-step forms
- Wizard workflows
- Reactive form state management
- XState/Stately-inspired, Angular-first

**Not Used:**

- NgRx (Redux pattern) - Not present
- Akita - Not present
- Elf - Not present

**Rationale:** BuildMotion uses service-based state management with RxJS/Signals rather than global store patterns.

---

## 4. UI Framework & Styling

### 4.1 UI Component Library

**Status:** Not detected in dependencies

**Common Options (not currently used):**

- Angular Material - Not present
- PrimeNG - Not present
- Ng-Bootstrap - Not present
- Custom components only

**Observation:** Repository provides foundational libraries for building applications but doesn't prescribe a specific UI framework. Consumer applications choose their own UI library.

---

### 4.2 Styling Approach

**Strategy:** Component-scoped CSS

**Configuration:**

- Default style: CSS (nx.json generators)
- PostCSS processing enabled
- Autoprefixer for browser compatibility

**No CSS Framework Detected:**

- Tailwind CSS - Not present
- Bootstrap - Not present
- Sass/SCSS - Supported but not default

**Rationale:** Keeps libraries lightweight and allows consumer applications to choose their styling approach.

---

## 5. Backend & API Integration

### 5.1 Backend Presence

**Status:** No backend framework in main repository

**Observation:**

- No NestJS packages
- No Express/Koa
- No GraphQL packages
- No database ORM (TypeORM, Prisma, etc.)

**Rationale:** BuildMotion focuses on frontend Angular libraries. Backend integration is handled through HTTP services that connect to any REST API.

---

### 5.2 HTTP Client

**Built-in:** Angular HttpClient (from @angular/common/http)

**Wrappers:**

1. **@buildmotion/http-service** (Observable-based)

   - Extends HttpServiceBase
   - Logging and error handling integrated
   - Retry logic, timeout handling

2. **@buildmotion/http-service-signals** (Signal-based)
   - Modern Signal API
   - Same features as Observable version
   - Better for component-local state

**Authentication:**

- Token interceptors provided (configurable)
- `localStorage.getItem('AUTH_TOKEN')` pattern
- No hardcoded auth (uses configuration)

---

### 5.3 Data Validation

**Schema Validation:**

- **Zod** ^4.1.11 - Schema validation library
- Used in `@buildmotion/zod-rules-engine`

**Rules Engines:**

1. **@buildmotion/rules-engine** - Classic imperative rules
2. **@buildmotion/zod-rules-engine** - Reactive schema validation
3. **@buildmotion/validation** - Form validators

**API Contract Validation:**

- DTOs with TypeScript interfaces
- Runtime validation with Zod schemas
- ApiResponse<T> wrapper for consistent error handling

---

## 6. Testing Framework

### 6.1 Jest Testing

**Version:** 29.7.0

**Jest Packages:**

```json
{
  "jest": "29.7.0",
  "jest-preset-angular": "14.1.1",
  "ts-jest": "29.1.1",
  "jest-environment-jsdom": "29.7.0",
  "jest-environment-node": "29.7.0",
  "@types/jest": "29.5.14"
}
```

**Configuration:**

- Root: `jest.config.ts`, `jest.preset.js`
- Per-library: `libs/{name}/jest.config.ts`
- Coverage: `coverage/libs/{name}`

**Test Environments:**

- **jsdom** - Browser-like DOM for components
- **node** - Node.js environment for utilities

**Features:**

- ✅ **Parallel Execution** - Fast test runs
- ✅ **Watch Mode** - Interactive testing
- ✅ **Coverage Reports** - Code coverage tracking
- ✅ **Snapshot Testing** - UI regression detection
- ✅ **Mocking** - Jasmine-style spies and mocks

---

### 6.2 E2E Testing

**Status:** No E2E framework configured

**Evidence:**

- nx.json generators: `e2eTestRunner: "none"`
- No Cypress packages
- No Playwright packages
- No Protractor (deprecated)

**Rationale:** Library-focused repository doesn't require E2E tests. Consumer applications implement their own E2E testing.

---

### 6.3 Testing Utilities

**Mocks Provided:**

- `LoggingServiceMock` - Mock logging service
- `ConfigurationServiceMock` - Mock configuration
- TestBed for Angular component testing

**Testing Patterns:**

- Arrange-Act-Assert (AAA)
- Given-When-Then for BDD
- Isolated unit tests with mocks

---

## 7. Code Quality & Linting

### 7.1 ESLint

**Version:** 8.57.1

**ESLint Packages:**

```json
{
  "eslint": "8.57.1",
  "@typescript-eslint/eslint-plugin": "7.18.0",
  "@typescript-eslint/parser": "7.18.0",
  "@angular-eslint/eslint-plugin": "18.4.3",
  "@angular-eslint/eslint-plugin-template": "18.4.3",
  "@angular-eslint/template-parser": "18.4.3",
  "eslint-config-prettier": "9.0.0",
  "jsonc-eslint-parser": "2.1.0"
}
```

**Rules:**

- ✅ **@nx/enforce-module-boundaries** - Architecture enforcement
- ✅ **TypeScript ESLint** - TypeScript-specific rules
- ✅ **Angular ESLint** - Angular best practices
- ✅ **Template Linting** - HTML template validation
- ✅ **Prettier Integration** - No conflicts with formatting

**Configuration:**

- Root: `.eslintrc.json`
- Overrides by file type (_.ts, _.js, _.tsx, _.jsx)

---

### 7.2 Prettier

**Version:** 2.6.2

**Configuration:** `.prettierrc`

**Integration:**

- ESLint + Prettier via `eslint-config-prettier`
- Format on save (recommended)
- Pre-commit hooks (recommended to add)

**Note:** Prettier 2.x is stable. Consider upgrade to 3.x for performance improvements.

---

### 7.3 Git Hooks (Recommended)

**Status:** Not detected in repository

**Recommendations:**

- **Husky** - Git hooks management
- **lint-staged** - Run linters on staged files
- **commitlint** - Enforce commit message format

**Rationale:** Improves code quality by catching issues before commit.

---

## 8. Monitoring & Observability

### 8.1 DataDog Integration

**Packages:**

```json
{
  "@datadog/browser-logs": "^4.13.0",
  "@datadog/browser-rum": "^4.13.0"
}
```

**Features:**

- ✅ **Real User Monitoring (RUM)** - Performance tracking
- ✅ **Browser Logs** - Centralized logging
- ✅ **Error Tracking** - Automatic error capture
- ✅ **Session Replay** - User interaction replay

**Integration:**

- `@buildmotion/logging` library provides DataDog writer
- Configuration via `provideDatadogWriter()`
- Environment-based configuration (dev/staging/prod)

---

### 8.2 Logging Service

**Library:** `@buildmotion/logging`

**Features:**

- Structured logging with context
- Severity levels (Debug, Information, Warning, Error, Critical)
- Multiple log writers (console, DataDog)
- Configurable per environment

**Pattern:**

```typescript
import { LoggingService, Severity } from '@buildmotion/logging';

this.logger.log('User action', Severity.Information, {
  userId: user.id,
  action: 'login',
});
```

---

### 8.3 Error Handling

**Library:** `@buildmotion/error-handling`

**Features:**

- Standardized error models
- Error context capture
- Integration with logging

**API Response Structure:**

- `ApiResponse<T>` from `@buildmotion/core`
- `ApiMessage` for error details
- `ApiMessageType` enum

---

## 9. Deployment & Build Artifacts

### 9.1 Build Outputs

**Library Builds:**

- Location: `dist/libs/{name}`
- Format: Angular Package Format (APF) for Angular libs
- Format: CommonJS + ESM for JS-only libs

**Package Structure:**

```
dist/libs/{name}/
├── esm2022/          # ES modules (Angular v13+)
├── fesm2022/         # Flat ES modules
├── index.d.ts        # TypeScript declarations
├── package.json      # Published package.json
└── README.md         # Published README
```

---

### 9.2 NPM Publishing

**Scope:** @buildmotion

**Published Libraries:** All 17 libraries

**Publishing Process:**

1. **Version:** `yarn libs:version` (semantic versioning)
2. **Build:** `yarn libs:build` (production builds)
3. **Publish:** `yarn libs:publish` (NPM registry)

**Local Testing:**

- **Verdaccio** 5.0.4 (local NPM registry)
- `.npmrc.local` for local registry config
- Test packages before public publish

**Registry URLs:**

- Production: https://registry.npmjs.org/
- Local: http://localhost:4873/ (Verdaccio)

---

### 9.3 Deployment Platform

**Status:** Not specified in repository

**Hints:**

- Repository is library-focused (not application deployment)
- Consumer applications handle their own deployment
- Documentation site (Docusaurus) can deploy to any static host

**Common Deployment Targets (for consumers):**

- Vercel, Netlify - Static apps
- AWS S3 + CloudFront - Static hosting
- Azure Static Web Apps - Microsoft stack
- Docker + Kubernetes - Containerized

**Note:** Repository does not enforce or configure deployment. Consumer responsibility.

---

## 10. Development Workflow

### 10.1 Local Development

**Prerequisites:**

- Node.js 18.20.7 (via nvm: `nvm use`)
- Yarn package manager
- Git

**Setup:**

```bash
# Clone repo
git clone https://github.com/buildmotion/buildmotion.git

# Install dependencies
yarn install

# Build all libraries
yarn libs:build

# Run tests
yarn test

# Lint code
yarn lint
```

**Common Commands:**

```bash
yarn start              # Serve application (if applicable)
yarn libs:build         # Build all libraries
yarn test               # Run all tests
yarn test:coverage      # Generate coverage reports
yarn lint               # Lint all projects
yarn format             # Format and fix linting
nx dep-graph            # Visualize dependencies
```

---

### 10.2 CI/CD Integration

**Nx Cloud:** Configured with access token

**CI Features:**

- ✅ **Computation Caching** - Share cache across CI runs
- ✅ **Affected Commands** - Only test/build changed code
- ✅ **Distributed Task Execution** - Parallel CI jobs

**Recommended CI Checks:**

1. `yarn lint` - Linting
2. `yarn test` - Unit tests
3. `yarn test:coverage` - Coverage reports
4. `yarn libs:build` - Build all libraries
5. `nx affected:test` - Test only affected projects

**CI Configuration:**

- GitHub Actions (recommended based on repo hosting)
- Azure Pipelines (if using Azure DevOps)
- GitLab CI (if using GitLab)

---

### 10.3 Code Generation

**Nx Generators:**

- `@nx/angular:application` - Create Angular app
- `@nx/angular:library` - Create Angular library
- `@nx/angular:component` - Create component

**Configuration (nx.json):**

```json
{
  "@nx/angular:application": {
    "style": "css",
    "linter": "eslint",
    "unitTestRunner": "jest",
    "e2eTestRunner": "none"
  },
  "@nx/angular:library": {
    "linter": "eslint",
    "unitTestRunner": "jest"
  }
}
```

**Custom Generators:**

- Location: `/tools/generators/` (if present)
- Potential for BuildMotion-specific schematics

---

## 11. Repository Hosting & Collaboration

### 11.1 Git Repository

**Hosting:** GitHub
**URL:** https://github.com/buildmotion/buildmotion

**Branch Strategy:**

- Main branch: `main`
- Affected base: `main` (nx.json)
- Feature branches: (convention not specified)

---

### 11.2 Package Registry

**Public:** https://registry.npmjs.org/
**Scope:** @buildmotion
**Local Testing:** Verdaccio 5.0.4

---

### 11.3 Documentation

**Docusaurus Site:** `/apps/buildmotion-docs`
**Specifications:** `.spec-motion/` directory
**Copilot Instructions:** `.github/copilot/` directory

---

## 12. Baseline Defaults (When Evidence Missing)

### 12.1 Not Present in Repo

The following are **NOT present** and are noted as baseline defaults for awareness:

❌ **No GraphQL** - REST APIs only
❌ **No NestJS** - No backend framework
❌ **No Database ORM** - No data persistence layer
❌ **No UI Component Library** - Consumer chooses
❌ **No State Management Library** - Service-based only
❌ **No E2E Testing** - Library focus, no E2E
❌ **No Docker** - No containerization config
❌ **No CI Configuration Files** - GitHub Actions recommended
❌ **No Conventional Commits** - Recommended to add

---

## 13. Technology Decision Matrix

### When to Use What

| Scenario                       | Recommendation       | Library/Tool                        |
| ------------------------------ | -------------------- | ----------------------------------- |
| **HTTP calls (existing code)** | Observable-based     | `@buildmotion/http-service`         |
| **HTTP calls (new code)**      | Signal-based         | `@buildmotion/http-service-signals` |
| **Form validation**            | Zod schemas          | `@buildmotion/zod-rules-engine`     |
| **Business rules (complex)**   | Classic rules        | `@buildmotion/rules-engine`         |
| **Business use cases**         | Actions              | `@buildmotion/actions`              |
| **Component state**            | Signals              | Angular Signals API                 |
| **Async streams**              | Observables          | RxJS                                |
| **Logging**                    | LoggingService       | `@buildmotion/logging`              |
| **Configuration**              | ConfigurationService | `@buildmotion/configuration`        |
| **Multi-step forms**           | State machine        | `@buildmotion/state-machine`        |
| **Session timeout**            | Inactivity monitor   | `@buildmotion/inactivity-monitor`   |

---

## 14. Stack Evolution & Upgrades

### Current Version Status

| Technology | Current | Latest   | Status              |
| ---------- | ------- | -------- | ------------------- |
| Angular    | 18.2.9  | 18.2.x   | ✅ Latest patch     |
| Nx         | 19.8.4  | 19.x.x   | ✅ Recent           |
| TypeScript | 5.5.4   | 5.6.x    | ✅ Recent           |
| Jest       | 29.7.0  | 29.7.x   | ✅ Latest           |
| RxJS       | 7.8.1   | 7.8.x    | ✅ Latest           |
| Node.js    | 18.20.7 | 18.x LTS | ✅ Latest LTS       |
| Zod        | 4.1.11  | 4.x      | ✅ Recent           |
| Prettier   | 2.6.2   | 3.x      | 🔶 Consider upgrade |

### Upgrade Path

**Angular 19 (Future):**

- Monitor Angular 19 release
- Review breaking changes
- Test with Nx 20+ compatibility
- Update generator defaults

**Nx 20 (Future):**

- Align with Angular version
- Review new features (inferred tasks, module federation improvements)
- Update build configuration

**TypeScript 5.6+ (Future):**

- Monitor Angular/Nx compatibility
- Test incremental builds
- Review new language features

---

## 15. Stack Strengths & Observations

### ✅ Strengths

1. **Version Alignment** - All Angular and Nx packages aligned
2. **Modern Patterns** - Signals, standalone components, inject()
3. **Comprehensive Testing** - Jest configured for all libraries
4. **Production Ready** - DataDog integration for monitoring
5. **Clean Architecture** - Clear separation of concerns
6. **Developer Experience** - Strong typing, linting, formatting
7. **NPM Publishing** - Complete versioning and publishing workflow
8. **Local Testing** - Verdaccio for testing before public release

### 🔶 Opportunities

1. **Prettier 3.x Upgrade** - Improved performance
2. **Git Hooks** - Add Husky + lint-staged
3. **Conventional Commits** - Enforce commit format
4. **Bundle Analysis** - Add webpack-bundle-analyzer
5. **CI Configuration** - Add GitHub Actions workflows
6. **E2E Testing** - Add Playwright or Cypress for apps (if needed)

---

**End of Technology Stack Specification**

**Last Updated:** 2026-01-15
**Review Cadence:** Quarterly or on major version bumps
**Owner:** Build Motion Architecture Team
**Contact:** matt.vaughn@buildmotion.ai
