import { NextRequest, NextResponse } from 'next/server'
import { moduleService } from '@/lib/services/moduleService'
import { updateTestCaseSchema } from '@/lib/validations/module.schema'
import { z } from 'zod'

/**
 * GET /api/testcases/[id]
 * Get a single test case
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    // Validate UUID format
    const uuidSchema = z.string().uuid()
    try {
      uuidSchema.parse(id)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid test case ID format' },
        { status: 400 }
      )
    }

    const result = await moduleService.getTestCaseById(id)

    if (!result.success) {
      const statusCode = result.error === 'Test case not found' ? 404 : 500
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
    console.error('GET /api/testcases/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/testcases/[id]
 * Update a test case
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
        { success: false, error: 'Invalid test case ID format' },
        { status: 400 }
      )
    }

    // Validate input
    const validated = updateTestCaseSchema.parse(body)

    // Update test case
    const result = await moduleService.updateTestCase(id, validated)

    if (!result.success) {
      const statusCode = result.error === 'Test case not found or failed to update' ? 404 : 500
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

    console.error('PUT /api/testcases/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/testcases/[id]
 * Delete a test case
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    // Validate UUID format
    const uuidSchema = z.string().uuid()
    try {
      uuidSchema.parse(id)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid test case ID format' },
        { status: 400 }
      )
    }

    const result = await moduleService.deleteTestCase(id)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Test case deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('DELETE /api/testcases/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
