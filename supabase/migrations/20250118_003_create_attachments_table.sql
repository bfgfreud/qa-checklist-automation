-- ============================================
-- Migration: Create Test Case Attachments Table
-- Created: 2025-01-18
-- Phase: 1 - Multi-Tester Foundation
-- Description: Creates the test_case_attachments table to store image attachments for test results
--              Stores metadata for files uploaded to Supabase Storage
-- ============================================

-- ============================================
-- Prerequisites
-- ============================================
-- This migration requires:
-- 1. checklist_test_results table (from MIGRATION_ADD_CHECKLISTS.sql)

-- ============================================
-- Rollback Instructions (if needed)
-- ============================================
-- To rollback this migration, run:
-- DROP TABLE IF EXISTS test_case_attachments CASCADE;

-- ============================================
-- Create test_case_attachments table
-- ============================================
CREATE TABLE IF NOT EXISTS test_case_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_result_id UUID REFERENCES checklist_test_results(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================
-- Index for fast lookups by test result (primary query pattern)
CREATE INDEX IF NOT EXISTS idx_attachments_test_result ON test_case_attachments(test_result_id);

-- Index for filtering by file type (e.g., images only)
CREATE INDEX IF NOT EXISTS idx_attachments_file_type ON test_case_attachments(file_type);

-- Index for sorting by upload time
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_at ON test_case_attachments(uploaded_at DESC);

-- ============================================
-- Comments for Documentation
-- ============================================
COMMENT ON TABLE test_case_attachments IS 'Stores metadata for image/file attachments linked to test execution results';
COMMENT ON COLUMN test_case_attachments.test_result_id IS 'Reference to the test result this attachment belongs to';
COMMENT ON COLUMN test_case_attachments.file_url IS 'Full URL to the file in Supabase Storage';
COMMENT ON COLUMN test_case_attachments.file_name IS 'Original filename uploaded by user';
COMMENT ON COLUMN test_case_attachments.file_type IS 'MIME type of the file (e.g., image/png, image/jpeg)';
COMMENT ON COLUMN test_case_attachments.file_size IS 'File size in bytes (optional)';
COMMENT ON COLUMN test_case_attachments.uploaded_at IS 'Timestamp when the file was uploaded';

-- ============================================
-- Verification Queries
-- ============================================
-- Run these to verify the table was created successfully:

-- Check table structure:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'test_case_attachments'
-- ORDER BY ordinal_position;

-- Check indexes:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'test_case_attachments';

-- Check foreign key constraints:
-- SELECT constraint_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name = 'test_case_attachments'
-- ORDER BY constraint_name;

-- ============================================
-- Usage Notes
-- ============================================
-- This table stores METADATA only. Actual files are stored in Supabase Storage.
-- file_url should point to: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
--
-- Example usage:
-- When a tester uploads a screenshot for a failed test:
-- 1. Upload file to Supabase Storage bucket
-- 2. Get the public URL from Storage
-- 3. Insert metadata into this table with the URL
-- 4. Display attachments when viewing test results

-- ============================================
-- Migration Complete
-- ============================================
