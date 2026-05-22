import 'server-only'

import type { Prisma, PrismaClient } from '@prisma/client'

import { db } from '@/lib/db'
import { buildExcerpt, extractMentionUserIds } from './parse'

type TxClient = Prisma.TransactionClient | PrismaClient

export interface SyncMentionsInput {
  workspaceId: string
  /** The user who wrote the text (never notified about their own mentions). */
  authorId: string
  /** Logical container, e.g. "payment_plan" | "contact_note". */
  entityType: string
  entityId: string
  /** Deep link to navigate to the source. */
  link: string
  /** The saved markup text (`@[Name](userId)` inline). */
  text: string | null | undefined
  /** Notification title, e.g. "Te mencionaron en el Plan de Pago «X»". */
  notificationTitle: string
}

/**
 * Reconcile the @-mentions of a saved text field against what was stored before.
 *
 * - Parses the user ids referenced in `text` (excluding the author).
 * - Validates they are active users of the same workspace.
 * - Creates a Mention + an in-app Notification ONLY for newly-added users
 *   (so editing the same note again does not re-notify).
 * - Removes stale Mention rows for users no longer referenced (their past
 *   notifications are kept untouched).
 *
 * Multi-tenant: every read/write is filtered by `workspaceId`. Pure side effects
 * on the DB; safe to call inside an existing transaction by passing `tx`.
 */
export async function syncMentions(input: SyncMentionsInput, tx: TxClient = db): Promise<void> {
  const { workspaceId, authorId, entityType, entityId, link, text, notificationTitle } = input

  const referencedIds = extractMentionUserIds(text).filter((id) => id !== authorId)

  // Existing mentions for this exact source.
  const existing = await tx.mention.findMany({
    where: { workspaceId, entityType, entityId },
    select: { id: true, mentionedUserId: true },
  })
  const existingIds = new Set(existing.map((m) => m.mentionedUserId))

  // Only keep ids that map to active users of THIS workspace (defense-in-depth).
  const validUsers = referencedIds.length
    ? await tx.user.findMany({
        where: { id: { in: referencedIds }, workspaceId, isActive: true },
        select: { id: true },
      })
    : []
  const validIds = new Set(validUsers.map((u) => u.id))

  const toAdd = referencedIds.filter((id) => validIds.has(id) && !existingIds.has(id))
  const toRemove = existing.filter((m) => !validIds.has(m.mentionedUserId)).map((m) => m.id)

  const excerpt = buildExcerpt(text)

  if (toRemove.length) {
    await tx.mention.deleteMany({ where: { id: { in: toRemove } } })
  }

  for (const userId of toAdd) {
    await tx.mention.create({
      data: { workspaceId, mentionedUserId: userId, authorId, entityType, entityId, link, excerpt },
    })
    await tx.notification.create({
      data: {
        workspaceId,
        userId,
        type: 'mention',
        title: notificationTitle,
        body: excerpt || null,
        link,
        entityType,
        entityId,
        inApp: true,
      },
    })
  }
}
