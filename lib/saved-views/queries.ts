import 'server-only'

import { db } from '@/lib/db'

export interface SavedViewRow {
  id: string
  name: string
  filters: Record<string, unknown>
  isShared: boolean
  userId: string
  position: number
}

/**
 * List SavedViews visible to the user in the workspace:
 *  - Their own views (any visibility)
 *  - Other users' views with isShared = true
 *
 * Doc 1 §7.5 — Smart Lists personalizadas.
 */
export async function listSavedViewsForEntity(
  workspaceId: string,
  userId: string,
  entityType: string
): Promise<SavedViewRow[]> {
  const rows = await db.savedView.findMany({
    where: {
      workspaceId,
      entityType,
      OR: [{ userId }, { isShared: true }],
    },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      name: true,
      filters: true,
      isShared: true,
      userId: true,
      position: true,
    },
  })

  return rows.map((r) => ({
    ...r,
    filters: (r.filters ?? {}) as Record<string, unknown>,
  }))
}
