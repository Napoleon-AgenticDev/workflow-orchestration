# BuildMotion Repository Inventory

**Generated:** 2026-01-15
**Repository:** https://github.com/buildmotion/buildmotion
**Status:** Complete monorepo scan

---

## 1. Nx Workspace Configuration

### Nx Version & Workspace Type
- **Nx Version:** 19.8.4
- **Workspace Type:** Integrated Monorepo (apps + libs structure)
- **Package Manager:** Yarn (yarn.lock present, with .npmrc.local for local registry)
- **Node Version:** 18.20.7 (from .nvmrc)
- **Private Workspace:** Yes

### Workspace Name
- **Name:** buildmotion
- **Workspace Version:** 15.9.8

### Nx Configuration (nx.json)
- **Default Base Branch:** main
- **Cache Enabled:** All targets (build, lint, test, e2e, @nx/js:tsc, @nx/angular:package)
- **Target Defaults:**
  - `build`: Depends on `^build`, inputs from production, caching enabled
  - `lint`: Inputs from ESLint config and defaults, caching enabled
  - `test`: Caching enabled
  - `e2e`: Caching enabled
  - `@nx/js:tsc`: Depends on `^build`, caching enabled
  - `@nx/angular:package`: Depends on `^build`, caching enabled

### Generator Configuration
- **@nx/angular:application:** CSS, eslint, Jest, no e2e
- **@nx/angular:library:** eslint, Jest
- **@nx/angular:component:** CSS

---

## 2. Libraries & Apps Inventory

### Apps (1)
| Name | Path | Type | Purpose |
|------|------|------|---------|
| buildmotion-docs | `/apps/buildmotion-docs` | Docusaurus Documentation Site | Documentation, guides, workshops |

### Libraries (17)

#### Core & Foundation (4)
| Name | Path | Build Executor | Publishable |
|------|------|----------------|-------------|
| actions | `/libs/actions` | @nx/js:tsc | Yes |
| core | `/libs/core` | @nx/js:tsc | Yes |
| foundation | `/libs/foundation` | @nx/angular:package | Yes |
| state-machine | `/libs/state-machine` | @nx/js:tsc | Yes |

#### HTTP & Networking (2)
| Name | Path | Build Executor | Publishable |
|------|------|----------------|-------------|
| http-service | `/libs/http-service` | @nx/angular:package | Yes |
| http-service-signals | `/libs/http-service-signals` | @nx/angular:package | Yes |

#### Business Logic & Validation (4)
| Name | Path | Build Executor | Publishable |
|------|------|----------------|-------------|
| common | `/libs/common` | @nx/angular:package | Yes |
| rules-engine | `/libs/rules-engine` | @nx/js:tsc | Yes |
| validation | `/libs/validation` | @nx/angular:package | Yes |
| zod-rules-engine | `/libs/zod-rules-engine` | @nx/js:tsc | Yes |

#### Cross-Cutting Concerns (7)
| Name | Path | Build Executor | Publishable |
|------|------|----------------|-------------|
| configuration | `/libs/configuration` | @nx/angular:package | Yes |
| error-handling | `/libs/error-handling` | @nx/angular:package | Yes |
| feature-flag | `/libs/feature-flag` | @nx/angular:package | Yes |
| inactivity-monitor | `/libs/inactivity-monitor` | @nx/angular:package | Yes |
| logging | `/libs/logging` | @nx/angular:package | Yes |
| notifications | `/libs/notifications` | @nx/angular:package | Yes |
| version-check | `/libs/version-check` | @nx/angular:package | Yes |

---

## 3. Project Targets & Build Configuration

### Standard Targets Across Libraries
All libraries implement the following targets:

| Target | Executor | Purpose | Outputs |
|--------|----------|---------|---------|
| build | @nx/js:tsc or @nx/angular:package | Compile TypeScript to distribution | dist/libs/{name} |
| lint | @nx/linter:eslint | Code linting | Optional lint report |
| test | @nx/jest:jest | Unit testing | coverage/libs/{name} |
| version | @buildmotion/cli:version-library | Semantic versioning | Updated package.json |
| publish | @buildmotion/cli:publish-package | NPM publishing | Published package |

### Build Types
- **Angular Packaged Libraries** (12): use `@nx/angular:package` with ng-packagr
  - Config: ng-package.json files
  - TypeScript configs: tsconfig.lib.json, tsconfig.lib.prod.json
- **JS/TSC Libraries** (5): use `@nx/js:tsc`
  - Lighter weight, framework-agnostic
  - Direct TypeScript compilation

### Dependency Management
- **Build Dependencies:** `dependsOn: ["^build"]` enforces dependency graph
- **Input Caching:** Production inputs for optimized builds
- **Parallel Execution:** Enabled by default in package.json scripts

---

## 4. Tags and Enforceable Boundaries

### ESLint Configuration (.eslintrc.json)
- **Root Config:** true
- **ESLint Version:** 8.57.1
- **Plugin:** @nx/eslint/plugin

### Module Boundary Enforcement
```json
{
  "rule": "@nx/enforce-module-boundaries",
  "config": {
    "enforceBuildableLibDependency": true,
    "allow": [],
    "depConstraints": [
      {
        "sourceTag": "*",
        "onlyDependOnLibsWithTags": ["*"]
      }
    ]
  }
}
```

**Current State:** No tag-based restrictions; all dependencies allowed. Buildable lib dependency enforcement active.

**Observation:** Opportunity for structured dependency management with domain tags (core, infrastructure, presentation, cross-cutting).

---

## 5. Tooling Configuration

### Package Manager
- **Primary:** Yarn (yarn.lock present)
- **Local Registry:** Verdaccio 5.0.4 configured via .npmrc.local
- **Scripts:** Registry switching commands available

### TypeScript Strategy
- **TypeScript Version:** 5.5.4
- **Base Config:** tsconfig.base.json (target: es2015, module: esnext)
- **Path Aliases:** 17 registered aliases for @buildmotion/* packages
- **Compiler Features:**
  - Experimental decorators enabled
  - Emit decorator metadata enabled
  - Source maps enabled
  - Import helpers enabled

### Testing
- **Jest:** 29.7.0
- **jest-preset-angular:** 14.1.1
- **Coverage:** Configured per-library in coverage/libs/{name}
- **Environments:** jsdom (for browser) and node

### Linting & Formatting
- **ESLint:** 8.57.1
  - @angular-eslint 18.4.3
  - @typescript-eslint 7.18.0
- **Prettier:** 2.6.2
- **ESLint + Prettier Integration:** Via eslint-config-prettier 9.0.0

---

## 6. Primary Frameworks Present

### Frontend Framework
- **Angular:** 18.2.9
  - Core, Common, Router, Forms, Animations
  - Platform Browser & Dynamic
  - Angular CLI ~16.2.10
  - Angular Compiler CLI 18.2.9
  - ng-packagr 18.2.1 (library packaging)

### Build & Monorepo Management
- **Nx:** 19.8.4
  - @nx/angular, @nx/js, @nx/node, @nx/plugin
  - @nx/jest, @nx/linter, @nx/eslint-plugin, @nx/workspace

### State Management & Utilities
- **RxJS:** 7.8.1 (reactive programming)
- **Zone.js:** 0.14.8 (Angular change detection)
- **Zod:** 4.1.11 (schema validation)
- **guid-typescript:** 1.0.9 (GUID generation)

### Monitoring & Observability
- **Datadog:**
  - @datadog/browser-logs 4.13.0
  - @datadog/browser-rum 4.13.0

### Additional Frameworks
- **NestJS:** Not present in dependencies (Angular-focused monorepo)
- **Documentation:** Docusaurus (app present in /apps/buildmotion-docs)

---

## 7. Existing Documentation Conventions

### Root-Level Documentation
- ✅ **README.md** - Main project overview
- ✅ **setup.md** - Setup and installation instructions
- ✅ **DOCUSAURUS_IMPLEMENTATION.md** - Documentation framework guide
- ✅ **LICENSE** - MIT license

### Library Documentation
- ✅ Every library has its own **README.md** (17 files)
- ✅ Located at `/libs/{library-name}/README.md`

### App Documentation
- ✅ `/apps/buildmotion-docs/README.md` - Docusaurus site
- ✅ `/docs/buildmotion-copilot/README.md` - Copilot guide
- ✅ `/docs/github-copilot/README.md` - GitHub Copilot integration

### Specification Documentation
- ✅ **`.spec-motion/`** directory - 16 library specifications + 1 architecture spec
  - Clean Architecture specification
  - Individual library specifications
  - Comprehensive, AI-friendly format

### GitHub Copilot Integration
- ✅ **`.github/copilot/`** directory - Custom instructions with YAML front matter
  - architecture.md
  - services.md
  - components.md
  - business-rules.md
  - http-data-access.md
  - cross-cutting-concerns.md
  - inactivity-monitor.md
  - testing.md
  - README.md (index)
  - QUICK_REFERENCE.md

### Missing Documentation
- ❌ **NO CONTRIBUTING.md** - No contribution guidelines
- ❌ **NO ADR (Architecture Decision Records)** - No decision log
- ❌ **NO CHANGELOG.md** - No change tracking at root (may be in individual packages)

### Additional Resources
- 📁 **notes/** directory - External notes/references
- 📁 **.migrations/** directory - Migration records
- 📄 **migrations.json** - Migration tracking

### Companion Projects
- 📁 **dotnet/** directory - .NET companion libraries
  - `/dotnet/rules-engine/` - .NET rules engine
  - `/dotnet/workflow/` - Workflow engine

---

## 8. Key Observations

### Strengths
1. ✅ **Mature Monorepo:** 17 well-structured libraries with consistent patterns
2. ✅ **Enterprise Focus:** CLEAN architecture, cross-cutting concerns
3. ✅ **Strong Documentation:** Specifications + custom instructions + READMEs
4. ✅ **AI-First Approach:** GitHub Copilot integration with YAML front matter
5. ✅ **Published Packages:** All libraries designed for NPM publishing
6. ✅ **Comprehensive Tooling:** Nx 19.8.4, ESLint, Jest, Prettier
7. ✅ **Build Automation:** Version + publish targets, parallel execution
8. ✅ **Local Testing:** Verdaccio for local registry testing

### Opportunities
1. 🔶 **Tag-Based Boundaries:** Currently minimal tags; opportunity for domain-based constraints
2. 🔶 **ADR Documentation:** No Architecture Decision Records to track key decisions
3. 🔶 **Contributing Guidelines:** Missing CONTRIBUTING.md for external contributors
4. 🔶 **Dependency Constraints:** Current `depConstraints` allows all dependencies
5. 🔶 **E2E Testing:** Generators set e2eTestRunner: "none" - may need integration tests

### Build Strategy
- Two executor types balance flexibility (js:tsc) and Angular features (angular:package)
- Clear separation of publishable vs. utility libraries
- Custom executors for version/publish workflows

### Version Management
- Custom @buildmotion/cli executors for version/publish
- Local registry support (Verdaccio)
- Pre-version build command configured
- All 17 libraries are publishable to NPM under @buildmotion scope

---

**End of Inventory**

---

## Next Steps

This inventory serves as the foundation for:
1. **Guardrails Discovery** (Layer 1)
2. **Technology Stack Specification** (Layer 2)
3. **Standards & Playbooks** (Layer 3)
4. **Project Specification** (Layer 4)
5. **Feature Specifications** (Layer 5)
