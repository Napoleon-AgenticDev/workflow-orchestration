# Architecture Map

**Generated:** 2026-01-15
**Repository:** https://github.com/buildmotion/buildmotion

---

## Executive Summary

The BuildMotion monorepo implements a **Clean Architecture** pattern with clear layer separation:
- **Core Layer** (3 libraries) - Domain entities, business models
- **Infrastructure Layer** (6 libraries) - Actions, rules, validation, HTTP
- **Cross-Cutting Concerns** (7 libraries) - Logging, config, error handling, monitoring
- **Presentation Layer** (1 library) - Common UI utilities

All libraries follow **dependency inversion** with dependencies flowing inward toward the core.

---

## Inferred Architecture Layers

### Layer 1: Core (Business Domain)
**Purpose:** Framework-agnostic business logic and domain entities

| Library | Path | Responsibilities | Dependencies |
|---------|------|------------------|--------------|
| **core** | `/libs/core` | Domain entities, API response models, business types | None (pure domain) |
| **foundation** | `/libs/foundation` | Base classes (ActionBase, ServiceBase), foundational patterns | core |
| **state-machine** | `/libs/state-machine` | State management for workflows, wizards, multi-step forms | None (framework-agnostic) |

**Dependency Flow:** `foundation` → `core`

**Assessment:** ✅ Core layer is clean with minimal dependencies.

---

### Layer 2: Infrastructure (Technical Capabilities)

**Purpose:** Implement technical capabilities that support business logic

#### Actions & Business Logic (1 library)
| Library | Path | Responsibilities | Dependencies |
|---------|------|------------------|--------------|
| **actions** | `/libs/actions` | Command/action pattern, ActionResult, business operation orchestration | foundation, logging |

#### Validation & Rules (3 libraries)
| Library | Path | Responsibilities | Dependencies |
|---------|------|------------------|--------------|
| **rules-engine** | `/libs/rules-engine` | Classic rules engine, CompositeRule, ValidationContext, rule primitives | None (pure logic) |
| **zod-rules-engine** | `/libs/zod-rules-engine` | Reactive rules engine with Zod schemas | zod (external) |
| **validation** | `/libs/validation` | Form validators, validation utilities | rules-engine |

**Dependency Flow:** `validation` → `rules-engine`

#### HTTP & Data Access (2 libraries)
| Library | Path | Responsibilities | Dependencies |
|---------|------|------------------|--------------|
| **http-service** | `/libs/http-service` | Observable-based HTTP client, HttpServiceBase, error handling | foundation, logging |
| **http-service-signals** | `/libs/http-service-signals` | Signal-based HTTP client (Angular 18+) | foundation, logging |

**Dependency Flow:** `http-service*` → `foundation` → `logging`

**Assessment:** ✅ Infrastructure layer properly depends on foundation and cross-cutting concerns.

---

### Layer 3: Cross-Cutting Concerns (7 libraries)

**Purpose:** Enterprise capabilities available to all layers

#### Configuration & Feature Management (2 libraries)
| Library | Path | Responsibilities | Dependencies |
|---------|------|------------------|--------------|
| **configuration** | `/libs/configuration` | ConfigurationService, ConfigurationContext, environment settings | None (foundation) |
| **feature-flag** | `/libs/feature-flag` | Feature toggle management | None |

#### Logging & Monitoring (2 libraries)
| Library | Path | Responsibilities | Dependencies |
|---------|------|------------------|--------------|
| **logging** | `/libs/logging` | LoggingService, Severity levels, DataDog integration, log writers | configuration, rules-engine |
| **inactivity-monitor** | `/libs/inactivity-monitor` | User activity tracking, session timeout, idle detection | None (signals-based) |

**Dependency Flow:** `logging` → `configuration`, `rules-engine`

#### Error Handling & Notifications (2 libraries)
| Library | Path | Responsibilities | Dependencies |
|---------|------|------------------|--------------|
| **error-handling** | `/libs/error-handling` | Error management, error models | None |
| **notifications** | `/libs/notifications` | User notifications, toast messages | foundation, logging, configuration, core, rules-engine, actions |

**Dependency Flow:** `notifications` → `actions`, `rules-engine`, `foundation`, `logging`, `configuration`, `core`

**Note:** Notifications is the most dependent library (6 dependencies) - it orchestrates multiple concerns.

#### Utilities (2 libraries)
| Library | Path | Responsibilities | Dependencies |
|---------|------|------------------|--------------|
| **common** | `/libs/common` | Common utilities, helpers, pipes | None |
| **version-check** | `/libs/version-check` | Application version checking | None |

**Assessment:** ✅ Cross-cutting concerns are properly isolated with minimal coupling.

---

## Library Dependency Map

### Dependency Hierarchy (Bottom-Up)

```
Level 0 (No dependencies):
  - core (domain entities)
  - rules-engine (pure logic)
  - zod-rules-engine (schema validation)
  - error-handling
  - feature-flag
  - common
  - version-check
  - inactivity-monitor
  - state-machine
  - configuration (minimal)

Level 1 (Depends on Level 0):
  - foundation → core
  - validation → rules-engine
  - logging → configuration, rules-engine

Level 2 (Depends on Level 0-1):
  - actions → foundation, logging
  - http-service → foundation, logging
  - http-service-signals → foundation, logging

Level 3 (Depends on Level 0-2):
  - notifications → foundation, logging, configuration, core, rules-engine, actions
```

### Dependency Graph

```
notifications
├── actions
│   ├── foundation
│   │   └── core
│   └── logging
│       ├── configuration
│       └── rules-engine
├── core
├── foundation
├── logging
├── configuration
└── rules-engine

http-service
├── foundation
│   └── core
└── logging
    ├── configuration
    └── rules-engine

http-service-signals
├── foundation
│   └── core
└── logging
    ├── configuration
    └── rules-engine

validation
└── rules-engine

actions
├── foundation
│   └── core
└── logging
```

---

## Cross-Library Dependency Hotspots

### Most Depended Upon (Inbound Dependencies)

| Library | Depended By | Count | Assessment |
|---------|-------------|-------|------------|
| **foundation** | actions, http-service, http-service-signals, notifications | 4 | ✅ Appropriate - base classes |
| **logging** | actions, http-service, http-service-signals, notifications | 4 | ✅ Appropriate - cross-cutting |
| **rules-engine** | validation, logging, notifications | 3 | ✅ Appropriate - validation |
| **configuration** | logging, notifications | 2 | ✅ Appropriate - settings |
| **core** | foundation, notifications | 2 | ✅ Appropriate - domain models |
| **actions** | notifications | 1 | ✅ Appropriate - business logic |

### Most Dependent (Outbound Dependencies)

| Library | Depends On | Count | Assessment |
|---------|------------|-------|------------|
| **notifications** | foundation, logging, configuration, core, rules-engine, actions | 6 | 🔶 High coupling - orchestrator |
| **http-service** | foundation, logging | 2 | ✅ Appropriate |
| **http-service-signals** | foundation, logging | 2 | ✅ Appropriate |
| **actions** | foundation, logging | 2 | ✅ Appropriate |
| **logging** | configuration, rules-engine | 2 | ✅ Appropriate |
| **validation** | rules-engine | 1 | ✅ Appropriate |
| **foundation** | core | 1 | ✅ Appropriate |

### Analysis

✅ **Healthy Patterns:**
- Core has zero dependencies (pure domain)
- Foundation depends only on core
- Infrastructure layer depends on foundation + cross-cutting
- Logging is properly used as a cross-cutting concern

🔶 **Attention Area:**
- **notifications** has 6 dependencies - highest coupling
  - Orchestrates actions, rules, logging, configuration
  - This is acceptable as it's a **facade/orchestrator** library
  - Consider splitting if it grows further

---

## Likely Domain Boundaries

Based on library naming and organization:

### Domain: Core Business
```
/libs/core/              - Domain entities, API models
/libs/foundation/        - Base patterns and abstractions
/libs/state-machine/     - Workflow state management
```

### Domain: Infrastructure
```
/libs/actions/           - Command pattern, use cases
/libs/rules-engine/      - Business rules (classic)
/libs/zod-rules-engine/  - Business rules (reactive)
/libs/validation/        - Input validation
/libs/http-service/      - HTTP client (Observable)
/libs/http-service-signals/ - HTTP client (Signals)
```

### Domain: Cross-Cutting
```
/libs/configuration/     - App configuration
/libs/logging/           - Logging & monitoring
/libs/error-handling/    - Error management
/libs/notifications/     - User notifications
/libs/feature-flag/      - Feature toggles
/libs/inactivity-monitor/ - Session management
```

### Domain: Shared/Common
```
/libs/common/            - Shared utilities
/libs/version-check/     - Version management
```

---

## Boundary Violations

### Current State: No Violations Detected ✅

**Analysis:**
1. All dependencies flow inward (outer → inner layers)
2. Core has zero external dependencies
3. Infrastructure depends on foundation and cross-cutting only
4. Cross-cutting concerns are properly isolated
5. No circular dependencies detected

**Module Boundary Rules:**
```json
{
  "@nx/enforce-module-boundaries": {
    "enforceBuildableLibDependency": true,
    "depConstraints": [
      { "sourceTag": "*", "onlyDependOnLibsWithTags": ["*"] }
    ]
  }
}
```

**Current Configuration:**
- ✅ Buildable library dependency enforcement: **active**
- 🔶 Tag-based constraints: **not configured** (all tags allowed)

**Recommendation:** Add domain-based tags for stronger boundaries:
```json
{
  "depConstraints": [
    {
      "sourceTag": "domain:core",
      "onlyDependOnLibsWithTags": ["domain:core"]
    },
    {
      "sourceTag": "domain:infrastructure",
      "onlyDependOnLibsWithTags": ["domain:core", "domain:infrastructure", "domain:cross-cutting"]
    },
    {
      "sourceTag": "domain:cross-cutting",
      "onlyDependOnLibsWithTags": ["domain:core", "domain:cross-cutting"]
    },
    {
      "sourceTag": "domain:presentation",
      "onlyDependOnLibsWithTags": ["*"]
    }
  ]
}
```

---

## Recommended Tag Structure

### Proposed Tags

```typescript
// Core Layer
libs/core/project.json → tags: ["domain:core", "layer:domain"]
libs/foundation/project.json → tags: ["domain:core", "layer:domain"]
libs/state-machine/project.json → tags: ["domain:core", "layer:domain"]

// Infrastructure Layer
libs/actions/project.json → tags: ["domain:infrastructure", "layer:infrastructure", "type:business-logic"]
libs/rules-engine/project.json → tags: ["domain:infrastructure", "layer:infrastructure", "type:validation"]
libs/zod-rules-engine/project.json → tags: ["domain:infrastructure", "layer:infrastructure", "type:validation"]
libs/validation/project.json → tags: ["domain:infrastructure", "layer:infrastructure", "type:validation"]
libs/http-service/project.json → tags: ["domain:infrastructure", "layer:infrastructure", "type:data-access"]
libs/http-service-signals/project.json → tags: ["domain:infrastructure", "layer:infrastructure", "type:data-access"]

// Cross-Cutting Layer
libs/logging/project.json → tags: ["domain:cross-cutting", "layer:cross-cutting", "type:monitoring"]
libs/configuration/project.json → tags: ["domain:cross-cutting", "layer:cross-cutting", "type:config"]
libs/error-handling/project.json → tags: ["domain:cross-cutting", "layer:cross-cutting", "type:error"]
libs/notifications/project.json → tags: ["domain:cross-cutting", "layer:cross-cutting", "type:ui"]
libs/feature-flag/project.json → tags: ["domain:cross-cutting", "layer:cross-cutting", "type:config"]
libs/inactivity-monitor/project.json → tags: ["domain:cross-cutting", "layer:cross-cutting", "type:monitoring"]

// Shared/Common
libs/common/project.json → tags: ["domain:shared", "layer:shared", "type:util"]
libs/version-check/project.json → tags: ["domain:shared", "layer:shared", "type:util"]
```

---

## Architecture Quality Metrics

| Metric | Score | Assessment |
|--------|-------|------------|
| **Layer Separation** | 9/10 | ✅ Excellent - clear layers |
| **Dependency Direction** | 10/10 | ✅ Perfect - all flow inward |
| **Coupling** | 8/10 | ✅ Good - notifications has 6 deps |
| **Cohesion** | 9/10 | ✅ Excellent - clear responsibilities |
| **Boundary Enforcement** | 6/10 | 🔶 Fair - no tag-based rules |
| **Documentation** | 10/10 | ✅ Excellent - specs for all libs |

**Overall Architecture Health: 8.7/10** - Excellent

---

## Recommendations

### Immediate Actions
1. ✅ **None required** - architecture is sound

### Enhancements (Optional)
1. **Add domain-based tags** to project.json files
2. **Configure tag-based dependency constraints** in nx.json
3. **Consider splitting notifications** if it grows beyond current scope
4. **Add ADR (Architecture Decision Records)** to document key decisions

### Maintain Current Strengths
1. ✅ Keep core layer pure (no external dependencies)
2. ✅ Maintain clear layer boundaries
3. ✅ Continue using foundation as base abstraction
4. ✅ Leverage cross-cutting concerns (logging, config) appropriately

---

**End of Architecture Map**
