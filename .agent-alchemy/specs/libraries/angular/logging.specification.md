---
meta:
  id: logging-specification
  title: Logging Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
title: Logging Specification
category: Libraries
feature: Logging
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: '1.0'
aiContext: true
applyTo: []
keywords: []
topics: []
useCases: []
---

# Logging Library Specification

**Library Name:** `@buildmotion/logging`  
**Version:** 18.0.0  
**Author:** Matt Vaughn / Agent Alchemy  
**Category:** Cross-Cutting Concern  
**Architecture Layer:** Infrastructure

---

## 🎯 Purpose

The **Logging** library provides a comprehensive logging infrastructure with DataDog integration for Angular applications. It enables structured logging, error tracking, and application monitoring with support for multiple log levels and environments.

---

## 📋 Responsibilities

### Primary Responsibilities

1. **Structured Logging**
   - Provide standardized logging interface
   - Support multiple log levels (debug, info, warn, error)
   - Enable contextual logging with metadata

2. **DataDog Integration**
   - Integrate with DataDog Browser Logs
   - Integrate with DataDog Real User Monitoring (RUM)
   - Send logs to DataDog for centralized monitoring

3. **Error Tracking**
   - Capture and log application errors
   - Track error context and stack traces
   - Support error severity levels

### What This Library Does

- ✅ Provides structured logging API
- ✅ Integrates with DataDog monitoring
- ✅ Supports multiple log levels
- ✅ Enables error tracking and reporting
- ✅ Provides contextual logging
- ✅ Supports environment-specific configuration

### What This Library Does NOT Do

- ❌ Handle application errors (use `@buildmotion/error-handling`)
- ❌ Manage configuration (use `@buildmotion/configuration`)
- ❌ Store logs locally
- ❌ Provide log analysis or visualization

---

## 🏗️ Architecture & Design

### Clean Architecture Position

```
┌─────────────────────────────────────────┐
│  Cross-Cutting Concerns ← LOGGING HERE  │  ← Used by all layers
├─────────────────────────────────────────┤
│            Presentation Layer           │
├─────────────────────────────────────────┤
│         Infrastructure Layer            │
├─────────────────────────────────────────┤
│     Core (Entities & Use Cases)         │
└─────────────────────────────────────────┘
```

### Key Components

1. **LoggingService**
   - Main logging service
   - Provides logging methods (log, debug, info, warn, error)
   - Manages DataDog integration

2. **Log Levels**
   - DEBUG: Detailed diagnostic information
   - INFO: General informational messages
   - WARN: Warning messages for potential issues
   - ERROR: Error messages for failures

---

## 🔌 Dependencies

### Internal Dependencies

- `@buildmotion/configuration` - For logging configuration (optional)

### External Dependencies

- `@angular/core` - Angular core functionality
- `@datadog/browser-logs` - DataDog logging SDK
- `@datadog/browser-rum` - DataDog Real User Monitoring
- `guid-typescript` - GUID generation for log correlation
- `tslib` - TypeScript runtime library

### Peer Dependencies

- `@angular/common` ~17.0.0 || <18.0.0
- `@angular/core` ~17.0.0 || <=18.0.0
- `guid-typescript` ~1.0.9

---

## 📦 Public API

### Core Exports

```typescript
// Logging Service
export class LoggingService {
  log(message: string, context?: any): void;
  debug(message: string, context?: any): void;
  info(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  error(message: string, error?: Error, context?: any): void;
}

// Log Levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}
```

### Usage Example

```typescript
import { LoggingService } from '@buildmotion/logging';

@Component({...})
export class UserComponent {
  private logger = inject(LoggingService);

  ngOnInit() {
    this.logger.info('UserComponent initialized');
  }

  loadUserData(userId: string) {
    this.logger.debug('Loading user data', { userId });
    
    this.userService.getUser(userId).subscribe({
      next: (user) => {
        this.logger.info('User data loaded successfully', { userId, user });
      },
      error: (error) => {
        this.logger.error('Failed to load user data', error, { userId });
      }
    });
  }

  processPayment(payment: Payment) {
    this.logger.warn('Processing payment', { 
      paymentId: payment.id, 
      amount: payment.amount 
    });
    
    try {
      const result = this.paymentService.process(payment);
      this.logger.info('Payment processed', { result });
    } catch (error) {
      this.logger.error('Payment processing failed', error, { payment });
    }
  }
}
```

---

## 🎨 Design Patterns

### Singleton Pattern

- LoggingService provided in root
- Single instance across application
- Centralized logging configuration

### Facade Pattern

- Simple interface over complex DataDog SDK
- Abstracts DataDog implementation details
- Provides consistent logging API

---

## 🔄 Integration with Clean Architecture

### Cross-Layer Logging

```typescript
// Core Layer (Use Case)
export class CreateOrderUseCase {
  constructor(private logger: LoggingService) {}
  
  execute(orderData: OrderData): ActionResult<Order> {
    this.logger.info('Executing CreateOrderUseCase', { orderData });
    
    try {
      // Business logic
      this.logger.debug('Order validation passed');
      const order = this.createOrder(orderData);
      this.logger.info('Order created successfully', { orderId: order.id });
      return ActionResult.success(order);
    } catch (error) {
      this.logger.error('Failed to create order', error, { orderData });
      return ActionResult.failure(error.message);
    }
  }
}

// Infrastructure Layer (Repository)
export class OrderRepository {
  constructor(
    private http: HttpClient,
    private logger: LoggingService
  ) {}
  
  save(order: Order): Observable<Order> {
    this.logger.debug('Saving order to API', { orderId: order.id });
    
    return this.http.post<Order>('/api/orders', order).pipe(
      tap(savedOrder => {
        this.logger.info('Order saved successfully', { orderId: savedOrder.id });
      }),
      catchError(error => {
        this.logger.error('Failed to save order', error, { order });
        throw error;
      })
    );
  }
}

// Presentation Layer (Component)
export class CheckoutComponent {
  private logger = inject(LoggingService);
  
  onCheckout() {
    this.logger.debug('User initiated checkout');
    // Component logic
  }
}
```

---

## 🔧 DataDog Configuration

### Initialization

```typescript
// app.config.ts
import { datadogLogs } from '@datadog/browser-logs';
import { datadogRum } from '@datadog/browser-rum';

export function initializeDataDog(config: ConfigurationService<AppConfig>) {
  return () => {
    const datadogConfig = config.config.datadog;
    
    // Initialize DataDog Logs
    datadogLogs.init({
      clientToken: datadogConfig.clientToken,
      site: datadogConfig.site,
      forwardErrorsToLogs: true,
      sessionSampleRate: 100,
      env: config.config.environment,
      version: config.config.version
    });
    
    // Initialize DataDog RUM
    datadogRum.init({
      applicationId: datadogConfig.applicationId,
      clientToken: datadogConfig.clientToken,
      site: datadogConfig.site,
      service: config.config.appName,
      env: config.config.environment,
      version: config.config.version,
      sessionSampleRate: 100,
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      defaultPrivacyLevel: 'mask-user-input'
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeDataDog,
      deps: [ConfigurationService],
      multi: true
    }
  ]
};
```

---

## 🧪 Testing Guidelines

### Unit Testing with Logging

```typescript
describe('UserService', () => {
  let service: UserService;
  let mockLogger: jasmine.SpyObj<LoggingService>;

  beforeEach(() => {
    mockLogger = jasmine.createSpyObj('LoggingService', [
      'log', 'debug', 'info', 'warn', 'error'
    ]);
    
    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: LoggingService, useValue: mockLogger }
      ]
    });
    
    service = TestBed.inject(UserService);
  });

  it('should log user creation', () => {
    service.createUser({ name: 'John' });
    
    expect(mockLogger.info).toHaveBeenCalledWith(
      'User created successfully',
      jasmine.objectContaining({ name: 'John' })
    );
  });

  it('should log errors', () => {
    const error = new Error('Creation failed');
    mockLogger.error.and.stub();
    
    // Trigger error condition
    service.createUser(null);
    
    expect(mockLogger.error).toHaveBeenCalledWith(
      jasmine.any(String),
      error,
      jasmine.any(Object)
    );
  });
});
```

---

## 📊 Best Practices

### Do's ✅

- Use appropriate log levels for different scenarios
- Include relevant context with log messages
- Log important business operations
- Log errors with full error objects
- Use structured logging with context objects
- Configure DataDog for production environments
- Set appropriate log sampling rates
- Mask sensitive data in logs

### Don'ts ❌

- Don't log sensitive user data (passwords, tokens, PII)
- Don't log in tight loops (performance impact)
- Don't use logging as a debugging replacement
- Don't ignore log level configuration
- Don't log full request/response bodies without sanitization
- Don't log in production without rate limiting
- Don't expose internal system details in logs

---

## 🔐 Security Considerations

### Sensitive Data Masking

```typescript
export class SecureLoggingService extends LoggingService {
  private sensitiveFields = ['password', 'ssn', 'creditCard', 'token'];

  log(message: string, context?: any): void {
    const sanitizedContext = this.maskSensitiveData(context);
    super.log(message, sanitizedContext);
  }

  private maskSensitiveData(obj: any): any {
    if (!obj) return obj;
    
    const masked = { ...obj };
    this.sensitiveFields.forEach(field => {
      if (masked[field]) {
        masked[field] = '***REDACTED***';
      }
    });
    
    return masked;
  }
}
```

---

## 📈 Log Level Guidelines

### DEBUG

Use for detailed diagnostic information:
- Variable values during execution
- Method entry/exit points
- Detailed flow information
- Only in development environments

### INFO

Use for general informational messages:
- Successful operations
- Business process milestones
- Configuration loading
- Application lifecycle events

### WARN

Use for potentially harmful situations:
- Deprecated API usage
- Configuration issues (non-critical)
- Performance warnings
- Recoverable errors

### ERROR

Use for error events:
- Exceptions and errors
- Failed operations
- Data integrity issues
- System failures

---

## 🚀 Performance Considerations

### Log Sampling

```typescript
export class LoggingService {
  private sampleRate = 0.1; // 10% sampling in production

  log(message: string, context?: any): void {
    if (this.shouldLog()) {
      this.sendLog(message, context);
    }
  }

  private shouldLog(): boolean {
    return Math.random() < this.sampleRate;
  }
}
```

### Async Logging

```typescript
export class AsyncLoggingService {
  private logQueue: LogEntry[] = [];
  private flushInterval = 5000; // 5 seconds

  constructor() {
    this.startLogFlusher();
  }

  log(message: string, context?: any): void {
    this.logQueue.push({ message, context, timestamp: Date.now() });
  }

  private startLogFlusher(): void {
    setInterval(() => this.flushLogs(), this.flushInterval);
  }

  private flushLogs(): void {
    if (this.logQueue.length === 0) return;
    
    const batch = this.logQueue.splice(0);
    this.sendBatchToDataDog(batch);
  }
}
```

---

## 📚 Related Libraries

- **@buildmotion/error-handling** - Error handling with logging integration
- **@buildmotion/configuration** - Configuration for logging settings
- **@buildmotion/http-service** - HTTP request/response logging
- **@buildmotion/actions** - Action execution logging

---

## 🔍 See Also

- [Clean Architecture Specification](./angular-clean-architecture.specification.md)
- [Configuration Specification](./configuration.specification.md)
- [Error Handling Specification](./error-handling.specification.md)
- [DataDog Documentation](https://docs.datadoghq.com/)
