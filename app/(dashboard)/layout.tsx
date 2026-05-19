import { WelcomeBar } from '@/components/layout/welcome-bar'
import { requireAuth } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <WelcomeBar user={user} />
      <div className="flex flex-1">{children}</div>
    </div>
  )
}
