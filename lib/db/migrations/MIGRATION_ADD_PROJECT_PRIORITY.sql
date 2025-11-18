-- Migration: Add priority field to test_projects
-- Created: 2025-01-17
-- Description: Add priority field to projects (High/Medium/Low)

-- ============================================
-- Add priority column
-- ============================================
ALTER TABLE test_projects
ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('High', 'Medium', 'Low')) DEFAULT 'Medium';

-- Create index on priority for filtering
CREATE INDEX IF NOT EXISTS idx_projects_priority ON test_projects(priority);

-- Add comment for documentation
COMMENT ON COLUMN test_projects.priority IS 'Project priority: High, Medium, or Low';

-- Update existing projects to have Medium priority
UPDATE test_projects SET priority = 'Medium' WHERE priority IS NULL;

-- Verification query
SELECT id, name, priority FROM test_projects ORDER BY created_at DESC;
