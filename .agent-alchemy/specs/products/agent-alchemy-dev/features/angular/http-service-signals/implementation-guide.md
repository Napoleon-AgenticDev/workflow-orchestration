---

meta:
id: products-agent-alchemy-dev-features-angular-http-service-signals-implementation-guide-md
  title: Implementation Guide
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'

meta:
meta:

---

# HTTP Service Signals - Implementation Guide

**Document Type:** Implementation Guide  
**Audience:** Development Teams, Engineers  
**Version:** 1.0  
**Last Updated:** 2025-10-22

---

## 🎯 Overview

This guide provides step-by-step instructions for implementing HTTP Service Signals in Angular applications. By following this guide, you'll build a production-ready implementation that follows best practices and Clean Architecture principles.

**Implementation Time:** 3-5 days  
**Skill Level:** Intermediate to Advanced Angular/TypeScript

---

## 📋 Prerequisites

### Required Knowledge
- Angular fundamentals (services, DI, modules)
- TypeScript generics and interfaces
- RxJS Observable patterns
- HTTP protocols and REST APIs
- Clean Architecture principles

### Development Environment
- Angular 16+ installed
- TypeScript 5.0+ configured
- Node.js 18+ runtime
- IDE with TypeScript support (VS Code recommended)

---

## 🏗️ Implementation Steps

### Step 1: Define Interfaces


Create `src/app/http/http-service.interface.ts`:

```typescript
import { Observable } from 'rxjs';
import { HttpHeaders, HttpParams } from '@angular/common/http';

/**
 * HTTP Service interface
 */
export interface IHttpService {
  get<T>(url: string, options?: HttpOptions): Observable<T>;
  post<T>(url: string, body: any, options?: HttpOptions): Observable<T>;
  put<T>(url: string, body: any, options?: HttpOptions): Observable<T>;
  delete<T>(url: string, options?: HttpOptions): Observable<T>;
  patch<T>(url: string, body: any, options?: HttpOptions): Observable<T>;
}

export interface HttpOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | string[] };
  withCredentials?: boolean;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
}
```


**Key Design Points:**
- Use interfaces for contracts
- Make properties readonly where appropriate
- Use generics for type safety
- Document all public APIs

---

### Step 2: Implement Core Service


Create `src/app/http/http.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IHttpService, HttpOptions } from './http-service.interface';

@Injectable({ providedIn: 'root' })
export class HttpService implements IHttpService {
  
  constructor(private http: HttpClient) {}

  get<T>(url: string, options?: HttpOptions): Observable<T> {
    return this.http.get<T>(url, this.prepareOptions(options));
  }

  post<T>(url: string, body: any, options?: HttpOptions): Observable<T> {
    return this.http.post<T>(url, body, this.prepareOptions(options));
  }

  put<T>(url: string, body: any, options?: HttpOptions): Observable<T> {
    return this.http.put<T>(url, body, this.prepareOptions(options));
  }

  delete<T>(url: string, options?: HttpOptions): Observable<T> {
    return this.http.delete<T>(url, this.prepareOptions(options));
  }

  patch<T>(url: string, body: any, options?: HttpOptions): Observable<T> {
    return this.http.patch<T>(url, body, this.prepareOptions(options));
  }

  private prepareOptions(options?: HttpOptions): any {
    // Prepare and standardize options
    return options || {};
  }
}
```


**Implementation Notes:**
- Use `@Injectable({ providedIn: 'root' })` for singleton services
- Initialize dependencies via constructor injection
- Use TypeScript generics for type safety
- Follow Angular style guide

---

### Step 3: Add Supporting Components


Create interceptors in `src/app/http/interceptors/`:

```typescript
// auth-interceptor.ts
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    if (token) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }
    return next.handle(req);
  }
}

// error-interceptor.ts
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Transform and handle errors
        return throwError(() => this.handleError(error));
      })
    );
  }
}
```


**Best Practices:**
- Keep components focused and single-purpose
- Use dependency injection
- Handle errors gracefully
- Write comprehensive tests

---

### Step 4: Configure Angular Module

Configure in `app.config.ts` (standalone) or `app.module.ts` (module-based):

```typescript
// Standalone configuration
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    HTTPServiceSignalsService
  ]
};

// Module configuration
@NgModule({
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    HTTPServiceSignalsService
  ]
})
export class AppModule { }
```

---

### Step 5: Integrate with Application

Use in your components and services:

```typescript
@Component({
  selector: 'app-example',
  template: '...'
})
export class ExampleComponent implements OnInit {
  data$ = signal<any>(null);
  loading$ = signal<boolean>(false);
  error$ = signal<string | null>(null);

  constructor(private service: HTTPServiceSignalsService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading$.set(true);
    this.service.getData().subscribe({
      next: (data) => {
        this.data$.set(data);
        this.loading$.set(false);
      },
      error: (error) => {
        this.error$.set(error.message);
        this.loading$.set(false);
      }
    });
  }
}
```

---

### Step 6: Add Error Handling

Implement comprehensive error handling:

```typescript
private handleError(error: any): Observable<never> {
  let errorMessage = 'An error occurred';
  
  if (error instanceof HttpErrorResponse) {
    // Server error
    errorMessage = `Server error: ${error.status} - ${error.message}`;
  } else if (error instanceof Error) {
    // Client error
    errorMessage = `Client error: ${error.message}`;
  }
  
  // Log error
  console.error(errorMessage, error);
  
  // Return user-friendly error
  return throwError(() => new Error(errorMessage));
}
```

---

### Step 7: Implement Testing

Create comprehensive tests:

```typescript
describe('HTTPServiceSignalsService', () => {
  let service: HTTPServiceSignalsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HTTPServiceSignalsService]
    });
    
    service = TestBed.inject(HTTPServiceSignalsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should handle successful requests', () => {
    const mockData = { id: 1, name: 'Test' };
    
    service.getData().subscribe(data => {
      expect(data).toEqual(mockData);
    });

    const req = httpMock.expectOne('/api/data');
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });

  it('should handle errors', () => {
    service.getData().subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error).toBeTruthy();
      }
    });

    const req = httpMock.expectOne('/api/data');
    req.error(new ErrorEvent('Network error'));
  });
});
```

---

## 🧪 Testing Strategy

### Unit Tests
- Test service in isolation with mocked dependencies
- Verify all public methods work correctly
- Test error handling paths
- Validate type safety

### Integration Tests
- Test service with real Angular components
- Verify interceptor chains
- Test with HttpClientTestingModule
- Validate error recovery

### E2E Tests
- Test complete user workflows
- Verify behavior in real browser
- Test with actual backend (staging)
- Validate edge cases

---

## 📚 Usage Examples

### Basic Usage

```typescript
// Simple GET request
this.httpService.get<User[]>('/api/users')
  .subscribe(users => console.log(users));

// POST with body
this.httpService.post<User>('/api/users', { name: 'John' })
  .subscribe(user => console.log(user));

// With custom headers
const options = {
  headers: { 'X-Custom-Header': 'value' }
};
this.httpService.get<Data>('/api/data', options)
  .subscribe(data => console.log(data));
```

### Advanced Usage

```typescript
// With retry logic
this.httpService.get<Data>('/api/data')
  .pipe(
    retry(3),
    catchError(this.handleError)
  )
  .subscribe(data => console.log(data));

// With caching
this.httpService.get<Data>('/api/data')
  .pipe(
    shareReplay(1)
  )
  .subscribe(data => console.log(data));

// Parallel requests
forkJoin({
  users: this.httpService.get<User[]>('/api/users'),
  posts: this.httpService.get<Post[]>('/api/posts')
}).subscribe(results => console.log(results));
```

---

## 🔍 Common Patterns

### Pattern 1: Loading State Management
Track loading state for better UX:

```typescript
loading = signal(false);

loadData(): void {
  this.loading.set(true);
  this.service.getData()
    .pipe(finalize(() => this.loading.set(false)))
    .subscribe(/* ... */);
}
```

### Pattern 2: Error Recovery
Implement automatic retry with backoff:

```typescript
this.service.getData()
  .pipe(
    retryWhen(errors =>
      errors.pipe(
        scan((count, error) => {
          if (count >= 3) throw error;
          return count + 1;
        }, 0),
        delay(1000)
      )
    )
  )
  .subscribe(/* ... */);
```

### Pattern 3: Request Cancellation
Cancel requests when component is destroyed:

```typescript
private destroy$ = new Subject<void>();

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}

loadData(): void {
  this.service.getData()
    .pipe(takeUntil(this.destroy$))
    .subscribe(/* ... */);
}
```

---

## 🚨 Troubleshooting

### Issue 1: CORS Errors
**Symptom:** Requests blocked by CORS policy  
**Solution:** Configure server CORS headers or use proxy configuration

### Issue 2: Token Not Included
**Symptom:** Authentication fails  
**Solution:** Verify interceptor is registered and token is available

### Issue 3: Memory Leaks
**Symptom:** Memory usage grows  
**Solution:** Always unsubscribe from observables (use takeUntil pattern)

### Issue 4: Type Errors
**Symptom:** TypeScript compilation errors  
**Solution:** Ensure response types match expected interfaces

---

## 💡 Best Practices

- ✅ Always use TypeScript generics for type safety
- ✅ Implement proper error handling
- ✅ Unsubscribe from observables to prevent leaks
- ✅ Use interceptors for cross-cutting concerns
- ✅ Write comprehensive tests
- ✅ Document public APIs
- ✅ Handle loading and error states
- ✅ Implement retry logic for transient failures
- ✅ Use environment variables for API URLs
- ✅ Log errors for debugging

---

## 🎯 Performance Optimization

### Caching Strategies
```typescript
private cache = new Map<string, Observable<any>>();

getCached<T>(url: string): Observable<T> {
  if (!this.cache.has(url)) {
    this.cache.set(url, this.get<T>(url).pipe(shareReplay(1)));
  }
  return this.cache.get(url)!;
}
```

### Request Debouncing
```typescript
searchUsers(term: string): Observable<User[]> {
  return this.searchTerm$.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(term => this.httpService.get<User[]>(\`/api/users?q=${term}\`))
  );
}
```

### Request Batching
Combine multiple requests into one:

```typescript
batchGet<T>(urls: string[]): Observable<T[]> {
  return forkJoin(urls.map(url => this.get<T>(url)));
}
```

---

## ✅ Implementation Checklist

- [ ] Interfaces defined with proper typing
- [ ] Core service implemented
- [ ] Interceptors created and registered
- [ ] Error handling implemented
- [ ] Angular DI configured
- [ ] Unit tests written and passing (>85% coverage)
- [ ] Integration tests completed
- [ ] Documentation updated
- [ ] Performance validated
- [ ] Security reviewed
- [ ] Code review completed
- [ ] Deployed to development environment

---

## 📈 Next Steps

1. **Validate Implementation** - Ensure all requirements met
2. **Performance Testing** - Load test with realistic data
3. **Security Audit** - Review security considerations
4. **Team Training** - Train team on usage patterns
5. **Production Rollout** - Deploy with monitoring

---

## 📚 Additional Resources

- [Business Specification](./business-specification.md) - Business value and ROI
- [Technical Specification](./technical-specification.md) - Architecture details
- [Angular HTTP Guide](https://angular.io/guide/http)
- [RxJS Documentation](https://rxjs.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Questions or need help?** Contact matt.vaughn@buildmotion.com

**Author:** Matt Vaughn / Buildmotion  
**Website:** https://www.buildmotion.com
