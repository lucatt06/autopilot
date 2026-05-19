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
      status: data.status,
      progressPercent: data.progressPercent,
      startDate: data.startDate ? new Date(data.startDate) : null,
      expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null,
      images: data.coverImage ? [data.coverImage] : [],
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

  const { coverImage, startDate, expectedDeliveryDate, ...rest } = parsed.data

  const updated = await db.project.update({
    where: { id },
    data: {
      ...rest,
      ...(coverImage !== undefined && { images: coverImage ? [coverImage] : [] }),
      ...(startDate !== undefined && {
        startDate: startDate ? new Date(startDate) : null,
      }),
      ...(expectedDeliveryDate !== undefined && {
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
      }),
    },
  })

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

  // Block delete if the project has units already (safer; admin should reassign first)
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

/**
 * Convenience used by the "Nuevo proyecto" form.
 */
export async function createProjectFromForm(formData: FormData): Promise<ActionResult> {
  const input = {
    name: formData.get('name'),
    type: formData.get('type'),
    location: formData.get('location'),
    address: formData.get('address'),
    status: formData.get('status'),
    progressPercent: formData.get('progressPercent'),
    startDate: formData.get('startDate'),
    expectedDeliveryDate: formData.get('expectedDeliveryDate'),
    coverImage: formData.get('coverImage'),
  }
  const result = await createProject(input as never)
  if (!result.ok) return result
  if (result.data?.id) redirect(`/desarrollo/proyectos/${result.data.id}`)
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
