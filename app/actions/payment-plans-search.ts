'use server'

import { requireAuth } from '@/lib/auth'
import { searchCustomers as searchCustomersQuery } from '@/lib/payment-plans/queries'

/** Client-callable wrapper for the customer search (optional plan link). */
export async function searchCustomers(query: string): Promise<{ id: string; name: string }[]> {
  const user = await requireAuth()
  if (!user.workspaceId) return []
  return searchCustomersQuery(user.workspaceId, query)
}
