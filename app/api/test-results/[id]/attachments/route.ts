import { NextRequest, NextResponse } from 'next/server'
import { attachmentService } from '@/lib/services/attachmentService'

/**
 * GET /api/test-results/[id]/attachments
 * Get all attachments for a test result
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await attachmentService.getAttachments(params.id)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('Error in GET /api/test-results/[id]/attachments:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/test-results/[id]/attachments
 * Upload an attachment for a test result
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    const result = await attachmentService.uploadAttachment(params.id, file)

    if (!result.success) {
      // Determine appropriate status code
      const statusCode = result.error === 'Test result not found' ? 404 : 400
      return NextResponse.json(
        { success: false, error: result.error },
        { status: statusCode }
      )
    }

    return NextResponse.json(
      { success: true, data: result.data },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/test-results/[id]/attachments:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
