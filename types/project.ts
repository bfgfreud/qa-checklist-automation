/**
 * Shared type definitions for projects
 */

export type ProjectStatus = 'Draft' | 'In Progress' | 'Completed';
export type Priority = 'High' | 'Medium' | 'Low';

export interface Project {
  id: string;
  name: string;
  description?: string;
  version?: string;
  platform?: string;
  status: ProjectStatus;
  priority: Priority;
  dueDate?: string; // ISO date string
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  deleted_at?: string | null; // Archive timestamp - null means active
  deleted_by?: string | null; // Who archived the project
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  version?: string;
  platform?: string;
  status?: ProjectStatus;
  priority?: Priority;
  dueDate?: string;
  createdBy?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  version?: string;
  platform?: string;
  status?: ProjectStatus;
  priority?: Priority;
  dueDate?: string;
}
