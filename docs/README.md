# QA Checklist Automation - Documentation

**Last Updated**: 2025-01-17

## Overview

QA Checklist Automation is a web-based tool that helps QA teams manage and execute test checklists. It provides a centralized library of test modules and testcases that can be reused across different testing projects.

## Live Application

- **URL**: https://qa-checklist-automation.vercel.app/
- **GitHub**: https://github.com/bfgfreud/qa-checklist-automation

## Features

### Module Library
- Create and manage a library of reusable test modules
- Each module contains multiple testcases
- Add reference images to testcases for visual guidance
- Upload thumbnail images for modules
- Drag-and-drop reordering for modules and testcases
- Tags for organizing modules

### Project Management
- Create test projects for different releases/patches
- Three-mode project system:
  - **Overview**: View project summary and progress
  - **Edit Mode**: Build and customize the checklist
  - **Work Mode**: Execute tests and track results
- Archive and restore projects
- Multi-tester support per project

### Checklist Builder (Edit Mode)
- Drag-and-drop modules from library to project checklist
- Create custom modules not from the library
- Add/remove testcases within modules
- Create custom testcases with reference images
- Reorder modules and testcases
- Import checklist structure from another project
- Instance labeling for multiple instances of same module

### Checklist Execution (Work Mode)
- Multi-tester support with dedicated columns per tester
- Test statuses: Pending, Pass, Fail, Skipped
- Add notes per test result
- Upload evidence images per test result
- Real-time progress tracking
- Expandable/collapsible test descriptions
- Reference image display on hover

### Images & Attachments
- **Module Thumbnails**: Visual identification for modules
- **Testcase Reference Images**: Visual guidance for test steps
- **Evidence Attachments**: Upload screenshots/images as test evidence
- **Lightbox Viewer**: Full-size image viewing

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Deployment**: Vercel
- **Drag & Drop**: @dnd-kit

## Database Tables

| Table | Description |
|-------|-------------|
| `base_modules` | Master test modules library |
| `base_testcases` | Testcases within modules (with reference images) |
| `test_projects` | Testing projects/releases |
| `project_checklist_modules` | Module instances in project checklists |
| `checklist_test_results` | Individual test results per tester |
| `testers` | Tester profiles |
| `test_case_attachments` | Evidence images for test results |

## API Endpoints

### Modules
- `GET /api/modules` - List all modules
- `POST /api/modules` - Create module
- `GET /api/modules/[id]` - Get module details
- `PUT /api/modules/[id]` - Update module
- `DELETE /api/modules/[id]` - Delete module
- `POST /api/modules/thumbnail` - Upload module thumbnail
- `PUT /api/modules/reorder` - Reorder modules

### Testcases
- `GET /api/modules/[id]/testcases` - List testcases in module
- `POST /api/modules/[id]/testcases` - Create testcase
- `PUT /api/testcases/[id]` - Update testcase
- `DELETE /api/testcases/[id]` - Delete testcase
- `POST /api/testcases/[id]/image` - Upload testcase reference image
- `DELETE /api/testcases/[id]/image` - Remove testcase image
- `POST /api/custom-testcase-images` - Upload image for new custom testcase

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/[id]` - Get project details
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project
- `POST /api/projects/[id]/archive` - Archive project
- `POST /api/projects/[id]/restore` - Restore archived project
- `GET /api/projects/archive` - List archived projects

### Checklists
- `GET /api/projects/[id]/checklist` - Get project checklist
- `POST /api/checklists/modules` - Add module to checklist
- `DELETE /api/checklists/modules/[id]` - Remove module from checklist
- `POST /api/checklists/modules/[id]/testcases` - Add custom testcase
- `PUT /api/checklists/test-results/[id]` - Update test result

### Testers
- `GET /api/testers` - List all testers
- `POST /api/testers` - Create tester
- `GET /api/projects/[id]/testers` - List project testers
- `POST /api/projects/[id]/testers` - Assign tester to project

### Attachments
- `GET /api/test-results/[id]/attachments` - List attachments
- `POST /api/test-results/[id]/attachments` - Upload attachment
- `DELETE /api/test-results/[id]/attachments/[attachmentId]` - Delete attachment

## User Guide

### Getting Started
1. **Create Modules**: Go to Module Library and create test modules with testcases
2. **Create Project**: Go to Projects and create a new testing project
3. **Assign Testers**: Add testers to the project
4. **Build Checklist**: In Edit Mode, drag modules from library to build your checklist
5. **Execute Tests**: In Work Mode, testers can mark tests and add evidence

### Adding Reference Images
1. In Module Library, click on a testcase to edit
2. Click the image upload area to select an image
3. The image will appear as a thumbnail indicator
4. Hover over the indicator to preview, click for full size

### Multi-Tester Workflow
1. Assign multiple testers to a project
2. Each tester gets their own column in Work Mode
3. Testers can only update their own results
4. Progress shows weakest status across all testers

## Development

See `PROJECT_STRUCTURE.md` for detailed folder organization.

### Local Setup
```bash
# Clone repository
git clone https://github.com/bfgfreud/qa-checklist-automation.git
cd qa-checklist-automation

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Changelog

### 2025-01-17
- Added testcase reference images for Module Library
- Added testcase reference images for custom testcases in Edit Mode
- Images display in Overview, Edit Mode, and Work Mode

### 2025-01-25 (V2 Release)
- Complete rebuild with multi-tester support
- Three-mode project system (Overview/Edit/Work)
- Custom modules and custom testcases
- Import checklist from another project
- Module thumbnails
- Test result attachments with lightbox
- Project archive/restore functionality
