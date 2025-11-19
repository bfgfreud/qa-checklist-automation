import { NextRequest, NextResponse } from 'next/server'
import { testerService } from '@/lib/services/testerService'
import { UpdateTesterSchema } from '@/lib/validations/tester.schema'

/**
 * GET /api/testers/[id]
 * Get tester by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await testerService.getTesterById(params.id)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('Error in GET /api/testers/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/testers/[id]
 * Update tester
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Validate request body
    const validation = UpdateTesterSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.issues
        },
        { status: 400 }
      )
    }

    const result = await testerService.updateTester(params.id, validation.data)

    if (!result.success) {
      if (result.error === 'Tester not found') {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 404 }
        )
      }

      if (result.error === 'Email already exists') {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('Error in PUT /api/testers/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/testers/[id]
 * Delete tester
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await testerService.deleteTester(params.id)

    if (!result.success) {
      if (result.error === 'Tester not found') {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/testers/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
