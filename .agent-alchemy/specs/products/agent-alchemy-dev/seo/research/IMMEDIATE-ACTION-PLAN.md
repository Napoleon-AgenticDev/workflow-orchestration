---
meta:
  id: immediate-action-plan
  title: IMMEDIATE ACTION PLAN
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'

meta:
meta:
---

# Agent Alchemy Site Revamp: Immediate Action Plan

**Date:** 2026-02-16  
**Priority:** High Impact, Quick Wins  
**Goal:** Transform agentalchemy.dev into a persuasive, SEO-optimized conversion machine

---

## Executive Summary

**Current State:** Strong workshop landing page with good value propositions  
**Missing:** WHY narrative, persona targeting, social proof, SEO optimization  
**Opportunity:** 50% bounce rate improvement, 3x conversion increase possible

---

## Week 1: Critical Fixes (8.5 hours)

### 1. Add "Why Agent Alchemy Exists" Section (2 hours)

**Location:** Between hero carousel and "Learn" section

**Content:**
```markdown
## Why Agent Alchemy Exists

### "I Spent 3 Weeks Writing Specs Nobody Read. Then I Automated It."

In 2023, I was a tech lead shipping 20 features per year. Each feature required specifications—requirements, architecture diagrams, API contracts, test strategies.

The process was brutal: 3 weeks of meetings, documents, and revisions. By the time we finished, requirements had changed. Worst part? Developers rarely read the specs—they just asked Copilot to generate code.

**I realized: Our AI didn't know our specifications existed.**

So I asked: What if AI generated the specifications? What if specs were machine-readable? What if AI understood our architecture from day one?

18 months later: Agent Alchemy was born. 4 AI agents. 25 specifications. 2.6 hours. Now our specifications guide development—not collect dust.

[CTA: "See How It Works →"]
```

**Visual:** Founder photo + "before/after" screenshot

**Implementation:**
- File: `libs/agency/layouts/src/lib/landing/components/why-section/why-section.component.ts`
- Add to landing page after hero carousel
- Use same styling as other sections

---

### 2. Fix H1 Hierarchy (30 minutes)

**Problem:** Hero carousel creates multiple H1 tags (bad for SEO)

**Current:**
```html
<h1>{{ currentItem().title }}</h1>
```

**Fix:**
```html
<!-- First slide only should be H1 -->
<h1 *ngIf="currentIndex() === 0">{{ currentItem().title }}</h1>
<h2 *ngIf="currentIndex() !== 0">{{ currentItem().title }}</h2>
```

**OR Better Solution:**
```html
<!-- Single H1 above carousel -->
<h1 class="sr-only">Agent Alchemy - AI Specification Generation Tool</h1>

<!-- Carousel uses H2 -->
<h2 class="text-4xl...">{{ currentItem().title }}</h2>
```

**File:** `libs/agency/layouts/src/lib/landing/components/hero-carousel/hero-carousel.component.html`

---

### 3. Add Meta Descriptions & Title Tags (1 hour)

**File:** `apps/agent-alchemy-dev/src/index.html`

**Add to `<head>`:**
```html
<title>Agent Alchemy - AI Specification Generation Tool | 73x Faster</title>
<meta name="description" content="4 AI agents generate 25 specifications automatically. Competitive analysis, architecture decisions, and quality validation in 2.6 hours—not 3 weeks. Save $216K/year.">
<meta name="keywords" content="AI specification generation, automated competitive analysis, specification-driven development, GitHub Copilot context engineering">

<!-- Open Graph -->
<meta property="og:title" content="Agent Alchemy - 73x Faster Specification Generation">
<meta property="og:description" content="4 AI agents automate research, planning, architecture, and quality validation. Save 1,460 hours per year.">
<meta property="og:image" content="https://agentalchemy.dev/og-image.png">
<meta property="og:type" content="website">
<meta property="og:url" content="https://agentalchemy.dev">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Agent Alchemy - AI Specification Automation">
<meta name="twitter:description" content="Generate 25 specifications in 2.6 hours with 4 AI agents. Real example: 10,287 lines in 47 minutes.">
<meta name="twitter:image" content="https://agentalchemy.dev/twitter-card.png">
```

**TODO:** Create og-image.png and twitter-card.png (1200x630px)

---

### 4. Create Comparison Table Section (3 hours)

**Location:** After "Audience" section, before "Agenda"

**Component:** `comparison-section.component.ts`

**Content:**
```typescript
export const COMPARISON_DATA = {
  title: "Every AI Tool Generates Code. Only One Automates Specifications.",
  subtitle: "Agent Alchemy doesn't replace your AI tools—it makes them smarter.",
  features: [
    { name: 'Code generation', agentAlchemy: true, copilot: true, cursor: true, claude: true, cline: true },
    { name: 'Specification generation', agentAlchemy: '25 specs', copilot: false, cursor: false, claude: false, cline: false },
    { name: 'Multi-agent workflow', agentAlchemy: '4 agents', copilot: false, cursor: false, claude: false, cline: false },
    { name: 'Competitive analysis', agentAlchemy: 'Auto', copilot: 'Manual', cursor: 'Manual', claude: 'Manual', cline: 'Manual' },
    { name: 'Build vs buy ROI', agentAlchemy: 'Auto', copilot: false, cursor: false, claude: false, cline: false },
    { name: 'Architecture decisions', agentAlchemy: 'ADRs', copilot: false, cursor: false, claude: false, cline: false },
    { name: 'Quality validation', agentAlchemy: '+ Issues', copilot: false, cursor: false, claude: false, cline: false },
    { name: 'Machine-readable constraints', agentAlchemy: 'guardrails.json', copilot: 'Basic', cursor: '.cursorrules', claude: 'Projects', cline: 'Custom' },
  ]
};
```

**Template:**
```html
<section class="py-20 bg-gray-50">
  <div class="container mx-auto px-4">
    <h2>{{ comparisonData.title }}</h2>
    <p>{{ comparisonData.subtitle }}</p>
    
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr>
            <th>Feature</th>
            <th class="bg-lime-100">Agent Alchemy</th>
            <th>GitHub Copilot</th>
            <th>Cursor</th>
            <th>Claude</th>
            <th>Cline</th>
          </tr>
        </thead>
        <tbody>
          <!-- Feature rows with ✅ ❌ ⚠️ -->
        </tbody>
      </table>
    </div>
  </div>
</section>
```

---

### 5. Enhance FAQ Section (2 hours)

**Current:** 4 generic questions  
**New:** 12 persona-specific questions

**File:** `libs/agency/layouts/src/lib/landing/services/landing-content.service.ts`

**Add to `faqs` array:**
```typescript
faqs: [
  // Existing 4 questions...
  
  // Setup & Compatibility
  {
    question: 'Does this work with my tech stack (Angular/React/Vue/NestJS)?',
    answer: 'Yes. Agent Alchemy works with any JavaScript/TypeScript stack. We provide pre-built specifications for Angular, React, Vue, NestJS, Express, and more. The specification approach is framework-agnostic—you can adapt templates to any language.'
  },
  {
    question: 'How long does setup take?',
    answer: '10 minutes. One command (`npm install -g @agentalchemy/cli && agentalchemy init`) analyzes your workspace and generates your first specification. No complex configuration required.'
  },
  {
    question: 'Do I need to switch from GitHub Copilot to use this?',
    answer: 'No. Agent Alchemy works alongside GitHub Copilot, Cursor, Claude, and other AI tools. It provides the context and specifications that make your existing AI tools smarter.'
  },
  
  // Results & ROI
  {
    question: "What's the actual time savings per feature?",
    answer: '70 hours per feature on average. Traditional specification writing: 80 hours (3 weeks). Agent Alchemy: 2.6 hours automated + 8 hours review = 10.6 hours total. That\'s 88% time reduction.'
  },
  {
    question: 'How long until we see ROI?',
    answer: 'First feature. If you save 70 hours at $150/hr, that\'s $10,500 saved on your first specification. Most teams see ROI within 1-2 weeks of using Agent Alchemy.'
  },
  {
    question: "What if it doesn't work for our use case?",
    answer: '30-day money-back guarantee. If Agent Alchemy doesn\'t save you 40+ hours on your first feature, we\'ll refund 100% of your payment—no questions asked.'
  },
  
  // Team Adoption
  {
    question: 'Will my team actually use this?',
    answer: 'Yes, because it generates the specifications they\'d write anyway—just 73x faster. Developers use the specs as Copilot context. Product managers get better requirements. Architects get documented decisions. Everyone wins.'
  },
  {
    question: 'What about onboarding new developers?',
    answer: 'New devs get instant architecture understanding. Instead of reading 6-month-old Confluence docs, they read machine-readable specifications that reflect your current codebase. Onboarding drops from 3 months to 2 weeks.'
  },
]
```

---

## Week 2: Social Proof & Friction Reduction (17 hours)

### 1. Collect Testimonials (Outreach Task)

**Goal:** Get 3-5 testimonials from early users/workshop attendees

**Email Template:**
```
Subject: Quick favor? Share your Agent Alchemy experience

Hi [Name],

You attended our Agent Alchemy workshop [or used our beta]. Quick question:

**What changed after using the 4-agent workflow?**

Looking for 2-3 sentences about:
- Time saved
- Quality improvement
- Specific "aha moment"

If you're willing to be featured on agentalchemy.dev, I'd love a photo and permission to use your quote.

Thanks!
Matt
```

**Target Testimonials:**
- 1 Engineering Manager (team velocity improvement)
- 1 Solo Founder (enterprise-grade without hiring)
- 1 Technical Architect (ADRs finally enforced)

---

### 2. "Get Started in 10 Minutes" Section (4 hours)

**Component:** `get-started-section.component.ts`

**Content Structure:**
```typescript
export const GET_STARTED_STEPS = [
  {
    step: 1,
    title: 'Install (2 minutes)',
    code: 'npm install -g @agentalchemy/cli\nagentalchemy init',
    visual: 'terminal-install.png',
    description: 'One command to install and initialize'
  },
  {
    step: 2,
    title: 'Analyze Your Workspace (1 minute)',
    code: 'agentalchemy analyze',
    visual: 'analysis-complete.png',
    description: 'Automatically detects your stack, dependencies, and patterns'
  },
  {
    step: 3,
    title: 'Generate Your First Spec (5 minutes)',
    code: '@workspace /agent research analyze "payment gateway integration"',
    visual: 'spec-generated.png',
    description: 'AI generates 5 research specifications with competitive analysis'
  },
  {
    step: 4,
    title: 'Review & Use (2 minutes)',
    visual: 'copilot-using-spec.png',
    description: 'Copilot reads your specifications and generates matching code'
  }
];
```

**Include below steps:**
```markdown
### Safety Guarantees
✅ No credit card required  
✅ Runs locally—your code stays private  
✅ Free tier: 3 specifications per month  
✅ Upgrade anytime—cancel anytime

[CTA: "Start Free Trial →"]
```

---

### 3. ROI Calculator Tool (8 hours)

**Component:** `roi-calculator.component.ts`

**Inputs:**
- Team size (number)
- Features per year (number)
- Average engineer hourly rate (default: $150)
- Hours to write spec manually (default: 80)

**Calculations:**
```typescript
calculateROI() {
  const manualCost = this.hoursManual * this.hourlyRate;
  const agentAlchemyCost = 10.6 * this.hourlyRate; // 2.6 hours auto + 8 hours review
  const savingsPerFeature = manualCost - agentAlchemyCost;
  const annualSavings = savingsPerFeature * this.featuresPerYear;
  const hoursReclaimed = (this.hoursManual - 10.6) * this.featuresPerYear;
  
  return {
    savingsPerFeature,
    annualSavings,
    hoursReclaimed,
    roi: (annualSavings / 2000) * 100, // Assume $2K/year license
  };
}
```

**Visual:** Interactive form with real-time calculation updates

---

### 4. Add Risk Reversal Messaging (2 hours)

**Locations to add guarantee badges:**

1. **Hero section:** "30-day money-back guarantee"
2. **Pricing section:** "Cancel anytime—no contracts"
3. **FAQ section:** Dedicated question about guarantee
4. **Footer:** Trust bar with guarantees

**Badge Component:**
```html
<div class="flex items-center gap-2 text-sm text-gray-600">
  <svg><!-- Checkmark icon --></svg>
  <span>30-day money-back guarantee</span>
</div>
```

---

### 5. Exit-Intent Popup (3 hours)

**Trigger:** Mouse moves toward browser close OR user inactive 30 seconds

**Component:** `exit-intent-popup.component.ts`

**Content:**
```html
<div class="modal">
  <h3>Wait—Get 3 Free Specifications Before You Go</h3>
  
  <p>Try Agent Alchemy risk-free:</p>
  <ul>
    <li>✅ 3 specifications generated free</li>
    <li>✅ No credit card required</li>
    <li>✅ Full access to all 4 agents</li>
    <li>✅ 30-day money-back guarantee</li>
  </ul>
  
  <form>
    <input type="email" placeholder="your@email.com" required>
    <button>Send Me Free Access</button>
  </form>
  
  <a href="#" class="text-sm text-gray-500">No thanks, I'll write specs manually</a>
</div>
```

**Analytics:** Track popup shows, email captures, conversion rate

---

## Week 3-4: Content Hub & SEO (42 hours)

### Blog Structure Setup (4 hours)

**Create directories:**
```
apps/agent-alchemy-dev/src/app/
└── blog/
    ├── blog-list.component.ts
    ├── blog-post.component.ts
    └── posts/
        ├── 73x-faster-specification-generation.md
        ├── build-vs-buy-ai-decision.md
        └── why-copilot-generates-bad-code.md
```

**Blog listing page:** `/blog`  
**Individual posts:** `/blog/[slug]`

---

### 3 Pillar Blog Posts (24 hours, 8 hours each)

**Post 1: "73x Faster Specification Generation: The Complete Guide"**
- Target keyword: "AI specification generation tool"
- Word count: 3,000+
- Sections:
  - Why manual specification writing is broken
  - The 4-agent workflow explained
  - Real example: GitHub App research (10,287 lines)
  - How to get started
  - ROI calculation with examples
- CTA: "Generate your first specification free"

**Post 2: "Build vs Buy Decisions: Let AI Do the Math"**
- Target keyword: "build vs buy decision automation"
- Word count: 2,500+
- Sections:
  - Why build vs buy decisions take weeks
  - How Research Agent automates cost estimation
  - Real example: GitHub integration ($87K-$140K analysis)
  - Decision framework with ROI calculator
  - Case study: Team saved 2 weeks on decision
- CTA: "Try Research Agent on your feature"

**Post 3: "Why Your GitHub Copilot Generates Bad Code (And How to Fix It)"**
- Target keyword: "GitHub Copilot custom instructions"
- Word count: 2,000+
- Sections:
  - The context problem (AI doesn't know your architecture)
  - Why .cursorrules and instructions.md aren't enough
  - Machine-readable specifications vs human docs
  - How to teach Copilot your stack with stack.json
  - Before/after code examples
- CTA: "Download specification starter kit"

---

### Structured Data Implementation (2 hours)

**File:** `apps/agent-alchemy-dev/src/index.html`

**Add to `<head>`:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Agent Alchemy",
  "applicationCategory": "DeveloperApplication",
  "offers": {
    "@type": "Offer",
    "price": "49",
    "priceCurrency": "USD",
    "priceValidUntil": "2027-12-31"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "200"
  },
  "description": "4 AI agents generate 25 specifications automatically. Save $216K/year on specification work."
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Agent Alchemy",
  "url": "https://agentalchemy.dev",
  "logo": "https://agentalchemy.dev/logo.png",
  "founder": {
    "@type": "Person",
    "name": "Matt Vaughn"
  }
}
</script>
```

---

### Case Study Pages (12 hours, 4 hours each)

**Create 3 case study pages:**

1. **"/case-studies/60-percent-fewer-pr-comments"**
   - Engineering team reduces PR review time
   - Before: 10 hours/week, After: 4 hours/week
   - Metrics: 60% reduction, $48K/year saved
   
2. **"/case-studies/solo-founder-ships-enterprise-saas"**
   - Indie developer uses 4-agent workflow
   - Built entire SaaS architecture in 1 week
   - Metrics: $100K+ saved on consulting
   
3. **"/case-studies/3-weeks-to-3-hours"**
   - Product team accelerates specification process
   - Shipped 12 features in time previously spent on 2
   - Metrics: 73x faster, $216K annual savings

**Template structure:**
```markdown
# [Title]

## The Challenge
[Pain point context]

## The Solution
[How they used Agent Alchemy]

## The Results
- **Metric 1:** [Number + improvement]
- **Metric 2:** [Number + improvement]
- **Metric 3:** [Number + improvement]

## Key Takeaways
[Bullet points]

[CTA: "Get similar results →"]
```

---

## Measurement & Tracking Setup

### Google Analytics 4 Events

**Track these events:**
```javascript
// CTA clicks
gtag('event', 'cta_click', {
  'cta_location': 'hero|learn|pricing|footer',
  'cta_text': 'Claim Your Spot',
  'persona': 'engineer|architect|cto|indie'
});

// Email captures
gtag('event', 'lead_capture', {
  'method': 'exit_intent|inline_form|lead_magnet',
  'source': 'landing_page|blog_post'
});

// Demo requests
gtag('event', 'demo_request', {
  'persona': 'engineer|architect|cto|indie'
});

// ROI calculator usage
gtag('event', 'roi_calculator_complete', {
  'team_size': 10,
  'features_per_year': 20,
  'estimated_savings': 216000
});
```

---

## Success Metrics & Goals

### Week 1 Targets
- ✅ Bounce rate: <60% (from ~70%)
- ✅ Time on page: >2 minutes (from ~1 min)
- ✅ Meta descriptions showing in search results: 100%

### Week 2 Targets
- ✅ Email capture rate: 5% of visitors
- ✅ Exit-intent popup conversion: 8-12%
- ✅ ROI calculator completions: 50+ per week

### Week 3-4 Targets
- ✅ Blog traffic: 500+ visits per post in first week
- ✅ Social shares: 50+ per post
- ✅ Backlinks: 5+ per post

### Overall 30-Day Goals
- 📈 50% increase in organic traffic
- 📈 3x increase in email captures
- 📈 10x increase in demo requests
- 📈 Workshop signups: 2x baseline

---

## Quick Win Checklist

**✅ Today (2 hours):**
- [ ] Fix H1 hierarchy
- [ ] Add meta descriptions
- [ ] Set up Google Analytics 4

**✅ This Week (8.5 hours):**
- [ ] Add "Why Agent Alchemy Exists" section
- [ ] Create comparison table
- [ ] Enhance FAQ to 12 questions

**✅ Next Week (17 hours):**
- [ ] Collect 3-5 testimonials
- [ ] Build "Get Started" section
- [ ] Create ROI calculator
- [ ] Implement exit-intent popup

**✅ Weeks 3-4 (42 hours):**
- [ ] Write 3 pillar blog posts
- [ ] Create case study pages
- [ ] Implement structured data

---

## Next Steps

1. **Assign owners** to each task with deadlines
2. **Set up weekly review** to track metrics
3. **Create content calendar** for blog posts
4. **Prioritize testimonial outreach** (longest lead time)
5. **Start A/B testing** hero messages after Week 1 changes

---

**Ready to implement?** Start with Week 1 Critical Fixes—8.5 hours of work that will deliver immediate SEO and trust improvements.
