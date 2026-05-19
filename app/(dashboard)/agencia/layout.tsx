import { Sidebar } from '@/components/layout/sidebar'
import { AGENCY_NAV, filterNavByRole } from '@/lib/navigation'
import { requireRole } from '@/lib/auth'

export default async function AgencyLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole('SUPER_ADMIN')
  const sections = filterNavByRole(AGENCY_NAV, user.role)

  return (
    <>
      <Sidebar sections={sections} title="Panel de Agencia" basePath="/agencia" />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </>
  )
}
