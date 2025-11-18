import { z } from 'zod'

/**
 * Allowed file types for attachments
 */
export const ALLOWED_FILE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp'
]

/**
 * Maximum file size (5MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes

/**
 * Validation for file upload
 * Note: This is for server-side validation after receiving FormData
 */
export function validateAttachment(file: File): {
  valid: boolean
  error?: string
} {
  if (!file) {
    return { valid: false, error: 'No file provided' }
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`
    }
  }

  return { valid: true }
}

/**
 * Schema for validating test result ID
 */
export const TestResultIdSchema = z.string().uuid('Invalid test result ID format')
