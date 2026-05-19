'use client'

import { createBrowserClient as createBrowserSSRClient } from '@supabase/ssr'

/**
 * Supabase client for Client Components.
 *
 * Reads the session from cookies set by the server. RLS is enforced because
 * all queries from the browser carry the user's JWT.
 */
export function createBrowserClient() {
  return createBrowserSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
