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
