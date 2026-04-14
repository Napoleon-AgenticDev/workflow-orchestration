---

meta:
id: products-agent-alchemy-dev-seo-research-site-review-05-agent-workflow-one-pager-md
  title: 05 Agent Workflow One Pager
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'

meta:
meta:

---

# Agent Alchemy: 4-Agent Workflow One-Pager

**Audience:** CTOs, Engineering Managers, Product Teams  
**Goal:** Explain specification automation in < 2 minutes  
**Format:** Printable/shareable quick reference

---

## The Problem (10 seconds)

**Manual specification writing is broken:**

- PMs produce vague requirements
- Architects don't document decisions
- Competitive analysis takes days
- Build vs buy decisions lack ROI math
- **Result:** 3 weeks to spec a feature, if you're lucky

---

## The Solution (15 seconds)

**4 AI agents that generate 25 specifications automatically:**

```
Research Agent (47 min) → 5 specifications
   ↓
Plan Agent (32 min) → 6 specifications
   ↓
Architecture Agent (51 min) → 8 specifications
   ↓
[Development Phase - humans use all 19 specs]
   ↓
Quality Agent (28 min) → 6 specifications + GitHub issues
```

**Total:** 2.6 hours (vs 3 weeks manual)  
**Productivity:** 73x faster

---

## Real Example (20 seconds)

**Feature:** GitHub App integration with OAuth  
**Research Agent Output:** 10 documents, 10,287 lines in 47 minutes

**What it contains:**

- Competitive analysis (12 platforms: Vercel, Netlify, Linear)
- Build vs buy decision ($87K-$140K, 12-16 weeks)
- Technical architecture (NestJS, TypeORM, Redis)
- Security compliance (AES-256-GCM, AWS KMS)
- UX research (30-second onboarding, 85% conversion target)
- Risk mitigation strategies

**Manual equivalent:** 5 days minimum (1 sprint)

---

## The 4 Agents (30 seconds)

### 1. Research Agent (Non-Technical Analysis)

**Produces:**

- `feasibility-analysis.specification.md` - Business/technical viability
- `market-research.specification.md` - Competitive landscape
- `user-research.specification.md` - Personas and pain points
- `risk-assessment.specification.md` - Risks and mitigation
- `recommendations.specification.md` - Go/no-go decision

**Example insight:** "Vercel's 30-second onboarding achieves 85% conversion. Just-in-time permissions reduce abandonment by 40%."

---

### 2. Plan Agent (Requirements & Business Rules)

**Produces:**

- `functional-requirements.specification.md` - Features with acceptance criteria
- `non-functional-requirements.specification.md` - Performance, scalability metrics
- `business-rules.specification.md` - Numbered rules (BR-001, BR-002)
- `ui-ux-workflows.specification.md` - User flows and wireframes
- `implementation-sequence.specification.md` - Phased delivery plan
- `constraints-dependencies.specification.md` - Technical constraints

**Example requirement:** "NFR-003: OAuth callback must complete in < 2 seconds (99th percentile)"

---

### 3. Architecture Agent (Technical Design)

**Produces:**

- `system-architecture.specification.md` - C4 diagrams (Context, Container, Component)
- `ui-components.specification.md` - Component hierarchy
- `database-schema.specification.md` - ERD with relationships
- `api-specifications.specification.md` - REST endpoints with DTOs
- `security-architecture.specification.md` - Encryption, auth patterns
- `business-logic.specification.md` - Domain services
- `devops-deployment.specification.md` - CI/CD, infrastructure
- `architecture-decisions.specification.md` - ADRs (why choices were made)

**Example ADR:** "ADR-005: Use PostgreSQL over MongoDB for transactional integrity requirements"

---

### 4. Quality Agent (Validation & Issues)

**Produces:**

- `requirements-validation.specification.md` - All requirements covered?
- `architecture-compliance.specification.md` - Matches architectural standards?
- `code-quality.specification.md` - Follows team conventions?
- `security-audit.specification.md` - Security checklist completion
- `defect-report.specification.md` - Gaps identified
- `quality-summary.specification.md` - Overall quality score

**Plus:** Automatically creates GitHub issues for gaps

**Example defect:** "DEFECT-001: OAuth state parameter validation missing (CSRF vulnerability)"

---

## Key Differentiators (15 seconds)

| Feature                       | Agent Alchemy | GitHub Copilot | Cursor | Claude |
| ----------------------------- | ------------- | -------------- | ------ | ------ |
| Multi-agent workflow          | ✅ 4 agents   | ❌             | ❌     | ❌     |
| 25 specifications output      | ✅            | ❌             | ❌     | ❌     |
| Competitive analysis          | ✅ Automated  | ❌             | ❌     | ❌     |
| Build vs buy ROI              | ✅ Generated  | ❌             | ❌     | ❌     |
| GitHub issue creation         | ✅ Automated  | ❌             | ❌     | ❌     |
| Architecture Decision Records | ✅ Generated  | ❌             | ❌     | ❌     |

**Unique value:** Not just code generation. Complete specification automation from idea to quality validation.

---

## ROI Calculator (10 seconds)

**Manual specification writing (traditional):**

- Senior Engineer: $150/hour
- Time: 80 hours (2 weeks)
- **Cost: $12,000**

**Agent Alchemy:**

- Agent runtime: 2.6 hours
- Engineer review/refinement: 8 hours
- **Cost: $1,200 + tool license**

**Savings per feature:** $10,800 (90% cost reduction)  
**Time saved:** 70 hours (88% time reduction)

**For a team shipping 20 features/year:**

- **Total savings:** $216,000/year
- **Time reclaimed:** 1,400 hours
- **ROI:** 100x (typical license cost < $2K/year)

---

## Technical Stack (5 seconds)

**Agents built with:**

- Agent Skills v1.0 open standard (portable)
- GitHub Copilot custom agents
- Specification templates (SRP-compliant)
- Machine-readable validation (JSON schemas)

**Works with:**

- GitHub Copilot (native)
- Claude Code (portable)
- Cursor AI (portable)
- Cline (portable)
- 20+ Agent Skills-compatible platforms

---

## Proof Points (10 seconds)

**Real GitHub App Research Output:**

- 10,287 lines generated
- 12 competitors analyzed
- $87K-$140K cost estimate
- 12-16 week timeline
- 47 quantified findings
- Generated in 47 minutes

**Quality metrics:**

- Copilot Integration Score: 80/100
- Specifications with code examples: 95.8%
- Specifications with YAML metadata: 87.5%
- Average specification length: 1,029 lines

---

## Use Cases (10 seconds)

### For Product Teams

- Feature feasibility analysis
- Competitive intelligence automation
- Build vs buy decisions with ROI

### For Engineering Teams

- Architecture Decision Records
- API contract generation
- Database schema design

### For Quality Teams

- Automated requirement validation
- Gap analysis and defect tracking
- Security compliance checklists

### For Leadership

- Cost estimation automation
- Timeline forecasting
- Risk assessment reports

---

## Next Steps (5 seconds)

**See it in action:**

1. [Download GitHub App research example (10,287 lines)](./04-agent-workflow-specifications.md)
2. [View all 4 agent SKILLs](.agent-alchemy/agents/)
3. [Run workspace-analysis SKILL](.agent-alchemy/SKILLS/workspace-analysis/)

**Get started:**

- Book demo: [30-minute agent workflow walkthrough]
- Try research agent: [Analyze your feature idea]
- Enterprise license: [Unlimited specification generation]

---

## One-Liners for Pitches

1. **"73x faster. 25 specifications. Zero manual work."**
2. **"AI wrote 10,287 lines of research in 47 minutes. How long would you take?"**
3. **"Build vs buy? AI does the math. You make the decision."**
4. **"Your PM writes vague requirements. Our agents write 25 focused specs."**
5. **"Competitive analysis: 2 days manual. 47 minutes automated."**
6. **"4 agents. 25 specifications. 1 workflow. Zero BS."**
7. **"Your last spec took 3 weeks. Ours took 2.6 hours."**
8. **"Not code generation. Specification automation."**

---

**Last Updated:** 2026-02-09  
**Version:** 1.0  
**Contact:** [Your contact info]
