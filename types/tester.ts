/**
 * Shared type definitions for testers
 */

export interface Tester {
  id: string;
  name: string;
  email: string | null;
  color: string;
  created_at: string;
}

export interface ProjectTester {
  project_id: string;
  tester_id: string;
  assigned_at: string;
}

// ============================================
// DTOs for API requests
// ============================================

export interface CreateTesterDto {
  name: string;
  email?: string;
  color?: string;
}

export interface UpdateTesterDto {
  name?: string;
  email?: string;
  color?: string;
}

export interface AssignTesterDto {
  testerId: string;
}
