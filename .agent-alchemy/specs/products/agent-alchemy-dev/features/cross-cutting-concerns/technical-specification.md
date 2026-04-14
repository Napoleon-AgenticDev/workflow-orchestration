---

meta:
id: products-agent-alchemy-dev-features-cross-cutting-concerns-technical-specification-md
  title: Technical Specification
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'

meta:
meta:

---

# Cross-Cutting Concerns – Technical Specification

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│ Angular Bootstrap (apps/agent-alchemy-dev/src/app/app.config.ts)
│  • provideZoneChangeDetection / provideRouter / provideAnimations
│  • providePrimeNG (Tailwind preset)
│  • importProvidersFrom(
│        ConfigurationModule,
│        LoggingModule,
│        ErrorHandlingModule,
│        HttpServiceModule,
│        AuthModule,
│        Auth0Module,
│        LayoutsModule(menu)
│    )
│  • SUPABASE_CONFIG token
│  • APP_INITIALIZER chain (ConfigurationService + Logging writer)
└──────────────┬───────────────────────────────────────────┘
               │
               ↓
      ┌────────────────────────────┐
      │ ConfigurationContext<IConfiguration> │
      │  backed by APP_CONFIG (app-config.ts) │
      └──────────────┬─────────────────────┘
                     │
   ┌─────────────────┴────────────────┐
   │ Shared Libraries                 │
   │ • @buildmotion/configuration     │
   │ • @buildmotion/logging           │
   │ • @buildmotion/error-handling    │
   │ • @buildmotion/http-service      │
   │ • @buildmotion-ai/agency-layouts │
   └──────────────────────────────────┘
```

## 2. Configuration Contract

`apps/agent-alchemy-dev/src/config/app-config.ts`

```ts
interface IConfiguration {
  apiConfig: IHttpOptions;
  auth0Config: AuthConfig;
  dataDogConfig?: DataDogOptions;
  errorHandlingConfig?: ErrorHandlingOptions;
  loggingConfig: ILoggingConfig;
  siteConfig: ISiteConfig;
  supabase: SupabaseConfig;
}
```

Key sections:
- **API** – base URL + derived endpoints for `HttpServiceModule`.
- **Auth0** – domain, clientId, redirect URI.
- **Logging / DataDog** – console + optional DataDog transport toggles.
- **Error Handling** – global error boundary + notification flags.
- **Supabase** – URL + anon key injected via `SUPABASE_CONFIG`.
- **Site Metadata / Menu** – used by LayoutsModule to render the shell.

## 3. Provider Responsibilities

| Provider | Responsibility | Notes |
| --- | --- | --- |
| `ConfigurationModule.forRoot` | Pushes `APP_CONFIG` into `ConfigurationService` and Observable streams. | Enables DI-based config access without importing the raw object. |
| `LoggingModule.forRoot` | Configures console + DataDog logging transports. | Accepts `DataDogOptions` (optional). |
| `ErrorHandlingModule.forRoot` | Registers global error handler + notification hooks. | Leverages config for app name + default handling flag. |
| `HttpServiceModule.forRoot` | Centralizes HTTP client defaults (base URL, interceptors). | Reused by data-access libs. |
| `AuthModule.forRoot` + `Auth0Module.forRoot` | Initializes Auth0 Angular SDK and workspace wrappers. | Requires valid domain/clientId to complete login. |
| `LayoutsModule.forRoot(menu)` | Provides layout shell + menu injection token. | Menu defined in `menu.config.ts`. |
| `providePrimeNG` | Global theme + ripple configuration. | Uses Tailwind preset to keep parity with agency app. |
| `SUPABASE_CONFIG` token | Supplies Supabase credentials to `@buildmotion-ai/agency-supabase` services. | Format matches `SupabaseConfig`. |
| `APP_INITIALIZER` factories | `initializeConfiguration` hydrates `ConfigurationService`. `initializeLogWriter` attaches `ConsoleWriter`. | Executed before bootstrapping. |

## 4. Data Flow

1. `APP_CONFIG` created at build time (can be swapped per environment).
2. `ConfigurationModule` stores the config inside `ConfigurationService`.
3. Dependent services resolve settings using DI rather than importing raw files.
4. Menu + layout providers consume the config/menu to render navigation.
5. Supabase, Auth0, and HTTP modules read their respective sections to establish connections.

## 5. Security & Compliance

- Secrets in `APP_CONFIG` are placeholders; real values must come from environment injection (CI, runtime fetch, or secure build tooling).
- `ConfigurationService` should never expose secrets directly to templates; only services should consume sensitive sections.
- Logging defaults to console to avoid leaking data if DataDog keys are absent.

## 6. Performance Considerations

- All heavy initialization stays inside providers that lazily instantiate services; APP_INITIALIZER functions only hydrate configuration/logging.
- `provideZoneChangeDetection({ eventCoalescing: true })` reduces change-detection churn.
- LayoutsModule uses memoized menu config to avoid re-render overhead.

## 7. Extension Points

- Add feature flags: extend `IConfiguration` and feed `FeatureFlagModule.forRoot`.
- Wire telemetry: add another provider block referencing `APP_CONFIG.telemetry`.
- Multi-tenant menus: compute menu builder from `ConfigurationService` settings before passing into `LayoutsModule`.

---

**Owner:** Architecture Guild  
**Last Updated:** 2026-02-16
