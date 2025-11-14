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
⏳ Awaiting Supabase setup
⏳ Ready for feature development

## Next Steps
1. Set up Supabase database
2. Create database schema (Backend Agent)
3. Build Module Management feature
4. Build Project Management feature
5. Build Checklist Builder and Execution features

---
Last updated: 2025-01-14
