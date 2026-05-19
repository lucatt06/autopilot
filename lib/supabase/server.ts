import { createServerClient as createSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 *
 * Uses Next.js cookies() to persist the session. RLS is enforced because the
 * client uses the user's JWT (publishable key + cookie-based session).
 *
 * For privileged operations that bypass RLS, use Prisma (`@/lib/db`) which
 * connects as the `postgres` role.
 */
export function createServerClient() {
  const cookieStore = cookies()

  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — middleware handles refresh
          }
        },
      },
    }
  )
}

/**
 * Supabase client with service_role key — BYPASSES RLS.
 * Use ONLY for trusted server-side admin operations (e.g. creating users
 * during the invite flow). Never expose this to the client.
 */
export function createAdminClient() {
  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  )
}
