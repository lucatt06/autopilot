'use server'

import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

export interface NotificationItem {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  isRead: boolean
  entityType: string | null
  entityId: string | null
  createdAt: string
}

export interface WorkspaceUserOption {
  id: string
  name: string
  email: string
  avatar: string | null
  role: string
}

/**
 * Users of the current workspace, for the @-mention autocomplete. Active users
 * only, optionally filtered by a name/email query. Scoped to the workspace.
 */
export async function searchWorkspaceUsers(query: string): Promise<WorkspaceUserOption[]> {
  const user = await requireAuth()
  if (!user.workspaceId) return []

  const q = query.trim()
  const users = await db.user.findMany({
    where: {
      workspaceId: user.workspaceId,
      isActive: true,
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    take: 8,
  })

  return users.map((u) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`.trim(),
    email: u.email,
    avatar: u.avatar,
    role: u.role,
  }))
}

/** Current user's notifications (most recent first). */
export async function getNotifications(
  opts?: { unreadOnly?: boolean; limit?: number },
): Promise<NotificationItem[]> {
  const user = await requireAuth()

  const rows = await db.notification.findMany({
    where: {
      userId: user.id,
      inApp: true,
      ...(opts?.unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: opts?.limit ?? 50,
  })

  return rows.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
    isRead: n.isRead,
    entityType: n.entityType,
    entityId: n.entityId,
    createdAt: n.createdAt.toISOString(),
  }))
}

/** Count of unread in-app notifications for the current user. */
export async function getUnreadCount(): Promise<number> {
  const user = await requireAuth()
  return db.notification.count({ where: { userId: user.id, inApp: true, isRead: false } })
}

/** Mark a single notification as read (only if it belongs to the current user). */
export async function markNotificationRead(id: string): Promise<{ ok: boolean }> {
  const user = await requireAuth()
  const result = await db.notification.updateMany({
    where: { id, userId: user.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  })
  return { ok: result.count > 0 }
}

/** Mark all of the current user's notifications as read. */
export async function markAllNotificationsRead(): Promise<{ ok: boolean; count: number }> {
  const user = await requireAuth()
  const result = await db.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  })
  return { ok: true, count: result.count }
}
