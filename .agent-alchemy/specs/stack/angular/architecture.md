---
meta:
  id: architecture
  title: Architecture
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: 2026-02-23T00:00:00.000Z
title: Clean Architecture Guidelines
applies_to: null
priority: high
category: architecture
---

# Clean Architecture Guidelines

## When to Use This Guidance

Apply these guidelines when:
- Creating new components, services, or modules
- Designing application layers and dependencies
- Making architectural decisions
- Refactoring existing code to align with Clean Architecture

## Primary Specification Reference

📖 **[Clean Architecture Specification](../../.spec-motion/angular-clean-architecture.specification.md)**

## Key Principles

### Dependency Rule

**CRITICAL**: Dependencies must point inward. Outer layers depend on inner layers, never the reverse.

```
Cross-Cutting Concerns ← Presentation ← Infrastructure ← Core
```

### Layer Responsibilities

1. **Core Layer** (Innermost)
   - Domain entities and business logic
   - No dependencies on outer layers
   - Framework-agnostic

2. **Infrastructure Layer**
   - Data access and external services
   - Depends only on Core
   - Implements interfaces defined in Core

3. **Presentation Layer**
   - UI components and view logic
   - Depends on Core and Infrastructure
   - Angular-specific code

4. **Cross-Cutting Concerns**
   - Logging, configuration, error handling
   - Can be used by any layer
   - No business logic

## Angular v19 Best Practices

### Use Standalone APIs
```typescript
// ✅ DO: Use standalone components
@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  // ...
})
export class UserComponent {}
```

### Use Signals for State
```typescript
// ✅ DO: Use signals for reactive state
export class UserService {
  private userSignal = signal<User | null>(null);
  readonly user = this.userSignal.asReadonly();
}
```

### Use inject() Function
```typescript
// ✅ DO: Use inject() for dependencies
export class DataService {
  private http = inject(HttpClient);
  private config = inject(ConfigurationService);
  private logger = inject(LoggingService);
}
```

## Common Violations to Avoid

❌ **DON'T**: Import presentation layer code in Core
❌ **DON'T**: Put business logic in components
❌ **DON'T**: Direct HTTP calls in components (use services)
❌ **DON'T**: Skip validation in use cases

## Integration with Libraries

When working with code that uses Buildmotion libraries, always consult the relevant specification:

- Configuration → [configuration.specification.md](../../.spec-motion/configuration.specification.md)
- HTTP calls → [http-service.specification.md](../../.spec-motion/http-service.specification.md) or [http-service-signals.specification.md](../../.spec-motion/http-service-signals.specification.md)
- Business rules → [rules-engine.specification.md](../../.spec-motion/rules-engine.specification.md) or [zod-rules-engine.specification.md](../../.spec-motion/zod-rules-engine.specification.md)
- Logging → [logging.specification.md](../../.spec-motion/logging.specification.md)
- Error handling → [error-handling.specification.md](../../.spec-motion/error-handling.specification.md)

## Quick Decision Tree

```
Are you implementing business logic?
├─ YES → Use Core layer (core, foundation)
└─ NO
   ├─ Is it data access or external API?
   │  └─ YES → Use Infrastructure layer (http-service, actions)
   ├─ Is it UI-related?
   │  └─ YES → Use Presentation layer (components, routes)
   └─ Is it used across multiple layers?
      └─ YES → Use Cross-Cutting Concern (logging, config, error-handling)
```
