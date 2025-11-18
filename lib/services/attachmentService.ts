import { supabase } from '../db/supabase'
import { TestCaseAttachment } from '@/types/attachment'
import { validateAttachment } from '../validations/attachment.schema'

// ============================================
// Attachment Service
// ============================================

const STORAGE_BUCKET = 'test-attachments'

export const attachmentService = {
  /**
   * Upload an attachment for a test result
   * Uploads file to Supabase Storage and stores metadata in database
   */
  async uploadAttachment(
    testResultId: string,
    file: File
  ): Promise<{
    success: boolean
    data?: TestCaseAttachment
    error?: string
  }> {
    try {
      // Validate file
      const validation = validateAttachment(file)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Verify test result exists
      const { data: testResult, error: testResultError } = await supabase
        .from('checklist_test_results')
        .select('id, project_checklist_module_id')
        .eq('id', testResultId)
        .single()

      if (testResultError || !testResult) {
        return { success: false, error: 'Test result not found' }
      }

      // Get project ID from checklist module
      const { data: checklistModule } = await supabase
        .from('project_checklist_modules')
        .select('project_id')
        .eq('id', testResult.project_checklist_module_id)
        .single()

      if (!checklistModule) {
        return { success: false, error: 'Project not found' }
      }

      const projectId = checklistModule.project_id

      // Generate unique file path: {project_id}/{test_result_id}/{timestamp}_{filename}
      const timestamp = Date.now()
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `${projectId}/${testResultId}/${timestamp}_${sanitizedFileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) {
        console.error('Error uploading file to storage:', uploadError)
        return { success: false, error: 'Failed to upload file' }
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath)

      if (!publicUrlData) {
        return { success: false, error: 'Failed to get public URL' }
      }

      // Store metadata in database
      const { data: attachment, error: dbError } = await supabase
        .from('test_case_attachments')
        .insert([{
          test_result_id: testResultId,
          file_url: publicUrlData.publicUrl,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size
        }])
        .select()
        .single()

      if (dbError) {
        console.error('Error saving attachment metadata:', dbError)
        // Try to delete uploaded file
        await supabase.storage.from(STORAGE_BUCKET).remove([filePath])
        return { success: false, error: 'Failed to save attachment metadata' }
      }

      return { success: true, data: attachment }
    } catch (error) {
      console.error('Unexpected error in uploadAttachment:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Get all attachments for a test result
   */
  async getAttachments(testResultId: string): Promise<{
    success: boolean
    data?: TestCaseAttachment[]
    error?: string
  }> {
    try {
      const { data, error } = await supabase
        .from('test_case_attachments')
        .select('*')
        .eq('test_result_id', testResultId)
        .order('uploaded_at', { ascending: true })

      if (error) {
        console.error('Error fetching attachments:', error)
        return { success: false, error: 'Failed to fetch attachments' }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Unexpected error in getAttachments:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Delete an attachment
   * Removes file from storage and database metadata
   */
  async deleteAttachment(attachmentId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      // Get attachment metadata
      const { data: attachment, error: fetchError } = await supabase
        .from('test_case_attachments')
        .select('*')
        .eq('id', attachmentId)
        .single()

      if (fetchError || !attachment) {
        return { success: false, error: 'Attachment not found' }
      }

      // Extract file path from URL
      // URL format: https://[project].supabase.co/storage/v1/object/public/test-attachments/[path]
      const url = new URL(attachment.file_url)
      const pathParts = url.pathname.split(`/object/public/${STORAGE_BUCKET}/`)
      const filePath = pathParts[1]

      if (!filePath) {
        console.error('Could not extract file path from URL:', attachment.file_url)
        // Continue with database deletion even if storage deletion fails
      } else {
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([filePath])

        if (storageError) {
          console.error('Error deleting file from storage:', storageError)
          // Continue with database deletion even if storage deletion fails
        }
      }

      // Delete metadata from database
      const { error: dbError } = await supabase
        .from('test_case_attachments')
        .delete()
        .eq('id', attachmentId)

      if (dbError) {
        console.error('Error deleting attachment metadata:', dbError)
        return { success: false, error: 'Failed to delete attachment' }
      }

      return { success: true }
    } catch (error) {
      console.error('Unexpected error in deleteAttachment:', error)
      return { success: false, error: 'Internal server error' }
    }
  },

  /**
   * Initialize storage bucket
   * This should be run during setup to ensure the bucket exists
   */
  async initializeStorageBucket(): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()

      if (listError) {
        console.error('Error listing buckets:', listError)
        return { success: false, error: 'Failed to check storage buckets' }
      }

      const bucketExists = buckets?.some(b => b.name === STORAGE_BUCKET)

      if (!bucketExists) {
        // Create bucket
        const { error: createError } = await supabase.storage.createBucket(STORAGE_BUCKET, {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024 // 5MB
        })

        if (createError) {
          console.error('Error creating bucket:', createError)
          return { success: false, error: 'Failed to create storage bucket' }
        }

        console.log(`Created storage bucket: ${STORAGE_BUCKET}`)
      }

      return { success: true }
    } catch (error) {
      console.error('Unexpected error in initializeStorageBucket:', error)
      return { success: false, error: 'Internal server error' }
    }
  }
}
