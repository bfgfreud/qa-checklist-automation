import { NextRequest, NextResponse } from 'next/server'
import { checklistService } from '@/lib/services/checklistService'
import { addModuleToChecklistSchema } from '@/lib/validations/checklist.schema'
import { z } from 'zod'

/**
 * GET /api/projects/[projectId]/checklist
 * Get complete checklist for a project with all modules and test results
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params

    // Validate projectId is a UUID
    if (!projectId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    const result = await checklistService.getProjectChecklist(projectId)

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
    console.error('GET /api/projects/[projectId]/checklist error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects/[projectId]/checklist
 * Add a module instance to project checklist
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params
    const body = await request.json()

    // Add projectId to body for validation
    const dataToValidate = {
      ...body,
      projectId
    }

    // Validate input
    const validated = addModuleToChecklistSchema.parse(dataToValidate)

    // Add module to checklist
    const result = await checklistService.addModuleToChecklist(validated)

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

    console.error('POST /api/projects/[projectId]/checklist error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
