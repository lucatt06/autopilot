import { notFound } from 'next/navigation'

import { db } from '@/lib/db'
import { unitFiltersSchema } from '@/lib/units/schemas'
import { listUnits, getAvailabilityStats, getUnitTypeOptions } from '@/lib/units/queries'
import { parseProjectIdsFromParam } from '@/lib/projects/filter-utils'
import { AvailabilityStats } from '@/app/(dashboard)/desarrollo/disponibilidad/_components/availability-stats'
import { AvailabilityFilters } from '@/app/(dashboard)/desarrollo/disponibilidad/_components/availability-filters'
import { AvailabilityTable } from '@/app/(dashboard)/desarrollo/disponibilidad/_components/availability-table'

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>
}

export default async function PublicAvailabilityPage({ searchParams }: PageProps) {
  const workspaceId = typeof searchParams.workspace === 'string' ? searchParams.workspace : null
  if (!workspaceId) return notFound()

  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, name: true },
  })
  if (!workspace) return notFound()

  const parsed = unitFiltersSchema.safeParse(searchParams)
  const filters = parsed.success ? parsed.data : unitFiltersSchema.parse({})

  const hiddenColsRaw = typeof searchParams.hiddenCols === 'string' ? searchParams.hiddenCols : ''
  const hiddenCols = hiddenColsRaw.split(',').filter(Boolean)

  const globalProjectIds = parseProjectIdsFromParam(filters.projects)
  const hideProjectColumn = globalProjectIds.length === 1 || !!filters.projectId

  const selectedProjectId = globalProjectIds[0] ?? filters.projectId ?? null
  let projectName: string | null = null
  if (selectedProjectId) {
    const project = await db.project.findFirst({
      where: { id: selectedProjectId, workspaceId },
      select: { name: true },
    })
    projectName = project?.name ?? null
  }

  const [{ items, total }, stats, projects, buildings, typeOptions] = await Promise.all([
    listUnits(workspaceId, filters),
    getAvailabilityStats(workspaceId, filters),
    db.project.findMany({
      where: { workspaceId, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    db.building.findMany({
      where: { workspaceId },
      select: { id: true, name: true, projectId: true },
      orderBy: [{ project: { name: 'asc' } }, { name: 'asc' }],
    }),
    getUnitTypeOptions(workspaceId),
  ])

  return (
    <div className="space-y-8 px-6 py-10 lg:px-10">
      {/* ── Header ── */}
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {workspace.name}
        </p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          {projectName ?? 'Disponibilidad'}
        </h1>
        {projectName && (
          <>
            <div className="mx-auto mt-4 h-px w-24 bg-border" />
            <p className="mt-4 text-base text-muted-foreground">Disponibilidad de unidades</p>
          </>
        )}
      </div>

      {/* ── Stats ── */}
      <AvailabilityStats stats={stats} />

      {/* ── Filters ── */}
      <AvailabilityFilters
        initial={filters}
        projects={projects}
        buildings={buildings}
        typeOptions={typeOptions}
        globalProjectIds={globalProjectIds}
      />

      {/* ── Table ── */}
      <AvailabilityTable
        items={items}
        canManage={false}
        hideProjectColumn={hideProjectColumn}
        hiddenCols={hiddenCols}
      />
    </div>
  )
}
