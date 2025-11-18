import { NextRequest, NextResponse } from 'next/server'
import { checklistService } from '@/lib/services/checklistService'
import { updateTestResultSchema, updateTestResultWithTesterSchema } from '@/lib/validations/checklist.schema'
import { z } from 'zod'

/**
 * PUT /api/checklists/test-results/[id]
 * Update a test result status, notes, and tested_by information
 *
 * If testerId is provided in the request body, validates that the test result belongs to that tester
 * This enables multi-tester support where testers can only update their own results
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

    // Check if testerId is provided (multi-tester mode)
    if (body.testerId) {
      // Use multi-tester validation
      const validated = updateTestResultWithTesterSchema.parse(body)

      const result = await checklistService.updateTestResultWithTester(
        id,
        validated.testerId,
        {
          status: validated.status,
          notes: validated.notes
        }
      )

      if (!result.success) {
        let statusCode = 500
        if (result.error === 'Test result not found') {
          statusCode = 404
        } else if (result.error === 'You can only update your own test results') {
          statusCode = 403
        }

        return NextResponse.json(
          { success: false, error: result.error },
          { status: statusCode }
        )
      }

      return NextResponse.json(
        { success: true, data: result.data },
        { status: 200 }
      )
    }

    // Legacy mode (no testerId validation)
    const validated = updateTestResultSchema.parse(body)

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
