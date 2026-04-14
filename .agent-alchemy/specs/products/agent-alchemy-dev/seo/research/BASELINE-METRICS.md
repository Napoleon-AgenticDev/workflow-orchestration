---
meta:
  id: baseline-metrics
  title: BASELINE METRICS
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'

meta:
meta:
---

# Baseline Metrics - Agent Alchemy Landing Page

**Date Captured:** 2026-02-16  
**Purpose:** Document current state before Week 1 implementation  
**Next Measurement:** After Week 1 fixes (2026-02-23)

---

## 1. Current SEO Status

### Meta Tags (Before)
- ✅ Has `<title>` tag: "Agent Alchemy"
- ❌ Missing meta description
- ❌ Missing Open Graph tags (og:title, og:description, og:image)
- ❌ Missing Twitter Card tags
- ❌ Missing structured data (JSON-LD)

### HTML Structure (Before)
- ⚠️ **H1 Hierarchy Issue:** Single H1 ("Agent Alchemy — 4 AI agents...") is screen-reader-only
- ⚠️ **Carousel uses H2s:** All carousel slides use H2, which is correct
- ✅ Semantic HTML structure in place
- ✅ Proper ARIA labels on interactive elements

### Performance (Estimated)
- **Lighthouse SEO Score:** Unknown (need to measure)
- **Page Load Time:** Unknown (need to measure)
- **First Contentful Paint:** Unknown

### Current Keywords
- **Primary:** "Agent Alchemy", "AI agents", "specifications"
- **Missing:** "AI specification generation tool", "automated competitive analysis"
- **Long-tail opportunities:** Not targeting specific queries

---

## 2. Content Inventory (Current State)

### Sections Present
1. ✅ Hero Carousel (5 slides, 8-second auto-rotate)
2. ✅ Origin Story / Why Section (originStory)
3. ✅ Learn Section (4 agents)
4. ✅ Audience Section (3 personas)
5. ✅ Comparison Section (Agent Alchemy vs competitors)
6. ✅ Agenda Section (workshop timeline)
7. ✅ Tech Stack Section
8. ✅ Bonus Section
9. ✅ FAQ Section (12 questions)
10. ✅ Instructor Section
11. ✅ Final CTA Section
12. ✅ Footer Section

### Content Strengths
- ✅ Strong quantified value props: "73x faster", "$216K savings", "10,287 lines"
- ✅ Real proof point: GitHub App research example
- ✅ 4-agent workflow clearly explained
- ✅ Multi-persona targeting (developers, architects, managers)
- ✅ Comparison table distinguishes from competitors
- ✅ Comprehensive FAQ (12 questions)

### Content Gaps Identified
- ❌ **No social proof:** Missing testimonials, case studies, logos
- ❌ **Weak persona mapping:** Pain points not specific enough
- ❌ **Single CTA type:** Only "Claim Your Spot" (workshop-focused)
- ❌ **No friction reducers:** No free tier, no guarantee visible in hero
- ❌ **No "Get Started" guide:** High barrier to entry

---

## 3. Conversion Funnel Analysis

### Current Conversion Paths
1. **Primary:** Hero CTA → Workshop signup
2. **Secondary:** Learn section → (no direct CTA)
3. **Tertiary:** Final CTA → Workshop signup

### CTA Inventory
- **Total CTAs on page:** 3 (Hero, Learn anchor, Final CTA)
- **CTA variety:** All point to workshop signup
- **Persona-specific CTAs:** None (all generic)

### Friction Points
- ⚠️ **High commitment:** Workshop is only entry point
- ⚠️ **No trust signals:** No testimonials, reviews, or social proof
- ⚠️ **No free tier:** No way to try before committing
- ⚠️ **No guarantee:** Risk not addressed in hero section
- ⚠️ **Long form assumption:** Users must read entire page to understand value

---

## 4. User Experience Issues

### Navigation
- ✅ Smooth scroll behavior to sections
- ✅ Responsive design for mobile/tablet/desktop
- ⚠️ No sticky navigation (scroll to top required)

### Accessibility
- ✅ Semantic HTML structure
- ✅ ARIA labels on carousel controls
- ✅ Keyboard navigation support
- ⚠️ Single H1 is screen-reader-only (not ideal for sighted users)

### Visual Hierarchy
- ✅ Clear section breaks with spacing
- ✅ Color contrast meets WCAG standards
- ⚠️ No visual call-outs for key metrics (could be more prominent)

---

## 5. Competitor Positioning

### Current Differentiation
- ✅ Comparison table explicitly contrasts with Copilot, Cursor, Claude, Cline
- ✅ "Specification generation" unique value prop stated
- ✅ "Multi-agent workflow" differentiator clear

### Missing Positioning Elements
- ❌ **Why it exists:** Origin story exists but not prominent
- ❌ **Problem → solution mapping:** Not explicit enough
- ❌ **Competitive advantages:** Table shows features but not benefits
- ❌ **Use case clarity:** When to use Agent Alchemy vs alternatives not clear

---

## 6. Analytics Setup

### Current Tracking
- ❌ **Google Analytics 4:** Not confirmed if installed
- ❌ **Event tracking:** No custom events defined
- ❌ **Conversion tracking:** No goal setup documented
- ❌ **Heatmaps/session recording:** Not implemented

### Metrics to Track (Post-Implementation)
- Bounce rate (target: < 35%)
- Time on page (target: > 2 minutes)
- Scroll depth (target: 70% reach "Learn" section)
- CTA click-through rate (target: 5-10%)
- Workshop signup conversion (target: 2-5% of traffic)

---

## 7. Technical SEO

### URL Structure
- ✅ Clean URLs (no parameters)
- ⚠️ Canonical tags: Need to verify
- ❌ XML sitemap: Not confirmed
- ❌ robots.txt: Not confirmed

### Schema Markup
- ❌ Organization schema
- ❌ Product schema
- ❌ AggregateRating schema
- ❌ Event schema (for workshop)
- ❌ FAQ schema

### Mobile Optimization
- ✅ Responsive design confirmed
- ✅ Touch-friendly buttons (48px+ target size)
- ⚠️ Mobile speed: Need to measure

---

## 8. Content Quality Scores

### Hero Carousel (Current Grade: B+)
- **Clarity:** 8/10 (clear value props)
- **Specificity:** 7/10 (quantified but not persona-mapped)
- **Persuasion:** 6/10 (features over benefits)
- **Urgency:** 5/10 (no scarcity or time pressure)

### Learn Section (Current Grade: B)
- **Clarity:** 9/10 (agents well-explained)
- **Persona mapping:** 4/10 (generic descriptions)
- **Proof:** 8/10 (real example cited)
- **CTAs:** 3/10 (no direct action)

### FAQ Section (Current Grade: A-)
- **Comprehensiveness:** 9/10 (12 questions cover major objections)
- **Clarity:** 9/10 (answers are specific)
- **Trust building:** 7/10 (good but could add more proof)

---

## 9. Estimated Traffic & Conversions (Pre-Implementation)

### Traffic Assumptions
- **Current monthly visitors:** Unknown (need Analytics data)
- **Target audience:** Developers, architects, CTOs
- **Traffic sources:** Direct, organic search (minimal), referral

### Conversion Assumptions
- **Current conversion rate:** Unknown (estimate 1-3% for workshops)
- **Average session duration:** Unknown (estimate 1:30 - 2:00 minutes)
- **Bounce rate:** Unknown (estimate 50-60%)

### Post-Week 1 Targets
- **Bounce rate:** 50% → 35% (-30% improvement)
- **Conversion rate:** 2% → 3% (+50% improvement)
- **Session duration:** 1:45 → 2:30 (+43% improvement)
- **Organic traffic:** Baseline → +25% (from SEO fixes)

---

## 10. Week 1 Implementation Checklist

### Critical SEO Fixes (3 hours)
- [ ] Add comprehensive meta description (150-160 chars)
- [ ] Add Open Graph tags (og:title, og:description, og:image)
- [ ] Add Twitter Card tags
- [ ] Create og-image.png (1200x630px)
- [ ] Add Organization JSON-LD schema
- [ ] Add Product JSON-LD schema
- [ ] Add FAQ JSON-LD schema

### Content Updates (5.5 hours)
- [ ] Update 3 FAQ answers with more specific proof points
- [ ] Add visible H1 in hero section (not screen-reader-only)
- [ ] Enhance comparison table with benefit explanations
- [ ] Add trust signal badges (if available: "30-day guarantee", "No credit card required")
- [ ] Update hero carousel slide 1 with persona-specific variant

### Trust & Social Proof (Parallel Work)
- [ ] Draft testimonial outreach email (30 mins)
- [ ] Identify 10 early users for testimonial requests
- [ ] Create testimonial component template (for Week 2)
- [ ] Design "Get Started in 10 Minutes" outline

---

## 11. Success Metrics Framework

### Week 1 Success Criteria
- ✅ All meta tags present and validated
- ✅ Lighthouse SEO score: 90+ (from unknown)
- ✅ H1 hierarchy fixed (visible H1 on page)
- ✅ JSON-LD schemas live (3 types minimum)
- ✅ Comparison table enhanced with explanatory copy

### Week 2 Success Criteria
- ✅ 3 testimonials collected and displayed
- ✅ "Get Started" guide live with 3-step walkthrough
- ✅ Exit-intent popup captures 15% of exiting visitors
- ✅ ROI calculator functional with real-time calculations

### Weeks 3-4 Success Criteria
- ✅ Blog structure live with 4 pillar categories
- ✅ 3 pillar posts published (2,000-3,000 words each)
- ✅ Organic traffic: +50% from long-tail keywords
- ✅ Case study page(s) live with detailed examples

---

## 12. Measurement Plan

### Tracking Setup (Week 1)
1. Confirm Google Analytics 4 property ID
2. Set up custom events:
   - `click_hero_cta`
   - `click_comparison_cta`
   - `scroll_to_learn`
   - `faq_expand`
   - `workshop_signup_click`
3. Configure conversion goals in GA4
4. Set up weekly automated reports

### Data Collection
- **Frequency:** Daily snapshots for first 2 weeks, then weekly
- **Key metrics:** Bounce rate, conversion rate, traffic sources, top pages
- **Heatmap tool:** Consider Hotjar or Microsoft Clarity for visual feedback

---

## 13. Next Steps

1. **Implement Week 1 Critical Fixes** (8.5 hours estimated)
2. **Deploy changes to staging** for QA review
3. **Run Lighthouse audit** to validate SEO improvements
4. **Deploy to production** and monitor analytics closely
5. **Begin testimonial outreach** (longest lead time)
6. **Start Week 2 work** in parallel (social proof components)

---

## Notes

- All baseline metrics are estimates pending Analytics integration
- Actual performance will be measured after Week 1 deployment
- This document serves as the "before" snapshot for before/after comparison
- Update this file with actual numbers once Analytics is live

**Owner:** Matt Vaughn  
**Last Updated:** 2026-02-16  
**Next Review:** 2026-02-23 (post-Week 1 deployment)
