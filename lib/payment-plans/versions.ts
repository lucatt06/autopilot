import 'server-only'

import type { Prisma, PrismaClient } from '@prisma/client'

import { db } from '@/lib/db'

type Tx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

// Shape of a stored snapshot. Kept self-contained so a version can be both
// rendered (PlanDetailView) and restored (rebuild the update payload).
export interface PlanSnapshot {
  name: string
  projectId: string | null
  projectName: string | null
  customerId: string | null
  customerName: string | null
  unitId: string | null
  saleId: string | null
  currency: string
  status: string
  deliveryDate: string | null
  notes: string | null
  totalPrice: number
  totalPaid: number
  reservationAmount: number
  initialAmount: number
  constructionAmount: number
  finalAmount: number
  initialPercent: number
  constructionPercent: number
  finalPercent: number
  constructionInstallmentsCount: number
  constructionPeriodicityMonths: number
  constructionMode: string
  installments: {
    type: string
    installmentNumber: number
    label: string | null
    expectedAmount: number
    dueDate: string
    locked: boolean
    paidAmount: number
    status: string
  }[]
}

/**
 * Read the current full state of a plan and write it as a new immutable version
 * row. Call after every save (create / update / restore). Safe inside a tx.
 */
export async function snapshotPaymentPlan(
  planId: string,
  workspaceId: string,
  userId: string | null,
  tx: Tx = db,
): Promise<void> {
  const plan = await tx.paymentPlan.findFirst({
    where: { id: planId, workspaceId },
    include: {
      project: { select: { name: true } },
      customer: { select: { Contact: { select: { firstName: true, lastName: true }, take: 1 } } },
      installments: { orderBy: [{ type: 'asc' }, { installmentNumber: 'asc' }] },
    },
  })
  if (!plan) return

  const customerName = plan.customer?.Contact[0]
    ? `${plan.customer.Contact[0].firstName} ${plan.customer.Contact[0].lastName}`.trim()
    : null

  const snapshot: PlanSnapshot = {
    name: plan.name,
    projectId: plan.projectId,
    projectName: plan.project?.name ?? null,
    customerId: plan.customerId,
    customerName,
    unitId: plan.unitId,
    saleId: plan.saleId,
    currency: plan.currency,
    status: plan.status,
    deliveryDate: plan.deliveryDate ? plan.deliveryDate.toISOString() : null,
    notes: plan.notes,
    totalPrice: plan.totalPrice,
    totalPaid: plan.totalPaid,
    reservationAmount: plan.reservationAmount,
    initialAmount: plan.initialAmount,
    constructionAmount: plan.constructionAmount,
    finalAmount: plan.finalAmount,
    initialPercent: plan.initialPercent,
    constructionPercent: plan.constructionPercent,
    finalPercent: plan.finalPercent,
    constructionInstallmentsCount: plan.constructionInstallmentsCount,
    constructionPeriodicityMonths: plan.constructionPeriodicityMonths,
    constructionMode: plan.constructionMode,
    installments: plan.installments.map((i) => ({
      type: i.type,
      installmentNumber: i.installmentNumber,
      label: i.label,
      expectedAmount: i.expectedAmount,
      dueDate: i.dueDate.toISOString(),
      locked: i.locked,
      paidAmount: i.paidAmount,
      status: i.status,
    })),
  }

  const last = await tx.paymentPlanVersion.findFirst({
    where: { paymentPlanId: planId },
    orderBy: { versionNumber: 'desc' },
    select: { versionNumber: true },
  })
  const versionNumber = (last?.versionNumber ?? 0) + 1

  await tx.paymentPlanVersion.create({
    data: {
      workspaceId,
      paymentPlanId: planId,
      versionNumber,
      snapshot: snapshot as unknown as Prisma.InputJsonValue,
      createdById: userId,
    },
  })
}
