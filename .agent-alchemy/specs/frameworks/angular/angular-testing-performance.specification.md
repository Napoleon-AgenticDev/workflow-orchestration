---
meta:
  id: angular-testing-performance-specification
  title: Angular Testing and Performance Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags:
    - testing
    - performance
    - jest
    - test-fixtures
    - change-detection
    - optimization
    - profiling
    - unit testing
    - performance optimization
    - change detection
    - test fixtures
    - bundle size
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
title: Angular Testing and Performance Specification
category: Testing & Performance
feature: Quality Assurance
lastUpdated: 2024-09-24T00:00:00.000Z
source: Angular Official Documentation
version: Angular 18+
aiContext: true
applyTo:
  - '**/*.spec.ts'
  - '**/*.component.ts'
  - '**/*.service.ts'
keywords:
  - testing
  - performance
  - jest
  - test-fixtures
  - change-detection
  - optimization
  - profiling
topics:
  - unit testing
  - performance optimization
  - change detection
  - test fixtures
  - profiling
  - bundle size
useCases: []
---

# Angular Testing and Performance Specification

## Overview

Angular provides comprehensive testing utilities and performance optimization tools to ensure applications are reliable, maintainable, and performant. The framework supports unit testing, integration testing, and end-to-end testing through tools like Jasmine, Karma, and Angular Testing Utilities.

Performance optimization in Angular involves understanding change detection, implementing proper loading strategies, optimizing bundle sizes, and monitoring runtime performance to deliver smooth user experiences.

## Core Concepts

### Testing Framework Integration

Angular's testing ecosystem provides multiple levels of testing:

**Key Features:**

- Unit testing with Jasmine and Karma
- Integration testing with TestBed
- Component testing with fixtures
- Service testing with dependency injection
- End-to-end testing with Protractor/Cypress/Playwright
- Mock and spy utilities
- Asynchronous testing support

**Implementation Patterns:**

```typescript
describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  let notificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService, { provide: NotificationService, useValue: notificationSpy }],
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getUsers', () => {
    it('should return users from API', () => {
      const mockUsers: User[] = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      ];

      service.getUsers().subscribe((users) => {
        expect(users).toEqual(mockUsers);
        expect(users.length).toBe(2);
      });

      const req = httpMock.expectOne('/api/users');
      expect(req.request.method).toBe('GET');
      req.flush(mockUsers);
    });

    it('should handle API errors gracefully', () => {
      service.getUsers().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe('Failed to load users');
          expect(notificationService.showError).toHaveBeenCalledWith('Failed to load users');
        },
      });

      const req = httpMock.expectOne('/api/users');
      req.error(new ProgressEvent('Network error'), { status: 500 });
    });
  });
});
```

### Component Testing

Component testing involves testing the component class and its interaction with the template:

```typescript
describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let userService: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('UserService', ['getUsers', 'deleteUser']);

    await TestBed.configureTestingModule({
      declarations: [UserListComponent],
      providers: [{ provide: UserService, useValue: spy }],
      schemas: [NO_ERRORS_SCHEMA], // Ignore unknown elements/attributes
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    const mockUsers: User[] = [{ id: 1, name: 'John', email: 'john@example.com' }];
    userService.getUsers.and.returnValue(of(mockUsers));

    component.ngOnInit();

    expect(userService.getUsers).toHaveBeenCalled();
    expect(component.users()).toEqual(mockUsers);
  });

  it('should display users in template', () => {
    const mockUsers: User[] = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    ];

    component.users.set(mockUsers);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const userElements = compiled.querySelectorAll('.user-item');

    expect(userElements.length).toBe(2);
    expect(userElements[0].textContent).toContain('John Doe');
    expect(userElements[1].textContent).toContain('Jane Smith');
  });

  it('should call delete user when delete button clicked', () => {
    const user = { id: 1, name: 'John', email: 'john@example.com' };
    userService.deleteUser.and.returnValue(of(undefined));

    component.users.set([user]);
    fixture.detectChanges();

    const deleteButton = fixture.nativeElement.querySelector('.delete-btn');
    deleteButton.click();

    expect(userService.deleteUser).toHaveBeenCalledWith(1);
  });
});
```

### Performance Optimization Strategies

Angular provides multiple strategies for optimizing application performance:

**Change Detection Optimization:**

```typescript
@Component({
  selector: 'app-user-card',
  template: `
    <div class="user-card">
      <h3>{{ user.name }}</h3>
      <p>{{ user.email }}</p>
      <p>Posts: {{ user.posts.length }}</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCardComponent {
  @Input() user!: User;

  constructor(private cdr: ChangeDetectorRef) {}

  // Manually trigger change detection when needed
  refreshView(): void {
    this.cdr.markForCheck();
  }
}
```

**Lazy Loading Implementation:**

```typescript
const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then((m) => m.AdminModule),
    canLoad: [AuthGuard],
  },
  {
    path: 'user',
    loadComponent: () => import('./user/user.component').then((c) => c.UserComponent),
  },
];
```

**Virtual Scrolling for Large Lists:**

```typescript
@Component({
  template: `
    <cdk-virtual-scroll-viewport itemSize="50" class="viewport">
      <div *cdkVirtualFor="let item of items; trackBy: trackByFn" class="item">
        {{ item.name }}
      </div>
    </cdk-virtual-scroll-viewport>
  `,
  styles: [
    `
      .viewport {
        height: 200px;
        width: 200px;
      }
      .item {
        height: 50px;
      }
    `,
  ],
})
export class VirtualScrollComponent {
  items = Array.from({ length: 100000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
  }));

  trackByFn(index: number, item: any): number {
    return item.id;
  }
}
```

## Angular Patterns and Best Practices

### Recommended Testing Implementation

**Comprehensive Service Testing:**

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;
  let localStorage: Storage;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, { provide: Router, useValue: routerSpy }],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    localStorage = TestBed.inject(LOCAL_STORAGE) as Storage;
  });

  describe('login', () => {
    it('should authenticate user successfully', fakeAsync(() => {
      const credentials = { email: 'test@example.com', password: 'password' };
      const mockResponse = {
        token: 'fake-jwt-token',
        user: { id: 1, email: 'test@example.com' },
      };

      let result: AuthResult | undefined;
      service.login(credentials).then((res) => (result = res));

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush(mockResponse);

      tick();

      expect(result).toBeDefined();
      expect(localStorage.getItem('auth_token')).toBe('fake-jwt-token');
      expect(service.currentUser()).toEqual(mockResponse.user);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    }));

    it('should handle login errors', fakeAsync(() => {
      const credentials = { email: 'test@example.com', password: 'wrong' };

      let error: any;
      service.login(credentials).catch((err) => (error = err));

      const req = httpMock.expectOne('/api/auth/login');
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

      tick();

      expect(error).toBeDefined();
      expect(error.message).toContain('Login failed');
      expect(service.currentUser()).toBeNull();
      expect(router.navigate).not.toHaveBeenCalled();
    }));
  });
});
```

**Performance Monitoring Service:**

```typescript
@Injectable({
  providedIn: 'root',
})
export class PerformanceService {
  private performanceObserver?: PerformanceObserver;

  startMonitoring(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.logPerformanceEntry(entry);
        }
      });

      this.performanceObserver.observe({
        entryTypes: ['navigation', 'paint', 'largest-contentful-paint'],
      });
    }
  }

  measureAsync<T>(operation: string, asyncFn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();

    return asyncFn().finally(() => {
      const duration = performance.now() - startTime;
      console.log(`${operation} took ${duration.toFixed(2)}ms`);

      // Send to analytics service
      this.trackMetric(operation, duration);
    });
  }

  private logPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'navigation':
        const navEntry = entry as PerformanceNavigationTiming;
        console.log('Page Load Time:', navEntry.loadEventEnd - navEntry.fetchStart);
        break;
      case 'paint':
        console.log(`${entry.name}:`, entry.startTime);
        break;
      case 'largest-contentful-paint':
        console.log('LCP:', entry.startTime);
        break;
    }
  }

  private trackMetric(name: string, value: number): void {
    // Send to analytics service
  }
}
```

### Common Use Cases

1. **Unit Testing**: Test individual components and services in isolation
2. **Integration Testing**: Test component interactions and data flow
3. **Performance Testing**: Measure and optimize application performance
4. **Accessibility Testing**: Ensure WCAG compliance and screen reader support
5. **E2E Testing**: Test complete user workflows and scenarios

### Anti-Patterns to Avoid

- **Testing Implementation Details**: Focus on behavior, not internal implementation
- **Ignoring Async Operations**: Always handle promises and observables properly
- **Not Mocking Dependencies**: Mock external services and dependencies
- **Performance Regression**: Not monitoring performance impact of changes
- **Missing Edge Cases**: Test error conditions and boundary cases

## API Reference

### Core Testing APIs

#### TestBed

**Purpose**: Configure and create Angular testing module
**Usage**: Set up testing environment with dependencies and providers
**Methods**:

- `configureTestingModule()`: Configure testing module
- `createComponent()`: Create component fixture
- `inject()`: Get service instances
- `compileComponents()`: Compile components asynchronously

```typescript
TestBed.configureTestingModule({
  declarations: [MyComponent],
  imports: [ReactiveFormsModule, HttpClientTestingModule],
  providers: [{ provide: MyService, useValue: mockService }],
});
```

#### ComponentFixture

**Purpose**: Wrapper for component instances in tests
**Usage**: Control component lifecycle and detect changes
**Properties**: `componentInstance`, `nativeElement`, `debugElement`
**Methods**: `detectChanges()`, `whenStable()`, `destroy()`

#### Performance APIs

**Purpose**: Monitor and measure application performance
**Usage**: Built-in browser APIs and Angular-specific tools

```typescript
// Performance timing
const startTime = performance.now();
// ... operation
const duration = performance.now() - startTime;

// Memory usage
const memoryInfo = (performance as any).memory;
console.log('Used JS Heap Size:', memoryInfo.usedJSHeapSize);
```

## Testing Strategies

### Unit Testing Best Practices

```typescript
describe('CalculatorService', () => {
  let service: CalculatorService;

  beforeEach(() => {
    service = new CalculatorService();
  });

  describe('add', () => {
    it('should add two positive numbers', () => {
      expect(service.add(2, 3)).toBe(5);
    });

    it('should handle negative numbers', () => {
      expect(service.add(-2, 3)).toBe(1);
    });

    it('should handle zero', () => {
      expect(service.add(0, 5)).toBe(5);
    });
  });

  describe('divide', () => {
    it('should divide two numbers', () => {
      expect(service.divide(10, 2)).toBe(5);
    });

    it('should throw error when dividing by zero', () => {
      expect(() => service.divide(10, 0)).toThrowError('Division by zero');
    });
  });
});
```

### Integration Testing

```typescript
describe('UserFormIntegration', () => {
  let component: UserFormComponent;
  let fixture: ComponentFixture<UserFormComponent>;
  let userService: UserService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserFormComponent],
      imports: [ReactiveFormsModule, HttpClientTestingModule],
      providers: [UserService],
    }).compileComponents();

    fixture = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService);
  });

  it('should submit form and create user', async () => {
    spyOn(userService, 'createUser').and.returnValue(Promise.resolve({ id: 1 }));

    // Fill form
    component.userForm.patchValue({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    });

    // Submit form
    await component.onSubmit();

    expect(userService.createUser).toHaveBeenCalledWith({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    });
  });
});
```

## Performance Considerations

### Optimization Techniques

- **OnPush Change Detection**: Reduce change detection cycles
- **TrackBy Functions**: Optimize ngFor with large datasets
- **Lazy Loading**: Load modules and components on demand
- **Tree Shaking**: Remove unused code from bundles
- **AOT Compilation**: Ahead-of-time compilation for better performance
- **Service Workers**: Cache resources for offline support

### Performance Monitoring

```typescript
@Injectable({
  providedIn: 'root',
})
export class PerformanceMonitorService {
  private readonly analyticsService = inject(AnalyticsService);

  measureComponentRender(componentName: string): void {
    performance.mark(`${componentName}-start`);

    // Use afterNextRender to measure actual render time
    afterNextRender(() => {
      performance.mark(`${componentName}-end`);
      performance.measure(componentName, `${componentName}-start`, `${componentName}-end`);

      const measure = performance.getEntriesByName(componentName)[0];
      this.analyticsService.trackRenderTime(componentName, measure.duration);
    });
  }
}
```

### Bundle Analysis

```bash
# Analyze bundle size
ng build --stats-json
npx webpack-bundle-analyzer dist/stats.json

# Performance budgets in angular.json
"budgets": [
  {
    "type": "initial",
    "maximumWarning": "2mb",
    "maximumError": "5mb"
  }
]
```

## Related Specifications

- [Components and Templates](../components-templates/angular-components-templates.specification.md)
- [Services and Dependency Injection](../services-di/angular-services-di.specification.md)
- [HTTP and Observables](../http-observables/angular-http-observables.specification.md)
- [Best Practices](../best-practices/angular-best-practices.specification.md)

## References

- [Angular Testing Guide](https://angular.dev/guide/testing)
- [Angular Performance Guide](https://angular.dev/guide/performance)
- [Jasmine Documentation](https://jasmine.github.io/)
- [Angular DevKit Testing](https://angular.dev/tools/cli/testing)

## Migration Notes

### From Previous Versions

- Angular 16+: New testing utilities and improved type safety
- Angular 15+: Standalone component testing patterns
- Jest integration for faster test execution

### Breaking Changes

- TestBed configuration changes with standalone components
- Performance API updates and new monitoring capabilities
- Testing utility method signature changes

## Troubleshooting

### Common Testing Issues

1. **Async Test Failures**: Use fakeAsync, tick, and flush for timing control
2. **Component Not Updating**: Call detectChanges() after state changes
3. **Service Dependencies**: Properly mock all dependencies in TestBed

### Performance Issues

1. **Slow Change Detection**: Profile with ng.profiler.timeChangeDetection()
2. **Memory Leaks**: Monitor component cleanup and subscription management
3. **Bundle Size**: Analyze with webpack-bundle-analyzer

### Debug Techniques

- Use Angular DevTools for component and performance inspection
- Enable source maps for easier debugging
- Use performance profiler to identify bottlenecks