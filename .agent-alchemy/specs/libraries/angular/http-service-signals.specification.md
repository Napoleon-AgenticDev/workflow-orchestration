---
meta:
  id: http-service-signals-specification
  title: Http Service Signals Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
title: Http Service Signals Specification
category: Libraries
feature: Http Service Signals
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: '1.0'
aiContext: true
applyTo: []
keywords: []
topics: []
useCases: []
---

# HTTP Service Signals Library Specification

**Library Name:** `@buildmotion/http-service-signals`  
**Version:** 18.0.0  
**Author:** Matt Vaughn / Agent Alchemy  
**Category:** Infrastructure Layer  
**Architecture Layer:** Infrastructure

---

## 🎯 Purpose

The **HTTP Service Signals** library provides a modern Angular HTTP service built with Angular Signals for reactive state management. It offers automatic tracking of loading, data, and error states, providing a signal-based approach to HTTP operations with seamless integration with Angular's reactive primitives.

---

## 📋 Responsibilities

### Primary Responsibilities

1. **Signal-Based HTTP Operations**
   - Provide signal-based wrappers for all HTTP methods
   - Automatic state management (loading, data, error)
   - Type-safe request/response handling

2. **Reactive State Management**
   - Automatic loading state tracking
   - Error state management
   - Data state propagation through signals

3. **Modern HTTP Features**
   - CSRF token management with signals
   - Signal-compatible HTTP interceptors
   - Request configuration and headers management

### What This Library Does

- ✅ Provides signal-based HTTP service for all HTTP verbs
- ✅ Automatically manages loading, error, and data states
- ✅ Enables reactive composition with computed signals
- ✅ Supports CSRF token management
- ✅ Provides signal-compatible interceptors
- ✅ Enables Observable to Signal conversion

### What This Library Does NOT Do

- ❌ Replace Angular's HttpClient (it extends it)
- ❌ Handle business logic (use Actions or Services)
- ❌ Manage application state (use state management solutions)
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
│  Infrastructure ← HTTP-SERVICE-SIGNALS  │
├─────────────────────────────────────────┤
│     Core (Entities & Use Cases)         │
└─────────────────────────────────────────┘
```

### Key Components

1. **HttpServiceSignals**
   - Main service for signal-based HTTP operations
   - Provides convenience methods for GET, POST, PUT, PATCH, DELETE
   - Manages CSRF token as a signal
   - Creates request signals with automatic state tracking

2. **HttpRequestState<T>**
   - Interface representing HTTP request state
   - Contains data, loading, error, and status properties
   - Type-safe with generics

3. **Signal-Compatible Interceptors**
   - HttpErrorInterceptorSignals - Error handling
   - HttpResponseInterceptorSignals - Response wrapping
   - HttpTokenInterceptorSignals - JWT token injection

4. **Configuration**
   - HttpServiceOptions - Service configuration
   - HttpRequestConfig - Request-specific configuration
   - HttpRequestMethod - HTTP method enumeration

---

## 🔌 Dependencies

### Internal Dependencies

- `@buildmotion/core` - Core utilities and models
- `guid-typescript` - GUID generation

### External Dependencies

- `@angular/common` (18.2.0+) - HttpClient and common utilities
- `@angular/core` (18.2.0+) - Angular framework and signals
- `rxjs` (7.8.0+) - Observable utilities and operators
- `tslib` - TypeScript runtime library

### Peer Dependencies

- Angular 18.0.0 or higher
- RxJS 7.8.0 or higher
- TypeScript 5.0.0 or higher

---

## 📦 Public API

### HttpServiceSignals Service

Main service providing signal-based HTTP operations.

```typescript
class HttpServiceSignals {
  // Properties
  readonly csrfToken$: Signal<string | null>;
  
  // HTTP Methods - return request state signals
  get<T>(url: string, options?: Partial<HttpRequestConfig>): Signal<HttpRequestState<T>>;
  post<T>(url: string, body: any, options?: Partial<HttpRequestConfig>): Signal<HttpRequestState<T>>;
  put<T>(url: string, body: any, options?: Partial<HttpRequestConfig>): Signal<HttpRequestState<T>>;
  patch<T>(url: string, body: any, options?: Partial<HttpRequestConfig>): Signal<HttpRequestState<T>>;
  delete<T>(url: string, options?: Partial<HttpRequestConfig>): Signal<HttpRequestState<T>>;
  
  // Request Signal Creation
  createRequestSignal<T>(config: HttpRequestConfig): Signal<HttpRequestState<T>>;
  
  // Observable Conversion
  executeAsSignal<T>(config: HttpRequestConfig, initialValue?: T): Signal<T | undefined>;
  
  // Request Execution (returns Observables)
  executeRequest<T>(config: HttpRequestConfig): Observable<HttpResponse<ApiResponse<T>>>;
  executeRequestBody<T>(config: HttpRequestConfig): Observable<T>;
  
  // Utility Methods
  createHeaders(includeCsrf?: boolean): HttpHeaders;
  fetchCsrfToken(url: string): void;
  setCsrfToken(token: string): void;
}
```

### HttpRequestState Interface

```typescript
interface HttpRequestState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  status: number | null;
}
```

### HttpRequestConfig Interface

```typescript
interface HttpRequestConfig<TBody = unknown> {
  method: HttpRequestMethod;
  url: string;
  body?: TBody;
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | string[] };
  withCredentials?: boolean;
  reportProgress?: boolean;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
}
```

### HttpServiceOptions Interface

```typescript
interface HttpServiceOptions {
  apiURL?: string;
  baseUrl?: string;
  csrf?: string;
  health?: string;
  version?: string;
}
```

### HttpRequestMethod Enum

```typescript
enum HttpRequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE'
}
```

### HttpServiceSignalsModule

```typescript
@NgModule({
  // ...
})
class HttpServiceSignalsModule {
  static forRoot(options: HttpServiceOptions): ModuleWithProviders<HttpServiceSignalsModule>;
}
```

---

## 🎨 Design Patterns

### 1. **Facade Pattern**
- HttpServiceSignals provides a simplified interface over Angular's HttpClient
- Abstracts complexity of signal creation and state management
- Provides convenient methods for common HTTP operations

### 2. **Observer Pattern** (via Signals)
- Signals notify subscribers of state changes automatically
- Computed signals derive new values from request signals
- Effects react to signal changes for side effects

### 3. **Strategy Pattern** (Interceptors)
- Different interceptor strategies for various concerns
- Error handling, token injection, response wrapping
- Pluggable and composable

### 4. **Builder Pattern** (Configuration)
- Fluent API for creating headers
- Request configuration building
- Module configuration with forRoot

---

## 🔄 Integration with Clean Architecture

### Use in Components (Presentation Layer)

```typescript
import { Component, inject, computed } from '@angular/core';
import { HttpServiceSignals } from '@buildmotion/http-service-signals';

interface User {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-user-profile',
  template: `
    @if (userRequest().loading) {
      <div>Loading...</div>
    }
    @if (userRequest().error) {
      <div class="error">{{ userRequest().error?.message }}</div>
    }
    @if (userRequest().data; as user) {
      <div>
        <h2>{{ user.name }}</h2>
        <p>{{ user.email }}</p>
      </div>
    }
  `
})
export class UserProfileComponent {
  private httpSignals = inject(HttpServiceSignals);
  
  // Signal automatically manages loading, data, and error states
  userRequest = this.httpSignals.get<User>('/api/users/1');
  
  // Computed signal derived from request signal
  userName = computed(() => this.userRequest().data?.name ?? 'Unknown');
}
```

### Use in Services (Infrastructure Layer)

```typescript
import { Injectable, inject, Signal } from '@angular/core';
import { HttpServiceSignals, HttpRequestState } from '@buildmotion/http-service-signals';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private httpSignals = inject(HttpServiceSignals);
  
  getUser(id: number): Signal<HttpRequestState<User>> {
    return this.httpSignals.get<User>(`/api/users/${id}`);
  }
  
  createUser(user: Partial<User>): Signal<HttpRequestState<User>> {
    return this.httpSignals.post<User>('/api/users', user);
  }
  
  updateUser(id: number, user: Partial<User>): Signal<HttpRequestState<User>> {
    return this.httpSignals.put<User>(`/api/users/${id}`, user);
  }
  
  deleteUser(id: number): Signal<HttpRequestState<void>> {
    return this.httpSignals.delete<void>(`/api/users/${id}`);
  }
}
```

### CSRF Token Management

```typescript
@Component({
  selector: 'app-root',
  template: `...`
})
export class AppComponent implements OnInit {
  private httpSignals = inject(HttpServiceSignals);
  
  ngOnInit() {
    // Fetch CSRF token on app initialization
    this.httpSignals.fetchCsrfToken('/api/csrf');
  }
  
  submitForm() {
    // Headers automatically include CSRF token when includeCsrf is true
    const headers = this.httpSignals.createHeaders(true);
    
    this.httpSignals.post('/api/submit', this.formData, { headers });
  }
}
```

### Advanced Pattern: Computed Signals

```typescript
@Component({
  selector: 'app-user-list',
  template: `
    <div>Total Active Users: {{ activeUserCount() }}</div>
    @for (user of activeUsers(); track user.id) {
      <div>{{ user.name }}</div>
    }
  `
})
export class UserListComponent {
  private httpSignals = inject(HttpServiceSignals);
  
  usersRequest = this.httpSignals.get<User[]>('/api/users');
  
  // Computed signals automatically update when usersRequest changes
  activeUsers = computed(() => 
    this.usersRequest().data?.filter(u => u.isActive) ?? []
  );
  
  activeUserCount = computed(() => this.activeUsers().length);
}
```

### Advanced Pattern: Effects for Side Effects

```typescript
import { effect } from '@angular/core';

@Component({
  selector: 'app-user-form',
  template: `...`
})
export class UserFormComponent {
  private httpSignals = inject(HttpServiceSignals);
  private router = inject(Router);
  
  createRequest = signal<HttpRequestState<User> | null>(null);
  
  constructor() {
    // React to successful user creation
    effect(() => {
      const request = this.createRequest();
      if (request && request.data && !request.loading) {
        // Navigate on success
        this.router.navigate(['/users', request.data.id]);
      }
    });
  }
  
  createUser(userData: Partial<User>) {
    this.createRequest.set(
      this.httpSignals.post<User>('/api/users', userData)()
    );
  }
}
```

---

## 🧪 Testing Guidelines

### Testing Components with Signal-Based HTTP

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpServiceSignals } from '@buildmotion/http-service-signals';
import { UserProfileComponent } from './user-profile.component';

describe('UserProfileComponent', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;
  let httpSignals: HttpServiceSignals;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [UserProfileComponent],
      providers: [HttpServiceSignals]
    });

    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
    httpSignals = TestBed.inject(HttpServiceSignals);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should display user data when request succeeds', (done) => {
    const testUser = { id: 1, name: 'Test User', email: 'test@example.com' };
    
    // Trigger component initialization
    fixture.detectChanges();
    
    // Respond to HTTP request
    const req = httpMock.expectOne('/api/users/1');
    req.flush(testUser);
    
    // Wait for signal update
    setTimeout(() => {
      expect(component.userRequest().data).toEqual(testUser);
      expect(component.userRequest().loading).toBe(false);
      expect(component.userRequest().error).toBe(null);
      done();
    }, 10);
  });

  it('should display error when request fails', (done) => {
    fixture.detectChanges();
    
    const req = httpMock.expectOne('/api/users/1');
    req.error(new ErrorEvent('Network error'));
    
    setTimeout(() => {
      expect(component.userRequest().error).toBeTruthy();
      expect(component.userRequest().loading).toBe(false);
      done();
    }, 10);
  });
});
```

### Testing Services

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpServiceSignals } from '@buildmotion/http-service-signals';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService, HttpServiceSignals]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should create user', (done) => {
    const newUser = { name: 'New User', email: 'new@example.com' };
    const createdUser = { id: 1, ...newUser };
    
    const userSignal = service.createUser(newUser);
    
    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('POST');
    req.flush(createdUser);
    
    setTimeout(() => {
      expect(userSignal().data).toEqual(createdUser);
      done();
    }, 10);
  });
});
```

---

## 📊 Best Practices

### Do's ✅

1. **Use Signal-Based Methods for New Code**
   ```typescript
   // ✅ Good
   userRequest = this.httpSignals.get<User>('/api/users/1');
   ```

2. **Leverage Computed Signals**
   ```typescript
   // ✅ Good - derived state updates automatically
   userName = computed(() => this.userRequest().data?.name ?? 'Unknown');
   ```

3. **Handle All Request States in Templates**
   ```typescript
   // ✅ Good - handles loading, error, and data states
   @if (request().loading) { <spinner /> }
   @if (request().error) { <error /> }
   @if (request().data; as data) { <content /> }
   ```

4. **Use Effects for Side Effects**
   ```typescript
   // ✅ Good - effect reacts to signal changes
   effect(() => {
     const data = this.userRequest().data;
     if (data) {
       this.processUser(data);
     }
   });
   ```

5. **Include CSRF Tokens for Mutating Operations**
   ```typescript
   // ✅ Good
   const headers = this.httpSignals.createHeaders(true);
   this.httpSignals.post('/api/data', body, { headers });
   ```

### Don'ts ❌

1. **Don't Manually Manage Loading/Error States**
   ```typescript
   // ❌ Bad - signals handle this automatically
   loading = signal(false);
   error = signal(null);
   ```

2. **Don't Mix Signal and Observable Patterns Unnecessarily**
   ```typescript
   // ❌ Bad - choose one pattern per component
   userSignal = this.httpSignals.get<User>('/api/users/1');
   user$ = this.http.get<User>('/api/users/1'); // mixing patterns
   ```

3. **Don't Subscribe to Signals**
   ```typescript
   // ❌ Bad - signals don't have subscribe
   // Use effects or computed signals instead
   ```

4. **Don't Forget Error Handling in Templates**
   ```typescript
   // ❌ Bad - no error state handling
   @if (request().data; as data) { <content /> }
   ```

5. **Don't Ignore Type Safety**
   ```typescript
   // ❌ Bad - missing generic type
   userRequest = this.httpSignals.get('/api/users/1');
   
   // ✅ Good - type-safe
   userRequest = this.httpSignals.get<User>('/api/users/1');
   ```

---

## 🔐 Security Considerations

1. **CSRF Protection**
   - Always fetch CSRF token on application initialization
   - Include CSRF token in mutating requests (POST, PUT, DELETE)
   - Use `createHeaders(true)` to include token automatically

2. **Token Management**
   - CSRF token stored as read-only signal
   - Token updates propagate automatically
   - Tokens included in headers via interceptor

3. **Error Handling**
   - Never expose sensitive error details to users
   - Log detailed errors server-side
   - Display user-friendly error messages

4. **Type Safety**
   - Always specify response types with generics
   - Validate response data structure
   - Use runtime validation for critical data

---

## 📈 Performance Considerations

1. **Signal Efficiency**
   - Signals only update when values actually change
   - Fine-grained reactivity updates only affected components
   - No manual change detection needed

2. **Request Deduplication**
   - Consider implementing request caching for frequently accessed data
   - Use computed signals to derive data instead of making duplicate requests

3. **Memory Management**
   - Signals automatically clean up when components are destroyed
   - No manual subscription cleanup needed
   - Effects are automatically disposed

4. **Lazy Evaluation**
   - Computed signals only recalculate when dependencies change
   - Effects only run when relevant signals change

---

## 🚀 Migration from @buildmotion/http-service

### Before (Traditional Observable-Based)

```typescript
export class UserComponent implements OnInit, OnDestroy {
  user: User | null = null;
  loading = false;
  error: Error | null = null;
  private destroy$ = new Subject<void>();

  constructor(private httpService: HttpService) {}

  ngOnInit() {
    this.loading = true;
    const options = this.httpService.createOptions(
      HttpRequestMethod.get,
      null,
      '/api/users/1',
      null,
      null
    );
    
    this.httpService.execute<User>(options)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.user = response.body;
          this.loading = false;
        },
        error: (error) => {
          this.error = error;
          this.loading = false;
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### After (Signal-Based)

```typescript
export class UserComponent {
  private httpSignals = inject(HttpServiceSignals);
  
  // One line - loading, error, and data all managed automatically
  userRequest = this.httpSignals.get<User>('/api/users/1');
  
  // No ngOnInit, ngOnDestroy, or subscription management needed!
}
```

### Migration Checklist

- [ ] Replace HttpService injection with HttpServiceSignals
- [ ] Convert Observable subscriptions to signal-based requests
- [ ] Remove manual loading/error state management
- [ ] Update templates to use signal syntax
- [ ] Remove subscription cleanup (ngOnDestroy)
- [ ] Leverage computed signals for derived state
- [ ] Use effects for side effects instead of subscribe

---

## 📚 Related Libraries

- **@buildmotion/http-service** - Traditional Observable-based HTTP service
- **@buildmotion/core** - Core utilities and models (ApiResponse, etc.)
- **@buildmotion/logging** - Logging service for HTTP operations
- **@buildmotion/error-handling** - Error handling utilities
- **@buildmotion/configuration** - Configuration for API endpoints

---

## 🔍 See Also

- [Clean Architecture Specification](./angular-clean-architecture.specification.md)
- [HTTP Service Specification](./http-service.specification.md) - Traditional Observable-based version
- [Core Specification](./core.specification.md)
- [Angular Signals Documentation](https://angular.io/guide/signals)
- [Library README](../libs/http-service-signals/README.md) - Usage examples and migration guide
- [Implementation Summary](../libs/http-service-signals/IMPLEMENTATION_SUMMARY.md) - Technical implementation details
