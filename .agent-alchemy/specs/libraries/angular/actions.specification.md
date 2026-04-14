---
meta:
  id: actions-specification
  title: Actions Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
title: Actions Specification
category: Libraries
feature: Actions
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: '1.0'
aiContext: true
applyTo: []
keywords: []
topics: []
useCases: []
---

# Actions Library Specification

**Library Name:** `@buildmotion/actions`  
**Version:** 18.0.0  
**Author:** Matt Vaughn / Agent Alchemy  
**Category:** Infrastructure Layer  
**Architecture Layer:** Use Cases & Infrastructure

---

## 🎯 Purpose

The **Actions** library provides a robust implementation of the Action/Command pattern for Angular and Node.js applications. It enables the creation of reusable, testable, and composable business operations with consistent error handling and result reporting.

---

## 📋 Responsibilities

### Primary Responsibilities

1. **Action Pattern Implementation**

   - Provide base Action class for business operations
   - Define IAction interface for action contracts
   - Support action composition and chaining

2. **Result Handling**

   - Standardize action results with ActionResult
   - Capture success/failure states
   - Provide detailed error information

3. **Business Logic Encapsulation**
   - Encapsulate business operations in discrete actions
   - Support validation within actions
   - Enable action pipeline execution

### What This Library Does

- ✅ Defines reusable action patterns
- ✅ Provides consistent result handling
- ✅ Enables action composition
- ✅ Supports validation integration
- ✅ Facilitates testable business logic

### What This Library Does NOT Do

- ❌ Handle HTTP communications (use `@buildmotion/http-service`)
- ❌ Manage application configuration (use `@buildmotion/configuration`)
- ❌ Provide logging capabilities (use `@buildmotion/logging`)
- ❌ Execute business rules (use `@buildmotion/rules-engine`)

---

## 🏗️ Architecture & Design

### Clean Architecture Position

```txt
┌─────────────────────────────────────────┐
│         Cross-Cutting Concerns          │
├─────────────────────────────────────────┤
│            Presentation Layer           │
├─────────────────────────────────────────┤
│  Infrastructure Layer ← ACTIONS HERE    │
├─────────────────────────────────────────┤
│     Core (Entities & Use Cases)         │
└─────────────────────────────────────────┘
```

### Key Components

1. **Action (Base Class)**

   - Abstract base class for all actions
   - Provides lifecycle hooks (prepare, validate, execute)
   - Manages action context and results

2. **IAction (Interface)**

   - Defines the contract for action implementations
   - Ensures consistent action API
   - Supports dependency injection

3. **ActionResult**
   - Encapsulates action execution results
   - Contains success/failure status
   - Includes error messages and data

---

## 🔌 Dependencies

### Internal Dependencies

- `@buildmotion/foundation` - Base classes and utilities
- `@buildmotion/validation` - Validation rules support (optional)
- `@buildmotion/logging` - Logging within actions (optional)

### External Dependencies

- `tslib` - TypeScript runtime library
- `rxjs` - For observable-based actions (optional)

### Peer Dependencies

None - Pure TypeScript library

---

## 📦 Public API

### Core Exports

```typescript
// Base Action class
export abstract class Action<T> implements IAction {
  abstract execute(): ActionResult<T>;
}

// Action interface
export interface IAction {
  execute(): ActionResult<unknown>;
  prepare?(): void;
  validate?(): boolean;
}

// Action result
export class ActionResult<T> {
  isSuccess: boolean;
  message: string;
  data?: T;
  errors?: string[];
}
```

### Usage Example

```typescript
import { Action, ActionResult } from '@buildmotion/actions';

export class CreateUserAction extends Action<User> {
  constructor(private userData: CreateUserDto) {
    super();
  }

  prepare(): void {
    // Prepare action execution
    this.logger?.log('Preparing CreateUserAction');
  }

  validate(): boolean {
    // Validate input data
    if (!this.userData.email) {
      this.addError('Email is required');
      return false;
    }
    return true;
  }

  execute(): ActionResult<User> {
    if (!this.validate()) {
      return this.createFailedResult();
    }

    try {
      const user = this.userRepository.create(this.userData);
      return this.createSuccessResult(user);
    } catch (error) {
      return this.createErrorResult(error);
    }
  }
}
```

---

## 🎨 Design Patterns

### Command Pattern

- Each action is a command object
- Encapsulates a request as an object
- Supports undo/redo operations (if implemented)

### Template Method Pattern

- Action base class defines the algorithm structure
- Subclasses implement specific steps
- Lifecycle: prepare() → validate() → execute()

### Strategy Pattern

- Different action implementations can be swapped
- Actions define strategies for business operations
- Runtime selection of action strategies

---

## 🔄 Integration with Clean Architecture

### Use Case Implementation

Actions serve as Use Case implementations:

```typescript
// Use Case: Register New User
export class RegisterUserAction extends Action<User> {
  // Implementation encapsulates the use case logic
}

// Controller/Component uses the action
export class RegistrationComponent {
  register(formData: RegistrationForm) {
    const action = new RegisterUserAction(formData);
    const result = action.execute();

    if (result.isSuccess) {
      this.router.navigate(['/dashboard']);
    } else {
      this.showErrors(result.errors);
    }
  }
}
```

### Dependency Inversion

```typescript
// Define action interface
export interface ICreateOrderAction {
  execute(): ActionResult<Order>;
}

// Service depends on abstraction
export class OrderService {
  constructor(private createAction: ICreateOrderAction) {}

  createOrder(data: OrderData) {
    return this.createAction.execute();
  }
}
```

---

## ✅ Validation Integration

### With Validation Library

```typescript
import { Action, ActionResult } from '@buildmotion/actions';
import { ValidationContext } from '@buildmotion/validation';

export class ValidatedAction<T> extends Action<T> {
  protected validationContext: ValidationContext;

  validate(): boolean {
    this.validationContext = new ValidationContext();
    this.addValidationRules();

    const isValid = this.validationContext.renderRules().isValid;

    if (!isValid) {
      this.validationContext.results.forEach((result) => {
        this.addError(result.message);
      });
    }

    return isValid;
  }

  protected abstract addValidationRules(): void;
}
```

---

## 🧪 Testing Guidelines

### Unit Testing Actions

```typescript
describe('CreateUserAction', () => {
  let action: CreateUserAction;
  let mockRepository: UserRepository;

  beforeEach(() => {
    mockRepository = createMockUserRepository();
    action = new CreateUserAction(validUserData, mockRepository);
  });

  it('should create user successfully', () => {
    const result = action.execute();

    expect(result.isSuccess).toBe(true);
    expect(result.data).toBeDefined();
    expect(mockRepository.create).toHaveBeenCalled();
  });

  it('should fail when email is missing', () => {
    action = new CreateUserAction({ ...validUserData, email: '' });
    const result = action.execute();

    expect(result.isSuccess).toBe(false);
    expect(result.errors).toContain('Email is required');
  });
});
```

---

## 📊 Best Practices

### Do's ✅

- Keep actions focused on a single responsibility
- Implement proper validation before execution
- Return consistent ActionResult objects
- Use dependency injection for services
- Write comprehensive unit tests
- Document action purpose and usage

### Don'ts ❌

- Don't mix multiple use cases in one action
- Don't perform direct HTTP calls (use services)
- Don't hardcode configuration values
- Don't ignore validation results
- Don't catch and swallow errors silently
- Don't create circular dependencies

---

## 🔧 Configuration

This library requires no configuration. Actions are instantiated and executed as needed.

---

## 🚀 Usage in Applications

### Angular Service with Actions

```typescript
@Injectable({ providedIn: 'root' })
export class UserManagementService {
  constructor(
    private userRepository: UserRepository,
    private logger: LoggingService
  ) {}

  createUser(userData: CreateUserDto): Observable<ActionResult<User>> {
    const action = new CreateUserAction(userData);
    action.setLogger(this.logger);

    return of(action.execute());
  }

  updateUser(userId: string, data: UpdateUserDto): ActionResult<User> {
    return new UpdateUserAction(userId, data).execute();
  }
}
```

### Node.js Service with Actions

```typescript
export class UserService {
  async createUser(userData: CreateUserDto): Promise<ActionResult<User>> {
    const action = new CreateUserAction(userData);
    return action.execute();
  }
}
```

---

## 📚 Related Libraries

- **@buildmotion/foundation** - Base classes and utilities
- **@buildmotion/validation** - Input validation rules
- **@buildmotion/rules-engine** - Business rules execution
- **@buildmotion/logging** - Logging infrastructure
- **@buildmotion/error-handling** - Error handling utilities

---

## 🔍 See Also

- **[Actions Modernization Specification](./actions-modernization.specification.md)** - 🆕 Modernization strategy for Angular Signals, async/await, and reactive patterns
- [Clean Architecture Specification](./angular-clean-architecture.specification.md)
- [Rules Engine Specification](./rules-engine.specification.md)
- [Validation Specification](./validation.specification.md)
- [Foundation Specification](./foundation.specification.md)
