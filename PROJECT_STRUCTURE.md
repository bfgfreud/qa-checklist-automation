# Project Structure - QA Checklist Automation

**Last Updated**: 2025-01-17

## Folder Organization

```
qa-checklist-automation/
├── app/                         # Next.js App Router (pages & API routes)
│   ├── layout.tsx              # Root layout with global styles
│   ├── page.tsx                # Home page (redirects to /projects)
│   ├── globals.css             # Global Tailwind styles
│   ├── modules/                # Module Library page
│   │   └── page.tsx            # CRUD for base modules and testcases
│   ├── projects/               # Projects pages
│   │   ├── page.tsx            # Projects list
│   │   └── [projectId]/        # Dynamic project routes
│   │       ├── page.tsx        # Project Overview mode
│   │       ├── edit/           # Project Edit mode
│   │       │   └── page.tsx    # Checklist builder with drag-and-drop
│   │       └── work/           # Project Work mode
│   │           └── page.tsx    # Checklist execution UI
│   ├── login/                  # Login page
│   │   └── page.tsx
│   ├── auth/                   # Auth callback
│   │   └── callback/
│   │       └── route.ts
│   └── api/                    # API Routes
│       ├── modules/            # Module CRUD APIs
│       │   ├── route.ts        # GET all, POST new module
│       │   ├── reorder/        # PUT reorder modules
│       │   ├── thumbnail/      # POST upload module thumbnail
│       │   └── [id]/           # Single module operations
│       │       ├── route.ts    # GET, PUT, DELETE module
│       │       └── testcases/  # Testcase CRUD for module
│       │           └── route.ts
│       ├── projects/           # Project CRUD APIs
│       │   ├── route.ts        # GET all, POST new project
│       │   ├── archive/        # GET archived projects
│       │   └── [projectId]/    # Single project operations
│       │       ├── route.ts    # GET, PUT, DELETE project
│       │       ├── checklist/  # Checklist operations
│       │       │   └── route.ts
│       │       ├── archive/    # POST archive project
│       │       ├── restore/    # POST restore project
│       │       └── testers/    # Project tester management
│       │           ├── route.ts
│       │           └── [testerId]/
│       │               └── route.ts
│       ├── checklists/         # Checklist APIs
│       │   ├── modules/        # Checklist module operations
│       │   │   ├── route.ts    # POST add module to checklist
│       │   │   └── [id]/       # Single checklist module
│       │   │       ├── route.ts
│       │   │       └── testcases/
│       │   │           └── route.ts  # POST custom testcase
│       │   └── test-results/   # Test result operations
│       │       └── [id]/
│       │           └── route.ts  # PUT update test result
│       ├── testcases/          # Testcase APIs
│       │   ├── reorder/        # PUT reorder testcases
│       │   └── [id]/           # Single testcase operations
│       │       ├── route.ts    # GET, PUT, DELETE
│       │       └── image/      # POST/DELETE testcase image
│       │           └── route.ts
│       ├── custom-testcase-images/  # Upload images for new custom testcases
│       │   └── route.ts
│       ├── testers/            # Tester APIs
│       │   ├── route.ts        # GET all, POST new tester
│       │   └── [id]/
│       │       └── route.ts    # GET, PUT, DELETE tester
│       ├── test-results/       # Test result attachments
│       │   └── [id]/
│       │       └── attachments/
│       │           └── route.ts
│       └── setup/              # Setup utilities
│           └── storage/
│               └── route.ts    # POST create storage buckets
│
├── components/                  # React Components
│   ├── ui/                     # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Select.tsx
│   │   ├── Textarea.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── TruncatedText.tsx
│   │   ├── ImageIndicator.tsx  # Testcase reference image indicator
│   │   └── ...
│   ├── modules/                # Module-specific components
│   │   ├── ModuleCard.tsx
│   │   ├── ModuleForm.tsx
│   │   ├── TestCaseForm.tsx
│   │   ├── TestCaseItem.tsx
│   │   ├── TestCaseImageUpload.tsx  # Image upload for testcases
│   │   └── SortableTestCase.tsx
│   ├── projects/               # Project-specific components
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectForm.tsx
│   │   └── ProjectCardSkeleton.tsx
│   └── checklists/             # Checklist components
│       ├── AddModuleDialog.tsx
│       ├── AddTestCaseDialog.tsx
│       ├── ImportChecklistDialog.tsx
│       ├── TesterCard.tsx
│       └── ...
│
├── lib/                         # Utilities and Services
│   ├── supabase.ts             # Supabase client configuration
│   ├── services/               # Business logic layer
│   │   ├── moduleService.ts    # Module CRUD operations
│   │   ├── projectService.ts   # Project CRUD operations
│   │   ├── checklistService.ts # Checklist operations
│   │   ├── testerService.ts    # Tester management
│   │   └── attachmentService.ts # File attachment handling
│   └── validations/            # Zod validation schemas
│       ├── module.schema.ts    # Module/testcase validation
│       ├── project.schema.ts   # Project validation
│       └── checklist.schema.ts # Checklist validation
│
├── types/                       # TypeScript type definitions
│   ├── module.ts               # Module and testcase types
│   ├── project.ts              # Project types
│   ├── checklist.ts            # Checklist and test result types
│   ├── tester.ts               # Tester types
│   └── attachment.ts           # Attachment types
│
├── supabase/                    # Database migrations
│   └── migrations/             # SQL migration files
│       ├── 001_initial_schema.sql
│       ├── 002_add_testers.sql
│       ├── 003_add_attachments.sql
│       ├── 20250117_add_testcase_image.sql
│       └── 20250117_add_custom_testcase_image.sql
│
├── public/                      # Static assets
│   ├── favicon.ico
│   ├── icon.png
│   └── apple-icon.png
│
├── .claude/                     # Claude Code configuration
│   ├── CLAUDE.md               # Main project documentation
│   └── agents/                 # Agent prompt files
│       ├── frontend-dev.md
│       ├── backend-dev-qa-automation.md
│       ├── devops-integration-specialist.md
│       └── qa-automation-tester.md
│
├── docs/                        # Additional documentation
│   └── README.md
│
├── integration/                 # DevOps/Integration files
│   └── README.md
│
├── tests/                       # Test files (future)
│   └── README.md
│
├── .env.local                   # Local environment variables (gitignored)
├── .env.example                 # Environment variable template
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── middleware.ts               # Auth middleware
├── PROJECT_STRUCTURE.md        # This file
├── SETUP_GUIDE.md              # Initial setup instructions
└── README.md                   # Project README
```

## Key Features by Area

### Module Library (`/app/modules/`)
- CRUD operations for base modules
- CRUD operations for testcases within modules
- Drag-and-drop reordering for modules and testcases
- Module thumbnail image upload
- Testcase reference image upload

### Project Management (`/app/projects/`)
- Create, edit, archive, restore projects
- Multi-tester assignment per project
- Three-mode system: Overview, Edit, Work

### Project Edit Mode (`/app/projects/[projectId]/edit/`)
- Drag-and-drop modules from library to checklist
- Add custom modules (not from library)
- Add/remove testcases from modules
- Create custom testcases with reference images
- Reorder modules and testcases
- Import checklist from another project

### Project Work Mode (`/app/projects/[projectId]/work/`)
- Execute checklist with Pass/Fail/Pending/Skipped statuses
- Multi-tester support (each tester has their own column)
- Add notes per test result
- Upload evidence images per test result
- Real-time progress tracking with 5-second polling

### API Structure
- RESTful API routes using Next.js App Router
- Zod validation for all inputs
- Service layer pattern for business logic
- Supabase for database and file storage

## Image Storage

Images are stored in Supabase Storage:
- **Bucket**: `testcase-images`
  - Module thumbnails: `{moduleId}/{filename}`
  - Library testcase images: `{testcaseId}/{filename}`
  - Custom testcase images: `custom/{uuid}.{ext}`
- **Bucket**: `test-attachments`
  - Test result evidence images

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Zod validation
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Deployment**: Vercel (auto-deploy from GitHub)
- **Drag & Drop**: @dnd-kit/core, @dnd-kit/sortable
