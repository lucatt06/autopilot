import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { unitFiltersSchema, STATUS_LABELS } from '@/lib/units/schemas'
import { listUnits, getUnitTypeOptions, getAvailabilityStats } from '@/lib/units/queries'
import { parseProjectIdsFromParam } from '@/lib/projects/filter-utils'

import { AvailabilityStats } from './_components/availability-stats'
import { AvailabilityFilters } from './_components/availability-filters'
import { AvailabilityTable } from './_components/availability-table'
import { AvailabilityActions } from './_components/availability-actions'

export const metadata = { title: 'Disponibilidad · Autopilot' }

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>
}

export default async function AvailabilityPage({ searchParams }: PageProps) {
  const user = await requireAuth()
  if (!user.workspaceId) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        Selecciona un workspace para ver disponibilidad.
      </div>
    )
  }

  const canManage = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'
  const parsed = unitFiltersSchema.safeParse(searchParams)
  const filters = parsed.success ? parsed.data : unitFiltersSchema.parse({})

  // Public view flag
  const isPub = searchParams.pub === '1'

  // Hidden columns (comma-separated keys)
  const hiddenColsRaw = typeof searchParams.hiddenCols === 'string' ? searchParams.hiddenCols : ''
  const hiddenCols = hiddenColsRaw.split(',').filter(Boolean)

  const [{ items, total, page, pageSize }, projects, buildings, typeOptions, stats] =
    await Promise.all([
      listUnits(user.workspaceId, filters),
      db.project.findMany({
        where: { workspaceId: user.workspaceId, deletedAt: null },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      db.building.findMany({
        where: { workspaceId: user.workspaceId },
        select: { id: true, name: true, projectId: true },
        orderBy: [{ project: { name: 'asc' } }, { name: 'asc' }],
      }),
      getUnitTypeOptions(user.workspaceId),
      getAvailabilityStats(user.workspaceId, filters),
    ])

  const globalProjectIds = parseProjectIdsFromParam(filters.projects)
  const hideProjectColumn = globalProjectIds.length === 1 || !!filters.projectId
  const totalPages = Math.ceil(total / pageSize)

  // Simplified items for client-side export
  const exportItems = items.map((u) => ({
    unitNumber: u.unitNumber,
    building: u.building?.name ?? '',
    etapa: u.building?.constructionStage ?? '',
    entrega: u.building?.expectedDeliveryDate
      ? new Date(u.building.expectedDeliveryDate).toLocaleDateString('es-DO', {
          month: 'short',
          year: 'numeric',
        })
      : '',
    piso: u.floor,
    tipo: u.type,
    m2: u.squareMeters,
    precio: u.currentPrice,
    estado: STATUS_LABELS[u.status as keyof typeof STATUS_LABELS] ?? u.status,
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Disponibilidad</h1>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary">
            {total.toLocaleString('en-US')} unidades
          </span>
        </div>
        {!isPub && (
          <AvailabilityActions canManage={canManage} exportItems={exportItems} />
        )}
      </div>

      {!isPub && <AvailabilityStats stats={stats} />}

      <AvailabilityFilters
        initial={filters}
        projects={projects}
        buildings={buildings}
        typeOptions={typeOptions}
        globalProjectIds={globalProjectIds}
      />

      <AvailabilityTable
        items={items}
        canManage={canManage && !isPub}
        hideProjectColumn={hideProjectColumn}
        hiddenCols={hiddenCols}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`?${new URLSearchParams({ ...(searchParams as Record<string, string>), page: String(page - 1) })}`}
                className="rounded border px-3 py-1 hover:bg-muted"
              >
                Anterior
              </a>
            )}
            {page < totalPages && (
              <a
                href={`?${new URLSearchParams({ ...(searchParams as Record<string, string>), page: String(page + 1) })}`}
                className="rounded border px-3 py-1 hover:bg-muted"
              >
                Siguiente
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
