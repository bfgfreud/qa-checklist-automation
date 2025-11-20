import { NextResponse } from 'next/server'
import { attachmentService } from '@/lib/services/attachmentService'

/**
 * POST /api/setup/storage
 * Initialize Supabase storage bucket for test attachments
 * This only needs to be run once during setup
 */
export async function POST() {
  try {
    const result = await attachmentService.initializeStorageBucket()

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Storage bucket initialized successfully'
    })
  } catch (error) {
    console.error('Error in POST /api/setup/storage:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/setup/storage
 * Check if storage bucket exists
 */
export async function GET() {
  try {
    // Try to initialize - it will skip if already exists
    const result = await attachmentService.initializeStorageBucket()

    return NextResponse.json({
      success: true,
      initialized: result.success,
      message: result.success
        ? 'Storage bucket is ready'
        : 'Storage bucket needs initialization'
    })
  } catch (error) {
    console.error('Error in GET /api/setup/storage:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
