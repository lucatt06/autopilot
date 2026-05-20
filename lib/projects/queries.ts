import 'server-only'

import type { Prisma } from '@prisma/client'

import { db } from '@/lib/db'
import type { ProjectFilters } from '@/lib/projects/schemas'

export interface ListProjectsArgs {
  workspaceId: string
  filters?: ProjectFilters
}

/**
 * List projects in the workspace + aggregate stats per card:
 *   - total buildings
 *   - total units
 *   - sold units (status = VENDIDA or ENTREGADA)
 *
 * Doc 1 §8.2 — cada card muestra cantidad de edificios y unidades + % avance ventas.
 */
export async function listProjects({ workspaceId, filters }: ListProjectsArgs) {
  const where: Prisma.ProjectWhereInput = {
    workspaceId,
    deletedAt: null,
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { location: { contains: filters.search, mode: 'insensitive' } },
      { address: { contains: filters.search, mode: 'insensitive' } },
    ]
  }
  if (filters?.status) where.status = filters.status
  if (filters?.type) where.type = filters.type

  const page = filters?.page ?? 1
  const pageSize = filters?.pageSize ?? 100

  const [projects, total] = await Promise.all([
    db.project.findMany({
      where,
      take: pageSize,
      skip: (page - 1) * pageSize,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        _count: {
          select: {
            buildings: true,
            units: true,
          },
        },
      },
    }),
    db.project.count({ where }),
  ])

  // For sold counts we need a separate aggregate (Prisma _count can't filter inline cleanly).
  const projectIds = projects.map((p) => p.id)
  const soldByProject = projectIds.length
    ? await db.unit.groupBy({
        by: ['projectId'],
        where: {
          projectId: { in: projectIds },
          status: { in: ['VENDIDA', 'ENTREGADA'] },
        },
        _count: { _all: true },
      })
    : []

  const soldMap = new Map(soldByProject.map((g) => [g.projectId, g._count._all]))

  const items = projects.map((p) => {
    const totalUnits = p._count.units
    const sold = soldMap.get(p.id) ?? 0
    const salesProgress = totalUnits === 0 ? 0 : Math.round((sold / totalUnits) * 100)
    return {
      id: p.id,
      name: p.name,
      type: p.type,
      location: p.location,
      address: p.address,
      status: p.status,
      hasStages: p.hasStages,
      progressPercent: p.progressPercent,
      startDate: p.startDate,
      expectedDeliveryDate: p.expectedDeliveryDate,
      coverImage: p.images[0] ?? null,
      buildingsCount: p._count.buildings,
      unitsCount: totalUnits,
      soldUnits: sold,
      salesProgress,
      createdAt: p.createdAt,
    }
  })

  return { items, total, page, pageSize }
}

export async function getProjectById(id: string, workspaceId: string) {
  return db.project.findFirst({
    where: { id, workspaceId, deletedAt: null },
    include: {
      _count: { select: { buildings: true, units: true } },
      stages: { orderBy: { order: 'asc' } },
    },
  })
}
