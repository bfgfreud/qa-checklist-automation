import { NextRequest, NextResponse } from 'next/server'
import { checklistService } from '@/lib/services/checklistService'

/**
 * DELETE /api/projects/[projectId]/checklist/[checklistModuleId]
 * Remove a module instance from project checklist
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string; checklistModuleId: string } }
) {
  try {
    const { projectId, checklistModuleId } = params

    // Validate UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    if (!projectId || !uuidRegex.test(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    if (!checklistModuleId || !uuidRegex.test(checklistModuleId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid checklist module ID' },
        { status: 400 }
      )
    }

    const result = await checklistService.removeModuleFromChecklist(checklistModuleId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Module removed from checklist successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('DELETE /api/projects/[projectId]/checklist/[checklistModuleId] error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
