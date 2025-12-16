/**
 * Shared type definitions for checklist and test execution
 */

import { Tester } from './tester'
import { TestCaseAttachment } from './attachment'

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
  testcaseId?: string; // Optional for custom testcases
  testcaseTitle: string; // Denormalized from base_testcases for display
  testcaseDescription?: string; // Denormalized from base_testcases
  testcasePriority: 'High' | 'Medium' | 'Low'; // Denormalized from base_testcases
  testcaseImageUrl?: string; // Reference image (from base_testcases or custom)
  isCustom?: boolean; // True if this is a custom testcase not from library
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
  testerId: string; // NEW: Required for multi-tester support
  status: TestStatus;
  notes?: string;
  testedBy?: string; // DEPRECATED: Use testerId instead
}

// ============================================
// Multi-Tester Support Types
// ============================================

/**
 * Test result with tester and attachment information
 */
export interface TestResultWithTester {
  id: string;
  tester: Tester;
  status: TestStatus;
  notes: string | null;
  testedAt: string | null;
  attachments: TestCaseAttachment[];
}

/**
 * Test case with results from multiple testers
 */
export interface TestCaseWithResults {
  testCase: {
    id: string;
    title: string;
    description?: string;
    priority: 'High' | 'Medium' | 'Low';
    imageUrl?: string; // Reference image
    isCustom?: boolean; // True if this is a custom testcase not from library
  };
  results: TestResultWithTester[];
  overallStatus: TestStatus; // Weakest status across all testers
}

/**
 * Module with multi-tester test results structure
 */
export interface ChecklistModuleWithMultiTesterResults {
  id: string;
  projectId: string;
  moduleId: string;
  moduleName: string;
  moduleDescription?: string;
  moduleThumbnailUrl?: string; // Thumbnail from base_modules
  instanceLabel?: string;
  instanceNumber: number;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  testCases: TestCaseWithResults[];
}

/**
 * Full project checklist with multi-tester support
 */
export interface ProjectChecklistWithTesters {
  projectId: string;
  projectName: string;
  modules: ChecklistModuleWithMultiTesterResults[];
  assignedTesters: Tester[];
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
