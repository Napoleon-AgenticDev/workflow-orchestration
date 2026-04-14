---
meta:
  id: business-rules
  title: Business Rules
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: 2026-02-23T00:00:00.000Z
title: Business Rules and Validation Guidelines
applies_to: null
priority: high
category: business-logic
---

# Business Rules and Validation Guidelines

## When to Use This Guidance

Apply when:
- Implementing business rules and validations
- Creating action classes for use cases
- Defining validation logic
- Building composable rule sets

## Choosing the Right Library

### Decision Tree

```
Need to validate data?
├─ Simple validation (forms, input)
│  └─ Use: @buildmotion/validation
│     📖 [validation.specification.md](../../.spec-motion/validation.specification.md)
│
├─ Business rules (classic pattern)
│  └─ Use: @buildmotion/rules-engine
│     📖 [rules-engine.specification.md](../../.spec-motion/rules-engine.specification.md)
│
├─ Reactive validation with Zod schemas
│  └─ Use: @buildmotion/zod-rules-engine
│     📖 [zod-rules-engine.specification.md](../../.spec-motion/zod-rules-engine.specification.md)
│
└─ Use case / command pattern
   └─ Use: @buildmotion/actions
      📖 [actions.specification.md](../../.spec-motion/actions.specification.md)
```

## 1. Actions Pattern (Use Cases)

Use actions to encapsulate business operations with validation and error handling.

### When to Use
- Implementing use cases
- Complex operations requiring multiple steps
- Operations needing validation before execution
- Commands that can succeed or fail

### Example

```typescript
import { ActionBase, ActionResult } from '@buildmotion/actions';
import { ValidationContext } from '@buildmotion/validation';
import { LoggingService } from '@buildmotion/logging';

export class CreateUserAction extends ActionBase {
  private logger = inject(LoggingService);
  private validationContext = new ValidationContext();
  
  constructor(
    private userData: CreateUserRequest
  ) {
    super();
  }
  
  preValidateAction(): void {
    // Add validation rules
    this.validationContext.addRule(
      new StringIsNotNullEmptyRange('Username', this.userData.username, 3, 50)
    );
    this.validationContext.addRule(
      new IsTrue('Email is valid', this.isValidEmail(this.userData.email))
    );
  }
  
  performAction(): Observable<ActionResult> {
    return this.userService.createUser(this.userData).pipe(
      map(user => this.createSuccessResult(user)),
      catchError(err => {
        this.logger.error('User creation failed', err);
        return of(this.createFailedResult(err.message));
      })
    );
  }
}
```

**Full specification**: [actions.specification.md](../../.spec-motion/actions.specification.md)

## 2. Classic Rules Engine

Use for business rule validation with composite pattern.

### When to Use
- Complex validation rules
- Composable rule sets
- Priority-based rule execution
- Reusable validation logic

### Example

```typescript
import { RulePolicy } from '@buildmotion/rules-engine';
import { StringIsNotNullEmptyRange, IsTrue, Min } from '@buildmotion/rules-engine';

export class UserValidationRules extends RulePolicy {
  constructor(user: User) {
    super();
    this.rules.push(
      new StringIsNotNullEmptyRange('Username', user.username, 3, 50, true),
      new StringIsNotNullEmptyRange('Email', user.email, 5, 100, true),
      new Min('Age', user.age, 18, true)
    );
  }
}

// Usage
const validation = new UserValidationRules(userData);
validation.execute();

if (validation.isValid) {
  // Proceed with operation
}
```

**Full specification**: [rules-engine.specification.md](../../.spec-motion/rules-engine.specification.md)

## 3. Zod Rules Engine (Modern, Reactive)

Use for reactive validation with Zod schema integration and observables.

### When to Use
- Modern reactive applications
- Type-safe schema validation
- Observable-based workflows
- Integration with RxJS pipelines

### Example

```typescript
import { ZodValidationContext } from '@buildmotion/zod-rules-engine';
import { 
  StringIsNotNullEmptyRange, 
  GuidIsValid,
  Min 
} from '@buildmotion/zod-rules-engine';
import { z } from 'zod';

// Define Zod schema
const userSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3).max(50),
  email: z.string().email(),
  age: z.number().min(18)
});

export class UserValidation {
  validateUser(user: unknown): Observable<ValidationResult> {
    const context = new ZodValidationContext();
    
    // Add validation rules
    context.addRule(new GuidIsValid('User ID', user.id));
    context.addRule(new StringIsNotNullEmptyRange('Username', user.username, 3, 50));
    context.addRule(new Min('Age', user.age, 18));
    
    // Execute and return observable
    return context.validate().pipe(
      map(() => ({
        isValid: context.isValid,
        errors: context.results.filter(r => !r.isValid)
      }))
    );
  }
}
```

**Full specification**: [zod-rules-engine.specification.md](../../.spec-motion/zod-rules-engine.specification.md)

## 4. Simple Validation

For straightforward form validation and input checking.

### When to Use
- Form validation
- Input sanitization
- Simple business rules
- Frontend validation

### Example

```typescript
import { ValidationContext } from '@buildmotion/validation';
import { StringIsNotNullEmptyRange, IsTrue } from '@buildmotion/validation';

export class FormValidator {
  validateForm(formData: FormData): boolean {
    const context = new ValidationContext();
    
    context.addRule(
      new StringIsNotNullEmptyRange('Name', formData.name, 2, 100)
    );
    
    context.addRule(
      new IsTrue('Email format', this.isValidEmail(formData.email))
    );
    
    return context.isValid;
  }
}
```

**Full specification**: [validation.specification.md](../../.spec-motion/validation.specification.md)

## Library Comparison

| Feature | Actions | Rules Engine | Zod Rules Engine | Validation |
|---------|---------|--------------|------------------|------------|
| **Use Case Pattern** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Observable-based** | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| **Composite Rules** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Zod Integration** | ❌ No | ❌ No | ✅ Yes | ❌ No |
| **Priority Execution** | ❌ No | ✅ Yes | ✅ Yes | ❌ No |
| **Type Safety** | ✅ Good | ✅ Good | ✅ Excellent | ✅ Good |
| **Reactive** | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| **Best For** | Use cases | Classic rules | Modern reactive | Simple validation |

## Best Practices

### ✅ DO

- Use actions for complete use cases
- Use rules engines for validation logic
- Compose rules for complex validation
- Log validation failures
- Return meaningful error messages
- Test rules thoroughly

### ❌ DON'T

- Mix validation with presentation logic
- Skip error handling
- Create circular dependencies
- Duplicate validation rules
- Ignore validation results

## Testing Validation

All validation logic must be thoroughly tested:

```typescript
describe('UserValidationRules', () => {
  it('should validate valid user data', () => {
    const user = { username: 'john_doe', email: 'john@example.com', age: 25 };
    const rules = new UserValidationRules(user);
    rules.execute();
    expect(rules.isValid).toBe(true);
  });
  
  it('should fail for invalid username', () => {
    const user = { username: 'ab', email: 'john@example.com', age: 25 };
    const rules = new UserValidationRules(user);
    rules.execute();
    expect(rules.isValid).toBe(false);
  });
});
```

## Integration with Error Handling

Validation failures should be properly handled:

```typescript
import { ErrorHandler } from '@buildmotion/error-handling';

if (!validation.isValid) {
  const errorHandler = inject(ErrorHandler);
  errorHandler.handleError(new ValidationError(validation.results));
}
```

**Consult**: [error-handling.specification.md](../../.spec-motion/error-handling.specification.md)
