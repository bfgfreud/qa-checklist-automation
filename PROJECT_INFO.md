# QA Checklist Automation - Project Information

## Live Deployment
- **Production URL**: https://qa-checklist-automation.vercel.app/
- **Status**: Live and auto-deploying ✅

## Repository
- **GitHub**: https://github.com/bfgfreud/qa-checklist-automation
- **Branch**: main
- **Auto-deploy**: Enabled (every push to main deploys automatically)

## Tech Stack
- **Frontend**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Hosting**: Vercel
- **Database**: Supabase (pending setup)
- **Version Control**: GitHub

## Branding
- **Company**: Bonfire Gathering
- **Primary Color**: Orange (#FF6B35)
- **Theme**: Dark mode (black background)

## Project Structure
```
QA Checklist Automation/
├── app/                    # Next.js app (currently homepage)
├── frontend/              # Future: Frontend components
├── backend/               # Future: API routes and services
├── tests/                 # Future: Automated tests
├── shared/                # Future: Shared types and utilities
└── docs/                  # Documentation
```

## Deployment Workflow
1. Make changes locally
2. Commit: `git add . && git commit -m "description"`
3. Push: `git push origin main`
4. Vercel automatically builds and deploys
5. Live in ~1-2 minutes

## Environment Variables (for future Supabase integration)
Add these in Vercel Dashboard → Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (already set: https://qa-checklist-automation.vercel.app)

## Current Status
✅ Homepage deployed with Bonfire Gathering branding
✅ Supabase setup complete
✅ Module Library feature complete with CSV import/export
⏳ Ready for Projects page development

## Documentation

### Quick Start
- [QUICK_START.md](./QUICK_START.md) - Get started quickly
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed setup instructions

### Feature Documentation
- [docs/MODULE_LIBRARY_GUIDE.md](./docs/MODULE_LIBRARY_GUIDE.md) - Complete Module Library documentation
- [docs/CSV_IMPORT_EXPORT.md](./docs/CSV_IMPORT_EXPORT.md) - CSV import/export guide

### Technical Documentation
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Folder structure and architecture
- [API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md) - API endpoint testing
- [SUPABASE_TEST_INSTRUCTIONS.md](./SUPABASE_TEST_INSTRUCTIONS.md) - Database testing

## Completed Features

### 1. Module Library (`/modules`)
- ✅ Full CRUD operations for modules and test cases
- ✅ Drag-and-drop reordering
- ✅ Draft mode with save/cancel
- ✅ CSV bulk import/export
- ✅ Multi-tag support
- ✅ Search and filtering
- ✅ Duplicate name validation
- ✅ Collapse/expand functionality

See [docs/MODULE_LIBRARY_GUIDE.md](./docs/MODULE_LIBRARY_GUIDE.md) for detailed documentation.

## Next Steps
1. Build Projects page (similar to Modules, manages test projects)
2. Build Checklist Builder (select modules → generate project checklists)
3. Build Checklist Execution (run checklists, mark pass/fail)
4. Add user authentication
5. Add tag filtering in Module Library

---
Last updated: 2025-01-17
