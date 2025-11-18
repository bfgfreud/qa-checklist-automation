import { NextRequest, NextResponse } from 'next/server'
import { testerService } from '@/lib/services/testerService'

/**
 * DELETE /api/projects/[projectId]/testers/[testerId]
 * Unassign a tester from a project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string; testerId: string } }
) {
  try {
    const result = await testerService.unassignTesterFromProject(
      params.projectId,
      params.testerId
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/projects/[projectId]/testers/[testerId]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
