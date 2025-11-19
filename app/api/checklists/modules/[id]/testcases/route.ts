import { NextRequest, NextResponse } from 'next/server'
import { checklistService } from '@/lib/services/checklistService'
import { addCustomTestcaseSchema } from '@/lib/validations/checklist.schema'
import { z } from 'zod'

/**
 * POST /api/checklists/modules/[id]/testcases
 * Add a custom testcase to a checklist module
 *
 * Body:
 * {
 *   testerIds: string[]          - Array of tester IDs
 *   testcaseTitle: string        - Testcase title (required)
 *   testcaseDescription?: string - Optional description
 *   testcasePriority: 'High' | 'Medium' | 'Low' - Priority (default: Medium)
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Add moduleId from URL params to body for validation
    const input = {
      ...body,
      projectChecklistModuleId: params.id
    }

    // Validate input
    const validated = addCustomTestcaseSchema.parse(input)

    // Add custom testcase
    const result = await checklistService.addCustomTestcase(validated)

    if (!result.success) {
      let statusCode = 500
      if (result.error === 'Checklist module not found') {
        statusCode = 404
      }

      return NextResponse.json(
        { success: false, error: result.error },
        { status: statusCode }
      )
    }

    return NextResponse.json(
      { success: true, data: result.data },
      { status: 201 }
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

    console.error(`POST /api/checklists/modules/${params.id}/testcases error:`, error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
