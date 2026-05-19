import { NextResponse, type NextRequest } from 'next/server'

import { createServerClient } from '@/lib/supabase/server'

/**
 * OAuth callback handler.
 *
 * Receives the `code` query param from Supabase, exchanges it for a session,
 * and redirects to the dashboard (or wherever the user came from).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=callback_error`)
  }

  const supabase = createServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=callback_error`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
