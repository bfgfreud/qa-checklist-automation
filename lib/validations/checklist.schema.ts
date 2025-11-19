import { z } from 'zod'

// ============================================
// Checklist Module Schemas
// ============================================

/**
 * Schema for adding a module to a project's checklist
 * Supports both library modules (moduleId) and custom modules (moduleName)
 */
export const addModuleToChecklistSchema = z.object({
  projectId: z.string()
    .uuid('Invalid project ID'),

  // Library module (optional - either this or custom module fields)
  moduleId: z.string()
    .uuid('Invalid module ID')
    .optional()
    .nullable(),

  // Custom module fields (optional - either this or library module)
  isCustom: z.boolean()
    .default(false),
  moduleName: z.string()
    .trim()
    .min(1, 'Module name is required for custom modules')
    .max(200, 'Module name must be less than 200 characters')
    .optional()
    .nullable(),
  moduleDescription: z.string()
    .trim()
    .max(1000, 'Module description must be less than 1000 characters')
    .optional()
    .nullable(),

  // Common fields
  instanceLabel: z.string()
    .trim()
    .max(100, 'Instance label must be less than 100 characters')
    .optional()
    .nullable(),
  tags: z.array(z.string().trim().max(50))
    .max(10, 'Maximum 10 tags allowed')
    .optional()
    .nullable()
}).refine(
  (data) => {
    // Must provide either moduleId (library) or moduleName (custom)
    if (data.isCustom) {
      return data.moduleName && data.moduleName.trim().length > 0
    } else {
      return data.moduleId != null
    }
  },
  {
    message: 'Must provide moduleId for library modules or moduleName for custom modules'
  }
)

/**
 * Schema for adding a custom testcase to a checklist module
 */
export const addCustomTestcaseSchema = z.object({
  projectChecklistModuleId: z.string()
    .uuid('Invalid checklist module ID'),
  testerIds: z.array(z.string().uuid('Invalid tester ID'))
    .default([]), // Allow empty array - backend will use Legacy Tester fallback
  testcaseTitle: z.string()
    .trim()
    .min(1, 'Testcase title is required')
    .max(200, 'Testcase title must be less than 200 characters'),
  testcaseDescription: z.string()
    .trim()
    .max(1000, 'Testcase description must be less than 1000 characters')
    .optional()
    .nullable(),
  testcasePriority: z.enum(['High', 'Medium', 'Low'], {
    message: 'Priority must be High, Medium, or Low'
  }).default('Medium')
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
  testerId: z.string()
    .uuid('Invalid tester ID')
    .optional(), // Optional for backward compatibility with legacy endpoints
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
 * Schema for updating a test result with multi-tester validation
 */
export const updateTestResultWithTesterSchema = z.object({
  testerId: z.string()
    .uuid('Invalid tester ID'), // Required for multi-tester mode
  status: z.enum(['Pending', 'Pass', 'Fail', 'Skipped'], {
    message: 'Status must be Pending, Pass, Fail, or Skipped'
  }),
  notes: z.string()
    .trim()
    .max(2000, 'Notes must be less than 2000 characters')
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
export type AddCustomTestcaseInput = z.infer<typeof addCustomTestcaseSchema>
export type ReorderChecklistModulesInput = z.infer<typeof reorderChecklistModulesSchema>
export type UpdateTestResultInput = z.infer<typeof updateTestResultSchema>
export type UpdateTestResultWithTesterInput = z.infer<typeof updateTestResultWithTesterSchema>
export type BulkUpdateTestResultsInput = z.infer<typeof bulkUpdateTestResultsSchema>
export type FilterTestResultsInput = z.infer<typeof filterTestResultsSchema>
