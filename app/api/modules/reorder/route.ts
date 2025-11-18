import { NextRequest, NextResponse } from 'next/server'
import { moduleService } from '@/lib/services/moduleService'
import { reorderModulesSchema } from '@/lib/validations/module.schema'
import { z } from 'zod'

/**
 * PUT /api/modules/reorder
 * Update order_index for multiple modules (drag-and-drop reordering)
 *
 * Body: {
 *   modules: [
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
    const validated = reorderModulesSchema.parse(body)

    // Reorder modules
    const result = await moduleService.reorderModules(validated)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Modules reordered successfully' },
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

    console.error('PUT /api/modules/reorder error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
