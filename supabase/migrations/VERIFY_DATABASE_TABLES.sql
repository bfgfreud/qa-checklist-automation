-- ============================================
-- Quick Database Verification Script
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Check which tables exist
SELECT
  table_name,
  CASE
    WHEN table_name = 'base_modules' THEN '✅ Base table for test modules'
    WHEN table_name = 'base_testcases' THEN '✅ Base table for test cases'
    WHEN table_name = 'test_projects' THEN '✅ Projects table'
    WHEN table_name = 'project_checklist_modules' THEN '🎯 CRITICAL: Checklist modules table'
    WHEN table_name = 'checklist_test_results' THEN '🎯 CRITICAL: Test results table'
    ELSE 'Other table'
  END as description
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'base_modules',
    'base_testcases',
    'test_projects',
    'project_checklist_modules',
    'checklist_test_results'
  )
ORDER BY
  CASE table_name
    WHEN 'base_modules' THEN 1
    WHEN 'base_testcases' THEN 2
    WHEN 'test_projects' THEN 3
    WHEN 'project_checklist_modules' THEN 4
    WHEN 'checklist_test_results' THEN 5
  END;

-- 2. Check row counts in each table
SELECT
  'base_modules' as table_name,
  COUNT(*) as row_count,
  '📦 Modules in library' as description
FROM base_modules
UNION ALL
SELECT
  'base_testcases',
  COUNT(*),
  '📝 Test cases in library'
FROM base_testcases
UNION ALL
SELECT
  'test_projects',
  COUNT(*),
  '📁 Projects created'
FROM test_projects
UNION ALL
SELECT
  'project_checklist_modules',
  COUNT(*),
  '🎯 Modules added to checklists'
FROM project_checklist_modules
UNION ALL
SELECT
  'checklist_test_results',
  COUNT(*),
  '✓ Test results tracked'
FROM checklist_test_results;

-- 3. Check if modules have testcases
SELECT
  m.id as module_id,
  m.name as module_name,
  COUNT(tc.id) as testcase_count,
  CASE
    WHEN COUNT(tc.id) = 0 THEN '⚠️ NO TESTCASES! Add testcases to this module'
    ELSE '✅ Has testcases'
  END as status
FROM base_modules m
LEFT JOIN base_testcases tc ON tc.module_id = m.id
GROUP BY m.id, m.name
ORDER BY testcase_count DESC;

-- 4. Check checklist data for a project (replace with your project ID)
-- Find your project ID first:
SELECT
  id as project_id,
  name as project_name,
  'Use this ID in the query below' as instruction
FROM test_projects
ORDER BY created_at DESC
LIMIT 5;

-- Then check what's in the checklist (replace PROJECT_ID):
-- SELECT
--   pcm.id as checklist_module_id,
--   m.name as module_name,
--   pcm.instance_label,
--   pcm.instance_number,
--   COUNT(ctr.id) as test_results_count,
--   COUNT(CASE WHEN ctr.status = 'Pending' THEN 1 END) as pending_count,
--   COUNT(CASE WHEN ctr.status = 'Pass' THEN 1 END) as pass_count,
--   COUNT(CASE WHEN ctr.status = 'Fail' THEN 1 END) as fail_count
-- FROM project_checklist_modules pcm
-- JOIN base_modules m ON m.id = pcm.module_id
-- LEFT JOIN checklist_test_results ctr ON ctr.project_checklist_module_id = pcm.id
-- WHERE pcm.project_id = 'YOUR_PROJECT_ID_HERE'
-- GROUP BY pcm.id, m.name, pcm.instance_label, pcm.instance_number
-- ORDER BY pcm.order_index;
