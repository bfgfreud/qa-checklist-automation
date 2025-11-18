import { z } from 'zod'

// ============================================
// Checklist Module Schemas
// ============================================

/**
 * Schema for adding a module to a project's checklist
 */
export const addModuleToChecklistSchema = z.object({
  projectId: z.string()
    .uuid('Invalid project ID'),
  moduleId: z.string()
    .uuid('Invalid module ID'),
  instanceLabel: z.string()
    .trim()
    .max(100, 'Instance label must be less than 100 characters')
    .optional()
    .nullable()
})

/**
 * Schema for reordering checklist modules
 */
export const reorderChecklistModulesSchema = z.object({
  modules: z.array(z.object({
    id: z.string().uuid('Invalid checklist module ID'),
    orderIndex: z.number()
      .int('Order index must be an integer')
      .min(0, 'Order index must be non-negative')
  })).min(1, 'At least one module is required for reordering')
})

// ============================================
// Test Result Schemas
// ============================================

/**
 * Schema for updating a test result
 */
export const updateTestResultSchema = z.object({
  status: z.enum(['Pending', 'Pass', 'Fail', 'Skipped'], {
    message: 'Status must be Pending, Pass, Fail, or Skipped'
  }),
  notes: z.string()
    .trim()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .nullable(),
  testedBy: z.string()
    .trim()
    .max(255, 'Tested by must be less than 255 characters')
    .optional()
    .nullable()
})

/**
 * Schema for bulk updating test results
 */
export const bulkUpdateTestResultsSchema = z.object({
  resultIds: z.array(z.string().uuid('Invalid result ID'))
    .min(1, 'At least one result ID is required'),
  status: z.enum(['Pending', 'Pass', 'Fail', 'Skipped']),
  notes: z.string()
    .trim()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .nullable(),
  testedBy: z.string()
    .trim()
    .max(255, 'Tested by must be less than 255 characters')
    .optional()
    .nullable()
})

/**
 * Schema for filtering test results
 */
export const filterTestResultsSchema = z.object({
  status: z.enum(['Pending', 'Pass', 'Fail', 'Skipped'])
    .optional(),
  moduleId: z.string()
    .uuid('Invalid module ID')
    .optional(),
  priority: z.enum(['High', 'Medium', 'Low'])
    .optional()
})

// ============================================
// Type Exports
// ============================================

export type AddModuleToChecklistInput = z.infer<typeof addModuleToChecklistSchema>
export type ReorderChecklistModulesInput = z.infer<typeof reorderChecklistModulesSchema>
export type UpdateTestResultInput = z.infer<typeof updateTestResultSchema>
export type BulkUpdateTestResultsInput = z.infer<typeof bulkUpdateTestResultsSchema>
export type FilterTestResultsInput = z.infer<typeof filterTestResultsSchema>
