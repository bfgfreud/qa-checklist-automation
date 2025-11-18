import { NextRequest, NextResponse } from 'next/server'
import { checklistService } from '@/lib/services/checklistService'
import { reorderChecklistModulesSchema } from '@/lib/validations/checklist.schema'
import { z } from 'zod'

/**
 * POST /api/projects/[projectId]/checklist/reorder
 * Reorder checklist modules within a project
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params
    const body = await request.json()

    // Validate projectId is a UUID
    if (!projectId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    // Validate input
    const validated = reorderChecklistModulesSchema.parse(body)

    // Reorder modules
    const result = await checklistService.reorderChecklistModules(projectId, validated)

    if (!result.success) {
      let statusCode = 500
      if (result.error?.includes('do not belong')) {
        statusCode = 400
      }
      return NextResponse.json(
        { success: false, error: result.error },
        { status: statusCode }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Checklist modules reordered successfully' },
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

    console.error('POST /api/projects/[projectId]/checklist/reorder error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
