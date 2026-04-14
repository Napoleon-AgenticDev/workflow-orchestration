---
meta:
  id: services
  title: Services
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: 2026-02-23T00:00:00.000Z
title: Service Development Guidelines
applies_to: null
priority: high
category: services
---

# Service Development Guidelines

## When to Use This Guidance

Apply when:
- Creating new Angular services
- Implementing service methods
- Integrating with HTTP APIs
- Managing service dependencies

## Relevant Specifications

Based on the service type, reference:

### HTTP/API Services
📖 **[HTTP Service (Observable)](../../.spec-motion/http-service.specification.md)** - For RxJS-based HTTP services
📖 **[HTTP Service Signals](../../.spec-motion/http-service-signals.specification.md)** - For Signal-based HTTP services

### Business Logic Services
📖 **[Actions](../../.spec-motion/actions.specification.md)** - For command/action pattern
📖 **[Rules Engine](../../.spec-motion/rules-engine.specification.md)** - For business rules (classic)
📖 **[Zod Rules Engine](../../.spec-motion/zod-rules-engine.specification.md)** - For reactive validation rules

### Cross-Cutting Services
📖 **[Logging](../../.spec-motion/logging.specification.md)** - For logging functionality
📖 **[Configuration](../../.spec-motion/configuration.specification.md)** - For configuration management
📖 **[Error Handling](../../.spec-motion/error-handling.specification.md)** - For error management

## Service Pattern by Type

### 1. Data Services (HTTP)

```typescript
import { inject } from '@angular/core';
import { HttpServiceBase } from '@buildmotion/http-service';
import { LoggingService } from '@buildmotion/logging';

@Injectable({ providedIn: 'root' })
export class UserDataService extends HttpServiceBase {
  private logger = inject(LoggingService);
  
  constructor() {
    super('https://api.example.com');
  }
  
  getUsers(): Observable<User[]> {
    return this.get<User[]>('/users').pipe(
      tap(users => this.logger.log('Users loaded', { count: users.length }))
    );
  }
}
```

**Consult**: [http-service.specification.md](../../.spec-motion/http-service.specification.md)

### 2. Signal-Based Data Services

```typescript
import { inject } from '@angular/core';
import { HttpServiceSignalsBase } from '@buildmotion/http-service-signals';

@Injectable({ providedIn: 'root' })
export class UserSignalService extends HttpServiceSignalsBase {
  private users = signal<User[]>([]);
  readonly users$ = this.users.asReadonly();
  
  loadUsers(): void {
    this.get<User[]>('/users').subscribe({
      next: (data) => this.users.set(data),
      error: (err) => this.handleError(err)
    });
  }
}
```

**Consult**: [http-service-signals.specification.md](../../.spec-motion/http-service-signals.specification.md)

### 3. Business Logic Services

```typescript
import { inject } from '@angular/core';
import { ActionBase } from '@buildmotion/actions';
import { ValidationContext } from '@buildmotion/validation';

export class CreateUserAction extends ActionBase {
  private validationContext = new ValidationContext();
  
  execute(): Observable<ActionResult> {
    // Validate input
    this.validateInput();
    
    if (this.validationContext.isValid) {
      return this.performAction();
    }
    
    return of(this.createFailedResult());
  }
}
```

**Consult**: [actions.specification.md](../../.spec-motion/actions.specification.md)

### 4. Configuration Services

```typescript
import { inject } from '@angular/core';
import { ConfigurationService } from '@buildmotion/configuration';

@Injectable({ providedIn: 'root' })
export class AppSettingsService {
  private config = inject(ConfigurationService);
  
  get apiUrl(): string {
    return this.config.settings.apiUrl;
  }
}
```

**Consult**: [configuration.specification.md](../../.spec-motion/configuration.specification.md)

## Service Checklist

Before implementing a service, ask:

- [ ] Which architectural layer does this belong to?
- [ ] Does it need HTTP communication? → Use `@buildmotion/http-service` or `@buildmotion/http-service-signals`
- [ ] Does it contain business rules? → Use `@buildmotion/rules-engine` or `@buildmotion/zod-rules-engine`
- [ ] Does it need validation? → Use `@buildmotion/validation`
- [ ] Should it log operations? → Inject `@buildmotion/logging`
- [ ] Does it need configuration? → Inject `@buildmotion/configuration`
- [ ] Will it handle errors? → Use `@buildmotion/error-handling`

## Dependency Injection Best Practices

✅ **DO**: Use `inject()` function
✅ **DO**: Provide in 'root' for singletons
✅ **DO**: Define clear interfaces
✅ **DO**: Keep services focused (Single Responsibility)

❌ **DON'T**: Use constructor injection for non-required deps
❌ **DON'T**: Create service dependencies on components
❌ **DON'T**: Mix multiple responsibilities in one service

## Testing Services

Every service should have comprehensive tests. See the relevant specification for testing examples and patterns.
