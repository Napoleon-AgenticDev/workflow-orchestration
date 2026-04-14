---
meta:
  id: implementation-details
  title: IMPLEMENTATION DETAILS
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'

meta:
meta:
---

# Analytics Implementation Details - Nx Monorepo

## Overview

This document provides detailed implementation instructions for integrating Google Analytics 4 into the Agent Alchemy.DEV Next.js application within an Nx monorepo structure.

## Workspace Configuration

### Project Structure

```
buildmotion-ai-agency/
├── apps/
│   ├── copilot-agent-alchemy-dev/              # Next.js App
│   │   ├── app/
│   │   │   ├── layout.tsx              # GA4 integration point
│   │   │   ├── globals.css             # Consent banner styles
│   │   │   └── providers.tsx           # Analytics provider setup
│   │   ├── components/
│   │   │   ├── analytics/              # Analytics-specific components
│   │   │   │   ├── consent-banner.tsx
│   │   │   │   ├── performance-monitor.tsx
│   │   │   │   └── event-tracker.tsx
│   │   │   └── sections/               # Enhanced with tracking
│   │   │       ├── hero-section.tsx
│   │   │       ├── learn-section.tsx
│   │   │       └── agenda-section.tsx
│   │   ├── hooks/
│   │   │   └── use-analytics.ts        # App-specific analytics hook
│   │   └── lib/
│   │       └── analytics-config.ts     # App configuration
│   └── docs-site/                      # Future analytics expansion
├── libs/
│   └── shared/
│       └── analytics/                  # Shared analytics library
│           ├── src/
│           │   ├── lib/               # Core services
│           │   │   ├── ga4.service.ts
│           │   │   ├── consent.service.ts
│           │   │   ├── events.types.ts
│           │   │   └── performance.service.ts
│           │   ├── hooks/             # Shared hooks
│           │   │   ├── use-ga4.ts
│           │   │   └── use-consent.ts
│           │   ├── components/        # Reusable components
│           │   │   ├── analytics-provider.tsx
│           │   │   └── consent-manager.tsx
│           │   └── index.ts          # Public API
│           ├── jest.config.ts
│           ├── project.json
│           └── README.md
└── .env.local                         # Environment configuration
```

## Step-by-Step Implementation

### Step 1: Create Shared Analytics Library

#### 1.1 Generate Nx Library

```bash
# Navigate to workspace root
cd /Users/buildmotion/work/github/buildmotion-ai/buildmotion-ai-agency

# Generate shared analytics library
npx nx g @nx/js:library shared-analytics \
  --directory="libs/shared/analytics" \
  --tags="scope:shared,type:util" \
  --buildable \
  --publishable
```

#### 1.2 Configure Library Dependencies

```json
// libs/shared/analytics/project.json
{
  "name": "shared-analytics",
  "$schema": "../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/shared/analytics/src",
  "projectType": "library",
  "tags": ["scope:shared", "type:util"],
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/libs/shared/analytics",
        "main": "libs/shared/analytics/src/index.ts",
        "tsConfig": "libs/shared/analytics/tsconfig.lib.json",
        "assets": []
      }
    },
    "test": {
      "executor": "@nx/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
      "options": {
        "jestConfig": "libs/shared/analytics/jest.config.ts"
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint",
      "outputs": ["{options.outputFile}"],
      "options": {
        "lintFilePatterns": ["libs/shared/analytics/**/*.ts"]
      }
    }
  }
}
```

### Step 2: Install Required Dependencies

#### 2.1 Next.js Third-Parties Package

```bash
# Install @next/third-parties for official GA4 integration
npm install @next/third-parties

# Install TypeScript types for enhanced development
npm install --save-dev @types/gtag
```

#### 2.2 Additional Analytics Dependencies

```bash
# Web Vitals for performance tracking
npm install web-vitals

# Browser storage utilities for consent management
npm install js-cookie
npm install --save-dev @types/js-cookie
```

### Step 3: Core Analytics Service Implementation

#### 3.1 Event Type Definitions

```typescript
// libs/shared/analytics/src/lib/events.types.ts
export interface BaseEvent {
  event_category: 'engagement' | 'conversion' | 'error' | 'performance' | 'user_lifecycle';
  timestamp?: number;
  custom_parameters?: Record<string, any>;
}

export interface ConversionEvent extends BaseEvent {
  event_category: 'conversion';
  value?: number;
  currency?: 'USD';
  transaction_id?: string;
}

export interface EngagementEvent extends BaseEvent {
  event_category: 'engagement';
  interaction_type?: 'scroll' | 'click' | 'hover' | 'view';
  element_id?: string;
}

export interface PerformanceEvent extends BaseEvent {
  event_category: 'performance';
  metric_name: 'CLS' | 'LCP' | 'FID' | 'TTFB' | 'FCP';
  metric_value: number;
}

// Agent Alchemy specific events
export interface AgentAlchemyEvents {
  registration_start: ConversionEvent & {
    source: 'hero' | 'cta_band' | 'floating_cta';
    funnel_step: 1;
  };

  registration_complete: ConversionEvent & {
    method: 'form' | 'modal';
    value: 1;
    funnel_step: 2;
  };

  section_view: EngagementEvent & {
    section_name: 'hero' | 'learn' | 'agenda' | 'faq' | 'instructor';
    visibility_duration?: number;
  };

  guide_download: ConversionEvent & {
    file_name: 'agent-alchemy-guide.pdf';
    source: string;
    value: 0.5;
  };

  calendar_export: EngagementEvent & {
    format: 'ics' | 'google' | 'outlook';
  };
}

export type EventName = keyof AgentAlchemyEvents;
export type EventParameters<T extends EventName> = AgentAlchemyEvents[T];
```

#### 3.2 GA4 Service Implementation

```typescript
// libs/shared/analytics/src/lib/ga4.service.ts
import { EventName, EventParameters } from './events.types';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

interface GA4Config {
  measurementId: string;
  enabled: boolean;
  debug: boolean;
  defaultConsent: {
    ad_storage: 'granted' | 'denied';
    analytics_storage: 'granted' | 'denied';
    functionality_storage: 'granted' | 'denied';
    personalization_storage: 'granted' | 'denied';
    security_storage: 'granted' | 'denied';
    wait_for_update: number;
  };
}

class GA4Service {
  private config: GA4Config;
  private isInitialized = false;

  constructor(config: GA4Config) {
    this.config = config;
  }

  initialize(): void {
    if (!this.config.enabled || this.isInitialized) {
      return;
    }

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];

    // Define gtag function
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };

    // Set default consent
    window.gtag('consent', 'default', this.config.defaultConsent);

    // Configure GA4
    window.gtag('config', this.config.measurementId, {
      debug_mode: this.config.debug,
      send_page_view: true, // Handled by Next.js
    });

    this.isInitialized = true;

    if (this.config.debug) {
      console.log('🔍 GA4 Service initialized with config:', this.config);
    }
  }

  trackEvent<T extends EventName>(eventName: T, parameters: EventParameters<T>): void {
    if (!this.config.enabled || !this.isInitialized) {
      if (this.config.debug) {
        console.log('🔍 [DEBUG] Event tracked (not sent):', eventName, parameters);
      }
      return;
    }

    // Add timestamp if not provided
    const enhancedParameters = {
      ...parameters,
      timestamp: parameters.timestamp || Date.now(),
    };

    window.gtag('event', eventName, enhancedParameters);

    if (this.config.debug) {
      console.log('📊 GA4 Event:', eventName, enhancedParameters);
    }
  }

  trackPageView(page_title: string, page_location: string): void {
    if (!this.config.enabled || !this.isInitialized) {
      return;
    }

    window.gtag('event', 'page_view', {
      page_title,
      page_location,
      timestamp: Date.now(),
    });

    if (this.config.debug) {
      console.log('📊 GA4 Page View:', { page_title, page_location });
    }
  }

  trackConversion<T extends EventName>(eventName: T, parameters: EventParameters<T>): void {
    // Enhanced conversion tracking with additional metadata
    this.trackEvent(eventName, {
      ...parameters,
      event_category: 'conversion',
      is_conversion: true,
    } as EventParameters<T>);
  }

  updateConsent(consentUpdate: Partial<GA4Config['defaultConsent']>): void {
    if (!this.isInitialized) {
      return;
    }

    window.gtag('consent', 'update', consentUpdate);

    if (this.config.debug) {
      console.log('🔒 GA4 Consent Updated:', consentUpdate);
    }
  }

  setUserProperty(property_name: string, property_value: string): void {
    if (!this.config.enabled || !this.isInitialized) {
      return;
    }

    window.gtag('config', this.config.measurementId, {
      custom_map: { [property_name]: property_value },
    });
  }
}

// Singleton instance
let ga4Instance: GA4Service;

export function createGA4Service(config: GA4Config): GA4Service {
  if (!ga4Instance) {
    ga4Instance = new GA4Service(config);
  }
  return ga4Instance;
}

export function getGA4Service(): GA4Service {
  if (!ga4Instance) {
    throw new Error('GA4 Service not initialized. Call createGA4Service first.');
  }
  return ga4Instance;
}

export { GA4Service };
```

#### 3.3 Consent Management Service

```typescript
// libs/shared/analytics/src/lib/consent.service.ts
import Cookies from 'js-cookie';

interface ConsentPreferences {
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  performance: boolean;
}

interface ConsentState {
  hasConsented: boolean;
  preferences: ConsentPreferences;
  consentDate?: Date;
  version: string;
}

const CONSENT_COOKIE_NAME = 'agentalchemy_consent';
const CONSENT_VERSION = '1.0';

class ConsentService {
  private static instance: ConsentService;
  private currentConsent: ConsentState | null = null;

  constructor() {
    this.loadConsentFromStorage();
  }

  static getInstance(): ConsentService {
    if (!ConsentService.instance) {
      ConsentService.instance = new ConsentService();
    }
    return ConsentService.instance;
  }

  private loadConsentFromStorage(): void {
    const savedConsent = Cookies.get(CONSENT_COOKIE_NAME);
    if (savedConsent) {
      try {
        this.currentConsent = JSON.parse(savedConsent);
      } catch (error) {
        console.warn('Failed to parse consent cookie:', error);
        this.currentConsent = null;
      }
    }
  }

  private saveConsentToStorage(consent: ConsentState): void {
    Cookies.set(CONSENT_COOKIE_NAME, JSON.stringify(consent), {
      expires: 365, // 1 year
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }

  getConsent(): ConsentState | null {
    return this.currentConsent;
  }

  hasConsented(): boolean {
    return this.currentConsent?.hasConsented ?? false;
  }

  grantConsent(preferences: ConsentPreferences): void {
    const consent: ConsentState = {
      hasConsented: true,
      preferences,
      consentDate: new Date(),
      version: CONSENT_VERSION,
    };

    this.currentConsent = consent;
    this.saveConsentToStorage(consent);

    // Update GA4 consent
    const { getGA4Service } = require('./ga4.service');
    try {
      const ga4 = getGA4Service();
      ga4.updateConsent({
        analytics_storage: preferences.analytics ? 'granted' : 'denied',
        ad_storage: preferences.marketing ? 'granted' : 'denied',
        functionality_storage: preferences.functional ? 'granted' : 'denied',
        personalization_storage: preferences.performance ? 'granted' : 'denied',
      });
    } catch (error) {
      console.warn('GA4 service not available for consent update:', error);
    }

    // Dispatch custom event for application to react to consent changes
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('consentUpdated', { detail: consent }));
    }
  }

  revokeConsent(): void {
    this.currentConsent = {
      hasConsented: false,
      preferences: {
        analytics: false,
        marketing: false,
        functional: false,
        performance: false,
      },
      version: CONSENT_VERSION,
    };

    this.saveConsentToStorage(this.currentConsent);

    // Update GA4 to deny all storage
    try {
      const { getGA4Service } = require('./ga4.service');
      const ga4 = getGA4Service();
      ga4.updateConsent({
        analytics_storage: 'denied',
        ad_storage: 'denied',
        functionality_storage: 'denied',
        personalization_storage: 'denied',
      });
    } catch (error) {
      console.warn('GA4 service not available for consent update:', error);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('consentRevoked', { detail: this.currentConsent }));
    }
  }

  needsConsentUpdate(): boolean {
    if (!this.currentConsent) return true;
    return this.currentConsent.version !== CONSENT_VERSION;
  }

  getAnalyticsConsent(): boolean {
    return this.currentConsent?.preferences.analytics ?? false;
  }
}

export { ConsentService, type ConsentPreferences, type ConsentState };
```

#### 3.3.1 Consent-Aware Telemetry Helper

**Critical Requirement**: All analytics events MUST check user consent before sending data to Google Analytics or any other tracking service.

```typescript
// libs/shared/analytics/src/lib/consent-helper.ts

/**
 * Consent Helper for Analytics Events
 *
 * This helper provides a centralized consent gate for all analytics operations.
 * It ensures that telemetry events respect user privacy preferences stored in localStorage.
 *
 * Privacy Compliance:
 * - GDPR Article 6(1)(a): Consent as lawful basis for processing
 * - CCPA: Right to opt-out of data collection
 * - Default behavior: No tracking without explicit consent
 */

export interface ConsentStatus {
  hasConsent: boolean;
  consentType?: 'accepted' | 'declined';
  timestamp?: number;
}

/**
 * Check if user has granted analytics consent
 * @returns ConsentStatus object with consent state
 */
export function checkAnalyticsConsent(): ConsentStatus {
  if (typeof window === 'undefined') {
    return { hasConsent: false };
  }

  const consentValue = localStorage.getItem('cookie-consent');

  if (!consentValue) {
    return { hasConsent: false };
  }

  if (consentValue === 'accepted') {
    return {
      hasConsent: true,
      consentType: 'accepted',
      timestamp: Date.now(),
    };
  }

  return {
    hasConsent: false,
    consentType: 'declined',
    timestamp: Date.now(),
  };
}

/**
 * Execute analytics function only if user has granted consent
 * @param fn - Function to execute if consent is granted
 * @param fallbackMessage - Optional message to log when consent is denied
 */
export function withConsent(fn: () => void, fallbackMessage?: string): void {
  const { hasConsent } = checkAnalyticsConsent();

  if (!hasConsent) {
    if (fallbackMessage) {
      console.debug(`[Analytics] ${fallbackMessage} - User has not consented to tracking`);
    }
    return;
  }

  fn();
}

/**
 * Type-safe wrapper for window.gtag with consent checking
 * @param eventName - GA4 event name
 * @param eventParams - Event parameters
 */
export function gtagWithConsent(eventName: string, eventParams?: Record<string, unknown>): void {
  withConsent(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, eventParams);
    }
  }, `Event "${eventName}" blocked`);
}

/**
 * Typed window.gtag interface
 * Use this instead of (window as any).gtag for type safety
 */
declare global {
  interface Window {
    gtag?: (command: 'event' | 'config' | 'consent', targetId: string, config?: Record<string, unknown>) => void;
  }
}

export {};
```

#### 3.3.2 Updated Telemetry Service with Consent Checking

```typescript
// apps/copilot-agent-alchemy-dev/lib/services/telemetry.ts
import { checkAnalyticsConsent, gtagWithConsent } from '@buildmotion-ai-agency/shared-analytics';

export interface AnalyticsEvent {
  event: string;
  properties: Record<string, unknown>;
  timestamp: string;
  sessionId: string;
  userId?: string;
}

export class SpeccraftTelemetryService {
  private static sessionId = typeof window !== 'undefined' ? sessionStorage.getItem('session_id') || Math.random().toString(36).substring(7) : 'server';

  static {
    if (typeof window !== 'undefined' && !sessionStorage.getItem('session_id')) {
      sessionStorage.setItem('session_id', this.sessionId);
    }
  }

  private static createEvent(event: string, properties: Record<string, unknown> = {}): AnalyticsEvent {
    return {
      event,
      properties: {
        ...properties,
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
      },
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    };
  }

  /**
   * Track page view with consent checking
   * Only sends to GA4 if user has granted analytics consent
   */
  static trackPageView(page: string): void {
    const event = this.createEvent('page_view', { page });
    console.log('[Telemetry] Page View:', event);

    // Check consent before sending to GA4
    const { hasConsent } = checkAnalyticsConsent();
    if (!hasConsent) {
      console.debug('[Telemetry] Page view not sent to GA4 - no user consent');
      return;
    }

    // Send to Google Analytics 4 with type safety
    gtagWithConsent('page_view', {
      page_title: typeof document !== 'undefined' ? document.title : page,
      page_location: typeof window !== 'undefined' ? window.location.href : '',
    });
  }

  /**
   * Track CTA clicks with consent checking
   */
  static trackCtaClick(action: 'reserve' | 'guide', location?: string): void {
    const event = this.createEvent('cta_click', {
      action,
      location: location || 'unknown',
      buttonText: action === 'reserve' ? 'Reserve My Seat' : 'Get the Free Guide',
    });
    console.log('[Telemetry] CTA Click:', event);

    // Check consent before sending to GA4
    gtagWithConsent('cta_click', {
      event_category: 'engagement',
      cta_action: action,
      cta_location: location || 'unknown',
      value: action === 'reserve' ? 1 : 0.5,
    });
  }

  /**
   * Track form submissions with consent checking
   */
  static trackFormSubmit(payloadCategory: string): void {
    const event = this.createEvent('form_submit', {
      category: payloadCategory,
      formType: 'registration',
    });
    console.log('[Telemetry] Form Submit:', event);

    // Check consent before sending to GA4
    gtagWithConsent('registration_complete', {
      event_category: 'conversion',
      form_category: payloadCategory,
      form_type: 'registration',
      value: 1,
    });
  }

  static trackDownload(asset: 'guide' | 'ics'): void {
    const event = this.createEvent('download', {
      asset,
      assetName: asset === 'guide' ? 'Copilot Guide to Developer Experience Automation' : 'Webinar Calendar Invite',
    });
    console.log('[Telemetry] Download:', event);
    // TODO: Send to analytics service with consent checking
  }

  /**
   * Track section views with consent checking
   */
  static trackSectionView(section: string): void {
    const event = this.createEvent('section_view', { section });
    console.log('[Telemetry] Section View:', event);

    // Check consent before sending to GA4
    gtagWithConsent('section_view', {
      event_category: 'engagement',
      section_name: section,
    });
  }

  static trackFormError(field: string, error: string): void {
    const event = this.createEvent('form_error', { field, error });
    console.log('[Telemetry] Form Error:', event);
    // TODO: Send to analytics service with consent checking
  }

  /**
   * Track user engagement with consent checking
   */
  static trackEngagement(action: string, element: string, duration?: number): void {
    const event = this.createEvent('engagement', {
      action,
      element,
      duration: duration || 0,
    });
    console.log('[Telemetry] Engagement:', event);

    // Check consent before sending to GA4
    gtagWithConsent('user_engagement', {
      event_category: 'engagement',
      engagement_action: action,
      engagement_element: element,
      engagement_time_msec: duration || 0,
    });
  }
}
```

**Key Privacy Implementation Details:**

1. **Consent Gate**: All GA4 event tracking methods check `localStorage.getItem('cookie-consent')` before sending data
2. **Type Safety**: Using typed `window.gtag` interface instead of `(window as any).gtag` casts
3. **Graceful Degradation**: Events are logged locally but not sent to GA4 when consent is denied
4. **Debug Visibility**: Console messages indicate when events are blocked due to lack of consent
5. **GDPR Compliance**: Default behavior is to block all tracking until explicit consent is granted

**Privacy Benefits:**

- **No tracking without consent**: Events are never sent to GA4 until user accepts cookies
- **Transparent behavior**: Debug messages show when and why events are blocked
- **Audit trail**: All telemetry calls are logged locally for debugging, regardless of consent
- **Type safety**: Eliminates runtime errors from incorrect gtag usage
- **Centralized control**: Single consent helper can be used across all telemetry services

#### 3.4 Performance Monitoring Service

```typescript
// libs/shared/analytics/src/lib/performance.service.ts
import { getGA4Service } from './ga4.service';

type MetricName = 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';

interface PerformanceMetric {
  name: MetricName;
  value: number;
  id: string;
  navigationType: string;
}

class PerformanceService {
  private static instance: PerformanceService;
  private isInitialized = false;

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    try {
      // Dynamic import to avoid SSR issues
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals');

      // Track Core Web Vitals
      getCLS(this.onMetric.bind(this));
      getFID(this.onMetric.bind(this));
      getFCP(this.onMetric.bind(this));
      getLCP(this.onMetric.bind(this));
      getTTFB(this.onMetric.bind(this));

      this.isInitialized = true;
      console.log('📊 Performance monitoring initialized');
    } catch (error) {
      console.warn('Failed to initialize performance monitoring:', error);
    }
  }

  private onMetric(metric: PerformanceMetric): void {
    try {
      const ga4 = getGA4Service();

      ga4.trackEvent('core_web_vital', {
        event_category: 'performance',
        metric_name: metric.name,
        metric_value: Math.round(metric.value),
        navigation_type: metric.navigationType,
        timestamp: Date.now(),
      });

      console.log(`📏 ${metric.name}:`, Math.round(metric.value));
    } catch (error) {
      console.warn('Failed to track performance metric:', error);
    }
  }

  trackCustomPerformance(name: string, value: number): void {
    try {
      const ga4 = getGA4Service();
      ga4.trackEvent('custom_performance', {
        event_category: 'performance',
        custom_metric_name: name,
        custom_metric_value: value,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.warn('Failed to track custom performance metric:', error);
    }
  }
}

export { PerformanceService };
```

### Step 4: React Components and Hooks

#### 4.1 Analytics Provider Component

```typescript
// libs/shared/analytics/src/components/analytics-provider.tsx
'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { createGA4Service, GA4Service } from '../lib/ga4.service';
import { ConsentService } from '../lib/consent.service';
import { PerformanceService } from '../lib/performance.service';

interface AnalyticsContextValue {
  ga4: GA4Service;
  consent: ConsentService;
  performance: PerformanceService;
  isReady: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
  measurementId: string;
  enabled?: boolean;
  debug?: boolean;
}

export function AnalyticsProvider({ children, measurementId, enabled = true, debug = false }: AnalyticsProviderProps): JSX.Element {
  const [isReady, setIsReady] = React.useState(false);

  // Initialize services
  const ga4 = React.useMemo(() => {
    return createGA4Service({
      measurementId,
      enabled,
      debug,
      defaultConsent: {
        ad_storage: 'denied',
        analytics_storage: 'denied',
        functionality_storage: 'denied',
        personalization_storage: 'denied',
        security_storage: 'granted',
        wait_for_update: 500,
      },
    });
  }, [measurementId, enabled, debug]);

  const consent = React.useMemo(() => ConsentService.getInstance(), []);
  const performance = React.useMemo(() => PerformanceService.getInstance(), []);

  useEffect(() => {
    const initializeAnalytics = async () => {
      if (typeof window === 'undefined') return;

      // Initialize GA4
      ga4.initialize();

      // Initialize performance monitoring
      await performance.initialize();

      // Check for existing consent
      const existingConsent = consent.getConsent();
      if (existingConsent && existingConsent.preferences.analytics) {
        ga4.updateConsent({
          analytics_storage: 'granted',
        });
      }

      setIsReady(true);
    };

    initializeAnalytics();
  }, [ga4, consent, performance]);

  const contextValue: AnalyticsContextValue = {
    ga4,
    consent,
    performance,
    isReady,
  };

  return <AnalyticsContext.Provider value={contextValue}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics(): AnalyticsContextValue {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}
```

#### 4.2 Consent Banner Component

```typescript
// libs/shared/analytics/src/components/consent-manager.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAnalytics } from './analytics-provider';
import type { ConsentPreferences } from '../lib/consent.service';

interface ConsentManagerProps {
  brandName?: string;
  privacyPolicyUrl?: string;
  className?: string;
}

export function ConsentManager({ brandName = 'Agent Alchemy.DEV', privacyPolicyUrl = '/privacy', className = '' }: ConsentManagerProps): JSX.Element | null {
  const { consent } = useAnalytics();
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    const hasConsented = consent.hasConsented();
    const needsUpdate = consent.needsConsentUpdate();
    setShowBanner(!hasConsented || needsUpdate);
  }, [consent]);

  const handleAcceptAll = () => {
    const preferences: ConsentPreferences = {
      analytics: true,
      marketing: false, // Keep conservative for startup
      functional: true,
      performance: true,
    };

    consent.grantConsent(preferences);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleRejectAll = () => {
    const preferences: ConsentPreferences = {
      analytics: false,
      marketing: false,
      functional: false,
      performance: false,
    };

    consent.grantConsent(preferences);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleCustomPreferences = (preferences: ConsentPreferences) => {
    consent.grantConsent(preferences);
    setShowBanner(false);
    setShowPreferences(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <>
      {/* Consent Banner */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 p-4 ${className}`}
        role="dialog"
        aria-labelledby="consent-title"
        aria-describedby="consent-description"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h3 id="consent-title" className="text-lg font-semibold text-gray-900">
                🍪 Privacy & Analytics
              </h3>
              <p id="consent-description" className="text-sm text-gray-600 mt-1">
                We use analytics to improve your experience on {brandName}. Your privacy is important to us.{' '}
                <a href={privacyPolicyUrl} className="underline text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">
                  Learn more
                </a>
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <button
                onClick={() => setShowPreferences(true)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Customize
              </button>
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Accept Analytics
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preference Modal */}
      {showPreferences && <ConsentPreferencesModal onSave={handleCustomPreferences} onClose={() => setShowPreferences(false)} brandName={brandName} />}
    </>
  );
}

// Preference Modal Component
interface ConsentPreferencesModalProps {
  onSave: (preferences: ConsentPreferences) => void;
  onClose: () => void;
  brandName: string;
}

function ConsentPreferencesModal({ onSave, onClose, brandName }: ConsentPreferencesModalProps): JSX.Element {
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    analytics: true,
    marketing: false,
    functional: true,
    performance: true,
  });

  const handleSave = () => {
    onSave(preferences);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Privacy Preferences</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Analytics */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-600">Help us improve our content and understand how visitors use {brandName}.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Performance */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Performance</h3>
                <p className="text-sm text-gray-600">Monitor site performance and loading times to optimize your experience.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={preferences.performance}
                  onChange={(e) => setPreferences({ ...preferences, performance: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Functional */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Functional</h3>
                <p className="text-sm text-gray-600">Remember your preferences and enable site features that enhance your experience.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={preferences.functional}
                  onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after-border-white after:content[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Step 5: Nx Library Public API

#### 5.1 Export All Services and Components

```typescript
// libs/shared/analytics/src/index.ts
// Core services
export { GA4Service, createGA4Service, getGA4Service } from './lib/ga4.service';
export { ConsentService } from './lib/consent.service';
export { PerformanceService } from './lib/performance.service';

// Types
export type { BaseEvent, ConversionEvent, EngagementEvent, PerformanceEvent, AgentAlchemyEvents, EventName, EventParameters } from './lib/events.types';

export type { ConsentPreferences, ConsentState } from './lib/consent.service';

// Components
export { AnalyticsProvider, useAnalytics } from './components/analytics-provider';
export { ConsentManager } from './components/consent-manager';

// Hooks
export { useGA4 } from './hooks/use-ga4';
export { useConsent } from './hooks/use-consent';
```

#### 5.2 Custom Hooks for Enhanced DX

```typescript
// libs/shared/analytics/src/hooks/use-ga4.ts
import { useCallback } from 'react';
import { useAnalytics } from '../components/analytics-provider';
import type { EventName, EventParameters } from '../lib/events.types';

export function useGA4() {
  const { ga4, isReady } = useAnalytics();

  const trackEvent = useCallback(
    <T extends EventName>(eventName: T, parameters: EventParameters<T>) => {
      if (isReady) {
        ga4.trackEvent(eventName, parameters);
      }
    },
    [ga4, isReady]
  );

  const trackPageView = useCallback(
    (page_title: string, page_location: string) => {
      if (isReady) {
        ga4.trackPageView(page_title, page_location);
      }
    },
    [ga4, isReady]
  );

  const trackConversion = useCallback(
    <T extends EventName>(eventName: T, parameters: EventParameters<T>) => {
      if (isReady) {
        ga4.trackConversion(eventName, parameters);
      }
    },
    [ga4, isReady]
  );

  return {
    trackEvent,
    trackPageView,
    trackConversion,
    isReady,
  };
}

// libs/shared/analytics/src/hooks/use-consent.ts
import { useState, useEffect, useCallback } from 'react';
import { useAnalytics } from '../components/analytics-provider';
import type { ConsentPreferences, ConsentState } from '../lib/consent.service';

export function useConsent() {
  const { consent } = useAnalytics();
  const [consentState, setConsentState] = useState<ConsentState | null>(null);

  useEffect(() => {
    const currentConsent = consent.getConsent();
    setConsentState(currentConsent);

    // Listen for consent updates
    const handleConsentUpdate = (event: CustomEvent<ConsentState>) => {
      setConsentState(event.detail);
    };

    const handleConsentRevoke = (event: CustomEvent<ConsentState>) => {
      setConsentState(event.detail);
    };

    window.addEventListener('consentUpdated', handleConsentUpdate as EventListener);
    window.addEventListener('consentRevoked', handleConsentRevoke as EventListener);

    return () => {
      window.removeEventListener('consentUpdated', handleConsentUpdate as EventListener);
      window.removeEventListener('consentRevoked', handleConsentRevoke as EventListener);
    };
  }, [consent]);

  const grantConsent = useCallback(
    (preferences: ConsentPreferences) => {
      consent.grantConsent(preferences);
    },
    [consent]
  );

  const revokeConsent = useCallback(() => {
    consent.revokeConsent();
  }, [consent]);

  return {
    consentState,
    hasConsented: consentState?.hasConsented ?? false,
    preferences: consentState?.preferences,
    needsConsentUpdate: consent.needsConsentUpdate(),
    grantConsent,
    revokeConsent,
    getAnalyticsConsent: consent.getAnalyticsConsent.bind(consent),
  };
}
```

### Step 6: Next.js Application Integration

#### 6.1 Environment Configuration

```bash
# apps/copilot-agent-alchemy-dev/.env.local
# Don't track in development
NODE_ENV=development
NEXT_PUBLIC_GA_MEASUREMENT_ID=

# apps/copilot-agent-alchemy-dev/.env.production
NODE_ENV=production
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-TY1G9W8P75
NEXT_PUBLIC_CONSENT_REQUIRED=true
NEXT_PUBLIC_GA_DEBUG=false
```

#### 6.2 Root Layout Integration

```typescript
// apps/copilot-agent-alchemy-dev/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { GoogleAnalytics } from '@next/third-parties/google';
import { AnalyticsProvider, ConsentManager } from '@buildmotion-ai-agency/shared-analytics';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!;
const GA_ENABLED = !!GA_MEASUREMENT_ID && process.env.NODE_ENV === 'production';
const GA_DEBUG = process.env.NEXT_PUBLIC_GA_DEBUG === 'true';

export const metadata: Metadata = {
  title: 'Agent Alchemy.DEV - Master AI-Powered Development',
  description: 'Learn to leverage AI tools like GitHub Copilot for 10x developer productivity...',
  // ... other metadata
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AnalyticsProvider measurementId={GA_MEASUREMENT_ID} enabled={GA_ENABLED} debug={GA_DEBUG}>
          {children}
          <ConsentManager brandName="Agent Alchemy.DEV" privacyPolicyUrl="/privacy" />
        </AnalyticsProvider>

        {/* Next.js Third Parties GA4 Integration */}
        {GA_ENABLED && <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />}
      </body>
    </html>
  );
}
```

#### 6.3 Enhanced Component Integration

```typescript
// apps/copilot-agent-alchemy-dev/components/sections/hero-section.tsx (Enhanced with tracking)
'use client';

import { useGA4 } from '@buildmotion-ai-agency/shared-analytics';

export function HeroSection() {
  const { trackEvent, trackConversion } = useGA4();

  const handleRegistrationClick = () => {
    // Track engagement
    trackEvent('registration_start', {
      event_category: 'engagement',
      source: 'hero',
      funnel_step: 1,
    });

    // Business logic for registration
    // ... existing registration logic
  };

  const handleLearnMoreClick = (sectionName: string) => {
    trackEvent('section_interaction', {
      event_category: 'engagement',
      section_name: sectionName as any,
      interaction_type: 'click',
    });
  };

  return (
    <section className="hero-section">
      {/* ... existing hero content */}
      <button onClick={handleRegistrationClick} className="cta-button">
        Register Now
      </button>

      <button onClick={() => handleLearnMoreClick('hero')} className="learn-more-button">
        Learn More
      </button>
    </section>
  );
}
```

### Step 7: Testing and Validation

#### 7.1 Development Testing

```bash
# Start development server with debug mode
NEXT_PUBLIC_GA_DEBUG=true npm run dev

# Check console for analytics events
# Verify consent banner appears on first visit
# Test event tracking in browser dev tools
```

#### 7.2 Build and Production Testing

```bash
# Build with production GA configuration
npm run build

# Start production server locally
npm run start

# Validate in GA4 Real-time reports
# Check DebugView in GA4 for event validation
```

#### 7.3 E2E Testing Configuration

```typescript
// apps/copilot-agent-alchemy-dev-e2e/src/e2e/analytics.spec.ts
import { test, expect } from '@playwright/test';

test('analytics consent and tracking', async ({ page }) => {
  // Mock GA4 to avoid real tracking in tests
  await page.route('https://www.googletagmanager.com/gtag/**', (route) => {
    route.fulfill({ status: 200, body: 'mocked' });
  });

  await page.goto('/');

  // Verify consent banner appears
  await expect(page.locator('[role="dialog"]')).toContainText('Privacy & Analytics');

  // Accept consent
  await page.click('button:has-text("Accept Analytics")');

  // Verify banner disappears
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);

  // Test event tracking
  await page.click('button:has-text("Register Now")');

  // Verify gtag calls (would need to mock properly)
  // This is a simplified example
});
```

## Nx Workspace Benefits

### Shared Library Architecture

- **Consistency**: Same analytics implementation across all apps
- **Maintainability**: Single source of truth for analytics logic
- **Type Safety**: Shared TypeScript definitions across workspace
- **Testability**: Centralized testing for analytics functionality

### Build Optimization

```json
// nx.json - Optimize analytics library builds
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"]
    }
  }
}
```

### Development Workflow

```bash
# Develop analytics library in isolation
npx nx test shared-analytics

# Build all apps that depend on analytics
npx nx run-many --target=build --projects=copilot-agent-alchemy-dev,docs-site

# Lint analytics implementation
npx nx lint shared-analytics
```

This implementation provides a scalable, type-safe, and privacy-compliant analytics solution that leverages the full power of Nx monorepo architecture while maintaining the flexibility to expand to additional applications in the future.
