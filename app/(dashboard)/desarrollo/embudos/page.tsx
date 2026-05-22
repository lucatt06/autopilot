import { notFound } from 'next/navigation'
import { Filter } from 'lucide-react'

import { requireAuth } from '@/lib/auth'
import { parseProjectIdsFromParam } from '@/lib/projects/filter-utils'
import { getPosventaFunnel, POSVENTA_STAGES } from '@/lib/funnels/posventa'
import { PosventaBoard } from './_components/posventa-board'

export const metadata = { title: 'Embudos · Autopilot' }

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>
}

export default async function EmbudosPage({ searchParams }: PageProps) {
  const user = await requireAuth()
  if (!user.workspaceId) return notFound()

  const canManage = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'ASESOR'
  const projectIds = parseProjectIdsFromParam(
    Array.isArray(searchParams.projects) ? searchParams.projects[0] : searchParams.projects,
  )

  const columns = await getPosventaFunnel(user.workspaceId, projectIds)
  const hideProject = projectIds.length > 0

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <Filter className="h-5 w-5 text-muted-foreground" />
          Embudos
        </h1>
        <p className="text-sm text-muted-foreground">
          Cada unidad en su etapa de posventa, con el cliente que la adquirió. Arrastra una tarjeta para moverla de etapa manualmente.
        </p>
      </div>

      <PosventaBoard columns={columns} stages={POSVENTA_STAGES} canManage={canManage} hideProject={hideProject} />
    </div>
  )
}
