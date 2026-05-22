'use server'

import { revalidatePath } from 'next/cache'

import { db } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { syncMentions } from '@/lib/mentions/sync'
import { computeSectionAmounts, reconcileInstallments, sumPaid } from '@/lib/payment-plans/calc'
import { snapshotPaymentPlan, type PlanSnapshot } from '@/lib/payment-plans/versions'
import {
  createPaymentPlanSchema,
  updatePaymentPlanSchema,
  type CreatePaymentPlanInput,
  type UpdatePaymentPlanInput,
} from '@/lib/payment-plans/schemas'

export type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string }

function toDate(value?: string): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

// ─── Create ─────────────────────────────────────────────────────────────────────

export async function createPaymentPlan(
  input: CreatePaymentPlanInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN')
  if (!user.workspaceId) return { ok: false, error: 'Sin workspace activo' }

  const parsed = createPaymentPlanSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }
  const d = parsed.data

  // Validate optional links belong to the workspace
  if (d.projectId) {
    const project = await db.project.findFirst({ where: { id: d.projectId, workspaceId: user.workspaceId } })
    if (!project) return { ok: false, error: 'Proyecto no encontrado' }
  }
  if (d.customerId) {
    const customer = await db.customer.findFirst({ where: { id: d.customerId, workspaceId: user.workspaceId } })
    if (!customer) return { ok: false, error: 'Cliente no encontrado' }
  }
  if (d.saleId) {
    const sale = await db.sale.findFirst({ where: { id: d.saleId, workspaceId: user.workspaceId } })
    if (!sale) return { ok: false, error: 'Venta no encontrada' }
  }
  if (d.unitId) {
    const unit = await db.unit.findFirst({ where: { id: d.unitId, workspaceId: user.workspaceId } })
    if (!unit) return { ok: false, error: 'Unidad no encontrada' }
  }

  const sections = computeSectionAmounts(d)

  const plan = await db.paymentPlan.create({
    data: {
      workspaceId: user.workspaceId,
      createdById: user.id,
      name: d.name,
      projectId: d.projectId ?? null,
      customerId: d.customerId ?? null,
      saleId: d.saleId ?? null,
      unitId: d.unitId ?? null,
      currency: d.currency,
      status: d.status,
      deliveryDate: toDate(d.deliveryDate),
      notes: d.notes || null,
      totalPrice: d.totalPrice,
      totalPaid: 0,
      reservationAmount: d.reservationAmount,
      initialAmount: sections.initialAmount,
      constructionAmount: sections.constructionAmount,
      finalAmount: sections.finalAmount,
      initialPercent: d.initialPercent,
      constructionPercent: d.constructionPercent,
      finalPercent: d.finalPercent,
      constructionInstallmentsCount: d.constructionInstallmentsCount,
      constructionPeriodicityMonths: d.constructionPeriodicityMonths,
      constructionMode: d.constructionMode,
      installments: {
        create: d.installments.map((i) => ({
          type: i.type,
          installmentNumber: i.installmentNumber,
          label: i.label || null,
          expectedAmount: i.expectedAmount,
          dueDate: toDate(i.dueDate) ?? new Date(),
          locked: i.locked,
        })),
      },
    },
    select: { id: true },
  })

  await audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: 'create',
    entityType: 'PaymentPlan',
    entityId: plan.id,
    changes: { name: d.name, totalPrice: d.totalPrice, status: d.status },
  })

  // Save the initial version snapshot
  await snapshotPaymentPlan(plan.id, user.workspaceId, user.id)

  await syncMentions({
    workspaceId: user.workspaceId,
    authorId: user.id,
    entityType: 'payment_plan',
    entityId: plan.id,
    link: `/desarrollo/planes-pago/${plan.id}/editar`,
    text: d.notes,
    notificationTitle: `Te mencionaron en el plan «${d.name}»`,
  })

  revalidatePath('/desarrollo/planes-pago')
  return { ok: true, data: { id: plan.id } }
}

// ─── Update ─────────────────────────────────────────────────────────────────────

export async function updatePaymentPlan(
  id: string,
  input: UpdatePaymentPlanInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN')
  if (!user.workspaceId) return { ok: false, error: 'Sin workspace activo' }

  const existing = await db.paymentPlan.findFirst({
    where: { id, workspaceId: user.workspaceId },
    include: { installments: true },
  })
  if (!existing) return { ok: false, error: 'Plan no encontrado' }

  const parsed = updatePaymentPlanSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }
  const d = parsed.data

  if (d.projectId) {
    const project = await db.project.findFirst({ where: { id: d.projectId, workspaceId: user.workspaceId } })
    if (!project) return { ok: false, error: 'Proyecto no encontrado' }
  }
  if (d.customerId) {
    const customer = await db.customer.findFirst({ where: { id: d.customerId, workspaceId: user.workspaceId } })
    if (!customer) return { ok: false, error: 'Cliente no encontrado' }
  }
  if (d.saleId) {
    const sale = await db.sale.findFirst({ where: { id: d.saleId, workspaceId: user.workspaceId } })
    if (!sale) return { ok: false, error: 'Venta no encontrada' }
  }
  if (d.unitId) {
    const unit = await db.unit.findFirst({ where: { id: d.unitId, workspaceId: user.workspaceId } })
    if (!unit) return { ok: false, error: 'Unidad no encontrada' }
  }

  const sections = computeSectionAmounts(d)

  // Preserve real payment progress (paidAmount/status) recorded via Cobros by
  // matching installments on STABLE id — never positional installmentNumber,
  // which is reassigned/reordered on every save (would corrupt financial data).
  const reconciled = reconcileInstallments(
    d.installments.map((i) => ({
      id: i.id,
      type: i.type,
      installmentNumber: i.installmentNumber,
      label: i.label || null,
      expectedAmount: i.expectedAmount,
      dueDate: toDate(i.dueDate) ?? new Date(),
      locked: i.locked,
    })),
    existing.installments.map((i) => ({ id: i.id, paidAmount: i.paidAmount })),
  )
  const nextInstallments = reconciled.map(({ id: _id, ...rest }) => rest)
  const totalPaid = sumPaid(nextInstallments)

  await db.$transaction(async (tx) => {
    await tx.paymentInstallment.deleteMany({ where: { paymentPlanId: id } })
    await tx.paymentPlan.update({
      where: { id },
      data: {
        name: d.name,
        projectId: d.projectId ?? null,
        customerId: d.customerId ?? null,
        saleId: d.saleId ?? existing.saleId,
        unitId: d.unitId ?? null,
        currency: d.currency,
        status: d.status,
        deliveryDate: toDate(d.deliveryDate),
        notes: d.notes || null,
        totalPrice: d.totalPrice,
        totalPaid,
        reservationAmount: d.reservationAmount,
        initialAmount: sections.initialAmount,
        constructionAmount: sections.constructionAmount,
        finalAmount: sections.finalAmount,
        initialPercent: d.initialPercent,
        constructionPercent: d.constructionPercent,
        finalPercent: d.finalPercent,
        constructionInstallmentsCount: d.constructionInstallmentsCount,
        constructionPeriodicityMonths: d.constructionPeriodicityMonths,
        constructionMode: d.constructionMode,
        installments: { create: nextInstallments },
      },
    })
  })

  await audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: 'update',
    entityType: 'PaymentPlan',
    entityId: id,
    changes: { name: d.name, totalPrice: d.totalPrice, status: d.status },
  })

  // Save a new version snapshot of the updated plan
  await snapshotPaymentPlan(id, user.workspaceId, user.id)

  await syncMentions({
    workspaceId: user.workspaceId,
    authorId: user.id,
    entityType: 'payment_plan',
    entityId: id,
    link: `/desarrollo/planes-pago/${id}/editar`,
    text: d.notes,
    notificationTitle: `Te mencionaron en el plan «${d.name}»`,
  })

  revalidatePath('/desarrollo/planes-pago')
  revalidatePath(`/desarrollo/planes-pago/${id}/editar`)
  return { ok: true, data: { id } }
}

// ─── Delete ─────────────────────────────────────────────────────────────────────

export async function deletePaymentPlan(id: string): Promise<ActionResult> {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN')
  if (!user.workspaceId) return { ok: false, error: 'Sin workspace activo' }

  const existing = await db.paymentPlan.findFirst({ where: { id, workspaceId: user.workspaceId } })
  if (!existing) return { ok: false, error: 'Plan no encontrado' }

  // Block deletion of plans tied to a sale (financial record of record).
  if (existing.saleId) {
    return { ok: false, error: 'No se puede eliminar un plan vinculado a una venta' }
  }

  await db.$transaction(async (tx) => {
    await tx.paymentInstallment.deleteMany({ where: { paymentPlanId: id } })
    await tx.paymentPlan.delete({ where: { id } })
  })

  await audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: 'delete',
    entityType: 'PaymentPlan',
    entityId: id,
    changes: { name: existing.name },
  })

  revalidatePath('/desarrollo/planes-pago')
  return { ok: true }
}

// ─── Version history ──────────────────────────────────────────────────────────

export interface PlanVersionListItem {
  id: string
  versionNumber: number
  createdAt: string
  createdByName: string | null
  snapshot: PlanSnapshot
}

/** List all saved versions of a plan (newest first), scoped to the workspace. */
export async function getPaymentPlanVersions(planId: string): Promise<PlanVersionListItem[]> {
  const user = await requireAuth()
  if (!user.workspaceId) return []

  // Verify the plan belongs to the caller's workspace
  const plan = await db.paymentPlan.findFirst({ where: { id: planId, workspaceId: user.workspaceId }, select: { id: true } })
  if (!plan) return []

  const versions = await db.paymentPlanVersion.findMany({
    where: { paymentPlanId: planId, workspaceId: user.workspaceId },
    orderBy: { versionNumber: 'desc' },
    include: { createdBy: { select: { firstName: true, lastName: true } } },
  })

  return versions.map((v) => ({
    id: v.id,
    versionNumber: v.versionNumber,
    createdAt: v.createdAt.toISOString(),
    createdByName: v.createdBy ? `${v.createdBy.firstName} ${v.createdBy.lastName}`.trim() : null,
    snapshot: v.snapshot as unknown as PlanSnapshot,
  }))
}

/** Restore a plan to a previous version. The restore is itself recorded as a new version. */
export async function restorePaymentPlanVersion(planId: string, versionId: string): Promise<ActionResult> {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN')
  if (!user.workspaceId) return { ok: false, error: 'Sin workspace activo' }

  const plan = await db.paymentPlan.findFirst({ where: { id: planId, workspaceId: user.workspaceId } })
  if (!plan) return { ok: false, error: 'Plan no encontrado' }

  const version = await db.paymentPlanVersion.findFirst({
    where: { id: versionId, paymentPlanId: planId, workspaceId: user.workspaceId },
  })
  if (!version) return { ok: false, error: 'Versión no encontrada' }

  const snap = version.snapshot as unknown as PlanSnapshot

  await db.$transaction(async (tx) => {
    await tx.paymentInstallment.deleteMany({ where: { paymentPlanId: planId } })
    await tx.paymentPlan.update({
      where: { id: planId },
      data: {
        name: snap.name,
        projectId: snap.projectId,
        customerId: snap.customerId,
        unitId: snap.unitId,
        currency: snap.currency,
        status: snap.status as never,
        deliveryDate: snap.deliveryDate ? new Date(snap.deliveryDate) : null,
        notes: snap.notes,
        totalPrice: snap.totalPrice,
        totalPaid: snap.totalPaid,
        reservationAmount: snap.reservationAmount,
        initialAmount: snap.initialAmount,
        constructionAmount: snap.constructionAmount,
        finalAmount: snap.finalAmount,
        initialPercent: snap.initialPercent,
        constructionPercent: snap.constructionPercent,
        finalPercent: snap.finalPercent,
        constructionInstallmentsCount: snap.constructionInstallmentsCount,
        constructionPeriodicityMonths: snap.constructionPeriodicityMonths,
        constructionMode: snap.constructionMode,
        installments: {
          create: snap.installments.map((i) => ({
            type: i.type as never,
            installmentNumber: i.installmentNumber,
            label: i.label,
            expectedAmount: i.expectedAmount,
            dueDate: new Date(i.dueDate),
            locked: i.locked,
            paidAmount: i.paidAmount,
            status: i.status,
          })),
        },
      },
    })
  })

  await audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: 'update',
    entityType: 'PaymentPlan',
    entityId: planId,
    changes: { restoredFromVersion: version.versionNumber },
  })

  // The restore becomes a new saved version
  await snapshotPaymentPlan(planId, user.workspaceId, user.id)

  revalidatePath('/desarrollo/planes-pago')
  revalidatePath(`/desarrollo/planes-pago/${planId}`)
  revalidatePath(`/desarrollo/planes-pago/${planId}/editar`)
  return { ok: true }
}
