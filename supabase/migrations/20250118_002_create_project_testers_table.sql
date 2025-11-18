-- ============================================
-- Migration: Create Project Testers Junction Table
-- Created: 2025-01-18
-- Phase: 1 - Multi-Tester Foundation
-- Description: Creates the project_testers junction table to link testers to projects
--              Many-to-many relationship: multiple testers per project, multiple projects per tester
-- ============================================

-- ============================================
-- Prerequisites
-- ============================================
-- This migration requires:
-- 1. test_projects table (from MIGRATION_ADD_PROJECTS.sql)
-- 2. testers table (from 20250118_001_create_testers_table.sql)

-- ============================================
-- Rollback Instructions (if needed)
-- ============================================
-- To rollback this migration, run:
-- DROP TABLE IF EXISTS project_testers CASCADE;

-- ============================================
-- Create project_testers junction table
-- ============================================
CREATE TABLE IF NOT EXISTS project_testers (
  project_id UUID REFERENCES test_projects(id) ON DELETE CASCADE NOT NULL,
  tester_id UUID REFERENCES testers(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (project_id, tester_id)
);

-- ============================================
-- Indexes for Performance
-- ============================================
-- Index on tester_id for reverse lookups (find all projects for a tester)
CREATE INDEX IF NOT EXISTS idx_project_testers_tester_id ON project_testers(tester_id);

-- Index on project_id for forward lookups (find all testers for a project)
CREATE INDEX IF NOT EXISTS idx_project_testers_project_id ON project_testers(project_id);

-- ============================================
-- Comments for Documentation
-- ============================================
COMMENT ON TABLE project_testers IS 'Junction table linking testers to projects (many-to-many relationship)';
COMMENT ON COLUMN project_testers.project_id IS 'Reference to test_projects table';
COMMENT ON COLUMN project_testers.tester_id IS 'Reference to testers table';
COMMENT ON COLUMN project_testers.assigned_at IS 'Timestamp when tester was assigned to project';

-- ============================================
-- Verification Queries
-- ============================================
-- Run these to verify the table was created successfully:

-- Check table structure:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'project_testers'
-- ORDER BY ordinal_position;

-- Check foreign key constraints:
-- SELECT constraint_name, table_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name = 'project_testers'
-- ORDER BY constraint_name;

-- ============================================
-- Migration Complete
-- ============================================
