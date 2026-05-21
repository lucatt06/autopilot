'use server'

import { revalidatePath } from 'next/cache'

import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { computeSectionAmounts, sumPaid } from '@/lib/payment-plans/calc'
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

  const sections = computeSectionAmounts(d)

  // Preserve real payment progress (paidAmount/status) recorded via Cobros by
  // matching installments on type + installmentNumber across the rebuild.
  const prevByKey = new Map(existing.installments.map((i) => [`${i.type}:${i.installmentNumber}`, i]))
  const nextInstallments = d.installments.map((i) => {
    const prev = prevByKey.get(`${i.type}:${i.installmentNumber}`)
    const paidAmount = prev?.paidAmount ?? 0
    return {
      type: i.type,
      installmentNumber: i.installmentNumber,
      label: i.label || null,
      expectedAmount: i.expectedAmount,
      dueDate: toDate(i.dueDate) ?? new Date(),
      locked: i.locked,
      paidAmount,
      status: paidAmount >= i.expectedAmount && paidAmount > 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'pending',
    }
  })
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

  revalidatePath('/desarrollo/planes-pago')
  return { ok: true }
}
