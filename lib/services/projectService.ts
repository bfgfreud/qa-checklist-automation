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
  }
}
