import { NextRequest, NextResponse } from 'next/server'
import { checklistService } from '@/lib/services/checklistService'
import { z } from 'zod'

/**
 * GET /api/checklists/[projectId]
 * Get all checklist modules for a project with test results
 *
 * Query parameters:
 * - view: "multi-tester" | "legacy" (default: "legacy")
 *
 * Multi-tester view returns data organized by Module > Test Case > Tester Results
 * Legacy view returns flat list of test results (single tester per result)
 */
export async function GET(
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

    // Check for multi-tester view
    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view')

    if (view === 'multi-tester') {
      // Use multi-tester endpoint
      const result = await checklistService.getProjectChecklistWithTesters(id)

      if (!result.success) {
        const statusCode = result.error === 'Project not found' ? 404 : 500
        return NextResponse.json(
          { success: false, error: result.error },
          { status: statusCode }
        )
      }

      return NextResponse.json(
        { success: true, data: result.data },
        { status: 200 }
      )
    }

    // Legacy view (default)
    const result = await checklistService.getProjectChecklist(id)

    if (!result.success) {
      const statusCode = result.error === 'Project not found' ? 404 : 500
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
    console.error('GET /api/checklists/[projectId] error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
