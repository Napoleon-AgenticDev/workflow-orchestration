---
meta:
  id: components
  title: Components
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: 2026-02-23T00:00:00.000Z
title: Component Development Guidelines
applies_to: null
priority: high
category: components
---

# Component Development Guidelines

## When to Use This Guidance

Apply when:
- Creating new Angular components
- Working with component templates and styles
- Managing component state and lifecycle
- Implementing user interactions

## Primary Specification Reference

📖 **[Clean Architecture Specification](../../.spec-motion/angular-clean-architecture.specification.md)** - Presentation Layer section

## Component Architecture Principles

### 1. Components are Presentation Layer

Components should:
- ✅ Display data and handle user input
- ✅ Delegate business logic to services
- ✅ Use dependency injection for services
- ✅ Be as "dumb" as possible (smart components only coordinate)

Components should NOT:
- ❌ Contain business logic
- ❌ Make direct HTTP calls
- ❌ Perform complex calculations
- ❌ Manage cross-cutting concerns directly

### 2. Use Standalone Components (Angular v19)

```typescript
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent {
  private userService = inject(UserService);
  private logger = inject(LoggingService);
  
  users = signal<User[]>([]);
  loading = signal(false);
  
  ngOnInit() {
    this.loadUsers();
  }
  
  loadUsers() {
    this.loading.set(true);
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Failed to load users', err);
        this.loading.set(false);
      }
    });
  }
}
```

### 3. State Management with Signals

✅ **DO**: Use signals for reactive state
```typescript
export class TodoComponent {
  todos = signal<Todo[]>([]);
  filter = signal<FilterType>('all');
  
  // Computed signals
  filteredTodos = computed(() => {
    const todos = this.todos();
    const filter = this.filter();
    return todos.filter(t => this.matchesFilter(t, filter));
  });
}
```

## Integration with Buildmotion Libraries

### Logging in Components

```typescript
import { inject } from '@angular/core';
import { LoggingService } from '@buildmotion/logging';

export class MyComponent {
  private logger = inject(LoggingService);
  
  performAction() {
    this.logger.log('Action performed', { userId: this.userId });
  }
}
```

**Consult**: [logging.specification.md](../../.spec-motion/logging.specification.md)

### Notifications in Components

```typescript
import { inject } from '@angular/core';
import { NotificationService } from '@buildmotion/notifications';

export class MyComponent {
  private notifications = inject(NotificationService);
  
  saveData() {
    this.service.save().subscribe({
      next: () => this.notifications.success('Data saved successfully'),
      error: () => this.notifications.error('Failed to save data')
    });
  }
}
```

**Consult**: [notifications.specification.md](../../.spec-motion/notifications.specification.md)

### Configuration in Components

```typescript
import { inject } from '@angular/core';
import { ConfigurationService } from '@buildmotion/configuration';

export class MyComponent {
  private config = inject(ConfigurationService);
  
  get showFeature(): boolean {
    return this.config.settings.features.newUI;
  }
}
```

**Consult**: [configuration.specification.md](../../.spec-motion/configuration.specification.md)

### Feature Flags in Components

```typescript
import { inject } from '@angular/core';
import { FeatureFlagService } from '@buildmotion/feature-flag';

export class MyComponent {
  private featureFlags = inject(FeatureFlagService);
  
  showNewFeature = this.featureFlags.isEnabled('new-dashboard');
}
```

**Consult**: [feature-flag.specification.md](../../.spec-motion/feature-flag.specification.md)

## Component Checklist

Before creating a component, verify:

- [ ] Is this truly a presentation concern?
- [ ] Have I moved business logic to services?
- [ ] Am I using standalone component APIs?
- [ ] Am I using signals for reactive state?
- [ ] Do I need logging? → Inject `LoggingService`
- [ ] Do I need configuration? → Inject `ConfigurationService`
- [ ] Do I need to show notifications? → Inject `NotificationService`
- [ ] Do I need feature flags? → Inject `FeatureFlagService`

## Common Patterns

### Smart vs Presentational Components

**Smart (Container) Components**:
- Inject services
- Manage state
- Handle business logic coordination
- Pass data to presentational components

**Presentational (Dumb) Components**:
- Receive data via `@Input()`
- Emit events via `@Output()`
- No service dependencies
- Pure display logic

### Form Components

Use Angular's reactive forms with validation:

```typescript
import { FormBuilder, Validators } from '@angular/forms';
import { ValidationService } from '@buildmotion/validation';

export class UserFormComponent {
  private fb = inject(FormBuilder);
  private validation = inject(ValidationService);
  
  userForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]]
  });
}
```

**Consult**: [validation.specification.md](../../.spec-motion/validation.specification.md)

## Testing Components

Write comprehensive tests for:
- Component initialization
- User interactions
- Service integration (with mocks)
- Template rendering
- State changes

See the Clean Architecture specification for testing guidelines.
