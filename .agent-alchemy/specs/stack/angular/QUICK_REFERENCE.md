---
meta:
  id: quick-reference
  title: QUICK REFERENCE
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'

meta:
meta:
---

# Quick Reference: Specification-Driven Development

## 🚀 TL;DR - Getting Started

1. **Open any TypeScript file** - Copilot automatically loads relevant context
2. **Follow the suggestions** - They're based on specifications and best practices
3. **Check custom instructions** when you need quick guidance
4. **Reference full specs** when you need detailed API documentation

---

## 📂 File Type → Custom Instruction Mapping

| You're Working On | Copilot Loads | Quick Link |
|-------------------|---------------|------------|
| `user.service.ts` | [services.md](./services.md) | Service patterns |
| `user.component.ts` | [components.md](./components.md) | Component patterns |
| `user.action.ts` | [business-rules.md](./business-rules.md) | Actions & validation |
| `user.rule.ts` | [business-rules.md](./business-rules.md) | Rules & validation |
| `user-api.service.ts` | [http-data-access.md](./http-data-access.md) | HTTP patterns |
| `user.spec.ts` | [testing.md](./testing.md) | Testing patterns |
| Any `.ts` file | [architecture.md](./architecture.md) | Clean Architecture |

---

## 🎯 Common Tasks → Where to Start

### "I need to call an API"
1. Start: [http-data-access.md](./http-data-access.md)
2. Decision: Observable vs Signals?
3. Spec: [http-service](../../.spec-motion/http-service.specification.md) or [http-service-signals](../../.spec-motion/http-service-signals.specification.md)

### "I need to validate data"
1. Start: [business-rules.md](./business-rules.md)
2. Decision: Simple validation? Business rules? Reactive rules?
3. Spec: [validation](../../.spec-motion/validation.specification.md), [rules-engine](../../.spec-motion/rules-engine.specification.md), or [zod-rules-engine](../../.spec-motion/zod-rules-engine.specification.md)

### "I need to implement business logic"
1. Start: [business-rules.md](./business-rules.md)
2. Pattern: Use Actions for use cases
3. Spec: [actions](../../.spec-motion/actions.specification.md)

### "I need to build a UI component"
1. Start: [components.md](./components.md)
2. Pattern: Standalone + Signals
3. Spec: [Clean Architecture](../../.spec-motion/angular-clean-architecture.specification.md) - Presentation Layer

### "I need to add logging"
1. Start: [cross-cutting-concerns.md](./cross-cutting-concerns.md)
2. Pattern: Inject LoggingService
3. Spec: [logging](../../.spec-motion/logging.specification.md)

### "I need configuration"
1. Start: [cross-cutting-concerns.md](./cross-cutting-concerns.md)
2. Pattern: Inject ConfigurationService
3. Spec: [configuration](../../.spec-motion/configuration.specification.md)

### "I need to handle errors"
1. Start: [cross-cutting-concerns.md](./cross-cutting-concerns.md)
2. Pattern: Try-catch + logging
3. Spec: [error-handling](../../.spec-motion/error-handling.specification.md)

### "I'm making architectural decisions"
1. Start: [architecture.md](./architecture.md)
2. Principle: Dependency Rule (inner ← outer)
3. Spec: [Clean Architecture](../../.spec-motion/angular-clean-architecture.specification.md)

### "I need to write tests"
1. Start: [testing.md](./testing.md)
2. Pattern: Jest + mocking
3. Spec: Testing section of relevant library spec

---

## 🏗️ Architecture Quick Reference

### Layer Rules (Dependency Direction: Inner ← Outer)

```
┌─────────────────────────────────────────┐
│  Cross-Cutting Concerns                 │ ← Can be used by any layer
│  (logging, config, error-handling)      │
├─────────────────────────────────────────┤
│  Presentation Layer                     │ ← Depends on Infrastructure + Core
│  (components, routes, view models)      │
├─────────────────────────────────────────┤
│  Infrastructure Layer                   │ ← Depends on Core only
│  (http, actions, rules-engine)          │
├─────────────────────────────────────────┤
│  Core Layer                             │ ← No dependencies on outer layers
│  (core, foundation, domain entities)    │
└─────────────────────────────────────────┘
```

### Which Layer?

- **Business logic?** → Core
- **Data access / External API?** → Infrastructure
- **UI / User interaction?** → Presentation
- **Used everywhere?** → Cross-Cutting

See: [architecture.md](./architecture.md) for details

---

## 📚 Library Categories

### Configuration & Settings
- [configuration](../../.spec-motion/configuration.specification.md) - App settings
- [feature-flag](../../.spec-motion/feature-flag.specification.md) - Feature toggles

### Business Logic
- [actions](../../.spec-motion/actions.specification.md) - Use case pattern
- [rules-engine](../../.spec-motion/rules-engine.specification.md) - Business rules (classic)
- [zod-rules-engine](../../.spec-motion/zod-rules-engine.specification.md) - Reactive rules
- [validation](../../.spec-motion/validation.specification.md) - Input validation

### Infrastructure
- [http-service](../../.spec-motion/http-service.specification.md) - HTTP (Observable)
- [http-service-signals](../../.spec-motion/http-service-signals.specification.md) - HTTP (Signals)
- [logging](../../.spec-motion/logging.specification.md) - Logging & monitoring
- [error-handling](../../.spec-motion/error-handling.specification.md) - Error management

### User Interface
- [notifications](../../.spec-motion/notifications.specification.md) - User notifications
- [common](../../.spec-motion/common.specification.md) - Common utilities

---

## ⚡ Common Patterns

### Service Pattern (Observable)
```typescript
@Injectable({ providedIn: 'root' })
export class UserService extends HttpServiceBase {
  private logger = inject(LoggingService);
  
  getUsers(): Observable<User[]> {
    return this.get<User[]>('/users').pipe(
      tap(users => this.logger.log('Users loaded', { count: users.length }))
    );
  }
}
```

### Service Pattern (Signals)
```typescript
@Injectable({ providedIn: 'root' })
export class UserSignalService extends HttpServiceSignalsBase {
  users = signal<User[]>([]);
  
  loadUsers(): void {
    this.get<User[]>('/users').subscribe({
      next: (data) => this.users.set(data)
    });
  }
}
```

### Component Pattern
```typescript
@Component({
  standalone: true,
  imports: [CommonModule],
  // ...
})
export class UserListComponent {
  private userService = inject(UserService);
  users = signal<User[]>([]);
  
  ngOnInit() {
    this.userService.getUsers().subscribe({
      next: (data) => this.users.set(data)
    });
  }
}
```

### Validation Pattern
```typescript
export class CreateUserAction extends ActionBase {
  preValidateAction(): void {
    this.validationContext.addRule(
      new StringIsNotNullEmptyRange('Username', this.data.username, 3, 50)
    );
  }
}
```

---

## ✅ Checklists

### Before Creating a Service
- [ ] Which layer does this belong to?
- [ ] HTTP service? → Use http-service or http-service-signals
- [ ] Business logic? → Use actions
- [ ] Validation? → Use rules-engine or validation
- [ ] Need logging? → Inject LoggingService
- [ ] Need config? → Inject ConfigurationService

### Before Creating a Component
- [ ] Is this truly presentation layer?
- [ ] Using standalone APIs?
- [ ] Using signals for state?
- [ ] Business logic in services (not component)?
- [ ] Need notifications? → Inject NotificationService

### Before Writing Business Logic
- [ ] Use case action pattern?
- [ ] Validation rules needed?
- [ ] Observable or synchronous?
- [ ] Error handling in place?
- [ ] Logging important operations?

---

## 🔗 Essential Links

- **[Custom Instructions Index](./README.md)** - Complete guide
- **[Clean Architecture Spec](../../.spec-motion/angular-clean-architecture.specification.md)** - Architecture vision
- **[All Specifications](../../.spec-motion/)** - Complete specs directory

---

## 💡 Pro Tips

1. **Let Copilot guide you** - It has the context loaded automatically
2. **Use decision trees** - They're in every custom instruction
3. **Check the checklist** - Before implementing any pattern
4. **Reference specs for APIs** - Custom instructions link to them
5. **Follow the patterns** - They're battle-tested and spec-compliant

---

**Remember**: Custom instructions are your quick reference. Specifications are your detailed documentation. Use both!
