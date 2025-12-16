import { z } from 'zod'

// ============================================
// Module Schemas
// ============================================

export const createModuleSchema = z.object({
  name: z.string()
    .min(1, 'Module name is required')
    .max(255, 'Module name must be less than 255 characters')
    .trim(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .optional()
    .nullable(),
  thumbnail_url: z.string()
    .url('Invalid thumbnail URL')
    .optional()
    .nullable(),
  thumbnail_file_name: z.string()
    .max(255, 'Thumbnail file name must be less than 255 characters')
    .optional()
    .nullable(),
  order_index: z.number()
    .int()
    .min(0)
    .optional()
    .default(0),
  tags: z.array(z.string().trim().min(1))
    .optional()
    .default([]),
  createdBy: z.string()
    .trim()
    .optional()
})

export const updateModuleSchema = z.object({
  name: z.string()
    .min(1, 'Module name is required')
    .max(255, 'Module name must be less than 255 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .optional()
    .nullable(),
  thumbnail_url: z.string()
    .url('Invalid thumbnail URL')
    .optional()
    .nullable(),
  thumbnail_file_name: z.string()
    .max(255, 'Thumbnail file name must be less than 255 characters')
    .optional()
    .nullable(),
  order_index: z.number()
    .int()
    .min(0)
    .optional(),
  tags: z.array(z.string().trim().min(1))
    .optional()
})

export const reorderModulesSchema = z.object({
  modules: z.array(z.object({
    id: z.string().uuid('Invalid module ID'),
    order_index: z.number().int().min(0)
  })).min(1, 'At least one module is required')
})

// ============================================
// Test Case Schemas
// ============================================

export const createTestCaseSchema = z.object({
  module_id: z.string().uuid('Invalid module ID'),
  title: z.string()
    .min(1, 'Test case title is required')
    .max(255, 'Title must be less than 255 characters')
    .trim(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .optional()
    .nullable(),
  priority: z.enum(['High', 'Medium', 'Low']).default('Medium'),
  order_index: z.number()
    .int()
    .min(0)
    .optional()
    .default(0),
  image_url: z.string()
    .url('Invalid image URL')
    .optional()
    .nullable()
})

export const updateTestCaseSchema = z.object({
  title: z.string()
    .min(1, 'Test case title is required')
    .max(255, 'Title must be less than 255 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .optional()
    .nullable(),
  priority: z.enum(['High', 'Medium', 'Low']).optional(),
  order_index: z.number()
    .int()
    .min(0)
    .optional(),
  image_url: z.string()
    .url('Invalid image URL')
    .optional()
    .nullable()
})

export const reorderTestCasesSchema = z.object({
  testcases: z.array(z.object({
    id: z.string().uuid('Invalid test case ID'),
    order_index: z.number().int().min(0)
  })).min(1, 'At least one test case is required')
})

// ============================================
// Type Exports
// ============================================

export type CreateModuleInput = z.infer<typeof createModuleSchema>
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>
export type ReorderModulesInput = z.infer<typeof reorderModulesSchema>

export type CreateTestCaseInput = z.infer<typeof createTestCaseSchema>
export type UpdateTestCaseInput = z.infer<typeof updateTestCaseSchema>
export type ReorderTestCasesInput = z.infer<typeof reorderTestCasesSchema>
