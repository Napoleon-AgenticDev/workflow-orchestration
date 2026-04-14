---
meta:
  id: rules-engine-specification
  title: Rules Engine Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
title: Rules Engine Specification
category: Libraries
feature: Rules Engine
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: '1.0'
aiContext: true
applyTo: []
keywords: []
topics: []
useCases: []
---

# Rules Engine Library Specification

**Library Name:** `@buildmotion/rules-engine`  
**Version:** 18.0.0  
**Author:** Matt Vaughn / Agent Alchemy  
**Category:** Infrastructure Layer  
**Architecture Layer:** Core / Infrastructure

---

## 🎯 Purpose

The **Rules Engine** library provides a powerful, composable business rules engine for TypeScript and Angular applications. It enables the creation, composition, and execution of business rules with support for validation, conditional logic, and complex rule hierarchies.

---

## 📋 Responsibilities

### Primary Responsibilities

1. **Business Rule Execution**
   - Define and execute business rules
   - Support rule composition and nesting
   - Evaluate rule conditions and actions

2. **Rule Validation**
   - Validate business logic constraints
   - Provide detailed validation results
   - Support custom validation rules

3. **Conditional Logic**
   - Support complex conditional expressions
   - Enable rule chaining and composition
   - Provide rule priority and sequencing

### What This Library Does

- ✅ Executes business rules and validations
- ✅ Supports rule composition (AND, OR, NOT)
- ✅ Provides detailed rule execution results
- ✅ Enables complex business logic encapsulation
- ✅ Supports reusable rule definitions
- ✅ Provides rule context for execution

### What This Library Does NOT Do

- ❌ Perform HTTP communications
- ❌ Manage application state
- ❌ Handle UI interactions
- ❌ Provide logging (use `@buildmotion/logging`)

---

## 🏗️ Architecture & Design

### Clean Architecture Position

```
┌─────────────────────────────────────────┐
│         Cross-Cutting Concerns          │
├─────────────────────────────────────────┤
│            Presentation Layer           │
├─────────────────────────────────────────┤
│  Infrastructure Layer ← RULES HERE      │
├─────────────────────────────────────────┤
│     Core (Entities & Use Cases)         │  ← Also used here
└─────────────────────────────────────────┘
```

### Key Components

1. **Rule (Base Class)**
   - Abstract base for all rules
   - Provides execution context
   - Manages rule results

2. **RulePolicy**
   - Container for related rules
   - Executes rule sets
   - Aggregates rule results

3. **RuleResult**
   - Encapsulates rule execution results
   - Contains validation messages
   - Tracks rule success/failure

4. **Composite Rules**
   - AndRule: All rules must pass
   - OrRule: At least one rule must pass
   - NotRule: Negates rule result

---

## 🔌 Dependencies

### Internal Dependencies

- `@buildmotion/foundation` - Base classes
- `@buildmotion/logging` - Logging support (optional)

### External Dependencies

- `tslib` - TypeScript runtime library
- `guid-typescript` - GUID generation

### Peer Dependencies

None - Pure TypeScript library (works with Node.js and Angular)

---

## 📦 Public API

### Core Exports

```typescript
// Base Rule
export abstract class Rule {
  abstract execute(context: any): RuleResult;
  
  isValid: boolean;
  message: string;
  priority: number;
}

// Rule Policy
export class RulePolicy {
  rules: Rule[] = [];
  
  addRule(rule: Rule): void;
  execute(context?: any): RuleResult[];
  renderRules(context?: any): PolicyResult;
}

// Rule Result
export class RuleResult {
  isValid: boolean;
  message: string;
  target: string;
  ruleName: string;
}

// Composite Rules
export class AndRule extends Rule {
  constructor(private rules: Rule[]) { super(); }
}

export class OrRule extends Rule {
  constructor(private rules: Rule[]) { super(); }
}

export class NotRule extends Rule {
  constructor(private rule: Rule) { super(); }
}
```

### Usage Example

```typescript
import { Rule, RulePolicy, RuleResult } from '@buildmotion/rules-engine';

// Define custom business rule
export class MinimumAgeRule extends Rule {
  constructor(private minimumAge: number) {
    super('MinimumAgeRule');
  }

  execute(context: { age: number }): RuleResult {
    this.isValid = context.age >= this.minimumAge;
    this.message = this.isValid
      ? 'Age requirement met'
      : `Age must be at least ${this.minimumAge}`;
    
    return new RuleResult(this.isValid, this.message, this.name);
  }
}

// Use in validation context
export class UserRegistrationValidator {
  validate(userData: UserData): PolicyResult {
    const policy = new RulePolicy();
    
    // Add business rules
    policy.addRule(new MinimumAgeRule(18));
    policy.addRule(new EmailFormatRule());
    policy.addRule(new PasswordStrengthRule());
    
    // Execute all rules
    return policy.renderRules(userData);
  }
}

// In component or service
export class RegistrationComponent {
  onSubmit(formData: UserData) {
    const validator = new UserRegistrationValidator();
    const result = validator.validate(formData);
    
    if (result.isValid) {
      this.processRegistration(formData);
    } else {
      this.showErrors(result.errors);
    }
  }
}
```

---

## 🎨 Design Patterns

### Strategy Pattern

- Each rule is a strategy
- Rules can be swapped at runtime
- Different validation strategies for different contexts

### Composite Pattern

- Rules can contain other rules
- Hierarchical rule structures
- Complex business logic composition

### Chain of Responsibility

- Rules executed in sequence
- Each rule processes context
- Rule execution can be short-circuited

---

## 🔄 Integration with Clean Architecture

### Core Layer Usage

```typescript
// Domain Rule in Core Layer
export class ProductInventoryRule extends Rule {
  execute(context: { product: Product, quantity: number }): RuleResult {
    const available = context.product.stockQuantity;
    const requested = context.quantity;
    
    this.isValid = requested <= available;
    this.message = this.isValid
      ? 'Inventory check passed'
      : `Only ${available} items available`;
    
    return new RuleResult(this.isValid, this.message, this.name);
  }
}

// Use Case with Rules
export class PlaceOrderUseCase {
  execute(order: Order): ActionResult {
    const policy = new RulePolicy();
    
    // Add business rules
    policy.addRule(new ProductInventoryRule());
    policy.addRule(new MinimumOrderValueRule(25));
    policy.addRule(new ValidShippingAddressRule());
    
    const result = policy.renderRules(order);
    
    if (!result.isValid) {
      return ActionResult.failure(result.errors);
    }
    
    return this.processOrder(order);
  }
}
```

### Complex Rule Composition

```typescript
export class OrderValidationPolicy extends RulePolicy {
  constructor() {
    super();
    this.configureRules();
  }

  private configureRules(): void {
    // All of these must pass
    this.addRule(new AndRule([
      new NotEmptyCartRule(),
      new ValidPaymentMethodRule(),
      new ValidShippingAddressRule()
    ]));
    
    // At least one payment method
    this.addRule(new OrRule([
      new CreditCardRule(),
      new PayPalRule(),
      new BankTransferRule()
    ]));
    
    // Special business rule
    this.addRule(new IfThenElseRule(
      new PremiumCustomerRule(),
      new NoMinimumOrderRule(),
      new MinimumOrderRule(25)
    ));
  }
}
```

---

## 🧪 Testing Guidelines

### Unit Testing Rules

```typescript
describe('MinimumAgeRule', () => {
  let rule: MinimumAgeRule;

  beforeEach(() => {
    rule = new MinimumAgeRule(18);
  });

  it('should pass when age meets minimum', () => {
    const result = rule.execute({ age: 21 });
    
    expect(result.isValid).toBe(true);
    expect(rule.isValid).toBe(true);
  });

  it('should fail when age is below minimum', () => {
    const result = rule.execute({ age: 16 });
    
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('at least 18');
  });
});
```

### Testing Rule Policies

```typescript
describe('UserRegistrationPolicy', () => {
  let policy: UserRegistrationPolicy;

  beforeEach(() => {
    policy = new UserRegistrationPolicy();
  });

  it('should validate valid user data', () => {
    const validUser = {
      age: 25,
      email: 'user@example.com',
      password: 'SecurePass123!'
    };
    
    const result = policy.renderRules(validUser);
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail with multiple validation errors', () => {
    const invalidUser = {
      age: 15,
      email: 'invalid-email',
      password: '123'
    };
    
    const result = policy.renderRules(invalidUser);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});
```

---

## 📊 Best Practices

### Do's ✅

- Create focused, single-purpose rules
- Use descriptive rule names
- Provide clear validation messages
- Compose complex rules from simple ones
- Test rules in isolation
- Document business rule purpose
- Use rule priorities for execution order
- Cache rule results when appropriate

### Don'ts ❌

- Don't mix validation with business logic execution
- Don't create overly complex composite rules
- Don't hardcode validation messages
- Don't ignore rule execution context
- Don't create circular rule dependencies
- Don't perform side effects in rules
- Don't skip rule testing

---

## 🔧 Advanced Patterns

### Rule Context

```typescript
export interface RuleContext {
  data: any;
  metadata: {
    userId?: string;
    timestamp?: Date;
    requestId?: string;
  };
  services?: {
    repository?: any;
    validator?: any;
  };
}

export class ContextAwareRule extends Rule {
  execute(context: RuleContext): RuleResult {
    const user = context.metadata.userId;
    const data = context.data;
    
    // Use context for rule evaluation
    this.isValid = this.evaluateWithContext(data, user);
    
    return new RuleResult(this.isValid, this.message, this.name);
  }
}
```

### Async Rules

```typescript
export abstract class AsyncRule extends Rule {
  abstract executeAsync(context: any): Promise<RuleResult>;
  
  execute(context: any): RuleResult {
    throw new Error('Use executeAsync for async rules');
  }
}

export class AsyncRulePolicy {
  async renderRules(context: any): Promise<PolicyResult> {
    const results = await Promise.all(
      this.rules.map(rule => 
        rule instanceof AsyncRule 
          ? rule.executeAsync(context)
          : Promise.resolve(rule.execute(context))
      )
    );
    
    return this.aggregateResults(results);
  }
}
```

### Rule Caching

```typescript
export class CachedRule extends Rule {
  private cache = new Map<string, RuleResult>();
  
  execute(context: any): RuleResult {
    const cacheKey = this.getCacheKey(context);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    const result = this.evaluateRule(context);
    this.cache.set(cacheKey, result);
    
    return result;
  }
  
  protected abstract evaluateRule(context: any): RuleResult;
  protected abstract getCacheKey(context: any): string;
}
```

---

## 🚀 Real-World Examples

### E-Commerce Order Validation

```typescript
export class OrderValidationService {
  validateOrder(order: Order): PolicyResult {
    const policy = new RulePolicy();
    
    // Inventory rules
    order.items.forEach(item => {
      policy.addRule(new ProductAvailableRule(item));
      policy.addRule(new ProductNotDiscontinuedRule(item));
    });
    
    // Financial rules
    policy.addRule(new MinimumOrderValueRule(10));
    policy.addRule(new MaximumOrderValueRule(10000));
    policy.addRule(new ValidPaymentMethodRule(order.payment));
    
    // Shipping rules
    policy.addRule(new ValidShippingAddressRule(order.shipping));
    policy.addRule(new ShippingMethodAvailableRule(order.shipping));
    
    // Customer rules
    policy.addRule(new CustomerInGoodStandingRule(order.customerId));
    
    return policy.renderRules(order);
  }
}
```

---

## 📚 Related Libraries

- **@buildmotion/validation** - Input validation utilities
- **@buildmotion/actions** - Action/command patterns
- **@buildmotion/foundation** - Base classes
- **@buildmotion/logging** - Logging infrastructure

---

## 🔍 See Also

- [Clean Architecture Specification](./angular-clean-architecture.specification.md)
- [Actions Specification](./actions.specification.md)
- [Validation Specification](./validation.specification.md)
- [Foundation Specification](./foundation.specification.md)
