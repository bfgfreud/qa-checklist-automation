-- Migration: Create base_modules and base_testcases tables
-- Created: 2025-01-14
-- Description: Initial schema for module management system

-- ============================================
-- Table 1: base_modules
-- ============================================
CREATE TABLE IF NOT EXISTS base_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint on name to prevent duplicates
ALTER TABLE base_modules ADD CONSTRAINT unique_module_name UNIQUE (name);

-- ============================================
-- Table 2: base_testcases
-- ============================================
CREATE TABLE IF NOT EXISTS base_testcases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID REFERENCES base_modules(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('High', 'Medium', 'Low')) DEFAULT 'Medium',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_testcases_module_id ON base_testcases(module_id);
CREATE INDEX IF NOT EXISTS idx_modules_order ON base_modules(order_index);
CREATE INDEX IF NOT EXISTS idx_testcases_order ON base_testcases(module_id, order_index);

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_base_modules_updated_at BEFORE UPDATE ON base_modules
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_base_testcases_updated_at BEFORE UPDATE ON base_testcases
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Comments for Documentation
-- ============================================
COMMENT ON TABLE base_modules IS 'Master library of test modules';
COMMENT ON TABLE base_testcases IS 'Test cases under each module';
COMMENT ON COLUMN base_modules.order_index IS 'Display order for modules';
COMMENT ON COLUMN base_testcases.order_index IS 'Display order within module';
COMMENT ON COLUMN base_testcases.priority IS 'Test case priority: High, Medium, or Low';
