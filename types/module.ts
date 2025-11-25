/**
 * Shared type definitions for modules and test cases
 */

export type Priority = 'High' | 'Medium' | 'Low';

export interface TestCase {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  priority: Priority;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;      // Optional 64x64 thumbnail image
  thumbnailFileName?: string; // Original filename for the thumbnail
  tags?: string[]; // Multi-tag support, stored as JSONB in database
  createdBy?: string; // User ID/email for future auth integration
  order: number;
  testCases: TestCase[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateModuleDto {
  name: string;
  description?: string;
  thumbnailUrl?: string;
  thumbnailFileName?: string;
  tags?: string[];
  createdBy?: string; // Auto-populated on backend
}

export interface UpdateModuleDto {
  name?: string;
  description?: string;
  thumbnailUrl?: string;
  thumbnailFileName?: string;
  tags?: string[];
}

export interface CreateTestCaseDto {
  title: string;
  description?: string;
  priority: Priority;
}

export interface UpdateTestCaseDto {
  title?: string;
  description?: string;
  priority?: Priority;
}

export interface ReorderModulesDto {
  moduleIds: string[];
}

export interface ReorderTestCasesDto {
  testCaseIds: string[];
}
