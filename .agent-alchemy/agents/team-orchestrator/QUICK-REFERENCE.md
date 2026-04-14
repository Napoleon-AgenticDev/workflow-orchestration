# Team Orchestrator: Quick Reference Guide

## Command

```bash
@workspace /agent team-orchestrator analyze "<feature description>"
```

## Team Composition Patterns

### 🎨 Content Feature Team
**Use For**: Blogs, documentation, CMS, knowledge bases  
**Team**: Research → Plan → Architecture → Content Automation → SEO & Marketing  
**Timeline**: 8-10 weeks  
**Specs**: 28 total (5+6+8+6+3)

**Examples**:
- Blog with markdown support
- Documentation site
- Knowledge base
- Content management system

---

### 🚀 Full-Stack Feature Team
**Use For**: Complete features requiring all phases  
**Team**: Research → Plan → Architecture → Quality  
**Timeline**: 6-8 weeks  
**Specs**: 25 total (5+6+8+6)

**Examples**:
- User authentication
- Payment processing
- Real-time collaboration
- Data analytics dashboard

---

### 🔌 API/Service Feature Team
**Use For**: Backend services, APIs, integrations  
**Team**: Research → Plan → Architecture → Quality  
**Timeline**: 4-6 weeks  
**Specs**: 25 total (5+6+8+6)

**Examples**:
- REST API
- GraphQL service
- Third-party integration
- Microservice

---

### 📱 Marketing Feature Team
**Use For**: Campaigns, landing pages, conversion  
**Team**: Research → SEO & Marketing → Plan → Architecture → Content Automation  
**Timeline**: 8-12 weeks  
**Specs**: 28 total (5+3+6+8+6)

**Examples**:
- Product launch page
- Marketing campaign
- Conversion funnel
- Email automation

---

### 🎯 UI/Component Feature Team
**Use For**: UI components, design systems  
**Team**: Research → Plan → Architecture → Quality  
**Timeline**: 4-6 weeks  
**Specs**: 25 total (5+6+8+6)

**Examples**:
- Component library
- Design system
- UI toolkit
- Widget collection

---

### ⚡ Rapid MVP Team
**Use For**: Prototypes, POCs, spikes  
**Team**: Research (condensed) → Plan (MVP) → Architecture (simplified)  
**Timeline**: 2-3 weeks  
**Specs**: 19 total (5+6+8)

**Examples**:
- Feature validation
- Technical spike
- Proof of concept
- Quick MVP

---

## Agent Selection Decision Matrix

| Feature Type | Research | Plan | Architecture | Quality | SEO | Content |
|--------------|----------|------|--------------|---------|-----|---------|
| Blog/CMS     | ✅       | ✅   | ✅           | -       | ✅  | ✅      |
| API/Service  | ✅       | ✅   | ✅           | ✅      | -   | -       |
| UI/Component | ✅       | ✅   | ✅           | ✅      | -   | -       |
| Full-Stack   | ✅       | ✅   | ✅           | ✅      | -   | -       |
| Marketing    | ✅       | ✅   | ✅           | -       | ✅  | ✅      |
| Rapid MVP    | ✅       | ✅   | ✅           | -       | -   | -       |

✅ = Included  
- = Optional or Not Needed

---

## Parallel Execution Opportunities

### Standard Pattern
```
Research → Plan → Architecture → [Quality OR (Content + SEO)]
```

### Time Savings
- **Content + SEO in parallel**: Saves 1-2 weeks
- **Multiple architecture tracks**: Saves 2-3 weeks for complex features
- **Overall reduction**: 10-20% faster than sequential

---

## Output Structure

```
.agent-alchemy/products/<product>/features/<feature>/
├── team-composition/           # Team Orchestrator outputs (5 specs)
├── research/                   # Research Agent outputs (5 specs)
├── plan/                       # Plan Agent outputs (6 specs)
├── architecture/               # Architecture Agent outputs (8 specs)
├── quality/                    # Quality Agent outputs (6 specs) [if included]
├── content-automation/         # Content Agent outputs (6 specs) [if included]
└── seo/                        # SEO Agent outputs (3 specs) [if included]
```

---

## Benefits Comparison

### Without Team Orchestrator
- ❌ Manual agent invocation (5+ commands)
- ❌ Sequential execution only
- ❌ Manual dependency tracking
- ❌ 9-10 weeks typical timeline
- ❌ Risk of missing agents

### With Team Orchestrator
- ✅ Single invocation
- ✅ Automatic parallel execution
- ✅ Automatic dependency management
- ✅ 8 weeks typical timeline
- ✅ Guaranteed complete coverage

**Time Savings**: 10-20%  
**Quality Improvement**: No gaps in coverage  
**Developer Experience**: 80% less overhead

---

## Example Commands

### Blog Feature
```bash
@workspace /agent team-orchestrator analyze "add blog with markdown, SEO, and search"
```

### API Feature
```bash
@workspace /agent team-orchestrator analyze "create REST API for user management with auth"
```

### UI Feature
```bash
@workspace /agent team-orchestrator analyze "build reusable component library with Storybook"
```

### Marketing Feature
```bash
@workspace /agent team-orchestrator analyze "product launch landing page with conversion tracking"
```

### MVP Feature
```bash
@workspace /agent team-orchestrator analyze "quick prototype for feature validation"
```

---

## Common Questions

### Q: When should I use Team Orchestrator vs manual agents?
**A**: Use Team Orchestrator for:
- New features requiring multiple agents
- Complex features with unclear agent requirements
- Time-sensitive projects needing optimization
- When you want guaranteed complete coverage

Use manual agents when:
- Only need a single agent (e.g., just Research)
- Working on existing feature (adding specs to existing feature)
- Need fine-grained control over each agent invocation

### Q: Can I customize team composition?
**A**: Yes! Team Orchestrator recommends optimal teams, but you can:
- Review the recommended team in `team-plan.specification.md`
- Request adjustments to agent selection
- Add or remove agents as needed
- Modify execution sequence

### Q: How does parallel execution work?
**A**: Team Orchestrator identifies agents that:
- Don't depend on each other's outputs
- Can run simultaneously (e.g., Content + SEO)
- Reduces total timeline by 10-20%

### Q: What if I disagree with the team recommendation?
**A**: You can:
1. Review the `team-plan.specification.md` for justifications
2. Request modifications before execution
3. Fall back to manual agent invocation
4. Provide feedback to improve future recommendations

---

## See Also

- **Full Documentation**: `team-orchestrator/README.md`
- **SKILL Definition**: `team-orchestrator/SKILL.md`
- **Blog Example**: `team-orchestrator/EXAMPLE-BLOG-FEATURE.md`
- **Main Agents README**: `../README.md`
