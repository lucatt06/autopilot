import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Refreshes the Supabase session cookies on every request.
 * Should be invoked from the root middleware.ts on all matched paths.
 *
 * Returns the response with refreshed cookies AND the resolved user (or null).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]
        ) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() validates the JWT with Supabase Auth on every request.
  // Do NOT use getSession() here — it reads from cookie without validation.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response: supabaseResponse, user }
}
