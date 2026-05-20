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

// ─── Availability feature ────────────────────────────────────────────────────

export type UnitForAvailability = {
  id: string
  unitNumber: string
  floor: number
  type: string
  bedrooms: number
  bathrooms: number
  squareMeters: number
  terraceSquareMeters: number | null
  basePrice: number
  currentPrice: number
  status: string
  view: string | null
  orientation: string | null
}

export type BuildingForAvailability = {
  id: string
  name: string
  projectId: string
  project: { id: string; name: string }
  numberOfFloors: number
  status: string
  floors: { floor: number; units: UnitForAvailability[] }[]
  stats: Record<string, number> // 'total' + each UnitStatus key
}

export async function getAvailabilityData(
  workspaceId: string,
  projectIds: string[],
): Promise<BuildingForAvailability[]> {
  const buildingWhere: Prisma.BuildingWhereInput = { workspaceId }
  if (projectIds.length > 0) {
    buildingWhere.projectId = { in: projectIds }
  }

  const buildings = await db.building.findMany({
    where: buildingWhere,
    orderBy: [{ project: { name: 'asc' } }, { name: 'asc' }],
    include: {
      project: { select: { id: true, name: true } },
      units: {
        select: {
          id: true,
          unitNumber: true,
          floor: true,
          type: true,
          bedrooms: true,
          bathrooms: true,
          squareMeters: true,
          terraceSquareMeters: true,
          basePrice: true,
          currentPrice: true,
          status: true,
          view: true,
          orientation: true,
        },
        orderBy: [{ floor: 'asc' }, { unitNumber: 'asc' }],
      },
    },
  })

  return buildings.map((b) => {
    // Group units by floor, sort floors desc (top floors first)
    const byFloor = new Map<number, UnitForAvailability[]>()
    for (const u of b.units) {
      if (!byFloor.has(u.floor)) byFloor.set(u.floor, [])
      byFloor.get(u.floor)!.push({
        id: u.id,
        unitNumber: u.unitNumber,
        floor: u.floor,
        type: u.type,
        bedrooms: u.bedrooms,
        bathrooms: u.bathrooms,
        squareMeters: u.squareMeters,
        terraceSquareMeters: u.terraceSquareMeters,
        basePrice: u.basePrice,
        currentPrice: u.currentPrice,
        status: u.status,
        view: u.view ?? null,
        orientation: u.orientation,
      })
    }
    const floors = Array.from(byFloor.entries())
      .map(([floor, units]) => ({ floor, units }))
      .sort((a, b) => b.floor - a.floor)

    // Calculate stats
    const stats: Record<string, number> = {
      total: b.units.length,
      DISPONIBLE: 0,
      BLOQUEADA: 0,
      RESERVADA: 0,
      VENDIDA: 0,
      ENTREGADA: 0,
    }
    for (const u of b.units) {
      if (u.status in stats) {
        stats[u.status] = (stats[u.status] ?? 0) + 1
      }
    }

    return {
      id: b.id,
      name: b.name,
      projectId: b.projectId,
      project: b.project,
      numberOfFloors: b.numberOfFloors,
      status: b.status,
      floors,
      stats,
    }
  })
}
