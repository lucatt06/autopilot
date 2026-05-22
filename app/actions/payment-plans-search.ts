'use server'

import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { searchCustomers as searchCustomersQuery } from '@/lib/payment-plans/queries'

/** Client-callable wrapper for the customer search (optional plan link). */
export async function searchCustomers(query: string): Promise<{ id: string; name: string }[]> {
  const user = await requireAuth()
  if (!user.workspaceId) return []
  return searchCustomersQuery(user.workspaceId, query)
}

/** Returns all units for a given project (scoped to the current workspace). */
export async function getUnitsForProject(projectId: string): Promise<{
  id: string
  unitNumber: string
  type: string
  floor: number
  buildingName: string
  currentPrice: number
  status: string
}[]> {
  const user = await requireAuth()
  if (!user.workspaceId || !projectId) return []
  const units = await db.unit.findMany({
    where: { projectId, workspaceId: user.workspaceId },
    include: { building: { select: { name: true } } },
    orderBy: [{ floor: 'asc' }, { unitNumber: 'asc' }],
  })
  return units.map((u) => ({
    id: u.id,
    unitNumber: u.unitNumber,
    type: u.type,
    floor: u.floor,
    buildingName: u.building.name,
    currentPrice: u.currentPrice,
    status: u.status,
  }))
}
