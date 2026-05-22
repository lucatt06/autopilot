import type { ReactNode } from 'react'

/** Public share layout — no sidebar, no auth required. */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
