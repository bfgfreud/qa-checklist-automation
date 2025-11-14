# Setup Guide - QA Checklist Automation

This guide will walk you through setting up GitHub, Vercel, and Supabase for the QA Checklist Automation project.

## Prerequisites
- GitHub account
- Vercel account (sign up with GitHub)
- Supabase account

## Step 1: Create GitHub Repository

### 1.1 Create New Repository
1. Go to https://github.com/new
2. Fill in repository details:
   - **Repository name**: `qa-checklist-automation` (or your preferred name)
   - **Description**: "QA Checklist Automation tool for internal team testing workflows"
   - **Visibility**: Private (recommended) or Public
   - **DO NOT** initialize with README, .gitignore, or license (we'll create these)
3. Click "Create repository"

### 1.2 Note Your Repository Details
Keep this information handy:
- Repository URL: `https://github.com/YOUR_USERNAME/qa-checklist-automation`
- Clone URL: `https://github.com/YOUR_USERNAME/qa-checklist-automation.git`

### 1.3 Set Up Repository (Done by DevOps Agent Later)
The DevOps Agent will:
- Initialize local Git repository
- Create initial commit
- Push to GitHub
- Set up branch protection (optional)

---

## Step 2: Set Up Vercel

### 2.1 Sign Up / Log In
1. Go to https://vercel.com
2. Click "Sign Up" (or "Log In" if you have an account)
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub account

### 2.2 Import Project (After Project Initialization)
**Note**: Do this AFTER the DevOps Agent has pushed the initial code to GitHub

1. From Vercel Dashboard, click "Add New" → "Project"
2. Find your `qa-checklist-automation` repository
3. Click "Import"
4. Configure Project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `.next` (auto-filled)
   - **Install Command**: `npm install` (auto-filled)

### 2.3 Add Environment Variables
In the Vercel project settings, add these environment variables:

**Do this AFTER setting up Supabase (Step 3)**

1. Go to your project → Settings → Environment Variables
2. Add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
NEXT_PUBLIC_APP_URL=<your-vercel-url>
```

**Note**: You'll get these values from Supabase in Step 3

### 2.4 Deploy
1. Click "Deploy"
2. Wait for deployment to complete (1-2 minutes)
3. You'll get a URL like: `https://qa-checklist-automation.vercel.app`

### 2.5 Enable Auto-Deploy
Vercel automatically sets up:
- **Production deployments**: Pushes to `main` branch
- **Preview deployments**: Pushes to other branches and PRs

No additional configuration needed!

---

## Step 3: Set Up Supabase

### 3.1 Create New Project
1. Go to https://supabase.com
2. Click "Start your project" or "New Project"
3. Sign in with GitHub (recommended)
4. Click "New Project"
5. Fill in project details:
   - **Organization**: Select or create an organization
   - **Name**: `qa-checklist-automation`
   - **Database Password**: Generate a strong password (SAVE THIS!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for development
6. Click "Create new project"
7. Wait 2-3 minutes for project to initialize

### 3.2 Get API Keys
1. Go to Project Settings (gear icon) → API
2. Copy these values:

**Project URL**:
```
https://xxxxxxxxxxxxx.supabase.co
```

**anon/public key** (under "Project API keys"):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**service_role key** (under "Project API keys" - click "Reveal"):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANT**: The `service_role` key has admin privileges. Never expose it in client-side code!

### 3.3 Create `.env.local` File
The DevOps Agent will create this file, but here's the template:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3.4 Set Up Database (Done by Backend Agent Later)
The Backend Agent will create database tables using SQL migrations.

For now, you can explore:
- **Table Editor**: View and manually edit data
- **SQL Editor**: Run SQL queries
- **Database**: See connection strings

---

## Step 4: Connect Everything Together

### 4.1 Add Supabase Keys to Vercel
Go back to Vercel:
1. Project → Settings → Environment Variables
2. Add the Supabase variables from Step 3.2
3. Click "Save"
4. Redeploy if necessary

### 4.2 Update App URL in Vercel
1. Get your Vercel production URL (e.g., `https://qa-checklist-automation.vercel.app`)
2. Add to Vercel environment variables:
   ```
   NEXT_PUBLIC_APP_URL=https://qa-checklist-automation.vercel.app
   ```

---

## Step 5: Verify Setup

### 5.1 Check GitHub
- [ ] Repository created
- [ ] You can access it at `https://github.com/YOUR_USERNAME/qa-checklist-automation`

### 5.2 Check Vercel
- [ ] Project imported
- [ ] Environment variables added
- [ ] Deployment successful
- [ ] You can access the URL

### 5.3 Check Supabase
- [ ] Project created
- [ ] API keys copied
- [ ] Dashboard accessible

---

## Step 6: Ready for Development!

Once you've completed the above steps:

1. **Tell the DevOps Agent**: "I've set up GitHub, Vercel, and Supabase. Here are my details..."
   - GitHub repository URL
   - Vercel project URL
   - Supabase project URL
   - Confirm you have API keys ready

2. **DevOps Agent will**:
   - Initialize the Next.js project
   - Set up local environment
   - Create initial commit
   - Push to GitHub
   - Verify Vercel deployment

3. **Backend Agent will**:
   - Create database schema
   - Run migrations in Supabase

4. **Frontend Agent will**:
   - Build initial UI components

---

## Troubleshooting

### GitHub Issues
**Problem**: Can't push to repository
- Check repository permissions
- Verify Git credentials
- Ensure repository URL is correct

### Vercel Issues
**Problem**: Build fails
- Check environment variables are set correctly
- Check build logs for specific errors
- Ensure all required dependencies are in `package.json`

**Problem**: Preview deployments not working
- Check Vercel GitHub integration is enabled
- Verify repository permissions

### Supabase Issues
**Problem**: Can't connect to database
- Verify API keys are correct
- Check project URL is correct
- Ensure project is fully initialized (wait 2-3 minutes after creation)

**Problem**: CORS errors
- Supabase allows all origins by default for development
- For production, configure allowed origins in Supabase settings

---

## Security Checklist
- [ ] Never commit `.env.local` to Git
- [ ] Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code
- [ ] Use environment variables in Vercel for production secrets
- [ ] Keep database password secure
- [ ] Enable Row Level Security (RLS) in Supabase later

---

## Next Steps
After setup is complete:
1. DevOps Agent initializes the project
2. Backend Agent creates database schema
3. Frontend Agent builds first components
4. Start developing features iteratively
5. Push to GitHub → Auto-deploy to Vercel
6. Test in preview environments

---

## Helpful Links
- **GitHub Docs**: https://docs.github.com
- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs

---

## Support
If you encounter issues:
1. Check the troubleshooting section above
2. Consult the relevant documentation
3. Ask the DevOps Agent for help
4. Check GitHub Issues for similar problems

Happy building! 🚀
