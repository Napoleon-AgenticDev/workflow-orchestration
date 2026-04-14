---
meta:
  id: cross-cutting-concerns
  title: Cross Cutting Concerns
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: 2026-02-23T00:00:00.000Z
title: Cross-Cutting Concerns Guidelines
applies_to: null
priority: medium
category: cross-cutting
---

# Cross-Cutting Concerns Guidelines

## When to Use This Guidance

Apply when:
- Implementing logging throughout the application
- Managing application configuration
- Handling errors consistently
- Displaying user notifications
- Working with feature flags

## What Are Cross-Cutting Concerns?

Cross-cutting concerns are aspects of an application that affect multiple layers and components:
- **Logging** - Application monitoring and debugging
- **Configuration** - Application settings management
- **Error Handling** - Consistent error management
- **Notifications** - User feedback
- **Feature Flags** - Feature toggles

These libraries can be used by any layer without violating Clean Architecture principles.

---

## 1. Logging

📖 **[Logging Specification](../../.spec-motion/logging.specification.md)**

### When to Use
- Log application events and operations
- Track errors and exceptions
- Monitor performance
- Debug issues in production
- Send telemetry to DataDog

### Basic Usage

```typescript
import { inject } from '@angular/core';
import { LoggingService } from '@buildmotion/logging';

export class UserService {
  private logger = inject(LoggingService);
  
  createUser(user: User): Observable<User> {
    this.logger.log('Creating user', { username: user.username });
    
    return this.api.createUser(user).pipe(
      tap(created => this.logger.log('User created', { id: created.id })),
      catchError(err => {
        this.logger.error('User creation failed', err);
        throw err;
      })
    );
  }
}
```

### Log Levels

```typescript
// Debug - development/troubleshooting info
this.logger.debug('Processing data', { recordCount: 100 });

// Info - general informational messages
this.logger.log('User logged in', { userId: user.id });

// Warning - potential issues
this.logger.warn('API response slow', { duration: 5000 });

// Error - errors and exceptions
this.logger.error('Database connection failed', error);
```

### Best Practices
- ✅ Log important business operations
- ✅ Include context data with logs
- ✅ Log errors with full details
- ✅ Use appropriate log levels
- ❌ Don't log sensitive data (passwords, tokens)
- ❌ Don't log excessively in loops
- ❌ Don't use console.log (use logger)

---

## 2. Configuration

📖 **[Configuration Specification](../../.spec-motion/configuration.specification.md)**

### When to Use
- Access application settings
- Get environment-specific values
- Configure external services
- Manage feature settings

### Basic Usage

```typescript
import { inject } from '@angular/core';
import { ConfigurationService } from '@buildmotion/configuration';

export class ApiService {
  private config = inject(ConfigurationService);
  
  private get apiUrl(): string {
    return this.config.settings.apiBaseUrl;
  }
  
  private get timeout(): number {
    return this.config.settings.httpTimeout || 30000;
  }
}
```

### Application Initialization

```typescript
import { APP_INITIALIZER } from '@angular/core';
import { ConfigurationService } from '@buildmotion/configuration';

export function initializeApp(config: ConfigurationService) {
  return () => config.loadConfiguration();
}

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [ConfigurationService],
      multi: true
    }
  ]
};
```

### Best Practices
- ✅ Load configuration at app startup
- ✅ Use typed configuration objects
- ✅ Provide defaults for optional settings
- ✅ Validate configuration on load
- ❌ Don't hard-code environment values
- ❌ Don't expose secrets in configuration
- ❌ Don't modify configuration at runtime

---

## 3. Error Handling

📖 **[Error Handling Specification](../../.spec-motion/error-handling.specification.md)**

### When to Use
- Handle exceptions consistently
- Transform errors for UI display
- Log errors with context
- Recover from errors gracefully

### Basic Usage

```typescript
import { inject } from '@angular/core';
import { ErrorHandler } from '@buildmotion/error-handling';
import { LoggingService } from '@buildmotion/logging';

export class DataService {
  private errorHandler = inject(ErrorHandler);
  private logger = inject(LoggingService);
  
  loadData(): Observable<Data> {
    return this.api.getData().pipe(
      catchError(err => {
        this.logger.error('Data load failed', err);
        this.errorHandler.handleError(err);
        return of(null);
      })
    );
  }
}
```

### Global Error Handler

```typescript
import { ErrorHandler, Injectable } from '@angular/core';
import { LoggingService } from '@buildmotion/logging';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private logger = inject(LoggingService);
  
  handleError(error: Error): void {
    this.logger.error('Unhandled error', error);
    // Additional error handling logic
  }
}

// In app config
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
};
```

### Best Practices
- ✅ Catch and handle all errors
- ✅ Log errors with full context
- ✅ Provide user-friendly error messages
- ✅ Implement retry logic where appropriate
- ❌ Don't swallow errors silently
- ❌ Don't expose technical details to users
- ❌ Don't ignore error handling in production

---

## 4. Notifications

📖 **[Notifications Specification](../../.spec-motion/notifications.specification.md)**

### When to Use
- Display success messages to users
- Show error notifications
- Alert users of important events
- Provide feedback on operations

### Basic Usage

```typescript
import { inject } from '@angular/core';
import { NotificationService } from '@buildmotion/notifications';

export class UserComponent {
  private notifications = inject(NotificationService);
  
  saveUser(user: User): void {
    this.userService.save(user).subscribe({
      next: () => {
        this.notifications.success('User saved successfully');
      },
      error: (err) => {
        this.notifications.error('Failed to save user');
      }
    });
  }
  
  deleteUser(id: string): void {
    this.notifications.warning('This action cannot be undone');
    
    this.userService.delete(id).subscribe({
      next: () => this.notifications.info('User deleted'),
      error: () => this.notifications.error('Delete failed')
    });
  }
}
```

### Notification Types

```typescript
// Success - operation completed successfully
this.notifications.success('Changes saved');

// Error - operation failed
this.notifications.error('Operation failed');

// Warning - caution required
this.notifications.warning('This will delete all data');

// Info - general information
this.notifications.info('New version available');
```

### Best Practices
- ✅ Show notifications for user actions
- ✅ Use appropriate notification types
- ✅ Keep messages concise and clear
- ✅ Auto-dismiss notifications when appropriate
- ❌ Don't overuse notifications
- ❌ Don't show technical error details
- ❌ Don't block UI with notifications

---

## 5. Feature Flags

📖 **[Feature Flag Specification](../../.spec-motion/feature-flag.specification.md)**

### When to Use
- Toggle features on/off
- A/B testing
- Gradual feature rollout
- Environment-specific features
- Beta feature management

### Basic Usage

```typescript
import { inject } from '@angular/core';
import { FeatureFlagService } from '@buildmotion/feature-flag';

export class DashboardComponent {
  private featureFlags = inject(FeatureFlagService);
  
  // Check if feature is enabled
  showNewDashboard = this.featureFlags.isEnabled('new-dashboard');
  showBetaFeatures = this.featureFlags.isEnabled('beta-features');
  
  ngOnInit() {
    if (this.featureFlags.isEnabled('analytics')) {
      this.loadAnalytics();
    }
  }
}
```

### Template Usage

```html
<div *ngIf="showNewDashboard">
  <new-dashboard></new-dashboard>
</div>

<div *ngIf="!showNewDashboard">
  <legacy-dashboard></legacy-dashboard>
</div>
```

### Best Practices
- ✅ Use feature flags for new features
- ✅ Remove flags after feature is stable
- ✅ Document flag purpose and lifetime
- ✅ Test both enabled and disabled states
- ❌ Don't accumulate unused flags
- ❌ Don't use flags for configuration
- ❌ Don't nest too many flags (complexity)

---

## Integration Example

Combining multiple cross-cutting concerns:

```typescript
import { inject } from '@angular/core';
import { LoggingService } from '@buildmotion/logging';
import { ConfigurationService } from '@buildmotion/configuration';
import { NotificationService } from '@buildmotion/notifications';
import { FeatureFlagService } from '@buildmotion/feature-flag';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private logger = inject(LoggingService);
  private config = inject(ConfigurationService);
  private notifications = inject(NotificationService);
  private featureFlags = inject(FeatureFlagService);
  
  processOrder(order: Order): Observable<Order> {
    // Log the operation
    this.logger.log('Processing order', { orderId: order.id });
    
    // Check feature flag
    const useNewProcessor = this.featureFlags.isEnabled('new-order-processor');
    
    const process$ = useNewProcessor
      ? this.newProcessor.process(order)
      : this.legacyProcessor.process(order);
    
    return process$.pipe(
      tap(result => {
        this.logger.log('Order processed', { orderId: result.id });
        this.notifications.success('Order processed successfully');
      }),
      catchError(err => {
        this.logger.error('Order processing failed', err);
        this.notifications.error('Failed to process order');
        throw err;
      })
    );
  }
}
```

## Common Patterns

### Service Initialization Pattern

```typescript
export class MyService {
  private logger = inject(LoggingService);
  private config = inject(ConfigurationService);
  
  constructor() {
    this.logger.log('Service initialized', {
      config: this.config.settings.serviceName
    });
  }
}
```

### Operation Logging Pattern

```typescript
performOperation(data: Data): Observable<Result> {
  const startTime = Date.now();
  this.logger.log('Operation started', { type: data.type });
  
  return this.process(data).pipe(
    tap(result => {
      const duration = Date.now() - startTime;
      this.logger.log('Operation completed', { duration, success: true });
    }),
    catchError(err => {
      this.logger.error('Operation failed', err);
      throw err;
    })
  );
}
```

### User Feedback Pattern

```typescript
saveData(data: Data): void {
  this.api.save(data).subscribe({
    next: () => {
      this.logger.log('Data saved', { id: data.id });
      this.notifications.success('Saved successfully');
    },
    error: (err) => {
      this.logger.error('Save failed', err);
      this.notifications.error('Failed to save');
    }
  });
}
```
