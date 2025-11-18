import { NextRequest, NextResponse } from 'next/server'
import { checklistService } from '@/lib/services/checklistService'
import { updateTestResultSchema } from '@/lib/validations/checklist.schema'
import { z } from 'zod'

/**
 * PUT /api/checklists/test-results/[id]
 * Update a test result status, notes, and tested_by information
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const body = await request.json()

    // Validate UUID format
    const uuidSchema = z.string().uuid()
    try {
      uuidSchema.parse(id)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid test result ID format' },
        { status: 400 }
      )
    }

    // Validate input
    const validated = updateTestResultSchema.parse(body)

    // Update test result
    const result = await checklistService.updateTestResult(id, validated)

    if (!result.success) {
      const statusCode = result.error === 'Test result not found or failed to update' ? 404 : 500
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

    console.error('PUT /api/checklists/test-results/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
