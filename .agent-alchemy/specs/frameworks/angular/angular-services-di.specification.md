---
meta:
  id: angular-services-di-specification
  title: Angular Services and Dependency Injection Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags:
    - dependency-injection
    - services
    - providers
    - singleton
    - inject-function
    - hierarchical-injection
    - dependency injection
    - service pattern
    - angular providers
    - hierarchical injectors
    - testing services
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
title: Angular Services and Dependency Injection Specification
category: Services & Dependency Injection
feature: Service Architecture
lastUpdated: 2024-09-24T00:00:00.000Z
source: Angular Official Documentation
version: Angular 18+
aiContext: true
applyTo:
  - '**/*.service.ts'
  - '**/*.component.ts'
keywords:
  - dependency-injection
  - services
  - providers
  - singleton
  - inject-function
  - hierarchical-injection
topics:
  - dependency injection
  - service pattern
  - angular providers
  - hierarchical injectors
  - testing services
useCases: []
---

# Angular Services and Dependency Injection Specification

## Overview

Dependency Injection (DI) is one of the fundamental concepts in Angular, providing a design pattern that manages dependencies between classes. Services are singleton objects that encapsulate business logic, data access, and shared functionality that can be injected into components, directives, pipes, and other services.

Angular's DI system creates an abstraction layer using injectors that connect dependency consumers with dependency providers, enabling loose coupling, testability, and code reusability across the application.

## Core Concepts

### Injectable Services

Services are classes decorated with `@Injectable` that can be injected as dependencies:

**Key Features:**

- Singleton pattern by default
- Automatic dependency resolution
- Tree-shakable with providedIn
- Hierarchical injection system
- Type-safe dependency management

**Implementation Patterns:**

```typescript
@Injectable({
  providedIn: 'root',
})
export class DataService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://api.example.com';

  getData(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/data`);
  }

  createItem(item: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/data`, item);
  }
}
```

### Dependency Injection System

Angular's DI system has two main roles:

1. **Dependency Consumer**: Classes that need dependencies
2. **Dependency Provider**: Services that provide functionality

**Injector Hierarchy:**

- Application-wide root injector
- Component-level injectors
- Directive-level injectors
- Service-level injectors

```typescript
@Component({
  selector: 'user-profile',
  template: `<div>{{ user()?.name }}</div>`,
  providers: [UserService], // Component-level provider
})
export class UserProfileComponent {
  private userService = inject(UserService);
  user = this.userService.currentUser;
}
```

### Provider Configuration

Services can be provided at different levels:

**Root Level (Preferred):**

```typescript
@Injectable({
  providedIn: 'root',
})
export class GlobalService {}
```

**Component Level:**

```typescript
@Component({
  providers: [LocalService],
})
export class MyComponent {}
```

**Application Config:**

```typescript
export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideHttpClient(), { provide: API_URL, useValue: 'https://api.example.com' }],
};
```

## Angular Patterns and Best Practices

### Recommended Implementation

**Signal-Based Service State Management:**

```typescript
@Injectable({
  providedIn: 'root',
})
export class TodoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://api.example.com/todos';

  // Private signals for internal state
  private _todos = signal<Todo[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // Public readonly signals
  public readonly todos = this._todos.asReadonly();
  public readonly loading = this._loading.asReadonly();
  public readonly error = this._error.asReadonly();

  // Computed signals
  public readonly completedTodos = computed(() => this._todos().filter((todo) => todo.completed));

  public readonly totalCount = computed(() => this._todos().length);

  async loadTodos(): Promise<void> {
    try {
      this._loading.set(true);
      this._error.set(null);

      const todos = await firstValueFrom(this.http.get<Todo[]>(this.baseUrl));

      this._todos.set(todos);
    } catch (error) {
      this._error.set('Failed to load todos');
      console.error('Error loading todos:', error);
    } finally {
      this._loading.set(false);
    }
  }

  async addTodo(todo: Omit<Todo, 'id'>): Promise<void> {
    try {
      const newTodo = await firstValueFrom(this.http.post<Todo>(this.baseUrl, todo));

      this._todos.update((todos) => [...todos, newTodo]);
    } catch (error) {
      this._error.set('Failed to add todo');
      throw error;
    }
  }

  async updateTodo(id: number, updates: Partial<Todo>): Promise<void> {
    try {
      const updatedTodo = await firstValueFrom(this.http.patch<Todo>(`${this.baseUrl}/${id}`, updates));

      this._todos.update((todos) => todos.map((todo) => (todo.id === id ? updatedTodo : todo)));
    } catch (error) {
      this._error.set('Failed to update todo');
      throw error;
    }
  }

  async deleteTodo(id: number): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`${this.baseUrl}/${id}`));

      this._todos.update((todos) => todos.filter((todo) => todo.id !== id));
    } catch (error) {
      this._error.set('Failed to delete todo');
      throw error;
    }
  }
}
```

**Service with Dependency Injection:**

```typescript
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly logger = inject(LoggerService);
  private readonly config = inject(APP_CONFIG);

  private _notifications = signal<Notification[]>([]);
  public readonly notifications = this._notifications.asReadonly();

  showSuccess(message: string): void {
    this.addNotification({
      type: 'success',
      message,
      duration: this.config.notifications.defaultDuration,
    });
  }

  showError(message: string, error?: any): void {
    this.logger.error('Notification error:', error);
    this.addNotification({
      type: 'error',
      message,
      duration: this.config.notifications.errorDuration,
    });
  }

  private addNotification(notification: Omit<Notification, 'id' | 'timestamp'>): void {
    const fullNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    this._notifications.update((notifications) => [...notifications, fullNotification]);

    // Auto-remove after duration
    if (notification.duration > 0) {
      setTimeout(() => {
        this.removeNotification(fullNotification.id);
      }, notification.duration);
    }
  }

  removeNotification(id: string): void {
    this._notifications.update((notifications) => notifications.filter((n) => n.id !== id));
  }
}
```

### Common Use Cases

1. **Data Services**: API communication and data management
2. **State Services**: Application state management with signals
3. **Utility Services**: Shared functionality and helper methods
4. **Configuration Services**: Application configuration and settings
5. **Authentication Services**: User authentication and authorization
6. **Logging Services**: Application logging and error tracking

### Anti-Patterns to Avoid

- **Service Dependencies on Components**: Services should not depend on UI components
- **Circular Dependencies**: Avoid circular references between services
- **Direct HTTP in Components**: Always use services for data access
- **Stateful Services Without Proper Management**: Use signals or observables for state
- **Testing Against Real Services**: Always mock services in unit tests

## API Reference

### Core APIs

#### @Injectable Decorator

**Purpose**: Marks a class as available for dependency injection
**Usage**: Applied to service classes
**Parameters**:

- `providedIn`: Specifies where to provide the service ('root', 'platform', 'any')
- `useClass`: Alternative class to instantiate
- `useFactory`: Factory function for creating instances
- `useValue`: Static value to provide
- `useExisting`: Alias for another provider

```typescript
@Injectable({
  providedIn: 'root',
  useFactory: () => new CustomService(environment.apiUrl),
})
export class CustomService {}
```

#### inject() Function

**Purpose**: Injects dependencies using functional injection
**Usage**: Inside constructors, initializers, or factory functions
**Returns**: Instance of the requested dependency

```typescript
export class MyService {
  private http = inject(HttpClient);
  private router = inject(Router);

  constructor() {
    // Dependencies available here
  }
}
```

#### Provider Configuration

**Purpose**: Configure how dependencies are provided
**Usage**: In ApplicationConfig, Component providers, or NgModule providers

```typescript
const providers = [
  { provide: API_URL, useValue: 'https://api.example.com' },
  { provide: HttpClient, useClass: MockHttpClient },
  { provide: LoggerService, useFactory: createLogger, deps: [ENVIRONMENT] },
];
```

## Testing Strategies

### Unit Testing Services

```typescript
describe('TodoService', () => {
  let service: TodoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TodoService],
    });

    service = TestBed.inject(TodoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load todos', async () => {
    const mockTodos = [{ id: 1, title: 'Test Todo', completed: false }];

    service.loadTodos();

    const req = httpMock.expectOne('https://api.example.com/todos');
    expect(req.request.method).toBe('GET');
    req.flush(mockTodos);

    expect(service.todos()).toEqual(mockTodos);
  });

  it('should handle loading errors', async () => {
    service.loadTodos();

    const req = httpMock.expectOne('https://api.example.com/todos');
    req.error(new ProgressEvent('Network error'));

    expect(service.error()).toBe('Failed to load todos');
  });
});
```

### Mocking Services in Component Tests

```typescript
describe('TodoListComponent', () => {
  let component: TodoListComponent;
  let fixture: ComponentFixture<TodoListComponent>;
  let mockTodoService: jasmine.SpyObj<TodoService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('TodoService', ['loadTodos', 'addTodo']);

    await TestBed.configureTestingModule({
      declarations: [TodoListComponent],
      providers: [{ provide: TodoService, useValue: spy }],
    }).compileComponents();

    fixture = TestBed.createComponent(TodoListComponent);
    component = fixture.componentInstance;
    mockTodoService = TestBed.inject(TodoService) as jasmine.SpyObj<TodoService>;
  });

  it('should load todos on init', () => {
    component.ngOnInit();
    expect(mockTodoService.loadTodos).toHaveBeenCalled();
  });
});
```

## Performance Considerations

### Optimization Techniques

- **ProvidedIn Root**: Use tree-shaking for unused services
- **Lazy Loading**: Provide services at the module level for lazy-loaded features
- **Signal-Based State**: Avoid unnecessary change detection with signals
- **HTTP Interceptors**: Centralize cross-cutting concerns like caching and error handling

### Common Performance Pitfalls

- **Memory Leaks**: Unsubscribe from observables in services
- **Heavy Constructor Logic**: Move expensive operations to initialization methods
- **Unnecessary Service Instances**: Use appropriate provider scope

## Accessibility Guidelines

### Service Design for Accessibility

- **Screen Reader Support**: Provide services for managing ARIA announcements
- **Focus Management**: Services for managing keyboard focus
- **User Preferences**: Services for managing accessibility preferences

### Implementation Patterns

```typescript
@Injectable({
  providedIn: 'root',
})
export class A11yService {
  private readonly liveAnnouncer = inject(LiveAnnouncer);

  announceForScreenReader(message: string, politeness: AriaLivePoliteness = 'polite'): void {
    this.liveAnnouncer.announce(message, politeness);
  }

  manageFocus(element: HTMLElement): void {
    element.focus();
  }
}
```

## Related Specifications

- [Components and Templates](../components-templates/angular-components-templates.specification.md)
- [HTTP and Observables](../http-observables/angular-http-observables.specification.md)
- [Testing and Performance](../testing-performance/angular-testing-performance.specification.md)
- [Best Practices](../best-practices/angular-best-practices.specification.md)

## References

- [Angular Dependency Injection Guide](https://angular.dev/guide/di)
- [Injectable Decorator API](https://angular.dev/api/core/Injectable)
- [Injection Token API](https://angular.dev/api/core/InjectionToken)
- [Provider Configuration](https://angular.dev/guide/di/dependency-injection-providers)

## Code Examples

### Basic Service Implementation

```typescript
@Injectable({
  providedIn: 'root',
})
export class UserService {
  private users = signal<User[]>([]);

  getUsers(): Signal<User[]> {
    return this.users.asReadonly();
  }

  addUser(user: User): void {
    this.users.update((users) => [...users, user]);
  }
}
```

### Advanced Service with Dependencies

```typescript
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storage = inject(LOCAL_STORAGE);

  private _currentUser = signal<User | null>(null);
  public readonly currentUser = this._currentUser.asReadonly();
  public readonly isAuthenticated = computed(() => !!this._currentUser());

  async login(credentials: LoginCredentials): Promise<void> {
    try {
      const response = await firstValueFrom(this.http.post<AuthResponse>('/api/auth/login', credentials));

      this.storage.setItem('token', response.token);
      this._currentUser.set(response.user);

      await this.router.navigate(['/dashboard']);
    } catch (error) {
      throw new Error('Login failed');
    }
  }

  logout(): void {
    this.storage.removeItem('token');
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
```

## Migration Notes

### From Previous Versions

- Angular 16+: Functional injection with `inject()` function
- Angular 14+: Standalone components affect provider configuration
- Angular 9+: Ivy renderer changes service tree-shaking behavior

### Breaking Changes

- Constructor injection vs functional injection patterns
- Provider token changes with standalone components
- Service scope changes with lazy loading

## Troubleshooting

### Common Issues

1. **Circular Dependency Error**: Refactor to eliminate circular references
2. **No Provider Error**: Ensure service is provided at appropriate level
3. **Service Not Singleton**: Check provider configuration and scope

### Debug Techniques

- Use Angular DevTools for dependency injection tree inspection
- Enable Angular's dependency injection tracing
- Use breakpoints in service constructors to verify instantiation