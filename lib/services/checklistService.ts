import { supabase } from '../db/supabase'
import {
  ProjectChecklistModule,
  ChecklistTestResult,
  ChecklistModuleWithResults,
  ProjectChecklist,
  ModuleProgressStats
} from '@/types/checklist'
import {
  AddModuleToChecklistInput,
  ReorderChecklistModulesInput,
  UpdateTestResultInput,
  BulkUpdateTestResultsInput
} from '../validations/checklist.schema'

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

      // Get all checklist modules for this project
      const { data: checklistModules, error: modulesError } = await supabase
        .from('project_checklist_modules')
        .select(`
          id,
          project_id,
          module_id,
          instance_label,
          instance_number,
          order_index,
          created_at,
          updated_at,
          base_modules (
            name,
            description
          )
        `)
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })

      if (modulesError) {
        console.error('Error fetching checklist modules:', modulesError)
        return { success: false, error: 'Failed to fetch checklist modules' }
      }

      // Get all test results for this project
      const { data: testResults, error: resultsError } = await supabase
        .from('checklist_test_results')
        .select(`
          id,
          project_checklist_module_id,
          testcase_id,
          status,
          notes,
          tested_by,
          tested_at,
          created_at,
          updated_at,
          base_testcases (
            title,
            description,
            priority
          )
        `)
        .in('project_checklist_module_id', (checklistModules || []).map(m => m.id))
        .order('created_at', { ascending: true })

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

        const testcase = Array.isArray(result.base_testcases)
          ? result.base_testcases[0]
          : result.base_testcases

        acc[moduleId].push({
          id: result.id,
          projectChecklistModuleId: result.project_checklist_module_id,
          testcaseId: result.testcase_id,
          testcaseTitle: testcase?.title || 'Unknown',
          testcaseDescription: testcase?.description || undefined,
          testcasePriority: (testcase?.priority || 'Medium') as 'High' | 'Medium' | 'Low',
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
        const baseModule = Array.isArray(module.base_modules)
          ? module.base_modules[0]
          : module.base_modules

        const testResults = resultsByModule[module.id] || []
        const stats = calculateModuleStats(testResults)

        return {
          id: module.id,
          projectId: module.project_id,
          moduleId: module.module_id,
          moduleName: baseModule?.name || 'Unknown Module',
          moduleDescription: baseModule?.description || undefined,
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
   * Add a module instance to project checklist
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

      // Verify module exists
      const { data: module } = await supabase
        .from('base_modules')
        .select('id, name, description')
        .eq('id', input.moduleId)
        .single()

      if (!module) {
        return { success: false, error: 'Module not found' }
      }

      // Calculate instance_number (count existing instances of this module + 1)
      const { data: existingInstances } = await supabase
        .from('project_checklist_modules')
        .select('instance_number')
        .eq('project_id', input.projectId)
        .eq('module_id', input.moduleId)
        .order('instance_number', { ascending: false })
        .limit(1)

      const instanceNumber = existingInstances && existingInstances.length > 0
        ? existingInstances[0].instance_number + 1
        : 1

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

      // Create checklist module entry
      const { data: checklistModule, error: moduleError } = await supabase
        .from('project_checklist_modules')
        .insert([{
          project_id: input.projectId,
          module_id: input.moduleId,
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

      // Get all test cases for this module
      const { data: testcases, error: testcasesError } = await supabase
        .from('base_testcases')
        .select('id, title, description, priority')
        .eq('module_id', input.moduleId)
        .order('order_index', { ascending: true })

      if (testcasesError) {
        console.error('Error fetching test cases:', testcasesError)
        return { success: false, error: 'Failed to fetch module test cases' }
      }

      console.log(`[DEBUG] Found ${testcases?.length || 0} test cases for module ${input.moduleId}`)

      // Create test result entries for all test cases (status = 'Pending')
      if (testcases && testcases.length > 0) {
        const testResultInserts = testcases.map(tc => ({
          project_checklist_module_id: checklistModule.id,
          testcase_id: tc.id,
          status: 'Pending' as const
        }))

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

      // Fetch the complete module with results
      const { data: testResults } = await supabase
        .from('checklist_test_results')
        .select(`
          id,
          project_checklist_module_id,
          testcase_id,
          status,
          notes,
          tested_by,
          tested_at,
          created_at,
          updated_at,
          base_testcases (
            title,
            description,
            priority
          )
        `)
        .eq('project_checklist_module_id', checklistModule.id)

      const mappedResults: ChecklistTestResult[] = (testResults || []).map(result => {
        const testcase = Array.isArray(result.base_testcases)
          ? result.base_testcases[0]
          : result.base_testcases

        return {
          id: result.id,
          projectChecklistModuleId: result.project_checklist_module_id,
          testcaseId: result.testcase_id,
          testcaseTitle: testcase?.title || 'Unknown',
          testcaseDescription: testcase?.description || undefined,
          testcasePriority: (testcase?.priority || 'Medium') as 'High' | 'Medium' | 'Low',
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
        moduleId: checklistModule.module_id,
        moduleName: module.name,
        moduleDescription: module.description || undefined,
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
   * Update a test result (status, notes, tested_by)
   */
  async updateTestResult(
    resultId: string,
    input: UpdateTestResultInput
  ): Promise<{
    success: boolean
    data?: ChecklistTestResult
    error?: string
  }> {
    try {
      const updateData: Record<string, any> = {
        status: input.status
      }

      if (input.notes !== undefined) updateData.notes = input.notes
      if (input.testedBy !== undefined) updateData.tested_by = input.testedBy

      const { data, error } = await supabase
        .from('checklist_test_results')
        .update(updateData)
        .eq('id', resultId)
        .select(`
          id,
          project_checklist_module_id,
          testcase_id,
          status,
          notes,
          tested_by,
          tested_at,
          created_at,
          updated_at,
          base_testcases (
            title,
            description,
            priority
          )
        `)
        .single()

      if (error || !data) {
        console.error('Error updating test result:', error)
        return { success: false, error: 'Test result not found or failed to update' }
      }

      const testcase = Array.isArray(data.base_testcases)
        ? data.base_testcases[0]
        : data.base_testcases

      const result: ChecklistTestResult = {
        id: data.id,
        projectChecklistModuleId: data.project_checklist_module_id,
        testcaseId: data.testcase_id,
        testcaseTitle: testcase?.title || 'Unknown',
        testcaseDescription: testcase?.description || undefined,
        testcasePriority: (testcase?.priority || 'Medium') as 'High' | 'Medium' | 'Low',
        status: data.status,
        notes: data.notes || undefined,
        testedBy: data.tested_by || undefined,
        testedAt: data.tested_at || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }

      return { success: true, data: result }
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
  }
}
