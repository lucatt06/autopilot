import { notFound } from 'next/navigation'

import { BackButton } from '@/components/ui/back-button'
import { Card, CardContent } from '@/components/ui/card'
import { PlanDetailView } from '@/components/payment-plans/plan-detail-view'
import { requireAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { getPaymentPlanById } from '@/lib/payment-plans/queries'
import { PLAN_STATUS_LABELS, PLAN_STATUS_BADGE, type PlanStatusKey } from '@/lib/payment-plans/schemas'
import { PlanViewActions } from '../_components/plan-view-actions'

interface PageProps {
  params: { id: string }
}

export const metadata = { title: 'Ver Plan de Pago · Autopilot' }

export default async function VerPlanPage({ params }: PageProps) {
  const user = await requireAuth()
  if (!user.workspaceId) return notFound()

  const plan = await getPaymentPlanById(params.id, user.workspaceId)
  if (!plan) return notFound()

  const canManage = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'
  const statusKey = plan.status as PlanStatusKey

  const customerName = plan.customer?.Contact[0]
    ? `${plan.customer.Contact[0].firstName} ${plan.customer.Contact[0].lastName}`.trim()
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BackButton />
        <div className="flex flex-1 items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{plan.name}</h1>
            <p className="text-sm text-muted-foreground">Detalles del plan de financiamiento</p>
          </div>
          <span className={cn('mt-1 inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold', PLAN_STATUS_BADGE[statusKey])}>
            {PLAN_STATUS_LABELS[statusKey] ?? plan.status}
          </span>
        </div>
      </div>

      <Card className="max-w-4xl">
        <CardContent className="pt-6">
          <PlanDetailView
            plan={{
              id: plan.id,
              name: plan.name,
              status: plan.status,
              currency: plan.currency,
              projectName: plan.project?.name ?? null,
              customerName,
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

          {/* Action bar */}
          <div className="mt-8">
            <PlanViewActions planId={plan.id} canManage={canManage} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
