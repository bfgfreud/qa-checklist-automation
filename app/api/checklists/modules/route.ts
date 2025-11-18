import { NextRequest, NextResponse } from 'next/server'
import { checklistService } from '@/lib/services/checklistService'
import { addModuleToChecklistSchema } from '@/lib/validations/checklist.schema'
import { z } from 'zod'

/**
 * POST /api/checklists/modules
 * Add a module to a project checklist
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validated = addModuleToChecklistSchema.parse(body)

    // Add module to checklist
    const result = await checklistService.addModuleToChecklist(validated)

    if (!result.success) {
      let statusCode = 500
      if (result.error === 'Project not found' || result.error === 'Module not found') {
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

    console.error('POST /api/checklists/modules error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
