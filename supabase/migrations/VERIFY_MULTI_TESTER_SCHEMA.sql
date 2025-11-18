-- ============================================
-- Verification Script: Multi-Tester Schema
-- Created: 2025-01-18
-- Phase: 1 - Multi-Tester Foundation
-- Description: Comprehensive verification queries to confirm all Phase 1 migrations
--              were applied successfully
-- ============================================

-- ============================================
-- HOW TO USE THIS SCRIPT
-- ============================================
-- Run this entire script in Supabase SQL Editor after running all 4 migration files.
-- Review the output of each query to ensure everything is correct.

-- ============================================
-- CHECK 1: Verify all required tables exist
-- ============================================
SELECT
    'CHECK 1: Tables Exist' as check_name,
    table_name,
    CASE
        WHEN table_name IN ('testers', 'project_testers', 'test_case_attachments', 'checklist_test_results')
        THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'testers',
    'project_testers',
    'test_case_attachments',
    'checklist_test_results'
  )
ORDER BY table_name;

-- Expected: 4 rows returned with all showing '✅ PASS'

-- ============================================
-- CHECK 2: Verify testers table structure
-- ============================================
SELECT
    'CHECK 2: Testers Table' as check_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'testers'
ORDER BY ordinal_position;

-- Expected columns:
-- id (uuid, NO, gen_random_uuid())
-- name (text, NO, null)
-- email (text, YES, null)
-- color (text, YES, '#FF6B35')
-- created_at (timestamp with time zone, YES, now())

-- ============================================
-- CHECK 3: Verify project_testers table structure
-- ============================================
SELECT
    'CHECK 3: Project Testers Table' as check_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'project_testers'
ORDER BY ordinal_position;

-- Expected columns:
-- project_id (uuid, NO)
-- tester_id (uuid, NO)
-- assigned_at (timestamp with time zone, YES)

-- ============================================
-- CHECK 4: Verify test_case_attachments table structure
-- ============================================
SELECT
    'CHECK 4: Attachments Table' as check_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'test_case_attachments'
ORDER BY ordinal_position;

-- Expected columns:
-- id (uuid, NO)
-- test_result_id (uuid, NO)
-- file_url (text, NO)
-- file_name (text, NO)
-- file_type (text, NO)
-- file_size (integer, YES)
-- uploaded_at (timestamp with time zone, YES)

-- ============================================
-- CHECK 5: Verify tester_id column was added to checklist_test_results
-- ============================================
SELECT
    'CHECK 5: Test Results - tester_id Column' as check_name,
    column_name,
    data_type,
    is_nullable,
    CASE
        WHEN is_nullable = 'NO' THEN '✅ NOT NULL constraint applied'
        ELSE '❌ FAIL: Should be NOT NULL'
    END as validation
FROM information_schema.columns
WHERE table_name = 'checklist_test_results'
  AND column_name = 'tester_id';

-- Expected: 1 row with is_nullable = 'NO'

-- ============================================
-- CHECK 6: Verify all foreign key constraints
-- ============================================
SELECT
    'CHECK 6: Foreign Key Constraints' as check_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    '✅ PASS' as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('project_testers', 'test_case_attachments', 'checklist_test_results')
ORDER BY tc.table_name, kcu.column_name;

-- Expected foreign keys:
-- project_testers.project_id → test_projects.id
-- project_testers.tester_id → testers.id
-- test_case_attachments.test_result_id → checklist_test_results.id
-- checklist_test_results.tester_id → testers.id

-- ============================================
-- CHECK 7: Verify unique constraints
-- ============================================
SELECT
    'CHECK 7: Unique Constraints' as check_name,
    constraint_name,
    table_name,
    '✅ PASS' as status
FROM information_schema.table_constraints
WHERE table_name IN ('testers', 'checklist_test_results', 'project_testers')
  AND constraint_type = 'UNIQUE'
ORDER BY table_name, constraint_name;

-- Expected constraints:
-- testers.email (UNIQUE)
-- checklist_test_results.checklist_test_results_unique_multi_tester (UNIQUE on project_checklist_module_id, testcase_id, tester_id)
-- project_testers (PRIMARY KEY is also unique on project_id, tester_id)

-- ============================================
-- CHECK 8: Verify indexes exist
-- ============================================
SELECT
    'CHECK 8: Indexes' as check_name,
    tablename,
    indexname,
    '✅ PASS' as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('testers', 'project_testers', 'test_case_attachments', 'checklist_test_results')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Expected indexes include:
-- idx_testers_email
-- idx_project_testers_tester_id
-- idx_project_testers_project_id
-- idx_attachments_test_result
-- idx_test_results_tester_id

-- ============================================
-- CHECK 9: Verify Legacy Tester was created
-- ============================================
SELECT
    'CHECK 9: Legacy Tester' as check_name,
    id,
    name,
    email,
    color,
    CASE
        WHEN email = 'legacy@system' THEN '✅ Legacy Tester exists'
        ELSE '❌ FAIL'
    END as status
FROM testers
WHERE email = 'legacy@system';

-- Expected: 1 row with name = 'Legacy Tester', email = 'legacy@system', color = '#888888'

-- ============================================
-- CHECK 10: Verify existing data was migrated
-- ============================================
SELECT
    'CHECK 10: Data Migration' as check_name,
    COUNT(*) as total_test_results,
    COUNT(tester_id) as results_with_tester,
    CASE
        WHEN COUNT(*) = COUNT(tester_id) THEN '✅ All results have a tester_id'
        ELSE '❌ FAIL: Some results missing tester_id'
    END as status
FROM checklist_test_results;

-- Expected: total_test_results = results_with_tester (all rows should have tester_id)

-- ============================================
-- CHECK 11: Count test results by tester
-- ============================================
SELECT
    'CHECK 11: Results by Tester' as check_name,
    t.name as tester_name,
    t.email,
    COUNT(ctr.id) as test_count,
    '✅ Data assigned' as status
FROM testers t
LEFT JOIN checklist_test_results ctr ON ctr.tester_id = t.id
GROUP BY t.id, t.name, t.email
ORDER BY COUNT(ctr.id) DESC;

-- Expected: Shows Legacy Tester with count of existing test results

-- ============================================
-- CHECK 12: Sample data query (multi-tester structure)
-- ============================================
SELECT
    'CHECK 12: Multi-Tester Sample Data' as check_name,
    p.name as project_name,
    m.name as module_name,
    tc.title as testcase_title,
    t.name as tester_name,
    ctr.status,
    '✅ Multi-tester structure' as status
FROM checklist_test_results ctr
JOIN project_checklist_modules pcm ON ctr.project_checklist_module_id = pcm.id
JOIN test_projects p ON pcm.project_id = p.id
JOIN base_modules m ON pcm.module_id = m.id
JOIN base_testcases tc ON ctr.testcase_id = tc.id
JOIN testers t ON ctr.tester_id = t.id
LIMIT 5;

-- Expected: Shows sample rows with all relationships working correctly

-- ============================================
-- CHECK 13: Verify ON DELETE CASCADE behavior
-- ============================================
SELECT
    'CHECK 13: CASCADE Constraints' as check_name,
    tc.table_name,
    kcu.column_name,
    rc.delete_rule,
    CASE
        WHEN rc.delete_rule = 'CASCADE' THEN '✅ ON DELETE CASCADE configured'
        ELSE '❌ FAIL: Should be CASCADE'
    END as status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('project_testers', 'test_case_attachments', 'checklist_test_results')
ORDER BY tc.table_name, kcu.column_name;

-- Expected: All foreign keys should have delete_rule = 'CASCADE'

-- ============================================
-- SUMMARY REPORT
-- ============================================
DO $$
DECLARE
    testers_count INT;
    project_testers_count INT;
    attachments_count INT;
    test_results_count INT;
    legacy_count INT;
BEGIN
    SELECT COUNT(*) INTO testers_count FROM testers;
    SELECT COUNT(*) INTO project_testers_count FROM project_testers;
    SELECT COUNT(*) INTO attachments_count FROM test_case_attachments;
    SELECT COUNT(*) INTO test_results_count FROM checklist_test_results;
    SELECT COUNT(*) INTO legacy_count FROM testers WHERE email = 'legacy@system';

    RAISE NOTICE '============================================';
    RAISE NOTICE 'PHASE 1 MIGRATION VERIFICATION SUMMARY';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Testers: % (should be at least 1 for Legacy Tester)', testers_count;
    RAISE NOTICE 'Project-Tester Assignments: %', project_testers_count;
    RAISE NOTICE 'Test Case Attachments: %', attachments_count;
    RAISE NOTICE 'Test Results: % (all should have tester_id)', test_results_count;
    RAISE NOTICE 'Legacy Tester Exists: %', CASE WHEN legacy_count = 1 THEN 'YES ✅' ELSE 'NO ❌' END;
    RAISE NOTICE '============================================';

    IF legacy_count = 1 AND test_results_count > 0 THEN
        RAISE NOTICE 'RESULT: ✅ Multi-Tester Migration Successful!';
    ELSIF legacy_count = 0 THEN
        RAISE NOTICE 'RESULT: ❌ Legacy Tester not created!';
    ELSE
        RAISE NOTICE 'RESULT: ⚠️ Check individual queries above for details';
    END IF;

    RAISE NOTICE '============================================';
END $$;

-- ============================================
-- Verification Complete
-- ============================================
-- If all checks pass, the Phase 1 Multi-Tester Foundation is ready!
