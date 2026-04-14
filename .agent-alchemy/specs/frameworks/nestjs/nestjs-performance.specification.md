---
meta:
  id: nestjs-performance-specification
  title: NestJS Performance & Optimization Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags:
    - performance
    - caching
    - redis
    - compression
    - monitoring
    - optimization
    - profiling
    - performance optimization
    - caching strategies
    - database optimization
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
title: NestJS Performance & Optimization Specification
category: Performance
feature: Caching, Compression, Monitoring
lastUpdated: 2024-09-24T00:00:00.000Z
source: NestJS Official Documentation
version: NestJS 10+
aiContext: true
applyTo:
  - '**/*.service.ts'
  - '**/*.controller.ts'
  - '**/performance/**/*'
keywords:
  - performance
  - caching
  - redis
  - compression
  - monitoring
  - optimization
  - profiling
topics:
  - performance optimization
  - caching strategies
  - compression
  - monitoring
  - database optimization
useCases: []
---

# NestJS Performance & Optimization Specification

## Overview

Performance optimization is crucial for building scalable NestJS applications that can handle high traffic and provide excellent user experiences. This specification covers caching strategies, compression techniques, database optimization, monitoring, and various performance optimization patterns specific to NestJS applications.

The framework provides excellent integration with performance tools and patterns including Redis caching, compression middleware, query optimization, and comprehensive monitoring solutions.

## Core Concepts

### Caching Strategies

NestJS provides built-in caching capabilities with support for various cache stores:

**Key Features:**

- Multiple cache store support (memory, Redis, Memcached)
- Cache interceptors for automatic caching
- TTL (Time To Live) configuration
- Cache key management
- Cache invalidation strategies

**Implementation Patterns:**

```typescript
// Cache module configuration
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
        ttl: configService.get('CACHE_TTL', 300), // 5 minutes default
        max: configService.get('CACHE_MAX_ITEMS', 100),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class CacheConfigModule {}

// Cache interceptor implementation
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = this.generateCacheKey(request);

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

  private generateCacheKey(request: any): string {
    const { method, url, query } = request;
    return `${method}:${url}:${JSON.stringify(query)}`;
  }
}

// Service-level caching
@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async findAll(filters: ProductFilters): Promise<Product[]> {
    const cacheKey = `products:${JSON.stringify(filters)}`;

    const cachedProducts = await this.cacheManager.get<Product[]>(cacheKey);

    if (cachedProducts) {
      return cachedProducts;
    }

    const products = await this.productRepository.find({
      where: this.buildWhereClause(filters),
      relations: ['category', 'reviews'],
      order: { createdAt: 'DESC' },
    });

    await this.cacheManager.set(cacheKey, products, 600); // 10 minutes

    return products;
  }

  async update(id: number, updateData: UpdateProductDto): Promise<Product> {
    const product = await this.productRepository.save({
      id,
      ...updateData,
    });

    // Invalidate related cache entries
    await this.invalidateProductCaches(id);

    return product;
  }

  private async invalidateProductCaches(productId: number): Promise<void> {
    const keys = await this.cacheManager.store.keys(`products:*`);

    for (const key of keys) {
      await this.cacheManager.del(key);
    }

    await this.cacheManager.del(`product:${productId}`);
  }
}
```

### Database Optimization

Optimizing database queries and connections for better performance:

```typescript
// Database connection pooling
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),

        // Connection pooling configuration
        extra: {
          max: configService.get('DB_POOL_MAX', 20),
          min: configService.get('DB_POOL_MIN', 5),
          acquire: configService.get('DB_POOL_ACQUIRE', 30000),
          idle: configService.get('DB_POOL_IDLE', 10000),
        },

        // Query optimization
        cache: {
          duration: 30000, // 30 seconds
        },

        // Logging for performance monitoring
        logging: process.env.NODE_ENV === 'development' ? 'all' : ['error'],
        maxQueryExecutionTime: 1000, // Log slow queries > 1 second

        entities: ['dist/**/*.entity.js'],
        migrations: ['dist/migrations/*.js'],
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}

// Query optimization service
@Injectable()
export class OptimizedUserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  // Using query builder for complex queries
  async findUsersWithStats(filters: UserFilters): Promise<UserWithStats[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoin('user.orders', 'orders')
      .addSelect('COUNT(orders.id)', 'orderCount')
      .addSelect('COALESCE(SUM(orders.total), 0)', 'totalSpent')
      .where('user.isActive = :isActive', { isActive: true })
      .andWhere(filters.country ? 'profile.country = :country' : '1=1', {
        country: filters.country,
      })
      .groupBy('user.id')
      .addGroupBy('profile.id')
      .orderBy('totalSpent', 'DESC')
      .limit(filters.limit || 50)
      .getRawAndEntities();
  }

  // Pagination with cursor-based approach for better performance
  async findUsersWithCursorPagination(cursor?: string, limit: number = 20): Promise<{ users: User[]; nextCursor: string | null }> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .orderBy('user.id', 'ASC')
      .limit(limit + 1); // Fetch one extra to determine if there's a next page

    if (cursor) {
      queryBuilder.where('user.id > :cursor', { cursor });
    }

    const users = await queryBuilder.getMany();

    const hasNextPage = users.length > limit;
    const resultUsers = hasNextPage ? users.slice(0, -1) : users;
    const nextCursor = hasNextPage ? resultUsers[resultUsers.length - 1].id.toString() : null;

    return {
      users: resultUsers,
      nextCursor,
    };
  }

  // Batch operations for better performance
  async updateMultipleUsers(updates: Array<{ id: number; data: Partial<User> }>): Promise<void> {
    const queries = updates.map(({ id, data }) => this.userRepository.createQueryBuilder().update(User).set(data).where('id = :id', { id }).execute());

    await Promise.all(queries);
  }
}
```

### Compression and Response Optimization

Implementing compression and response optimization:

```typescript
// Compression configuration
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable compression
  app.use(
    compression({
      filter: (req, res) => {
        // Don't compress responses with this request header
        if (req.headers['x-no-compression']) {
          return false;
        }

        // Fallback to standard filter function
        return compression.filter(req, res);
      },
      level: 6, // Compression level (1-9)
      threshold: 1024, // Only compress responses larger than 1KB
    })
  );

  // Enable CORS with optimization
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
    optionsSuccessStatus: 200,
  });

  // Response headers optimization
  app.use((req, res, next) => {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Performance headers
    res.setHeader('Cache-Control', 'no-cache');

    next();
  });

  await app.listen(3000);
}

// Response serialization interceptor
@Injectable()
export class SerializationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // Remove sensitive fields
        if (data && typeof data === 'object') {
          return this.sanitizeResponse(data);
        }
        return data;
      })
    );
  }

  private sanitizeResponse(data: any): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeResponse(item));
    }

    if (data && typeof data === 'object') {
      const sanitized = { ...data };

      // Remove sensitive fields
      delete sanitized.password;
      delete sanitized.resetToken;
      delete sanitized.refreshToken;

      // Recursively sanitize nested objects
      Object.keys(sanitized).forEach((key) => {
        if (sanitized[key] && typeof sanitized[key] === 'object') {
          sanitized[key] = this.sanitizeResponse(sanitized[key]);
        }
      });

      return sanitized;
    }

    return data;
  }
}
```

### Monitoring and Profiling

Implementing comprehensive monitoring and profiling:

```typescript
// Performance monitoring service
@Injectable()
export class MonitoringService {
  private readonly prometheus = require('prom-client');
  private readonly httpRequestDuration: any;
  private readonly httpRequestTotal: any;
  private readonly activeConnections: any;

  constructor() {
    // Initialize Prometheus metrics
    this.httpRequestDuration = new this.prometheus.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5],
    });

    this.httpRequestTotal = new this.prometheus.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    this.activeConnections = new this.prometheus.Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
    });

    // Collect default metrics
    this.prometheus.collectDefaultMetrics({
      timeout: 10000,
    });
  }

  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestDuration.labels(method, route, statusCode.toString()).observe(duration);

    this.httpRequestTotal.labels(method, route, statusCode.toString()).inc();
  }

  getMetrics(): string {
    return this.prometheus.register.metrics();
  }
}

// Monitoring interceptor
@Injectable()
export class MonitoringInterceptor implements NestInterceptor {
  constructor(private monitoringService: MonitoringService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = (Date.now() - startTime) / 1000;
        this.monitoringService.recordHttpRequest(request.method, request.route?.path || request.url, response.statusCode, duration);
      }),
      catchError((error) => {
        const duration = (Date.now() - startTime) / 1000;
        this.monitoringService.recordHttpRequest(request.method, request.route?.path || request.url, error.status || 500, duration);
        throw error;
      })
    );
  }
}

// Health check implementation
@Controller('health')
export class HealthController {
  constructor(
    private readonly monitoringService: MonitoringService,
    @InjectConnection() private connection: Connection,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  @Get()
  async checkHealth() {
    const checks = await Promise.allSettled([this.checkDatabase(), this.checkCache(), this.checkMemory()]);

    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: this.getCheckResult(checks[0]),
        cache: this.getCheckResult(checks[1]),
        memory: this.getCheckResult(checks[2]),
      },
    };

    const hasFailures = Object.values(health.checks).some((check) => check.status === 'fail');

    if (hasFailures) {
      health.status = 'fail';
    }

    return health;
  }

  @Get('metrics')
  getMetrics() {
    return this.monitoringService.getMetrics();
  }

  private async checkDatabase(): Promise<{ status: string; responseTime: number }> {
    const startTime = Date.now();

    try {
      await this.connection.query('SELECT 1');
      return {
        status: 'pass',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'fail',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  private async checkCache(): Promise<{ status: string; responseTime: number }> {
    const startTime = Date.now();

    try {
      await this.cacheManager.set('health-check', 'ok', 10);
      await this.cacheManager.get('health-check');
      await this.cacheManager.del('health-check');

      return {
        status: 'pass',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'fail',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  private checkMemory(): { status: string; usage: any } {
    const usage = process.memoryUsage();
    const status = usage.heapUsed / usage.heapTotal < 0.9 ? 'pass' : 'warn';

    return {
      status,
      usage: {
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
        external: Math.round(usage.external / 1024 / 1024),
        rss: Math.round(usage.rss / 1024 / 1024),
      },
    };
  }

  private getCheckResult(result: PromiseSettledResult<any>) {
    return result.status === 'fulfilled' ? result.value : { status: 'fail', error: result.reason };
  }
}
```

## Angular Patterns and Best Practices

### Recommended Implementation

**Caching Strategies:**

- Use appropriate cache TTL based on data freshness requirements
- Implement cache invalidation strategies
- Use Redis for distributed caching in production
- Cache at multiple levels (application, database, CDN)

**Database Optimization:**

- Use connection pooling for better resource utilization
- Implement query optimization and indexing
- Use cursor-based pagination for large datasets
- Batch operations when possible

**Monitoring Best Practices:**

- Implement comprehensive health checks
- Monitor key performance indicators (KPIs)
- Set up alerting for critical issues
- Use structured logging for better observability

### Common Use Cases

1. **API Response Caching**: Caching frequently requested API responses
2. **Database Query Optimization**: Optimizing complex database queries
3. **Real-time Monitoring**: Monitoring application performance in real-time
4. **Load Testing**: Testing application performance under load
5. **Memory Management**: Optimizing memory usage and preventing leaks

### Anti-Patterns to Avoid

- **Over-caching**: Caching data that changes frequently
- **No Cache Invalidation**: Not implementing proper cache invalidation
- **Ignoring Database Indexes**: Not optimizing database queries
- **No Monitoring**: Not implementing proper monitoring and alerting
- **Memory Leaks**: Not properly cleaning up resources

## API Reference

### Caching Decorators

#### @CacheKey(key: string)

**Purpose**: Sets a custom cache key for method-level caching
**Usage**: Method-level decorator
**Parameters**: Cache key string

#### @CacheTTL(ttl: number)

**Purpose**: Sets custom TTL for method-level caching
**Usage**: Method-level decorator
**Parameters**: TTL in seconds

### Monitoring Interfaces

#### HealthIndicator

**Purpose**: Interface for implementing health check indicators
**Usage**: Implement for custom health checks
**Methods**: `isHealthy(): Promise<HealthIndicatorResult>`

## Testing Strategies

### Performance Testing

```typescript
describe('ProductService Performance', () => {
  let service: ProductService;
  let cacheManager: Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  it('should serve cached responses faster', async () => {
    const filters = { category: 'electronics' };

    // First call - database query
    const start1 = Date.now();
    await service.findAll(filters);
    const duration1 = Date.now() - start1;

    // Second call - should be cached
    const start2 = Date.now();
    await service.findAll(filters);
    const duration2 = Date.now() - start2;

    expect(duration2).toBeLessThan(duration1);
    expect(cacheManager.get).toHaveBeenCalledWith(`products:${JSON.stringify(filters)}`);
  });

  it('should handle concurrent requests efficiently', async () => {
    const filters = { category: 'electronics' };
    const concurrentRequests = 10;

    const promises = Array(concurrentRequests)
      .fill(null)
      .map(() => service.findAll(filters));

    const start = Date.now();
    const results = await Promise.all(promises);
    const duration = Date.now() - start;

    expect(results).toHaveLength(concurrentRequests);
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
  });
});
```

### Load Testing

```typescript
// load-test.spec.ts
import * as autocannon from 'autocannon';

describe('Load Testing', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(3001);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should handle high load on products endpoint', async () => {
    const result = await autocannon({
      url: 'http://localhost:3001/products',
      connections: 100,
      duration: 10, // 10 seconds
      pipelining: 1,
    });

    expect(result.errors).toBe(0);
    expect(result.timeouts).toBe(0);
    expect(result['2xx']).toBeGreaterThan(0);
    expect(result.latency.average).toBeLessThan(1000); // < 1 second average
  });
});
```

## Performance Considerations

### Optimization Techniques

- Implement Redis clustering for high availability
- Use CDN for static assets and API responses
- Implement database read replicas for read-heavy workloads
- Use async processing for heavy operations
- Implement rate limiting to prevent abuse

### Common Performance Pitfalls

- Not implementing proper caching strategies
- Ignoring database query optimization
- Not monitoring application performance
- Creating memory leaks with event listeners
- Synchronous operations blocking the event loop

## Related Specifications

- [NestJS Fundamentals](./nestjs-fundamentals.specification.md)
- [NestJS Advanced Concepts](./nestjs-advanced-concepts.specification.md)
- [NestJS Database Integration](./nestjs-database-integration.specification.md)
- [NestJS Testing](./nestjs-testing.specification.md)

## References

- [NestJS Caching Documentation](https://docs.nestjs.com/techniques/caching)
- [NestJS Performance Documentation](https://docs.nestjs.com/recipes/performance)
- [Redis Caching Guide](https://docs.nestjs.com/recipes/redis)
- [Monitoring and Logging](https://docs.nestjs.com/recipes/logging)

## Code Examples

### Complete Performance Configuration

```typescript
// performance.module.ts
@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: () => ({
        store: redisStore,
        host: 'localhost',
        port: 6379,
        ttl: 300,
      }),
    }),
    TerminusModule,
  ],
  providers: [
    MonitoringService,
    {
      provide: APP_INTERCEPTOR,
      useClass: MonitoringInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpCacheInterceptor,
    },
  ],
  controllers: [HealthController],
})
export class PerformanceModule {}
```

## Migration Notes

### From Memory to Redis Cache

- Update cache configuration to use Redis store
- Consider cache key naming strategies
- Implement proper connection handling
- Update testing to mock Redis operations

### Breaking Changes

- Cache interface changes between versions
- Monitoring tool integration updates
- Performance metric collection changes

## Troubleshooting

### Common Issues

1. **Cache Miss Issues**: Check cache key generation and TTL settings
2. **Memory Leaks**: Monitor memory usage and clean up resources
3. **Slow Database Queries**: Use query profiling and optimization
4. **High Response Times**: Check for bottlenecks in the request pipeline

### Debug Techniques

- Use APM tools for performance monitoring
- Implement detailed logging for performance metrics
- Use profiling tools to identify bottlenecks
- Monitor resource usage continuously