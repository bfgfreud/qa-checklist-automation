-- Migration: Create test_projects table
-- Created: 2025-01-17
-- Description: Create projects table for managing test projects with metadata

-- ============================================
-- Table: test_projects
-- ============================================
CREATE TABLE IF NOT EXISTS test_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT,
  platform TEXT,
  status TEXT CHECK (status IN ('Draft', 'In Progress', 'Completed')) DEFAULT 'Draft',
  due_date DATE,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint on name to prevent duplicates
ALTER TABLE test_projects ADD CONSTRAINT unique_project_name UNIQUE (name);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_projects_status ON test_projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON test_projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_due_date ON test_projects(due_date);
CREATE INDEX IF NOT EXISTS idx_projects_platform ON test_projects(platform);

-- ============================================
-- Triggers for updated_at
-- ============================================
-- Reuse the update_updated_at_column function if it exists, otherwise create it
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_test_projects_updated_at BEFORE UPDATE ON test_projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Comments for Documentation
-- ============================================
COMMENT ON TABLE test_projects IS 'Test projects with metadata and tracking';
COMMENT ON COLUMN test_projects.name IS 'Unique project name';
COMMENT ON COLUMN test_projects.version IS 'Project version (e.g., v2.5, 1.0.3)';
COMMENT ON COLUMN test_projects.platform IS 'Target platform (e.g., iOS, Android, Web, All)';
COMMENT ON COLUMN test_projects.status IS 'Project status: Draft, In Progress, or Completed';
COMMENT ON COLUMN test_projects.due_date IS 'Optional project due date';
COMMENT ON COLUMN test_projects.created_by IS 'User ID/email for future auth integration';

-- ============================================
-- Sample Data (for development/testing)
-- ============================================
INSERT INTO test_projects (name, description, version, platform, status, due_date, created_by) VALUES
  ('Mobile App v2.5 Testing', 'Comprehensive testing for mobile app version 2.5', 'v2.5', 'iOS', 'In Progress', '2025-02-01', NULL),
  ('Web Dashboard Q1 2025', 'Testing web dashboard features for Q1 release', '1.0.0', 'Web', 'Draft', '2025-03-15', NULL),
  ('Android Beta Release', 'Beta testing for Android app', 'v1.2.0-beta', 'Android', 'In Progress', '2025-01-30', NULL),
  ('Cross-Platform Integration', 'Integration testing across all platforms', '2.0.0', 'All', 'Draft', '2025-04-01', NULL),
  ('Security Audit 2025', 'Annual security testing and audit', '1.0', 'All', 'Completed', '2025-01-15', NULL)
ON CONFLICT (name) DO NOTHING;
