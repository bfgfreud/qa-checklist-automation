import { NextRequest, NextResponse } from 'next/server'
import { projectService } from '@/lib/services/projectService'

/**
 * GET /api/projects/archive
 * Get all archived projects
 */
export async function GET() {
  try {
    const result = await projectService.getArchivedProjects()

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
    console.error('GET /api/projects/archive error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
