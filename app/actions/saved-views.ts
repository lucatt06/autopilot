'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { audit } from '@/lib/audit'

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

const createSchema = z.object({
  name: z.string().trim().min(1, 'Nombre requerido').max(60),
  entityType: z.string().min(1).default('contact'),
  filters: z.record(z.unknown()),
  isShared: z.boolean().default(false),
})

const renameSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(60),
  isShared: z.boolean().optional(),
})

export async function createSavedView(
  input: z.infer<typeof createSchema>
): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuth()
  if (!user.workspaceId) return { ok: false, error: 'No workspace activo' }

  const parsed = createSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  // Only Admins/Super Admins can share views with the workspace
  const canShare = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
  const isShared = parsed.data.isShared && canShare

  const max = await db.savedView.aggregate({
    where: { workspaceId: user.workspaceId, userId: user.id, entityType: parsed.data.entityType },
    _max: { position: true },
  })

  const created = await db.savedView.create({
    data: {
      workspaceId: user.workspaceId,
      userId: user.id,
      entityType: parsed.data.entityType,
      name: parsed.data.name,
      filters: parsed.data.filters as never,
      isShared,
      position: (max._max.position ?? 0) + 1,
    },
  })

  await audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: 'created',
    entityType: 'SavedView',
    entityId: created.id,
    changes: { after: created },
  })

  revalidatePath('/crm/contactos')
  return { ok: true, data: { id: created.id } }
}

export async function renameSavedView(
  input: z.infer<typeof renameSchema>
): Promise<ActionResult> {
  const user = await requireAuth()
  if (!user.workspaceId) return { ok: false, error: 'No workspace activo' }

  const parsed = renameSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const existing = await db.savedView.findFirst({
    where: { id: parsed.data.id, workspaceId: user.workspaceId, userId: user.id },
  })
  if (!existing) return { ok: false, error: 'View no encontrada' }

  await db.savedView.update({
    where: { id: existing.id },
    data: {
      name: parsed.data.name,
      ...(parsed.data.isShared !== undefined && { isShared: parsed.data.isShared }),
    },
  })

  revalidatePath('/crm/contactos')
  return { ok: true }
}

export async function deleteSavedView(id: string): Promise<ActionResult> {
  const user = await requireAuth()
  if (!user.workspaceId) return { ok: false, error: 'No workspace activo' }

  const existing = await db.savedView.findFirst({
    where: { id, workspaceId: user.workspaceId, userId: user.id },
  })
  if (!existing) return { ok: false, error: 'View no encontrada o no es tuya' }

  await db.savedView.delete({ where: { id: existing.id } })

  await audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: 'deleted',
    entityType: 'SavedView',
    entityId: id,
    changes: { before: existing },
  })

  revalidatePath('/crm/contactos')
  return { ok: true }
}
