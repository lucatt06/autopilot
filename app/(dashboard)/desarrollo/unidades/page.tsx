import Link from 'next/link'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { unitFiltersSchema } from '@/lib/units/schemas'
import { listUnits, getUnitTypeOptions } from '@/lib/units/queries'
import { parseProjectIdsFromParam } from '@/lib/projects/filter-utils'

import { UnitsTable } from './_components/units-table'
import { UnitsFilters } from './_components/units-filters'

export const metadata = { title: 'Unidades · Autopilot' }

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>
}

export default async function UnitsPage({ searchParams }: PageProps) {
  const user = await requireAuth()
  if (!user.workspaceId) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        Selecciona un workspace para ver unidades.
      </div>
    )
  }

  const canManage = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'
  const parsed = unitFiltersSchema.safeParse(searchParams)
  const filters = parsed.success ? parsed.data : unitFiltersSchema.parse({})

  const [{ items, total }, projects, buildings, typeOptions] = await Promise.all([
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
  ])

  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? 100
  const totalPages = Math.ceil(total / pageSize)

  const globalProjectIds = parseProjectIdsFromParam(filters.projects)
  const hasGlobalProject = globalProjectIds.length > 0
  const hasProjectFilter = hasGlobalProject || !!filters.projectId

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Unidades</h1>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary">
            {total.toLocaleString('en-US')} unidades
          </span>
        </div>
        {canManage && (
          <Button asChild size="sm">
            <Link href="/desarrollo/unidades/nuevo">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Nueva unidad
            </Link>
          </Button>
        )}
      </div>

      <UnitsFilters
        initial={filters}
        projects={projects}
        buildings={buildings}
        typeOptions={typeOptions}
        globalProjectIds={globalProjectIds}
      />

      <UnitsTable items={items} canManage={canManage} hideProjectColumn={hasProjectFilter} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`?${new URLSearchParams({ ...(searchParams as Record<string, string>), page: String(page - 1) })}`}
                className="rounded border px-3 py-1 hover:bg-muted"
              >
                Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`?${new URLSearchParams({ ...(searchParams as Record<string, string>), page: String(page + 1) })}`}
                className="rounded border px-3 py-1 hover:bg-muted"
              >
                Siguiente
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
