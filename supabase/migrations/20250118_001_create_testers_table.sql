-- ============================================
-- Migration: Create Testers Table
-- Created: 2025-01-18
-- Phase: 1 - Multi-Tester Foundation
-- Description: Creates the testers table to store tester information
--              Pre-authentication system - testers are manually entered
--              Prepares for future OAuth integration
-- ============================================

-- ============================================
-- Rollback Instructions (if needed)
-- ============================================
-- To rollback this migration, run:
-- DROP TABLE IF EXISTS testers CASCADE;

-- ============================================
-- Create testers table
-- ============================================
CREATE TABLE IF NOT EXISTS testers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  color TEXT DEFAULT '#FF6B35',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
-- Index on email for fast lookup and uniqueness enforcement
CREATE INDEX IF NOT EXISTS idx_testers_email ON testers(email);

-- ============================================
-- Comments for Documentation
-- ============================================
COMMENT ON TABLE testers IS 'Stores tester information for multi-tester collaboration (pre-authentication)';
COMMENT ON COLUMN testers.name IS 'Display name of the tester (required)';
COMMENT ON COLUMN testers.email IS 'Email address (optional, unique) - prepares for future OAuth';
COMMENT ON COLUMN testers.color IS 'UI color for color-coding this tester in the interface (default: Bonfire orange)';

-- ============================================
-- Verification Query
-- ============================================
-- Run this to verify the table was created successfully:
-- SELECT table_name, column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'testers'
-- ORDER BY ordinal_position;

-- ============================================
-- Migration Complete
-- ============================================
