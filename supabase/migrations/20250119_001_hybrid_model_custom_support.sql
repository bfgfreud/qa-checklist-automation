-- ============================================
-- Migration: HYBRID Model - Custom Modules & Testcases Support
-- Created: 2025-01-19
-- Phase: Custom Module/Testcase Support
-- Description: Transforms from REFERENCE model to HYBRID model (copy + optional reference)
--              Enables custom modules and testcases while preserving analytics capability
--
-- KEY BEHAVIOR:
-- - Checklists become independent snapshots (library updates don't affect existing checklists)
-- - Optional references preserved for analytics (module usage tracking)
-- - Supports custom modules (no library reference)
-- - Supports custom testcases (no library reference)
-- ============================================

-- ============================================
-- SAFETY CHECK: Backup Instructions
-- ============================================
-- Before running this migration, consider backing up your data:
--
-- pg_dump -h db.your-project.supabase.co -U postgres -d postgres \
--   -t project_checklist_modules -t checklist_test_results > backup_before_hybrid.sql
--
-- To restore if needed:
-- psql -h db.your-project.supabase.co -U postgres -d postgres < backup_before_hybrid.sql
-- ============================================

-- ============================================
-- PART 1: Modify project_checklist_modules Table
-- ============================================

-- Step 1.1: Add new columns for copied data
DO $$
BEGIN
    -- Add module_name (required for all modules)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project_checklist_modules' AND column_name = 'module_name'
    ) THEN
        ALTER TABLE project_checklist_modules ADD COLUMN module_name TEXT;
        RAISE NOTICE '✓ Added module_name column to project_checklist_modules';
    END IF;

    -- Add module_description (optional details)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project_checklist_modules' AND column_name = 'module_description'
    ) THEN
        ALTER TABLE project_checklist_modules ADD COLUMN module_description TEXT;
        RAISE NOTICE '✓ Added module_description column to project_checklist_modules';
    END IF;

    -- Add is_custom flag (true = custom module, false = library module)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project_checklist_modules' AND column_name = 'is_custom'
    ) THEN
        ALTER TABLE project_checklist_modules ADD COLUMN is_custom BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE '✓ Added is_custom column to project_checklist_modules';
    END IF;

    -- Add tags array (for categorization)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project_checklist_modules' AND column_name = 'tags'
    ) THEN
        ALTER TABLE project_checklist_modules ADD COLUMN tags TEXT[];
        RAISE NOTICE '✓ Added tags column to project_checklist_modules';
    END IF;
END $$;

-- Step 1.2: Populate module_name and module_description from base_modules
UPDATE project_checklist_modules pcm
SET
    module_name = bm.name,
    module_description = bm.description,
    is_custom = false
FROM base_modules bm
WHERE pcm.module_id = bm.id
  AND pcm.module_name IS NULL;

-- Step 1.3: Make module_name required (after population)
ALTER TABLE project_checklist_modules ALTER COLUMN module_name SET NOT NULL;

-- Step 1.4: Make module_id nullable (to support custom modules)
ALTER TABLE project_checklist_modules ALTER COLUMN module_id DROP NOT NULL;

-- Step 1.5: Add constraint to ensure data integrity
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'module_reference_or_custom'
          AND table_name = 'project_checklist_modules'
    ) THEN
        ALTER TABLE project_checklist_modules
        ADD CONSTRAINT module_reference_or_custom
        CHECK (
            (module_id IS NOT NULL AND is_custom = false) OR
            (module_id IS NULL AND is_custom = true)
        );
        RAISE NOTICE '✓ Added module_reference_or_custom constraint';
    END IF;
END $$;

-- Step 1.6: Update comments
COMMENT ON COLUMN project_checklist_modules.module_id IS 'Optional reference to base_modules (for analytics). NULL for custom modules.';
COMMENT ON COLUMN project_checklist_modules.module_name IS 'Copied module name (independent of library). Always populated.';
COMMENT ON COLUMN project_checklist_modules.module_description IS 'Copied module description (independent of library).';
COMMENT ON COLUMN project_checklist_modules.is_custom IS 'true = custom module (no library reference), false = library module (copied data)';
COMMENT ON COLUMN project_checklist_modules.tags IS 'Optional tags for categorization and filtering.';

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PART 1 COMPLETE: project_checklist_modules updated';
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- PART 2: Modify checklist_test_results Table
-- ============================================

-- Step 2.1: Add new columns for copied data
DO $$
BEGIN
    -- Add testcase_title (required for all testcases)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'checklist_test_results' AND column_name = 'testcase_title'
    ) THEN
        ALTER TABLE checklist_test_results ADD COLUMN testcase_title TEXT;
        RAISE NOTICE '✓ Added testcase_title column to checklist_test_results';
    END IF;

    -- Add testcase_description (optional details)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'checklist_test_results' AND column_name = 'testcase_description'
    ) THEN
        ALTER TABLE checklist_test_results ADD COLUMN testcase_description TEXT;
        RAISE NOTICE '✓ Added testcase_description column to checklist_test_results';
    END IF;

    -- Add testcase_priority (High/Medium/Low)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'checklist_test_results' AND column_name = 'testcase_priority'
    ) THEN
        ALTER TABLE checklist_test_results ADD COLUMN testcase_priority TEXT
            CHECK (testcase_priority IN ('High', 'Medium', 'Low'))
            DEFAULT 'Medium';
        RAISE NOTICE '✓ Added testcase_priority column to checklist_test_results';
    END IF;

    -- Add is_custom flag (true = custom testcase, false = library testcase)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'checklist_test_results' AND column_name = 'is_custom'
    ) THEN
        ALTER TABLE checklist_test_results ADD COLUMN is_custom BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE '✓ Added is_custom column to checklist_test_results';
    END IF;
END $$;

-- Step 2.2: Populate testcase fields from base_testcases
UPDATE checklist_test_results ctr
SET
    testcase_title = bt.title,
    testcase_description = bt.description,
    testcase_priority = bt.priority,
    is_custom = false
FROM base_testcases bt
WHERE ctr.testcase_id = bt.id
  AND ctr.testcase_title IS NULL;

-- Step 2.3: Make testcase_title required (after population)
ALTER TABLE checklist_test_results ALTER COLUMN testcase_title SET NOT NULL;

-- Step 2.4: Make testcase_id nullable (to support custom testcases)
ALTER TABLE checklist_test_results ALTER COLUMN testcase_id DROP NOT NULL;

-- Step 2.5: Add constraint to ensure data integrity
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'testcase_reference_or_custom'
          AND table_name = 'checklist_test_results'
    ) THEN
        ALTER TABLE checklist_test_results
        ADD CONSTRAINT testcase_reference_or_custom
        CHECK (
            (testcase_id IS NOT NULL AND is_custom = false) OR
            (testcase_id IS NULL AND is_custom = true)
        );
        RAISE NOTICE '✓ Added testcase_reference_or_custom constraint';
    END IF;
END $$;

-- Step 2.6: Update comments
COMMENT ON COLUMN checklist_test_results.testcase_id IS 'Optional reference to base_testcases (for analytics). NULL for custom testcases.';
COMMENT ON COLUMN checklist_test_results.testcase_title IS 'Copied testcase title (independent of library). Always populated.';
COMMENT ON COLUMN checklist_test_results.testcase_description IS 'Copied testcase description (independent of library).';
COMMENT ON COLUMN checklist_test_results.testcase_priority IS 'Copied testcase priority (High/Medium/Low, independent of library).';
COMMENT ON COLUMN checklist_test_results.is_custom IS 'true = custom testcase (no library reference), false = library testcase (copied data)';

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PART 2 COMPLETE: checklist_test_results updated';
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- PART 3: Create Indexes for Performance
-- ============================================

-- Index for filtering custom modules
CREATE INDEX IF NOT EXISTS idx_checklist_modules_is_custom
    ON project_checklist_modules(is_custom);

-- Index for filtering custom testcases
CREATE INDEX IF NOT EXISTS idx_test_results_is_custom
    ON checklist_test_results(is_custom);

-- Index for module name searches
CREATE INDEX IF NOT EXISTS idx_checklist_modules_name
    ON project_checklist_modules(module_name);

-- Index for testcase title searches
CREATE INDEX IF NOT EXISTS idx_test_results_title
    ON checklist_test_results(testcase_title);

DO $$
BEGIN
    RAISE NOTICE '✓ Created performance indexes';
END $$;

-- ============================================
-- PART 4: Verification Queries
-- ============================================

-- Count modules by type
DO $$
DECLARE
    library_modules INT;
    custom_modules INT;
    total_modules INT;
BEGIN
    SELECT COUNT(*) INTO library_modules FROM project_checklist_modules WHERE is_custom = false;
    SELECT COUNT(*) INTO custom_modules FROM project_checklist_modules WHERE is_custom = true;
    SELECT COUNT(*) INTO total_modules FROM project_checklist_modules;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICATION: project_checklist_modules';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total modules: %', total_modules;
    RAISE NOTICE 'Library modules: %', library_modules;
    RAISE NOTICE 'Custom modules: %', custom_modules;
END $$;

-- Count testcases by type
DO $$
DECLARE
    library_testcases INT;
    custom_testcases INT;
    total_testcases INT;
BEGIN
    SELECT COUNT(*) INTO library_testcases FROM checklist_test_results WHERE is_custom = false;
    SELECT COUNT(*) INTO custom_testcases FROM checklist_test_results WHERE is_custom = true;
    SELECT COUNT(*) INTO total_testcases FROM checklist_test_results;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICATION: checklist_test_results';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total testcases: %', total_testcases;
    RAISE NOTICE 'Library testcases: %', library_testcases;
    RAISE NOTICE 'Custom testcases: %', custom_testcases;
END $$;

-- Check for any NULL values that shouldn't exist
DO $$
DECLARE
    null_module_names INT;
    null_testcase_titles INT;
BEGIN
    SELECT COUNT(*) INTO null_module_names
    FROM project_checklist_modules
    WHERE module_name IS NULL;

    SELECT COUNT(*) INTO null_testcase_titles
    FROM checklist_test_results
    WHERE testcase_title IS NULL;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'DATA INTEGRITY CHECK';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Modules with NULL names: % (should be 0)', null_module_names;
    RAISE NOTICE 'Testcases with NULL titles: % (should be 0)', null_testcase_titles;

    IF null_module_names > 0 OR null_testcase_titles > 0 THEN
        RAISE WARNING 'Data integrity issue detected! Please investigate.';
    END IF;
END $$;

-- ============================================
-- Migration Complete!
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 MIGRATION COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database now supports:';
    RAISE NOTICE '  ✓ Custom modules (no library reference)';
    RAISE NOTICE '  ✓ Custom testcases (no library reference)';
    RAISE NOTICE '  ✓ Checklist isolation (library updates wont affect existing checklists)';
    RAISE NOTICE '  ✓ Analytics capability (optional references preserved)';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Update backend services to use new columns';
    RAISE NOTICE '  2. Update frontend to support custom modules/testcases';
    RAISE NOTICE '  3. Test checklist isolation behavior';
    RAISE NOTICE '========================================';
END $$;
