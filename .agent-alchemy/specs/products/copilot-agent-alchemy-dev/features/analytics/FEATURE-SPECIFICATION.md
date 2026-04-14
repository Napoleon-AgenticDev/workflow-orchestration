---
meta:
  id: feature-specification
  title: FEATURE SPECIFICATION
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'

meta:
meta:
---

# Analytics Feature Specification

## Overview

This specification defines the analytics implementation for Agent Alchemy.DEV using Google Analytics 4 with Next.js official integration in an Nx monorepo environment.

> **Implementation Status**: ✅ Complete & Production Ready - This specification has been fully implemented with privacy-first analytics, shared library architecture, and comprehensive testing. See [`/documentation/technical/ga4-implementation-status.md`](../../../documentation/technical/ga4-implementation-status.md) for detailed implementation status and alignment.

## Feature Details

### Business Requirements

- **Goal**: Track user behavior and conversion funnel for Agent Alchemy.DEV
- **Cost Constraint**: $0 monthly budget (bootstrap/solo startup)
- **Privacy Compliance**: GDPR/CCPA compliant with user consent
- **Performance**: Minimal impact on Core Web Vitals and page load times
- **Scalability**: Support multiple applications in Nx workspace

### Technical Requirements

- **Framework**: Next.js 14+ with App Router
- **Integration**: @next/third-parties (official Next.js package)
- **Architecture**: Nx monorepo with shared libraries
- **TypeScript**: Full type safety
- **Privacy**: Consent-based tracking with local storage
- **Environments**: Development, staging, production configurations

### Privacy & Consent Requirements

**Critical Requirement**: All analytics events MUST respect user privacy preferences.

#### Consent Enforcement

- **Default State**: No tracking until explicit user consent is granted
- **Consent Storage**: User preferences stored in `localStorage` under `cookie-consent` key
- **Consent Values**:
  - `'accepted'` - User has granted analytics consent
  - `'declined'` - User has explicitly declined analytics
  - `null/undefined` - No consent decision made yet
- **Event Blocking**: All GA4 `gtag()` calls must check consent before execution

#### Implementation Requirements

```typescript
// All telemetry services must implement consent checking
interface TelemetryService {
  // Before sending any event
  trackEvent(event: string, params: Record<string, unknown>): void {
    // 1. Check consent status
    const consent = localStorage.getItem('cookie-consent');

    // 2. Block tracking if consent not granted
    if (consent !== 'accepted') {
      console.debug(`Event blocked - no user consent: ${event}`);
      return;
    }

    // 3. Only send to GA4 if consent is granted
    if (window.gtag) {
      window.gtag('event', event, params);
    }
  }
}
```

#### Privacy Compliance Standards

- **GDPR Article 6(1)(a)**: Consent as lawful basis for data processing
- **CCPA Compliance**: Right to opt-out of data collection honored
- **Transparent Behavior**: Console messages indicate when events are blocked
- **Type Safety**: Use typed `window.gtag` interface, not `(window as any).gtag`
- **Audit Trail**: Local logging of all telemetry events regardless of consent status

#### Protected Event Types

All events must be consent-gated, including but not limited to:

- `page_view` - Page navigation tracking
- `cta_click` - Call-to-action button clicks
- `registration_complete` - Form submission conversions
- `section_view` - Content engagement tracking
- `user_engagement` - User interaction metrics
- `core_web_vital` - Performance monitoring events

#### Testing Consent Enforcement

```typescript
// Test cases required for all telemetry services
describe('Telemetry Consent Enforcement', () => {
  it('should NOT send events when consent is declined', () => {
    localStorage.setItem('cookie-consent', 'declined');
    const gtagSpy = jest.spyOn(window, 'gtag');

    TelemetryService.trackPageView('/test');

    expect(gtagSpy).not.toHaveBeenCalled();
  });

  it('should send events when consent is accepted', () => {
    localStorage.setItem('cookie-consent', 'accepted');
    const gtagSpy = jest.spyOn(window, 'gtag');

    TelemetryService.trackPageView('/test');

    expect(gtagSpy).toHaveBeenCalledWith('event', 'page_view', expect.any(Object));
  });

  it('should NOT send events when no consent decision made', () => {
    localStorage.removeItem('cookie-consent');
    const gtagSpy = jest.spyOn(window, 'gtag');

    TelemetryService.trackPageView('/test');

    expect(gtagSpy).not.toHaveBeenCalled();
  });
});
```

## Google Analytics 4 Configuration

### Production Stream Details

```
Measurement ID: G-TY1G9W8P75
Stream ID: 13576204731
Stream URL: https://copilot.agentalchemy.dev
Stream Name: Copilot.AgentAlchemy.DEV
Property: Agent Alchemy DEV
```

### Environment Configuration

```typescript
interface AnalyticsConfig {
  development: {
    enabled: false; // No tracking in development
    measurementId: undefined;
  };
  staging: {
    enabled: true;
    measurementId: 'G-STAGING123456'; // Separate staging property
  };
  production: {
    enabled: true;
    measurementId: 'G-TY1G9W8P75'; // Production stream
  };
}
```

## Design Architecture

### Nx Workspace Structure

```
apps/
├── copilot-agent-alchemy-dev/          # Next.js application
│   ├── app/layout.tsx           # GA4 integration point
│   ├── lib/analytics.ts         # App-specific analytics
│   └── components/              # Analytics-enhanced components
libs/
└── shared/
    └── analytics/               # Shared analytics library
        ├── src/
        │   ├── lib/
        │   │   ├── ga4.service.ts     # GA4 service abstraction
        │   │   ├── events.types.ts    # Event type definitions
        │   │   └── consent.service.ts # Consent management
        │   └── index.ts
        └── project.json
```

### Component Integration Pattern

```typescript
// Shared analytics service pattern
import { GA4Service } from '@buildmotion-ai-agency/shared-analytics';

export function useAnalytics() {
  return {
    trackEvent: GA4Service.trackEvent,
    trackPageView: GA4Service.trackPageView,
    trackConversion: GA4Service.trackConversion,
  };
}
```

## Event Tracking Specifications

### Core Business Events

```typescript
interface AgentAlchemyEvents {
  // Registration Funnel (Primary Conversion)
  registration_start: {
    event_category: 'engagement';
    source: 'hero' | 'cta_band' | 'floating_cta';
  };

  registration_complete: {
    event_category: 'conversion';
    method: 'form' | 'modal';
    value: 1; // Conversion value
  };

  registration_abandon: {
    event_category: 'engagement';
    fields_completed: number;
    abandonment_point: string;
  };

  // Content Engagement
  section_view: {
    event_category: 'engagement';
    section_name: 'hero' | 'learn' | 'agenda' | 'faq' | 'instructor';
    visibility_duration?: number;
  };

  section_interaction: {
    event_category: 'engagement';
    section_name: string;
    interaction_type: 'scroll' | 'click' | 'hover';
  };

  // Lead Magnets & Downloads
  guide_download: {
    event_category: 'conversion';
    file_name: 'agent-alchemy-guide.pdf';
    source: string;
    value: 0.5; // Lead value
  };

  calendar_export: {
    event_category: 'engagement';
    format: 'ics' | 'google' | 'outlook';
  };

  // User Journey & Navigation
  page_view: {
    page_title: string;
    page_location: string;
    referrer?: string;
  };

  external_link_click: {
    event_category: 'engagement';
    link_url: string;
    link_text: string;
  };

  // Technical & Performance
  core_web_vital: {
    event_category: 'performance';
    metric_name: 'CLS' | 'LCP' | 'FID' | 'TTFB';
    metric_value: number;
  };

  error_occurred: {
    event_category: 'error';
    error_type: 'javascript' | 'network' | 'form_validation';
    error_message: string;
    page_location: string;
  };
}
```

### Advanced GA4 Features Implementation

#### 1. Enhanced Ecommerce (Future Revenue Streams)

```typescript
// For when paid tiers are added
interface EcommerceEvents {
  purchase: {
    transaction_id: string;
    value: number;
    currency: 'USD';
    items: Array<{
      item_id: string;
      item_name: string;
      category: string;
      price: number;
    }>;
  };

  view_item: {
    currency: 'USD';
    value: number;
    items: Array<{
      item_id: 'training_program' | 'consulting' | 'workshop';
      item_name: string;
      category: 'education';
    }>;
  };
}
```

#### 2. Audience Segmentation

```typescript
// Custom dimensions for business insights
interface CustomDimensions {
  user_type: 'first_time' | 'returning' | 'registered';
  traffic_source: 'organic' | 'social' | 'direct' | 'referral';
  engagement_level: 'low' | 'medium' | 'high';
  device_category: 'mobile' | 'desktop' | 'tablet';
  content_preference: 'video' | 'text' | 'interactive';
}
```

#### 3. Conversion Attribution

```typescript
// Attribution modeling for multi-touch journey
interface AttributionTracking {
  first_touch: {
    source: string;
    medium: string;
    campaign: string;
    timestamp: string;
  };
  last_touch: {
    source: string;
    medium: string;
    campaign: string;
    timestamp: string;
  };
  conversion_path: Array<{
    touchpoint: string;
    timestamp: string;
  }>;
}
```

## Configuration Management

### Environment Variables

```bash
# apps/copilot-agent-alchemy-dev/.env.local (development)
NODE_ENV=development
NEXT_PUBLIC_GA_MEASUREMENT_ID= # Disabled in development

# apps/copilot-agent-alchemy-dev/.env.staging
NODE_ENV=staging
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-STAGING123456
NEXT_PUBLIC_GA_DEBUG=true

# apps/copilot-agent-alchemy-dev/.env.production
NODE_ENV=production
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-TY1G9W8P75
NEXT_PUBLIC_CONSENT_REQUIRED=true
NEXT_PUBLIC_DEFAULT_CONSENT=denied
```

### Workspace Configuration

```json
// nx.json - Analytics library configuration
{
  "projects": {
    "shared-analytics": {
      "projectType": "library",
      "sourceRoot": "libs/shared/analytics/src",
      "tags": ["scope:shared", "type:util"]
    }
  }
}
```

## Implementation Status

### ✅ Phase 1: Core Setup - COMPLETE

- [x] Install @next/third-parties package
- [x] Create shared analytics Nx library (`libs/shared/analytics/`)
- [x] Implement basic GA4 integration
- [x] Add environment configuration
- [x] Set up development/production environments

### ✅ Phase 2: Event Tracking - COMPLETE

- [x] Implement core business events
- [x] Add custom event tracking service (`SpeccraftTelemetryService`)
- [x] Integrate with existing components
- [x] Add TypeScript event definitions
- [x] Test event firing in GA4 debug mode

### ✅ Phase 3: Privacy & Compliance - COMPLETE

- [x] Implement consent management (`consent-helper.ts`)
- [x] Add cookie consent banner (`ConsentBanner` component)
- [x] Configure GA4 consent mode
- [x] Update privacy policy
- [x] Test GDPR compliance flows

### ✅ Phase 4: Testing & Quality Assurance - COMPLETE

- [x] Add unit test coverage (Jest with jsdom)
- [x] Implement E2E tests (Playwright)
- [x] Create comprehensive test scenarios
- [x] Validate consent enforcement
- [x] Configure build and test automation

### 🔄 Phase 5: Future Enhancements (Optional)

- [ ] Add performance monitoring
- [ ] Implement error tracking
- [ ] Set up conversion goals in GA4
- [ ] Create custom audiences
- [ ] Configure attribution reports

## Usage Examples

### Basic Page View Tracking

```typescript
// apps/copilot-agent-alchemy-dev/app/layout.tsx
import { GoogleAnalytics } from '@next/third-parties/google';
import { AnalyticsProvider } from '@buildmotion-ai-agency/shared-analytics';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AnalyticsProvider measurementId="G-TY1G9W8P75">{children}</AnalyticsProvider>
        <GoogleAnalytics gaId="G-TY1G9W8P75" />
      </body>
    </html>
  );
}
```

### Component Event Tracking

```typescript
// apps/copilot-agent-alchemy-dev/components/sections/hero-section.tsx
import { useAnalytics } from '@buildmotion-ai-agency/shared-analytics';

export function HeroSection() {
  const { trackEvent } = useAnalytics();

  const handleRegistrationClick = () => {
    trackEvent('registration_start', {
      event_category: 'engagement',
      source: 'hero',
      timestamp: Date.now(),
    });
  };

  return (
    <section>
      <button onClick={handleRegistrationClick}>Register Now</button>
    </section>
  );
}
```

### Advanced Conversion Tracking

```typescript
// apps/copilot-agent-alchemy-dev/components/forms/registration-form.tsx
import { useAnalytics, ConversionEvents } from '@buildmotion-ai-agency/shared-analytics';

export function RegistrationForm() {
  const { trackConversion, trackEvent } = useAnalytics();

  const handleSubmit = async (data: FormData) => {
    try {
      await submitRegistration(data);

      // Track successful conversion
      trackConversion('registration_complete', {
        event_category: 'conversion',
        method: 'form',
        value: 1,
        currency: 'USD',
      });

      // Track for custom audience building
      trackEvent('registered_user', {
        event_category: 'user_lifecycle',
        user_type: 'new_registrant',
      });
    } catch (error) {
      trackEvent('registration_error', {
        event_category: 'error',
        error_type: 'form_submission',
        error_message: error.message,
      });
    }
  };

  return <form onSubmit={handleSubmit}>{/* Form fields */}</form>;
}
```

### Performance Monitoring Integration

```typescript
// apps/copilot-agent-alchemy-dev/components/seo/performance-monitor.tsx
import { useAnalytics } from '@buildmotion-ai-agency/shared-analytics';
import { useEffect } from 'react';

export function PerformanceMonitor() {
  const { trackPerformance } = useAnalytics();

  useEffect(() => {
    // Track Core Web Vitals
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS((metric) => trackPerformance('CLS', metric.value));
      getFID((metric) => trackPerformance('FID', metric.value));
      getFCP((metric) => trackPerformance('FCP', metric.value));
      getLCP((metric) => trackPerformance('LCP', metric.value));
      getTTFB((metric) => trackPerformance('TTFB', metric.value));
    });
  }, [trackPerformance]);

  return null; // No visual component
}
```

## Validation & Testing

### Development Testing

```bash
# Test GA4 debug mode
NEXT_PUBLIC_GA_DEBUG=true npm run dev
# Check browser console for GA4 events
# Verify in GA4 DebugView (Real-time)
```

### Staging Validation

```bash
# Deploy to staging with test measurement ID
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-STAGING123456 npm run build
# Validate events appear in staging GA4 property
# Test consent flows and privacy compliance
```

### Production Verification

```bash
# Production deployment
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-TY1G9W8P75 npm run build
# Monitor GA4 Real-time reports
# Verify all conversion goals are firing
# Check attribution and audience data
```

## Success Metrics

### Technical Metrics

- [ ] Bundle size impact < 50KB (GA4 + consent management)
- [ ] Core Web Vitals unaffected (LCP, CLS, FID)
- [ ] Zero console errors in production
- [ ] 100% event tracking accuracy
- [ ] <2 second initial page load

### Business Metrics

- [ ] Registration conversion rate baseline established
- [ ] User journey funnel mapped and tracked
- [ ] Content engagement metrics available
- [ ] Attribution data collection working
- [ ] Audience segments building correctly

## Documentation References

- [GA4 Stream Configuration](https://analytics.google.com/analytics/web/#/a283951968w389874504p262103616/)
- [Next.js @next/third-parties Documentation](https://nextjs.org/docs/app/api-reference/components/third-parties)
- [Privacy Compliance Guide](../../analytics/privacy-compliance.md)
- [Implementation Plan](../../analytics/implementation-plan.md)

## Maintenance & Updates

### Monthly Tasks

- [ ] Review GA4 data quality and completeness
- [ ] Check for new Next.js @next/third-parties updates
- [ ] Monitor Core Web Vitals impact
- [ ] Review and optimize conversion goals

### Quarterly Tasks

- [ ] Audit event tracking accuracy
- [ ] Review privacy compliance requirements
- [ ] Update audience segments and attribution models
- [ ] Plan advanced features based on data insights

This specification provides the complete foundation for implementing professional-grade analytics at zero monthly cost while maintaining scalability for future growth.
