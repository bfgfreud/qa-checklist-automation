import { NextRequest, NextResponse } from 'next/server'
import { testerService } from '@/lib/services/testerService'
import { CreateTesterSchema } from '@/lib/validations/tester.schema'

/**
 * GET /api/testers
 * List all testers
 */
export async function GET(request: NextRequest) {
  try {
    const result = await testerService.getAllTesters()

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('Error in GET /api/testers:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/testers
 * Create a new tester
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validation = CreateTesterSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const result = await testerService.createTester(validation.data)

    if (!result.success) {
      // Check for specific errors
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

    return NextResponse.json(
      { success: true, data: result.data },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/testers:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
