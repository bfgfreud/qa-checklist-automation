import { NextRequest, NextResponse } from 'next/server'
import { attachmentService } from '@/lib/services/attachmentService'

/**
 * DELETE /api/attachments/[id]
 * Delete an attachment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await attachmentService.deleteAttachment(params.id)

    if (!result.success) {
      if (result.error === 'Attachment not found') {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/attachments/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
