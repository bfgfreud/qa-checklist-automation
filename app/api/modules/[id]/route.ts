import { NextRequest, NextResponse } from 'next/server'
import { moduleService } from '@/lib/services/moduleService'
import { updateModuleSchema } from '@/lib/validations/module.schema'
import { z } from 'zod'

/**
 * GET /api/modules/[id]
 * Get a single module with its test cases
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
        { success: false, error: 'Invalid module ID format' },
        { status: 400 }
      )
    }

    const result = await moduleService.getModuleById(id)

    if (!result.success) {
      const statusCode = result.error === 'Module not found' ? 404 : 500
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
    console.error('GET /api/modules/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/modules/[id]
 * Update a module
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
        { success: false, error: 'Invalid module ID format' },
        { status: 400 }
      )
    }

    // Validate input
    const validated = updateModuleSchema.parse(body)

    // Update module
    const result = await moduleService.updateModule(id, validated)

    if (!result.success) {
      let statusCode = 500
      if (result.error === 'Module not found or failed to update') {
        statusCode = 404
      } else if (result.error?.includes('already exists')) {
        statusCode = 409
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

    console.error('PUT /api/modules/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/modules/[id]
 * Delete a module (cascades to test cases)
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
        { success: false, error: 'Invalid module ID format' },
        { status: 400 }
      )
    }

    const result = await moduleService.deleteModule(id)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Module deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('DELETE /api/modules/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
