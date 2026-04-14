---
meta:
  id: configuration-specification
  title: Configuration Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
title: Configuration Specification
category: Libraries
feature: Configuration
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: '1.0'
aiContext: true
applyTo: []
keywords: []
topics: []
useCases: []
---

# Configuration Library Specification

**Library Name:** `@buildmotion/configuration`  
**Version:** 18.0.0  
**Author:** Matt Vaughn / Agent Alchemy  
**Category:** Cross-Cutting Concern  
**Architecture Layer:** Infrastructure

---

## 🎯 Purpose

The **Configuration** library provides a comprehensive, type-safe Angular configuration service to manage and provide application configuration settings across the entire application lifecycle. It serves as the **central configuration hub** for all cross-cutting concerns, enabling each concern to define its own strongly-typed configuration section while maintaining a unified configuration strategy with reactive updates and proper separation of concerns.

---

## 📋 Responsibilities

### Primary Responsibilities

1. **Centralized Configuration Management**
   - Serve as the single source of truth for all application and cross-cutting concern configurations
   - Provide a unified `ConfigurationContext<T>` abstraction for type-safe configuration
   - Support environment-specific settings (development, staging, production, QA, etc.)
   - Enable each cross-cutting concern to define its own configuration interface

2. **Reactive Configuration**
   - Expose configuration as Observable streams via `settings$`
   - Support dynamic configuration updates through settable properties
   - Notify subscribers of configuration changes via `ReplaySubject`
   - Provide immediate access to latest configuration for new subscribers

3. **Cross-Cutting Concern Integration**
   - Provide `forRoot()` pattern for initializing concerns with typed configurations
   - Support dependency injection of configuration contexts
   - Enable secure, separated configuration sections per concern
   - Facilitate configuration aggregation in a central `IConfiguration` interface

4. **Application Bootstrapping**
   - Integrate with Angular module initialization via `forRoot()`
   - Support standalone and module-based application patterns
   - Provide configuration before application fully bootstraps
   - Enable configuration loading from files, objects, or remote sources

### What This Library Does

- ✅ Manages all application and cross-cutting concern configurations centrally
- ✅ Provides generic, type-safe configuration access via `ConfigurationService<T>`
- ✅ Supports reactive configuration updates through Observables
- ✅ Enables strongly-typed configuration sections per cross-cutting concern
- ✅ Provides `ConfigurationContext<T>` abstraction for environment-specific settings
- ✅ Supports `forRoot()` pattern for module initialization
- ✅ Includes example configuration interfaces and environment enums
- ✅ Promotes separation of concerns with configuration sectioning

### What This Library Does NOT Do

- ❌ Fetch configuration from remote APIs (delegate to HTTP service or APP_INITIALIZER)
- ❌ Validate configuration values (use validation library)
- ❌ Log configuration changes (use logging library)
- ❌ Store configuration persistently (configuration is in-memory)
- ❌ Encrypt or decrypt sensitive configuration data
- ❌ Provide environment file management (use Angular environment files)

---

## 🏗️ Architecture & Design

### Clean Architecture Position

```
┌─────────────────────────────────────────┐
│  Cross-Cutting Concerns ← CONFIG HERE   │  ← Used by all layers
├─────────────────────────────────────────┤
│            Presentation Layer           │
├─────────────────────────────────────────┤
│         Infrastructure Layer            │
├─────────────────────────────────────────┤
│     Core (Entities & Use Cases)         │
└─────────────────────────────────────────┘
```

### Key Components

1. **ConfigurationService<T>**
   - Generic service providing type-safe configuration access
   - Uses `ReplaySubject` to manage configuration state
   - Provides both synchronous (`config` property) and reactive (`settings$` Observable) access
   - Accepts optional `ConfigurationContext<T>` via dependency injection
   - Supports runtime configuration updates via `settings` setter

2. **ConfigurationContext<T>**
   - Simple generic class holding typed configuration data
   - Serves as the dependency injection token for configuration
   - Instantiated with a specific configuration object
   - Used with `forRoot()` to provide configuration to the service

3. **IConfigurationService<T>**
   - Interface defining the configuration service contract
   - Ensures consistent API across configuration implementations
   - Requires `settings$` Observable for reactive access

4. **Configuration Interfaces** (Examples)
   - `IContentfulConfig` - Configuration for Contentful CMS integration
   - `IAppVersionConfig` - Application version and environment configuration
   - `AppEnvironment` - Enumeration of deployment environments

5. **Configuration Module Pattern**
   - `ConfigurationModule.forRoot<T>()` - Static method for initialization
   - Provides `ConfigurationContext` and `ConfigurationService` to DI container
   - Enables typed configuration throughout the application

---

## 🔌 Dependencies

### Internal Dependencies

None - Standalone cross-cutting concern library

### External Dependencies

- `@angular/core` - Angular core functionality
- `rxjs` - Reactive programming with Observables
- `tslib` - TypeScript runtime library

### Peer Dependencies

- `@angular/common` ~17.0.0 || <18.0.0
- `@angular/core` ~17.0.0 || <=18.0.0

---

## 📦 Public API

### ConfigurationService<T>

The main service providing generic, type-safe configuration management.

```typescript
@Injectable({
  providedIn: 'root',
})
export class ConfigurationService<T> implements IConfigurationService<T> {
  // Observable stream of configuration
  readonly settings$: Observable<T>;
  
  // Current configuration instance
  config!: T;
  
  // Constructor accepts optional ConfigurationContext
  constructor(@Optional() context: ConfigurationContext<T>);
  
  // Getter for current configuration
  get settings(): T;
  
  // Setter for updating configuration (emits via settings$)
  set settings(value: T);
}
```

### IConfigurationService<T>

Interface defining the configuration service contract.

```typescript
export interface IConfigurationService<T> {
  readonly settings$: Observable<T>;
}
```

### ConfigurationContext<T>

Generic class holding typed configuration data.

```typescript
export class ConfigurationContext<T> {
  config!: T;
}
```

### ConfigurationModule

Module providing configuration initialization via `forRoot()`.

```typescript
@NgModule({
  imports: [CommonModule],
})
export class ConfigurationModule {
  static forRoot<T>(
    configContext: ConfigurationContext<T>
  ): ModuleWithProviders<ConfigurationModule> {
    return {
      ngModule: ConfigurationModule,
      providers: [
        {
          provide: ConfigurationContext,
          useValue: configContext,
        },
        ConfigurationService<T>
      ],
    };
  }
}
```

### Example Configuration Interfaces

#### AppEnvironment Enum

```typescript
export enum AppEnvironment {
  development = 'development',
  local = 'local',
  production = 'production',
  qa = 'qa',
  stage = 'stage',
}
```

#### IAppVersionConfig

```typescript
export interface IAppVersionConfig {
  environment: AppEnvironment;
  displayNotification: boolean;
}
```

#### IContentfulConfig

```typescript
export interface IContentfulConfig {
  spaceId: string;
  token: string;
}
```

### Comprehensive Configuration Strategy

This section demonstrates the **profound architectural pattern** for managing configurations across all cross-cutting concerns in a centralized, yet properly separated way.

#### Step 1: Define Central Configuration Interface

Create an `IConfiguration` interface that aggregates all cross-cutting concern configurations:

```typescript
import { AuthConfig } from "@auth0/auth0-angular";
import { ErrorHandlingOptions } from "@buildmotion/error-handling";
import { IFeatureFlagOptions } from "@buildmotion/feature-flag";
import { IHttpOptions } from "@buildmotion/http-service";
import { DataDogOptions, ILoggingConfig } from "@buildmotion/logging";

export interface IConfiguration {
  apiConfig: IHttpOptions;
  auth0Config: AuthConfig;
  dataDogConfig?: DataDogOptions;
  errorHandlingConfig?: ErrorHandlingOptions;
  featureFlagConfig?: IFeatureFlagOptions;
  loggingConfig: ILoggingConfig;
}

export class Configuration implements IConfiguration {
  apiConfig!: IHttpOptions;
  auth0Config!: AuthConfig;
  dataDogConfig?: DataDogOptions;
  errorHandlingConfig!: ErrorHandlingOptions;
  featureFlagConfig?: IFeatureFlagOptions;
  loggingConfig!: ILoggingConfig;
}
```

#### Step 2: Create Configuration File

Define the configuration object with strongly-typed sections for each concern:

```typescript
const APPLICATION_NAME = 'my-angular-app';

export const APP_CONFIG: Configuration = {
  apiConfig: {
    apiURL: 'http://localhost:3333/api',
    baseUrl: '',
    csrf: '/api/csrf',
    health: '/api/health',
    version: '/api/version'
  },
  auth0Config: {
    domain: 'my-app.auth0.com',
    clientId: 'your-client-id',
    authorizationParams: {
      redirect_uri: window.location.origin
    }
  },
  dataDogConfig: {
    logs: {
      clientToken: 'your-datadog-token',
      forwardErrorsToLogs: true,
      sampleRate: 100,
      site: 'datadoghq.com'
    },
    realUserMonitoring: {
      applicationId: APPLICATION_NAME,
      clientToken: 'your-rum-token',
      defaultPrivacyLevel: 'mask-user-input',
      env: 'production',
      premiumSampleRate: 100,
      sampleRate: 100,
      service: APPLICATION_NAME,
      site: 'datadoghq.com',
      trackInteractions: true,
      version: '1.0.0'
    }
  },
  loggingConfig: {
    applicationName: APPLICATION_NAME,
    isProduction: false
  },
  errorHandlingConfig: {
    applicationName: APPLICATION_NAME,
    includeDefaultErrorHandling: true
  },
  featureFlagConfig: {
    application: APPLICATION_NAME,
    licenseKey: 'your-license-key',
    userId: 'user-123'
  }
};
```

#### Step 3: Create CrossCuttingModule

Initialize all cross-cutting concerns with their specific configurations:

```typescript
import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigurationModule, ConfigurationContext } from '@buildmotion/configuration';
import { FeatureFlagModule, IFeatureFlagOptions } from '@buildmotion/feature-flag';
import { LoggingModule, DataDogOptions } from '@buildmotion/logging';
import { ErrorHandlingModule } from '@buildmotion/error-handling';
import { HttpServiceModule } from '@buildmotion/http-service';
import { APP_CONFIG, IConfiguration } from '../config/app-config';

// Create configuration context with the central configuration
const configContext: ConfigurationContext<IConfiguration> = {
  config: APP_CONFIG
};

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    // Initialize configuration with central config
    ConfigurationModule.forRoot<IConfiguration>(configContext),
    
    // Initialize each cross-cutting concern with its specific config section
    FeatureFlagModule.forRoot(APP_CONFIG.featureFlagConfig as IFeatureFlagOptions),
    LoggingModule.forRoot(APP_CONFIG.dataDogConfig as DataDogOptions, APP_CONFIG.loggingConfig),
    ErrorHandlingModule.forRoot(APP_CONFIG.errorHandlingConfig),
    HttpServiceModule.forRoot(APP_CONFIG.apiConfig),
  ]
})
export class CrossCuttingModule {
  static forRoot(): ModuleWithProviders<CrossCuttingModule> {
    return {
      ngModule: CrossCuttingModule,
      providers: [
        // Additional providers if needed
      ],
    };
  }
}
```

#### Step 4: Initialize in AppModule

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';
import { CrossCuttingModule } from './cross-cutting.module';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule.forRoot(appRoutes),
    CrossCuttingModule.forRoot()
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
```

#### Step 5: Use Configuration in Services and Components

```typescript
import { Injectable, inject } from '@angular/core';
import { ConfigurationService } from '@buildmotion/configuration';
import { IConfiguration } from '../config/app-config';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private configService = inject(ConfigurationService<IConfiguration>);
  
  getApiUrl(): string {
    // Access specific configuration section
    return this.configService.config.apiConfig.apiURL;
  }
  
  constructor() {
    // Subscribe to configuration changes
    this.configService.settings$.subscribe(config => {
      console.log('API URL:', config.apiConfig.apiURL);
    });
  }
}
```

### Simple Usage Example

For simpler applications or single-concern configuration:

```typescript
// 1. Define your configuration interface
export interface AppConfig {
  apiUrl: string;
  environment: 'dev' | 'prod';
  features: {
    enableAnalytics: boolean;
    enableDebug: boolean;
  };
}

// 2. Create configuration object
const myAppConfig: AppConfig = {
  apiUrl: 'http://localhost:3000',
  environment: 'dev',
  features: {
    enableAnalytics: false,
    enableDebug: true
  }
};

// 3. Create configuration context
const configContext: ConfigurationContext<AppConfig> = {
  config: myAppConfig
};

// 4. Initialize module
@NgModule({
  imports: [
    ConfigurationModule.forRoot<AppConfig>(configContext)
  ]
})
export class AppModule {}

// 5. Use in components/services
@Component({...})
export class AppComponent {
  private config = inject(ConfigurationService<AppConfig>);

  ngOnInit() {
    console.log('API URL:', this.config.config.apiUrl);
    
    this.config.settings$.subscribe(settings => {
      console.log('Environment:', settings.environment);
    });
  }
}
```

---

## 🎨 Design Patterns

### 1. Singleton Pattern

- `ConfigurationService` is provided in root (`providedIn: 'root'`)
- Single instance shared across the entire application
- Centralized configuration state accessible globally
- All cross-cutting concerns access the same configuration instance

### 2. Observer Pattern (Reactive Programming)

- Configuration exposed as Observable stream via `settings$`
- Uses `ReplaySubject` to cache the latest configuration value
- New subscribers immediately receive the current configuration
- Components and services subscribe to reactive configuration changes
- Automatic propagation of configuration updates to all subscribers

### 3. Dependency Injection Pattern

- `ConfigurationContext<T>` serves as the DI token
- Configuration injected via constructor with `@Optional()` decorator
- Enables testing with mock configurations
- Supports runtime configuration replacement for different environments

### 4. Module Configuration Pattern (forRoot)

- Static `forRoot()` method for module initialization
- Accepts `ConfigurationContext<T>` with typed configuration
- Returns `ModuleWithProviders` with configured providers
- Follows Angular convention for configurable modules
- Enables each cross-cutting concern to receive its specific configuration section

### 5. Generic Programming Pattern

- Service uses TypeScript generics (`ConfigurationService<T>`)
- Ensures type safety for any configuration structure
- Each concern defines its own configuration interface
- Central configuration aggregates all concern configurations
- Compile-time type checking for configuration access

### 6. Separation of Concerns Pattern

- Each cross-cutting concern defines its own configuration interface
- Configuration sections are strongly typed and independent
- Central `IConfiguration` interface aggregates all sections
- Each concern receives only its relevant configuration
- Security through configuration isolation

### 7. Facade Pattern

- `CrossCuttingModule` provides a unified interface for initializing all concerns
- Simplifies AppModule by hiding configuration complexity
- Centralizes configuration management in one place
- Makes the application bootstrap more readable and maintainable

---

## 🔄 Integration with Clean Architecture

### Cross-Cutting Concern Hub

The Configuration library serves as the **central hub** for all cross-cutting concerns, accessible from all architectural layers:

```typescript
// In Core Layer (Use Case)
export class ProcessOrderUseCase {
  constructor(private config: ConfigurationService<IConfiguration>) {}
  
  execute(order: Order) {
    const apiUrl = this.config.config.apiConfig.apiURL;
    const timeout = this.config.config.apiConfig.timeout;
    // Use configuration in business logic
  }
}

// In Infrastructure Layer (Service)
export class ApiService {
  constructor(private config: ConfigurationService<IConfiguration>) {}
  
  getBaseUrl(): string {
    return this.config.config.apiConfig.apiURL;
  }
  
  getCsrfEndpoint(): string {
    return this.config.config.apiConfig.csrf;
  }
}

// In Presentation Layer (Component)
@Component({...})
export class HeaderComponent {
  private config = inject(ConfigurationService<IConfiguration>);
  
  showDebugInfo = computed(() => 
    this.config.config.loggingConfig.isProduction === false
  );
  
  get environmentName(): string {
    return this.config.config.loggingConfig.applicationName;
  }
}
```

### Cross-Cutting Concerns Initialization Pattern

Each cross-cutting concern receives its specific configuration section:

```typescript
// Logging receives only logging-related config
LoggingModule.forRoot(
  APP_CONFIG.dataDogConfig,    // DataDog-specific config
  APP_CONFIG.loggingConfig     // Logging-specific config
)

// HTTP Service receives only API-related config
HttpServiceModule.forRoot(
  APP_CONFIG.apiConfig         // API-specific config
)

// Error Handling receives only error-handling config
ErrorHandlingModule.forRoot(
  APP_CONFIG.errorHandlingConfig  // Error handling-specific config
)

// Feature Flags receives only feature flag config
FeatureFlagModule.forRoot(
  APP_CONFIG.featureFlagConfig    // Feature flag-specific config
)
```

### Security Through Configuration Isolation

Each concern only accesses its own configuration section:

```typescript
// Logging service only knows about logging config
@Injectable()
export class LoggingService {
  constructor(
    private loggingConfig: ILoggingConfig,
    private dataDogConfig: DataDogOptions
  ) {
    // Cannot access apiConfig, auth0Config, etc.
    // Only receives what it needs
  }
}

// HTTP service only knows about API config
@Injectable()
export class HttpService {
  constructor(private httpConfig: IHttpOptions) {
    // Cannot access loggingConfig, auth0Config, etc.
    // Only receives what it needs
  }
}
```

### Reactive Configuration Updates

Components and services can reactively respond to configuration changes:

```typescript
@Component({...})
export class DashboardComponent implements OnInit {
  private config = inject(ConfigurationService<IConfiguration>);
  
  ngOnInit() {
    // React to configuration changes
    this.config.settings$.pipe(
      map(config => config.apiConfig.apiURL),
      distinctUntilChanged()
    ).subscribe(apiUrl => {
      console.log('API URL changed to:', apiUrl);
      // Reinitialize services, reconnect, etc.
    });
  }
}
```

---

## 🧪 Testing Guidelines

### Unit Testing ConfigurationService

```typescript
describe('ConfigurationService', () => {
  let service: ConfigurationService<IConfiguration>;
  let mockContext: ConfigurationContext<IConfiguration>;

  beforeEach(() => {
    const mockConfig: IConfiguration = {
      apiConfig: {
        apiURL: 'http://test-api.com',
        baseUrl: 'http://test.com',
        csrf: '/csrf',
        health: '/health',
        version: '/version'
      },
      auth0Config: {
        domain: 'test.auth0.com',
        clientId: 'test-client-id',
        authorizationParams: { redirect_uri: 'http://test.com' }
      },
      loggingConfig: {
        applicationName: 'test-app',
        isProduction: false
      },
      errorHandlingConfig: {
        applicationName: 'test-app',
        includeDefaultErrorHandling: true
      }
    };
    
    mockContext = { config: mockConfig };
    service = new ConfigurationService(mockContext);
  });

  it('should initialize with configuration from context', () => {
    expect(service.config).toBeFalsy(); // Config not set until accessed via settings setter
  });

  it('should emit configuration through settings$', (done) => {
    service.settings = mockContext.config;
    
    service.settings$.subscribe(settings => {
      expect(settings.apiConfig.apiURL).toBe('http://test-api.com');
      expect(settings.loggingConfig.applicationName).toBe('test-app');
      done();
    });
  });

  it('should update configuration reactively', (done) => {
    const updates: IConfiguration[] = [];
    
    service.settings$.subscribe(config => {
      updates.push(config);
    });

    service.settings = mockContext.config;
    
    // Update configuration
    const updatedConfig = {
      ...mockContext.config,
      apiConfig: {
        ...mockContext.config.apiConfig,
        apiURL: 'http://updated-api.com'
      }
    };
    service.settings = updatedConfig;

    setTimeout(() => {
      expect(updates.length).toBe(2);
      expect(updates[1].apiConfig.apiURL).toBe('http://updated-api.com');
      done();
    }, 100);
  });
});
```

### Testing Services with Configuration Dependency

```typescript
describe('ApiService', () => {
  let service: ApiService;
  let mockConfig: ConfigurationService<IConfiguration>;

  beforeEach(() => {
    const mockConfigData: IConfiguration = {
      apiConfig: {
        apiURL: 'http://test-api.com',
        baseUrl: 'http://test.com',
        csrf: '/csrf',
        health: '/health',
        version: '/version'
      },
      // ... other config sections
    };

    mockConfig = jasmine.createSpyObj('ConfigurationService', [], {
      config: mockConfigData,
      settings$: of(mockConfigData)
    });
    
    TestBed.configureTestingModule({
      providers: [
        ApiService,
        { provide: ConfigurationService, useValue: mockConfig }
      ]
    });
    
    service = TestBed.inject(ApiService);
  });

  it('should use configuration from ConfigurationService', () => {
    expect(service.getBaseUrl()).toBe('http://test-api.com');
  });
});
```

### Integration Testing with ConfigurationModule

```typescript
describe('CrossCuttingModule Integration', () => {
  beforeEach(() => {
    const testConfig: IConfiguration = {
      // ... full configuration
    };
    
    const configContext: ConfigurationContext<IConfiguration> = {
      config: testConfig
    };

    TestBed.configureTestingModule({
      imports: [
        ConfigurationModule.forRoot<IConfiguration>(configContext),
        HttpServiceModule.forRoot(testConfig.apiConfig),
        LoggingModule.forRoot(testConfig.dataDogConfig, testConfig.loggingConfig)
      ]
    });
  });

  it('should provide configuration to all services', () => {
    const config = TestBed.inject(ConfigurationService);
    expect(config.config).toBeDefined();
    expect(config.config.apiConfig.apiURL).toBeDefined();
  });
});
```

---

## 📊 Best Practices

### Do's ✅

1. **Use Central Configuration Interface**
   ```typescript
   // ✅ Good - Aggregate all cross-cutting concerns
   export interface IConfiguration {
     apiConfig: IHttpOptions;
     loggingConfig: ILoggingConfig;
     errorHandlingConfig: ErrorHandlingOptions;
     // ... other concerns
   }
   ```

2. **Define Strongly-Typed Configuration Sections**
   ```typescript
   // ✅ Good - Each concern has its own interface
   export interface ILoggingConfig {
     applicationName: string;
     isProduction: boolean;
   }
   ```

3. **Initialize in CrossCuttingModule**
   ```typescript
   // ✅ Good - Centralize initialization
   ConfigurationModule.forRoot<IConfiguration>(configContext),
   LoggingModule.forRoot(APP_CONFIG.loggingConfig)
   ```

4. **Use Configuration Reactively**
   ```typescript
   // ✅ Good - Subscribe to changes
   this.config.settings$.pipe(
     map(c => c.apiConfig.apiURL)
   ).subscribe(url => this.updateUrl(url));
   ```

5. **Separate Configuration by Environment**
   ```typescript
   // ✅ Good - Environment-specific configs
   export const APP_CONFIG: Configuration = {
     apiConfig: {
       apiURL: environment.production 
         ? 'https://api.prod.com' 
         : 'http://localhost:3000'
     }
   };
   ```

6. **Document Configuration Schema**
   ```typescript
   // ✅ Good - Clear documentation
   /** 
    * Configuration for HTTP service
    * @property apiURL - Base URL for API calls
    * @property csrf - CSRF token endpoint
    */
   export interface IHttpOptions {
     apiURL: string;
     csrf: string;
   }
   ```

### Don'ts ❌

1. **Don't Modify Configuration After Initialization**
   ```typescript
   // ❌ Bad - Mutating configuration directly
   this.config.config.apiConfig.apiURL = 'new-url';
   
   // ✅ Good - Use setter to update reactively
   this.config.settings = {
     ...this.config.config,
     apiConfig: { ...this.config.config.apiConfig, apiURL: 'new-url' }
   };
   ```

2. **Don't Hardcode Values That Should Be Configurable**
   ```typescript
   // ❌ Bad - Hardcoded API URL
   const url = 'http://localhost:3000/api';
   
   // ✅ Good - Use configuration
   const url = this.config.config.apiConfig.apiURL;
   ```

3. **Don't Create Multiple Configuration Sources**
   ```typescript
   // ❌ Bad - Multiple configuration services
   export class MyService {
     apiConfig = { url: 'http://...' };  // Don't do this
   }
   
   // ✅ Good - Use centralized configuration
   export class MyService {
     constructor(private config: ConfigurationService<IConfiguration>) {}
   }
   ```

4. **Don't Store Sensitive Data in Configuration**
   ```typescript
   // ❌ Bad - Sensitive data in config
   export const APP_CONFIG = {
     apiConfig: {
       apiKey: 'secret-key-12345',  // Don't expose secrets
       password: 'admin123'
     }
   };
   
   // ✅ Good - Use environment variables or secure vaults
   export const APP_CONFIG = {
     apiConfig: {
       apiURL: process.env['API_URL'] || 'http://localhost:3000'
     }
   };
   ```

5. **Don't Ignore Type Safety**
   ```typescript
   // ❌ Bad - Using 'any' loses type safety
   ConfigurationModule.forRoot<any>(configContext);
   
   // ✅ Good - Use specific interface
   ConfigurationModule.forRoot<IConfiguration>(configContext);
   ```

6. **Don't Pass Entire Config to Concerns**
   ```typescript
   // ❌ Bad - Passing entire config (security risk)
   LoggingModule.forRoot(APP_CONFIG);  // Has access to everything
   
   // ✅ Good - Pass only what's needed
   LoggingModule.forRoot(APP_CONFIG.loggingConfig);  // Isolated
   ```

---

## 🔧 Comprehensive Configuration Schema Example

This example shows how to structure a complete application configuration with all cross-cutting concerns:

```typescript
import { AuthConfig } from "@auth0/auth0-angular";
import { ErrorHandlingOptions } from "@buildmotion/error-handling";
import { IFeatureFlagOptions } from "@buildmotion/feature-flag";
import { IHttpOptions } from "@buildmotion/http-service";
import { DataDogOptions, ILoggingConfig } from "@buildmotion/logging";

/**
 * Central configuration interface aggregating all cross-cutting concerns
 */
export interface IConfiguration {
  // HTTP Service Configuration
  apiConfig: IHttpOptions;
  
  // Authentication Configuration
  auth0Config: AuthConfig;
  
  // DataDog Configuration (optional)
  dataDogConfig?: DataDogOptions;
  
  // Error Handling Configuration
  errorHandlingConfig?: ErrorHandlingOptions;
  
  // Feature Flag Configuration (optional)
  featureFlagConfig?: IFeatureFlagOptions;
  
  // Logging Configuration
  loggingConfig: ILoggingConfig;
  
  // Add more cross-cutting concerns as needed
}

/**
 * Concrete implementation of the configuration interface
 */
export class Configuration implements IConfiguration {
  apiConfig!: IHttpOptions;
  auth0Config!: AuthConfig;
  dataDogConfig?: DataDogOptions;
  errorHandlingConfig!: ErrorHandlingOptions;
  featureFlagConfig?: IFeatureFlagOptions;
  loggingConfig!: ILoggingConfig;
}

/**
 * Configuration instance with actual values
 */
const APPLICATION_NAME = 'my-angular-app';

export const APP_CONFIG: Configuration = {
  // HTTP Service Configuration
  apiConfig: {
    apiURL: 'http://localhost:3333/api',
    baseUrl: '',
    csrf: '/api/csrf',
    health: '/api/health',
    version: '/api/version'
  },
  
  // Auth0 Configuration
  auth0Config: {
    domain: 'my-app.auth0.com',
    clientId: 'your-client-id',
    authorizationParams: {
      redirect_uri: window.location.origin
    }
  },
  
  // DataDog Configuration
  dataDogConfig: {
    logs: {
      clientToken: 'your-datadog-logs-token',
      forwardErrorsToLogs: true,
      sampleRate: 100,
      site: 'datadoghq.com'
    },
    realUserMonitoring: {
      applicationId: APPLICATION_NAME,
      clientToken: 'your-datadog-rum-token',
      defaultPrivacyLevel: 'mask-user-input',
      env: 'development',
      premiumSampleRate: 100,
      sampleRate: 100,
      service: APPLICATION_NAME,
      site: 'datadoghq.com',
      trackInteractions: true,
      version: '1.0.0'
    }
  },
  
  // Logging Configuration
  loggingConfig: {
    applicationName: APPLICATION_NAME,
    isProduction: false
  },
  
  // Error Handling Configuration
  errorHandlingConfig: {
    applicationName: APPLICATION_NAME,
    includeDefaultErrorHandling: true
  },
  
  // Feature Flag Configuration
  featureFlagConfig: {
    application: APPLICATION_NAME,
    licenseKey: 'your-license-key',
    userId: 'user-123'
  }
};
```

---

## 🔐 Environment-Specific Configuration

### Using Angular Environment Files

```typescript
// environment.ts (development)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3333/api',
  auth0Domain: 'dev.auth0.com',
  enableDebug: true,
  dataDogToken: 'dev-token'
};

// environment.prod.ts (production)
export const environment = {
  production: true,
  apiUrl: 'https://api.production.com',
  auth0Domain: 'prod.auth0.com',
  enableDebug: false,
  dataDogToken: 'prod-token'
};
```

### Creating Environment-Specific Configuration

```typescript
import { environment } from '../environments/environment';

const APPLICATION_NAME = 'my-angular-app';

export const APP_CONFIG: Configuration = {
  apiConfig: {
    apiURL: environment.apiUrl,
    baseUrl: environment.production ? 'https://app.com' : 'http://localhost:4200',
    csrf: '/api/csrf',
    health: '/api/health',
    version: '/api/version'
  },
  
  auth0Config: {
    domain: environment.auth0Domain,
    clientId: environment.production ? 'prod-client-id' : 'dev-client-id',
    authorizationParams: {
      redirect_uri: window.location.origin
    }
  },
  
  dataDogConfig: environment.production ? {
    logs: {
      clientToken: environment.dataDogToken,
      forwardErrorsToLogs: true,
      sampleRate: 100,
      site: 'datadoghq.com'
    },
    realUserMonitoring: {
      applicationId: APPLICATION_NAME,
      clientToken: environment.dataDogToken,
      env: 'production',
      service: APPLICATION_NAME,
      // ... production settings
    }
  } : undefined,  // No DataDog in development
  
  loggingConfig: {
    applicationName: APPLICATION_NAME,
    isProduction: environment.production
  },
  
  errorHandlingConfig: {
    applicationName: APPLICATION_NAME,
    includeDefaultErrorHandling: true
  }
};
```

### AppEnvironment Enum Usage

```typescript
import { AppEnvironment } from '@buildmotion/configuration';

export interface IAppVersionConfig {
  environment: AppEnvironment;
  displayNotification: boolean;
}

// Determine environment
function getEnvironment(): AppEnvironment {
  const hostname = window.location.hostname;
  
  if (hostname.includes('localhost')) {
    return AppEnvironment.local;
  } else if (hostname.includes('dev')) {
    return AppEnvironment.development;
  } else if (hostname.includes('qa')) {
    return AppEnvironment.qa;
  } else if (hostname.includes('stage')) {
    return AppEnvironment.stage;
  } else {
    return AppEnvironment.production;
  }
}

export const appVersionConfig: IAppVersionConfig = {
  environment: getEnvironment(),
  displayNotification: getEnvironment() !== AppEnvironment.production
};
```

---

## 📚 Related Libraries

- **@buildmotion/logging** - Use configuration for logging settings
- **@buildmotion/http-service** - Use configuration for API URLs
- **@buildmotion/feature-flag** - Integrate with feature toggles
- **@buildmotion/error-handling** - Configure error handling behavior

---

## 🔍 See Also

- [Clean Architecture Specification](./angular-clean-architecture.specification.md)
- [Logging Specification](./logging.specification.md)
- [Feature Flag Specification](./feature-flag.specification.md)
