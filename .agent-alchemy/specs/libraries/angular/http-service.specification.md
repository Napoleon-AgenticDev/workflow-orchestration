---
meta:
  id: http-service-specification
  title: Http Service Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
title: Http Service Specification
category: Libraries
feature: Http Service
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: '1.0'
aiContext: true
applyTo: []
keywords: []
topics: []
useCases: []
---

# HTTP Service Library Specification

**Library Name:** `@buildmotion/http-service`  
**Version:** 18.0.0  
**Author:** Matt Vaughn / Agent Alchemy  
**Category:** Infrastructure Layer  
**Architecture Layer:** Infrastructure

---

## 🎯 Purpose

The **HTTP Service** library provides a robust HTTP client wrapper for Angular applications with standardized request/response handling, interceptors for authentication and error handling, and integration with the Buildmotion foundation layer for consistent logging and error management.

---

## 📋 Responsibilities

### Primary Responsibilities

1. **HTTP Client Abstraction**
   - Wrapper around Angular HttpClient
   - Standardized request/response handling
   - Type-safe HTTP operations

2. **Request/Response Interceptors**
   - Token-based authentication (HttpTokenInterceptor)
   - Error transformation and handling (HttpErrorInterceptor)
   - Response processing (HttpResponseInterceptor)
   - CSRF token management

3. **HTTP Options Management**
   - Configurable HTTP options
   - Request method support (GET, POST, PUT, DELETE, PATCH)
   - Custom headers creation
   - Credential handling

### What This Library Does

- ✅ Provides HTTP client wrapper extending ServiceBase
- ✅ Manages authentication tokens
- ✅ Handles CSRF tokens
- ✅ Intercepts and transforms errors
- ✅ Processes responses consistently
- ✅ Creates standardized request options
- ✅ Supports all HTTP methods

### What This Library Does NOT Do

- ❌ Implement business logic
- ❌ Manage application state
- ❌ Handle validation (use `@buildmotion/validation`)
- ❌ Perform data transformation (delegate to services)

---

## 🏗️ Architecture & Design

### Clean Architecture Position

```
┌─────────────────────────────────────────┐
│         Cross-Cutting Concerns          │
├─────────────────────────────────────────┤
│            Presentation Layer           │
├─────────────────────────────────────────┤
│  Infrastructure ← HTTP SERVICE HERE     │
├─────────────────────────────────────────┤
│     Core (Entities & Use Cases)         │
└─────────────────────────────────────────┘
```

### Key Components

1. **HttpService**
   - Extends ServiceBase from foundation
   - Provides HTTP operation methods
   - Manages CSRF tokens
   - Creates request options

2. **Interceptors**
   - HttpTokenInterceptor: Adds auth tokens to requests
   - HttpErrorInterceptor: Handles HTTP errors
   - HttpResponseInterceptor: Processes responses

3. **Request Models**
   - HttpRequestOptions: Request configuration
   - HttpOptions: Service configuration interface
   - HttpRequestMethod: HTTP method enum

---

## 🔌 Dependencies

### Internal Dependencies

- `@buildmotion/foundation` - ServiceBase, ServiceContext
- `@buildmotion/logging` - Logging infrastructure

### External Dependencies

- `@angular/common/http` - HttpClient, HttpHeaders, interceptors
- `@angular/core` - Angular core functionality
- `guid-typescript` - GUID generation
- `rxjs` - Reactive programming

### Peer Dependencies

- `@angular/common` ~17.0.0 || <18.0.0
- `@angular/core` ~17.0.0 || <18.0.0
- `@angular/router` ~17.0.0 || <18.0.0
- `guid-typescript` ~1.0.9

---

## 📦 Public API

### Core Exports

```typescript
// HTTP Service
export class HttpService extends ServiceBase {
  constructor(
    httpClient: HttpClient,
    loggingService: LoggingService,
    serviceContext: ServiceContext,
    httpOptions: HttpOptions
  );

  // Request Options Creation
  createOptions(
    method: HttpRequestMethod,
    headers: HttpHeaders | null,
    url: string,
    body: any,
    params: any,
    withCredentials?: boolean
  ): HttpRequestOptions;

  // Header Creation
  createHeader(includeCsrf?: boolean): HttpHeaders;

  // Request Execution
  execute<T>(requestOptions: HttpRequestOptions): Observable<HttpResponse<T>>;
  executeObserveBody<T>(requestOptions: HttpRequestOptions): Observable<T>;

  // CSRF Token Management
  getCsrfToken(): Observable<any>;
}

// Request Options
export class HttpRequestOptions {
  requestMethod: HttpRequestMethod;
  requestUrl: string;
  body: any;
  headers: HttpHeaders;
  params: any;
  withCredentials: boolean;
  reportProgress: boolean;
  responseType: string;
}

// HTTP Request Methods
export enum HttpRequestMethod {
  get = 'GET',
  post = 'POST',
  put = 'PUT',
  delete = 'DELETE',
  options = 'OPTIONS',
  head = 'HEAD',
  patch = 'PATCH'
}

// HTTP Options Interface
export interface HttpOptions {
  csrf: string;  // CSRF endpoint URL
}
```

### Interceptors

```typescript
// Token Interceptor
export class HttpTokenInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>;
}

// Error Interceptor
export class HttpErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>;
}

// Response Interceptor
export class HttpResponseInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>;
}
```

---

## 🎨 Design Patterns

### Facade Pattern

HttpService provides a simplified interface over Angular's HttpClient, hiding complexity.

### Interceptor Pattern

HTTP interceptors provide cross-cutting concerns for requests and responses.

### Template Method Pattern

Extends ServiceBase template for consistent service behavior.

---

## 🔄 Integration with Clean Architecture

### Repository Pattern Usage

```typescript
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService, HttpRequestMethod } from '@buildmotion/http-service';
import { LoggingService, Severity } from '@buildmotion/logging';
import { ServiceContext } from '@buildmotion/foundation';

@Injectable({ providedIn: 'root' })
export class UserRepository {
  constructor(
    private httpService: HttpService,
    private loggingService: LoggingService
  ) {}

  getUser(id: string): Observable<User> {
    const url = `/api/users/${id}`;
    const options = this.httpService.createOptions(
      HttpRequestMethod.get,
      this.httpService.createHeader(),
      url,
      null,
      null
    );

    this.loggingService.log('UserRepository', Severity.Information,
      `Fetching user: ${id}`);

    return this.httpService.executeObserveBody<User>(options);
  }

  createUser(userData: CreateUserDto): Observable<User> {
    const url = '/api/users';
    const headers = this.httpService.createHeader(true); // Include CSRF
    const options = this.httpService.createOptions(
      HttpRequestMethod.post,
      headers,
      url,
      userData,
      null
    );

    return this.httpService.executeObserveBody<User>(options);
  }

  updateUser(id: string, userData: UpdateUserDto): Observable<User> {
    const url = `/api/users/${id}`;
    const options = this.httpService.createOptions(
      HttpRequestMethod.put,
      this.httpService.createHeader(true),
      url,
      userData,
      null
    );

    return this.httpService.executeObserveBody<User>(options);
  }

  deleteUser(id: string): Observable<void> {
    const url = `/api/users/${id}`;
    const options = this.httpService.createOptions(
      HttpRequestMethod.delete,
      this.httpService.createHeader(true),
      url,
      null,
      null
    );

    return this.httpService.executeObserveBody<void>(options);
  }
}
```

### Service Layer Usage

```typescript
@Injectable({ providedIn: 'root' })
export class UserManagementService extends ServiceBase {
  constructor(
    private userRepository: UserRepository,
    loggingService: LoggingService,
    serviceContext: ServiceContext
  ) {
    super('UserManagementService', loggingService, serviceContext);
  }

  getUser(id: string): Observable<User> {
    return this.userRepository.getUser(id).pipe(
      tap(user => {
        this.loggingService.log(this.serviceName, Severity.Information,
          'User retrieved successfully');
      }),
      catchError(error => {
        this.handleUnexpectedError(error);
        return throwError(() => error);
      })
    );
  }
}
```

---

## 🔧 Interceptor Configuration

### Providing Interceptors

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { 
  HttpTokenInterceptor,
  HttpErrorInterceptor,
  HttpResponseInterceptor 
} from '@buildmotion/http-service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([
        HttpTokenInterceptor,
        HttpErrorInterceptor,
        HttpResponseInterceptor
      ])
    ),
    {
      provide: HttpOptions,
      useValue: { csrf: '/api/csrf-token' }
    }
  ]
};
```

### Custom Error Handling

```typescript
// Custom error interceptor
export class CustomHttpErrorInterceptor implements HttpInterceptor {
  constructor(
    private loggingService: LoggingService,
    private notificationService: NotificationService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        this.loggingService.log('HttpError', Severity.Error,
          `HTTP Error: ${error.status} - ${error.message}`);

        if (error.status === 401) {
          this.notificationService.error('Authentication required');
        } else if (error.status === 403) {
          this.notificationService.error('Access denied');
        } else if (error.status >= 500) {
          this.notificationService.error('Server error occurred');
        }

        return throwError(() => error);
      })
    );
  }
}
```

---

## 🧪 Testing Guidelines

### Unit Testing HTTP Service

```typescript
describe('UserRepository', () => {
  let repository: UserRepository;
  let httpService: jasmine.SpyObj<HttpService>;
  let loggingService: jasmine.SpyObj<LoggingService>;

  beforeEach(() => {
    httpService = jasmine.createSpyObj('HttpService', [
      'createOptions', 'createHeader', 'executeObserveBody'
    ]);
    loggingService = jasmine.createSpyObj('LoggingService', ['log']);

    TestBed.configureTestingModule({
      providers: [
        UserRepository,
        { provide: HttpService, useValue: httpService },
        { provide: LoggingService, useValue: loggingService }
      ]
    });

    repository = TestBed.inject(UserRepository);
  });

  it('should get user by id', (done) => {
    const mockUser = { id: '123', name: 'Test User' };
    httpService.executeObserveBody.and.returnValue(of(mockUser));
    httpService.createHeader.and.returnValue(new HttpHeaders());

    repository.getUser('123').subscribe(user => {
      expect(user).toEqual(mockUser);
      expect(httpService.createOptions).toHaveBeenCalled();
      done();
    });
  });
});
```

### Integration Testing with HttpTestingController

```typescript
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

describe('HttpService Integration', () => {
  let httpService: HttpService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        HttpService,
        // ... other dependencies
      ]
    });

    httpService = TestBed.inject(HttpService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should execute GET request', () => {
    const mockData = { data: 'test' };
    const options = httpService.createOptions(
      HttpRequestMethod.get,
      null,
      '/api/test',
      null,
      null
    );

    httpService.executeObserveBody(options).subscribe(data => {
      expect(data).toEqual(mockData);
    });

    const req = httpMock.expectOne('/api/test');
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });
});
```

---

## 📊 Best Practices

### Do's ✅

- Use createOptions() to standardize requests
- Include CSRF tokens for state-changing operations
- Use appropriate HTTP methods (GET for reads, POST for creates)
- Handle errors with proper logging
- Use type parameters for type safety
- Configure interceptors in app config
- Use observeBody for most operations
- Log HTTP operations at appropriate severity levels

### Don'ts ❌

- Don't bypass the HttpService wrapper
- Don't hardcode URLs in components
- Don't ignore CSRF protection
- Don't swallow HTTP errors
- Don't create multiple HTTP service instances
- Don't mix HTTP calls with business logic
- Don't forget to unsubscribe from HTTP observables
- Don't expose sensitive data in headers

---

## 🚀 Advanced Usage

### CSRF Token Management

```typescript
export class SecureDataService {
  constructor(private httpService: HttpService) {}

  async initializeCsrf(): Promise<void> {
    return firstValueFrom(
      this.httpService.getCsrfToken().pipe(
        tap(() => console.log('CSRF token retrieved'))
      )
    );
  }

  createSecureData(data: any): Observable<any> {
    // CSRF token is automatically included
    const options = this.httpService.createOptions(
      HttpRequestMethod.post,
      this.httpService.createHeader(true), // includeCsrf = true
      '/api/secure-data',
      data,
      null
    );

    return this.httpService.executeObserveBody(options);
  }
}
```

### Query Parameters

```typescript
export class SearchService {
  search(query: string, page: number): Observable<SearchResults> {
    const params = { q: query, page: page.toString() };
    const options = this.httpService.createOptions(
      HttpRequestMethod.get,
      this.httpService.createHeader(),
      '/api/search',
      null,
      params
    );

    return this.httpService.executeObserveBody<SearchResults>(options);
  }
}
```

---

## 📚 Related Libraries

- **@buildmotion/foundation** - ServiceBase, ServiceContext
- **@buildmotion/logging** - Logging infrastructure
- **@buildmotion/error-handling** - Error handling patterns
- **@buildmotion/configuration** - HTTP endpoint configuration

---

## 🔍 See Also

- [Clean Architecture Specification](./angular-clean-architecture.specification.md)
- [Foundation Specification](./foundation.specification.md)
- [Logging Specification](./logging.specification.md)
- [Error Handling Specification](./error-handling.specification.md)
