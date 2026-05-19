import { Sidebar } from '@/components/layout/sidebar'
import { AI_AGENTS_NAV, filterNavByRole } from '@/lib/navigation'
import { requireRole } from '@/lib/auth'

export default async function AiAgentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN')
  const sections = filterNavByRole(AI_AGENTS_NAV, user.role)

  return (
    <>
      <Sidebar sections={sections} title="Agentes IA" basePath="/agentes-ia" />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </>
  )
}
