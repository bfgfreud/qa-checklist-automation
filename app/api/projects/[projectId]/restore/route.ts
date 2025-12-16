import { NextRequest, NextResponse } from 'next/server'
import { projectService } from '@/lib/services/projectService'
import { z } from 'zod'

/**
 * POST /api/projects/[id]/restore
 * Restore an archived project
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const id = params.projectId

    // Validate UUID format
    const uuidSchema = z.string().uuid()
    try {
      uuidSchema.parse(id)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID format' },
        { status: 400 }
      )
    }

    const result = await projectService.restoreProject(id)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, data: result.data, message: 'Project restored successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('POST /api/projects/[id]/restore error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
