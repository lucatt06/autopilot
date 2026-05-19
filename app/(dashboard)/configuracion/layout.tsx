import { Sidebar } from '@/components/layout/sidebar'
import { requireAuth } from '@/lib/auth'
import { filterNavByRole, getConfigNav } from '@/lib/navigation'

export default async function ConfigurationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()
  const sections = filterNavByRole(getConfigNav(user.role), user.role)

  return (
    <>
      <Sidebar sections={sections} title="Configuración" basePath="/configuracion" />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </>
  )
}
