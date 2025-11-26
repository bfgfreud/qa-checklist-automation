-- Performance Indexes for QA Checklist Automation
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/[your-project]/sql
--
-- These indexes improve query performance for common operations:
-- - Fetching checklists with test results
-- - Getting modules with test cases
-- - Listing projects with testers
-- - Loading attachments for test results

-- =====================================================
-- Foreign Key Indexes for Faster Joins
-- =====================================================

-- checklist_test_results indexes
CREATE INDEX IF NOT EXISTS idx_checklist_test_results_module_id
  ON checklist_test_results(project_checklist_module_id);

CREATE INDEX IF NOT EXISTS idx_checklist_test_results_testcase_id
  ON checklist_test_results(testcase_id);

CREATE INDEX IF NOT EXISTS idx_checklist_test_results_tester_id
  ON checklist_test_results(tester_id);

-- project_checklist_modules indexes
CREATE INDEX IF NOT EXISTS idx_project_checklist_modules_project_id
  ON project_checklist_modules(project_id);

CREATE INDEX IF NOT EXISTS idx_project_checklist_modules_module_id
  ON project_checklist_modules(module_id);

-- base_testcases indexes
CREATE INDEX IF NOT EXISTS idx_base_testcases_module_id
  ON base_testcases(module_id);

-- project_testers indexes
CREATE INDEX IF NOT EXISTS idx_project_testers_project_id
  ON project_testers(project_id);

CREATE INDEX IF NOT EXISTS idx_project_testers_tester_id
  ON project_testers(tester_id);

-- test_case_attachments indexes
CREATE INDEX IF NOT EXISTS idx_test_case_attachments_result_id
  ON test_case_attachments(test_result_id);

-- =====================================================
-- Composite Indexes for Common Query Patterns
-- =====================================================

-- For filtering test results by status within a module
CREATE INDEX IF NOT EXISTS idx_checklist_results_module_status
  ON checklist_test_results(project_checklist_module_id, status);

-- For ordering modules within a project
CREATE INDEX IF NOT EXISTS idx_project_checklist_modules_order
  ON project_checklist_modules(project_id, order_index);

-- For ordering test cases within a module
CREATE INDEX IF NOT EXISTS idx_base_testcases_order
  ON base_testcases(module_id, order_index);

-- =====================================================
-- Verification Queries (run these to verify indexes)
-- =====================================================

-- List all indexes on checklist_test_results
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'checklist_test_results';

-- List all indexes on project_checklist_modules
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'project_checklist_modules';
