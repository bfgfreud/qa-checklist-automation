import { supabase } from '../db/supabase'
import {
  Module,
  ModuleWithTestCases,
  TestCase,
  ModuleRow,
  TestCaseRow
} from '../models/Module'
import {
  CreateModuleInput,
  UpdateModuleInput,
  CreateTestCaseInput,
  UpdateTestCaseInput,
  ReorderModulesInput,
  ReorderTestCasesInput
} from '../validations/module.schema'

// ============================================
// Module CRUD Operations
// ============================================

export const moduleService = {
  /**
   * Get all modules with their test cases
   */
  async getAllModules(): Promise<{ success: boolean; data?: ModuleWithTestCases[]; error?: string }> {
    try {
      const { data: modules, error: modulesError } = await supabase
        .from('base_modules')
        .select('id, name, description, thumbnail_url, thumbnail_file_name, order_index, tags, created_by, created_at, updated_at')
        .order('order_index', { ascending: true })

      if (modulesError) {
        console.error('Error fetching modules:', modulesError)
        return { success: false, error: 'Failed to fetch modules' }
      }

      const { data: testcases, error: testcasesError } = await supabase
        .from('base_testcases')
        .select('*')
        .order('order_index', { ascending: true })

      if (testcasesError) {
        console.error('Error fetching test cases:', testcasesError)
        return { success: false, error: 'Failed to fetch test cases' }
      }

      // Group test cases by module_id
      const testcasesByModule = (testcases || []).reduce((acc, tc) => {
        if (!acc[tc.module_id]) {
          acc[tc.module_id] = []
        }
        acc[tc.module_id].push(tc as TestCase)
        return acc
      }, {} as Record<string, TestCase[]>)

      // Combine modules with their test cases and transform tags
      const modulesWithTestCases: ModuleWithTestCases[] = (modules || []).map(module => {
        // Parse tags from JSONB if it's a string, otherwise use as-is
        let parsedTags: string[] = [];
        if (typeof module.tags === 'string') {
          try {
            parsedTags = JSON.parse(module.tags);
          } catch (e) {
            console.error('Error parsing tags for module:', module.id, e);
            parsedTags = [];
          }
        } else if (Array.isArray(module.tags)) {
          parsedTags = module.tags;
        }

        return {
          ...module as Module,
          tags: parsedTags,
          testcases: testcasesByModule[module.id] || []
        };
      })

      return { success: true, data: modulesWithTestCases }
    } catch (error) {
      console.error('Unexpected error in getAllModules:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Get a single module by ID with its test cases
   */
  async getModuleById(id: string): Promise<{ success: boolean; data?: ModuleWithTestCases; error?: string }> {
    try {
      const { data: module, error: moduleError } = await supabase
        .from('base_modules')
        .select('id, name, description, thumbnail_url, thumbnail_file_name, order_index, tags, created_by, created_at, updated_at')
        .eq('id', id)
        .single()

      if (moduleError || !module) {
        console.error('Error fetching module:', moduleError)
        return { success: false, error: 'Module not found' }
      }

      const { data: testcases, error: testcasesError } = await supabase
        .from('base_testcases')
        .select('*')
        .eq('module_id', id)
        .order('order_index', { ascending: true })

      if (testcasesError) {
        console.error('Error fetching test cases:', testcasesError)
        return { success: false, error: 'Failed to fetch test cases' }
      }

      // Parse tags from JSONB if it's a string, otherwise use as-is
      let parsedTags: string[] = [];
      if (typeof module.tags === 'string') {
        try {
          parsedTags = JSON.parse(module.tags);
        } catch (e) {
          console.error('Error parsing tags for module:', module.id, e);
          parsedTags = [];
        }
      } else if (Array.isArray(module.tags)) {
        parsedTags = module.tags;
      }

      const moduleWithTestCases: ModuleWithTestCases = {
        ...module as Module,
        tags: parsedTags,
        testcases: (testcases || []) as TestCase[]
      }

      return { success: true, data: moduleWithTestCases }
    } catch (error) {
      console.error('Unexpected error in getModuleById:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Create a new module
   */
  async createModule(input: CreateModuleInput): Promise<{ success: boolean; data?: Module; error?: string }> {
    try {
      // Get the next order_index
      const { data: maxOrderData } = await supabase
        .from('base_modules')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1)
        .single()

      const nextOrderIndex = maxOrderData ? maxOrderData.order_index + 1 : 0

      const { data, error } = await supabase
        .from('base_modules')
        .insert([{
          name: input.name,
          description: input.description || null,
          thumbnail_url: input.thumbnail_url || null,
          thumbnail_file_name: input.thumbnail_file_name || null,
          order_index: input.order_index ?? nextOrderIndex,
          tags: JSON.stringify(input.tags || []),
          created_by: input.createdBy || null
        }])
        .select('id, name, description, thumbnail_url, thumbnail_file_name, order_index, tags, created_by, created_at, updated_at')
        .single()

      if (error) {
        console.error('Error creating module:', error)
        if (error.code === '23505') { // Unique constraint violation
          return { success: false, error: 'A module with this name already exists' }
        }
        return { success: false, error: 'Failed to create module' }
      }

      // Transform tags from JSONB to string array
      const moduleData: Module = {
        ...data,
        tags: Array.isArray(data.tags) ? data.tags : []
      }

      return { success: true, data: moduleData }
    } catch (error) {
      console.error('Unexpected error in createModule:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Update a module
   */
  async updateModule(id: string, input: UpdateModuleInput): Promise<{ success: boolean; data?: Module; error?: string }> {
    try {
      const updateData: Partial<Record<string, any>> = {}
      if (input.name !== undefined) updateData.name = input.name
      if (input.description !== undefined) updateData.description = input.description
      if (input.thumbnail_url !== undefined) updateData.thumbnail_url = input.thumbnail_url
      if (input.thumbnail_file_name !== undefined) updateData.thumbnail_file_name = input.thumbnail_file_name
      if (input.order_index !== undefined) updateData.order_index = input.order_index
      if (input.tags !== undefined) updateData.tags = JSON.stringify(input.tags)

      const { data, error } = await supabase
        .from('base_modules')
        .update(updateData)
        .eq('id', id)
        .select('id, name, description, thumbnail_url, thumbnail_file_name, order_index, tags, created_by, created_at, updated_at')
        .single()

      if (error || !data) {
        console.error('Error updating module:', error)
        if (error?.code === '23505') { // Unique constraint violation
          return { success: false, error: 'A module with this name already exists' }
        }
        return { success: false, error: 'Module not found or failed to update' }
      }

      // Transform tags from JSONB to string array
      const moduleData: Module = {
        ...data,
        tags: Array.isArray(data.tags) ? data.tags : []
      }

      return { success: true, data: moduleData }
    } catch (error) {
      console.error('Unexpected error in updateModule:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Delete a module (cascades to test cases)
   */
  async deleteModule(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('base_modules')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting module:', error)
        return { success: false, error: 'Failed to delete module' }
      }

      return { success: true }
    } catch (error) {
      console.error('Unexpected error in deleteModule:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Reorder modules
   */
  async reorderModules(input: ReorderModulesInput): Promise<{ success: boolean; error?: string }> {
    try {
      // Update each module's order_index
      const updates = input.modules.map(module =>
        supabase
          .from('base_modules')
          .update({ order_index: module.order_index })
          .eq('id', module.id)
      )

      const results = await Promise.all(updates)

      const hasError = results.some(result => result.error)
      if (hasError) {
        console.error('Error reordering modules')
        return { success: false, error: 'Failed to reorder modules' }
      }

      return { success: true }
    } catch (error) {
      console.error('Unexpected error in reorderModules:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  // ============================================
  // Test Case CRUD Operations
  // ============================================

  /**
   * Get all test cases for a module
   */
  async getTestCases(moduleId: string): Promise<{ success: boolean; data?: TestCase[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('base_testcases')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_index', { ascending: true })

      if (error) {
        console.error('Error fetching test cases:', error)
        return { success: false, error: 'Failed to fetch test cases' }
      }

      return { success: true, data: (data || []) as TestCase[] }
    } catch (error) {
      console.error('Unexpected error in getTestCases:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Get a single test case by ID
   */
  async getTestCaseById(id: string): Promise<{ success: boolean; data?: TestCase; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('base_testcases')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        console.error('Error fetching test case:', error)
        return { success: false, error: 'Test case not found' }
      }

      return { success: true, data: data as TestCase }
    } catch (error) {
      console.error('Unexpected error in getTestCaseById:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Create a new test case
   */
  async createTestCase(input: CreateTestCaseInput): Promise<{ success: boolean; data?: TestCase; error?: string }> {
    try {
      // Verify module exists
      const { data: module } = await supabase
        .from('base_modules')
        .select('id')
        .eq('id', input.module_id)
        .single()

      if (!module) {
        return { success: false, error: 'Module not found' }
      }

      // Get the next order_index for this module
      const { data: maxOrderData } = await supabase
        .from('base_testcases')
        .select('order_index')
        .eq('module_id', input.module_id)
        .order('order_index', { ascending: false })
        .limit(1)
        .single()

      const nextOrderIndex = maxOrderData ? maxOrderData.order_index + 1 : 0

      const { data, error } = await supabase
        .from('base_testcases')
        .insert([{
          module_id: input.module_id,
          title: input.title,
          description: input.description || null,
          priority: input.priority || 'Medium',
          order_index: input.order_index ?? nextOrderIndex,
          image_url: input.image_url || null
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating test case:', error)
        return { success: false, error: 'Failed to create test case' }
      }

      return { success: true, data: data as TestCase }
    } catch (error) {
      console.error('Unexpected error in createTestCase:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Update a test case
   */
  async updateTestCase(id: string, input: UpdateTestCaseInput): Promise<{ success: boolean; data?: TestCase; error?: string }> {
    try {
      const updateData: Partial<TestCaseRow> = {}
      if (input.title !== undefined) updateData.title = input.title
      if (input.description !== undefined) updateData.description = input.description
      if (input.priority !== undefined) updateData.priority = input.priority
      if (input.order_index !== undefined) updateData.order_index = input.order_index
      if (input.image_url !== undefined) updateData.image_url = input.image_url

      const { data, error } = await supabase
        .from('base_testcases')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error || !data) {
        console.error('Error updating test case:', error)
        return { success: false, error: 'Test case not found or failed to update' }
      }

      return { success: true, data: data as TestCase }
    } catch (error) {
      console.error('Unexpected error in updateTestCase:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Delete a test case
   */
  async deleteTestCase(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('base_testcases')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting test case:', error)
        return { success: false, error: 'Failed to delete test case' }
      }

      return { success: true }
    } catch (error) {
      console.error('Unexpected error in deleteTestCase:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Reorder test cases within a module
   */
  async reorderTestCases(input: ReorderTestCasesInput): Promise<{ success: boolean; error?: string }> {
    try {
      // Update each test case's order_index
      const updates = input.testcases.map(testcase =>
        supabase
          .from('base_testcases')
          .update({ order_index: testcase.order_index })
          .eq('id', testcase.id)
      )

      const results = await Promise.all(updates)

      const hasError = results.some(result => result.error)
      if (hasError) {
        console.error('Error reordering test cases')
        return { success: false, error: 'Failed to reorder test cases' }
      }

      return { success: true }
    } catch (error) {
      console.error('Unexpected error in reorderTestCases:', error)
      return { success: false, error: 'Internal server error' }
    }
  }
}
