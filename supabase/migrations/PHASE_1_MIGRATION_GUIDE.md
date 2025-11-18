# Phase 1 Migration Guide: Multi-Tester Foundation

## Overview

This migration enables **multiple testers** to work on the same checklist simultaneously. Previously, the system only supported single-tester usage. After this migration, you can assign multiple testers to a project, and each tester will have their own independent set of test results.

**Version:** Phase 1
**Created:** 2025-01-18
**Status:** Ready for Execution

---

## What Changed

### New Tables Created

1. **`testers`** - Stores tester information (pre-authentication)
   - Testers are manually entered for now
   - Prepares for future OAuth integration
   - Each tester has a name, optional email, and UI color

2. **`project_testers`** - Junction table linking testers to projects
   - Many-to-many relationship
   - Multiple testers can be assigned to one project
   - One tester can work on multiple projects

3. **`test_case_attachments`** - Stores image/file attachments for test results
   - Stores metadata (URL, filename, type, size)
   - Linked to test results with CASCADE delete
   - Actual files are stored in Supabase Storage

### Modified Table

4. **`checklist_test_results`** - Enhanced for multi-tester support
   - **Added:** `tester_id` column (required, foreign key to `testers`)
   - **Updated:** Unique constraint now includes `tester_id`
   - **Result:** Multiple testers can have separate results for the same test case

---

## Database Schema Changes

### Before (Single Tester)
```
checklist_test_results
├── Unique: (project_checklist_module_id, testcase_id)
└── One result per test case (50 test cases = 50 rows)
```

### After (Multi-Tester)
```
checklist_test_results
├── Unique: (project_checklist_module_id, testcase_id, tester_id)
└── One result per tester per test case (3 testers × 50 test cases = 150 rows)
```

---

## Migration Files

You need to run **4 migration files** in order:

| Order | Filename | Purpose |
|-------|----------|---------|
| 1 | `20250118_001_create_testers_table.sql` | Create testers table |
| 2 | `20250118_002_create_project_testers_table.sql` | Create project-tester junction table |
| 3 | `20250118_003_create_attachments_table.sql` | Create attachments table |
| 4 | `20250118_004_modify_test_results_multi_tester.sql` | Modify test results for multi-tester support |

**IMPORTANT:** Run these files **in order**! They have dependencies on each other.

---

## How to Run the Migrations

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project: https://supabase.com/dashboard/project/ndpdxlmbxkewhxafrbmi
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run Migration 1 - Create Testers Table

1. Open the file: `supabase/migrations/20250118_001_create_testers_table.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run** (or press `Ctrl+Enter`)
5. Verify success: You should see "Success. No rows returned"

### Step 3: Run Migration 2 - Create Project Testers Table

1. Open the file: `supabase/migrations/20250118_002_create_project_testers_table.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run**
5. Verify success: You should see "Success. No rows returned"

### Step 4: Run Migration 3 - Create Attachments Table

1. Open the file: `supabase/migrations/20250118_003_create_attachments_table.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run**
5. Verify success: You should see "Success. No rows returned"

### Step 5: Run Migration 4 - Modify Test Results (CRITICAL!)

1. Open the file: `supabase/migrations/20250118_004_modify_test_results_multi_tester.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run**
5. **Read the NOTICES:** This migration will show several NOTICE messages indicating:
   - "Added tester_id column to checklist_test_results"
   - "Created Legacy Tester account for existing data"
   - "Updated X existing test results to use Legacy Tester"
   - "Made tester_id column NOT NULL"
   - "Dropped old unique constraint (single-tester)"
   - "Created new unique constraint (multi-tester)"

### Step 6: Verify the Migration

1. Open the file: `supabase/migrations/VERIFY_MULTI_TESTER_SCHEMA.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run**
5. **Review the output:**
   - All 13 checks should show "✅ PASS"
   - Summary report should show "✅ Multi-Tester Migration Successful!"

---

## Data Migration Details

### What Happens to Existing Data?

All existing test results are **preserved** and assigned to a special "Legacy Tester" account.

#### Legacy Tester Details
- **Name:** "Legacy Tester"
- **Email:** legacy@system
- **Color:** #888888 (gray)

**Why?** This ensures all existing test results remain valid and can still be viewed and edited. No data is lost during the migration.

### Example Data Migration

**Before Migration:**
```sql
-- checklist_test_results
id | project_checklist_module_id | testcase_id | status  | tester_id
1  | abc-123                    | test-1      | Pending | NULL
2  | abc-123                    | test-2      | Pass    | NULL
```

**After Migration:**
```sql
-- testers table
id      | name          | email          | color
legacy  | Legacy Tester | legacy@system  | #888888

-- checklist_test_results (updated)
id | project_checklist_module_id | testcase_id | status  | tester_id
1  | abc-123                    | test-1      | Pending | legacy
2  | abc-123                    | test-2      | Pass    | legacy
```

---

## Verification Checklist

After running all migrations, verify the following:

### ✅ Tables Created
- [ ] `testers` table exists
- [ ] `project_testers` table exists
- [ ] `test_case_attachments` table exists

### ✅ Table Modified
- [ ] `checklist_test_results` has `tester_id` column
- [ ] `tester_id` column is NOT NULL
- [ ] Unique constraint includes `tester_id`

### ✅ Foreign Keys
- [ ] `project_testers.project_id` → `test_projects.id` (CASCADE)
- [ ] `project_testers.tester_id` → `testers.id` (CASCADE)
- [ ] `test_case_attachments.test_result_id` → `checklist_test_results.id` (CASCADE)
- [ ] `checklist_test_results.tester_id` → `testers.id` (CASCADE)

### ✅ Data Integrity
- [ ] Legacy Tester exists (email: legacy@system)
- [ ] All existing test results have `tester_id = Legacy Tester`
- [ ] No NULL values in `checklist_test_results.tester_id`

### ✅ Indexes
- [ ] `idx_testers_email` on `testers.email`
- [ ] `idx_project_testers_tester_id` on `project_testers.tester_id`
- [ ] `idx_project_testers_project_id` on `project_testers.project_id`
- [ ] `idx_attachments_test_result` on `test_case_attachments.test_result_id`
- [ ] `idx_test_results_tester_id` on `checklist_test_results.tester_id`

---

## Testing the New Schema

### Test 1: Create a New Tester

```sql
INSERT INTO testers (name, email, color)
VALUES ('Alice Johnson', 'alice@test.com', '#FF6B35');
```

**Expected:** Tester created successfully

### Test 2: Assign Tester to Project

```sql
-- Get a project ID (replace with actual ID)
INSERT INTO project_testers (project_id, tester_id)
VALUES (
  (SELECT id FROM test_projects LIMIT 1),
  (SELECT id FROM testers WHERE email = 'alice@test.com')
);
```

**Expected:** Assignment created successfully

### Test 3: Create Test Results for Multiple Testers

```sql
-- This should work now (same test case, different testers)
INSERT INTO checklist_test_results (project_checklist_module_id, testcase_id, tester_id, status)
VALUES
  ('module-1', 'testcase-1', 'legacy-tester-id', 'Pending'),
  ('module-1', 'testcase-1', 'alice-tester-id', 'Pending');
```

**Expected:** Both rows created (unique constraint allows it because tester_id is different)

### Test 4: Query Results by Tester

```sql
SELECT
  t.name as tester_name,
  COUNT(ctr.id) as test_count,
  COUNT(CASE WHEN ctr.status = 'Pass' THEN 1 END) as passed,
  COUNT(CASE WHEN ctr.status = 'Fail' THEN 1 END) as failed,
  COUNT(CASE WHEN ctr.status = 'Pending' THEN 1 END) as pending
FROM testers t
LEFT JOIN checklist_test_results ctr ON ctr.tester_id = t.id
GROUP BY t.id, t.name;
```

**Expected:** Shows test statistics per tester

---

## Rollback Instructions

If you need to undo this migration:

### Warning
Rolling back will:
- Remove multi-tester capability
- **Keep** existing data (assigned to Legacy Tester)
- **Delete** the testers table and all tester assignments

### Rollback Steps

```sql
-- Step 1: Drop the tester_id column from test results
ALTER TABLE checklist_test_results DROP COLUMN IF EXISTS tester_id;

-- Step 2: Remove the new tables
DROP TABLE IF EXISTS test_case_attachments CASCADE;
DROP TABLE IF EXISTS project_testers CASCADE;
DROP TABLE IF EXISTS testers CASCADE;

-- Step 3: Restore old unique constraint (optional)
ALTER TABLE checklist_test_results
  ADD CONSTRAINT checklist_test_results_unique
  UNIQUE (project_checklist_module_id, testcase_id);
```

**Note:** Only rollback if absolutely necessary. You will lose all tester data and assignments.

---

## Common Issues & Solutions

### Issue 1: "Column tester_id already exists"

**Cause:** You ran migration 4 multiple times

**Solution:** The migration is idempotent, so this is just a notice. No action needed.

### Issue 2: "Some results missing tester_id"

**Cause:** Migration 4 didn't complete successfully

**Solution:**
1. Check if Legacy Tester exists:
   ```sql
   SELECT * FROM testers WHERE email = 'legacy@system';
   ```
2. If it exists, manually update null records:
   ```sql
   UPDATE checklist_test_results
   SET tester_id = (SELECT id FROM testers WHERE email = 'legacy@system')
   WHERE tester_id IS NULL;
   ```

### Issue 3: Foreign key constraint violation

**Cause:** You didn't run migrations in order

**Solution:** Drop the problematic table and re-run migrations in order:
```sql
DROP TABLE IF EXISTS project_testers CASCADE;
-- Then re-run migration 2
```

### Issue 4: Unique constraint violation when creating test results

**Cause:** Trying to create duplicate results for same (module, testcase, tester)

**Solution:** This is expected behavior. Each tester can only have ONE result per test case. If you need to update, use UPDATE instead of INSERT:
```sql
UPDATE checklist_test_results
SET status = 'Pass'
WHERE project_checklist_module_id = '...'
  AND testcase_id = '...'
  AND tester_id = '...';
```

---

## Next Steps After Migration

### 1. Create Sample Testers (Optional)

```sql
INSERT INTO testers (name, email, color) VALUES
  ('Alice Johnson', 'alice@test.com', '#FF6B35'),
  ('Bob Smith', 'bob@test.com', '#4ECDC4'),
  ('Carol Davis', 'carol@test.com', '#FFD93D')
ON CONFLICT (email) DO NOTHING;
```

### 2. Assign Testers to Projects

For each project that needs multiple testers:
```sql
INSERT INTO project_testers (project_id, tester_id)
SELECT
  '<project-id>',
  id
FROM testers
WHERE email IN ('alice@test.com', 'bob@test.com');
```

### 3. Update Backend APIs

The backend APIs will need to be updated to:
- Accept `tester_id` when creating/updating test results
- Filter test results by tester
- Show tester names and colors in the UI
- Support tester management (CRUD operations)

### 4. Update Frontend Components

The frontend will need:
- Tester selector when viewing checklists
- Color-coded test results by tester
- Tester management UI
- Project-tester assignment interface

---

## API Impact Analysis

### Endpoints That Need Updates

#### 1. **GET /api/checklists/[projectId]**
**Current:** Returns all test results
**New:** Should accept `?tester_id=...` query parameter to filter by tester

#### 2. **POST /api/checklists/test-results**
**Current:** Creates test result without tester
**New:** Must include `tester_id` in request body (required)

#### 3. **PUT /api/checklists/test-results/[id]**
**Current:** Updates test result
**New:** No change needed (tester_id is already set)

#### 4. **New Endpoints Needed:**
- `GET /api/testers` - List all testers
- `POST /api/testers` - Create a new tester
- `GET /api/projects/[id]/testers` - Get testers assigned to project
- `POST /api/projects/[id]/testers` - Assign tester to project
- `DELETE /api/projects/[id]/testers/[testerId]` - Remove tester from project

---

## Sample Queries for Development

### Get all testers assigned to a project
```sql
SELECT t.*
FROM testers t
JOIN project_testers pt ON pt.tester_id = t.id
WHERE pt.project_id = '<project-id>';
```

### Get test results for a specific tester
```sql
SELECT
  tc.title,
  ctr.status,
  ctr.notes,
  ctr.tested_at
FROM checklist_test_results ctr
JOIN base_testcases tc ON ctr.testcase_id = tc.id
WHERE ctr.tester_id = '<tester-id>'
  AND ctr.project_checklist_module_id IN (
    SELECT id FROM project_checklist_modules WHERE project_id = '<project-id>'
  );
```

### Get progress summary by tester for a project
```sql
SELECT
  t.name as tester_name,
  t.color,
  COUNT(ctr.id) as total_tests,
  COUNT(CASE WHEN ctr.status = 'Pass' THEN 1 END) as passed,
  COUNT(CASE WHEN ctr.status = 'Fail' THEN 1 END) as failed,
  COUNT(CASE WHEN ctr.status = 'Pending' THEN 1 END) as pending,
  ROUND(100.0 * COUNT(CASE WHEN ctr.status IN ('Pass', 'Fail', 'Skipped') THEN 1 END) / COUNT(ctr.id), 2) as completion_percent
FROM testers t
JOIN project_testers pt ON pt.tester_id = t.id
LEFT JOIN checklist_test_results ctr ON ctr.tester_id = t.id
LEFT JOIN project_checklist_modules pcm ON ctr.project_checklist_module_id = pcm.id AND pcm.project_id = pt.project_id
WHERE pt.project_id = '<project-id>'
GROUP BY t.id, t.name, t.color;
```

### Get attachments for a test result
```sql
SELECT * FROM test_case_attachments
WHERE test_result_id = '<result-id>'
ORDER BY uploaded_at DESC;
```

---

## Migration Summary

| Aspect | Before | After |
|--------|--------|-------|
| Tables | 5 | 8 (+3 new) |
| Testers per project | 1 (implicit) | Multiple (explicit) |
| Test results per test case | 1 | 1 per tester |
| Attachments support | No | Yes |
| Tester tracking | Text field | Relational |
| Data loss | N/A | None (Legacy Tester preserves existing data) |

---

## Support & Troubleshooting

### If Something Goes Wrong

1. **Check the verification script output** - Run `VERIFY_MULTI_TESTER_SCHEMA.sql`
2. **Review Supabase logs** - Check for any error messages
3. **Check individual migrations** - Each file has verification queries in comments
4. **Rollback if needed** - Use the rollback instructions above (last resort)

### Getting Help

- Review this guide thoroughly
- Check the verification queries
- Look at the comments in each migration file
- Test with sample data before production use

---

## Files Included

```
supabase/migrations/
├── 20250118_001_create_testers_table.sql
├── 20250118_002_create_project_testers_table.sql
├── 20250118_003_create_attachments_table.sql
├── 20250118_004_modify_test_results_multi_tester.sql
├── VERIFY_MULTI_TESTER_SCHEMA.sql
└── PHASE_1_MIGRATION_GUIDE.md (this file)
```

---

## Migration Checklist

Use this checklist when running the migration:

- [ ] **Pre-Migration**
  - [ ] Backed up database (Supabase has automatic backups, but verify)
  - [ ] Reviewed all migration files
  - [ ] Tested on development environment first (if available)

- [ ] **Migration Execution**
  - [ ] Ran migration 1: Create testers table ✅
  - [ ] Ran migration 2: Create project_testers table ✅
  - [ ] Ran migration 3: Create attachments table ✅
  - [ ] Ran migration 4: Modify test results ✅

- [ ] **Verification**
  - [ ] Ran VERIFY_MULTI_TESTER_SCHEMA.sql ✅
  - [ ] All 13 checks passed ✅
  - [ ] Legacy Tester created ✅
  - [ ] Existing data preserved ✅

- [ ] **Post-Migration**
  - [ ] Created sample testers (optional)
  - [ ] Assigned testers to test projects
  - [ ] Updated backend API code (Phase 2)
  - [ ] Updated frontend components (Phase 2)
  - [ ] Tested multi-tester functionality

---

**Migration Guide Version:** 1.0
**Last Updated:** 2025-01-18
**Status:** Ready for Production

Good luck with the migration! 🚀
