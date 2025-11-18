-- Seed Data for QA Checklist Automation
-- Created: 2025-01-14
-- Description: Sample modules and test cases for development and testing

-- Clear existing data (for reseeding)
TRUNCATE TABLE base_testcases CASCADE;
TRUNCATE TABLE base_modules CASCADE;

-- ============================================
-- Insert Sample Modules
-- ============================================
INSERT INTO base_modules (id, name, description, order_index) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Sign In', 'Authentication and sign-in flows', 0),
  ('22222222-2222-2222-2222-222222222222', 'Payment Flow', 'Payment processing and checkout', 1),
  ('33333333-3333-3333-3333-333333333333', 'User Profile', 'User profile management', 2),
  ('44444444-4444-4444-4444-444444444444', 'Shopping Cart', 'Cart functionality', 3);

-- ============================================
-- Insert Sample Test Cases for Sign In Module
-- ============================================
INSERT INTO base_testcases (module_id, title, description, priority, order_index) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Google Sign In', 'Sign in using Google works with no error', 'High', 0),
  ('11111111-1111-1111-1111-111111111111', 'Apple Sign In', 'Sign in using Apple works with no error', 'High', 1),
  ('11111111-1111-1111-1111-111111111111', 'Email Sign In', 'Sign in using email and password', 'Medium', 2),
  ('11111111-1111-1111-1111-111111111111', 'Password Reset', 'Reset password functionality works correctly', 'Low', 3);

-- ============================================
-- Insert Sample Test Cases for Payment Flow
-- ============================================
INSERT INTO base_testcases (module_id, title, description, priority, order_index) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Credit Card Payment', 'Process payment with credit card successfully', 'High', 0),
  ('22222222-2222-2222-2222-222222222222', 'PayPal Integration', 'PayPal payment flow works end-to-end', 'High', 1),
  ('22222222-2222-2222-2222-222222222222', 'Payment Validation', 'Validate credit card details before processing', 'Medium', 2),
  ('22222222-2222-2222-2222-222222222222', 'Payment Receipt', 'Generate and email payment receipt', 'Low', 3);

-- ============================================
-- Insert Sample Test Cases for User Profile
-- ============================================
INSERT INTO base_testcases (module_id, title, description, priority, order_index) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Update Profile Info', 'Update user name, email, and phone number', 'High', 0),
  ('33333333-3333-3333-3333-333333333333', 'Upload Profile Picture', 'Upload and display profile picture', 'Medium', 1),
  ('33333333-3333-3333-3333-333333333333', 'Change Password', 'Change account password with validation', 'High', 2),
  ('33333333-3333-3333-3333-333333333333', 'Delete Account', 'User can delete their account', 'Low', 3);

-- ============================================
-- Insert Sample Test Cases for Shopping Cart
-- ============================================
INSERT INTO base_testcases (module_id, title, description, priority, order_index) VALUES
  ('44444444-4444-4444-4444-444444444444', 'Add Items to Cart', 'Add products to shopping cart', 'High', 0),
  ('44444444-4444-4444-4444-444444444444', 'Update Cart Quantity', 'Modify item quantities in cart', 'High', 1),
  ('44444444-4444-4444-4444-444444444444', 'Remove Items from Cart', 'Remove products from cart', 'High', 2),
  ('44444444-4444-4444-4444-444444444444', 'Apply Discount Code', 'Apply and validate promotional codes', 'Medium', 3),
  ('44444444-4444-4444-4444-444444444444', 'Calculate Total', 'Calculate cart total with taxes and discounts', 'High', 4),
  ('44444444-4444-4444-4444-444444444444', 'Save Cart for Later', 'Persist cart items for future sessions', 'Low', 5);

-- ============================================
-- Verification Query
-- ============================================
-- Run this to verify the data was inserted correctly:
-- SELECT
--   m.name as module_name,
--   COUNT(t.id) as testcase_count
-- FROM base_modules m
-- LEFT JOIN base_testcases t ON m.id = t.module_id
-- GROUP BY m.id, m.name
-- ORDER BY m.order_index;
