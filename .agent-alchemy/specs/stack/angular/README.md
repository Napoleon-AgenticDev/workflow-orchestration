# GitHub Copilot Custom Instructions Index

This directory contains contextual custom instructions for GitHub Copilot to provide specification-driven development guidance.

## 📚 Custom Instruction Files

Each file provides targeted guidance based on the type of code you're working on:

### 1. [architecture.md](./architecture.md)

**Applies to**: `**/*.ts`, `**/*.component.ts`, `**/*.service.ts`, `**/*.module.ts`, `libs/**/*`

Provides Clean Architecture principles and guidelines for:

- Layer organization and dependencies
- Angular v19 best practices (standalone APIs, signals, inject())
- Decision making for architectural choices
- Integration with Buildmotion libraries

**Primary Spec**: [Clean Architecture Specification](../../.spec-motion/angular-clean-architecture.specification.md)

---

### 2. [services.md](./services.md)

**Applies to**: `**/*.service.ts`, `libs/**/src/**/*.service.ts`

Guidance for creating and maintaining services:

- HTTP/API services (Observable vs Signals)
- Business logic services
- Cross-cutting services
- Service patterns and best practices

**Key Specs**:

- [HTTP Service](../../.spec-motion/http-service.specification.md)
- [HTTP Service Signals](../../.spec-motion/http-service-signals.specification.md)
- [Actions](../../.spec-motion/actions.specification.md)

---

### 3. [components.md](./components.md)

**Applies to**: `**/*.component.ts`, `**/*.component.html`, `**/*.component.scss`

Guidance for component development:

- Standalone components
- Signal-based state management
- Presentation layer responsibilities
- Integration with services and libraries

**Primary Spec**: [Clean Architecture](../../.spec-motion/angular-clean-architecture.specification.md) - Presentation Layer

---

### 4. [business-rules.md](./business-rules.md)

**Applies to**: `**/*.action.ts`, `**/*.rule.ts`, `**/*.validator.ts`, validation/rules libraries

Guidance for business logic and validation:

- Choosing between Actions, Rules Engine, Zod Rules Engine, Validation
- Implementing validation rules
- Creating use case actions
- Testing validation logic

**Key Specs**:

- [Actions](../../.spec-motion/actions.specification.md)
- [Rules Engine](../../.spec-motion/rules-engine.specification.md)
- [Zod Rules Engine](../../.spec-motion/zod-rules-engine.specification.md)
- [Validation](../../.spec-motion/validation.specification.md)

---

### 5. [http-data-access.md](./http-data-access.md)

**Applies to**: `**/*.http.ts`, `**/*.api.ts`, `**/*.data.service.ts`

Guidance for HTTP and data access:

- Observable-based HTTP service
- Signal-based HTTP service
- Error handling and retry logic
- Testing HTTP services

**Key Specs**:

- [HTTP Service](../../.spec-motion/http-service.specification.md)
- [HTTP Service Signals](../../.spec-motion/http-service-signals.specification.md)

---

### 6. [cross-cutting-concerns.md](./cross-cutting-concerns.md)

**Applies to**: All TypeScript files

Guidance for cross-cutting concerns:

- Logging with DataDog integration
- Configuration management
- Error handling
- User notifications
- Feature flags
- Inactivity monitoring

**Key Specs**:

- [Logging](../../.spec-motion/logging.specification.md)
- [Configuration](../../.spec-motion/configuration.specification.md)
- [Error Handling](../../.spec-motion/error-handling.specification.md)
- [Notifications](../../.spec-motion/notifications.specification.md)
- [Feature Flags](../../.spec-motion/feature-flag.specification.md)
- [Inactivity Monitor](../../.spec-motion/inactivity-monitor.specification.md)

---

### 6.1. [inactivity-monitor.md](./inactivity-monitor.md)

**Applies to**: `libs/inactivity-monitor/**/*.ts`, `**/*inactivity*.ts`, `**/*idle*.ts`, `**/*session*.service.ts`

Specialized guidance for inactivity monitoring:

- User activity detection and tracking
- Session timeout management
- Auto-logout implementation
- Auto-save on idle
- Configuration patterns for different use cases

**Primary Spec**: [Inactivity Monitor](../../.spec-motion/inactivity-monitor.specification.md)

---

### 7. [testing.md](./testing.md)

**Applies to**: `**/*.spec.ts`, `**/*.test.ts`

Guidance for testing:

- Jest testing patterns
- Service testing
- Component testing
- Validation/rules testing
- Mocking cross-cutting concerns

---

## 🎯 How These Instructions Work

GitHub Copilot automatically:

1. **Detects file type** using the `applies_to` glob patterns in each file's front matter
2. **Loads relevant context** from the matching custom instruction file(s)
3. **References specifications** linked in the instruction files
4. **Provides contextual suggestions** based on the guidance

## 📖 Specification-Driven Development

This system creates a bridge between:

```
Specifications (.spec-motion/)
        ↓
Custom Instructions (.github/copilot/)
        ↓
Copilot Suggestions (in your IDE)
        ↓
Your Code
```

### The Flow

1. **You write code** in a specific file type (e.g., `user.service.ts`)
2. **Copilot detects** the file matches `**/*.service.ts` pattern
3. **Copilot loads** [services.md](./services.md) custom instructions
4. **Copilot references** the linked specifications (HTTP Service, Actions, etc.)
5. **Copilot suggests** code following the patterns in the specifications
6. **You get** consistent, architecture-compliant code

## 🔍 Finding the Right Guidance

### By File Type

| File Pattern            | Custom Instruction                           | Primary Specifications             |
| ----------------------- | -------------------------------------------- | ---------------------------------- |
| `*.service.ts`          | [services.md](./services.md)                 | HTTP Service, Actions, Logging     |
| `*.component.ts`        | [components.md](./components.md)             | Clean Architecture                 |
| `*.action.ts`           | [business-rules.md](./business-rules.md)     | Actions                            |
| `*.rule.ts`             | [business-rules.md](./business-rules.md)     | Rules Engine, Zod Rules Engine     |
| `*.http.ts`, `*.api.ts` | [http-data-access.md](./http-data-access.md) | HTTP Service, HTTP Service Signals |
| `*.spec.ts`             | [testing.md](./testing.md)                   | All relevant specifications        |
| Any `*.ts`              | [architecture.md](./architecture.md)         | Clean Architecture                 |

### By Task

| Task                   | Custom Instruction                                       | Specifications          |
| ---------------------- | -------------------------------------------------------- | ----------------------- |
| Creating a new service | [services.md](./services.md)                             | Based on service type   |
| Making HTTP calls      | [http-data-access.md](./http-data-access.md)             | HTTP Service or Signals |
| Validating data        | [business-rules.md](./business-rules.md)                 | Rules, Validation       |
| Building UI            | [components.md](./components.md)                         | Clean Architecture      |
| Adding logging         | [cross-cutting-concerns.md](./cross-cutting-concerns.md) | Logging                 |
| Writing tests          | [testing.md](./testing.md)                               | All specs               |
| Making arch decisions  | [architecture.md](./architecture.md)                     | Clean Architecture      |

### By Library

| Library                             | Custom Instruction                                       | Specification                                                                                     |
| ----------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `@buildmotion/http-service`         | [http-data-access.md](./http-data-access.md)             | [http-service.specification.md](../../.spec-motion/http-service.specification.md)                 |
| `@buildmotion/http-service-signals` | [http-data-access.md](./http-data-access.md)             | [http-service-signals.specification.md](../../.spec-motion/http-service-signals.specification.md) |
| `@buildmotion/actions`              | [business-rules.md](./business-rules.md)                 | [actions.specification.md](../../.spec-motion/actions.specification.md)                           |
| `@buildmotion/rules-engine`         | [business-rules.md](./business-rules.md)                 | [rules-engine.specification.md](../../.spec-motion/rules-engine.specification.md)                 |
| `@buildmotion/zod-rules-engine`     | [business-rules.md](./business-rules.md)                 | [zod-rules-engine.specification.md](../../.spec-motion/zod-rules-engine.specification.md)         |
| `@buildmotion/validation`           | [business-rules.md](./business-rules.md)                 | [validation.specification.md](../../.spec-motion/validation.specification.md)                     |
| `@buildmotion/logging`              | [cross-cutting-concerns.md](./cross-cutting-concerns.md) | [logging.specification.md](../../.spec-motion/logging.specification.md)                           |
| `@buildmotion/configuration`        | [cross-cutting-concerns.md](./cross-cutting-concerns.md) | [configuration.specification.md](../../.spec-motion/configuration.specification.md)               |
| `@buildmotion/error-handling`       | [cross-cutting-concerns.md](./cross-cutting-concerns.md) | [error-handling.specification.md](../../.spec-motion/error-handling.specification.md)             |
| `@buildmotion/notifications`        | [cross-cutting-concerns.md](./cross-cutting-concerns.md) | [notifications.specification.md](../../.spec-motion/notifications.specification.md)               |
| `@buildmotion/feature-flag`         | [cross-cutting-concerns.md](./cross-cutting-concerns.md) | [feature-flag.specification.md](../../.spec-motion/feature-flag.specification.md)                 |
| `@buildmotion/inactivity-monitor`   | [inactivity-monitor.md](./inactivity-monitor.md)         | [inactivity-monitor.specification.md](../../.spec-motion/inactivity-monitor.specification.md)     |

## 💡 Usage Examples

### Example 1: Creating a Data Service

When you create `user-data.service.ts`:

1. Copilot loads [services.md](./services.md) (matches `**/*.service.ts`)
2. You see guidance on HTTP Service vs HTTP Service Signals
3. Copilot suggests extending `HttpServiceBase` or `HttpServiceSignalsBase`
4. Code suggestions include logging, error handling, and proper patterns
5. You reference [http-service.specification.md](../../.spec-motion/http-service.specification.md) for details

### Example 2: Adding Validation

When you create `user-validation.rules.ts`:

1. Copilot loads [business-rules.md](./business-rules.md) (matches `**/*.rule.ts`)
2. You see decision tree: Rules Engine vs Zod Rules Engine vs Validation
3. Copilot suggests appropriate base classes and patterns
4. You reference relevant specification for full API details

### Example 3: Building a Component

When you create `user-list.component.ts`:

1. Copilot loads [components.md](./components.md) (matches `**/*.component.ts`)
2. Copilot also loads [architecture.md](./architecture.md) (matches `**/*.ts`)
3. You get guidance on standalone components, signals, and presentation layer
4. Suggestions include proper service injection and state management

## 🚀 Best Practices

1. **Always check the custom instruction** for your file type before writing new code
2. **Follow the decision trees** provided in the instructions
3. **Reference linked specifications** for detailed API documentation
4. **Use the checklists** provided in each instruction file
5. **Test thoroughly** using patterns from [testing.md](./testing.md)

## 📚 Additional Resources

- **[Root Copilot Instructions](../copilot-instructions.md)** - General repository guidelines
- **[Specification Directory](../../.spec-motion/)** - All detailed specifications
- **[Clean Architecture Spec](../../.spec-motion/angular-clean-architecture.specification.md)** - Overall architectural vision

---

**This specification-driven development approach ensures**:

- ✅ Consistent code patterns
- ✅ Adherence to Clean Architecture
- ✅ Proper use of Buildmotion libraries
- ✅ Better Copilot suggestions
- ✅ Faster development
- ✅ Higher code quality
