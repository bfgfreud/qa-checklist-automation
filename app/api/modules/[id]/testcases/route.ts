import { NextRequest, NextResponse } from 'next/server'
import { moduleService } from '@/lib/services/moduleService'
import { createTestCaseSchema } from '@/lib/validations/module.schema'
import { z } from 'zod'

/**
 * GET /api/modules/[id]/testcases
 * Get all test cases for a module
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const moduleId = params.id

    // Validate UUID format
    const uuidSchema = z.string().uuid()
    try {
      uuidSchema.parse(moduleId)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid module ID format' },
        { status: 400 }
      )
    }

    const result = await moduleService.getTestCases(moduleId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, data: result.data },
      { status: 200 }
    )
  } catch (error) {
    console.error('GET /api/modules/[id]/testcases error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/modules/[id]/testcases
 * Create a new test case for a module
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const moduleId = params.id
    const body = await request.json()

    // Validate UUID format
    const uuidSchema = z.string().uuid()
    try {
      uuidSchema.parse(moduleId)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid module ID format' },
        { status: 400 }
      )
    }

    // Merge module_id from URL params with body
    const testCaseData = {
      ...body,
      module_id: moduleId
    }

    // Validate input
    const validated = createTestCaseSchema.parse(testCaseData)

    // Create test case
    const result = await moduleService.createTestCase(validated)

    if (!result.success) {
      const statusCode = result.error === 'Module not found' ? 404 : 500
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

    console.error('POST /api/modules/[id]/testcases error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
