import { NextRequest, NextResponse } from 'next/server'
import { checklistService } from '@/lib/services/checklistService'
import { z } from 'zod'

/**
 * DELETE /api/checklists/modules/[id]
 * Remove a module from a project checklist (cascades to test results)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    // Validate UUID format
    const uuidSchema = z.string().uuid()
    try {
      uuidSchema.parse(id)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid checklist module ID format' },
        { status: 400 }
      )
    }

    const result = await checklistService.removeModuleFromChecklist(id)

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
    console.error('DELETE /api/checklists/modules/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
