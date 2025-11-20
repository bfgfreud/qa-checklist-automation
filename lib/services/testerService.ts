import { supabase } from '../db/supabase'
import { Tester, ProjectTester } from '@/types/tester'

// ============================================
// Tester Service
// ============================================

export const testerService = {
  /**
   * Get all testers
   */
  async getAllTesters(): Promise<{
    success: boolean
    data?: Tester[]
    error?: string
  }> {
    try {
      const { data, error } = await supabase
        .from('testers')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching testers:', error)
        return { success: false, error: 'Failed to fetch testers' }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Unexpected error in getAllTesters:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Get tester by ID
   */
  async getTesterById(id: string): Promise<{
    success: boolean
    data?: Tester
    error?: string
  }> {
    try {
      const { data, error } = await supabase
        .from('testers')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        return { success: false, error: 'Tester not found' }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Unexpected error in getTesterById:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Create a new tester
   */
  async createTester(input: {
    name: string
    email?: string
    color?: string
  }): Promise<{
    success: boolean
    data?: Tester
    error?: string
  }> {
    try {
      // Check if email already exists (if provided)
      if (input.email) {
        const { data: existing } = await supabase
          .from('testers')
          .select('id')
          .eq('email', input.email)
          .single()

        if (existing) {
          return { success: false, error: 'Email already exists' }
        }
      }

      const insertData: any = {
        name: input.name,
        email: input.email || null,
        color: input.color || '#FF6B35' // Default Bonfire orange
      }

      const { data, error } = await supabase
        .from('testers')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('Error creating tester:', error)
        return { success: false, error: 'Failed to create tester' }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Unexpected error in createTester:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Update a tester
   */
  async updateTester(
    id: string,
    input: Partial<Omit<Tester, 'id' | 'created_at'>>
  ): Promise<{
    success: boolean
    data?: Tester
    error?: string
  }> {
    try {
      // Check if tester exists
      const { data: existing } = await supabase
        .from('testers')
        .select('id')
        .eq('id', id)
        .single()

      if (!existing) {
        return { success: false, error: 'Tester not found' }
      }

      // Check email uniqueness if updating email
      if (input.email) {
        const { data: emailExists } = await supabase
          .from('testers')
          .select('id')
          .eq('email', input.email)
          .neq('id', id)
          .single()

        if (emailExists) {
          return { success: false, error: 'Email already exists' }
        }
      }

      const updateData: any = {}
      if (input.name !== undefined) updateData.name = input.name
      if (input.email !== undefined) updateData.email = input.email
      if (input.color !== undefined) updateData.color = input.color

      const { data, error } = await supabase
        .from('testers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating tester:', error)
        return { success: false, error: 'Failed to update tester' }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Unexpected error in updateTester:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Delete a tester
   * Note: This will cascade delete all test results for this tester
   */
  async deleteTester(id: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      // Check if tester exists
      const { data: existing } = await supabase
        .from('testers')
        .select('id')
        .eq('id', id)
        .single()

      if (!existing) {
        return { success: false, error: 'Tester not found' }
      }

      // Check if tester has test results
      const { data: testResults, error: countError } = await supabase
        .from('checklist_test_results')
        .select('id', { count: 'exact', head: true })
        .eq('tester_id', id)

      if (countError) {
        console.error('Error checking test results:', countError)
      }

      // Delete the tester (will cascade to project_testers and checklist_test_results)
      const { error } = await supabase
        .from('testers')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting tester:', error)
        return { success: false, error: 'Failed to delete tester' }
      }

      return { success: true }
    } catch (error) {
      console.error('Unexpected error in deleteTester:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Get all testers assigned to a project
   */
  async getProjectTesters(projectId: string): Promise<{
    success: boolean
    data?: Tester[]
    error?: string
  }> {
    try {
      const { data, error } = await supabase
        .from('project_testers')
        .select(`
          tester_id,
          assigned_at,
          testers (
            id,
            name,
            email,
            color,
            created_at
          )
        `)
        .eq('project_id', projectId)
        .order('assigned_at', { ascending: true })

      if (error) {
        console.error('Error fetching project testers:', error)
        return { success: false, error: 'Failed to fetch project testers' }
      }

      // Extract testers from the join result
      const testers = (data || [])
        .map(item => {
          const tester = Array.isArray(item.testers) ? item.testers[0] : item.testers
          return tester as Tester
        })
        .filter(t => t !== null && t !== undefined)

      return { success: true, data: testers }
    } catch (error) {
      console.error('Unexpected error in getProjectTesters:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Assign a tester to a project
   */
  async assignTesterToProject(
    projectId: string,
    testerId: string
  ): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      // Verify project exists
      const { data: project } = await supabase
        .from('test_projects')
        .select('id')
        .eq('id', projectId)
        .single()

      if (!project) {
        return { success: false, error: 'Project not found' }
      }

      // Verify tester exists
      const { data: tester } = await supabase
        .from('testers')
        .select('id')
        .eq('id', testerId)
        .single()

      if (!tester) {
        return { success: false, error: 'Tester not found' }
      }

      // Check if already assigned
      const { data: existing } = await supabase
        .from('project_testers')
        .select('project_id')
        .eq('project_id', projectId)
        .eq('tester_id', testerId)
        .single()

      if (existing) {
        return { success: false, error: 'Tester already assigned to this project' }
      }

      // Assign tester to project
      const { error } = await supabase
        .from('project_testers')
        .insert([{
          project_id: projectId,
          tester_id: testerId
        }])

      if (error) {
        console.error('Error assigning tester to project:', error)
        return { success: false, error: 'Failed to assign tester to project' }
      }

      // CRITICAL: Create test results for all existing modules/testcases
      // This ensures the newly assigned tester has test result rows to work with
      const { data: existingModules, error: modulesError } = await supabase
        .from('project_checklist_modules')
        .select(`
          id,
          checklist_test_results (
            testcase_title,
            testcase_description,
            testcase_id,
            display_order
          )
        `)
        .eq('project_id', projectId)

      if (!modulesError && existingModules && existingModules.length > 0) {
        console.log(`[assignTesterToProject] Creating test results for ${existingModules.length} existing modules`)

        const testResultInserts = []

        for (const mod of existingModules) {
          // Get unique testcases from existing results (to avoid duplicates)
          const uniqueTestcases = new Map()

          if (mod.checklist_test_results && Array.isArray(mod.checklist_test_results)) {
            for (const result of mod.checklist_test_results) {
              const key = result.testcase_id || result.testcase_title
              if (!uniqueTestcases.has(key)) {
                uniqueTestcases.set(key, result)
              }
            }
          }

          // Create test result for each unique testcase
          for (const [, testcase] of uniqueTestcases) {
            testResultInserts.push({
              project_checklist_module_id: mod.id,
              tester_id: testerId,
              testcase_id: testcase.testcase_id || null,
              testcase_title: testcase.testcase_title,
              testcase_description: testcase.testcase_description || null,
              display_order: testcase.display_order || 0, // Preserve display order
              status: 'Pending' as const,
              notes: null,
              tested_at: null
            })
          }
        }

        if (testResultInserts.length > 0) {
          const { error: insertError } = await supabase
            .from('checklist_test_results')
            .insert(testResultInserts)

          if (insertError) {
            console.error('[assignTesterToProject] Error creating test results:', insertError)
            // Don't fail the assignment if test result creation fails
            // The user can still work, they just won't have results pre-populated
          } else {
            console.log(`[assignTesterToProject] Created ${testResultInserts.length} test results for new tester`)
          }
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Unexpected error in assignTesterToProject:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Unassign a tester from a project
   */
  async unassignTesterFromProject(
    projectId: string,
    testerId: string
  ): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const { error } = await supabase
        .from('project_testers')
        .delete()
        .eq('project_id', projectId)
        .eq('tester_id', testerId)

      if (error) {
        console.error('Error unassigning tester from project:', error)
        return { success: false, error: 'Failed to unassign tester from project' }
      }

      return { success: true }
    } catch (error) {
      console.error('Unexpected error in unassignTesterFromProject:', error)
      return { success: false, error: 'Internal server error' }
    }
  }
}
