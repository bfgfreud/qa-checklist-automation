import { z } from 'zod'

// ============================================
// Project Schemas
// ============================================

export const createProjectSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(255, 'Project name must be less than 255 characters')
    .trim(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .optional()
    .nullable(),
  version: z.string()
    .max(50, 'Version must be less than 50 characters')
    .trim()
    .optional()
    .nullable(),
  platform: z.string()
    .max(100, 'Platform must be less than 100 characters')
    .trim()
    .optional()
    .nullable(),
  status: z.enum(['Draft', 'In Progress', 'Completed']).default('Draft'),
  priority: z.enum(['High', 'Medium', 'Low']).default('Medium'),
  dueDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  createdBy: z.string()
    .trim()
    .optional()
    .nullable()
})

export const updateProjectSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(255, 'Project name must be less than 255 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .optional()
    .nullable(),
  version: z.string()
    .max(50, 'Version must be less than 50 characters')
    .trim()
    .optional()
    .nullable(),
  platform: z.string()
    .max(100, 'Platform must be less than 100 characters')
    .trim()
    .optional()
    .nullable(),
  status: z.enum(['Draft', 'In Progress', 'Completed']).optional(),
  priority: z.enum(['High', 'Medium', 'Low']).optional(),
  dueDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
    .optional()
    .nullable()
})

// ============================================
// Type Exports
// ============================================

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
