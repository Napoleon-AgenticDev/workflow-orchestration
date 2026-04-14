# Content Automation Framework - Usage Guide

## Overview

The Content Automation Framework automates the research, curation, and generation of technical content for social media platforms. It consists of:

1. **Content Curation Automation SKILL** - Interactive content generation workflow
2. **Content Automation Agent** - Specification-based content pipeline management

## Quick Start

### Generate Weekly Content Batch

```bash
@workspace run content-curation-automation

# Follow the interactive prompts:
Platforms: instagram, twitter, youtube, linkedin
Topics: AI Development, GitHub Copilot, Angular, NestJS
Frequency: weekly
Content Types: code-snippets, tutorials, tips-and-tricks
Sources: github, codebase, web
Review Mode: manual
```

### Use the Agent for Complete Pipeline

```bash
@workspace /agent content-automation create content pipeline for week of 2024-02-10

# This creates 6 specification files:
# 1. strategy.specification.md
# 2. discovery.specification.md
# 3. generation.specification.md
# 4. review-queue.specification.md
# 5. scheduling.specification.md
# 6. analytics.specification.md
```

## Content Sources

The framework discovers content from:

### GitHub Repositories
- Recent commits and PRs
- New issues and discussions
- README updates
- Release notes

### Local Codebase
- New specifications
- Updated instructions
- Custom skills and agents
- Architecture decisions

### Web Research
- Framework documentation
- Industry blogs
- Community forums
- Technical news sites

## Platform-Specific Content

### Instagram
- Code snippet visuals
- Quick tips (carousel posts)
- Before/after comparisons
- Tutorial snippets

### Twitter
- Technical threads (5-10 tweets)
- Single-tweet tips
- Code snippet highlights
- Industry news commentary

### YouTube
- Tutorial videos (5-15 minutes)
- Feature demonstrations
- Live coding sessions
- Short tips (60-90 seconds)

### LinkedIn
- Professional insights
- Case studies
- Architecture discussions
- Career development tips

### Blog (Dev.to/Medium)
- In-depth tutorials
- Technical guides
- Best practices
- Case studies

## Content Types

### Code Snippets
Short, focused examples demonstrating:
- Angular patterns
- NestJS best practices
- TypeScript tips
- Testing strategies
- CI/CD configurations

### Tutorials
Step-by-step guides for:
- Setting up Nx workspace
- Creating custom Copilot agents
- Implementing features
- Optimizing performance
- Testing applications

### Tips & Tricks
Quick wins and productivity hacks:
- VS Code shortcuts
- Copilot prompting techniques
- Debugging strategies
- Refactoring patterns

### Feature Highlights
Showcasing new capabilities:
- New agent skills
- Updated specifications
- Framework features
- Tool integrations

### Industry Trends
Analysis and commentary on:
- AI development evolution
- Framework updates
- Best practice changes
- Community innovations

## Automation Workflow

### 1. Strategy Phase
Define goals, audience, and content themes

### 2. Discovery Phase
Scan sources for content opportunities

### 3. Generation Phase
Create platform-optimized content drafts

### 4. Review Phase
Human approval and refinement

### 5. Scheduling Phase
Plan publishing calendar

### 6. Analytics Phase
Track performance and optimize

## Configuration

### Set Up Automation Schedule

Create `.agent-alchemy/content-queue/automation-config.yml`:

```yaml
schedule:
  frequency: weekly
  day: Monday
  time: 09:00

platforms:
  - instagram
  - twitter
  - youtube
  - linkedin

topics:
  - AI Development
  - GitHub Copilot
  - Angular
  - NestJS

content_types:
  - code-snippets
  - tutorials
  - tips-and-tricks

review_mode: manual
```

### Configure GitHub Repositories

Add repositories to monitor:

```yaml
github_repos:
  - buildmotion-ai/buildmotion-ai-agency
  - microsoft/vscode
  - angular/angular
  - nestjs/nest
```

### Configure Web Sources

Add URLs for research:

```yaml
web_sources:
  - https://github.blog/
  - https://angular.io/blog
  - https://nestjs.com/blog
  - https://dev.to/
```

## Review Workflow

### Manual Review (Default)
All content requires human approval:
1. Review generated content in queue
2. Check technical accuracy
3. Verify brand voice
4. Test code snippets
5. Approve or request changes

### Hybrid Review
Auto-approve minor content, manual for major:
- Auto: Code snippets, tips, minor updates
- Manual: Tutorials, articles, major announcements

### Quality Checklist
- [ ] Technical accuracy verified
- [ ] Code snippets tested
- [ ] Links validated
- [ ] Brand voice consistent
- [ ] Platform formatting correct
- [ ] Hashtags appropriate
- [ ] SEO optimized
- [ ] Accessibility considered

## Publishing

### Manual Publishing
1. Export approved content
2. Copy to platform
3. Schedule or publish immediately
4. Track performance

### Integration Options
- Buffer API
- Hootsuite
- Later.com
- Direct platform APIs

## Analytics

Track these metrics:

### Engagement
- Likes, comments, shares
- Retweets, replies
- Video views, watch time
- Article reads, claps

### Growth
- Follower growth rate
- Email subscribers
- GitHub stars
- Community members

### Content Performance
- Top performing posts
- Best times to post
- Most engaging topics
- Optimal content formats

## Best Practices

### Content Quality
1. Always test code snippets
2. Verify technical accuracy
3. Maintain brand voice
4. Provide real value
5. Keep it concise

### Automation Safety
1. Start with manual review
2. Gradually move to hybrid
3. Monitor quality consistently
4. Keep human oversight

### Engagement
1. Post at optimal times
2. Respond to comments
3. Engage with community
4. Track what works
5. Iterate and improve

## Troubleshooting

### Issue: Content quality is inconsistent
**Solution**: 
- Refine discovery parameters
- Update content themes
- Improve source diversity
- Enhance review checklist

### Issue: Not enough content ideas
**Solution**:
- Add more GitHub repositories
- Expand web research sources
- Monitor community discussions
- Review competitor content

### Issue: Low engagement rates
**Solution**:
- Analyze posting times
- Test different formats
- Improve hooks and CTAs
- A/B test content variations

## Examples

See `references/` directory for:
- Example content pieces
- Template library
- Success case studies
- Platform best practices

## Support

For questions or issues:
1. Check documentation
2. Review examples
3. Consult Agent Alchemy README
4. Open GitHub discussion

## License

Proprietary - BuildMotion AI Agency
