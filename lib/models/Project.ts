// ============================================
// Project Model
// ============================================

export type ProjectStatus = 'Draft' | 'In Progress' | 'Completed'
export type Priority = 'High' | 'Medium' | 'Low'

export interface Project {
  id: string
  name: string
  description: string | null
  version: string | null
  platform: string | null
  status: ProjectStatus
  priority: Priority
  due_date: string | null // ISO date string
  created_by: string | null
  created_at: string
  updated_at: string
}

// ============================================
// Database Row Types (from Supabase)
// ============================================

export interface ProjectRow {
  id: string
  name: string
  description: string | null
  version: string | null
  platform: string | null
  status: string
  priority: string
  due_date: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}
