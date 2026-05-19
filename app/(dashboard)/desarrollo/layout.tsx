import { Sidebar } from '@/components/layout/sidebar'
import { requireAuth } from '@/lib/auth'
import { REAL_ESTATE_NAV, filterNavByRole } from '@/lib/navigation'

export default async function RealEstateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()
  const sections = filterNavByRole(REAL_ESTATE_NAV, user.role)

  return (
    <>
      <Sidebar sections={sections} title="Desarrollo Inmobiliario" basePath="/desarrollo" />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </>
  )
}
