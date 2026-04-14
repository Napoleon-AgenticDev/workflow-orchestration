---
meta:
  id: specs-products-agent-alchemy-dev-features-content-queue-plan-ui-ux-workflows
  title: UI/UX Workflows - Content Queue Feature
  version: 1.0.0
  status: draft
  specType: specification
  scope: feature
  tags: []
  createdBy: unknown
  createdAt: '2026-02-24'
  reviewedAt: null
title: UI/UX Workflows - Content Queue Feature
category: Products
feature: content-queue
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: plan
applyTo: []
keywords: []
topics: []
useCases: []
specification: ui-ux-workflows
---

# UI/UX Workflows: Content Queue Feature

## Overview

This specification defines all user workflows, UI interactions, and UX patterns for the Content Queue feature integrated within VS Code. The feature leverages VS Code's extension capabilities including TreeView, Command Palette, Webviews, and Status Bar.

**Design Principles**:
1. **Command Palette First**: All actions accessible via keyboard
2. **Progressive Disclosure**: Show complexity only when needed
3. **Non-Blocking**: Never interrupt user's coding flow
4. **Feedback-Rich**: Clear status and progress indicators
5. **Keyboard-Optimized**: Power users never need mouse

---

## UW-1: Initial Setup and Onboarding

### UW-1.1: First-Time Setup Workflow

**User Goal**: Connect GitHub and social platforms in < 5 minutes
**Entry Point**: Extension installed, first activation

**Workflow Steps**:

```
1. Extension Activation
   ↓
2. Welcome Notification
   "👋 Content Queue installed! Set up in 5 minutes?"
   [Get Started] [Later]
   ↓
3. Setup Wizard (Webview)
   Step 1/4: Connect GitHub
   - Click "Authorize GitHub"
   - OAuth flow in default browser
   - Return to VS Code
   ✓ GitHub connected
   ↓
4. Step 2/4: Select Repositories
   - Show list of accessible repos
   - Checkboxes for selection (max 5 for free tier)
   - Preview: "We'll monitor these repos for content opportunities"
   [◻ buildmotion-ai/agent-alchemy]
   [◻ buildmotion-ai/agency-app]
   ✓ 2 repositories selected
   ↓
5. Step 3/4: Connect Platforms
   - Twitter: [Connect] | LinkedIn: [Connect] | Dev.to: [Connect]
   - OAuth for Twitter
   - API key for Dev.to
   ✓ Twitter connected
   ✓ Dev.to connected
   ↓
6. Step 4/4: Set Preferences
   - Timezone: [Auto-detect: America/New_York ▼]
   - Default content tone: [Professional ▼ | Casual | Humorous]
   - Notification preferences: [Daily digest ▼]
   ✓ Preferences saved
   ↓
7. Setup Complete!
   "✅ You're all set! We're monitoring your repos now."
   "First content opportunities will appear within 24 hours."
   [View Queue] [Close]
```

**UI Components**:
- **Webview Panel**: Multi-step wizard with progress indicator
- **OAuth Browser Flow**: Opens default browser, returns to VS Code
- **Notifications**: Success confirmations at each step

**Validation**:
- Cannot proceed to step 4 without connecting at least 1 platform
- Repository selection enforces tier limits
- Timezone validation (must be valid IANA timezone)

**Error Handling**:
- OAuth fails: "GitHub connection failed. [Retry] or [Skip for now]"
- No repositories found: "No accessible repositories. Check GitHub permissions."
- API key invalid: "Dev.to API key invalid. [Help: Where to find API key?]"

**Exit Points**:
- [Later]: Save partial progress, show reminder in 3 days
- [Skip]: Move to next step, can configure later
- [X Close]: Save progress, reopen anytime with `Content Queue: Setup`

---

### UW-1.2: Daily Usage Pattern (Steady State)

**User Goal**: Review and approve content in < 5 minutes/day
**Entry Point**: User opens VS Code, sees content queue notification

**Typical Daily Flow**:

```
Morning (9:00 AM)
├─ Open VS Code
├─ Status Bar: "Content Queue (3 new)" 🟢
├─ Click status bar OR Cmd+Shift+Q
│  ↓
├─ TreeView Opens: "Content Queue"
│  ├─ 📝 Pending (3)
│  │   ├─ 🐦 Twitter Thread: "Added TypeScript Strict Mode"
│  │   ├─ 📝 Dev.to: "Migrating to Strict Mode - Lessons Learned"
│  │   └─ 🐦 Twitter: "Fixed memory leak in event listeners"
│  ├─ ✅ Approved (2)
│  ├─ 📅 Scheduled (5)
│  └─ 📊 Published (12)
│
├─ User clicks first item: "🐦 Twitter Thread: Added TypeScript Strict Mode"
│  ↓
├─ Preview Panel Opens (Editor)
│  ├─ Platform: Twitter (thread)
│  ├─ Generated: 2 hours ago
│  ├─ Confidence: High ⭐⭐⭐
│  ├─ Preview: [Tweet 1/7]
│  │   🔥 Just enabled TypeScript strict mode across 45 files...
│  │   
│  │   Here's what we learned (and 127 type errors later) 🧵👇
│  │   
│  │   #TypeScript #WebDev #DevLife
│  ├─ Action Bar:
│  │   [✅ Approve] [✏️ Edit] [🔄 Regenerate] [❌ Reject]
│
├─ User clicks [✅ Approve]
│  ↓
├─ Scheduling Dialog
│  ├─ "When should we publish this?"
│  ├─ 🎯 Optimal times for Twitter:
│  │   ◉ Today at 12:00 PM EST (in 3 hours) - Best
│  │   ○ Today at 5:00 PM EST - Good
│  │   ○ Tomorrow at 9:00 AM EST - Good
│  │   ○ Custom: [Date picker] [Time picker]
│  └─ [Schedule] [Cancel]
│
├─ User selects "Today at 12:00 PM" and clicks [Schedule]
│  ↓
├─ Success Notification: "✅ Scheduled for 12:00 PM"
├─ Item moves to "Scheduled" section
│
├─ User reviews second item (Dev.to article)
├─ Clicks [✏️ Edit] to make minor tweaks
├─ Markdown editor opens in VS Code
├─ User edits, saves (Cmd+S)
├─ Clicks [✅ Approve] from editor toolbar
├─ Schedules for "Tomorrow at 9:00 AM"
│
├─ User reviews third item (Twitter single tweet)
├─ Clicks [❌ Reject] (not interesting enough)
├─ Confirmation: "Reject this content? [Yes] [No]"
├─ Item moves to "Rejected" (archived)
│
└─ Queue Review Complete (3 items, 2 approved, 1 rejected, 5 minutes total)
```

**Time Breakdown**:
- Open queue: 5 seconds
- Review each item: 45-90 seconds
- Approve + schedule: 15 seconds
- Edit + approve: 2-3 minutes (if needed)
- Total: 3-6 minutes for 3-5 items

---

## UW-2: Content Discovery and Generation

### UW-2.1: Automatic Content Discovery

**User Goal**: System finds content opportunities without user action
**Trigger**: GitHub commit pushed, system polls every 15 minutes

**Background Process Flow**:

```
GitHub Repository (user pushes commit)
  ↓
GitHub Webhook OR Polling (every 15 min)
  ↓
Content Queue Service
  ├─ Fetch commit details (diff, message, files)
  ├─ Calculate significance score (BR-1.2)
  ├─ If score ≥ 50: Create opportunity
  │   ↓
  │   Generate opportunity file:
  │   .agent-alchemy/content-queue/opportunities/2026-02-10/opp-abc123.yaml
  │   ↓
  │   Generate content (AI):
  │   - Twitter thread (3 variations)
  │   - Dev.to article (3 variations)
  │   ↓
  │   Store in: .agent-alchemy/content-queue/generated/2026-02-10/opp-abc123/
  │   ├─ twitter-variant-1.md
  │   ├─ twitter-variant-2.md
  │   ├─ twitter-variant-3.md
  │   ├─ devto-variant-1.md
  │   ├─ devto-variant-2.md
  │   └─ devto-variant-3.md
  │   ↓
  │   Update TreeView: Add to "Pending" section
  │   ↓
  │   If user has VS Code open:
  │     Show notification: "📝 New content generated from recent commit"
  │   Else:
  │     Queue for next session (status bar badge)
  └─ Else: Ignore commit (not significant)
```

**User Visibility**:
- **Real-time**: Notification if VS Code open
- **Deferred**: Status bar badge shows count on next open
- **Daily Digest**: Email summary of new opportunities (if enabled)

**No User Action Required**: Fully automatic until review step

---

### UW-2.2: Manual Content Creation

**User Goal**: Create content for non-GitHub topics (e.g., general tips, opinions)
**Entry Point**: Command Palette

**Workflow Steps**:

```
User Action: Cmd+Shift+P → "Content Queue: Create Manual Opportunity"
  ↓
Quick Input Dialog 1: "What's the content about?"
  ├─ Input: [Text field, 50-200 chars]
  ├─ Placeholder: "e.g., Best practices for TypeScript generics"
  └─ Example suggestions (optional):
      - "5 mistakes to avoid in Angular"
      - "My favorite VS Code extensions"
      - "How we reduced build times by 40%"
  ↓
User enters: "TypeScript generics best practices"
  ↓
Quick Pick Dialog 2: "Which platforms?"
  ├─ ☑️ Twitter
  ├─ ☑️ Dev.to
  ├─ ☐ LinkedIn (not connected)
  └─ [Continue]
  ↓
User selects: Twitter + Dev.to
  ↓
Quick Input Dialog 3: "Add context or code example (optional)"
  ├─ Input: [Multi-line text area]
  ├─ Placeholder: "Paste code snippet or add background context..."
  └─ [Skip] [Continue]
  ↓
User adds:
  ```typescript
  function identity<T>(arg: T): T {
    return arg;
  }
  ```
  ↓
Progress Notification: "⏳ Generating content... (15-30 seconds)"
  ↓
Content Generation (AI)
  ├─ Twitter thread (3 variations)
  └─ Dev.to article (3 variations)
  ↓
Success Notification: "✅ Content generated! Review in queue."
  ↓
TreeView: New item appears in "Pending" section
  ├─ 🐦 Twitter: "TypeScript Generics Best Practices"
  └─ 📝 Dev.to: "TypeScript Generics: A Practical Guide"
```

**UI Pattern**: Progressive disclosure via Quick Input/Quick Pick (native VS Code)

**Validation**:
- Topic must be 50-200 characters
- At least 1 platform must be selected
- Optional context limited to 2000 characters

**Error Handling**:
- Generation fails: "❌ Content generation failed. [Retry] [Cancel]"
- Quota exceeded: "Daily generation limit reached (20/20). Try again tomorrow or [Upgrade to Pro]."

---

## UW-3: Content Review and Editing

### UW-3.1: Content Preview and Navigation

**User Goal**: Quickly scan and evaluate generated content
**Entry Point**: Click item in TreeView

**UI Layout** (Preview Panel):

```
┌─────────────────────────────────────────────────────────────────┐
│ Content Preview: Twitter Thread                            [X]   │
├─────────────────────────────────────────────────────────────────┤
│ Platform: 🐦 Twitter (Thread) │ Generated: 2h ago │ ⭐⭐⭐ High  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ Source: Commit abc1234 - "feat: added strict mode"               │
│ Repository: buildmotion-ai/agent-alchemy                         │
│ Branch: main                                                      │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│ Thread Preview (7 tweets)                           [1/7] < >    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  🔥 Just enabled TypeScript strict mode across 45 files...      │
│                                                                   │
│  Here's what we learned (and 127 type errors later) 🧵👇        │
│                                                                   │
│  #TypeScript #WebDev #DevLife                                    │
│                                                                   │
│  [232/280 chars]                                                 │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│ Variations: ● Variation 1  ○ Variation 2  ○ Variation 3         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [✅ Approve]  [✏️ Edit]  [🔄 Regenerate]  [❌ Reject]          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Navigation Controls**:
- **Arrow Keys**: Navigate between tweets in thread (< >)
- **Tab**: Switch between variations
- **Cmd+1/2/3/4**: Quick action shortcuts (Approve/Edit/Regen/Reject)
- **Esc**: Close preview, return to TreeView

**Visual Indicators**:
- **Confidence Stars**: ⭐⭐⭐ High | ⭐⭐ Medium | ⭐ Low
- **Character Count**: Shows remaining characters for Twitter
- **Platform Icons**: 🐦 Twitter | 📝 Dev.to | 💼 LinkedIn
- **Status Badges**: 🟢 Ready | 🟡 Needs Review | 🔴 Failed

---

### UW-3.2: Content Editing Workflow

**User Goal**: Make minor edits to AI-generated content
**Entry Point**: Click [✏️ Edit] in preview OR double-click TreeView item

**Editing Flow**:

```
User clicks [✏️ Edit]
  ↓
Markdown file opens in VS Code editor
  ├─ File: .agent-alchemy/content-queue/generated/2026-02-10/opp-abc123/twitter-variant-1.md
  ├─ Content:
  │   ---
  │   platform: twitter
  │   type: thread
  │   status: pending
  │   ---
  │   
  │   # Tweet 1/7
  │   🔥 Just enabled TypeScript strict mode across 45 files...
  │   
  │   Here's what we learned (and 127 type errors later) 🧵👇
  │   
  │   #TypeScript #WebDev #DevLife
  │   
  │   ---
  │   
  │   # Tweet 2/7
  │   ...
  ├─ Editor UI:
  │   ├─ Custom toolbar (CodeLens):
  │       [✅ Approve & Schedule] [💾 Save] [↩️ Revert] [❌ Cancel]
  │   ├─ Live Preview: Shows character count per tweet
  │   └─ Diagnostics: Warns if tweet exceeds 280 chars
  ↓
User edits content:
  ├─ Changes "🔥" to "💡"
  ├─ Tweaks wording in tweet 3
  └─ Adds one more hashtag
  ↓
Auto-save triggers (every 30 seconds)
  ↓
User clicks [✅ Approve & Schedule] OR Cmd+Enter
  ↓
Scheduling dialog opens (same as UW-1.2)
  ↓
Content scheduled
  ↓
Editor closes, returns to TreeView
  ↓
Item moves from "Pending" to "Scheduled"
```

**Editor Features**:
- **Syntax Highlighting**: Markdown + custom highlighting for Twitter hashtags/mentions
- **Character Counter**: Live count per tweet (updates as you type)
- **Validation Diagnostics**: Red underline if tweet too long
- **Quick Actions** (CodeLens): Inline buttons for common actions
- **Auto-save**: Saves every 30 seconds (configurable)

**Keyboard Shortcuts**:
- **Cmd+Enter**: Approve & schedule
- **Cmd+S**: Save edits
- **Cmd+Z**: Undo (standard VS Code undo)
- **Esc**: Close without saving (confirmation dialog)

---

### UW-3.3: Bulk Operations

**User Goal**: Approve multiple items quickly (power user workflow)
**Entry Point**: Multi-select in TreeView

**Workflow**:

```
TreeView with multiple pending items:
  📝 Pending (5)
  ├─ 🐦 Twitter: "Added strict mode"
  ├─ 📝 Dev.to: "Strict mode migration"
  ├─ 🐦 Twitter: "Fixed memory leak"
  ├─ 📝 Dev.to: "Debugging memory leaks"
  └─ 🐦 Twitter: "New CI/CD pipeline"
  ↓
User: Cmd+Click to select multiple items (checkboxes appear)
  📝 Pending (5)
  ├─ ☑️ 🐦 Twitter: "Added strict mode"
  ├─ ☑️ 📝 Dev.to: "Strict mode migration"
  ├─ ☐ 🐦 Twitter: "Fixed memory leak"
  ├─ ☐ 📝 Dev.to: "Debugging memory leaks"
  └─ ☑️ 🐦 Twitter: "New CI/CD pipeline"
  ↓
Right-click OR Cmd+Shift+A → "Approve Selected (3)"
  ↓
Bulk Scheduling Dialog:
  "Schedule 3 items"
  ├─ All items will be scheduled at optimal times
  ├─ Twitter items: Today 12pm, 5pm, Tomorrow 9am
  ├─ Dev.to items: Tomorrow 9am
  ├─ [◉ Use recommended times]
  │   [○ Schedule all for: [Date picker] [Time picker]]
  └─ [Schedule All] [Cancel]
  ↓
User clicks [Schedule All]
  ↓
Progress: "Scheduling 3 items... 1/3, 2/3, 3/3"
  ↓
Success: "✅ 3 items scheduled"
  ↓
Items move from "Pending" to "Scheduled"
```

**Bulk Limits**:
- Maximum 10 items per bulk action
- Items must all be in same status (pending → scheduled)
- Cannot bulk edit (edit is always individual)

---

## UW-4: Scheduling and Publishing

### UW-4.1: Scheduling Workflow

**User Goal**: Choose when content publishes
**Entry Point**: After approving content

**Scheduling Dialog UI**:

```
┌──────────────────────────────────────────────────────────┐
│  Schedule Content                                    [X] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  When should we publish this Twitter thread?            │
│                                                          │
│  🎯 Recommended times (based on engagement data):       │
│                                                          │
│    ◉  Today at 12:00 PM EST (in 3 hours) ⭐ Best       │
│        Peak engagement time for tech content            │
│                                                          │
│    ○  Today at 5:00 PM EST (in 8 hours)                │
│        Good evening engagement                          │
│                                                          │
│    ○  Tomorrow at 9:00 AM EST                           │
│        Optimal weekday morning slot                     │
│                                                          │
│    ○  Custom date and time:                             │
│        [Date picker ▼] [Time picker ▼] [Timezone: EST] │
│                                                          │
│  ℹ️  Note: Already have 2 items scheduled for 12-1pm   │
│                                                          │
│  [Schedule] [Cancel]                                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Smart Recommendations**:
- Algorithm considers:
  - Platform best practices (Twitter peak times)
  - User's historical engagement data (if available)
  - Existing schedule (avoid conflicts)
  - Day of week (weekday vs weekend)
  - Content type (thread vs single tweet)

**Visual Feedback**:
- **Best** ⭐: Highest predicted engagement
- **Good**: Above-average engagement expected
- **Warning** ⚠️: Already 3+ items in this window

**Custom Scheduling**:
- Date picker: Next 90 days
- Time picker: 15-minute increments
- Timezone: Auto-detected, user can override
- Validation: At least 15 minutes in future

---

### UW-4.2: Schedule Management (Calendar View)

**User Goal**: Visualize and manage scheduled content
**Entry Point**: Command Palette → "Content Queue: View Schedule"

**Calendar View** (Webview):

```
┌──────────────────────────────────────────────────────────────┐
│ Content Schedule - February 2026                    [< > ☰]  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Sun      Mon      Tue      Wed      Thu      Fri      Sat  │
│  ───────────────────────────────────────────────────────────│
│                     1        2        3        4        5   │
│            12pm🐦  9am📝   12pm🐦            5pm🐦         │
│                     5pm🐦   5pm🐦                           │
│                                                              │
│   6        7        8        9       [10]      11       12  │
│           9am📝   12pm🐦  12pm🐦   ╔═══════╗ 12pm🐦       │
│                     5pm🐦   5pm🐦   ║ TODAY ║               │
│                                      ╚═══════╝               │
│  13       14       15       16       17       18       19   │
│  9am📝   12pm🐦            5pm🐦   9am📝   12pm🐦         │
│                                              5pm🐦          │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Today's Schedule (Feb 10)                                    │
├──────────────────────────────────────────────────────────────┤
│ 12:00 PM  🐦 Twitter Thread: "Added TypeScript strict mode" │
│           [View] [Reschedule] [Cancel]                       │
│                                                              │
│  5:00 PM  🐦 Twitter Tweet: "Fixed memory leak"             │
│           [View] [Reschedule] [Cancel]                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Interactions**:
- **Click date**: View that day's schedule
- **Click scheduled item**: View content details
- **Drag item** (future): Reschedule by dragging to new time
- **Right-click item**: Context menu (Reschedule, Cancel, Duplicate)

**Filters**:
- Platform: Show only Twitter OR Dev.to
- Status: Scheduled, Published, Failed
- Date range: This week, This month, Custom

---

### UW-4.3: Publishing Process and Feedback

**User Goal**: Understand what's happening when content publishes
**Trigger**: Scheduled time reached (automatic, background process)

**Publishing Flow** (User Perspective):

```
Content Scheduled: Today 12:00 PM
  ↓
11:58 AM: Pre-publish notification (optional)
  "📢 Publishing in 2 minutes: Twitter thread about TypeScript"
  [View] [Dismiss]
  ↓
12:00 PM: Publishing starts (background)
  ├─ Status bar: "Publishing..." 🔄
  ├─ TreeView item: Shows spinner icon 🔄
  └─ If user viewing this item: Progress notification
  ↓
12:00:15 PM: Publishing complete
  ├─ Status bar: "✅ Published successfully"
  ├─ TreeView: Item moves to "Published" section
  ├─ Success notification:
  │   "✅ Published to Twitter
  │   View: https://twitter.com/user/status/123456
  │   [Open in Browser] [Dismiss]"
  └─ Status: published, URL recorded
```

**Status Indicators** (TreeView):
- 🔄 Publishing in progress
- ✅ Published successfully
- ⚠️ Retrying (after network error)
- ❌ Failed (manual intervention needed)

**Error Scenarios**:

**1. Rate Limit Hit**:
```
❌ Publishing failed: Rate limit exceeded
   Next attempt: 1:00 PM (1 hour from now)
   [View Details] [Cancel Publish]
```

**2. Authentication Error**:
```
❌ Publishing failed: Twitter authentication expired
   Action required: Reconnect Twitter account
   [Reconnect] [Cancel Publish]
```

**3. Network Error**:
```
⚠️ Publishing failed: Network timeout
   Retrying automatically in 5 minutes...
   Attempt 1/3
   [Retry Now] [Cancel Publish]
```

---

## UW-5: Queue Management and Organization

### UW-5.1: TreeView Structure

**Layout**:

```
CONTENT QUEUE                                      [⚙️ ↻ +]
├─ 📝 Pending (3)                                  [Expand ▾]
│  ├─ 🐦 Twitter: "TypeScript strict mode" ⭐⭐⭐
│  ├─ 📝 Dev.to: "Migrating to strict mode" ⭐⭐⭐
│  └─ 🐦 Twitter: "Fixed memory leak" ⭐⭐
│
├─ ✅ Approved (0)                                 [Expand ▸]
│
├─ 📅 Scheduled (5)                                [Expand ▾]
│  ├─ Today 12:00 PM 🐦 "Added strict mode"
│  ├─ Today 5:00 PM 🐦 "Fixed bug"
│  ├─ Tomorrow 9:00 AM 📝 "Debugging guide"
│  ├─ Feb 12, 12:00 PM 🐦 "New feature"
│  └─ Feb 12, 5:00 PM 🐦 "Performance tips"
│
├─ 📊 Published (12)                               [Expand ▸]
│  └─ [Show more...]
│
├─ ❌ Failed (1)                                   [Expand ▸]
│  └─ 🐦 Twitter: "CI/CD pipeline" (Auth error)
│
└─ 🗑️ Rejected (8)                                [Expand ▸]
    └─ [Show more...]
```

**Icons**:
- 🐦 Twitter
- 📝 Dev.to
- 💼 LinkedIn (future)
- 📹 YouTube (future)
- ⭐ Confidence stars (1-3)
- 🔄 Processing/Publishing
- ⚠️ Warning/Retry

**Action Buttons** (Top-right):
- ⚙️ Settings
- ↻ Refresh
- + Create Manual Opportunity

---

### UW-5.2: Search and Filtering

**User Goal**: Find specific content in large queue
**Entry Point**: Search box in TreeView OR Command Palette

**Search UI**:

```
┌────────────────────────────────────────────────────┐
│ [🔍 Search content...]                       [X]   │
├────────────────────────────────────────────────────┤
│ Filters:                                           │
│ Platform: [All ▼] | Status: [All ▼]               │
│ Date: [Last 7 days ▼] | Confidence: [All ▼]       │
└────────────────────────────────────────────────────┘
```

**Search Capabilities**:
- **Text search**: Search in title, content body, tags
- **Platform filter**: Twitter, Dev.to, LinkedIn, All
- **Status filter**: Pending, Approved, Scheduled, Published, Failed, Rejected
- **Date range**: Today, Last 7 days, Last 30 days, Custom
- **Confidence filter**: High, Medium, Low, All

**Search Results**:
- Highlight matching text in TreeView
- Show result count: "3 results for 'TypeScript'"
- Clear filters button

---

### UW-5.3: Context Menus and Quick Actions

**Right-Click Context Menu**:

```
🐦 Twitter: "Added strict mode" ⭐⭐⭐
├─ ✅ Approve
├─ ✏️ Edit
├─ 👁️ Preview
├─ 🔄 Regenerate
│  ├─ Same content, different tone
│  ├─ Shorter version
│  └─ Longer version (with more details)
├─ 📅 Schedule
├─ 📋 Copy to Clipboard
├─ 🔗 Open Source (GitHub commit)
├─ ❌ Reject
└─ 🗑️ Delete
```

**Keyboard Shortcuts** (with item selected):
- Enter: Preview
- E: Edit
- A: Approve
- R: Reject
- S: Schedule
- Delete: Delete

---

## UW-6: Settings and Configuration

### UW-6.1: Settings Panel

**Entry Point**: Command Palette → "Content Queue: Settings" OR TreeView ⚙️ icon

**Settings UI** (Webview):

```
┌────────────────────────────────────────────────────────────┐
│ Content Queue Settings                                 [X] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Connected Accounts                                         │
│ ├─ 🐙 GitHub: buildmotion ✅ Connected                    │
│ │   [Reconnect] [Disconnect]                              │
│ ├─ 🐦 Twitter: @buildmotion ✅ Connected                  │
│ │   [Reconnect] [Disconnect]                              │
│ └─ 📝 Dev.to: buildmotion ✅ Connected                    │
│     [Reconnect] [Disconnect]                               │
│                                                            │
│ Monitored Repositories (2/5)                              │
│ ├─ [◉] buildmotion-ai/agent-alchemy                      │
│ ├─ [◉] buildmotion-ai/agency-app                         │
│ ├─ [◻] buildmotion-ai/docs-site                          │
│ └─ [+ Add Repository]                                      │
│                                                            │
│ Content Preferences                                        │
│ ├─ Default tone: [Professional ▼]                         │
│ ├─ Hashtag style: [Balanced ▼] (2-3 per post)            │
│ ├─ Code snippets: [◉] Always include                     │
│ └─ Emojis: [◻] Use sparingly                              │
│                                                            │
│ Scheduling Preferences                                     │
│ ├─ Timezone: [America/New_York ▼]                         │
│ ├─ Optimal times: [◉] Use recommended                    │
│ │   Twitter: 12pm, 5pm weekdays                           │
│ │   Dev.to: 9am Tue-Thu                                   │
│ └─ [◻] Avoid weekends                                      │
│                                                            │
│ Notifications                                              │
│ ├─ [◉] New content generated                              │
│ ├─ [◉] Publishing success/failure                         │
│ ├─ [◻] Daily digest email                                 │
│ └─ [◻] Weekly analytics summary                           │
│                                                            │
│ Advanced                                                   │
│ ├─ Storage location: .agent-alchemy/content-queue/       │
│ ├─ Content retention: [90 days ▼]                         │
│ └─ [Clear all rejected content]                           │
│                                                            │
│ [Save Changes] [Cancel]                                   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## UW-7: Error States and Edge Cases

### UW-7.1: Common Error States

**1. No Repositories Connected**:
```
Content Queue (Empty)
┌────────────────────────────────────────────┐
│ 📭 No repositories connected yet           │
│                                            │
│ Connect GitHub repositories to start       │
│ generating content from your commits.      │
│                                            │
│ [Connect Repositories]                     │
└────────────────────────────────────────────┘
```

**2. Generation Quota Exceeded**:
```
❌ Daily generation limit reached (20/20)

You've used all your free tier generations for today.

Options:
- Wait until midnight UTC (resets in 6 hours)
- Upgrade to Pro (100 generations/day) [$20/month]

[View Quota] [Upgrade] [Dismiss]
```

**3. Platform Disconnected**:
```
⚠️ Twitter account disconnected

Your scheduled Twitter posts cannot publish.

Reconnect your Twitter account to resume.

[Reconnect Twitter] [Cancel Scheduled Posts] [Later]
```

---

## UI/UX Best Practices Summary

**Key Principles Applied**:
1. ✅ **Command Palette First**: All features accessible via keyboard
2. ✅ **Progressive Disclosure**: Complexity revealed gradually
3. ✅ **Non-Blocking**: Background operations, no modal blockers
4. ✅ **Feedback-Rich**: Clear status, notifications, progress indicators
5. ✅ **Keyboard-Optimized**: Shortcuts for all common actions

**Performance Targets**:
- TreeView load: < 500ms
- Preview open: < 200ms
- Content generation: 15-30s (with progress indicator)
- Publishing: < 5s (background, non-blocking)

**Accessibility**:
- All UI elements keyboard accessible
- Screen reader compatible (ARIA labels)
- High contrast theme support
- Focus indicators visible

---

**Next Steps**: Review implementation-sequence.specification.md for development phases and timeline.
