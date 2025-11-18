# Phase 1: Multi-Tester Foundation - Quick Start

**Time Required:** 5-10 minutes
**Complexity:** Low (copy & paste SQL)
**Risk:** Low (idempotent, data preserved)

---

## What This Does

Enables **multiple testers** to work on the same checklist simultaneously, with each tester having their own independent test results.

**Example:**
- Before: 1 tester × 50 tests = 50 results
- After: 3 testers × 50 tests = 150 results (one per tester)

---

## 4-Step Quick Start

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/ndpdxlmbxkewhxafrbmi
2. Click: **SQL Editor** (left sidebar)
3. Click: **New Query**

### Step 2: Run Migration 1 - Create Testers Table

**File:** `20250118_001_create_testers_table.sql`

**Copy this file's contents** → **Paste in SQL Editor** → **Click "Run"**

✅ Expected: "Success. No rows returned"

---

### Step 3: Run Migration 2 - Create Project-Testers Table

**File:** `20250118_002_create_project_testers_table.sql`

**Copy this file's contents** → **Paste in SQL Editor** → **Click "Run"**

✅ Expected: "Success. No rows returned"

---

### Step 4: Run Migration 3 - Create Attachments Table

**File:** `20250118_003_create_attachments_table.sql`

**Copy this file's contents** → **Paste in SQL Editor** → **Click "Run"**

✅ Expected: "Success. No rows returned"

---

### Step 5: Run Migration 4 - Modify Test Results (CRITICAL!)

**File:** `20250118_004_modify_test_results_multi_tester.sql`

**Copy this file's contents** → **Paste in SQL Editor** → **Click "Run"**

✅ Expected: Multiple NOTICE messages showing:
- "Added tester_id column to checklist_test_results"
- "Created Legacy Tester account for existing data"
- "Updated X existing test results to use Legacy Tester"
- "Made tester_id column NOT NULL"
- "Dropped old unique constraint (single-tester)"
- "Created new unique constraint (multi-tester)"

---

### Step 6: Verify Success

**File:** `VERIFY_MULTI_TESTER_SCHEMA.sql`

**Copy this file's contents** → **Paste in SQL Editor** → **Click "Run"**

✅ Expected: All checks show "✅ PASS" and summary shows:
```
RESULT: ✅ Multi-Tester Migration Successful!
```

---

## That's It!

Your database now supports multiple testers! 🎉

---

## What Changed?

### New Tables (3)
1. **testers** - Stores tester info (name, email, color)
2. **project_testers** - Links testers to projects
3. **test_case_attachments** - Stores image attachments for test results

### Modified Table (1)
4. **checklist_test_results** - Now includes `tester_id` (enables multi-tester)

### Data Safety
- **Zero data loss** - All existing test results preserved via "Legacy Tester"

---

## Next Steps (Optional)

### Create Sample Testers

```sql
INSERT INTO testers (name, email, color) VALUES
  ('Alice Johnson', 'alice@test.com', '#FF6B35'),
  ('Bob Smith', 'bob@test.com', '#4ECDC4'),
  ('Carol Davis', 'carol@test.com', '#FFD93D')
ON CONFLICT (email) DO NOTHING;
```

### Assign Testers to a Project

```sql
-- Replace <project-id> with actual ID
INSERT INTO project_testers (project_id, tester_id)
SELECT
  '<project-id>',
  id
FROM testers
WHERE email IN ('alice@test.com', 'bob@test.com');
```

### View Testers

```sql
SELECT * FROM testers;
```

---

## Troubleshooting

### Issue: "Column already exists"
**Solution:** Migration already ran successfully. No action needed (idempotent).

### Issue: "Some results missing tester_id"
**Solution:** Run this query:
```sql
UPDATE checklist_test_results
SET tester_id = (SELECT id FROM testers WHERE email = 'legacy@system')
WHERE tester_id IS NULL;
```

### Issue: Foreign key violation
**Solution:** You didn't run migrations in order. Start over from Step 1.

---

## Need Help?

📖 Read: `PHASE_1_MIGRATION_GUIDE.md` (complete documentation)
📊 Check: `PHASE_1_SUMMARY.md` (detailed summary)
✅ Verify: Run `VERIFY_MULTI_TESTER_SCHEMA.sql` (13 checks)

---

## Rollback (If Needed)

⚠️ Only use if something goes seriously wrong!

```sql
-- Remove multi-tester capability (keeps data)
ALTER TABLE checklist_test_results DROP COLUMN IF EXISTS tester_id;
DROP TABLE IF EXISTS test_case_attachments CASCADE;
DROP TABLE IF EXISTS project_testers CASCADE;
DROP TABLE IF EXISTS testers CASCADE;
```

---

**Quick Start Version:** 1.0
**Last Updated:** 2025-01-18
**Estimated Time:** 5-10 minutes
