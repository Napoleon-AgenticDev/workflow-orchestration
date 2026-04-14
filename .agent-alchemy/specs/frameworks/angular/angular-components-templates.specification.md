---
meta:
  id: angular-components-templates-specification
  title: Angular Components and Templates Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags:
    - components
    - templates
    - data-binding
    - signals
    - decorators
    - lifecycle-hooks
    - reactive-forms
    - component architecture
    - template syntax
    - data binding
    - lifecycle management
    - reactive programming
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
title: Angular Components and Templates Specification
category: Components & Templates
feature: Component Architecture
lastUpdated: 2024-09-24T00:00:00.000Z
source: Angular Official Documentation
version: Angular 18+
aiContext: true
applyTo:
  - '**/*.component.ts'
  - '**/*.component.html'
  - '**/*.component.scss'
keywords:
  - components
  - templates
  - data-binding
  - signals
  - decorators
  - lifecycle-hooks
  - reactive-forms
topics:
  - component architecture
  - template syntax
  - data binding
  - signals
  - lifecycle management
  - reactive programming
useCases: []
---

# Angular Components and Templates Specification

## Overview

Components are the fundamental building blocks of Angular applications. Each component represents a part of a larger web page, combining TypeScript logic with HTML templates and CSS styling. Angular's component architecture promotes code reusability, maintainability, and clear separation of concerns through a reactive, declarative approach to UI development.

Components work hand-in-hand with templates that use Angular's template syntax to create dynamic user interfaces with data binding, event handling, and reactive updates.

## Core Concepts

### Component Definition

Every Angular component consists of four main parts:

1. **@Component decorator** - Contains configuration metadata used by Angular
2. **HTML template** - Controls what renders into the DOM
3. **CSS selector** - Defines how the component is used in HTML
4. **TypeScript class** - Contains behaviors, properties, and event handlers

**Key Features:**

- Decorator-based configuration
- Template-based rendering
- Reactive data binding
- Event handling capabilities
- Lifecycle hook integration
- Dependency injection support

**Implementation Patterns:**

```typescript
@Component({
  selector: 'user-profile',
  template: `
    <h1>Profile for {{ userName() }}</h1>
    <p>{{ userBio() }}</p>
    <button (click)="updateProfile()">Update</button>
  `,
  styles: [
    `
      h1 {
        font-size: 2em;
        color: #333;
      }
      button {
        padding: 8px 16px;
        background: #007bff;
        color: white;
      }
    `,
  ],
})
export class UserProfile {
  userName = signal('pro_programmer_123');
  userBio = signal('Angular developer');

  updateProfile() {
    // Handle profile update logic
  }
}
```

### Template Syntax and Data Binding

Angular templates support dynamic content through multiple binding types:

**Text Interpolation:**

```typescript
template: `<h1>Welcome {{userName()}}!</h1>`;
```

**Property Binding:**

```typescript
template: `<button [disabled]="!isFormValid()">Submit</button>`;
```

**Attribute Binding:**

```typescript
template: `<ul [attr.role]="listRole()">...</ul>`;
```

**Event Binding:**

```typescript
template: `<button (click)="handleClick()">Click me</button>`;
```

### Component Lifecycle

Components have a well-defined lifecycle with hooks for key moments:

**Creation Phase:**

- `constructor` - Standard JavaScript class constructor
- `ngOnInit` - Runs once after Angular initializes all inputs

**Change Detection Phase:**

- `ngOnChanges` - Runs when component inputs change
- `ngDoCheck` - Custom change detection logic
- `ngAfterContentInit` - After content projection initialization
- `ngAfterContentChecked` - After content projection checking
- `ngAfterViewInit` - After view initialization
- `ngAfterViewChecked` - After view checking

**Destruction Phase:**

- `ngOnDestroy` - Cleanup before component destruction

## Angular Patterns and Best Practices

### Recommended Implementation

**Signal-Based State Management:**

```typescript
@Component({
  selector: 'todo-list',
  template: `
    <div class="todo-container">
      <h2>Tasks ({{ completedCount() }} of {{ todos().length }})</h2>
      <ul>
        <li *ngFor="let todo of todos()" [class.completed]="todo.completed">
          <input type="checkbox" [checked]="todo.completed" (change)="toggleTodo(todo.id)" />
          <span>{{ todo.text }}</span>
          <button (click)="deleteTodo(todo.id)">Delete</button>
        </li>
      </ul>
      <input #newTodo placeholder="Add new task" (keyup.enter)="addTodo(newTodo.value); newTodo.value = ''" />
    </div>
  `,
  styles: [
    `
      .completed {
        text-decoration: line-through;
        opacity: 0.6;
      }
      .todo-container {
        max-width: 600px;
        margin: 0 auto;
      }
    `,
  ],
})
export class TodoList {
  todos = signal<Todo[]>([]);

  completedCount = computed(() => this.todos().filter((todo) => todo.completed).length);

  addTodo(text: string) {
    if (text.trim()) {
      this.todos.update((todos) => [
        ...todos,
        {
          id: Date.now(),
          text: text.trim(),
          completed: false,
        },
      ]);
    }
  }

  toggleTodo(id: number) {
    this.todos.update((todos) => todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)));
  }

  deleteTodo(id: number) {
    this.todos.update((todos) => todos.filter((todo) => todo.id !== id));
  }
}
```

### Common Use Cases

1. **Data Display Components**: Present information with reactive updates
2. **Form Components**: Handle user input and validation
3. **Layout Components**: Structure application layout and navigation
4. **Feature Components**: Implement specific business functionality

### Anti-Patterns to Avoid

- **Direct DOM Manipulation**: Use Angular's template system instead of `document.getElementById`
- **Component Coupling**: Avoid tight coupling between parent and child components
- **Memory Leaks**: Always unsubscribe from observables in `ngOnDestroy`
- **Heavy Constructor Logic**: Use `ngOnInit` for initialization logic

## API Reference

### Core APIs

#### @Component Decorator

**Purpose**: Defines component metadata and configuration
**Usage**: Applied to component classes
**Parameters**:

- `selector`: CSS selector for the component
- `template`/`templateUrl`: Prefer `templateUrl` for external template file path
- `styles`/`styleUrls`: Prefer `styleUrls` for external stylesheet file paths
- `providers`: Dependency injection providers
- `viewProviders`: View-specific providers

```typescript
@Component({
  selector: 'app-example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.css'],
  providers: [ExampleService]
})
```

#### Component Lifecycle Hooks

**Purpose**: Hook into component lifecycle events
**Usage**: Implement interfaces and corresponding methods

```typescript
export class ExampleComponent implements OnInit, OnDestroy {
  ngOnInit() {
    // Initialization logic
  }

  ngOnDestroy() {
    // Cleanup logic
  }
}
```

## Testing Strategies

### Unit Testing

```typescript
describe('UserProfile', () => {
  let component: UserProfile;
  let fixture: ComponentFixture<UserProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserProfile],
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display username', () => {
    component.userName.set('test_user');
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('h1').textContent).toContain('Profile for test_user');
  });
});
```

### Integration Testing

```typescript
it('should handle user interaction', () => {
  const button = fixture.nativeElement.querySelector('button');
  spyOn(component, 'updateProfile');

  button.click();

  expect(component.updateProfile).toHaveBeenCalled();
});
```

## Performance Considerations

### Optimization Techniques

- **OnPush Change Detection Strategy**: Reduces change detection cycles
- **TrackBy Functions**: Optimizes \*ngFor loops with large datasets
- **Lazy Loading**: Load components only when needed
- **Signal-based State**: Eliminates unnecessary change detection runs

### Common Performance Pitfalls

- **Expensive Template Expressions**: Avoid complex calculations in templates
- **Untracked Lists**: Always use trackBy with \*ngFor for dynamic lists
- **Memory Leaks**: Unsubscribe from observables and event listeners

## Accessibility Guidelines

### WCAG Compliance

- Use semantic HTML elements
- Provide proper ARIA labels and roles
- Ensure keyboard navigation support
- Maintain sufficient color contrast

### Implementation Patterns

```html
<button type="button" [attr.aria-pressed]="isToggled()" [attr.aria-label]="toggleButtonLabel()" (click)="toggle()">{{isToggled() ? 'On' : 'Off'}}</button>

<input type="text" [attr.aria-describedby]="hasError() ? 'error-msg' : null" [attr.aria-invalid]="hasError()" />
<div id="error-msg" *ngIf="hasError()" role="alert">{{errorMessage()}}</div>
```

## Related Specifications

- [Services and Dependency Injection](../services-di/angular-services-di.specification.md)
- [Directives and Pipes](../directives-pipes/angular-directives-pipes.specification.md)
- [Forms and Validation](../forms-validation/angular-forms-validation.specification.md)
- [Testing and Performance](../testing-performance/angular-testing-performance.specification.md)

## References

- [Angular Components Guide](https://angular.dev/guide/components)
- [Angular Templates Guide](https://angular.dev/guide/templates)
- [Component API Reference](https://angular.dev/api/core/Component)
- [Lifecycle Hooks Guide](https://angular.dev/guide/components/lifecycle)

## Code Examples

### Basic Implementation

```typescript
@Component({
  selector: 'app-greeting',
  template: `<h1>Hello, {{ name() }}!</h1>`,
})
export class GreetingComponent {
  name = signal('World');
}
```

### Advanced Usage

```typescript
@Component({
  selector: 'app-data-table',
  template: `
    <table>
      <thead>
        <tr>
          <th *ngFor="let column of columns; trackBy: trackByColumn">
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let row of data(); trackBy: trackByRow">
          <td *ngFor="let column of columns; trackBy: trackByColumn">
            {{ row[column.key] }}
          </td>
        </tr>
      </tbody>
    </table>
  `,
})
export class DataTableComponent {
  @Input() columns: Column[] = [];
  data = signal<any[]>([]);

  trackByColumn(index: number, column: Column): string {
    return column.key;
  }

  trackByRow(index: number, row: any): any {
    return row.id || index;
  }
}
```

## Migration Notes

### From Previous Versions

- Angular 17+: Control flow syntax (@if, @for, @switch) replaces structural directives
- Angular 16+: Signals provide reactive state management
- Angular 14+: Standalone components eliminate need for NgModules

### Breaking Changes

- Standalone components change import patterns
- Signal-based change detection affects lifecycle timing
- New control flow syntax replaces *ngIf,*ngFor

## Troubleshooting

### Common Issues

1. **Change Detection Not Triggering**: Ensure proper signal usage or call markForCheck()
2. **Template Expression Errors**: Check for null/undefined values in bindings
3. **Lifecycle Hook Not Called**: Verify proper interface implementation

### Debug Techniques

- Use Angular DevTools for component inspection
- Enable trace lifecycle for debugging hooks
- Use ng.profiler.timeChangeDetection() for performance analysis