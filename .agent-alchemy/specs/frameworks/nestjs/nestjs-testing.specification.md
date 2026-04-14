---
meta:
  id: nestjs-testing-specification
  title: NestJS Testing Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags:
    - testing
    - jest
    - unit-tests
    - integration-tests
    - e2e-tests
    - mocking
    - test-modules
    - unit testing
    - integration testing
    - e2e testing
    - test modules
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
title: NestJS Testing Specification
category: Quality Assurance
feature: Unit, Integration, E2E Testing
lastUpdated: 2024-09-24T00:00:00.000Z
source: NestJS Official Documentation
version: NestJS 10+
aiContext: true
applyTo:
  - '**/*.spec.ts'
  - '**/*.e2e-spec.ts'
  - '**/test/**/*'
keywords:
  - testing
  - jest
  - unit-tests
  - integration-tests
  - e2e-tests
  - mocking
  - test-modules
topics:
  - unit testing
  - integration testing
  - e2e testing
  - mocking
  - test modules
  - jest
useCases: []
---

# NestJS Testing Specification

## Overview

NestJS provides comprehensive testing capabilities built on Jest, supporting unit tests, integration tests, and end-to-end testing. The framework's dependency injection system and modular architecture make it highly testable, with excellent support for mocking, test modules, and isolated testing environments.

This specification covers testing strategies, patterns, and best practices for building reliable, maintainable test suites that provide confidence in code quality and functionality.

## Core Concepts

### Unit Testing

Unit tests focus on testing individual components in isolation with all dependencies mocked:

**Key Features:**

- Fast execution
- Isolated component testing
- Comprehensive mocking
- High code coverage
- Easy debugging

**Implementation Patterns:**

```typescript
// service.spec.ts
describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      // Arrange
      const expectedUsers = [
        { id: 1, email: 'user1@example.com', firstName: 'John', lastName: 'Doe' },
        { id: 2, email: 'user2@example.com', firstName: 'Jane', lastName: 'Smith' },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(expectedUsers as User[]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(expectedUsers);
      expect(repository.find).toHaveBeenCalledWith({
        relations: ['profile', 'roles'],
      });
    });

    it('should return empty array when no users exist', async () => {
      // Arrange
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([]);
      expect(repository.find).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      jest.spyOn(repository, 'find').mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.findAll()).rejects.toThrow('Failed to fetch users');
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
      };

      const expectedUser = {
        id: 1,
        ...createUserDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(repository, 'create').mockReturnValue(expectedUser as User);
      jest.spyOn(repository, 'save').mockResolvedValue(expectedUser as User);
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      // Act
      const result = await service.create(createUserDto);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(repository.create).toHaveBeenCalledWith(createUserDto);
      expect(repository.save).toHaveBeenCalledWith(expectedUser);
      expect(eventEmitter.emit).toHaveBeenCalledWith('user.created', {
        userId: expectedUser.id,
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
      };

      const existingUser = { id: 1, email: 'existing@example.com' };
      jest.spyOn(repository, 'findOne').mockResolvedValue(existingUser as User);

      // Act & Assert
      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });
  });
});
```

### Integration Testing

Integration tests verify the interaction between multiple components:

```typescript
// integration test
describe('UserController (Integration)', () => {
  let app: INestApplication;
  let userService: UserService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User, UserProfile, Role],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([User, UserProfile, Role]),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [UserController],
      providers: [UserService, AuthService],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply global pipes, filters, guards
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();

    userService = moduleFixture.get<UserService>(UserService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/users (POST)', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        email: 'integration@test.com',
        firstName: 'Integration',
        lastName: 'Test',
        password: 'Password123!',
      };

      const response = await request(app.getHttpServer()).post('/users').send(createUserDto).expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
      });

      expect(response.body).not.toHaveProperty('password');

      // Verify user was saved to database
      const savedUser = await userService.findByEmail(createUserDto.email);
      expect(savedUser).toBeDefined();
      expect(savedUser.email).toBe(createUserDto.email);
    });

    it('should return 400 for invalid data', async () => {
      const invalidUserDto = {
        email: 'invalid-email',
        firstName: '',
        lastName: 'Test',
        password: '123', // too short
      };

      const response = await request(app.getHttpServer()).post('/users').send(invalidUserDto).expect(400);

      expect(response.body.message).toContain('Validation failed');
    });

    it('should return 409 for duplicate email', async () => {
      const userDto = {
        email: 'duplicate@test.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'Password123!',
      };

      // Create first user
      await request(app.getHttpServer()).post('/users').send(userDto).expect(201);

      // Try to create duplicate
      const response = await request(app.getHttpServer()).post('/users').send(userDto).expect(409);

      expect(response.body.message).toContain('already exists');
    });
  });

  describe('/users (GET)', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/users').expect(401);
    });

    it('should return users for authenticated request', async () => {
      // Create test user
      const user = await userService.create({
        email: 'auth@test.com',
        firstName: 'Auth',
        lastName: 'Test',
        password: 'Password123!',
      });

      // Generate JWT token
      const token = jwtService.sign({ sub: user.id, email: user.email });

      const response = await request(app.getHttpServer()).get('/users').set('Authorization', `Bearer ${token}`).expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });
});
```

### End-to-End Testing

E2E tests verify complete user workflows:

```typescript
// e2e/auth.e2e-spec.ts
describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let userService: UserService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DatabaseService)
      .useClass(TestDatabaseService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userService = moduleFixture.get<UserService>(UserService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await userService.deleteAll();
  });

  describe('User Registration Flow', () => {
    it('should complete full registration workflow', async () => {
      const userData = {
        email: 'e2e@test.com',
        firstName: 'E2E',
        lastName: 'Test',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };

      // Step 1: Register user
      const registerResponse = await request(app.getHttpServer()).post('/auth/register').send(userData).expect(201);

      expect(registerResponse.body).toMatchObject({
        access_token: expect.any(String),
        refresh_token: expect.any(String),
        user: {
          id: expect.any(Number),
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
        },
      });

      const { access_token, user } = registerResponse.body;

      // Step 2: Access protected resource
      const profileResponse = await request(app.getHttpServer()).get('/auth/profile').set('Authorization', `Bearer ${access_token}`).expect(200);

      expect(profileResponse.body.email).toBe(userData.email);

      // Step 3: Update profile
      const updateData = { firstName: 'Updated' };

      const updateResponse = await request(app.getHttpServer())
        .put('/auth/profile')
        .set('Authorization', `Bearer ${access_token}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.firstName).toBe('Updated');

      // Step 4: Logout
      await request(app.getHttpServer()).post('/auth/logout').set('Authorization', `Bearer ${access_token}`).expect(204);

      // Step 5: Verify token is invalidated
      await request(app.getHttpServer()).get('/auth/profile').set('Authorization', `Bearer ${access_token}`).expect(401);
    });
  });

  describe('Password Reset Flow', () => {
    it('should complete password reset workflow', async () => {
      // Setup: Create user
      const userData = {
        email: 'reset@test.com',
        firstName: 'Reset',
        lastName: 'Test',
        password: 'OldPassword123!',
      };

      await userService.create(userData);

      // Step 1: Request password reset
      await request(app.getHttpServer()).post('/auth/forgot-password').send({ email: userData.email }).expect(204);

      // Step 2: Get reset token from database (in real scenario, from email)
      const user = await userService.findByEmail(userData.email);
      const resetToken = user.resetToken; // This would come from email in real scenario

      // Step 3: Reset password
      const newPassword = 'NewPassword123!';

      await request(app.getHttpServer()).post('/auth/reset-password').send({ token: resetToken, password: newPassword }).expect(204);

      // Step 4: Login with new password
      const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({ email: userData.email, password: newPassword }).expect(200);

      expect(loginResponse.body.access_token).toBeDefined();

      // Step 5: Verify old password doesn't work
      await request(app.getHttpServer()).post('/auth/login').send({ email: userData.email, password: userData.password }).expect(401);
    });
  });
});
```

### Testing Utilities and Helpers

Creating reusable testing utilities:

```typescript
// test/utils/test-helpers.ts
export class TestHelpers {
  static createMockRepository<T = any>(): Partial<Repository<T>> {
    return {
      find: jest.fn(),
      findOne: jest.fn(),
      findBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
        getOne: jest.fn(),
        getCount: jest.fn(),
      }),
    };
  }

  static createMockUser(overrides: Partial<User> = {}): User {
    return {
      id: 1,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'hashedPassword',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      roles: [],
      profile: null,
      orders: [],
      ...overrides,
    };
  }

  static async createTestModule(providers: Provider[] = [], imports: any[] = []): Promise<TestingModule> {
    return Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          autoLoadEntities: true,
          synchronize: true,
          logging: false,
        }),
        ...imports,
      ],
      providers: [
        ...providers,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              const config = {
                JWT_SECRET: 'test-secret',
                JWT_EXPIRES_IN: '1h',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();
  }

  static generateJwtToken(payload: any, secret = 'test-secret'): string {
    return jwt.sign(payload, secret, { expiresIn: '1h' });
  }

  static async seedDatabase(app: INestApplication): Promise<void> {
    const userService = app.get<UserService>(UserService);

    await userService.create({
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      password: 'AdminPassword123!',
    });

    await userService.create({
      email: 'user@test.com',
      firstName: 'Regular',
      lastName: 'User',
      password: 'UserPassword123!',
    });
  }

  static async cleanDatabase(app: INestApplication): Promise<void> {
    const connection = app.get(DataSource);
    const entities = connection.entityMetadatas;

    for (const entity of entities) {
      const repository = connection.getRepository(entity.name);
      await repository.clear();
    }
  }
}

// test/factories/user.factory.ts
export class UserFactory {
  private data: Partial<User> = {};

  static create(): UserFactory {
    return new UserFactory();
  }

  withEmail(email: string): UserFactory {
    this.data.email = email;
    return this;
  }

  withName(firstName: string, lastName: string): UserFactory {
    this.data.firstName = firstName;
    this.data.lastName = lastName;
    return this;
  }

  withRole(role: string): UserFactory {
    this.data.roles = [{ name: role } as Role];
    return this;
  }

  build(): User {
    return {
      id: Math.floor(Math.random() * 1000),
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'hashedPassword',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      roles: [],
      profile: null,
      orders: [],
      ...this.data,
    } as User;
  }

  async save(repository: Repository<User>): Promise<User> {
    const user = this.build();
    return repository.save(user);
  }
}
```

## Angular Patterns and Best Practices

### Recommended Implementation

**Test Organization:**

- Organize tests alongside source files
- Use descriptive test names that explain the scenario
- Group related tests with describe blocks
- Keep tests focused and isolated

**Mocking Strategy:**

- Mock external dependencies at module boundaries
- Use factories for creating test data
- Mock at the right level (unit vs integration)
- Keep mocks simple and focused

**Test Data Management:**

- Use factories for consistent test data creation
- Clean up test data between tests
- Use in-memory databases for integration tests
- Seed databases with realistic test data

### Common Use Cases

1. **Service Testing**: Unit testing business logic in services
2. **Controller Testing**: Testing HTTP endpoints and request handling
3. **Guard Testing**: Verifying authentication and authorization logic
4. **Database Testing**: Testing repository patterns and database operations
5. **Error Handling**: Testing exception scenarios and error responses

### Anti-Patterns to Avoid

- **Testing Implementation Details**: Focus on behavior, not implementation
- **Shared Test State**: Each test should be independent
- **Overly Complex Mocks**: Keep mocks simple and focused
- **Not Testing Error Cases**: Always test error scenarios
- **Slow Tests**: Keep unit tests fast with proper mocking

## API Reference

### Testing Decorators

#### Test.createTestingModule(metadata: TestingModuleMetadata)

**Purpose**: Creates a testing module for isolated testing
**Usage**: Unit and integration test setup
**Parameters**: Module metadata with providers, imports, controllers

#### @Mock()

**Purpose**: Creates mock implementations
**Usage**: Property decorator for dependency mocking

### Jest Utilities

#### beforeEach/afterEach

**Purpose**: Setup and cleanup for each test
**Usage**: Test lifecycle management

#### describe/it

**Purpose**: Test organization and execution
**Usage**: Grouping and defining test cases

## Testing Strategies

### Test Pyramid Implementation

```typescript
// Unit Tests (Fast, Many)
describe('AuthService Unit Tests', () => {
  // Test individual methods with mocked dependencies
});

// Integration Tests (Medium speed, Fewer)
describe('Auth Module Integration Tests', () => {
  // Test module interactions with real dependencies
});

// E2E Tests (Slow, Few)
describe('Authentication Flow E2E Tests', () => {
  // Test complete user workflows
});
```

### Continuous Integration

```typescript
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s', '!**/*.spec.ts', '!**/*.e2e-spec.ts', '!**/node_modules/**'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

## Performance Considerations

### Optimization Techniques

- Use in-memory databases for integration tests
- Mock external services to avoid network calls
- Parallelize test execution when possible
- Use test-specific configurations
- Clean up resources properly after tests

### Common Performance Pitfalls

- Using real databases for unit tests
- Not cleaning up test data between tests
- Creating too many test modules
- Not mocking expensive operations
- Running E2E tests for every code change

## Related Specifications

- [NestJS Fundamentals](./nestjs-fundamentals.specification.md)
- [NestJS Advanced Concepts](./nestjs-advanced-concepts.specification.md)
- [NestJS Database Integration](./nestjs-database-integration.specification.md)
- [NestJS Authentication](./nestjs-authentication.specification.md)

## References

- [NestJS Testing Documentation](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://docs.nestjs.com/recipes/testing)

## Code Examples

### Complete Test Suite Example

```typescript
// Complete test suite for a service
describe('OrderService', () => {
  let service: OrderService;
  let userService: UserService;
  let productService: ProductService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const module = await TestHelpers.createTestModule([
      OrderService,
      {
        provide: UserService,
        useValue: { findById: jest.fn() },
      },
      {
        provide: ProductService,
        useValue: { findById: jest.fn(), decreaseStock: jest.fn() },
      },
      {
        provide: EventEmitter2,
        useValue: { emit: jest.fn() },
      },
    ]);

    service = module.get<OrderService>(OrderService);
    userService = module.get<UserService>(UserService);
    productService = module.get<ProductService>(ProductService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      // Comprehensive test implementation
    });

    it('should handle insufficient stock', async () => {
      // Error scenario testing
    });

    it('should emit order created event', async () => {
      // Event testing
    });
  });
});
```

## Migration Notes

### From Mocha to Jest

- Update test syntax and assertions
- Replace Mocha hooks with Jest equivalents
- Update mocking syntax to Jest mocks
- Configure Jest for TypeScript

### Breaking Changes

- Test module API changes between versions
- Mock function signatures updates
- Configuration file format changes

## Troubleshooting

### Common Issues

1. **Test Isolation Problems**: Tests affecting each other
2. **Mock Configuration Issues**: Mocks not working correctly
3. **Database Connection Problems**: Test database setup issues
4. **Performance Issues**: Slow test execution

### Debug Techniques

- Use Jest debugging tools
- Add logging to understand test execution
- Run tests in isolation to identify issues
- Use coverage reports to identify untested code