---
meta:
  id: foundation-specification
  title: Foundation Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
title: Foundation Specification
category: Libraries
feature: Foundation
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: '1.0'
aiContext: true
applyTo: []
keywords: []
topics: []
useCases: []
---

# Foundation Library Specification

**Library Name:** `@buildmotion/foundation`  
**Version:** 18.0.0  
**Author:** Matt Vaughn / Agent Alchemy  
**Category:** Core Layer  
**Architecture Layer:** Foundation / Infrastructure

---

## 🎯 Purpose

The **Foundation** library provides essential base classes, utilities, and patterns that serve as the foundation for all other libraries in the Buildmotion framework. It establishes common behaviors for services, components, and business logic components with built-in logging, error handling, and lifecycle management.

---

## 📋 Responsibilities

### Primary Responsibilities

1. **Base Class Abstractions**
   - Provide ServiceBase for Angular services
   - Provide ComponentBase for Angular components
   - Provide ActionBase for business actions
   - Provide BusinessProviderBase for business logic providers

2. **Common Models and Types**
   - Service response models (ServiceResponse, ErrorResponse)
   - Service messaging (ServiceMessage, ServiceContext)
   - Alert notifications
   - Message types and constants

3. **Cross-Cutting Infrastructure**
   - Subscription management
   - Logging integration
   - Error handling patterns
   - Service context management

### What This Library Does

- ✅ Provides base classes with common functionality
- ✅ Manages subscriptions and lifecycle
- ✅ Integrates logging across services and components
- ✅ Handles errors consistently
- ✅ Provides service context for message aggregation
- ✅ Defines common models and interfaces

### What This Library Does NOT Do

- ❌ Provide specific business logic
- ❌ Handle HTTP communications directly
- ❌ Implement validation rules
- ❌ Manage application state

---

## 🏗️ Architecture & Design

### Clean Architecture Position

```
┌─────────────────────────────────────────┐
│         Cross-Cutting Concerns          │
├─────────────────────────────────────────┤
│            Presentation Layer           │
├─────────────────────────────────────────┤
│         Infrastructure Layer            │
├─────────────────────────────────────────┤
│  Core/Foundation ← FOUNDATION HERE      │  ← Used by all layers
└─────────────────────────────────────────┘
```

### Key Components

1. **ServiceBase**
   - Base class for all Angular services
   - Built-in logging integration
   - Error handling support
   - Service context management
   - Subscription tracking

2. **ComponentBase**
   - Base class for Angular components
   - Navigation tracking
   - Alert notification support
   - Subscription management
   - Logging integration

3. **ActionBase**
   - Base class for business actions
   - Action lifecycle management
   - Result handling

4. **BusinessProviderBase**
   - Base class for business logic providers
   - Service orchestration
   - Common business patterns

5. **Models**
   - ServiceMessage: Message container
   - ServiceContext: Message aggregation
   - ErrorResponse: Error response model
   - AlertNotification: UI alert model

---

## 🔌 Dependencies

### Internal Dependencies

- `@buildmotion/core` - Core interfaces (ApiResponse)
- `@buildmotion/logging` - Logging infrastructure

### External Dependencies

- `@angular/core` - Angular core functionality
- `@angular/forms` - Form controls for ComponentBase
- `@angular/router` - Router for ComponentBase
- `guid-typescript` - GUID generation
- `rxjs` - Reactive programming

### Peer Dependencies

- `@angular/common` ~17.0.0 || <18.0.0
- `@angular/core` ~17.0.0 || <=18.0.0

---

## 📦 Public API

### Base Classes

```typescript
// Service Base Class
export class ServiceBase implements OnDestroy {
  serviceName: string;
  id: string;
  accessToken: string;
  loggingService: ILoggingService;
  serviceContext: ServiceContext;
  
  constructor(serviceName: string, loggingService: ILoggingService, serviceContext: ServiceContext);
  
  handleUnexpectedError(error: Error): void;
  handleError(error: { name: string; message: string }): void;
  createErrorResponse<T>(message: string): ErrorResponse<T>;
  ngOnDestroy(): void;
}

// Component Base Class
export class ComponentBase implements OnDestroy {
  componentName: string;
  id: Guid;
  loggingService: LoggingService;
  router: Router;
  alertNotification: AlertNotification;
  currentUrl: string;
  previousUrl: string;
  subscriptions: Subscription[];
  
  constructor(componentName: string, loggingService: LoggingService, router: Router);
  
  subscribe(subscription: Subscription): void;
  showAlertMessage(message: string, title?: string, type?: string): void;
  ngOnDestroy(): void;
}

// Action Base Class
export abstract class ActionBase {
  // Action lifecycle and execution
}

// Business Provider Base
export abstract class BusinessProviderBase extends ServiceBase {
  // Business logic orchestration
}
```

### Models

```typescript
// Service Message
export class ServiceMessage {
  Name: string;
  Message: string | undefined;
  MessageType: MessageType;
  Source: string;
  DisplayToUser: boolean;
  
  constructor(name: string, message?: string);
  WithDisplayToUser(display: boolean): this;
  WithMessageType(messageType: MessageType): this;
  WithSource(source: string): this;
}

// Service Context
export class ServiceContext {
  Messages: ServiceMessage[];
  
  addMessage(message: ServiceMessage): void;
  hasErrors(): boolean;
  hasMessages(): boolean;
}

// Error Response
export class ErrorResponse<T> {
  IsSuccess: boolean;
  Message: string;
  Timestamp: Date;
  Data?: T;
  
  constructor(message: string);
}

// Alert Notification
export class AlertNotification {
  header: string;
  title: string;
  messages: string[];
  type: string;
  
  constructor(header: string, title: string);
}

// Message Type Enum
export enum MessageType {
  Information = 1,
  Warning = 2,
  Error = 3
}
```

---

## 🎨 Design Patterns

### Template Method Pattern

Base classes define the template for common operations while allowing subclasses to implement specific behaviors.

### Dependency Injection

All base classes require dependencies to be injected, promoting loose coupling and testability.

### Observer Pattern

Subscription management in base classes follows the observer pattern for reactive programming.

---

## 🔄 Integration with Clean Architecture

### Service Layer Integration

```typescript
import { Injectable } from '@angular/core';
import { ServiceBase, ServiceContext } from '@buildmotion/foundation';
import { LoggingService } from '@buildmotion/logging';

@Injectable({ providedIn: 'root' })
export class UserService extends ServiceBase {
  constructor(
    loggingService: LoggingService,
    serviceContext: ServiceContext
  ) {
    super('UserService', loggingService, serviceContext);
  }

  getUser(id: string): Observable<User> {
    try {
      this.loggingService.log(this.serviceName, Severity.Information, 
        `Getting user: ${id}`);
      
      // Service implementation
    } catch (error) {
      this.handleUnexpectedError(error);
      return of(this.createErrorResponse('Failed to get user'));
    }
  }
}
```

### Component Layer Integration

```typescript
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ComponentBase } from '@buildmotion/foundation';
import { LoggingService } from '@buildmotion/logging';

@Component({
  selector: 'app-user-profile',
  template: `...`
})
export class UserProfileComponent extends ComponentBase implements OnInit {
  constructor(
    loggingService: LoggingService,
    router: Router,
    private userService: UserService
  ) {
    super('UserProfileComponent', loggingService, router);
  }

  ngOnInit() {
    const subscription = this.userService.getUser(this.userId)
      .subscribe({
        next: (user) => this.handleSuccess(user),
        error: (error) => this.showAlertMessage(error.message, 'Error', 'danger')
      });
    
    this.subscribe(subscription); // Automatic cleanup on destroy
  }
}
```

---

## 🧪 Testing Guidelines

### Testing Services with ServiceBase

```typescript
describe('UserService', () => {
  let service: UserService;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;
  let serviceContext: ServiceContext;

  beforeEach(() => {
    mockLoggingService = jasmine.createSpyObj('LoggingService', ['log']);
    serviceContext = new ServiceContext();
    
    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: LoggingService, useValue: mockLoggingService },
        { provide: ServiceContext, useValue: serviceContext }
      ]
    });
    
    service = TestBed.inject(UserService);
  });

  it('should handle errors and add to service context', () => {
    const error = new Error('Test error');
    service.handleUnexpectedError(error);
    
    expect(serviceContext.hasErrors()).toBe(true);
    expect(mockLoggingService.log).toHaveBeenCalled();
  });
});
```

### Testing Components with ComponentBase

```typescript
describe('UserProfileComponent', () => {
  let component: UserProfileComponent;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockLoggingService = jasmine.createSpyObj('LoggingService', ['log']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    
    component = new UserProfileComponent(mockLoggingService, mockRouter);
  });

  it('should clean up subscriptions on destroy', () => {
    const subscription = new Subscription();
    spyOn(subscription, 'unsubscribe');
    
    component.subscribe(subscription);
    component.ngOnDestroy();
    
    expect(subscription.unsubscribe).toHaveBeenCalled();
  });
});
```

---

## 📊 Best Practices

### Do's ✅

- Extend from ServiceBase for all Angular services
- Extend from ComponentBase for components with common needs
- Use handleUnexpectedError for exception handling
- Add subscriptions via subscribe() method for automatic cleanup
- Use ServiceContext to aggregate messages
- Log important lifecycle events
- Inject dependencies properly

### Don'ts ❌

- Don't manually manage subscriptions when using base classes
- Don't bypass error handling methods
- Don't ignore ServiceContext messages
- Don't create base classes without clear purpose
- Don't mix business logic in base classes
- Don't forget to call super() in constructors

---

## 🚀 Usage Examples

### Creating a Service with ServiceBase

```typescript
@Injectable({ providedIn: 'root' })
export class OrderService extends ServiceBase {
  constructor(
    private http: HttpClient,
    loggingService: LoggingService,
    serviceContext: ServiceContext
  ) {
    super('OrderService', loggingService, serviceContext);
  }

  createOrder(order: Order): Observable<ApiResponse<Order>> {
    this.loggingService.log(this.serviceName, Severity.Information,
      'Creating new order');
    
    return this.http.post<ApiResponse<Order>>('/api/orders', order)
      .pipe(
        catchError(error => {
          this.handleUnexpectedError(error);
          return of(this.createErrorResponse('Order creation failed'));
        })
      );
  }
}
```

### Using ServiceContext for Message Aggregation

```typescript
export class CheckoutComponent extends ComponentBase {
  checkout() {
    const serviceContext = new ServiceContext();
    
    // Multiple service calls
    this.orderService.serviceContext = serviceContext;
    this.paymentService.serviceContext = serviceContext;
    
    // Process checkout
    this.processCheckout();
    
    // Check for errors
    if (serviceContext.hasErrors()) {
      const errors = serviceContext.Messages
        .filter(m => m.MessageType === MessageType.Error)
        .map(m => m.Message)
        .join(', ');
      
      this.showAlertMessage(errors, 'Checkout Failed', 'danger');
    }
  }
}
```

---

## 📚 Related Libraries

- **@buildmotion/core** - Core domain models
- **@buildmotion/logging** - Logging infrastructure
- **@buildmotion/actions** - Action pattern implementation (uses ActionBase)
- **@buildmotion/http-service** - HTTP services (extends ServiceBase)
- **@buildmotion/rules-engine** - Business rules
- **@buildmotion/validation** - Validation patterns

---

## 🔍 See Also

- [Clean Architecture Specification](./angular-clean-architecture.specification.md)
- [Logging Specification](./logging.specification.md)
- [Actions Specification](./actions.specification.md)
- [Core Specification](./core.specification.md)
