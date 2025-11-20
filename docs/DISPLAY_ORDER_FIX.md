# Fix: Test Case Jumping Issue - Display Order Implementation

## Problem
Test cases were jumping to different positions in the list during polling because there was no explicit ordering stored in the database. The database was returning rows in inconsistent order based on various factors (insertion order, updates, etc.).

## Solution
Add a `display_order` column to the `checklist_test_results` table to maintain stable, explicit ordering.

## Migration Steps

### 1. Run the SQL Migration in Supabase

Go to your Supabase SQL Editor and run this migration:

```sql
-- Migration: Add display_order to checklist_test_results for stable sorting
-- Date: 2025-01-20
-- Purpose: Prevent test cases from jumping around during polling by maintaining explicit order

-- Step 1: Add display_order column (nullable first, we'll populate it)
ALTER TABLE checklist_test_results
ADD COLUMN display_order INTEGER;

-- Step 2: Populate display_order for existing rows
-- Order by module creation, then by testcase_id (or testcase_title for custom cases)
WITH ordered_results AS (
  SELECT
    ctr.id,
    ROW_NUMBER() OVER (
      PARTITION BY ctr.project_checklist_module_id
      ORDER BY
        COALESCE(ctr.testcase_id::text, ctr.testcase_title),
        ctr.created_at
    ) - 1 AS row_order
  FROM checklist_test_results ctr
)
UPDATE checklist_test_results
SET display_order = ordered_results.row_order
FROM ordered_results
WHERE checklist_test_results.id = ordered_results.id;

-- Step 3: Make display_order NOT NULL now that it's populated
ALTER TABLE checklist_test_results
ALTER COLUMN display_order SET NOT NULL;

-- Step 4: Set default for new rows (will be overridden by application logic)
ALTER TABLE checklist_test_results
ALTER COLUMN display_order SET DEFAULT 0;

-- Step 5: Add index for better query performance
CREATE INDEX idx_test_results_display_order
ON checklist_test_results(project_checklist_module_id, display_order);

-- Step 6: Add comment for documentation
COMMENT ON COLUMN checklist_test_results.display_order IS
'Explicit display order within the module. Lower numbers appear first. Used to maintain stable sort order during polling.';
```

### 2. Verify Migration Success

After running the migration, verify it worked:

```sql
-- Check that all rows have display_order populated
SELECT
  COUNT(*) as total_rows,
  COUNT(display_order) as rows_with_order,
  MIN(display_order) as min_order,
  MAX(display_order) as max_order
FROM checklist_test_results;

-- Should show:
-- total_rows = rows_with_order (all rows have display_order)
-- min_order = 0
-- max_order = some number
```

## Code Changes Made

### 1. **checklistService.ts** - Query with Stable Sort
- Added `display_order` to SELECT statement (line 829)
- Added `.order('display_order', { ascending: true })` to query (line 847)
- Changed sorting logic to use `display_order` instead of `created_at` (lines 913, 934, 937-940)

### 2. **checklistService.ts** - Set display_order on Creation
- **addModuleToChecklist**: Sets `display_order: i` for each testcase (line 395)
- **addCustomTestcase**: Gets next display_order and assigns it (lines 542-552, 564)

### 3. **testerService.ts** - Preserve display_order
- **assignTesterToProject**: Fetches and preserves `display_order` from existing results (lines 333, 364)

## How It Works

### When Creating Library Module Test Results
```javascript
for (let i = 0; i < testcases.length; i++) {
  const tc = testcases[i]
  testResultInserts.push({
    // ... other fields ...
    display_order: i  // Testcase 1 gets 0, testcase 2 gets 1, etc.
  })
}
```

### When Creating Custom Testcases
```javascript
// Get the highest display_order for this module
const { data: maxOrderData } = await supabase
  .from('checklist_test_results')
  .select('display_order')
  .eq('project_checklist_module_id', moduleId)
  .order('display_order', { ascending: false })
  .limit(1)

const nextDisplayOrder = maxOrderData ? maxOrderData[0].display_order + 1 : 0
```

### When Querying Test Results
```javascript
.from('checklist_test_results')
.select(/* ... */)
.order('display_order', { ascending: true })  // Always sorted by display_order
```

## Expected Behavior After Migration

✅ **Before**: Test cases jump around during polling, especially after status changes
✅ **After**: Test cases stay in the exact same position, no matter what changes happen

✅ **Before**: Test order could be based on created_at, updated_at, or insertion order
✅ **After**: Test order is explicitly controlled by display_order (0, 1, 2, 3...)

✅ **Before**: Scroll position would be lost when list reordered
✅ **After**: Scroll position stays stable because list order never changes

## Testing After Migration

1. **Refresh your browser** to clear any cached data
2. **Create a new project** or open existing one
3. **Add some modules** with multiple test cases
4. **Start working mode** with 2+ testers
5. **Change status** of a test case from Pending → Pass
6. **Verify**: Test case should NOT jump to bottom of list ✅
7. **Type notes** for 10+ seconds continuously
8. **Verify**: Notes should NOT disappear ✅ (already fixed in previous deployment)

## Rollback Plan (If Needed)

If something goes wrong, you can rollback:

```sql
-- Remove the display_order column
ALTER TABLE checklist_test_results
DROP COLUMN display_order;

-- Remove the index
DROP INDEX IF EXISTS idx_test_results_display_order;
```

Then revert the code changes in checklistService.ts and testerService.ts.

## Summary

- **Migration file**: `supabase/migrations/005_add_display_order_to_test_results.sql`
- **Code changes**: 3 files (checklistService.ts, testerService.ts)
- **Database changes**: 1 new column + 1 new index
- **Breaking changes**: None (backward compatible if migration not run, just won't fix jumping)
- **Performance impact**: Minimal (index added for fast sorting)

---

**Status**: Ready to deploy
**Next Step**: Run the SQL migration in Supabase, then deploy the code changes
