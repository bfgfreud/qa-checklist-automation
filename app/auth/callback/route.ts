import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/projects'

    console.log('[Auth Callback] Received code:', code ? 'yes' : 'no')

    if (code) {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('[Auth Callback] Exchange code error:', error)
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
      }

      console.log('[Auth Callback] Auth successful, redirecting to:', next)
      // Successful auth - redirect to projects
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.log('[Auth Callback] No code provided')
    // No code - redirect back to login
    return NextResponse.redirect(`${origin}/login`)
  } catch (error) {
    console.error('[Auth Callback] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
