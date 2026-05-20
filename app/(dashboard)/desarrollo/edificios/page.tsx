import Link from 'next/link'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { buildingFiltersSchema } from '@/lib/buildings/schemas'
import { listBuildings } from '@/lib/buildings/queries'
import { parseProjectIdsFromParam } from '@/lib/projects/filter-utils'

import { BuildingsTable } from './_components/buildings-table'
import { BuildingsFilters } from './_components/buildings-filters'

export const metadata = { title: 'Edificios · Autopilot' }

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>
}

export default async function BuildingsPage({ searchParams }: PageProps) {
  const user = await requireAuth()
  if (!user.workspaceId) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        Selecciona un workspace para ver edificios.
      </div>
    )
  }

  const canManage = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'
  const parsed = buildingFiltersSchema.safeParse(searchParams)
  const filters = parsed.success ? parsed.data : buildingFiltersSchema.parse({})

  const [{ items, total }, projects] = await Promise.all([
    listBuildings({ workspaceId: user.workspaceId, filters }),
    db.project.findMany({
      where: { workspaceId: user.workspaceId, deletedAt: null },
      select: { id: true, name: true, hasStages: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const globalProjectIds = parseProjectIdsFromParam(filters.projects)
  const hideProjectColumn = globalProjectIds.length === 1 || !!filters.projectId
  const newBuildingHref = globalProjectIds.length > 0
    ? `/desarrollo/edificios/nuevo?projects=${globalProjectIds.join(',')}`
    : '/desarrollo/edificios/nuevo'

  // Determine which project IDs are currently in view
  const viewedProjectIds = filters.projectId
    ? [filters.projectId]
    : globalProjectIds.length > 0
    ? globalProjectIds
    : projects.map((p) => p.id)

  const showStageColumn = projects
    .filter((p) => viewedProjectIds.includes(p.id))
    .some((p) => p.hasStages)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Edificios</h1>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary">
            {total.toLocaleString('en-US')} Edificios
          </span>
        </div>
        {canManage && (
          <Button asChild size="sm">
            <Link href={newBuildingHref}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Nuevo edificio
            </Link>
          </Button>
        )}
      </div>

      <BuildingsFilters
        initial={filters}
        projects={projects}
        globalProjectIds={globalProjectIds}
      />

      <BuildingsTable
        items={items}
        canManage={canManage}
        hideProjectColumn={hideProjectColumn}
        showStageColumn={showStageColumn}
      />
    </div>
  )
}
