---
meta:
  id: adr-001-ga4-vs-plausible
  title: ADR 001 GA4 VS PLAUSIBLE
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'

meta:
meta:
---

# ADR-001: Google Analytics 4 vs Plausible for Agent Alchemy.DEV

## Status

**ACCEPTED** - 2025-01-16

## Context

Agent Alchemy.DEV requires web analytics to track user behavior, conversion funnels, and content engagement. As a bootstrap/solo startup, cost optimization is critical while maintaining professional-grade analytics capabilities.

The application is built with Next.js 14 in an Nx monorepo, requiring an analytics solution that:

- Integrates seamlessly with Next.js App Router
- Supports TypeScript and provides type safety
- Scales across multiple apps in the workspace
- Maintains Core Web Vitals performance
- Provides GDPR/CCPA compliance capabilities

## Decision Drivers

### 1. Budget Constraints (Critical)

**Solo Startup Reality**: Limited monthly budget for SaaS tools during bootstrap phase.

- **Current Budget**: $0/month for analytics tools
- **Growth Phase**: Will reassess when revenue reaches $10K/month
- **Opportunity Cost**: Every dollar spent on tools reduces runway

### 2. Feature Requirements (High Priority)

- **Conversion Tracking**: Registration funnel, lead magnets, calendar exports
- **User Journey Mapping**: Multi-touch attribution across content sections
- **Audience Segmentation**: First-time vs returning visitors, engagement levels
- **Business Intelligence**: Revenue attribution (future paid tiers)
- **Performance Monitoring**: Core Web Vitals, error tracking
- **Privacy Compliance**: GDPR consent mode, data retention controls

### 3. Technical Integration (High Priority)

- **Next.js Compatibility**: Official framework support and optimization
- **TypeScript Support**: Full type safety and IDE integration
- **Performance Impact**: Minimal effect on loading times and Core Web Vitals
- **Development Experience**: Easy testing, debugging, and validation
- **Nx Monorepo**: Shared libraries and consistent patterns across apps

### 4. Data Ownership & Privacy (Medium Priority)

- **Data Residency**: Control over where analytics data is stored
- **Privacy Compliance**: GDPR, CCPA, and similar regulation support
- **Consent Management**: Granular user control over data collection
- **Data Retention**: Ability to configure retention periods

## Options Considered

### Option 1: Plausible Analytics

#### Advantages ✅

- **Privacy-First**: GDPR compliant by default, no cookies required
- **Simple Setup**: Lightweight script, minimal configuration
- **Clean Interface**: Easy-to-understand dashboard and reports
- **Open Source**: Transparent algorithms and data processing
- **Data Ownership**: EU-based, full control over data location
- **No Cookies**: Simplified compliance, no consent banners needed
- **Performance**: Very lightweight script (~1KB)

#### Disadvantages ❌

- **Cost**: $108/year ($9/month) for up to 100K page views
- **Limited Features**: Basic funnel tracking, no advanced ecommerce
- **Attribution**: Simple first/last touch, no multi-touch attribution
- **Audience Insights**: Limited user segmentation capabilities
- **Custom Events**: Basic event tracking compared to GA4
- **Third-Party Integrations**: Fewer integrations with business tools
- **Learning Curve**: Team knowledge primarily with Google Analytics

#### Technical Assessment

```typescript
// Plausible implementation would look like:
<Script defer data-domain="copilot.agentalchemy.dev" src="https://plausible.io/js/script.js" />;

// Custom events:
window.plausible('registration_start', {
  props: { source: 'hero', method: 'form' },
});
```

**Bundle Impact**: ~1KB script, minimal performance impact
**Setup Complexity**: Low - single script tag and basic event tracking
**TypeScript Support**: Community types available but not official

### Option 2: Google Analytics 4 (CHOSEN)

#### Advantages ✅

- **Cost**: Completely free for up to 25 million events/month
- **Advanced Features**: Full funnel analysis, attribution modeling, predictive metrics
- **Business Intelligence**: Enhanced ecommerce, conversion value, audience insights
- **Technical Integration**: Official Next.js support via @next/third-parties
- **Enterprise Features**: Advanced segmentation, custom audiences, conversion modeling
- **Ecosystem**: Integrates with Google Ads, Search Console, other Google services
- **Team Knowledge**: Familiar interface and concepts
- **Scalability**: Handles growth from startup to enterprise without migration
- **Machine Learning**: Predictive insights and automated audience creation

#### Disadvantages ❌

- **Privacy Concerns**: Google data collection, more complex consent management needed
- **Complexity**: Feature-rich interface can be overwhelming
- **Cookie Requirements**: Needs consent management for GDPR compliance
- **Bundle Size**: Larger script (~28KB) compared to privacy-first alternatives
- **Data Location**: Google's global infrastructure, less control over data residency
- **Learning Curve**: Advanced features require training to use effectively

#### Technical Assessment

```typescript
// GA4 implementation with Next.js:
import { GoogleAnalytics } from '@next/third-parties/google';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <GoogleAnalytics gaId="G-TY1G9W8P75" />
      </body>
    </html>
  );
}

// Advanced event tracking:
gtag('event', 'registration_start', {
  event_category: 'engagement',
  source: 'hero',
  value: 1,
  custom_parameter_funnel_step: 1,
});
```

**Bundle Impact**: ~28KB (optimized, lazy-loaded by Next.js)
**Setup Complexity**: Medium - requires consent management and advanced configuration
**TypeScript Support**: Official Google types and Next.js integration

### Option 3: Self-Hosted Solutions (Rejected)

#### Options Evaluated

- **Umami**: Self-hosted, privacy-focused
- **PostHog**: Feature-rich, self-hosted analytics and product insights
- **Matomo**: Open-source alternative to Google Analytics

#### Rejection Reasons

- **Infrastructure Cost**: VPS/hosting costs exceed Plausible pricing
- **Maintenance Overhead**: Database management, updates, security patches
- **Time Investment**: Setup and ongoing administration not cost-effective for solo startup
- **Scaling Concerns**: Traffic spikes could overwhelm self-hosted infrastructure

## Decision Matrix

| Criteria                  | Weight | Plausible    | GA4              | Self-Hosted       |
| ------------------------- | ------ | ------------ | ---------------- | ----------------- |
| **Monthly Cost**          | 35%    | ❌ $9/month  | ✅ Free          | ❌ $15-25/month   |
| **Feature Richness**      | 25%    | ⚠️ Basic     | ✅ Enterprise    | ⚠️ Variable       |
| **Privacy Compliance**    | 15%    | ✅ Built-in  | ⚠️ Requires work | ✅ Full control   |
| **Technical Integration** | 15%    | ⚠️ Community | ✅ Official      | ❌ Custom build   |
| **Scalability**           | 10%    | ⚠️ Limited   | ✅ Enterprise    | ❌ Manual scaling |

**Weighted Score**:

- **GA4**: 8.5/10
- **Plausible**: 6.2/10
- **Self-Hosted**: 4.1/10

## Advanced Features Comparison

### Funnel Analysis

- **GA4**: Native funnel reports with drop-off analysis, segment comparison
- **Plausible**: Basic goal tracking, manual funnel construction
- **Decision Impact**: GA4's advanced funnel analysis provides deeper insights into conversion optimization

### Attribution Modeling

- **GA4**: Data-driven attribution, first-click, last-click, time-decay, position-based
- **Plausible**: Simple first/last touch attribution only
- **Decision Impact**: Multi-touch attribution crucial for understanding complex user journeys

### Audience Segmentation

- **GA4**: Machine learning audiences, predictive segments, cross-platform audiences
- **Plausible**: Basic filtering by device, location, referrer
- **Decision Impact**: Advanced segmentation enables targeted optimization and future ad campaigns

### Business Intelligence

- **GA4**: Enhanced ecommerce, custom dimensions/metrics, BigQuery export
- **Plausible**: Basic conversion tracking and custom properties
- **Decision Impact**: Future revenue streams require sophisticated business intelligence

## Implementation Strategy

### Phase 1: Privacy-Compliant Foundation

```typescript
// Consent-first implementation
const consentConfig = {
  ad_storage: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'denied',
  personalization_storage: 'denied',
  security_storage: 'granted',
  wait_for_update: 500,
};

gtag('consent', 'default', consentConfig);

// Only enable after user consent
gtag('consent', 'update', {
  analytics_storage: 'granted',
});
```

### Phase 2: Advanced Event Architecture

```typescript
// Structured event taxonomy
interface BusinessEvents {
  // Conversion funnel
  registration_start: ConversionEvent;
  registration_complete: ConversionEvent;

  // Content engagement
  section_view: EngagementEvent;
  content_interaction: EngagementEvent;

  // Lead generation
  guide_download: LeadEvent;
  calendar_export: LeadEvent;
}
```

### Phase 3: Business Intelligence Integration

- Custom dimensions for user properties
- Conversion value attribution
- Audience creation for future remarketing
- Enhanced ecommerce preparation for paid tiers

## Costs Over Time

### Year 1 Projection

| Solution        | Setup Cost         | Monthly Cost | Annual Total           | Opportunity Cost |
| --------------- | ------------------ | ------------ | ---------------------- | ---------------- |
| **GA4**         | 40 hours × $100/hr | $0           | $4,000 (dev time)      | Low              |
| **Plausible**   | 8 hours × $100/hr  | $9           | $908 + $800 (dev time) | Medium           |
| **Self-Hosted** | 60 hours × $100/hr | $20          | $6,240                 | High             |

### Year 2+ Projection (Post-Revenue)

- **GA4**: $0/month, maintenance only
- **Plausible**: $9-19/month (traffic scaling)
- **Self-Hosted**: $25-50/month (infrastructure scaling)

**Break-Even Analysis**: GA4's free tier provides better ROI until $25K/month revenue, at which point privacy-premium becomes viable.

## Migration Strategy

### If Moving FROM GA4 TO Plausible (Future Consideration)

**Trigger Conditions**:

- Monthly revenue > $10K consistently
- Privacy regulations become stricter
- Team prioritizes data sovereignty over features

**Migration Plan**:

1. **Parallel Tracking**: Run both solutions for 3 months
2. **Data Export**: Export historical GA4 data to warehouse
3. **Event Mapping**: Translate GA4 events to Plausible goals
4. **Team Training**: Transition team to Plausible interface
5. **Gradual Cutover**: Phase out GA4 after validation period

## Conclusion

**Decision**: Adopt Google Analytics 4 for Agent Alchemy.DEV analytics.

**Primary Justification**: The $108/year cost savings enables 6+ months of additional runway, while GA4's enterprise features provide superior business intelligence for growth optimization.

**Risk Mitigation**:

- Implement privacy-first consent management from day one
- Design event architecture to be analytics-provider agnostic
- Plan migration path to privacy-focused solution post-revenue

**Success Criteria**:

- Zero monthly cost for analytics infrastructure
- Complete conversion funnel visibility within 30 days
- GDPR/CCPA compliance validated by legal review
- Advanced audience insights driving content optimization

**Review Date**: Reassess analytics strategy when monthly revenue reaches $5K or 12 months from implementation, whichever comes first.

---

**Contributors**: Analytics specification committee
**Reviewers**: Technical architecture team, Business stakeholders
**Next Actions**: Proceed with GA4 implementation per [Feature Specification](./FEATURE-SPECIFICATION.md)
