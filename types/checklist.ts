/**
 * Shared type definitions for checklist and test execution
 */

export type TestStatus = 'Pending' | 'Pass' | 'Fail' | 'Skipped';

/**
 * Represents a module instance added to a project's checklist
 * Supports multiple instances of the same module with custom labels
 */
export interface ProjectChecklistModule {
  id: string;
  projectId: string;
  moduleId: string;
  moduleName: string; // Denormalized from base_modules for display
  moduleDescription?: string; // Denormalized from base_modules
  instanceLabel?: string; // Custom label (e.g., "Ayaka", "Zhongli")
  instanceNumber: number; // Auto-numbered (1, 2, 3, etc.)
  orderIndex: number; // For drag-drop sorting
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents the execution result of a single test case
 */
export interface ChecklistTestResult {
  id: string;
  projectChecklistModuleId: string;
  testcaseId: string;
  testcaseTitle: string; // Denormalized from base_testcases for display
  testcaseDescription?: string; // Denormalized from base_testcases
  testcasePriority: 'High' | 'Medium' | 'Low'; // Denormalized from base_testcases
  status: TestStatus;
  notes?: string;
  testedBy?: string;
  testedAt?: string; // ISO timestamp
  createdAt: string;
  updatedAt: string;
}

/**
 * Module with all its test results and computed statistics
 */
export interface ChecklistModuleWithResults {
  id: string;
  projectId: string;
  moduleId: string;
  moduleName: string;
  moduleDescription?: string;
  instanceLabel?: string;
  instanceNumber: number;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;

  // Test results and statistics
  testResults: ChecklistTestResult[];
  totalTests: number;
  pendingTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  progress: number; // Percentage (0-100) of non-pending tests
}

/**
 * Overall project checklist with all modules and aggregated stats
 */
export interface ProjectChecklist {
  projectId: string;
  projectName: string;
  modules: ChecklistModuleWithResults[];

  // Aggregated statistics
  totalModules: number;
  totalTests: number;
  pendingTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  overallProgress: number; // Percentage (0-100)
}

/**
 * Statistics for a specific module instance
 */
export interface ModuleProgressStats {
  moduleId: string;
  moduleName: string;
  instanceLabel?: string;
  totalTests: number;
  pendingTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  progress: number;
}

// ============================================
// DTOs for API requests
// ============================================

/**
 * DTO for adding a module to a project's checklist
 */
export interface AddModuleToChecklistDto {
  projectId: string;
  moduleId: string;
  instanceLabel?: string; // Optional custom label
}

/**
 * DTO for updating a test result status
 */
export interface UpdateTestResultDto {
  status: TestStatus;
  notes?: string;
  testedBy?: string;
}

/**
 * DTO for reordering checklist modules
 */
export interface ReorderChecklistModulesDto {
  modules: {
    id: string; // project_checklist_module.id
    orderIndex: number;
  }[];
}

/**
 * DTO for bulk updating test results
 */
export interface BulkUpdateTestResultsDto {
  resultIds: string[];
  status: TestStatus;
  notes?: string;
  testedBy?: string;
}
