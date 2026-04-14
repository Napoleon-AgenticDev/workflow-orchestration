---
meta:
  id: validation-specification
  title: Validation Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
title: Validation Specification
category: Libraries
feature: Validation
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: '1.0'
aiContext: true
applyTo: []
keywords: []
topics: []
useCases: []
---

# Validation Library Specification

**Library Name:** `@buildmotion/validation`  
**Version:** 18.0.0  
**Author:** Matt Vaughn / Agent Alchemy  
**Category:** Cross-Cutting Concern  
**Architecture Layer:** Infrastructure

---

## 🎯 Purpose

The **Validation** library provides comprehensive input validation utilities and patterns for Angular applications. It integrates with the rules engine to provide declarative, reusable validation logic with detailed error reporting.

---

## 📋 Responsibilities

### Primary Responsibilities

1. **Input Validation**
   - Validate user inputs and form data
   - Provide common validation rules
   - Support custom validation logic

2. **Validation Context**
   - Manage validation state and context
   - Collect and aggregate validation results
   - Provide detailed validation feedback

3. **Integration with Forms**
   - Support Angular Reactive Forms
   - Provide custom validators
   - Enable real-time validation

### What This Library Does

- ✅ Validates user inputs and data
- ✅ Provides reusable validation rules
- ✅ Integrates with rules engine
- ✅ Supports custom validators
- ✅ Provides detailed validation messages
- ✅ Works with Angular forms

### What This Library Does NOT Do

- ❌ Execute business rules (use `@buildmotion/rules-engine`)
- ❌ Perform data transformation
- ❌ Handle form submission
- ❌ Manage form state

---

## 🏗️ Architecture & Design

### Clean Architecture Position

```
┌─────────────────────────────────────────┐
│  Cross-Cutting Concerns ← VALIDATION    │  ← Used by all layers
├─────────────────────────────────────────┤
│            Presentation Layer           │
├─────────────────────────────────────────┤
│         Infrastructure Layer            │
├─────────────────────────────────────────┤
│     Core (Entities & Use Cases)         │
└─────────────────────────────────────────┘
```

### Key Components

1. **ValidationContext**
   - Manages validation rules
   - Collects validation results
   - Provides validation summary

2. **Validation Rules**
   - Common validation rules (required, email, min/max, etc.)
   - Custom rule support
   - Composable validation logic

3. **ValidationResult**
   - Contains validation outcome
   - Provides error messages
   - Supports field-level errors

---

## 🔌 Dependencies

### Internal Dependencies

- `@buildmotion/rules-engine` - Rule execution engine
- `@buildmotion/foundation` - Base classes

### External Dependencies

- `tslib` - TypeScript runtime library

### Peer Dependencies

- `@angular/forms` - For Angular form validation (optional)
- `@angular/core` - For Angular integration

---

## 📦 Public API

### Core Exports

```typescript
// Validation Context
export class ValidationContext {
  source: string;
  results: ValidationResult[];
  
  addRule(rule: Rule): this;
  renderRules(): ValidationContextState;
}

// Validation Result
export class ValidationResult {
  isValid: boolean;
  message: string;
  target: string;
  ruleName: string;
}

// Common Validators
export class Validators {
  static required(message?: string): Rule;
  static email(message?: string): Rule;
  static minLength(length: number, message?: string): Rule;
  static maxLength(length: number, message?: string): Rule;
  static pattern(regex: RegExp, message?: string): Rule;
  static min(value: number, message?: string): Rule;
  static max(value: number, message?: string): Rule;
}
```

### Usage Example

```typescript
import { ValidationContext, Validators } from '@buildmotion/validation';

export class UserFormValidator {
  validate(formData: UserFormData): ValidationContextState {
    const context = new ValidationContext('UserForm');
    
    // Add validation rules
    context.addRule(Validators.required('Name is required'))
           .addRule(Validators.email('Valid email required'))
           .addRule(Validators.minLength(8, 'Password must be at least 8 characters'))
           .addRule(Validators.pattern(/[A-Z]/, 'Password must contain uppercase'));
    
    // Execute validation
    return context.renderRules(formData);
  }
}

// In component
export class RegistrationComponent {
  onSubmit(formData: UserFormData) {
    const validator = new UserFormValidator();
    const result = validator.validate(formData);
    
    if (result.isValid) {
      this.submitForm(formData);
    } else {
      this.displayErrors(result.results);
    }
  }
}
```

---

## 🔄 Integration with Angular Forms

### Reactive Forms

```typescript
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ValidationContext, Validators } from '@buildmotion/validation';

export function buildMotionValidator(
  ...rules: Rule[]
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const context = new ValidationContext();
    
    rules.forEach(rule => context.addRule(rule));
    
    const result = context.renderRules(control.value);
    
    if (result.isValid) {
      return null;
    }
    
    return {
      buildMotionValidation: {
        valid: false,
        errors: result.results.map(r => r.message)
      }
    };
  };
}

// Usage in form
export class UserFormComponent {
  userForm = this.fb.group({
    email: ['', [
      buildMotionValidator(
        Validators.required('Email is required'),
        Validators.email('Valid email required')
      )
    ]],
    password: ['', [
      buildMotionValidator(
        Validators.required('Password is required'),
        Validators.minLength(8, 'Minimum 8 characters'),
        Validators.pattern(/[A-Z]/, 'Must contain uppercase')
      )
    ]]
  });
}
```

---

## 🎨 Common Validation Rules

### Built-in Validators

```typescript
// Required field
Validators.required('This field is required')

// Email format
Validators.email('Please enter a valid email address')

// String length
Validators.minLength(3, 'Minimum 3 characters required')
Validators.maxLength(50, 'Maximum 50 characters allowed')

// Numeric range
Validators.min(0, 'Value must be at least 0')
Validators.max(100, 'Value cannot exceed 100')

// Pattern matching
Validators.pattern(/^\d{5}$/, 'Please enter a valid 5-digit ZIP code')
Validators.pattern(/^[a-zA-Z]+$/, 'Only letters allowed')

// Custom validation
Validators.custom((value) => {
  return value !== 'admin';
}, 'Username "admin" is reserved')
```

### Custom Validation Rules

```typescript
import { Rule, RuleResult } from '@buildmotion/rules-engine';

export class PasswordMatchRule extends Rule {
  constructor(
    private password: string,
    private confirmPassword: string
  ) {
    super('PasswordMatchRule');
  }

  execute(): RuleResult {
    this.isValid = this.password === this.confirmPassword;
    this.message = this.isValid
      ? 'Passwords match'
      : 'Passwords do not match';
    
    return new RuleResult(this.isValid, this.message, this.name);
  }
}

export class UniqueUsernameRule extends Rule {
  constructor(
    private username: string,
    private userService: UserService
  ) {
    super('UniqueUsernameRule');
  }

  async executeAsync(): Promise<RuleResult> {
    const exists = await this.userService.checkUsername(this.username);
    this.isValid = !exists;
    this.message = this.isValid
      ? 'Username available'
      : 'Username already taken';
    
    return new RuleResult(this.isValid, this.message, this.name);
  }
}
```

---

## 🧪 Testing Guidelines

### Testing Validators

```typescript
describe('EmailValidator', () => {
  it('should validate correct email format', () => {
    const context = new ValidationContext();
    context.addRule(Validators.email());
    
    const result = context.renderRules('user@example.com');
    
    expect(result.isValid).toBe(true);
  });

  it('should reject invalid email format', () => {
    const context = new ValidationContext();
    context.addRule(Validators.email('Invalid email'));
    
    const result = context.renderRules('invalid-email');
    
    expect(result.isValid).toBe(false);
    expect(result.results[0].message).toBe('Invalid email');
  });
});
```

---

## 📊 Best Practices

### Do's ✅

- Provide clear, user-friendly error messages
- Validate on both client and server
- Use built-in validators when possible
- Create reusable custom validators
- Test validation logic thoroughly
- Validate early and often
- Display field-level errors

### Don'ts ❌

- Don't rely solely on client-side validation
- Don't create overly complex validators
- Don't ignore edge cases
- Don't validate in multiple places
- Don't hardcode validation messages
- Don't skip async validation when needed

---

## 📚 Related Libraries

- **@buildmotion/rules-engine** - Business rules execution
- **@buildmotion/actions** - Action validation
- **@buildmotion/foundation** - Base classes
- **@buildmotion/error-handling** - Validation error handling

---

## 🔍 See Also

- [Clean Architecture Specification](./angular-clean-architecture.specification.md)
- [Rules Engine Specification](./rules-engine.specification.md)
- [Actions Specification](./actions.specification.md)
