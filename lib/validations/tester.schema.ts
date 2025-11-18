import { z } from 'zod'

/**
 * Validation schema for creating a tester
 */
export const CreateTesterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color (e.g., #FF6B35)').optional()
})

export type CreateTesterInput = z.infer<typeof CreateTesterSchema>

/**
 * Validation schema for updating a tester
 */
export const UpdateTesterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color').optional()
})

export type UpdateTesterInput = z.infer<typeof UpdateTesterSchema>

/**
 * Validation schema for assigning a tester to a project
 */
export const AssignTesterSchema = z.object({
  testerId: z.string().uuid('Invalid tester ID format')
})

export type AssignTesterInput = z.infer<typeof AssignTesterSchema>
