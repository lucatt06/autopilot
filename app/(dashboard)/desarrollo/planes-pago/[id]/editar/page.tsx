import { notFound } from 'next/navigation'

import { BackButton } from '@/components/ui/back-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireRole } from '@/lib/auth'
import { getPaymentPlanById, getProjectsForSelect } from '@/lib/payment-plans/queries'

import { PaymentPlanForm } from '../../_components/payment-plan-form'

export const metadata = { title: 'Editar Plan de Pago · Autopilot' }

interface PageProps {
  params: { id: string }
}

export default async function EditarPlanPage({ params }: PageProps) {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN')
  if (!user.workspaceId) return notFound()

  const [plan, projects] = await Promise.all([
    getPaymentPlanById(params.id, user.workspaceId),
    getProjectsForSelect(user.workspaceId),
  ])
  if (!plan) return notFound()

  const customerName = plan.customer?.Contact[0]
    ? `${plan.customer.Contact[0].firstName} ${plan.customer.Contact[0].lastName}`.trim()
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Plan de Pago</h1>
          <p className="text-sm text-muted-foreground">Configure los detalles del plan de financiamiento.</p>
        </div>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="text-base">Datos del plan</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentPlanForm
            mode="edit"
            projects={projects.map((p) => ({
              id: p.id,
              name: p.name,
              expectedDeliveryDate: p.expectedDeliveryDate ? p.expectedDeliveryDate.toISOString().slice(0, 10) : null,
              stdReservationAmount: p.stdReservationAmount,
              stdInitialPercent: p.stdInitialPercent,
              stdConstructionPercent: p.stdConstructionPercent,
              stdFinalPercent: p.stdFinalPercent,
            }))}
            initial={{
              id: plan.id,
              name: plan.name,
              projectId: plan.projectId,
              customerId: plan.customerId,
              customerName,
              unitId: plan.unitId,
              saleId: plan.saleId,
              currency: plan.currency,
              status: plan.status,
              deliveryDate: plan.deliveryDate ? plan.deliveryDate.toISOString().slice(0, 10) : null,
              notes: plan.notes,
              totalPrice: plan.totalPrice,
              reservationAmount: plan.reservationAmount,
              initialPercent: plan.initialPercent,
              constructionPercent: plan.constructionPercent,
              finalPercent: plan.finalPercent,
              constructionInstallmentsCount: plan.constructionInstallmentsCount,
              constructionPeriodicityMonths: plan.constructionPeriodicityMonths,
              constructionMode: plan.constructionMode,
              installments: plan.installments.map((i) => ({
                id: i.id,
                type: i.type,
                installmentNumber: i.installmentNumber,
                label: i.label,
                expectedAmount: i.expectedAmount,
                dueDate: i.dueDate.toISOString().slice(0, 10),
                locked: i.locked,
                paidAmount: i.paidAmount,
                status: i.status,
              })),
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
