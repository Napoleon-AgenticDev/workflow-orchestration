---
meta:
  id: angular-clean-architecture-specification
  title: Angular Clean Architecture Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
title: Angular Clean Architecture Specification
category: Libraries
feature: Angular Clean Architecture
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: '1.0'
aiContext: true
applyTo: []
keywords: []
topics: []
useCases: []
---

# Modern Angular Clean Architecture Specification

**Author:** Agent Alchemy  
**Angular Version:** 19  
**Last Updated:** 2024  
**Architecture Pattern:** Clean Architecture (Robert C. Martin)

---

## 🎯 Purpose

This specification defines the **Clean Architecture** pattern for modern Angular applications within the Buildmotion Nx monorepo workspace. It provides a comprehensive guide for structuring enterprise-grade Angular applications with clear separation of concerns, maintainability, and scalability.

---

## 🏛️ Core Principles

### 1. Separation of Concerns
- Each layer has a distinct responsibility
- Business logic is isolated from framework dependencies
- UI logic is separated from business rules

### 2. Single Responsibility Principle (SRP)
- Each module, service, and component has one reason to change
- Libraries focus on specific cross-cutting concerns
- Clear boundaries between functional areas

### 3. Dependency Inversion Principle (DIP)
- High-level modules do not depend on low-level modules
- Both depend on abstractions (interfaces)
- Dependencies point inward toward business rules

### 4. Feature Module Isolation
- Features are self-contained and independently deployable
- Shared dependencies are minimized
- Feature modules have clear public APIs

### 5. Shared and Cross-Cutting Services
- Common functionality is extracted to reusable libraries
- Cross-cutting concerns are centralized
- Infrastructure services are abstracted

---

## 🧱 Architecture Layers

### Layer 1: Core (Entities & Use Cases)

**Location:** `/libs/core`, `/libs/foundation`

**Responsibilities:**
- Business entities and domain models
- Business rules and validation logic
- Use case implementations
- Domain-specific interfaces

**Dependencies:** None (innermost layer)

**Examples:**
- Entity models (User, Product, Order)
- Business rule validators
- Use case orchestrators
- Domain events

### Layer 2: Infrastructure (Services & Adapters)

**Location:** `/libs/http-service`, `/libs/http-service-signals`, `/libs/rules-engine`, `/libs/zod-rules-engine`, `/libs/actions`

**Responsibilities:**
- External API communication
- Data persistence abstractions
- Business rules execution engine
- Action/command patterns
- Service adapters

**Dependencies:** Core layer only

**Examples:**
- HTTP client wrappers (Observable and Signal-based)
- Rule engine implementations (classic and Zod-based)
- Repository patterns
- External service integrations

### Layer 3: Presentation (UI Components & Routes)

**Location:** `/apps/*`, feature modules

**Responsibilities:**
- User interface components
- Routing and navigation
- View models and presentation logic
- User interaction handling

**Dependencies:** Core and Infrastructure layers

**Examples:**
- Smart/Container components
- Presentational/Dumb components
- Route modules
- Guards and resolvers

### Layer 4: Cross-Cutting Concerns

**Location:** `/libs/configuration`, `/libs/logging`, `/libs/error-handling`, `/libs/validation`, `/libs/notifications`

**Responsibilities:**
- Application configuration management
- Logging and monitoring
- Error handling and recovery
- Input validation
- User notifications
- Feature flags

**Dependencies:** Can be used by any layer

**Examples:**
- ConfigurationService
- LoggingService with DataDog integration
- Global error handler
- Validation utilities
- Toast/notification services
- Feature toggle service

---

## 📐 Dependency Rules

### The Dependency Rule

Source code dependencies must point **inward** only:

```
┌─────────────────────────────────────────┐
│  Cross-Cutting Concerns (Config, Log)   │  ← Used by all layers
├─────────────────────────────────────────┤
│         Presentation (UI Layer)         │
├─────────────────────────────────────────┤
│    Infrastructure (Services Layer)      │
├─────────────────────────────────────────┤
│      Core (Entities & Use Cases)        │  ← Depends on nothing
└─────────────────────────────────────────┘
```

### Allowed Dependencies

- ✅ Presentation → Infrastructure
- ✅ Presentation → Core
- ✅ Infrastructure → Core
- ✅ Any Layer → Cross-Cutting Concerns
- ❌ Core → Infrastructure (NEVER)
- ❌ Core → Presentation (NEVER)
- ❌ Infrastructure → Presentation (NEVER)

---

## 🚀 Angular v19 Best Practices

### Standalone APIs

- **Prefer standalone components** over NgModule-based components
- Use `standalone: true` for new components, directives, and pipes
- Import dependencies directly in component metadata
- Migrate legacy modules gradually to standalone

```typescript
@Component({
  selector: 'app-feature',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedComponentsModule],
  template: `...`
})
export class FeatureComponent {}
```

### Signals

- **Use Signals for reactive state management** where appropriate
- Replace RxJS where simple reactivity is needed
- Combine Signals with RxJS for complex async operations
- Leverage computed signals for derived state

```typescript
export class UserProfileComponent {
  private userService = inject(UserService);
  
  // Signal-based state
  user = signal<User | null>(null);
  displayName = computed(() => this.user()?.name ?? 'Guest');
  
  // Update signal
  updateUser(user: User) {
    this.user.set(user);
  }
}
```

### Functional Guards and Resolvers

- **Use functional route guards** instead of class-based guards
- Leverage `CanActivateFn`, `CanDeactivateFn`, `ResolveFn`
- Compose multiple guards with guard composition
- Use inject() for dependency injection

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  return router.createUrlTree(['/login']);
};
```

### Hydration and SSR

- Enable hydration for improved SSR performance
- Use `provideClientHydration()` in app config
- Mark non-hydration-safe components appropriately
- Optimize for Core Web Vitals

### Dependency Injection

- **Use inject() function** for dependency injection
- Prefer constructor injection for required dependencies
- Use providedIn: 'root' for singleton services
- Leverage injection tokens for configuration

```typescript
export class DataService {
  private http = inject(HttpClient);
  private config = inject(ConfigurationService);
  private logger = inject(LoggingService);
  
  // Service implementation
}
```

### TypeScript Best Practices

- Enable strict mode in tsconfig.json
- Use type inference where possible
- Define interfaces for contracts
- Leverage union types and type guards
- Use generics for reusable components

---

## 🔧 Cross-Cutting Library Integration

### Configuration Management

```typescript
// Use ConfigurationService from @buildmotion/configuration
export class AppComponent implements OnInit {
  private config = inject(ConfigurationService);
  
  ngOnInit() {
    this.config.settings$.subscribe(settings => {
      // Use configuration
    });
  }
}
```

### Logging

```typescript
// Use LoggingService from @buildmotion/logging
export class PaymentService {
  private logger = inject(LoggingService);
  
  processPayment(payment: Payment) {
    this.logger.log('Processing payment', payment.id);
    // Business logic
  }
}
```

### Error Handling

```typescript
// Use error-handling utilities from @buildmotion/error-handling
export class ApiService {
  private errorHandler = inject(ErrorHandlingService);
  
  getData() {
    return this.http.get('/api/data').pipe(
      catchError(error => this.errorHandler.handle(error))
    );
  }
}
```

### Validation

```typescript
// Use validation utilities from @buildmotion/validation
export class UserFormComponent {
  private validator = inject(ValidationService);
  
  validateForm(formData: FormData) {
    const result = this.validator.validate(formData, userValidationRules);
    return result.isValid;
  }
}
```

---

## 📦 Module Organization

### Feature Module Structure

```
feature/
├── components/
│   ├── smart/           # Container components
│   └── presentational/  # Dumb components
├── services/
│   ├── feature.service.ts
│   └── feature.facade.ts
├── models/
│   ├── feature.model.ts
│   └── feature.interface.ts
├── guards/
│   └── feature.guard.ts
├── resolvers/
│   └── feature.resolver.ts
└── feature.routes.ts
```

### Library Module Structure

```
lib-name/
├── src/
│   ├── lib/
│   │   ├── services/
│   │   ├── models/
│   │   ├── interfaces/
│   │   └── utilities/
│   ├── index.ts         # Public API
│   └── test-setup.ts
├── README.md
├── package.json
└── project.json
```

---

## 🧪 Testing Strategy

### Unit Tests

- Test business logic in isolation
- Mock external dependencies
- Use Jest for unit testing
- Achieve high code coverage (>80%)

### Integration Tests

- Test layer interactions
- Verify service integrations
- Test with real dependencies where appropriate

### E2E Tests

- Test critical user journeys
- Verify feature functionality end-to-end
- Use Cypress or Playwright

---

## 🎨 Code Quality Standards

### Linting and Formatting

- Use ESLint for code quality
- Use Prettier for code formatting
- Run `yarn format` before commits
- Follow Angular style guide

### Type Safety

- Enable TypeScript strict mode
- Define explicit return types
- Use interfaces for contracts
- Avoid `any` type

### Documentation

- Use TSDoc for public APIs
- Document complex business logic
- Maintain up-to-date READMEs
- Include usage examples

---

## 🔄 State Management

### Application State

- Use Signals for component state
- Use RxJS for async state streams
- Use services for shared state
- Consider NgRx for complex state

### Data Flow

```
User Action → Component → Facade/Service → Use Case → Repository → API
                ↓                                                    ↓
            Update UI ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← Response
```

---

## 📚 References

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Angular Documentation](https://angular.io)
- [Nx Documentation](https://nx.dev)
- [Angular Style Guide](https://angular.io/guide/styleguide)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 🔍 See Also

- [Library Specifications](.spec-motion/) - Detailed specifications for each cross-cutting concern library
- [Copilot Instructions](../.github/copilot-instructions.md) - Development guidelines for this repository
