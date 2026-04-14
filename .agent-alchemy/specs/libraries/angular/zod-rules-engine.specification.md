---
meta:
  id: zod-rules-engine-specification
  title: Zod Rules Engine Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
title: Zod Rules Engine Specification
category: Libraries
feature: Zod Rules Engine
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: '1.0'
aiContext: true
applyTo: []
keywords: []
topics: []
useCases: []
---

# Zod Rules Engine Library Specification

**Library Name:** `@buildmotion/zod-rules-engine`  
**Version:** 18.0.0  
**Author:** Matt Vaughn / Agent Alchemy  
**Category:** Infrastructure Layer  
**Architecture Layer:** Infrastructure - Business Rules

---

## 🎯 Purpose

The **Zod Rules Engine** library provides a strongly-typed, event-driven, reactive rules engine built on top of Zod schema validation and RxJS observables. It combines the battle-tested Composite Design Pattern and Template Method Pattern from the original rules-engine with modern runtime type validation and reactive capabilities.

---

## 📋 Responsibilities

### Primary Responsibilities

1. **Type-Safe Validation**
   - Runtime type validation using Zod schemas
   - Compile-time type safety with TypeScript strict mode
   - Automatic type inference from schemas

2. **Reactive Rule Execution**
   - Observable-based rule execution
   - Reactive validation context with state streams
   - Event-driven validation state management

3. **Composable Business Rules**
   - Simple rules for single validations
   - Composite rules for complex validation scenarios
   - Rule composition and chaining

4. **Comprehensive Validation**
   - Primitive value validation (boolean, null checks)
   - Comparison validation (equality, ranges, min/max)
   - String validation (patterns, length, format)
   - Date validation (comparisons)
   - Custom validation rules

### What This Library Does

- ✅ Provides 14+ built-in validation rules with Zod schemas
- ✅ Enables reactive rule execution with Observables
- ✅ Supports composite rule patterns for complex validations
- ✅ Offers validation context with observable state management
- ✅ Provides rich error information with Zod integration
- ✅ Enables custom rule creation with strong typing

### What This Library Does NOT Do

- ❌ Replace form validation (use Angular's reactive forms)
- ❌ Handle HTTP validation (use `@buildmotion/http-service`)
- ❌ Provide UI components for validation display
- ❌ Execute business logic (use Actions or Services)

---

## 🏗️ Architecture & Design

### Clean Architecture Position

```
┌─────────────────────────────────────────┐
│         Cross-Cutting Concerns          │
├─────────────────────────────────────────┤
│            Presentation Layer           │
├─────────────────────────────────────────┤
│  Infrastructure ← ZOD-RULES-ENGINE HERE │
├─────────────────────────────────────────┤
│     Core (Entities & Use Cases)         │
└─────────────────────────────────────────┘
```

### Key Components

1. **RulePolicy<T>** (Base Class)
   - Abstract base for all rules
   - Contains Zod schema reference
   - Implements template method pattern with execute()
   - Polymorphic render() for rule-specific logic

2. **SimpleRule<T>**
   - Extends RulePolicy for single validation rules
   - Direct schema validation
   - Wraps specific Zod schemas

3. **CompositeRule<T>**
   - Extends RulePolicy for multi-rule validation
   - Contains array of child rules
   - Parallel execution with forkJoin
   - Schema composition using Zod

4. **RuleResult<T>**
   - Encapsulates validation results
   - Contains isValid, message, target, errors
   - Includes Zod validation result

5. **ZodValidationContext**
   - Reactive validation container
   - Observable state streams (state$, results$, isValid$)
   - Priority-based rule execution
   - Aggregates multiple rule results

---

## 🔌 Dependencies

### Internal Dependencies

- None - standalone library

### External Dependencies

- `zod` (^4.1.11) - TypeScript-first schema validation
- `rxjs` (7.8.1+) - Reactive Extensions for JavaScript
- `tslib` - TypeScript runtime library

### Peer Dependencies

- TypeScript 5.0.0 or higher
- RxJS 7.8.0 or higher

---

## 📦 Public API

### Core Interfaces

#### IRuleComponent<T>

```typescript
interface IRuleComponent<T = any> {
  execute(): Observable<RuleResult<T>>;
}
```

#### RuleResult<T>

```typescript
class RuleResult<T = any> {
  isValid: boolean;
  rulePolicy: RulePolicy<T>;
  message: string;
  target?: T;
  zodResult?: z.SafeParseReturnType<T, T>;
  errors?: z.ZodIssue[];
  
  setZodResult(result: z.SafeParseReturnType<T, T>): void;
}
```

### Base Classes

#### RulePolicy<T>

```typescript
abstract class RulePolicy<T = any> implements IRuleComponent<T> {
  name: string;
  message: string;
  isDisplayable: boolean;
  isValid: boolean;
  priority: number;
  severity: Severity;
  schema: z.ZodSchema<T>;
  
  constructor(
    name: string,
    message: string,
    isDisplayable: boolean,
    schema: z.ZodSchema<T>,
    severity?: Severity,
    priority?: number
  );
  
  execute(): Observable<RuleResult<T>>;
  abstract render(): RuleResult<T>;
}
```

#### SimpleRule<T>

```typescript
abstract class SimpleRule<T = any> extends RulePolicy<T> {
  constructor(
    name: string,
    message: string,
    isDisplayable: boolean,
    schema: z.ZodSchema<T>,
    severity?: Severity,
    priority?: number
  );
  
  abstract render(): RuleResult<T>;
}
```

#### CompositeRule<T>

```typescript
abstract class CompositeRule<T = any> extends RulePolicy<T> {
  rules: RulePolicy<any>[];
  
  constructor(
    name: string,
    message: string,
    isDisplayable: boolean,
    schema: z.ZodSchema<T>,
    severity?: Severity,
    priority?: number
  );
  
  render(): RuleResult<T>;
}
```

### Primitive Value Rules

#### IsTrue

```typescript
class IsTrue extends SimpleRule<boolean> {
  target: boolean;
  
  constructor(name: string, message: string, target: boolean);
  render(): RuleResult<boolean>;
}
```

#### IsFalse

```typescript
class IsFalse extends SimpleRule<boolean> {
  target: boolean;
  
  constructor(name: string, message: string, target: boolean);
  render(): RuleResult<boolean>;
}
```

#### IsNotNullOrUndefined

```typescript
class IsNotNullOrUndefined<T = any> extends SimpleRule<T> {
  target: T;
  
  constructor(name: string, message: string, target: T);
  render(): RuleResult<T>;
}
```

#### IsNullOrUndefined

```typescript
class IsNullOrUndefined extends SimpleRule<any> {
  target: any;
  
  constructor(name: string, message: string, target: any);
  render(): RuleResult<any>;
}
```

### Comparison Rules

#### AreEqual<T>

```typescript
class AreEqual<T> extends SimpleRule<T> {
  target: T;
  compare: T;
  
  constructor(name: string, message: string, target: T, compare: T);
  render(): RuleResult<T>;
}
```

#### AreNotEqual<T>

```typescript
class AreNotEqual<T> extends SimpleRule<T> {
  target: T;
  compare: T;
  
  constructor(name: string, message: string, target: T, compare: T);
  render(): RuleResult<T>;
}
```

#### Min

```typescript
class Min extends SimpleRule<number | string | boolean> {
  target: number | string | boolean;
  minValue: number;
  
  constructor(
    name: string,
    message: string,
    target: number | string | boolean,
    minValue: number
  );
  render(): RuleResult<number | string | boolean>;
}
```

#### Max

```typescript
class Max extends SimpleRule<number | string | boolean> {
  target: number | string | boolean;
  maxValue: number;
  
  constructor(
    name: string,
    message: string,
    target: number | string | boolean,
    maxValue: number
  );
  render(): RuleResult<number | string | boolean>;
}
```

#### Range

```typescript
class Range extends SimpleRule<number> {
  target: number;
  minValue: number;
  maxValue: number;
  
  constructor(
    name: string,
    message: string,
    target: number,
    minValue: number,
    maxValue: number
  );
  render(): RuleResult<number>;
}
```

### String Rules

#### StringIsRegExMatch

```typescript
class StringIsRegExMatch extends SimpleRule<string> {
  target: string;
  pattern: RegExp;
  
  constructor(name: string, message: string, target: string, pattern: RegExp);
  render(): RuleResult<string>;
}
```

#### StringIsNotNullEmptyRange

```typescript
class StringIsNotNullEmptyRange extends CompositeRule<string> {
  target: string;
  minLength: number;
  maxLength: number;
  
  constructor(
    name: string,
    message: string,
    target: string,
    minLength: number,
    maxLength: number
  );
}
```

#### GuidIsValid

```typescript
class GuidIsValid extends SimpleRule<string> {
  target: string;
  
  constructor(name: string, message: string, target: string);
  render(): RuleResult<string>;
}
```

### Date Rules

#### DateIsGreaterThanComparisonDate

```typescript
class DateIsGreaterThanComparisonDate extends SimpleRule<Date> {
  target: Date;
  comparisonDate: Date;
  
  constructor(
    name: string,
    message: string,
    target: Date,
    comparisonDate: Date
  );
  render(): RuleResult<Date>;
}
```

### Validation Context

#### ZodValidationContext

```typescript
class ZodValidationContext {
  source: string;
  state: ValidationContextState;
  results: RuleResult<any>[];
  rules: RulePolicy<any>[];
  isValid: boolean;
  
  // Observable streams
  state$: Observable<ValidationContextState>;
  results$: Observable<RuleResult<any>[]>;
  isValid$: Observable<boolean>;
  
  constructor(source?: string);
  
  addRule(rule: RulePolicy<any>): this;
  withSource(source: string): this;
  renderRules(): Observable<RuleResult<any>[]>;
  hasRuleViolations(): boolean;
}
```

### Enumerations

#### ValidationContextState

```typescript
enum ValidationContextState {
  NotEvaluated = 0,
  Evaluating = 1,
  Success = 2,
  Failure = 3
}
```

#### Severity

```typescript
enum Severity {
  Information = 1,
  Warning = 2,
  Error = 3,
  Exception = 4
}
```

#### RenderType

```typescript
enum RenderType {
  EvaluateAllRules = 1,
  ExitOnFirstFalseEvaluation = 2
}
```

---

## 🎨 Design Patterns

### 1. **Composite Pattern**
- RulePolicy is the component interface
- SimpleRule represents leaf nodes (single validations)
- CompositeRule represents composite nodes (multiple validations)
- Uniform interface for simple and composite rules

### 2. **Template Method Pattern**
- execute() defines the execution template
- render() is the polymorphic step implemented by subclasses
- Guarantees consistent execution pipeline
- Enforces Observable-based results

### 3. **Strategy Pattern** (Zod Schemas)
- Each rule encapsulates a validation strategy
- Zod schemas define validation logic
- Interchangeable validation strategies
- Schema composition for complex strategies

### 4. **Observer Pattern** (via RxJS)
- Rules emit results through Observables
- Validation context publishes state changes
- Subscribers react to validation events
- Decoupled validation and reaction

---

## 🔄 Integration with Clean Architecture

### Use in Actions (Infrastructure Layer)

```typescript
import { Injectable } from '@angular/core';
import { Action, ActionResult } from '@buildmotion/actions';
import { 
  ZodValidationContext, 
  IsNotNullOrUndefined, 
  StringIsNotNullEmptyRange,
  Min 
} from '@buildmotion/zod-rules-engine';
import { firstValueFrom } from 'rxjs';

interface CreateUserInput {
  name: string;
  email: string;
  age: number;
}

@Injectable()
export class CreateUserAction extends Action {
  constructor(private input: CreateUserInput) {
    super();
  }
  
  async validateAction(): Promise<boolean> {
    const context = new ZodValidationContext('CreateUser');
    
    context
      .addRule(new IsNotNullOrUndefined('NameRequired', 'Name is required', this.input.name))
      .addRule(new StringIsNotNullEmptyRange(
        'NameLength',
        'Name must be 1-100 characters',
        this.input.name,
        1,
        100
      ))
      .addRule(new IsNotNullOrUndefined('EmailRequired', 'Email is required', this.input.email))
      .addRule(new Min('MinAge', 'Age must be at least 18', this.input.age, 18));
    
    // Execute all rules
    await firstValueFrom(context.renderRules());
    
    return context.isValid;
  }
  
  async performAction(): Promise<void> {
    // Create user logic here
  }
}
```

### Use in Services with Reactive Validation

```typescript
import { Injectable, Signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { 
  ZodValidationContext, 
  ValidationContextState 
} from '@buildmotion/zod-rules-engine';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  private context = new ZodValidationContext('FormValidation');
  
  // Convert Observable to Signal
  validationState = toSignal(this.context.state$, { 
    initialValue: ValidationContextState.NotEvaluated 
  });
  
  isValid = toSignal(this.context.isValid$, { initialValue: false });
  errors = toSignal(this.context.results$, { initialValue: [] });
  
  // Computed signal for error messages
  errorMessages = computed(() => 
    this.errors()
      .filter(r => !r.isValid)
      .map(r => r.message)
  );
  
  addRule(rule: RulePolicy<any>): void {
    this.context.addRule(rule);
  }
  
  validate(): Observable<RuleResult<any>[]> {
    return this.context.renderRules();
  }
}
```

### Custom Rule Creation

#### Simple Custom Rule

```typescript
import { z } from 'zod';
import { SimpleRule, RuleResult } from '@buildmotion/zod-rules-engine';

export class IsEven extends SimpleRule<number> {
  target: number;

  constructor(name: string, message: string, target: number) {
    const schema = z.number().refine(
      (val) => val % 2 === 0,
      { message: 'Number must be even' }
    );
    super(name, message, true, schema);
    this.target = target;
  }

  override render(): RuleResult<number> {
    const zodResult = this.schema.safeParse(this.target);
    this.isValid = zodResult.success;
    
    const result = new RuleResult(this, this.target);
    result.setZodResult(zodResult);
    return result;
  }
}

// Usage
const rule = new IsEven('CheckEven', 'Value must be even', 10);
rule.execute().subscribe(result => {
  console.log('Is valid:', result.isValid); // true
});
```

#### Composite Custom Rule

```typescript
import { z } from 'zod';
import { 
  CompositeRule, 
  IsNotNullOrUndefined, 
  StringIsRegExMatch 
} from '@buildmotion/zod-rules-engine';

export class EmailValidation extends CompositeRule<string> {
  target: string;

  constructor(name: string, message: string, target: string) {
    const schema = z.string().email().min(5).max(100);
    super(name, message, false, schema);
    this.target = target;
    this.configureRules();
  }

  private configureRules(): void {
    // Must not be null
    this.rules.push(
      new IsNotNullOrUndefined('EmailNotNull', 'Email is required', this.target)
    );
    
    // Must match email pattern
    if (this.target) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      this.rules.push(
        new StringIsRegExMatch(
          'EmailPattern',
          'Invalid email format',
          this.target,
          emailPattern
        )
      );
    }
  }
}

// Usage
const email = 'user@example.com';
const validation = new EmailValidation('ValidateEmail', 'Email validation failed', email);
validation.execute().subscribe(result => {
  console.log('Is valid:', result.isValid);
  console.log('Errors:', result.errors);
});
```

### Reactive Patterns with RxJS

#### Parallel Rule Execution

```typescript
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

const rule1 = new IsTrue('Check1', 'Must be true', true);
const rule2 = new Min('Check2', 'Must be >= 5', 10, 5);
const rule3 = new IsNotNullOrUndefined('Check3', 'Must not be null', 'value');

// Execute all rules in parallel
forkJoin([
  rule1.execute(),
  rule2.execute(),
  rule3.execute()
]).pipe(
  map(results => results.every(r => r.isValid))
).subscribe(allValid => {
  console.log('All rules passed:', allValid);
});
```

#### Reactive Validation Context

```typescript
const context = new ZodValidationContext('FormValidation');

// Subscribe to state changes
context.state$.subscribe(state => {
  console.log('Validation state:', ValidationContextState[state]);
});

// Subscribe to validation status
context.isValid$.subscribe(isValid => {
  console.log('Form is valid:', isValid);
});

// Subscribe to results
context.results$.subscribe(results => {
  const failures = results.filter(r => !r.isValid);
  console.log('Failed rules:', failures.map(r => r.message));
});

// Add rules and execute
context
  .addRule(new IsTrue('Active', 'Must be active', true))
  .addRule(new Min('MinAge', 'Age must be >= 18', 25, 18))
  .renderRules()
  .subscribe();
```

---

## 🧪 Testing Guidelines

### Testing Simple Rules

```typescript
import { firstValueFrom } from 'rxjs';
import { IsTrue, IsFalse, Min, Max } from '@buildmotion/zod-rules-engine';

describe('IsTrue', () => {
  describe('Happy Path', () => {
    it('should validate when target is true', async () => {
      const rule = new IsTrue('CheckTrue', 'Value must be true', true);
      const result = await firstValueFrom(rule.execute());
      
      expect(result.isValid).toBe(true);
      expect(result.target).toBe(true);
    });
  });
  
  describe('Alternate Flows', () => {
    it('should fail when target is false', async () => {
      const rule = new IsTrue('CheckTrue', 'Value must be true', false);
      const result = await firstValueFrom(rule.execute());
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBeTruthy();
      expect(result.errors).toBeDefined();
    });
  });
});

describe('Range', () => {
  it('should validate when value is within range', async () => {
    const rule = new Range('CheckRange', 'Value must be 1-10', 5, 1, 10);
    const result = await firstValueFrom(rule.execute());
    
    expect(result.isValid).toBe(true);
  });
  
  it('should fail when value is below minimum', async () => {
    const rule = new Range('CheckRange', 'Value must be 1-10', 0, 1, 10);
    const result = await firstValueFrom(rule.execute());
    
    expect(result.isValid).toBe(false);
  });
  
  it('should fail when value is above maximum', async () => {
    const rule = new Range('CheckRange', 'Value must be 1-10', 11, 1, 10);
    const result = await firstValueFrom(rule.execute());
    
    expect(result.isValid).toBe(false);
  });
});
```

### Testing Composite Rules

```typescript
import { StringIsNotNullEmptyRange } from '@buildmotion/zod-rules-engine';

describe('StringIsNotNullEmptyRange', () => {
  it('should validate valid string within range', async () => {
    const rule = new StringIsNotNullEmptyRange(
      'ValidateName',
      'Name must be 1-50 characters',
      'John Doe',
      1,
      50
    );
    const result = await firstValueFrom(rule.execute());
    
    expect(result.isValid).toBe(true);
  });
  
  it('should fail for null string', async () => {
    const rule = new StringIsNotNullEmptyRange(
      'ValidateName',
      'Name is required',
      null as any,
      1,
      50
    );
    const result = await firstValueFrom(rule.execute());
    
    expect(result.isValid).toBe(false);
  });
  
  it('should fail for string too short', async () => {
    const rule = new StringIsNotNullEmptyRange(
      'ValidateName',
      'Name must be 5-50 characters',
      'Joe',
      5,
      50
    );
    const result = await firstValueFrom(rule.execute());
    
    expect(result.isValid).toBe(false);
  });
});
```

### Testing Validation Context

```typescript
import { ZodValidationContext, IsTrue, Min } from '@buildmotion/zod-rules-engine';

describe('ZodValidationContext', () => {
  it('should execute multiple rules and aggregate results', async () => {
    const context = new ZodValidationContext('TestContext');
    
    context
      .addRule(new IsTrue('Check1', 'Must be true', true))
      .addRule(new Min('Check2', 'Must be >= 5', 10, 5));
    
    const results = await firstValueFrom(context.renderRules());
    
    expect(results.length).toBe(2);
    expect(context.isValid).toBe(true);
    expect(context.hasRuleViolations()).toBe(false);
  });
  
  it('should detect rule violations', async () => {
    const context = new ZodValidationContext('TestContext');
    
    context
      .addRule(new IsTrue('Check1', 'Must be true', false)) // will fail
      .addRule(new Min('Check2', 'Must be >= 5', 3, 5)); // will fail
    
    await firstValueFrom(context.renderRules());
    
    expect(context.isValid).toBe(false);
    expect(context.hasRuleViolations()).toBe(true);
    expect(context.results.filter(r => !r.isValid).length).toBe(2);
  });
  
  it('should emit state changes through observables', (done) => {
    const context = new ZodValidationContext('TestContext');
    const states: ValidationContextState[] = [];
    
    context.state$.subscribe(state => {
      states.push(state);
    });
    
    context.addRule(new IsTrue('Check', 'Must be true', true));
    
    context.renderRules().subscribe(() => {
      expect(states).toContain(ValidationContextState.Evaluating);
      expect(states).toContain(ValidationContextState.Success);
      done();
    });
  });
});
```

---

## 📊 Best Practices

### Do's ✅

1. **Use Type Parameters for Generic Rules**
   ```typescript
   // ✅ Good - type-safe
   const rule = new AreEqual<number>('CheckEqual', 'Must equal 5', value, 5);
   ```

2. **Leverage Zod Schemas for Complex Validation**
   ```typescript
   // ✅ Good - use Zod's powerful schema composition
   const schema = z.object({
     name: z.string().min(1).max(100),
     email: z.string().email(),
     age: z.number().min(18)
   });
   ```

3. **Use Validation Context for Multiple Rules**
   ```typescript
   // ✅ Good - aggregate multiple validations
   const context = new ZodValidationContext('UserValidation');
   context
     .addRule(rule1)
     .addRule(rule2)
     .addRule(rule3);
   await firstValueFrom(context.renderRules());
   ```

4. **Create Custom Rules for Domain-Specific Validation**
   ```typescript
   // ✅ Good - encapsulate domain logic
   class IsValidSKU extends SimpleRule<string> {
     // SKU-specific validation logic
   }
   ```

5. **Use Observable Operators for Advanced Scenarios**
   ```typescript
   // ✅ Good - compose with RxJS
   rule.execute().pipe(
     map(result => result.isValid),
     catchError(() => of(false))
   ).subscribe();
   ```

### Don'ts ❌

1. **Don't Ignore Zod Validation Results**
   ```typescript
   // ❌ Bad - losing detailed error information
   const result = await firstValueFrom(rule.execute());
   if (!result.isValid) { /* generic error */ }
   
   // ✅ Good - use Zod errors for detailed feedback
   if (!result.isValid && result.errors) {
     result.errors.forEach(error => {
       console.log(error.message, error.path);
     });
   }
   ```

2. **Don't Create Rules Without Proper Error Messages**
   ```typescript
   // ❌ Bad - unclear error message
   new Min('Check', 'Invalid', value, 5);
   
   // ✅ Good - descriptive message
   new Min('MinAge', 'Age must be at least 18 years', age, 18);
   ```

3. **Don't Mix Synchronous and Observable Patterns**
   ```typescript
   // ❌ Bad - inconsistent pattern
   const syncResult = rule.render(); // synchronous
   
   // ✅ Good - always use execute() for observables
   const result = await firstValueFrom(rule.execute());
   ```

4. **Don't Forget to Handle Observable Subscriptions**
   ```typescript
   // ❌ Bad - memory leak potential
   rule.execute().subscribe(result => {
     // process result
   });
   
   // ✅ Good - complete or use firstValueFrom
   const result = await firstValueFrom(rule.execute());
   ```

5. **Don't Ignore Type Safety**
   ```typescript
   // ❌ Bad - losing type information
   const rule = new AreEqual('Check', 'Must match', value1, value2);
   
   // ✅ Good - explicit types
   const rule = new AreEqual<User>('Check', 'Users must match', user1, user2);
   ```

---

## 🔐 Security Considerations

1. **Input Validation**
   - Always validate untrusted input with appropriate rules
   - Use Zod schemas to enforce expected data structures
   - Combine multiple rules for comprehensive validation

2. **Error Message Sanitization**
   - Don't expose sensitive data in error messages
   - Use generic messages for public-facing errors
   - Log detailed errors server-side only

3. **Type Safety**
   - Leverage TypeScript strict mode
   - Use Zod for runtime type validation
   - Validate data at application boundaries

4. **Schema Injection Prevention**
   - Don't allow user input to define validation schemas
   - Define schemas statically or from trusted sources
   - Validate schema definitions if dynamic

---

## 📈 Performance Considerations

1. **Lazy Evaluation**
   - Rules are only executed when needed
   - Observable-based execution allows cancellation
   - Composite rules can short-circuit on first failure

2. **Caching**
   - Consider caching Zod schema instances
   - Reuse rule instances when validating similar data
   - Cache validation context results when appropriate

3. **Parallel Execution**
   - Independent rules can execute in parallel with forkJoin
   - Validation context uses parallel execution
   - Reduces total validation time

4. **Memory Management**
   - Complete observables to prevent memory leaks
   - Use firstValueFrom for one-time validations
   - Unsubscribe from long-lived context subscriptions

---

## 🚀 Migration from @buildmotion/rules-engine

### Similarities

- Same Composite Pattern structure
- Same Template Method Pattern with execute/render
- Same rule naming and structure
- Same RuleResult concept

### Differences

| Classic Rules Engine | Zod Rules Engine |
|---------------------|------------------|
| Synchronous render() | Observable execute() |
| No runtime type validation | Zod schema validation |
| Manual result creation | Zod SafeParseResult |
| Simple error messages | Rich Zod error details |
| No reactive context | Observable state streams |

### Migration Example

**Before (Classic Rules Engine):**
```typescript
import { IsTrue, ValidationContext } from '@buildmotion/rules-engine';

const rule = new IsTrue('Check', 'Must be true', true);
const result = rule.render();

const context = new ValidationContext();
context.addRule(rule);
const results = context.renderRules();
```

**After (Zod Rules Engine):**
```typescript
import { IsTrue, ZodValidationContext } from '@buildmotion/zod-rules-engine';
import { firstValueFrom } from 'rxjs';

const rule = new IsTrue('Check', 'Must be true', true);
const result = await firstValueFrom(rule.execute());

const context = new ZodValidationContext();
context.addRule(rule);
const results = await firstValueFrom(context.renderRules());
```

### When to Use Each

**Use Classic Rules Engine When:**
- Simple synchronous validation needed
- No reactive requirements
- Existing codebase using classic patterns
- Minimal dependencies preferred

**Use Zod Rules Engine When:**
- Need runtime type validation
- Reactive validation workflows required
- Complex schema composition needed
- Rich error information desired
- Modern TypeScript patterns preferred

---

## 📚 Related Libraries

- **@buildmotion/rules-engine** - Original synchronous rules engine
- **@buildmotion/validation** - Form validation utilities
- **@buildmotion/actions** - Action pattern with validation integration
- **[Zod](https://github.com/colinhacks/zod)** - TypeScript-first schema validation
- **[RxJS](https://rxjs.dev/)** - Reactive Extensions for JavaScript

---

## 🔍 See Also

- [Clean Architecture Specification](./angular-clean-architecture.specification.md)
- [Rules Engine Specification](./rules-engine.specification.md) - Classic synchronous version
- [Validation Specification](./validation.specification.md)
- [Actions Specification](./actions.specification.md)
- [Library README](../libs/zod-rules-engine/README.md) - Quick start and usage guide
- [Technical Specification](../libs/zod-rules-engine/SPECIFICATION.md) - Detailed architecture
- [Examples](../libs/zod-rules-engine/EXAMPLES.md) - Comprehensive usage examples
- [Observable Subscription Management](../libs/zod-rules-engine/OBSERVABLE_SUBSCRIPTION_MANAGEMENT.md) - RxJS best practices
