'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { db } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/auth'
import { audit, diffFields } from '@/lib/audit'
import {
  createProjectSchema,
  updateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
  type ProjectStageInput,
} from '@/lib/projects/schemas'
import { getProjectById } from '@/lib/projects/queries'

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

export async function createProject(
  input: CreateProjectInput
): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN')
  if (!user.workspaceId) return { ok: false, error: 'No workspace activo' }

  const parsed = createProjectSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue?.message ?? 'Datos inválidos', field: issue?.path[0] as string }
  }

  const data = parsed.data

  const created = await db.project.create({
    data: {
      workspaceId: user.workspaceId,
      name: data.name,
      type: data.type,
      location: data.location ?? null,
      address: data.address ?? null,
      province: data.province ?? null,
      city: data.city ?? null,
      sector: data.sector ?? null,
      amenities: data.amenities,
      status: data.status,
      progressPercent: data.progressPercent,
      startDate: data.startDate ? new Date(data.startDate) : null,
      expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null,
      images: data.coverImage ? [data.coverImage] : [],
      hasStages: data.hasStages,
      stdReservationAmount: data.stdReservationAmount ?? null,
      stdInitialPercent: data.stdInitialPercent ?? null,
      stdConstructionPercent: data.stdConstructionPercent ?? null,
      stdFinalPercent: data.stdFinalPercent ?? null,
      ...(data.hasStages && data.stages.length > 0 && {
        stages: {
          create: data.stages.map((s, i) => ({
            workspaceId: user.workspaceId!,
            name: s.name,
            expectedDeliveryDate: s.expectedDeliveryDate ? new Date(s.expectedDeliveryDate) : null,
            order: s.order ?? i,
          })),
        },
      }),
    },
  })

  await audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: 'created',
    entityType: 'Project',
    entityId: created.id,
    changes: { after: created },
  })

  revalidatePath('/desarrollo/proyectos')
  revalidatePath('/desarrollo')
  return { ok: true, data: { id: created.id } }
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput
): Promise<ActionResult> {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN')
  if (!user.workspaceId) return { ok: false, error: 'No workspace activo' }

  const parsed = updateProjectSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue?.message ?? 'Datos inválidos', field: issue?.path[0] as string }
  }

  const existing = await getProjectById(id, user.workspaceId)
  if (!existing) return { ok: false, error: 'Proyecto no encontrado' }

  const { coverImage, startDate, expectedDeliveryDate, amenities, hasStages, stages, ...rest } = parsed.data

  const updated = await db.project.update({
    where: { id },
    data: {
      ...rest,
      ...(amenities !== undefined && { amenities }),
      ...(coverImage !== undefined && { images: coverImage ? [coverImage] : [] }),
      ...(startDate !== undefined && {
        startDate: startDate ? new Date(startDate) : null,
      }),
      ...(expectedDeliveryDate !== undefined && {
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
      }),
      ...(hasStages !== undefined && { hasStages }),
    },
  })

  // Sync stages: replace all existing with the new list
  if (hasStages !== undefined && stages !== undefined) {
    await db.projectStage.deleteMany({ where: { projectId: id } })
    if (hasStages && stages.length > 0) {
      await db.projectStage.createMany({
        data: stages.map((s: ProjectStageInput, i: number) => ({
          workspaceId: user.workspaceId!,
          projectId: id,
          name: s.name,
          expectedDeliveryDate: s.expectedDeliveryDate ? new Date(s.expectedDeliveryDate) : null,
          order: s.order ?? i,
        })),
      })
    }
  }

  await audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: 'updated',
    entityType: 'Project',
    entityId: id,
    changes: diffFields(existing as never, updated as never),
  })

  revalidatePath('/desarrollo/proyectos')
  revalidatePath(`/desarrollo/proyectos/${id}`)
  revalidatePath('/desarrollo')
  return { ok: true }
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN')
  if (!user.workspaceId) return { ok: false, error: 'No workspace activo' }

  const existing = await getProjectById(id, user.workspaceId)
  if (!existing) return { ok: false, error: 'Proyecto no encontrado' }

  if (existing._count.units > 0) {
    return {
      ok: false,
      error: 'No se puede eliminar: el proyecto tiene unidades. Reasígnalas o márcalo como Suspendido.',
    }
  }

  await db.project.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  await audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: 'deleted',
    entityType: 'Project',
    entityId: id,
    changes: { before: existing },
  })

  revalidatePath('/desarrollo/proyectos')
  return { ok: true }
}

/** Anyone with auth can read projects. Used by selectors etc. */
export async function listAllProjectsForSelector() {
  const user = await requireAuth()
  if (!user.workspaceId) return []
  return db.project.findMany({
    where: { workspaceId: user.workspaceId, deletedAt: null },
    select: { id: true, name: true, status: true },
    orderBy: { name: 'asc' },
  })
}
