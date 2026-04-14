---
meta:
  id: nestjs-advanced-concepts-specification
  title: NestJS Advanced Concepts Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags:
    - guards
    - interceptors
    - pipes
    - filters
    - middleware
    - request-lifecycle
    - cross-cutting-concerns
    - exception filters
    - request lifecycle
    - cross-cutting concerns
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
title: NestJS Advanced Concepts Specification
category: Advanced Framework Features
feature: Guards, Interceptors, Pipes, Filters
lastUpdated: 2024-09-24T00:00:00.000Z
source: NestJS Official Documentation
version: NestJS 10+
aiContext: true
applyTo:
  - '**/*.guard.ts'
  - '**/*.interceptor.ts'
  - '**/*.pipe.ts'
  - '**/*.filter.ts'
keywords:
  - guards
  - interceptors
  - pipes
  - filters
  - middleware
  - request-lifecycle
  - cross-cutting-concerns
topics:
  - guards
  - interceptors
  - pipes
  - exception filters
  - request lifecycle
  - cross-cutting concerns
useCases: []
---

# NestJS Advanced Concepts Specification

## Overview

NestJS provides advanced architectural patterns and components that enable developers to build sophisticated, maintainable applications. These include Guards for authorization, Interceptors for cross-cutting concerns, Pipes for data transformation and validation, and Exception Filters for error handling.

These components work together in the NestJS request lifecycle to provide a robust foundation for enterprise-grade applications with proper separation of concerns.

## Core Concepts

### Guards

Guards determine whether a request should be handled by a route handler. They're executed before interceptors and pipes:

**Key Features:**

- Authentication and authorization logic
- Access control based on roles or permissions
- Request context analysis
- Can be applied at controller, method, or global level

**Implementation Patterns:**

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Access token required');
    }

    try {
      const payload = this.jwtService.verify(token);
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [context.getHandler(), context.getClass()]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// Custom decorator for roles
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

// Usage in controllers
@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
export class AdminController {
  @Get('users')
  @Roles(Role.ADMIN, Role.MODERATOR)
  getUsers() {
    return this.adminService.getUsers();
  }
}
```

### Interceptors

Interceptors provide a way to add extra logic before and after method execution:

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const now = Date.now();

    this.logger.log(`Incoming Request: ${method} ${url}`);

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        this.logger.log(`Completed: ${method} ${url} - ${responseTime}ms`);
      }),
      catchError((error) => {
        const responseTime = Date.now() - now;
        this.logger.error(`Failed: ${method} ${url} - ${responseTime}ms - ${error.message}`);
        throw error;
      })
    );
  }
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
        path: context.switchToHttp().getRequest().url,
      }))
    );
  }
}

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = `${request.method}:${request.url}`;

    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    const cachedResponse = await this.cacheManager.get(cacheKey);
    if (cachedResponse) {
      return of(cachedResponse);
    }

    return next.handle().pipe(
      tap(async (response) => {
        await this.cacheManager.set(cacheKey, response, 300); // 5 minutes
      })
    );
  }
}
```

### Pipes

Pipes transform input data or validate it before it reaches the route handler:

```typescript
@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    const { metatype } = metadata;

    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const errorMessages = errors.map((error) => Object.values(error.constraints || {}).join(', ')).join('; ');

      throw new BadRequestException(`Validation failed: ${errorMessages}`);
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed: expected numeric string');
    }
    return val;
  }
}

@Injectable()
export class TrimPipe implements PipeTransform {
  transform(value: any): any {
    if (typeof value === 'string') {
      return value.trim();
    }
    if (typeof value === 'object' && value !== null) {
      return this.trimObjectStrings(value);
    }
    return value;
  }

  private trimObjectStrings(obj: any): any {
    const result = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (typeof value === 'string') {
          result[key] = value.trim();
        } else if (typeof value === 'object' && value !== null) {
          result[key] = this.trimObjectStrings(value);
        } else {
          result[key] = value;
        }
      }
    }
    return result;
  }
}
```

### Exception Filters

Exception filters handle errors and provide consistent error responses:

```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof exceptionResponse === 'string' ? exceptionResponse : (exceptionResponse as any).message || exception.message,
      ...(typeof exceptionResponse === 'object' && exceptionResponse),
    };

    this.logger.error(`${request.method} ${request.url} - ${status} - ${exception.message}`, exception.stack);

    response.status(status).json(errorResponse);
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    };

    this.logger.error(`${request.method} ${request.url} - ${status} - ${message}`, exception instanceof Error ? exception.stack : exception);

    response.status(status).json(errorResponse);
  }
}

@Catch(TypeORMError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  catch(exception: TypeORMError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error occurred';

    if (exception.message.includes('duplicate key')) {
      status = HttpStatus.CONFLICT;
      message = 'Resource already exists';
    } else if (exception.message.includes('foreign key constraint')) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid reference to related resource';
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message,
      error: 'Database Error',
    });
  }
}
```

## Angular Patterns and Best Practices

### Recommended Implementation

**Guards Best Practices:**

- Keep guards focused on single responsibility (authentication OR authorization)
- Use reflector for metadata-driven guards
- Chain guards in logical order (auth before roles)
- Provide clear error messages

**Interceptors Best Practices:**

- Use interceptors for cross-cutting concerns
- Keep interceptor logic lightweight
- Handle errors gracefully in interceptors
- Chain interceptors thoughtfully

**Pipes Best Practices:**

- Make pipes pure and side-effect free
- Provide clear validation error messages
- Use built-in pipes when possible
- Create custom pipes for domain-specific transformations

**Exception Filters Best Practices:**

- Create specific filters for different error types
- Log errors appropriately without exposing sensitive data
- Provide consistent error response format
- Handle both HTTP and non-HTTP exceptions

### Common Use Cases

1. **Authentication Flow**: Using guards to protect routes and interceptors to add user context
2. **Request/Response Transformation**: Interceptors for formatting API responses consistently
3. **Input Validation**: Pipes for validating and transforming request data
4. **Error Handling**: Exception filters for consistent error responses across the API

### Anti-Patterns to Avoid

- **Heavy Logic in Guards**: Guards should be lightweight and focused
- **Side Effects in Pipes**: Pipes should be pure transformation functions
- **Catching All Exceptions**: Be specific about which exceptions to handle
- **Not Logging Errors**: Always log errors appropriately for debugging

## API Reference

### Guard Interface

#### CanActivate

**Purpose**: Interface for implementing route guards
**Usage**: Implement to create custom guards
**Methods**: `canActivate(context: ExecutionContext): boolean | Promise<boolean>`

### Interceptor Interface

#### NestInterceptor

**Purpose**: Interface for implementing interceptors
**Usage**: Implement to create custom interceptors
**Methods**: `intercept(context: ExecutionContext, next: CallHandler): Observable<any>`

### Pipe Interface

#### PipeTransform

**Purpose**: Interface for implementing pipes
**Usage**: Implement to create custom pipes
**Methods**: `transform(value: any, metadata: ArgumentMetadata): any`

### Exception Filter Interface

#### ExceptionFilter

**Purpose**: Interface for implementing exception filters
**Usage**: Implement to create custom exception filters
**Methods**: `catch(exception: T, host: ArgumentsHost): any`

## Testing Strategies

### Testing Guards

```typescript
describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should allow access with valid token', async () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: 'Bearer valid-token' },
        }),
      }),
    } as ExecutionContext;

    jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 1 });

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });
});
```

### Testing Interceptors

```typescript
describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
  });

  it('should log request and response', (done) => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          url: '/test',
        }),
      }),
    } as ExecutionContext;

    const mockCallHandler = {
      handle: () => of('test response'),
    };

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      next: (data) => {
        expect(data).toBe('test response');
        done();
      },
    });
  });
});
```

## Performance Considerations

### Optimization Techniques

- Use caching interceptors for expensive operations
- Implement request throttling with guards
- Use async pipes for non-blocking operations
- Cache validation results in pipes where appropriate

### Common Performance Pitfalls

- Heavy computation in guards blocking requests
- Not handling errors in interceptors causing memory leaks
- Expensive validation in pipes without caching
- Creating new instances in filters instead of reusing

## Related Specifications

- [NestJS Fundamentals](./nestjs-fundamentals.specification.md)
- [NestJS Authentication](./nestjs-authentication.specification.md)
- [NestJS Testing](./nestjs-testing.specification.md)
- [NestJS Performance](./nestjs-performance.specification.md)

## References

- [NestJS Guards Documentation](https://docs.nestjs.com/guards)
- [NestJS Interceptors Documentation](https://docs.nestjs.com/interceptors)
- [NestJS Pipes Documentation](https://docs.nestjs.com/pipes)
- [NestJS Exception Filters Documentation](https://docs.nestjs.com/exception-filters)

## Code Examples

### Complete Request Pipeline Example

```typescript
@Controller('products')
@UseInterceptors(LoggingInterceptor, TransformInterceptor)
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
export class ProductsController {
  @Get()
  @Roles(Role.USER)
  async findAll(@Query(ValidationPipe) query: FindProductsDto): Promise<Product[]> {
    return this.productsService.findAll(query);
  }

  @Post()
  @Roles(Role.ADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productsService.create(createProductDto);
  }
}
```

### Global Application Setup

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());

  await app.listen(3000);
}
```

## Migration Notes

### From Middleware to Interceptors

- Interceptors provide better integration with NestJS DI system
- Use interceptors for response transformation
- Middleware is still preferred for raw request processing

### Breaking Changes

- Guard interface changes between major versions
- Interceptor signature updates
- Exception filter context changes

## Troubleshooting

### Common Issues

1. **Guard Not Executing**: Check guard registration and order
2. **Interceptor Memory Leaks**: Ensure proper error handling in RxJS chains
3. **Pipe Validation Failures**: Verify DTO classes and validation decorators
4. **Filter Not Catching Exceptions**: Check exception type and filter registration

### Debug Techniques

- Use logging in each pipeline component
- Test components in isolation
- Check execution order with multiple components
- Use NestJS built-in profiling tools