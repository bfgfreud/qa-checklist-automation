import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db/supabase'
import { z } from 'zod'

const STORAGE_BUCKET = 'testcase-images'
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

/**
 * POST /api/testcases/[id]/image
 * Upload an image for a testcase
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const testCaseId = params.id

    // Validate UUID format
    const uuidSchema = z.string().uuid()
    try {
      uuidSchema.parse(testCaseId)
    } catch {
      return NextResponse.json(
        { error: 'Invalid test case ID format' },
        { status: 400 }
      )
    }

    // Verify testcase exists
    const { data: testcase, error: testcaseError } = await supabase
      .from('base_testcases')
      .select('id, image_url')
      .eq('id', testCaseId)
      .single()

    if (testcaseError || !testcase) {
      return NextResponse.json(
        { error: 'Test case not found' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Delete old image if exists
    if (testcase.image_url) {
      try {
        // Extract file path from URL
        const url = new URL(testcase.image_url)
        const pathParts = url.pathname.split(`/storage/v1/object/public/${STORAGE_BUCKET}/`)
        if (pathParts.length > 1) {
          const oldFilePath = pathParts[1]
          await supabase.storage.from(STORAGE_BUCKET).remove([oldFilePath])
        }
      } catch (e) {
        console.error('Error deleting old image:', e)
        // Continue even if old image deletion fails
      }
    }

    // Generate unique file path
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${testCaseId}/${timestamp}_${sanitizedFileName}`

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading testcase image to storage:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath)

    if (!publicUrlData) {
      return NextResponse.json(
        { error: 'Failed to get public URL' },
        { status: 500 }
      )
    }

    // Update testcase with new image URL
    const { error: updateError } = await supabase
      .from('base_testcases')
      .update({ image_url: publicUrlData.publicUrl })
      .eq('id', testCaseId)

    if (updateError) {
      console.error('Error updating testcase with image URL:', updateError)
      return NextResponse.json(
        { error: 'Failed to update test case' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      imageUrl: publicUrlData.publicUrl,
      fileName: file.name
    })
  } catch (error) {
    console.error('Unexpected error in testcase image upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/testcases/[id]/image
 * Delete the image for a testcase
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const testCaseId = params.id

    // Validate UUID format
    const uuidSchema = z.string().uuid()
    try {
      uuidSchema.parse(testCaseId)
    } catch {
      return NextResponse.json(
        { error: 'Invalid test case ID format' },
        { status: 400 }
      )
    }

    // Get current testcase
    const { data: testcase, error: testcaseError } = await supabase
      .from('base_testcases')
      .select('id, image_url')
      .eq('id', testCaseId)
      .single()

    if (testcaseError || !testcase) {
      return NextResponse.json(
        { error: 'Test case not found' },
        { status: 404 }
      )
    }

    // Delete from storage if exists
    if (testcase.image_url) {
      try {
        const url = new URL(testcase.image_url)
        const pathParts = url.pathname.split(`/storage/v1/object/public/${STORAGE_BUCKET}/`)
        if (pathParts.length > 1) {
          const filePath = pathParts[1]
          await supabase.storage.from(STORAGE_BUCKET).remove([filePath])
        }
      } catch (e) {
        console.error('Error deleting image from storage:', e)
        // Continue to clear the URL even if storage deletion fails
      }
    }

    // Clear image_url in database
    const { error: updateError } = await supabase
      .from('base_testcases')
      .update({ image_url: null })
      .eq('id', testCaseId)

    if (updateError) {
      console.error('Error clearing testcase image URL:', updateError)
      return NextResponse.json(
        { error: 'Failed to update test case' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in testcase image delete:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
