import { supabase } from '../db/supabase'
import { Project, ProjectRow } from '../models/Project'
import { CreateProjectInput, UpdateProjectInput } from '../validations/project.schema'

// ============================================
// Project CRUD Operations
// ============================================

export const projectService = {
  /**
   * Get all projects
   */
  async getAllProjects(): Promise<{ success: boolean; data?: Project[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('test_projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching projects:', error)
        return { success: false, error: 'Failed to fetch projects' }
      }

      return { success: true, data: (data || []) as Project[] }
    } catch (error) {
      console.error('Unexpected error in getAllProjects:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Get a single project by ID
   */
  async getProjectById(id: string): Promise<{ success: boolean; data?: Project; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('test_projects')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        console.error('Error fetching project:', error)
        return { success: false, error: 'Project not found' }
      }

      return { success: true, data: data as Project }
    } catch (error) {
      console.error('Unexpected error in getProjectById:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Create a new project
   */
  async createProject(input: CreateProjectInput): Promise<{ success: boolean; data?: Project; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('test_projects')
        .insert([{
          name: input.name,
          description: input.description || null,
          version: input.version || null,
          platform: input.platform || null,
          status: input.status || 'Draft',
          priority: input.priority || 'Medium',
          due_date: input.dueDate || null,
          created_by: input.createdBy || null
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating project:', error)
        if (error.code === '23505') { // Unique constraint violation
          return { success: false, error: 'A project with this name already exists' }
        }
        return { success: false, error: 'Failed to create project' }
      }

      return { success: true, data: data as Project }
    } catch (error) {
      console.error('Unexpected error in createProject:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Update a project
   */
  async updateProject(id: string, input: UpdateProjectInput): Promise<{ success: boolean; data?: Project; error?: string }> {
    try {
      const updateData: Partial<ProjectRow> = {}
      if (input.name !== undefined) updateData.name = input.name
      if (input.description !== undefined) updateData.description = input.description
      if (input.version !== undefined) updateData.version = input.version
      if (input.platform !== undefined) updateData.platform = input.platform
      if (input.status !== undefined) updateData.status = input.status
      if (input.priority !== undefined) updateData.priority = input.priority
      if (input.dueDate !== undefined) updateData.due_date = input.dueDate

      const { data, error } = await supabase
        .from('test_projects')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error || !data) {
        console.error('Error updating project:', error)
        if (error?.code === '23505') { // Unique constraint violation
          return { success: false, error: 'A project with this name already exists' }
        }
        return { success: false, error: 'Project not found or failed to update' }
      }

      return { success: true, data: data as Project }
    } catch (error) {
      console.error('Unexpected error in updateProject:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Delete a project (cascades to related checklists)
   */
  async deleteProject(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('test_projects')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting project:', error)
        return { success: false, error: 'Failed to delete project' }
      }

      return { success: true }
    } catch (error) {
      console.error('Unexpected error in deleteProject:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Calculate and update project status based on checklist progress
   * Status logic:
   * - Draft: 0% progress (no test results)
   * - In Progress: 1-99% progress (some tests completed, not all passed)
   * - Completed: 100% progress with all tests passed
   */
  async updateProjectStatus(projectId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get all test results for this project via project_checklist_modules
      const { data: modules, error: modulesError } = await supabase
        .from('project_checklist_modules')
        .select('id')
        .eq('project_id', projectId)

      if (modulesError) {
        console.error('Error fetching modules:', modulesError)
        return { success: false, error: 'Failed to fetch modules' }
      }

      if (!modules || modules.length === 0) {
        // No modules yet, set to Draft
        await supabase
          .from('test_projects')
          .update({ status: 'Draft' })
          .eq('id', projectId)
        return { success: true }
      }

      // Get all test results for these modules
      const moduleIds = modules.map(m => m.id)
      const { data: testResults, error: resultsError } = await supabase
        .from('checklist_test_results')
        .select('status')
        .in('project_checklist_module_id', moduleIds)

      if (resultsError) {
        console.error('Error fetching test results:', resultsError)
        return { success: false, error: 'Failed to fetch test results' }
      }

      const total = testResults?.length || 0

      if (total === 0) {
        // No test results, set to Draft
        await supabase
          .from('test_projects')
          .update({ status: 'Draft' })
          .eq('id', projectId)
        return { success: true }
      }

      // Count test results
      const pending = testResults.filter((t) => t.status === 'Pending').length
      const passed = testResults.filter((t) => t.status === 'Pass').length
      const failed = testResults.filter((t) => t.status === 'Fail').length
      const skipped = testResults.filter((t) => t.status === 'Skipped').length
      const completed = passed + failed + skipped

      let newStatus: string

      if (completed === 0) {
        // No progress yet
        newStatus = 'Draft'
      } else if (completed === total && failed === 0 && skipped === 0) {
        // All tests passed (100% pass rate)
        newStatus = 'Completed'
      } else {
        // Some progress, but not all passed
        newStatus = 'In Progress'
      }

      // Update project status
      await supabase
        .from('test_projects')
        .update({ status: newStatus })
        .eq('id', projectId)

      return { success: true }
    } catch (error) {
      console.error('Error updating project status:', error)
      return { success: false, error: 'Failed to update project status' }
    }
  }
}
