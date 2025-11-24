import { NextRequest, NextResponse } from 'next/server'
import { testerService } from '@/lib/services/testerService'
import { AssignTesterSchema } from '@/lib/validations/tester.schema'

/**
 * GET /api/projects/[projectId]/testers
 * List all testers assigned to a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const result = await testerService.getProjectTesters(params.projectId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, data: result.data },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=59',
        }
      }
    )
  } catch (error) {
    console.error('Error in GET /api/projects/[projectId]/testers:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects/[projectId]/testers
 * Assign a tester to a project
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const body = await request.json()

    // Validate request body
    const validation = AssignTesterSchema.safeParse(body)

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

    const result = await testerService.assignTesterToProject(
      params.projectId,
      validation.data.testerId
    )

    if (!result.success) {
      if (result.error === 'Project not found' || result.error === 'Tester not found') {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 404 }
        )
      }

      if (result.error === 'Tester already assigned to this project') {
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

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/projects/[projectId]/testers:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
