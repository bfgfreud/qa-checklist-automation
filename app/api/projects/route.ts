import { NextRequest, NextResponse } from 'next/server'
import { projectService } from '@/lib/services/projectService'
import { createProjectSchema } from '@/lib/validations/project.schema'
import { z } from 'zod'

/**
 * GET /api/projects
 * Get all projects
 */
export async function GET() {
  try {
    const result = await projectService.getAllProjects()

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, data: result.data },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        }
      }
    )
  } catch (error) {
    console.error('GET /api/projects error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validated = createProjectSchema.parse(body)

    // Create project
    const result = await projectService.createProject(validated)

    if (!result.success) {
      const statusCode = result.error?.includes('already exists') ? 409 : 500
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

    console.error('POST /api/projects error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
