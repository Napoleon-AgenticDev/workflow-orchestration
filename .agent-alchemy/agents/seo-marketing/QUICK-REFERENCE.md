# SEO & Marketing Agent Quick Reference

## 🎯 Purpose

Monitor product specifications and create comprehensive SEO strategies, content marketing plans, and promotional materials for target applications.

---

## 📁 Locations

| Item                | Path                                                           |
| ------------------- | -------------------------------------------------------------- |
| **Agent SKILL**     | `.agent-alchemy/agents/seo-marketing/SKILL.md`                        |
| **Output Location** | `.agent-alchemy/specs/products/<app-name>/seo/`                |
| **First Target**    | `.agent-alchemy/specs/products/copilot-agent-alchemy-dev/seo/` |

---

## 📝 Output Specifications

| File                        | Purpose               | Key Content                                                |
| --------------------------- | --------------------- | ---------------------------------------------------------- |
| `research.specification.md` | Market & SEO analysis | Personas, keywords, competitive analysis, positioning      |
| `plan.specification.md`     | Content strategy      | Content pillars, platform strategies, campaigns, messaging |
| `features.specification.md` | Deliverable content   | Blog posts, videos, social media, landing pages, emails    |

---

## 🚀 Usage Commands

### Create SEO Strategy for Product

```bash
@workspace /agent seo-marketing create comprehensive SEO strategy for copilot-agent-alchemy-dev
```

### Update SEO for New Feature

```bash
@workspace /agent seo-marketing update SEO content to include new agent workflow feature
```

### Generate Specific Content

```bash
@workspace /agent seo-marketing generate blog post about 4-agent workflow
@workspace /agent seo-marketing generate YouTube script for workspace analysis demo
@workspace /agent seo-marketing generate LinkedIn post series for context engineering
```

### Migrate Existing Research

```bash
@workspace /agent seo-marketing migrate documentation/research/seo/ to new structure
```

---

## 🔄 Integration Points

### Research Agent (5 specs)

- Extract unique findings → competitive positioning
- Market opportunities → content strategy

### Plan Agent (6 specs)

- Functional requirements → feature messaging
- Business rules → content topics

### Architecture Agent (8 specs)

- Technical innovations → authority content
- Architecture decisions → differentiation

### Quality Agent (6 specs)

- Quality metrics → trust-building
- Test coverage → credibility messaging

---

## 📊 Monitoring

### Continuous Monitoring Targets

- `.agent-alchemy/specs/products/` - New product specifications
- Feature updates and changes
- Architecture decisions impacting messaging
- Feature launch schedules

### Trigger Events

- New product directory created
- Major feature specifications added
- Product architecture changes
- Feature launch preparation

### Frequency

- **Weekly**: Check new specifications
- **Monthly**: Update content strategy
- **Quarterly**: Refresh keyword research
- **On-Demand**: Major launches

---

## ✅ Validation Checklist

### Research Complete When

- [ ] All personas defined with search behavior
- [ ] Competitive analysis with gaps identified
- [ ] Keyword research with priorities
- [ ] Positioning and messaging established
- [ ] Success metrics with targets

### Plan Complete When

- [ ] Content pillars with topics/keywords
- [ ] Platform strategies with objectives
- [ ] Campaign plans with timelines
- [ ] Distribution strategies documented
- [ ] Resource requirements identified

### Features Complete When

- [ ] Content artifacts with complete copy
- [ ] SEO metadata for all assets
- [ ] Production requirements documented
- [ ] Publishing schedule established
- [ ] Quality standards met

---

## 🎬 Example: copilot-agent-alchemy-dev

### Research Phase

```markdown
- Primary Keyword: "GitHub Copilot custom instructions" (2,400/mo)
- Personas: Mid-Senior Engineers, Tech Leads, CTOs
- Position: "$1.5B TAM in SDLC automation"
- Content Gap: "Agent Skills vs .cursorrules"
```

### Plan Phase

```markdown
- Pillar 1: Context Engineering (stack.json, guardrails.json)
- Pillar 2: Specification-Driven Development (4-agent workflow)
- Pillar 3: Portable Agent Skills (open standard)
- YouTube: Foundation, Deep Dives, Tutorials, Hot Takes
```

### Features Phase

```markdown
- Blog: "73x Faster: AI Generates 25 Specifications"
- Video: "47 Seconds to AI-Ready: Workspace Analysis"
- LinkedIn: "Your AI doesn't know your architecture"
- Twitter: "I analyzed 100K lines in 47 seconds..."
```

---

## 📚 Key Resources

### Migrated Research (Existing)

- `00-marketing-strategy-update.md` - Complete v2.0 strategy
- `01-positioning-sticky-differentiators.md` - Core positioning
- `02-skills-workspace-initialization.md` - SKILLS patterns
- `03-novel-innovations.md` - 6 innovations analysis
- `04-agent-workflow-specifications.md` - 4-agent workflow
- `05-agent-workflow-one-pager.md` - Quick reference pitch

### Templates in SKILL.md

- Research specification template (complete markdown)
- Plan specification template (complete markdown)
- Features specification template (complete markdown)

---

## 🔧 Best Practices

### Content Quality

- Every blog post → code examples/screenshots
- Every video → timestamps/accurate descriptions
- Every social post → clear call-to-action
- Every landing page → social proof

### SEO Compliance

- E-A-T principles (Expertise, Authoritativeness, Trustworthiness)
- Technical SEO requirements
- Schema markup implementation
- Mobile-first design

### Brand Consistency

- Voice/tone aligned with brand guidelines
- Consistent messaging across channels
- Visual identity maintained
- Core value propositions reinforced

---

## 🆘 Troubleshooting

### "We don't have SEO expertise"

→ Follow the specification templates - they provide comprehensive guidance

### "Content production is slow"

→ Use AI for first drafts, batch-create content, repurpose across platforms

### "Hard to measure ROI"

→ Track defined metrics consistently, use UTM parameters, review monthly dashboards

### "Competition is too strong"

→ Focus on long-tail keywords, content gaps, build authority through quality

---

## 📈 Success Metrics

### Awareness

- Organic Traffic: [Target based on research.specification.md]
- Domain Authority: [Target based on research.specification.md]
- Keyword Rankings: [Target based on research.specification.md]

### Engagement

- Bounce Rate, Time on Page, Return Visitors
- Social engagement rates
- Video watch time

### Conversion

- Lead generation, trial signups, demo requests
- Email subscribers, community members

---

**Last Updated**: 2026-02-09  
**Agent Version**: 1.0.0  
**Status**: Ready for Use ✅
