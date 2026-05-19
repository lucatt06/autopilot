import 'server-only'

import { db } from '@/lib/db'

/**
 * Append an entry to AuditLog.
 *
 * Doc 3 §1.3 requires every significant action (create, update, delete,
 * login, role_changed, etc.) to produce one of these entries with
 * before/after for updates.
 *
 * Never throws — auditing failure should not break the user's action.
 */
export interface AuditEntry {
  workspaceId: string
  userId: string | null
  action: string
  entityType: string
  entityId?: string
  changes?: Record<string, unknown> | null
  ipAddress?: string | null
  userAgent?: string | null
  impersonatedUserId?: string | null
}

export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        workspaceId: entry.workspaceId,
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        changes: (entry.changes ?? null) as never,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        impersonatedUserId: entry.impersonatedUserId,
      },
    })
  } catch (e) {
    console.error('[audit] failed to persist entry', { entry, error: e })
  }
}

/**
 * Build a before/after diff of only the fields that changed between two
 * snapshots. Useful for update entries.
 */
export function diffFields<T extends Record<string, unknown>>(
  before: T,
  after: Partial<T>
): { before: Partial<T>; after: Partial<T> } {
  const beforeOut: Partial<T> = {}
  const afterOut: Partial<T> = {}

  for (const key of Object.keys(after) as (keyof T)[]) {
    const newVal = after[key]
    const oldVal = before[key]
    if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
      beforeOut[key] = oldVal
      afterOut[key] = newVal as T[keyof T]
    }
  }

  return { before: beforeOut, after: afterOut }
}
