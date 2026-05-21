'use server'

import { revalidatePath } from 'next/cache'

import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { computeSectionAmounts, reconcileInstallments, sumPaid } from '@/lib/payment-plans/calc'
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

  const sections = computeSectionAmounts(d)

  const plan = await db.paymentPlan.create({
    data: {
      workspaceId: user.workspaceId,
      name: d.name,
      projectId: d.projectId ?? null,
      customerId: d.customerId ?? null,
      saleId: d.saleId ?? null,
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
