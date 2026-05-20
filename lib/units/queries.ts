import 'server-only'

import { type Prisma, UnitView, UnitStatus } from '@prisma/client'

import { db } from '@/lib/db'
import type { UnitFilters } from '@/lib/units/schemas'
import { parseProjectIdsFromParam } from '@/lib/projects/filter-utils'

function split(val?: string): string[] {
  return val ? val.split(',').map((s) => s.trim()).filter(Boolean) : []
}

function buildUnitWhere(workspaceId: string, filters: UnitFilters): Prisma.UnitWhereInput {
  const where: Prisma.UnitWhereInput = { workspaceId }

  if (filters.search) {
    where.OR = [
      { unitNumber: { contains: filters.search, mode: 'insensitive' } },
      { type: { contains: filters.search, mode: 'insensitive' } },
      { internalNotes: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  if (filters.projectId) where.projectId = filters.projectId

  const buildingIds = split(filters.buildingIds)
  if (buildingIds.length > 0) where.buildingId = { in: buildingIds }
  else if (filters.buildingId) where.buildingId = filters.buildingId

  const types = split(filters.types)
  if (types.length > 0) where.type = { in: types }
  else if (filters.type) where.type = { equals: filters.type, mode: 'insensitive' }

  const statuses = split(filters.statuses) as UnitStatus[]
  if (statuses.length > 0) where.status = { in: statuses }
  else if (filters.status) where.status = filters.status

  if (filters.floor !== undefined) where.floor = filters.floor

  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    where.currentPrice = {}
    if (filters.priceMin !== undefined) where.currentPrice.gte = filters.priceMin
    if (filters.priceMax !== undefined) where.currentPrice.lte = filters.priceMax
  }

  const views = split(filters.views) as UnitView[]
  if (views.length > 0) where.view = { in: views }
  else if (filters.view) where.view = filters.view as UnitView

  const orientations = split(filters.orientations)
  if (orientations.length > 0) where.orientation = { in: orientations }
  else if (filters.orientation) where.orientation = { equals: filters.orientation, mode: 'insensitive' }

  const globalProjectIds = parseProjectIdsFromParam(filters.projects)
  if (globalProjectIds.length > 0) {
    where.projectId = filters.projectId
      ? globalProjectIds.includes(filters.projectId)
        ? filters.projectId
        : '__no_match__'
      : { in: globalProjectIds }
  }

  return where
}

export async function listUnits(workspaceId: string, filters: UnitFilters = {} as UnitFilters) {
  const where = buildUnitWhere(workspaceId, filters)
  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? 100

  const [units, total] = await Promise.all([
    db.unit.findMany({
      where,
      take: pageSize,
      skip: (page - 1) * pageSize,
      orderBy: [
        { project: { name: 'asc' } },
        { building: { name: 'asc' } },
        { floor: 'asc' },
        { unitNumber: 'asc' },
      ],
      include: {
        project: { select: { id: true, name: true } },
        building: { select: { id: true, name: true, constructionStage: true, expectedDeliveryDate: true } },
      },
    }),
    db.unit.count({ where }),
  ])

  return { items: units, total, page, pageSize }
}

export async function getUnitById(id: string, workspaceId: string) {
  return db.unit.findFirst({
    where: { id, workspaceId },
    include: {
      project: { select: { id: true, name: true } },
      building: { select: { id: true, name: true, constructionStage: true, expectedDeliveryDate: true } },
    },
  })
}

export async function getUnitTypeOptions(workspaceId: string): Promise<string[]> {
  const rows = await db.unit.findMany({
    where: { workspaceId },
    select: { type: true },
    distinct: ['type'],
    orderBy: { type: 'asc' },
  })
  return rows.map((r) => r.type)
}

export async function getAvailabilityStats(
  workspaceId: string,
  filters: UnitFilters = {} as UnitFilters,
): Promise<Record<string, { count: number; value: number }>> {
  const where = buildUnitWhere(workspaceId, filters)

  const grouped = await db.unit.groupBy({
    by: ['status'],
    where,
    _count: { _all: true },
    _sum: { currentPrice: true },
  })

  const result: Record<string, { count: number; value: number }> = {}
  let totalCount = 0
  let totalValue = 0

  for (const row of grouped) {
    const count = row._count._all
    const value = row._sum.currentPrice ?? 0
    result[row.status] = { count, value }
    totalCount += count
    totalValue += value
  }

  result['TOTAL'] = { count: totalCount, value: totalValue }
  return result
}
