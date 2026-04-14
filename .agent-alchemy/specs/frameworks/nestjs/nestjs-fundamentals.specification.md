---
meta:
  id: nestjs-fundamentals-specification
  title: NestJS Fundamentals Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags:
    - nestjs
    - controllers
    - services
    - modules
    - dependency-injection
    - decorators
    - providers
    - nestjs fundamentals
    - dependency injection
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
title: NestJS Fundamentals Specification
category: Core Framework
feature: Fundamentals
lastUpdated: 2024-09-24T00:00:00.000Z
source: NestJS Official Documentation
version: NestJS 10+
aiContext: true
applyTo:
  - '**/*.controller.ts'
  - '**/*.service.ts'
  - '**/*.module.ts'
  - '**/*.provider.ts'
keywords:
  - nestjs
  - controllers
  - services
  - modules
  - dependency-injection
  - decorators
  - providers
topics:
  - nestjs fundamentals
  - controllers
  - services
  - modules
  - dependency injection
  - decorators
useCases: []
---

# NestJS Fundamentals Specification

## Overview

NestJS is a progressive Node.js framework for building efficient, reliable, and scalable server-side applications. It uses modern JavaScript/TypeScript, combines elements of OOP, FP, and FRP, and is built on top of Express.js (by default) while providing compatibility with other libraries like Fastify.

NestJS leverages TypeScript's decorators and metadata to provide a powerful development experience with strong typing, dependency injection, and modular architecture patterns inspired by Angular.

## Core Concepts

### Controllers

Controllers handle incoming HTTP requests and return responses to the client. They use decorators to define routes and HTTP methods:

**Key Features:**

- Route handling with decorators
- Request/response object access
- Parameter binding
- Status code management
- Response serialization

**Implementation Patterns:**

```typescript
@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  @Get()
  @HttpCode(200)
  async findAll(@Query() query: FindAllCatsQuery): Promise<Cat[]> {
    return this.catsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Cat> {
    const cat = await this.catsService.findOne(id);
    if (!cat) {
      throw new NotFoundException(`Cat with ID ${id} not found`);
    }
    return cat;
  }

  @Post()
  @HttpCode(201)
  async create(@Body() createCatDto: CreateCatDto): Promise<Cat> {
    return this.catsService.create(createCatDto);
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateCatDto: UpdateCatDto): Promise<Cat> {
    return this.catsService.update(id, updateCatDto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.catsService.remove(id);
  }
}
```

### Providers (Services)

Providers are classes that can be injected as dependencies. Services encapsulate business logic and data access:

```typescript
@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

  findAll(query?: FindAllCatsQuery): Cat[] {
    let result = this.cats;

    if (query?.breed) {
      result = result.filter((cat) => cat.breed === query.breed);
    }

    if (query?.age) {
      result = result.filter((cat) => cat.age === query.age);
    }

    return result;
  }

  findOne(id: number): Cat | undefined {
    return this.cats.find((cat) => cat.id === id);
  }

  create(createCatDto: CreateCatDto): Cat {
    const cat: Cat = {
      id: Date.now(),
      ...createCatDto,
      createdAt: new Date(),
    };
    this.cats.push(cat);
    return cat;
  }

  update(id: number, updateCatDto: UpdateCatDto): Cat {
    const catIndex = this.cats.findIndex((cat) => cat.id === id);
    if (catIndex === -1) {
      throw new NotFoundException(`Cat with ID ${id} not found`);
    }

    this.cats[catIndex] = { ...this.cats[catIndex], ...updateCatDto };
    return this.cats[catIndex];
  }

  remove(id: number): void {
    const catIndex = this.cats.findIndex((cat) => cat.id === id);
    if (catIndex === -1) {
      throw new NotFoundException(`Cat with ID ${id} not found`);
    }
    this.cats.splice(catIndex, 1);
  }
}
```

### Modules

Modules organize the application structure and provide metadata about how NestJS should wire the application:

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Cat])],
  controllers: [CatsController],
  providers: [CatsService, CatsRepository],
  exports: [CatsService],
})
export class CatsModule {}

// Root application module
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'root',
      password: 'password',
      database: 'cats_db',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV === 'development',
    }),
    CatsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

## Angular Patterns and Best Practices

### Recommended Implementation

**Controller Best Practices:**

- Keep controllers thin and delegate business logic to services
- Use proper HTTP status codes and decorators
- Validate input data using DTOs and validation pipes
- Handle errors gracefully with exception filters

**Service Best Practices:**

- Use dependency injection for all dependencies
- Implement proper error handling and logging
- Keep services focused on single responsibilities
- Use interfaces for better testability

**Module Best Practices:**

- Organize modules by feature domains
- Use shared modules for common functionality
- Import only what's needed to avoid circular dependencies
- Export services that need to be used by other modules

### Common Use Cases

1. **REST API Development**: Building RESTful APIs with proper resource handling
2. **Database Integration**: Connecting to databases using TypeORM or Mongoose
3. **Authentication & Authorization**: Implementing JWT-based auth systems
4. **Real-time Communication**: WebSocket and Server-Sent Events implementation
5. **Microservices**: Building distributed systems with message patterns

### Anti-Patterns to Avoid

- **Fat Controllers**: Putting business logic directly in controllers
- **Circular Dependencies**: Modules importing each other circularly
- **No Error Handling**: Not implementing proper error handling and logging
- **Tight Coupling**: Not using dependency injection properly
- **Mixed Concerns**: Mixing HTTP logic with business logic

## API Reference

### Core Decorators

#### @Controller(prefix?: string)

**Purpose**: Declares a class as a controller and optionally sets a route prefix
**Usage**: Class-level decorator for HTTP controllers
**Parameters**: Optional string prefix for all routes in the controller

#### @Injectable()

**Purpose**: Marks a class as a provider that can be injected
**Usage**: Class-level decorator for services and other providers

#### @Module(metadata: ModuleMetadata)

**Purpose**: Defines a module with its metadata
**Usage**: Class-level decorator that organizes application structure
**Parameters**: Object containing imports, controllers, providers, and exports

### HTTP Method Decorators

#### @Get(path?: string)

**Purpose**: Maps GET requests to handler methods
**Usage**: Method-level decorator
**Parameters**: Optional path string

#### @Post(path?: string)

**Purpose**: Maps POST requests to handler methods
**Usage**: Method-level decorator
**Parameters**: Optional path string

## Testing Strategies

### Unit Testing

Testing individual components in isolation:

```typescript
describe('CatsService', () => {
  let service: CatsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CatsService],
    }).compile();

    service = module.get<CatsService>(CatsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a cat', () => {
    const createCatDto: CreateCatDto = {
      name: 'Test Cat',
      age: 3,
      breed: 'Persian',
    };

    const result = service.create(createCatDto);

    expect(result).toEqual(
      expect.objectContaining({
        name: 'Test Cat',
        age: 3,
        breed: 'Persian',
      })
    );
  });
});
```

### Integration Testing

Testing modules and their interactions:

```typescript
describe('CatsController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CatsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/cats (GET)', () => {
    return request(app.getHttpServer()).get('/cats').expect(200).expect([]);
  });
});
```

## Performance Considerations

### Optimization Techniques

- Use caching for frequently accessed data
- Implement database query optimization
- Use compression middleware
- Implement proper logging levels
- Use connection pooling for databases

### Common Performance Pitfalls

- Not using database indexes properly
- Synchronous operations blocking the event loop
- Memory leaks from not closing database connections
- Not implementing proper pagination for large datasets

## Related Specifications

- [NestJS Advanced Concepts](./nestjs-advanced-concepts.specification.md)
- [NestJS Database Integration](./nestjs-database-integration.specification.md)
- [NestJS Authentication](./nestjs-authentication.specification.md)
- [NestJS Testing](./nestjs-testing.specification.md)

## References

- [NestJS Official Documentation](https://docs.nestjs.com/)
- [NestJS First Steps](https://docs.nestjs.com/first-steps)
- [Controllers Guide](https://docs.nestjs.com/controllers)
- [Providers Guide](https://docs.nestjs.com/providers)
- [Modules Guide](https://docs.nestjs.com/modules)

## Code Examples

### Basic Application Structure

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');
  await app.listen(3000);
}
bootstrap();
```

### Advanced Configuration

```typescript
// app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

## Migration Notes

### From Express.js

- Convert Express middlewares to NestJS interceptors or middlewares
- Replace Express routes with NestJS controllers and decorators
- Use NestJS dependency injection instead of manual dependency management

### Breaking Changes

- NestJS 10 requires Node.js 18+
- Some decorators have changed between major versions
- TypeORM integration has been updated for better performance

## Troubleshooting

### Common Issues

1. **Circular Dependency Error**: Use forwardRef() to resolve circular dependencies
2. **Provider Not Found**: Ensure providers are registered in the correct module
3. **Route Not Found**: Check controller registration and route decorators
4. **Validation Errors**: Implement proper DTOs and validation pipes

### Debug Techniques

- Use NestJS built-in logger for debugging
- Enable detailed error messages in development
- Use debugging tools like nest-commander for CLI applications
- Implement custom exception filters for better error handling