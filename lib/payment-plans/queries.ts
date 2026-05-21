import 'server-only'

import { type Prisma } from '@prisma/client'

import { db } from '@/lib/db'
import { parseProjectIdsFromParam } from '@/lib/projects/filter-utils'
import type { PlanFilters } from '@/lib/payment-plans/schemas'

function buildPlanWhere(workspaceId: string, filters: PlanFilters): Prisma.PaymentPlanWhereInput {
  const where: Prisma.PaymentPlanWhereInput = { workspaceId }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { project: { name: { contains: filters.search, mode: 'insensitive' } } },
    ]
  }

  if (filters.status) where.status = filters.status

  const globalProjectIds = parseProjectIdsFromParam(filters.projects)
  if (filters.projectId) {
    where.projectId = filters.projectId
  } else if (globalProjectIds.length > 0) {
    where.projectId = { in: globalProjectIds }
  }

  return where
}

export async function listPaymentPlans(workspaceId: string, filters: PlanFilters = {} as PlanFilters) {
  const where = buildPlanWhere(workspaceId, filters)
  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? 100

  const [items, total] = await Promise.all([
    db.paymentPlan.findMany({
      where,
      take: pageSize,
      skip: (page - 1) * pageSize,
      orderBy: { updatedAt: 'desc' },
      include: {
        project: { select: { id: true, name: true } },
      },
    }),
    db.paymentPlan.count({ where }),
  ])

  return { items, total, page, pageSize }
}

export async function getPaymentPlanById(id: string, workspaceId: string) {
  return db.paymentPlan.findFirst({
    where: { id, workspaceId },
    include: {
      project: { select: { id: true, name: true } },
      customer: { select: { id: true, Contact: { select: { firstName: true, lastName: true } } } },
      installments: { orderBy: [{ type: 'asc' }, { installmentNumber: 'asc' }] },
    },
  })
}

/** Active projects for the project picker. */
export async function getProjectsForSelect(workspaceId: string) {
  return db.project.findMany({
    where: { workspaceId, deletedAt: null },
    select: { id: true, name: true, expectedDeliveryDate: true },
    orderBy: { name: 'asc' },
  })
}

/** Search customers (optional link), resolving display name from their CRM contact. */
export async function searchCustomers(workspaceId: string, query: string) {
  const q = query.trim()
  const customers = await db.customer.findMany({
    where: {
      workspaceId,
      ...(q
        ? {
            Contact: {
              some: {
                OR: [
                  { firstName: { contains: q, mode: 'insensitive' } },
                  { lastName: { contains: q, mode: 'insensitive' } },
                ],
              },
            },
          }
        : {}),
    },
    take: 20,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      Contact: { select: { firstName: true, lastName: true }, take: 1 },
    },
  })

  return customers.map((c) => ({
    id: c.id,
    name: c.Contact[0] ? `${c.Contact[0].firstName} ${c.Contact[0].lastName}`.trim() : 'Cliente',
  }))
}
