import { Sidebar } from '@/components/layout/sidebar'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { REAL_ESTATE_NAV, filterNavByRole } from '@/lib/navigation'

import { ProjectSelector } from './_components/project-selector'

export default async function RealEstateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()
  const sections = filterNavByRole(REAL_ESTATE_NAV, user.role)

  const projects = user.workspaceId
    ? await db.project.findMany({
        where: { workspaceId: user.workspaceId, deletedAt: null },
        select: { id: true, name: true, status: true },
        orderBy: { name: 'asc' },
      })
    : []

  return (
    <>
      <Sidebar
        sections={sections}
        title="Desarrollo Inmobiliario"
        basePath="/desarrollo"
        headerExtra={<ProjectSelector projects={projects} />}
      />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </>
  )
}
