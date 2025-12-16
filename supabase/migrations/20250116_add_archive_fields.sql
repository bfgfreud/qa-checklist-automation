-- Migration: Add archive (soft-delete) fields to test_projects
-- Date: 2025-01-16
-- Description: Adds deleted_at and deleted_by columns to support soft-delete/archive functionality

-- Add archive fields to test_projects table
ALTER TABLE test_projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE test_projects ADD COLUMN IF NOT EXISTS deleted_by TEXT DEFAULT NULL;

-- Create index for faster filtering of non-deleted projects
CREATE INDEX IF NOT EXISTS idx_test_projects_deleted_at ON test_projects(deleted_at);

-- Create index for querying archived projects by deletion date
CREATE INDEX IF NOT EXISTS idx_test_projects_deleted_at_not_null ON test_projects(deleted_at) WHERE deleted_at IS NOT NULL;

COMMENT ON COLUMN test_projects.deleted_at IS 'Timestamp when project was archived/soft-deleted. NULL means project is active.';
COMMENT ON COLUMN test_projects.deleted_by IS 'Name of the tester who archived the project.';
