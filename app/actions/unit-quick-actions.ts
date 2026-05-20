'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

// ─────────────────────────────────────────────
// Contacts
// ─────────────────────────────────────────────

/** Search contacts whose current pipeline stage is marked isWon=true */
export async function searchWonContacts(query: string) {
  const user = await requireAuth()
  if (!user.workspaceId) return []

  // Find all won stages in this workspace
  const wonStages = await db.pipelineStage.findMany({
    where: { pipeline: { workspaceId: user.workspaceId }, isWon: true },
    select: { id: true },
  })
  const wonStageIds = wonStages.map((s) => s.id)

  const q = query.trim()

  return db.contact.findMany({
    where: {
      workspaceId: user.workspaceId,
      deletedAt: null,
      ...(wonStageIds.length > 0
        ? { currentStageId: { in: wonStageIds } }
        : {}),
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { mobilePhone: { contains: q } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      mobilePhone: true,
      email: true,
    },
    orderBy: { firstName: 'asc' },
    take: 15,
  })
}

const quickContactSchema = z.object({
  firstName: z.string().min(1, 'Requerido'),
  lastName: z.string().min(1, 'Requerido'),
  mobilePhone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
})

/** Create a minimal contact and immediately mark it as won in the CRM */
export async function createQuickContact(
  input: z.infer<typeof quickContactSchema>,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuth()
  if (!user.workspaceId) return { ok: false, error: 'Sin workspace activo' }

  const parsed = quickContactSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  // Find a won stage to move the contact to
  const wonStage = await db.pipelineStage.findFirst({
    where: { pipeline: { workspaceId: user.workspaceId }, isWon: true },
    select: { id: true },
  })

  const contact = await db.contact.create({
    data: {
      workspaceId: user.workspaceId,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      mobilePhone: parsed.data.mobilePhone || null,
      email: parsed.data.email || null,
      contactType: 'CLIENTE',
      currentStageId: wonStage?.id ?? null,
      ownerId: user.id,
      createdById: user.id,
    },
    select: { id: true },
  })

  return { ok: true, data: { id: contact.id } }
}

// ─────────────────────────────────────────────
// Block
// ─────────────────────────────────────────────

const DURATION_HOURS: Record<string, number> = {
  '24h': 24,
  '48h': 48,
  '72h': 72,
  '1w': 168,
  '2w': 336,
}

const blockSchema = z.object({
  unitId: z.string(),
  contactId: z.string().optional(),
  reason: z.enum([
    'CLIENTE_EVALUANDO',
    'PENDIENTE_DOCUMENTOS',
    'PENDIENTE_CREDITO',
    'NEGOCIACION_PRECIO',
    'OTRO',
  ]),
  duration: z.enum(['24h', '48h', '72h', '1w', '2w']),
  notes: z.string().optional(),
})

export async function createBlock(
  input: z.infer<typeof blockSchema>,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuth()
  if (!user.workspaceId) return { ok: false, error: 'Sin workspace activo' }

  const parsed = blockSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const { unitId, contactId, reason, duration, notes } = parsed.data

  const unit = await db.unit.findFirst({
    where: { id: unitId, workspaceId: user.workspaceId },
  })
  if (!unit) return { ok: false, error: 'Unidad no encontrada' }
  if (unit.status !== 'DISPONIBLE') {
    return { ok: false, error: 'La unidad ya no está disponible' }
  }

  const hours = DURATION_HOURS[duration]!
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000)

  const block = await db.$transaction(async (tx) => {
    const b = await tx.block.create({
      data: {
        workspaceId: user.workspaceId!,
        unitId,
        contactId: contactId ?? null,
        reason,
        responsibleUserId: user.id,
        expiresAt,
        notes: notes || null,
      },
      select: { id: true },
    })
    await tx.unit.update({
      where: { id: unitId },
      data: { status: 'BLOQUEADA' },
    })
    return b
  })

  revalidatePath('/desarrollo/disponibilidad')
  revalidatePath('/desarrollo/unidades')
  return { ok: true, data: { id: block.id } }
}

// ─────────────────────────────────────────────
// Reservation
// ─────────────────────────────────────────────

const reservationSchema = z.object({
  unitId: z.string(),
  contactId: z.string().min(1, 'Selecciona un cliente'),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  expiresAt: z.string().min(1, 'Selecciona fecha de vencimiento'),
  notes: z.string().optional(),
})

export async function createReservation(
  input: z.infer<typeof reservationSchema>,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuth()
  if (!user.workspaceId) return { ok: false, error: 'Sin workspace activo' }

  const parsed = reservationSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const { unitId, contactId, amount, expiresAt, notes } = parsed.data

  const unit = await db.unit.findFirst({
    where: { id: unitId, workspaceId: user.workspaceId },
  })
  if (!unit) return { ok: false, error: 'Unidad no encontrada' }
  if (unit.status !== 'DISPONIBLE' && unit.status !== 'BLOQUEADA') {
    return { ok: false, error: 'La unidad no está disponible para reservar' }
  }

  const reservation = await db.$transaction(async (tx) => {
    // If unit is blocked, mark the active block as converted
    if (unit.status === 'BLOQUEADA') {
      await tx.block.updateMany({
        where: { unitId, status: 'ACTIVE' },
        data: { status: 'CONVERTED_TO_RESERVATION' },
      })
    }
    const r = await tx.reservation.create({
      data: {
        workspaceId: user.workspaceId!,
        unitId,
        contactId,
        amount,
        paymentDate: new Date(),
        expiresAt: new Date(expiresAt),
        soldBy: 'ASESOR_INTERNO',
        asesorUserId: user.id,
        notes: notes || null,
      },
      select: { id: true },
    })
    await tx.unit.update({
      where: { id: unitId },
      data: { status: 'RESERVADA' },
    })
    return r
  })

  revalidatePath('/desarrollo/disponibilidad')
  revalidatePath('/desarrollo/unidades')
  return { ok: true, data: { id: reservation.id } }
}

// ─────────────────────────────────────────────
// Sale
// ─────────────────────────────────────────────

const saleSchema = z.object({
  unitId: z.string(),
  contactId: z.string().min(1, 'Selecciona un cliente'),
  finalPrice: z.number().positive('El precio debe ser mayor a 0'),
  closeDate: z.string().min(1, 'Selecciona fecha de cierre'),
  notes: z.string().optional(),
})

export async function createSale(
  input: z.infer<typeof saleSchema>,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuth()
  if (!user.workspaceId) return { ok: false, error: 'Sin workspace activo' }

  const parsed = saleSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const { unitId, contactId, finalPrice, closeDate, notes } = parsed.data

  const unit = await db.unit.findFirst({
    where: { id: unitId, workspaceId: user.workspaceId },
  })
  if (!unit) return { ok: false, error: 'Unidad no encontrada' }
  if (unit.status === 'VENDIDA' || unit.status === 'ENTREGADA') {
    return { ok: false, error: 'La unidad ya está vendida' }
  }

  // Find won stage for CRM update
  const wonStage = await db.pipelineStage.findFirst({
    where: { pipeline: { workspaceId: user.workspaceId }, isWon: true },
    select: { id: true },
  })

  const sale = await db.$transaction(async (tx) => {
    // Convert active reservation if any
    if (unit.status === 'RESERVADA') {
      await tx.reservation.updateMany({
        where: { unitId, status: 'ACTIVE' },
        data: { status: 'CONVERTED_TO_SALE' },
      })
    }

    const s = await tx.sale.create({
      data: {
        workspaceId: user.workspaceId!,
        unitId,
        contactId,
        finalPrice,
        closeDate: new Date(closeDate),
        soldBy: 'ASESOR_INTERNO',
        asesorUserId: user.id,
        hardOwner: 'COMPANIA',
        notes: notes || null,
      },
      select: { id: true },
    })

    // Mark unit as sold
    await tx.unit.update({
      where: { id: unitId },
      data: { status: 'VENDIDA' },
    })

    // Move contact to won stage in CRM
    if (wonStage) {
      await tx.contact.update({
        where: { id: contactId },
        data: { currentStageId: wonStage.id },
      })
    }

    // Create Customer record (ignore if contact already has one)
    try {
      await tx.customer.create({
        data: {
          workspaceId: user.workspaceId!,
          contactId,
          saleId: s.id,
          status: 'IN_PROCESS',
          portalEnabled: false,
        },
      })
    } catch {
      // contact already has a customer record — acceptable
    }

    return s
  })

  revalidatePath('/desarrollo/disponibilidad')
  revalidatePath('/desarrollo/unidades')
  revalidatePath('/desarrollo/ventas')
  return { ok: true, data: { id: sale.id } }
}
