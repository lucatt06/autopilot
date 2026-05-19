import { Sidebar } from '@/components/layout/sidebar'
import { requireAuth } from '@/lib/auth'
import { CRM_NAV, filterNavByRole } from '@/lib/navigation'

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth()
  const sections = filterNavByRole(CRM_NAV, user.role)

  return (
    <>
      <Sidebar sections={sections} title="CRM" basePath="/crm" />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </>
  )
}
