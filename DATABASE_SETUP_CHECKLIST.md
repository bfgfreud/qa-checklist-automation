# Database Setup Checklist - QA Checklist Automation

## Issue: Checklist Builder Not Working?

If modules aren't showing testcases when added to a project, follow this checklist:

---

## Step 1: Verify Supabase Connection

1. Open your `.env.local` file
2. Verify these variables are set:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://ndpdxlmbxkewhxafrbmi.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_key>
   SUPABASE_SERVICE_ROLE_KEY=<your_key>
   ```

---

## Step 2: Run ALL Database Migrations in Order

Go to your Supabase Dashboard → SQL Editor and run these files **in order**:

### 2.1. Base Tables (Modules & Testcases)
**File:** `SUPABASE_SETUP.sql`
```sql
-- Creates:
-- - base_modules table
-- - base_testcases table
-- - Sample data (4 modules, 18 testcases)
```

**Run this first!**

### 2.2. Projects Tables
**File:** `backend/db/migrations/MIGRATION_ADD_PROJECTS.sql`
```sql
-- Creates:
-- - test_projects table
-- - Sample projects
```

**Run this second!**

### 2.3. Checklist Tables (CRITICAL!)
**File:** `backend/db/migrations/MIGRATION_ADD_CHECKLISTS.sql`
```sql
-- Creates:
-- - project_checklist_modules table
-- - checklist_test_results table
-- - Indexes and triggers
-- - Sample checklist data
```

**Run this third!** This is likely the missing piece if modules don't show testcases.

### 2.4. Tags Support (Optional)
**File:** `MIGRATION_ADD_TAGS_CREATED_BY.sql`
```sql
-- Adds:
-- - tags column to base_modules
-- - created_by column to base_modules
```

**Run this fourth (optional)!**

---

## Step 3: Verify Tables Exist

Run this query in Supabase SQL Editor:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'base_modules',
    'base_testcases',
    'test_projects',
    'project_checklist_modules',
    'checklist_test_results'
  )
ORDER BY table_name;
```

**Expected Result:** Should return 5 rows with all table names.

---

## Step 4: Verify Sample Data

### Check Modules
```sql
SELECT id, name,
  (SELECT COUNT(*) FROM base_testcases WHERE module_id = base_modules.id) as testcase_count
FROM base_modules
ORDER BY order_index;
```

**Expected:** 4 modules with testcase counts (4, 4, 4, 6)

### Check Testcases
```sql
SELECT
  m.name as module_name,
  COUNT(tc.id) as testcase_count
FROM base_modules m
LEFT JOIN base_testcases tc ON tc.module_id = m.id
GROUP BY m.id, m.name
ORDER BY m.order_index;
```

**Expected:** Each module should have testcases

### Check Projects
```sql
SELECT id, name, status
FROM test_projects
ORDER BY created_at DESC;
```

**Expected:** At least 1 project exists

---

## Step 5: Test the API Endpoints

### Test 1: Get All Modules
```bash
curl http://localhost:3000/api/modules
```

**Expected:** JSON with 4 modules, each with `testcases` array

### Test 2: Create a Test Project
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project","description":"For testing"}'
```

**Expected:** Returns project with ID

### Test 3: Add Module to Checklist
Replace `<PROJECT_ID>` and `<MODULE_ID>` with actual IDs:

```bash
curl -X POST http://localhost:3000/api/checklists/modules \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "<PROJECT_ID>",
    "moduleId": "<MODULE_ID>",
    "instanceLabel": "Test Instance"
  }'
```

**Expected:**
- Success response
- Creates entries in `project_checklist_modules`
- Creates entries in `checklist_test_results` for each testcase

### Test 4: Get Checklist for Project
```bash
curl http://localhost:3000/api/checklists/<PROJECT_ID>
```

**Expected:** Returns modules with `testResults` array containing all testcases

---

## Step 6: Browser Testing

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to:** `http://localhost:3000/projects`

3. **Click "View Checklist"** on any project

4. **In the left sidebar:**
   - Should see "Available Modules" with 4 modules
   - Each module should show "X tests" badge
   - Click "Add" on a module

5. **After adding:**
   - Module should appear in "Added to Checklist" section at bottom left
   - Right panel should update with test cases
   - Each testcase should have status "Pending"

---

## Common Issues & Solutions

### Issue 1: "Module added" but no testcases appear

**Cause:** Checklist tables don't exist

**Solution:** Run `MIGRATION_ADD_CHECKLISTS.sql`

### Issue 2: No modules in "Available Modules"

**Cause:** Base tables not set up

**Solution:** Run `SUPABASE_SETUP.sql`

### Issue 3: Can't create projects

**Cause:** Projects table doesn't exist

**Solution:** Run `MIGRATION_ADD_PROJECTS.sql`

### Issue 4: "Failed to fetch modules"

**Cause:** Environment variables incorrect or Supabase connection issue

**Solution:**
1. Check `.env.local` file
2. Verify keys in Supabase Dashboard → Settings → API
3. Restart dev server after changing env vars

### Issue 5: Layout looks broken

**Cause:** CSS/Tailwind compilation issue

**Solution:**
1. Delete `.next` folder
2. Run `npm run dev` again
3. Hard refresh browser (Ctrl+Shift+R)

---

## Debug Checklist

- [ ] All 5 tables exist in Supabase
- [ ] base_modules has data (at least 4 rows)
- [ ] base_testcases has data (at least 18 rows)
- [ ] test_projects has data (at least 1 row)
- [ ] Environment variables are correct
- [ ] Dev server is running
- [ ] API endpoint `/api/modules` returns data with testcases
- [ ] API endpoint `/api/checklists/modules` accepts POST requests
- [ ] Browser console shows no errors
- [ ] Network tab shows successful API calls

---

## Quick Test Script

Run this in Supabase SQL Editor to verify everything:

```sql
-- Quick verification script
DO $$
DECLARE
  module_count INT;
  testcase_count INT;
  project_count INT;
  checklist_module_count INT;
  test_result_count INT;
BEGIN
  SELECT COUNT(*) INTO module_count FROM base_modules;
  SELECT COUNT(*) INTO testcase_count FROM base_testcases;
  SELECT COUNT(*) INTO project_count FROM test_projects;

  -- Check if checklist tables exist
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'project_checklist_modules') THEN
    SELECT COUNT(*) INTO checklist_module_count FROM project_checklist_modules;
  ELSE
    checklist_module_count := -1;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'checklist_test_results') THEN
    SELECT COUNT(*) INTO test_result_count FROM checklist_test_results;
  ELSE
    test_result_count := -1;
  END IF;

  RAISE NOTICE '=== Database Status ===';
  RAISE NOTICE 'Modules: %', module_count;
  RAISE NOTICE 'Testcases: %', testcase_count;
  RAISE NOTICE 'Projects: %', project_count;

  IF checklist_module_count = -1 THEN
    RAISE NOTICE 'Checklist Modules: TABLE MISSING - Run MIGRATION_ADD_CHECKLISTS.sql';
  ELSE
    RAISE NOTICE 'Checklist Modules: %', checklist_module_count;
  END IF;

  IF test_result_count = -1 THEN
    RAISE NOTICE 'Test Results: TABLE MISSING - Run MIGRATION_ADD_CHECKLISTS.sql';
  ELSE
    RAISE NOTICE 'Test Results: %', test_result_count;
  END IF;

  RAISE NOTICE '======================';

  IF module_count = 0 THEN
    RAISE NOTICE 'WARNING: No modules found. Run SUPABASE_SETUP.sql';
  END IF;

  IF testcase_count = 0 THEN
    RAISE NOTICE 'WARNING: No testcases found. Run SUPABASE_SETUP.sql';
  END IF;

  IF project_count = 0 THEN
    RAISE NOTICE 'WARNING: No projects found. Run MIGRATION_ADD_PROJECTS.sql';
  END IF;
END $$;
```

**Expected Output (in Supabase SQL Editor Notices):**
```
=== Database Status ===
Modules: 4
Testcases: 18
Projects: 3
Checklist Modules: 4
Test Results: 12
======================
```

---

## Still Not Working?

If you've completed all steps and it's still not working:

1. **Check Browser Console** (F12) for errors
2. **Check Network Tab** to see API response details
3. **Check Supabase Logs** in Dashboard → Logs
4. **Restart Everything:**
   ```bash
   # Stop dev server (Ctrl+C)
   # Delete cache
   rm -rf .next
   # Restart
   npm run dev
   ```

---

**Last Updated:** 2025-01-17
