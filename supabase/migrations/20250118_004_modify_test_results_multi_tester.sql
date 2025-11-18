-- ============================================
-- Migration: Modify Test Results for Multi-Tester Support
-- Created: 2025-01-18
-- Phase: 1 - Multi-Tester Foundation
-- Description: Modifies checklist_test_results table to support multiple testers
--              working on the same checklist simultaneously
--
--              IMPORTANT: This migration modifies existing data!
--              Creates a "Legacy Tester" for existing test results to preserve data
-- ============================================

-- ============================================
-- Prerequisites
-- ============================================
-- This migration requires:
-- 1. checklist_test_results table (from MIGRATION_ADD_CHECKLISTS.sql)
-- 2. testers table (from 20250118_001_create_testers_table.sql)

-- ============================================
-- What This Migration Does
-- ============================================
-- BEFORE: One result per (module, testcase) - single tester
-- AFTER:  One result per (module, testcase, tester) - multi tester
--
-- Example:
-- BEFORE: 1 tester × 50 test cases = 50 database rows
-- AFTER:  3 testers × 50 test cases = 150 database rows (one row per tester per test case)

-- ============================================
-- Rollback Instructions (if needed)
-- ============================================
-- To rollback this migration, run:
-- ALTER TABLE checklist_test_results DROP COLUMN IF EXISTS tester_id;
-- DELETE FROM testers WHERE email = 'legacy@system';
--
-- Note: Rolling back will lose the multi-tester capability but preserve existing data

-- ============================================
-- STEP 1: Add tester_id column (nullable initially)
-- ============================================
DO $$
BEGIN
    -- Check if column already exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'checklist_test_results'
          AND column_name = 'tester_id'
    ) THEN
        ALTER TABLE checklist_test_results
            ADD COLUMN tester_id UUID REFERENCES testers(id) ON DELETE CASCADE;

        RAISE NOTICE 'Added tester_id column to checklist_test_results';
    ELSE
        RAISE NOTICE 'Column tester_id already exists in checklist_test_results';
    END IF;
END $$;

-- ============================================
-- STEP 2: Create "Legacy Tester" for existing data
-- ============================================
-- This preserves all existing test results by assigning them to a system tester
DO $$
BEGIN
    INSERT INTO testers (name, email, color)
    VALUES ('Legacy Tester', 'legacy@system', '#888888')
    ON CONFLICT (email) DO NOTHING;

    RAISE NOTICE 'Created Legacy Tester account for existing data';
END $$;

-- ============================================
-- STEP 3: Update all existing records to use Legacy Tester
-- ============================================
DO $$
DECLARE
    legacy_tester_id UUID;
    updated_count INT;
BEGIN
    -- Get the Legacy Tester ID
    SELECT id INTO legacy_tester_id
    FROM testers
    WHERE email = 'legacy@system';

    -- Update all NULL tester_id records
    UPDATE checklist_test_results
    SET tester_id = legacy_tester_id
    WHERE tester_id IS NULL;

    GET DIAGNOSTICS updated_count = ROW_COUNT;

    RAISE NOTICE 'Updated % existing test results to use Legacy Tester', updated_count;
END $$;

-- ============================================
-- STEP 4: Make tester_id required (NOT NULL)
-- ============================================
DO $$
BEGIN
    -- Check if the constraint already exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'checklist_test_results'
          AND column_name = 'tester_id'
          AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE checklist_test_results
            ALTER COLUMN tester_id SET NOT NULL;

        RAISE NOTICE 'Made tester_id column NOT NULL';
    ELSE
        RAISE NOTICE 'Column tester_id is already NOT NULL';
    END IF;
END $$;

-- ============================================
-- STEP 5: Update unique constraint for multi-tester
-- ============================================
-- Old constraint: One result per (module, testcase) - single tester
-- New constraint: One result per (module, testcase, tester) - multi tester

-- Drop old constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'checklist_test_results_unique'
          AND table_name = 'checklist_test_results'
    ) THEN
        ALTER TABLE checklist_test_results
            DROP CONSTRAINT checklist_test_results_unique;

        RAISE NOTICE 'Dropped old unique constraint (single-tester)';
    ELSE
        RAISE NOTICE 'Old unique constraint does not exist';
    END IF;
END $$;

-- Create new constraint with tester_id included
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'checklist_test_results_unique_multi_tester'
          AND table_name = 'checklist_test_results'
    ) THEN
        ALTER TABLE checklist_test_results
            ADD CONSTRAINT checklist_test_results_unique_multi_tester
            UNIQUE (project_checklist_module_id, testcase_id, tester_id);

        RAISE NOTICE 'Created new unique constraint (multi-tester)';
    ELSE
        RAISE NOTICE 'New unique constraint already exists';
    END IF;
END $$;

-- ============================================
-- STEP 6: Create index on tester_id for performance
-- ============================================
DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_test_results_tester_id
        ON checklist_test_results(tester_id);

    RAISE NOTICE 'Created index on tester_id for fast lookups';
END $$;

-- ============================================
-- STEP 7: Update the tested_by column (deprecated in favor of tester_id)
-- ============================================
-- Update existing tested_by values to reference the tester name
UPDATE checklist_test_results ctr
SET tested_by = t.name
FROM testers t
WHERE ctr.tester_id = t.id
  AND (ctr.tested_by IS NULL OR ctr.tested_by = '');

COMMENT ON COLUMN checklist_test_results.tested_by IS 'DEPRECATED: Use tester_id instead. Legacy text field for tester name.';

-- ============================================
-- STEP 8: Add comments for documentation
-- ============================================
COMMENT ON COLUMN checklist_test_results.tester_id IS 'Reference to the tester who performed this test (enables multi-tester collaboration)';

-- ============================================
-- Verification Queries
-- ============================================
-- Run these to verify the migration was successful:

-- Check that tester_id column exists and is NOT NULL:
-- SELECT column_name, is_nullable, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'checklist_test_results'
--   AND column_name = 'tester_id';

-- Check the new unique constraint:
-- SELECT constraint_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name = 'checklist_test_results'
--   AND constraint_type = 'UNIQUE';

-- Count test results by tester:
-- SELECT t.name, COUNT(ctr.id) as test_count
-- FROM testers t
-- LEFT JOIN checklist_test_results ctr ON ctr.tester_id = t.id
-- GROUP BY t.id, t.name
-- ORDER BY t.name;

-- Check Legacy Tester exists:
-- SELECT * FROM testers WHERE email = 'legacy@system';

-- ============================================
-- Migration Complete
-- ============================================
-- The checklist_test_results table now supports multiple testers!
-- Each tester can have their own separate test results for the same test cases.
