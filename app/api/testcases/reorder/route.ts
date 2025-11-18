import { NextRequest, NextResponse } from 'next/server'
import { moduleService } from '@/lib/services/moduleService'
import { reorderTestCasesSchema } from '@/lib/validations/module.schema'
import { z } from 'zod'

/**
 * PUT /api/testcases/reorder
 * Update order_index for multiple test cases (drag-and-drop reordering)
 *
 * Body: {
 *   testcases: [
 *     { id: "uuid", order_index: 0 },
 *     { id: "uuid", order_index: 1 },
 *     ...
 *   ]
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validated = reorderTestCasesSchema.parse(body)

    // Reorder test cases
    const result = await moduleService.reorderTestCases(validated)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Test cases reordered successfully' },
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

    console.error('PUT /api/testcases/reorder error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
