# Integration Domain - QA Checklist Automation

**Agent**: `devops-integration`
**Last Updated**: 2025-01-14

## Overview
This folder contains all infrastructure, configuration, deployment scripts, and integration setup for the QA Checklist Automation project.

## Folder Structure
```
integration/
├── config/                  # Configuration files
│   ├── next.config.js      # Next.js configuration
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   └── tsconfig.json       # TypeScript configuration
├── scripts/                # Build and deployment scripts
│   ├── setup-env.sh        # Environment setup
│   └── db-migrate.sh       # Database migration runner
├── .github/
│   └── workflows/          # GitHub Actions CI/CD
│       ├── ci.yml          # Continuous Integration
│       └── deploy.yml      # Deployment workflow
└── docker/                 # Docker configuration (future)
```

## Current Tasks
- [ ] Initialize Next.js project with proper structure
- [ ] Set up GitHub repository and push initial code
- [ ] Configure Vercel project and environment variables
- [ ] Set up Supabase project and database
- [ ] Create environment variable template (.env.example)
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Configure path aliases in TypeScript
- [ ] Set up folder structure (frontend/, backend/, etc.)
- [ ] Create initial database migration
- [ ] Verify deployment pipeline

## Infrastructure Stack
- **Hosting**: Vercel
- **Database**: Supabase (PostgreSQL)
- **Version Control**: GitHub
- **CI/CD**: GitHub Actions
- **Package Manager**: npm

## Environment Variables

### Required Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...

# App Configuration
NEXT_PUBLIC_APP_URL=https://qa-checklist.vercel.app

# Future: Email Service
RESEND_API_KEY=re_xxxx
```

### Environment Files
- `.env.local` - Local development (gitignored)
- `.env.example` - Template for developers
- Vercel Dashboard - Production/Preview variables

### Setting Up Locally
1. Copy `.env.example` to `.env.local`
2. Fill in Supabase credentials
3. Set `NEXT_PUBLIC_APP_URL=http://localhost:3000`

## Project Initialization

### 1. Create Next.js Project
```bash
npx create-next-app@latest qa-checklist-automation \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --use-npm
```

### 2. Install Dependencies
```bash
cd qa-checklist-automation
npm install @supabase/supabase-js zod react-hook-form @hookform/resolvers
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install @tanstack/react-table lucide-react
npm install -D @types/node @types/react
```

### 3. Create Folder Structure
```bash
# Create domain folders
mkdir -p frontend/app frontend/components frontend/hooks frontend/styles frontend/public
mkdir -p backend/api backend/services backend/models backend/validations backend/db/migrations backend/db/seeds
mkdir -p integration/config integration/scripts integration/.github/workflows
mkdir -p tests/unit tests/integration tests/e2e tests/fixtures tests/utils
mkdir -p shared/types shared/constants shared/utils
mkdir -p docs

# Move Next.js defaults into frontend/
# Configure path aliases
```

### 4. Configure TypeScript Paths
Edit `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/frontend/*": ["./frontend/*"],
      "@/backend/*": ["./backend/*"],
      "@/shared/*": ["./shared/*"],
      "@/tests/*": ["./tests/*"]
    }
  }
}
```

## GitHub Setup

### 1. Initialize Git
```bash
git init
git add .
git commit -m "chore: initial project setup"
```

### 2. Create Repository
Follow `SETUP_GUIDE.md` Step 1

### 3. Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/qa-checklist-automation.git
git branch -M main
git push -u origin main
```

### 4. Branch Protection (Optional)
- Require PR reviews before merging to main
- Require status checks to pass
- Enable automatic deletion of branches

## Vercel Setup

### 1. Import Project
Follow `SETUP_GUIDE.md` Step 2

### 2. Configure Build Settings
- Framework: Next.js (auto-detected)
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`
- Root Directory: `./`

### 3. Environment Variables
Add in Vercel Dashboard → Project → Settings → Environment Variables:
- All variables from `.env.example`
- Apply to Production, Preview, and Development

### 4. Deployment Triggers
- **Production**: Pushes to `main` branch
- **Preview**: Pushes to any other branch and PRs
- Automatic deployments enabled by default

## Supabase Setup

### 1. Create Project
Follow `SETUP_GUIDE.md` Step 3

### 2. Get Credentials
- Project URL
- anon (public) key
- service_role key (KEEP SECRET!)

### 3. Apply Migrations
```bash
# Install Supabase CLI (optional, can also use Supabase dashboard)
npm install -g supabase

# Link to project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

Or use Supabase Dashboard SQL Editor to run migration files manually.

### 4. Row Level Security (Future)
When user authentication is added:
- Enable RLS on all tables
- Create policies for authenticated users
- Restrict service_role key to server-side only

## CI/CD Pipeline

### GitHub Actions: CI Workflow
`.github/workflows/ci.yml`
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build

      - name: Run tests
        run: npm test
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

### Deployment
Handled automatically by Vercel GitHub integration. No separate deployment workflow needed.

## Package.json Scripts

Add these scripts:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "db:migrate": "supabase db push",
    "db:reset": "supabase db reset"
  }
}
```

## Next.js Configuration

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Experimental features
  experimental: {
    serverActions: true,
  },

  // Image optimization
  images: {
    domains: ['your-supabase-url.supabase.co'],
  },
}

module.exports = nextConfig
```

## Tailwind Configuration

### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './frontend/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom color palette
      },
    },
  },
  plugins: [],
}
```

## Git Ignore

### .gitignore
```
# Dependencies
node_modules/

# Next.js
.next/
out/

# Environment variables
.env
.env.local
.env.*.local

# Testing
coverage/

# Misc
.DS_Store
*.log
```

## Deployment Workflow

### Standard Deployment Process
1. Developer creates feature branch: `feature/<type>-<name>`
2. Developer pushes code → Vercel creates preview deployment
3. GitHub Actions runs CI (type-check, lint, build, test)
4. Review preview deployment
5. Create PR to `main`
6. After approval, merge to `main`
7. Vercel automatically deploys to production
8. Verify production deployment

### Hotfix Process
1. Create branch: `hotfix/<issue>`
2. Fix and test
3. Push → Preview deployment
4. Fast-track merge to `main`
5. Auto-deploy to production

## Monitoring & Debugging

### Vercel Logs
- View deployment logs in Vercel dashboard
- Check runtime logs for errors
- Monitor performance metrics

### Supabase Dashboard
- Query logs
- Connection pooling status
- Database performance

## Development Workflow

### 1. Before Starting
- Ensure all infrastructure is set up
- Verify environment variables are correct
- Check that database is accessible

### 2. During Development
- Coordinate with all agents on configuration needs
- Manage environment variables
- Handle deployment issues
- Monitor build performance

### 3. After Completing Setup
- Update this README with any changes
- Document new configurations
- Report to Coordinator

## Troubleshooting

### Build Failures
- Check environment variables in Vercel
- Verify all dependencies in package.json
- Check TypeScript errors in build logs

### Database Connection Issues
- Verify Supabase credentials
- Check if Supabase project is paused (free tier)
- Test connection from local environment

### Deployment Errors
- Check Vercel deployment logs
- Verify build command and output directory
- Ensure migrations are applied

## Communication

### With Frontend Agent
- Provide environment variables for API endpoints
- Resolve build configuration issues
- Coordinate on deployment timing

### With Backend Agent
- Set up database and migrations
- Manage Supabase credentials
- Coordinate on API route configuration

### With QA Agent
- Integrate test runner into CI/CD
- Set up test environment
- Provide test database credentials

### With Coordinator
- Report infrastructure status
- Escalate deployment issues
- Document configuration decisions

## Security Checklist
- [ ] `.env.local` in `.gitignore`
- [ ] Service role key only in server-side code
- [ ] Environment variables set in Vercel
- [ ] No hardcoded credentials in code
- [ ] HTTPS enabled (automatic with Vercel)

## Resources
- [Vercel Docs](https://vercel.com/docs)
- [GitHub Actions](https://docs.github.com/actions)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Next.js Config](https://nextjs.org/docs/api-reference/next.config.js/introduction)

## Notes
- All configuration changes should be documented here
- Keep environment variable template updated
- Test deployments in preview before production
- Monitor build times and optimize if needed
