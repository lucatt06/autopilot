import { notFound } from 'next/navigation'

import { db } from '@/lib/db'
import { cn } from '@/lib/utils'
import { PlanDetailView } from '@/components/payment-plans/plan-detail-view'
import { PLAN_STATUS_LABELS, PLAN_STATUS_BADGE, type PlanStatusKey } from '@/lib/payment-plans/schemas'
import { PrintTrigger } from '../_components/print-trigger'

interface PageProps {
  params: { id: string }
  searchParams: { print?: string }
}

export async function generateMetadata({ params }: PageProps) {
  const plan = await db.paymentPlan.findUnique({
    where: { id: params.id },
    select: { name: true },
  })
  return { title: plan ? `${plan.name} · Plan de Pago` : 'Plan de Pago' }
}

export default async function PublicPlanPage({ params, searchParams }: PageProps) {
  const plan = await db.paymentPlan.findUnique({
    where: { id: params.id },
    include: {
      project: { select: { name: true } },
      workspace: { select: { name: true } },
      customer: { select: { Contact: { select: { firstName: true, lastName: true }, take: 1 } } },
      installments: { orderBy: [{ type: 'asc' }, { installmentNumber: 'asc' }] },
    },
  })

  if (!plan) return notFound()

  const autoPrint = searchParams.print === '1'
  const statusKey = plan.status as PlanStatusKey
  const customerName = plan.customer?.Contact[0]
    ? `${plan.customer.Contact[0].firstName} ${plan.customer.Contact[0].lastName}`.trim()
    : null

  return (
    <>
      {autoPrint && <PrintTrigger />}

      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="mx-auto max-w-4xl px-6 py-8 print:px-2 print:py-2">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between border-b pb-4">
          <div>
            {plan.workspace?.name && (
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {plan.workspace.name}
              </p>
            )}
            <h1 className="mt-1 text-2xl font-bold tracking-tight">{plan.name}</h1>
            <p className="text-sm text-muted-foreground">
              Detalles del plan de financiamiento{plan.project ? ` · ${plan.project.name}` : ''}
            </p>
          </div>
          <span className={cn('mt-1 inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold', PLAN_STATUS_BADGE[statusKey])}>
            {PLAN_STATUS_LABELS[statusKey] ?? plan.status}
          </span>
        </div>

        <PlanDetailView
          plan={{
            id: plan.id,
            name: plan.name,
            status: plan.status,
            currency: plan.currency,
            projectName: plan.project?.name ?? null,
            customerName,
            workspaceName: plan.workspace?.name ?? null,
            deliveryDate: plan.deliveryDate,
            createdAt: plan.createdAt,
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
            installments: plan.installments.map((i) => ({
              id: i.id,
              type: i.type,
              installmentNumber: i.installmentNumber,
              label: i.label,
              expectedAmount: i.expectedAmount,
              paidAmount: i.paidAmount,
              dueDate: i.dueDate,
              status: i.status,
            })),
          }}
        />

        {/* Footer */}
        <div className="mt-8 border-t pt-4 text-center text-xs text-muted-foreground no-print">
          Este enlace siempre muestra la versión más reciente del plan de pago.
        </div>
      </div>
    </>
  )
}
