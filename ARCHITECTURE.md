# QA Checklist Automation - Architecture Documentation

This document provides technical documentation for developers who want to understand, contribute to, or fork the QA Checklist Automation project.

## Table of Contents
- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Routes](#api-routes)
- [Key Services](#key-services)
- [Authentication Flow](#authentication-flow)
- [Frontend Architecture](#frontend-architecture)
- [Environment Setup](#environment-setup)
- [Deployment](#deployment)

---

## Project Overview

QA Checklist Automation is a web-based platform designed for QA teams to:
- Maintain a **module library** of reusable test cases
- Create **test projects** for different releases/patches
- Build custom **checklists** by selecting modules
- Execute tests with **multi-tester collaboration**
- Track **progress** with visual indicators
- Attach **screenshots** and **notes** to test results

**Live URL**: https://qa-checklist-automation.vercel.app/
**Repository**: https://github.com/bfgfreud/qa-checklist-automation

### Core Design Principles
- **Full-Stack Next.js**: Unified frontend and backend in one codebase
- **Type Safety**: Full TypeScript with Zod validation
- **Multi-Tester Support**: Multiple testers can work on the same checklist simultaneously
- **Smart Polling**: 5-second polling with optimistic UI for real-time collaboration
- **Continuous Deployment**: Auto-deploy on push to main via Vercel

---

## Tech Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2.0 | Full-stack React framework (App Router) |
| React | 18.3.1 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.4.1 | Styling |

### Backend & Database
| Technology | Purpose |
|------------|---------|
| Supabase | PostgreSQL database + Auth + Storage |
| @supabase/supabase-js | JavaScript client |
| @supabase/ssr | Server-side rendering support |
| Zod | Schema validation |

### State Management & Data Fetching
| Technology | Purpose |
|------------|---------|
| @tanstack/react-query | Server state management & caching |
| React Context | Global app state (TesterContext) |

### UI & Interactions
| Technology | Purpose |
|------------|---------|
| @dnd-kit/core | Drag-and-drop functionality |
| @dnd-kit/sortable | Sortable lists |
| date-fns | Date formatting |

### Deployment
| Service | Purpose |
|---------|---------|
| Vercel | Hosting & auto-deployment |
| Supabase | Managed PostgreSQL & file storage |

---

## Project Structure

```
qa-checklist-automation/
├── app/                              # Next.js App Router
│   ├── api/                          # Backend API routes
│   │   ├── modules/                  # Module CRUD endpoints
│   │   ├── projects/                 # Project CRUD endpoints
│   │   ├── checklists/               # Checklist management
│   │   ├── testers/                  # Tester management
│   │   ├── test-results/             # Test result updates
│   │   └── attachments/              # File handling
│   ├── auth/callback/                # OAuth callback
│   ├── login/                        # Login page
│   ├── projects/                     # Project pages
│   │   ├── page.tsx                  # Projects list
│   │   └── [projectId]/
│   │       ├── page.tsx              # Overview mode
│   │       ├── edit/page.tsx         # Edit mode
│   │       └── work/page.tsx         # Work mode
│   └── modules/page.tsx              # Module library
│
├── components/                       # React components
│   ├── ui/                           # Reusable UI (Button, Modal, etc.)
│   ├── modules/                      # Module-specific components
│   ├── projects/                     # Project-specific components
│   ├── checklists/                   # Checklist components
│   ├── layout/                       # Layout components
│   └── providers/                    # Context providers
│
├── lib/                              # Backend logic
│   ├── services/                     # Business logic layer
│   │   ├── moduleService.ts
│   │   ├── projectService.ts
│   │   ├── checklistService.ts
│   │   ├── testerService.ts
│   │   └── attachmentService.ts
│   ├── validations/                  # Zod schemas
│   ├── db/supabase.ts                # Database client
│   ├── supabase-server.ts            # Server-side auth client
│   └── supabase-browser.ts           # Client-side auth client
│
├── types/                            # TypeScript type definitions
│   ├── checklist.ts
│   ├── module.ts
│   ├── project.ts
│   ├── tester.ts
│   └── attachment.ts
│
├── contexts/                         # React contexts
│   └── TesterContext.tsx             # Current tester state
│
├── hooks/                            # Custom React hooks
│   └── queries/                      # React Query hooks
│
└── public/                           # Static assets
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────────────┐
│  base_modules   │       │     test_projects       │
├─────────────────┤       ├─────────────────────────┤
│ id (PK)         │       │ id (PK)                 │
│ name            │       │ name                    │
│ description     │       │ description             │
│ thumbnail_url   │       │ version                 │
│ tags            │       │ platform                │
│ order_index     │       │ status                  │
│ created_by      │       │ priority                │
└────────┬────────┘       │ due_date                │
         │                └───────────┬─────────────┘
         │ 1:N                        │ 1:N
         ▼                            ▼
┌─────────────────┐       ┌─────────────────────────┐
│ base_testcases  │       │  project_checklists     │
├─────────────────┤       ├─────────────────────────┤
│ id (PK)         │       │ id (PK)                 │
│ module_id (FK)  │◄──────│ module_id (FK)          │
│ title           │       │ project_id (FK)         │
│ description     │       │ module_name             │
│ priority        │       │ instance_label          │
│ order_index     │       │ order_index             │
└─────────────────┘       └───────────┬─────────────┘
                                      │ 1:N
                                      ▼
                          ┌─────────────────────────┐
                          │ checklist_test_results  │
                          ├─────────────────────────┤
┌─────────────────┐       │ id (PK)                 │
│    testers      │       │ project_checklist_      │
├─────────────────┤       │   module_id (FK)        │
│ id (PK)         │◄──────│ testcase_id (FK)        │
│ name            │       │ tester_id (FK)          │
│ email           │       │ status                  │
│ color           │       │ notes                   │
│ auth_user_id    │       │ tested_at               │
└────────┬────────┘       └───────────┬─────────────┘
         │                            │ 1:N
         │ N:M                        ▼
         ▼                ┌─────────────────────────┐
┌─────────────────┐       │ test_case_attachments   │
│ project_testers │       ├─────────────────────────┤
├─────────────────┤       │ id (PK)                 │
│ project_id (FK) │       │ test_result_id (FK)     │
│ tester_id (FK)  │       │ file_url                │
│ assigned_at     │       │ file_name               │
└─────────────────┘       │ file_type               │
                          └─────────────────────────┘
```

### Table Details

#### base_modules
Master library of test modules.
```sql
id              UUID PRIMARY KEY
name            TEXT NOT NULL
description     TEXT
thumbnail_url   TEXT
thumbnail_file_name TEXT
tags            JSONB (array of strings)
order_index     INTEGER
created_by      TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### base_testcases
Test cases within modules.
```sql
id              UUID PRIMARY KEY
module_id       UUID REFERENCES base_modules
title           TEXT NOT NULL
description     TEXT
priority        TEXT ('High' | 'Medium' | 'Low')
order_index     INTEGER
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### test_projects
Testing projects/cycles.
```sql
id              UUID PRIMARY KEY
name            TEXT NOT NULL UNIQUE
description     TEXT
version         TEXT
platform        TEXT
status          TEXT ('Draft' | 'In Progress' | 'Completed')
priority        TEXT ('High' | 'Medium' | 'Low')
due_date        DATE
created_by      TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### project_checklists
Modules added to a project's checklist.
```sql
id              UUID PRIMARY KEY
project_id      UUID REFERENCES test_projects
module_id       UUID REFERENCES base_modules
module_name     TEXT (denormalized)
module_description TEXT
instance_label  TEXT (custom name like "Boss Fight 1")
instance_number INTEGER
order_index     INTEGER
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### checklist_test_results
Execution results (one per tester per test case).
```sql
id                          UUID PRIMARY KEY
project_checklist_module_id UUID REFERENCES project_checklists
testcase_id                 UUID REFERENCES base_testcases
tester_id                   UUID REFERENCES testers
testcase_title              TEXT (denormalized)
testcase_description        TEXT
testcase_priority           TEXT
status                      TEXT ('Pending' | 'Pass' | 'Fail' | 'Skipped')
notes                       TEXT
tested_at                   TIMESTAMP
display_order               INTEGER
created_at                  TIMESTAMP
updated_at                  TIMESTAMP
```

#### testers
Users who perform testing.
```sql
id              UUID PRIMARY KEY
name            TEXT NOT NULL
email           TEXT UNIQUE
color           TEXT (hex color for avatar)
auth_user_id    UUID (links to Supabase Auth)
created_at      TIMESTAMP
```

#### project_testers
Many-to-many: testers assigned to projects.
```sql
project_id      UUID REFERENCES test_projects
tester_id       UUID REFERENCES testers
assigned_at     TIMESTAMP
PRIMARY KEY (project_id, tester_id)
```

#### test_case_attachments
Image attachments for test results.
```sql
id              UUID PRIMARY KEY
test_result_id  UUID REFERENCES checklist_test_results
file_url        TEXT NOT NULL
file_name       TEXT NOT NULL
file_type       TEXT (MIME type)
file_size       INTEGER
uploaded_at     TIMESTAMP
```

---

## API Routes

### Module Management
```
GET    /api/modules                     Get all modules with test cases
POST   /api/modules                     Create new module
GET    /api/modules/[id]                Get single module
PATCH  /api/modules/[id]                Update module
DELETE /api/modules/[id]                Delete module
POST   /api/modules/reorder             Reorder modules
POST   /api/modules/thumbnail           Upload module thumbnail
POST   /api/modules/[id]/testcases      Create test case
POST   /api/testcases/[id]              Update test case
DELETE /api/testcases/[id]              Delete test case
POST   /api/testcases/reorder           Reorder test cases
```

### Project Management
```
GET    /api/projects                    Get all projects
POST   /api/projects                    Create new project
GET    /api/projects/[projectId]        Get project details
PATCH  /api/projects/[projectId]        Update project
DELETE /api/projects/[projectId]        Delete project
GET    /api/projects/[projectId]/testers      Get assigned testers
POST   /api/projects/[projectId]/testers      Assign tester
DELETE /api/projects/[projectId]/testers/[id] Remove tester
```

### Checklist Management
```
GET    /api/checklists/[projectId]              Get checklist
       ?view=multi-tester                       Multi-tester view
POST   /api/checklists/modules                  Add module to checklist
DELETE /api/checklists/modules/[id]             Remove module
POST   /api/checklists/[projectId]/checklist/reorder  Reorder modules
```

### Test Results
```
GET    /api/checklists/test-results/[id]        Get test result
POST   /api/checklists/test-results/[id]        Update test result
POST   /api/test-results/[id]/attachments       Upload attachment
DELETE /api/attachments/[id]                    Delete attachment
```

### Tester Management
```
GET    /api/testers                     Get all testers
POST   /api/testers                     Create tester
GET    /api/testers/[id]                Get tester
PATCH  /api/testers/[id]                Update tester
DELETE /api/testers/[id]                Delete tester
```

### API Response Format
All API responses follow this structure:
```typescript
{
  success: boolean;
  data?: T;
  error?: string;
}
```

---

## Key Services

### moduleService.ts
Manages the module library.
```typescript
getAllModules()              // Get all modules with test cases
getModuleById(id)            // Get single module
createModule(input)          // Create new module
updateModule(id, input)      // Update module
deleteModule(id)             // Delete module
reorderModules(modules)      // Reorder by drag-drop
createTestCase(input)        // Add test case to module
updateTestCase(id, input)    // Update test case
deleteTestCase(id)           // Delete test case
```

### projectService.ts
Manages test projects.
```typescript
getAllProjects()             // Get all projects
getProjectById(id)           // Get project details
createProject(input)         // Create project
updateProject(id, input)     // Update project
deleteProject(id)            // Delete project
getProjectTesters(id)        // Get assigned testers
assignTesterToProject(...)   // Add tester to project
removeTesterFromProject(...) // Remove tester
```

### checklistService.ts
Handles checklist building and test execution.
```typescript
getProjectChecklist(id)               // Get checklist (legacy)
getProjectChecklistWithTesters(id)    // Get multi-tester view
addModuleToChecklist(projectId, ...)  // Add module
removeModuleFromChecklist(id)         // Remove module
updateTestResult(resultId, input)     // Update status/notes
reorderChecklistModules(modules)      // Reorder modules
```

### testerService.ts
Manages tester accounts.
```typescript
getAllTesters()              // Get all testers
getTesterById(id)            // Get tester details
createTester(input)          // Create new tester
updateTester(id, input)      // Update name/color
deleteTester(id)             // Delete tester
```

### attachmentService.ts
Handles image uploads.
```typescript
uploadAttachment(file, testResultId)  // Upload to Supabase Storage
getAttachments(testResultId)          // Get attachments for result
deleteAttachment(id)                  // Delete file and record
```

---

## Authentication Flow

### Google OAuth via Supabase

```
1. User clicks "Sign in with Google" on /login
   └─► supabase.auth.signInWithOAuth({ provider: 'google' })

2. User authenticates with Google
   └─► Google redirects to /auth/callback?code=xxx

3. OAuth callback exchanges code for session
   └─► supabase.auth.exchangeCodeForSession(code)

4. Session stored in cookies
   └─► User redirected to /projects

5. TesterContext detects auth state change
   └─► Finds or creates tester from Google user metadata
   └─► Sets currentTester state
```

### TesterContext
Global context providing:
- `currentTester` - Current authenticated tester
- `user` - Supabase Auth user
- `signOut()` - Sign out function
- `updateProfile(name, color)` - Update profile

Auto-creates tester when user first signs in using:
- Name from Google profile (or email prefix)
- Random color from preset palette
- Email linked to auth user

---

## Frontend Architecture

### 3-Mode System for Projects

| Mode | Route | Purpose |
|------|-------|---------|
| **Overview** | `/projects/[id]` | View project details, progress, assigned testers |
| **Edit** | `/projects/[id]/edit` | Build checklist, add/remove modules, assign testers |
| **Work** | `/projects/[id]/work` | Execute tests, update statuses, add notes/attachments |

### State Management

**React Query** (server state):
- Caches API responses
- Auto-refetches on focus
- Used for modules, projects, checklists

**TesterContext** (global state):
- Current authenticated tester
- Auth state management

**Local Component State**:
- UI state (expanded sections, modals)
- Form inputs
- Optimistic updates

### Smart Polling (Work Mode)
```typescript
// 5-second polling for real-time collaboration
useQuery({
  queryKey: ['checklist', projectId],
  queryFn: fetchChecklist,
  refetchInterval: 5000,
  // Keep previous data while fetching to prevent flicker
  placeholderData: (prev) => prev,
});
```

### Component Organization
```
components/
├── ui/                    # Generic, reusable
│   ├── Button.tsx
│   ├── Modal.tsx
│   ├── ProgressBar.tsx
│   ├── ImageUploader.tsx
│   └── ImageGallery.tsx
├── modules/               # Module library specific
│   ├── ModuleCard.tsx
│   └── ModuleForm.tsx
├── projects/              # Project specific
│   ├── ProjectCard.tsx
│   └── ProjectForm.tsx
└── checklists/            # Checklist specific
    ├── AddModuleDialog.tsx
    └── TestCaseItem.tsx
```

---

## Environment Setup

### Required Environment Variables

Create `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key]
SUPABASE_SERVICE_ROLE_KEY=[service_role_key]

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Supabase Setup

1. Create Supabase project at https://supabase.com
2. Enable Google OAuth in Authentication > Providers
3. Add redirect URL: `https://your-domain.com/auth/callback`
4. Create storage bucket `test-attachments` (public)
5. Run database migrations (in `supabase/migrations/`)

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run production build locally
npm start
```

---

## Deployment

### Vercel (Recommended)

1. Connect GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy - auto-deploys on push to `main`

### Environment Variables in Vercel
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL (set to production URL)
```

### Deployment Flow
```
Push to main → Vercel builds → Preview → Production
                    │
                    └─► Preview deployments for feature branches
```

---

## Performance Optimizations

### Client-Side
- React Query caching with `staleTime: 0` for dynamic data
- Image lazy loading
- `useMemo` for expensive calculations
- Optimistic UI updates

### Server-Side
- Database indexes on foreign keys
- Denormalized fields to avoid JOINs
- No N+1 queries (batch fetching)

### Database Indexes
```sql
-- Key performance indexes
CREATE INDEX idx_checklist_test_results_module_id ON checklist_test_results(project_checklist_module_id);
CREATE INDEX idx_checklist_test_results_tester_id ON checklist_test_results(tester_id);
CREATE INDEX idx_project_checklist_modules_project_id ON project_checklist_modules(project_id);
CREATE INDEX idx_base_testcases_module_id ON base_testcases(module_id);
CREATE INDEX idx_test_case_attachments_result_id ON test_case_attachments(test_result_id);
```

---

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Make changes with TypeScript types
4. Run `npm run build` to check for errors
5. Submit pull request

### Code Style
- TypeScript strict mode
- Zod validation for all API inputs
- Tailwind CSS for styling
- Functional components with hooks
