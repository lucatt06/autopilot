import { redirect } from 'next/navigation'

/**
 * Public landing redirects: middleware handles the actual logic:
 *  - if authenticated → /dashboard
 *  - if not → /login
 */
export default function HomePage() {
  redirect('/login')
}
