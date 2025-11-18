-- ============================================
-- QA Checklist Automation - Database Setup
-- Run this script in your Supabase SQL Editor
-- Project: ndpdxlmbxkewhxafrbmi
-- ============================================

-- ============================================
-- STEP 1: Create Tables
-- ============================================

-- Table 1: base_modules
CREATE TABLE IF NOT EXISTS base_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint on name to prevent duplicates
ALTER TABLE base_modules ADD CONSTRAINT IF NOT EXISTS unique_module_name UNIQUE (name);

-- Table 2: base_testcases
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
-- STEP 2: Create Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_testcases_module_id ON base_testcases(module_id);
CREATE INDEX IF NOT EXISTS idx_modules_order ON base_modules(order_index);
CREATE INDEX IF NOT EXISTS idx_testcases_order ON base_testcases(module_id, order_index);

-- ============================================
-- STEP 3: Create Triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for base_modules
DROP TRIGGER IF EXISTS update_base_modules_updated_at ON base_modules;
CREATE TRIGGER update_base_modules_updated_at
BEFORE UPDATE ON base_modules
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for base_testcases
DROP TRIGGER IF EXISTS update_base_testcases_updated_at ON base_testcases;
CREATE TRIGGER update_base_testcases_updated_at
BEFORE UPDATE ON base_testcases
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 4: Add Comments
-- ============================================

COMMENT ON TABLE base_modules IS 'Master library of test modules';
COMMENT ON TABLE base_testcases IS 'Test cases under each module';
COMMENT ON COLUMN base_modules.order_index IS 'Display order for modules';
COMMENT ON COLUMN base_testcases.order_index IS 'Display order within module';
COMMENT ON COLUMN base_testcases.priority IS 'Test case priority: High, Medium, or Low';

-- ============================================
-- STEP 5: Insert Sample Data
-- ============================================

-- Clear existing data (for reseeding)
TRUNCATE TABLE base_testcases CASCADE;
TRUNCATE TABLE base_modules CASCADE;

-- Insert Sample Modules
INSERT INTO base_modules (id, name, description, order_index) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Sign In', 'Authentication and sign-in flows', 0),
  ('22222222-2222-2222-2222-222222222222', 'Payment Flow', 'Payment processing and checkout', 1),
  ('33333333-3333-3333-3333-333333333333', 'User Profile', 'User profile management', 2),
  ('44444444-4444-4444-4444-444444444444', 'Shopping Cart', 'Cart functionality', 3);

-- Insert Sample Test Cases for Sign In Module
INSERT INTO base_testcases (module_id, title, description, priority, order_index) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Google Sign In', 'Sign in using Google works with no error', 'High', 0),
  ('11111111-1111-1111-1111-111111111111', 'Apple Sign In', 'Sign in using Apple works with no error', 'High', 1),
  ('11111111-1111-1111-1111-111111111111', 'Email Sign In', 'Sign in using email and password', 'Medium', 2),
  ('11111111-1111-1111-1111-111111111111', 'Password Reset', 'Reset password functionality works correctly', 'Low', 3);

-- Insert Sample Test Cases for Payment Flow
INSERT INTO base_testcases (module_id, title, description, priority, order_index) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Credit Card Payment', 'Process payment with credit card successfully', 'High', 0),
  ('22222222-2222-2222-2222-222222222222', 'PayPal Integration', 'PayPal payment flow works end-to-end', 'High', 1),
  ('22222222-2222-2222-2222-222222222222', 'Payment Validation', 'Validate credit card details before processing', 'Medium', 2),
  ('22222222-2222-2222-2222-222222222222', 'Payment Receipt', 'Generate and email payment receipt', 'Low', 3);

-- Insert Sample Test Cases for User Profile
INSERT INTO base_testcases (module_id, title, description, priority, order_index) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Update Profile Info', 'Update user name, email, and phone number', 'High', 0),
  ('33333333-3333-3333-3333-333333333333', 'Upload Profile Picture', 'Upload and display profile picture', 'Medium', 1),
  ('33333333-3333-3333-3333-333333333333', 'Change Password', 'Change account password with validation', 'High', 2),
  ('33333333-3333-3333-3333-333333333333', 'Delete Account', 'User can delete their account', 'Low', 3);

-- Insert Sample Test Cases for Shopping Cart
INSERT INTO base_testcases (module_id, title, description, priority, order_index) VALUES
  ('44444444-4444-4444-4444-444444444444', 'Add Items to Cart', 'Add products to shopping cart', 'High', 0),
  ('44444444-4444-4444-4444-444444444444', 'Update Cart Quantity', 'Modify item quantities in cart', 'High', 1),
  ('44444444-4444-4444-4444-444444444444', 'Remove Items from Cart', 'Remove products from cart', 'High', 2),
  ('44444444-4444-4444-4444-444444444444', 'Apply Discount Code', 'Apply and validate promotional codes', 'Medium', 3),
  ('44444444-4444-4444-4444-444444444444', 'Calculate Total', 'Calculate cart total with taxes and discounts', 'High', 4),
  ('44444444-4444-4444-4444-444444444444', 'Save Cart for Later', 'Persist cart items for future sessions', 'Low', 5);

-- ============================================
-- STEP 6: Verify Data
-- ============================================

-- Count modules and test cases
SELECT
  'SUMMARY' as report_type,
  (SELECT COUNT(*) FROM base_modules) as total_modules,
  (SELECT COUNT(*) FROM base_testcases) as total_testcases;

-- Module breakdown
SELECT
  m.name as module_name,
  COUNT(t.id) as testcase_count,
  m.order_index
FROM base_modules m
LEFT JOIN base_testcases t ON m.id = t.module_id
GROUP BY m.id, m.name, m.order_index
ORDER BY m.order_index;

-- ============================================
-- Setup Complete!
-- ============================================
-- You should see:
-- - 4 modules (Sign In, Payment Flow, User Profile, Shopping Cart)
-- - 18 total test cases across all modules
-- ============================================
