import { WelcomeBar } from '@/components/layout/welcome-bar'
import { requireAuth } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <WelcomeBar user={user} />
      <div className="flex min-h-0 flex-1">{children}</div>
    </div>
  )
}
