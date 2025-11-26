# QA Checklist Automation - Roadmap

This document outlines planned features and improvements for future versions.

---

## Version 1.1 - Notifications & Webhooks

### Priority: High

### Lark Integration (Webhook)

**Goal:** Send automated notifications to Lark when key events occur in the app.

#### Events to Notify

| Event | Priority | Description |
|-------|----------|-------------|
| Project Created | High | New test project has been created |
| Project Completed | High | All tests in a project are done (100% progress) |
| Test Failures | Medium | Tests marked as "Fail" - immediate notification |
| Due Date Reminder | Medium | Project due date approaching (1 day, 3 days before) |
| Tester Assigned | Low | New tester joined a project |

#### Implementation Plan

1. **Environment Setup**
   - Add `LARK_WEBHOOK_URL` environment variable in Vercel
   - User creates Lark Bot in workspace and provides webhook URL

2. **Create Webhook Service** (`lib/services/webhookService.ts`)
   ```typescript
   // Service to handle all webhook notifications
   export const webhookService = {
     sendToLark: async (message: LarkMessage) => {...},
     notifyProjectCreated: async (project: Project) => {...},
     notifyProjectCompleted: async (project: Project) => {...},
     notifyTestFailure: async (project: Project, testCase: TestCase) => {...},
   }
   ```

3. **Lark Message Format**
   ```json
   {
     "msg_type": "interactive",
     "card": {
       "header": {
         "title": { "tag": "plain_text", "content": "New Test Project Created" },
         "template": "blue"
       },
       "elements": [
         {
           "tag": "div",
           "fields": [
             { "is_short": true, "text": { "tag": "lark_md", "content": "**Project:** v2.5 Release" }},
             { "is_short": true, "text": { "tag": "lark_md", "content": "**Platform:** iOS" }},
             { "is_short": true, "text": { "tag": "lark_md", "content": "**Priority:** High" }},
             { "is_short": true, "text": { "tag": "lark_md", "content": "**Due:** Dec 15, 2024" }}
           ]
         },
         {
           "tag": "action",
           "actions": [
             {
               "tag": "button",
               "text": { "tag": "plain_text", "content": "View Project" },
               "url": "https://qa-checklist-automation.vercel.app/projects/xxx",
               "type": "primary"
             }
           ]
         }
       ]
     }
   }
   ```

4. **Integration Points**
   - `POST /api/projects` - After successful project creation
   - `PUT /api/checklists/test-results/[id]` - When status changes to "Fail"
   - Background job or cron - For due date reminders
   - `PUT /api/checklists/test-results/[id]` - Check if project completed (100%)

5. **Admin Settings (Optional)**
   - UI to configure which events trigger notifications
   - UI to test webhook connection
   - Option to enable/disable notifications per project

#### Lark Bot Setup Instructions

1. Open Lark Admin Console
2. Go to **Workplace** > **Custom Apps** > **Create App**
3. Add **Bot** capability
4. Go to **Bot** > **Webhook** > **Add Webhook**
5. Copy the webhook URL
6. Add to Vercel environment variables as `LARK_WEBHOOK_URL`

#### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `lib/services/webhookService.ts` | Create | Core webhook service |
| `lib/services/larkService.ts` | Create | Lark-specific message formatting |
| `app/api/projects/route.ts` | Modify | Add webhook trigger on create |
| `app/api/checklists/test-results/[id]/route.ts` | Modify | Add webhook trigger on fail/complete |
| `app/api/webhooks/test/route.ts` | Create | Endpoint to test webhook connection |
| `.env.local` | Modify | Add LARK_WEBHOOK_URL |

---

## Version 1.2 - Email Notifications

### Priority: Medium

#### Email Provider Options

| Provider | Free Tier | Pros | Cons |
|----------|-----------|------|------|
| **Resend** | 3,000/month | Modern API, easy setup | Newer service |
| **SendGrid** | 100/day | Reliable, well-documented | More complex setup |
| **AWS SES** | 62,000/month (with EC2) | Cheapest at scale | Requires AWS account |

#### Email Types

1. **Daily Digest** - Summary of project status
2. **Test Failure Alert** - Immediate email when tests fail
3. **Project Completion** - All tests done notification
4. **Due Date Reminder** - 1 day, 3 days before deadline
5. **Weekly Report** - Testing progress across all projects

#### Implementation

- Use React Email for templates
- Queue emails with background jobs
- User preferences for email frequency

---

## Version 1.3 - Browser Push Notifications

### Priority: Low

#### Features

- Real-time notifications when app is closed
- Notify when another tester updates a shared project
- Due date reminders

#### Technical Requirements

- Service Worker registration
- Web Push API
- Push notification server (can use Vercel Edge Functions)
- User permission handling

---

## Version 2.0 - Advanced Features

### Ideas for Future Consideration

1. **Slack/Discord Integration** - Similar to Lark webhook
2. **Microsoft Teams Integration** - For enterprise users
3. **API Access** - Public API for external integrations
4. **Custom Webhooks** - User-defined webhook URLs
5. **Zapier/Make Integration** - Connect to 1000+ apps
6. **Mobile App** - React Native or PWA enhancement
7. **Offline Support** - Work without internet, sync when connected
8. **AI Test Suggestions** - Auto-generate test cases from requirements

---

## How to Contribute

When implementing a feature from this roadmap:

1. Create a feature branch: `feature/lark-webhook`
2. Update this document to mark progress
3. Add tests for new functionality
4. Update ARCHITECTURE.md if needed
5. Create PR with reference to this roadmap item

---

## Status Legend

| Status | Meaning |
|--------|---------|
| Planned | On the roadmap, not started |
| In Progress | Currently being developed |
| Testing | Feature complete, in QA |
| Released | Available in production |

---

*Last Updated: November 2024*
