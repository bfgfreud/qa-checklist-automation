import { NextRequest, NextResponse } from 'next/server'
import { projectService } from '@/lib/services/projectService'
import { z } from 'zod'

/**
 * DELETE /api/projects/[id]/permanent-delete
 * Permanently delete an archived project (requires project to be archived first)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const id = params.projectId

    // Validate UUID format
    const uuidSchema = z.string().uuid()
    try {
      uuidSchema.parse(id)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID format' },
        { status: 400 }
      )
    }

    const result = await projectService.permanentDeleteProject(id)

    if (!result.success) {
      const statusCode = result.error?.includes('must be archived') ? 400 : 500
      return NextResponse.json(
        { success: false, error: result.error },
        { status: statusCode }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Project permanently deleted' },
      { status: 200 }
    )
  } catch (error) {
    console.error('DELETE /api/projects/[id]/permanent-delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
