---
meta:
  id: testing
  title: Testing
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: 2026-02-23T00:00:00.000Z
title: Testing Guidelines
applies_to: null
priority: high
category: testing
---

# Testing Guidelines

## When to Use This Guidance

Apply when:

- Writing unit tests for services, components, or libraries
- Creating integration tests
- Testing business logic and validation
- Mocking dependencies

## Testing Framework

This repository uses **Jest** for testing.

### Running Tests

```bash
# Run all tests
yarn test

# Run tests with coverage
yarn test:coverage

# Run tests for specific library
nx test <library-name>

# Run tests in watch mode
nx test <library-name> --watch
```

---

## 1. Service Testing

### Testing HTTP Services

```typescript
import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { UserApiService } from './user-api.service';

describe('UserApiService', () => {
  let service: UserApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserApiService],
    });

    service = TestBed.inject(UserApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verify no outstanding requests
  });

  it('should fetch users', () => {
    const mockUsers = [
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' },
    ];

    service.getUsers().subscribe((users) => {
      expect(users).toEqual(mockUsers);
      expect(users.length).toBe(2);
    });

    const req = httpMock.expectOne('https://api.example.com/users');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  it('should handle errors', () => {
    service.getUsers().subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(500);
      },
    });

    const req = httpMock.expectOne('https://api.example.com/users');
    req.flush('Server error', { status: 500, statusText: 'Server Error' });
  });
});
```

**Reference**:

- [http-service.specification.md](../../.spec-motion/http-service.specification.md)
- [http-service-signals.specification.md](../../.spec-motion/http-service-signals.specification.md)

### Testing Business Logic Services

```typescript
import { TestBed } from '@angular/core/testing';
import { CreateUserAction } from './create-user.action';
import { UserApiService } from './user-api.service';
import { of, throwError } from 'rxjs';

describe('CreateUserAction', () => {
  let action: CreateUserAction;
  let mockApiService: jest.Mocked<UserApiService>;

  beforeEach(() => {
    mockApiService = {
      createUser: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      providers: [{ provide: UserApiService, useValue: mockApiService }],
    });
  });

  it('should create user successfully', (done) => {
    const userData = { username: 'john_doe', email: 'john@example.com' };
    const mockResult = { id: '1', ...userData };

    mockApiService.createUser.mockReturnValue(of(mockResult));

    action = new CreateUserAction(userData);
    action.execute().subscribe((result) => {
      expect(result.isSuccess).toBe(true);
      expect(mockApiService.createUser).toHaveBeenCalledWith(userData);
      done();
    });
  });

  it('should fail validation for invalid data', (done) => {
    const invalidData = { username: 'ab', email: 'invalid' }; // too short

    action = new CreateUserAction(invalidData);
    action.execute().subscribe((result) => {
      expect(result.isSuccess).toBe(false);
      expect(result.validationContext.isValid).toBe(false);
      done();
    });
  });
});
```

**Reference**: [actions.specification.md](../../.spec-motion/actions.specification.md)

---

## 2. Component Testing

### Testing Components with Services

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserListComponent } from './user-list.component';
import { UserService } from './user.service';
import { of } from 'rxjs';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(async () => {
    mockUserService = {
      getUsers: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [UserListComponent], // Standalone component
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
  });

  it('should load users on init', () => {
    const mockUsers = [{ id: '1', name: 'John' }];
    mockUserService.getUsers.mockReturnValue(of(mockUsers));

    fixture.detectChanges(); // Triggers ngOnInit

    expect(component.users()).toEqual(mockUsers);
    expect(mockUserService.getUsers).toHaveBeenCalled();
  });

  it('should display users in template', () => {
    const mockUsers = [{ id: '1', name: 'John' }];
    mockUserService.getUsers.mockReturnValue(of(mockUsers));

    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.user-name').textContent).toContain('John');
  });
});
```

**Reference**: Clean Architecture - Presentation Layer

---

## 3. Testing Validation and Rules

### Testing Rules Engine

```typescript
import { UserValidationRules } from './user-validation.rules';

describe('UserValidationRules', () => {
  it('should validate valid user data', () => {
    const validUser = {
      username: 'john_doe',
      email: 'john@example.com',
      age: 25,
    };

    const rules = new UserValidationRules(validUser);
    rules.execute();

    expect(rules.isValid).toBe(true);
    expect(rules.results.every((r) => r.isValid)).toBe(true);
  });

  it('should fail for invalid username length', () => {
    const invalidUser = {
      username: 'ab', // too short (min 3)
      email: 'john@example.com',
      age: 25,
    };

    const rules = new UserValidationRules(invalidUser);
    rules.execute();

    expect(rules.isValid).toBe(false);
    expect(rules.results.some((r) => !r.isValid)).toBe(true);
  });

  it('should fail for invalid age', () => {
    const invalidUser = {
      username: 'john_doe',
      email: 'john@example.com',
      age: 16, // under 18
    };

    const rules = new UserValidationRules(invalidUser);
    rules.execute();

    expect(rules.isValid).toBe(false);
    const ageRule = rules.results.find((r) => r.rulePolicy.name === 'Age');
    expect(ageRule?.isValid).toBe(false);
  });
});
```

**Reference**:

- [rules-engine.specification.md](../../.spec-motion/rules-engine.specification.md)
- [zod-rules-engine.specification.md](../../.spec-motion/zod-rules-engine.specification.md)
- [validation.specification.md](../../.spec-motion/validation.specification.md)

---

## 4. Testing with Cross-Cutting Concerns

### Mocking Logging Service

```typescript
import { LoggingService } from '@buildmotion/logging';

describe('MyService', () => {
  let service: MyService;
  let mockLogger: jest.Mocked<LoggingService>;

  beforeEach(() => {
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      providers: [MyService, { provide: LoggingService, useValue: mockLogger }],
    });

    service = TestBed.inject(MyService);
  });

  it('should log operation', () => {
    service.performOperation();

    expect(mockLogger.log).toHaveBeenCalledWith(
      'Operation started',
      expect.any(Object)
    );
  });
});
```

### Mocking Configuration Service

```typescript
import { ConfigurationService } from '@buildmotion/configuration';

describe('ApiService', () => {
  let mockConfig: jest.Mocked<ConfigurationService>;

  beforeEach(() => {
    mockConfig = {
      settings: {
        apiBaseUrl: 'https://test-api.example.com',
        httpTimeout: 5000,
      },
    } as any;

    TestBed.configureTestingModule({
      providers: [{ provide: ConfigurationService, useValue: mockConfig }],
    });
  });

  it('should use configured API URL', () => {
    const service = TestBed.inject(ApiService);
    expect(service['apiUrl']).toBe('https://test-api.example.com');
  });
});
```

**Reference**:

- [logging.specification.md](../../.spec-motion/logging.specification.md)
- [configuration.specification.md](../../.spec-motion/configuration.specification.md)

---

## 5. Testing Signals

### Testing Signal-Based Components

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { UserSignalComponent } from './user-signal.component';

describe('UserSignalComponent', () => {
  let component: UserSignalComponent;
  let fixture: ComponentFixture<UserSignalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserSignalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserSignalComponent);
    component = fixture.componentInstance;
  });

  it('should update signal value', () => {
    expect(component.count()).toBe(0);

    component.increment();

    expect(component.count()).toBe(1);
  });

  it('should trigger computed signal', () => {
    component.users.set([{ id: '1', name: 'John' }]);

    expect(component.userCount()).toBe(1);
  });
});
```

---

## Best Practices

### ✅ DO

- Write tests for all public APIs
- Test both success and failure cases
- Test edge cases and boundaries
- Use descriptive test names
- Mock external dependencies
- Verify no outstanding HTTP requests
- Test validation rules thoroughly
- Keep tests focused and isolated
- Use `beforeEach` for setup
- Clean up after tests

### ❌ DON'T

- Test implementation details
- Write tests that depend on other tests
- Skip error case testing
- Leave HTTP requests unmocked
- Test private methods directly
- Use real external services in tests
- Write flaky tests
- Ignore test failures

## Test Coverage Goals

Aim for:

- **>80% overall coverage**
- **100% coverage for business logic**
- **100% coverage for validation rules**
- **High coverage for services**
- **Good coverage for components**

Check coverage:

```bash
yarn test:coverage
```

## Common Test Patterns

### AAA Pattern (Arrange, Act, Assert)

```typescript
it('should create user', () => {
  // Arrange
  const userData = { username: 'john', email: 'john@example.com' };
  mockService.createUser.mockReturnValue(of(userData));

  // Act
  service.createUser(userData).subscribe();

  // Assert
  expect(mockService.createUser).toHaveBeenCalledWith(userData);
});
```

### Testing Observables

```typescript
it('should emit values', (done) => {
  service.getData().subscribe((data) => {
    expect(data).toBeDefined();
    done();
  });
});
```

### Testing with fakeAsync

```typescript
import { fakeAsync, tick } from '@angular/core/testing';

it('should debounce input', fakeAsync(() => {
  component.searchInput.setValue('test');
  tick(300); // Simulate debounce time

  expect(component.searchResults().length).toBeGreaterThan(0);
}));
```
