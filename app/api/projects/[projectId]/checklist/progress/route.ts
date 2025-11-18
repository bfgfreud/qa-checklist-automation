import { NextRequest, NextResponse } from 'next/server'
import { checklistService } from '@/lib/services/checklistService'

/**
 * GET /api/projects/[projectId]/checklist/progress
 * Get progress statistics for a project's checklist
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params

    // Validate projectId is a UUID
    if (!projectId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    const result = await checklistService.getChecklistProgress(projectId)

    if (!result.success) {
      const statusCode = result.error?.includes('not found') ? 404 : 500
      return NextResponse.json(
        { success: false, error: result.error },
        { status: statusCode }
      )
    }

    return NextResponse.json(
      { success: true, data: result.data },
      { status: 200 }
    )
  } catch (error) {
    console.error('GET /api/projects/[projectId]/checklist/progress error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
