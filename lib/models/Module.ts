// ============================================
// Module Model
// ============================================

export interface Module {
  id: string
  name: string
  description: string | null
  order_index: number
  tags: string[]
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ModuleWithTestCases extends Module {
  testcases: TestCase[]
}

// ============================================
// Test Case Model
// ============================================

export type TestCasePriority = 'High' | 'Medium' | 'Low'

export interface TestCase {
  id: string
  module_id: string
  title: string
  description: string | null
  priority: TestCasePriority
  order_index: number
  image_url: string | null  // Documentation/reference image URL
  created_at: string
  updated_at: string
}

export interface TestCaseWithModule extends TestCase {
  module: Module
}

// ============================================
// Database Row Types (from Supabase)
// ============================================

export interface ModuleRow {
  id: string
  name: string
  description: string | null
  order_index: number
  tags: string[]
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface TestCaseRow {
  id: string
  module_id: string
  title: string
  description: string | null
  priority: string
  order_index: number
  image_url: string | null
  created_at: string
  updated_at: string
}
