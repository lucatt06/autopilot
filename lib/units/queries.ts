import 'server-only'

import type { Prisma } from '@prisma/client'

import { db } from '@/lib/db'
import type { UnitFilters } from '@/lib/units/schemas'
import { parseProjectIdsFromParam } from '@/lib/projects/filter-utils'

export async function listUnits(workspaceId: string, filters: UnitFilters = {} as UnitFilters) {
  const where: Prisma.UnitWhereInput = { workspaceId }

  if (filters.search) {
    where.OR = [
      { unitNumber: { contains: filters.search, mode: 'insensitive' } },
      { type: { contains: filters.search, mode: 'insensitive' } },
      { internalNotes: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  if (filters.projectId) where.projectId = filters.projectId
  if (filters.buildingId) where.buildingId = filters.buildingId
  if (filters.type) where.type = { equals: filters.type, mode: 'insensitive' }
  if (filters.status) where.status = filters.status
  if (filters.floor !== undefined) where.floor = filters.floor

  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    where.currentPrice = {}
    if (filters.priceMin !== undefined) where.currentPrice.gte = filters.priceMin
    if (filters.priceMax !== undefined) where.currentPrice.lte = filters.priceMax
  }

  const globalProjectIds = parseProjectIdsFromParam(filters.projects)
  if (globalProjectIds.length > 0) {
    where.projectId = filters.projectId
      ? globalProjectIds.includes(filters.projectId)
        ? filters.projectId
        : '__no_match__'
      : { in: globalProjectIds }
  }

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
