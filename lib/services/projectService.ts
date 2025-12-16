import { supabase } from '../db/supabase'
import { Project, ProjectRow } from '../models/Project'
import { CreateProjectInput, UpdateProjectInput } from '../validations/project.schema'

// ============================================
// Project CRUD Operations
// ============================================

export const projectService = {
  /**
   * Get all active (non-archived) projects
   */
  async getAllProjects(): Promise<{ success: boolean; data?: Project[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('test_projects')
        .select('*')
        .is('deleted_at', null)
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
   * Get all archived projects
   */
  async getArchivedProjects(): Promise<{ success: boolean; data?: Project[]; error?: string }> {
    try {
      // Use filter with 'not.is.null' to get records where deleted_at is NOT null
      const { data, error } = await supabase
        .from('test_projects')
        .select('*')
        .filter('deleted_at', 'not.is', null)
        .order('deleted_at', { ascending: false })

      if (error) {
        console.error('Error fetching archived projects:', error)
        return { success: false, error: 'Failed to fetch archived projects' }
      }

      return { success: true, data: (data || []) as Project[] }
    } catch (error) {
      console.error('Unexpected error in getArchivedProjects:', error)
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
   * Archive a project (soft delete)
   */
  async archiveProject(id: string, deletedBy?: string): Promise<{ success: boolean; data?: Project; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('test_projects')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: deletedBy || null
        })
        .eq('id', id)
        .is('deleted_at', null) // Only archive if not already archived
        .select()
        .single()

      if (error) {
        console.error('Error archiving project:', error)
        return { success: false, error: 'Failed to archive project' }
      }

      return { success: true, data: data as Project }
    } catch (error) {
      console.error('Unexpected error in archiveProject:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Restore an archived project
   */
  async restoreProject(id: string): Promise<{ success: boolean; data?: Project; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('test_projects')
        .update({
          deleted_at: null,
          deleted_by: null
        })
        .eq('id', id)
        .filter('deleted_at', 'not.is', null) // Only restore if archived
        .select()
        .single()

      if (error) {
        console.error('Error restoring project:', error)
        return { success: false, error: 'Failed to restore project' }
      }

      return { success: true, data: data as Project }
    } catch (error) {
      console.error('Unexpected error in restoreProject:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Permanently delete an archived project (requires project to be archived first)
   */
  async permanentDeleteProject(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First verify the project is archived
      const { data: project, error: checkError } = await supabase
        .from('test_projects')
        .select('deleted_at')
        .eq('id', id)
        .single()

      if (checkError || !project) {
        return { success: false, error: 'Project not found' }
      }

      if (!project.deleted_at) {
        return { success: false, error: 'Project must be archived before permanent deletion' }
      }

      // Proceed with permanent deletion (cascades to related data)
      const { error } = await supabase
        .from('test_projects')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error permanently deleting project:', error)
        return { success: false, error: 'Failed to permanently delete project' }
      }

      return { success: true }
    } catch (error) {
      console.error('Unexpected error in permanentDeleteProject:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Delete a project - now archives instead of hard delete
   * @deprecated Use archiveProject instead
   */
  async deleteProject(id: string, deletedBy?: string): Promise<{ success: boolean; error?: string }> {
    // Redirect to archive for backward compatibility
    const result = await this.archiveProject(id, deletedBy)
    return { success: result.success, error: result.error }
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
