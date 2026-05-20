'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { audit, diffFields } from '@/lib/audit'
import {
  createBuildingSchema,
  updateBuildingSchema,
  type CreateBuildingInput,
  type UpdateBuildingInput,
} from '@/lib/buildings/schemas'
import { getBuildingById } from '@/lib/buildings/queries'

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

export async function createBuilding(
  input: CreateBuildingInput
): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN')
  if (!user.workspaceId) return { ok: false, error: 'No workspace activo' }

  const parsed = createBuildingSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue?.message ?? 'Datos inválidos', field: issue?.path[0] as string }
  }

  // Confirm the project belongs to the workspace.
  const project = await db.project.findFirst({
    where: { id: parsed.data.projectId, workspaceId: user.workspaceId, deletedAt: null },
    select: { id: true },
  })
  if (!project) return { ok: false, error: 'Proyecto no encontrado en este workspace' }

  const created = await db.building.create({
    data: {
      workspaceId: user.workspaceId,
      projectId: parsed.data.projectId,
      name: parsed.data.name,
      numberOfFloors: parsed.data.numberOfFloors,
      unitsPerFloor: parsed.data.unitsPerFloor,
      description: parsed.data.description ?? null,
      image: parsed.data.image ?? null,
      status: parsed.data.status,
      constructionStage: parsed.data.constructionStage ?? null,
      expectedDeliveryDate: parsed.data.expectedDeliveryDate
        ? new Date(parsed.data.expectedDeliveryDate)
        : null,
    },
  })

  await audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: 'created',
    entityType: 'Building',
    entityId: created.id,
    changes: { after: created },
  })

  revalidatePath('/desarrollo/edificios')
  revalidatePath('/desarrollo/proyectos')
  return { ok: true, data: { id: created.id } }
}

export async function updateBuilding(
  id: string,
  input: UpdateBuildingInput
): Promise<ActionResult> {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN')
  if (!user.workspaceId) return { ok: false, error: 'No workspace activo' }

  const parsed = updateBuildingSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue?.message ?? 'Datos inválidos', field: issue?.path[0] as string }
  }

  const existing = await getBuildingById(id, user.workspaceId)
  if (!existing) return { ok: false, error: 'Edificio no encontrado' }

  const { expectedDeliveryDate, constructionStage, ...rest } = parsed.data
  const updated = await db.building.update({
    where: { id },
    data: {
      ...rest,
      ...(constructionStage !== undefined && { constructionStage: constructionStage ?? null }),
      ...(expectedDeliveryDate !== undefined && {
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
      }),
    },
  })

  await audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: 'updated',
    entityType: 'Building',
    entityId: id,
    changes: diffFields(existing as never, updated as never),
  })

  revalidatePath('/desarrollo/edificios')
  revalidatePath(`/desarrollo/edificios/${id}`)
  return { ok: true }
}

export async function deleteBuilding(id: string): Promise<ActionResult> {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN')
  if (!user.workspaceId) return { ok: false, error: 'No workspace activo' }

  const existing = await getBuildingById(id, user.workspaceId)
  if (!existing) return { ok: false, error: 'Edificio no encontrado' }

  if (existing._count.units > 0) {
    return {
      ok: false,
      error: 'No se puede eliminar: el edificio tiene unidades. Elimínalas o reasígnalas primero.',
    }
  }

  await db.building.delete({ where: { id } })

  await audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: 'deleted',
    entityType: 'Building',
    entityId: id,
    changes: { before: existing },
  })

  revalidatePath('/desarrollo/edificios')
  revalidatePath('/desarrollo/proyectos')
  return { ok: true }
}

/**
 * Duplicate building config (NOT its units — those need explicit generation).
 * Useful when towers in a project share identical layout (Doc 1 §8.4 + extra).
 */
export async function duplicateBuilding(id: string): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN')
  if (!user.workspaceId) return { ok: false, error: 'No workspace activo' }

  const existing = await getBuildingById(id, user.workspaceId)
  if (!existing) return { ok: false, error: 'Edificio no encontrado' }

  const copy = await db.building.create({
    data: {
      workspaceId: user.workspaceId,
      projectId: existing.projectId,
      name: `${existing.name} (copia)`,
      numberOfFloors: existing.numberOfFloors,
      unitsPerFloor: existing.unitsPerFloor,
      description: existing.description,
      image: existing.image,
      status: existing.status,
      constructionStage: existing.constructionStage,
      expectedDeliveryDate: existing.expectedDeliveryDate,
    },
  })

  await audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: 'duplicated',
    entityType: 'Building',
    entityId: copy.id,
    changes: { from: id, after: copy },
  })

  revalidatePath('/desarrollo/edificios')
  return { ok: true, data: { id: copy.id } }
}

export async function createBuildingFromForm(formData: FormData): Promise<ActionResult> {
  const input = {
    projectId: formData.get('projectId'),
    name: formData.get('name'),
    numberOfFloors: formData.get('numberOfFloors'),
    unitsPerFloor: formData.get('unitsPerFloor'),
    description: formData.get('description'),
    image: formData.get('image'),
    status: formData.get('status'),
    constructionStage: formData.get('constructionStage'),
    expectedDeliveryDate: formData.get('expectedDeliveryDate'),
  }
  const result = await createBuilding(input as never)
  if (!result.ok) return result
  if (result.data?.id) redirect(`/desarrollo/edificios/${result.data.id}`)
  return { ok: true }
}
