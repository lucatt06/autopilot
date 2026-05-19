import Link from 'next/link'

import { requireAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/actions/auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/dashboard" className="text-lg font-semibold">
            Autopilot
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <div className="font-medium">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-xs text-muted-foreground">
                {user.workspace?.name ?? 'Super Admin'} · {user.role}
              </div>
            </div>

            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                Salir
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container py-8">{children}</main>
    </div>
  )
}
