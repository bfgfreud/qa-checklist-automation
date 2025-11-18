/**
 * Shared type definitions for test case attachments
 */

export interface TestCaseAttachment {
  id: string;
  test_result_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number | null;
  uploaded_at: string;
}

// ============================================
// DTOs for API requests
// ============================================

export interface UploadAttachmentDto {
  file: File;
}
