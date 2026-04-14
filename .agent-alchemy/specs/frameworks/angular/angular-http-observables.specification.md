---
meta:
  id: angular-http-observables-specification
  title: Angular HTTP Client and Observables Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags:
    - http-client
    - observables
    - rxjs
    - api-calls
    - interceptors
    - error-handling
    - http communication
    - rxjs observables
    - api integration
    - error handling
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
title: Angular HTTP Client and Observables Specification
category: HTTP & Observables
feature: Data Communication
lastUpdated: 2024-09-24T00:00:00.000Z
source: Angular Official Documentation
version: Angular 18+
aiContext: true
applyTo:
  - '**/*.service.ts'
  - '**/*.component.ts'
keywords:
  - http-client
  - observables
  - rxjs
  - api-calls
  - interceptors
  - error-handling
topics:
  - http communication
  - rxjs observables
  - api integration
  - interceptors
  - error handling
useCases: []
---

# Angular HTTP Client and Observables Specification

## Overview

Angular's HTTP Client is a powerful service for communicating with remote servers over HTTP. Built on RxJS observables, it provides a reactive approach to handling asynchronous data operations. The HTTP client offers features like request/response transformation, error handling, interceptors for cross-cutting concerns, and strong typing support.

The integration with RxJS observables enables developers to compose complex asynchronous operations, handle multiple concurrent requests, and implement sophisticated error handling and retry logic.

## Core Concepts

### HTTP Client Service

The `HttpClient` service is Angular's mechanism for communicating with remote servers:

**Key Features:**

- Observable-based API for reactive programming
- Automatic JSON parsing and serialization
- Request and response interceptors
- Comprehensive error handling
- TypeScript type safety
- Request cancellation support
- Progress reporting for uploads/downloads

**Implementation Patterns:**

```typescript
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://api.example.com';

  // GET request with type safety
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users`).pipe(catchError(this.handleError<User[]>('getUsers', [])));
  }

  // GET single resource
  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/${id}`).pipe(catchError(this.handleError<User>('getUser')));
  }

  // POST request
  createUser(user: Omit<User, 'id'>): Observable<User> {
    return this.http
      .post<User>(`${this.baseUrl}/users`, user, {
        headers: { 'Content-Type': 'application/json' },
      })
      .pipe(catchError(this.handleError<User>('createUser')));
  }

  // PUT request
  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/users/${id}`, user).pipe(catchError(this.handleError<User>('updateUser')));
  }

  // DELETE request
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${id}`).pipe(catchError(this.handleError<void>('deleteUser')));
  }

  // Error handling
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);

      // Let the app keep running by returning an empty result
      return of(result as T);
    };
  }
}
```

### Observable Patterns and RxJS Integration

Angular HTTP client leverages RxJS observables for powerful data flow management:

**Common Observable Patterns:**

```typescript
@Injectable({
  providedIn: 'root',
})
export class DataService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://api.example.com';

  // Combining multiple HTTP requests
  getUserWithPosts(userId: number): Observable<{ user: User; posts: Post[] }> {
    const user$ = this.http.get<User>(`${this.baseUrl}/users/${userId}`);
    const posts$ = this.http.get<Post[]>(`${this.baseUrl}/users/${userId}/posts`);

    return combineLatest([user$, posts$]).pipe(
      map(([user, posts]) => ({ user, posts })),
      catchError((error) => {
        console.error('Error loading user data:', error);
        return throwError(() => new Error('Failed to load user data'));
      })
    );
  }

  // Sequential HTTP requests
  createUserAndProfile(userData: CreateUserData): Observable<UserProfile> {
    return this.http.post<User>(`${this.baseUrl}/users`, userData).pipe(
      switchMap((user) =>
        this.http.post<UserProfile>(`${this.baseUrl}/users/${user.id}/profile`, {
          userId: user.id,
          ...userData.profile,
        })
      ),
      catchError((error) => {
        console.error('Error creating user and profile:', error);
        return throwError(() => error);
      })
    );
  }

  // Retry logic with exponential backoff
  getDataWithRetry(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/data`).pipe(
      retry({
        count: 3,
        delay: (error, retryCount) => {
          console.log(`Retry attempt ${retryCount} after error:`, error);
          return timer(Math.pow(2, retryCount) * 1000); // Exponential backoff
        },
      }),
      catchError((error) => {
        console.error('Max retries exceeded:', error);
        return throwError(() => new Error('Service temporarily unavailable'));
      })
    );
  }

  // Polling data
  pollDataUpdates(interval: number = 5000): Observable<any[]> {
    return timer(0, interval).pipe(
      switchMap(() => this.http.get<any[]>(`${this.baseUrl}/data`)),
      catchError((error) => {
        console.error('Polling error:', error);
        return EMPTY; // Continue polling despite errors
      })
    );
  }
}
```

### HTTP Interceptors

Interceptors provide a way to handle HTTP requests and responses globally:

```typescript
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add authentication token
    const authToken = this.authService.getToken();
    if (authToken) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${authToken}`),
      });
      return next.handle(authReq);
    }

    return next.handle(req);
  }
}

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        switch (error.status) {
          case 401:
            this.router.navigate(['/login']);
            break;
          case 403:
            this.notificationService.showError('Access denied');
            break;
          case 500:
            this.notificationService.showError('Server error occurred');
            break;
          default:
            this.notificationService.showError('An error occurred');
        }

        return throwError(() => error);
      })
    );
  }
}

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private loadingService = inject(LoadingService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.loadingService.show();

    return next.handle(req).pipe(finalize(() => this.loadingService.hide()));
  }
}
```

## Angular Patterns and Best Practices

### Recommended Implementation

**Service with Signal-Based State Management:**

```typescript
@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://api.example.com/products';

  // Private signals for internal state
  private _products = signal<Product[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // Public readonly signals
  public readonly products = this._products.asReadonly();
  public readonly loading = this._loading.asReadonly();
  public readonly error = this._error.asReadonly();

  // Computed signals
  public readonly featuredProducts = computed(() => this._products().filter((product) => product.featured));

  // Load products with error handling
  loadProducts(): void {
    this._loading.set(true);
    this._error.set(null);

    this.http
      .get<Product[]>(this.baseUrl)
      .pipe(
        catchError((error) => {
          this._error.set('Failed to load products');
          console.error('Error loading products:', error);
          return of([]); // Return empty array on error
        }),
        finalize(() => this._loading.set(false))
      )
      .subscribe((products) => {
        this._products.set(products);
      });
  }

  // Search products with debouncing
  searchProducts(query: string): Observable<Product[]> {
    if (!query.trim()) {
      return of([]);
    }

    const params = new HttpParams().set('q', query.trim());

    return this.http.get<Product[]>(`${this.baseUrl}/search`, { params }).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      catchError((error) => {
        console.error('Search error:', error);
        return of([]);
      })
    );
  }

  // Upload file with progress tracking
  uploadProductImage(productId: number, file: File): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http
      .post(`${this.baseUrl}/${productId}/image`, formData, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(
        catchError((error) => {
          console.error('Upload error:', error);
          return throwError(() => error);
        })
      );
  }
}
```

### Common Use Cases

1. **CRUD Operations**: Create, read, update, delete operations with REST APIs
2. **Authentication**: Token-based authentication with interceptors
3. **File Uploads**: Progress tracking and error handling
4. **Real-time Data**: Polling or WebSocket integration
5. **Caching**: HTTP cache strategies with interceptors
6. **Error Recovery**: Retry logic and fallback mechanisms

### Anti-Patterns to Avoid

- **Not Unsubscribing**: Always manage subscriptions to prevent memory leaks
- **Nested Subscriptions**: Use operators like `switchMap`, `mergeMap` instead
- **Ignoring Error Handling**: Always implement proper error handling
- **Synchronous HTTP**: Never block the UI with synchronous operations
- **Missing Type Safety**: Always use TypeScript interfaces for HTTP responses

## API Reference

### Core APIs

#### HttpClient

**Purpose**: Service for making HTTP requests
**Usage**: Injected into services for API communication
**Methods**:

- `get<T>()`: GET requests with type safety
- `post<T>()`: POST requests with request body
- `put<T>()`: PUT requests for updates
- `delete<T>()`: DELETE requests
- `patch<T>()`: PATCH requests for partial updates

```typescript
// GET with query parameters
this.http.get<User[]>('/api/users', {
  params: new HttpParams().set('page', '1').set('limit', '10').set('sort', 'name'),
});

// POST with headers
this.http.post<User>('/api/users', userData, {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }),
});
```

#### HttpParams and HttpHeaders

**Purpose**: Configure request parameters and headers
**Usage**: Build type-safe request configurations

```typescript
const params = new HttpParams().set('search', query).set('category', category).set('sortBy', 'date');

const headers = new HttpHeaders().set('Accept', 'application/json').set('Cache-Control', 'no-cache');
```

## Testing Strategies

### Unit Testing HTTP Services

```typescript
describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService],
    });

    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load products', () => {
    const mockProducts: Product[] = [
      { id: 1, name: 'Product 1', price: 100 },
      { id: 2, name: 'Product 2', price: 200 },
    ];

    service.loadProducts();

    const req = httpMock.expectOne('https://api.example.com/products');
    expect(req.request.method).toBe('GET');
    req.flush(mockProducts);

    expect(service.products()).toEqual(mockProducts);
    expect(service.loading()).toBeFalsy();
  });

  it('should handle errors', () => {
    service.loadProducts();

    const req = httpMock.expectOne('https://api.example.com/products');
    req.error(new ProgressEvent('Network error'));

    expect(service.error()).toBe('Failed to load products');
    expect(service.products()).toEqual([]);
  });
});
```

### Testing Interceptors

```typescript
describe('AuthInterceptor', () => {
  let interceptor: AuthInterceptor;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('AuthService', ['getToken']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthInterceptor,
        { provide: AuthService, useValue: spy },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true,
        },
      ],
    });

    interceptor = TestBed.inject(AuthInterceptor);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('should add auth token to requests', () => {
    authService.getToken.and.returnValue('test-token');

    const httpClient = TestBed.inject(HttpClient);
    httpClient.get('/api/data').subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush({});
  });
});
```

## Performance Considerations

### Optimization Techniques

- **Request Caching**: Implement caching strategies with interceptors
- **Request Debouncing**: Debounce search and auto-complete requests
- **Connection Pooling**: Let Angular handle HTTP connection management
- **Lazy Loading**: Load data only when needed
- **Pagination**: Implement server-side pagination for large datasets

### Common Performance Pitfalls

- **Memory Leaks**: Not unsubscribing from HTTP observables
- **Excessive Requests**: Making unnecessary API calls
- **Large Payloads**: Not optimizing request/response sizes
- **Blocking Operations**: Using synchronous operations

## Security Considerations

### Best Practices

- **HTTPS Only**: Always use HTTPS in production
- **Token Security**: Secure storage and transmission of auth tokens
- **Input Validation**: Validate all user inputs before sending to server
- **CSRF Protection**: Implement CSRF tokens where required
- **Content Security Policy**: Configure proper CSP headers

### Implementation Patterns

```typescript
// Secure token storage
@Injectable({
  providedIn: 'root',
})
export class SecureStorageService {
  private readonly tokenKey = 'auth_token';

  setToken(token: string): void {
    // Use secure storage mechanism
    sessionStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  removeToken(): void {
    sessionStorage.removeItem(this.tokenKey);
  }
}
```

## Related Specifications

- [Services and Dependency Injection](../services-di/angular-services-di.specification.md)
- [Forms and Validation](../forms-validation/angular-forms-validation.specification.md)
- [Testing and Performance](../testing-performance/angular-testing-performance.specification.md)
- [Best Practices](../best-practices/angular-best-practices.specification.md)

## References

- [Angular HTTP Client Guide](https://angular.dev/guide/http)
- [HttpClient API Reference](https://angular.dev/api/common/http/HttpClient)
- [HTTP Interceptors Guide](https://angular.dev/guide/http/interceptors)
- [RxJS Operators Reference](https://rxjs.dev/guide/operators)

## Migration Notes

### From Previous Versions

- Angular 15+: Standalone HttpClient configuration
- Angular 12+: Strict typing improvements for HTTP responses
- Angular 11+: Hot module replacement affects HTTP interceptors

### Breaking Changes

- HTTP interceptor registration changes with standalone applications
- Observable type inference improvements
- Error handling signature updates

## Troubleshooting

### Common Issues

1. **CORS Errors**: Configure server CORS policy or use proxy configuration
2. **Request Timeout**: Implement proper timeout handling
3. **Memory Leaks**: Always unsubscribe from HTTP observables

### Debug Techniques

- Use browser DevTools Network tab for request inspection
- Enable Angular HTTP client logging
- Use RxJS debugging operators like `tap` for request flow analysis