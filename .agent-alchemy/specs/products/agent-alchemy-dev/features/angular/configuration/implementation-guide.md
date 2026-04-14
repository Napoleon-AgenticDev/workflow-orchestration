---

meta:
id: products-agent-alchemy-dev-features-angular-configuration-implementation-guide-md
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

# Configuration Management - Implementation Guide

**Document Type:** Implementation Guide  
**Audience:** Development Teams, Engineers  
**Version:** 1.0  
**Last Updated:** 2025-10-22

---

## 🎯 Overview

This guide provides step-by-step instructions for implementing a type-safe, reactive configuration service for Angular applications. By following this guide, you'll build a production-ready configuration management system that serves as the foundation for all cross-cutting concerns.

**Implementation Time:** 2-4 days  
**Skill Level:** Intermediate Angular/TypeScript

---

## 📋 Prerequisites

### Required Knowledge
- Angular fundamentals (services, DI, modules)
- TypeScript generics and interfaces
- RxJS basics (Observables, Subjects)
- Understanding of Clean Architecture principles

### Development Environment
- Angular 16+ installed
- TypeScript 5.0+ configured
- Node.js 18+ runtime
- IDE with TypeScript support (VS Code recommended)

### Project Setup
```bash
# Create new Angular application
ng new my-app --routing --style=scss

# Or integrate into existing application
cd my-app
```

---

## 🏗️ Step 1: Define Configuration Interfaces

### 1.1 Create Base Configuration Interface

Create `src/app/configuration/models/configuration.interface.ts`:

```typescript
/**
 * Base configuration interface for the application
 * Extend this interface for your specific needs
 */
export interface IConfiguration {
  environment: EnvironmentType;
  production: boolean;
  apiBaseUrl: string;
  applicationName: string;
  version: string;
}

/**
 * Supported environment types
 */
export type EnvironmentType = 
  | 'development' 
  | 'staging' 
  | 'production' 
  | 'test';

/**
 * Configuration for specific cross-cutting concerns
 * Each concern should define its own interface
 */
export interface IAppConfiguration extends IConfiguration {
  logging: ILoggingConfiguration;
  features: IFeatureConfiguration;
  http: IHttpConfiguration;
}

/**
 * Example: Logging configuration
 */
export interface ILoggingConfiguration {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Example: Feature flags configuration
 */
export interface IFeatureConfiguration {
  enableBetaFeatures: boolean;
  featureFlags: Record<string, boolean>;
}

/**
 * Example: HTTP configuration
 */
export interface IHttpConfiguration {
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}
```

**Key Design Points:**
- Use interfaces for type safety
- Make configuration properties readonly where appropriate
- Group related settings into sub-interfaces
- Use union types for enums (better than TypeScript enums)

---

## 🔧 Step 2: Implement Configuration Context

### 2.1 Create Configuration Context Class

Create `src/app/configuration/configuration-context.ts`:

```typescript
/**
 * Context that holds configuration data
 * Used as injection token value in Angular DI
 */
export class ConfigurationContext<T = unknown> {
  constructor(public readonly settings: T) {
    // Freeze settings to ensure immutability
    Object.freeze(settings);
  }
}
```

**Design Notes:**
- Simple data holder with no behavior
- Generic type allows any configuration shape
- Immutable to prevent accidental mutations
- Used with Angular's DI system

---

## ⚙️ Step 3: Implement Configuration Service

### 3.1 Create Service Interface

Create `src/app/configuration/i-configuration.service.ts`:

```typescript
import { Observable } from 'rxjs';

/**
 * Interface for configuration service
 * Allows for multiple implementations and easy testing
 */
export interface IConfigurationService<T> {
  /**
   * Observable stream of configuration changes
   */
  readonly settings$: Observable<T>;

  /**
   * Current configuration (synchronous access)
   */
  config: T;

  /**
   * Get specific property with type safety
   */
  getProperty<K extends keyof T>(key: K): T[K];

  /**
   * Check if configuration is loaded
   */
  isLoaded(): boolean;
}
```

### 3.2 Implement Configuration Service

Create `src/app/configuration/configuration.service.ts`:

```typescript
import { Injectable, Optional } from '@angular/core';
import { ReplaySubject, Observable } from 'rxjs';
import { IConfigurationService } from './i-configuration.service';
import { ConfigurationContext } from './configuration-context';

/**
 * Generic configuration service providing type-safe access
 * to application settings with reactive updates
 */
@Injectable({ providedIn: 'root' })
export class ConfigurationService<T> implements IConfigurationService<T> {
  private configSubject: ReplaySubject<T>;
  private currentConfig: T | null = null;
  private loaded = false;

  /**
   * Observable stream of configuration updates
   * New subscribers immediately receive the last emitted configuration
   */
  public readonly settings$: Observable<T>;

  constructor(
    @Optional() private context?: ConfigurationContext<T>
  ) {
    // ReplaySubject(1) caches the last value for new subscribers
    this.configSubject = new ReplaySubject<T>(1);
    this.settings$ = this.configSubject.asObservable();

    // Initialize with context if provided
    if (context?.settings) {
      this.initialize(context.settings);
    }
  }

  /**
   * Get current configuration (synchronous)
   */
  get config(): T {
    if (!this.currentConfig) {
      throw new Error('Configuration not initialized');
    }
    return this.currentConfig;
  }

  /**
   * Update configuration (triggers Observable emission)
   */
  set config(value: T) {
    if (!value) {
      throw new Error('Configuration cannot be null or undefined');
    }
    this.currentConfig = Object.freeze(value) as T;
    this.loaded = true;
    this.configSubject.next(this.currentConfig);
  }

  /**
   * Get specific property with type safety
   */
  getProperty<K extends keyof T>(key: K): T[K] {
    return this.config[key];
  }

  /**
   * Check if configuration is loaded
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Initialize configuration
   */
  private initialize(settings: T): void {
    this.config = settings;
  }
}
```

**Key Features:**
- Generic type `T` for any configuration shape
- `ReplaySubject` caches last configuration for late subscribers
- Immutable configuration via `Object.freeze`
- Both synchronous (`config`) and reactive (`settings$`) access
- Type-safe property access via generics

---

## 🌍 Step 4: Create Environment-Specific Configurations

### 4.1 Create Environment Files

Create `src/environments/environment.ts` (base):

```typescript
import { IAppConfiguration } from '../app/configuration/models/configuration.interface';

export const environment: IAppConfiguration = {
  environment: 'development',
  production: false,
  apiBaseUrl: 'http://localhost:3000/api',
  applicationName: 'My Application',
  version: '1.0.0',
  logging: {
    level: 'debug',
    enableConsole: true,
    enableRemote: false
  },
  features: {
    enableBetaFeatures: true,
    featureFlags: {
      newDashboard: true,
      advancedReporting: false
    }
  },
  http: {
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  }
};
```

Create `src/environments/environment.prod.ts`:

```typescript
import { IAppConfiguration } from '../app/configuration/models/configuration.interface';

export const environment: IAppConfiguration = {
  environment: 'production',
  production: true,
  apiBaseUrl: 'https://api.production.com/api',
  applicationName: 'My Application',
  version: '1.0.0',
  logging: {
    level: 'error',
    enableConsole: false,
    enableRemote: true,
    remoteEndpoint: 'https://logs.production.com'
  },
  features: {
    enableBetaFeatures: false,
    featureFlags: {
      newDashboard: false,
      advancedReporting: true
    }
  },
  http: {
    timeout: 30000,
    retryAttempts: 5,
    retryDelay: 2000
  }
};
```

### 4.2 Configure Build Replacements

Update `angular.json` to replace environment files:

```json
{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "configurations": {
            "production": {
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.prod.ts"
                }
              ]
            }
          }
        }
      }
    }
  }
}
```

---

## 🚀 Step 5: Bootstrap Configuration

### 5.1 Provide Configuration (Standalone App)

For standalone applications, configure in `src/app/app.config.ts`:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { ConfigurationService } from './configuration/configuration.service';
import { ConfigurationContext } from './configuration/configuration-context';
import { environment } from '../environments/environment';
import { IAppConfiguration } from './configuration/models/configuration.interface';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // Provide configuration context
    {
      provide: ConfigurationContext,
      useValue: new ConfigurationContext<IAppConfiguration>(environment)
    },
    // Configuration service will be provided by @Injectable
    ConfigurationService
  ]
};
```

### 5.2 Provide Configuration (Module-Based App)

For module-based applications, create configuration module:

```typescript
import { NgModule, ModuleWithProviders } from '@angular/core';
import { ConfigurationService } from './configuration.service';
import { ConfigurationContext } from './configuration-context';

@NgModule()
export class ConfigurationModule {
  /**
   * Call this method in AppModule to provide configuration
   */
  static forRoot<T>(
    config: T
  ): ModuleWithProviders<ConfigurationModule> {
    return {
      ngModule: ConfigurationModule,
      providers: [
        {
          provide: ConfigurationContext,
          useValue: new ConfigurationContext<T>(config)
        },
        ConfigurationService
      ]
    };
  }
}
```

Then in `app.module.ts`:

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { ConfigurationModule } from './configuration/configuration.module';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    ConfigurationModule.forRoot(environment)
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

---

## 🔌 Step 6: Integrate with Cross-Cutting Concerns

### 6.1 Example: Logging Service Integration

```typescript
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ConfigurationService } from '../configuration/configuration.service';
import { IAppConfiguration, ILoggingConfiguration } from '../configuration/models/configuration.interface';

@Injectable({ providedIn: 'root' })
export class LoggingService {
  private loggingConfig$: Observable<ILoggingConfiguration>;

  constructor(
    private configService: ConfigurationService<IAppConfiguration>
  ) {
    // Subscribe to logging configuration changes
    this.loggingConfig$ = this.configService.settings$.pipe(
      map(config => config.logging)
    );

    // Initialize based on current config
    this.initialize(this.configService.config.logging);

    // React to configuration changes
    this.loggingConfig$.subscribe(config => {
      this.updateLoggingLevel(config.level);
      this.updateRemoteLogging(config.enableRemote);
    });
  }

  log(message: string, level: 'debug' | 'info' | 'warn' | 'error'): void {
    const config = this.configService.config.logging;
    
    if (this.shouldLog(level, config.level)) {
      if (config.enableConsole) {
        console[level](message);
      }
      
      if (config.enableRemote && config.remoteEndpoint) {
        this.sendToRemote(message, level, config.remoteEndpoint);
      }
    }
  }

  private shouldLog(messageLevel: string, configLevel: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(messageLevel) >= levels.indexOf(configLevel);
  }

  private initialize(config: ILoggingConfiguration): void {
    // Initialize logging service
  }

  private updateLoggingLevel(level: string): void {
    // Update logging level
  }

  private updateRemoteLogging(enabled: boolean): void {
    // Enable/disable remote logging
  }

  private sendToRemote(message: string, level: string, endpoint: string): void {
    // Send log to remote endpoint
  }
}
```

### 6.2 Pattern for All Cross-Cutting Concerns

```typescript
@Injectable({ providedIn: 'root' })
export class CrossCuttingService {
  private concernConfig$: Observable<ConcernConfig>;

  constructor(
    private configService: ConfigurationService<IAppConfiguration>
  ) {
    // Extract concern-specific configuration
    this.concernConfig$ = this.configService.settings$.pipe(
      map(config => config.concernName)
    );

    // React to changes
    this.concernConfig$.subscribe(config => {
      this.reconfigure(config);
    });
  }
}
```

---

## 🧪 Step 7: Add Testing Support

### 7.1 Create Test Utilities

Create `src/app/configuration/testing/configuration-testing.module.ts`:

```typescript
import { NgModule } from '@angular/core';
import { ConfigurationContext } from '../configuration-context';
import { ConfigurationService } from '../configuration.service';

/**
 * Provide mock configuration for testing
 */
export function provideTestConfiguration<T>(config: T) {
  return [
    {
      provide: ConfigurationContext,
      useValue: new ConfigurationContext<T>(config)
    },
    ConfigurationService
  ];
}

/**
 * Create mock configuration for tests
 */
export function createMockConfiguration<T>(
  overrides: Partial<T>,
  defaults: T
): T {
  return { ...defaults, ...overrides } as T;
}
```

### 7.2 Write Unit Tests

Create `src/app/configuration/configuration.service.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { ConfigurationService } from './configuration.service';
import { ConfigurationContext } from './configuration-context';
import { IAppConfiguration } from './models/configuration.interface';

describe('ConfigurationService', () => {
  let service: ConfigurationService<IAppConfiguration>;
  const mockConfig: IAppConfiguration = {
    environment: 'test',
    production: false,
    apiBaseUrl: 'http://test.api',
    applicationName: 'Test App',
    version: '1.0.0',
    logging: {
      level: 'debug',
      enableConsole: true,
      enableRemote: false
    },
    features: {
      enableBetaFeatures: true,
      featureFlags: {}
    },
    http: {
      timeout: 5000,
      retryAttempts: 3,
      retryDelay: 1000
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ConfigurationService,
        {
          provide: ConfigurationContext,
          useValue: new ConfigurationContext(mockConfig)
        }
      ]
    });
    service = TestBed.inject(ConfigurationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should provide configuration synchronously', () => {
    expect(service.config).toEqual(mockConfig);
  });

  it('should provide configuration via Observable', (done) => {
    service.settings$.subscribe(config => {
      expect(config).toEqual(mockConfig);
      done();
    });
  });

  it('should get specific property with type safety', () => {
    const apiUrl = service.getProperty('apiBaseUrl');
    expect(apiUrl).toBe('http://test.api');
  });

  it('should update configuration and emit to subscribers', (done) => {
    const newConfig = { ...mockConfig, apiBaseUrl: 'http://new.api' };
    
    service.settings$.subscribe(config => {
      if (config.apiBaseUrl === 'http://new.api') {
        expect(config.apiBaseUrl).toBe('http://new.api');
        done();
      }
    });

    service.config = newConfig;
  });

  it('should freeze configuration to prevent mutations', () => {
    const config = service.config;
    expect(() => {
      (config as any).apiBaseUrl = 'modified';
    }).toThrow();
  });

  it('should indicate loaded state', () => {
    expect(service.isLoaded()).toBe(true);
  });
});
```

### 7.3 Test Cross-Cutting Concern Integration

```typescript
import { TestBed } from '@angular/core/testing';
import { LoggingService } from './logging.service';
import { provideTestConfiguration, createMockConfiguration } from '../configuration/testing/configuration-testing.module';
import { environment } from '../../environments/environment';

describe('LoggingService with Configuration', () => {
  it('should use configuration from service', () => {
    const testConfig = createMockConfiguration(
      { logging: { level: 'error', enableConsole: true, enableRemote: false } },
      environment
    );

    TestBed.configureTestingModule({
      providers: [
        LoggingService,
        ...provideTestConfiguration(testConfig)
      ]
    });

    const loggingService = TestBed.inject(LoggingService);
    
    // Verify logging service uses configuration
    // Your assertions here
  });
});
```

---

## 📚 Step 8: Add Validation (Optional but Recommended)

### 8.1 Install Validation Library

```bash
npm install zod
```

### 8.2 Create Configuration Schema

Create `src/app/configuration/configuration.schema.ts`:

```typescript
import { z } from 'zod';

/**
 * Zod schema for runtime configuration validation
 */
export const ConfigurationSchema = z.object({
  environment: z.enum(['development', 'staging', 'production', 'test']),
  production: z.boolean(),
  apiBaseUrl: z.string().url(),
  applicationName: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']),
    enableConsole: z.boolean(),
    enableRemote: z.boolean(),
    remoteEndpoint: z.string().url().optional()
  }),
  features: z.object({
    enableBetaFeatures: z.boolean(),
    featureFlags: z.record(z.boolean())
  }),
  http: z.object({
    timeout: z.number().positive(),
    retryAttempts: z.number().min(0).max(10),
    retryDelay: z.number().positive()
  })
});

// Infer TypeScript type from schema
export type ValidatedConfiguration = z.infer<typeof ConfigurationSchema>;
```

### 8.3 Add Validation to Service

```typescript
import { ConfigurationSchema } from './configuration.schema';

export class ConfigurationService<T> {
  set config(value: T) {
    // Validate before setting
    const result = ConfigurationSchema.safeParse(value);
    
    if (!result.success) {
      console.error('Configuration validation failed:', result.error);
      throw new Error(`Invalid configuration: ${result.error.message}`);
    }

    this.currentConfig = Object.freeze(value) as T;
    this.loaded = true;
    this.configSubject.next(this.currentConfig);
  }
}
```

---

## 🔍 Step 9: Usage Examples

### 9.1 In Components

```typescript
import { Component, OnInit } from '@angular/core';
import { ConfigurationService } from './configuration/configuration.service';
import { IAppConfiguration } from './configuration/models/configuration.interface';

@Component({
  selector: 'app-dashboard',
  template: `
    <h1>{{ appName }}</h1>
    <div *ngIf="betaFeaturesEnabled">
      <p>Beta features are enabled!</p>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  appName: string = '';
  betaFeaturesEnabled: boolean = false;

  constructor(
    private configService: ConfigurationService<IAppConfiguration>
  ) {}

  ngOnInit(): void {
    // Synchronous access
    this.appName = this.configService.config.applicationName;
    this.betaFeaturesEnabled = this.configService.config.features.enableBetaFeatures;

    // Reactive access
    this.configService.settings$.subscribe(config => {
      this.appName = config.applicationName;
      this.betaFeaturesEnabled = config.features.enableBetaFeatures;
    });
  }
}
```

### 9.2 In Services

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigurationService } from '../configuration/configuration.service';
import { IAppConfiguration } from '../configuration/models/configuration.interface';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private apiBaseUrl: string;

  constructor(
    private http: HttpClient,
    private configService: ConfigurationService<IAppConfiguration>
  ) {
    this.apiBaseUrl = this.configService.config.apiBaseUrl;
  }

  getData(): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/data`);
  }
}
```

### 9.3 In Guards

```typescript
import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { ConfigurationService } from '../configuration/configuration.service';
import { IAppConfiguration } from '../configuration/models/configuration.interface';

@Injectable({ providedIn: 'root' })
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private configService: ConfigurationService<IAppConfiguration>
  ) {}

  canActivate(): boolean {
    const featureEnabled = this.configService.config.features.featureFlags['newDashboard'];
    return featureEnabled === true;
  }
}
```

---

## 🚨 Common Pitfalls & Troubleshooting

### Issue 1: Configuration Not Available at Bootstrap

**Symptom:** Configuration accessed before it's loaded  
**Solution:** Use APP_INITIALIZER to ensure configuration loads first

```typescript
import { APP_INITIALIZER } from '@angular/core';

export function initializeApp(
  configService: ConfigurationService<IAppConfiguration>
): () => Promise<void> {
  return () => {
    // Load configuration before app starts
    return Promise.resolve();
  };
}

// In app.config.ts
providers: [
  {
    provide: APP_INITIALIZER,
    useFactory: initializeApp,
    deps: [ConfigurationService],
    multi: true
  }
]
```

### Issue 2: Type Errors with Generic Service

**Symptom:** TypeScript can't infer configuration type  
**Solution:** Explicitly specify type when injecting

```typescript
constructor(
  private configService: ConfigurationService<IAppConfiguration>
) {}
```

### Issue 3: Configuration Changes Not Propagating

**Symptom:** Subscribers don't receive updates  
**Solution:** Ensure you're updating via setter, not mutating

```typescript
// ❌ Wrong - mutates frozen object
this.configService.config.apiBaseUrl = 'new-url';

// ✅ Correct - creates new configuration
this.configService.config = {
  ...this.configService.config,
  apiBaseUrl: 'new-url'
};
```

---

## ✅ Implementation Checklist

- [ ] Configuration interfaces defined with proper typing
- [ ] Configuration context class implemented
- [ ] Configuration service with generic type support
- [ ] Environment-specific configuration files created
- [ ] Configuration provided in application bootstrap
- [ ] Cross-cutting concerns integrated with configuration
- [ ] Unit tests written for configuration service
- [ ] Integration tests for configuration consumers
- [ ] Validation schema created (optional)
- [ ] Documentation updated with usage examples
- [ ] Team trained on configuration patterns
- [ ] Configuration deployed to all environments

---

## 📈 Next Steps

1. **Extend for Your Needs** - Add your application-specific configuration
2. **Integrate Other Concerns** - Connect logging, feature flags, etc.
3. **Add Remote Configuration** - Load configuration from API if needed
4. **Implement Monitoring** - Track configuration usage and changes
5. **Documentation** - Document your configuration schema for the team

---

## 📚 Additional Resources

- [Angular Dependency Injection](https://angular.io/guide/dependency-injection)
- [RxJS Observables](https://rxjs.dev/guide/observable)
- [TypeScript Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [Zod Validation](https://zod.dev/)

---

**Questions or need help?** Contact matt.vaughn@buildmotion.com

**Author:** Matt Vaughn / Buildmotion  
**Website:** https://www.buildmotion.com
