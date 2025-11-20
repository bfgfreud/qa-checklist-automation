import { NextRequest, NextResponse } from 'next/server'
import { checklistService } from '@/lib/services/checklistService'
import { reorderChecklistTestcasesSchema } from '@/lib/validations/checklist.schema'
import { z } from 'zod'

/**
 * POST /api/projects/[projectId]/checklist/modules/[moduleId]/testcases/reorder
 * Reorder testcases within a checklist module
 * CRITICAL: Updates display_order for ALL testers' test results (multi-tester sync)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string; moduleId: string } }
) {
  try {
    const { projectId, moduleId } = params
    const body = await request.json()

    // Validate projectId is a UUID
    if (!projectId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    // Validate moduleId is a UUID
    if (!moduleId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(moduleId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid module ID' },
        { status: 400 }
      )
    }

    // Validate input
    const validated = reorderChecklistTestcasesSchema.parse(body)

    // Reorder testcases
    const result = await checklistService.reorderChecklistTestcases(moduleId, validated)

    if (!result.success) {
      let statusCode = 500
      if (result.error?.includes('not found')) {
        statusCode = 404
      }
      return NextResponse.json(
        { success: false, error: result.error },
        { status: statusCode }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Checklist testcases reordered successfully' },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.issues
        },
        { status: 400 }
      )
    }

    console.error('POST /api/projects/[projectId]/checklist/modules/[moduleId]/testcases/reorder error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
