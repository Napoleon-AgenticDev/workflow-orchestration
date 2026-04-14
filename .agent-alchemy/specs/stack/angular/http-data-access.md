---
meta:
  id: http-data-access
  title: Http Data Access
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: 2026-02-23T00:00:00.000Z
title: HTTP and Data Access Guidelines
applies_to: null
priority: high
category: data-access
---

# HTTP and Data Access Guidelines

## When to Use This Guidance

Apply when:
- Making HTTP requests to APIs
- Creating data access services
- Implementing RESTful operations
- Handling API responses and errors

## Choosing HTTP Library

### Decision Tree

```
What state management approach?
├─ RxJS Observables (traditional)
│  └─ Use: @buildmotion/http-service
│     📖 [http-service.specification.md](../../.spec-motion/http-service.specification.md)
│
└─ Angular Signals (modern)
   └─ Use: @buildmotion/http-service-signals
      📖 [http-service-signals.specification.md](../../.spec-motion/http-service-signals.specification.md)
```

## 1. Observable-Based HTTP Service

Use for traditional RxJS-based applications.

### When to Use
- Existing RxJS-based applications
- Complex observable pipelines
- Operators like `switchMap`, `mergeMap`, `debounceTime`
- Fine-grained control over subscriptions

### Base Pattern

```typescript
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { HttpServiceBase } from '@buildmotion/http-service';
import { LoggingService } from '@buildmotion/logging';

@Injectable({ providedIn: 'root' })
export class UserApiService extends HttpServiceBase {
  private logger = inject(LoggingService);
  
  constructor() {
    super('https://api.example.com');
  }
  
  getUsers(): Observable<User[]> {
    return this.get<User[]>('/users').pipe(
      tap(users => this.logger.log('Users loaded', { count: users.length })),
      catchError(err => {
        this.logger.error('Failed to load users', err);
        throw err;
      })
    );
  }
  
  getUserById(id: string): Observable<User> {
    return this.get<User>(`/users/${id}`);
  }
  
  createUser(user: CreateUserRequest): Observable<User> {
    return this.post<User>('/users', user).pipe(
      tap(created => this.logger.log('User created', { id: created.id }))
    );
  }
  
  updateUser(id: string, user: UpdateUserRequest): Observable<User> {
    return this.put<User>(`/users/${id}`, user);
  }
  
  deleteUser(id: string): Observable<void> {
    return this.delete<void>(`/users/${id}`);
  }
}
```

### Advanced Patterns

**Error Handling with Retry**:
```typescript
import { retry, retryWhen, delay, take } from 'rxjs/operators';

getUsers(): Observable<User[]> {
  return this.get<User[]>('/users').pipe(
    retry(3),
    catchError(err => {
      this.handleError(err);
      return of([]);
    })
  );
}
```

**Request Cancellation**:
```typescript
private searchSubject = new Subject<string>();

ngOnInit() {
  this.searchSubject.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(term => this.searchUsers(term))
  ).subscribe(results => this.results.set(results));
}
```

**Full specification**: [http-service.specification.md](../../.spec-motion/http-service.specification.md)

## 2. Signal-Based HTTP Service

Use for modern Angular applications with Signals.

### When to Use
- New Angular v16+ applications
- Signal-based state management
- Simplified reactive patterns
- Better template integration

### Base Pattern

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { HttpServiceSignalsBase } from '@buildmotion/http-service-signals';
import { LoggingService } from '@buildmotion/logging';

@Injectable({ providedIn: 'root' })
export class UserSignalService extends HttpServiceSignalsBase {
  private logger = inject(LoggingService);
  
  // Signals for state
  users = signal<User[]>([]);
  selectedUser = signal<User | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  
  constructor() {
    super('https://api.example.com');
  }
  
  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.get<User[]>('/users').subscribe({
      next: (data) => {
        this.users.set(data);
        this.loading.set(false);
        this.logger.log('Users loaded', { count: data.length });
      },
      error: (err) => {
        this.error.set(err.message);
        this.loading.set(false);
        this.logger.error('Failed to load users', err);
      }
    });
  }
  
  loadUser(id: string): void {
    this.get<User>(`/users/${id}`).subscribe({
      next: (user) => this.selectedUser.set(user),
      error: (err) => this.handleError(err)
    });
  }
  
  createUser(user: CreateUserRequest): void {
    this.post<User>('/users', user).subscribe({
      next: (created) => {
        this.users.update(users => [...users, created]);
        this.logger.log('User created', { id: created.id });
      },
      error: (err) => this.handleError(err)
    });
  }
}
```

### Computed Signals

```typescript
import { computed } from '@angular/core';

export class UserSignalService extends HttpServiceSignalsBase {
  users = signal<User[]>([]);
  filter = signal<string>('');
  
  // Computed signal for filtered users
  filteredUsers = computed(() => {
    const users = this.users();
    const filter = this.filter().toLowerCase();
    return users.filter(u => 
      u.name.toLowerCase().includes(filter)
    );
  });
  
  // Computed signal for count
  userCount = computed(() => this.users().length);
}
```

**Full specification**: [http-service-signals.specification.md](../../.spec-motion/http-service-signals.specification.md)

## HTTP Service Checklist

Before creating an HTTP service:

- [ ] Determined Observable vs Signal approach
- [ ] Extended appropriate base class (`HttpServiceBase` or `HttpServiceSignalsBase`)
- [ ] Configured base URL in constructor
- [ ] Added logging for important operations
- [ ] Implemented error handling
- [ ] Defined request/response types
- [ ] Considered caching strategy

## Error Handling

Always handle HTTP errors properly:

```typescript
import { ErrorHandler } from '@buildmotion/error-handling';
import { LoggingService } from '@buildmotion/logging';

export class UserApiService extends HttpServiceBase {
  private logger = inject(LoggingService);
  private errorHandler = inject(ErrorHandler);
  
  getUsers(): Observable<User[]> {
    return this.get<User[]>('/users').pipe(
      catchError(err => {
        this.logger.error('HTTP Error', err);
        this.errorHandler.handleError(err);
        return of([]);
      })
    );
  }
}
```

**Consult**: 
- [error-handling.specification.md](../../.spec-motion/error-handling.specification.md)
- [logging.specification.md](../../.spec-motion/logging.specification.md)

## Configuration Integration

Use configuration for API URLs:

```typescript
import { ConfigurationService } from '@buildmotion/configuration';

@Injectable({ providedIn: 'root' })
export class UserApiService extends HttpServiceBase {
  private config = inject(ConfigurationService);
  
  constructor() {
    super(inject(ConfigurationService).settings.apiBaseUrl);
  }
}
```

**Consult**: [configuration.specification.md](../../.spec-motion/configuration.specification.md)

## Testing HTTP Services

Mock HTTP calls in tests:

```typescript
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

describe('UserApiService', () => {
  let service: UserApiService;
  let httpMock: HttpTestingController;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserApiService]
    });
    
    service = TestBed.inject(UserApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  
  it('should fetch users', () => {
    const mockUsers = [{ id: '1', name: 'John' }];
    
    service.getUsers().subscribe(users => {
      expect(users).toEqual(mockUsers);
    });
    
    const req = httpMock.expectOne('https://api.example.com/users');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });
  
  afterEach(() => {
    httpMock.verify();
  });
});
```

## Best Practices

### ✅ DO

- Extend base HTTP service classes
- Use typed requests and responses
- Implement proper error handling
- Log important operations
- Use configuration for URLs
- Write comprehensive tests
- Handle loading states
- Implement retry logic for failed requests

### ❌ DON'T

- Make HTTP calls directly from components
- Skip error handling
- Ignore loading states
- Hard-code API URLs
- Return raw HTTP responses
- Skip typing request/response
- Make calls without logging
