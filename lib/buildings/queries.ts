import 'server-only'

import type { Prisma } from '@prisma/client'

import { db } from '@/lib/db'
import type { BuildingFilters } from '@/lib/buildings/schemas'
import { parseProjectIdsFromParam } from '@/lib/projects/filter-utils'

export interface ListBuildingsArgs {
  workspaceId: string
  filters?: BuildingFilters
}

/**
 * List buildings + aggregate stats per row:
 *   - total units
 *   - units sold (VENDIDA + ENTREGADA)
 *   - units available (DISPONIBLE)
 *
 * Doc 1 §8.4 — columnas: Nombre, Proyecto, Pisos, Total unidades, Disponibles, Vendidas, Estado.
 */
export async function listBuildings({ workspaceId, filters }: ListBuildingsArgs) {
  const where: Prisma.BuildingWhereInput = { workspaceId }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ]
  }
  if (filters?.projectId) where.projectId = filters.projectId
  if (filters?.status) where.status = filters.status

  // Global project filter (multi-select from sidebar)
  const globalProjectIds = parseProjectIdsFromParam(filters?.projects)
  if (globalProjectIds.length > 0) {
    where.projectId = filters?.projectId
      ? // intersect single-project filter with global selector
        globalProjectIds.includes(filters.projectId)
        ? filters.projectId
        : '__no_match__'
      : { in: globalProjectIds }
  }

  const page = filters?.page ?? 1
  const pageSize = filters?.pageSize ?? 100

  const [buildings, total] = await Promise.all([
    db.building.findMany({
      where,
      take: pageSize,
      skip: (page - 1) * pageSize,
      orderBy: [{ project: { name: 'asc' } }, { name: 'asc' }],
      include: {
        project: { select: { id: true, name: true } },
        _count: { select: { units: true } },
      },
    }),
    db.building.count({ where }),
  ])

  const buildingIds = buildings.map((b) => b.id)
  const statusBreakdown = buildingIds.length
    ? await db.unit.groupBy({
        by: ['buildingId', 'status'],
        where: { buildingId: { in: buildingIds } },
        _count: { _all: true },
        _sum: { currentPrice: true },
      })
    : []

  // buildingId -> { STATUS -> { count, value } }
  const statsByBuilding = new Map<string, Record<string, { count: number; value: number }>>()
  for (const row of statusBreakdown) {
    const id = row.buildingId
    if (!statsByBuilding.has(id)) statsByBuilding.set(id, {})
    statsByBuilding.get(id)![row.status] = {
      count: row._count._all,
      value: row._sum.currentPrice ?? 0,
    }
  }

  const items = buildings.map((b) => {
    const stats = statsByBuilding.get(b.id) ?? {}
    const get = (s: string) => stats[s] ?? { count: 0, value: 0 }
    return {
      id: b.id,
      name: b.name,
      project: b.project,
      numberOfFloors: b.numberOfFloors,
      unitsPerFloor: b.unitsPerFloor,
      status: b.status,
      constructionStage: b.constructionStage,
      expectedDeliveryDate: b.expectedDeliveryDate,
      image: b.image,
      totalUnits: b._count.units,
      availableUnits: get('DISPONIBLE').count,
      availableValue: get('DISPONIBLE').value,
      blockedUnits: get('BLOQUEADA').count,
      blockedValue: get('BLOQUEADA').value,
      reservedUnits: get('RESERVADA').count,
      reservedValue: get('RESERVADA').value,
      soldUnits: get('VENDIDA').count,
      soldValue: get('VENDIDA').value,
      deliveredUnits: get('ENTREGADA').count,
      deliveredValue: get('ENTREGADA').value,
    }
  })

  return { items, total, page, pageSize }
}

export async function getBuildingById(id: string, workspaceId: string) {
  return db.building.findFirst({
    where: { id, workspaceId },
    include: {
      project: { select: { id: true, name: true } },
      _count: { select: { units: true } },
    },
  })
}

/**
 * Returns per-floor breakdown of units in a building, for the detail page.
 *
 * Shape: floors[i] = [{ unitNumber, status, type }] in ascending floor order.
 */
export async function getBuildingFloorMap(buildingId: string, workspaceId: string) {
  const units = await db.unit.findMany({
    where: { buildingId, workspaceId },
    select: {
      id: true,
      unitNumber: true,
      floor: true,
      type: true,
      bedrooms: true,
      bathrooms: true,
      squareMeters: true,
      status: true,
      basePrice: true,
      currentPrice: true,
    },
    orderBy: [{ floor: 'asc' }, { unitNumber: 'asc' }],
  })

  // Group by floor (desc — top floors first as in visual planos)
  const byFloor = new Map<number, typeof units>()
  for (const u of units) {
    if (!byFloor.has(u.floor)) byFloor.set(u.floor, [])
    byFloor.get(u.floor)!.push(u)
  }
  const floors = Array.from(byFloor.entries())
    .map(([floor, list]) => ({ floor, units: list }))
    .sort((a, b) => b.floor - a.floor)

  return floors
}
