-- ============================================
-- QA Checklist Automation - Simple Database Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- Create base_modules table
CREATE TABLE IF NOT EXISTS base_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create base_testcases table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_testcases_module_id ON base_testcases(module_id);
CREATE INDEX IF NOT EXISTS idx_modules_order ON base_modules(order_index);
CREATE INDEX IF NOT EXISTS idx_testcases_order ON base_testcases(module_id, order_index);

-- Insert sample modules
INSERT INTO base_modules (name, description, order_index) VALUES
  ('Sign In', 'Authentication and sign-in flows', 0),
  ('Payment Flow', 'Payment processing and checkout', 1),
  ('User Profile', 'User profile management', 2),
  ('Shopping Cart', 'Cart functionality', 3)
ON CONFLICT (name) DO NOTHING;

-- Insert sample test cases for Sign In
INSERT INTO base_testcases (module_id, title, description, priority, order_index)
SELECT
  (SELECT id FROM base_modules WHERE name = 'Sign In'),
  'Google Sign In',
  'Sign in using Google works with no error',
  'High',
  0
WHERE NOT EXISTS (SELECT 1 FROM base_testcases WHERE title = 'Google Sign In')

UNION ALL

SELECT
  (SELECT id FROM base_modules WHERE name = 'Sign In'),
  'Apple Sign In',
  'Sign in using Apple works with no error',
  'High',
  1
WHERE NOT EXISTS (SELECT 1 FROM base_testcases WHERE title = 'Apple Sign In')

UNION ALL

SELECT
  (SELECT id FROM base_modules WHERE name = 'Sign In'),
  'Email Sign In',
  'Sign in using email and password',
  'Medium',
  2
WHERE NOT EXISTS (SELECT 1 FROM base_testcases WHERE title = 'Email Sign In')

UNION ALL

SELECT
  (SELECT id FROM base_modules WHERE name = 'Sign In'),
  'Password Reset',
  'Reset password functionality works correctly',
  'Low',
  3
WHERE NOT EXISTS (SELECT 1 FROM base_testcases WHERE title = 'Password Reset');

-- Insert sample test cases for Payment Flow
INSERT INTO base_testcases (module_id, title, description, priority, order_index)
SELECT
  (SELECT id FROM base_modules WHERE name = 'Payment Flow'),
  'Credit Card Payment',
  'Process payment with credit card successfully',
  'High',
  0
WHERE NOT EXISTS (SELECT 1 FROM base_testcases WHERE title = 'Credit Card Payment')

UNION ALL

SELECT
  (SELECT id FROM base_modules WHERE name = 'Payment Flow'),
  'PayPal Integration',
  'PayPal payment flow works end-to-end',
  'High',
  1
WHERE NOT EXISTS (SELECT 1 FROM base_testcases WHERE title = 'PayPal Integration')

UNION ALL

SELECT
  (SELECT id FROM base_modules WHERE name = 'Payment Flow'),
  'Refund Process',
  'Refund functionality works correctly',
  'Medium',
  2
WHERE NOT EXISTS (SELECT 1 FROM base_testcases WHERE title = 'Refund Process')

UNION ALL

SELECT
  (SELECT id FROM base_modules WHERE name = 'Payment Flow'),
  'Failed Payment Handling',
  'System handles failed payments gracefully',
  'High',
  3
WHERE NOT EXISTS (SELECT 1 FROM base_testcases WHERE title = 'Failed Payment Handling');

-- Insert sample test cases for User Profile
INSERT INTO base_testcases (module_id, title, description, priority, order_index)
SELECT
  (SELECT id FROM base_modules WHERE name = 'User Profile'),
  'Update Profile Picture',
  'User can upload and update profile picture',
  'Medium',
  0
WHERE NOT EXISTS (SELECT 1 FROM base_testcases WHERE title = 'Update Profile Picture')

UNION ALL

SELECT
  (SELECT id FROM base_modules WHERE name = 'User Profile'),
  'Change Email',
  'User can change email with verification',
  'High',
  1
WHERE NOT EXISTS (SELECT 1 FROM base_testcases WHERE title = 'Change Email')

UNION ALL

SELECT
  (SELECT id FROM base_modules WHERE name = 'User Profile'),
  'Update Personal Info',
  'User can update name, bio, etc.',
  'Low',
  2
WHERE NOT EXISTS (SELECT 1 FROM base_testcases WHERE title = 'Update Personal Info')

UNION ALL

SELECT
  (SELECT id FROM base_modules WHERE name = 'User Profile'),
  'Delete Account',
  'User can permanently delete account',
  'Medium',
  3
WHERE NOT EXISTS (SELECT 1 FROM base_testcases WHERE title = 'Delete Account');

-- Insert sample test cases for Shopping Cart
INSERT INTO base_testcases (module_id, title, description, priority, order_index)
SELECT
  (SELECT id FROM base_modules WHERE name = 'Shopping Cart'),
  'Add to Cart',
  'User can add items to cart',
  'High',
  0
WHERE NOT EXISTS (SELECT 1 FROM base_testcases WHERE title = 'Add to Cart')

UNION ALL

SELECT
  (SELECT id FROM base_modules WHERE name = 'Shopping Cart'),
  'Remove from Cart',
  'User can remove items from cart',
  'High',
  1
WHERE NOT EXISTS (SELECT 1 FROM base_testcases WHERE title = 'Remove from Cart')

UNION ALL

SELECT
  (SELECT id FROM base_modules WHERE name = 'Shopping Cart'),
  'Update Quantity',
  'User can change item quantity',
  'Medium',
  2
WHERE NOT EXISTS (SELECT 1 FROM base_testcases WHERE title = 'Update Quantity')

UNION ALL

SELECT
  (SELECT id FROM base_modules WHERE name = 'Shopping Cart'),
  'Apply Coupon Code',
  'Discount codes work correctly',
  'Medium',
  3
WHERE NOT EXISTS (SELECT 1 FROM base_testcases WHERE title = 'Apply Coupon Code')

UNION ALL

SELECT
  (SELECT id FROM base_modules WHERE name = 'Shopping Cart'),
  'Cart Persistence',
  'Cart persists across sessions',
  'Low',
  4
WHERE NOT EXISTS (SELECT 1 FROM base_testcases WHERE title = 'Cart Persistence')

UNION ALL

SELECT
  (SELECT id FROM base_modules WHERE name = 'Shopping Cart'),
  'Clear Cart',
  'User can clear entire cart',
  'Low',
  5
WHERE NOT EXISTS (SELECT 1 FROM base_testcases WHERE title = 'Clear Cart');

-- Verification query (run this after to check)
SELECT
  (SELECT COUNT(*) FROM base_modules) as module_count,
  (SELECT COUNT(*) FROM base_testcases) as testcase_count;
