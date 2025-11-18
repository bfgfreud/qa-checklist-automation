-- Migration: Create checklist tables for project test execution tracking
-- Created: 2025-01-17
-- Description: Creates project_checklist_modules and checklist_test_results tables
--              to support multiple module instances with custom labels and test execution tracking

-- ============================================
-- Table 1: project_checklist_modules
-- ============================================
-- Links projects to module instances (allows same module multiple times with different labels)
CREATE TABLE IF NOT EXISTS project_checklist_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES test_projects(id) ON DELETE CASCADE NOT NULL,
  module_id UUID REFERENCES base_modules(id) ON DELETE CASCADE NOT NULL,
  instance_label TEXT, -- Optional custom label like "Ayaka", "Zhongli"
  instance_number INTEGER NOT NULL DEFAULT 1, -- Auto-numbered for same module in project
  order_index INTEGER NOT NULL DEFAULT 0, -- For drag-drop ordering within project
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table 2: checklist_test_results
-- ============================================
-- Tracks individual test case execution results
CREATE TABLE IF NOT EXISTS checklist_test_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_checklist_module_id UUID REFERENCES project_checklist_modules(id) ON DELETE CASCADE NOT NULL,
  testcase_id UUID REFERENCES base_testcases(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('Pending', 'Pass', 'Fail', 'Skipped')) DEFAULT 'Pending' NOT NULL,
  notes TEXT, -- Optional test notes
  tested_by TEXT, -- Optional, for future auth
  tested_at TIMESTAMP WITH TIME ZONE, -- When marked pass/fail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================
-- Optimize lookup of modules by project
CREATE INDEX IF NOT EXISTS idx_checklist_modules_project_id
  ON project_checklist_modules(project_id);

-- Optimize lookup by module (to find all instances of a module)
CREATE INDEX IF NOT EXISTS idx_checklist_modules_module_id
  ON project_checklist_modules(module_id);

-- Optimize ordering queries
CREATE INDEX IF NOT EXISTS idx_checklist_modules_order
  ON project_checklist_modules(project_id, order_index);

-- Composite index for finding instance numbers
CREATE INDEX IF NOT EXISTS idx_checklist_modules_instance_lookup
  ON project_checklist_modules(project_id, module_id, instance_number);

-- Optimize test result lookups by checklist module
CREATE INDEX IF NOT EXISTS idx_test_results_checklist_module
  ON checklist_test_results(project_checklist_module_id);

-- Optimize test result lookups by testcase
CREATE INDEX IF NOT EXISTS idx_test_results_testcase
  ON checklist_test_results(testcase_id);

-- Optimize filtering by status
CREATE INDEX IF NOT EXISTS idx_test_results_status
  ON checklist_test_results(status);

-- Composite index for status summary queries
CREATE INDEX IF NOT EXISTS idx_test_results_module_status
  ON checklist_test_results(project_checklist_module_id, status);

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE TRIGGER update_project_checklist_modules_updated_at
  BEFORE UPDATE ON project_checklist_modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checklist_test_results_updated_at
  BEFORE UPDATE ON checklist_test_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Trigger for auto-setting tested_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION set_tested_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- Set tested_at when status changes from Pending to Pass/Fail/Skipped
    IF (OLD.status = 'Pending' AND NEW.status IN ('Pass', 'Fail', 'Skipped')) THEN
        NEW.tested_at = NOW();
    END IF;
    -- Clear tested_at when status changes back to Pending
    IF (NEW.status = 'Pending' AND OLD.status != 'Pending') THEN
        NEW.tested_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_checklist_test_results_tested_at
  BEFORE UPDATE ON checklist_test_results
  FOR EACH ROW EXECUTE FUNCTION set_tested_at_timestamp();

-- ============================================
-- Comments for Documentation
-- ============================================
COMMENT ON TABLE project_checklist_modules IS 'Links projects to module instances, allows same module multiple times with custom labels';
COMMENT ON TABLE checklist_test_results IS 'Tracks execution results for individual test cases within project checklists';

COMMENT ON COLUMN project_checklist_modules.instance_label IS 'Optional custom label for the module instance (e.g., character names, feature variants)';
COMMENT ON COLUMN project_checklist_modules.instance_number IS 'Auto-incremented number for same module in project (1, 2, 3, etc.)';
COMMENT ON COLUMN project_checklist_modules.order_index IS 'Display order within project checklist for drag-drop sorting';

COMMENT ON COLUMN checklist_test_results.status IS 'Test execution status: Pending, Pass, Fail, or Skipped';
COMMENT ON COLUMN checklist_test_results.notes IS 'Optional notes about test execution, failure reasons, etc.';
COMMENT ON COLUMN checklist_test_results.tested_by IS 'User ID/email who executed the test (for future auth)';
COMMENT ON COLUMN checklist_test_results.tested_at IS 'Timestamp when test was marked as Pass/Fail/Skipped (auto-set by trigger)';

-- ============================================
-- Sample Data (for development/testing)
-- ============================================
-- Add some checklist modules to existing projects
INSERT INTO project_checklist_modules (project_id, module_id, instance_label, instance_number, order_index)
SELECT
  p.id as project_id,
  m.id as module_id,
  NULL as instance_label,
  1 as instance_number,
  (ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY m.order_index) - 1) as order_index
FROM test_projects p
CROSS JOIN (SELECT * FROM base_modules ORDER BY order_index LIMIT 3) m
WHERE p.name = 'Mobile App v2.5 Testing'
ON CONFLICT DO NOTHING;

-- Create test results for the added modules
INSERT INTO checklist_test_results (project_checklist_module_id, testcase_id, status, notes)
SELECT
  pcm.id as project_checklist_module_id,
  tc.id as testcase_id,
  'Pending' as status,
  NULL as notes
FROM project_checklist_modules pcm
JOIN base_testcases tc ON tc.module_id = pcm.module_id
WHERE pcm.project_id IN (SELECT id FROM test_projects WHERE name = 'Mobile App v2.5 Testing')
ON CONFLICT DO NOTHING;

-- Add a second instance of a module with custom label (if modules exist)
INSERT INTO project_checklist_modules (project_id, module_id, instance_label, instance_number, order_index)
SELECT
  p.id as project_id,
  m.id as module_id,
  'Ayaka' as instance_label,
  2 as instance_number,
  100 as order_index
FROM test_projects p
CROSS JOIN (SELECT * FROM base_modules ORDER BY order_index LIMIT 1) m
WHERE p.name = 'Mobile App v2.5 Testing'
ON CONFLICT DO NOTHING;

-- Create test results for the second instance
INSERT INTO checklist_test_results (project_checklist_module_id, testcase_id, status, notes)
SELECT
  pcm.id as project_checklist_module_id,
  tc.id as testcase_id,
  'Pending' as status,
  NULL as notes
FROM project_checklist_modules pcm
JOIN base_testcases tc ON tc.module_id = pcm.module_id
WHERE pcm.instance_label = 'Ayaka'
  AND pcm.project_id IN (SELECT id FROM test_projects WHERE name = 'Mobile App v2.5 Testing')
ON CONFLICT DO NOTHING;
