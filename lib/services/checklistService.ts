import { supabase } from '../db/supabase'
import {
  ProjectChecklistModule,
  ChecklistTestResult,
  ChecklistModuleWithResults,
  ProjectChecklist,
  ModuleProgressStats,
  TestStatus,
  ProjectChecklistWithTesters,
  ChecklistModuleWithMultiTesterResults,
  TestCaseWithResults,
  TestResultWithTester
} from '@/types/checklist'
import {
  AddModuleToChecklistInput,
  AddCustomTestcaseInput,
  ReorderChecklistModulesInput,
  UpdateTestResultInput,
  BulkUpdateTestResultsInput
} from '../validations/checklist.schema'
import { testerService } from './testerService'
import { attachmentService } from './attachmentService'

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate progress statistics for a module
 */
function calculateModuleStats(testResults: ChecklistTestResult[]): {
  totalTests: number
  pendingTests: number
  passedTests: number
  failedTests: number
  skippedTests: number
  progress: number
} {
  const totalTests = testResults.length
  const pendingTests = testResults.filter(r => r.status === 'Pending').length
  const passedTests = testResults.filter(r => r.status === 'Pass').length
  const failedTests = testResults.filter(r => r.status === 'Fail').length
  const skippedTests = testResults.filter(r => r.status === 'Skipped').length

  // Progress = (non-pending tests / total tests) * 100
  const completedTests = totalTests - pendingTests
  const progress = totalTests > 0 ? Math.round((completedTests / totalTests) * 100) : 0

  return {
    totalTests,
    pendingTests,
    passedTests,
    failedTests,
    skippedTests,
    progress
  }
}

/**
 * Calculate the weakest (most severe) status from an array of statuses
 * Priority: Fail > Skipped > Pass > Pending
 */
export function getWeakestStatus(statuses: TestStatus[]): TestStatus {
  if (statuses.length === 0) return 'Pending'

  const priority: Record<TestStatus, number> = {
    'Fail': 4,
    'Skipped': 3,
    'Pass': 2,
    'Pending': 1
  }

  return statuses.reduce((weakest, current) =>
    priority[current] > priority[weakest] ? current : weakest
  , 'Pending')
}

// ============================================
// Checklist Service
// ============================================

export const checklistService = {
  /**
   * Get complete checklist for a project with all modules and test results
   */
  async getProjectChecklist(projectId: string): Promise<{
    success: boolean
    data?: ProjectChecklist
    error?: string
  }> {
    try {
      // Verify project exists
      const { data: project, error: projectError } = await supabase
        .from('test_projects')
        .select('id, name')
        .eq('id', projectId)
        .single()

      if (projectError || !project) {
        return { success: false, error: 'Project not found' }
      }

      // Get all checklist modules for this project (HYBRID model - read copied data)
      const { data: checklistModules, error: modulesError } = await supabase
        .from('project_checklist_modules')
        .select(`
          id,
          project_id,
          module_id,
          module_name,
          module_description,
          is_custom,
          tags,
          instance_label,
          instance_number,
          order_index,
          created_at,
          updated_at
        `)
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })

      if (modulesError) {
        console.error('Error fetching checklist modules:', modulesError)
        return { success: false, error: 'Failed to fetch checklist modules' }
      }

      // Get all test results for this project (HYBRID model - read copied data)
      const { data: testResults, error: resultsError } = await supabase
        .from('checklist_test_results')
        .select(`
          id,
          project_checklist_module_id,
          testcase_id,
          testcase_title,
          testcase_description,
          testcase_priority,
          testcase_image_url,
          is_custom,
          status,
          notes,
          tested_by,
          tested_at,
          created_at,
          updated_at,
          display_order,
          base_testcases (
            image_url
          )
        `)
        .in('project_checklist_module_id', (checklistModules || []).map(m => m.id))
        .order('display_order', { ascending: true })

      if (resultsError) {
        console.error('Error fetching test results:', resultsError)
        return { success: false, error: 'Failed to fetch test results' }
      }

      // Group test results by checklist module
      const resultsByModule = (testResults || []).reduce((acc, result) => {
        const moduleId = result.project_checklist_module_id
        if (!acc[moduleId]) {
          acc[moduleId] = []
        }

        // Get image_url: for custom testcases use testcase_image_url, for library use base_testcases.image_url
        const baseTestcase = Array.isArray(result.base_testcases)
          ? result.base_testcases[0]
          : result.base_testcases
        const imageUrl = result.is_custom
          ? result.testcase_image_url  // Custom testcase: use stored image URL
          : baseTestcase?.image_url     // Library testcase: use joined image URL

        acc[moduleId].push({
          id: result.id,
          projectChecklistModuleId: result.project_checklist_module_id,
          testcaseId: result.testcase_id || undefined, // Optional reference
          testcaseTitle: result.testcase_title, // Use copied data
          testcaseDescription: result.testcase_description || undefined, // Use copied data
          testcasePriority: (result.testcase_priority || 'Medium') as 'High' | 'Medium' | 'Low', // Use copied data
          testcaseImageUrl: imageUrl || undefined,
          status: result.status,
          notes: result.notes || undefined,
          testedBy: result.tested_by || undefined,
          testedAt: result.tested_at || undefined,
          createdAt: result.created_at,
          updatedAt: result.updated_at
        } as ChecklistTestResult)

        return acc
      }, {} as Record<string, ChecklistTestResult[]>)

      // Build modules with results and stats
      const modulesWithResults: ChecklistModuleWithResults[] = (checklistModules || []).map(module => {
        const testResults = resultsByModule[module.id] || []
        const stats = calculateModuleStats(testResults)

        return {
          id: module.id,
          projectId: module.project_id,
          moduleId: module.module_id || undefined, // Optional reference
          moduleName: module.module_name, // Use copied data
          moduleDescription: module.module_description || undefined, // Use copied data
          instanceLabel: module.instance_label || undefined,
          instanceNumber: module.instance_number,
          orderIndex: module.order_index,
          createdAt: module.created_at,
          updatedAt: module.updated_at,
          testResults,
          ...stats
        }
      })

      // Calculate overall statistics
      const totalModules = modulesWithResults.length
      const allTestResults = modulesWithResults.flatMap(m => m.testResults)
      const overallStats = calculateModuleStats(allTestResults)

      const checklist: ProjectChecklist = {
        projectId: project.id,
        projectName: project.name,
        modules: modulesWithResults,
        totalModules,
        ...overallStats,
        overallProgress: overallStats.progress
      }

      return { success: true, data: checklist }
    } catch (error) {
      console.error('Unexpected error in getProjectChecklist:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Add a module instance to project checklist (HYBRID model)
   * Supports both library modules (copied with reference) and custom modules (no reference)
   * Auto-calculates instance_number and creates test result entries
   */
  async addModuleToChecklist(input: AddModuleToChecklistInput): Promise<{
    success: boolean
    data?: ChecklistModuleWithResults
    error?: string
  }> {
    try {
      // Verify project exists
      const { data: project } = await supabase
        .from('test_projects')
        .select('id')
        .eq('id', input.projectId)
        .single()

      if (!project) {
        return { success: false, error: 'Project not found' }
      }

      let moduleName: string
      let moduleDescription: string | undefined
      let libraryModuleId: string | null = null
      let testcases: Array<{id: string, title: string, description: string | null, priority: string}> = []

      // HYBRID MODEL: Handle library module (copy data + keep reference)
      if (!input.isCustom && input.moduleId) {
        // Fetch module data from library
        const { data: module, error: moduleError } = await supabase
          .from('base_modules')
          .select('id, name, description')
          .eq('id', input.moduleId)
          .single()

        if (moduleError || !module) {
          return { success: false, error: 'Module not found in library' }
        }

        moduleName = module.name
        moduleDescription = module.description || undefined
        libraryModuleId = module.id

        // Fetch testcases from library (to be copied)
        const { data: libraryTestcases, error: testcasesError } = await supabase
          .from('base_testcases')
          .select('id, title, description, priority, image_url')
          .eq('module_id', input.moduleId)
          .order('order_index', { ascending: true })

        if (testcasesError) {
          console.error('Error fetching test cases:', testcasesError)
          return { success: false, error: 'Failed to fetch module test cases' }
        }

        testcases = libraryTestcases || []
      }
      // HYBRID MODEL: Handle custom module (no library reference)
      else if (input.isCustom && input.moduleName) {
        moduleName = input.moduleName
        moduleDescription = input.moduleDescription || undefined
        libraryModuleId = null
        testcases = [] // Custom modules start with 0 testcases
      } else {
        return { success: false, error: 'Invalid input: must provide either moduleId or moduleName' }
      }

      // Calculate instance_number
      // For library modules: count existing instances of the same library module
      // For custom modules: count all custom modules (they don't have moduleId)
      let instanceNumber = 1

      if (!input.isCustom && libraryModuleId) {
        const { data: existingInstances } = await supabase
          .from('project_checklist_modules')
          .select('instance_number')
          .eq('project_id', input.projectId)
          .eq('module_id', libraryModuleId)
          .order('instance_number', { ascending: false })
          .limit(1)

        instanceNumber = existingInstances && existingInstances.length > 0
          ? existingInstances[0].instance_number + 1
          : 1
      } else {
        // For custom modules, just use 1 (or could implement custom numbering)
        instanceNumber = 1
      }

      // Get next order_index for this project
      const { data: maxOrderData } = await supabase
        .from('project_checklist_modules')
        .select('order_index')
        .eq('project_id', input.projectId)
        .order('order_index', { ascending: false })
        .limit(1)

      const nextOrderIndex = maxOrderData && maxOrderData.length > 0
        ? maxOrderData[0].order_index + 1
        : 0

      // Create checklist module entry with COPIED data (HYBRID model)
      const { data: checklistModule, error: moduleError } = await supabase
        .from('project_checklist_modules')
        .insert([{
          project_id: input.projectId,
          module_id: libraryModuleId, // Optional reference (null for custom)
          module_name: moduleName, // COPIED data (always populated)
          module_description: moduleDescription || null, // COPIED data
          is_custom: input.isCustom || false, // Custom flag
          tags: input.tags || null, // Optional tags
          instance_label: input.instanceLabel || null,
          instance_number: instanceNumber,
          order_index: nextOrderIndex
        }])
        .select()
        .single()

      if (moduleError) {
        console.error('Error creating checklist module:', moduleError)
        return { success: false, error: 'Failed to add module to checklist' }
      }

      // Get all assigned testers for this project
      const testersResult = await testerService.getProjectTesters(input.projectId)

      if (!testersResult.success) {
        console.error('Error fetching project testers:', testersResult.error)
        // Rollback checklist module creation
        await supabase
          .from('project_checklist_modules')
          .delete()
          .eq('id', checklistModule.id)
        return { success: false, error: 'Failed to fetch project testers' }
      }

      const assignedTesters = testersResult.data || []

      // If no testers assigned, use Legacy Tester as fallback
      if (assignedTesters.length === 0) {
        console.log('[WARN] No testers assigned to project, using Legacy Tester as fallback')

        const { data: legacyTester } = await supabase
          .from('testers')
          .select('*')
          .eq('email', 'legacy@system')
          .single()

        if (legacyTester) {
          assignedTesters.push(legacyTester)
        }
      }

      // Create test result entries with COPIED testcase data (HYBRID model)
      // For library modules: copy all testcases from library
      // For custom modules: no testcases initially
      if (testcases && testcases.length > 0 && assignedTesters.length > 0) {
        const testResultInserts = []

        for (const tester of assignedTesters) {
          for (let i = 0; i < testcases.length; i++) {
            const tc = testcases[i]
            testResultInserts.push({
              project_checklist_module_id: checklistModule.id,
              testcase_id: tc.id, // Optional reference (for library testcases)
              testcase_title: tc.title, // COPIED data (always populated)
              testcase_description: tc.description || null, // COPIED data
              testcase_priority: tc.priority || 'Medium', // COPIED data
              is_custom: false, // Library testcases
              tester_id: tester.id,
              status: 'Pending' as const,
              display_order: i // Explicit ordering to prevent jumping
            })
          }
        }

        console.log(`[DEBUG] Creating ${testResultInserts.length} test results (${assignedTesters.length} testers × ${testcases.length} test cases)`)

        const { error: resultsError } = await supabase
          .from('checklist_test_results')
          .insert(testResultInserts)

        if (resultsError) {
          console.error('Error creating test results:', resultsError)
          // Rollback checklist module creation
          await supabase
            .from('project_checklist_modules')
            .delete()
            .eq('id', checklistModule.id)
          return { success: false, error: 'Failed to create test results' }
        }
      }

      // Fetch the complete module with results (HYBRID model - read copied data)
      const { data: testResults } = await supabase
        .from('checklist_test_results')
        .select(`
          id,
          project_checklist_module_id,
          testcase_id,
          testcase_title,
          testcase_description,
          testcase_priority,
          testcase_image_url,
          is_custom,
          status,
          notes,
          tested_by,
          tested_at,
          created_at,
          updated_at,
          base_testcases (
            image_url
          )
        `)
        .eq('project_checklist_module_id', checklistModule.id)

      const mappedResults: ChecklistTestResult[] = (testResults || []).map(result => {
        const baseTestcase = Array.isArray(result.base_testcases)
          ? result.base_testcases[0]
          : result.base_testcases

        // Custom testcases use testcase_image_url, library testcases use base_testcases.image_url
        const imageUrl = result.is_custom
          ? result.testcase_image_url
          : baseTestcase?.image_url

        return {
          id: result.id,
          projectChecklistModuleId: result.project_checklist_module_id,
          testcaseId: result.testcase_id || undefined, // Optional reference
          testcaseTitle: result.testcase_title, // Use copied data
          testcaseDescription: result.testcase_description || undefined, // Use copied data
          testcasePriority: (result.testcase_priority || 'Medium') as 'High' | 'Medium' | 'Low', // Use copied data
          testcaseImageUrl: imageUrl || undefined, // Reference image
          isCustom: result.is_custom || false,
          status: result.status,
          notes: result.notes || undefined,
          testedBy: result.tested_by || undefined,
          testedAt: result.tested_at || undefined,
          createdAt: result.created_at,
          updatedAt: result.updated_at
        }
      })

      const stats = calculateModuleStats(mappedResults)

      const moduleWithResults: ChecklistModuleWithResults = {
        id: checklistModule.id,
        projectId: checklistModule.project_id,
        moduleId: checklistModule.module_id || undefined, // Optional reference
        moduleName: checklistModule.module_name, // Use copied data
        moduleDescription: checklistModule.module_description || undefined, // Use copied data
        instanceLabel: checklistModule.instance_label || undefined,
        instanceNumber: checklistModule.instance_number,
        orderIndex: checklistModule.order_index,
        createdAt: checklistModule.created_at,
        updatedAt: checklistModule.updated_at,
        testResults: mappedResults,
        ...stats
      }

      return { success: true, data: moduleWithResults }
    } catch (error) {
      console.error('Unexpected error in addModuleToChecklist:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Remove a module instance from checklist (cascades to test results)
   */
  async removeModuleFromChecklist(checklistModuleId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const { error } = await supabase
        .from('project_checklist_modules')
        .delete()
        .eq('id', checklistModuleId)

      if (error) {
        console.error('Error removing module from checklist:', error)
        return { success: false, error: 'Failed to remove module from checklist' }
      }

      return { success: true }
    } catch (error) {
      console.error('Unexpected error in removeModuleFromChecklist:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Add a custom testcase to a checklist module (HYBRID model)
   * Creates test results for all specified testers with copied testcase data (no library reference)
   */
  async addCustomTestcase(input: AddCustomTestcaseInput): Promise<{
    success: boolean
    data?: ChecklistTestResult[]
    error?: string
  }> {
    try {
      // Verify module exists
      const { data: module } = await supabase
        .from('project_checklist_modules')
        .select('id')
        .eq('id', input.projectChecklistModuleId)
        .single()

      if (!module) {
        return { success: false, error: 'Checklist module not found' }
      }

      // Handle empty testerIds - use Legacy Tester as fallback
      let testerIds = input.testerIds
      if (testerIds.length === 0) {
        console.log('[WARN] No testers provided for custom testcase, using Legacy Tester as fallback')

        const { data: legacyTester } = await supabase
          .from('testers')
          .select('*')
          .eq('email', 'legacy@system')
          .single()

        if (legacyTester) {
          testerIds = [legacyTester.id]
        } else {
          return { success: false, error: 'No testers available and Legacy Tester not found' }
        }
      }

      // Get next display_order for this module
      const { data: maxOrderData } = await supabase
        .from('checklist_test_results')
        .select('display_order')
        .eq('project_checklist_module_id', input.projectChecklistModuleId)
        .order('display_order', { ascending: false })
        .limit(1)

      const nextDisplayOrder = maxOrderData && maxOrderData.length > 0
        ? maxOrderData[0].display_order + 1
        : 0

      // Create test result entries for each tester with COPIED testcase data
      const testResultInserts = testerIds.map(testerId => ({
        project_checklist_module_id: input.projectChecklistModuleId,
        testcase_id: null, // Custom testcase - no library reference
        testcase_title: input.testcaseTitle, // COPIED data
        testcase_description: input.testcaseDescription || null, // COPIED data
        testcase_priority: input.testcasePriority || 'Medium', // COPIED data
        is_custom: true, // Custom testcase flag
        tester_id: testerId,
        status: 'Pending' as const,
        display_order: nextDisplayOrder // Explicit ordering to prevent jumping
      }))

      const { data: testResults, error: insertError } = await supabase
        .from('checklist_test_results')
        .insert(testResultInserts)
        .select()

      if (insertError) {
        console.error('Error creating custom testcase:', insertError)
        return { success: false, error: 'Failed to create custom testcase' }
      }

      // Map results to ChecklistTestResult type
      const mappedResults: ChecklistTestResult[] = (testResults || []).map(result => ({
        id: result.id,
        projectChecklistModuleId: result.project_checklist_module_id,
        testcaseId: '', // Custom testcases have no library reference
        testcaseTitle: result.testcase_title,
        testcaseDescription: result.testcase_description || undefined,
        testcasePriority: (result.testcase_priority || 'Medium') as 'High' | 'Medium' | 'Low',
        testcaseImageUrl: result.testcase_image_url || undefined, // Custom testcase image
        isCustom: true,
        status: result.status,
        notes: result.notes || undefined,
        testedBy: result.tested_by || undefined,
        testedAt: result.tested_at || undefined,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      }))

      console.log(`[DEBUG] Created ${testResults.length} custom test results for ${input.testerIds.length} testers`)

      return { success: true, data: mappedResults }
    } catch (error) {
      console.error('Unexpected error in addCustomTestcase:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Reorder checklist modules within a project
   */
  async reorderChecklistModules(
    projectId: string,
    input: ReorderChecklistModulesInput
  ): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      // Verify all modules belong to this project
      const { data: existingModules } = await supabase
        .from('project_checklist_modules')
        .select('id')
        .eq('project_id', projectId)
        .in('id', input.modules.map(m => m.id))

      if (!existingModules || existingModules.length !== input.modules.length) {
        return { success: false, error: 'Some modules do not belong to this project' }
      }

      // Update each module's order_index
      const updates = input.modules.map(module =>
        supabase
          .from('project_checklist_modules')
          .update({ order_index: module.orderIndex })
          .eq('id', module.id)
      )

      const results = await Promise.all(updates)

      const hasError = results.some(result => result.error)
      if (hasError) {
        console.error('Error reordering checklist modules')
        return { success: false, error: 'Failed to reorder checklist modules' }
      }

      return { success: true }
    } catch (error) {
      console.error('Unexpected error in reorderChecklistModules:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Reorder testcases within a checklist module
   * CRITICAL: Updates display_order for ALL testers' test results (multi-tester sync)
   * Supports both library testcases (testcaseId) and custom testcases (testcaseTitle)
   */
  async reorderChecklistTestcases(
    moduleId: string,
    input: { testcases: Array<{ testcaseId?: string | null; testcaseTitle?: string | null; displayOrder: number }> }
  ): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      // Verify module exists
      const { data: module } = await supabase
        .from('project_checklist_modules')
        .select('id')
        .eq('id', moduleId)
        .single()

      if (!module) {
        return { success: false, error: 'Checklist module not found' }
      }

      // Update display_order for each testcase
      // CRITICAL: Update ALL tester results for each testcase (not just one tester)
      const updates = input.testcases.map(tc => {
        let query = supabase
          .from('checklist_test_results')
          .update({ display_order: tc.displayOrder })
          .eq('project_checklist_module_id', moduleId)

        // For library testcases: match by testcase_id
        if (tc.testcaseId) {
          query = query.eq('testcase_id', tc.testcaseId)
        }
        // For custom testcases: match by testcase_title + is_custom flag
        else if (tc.testcaseTitle) {
          query = query.eq('testcase_title', tc.testcaseTitle).eq('is_custom', true)
        }

        return query
      })

      const results = await Promise.all(updates)

      const hasError = results.some(result => result.error)
      if (hasError) {
        console.error('Error reordering checklist testcases:', results.filter(r => r.error))
        return { success: false, error: 'Failed to reorder checklist testcases' }
      }

      console.log(`[reorderChecklistTestcases] Updated display_order for ${input.testcases.length} testcases in module ${moduleId}`)

      return { success: true }
    } catch (error) {
      console.error('Unexpected error in reorderChecklistTestcases:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Update a test result (status, notes, tested_by)
   */
  async updateTestResult(
    resultId: string,
    input: UpdateTestResultInput
  ): Promise<{
    success: boolean
    data?: ChecklistTestResult
    projectId?: string
    error?: string
  }> {
    try {
      const updateData: Record<string, any> = {
        status: input.status
      }

      if (input.notes !== undefined) updateData.notes = input.notes
      if (input.testedBy !== undefined) updateData.tested_by = input.testedBy

      const { data, error} = await supabase
        .from('checklist_test_results')
        .update(updateData)
        .eq('id', resultId)
        .select(`
          id,
          project_checklist_module_id,
          testcase_id,
          testcase_title,
          testcase_description,
          testcase_priority,
          testcase_image_url,
          is_custom,
          status,
          notes,
          tested_by,
          tested_at,
          created_at,
          updated_at,
          base_testcases (
            image_url
          ),
          project_checklist_modules!inner (
            project_id
          )
        `)
        .single()

      if (error || !data) {
        console.error('Error updating test result:', error)
        return { success: false, error: 'Test result not found or failed to update' }
      }

      const baseTestcase = Array.isArray(data.base_testcases)
        ? data.base_testcases[0]
        : data.base_testcases

      // Extract project ID from nested data
      const moduleData: any = Array.isArray(data.project_checklist_modules)
        ? data.project_checklist_modules[0]
        : data.project_checklist_modules

      const projectId = moduleData?.project_id

      // Custom testcases use testcase_image_url, library testcases use base_testcases.image_url
      const imageUrl = data.is_custom
        ? data.testcase_image_url
        : baseTestcase?.image_url

      const result: ChecklistTestResult = {
        id: data.id,
        projectChecklistModuleId: data.project_checklist_module_id,
        testcaseId: data.testcase_id,
        testcaseTitle: data.testcase_title, // Use copied data
        testcaseDescription: data.testcase_description || undefined, // Use copied data
        testcasePriority: (data.testcase_priority || 'Medium') as 'High' | 'Medium' | 'Low', // Use copied data
        testcaseImageUrl: imageUrl || undefined,
        isCustom: data.is_custom || false,
        status: data.status,
        notes: data.notes || undefined,
        testedBy: data.tested_by || undefined,
        testedAt: data.tested_at || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }

      return { success: true, data: result, projectId }
    } catch (error) {
      console.error('Unexpected error in updateTestResult:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Get progress statistics for a project
   */
  async getChecklistProgress(projectId: string): Promise<{
    success: boolean
    data?: {
      projectId: string
      totalModules: number
      totalTests: number
      pendingTests: number
      passedTests: number
      failedTests: number
      skippedTests: number
      overallProgress: number
      moduleStats: ModuleProgressStats[]
    }
    error?: string
  }> {
    try {
      // Get checklist with all data
      const checklistResult = await this.getProjectChecklist(projectId)

      if (!checklistResult.success || !checklistResult.data) {
        return { success: false, error: checklistResult.error || 'Failed to fetch checklist' }
      }

      const checklist = checklistResult.data

      // Build module stats
      const moduleStats: ModuleProgressStats[] = checklist.modules.map(module => ({
        moduleId: module.moduleId,
        moduleName: module.moduleName,
        instanceLabel: module.instanceLabel,
        totalTests: module.totalTests,
        pendingTests: module.pendingTests,
        passedTests: module.passedTests,
        failedTests: module.failedTests,
        skippedTests: module.skippedTests,
        progress: module.progress
      }))

      return {
        success: true,
        data: {
          projectId: checklist.projectId,
          totalModules: checklist.totalModules,
          totalTests: checklist.totalTests,
          pendingTests: checklist.pendingTests,
          passedTests: checklist.passedTests,
          failedTests: checklist.failedTests,
          skippedTests: checklist.skippedTests,
          overallProgress: checklist.overallProgress,
          moduleStats
        }
      }
    } catch (error) {
      console.error('Unexpected error in getChecklistProgress:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Get project checklist with multi-tester results structure
   * Returns data organized by: Module > Test Case > Tester Results
   */
  async getProjectChecklistWithTesters(projectId: string): Promise<{
    success: boolean
    data?: ProjectChecklistWithTesters
    error?: string
  }> {
    try {
      // Verify project exists
      const { data: project, error: projectError } = await supabase
        .from('test_projects')
        .select('id, name')
        .eq('id', projectId)
        .single()

      if (projectError || !project) {
        return { success: false, error: 'Project not found' }
      }

      // Get assigned testers
      const testersResult = await testerService.getProjectTesters(projectId)
      if (!testersResult.success) {
        return { success: false, error: testersResult.error || 'Failed to fetch testers' }
      }
      const assignedTesters = testersResult.data || []

      // Get all checklist modules for this project (include copied data for custom modules)
      const { data: checklistModules, error: modulesError } = await supabase
        .from('project_checklist_modules')
        .select(`
          id,
          project_id,
          module_id,
          module_name,
          module_description,
          is_custom,
          instance_label,
          instance_number,
          order_index,
          created_at,
          updated_at,
          base_modules (
            name,
            description,
            thumbnail_url
          )
        `)
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })

      if (modulesError) {
        console.error('Error fetching checklist modules:', modulesError)
        return { success: false, error: 'Failed to fetch checklist modules' }
      }

      // Get all test results with testers and testcases (include copied data for custom testcases)
      const { data: testResults, error: resultsError } = await supabase
        .from('checklist_test_results')
        .select(`
          id,
          project_checklist_module_id,
          testcase_id,
          testcase_title,
          testcase_description,
          testcase_priority,
          testcase_image_url,
          is_custom,
          tester_id,
          status,
          notes,
          tested_at,
          display_order,
          created_at,
          updated_at,
          base_testcases (
            id,
            title,
            description,
            priority,
            image_url
          ),
          testers (
            id,
            name,
            email,
            color,
            created_at
          )
        `)
        .in('project_checklist_module_id', (checklistModules || []).map(m => m.id))
        .order('display_order', { ascending: true })

      if (resultsError) {
        console.error('Error fetching test results:', resultsError)
        return { success: false, error: 'Failed to fetch test results' }
      }

      // Get all attachments for these test results
      const testResultIds = (testResults || []).map(r => r.id)
      const { data: attachments } = await supabase
        .from('test_case_attachments')
        .select('*')
        .in('test_result_id', testResultIds)

      // Group attachments by test result ID
      const attachmentsByResultId: Record<string, any[]> = {}
      ;(attachments || []).forEach(att => {
        if (!attachmentsByResultId[att.test_result_id]) {
          attachmentsByResultId[att.test_result_id] = []
        }
        attachmentsByResultId[att.test_result_id].push(att)
      })

      // Build the multi-tester structure
      const modules: ChecklistModuleWithMultiTesterResults[] = (checklistModules || []).map(module => {
        const baseModule = Array.isArray(module.base_modules)
          ? module.base_modules[0]
          : module.base_modules

        // Get all test results for this module
        const moduleResults = (testResults || []).filter(
          r => r.project_checklist_module_id === module.id
        )

        // Group by test case ID (or testcase_title for custom testcases with null ID)
        const resultsByTestCase: Record<string, any[]> = {}
        moduleResults.forEach(result => {
          // Use testcase_id if available, otherwise use testcase_title for custom testcases
          const groupKey = result.testcase_id || `custom:${result.testcase_title}`
          if (!resultsByTestCase[groupKey]) {
            resultsByTestCase[groupKey] = []
          }
          resultsByTestCase[groupKey].push(result)
        })

        // Build test cases with results
        const testCases: TestCaseWithResults[] = Object.entries(resultsByTestCase)
          .map(([testcaseId, results]) => {
            // Get testcase info from first result
            const firstResult = results[0]
            const testcase = Array.isArray(firstResult.base_testcases)
              ? firstResult.base_testcases[0]
              : firstResult.base_testcases

            // Build tester results (sort by tester name for consistency)
            const testerResults: TestResultWithTester[] = results
              .map(result => {
                const tester = Array.isArray(result.testers)
                  ? result.testers[0]
                  : result.testers

                return {
                  id: result.id,
                  tester: tester,
                  status: result.status,
                  notes: result.notes,
                  testedAt: result.tested_at,
                  attachments: attachmentsByResultId[result.id] || [],
                  _displayOrder: result.display_order // For sorting test cases
                }
              })
              .sort((a, b) => {
                // Sort by tester name for consistent display
                return a.tester.name.localeCompare(b.tester.name)
              })

            // Calculate overall status (weakest)
            const statuses = testerResults.map(r => r.status)
            const overallStatus = getWeakestStatus(statuses)

            // For custom testcases, use the copied data stored in checklist_test_results
            const isCustom = firstResult.is_custom || !testcase

            // Custom testcases use testcase_image_url, library testcases use base_testcases.image_url
            const imageUrl = isCustom
              ? firstResult.testcase_image_url
              : testcase?.image_url

            return {
              testCase: {
                id: testcase?.id || testcaseId,
                title: isCustom ? (firstResult.testcase_title || 'Unknown') : (testcase?.title || 'Unknown'),
                description: isCustom ? firstResult.testcase_description : testcase?.description,
                priority: (isCustom ? (firstResult.testcase_priority || 'Medium') : (testcase?.priority || 'Medium')) as 'High' | 'Medium' | 'Low',
                imageUrl: imageUrl || undefined,
                isCustom: isCustom
              },
              results: testerResults.map((r: any) => {
                const { _displayOrder, ...rest } = r;
                return rest;
              }), // Remove temp field
              overallStatus,
              _displayOrder: firstResult.display_order || 0 // For sorting test cases by explicit order
            }
          })
          .sort((a, b) => {
            // Sort test cases by display_order for stable display
            return a._displayOrder - b._displayOrder
          })
          .map(({ _displayOrder, ...testCase }) => testCase) // Remove temp sorting field

        // For custom modules, use the copied data stored in project_checklist_modules
        const isCustomModule = module.is_custom || !baseModule

        return {
          id: module.id,
          projectId: module.project_id,
          moduleId: module.module_id,
          moduleName: isCustomModule ? (module.module_name || 'Unknown Module') : (baseModule?.name || 'Unknown Module'),
          moduleDescription: isCustomModule ? module.module_description : baseModule?.description,
          moduleThumbnailUrl: baseModule?.thumbnail_url || undefined,
          instanceLabel: module.instance_label || undefined,
          instanceNumber: module.instance_number,
          orderIndex: module.order_index,
          createdAt: module.created_at,
          updatedAt: module.updated_at,
          testCases
        }
      })

      const checklist: ProjectChecklistWithTesters = {
        projectId: project.id,
        projectName: project.name,
        modules,
        assignedTesters
      }

      return { success: true, data: checklist }
    } catch (error) {
      console.error('Unexpected error in getProjectChecklistWithTesters:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Update a test result with tester validation
   * Ensures that only the assigned tester can update their own result
   */
  async updateTestResultWithTester(
    resultId: string,
    testerId: string,
    input: Omit<UpdateTestResultInput, 'testerId'>
  ): Promise<{
    success: boolean
    data?: ChecklistTestResult
    projectId?: string
    error?: string
  }> {
    try {
      // Verify the result belongs to this tester
      const { data: existing, error: fetchError } = await supabase
        .from('checklist_test_results')
        .select('id, tester_id')
        .eq('id', resultId)
        .single()

      if (fetchError || !existing) {
        return { success: false, error: 'Test result not found' }
      }

      if (existing.tester_id !== testerId) {
        return { success: false, error: 'You can only update your own test results' }
      }

      // Proceed with update using existing updateTestResult
      return await this.updateTestResult(resultId, input as any)
    } catch (error) {
      console.error('Unexpected error in updateTestResultWithTester:', error)
      return { success: false, error: 'Internal server error' }
    }
  }
}
