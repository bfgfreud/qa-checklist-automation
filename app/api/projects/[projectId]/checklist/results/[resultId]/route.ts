import { NextRequest, NextResponse } from 'next/server'
import { checklistService } from '@/lib/services/checklistService'
import { updateTestResultSchema } from '@/lib/validations/checklist.schema'
import { z } from 'zod'

/**
 * PUT /api/projects/[projectId]/checklist/results/[resultId]
 * Update a test result (status, notes, tested_by)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string; resultId: string } }
) {
  try {
    const { projectId, resultId } = params
    const body = await request.json()

    // Validate UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    if (!projectId || !uuidRegex.test(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    if (!resultId || !uuidRegex.test(resultId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid result ID' },
        { status: 400 }
      )
    }

    // Validate input
    const validated = updateTestResultSchema.parse(body)

    // Update test result
    const result = await checklistService.updateTestResult(resultId, validated)

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

    console.error('PUT /api/projects/[projectId]/checklist/results/[resultId] error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
