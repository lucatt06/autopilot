'use server'

import { revalidatePath } from 'next/cache'

import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { audit, diffFields } from '@/lib/audit'
import {
  createUnitSchema,
  updateUnitSchema,
  generateUnitsSchema,
  type CreateUnitInput,
  type UpdateUnitInput,
  type GenerateUnitsInput,
} from '@/lib/units/schemas'
import { getUnitById } from '@/lib/units/queries'

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

export async function createUnit(input: CreateUnitInput): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN')
  if (!user.workspaceId) return { ok: false, error: 'No workspace activo' }

  const parsed = createUnitSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue?.message ?? 'Datos inválidos', field: issue?.path[0] as string }
  }

  const building = await db.building.findFirst({
    where: { id: parsed.data.buildingId, workspaceId: user.workspaceId },
    select: { id: true, projectId: true },
  })
  if (!building) return { ok: false, error: 'Edificio no encontrado' }

  const created = await db.unit.create({
    data: {
      workspaceId: user.workspaceId,
      projectId: building.projectId,
      buildingId: parsed.data.buildingId,
      unitNumber: parsed.data.unitNumber,
      floor: parsed.data.floor,
      type: parsed.data.type,
      bedrooms: parsed.data.bedrooms ?? 0,
      bathrooms: parsed.data.bathrooms ?? 0,
      squareMeters: parsed.data.squareMeters,
      terraceSquareMeters: parsed.data.terraceSquareMeters ?? null,
      basePrice: parsed.data.basePrice,
      currentPrice: parsed.data.currentPrice,
      view: parsed.data.view ?? null,
      orientation: parsed.data.orientation ?? null,
      status: parsed.data.status ?? 'DISPONIBLE',
      internalNotes: parsed.data.internalNotes ?? null,
      floorPlan: parsed.data.floorPlan || null,
    },
  })

  await audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: 'created',
    entityType: 'Unit',
    entityId: created.id,
    changes: { after: created },
  })

  revalidatePath('/desarrollo/unidades')
  revalidatePath(`/desarrollo/edificios/${parsed.data.buildingId}`)
  return { ok: true, data: { id: created.id } }
}

export async function updateUnit(id: string, input: UpdateUnitInput): Promise<ActionResult> {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN')
  if (!user.workspaceId) return { ok: false, error: 'No workspace activo' }

  const parsed = updateUnitSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue?.message ?? 'Datos inválidos', field: issue?.path[0] as string }
  }

  const existing = await getUnitById(id, user.workspaceId)
  if (!existing) return { ok: false, error: 'Unidad no encontrada' }

  const { floorPlan, ...rest } = parsed.data
  const updated = await db.unit.update({
    where: { id },
    data: {
      ...rest,
      ...(floorPlan !== undefined && { floorPlan: floorPlan || null }),
    },
  })

  await audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: 'updated',
    entityType: 'Unit',
    entityId: id,
    changes: diffFields(existing as never, updated as never),
  })

  revalidatePath('/desarrollo/unidades')
  revalidatePath(`/desarrollo/unidades/${id}`)
  revalidatePath(`/desarrollo/edificios/${existing.buildingId}`)
  return { ok: true }
}

export async function deleteUnit(id: string): Promise<ActionResult> {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN')
  if (!user.workspaceId) return { ok: false, error: 'No workspace activo' }

  const existing = await getUnitById(id, user.workspaceId)
  if (!existing) return { ok: false, error: 'Unidad no encontrada' }

  const hasActivity = await db.unit.findFirst({
    where: { id },
    select: {
      _count: { select: { blocks: true, reservations: true, sales: true } },
    },
  })
  if (
    hasActivity &&
    (hasActivity._count.blocks > 0 || hasActivity._count.reservations > 0 || hasActivity._count.sales > 0)
  ) {
    return { ok: false, error: 'No se puede eliminar: la unidad tiene movimientos registrados.' }
  }

  await db.unit.delete({ where: { id } })

  await audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: 'deleted',
    entityType: 'Unit',
    entityId: id,
    changes: { before: existing },
  })

  revalidatePath('/desarrollo/unidades')
  revalidatePath(`/desarrollo/edificios/${existing.buildingId}`)
  return { ok: true }
}

/**
 * Bulk-generate units for a building across a range of floors.
 * Skips unit numbers that already exist (idempotent).
 */
export async function generateUnits(input: GenerateUnitsInput): Promise<ActionResult<{ created: number }>> {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN')
  if (!user.workspaceId) return { ok: false, error: 'No workspace activo' }

  const parsed = generateUnitsSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue?.message ?? 'Datos inválidos' }
  }

  const { buildingId, floorStart, floorEnd, unitsPerFloor, type, bedrooms, bathrooms, squareMeters, basePrice, numberingStyle } = parsed.data

  if (floorEnd < floorStart) return { ok: false, error: 'Piso final debe ser >= piso inicial' }

  const building = await db.building.findFirst({
    where: { id: buildingId, workspaceId: user.workspaceId },
    select: { id: true, projectId: true, name: true },
  })
  if (!building) return { ok: false, error: 'Edificio no encontrado' }

  // Gather existing unit numbers to avoid duplication
  const existing = await db.unit.findMany({
    where: { buildingId, workspaceId: user.workspaceId },
    select: { unitNumber: true },
  })
  const existingNums = new Set(existing.map((u) => u.unitNumber))

  const toCreate: {
    workspaceId: string; projectId: string; buildingId: string; unitNumber: string
    floor: number; type: string; bedrooms: number; bathrooms: number
    squareMeters: number; basePrice: number; currentPrice: number; status: 'DISPONIBLE'
  }[] = []
  let seq = 1

  for (let floor = floorStart; floor <= floorEnd; floor++) {
    for (let pos = 1; pos <= unitsPerFloor; pos++) {
      let unitNumber: string
      if (numberingStyle === 'floor_letter') {
        const letter = String.fromCharCode(64 + pos) // A, B, C...
        unitNumber = `${floor}${letter}`
      } else if (numberingStyle === 'floor_number') {
        unitNumber = `${floor}${String(pos).padStart(2, '0')}`
      } else {
        unitNumber = String(seq)
      }
      seq++

      if (existingNums.has(unitNumber)) continue

      toCreate.push({
        workspaceId: user.workspaceId,
        projectId: building.projectId,
        buildingId,
        unitNumber,
        floor,
        type,
        bedrooms: bedrooms ?? 0,
        bathrooms: bathrooms ?? 0,
        squareMeters,
        basePrice,
        currentPrice: basePrice,
        status: 'DISPONIBLE' as const,
      })
    }
  }

  if (toCreate.length === 0) return { ok: true, data: { created: 0 } }

  await db.unit.createMany({ data: toCreate })

  await audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: 'bulk_generated',
    entityType: 'Unit',
    entityId: buildingId,
    changes: { count: toCreate.length, buildingId, buildingName: building.name },
  })

  revalidatePath('/desarrollo/unidades')
  revalidatePath(`/desarrollo/edificios/${buildingId}`)
  revalidatePath('/desarrollo/proyectos')
  return { ok: true, data: { created: toCreate.length } }
}
