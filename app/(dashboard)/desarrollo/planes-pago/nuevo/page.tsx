import { notFound } from 'next/navigation'

import { BackButton } from '@/components/ui/back-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireRole } from '@/lib/auth'
import { getProjectsForSelect } from '@/lib/payment-plans/queries'

import { PaymentPlanForm } from '../_components/payment-plan-form'

export const metadata = { title: 'Nuevo Plan de Pago · Autopilot' }

export default async function NuevoPlanPage() {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN')
  if (!user.workspaceId) return notFound()

  const projects = await getProjectsForSelect(user.workspaceId)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuevo Plan de Pago</h1>
          <p className="text-sm text-muted-foreground">Configure los detalles del plan de financiamiento.</p>
        </div>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="text-base">Datos del plan</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentPlanForm
            mode="create"
            projects={projects.map((p) => ({
              id: p.id,
              name: p.name,
              expectedDeliveryDate: p.expectedDeliveryDate ? p.expectedDeliveryDate.toISOString().slice(0, 10) : null,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  )
}
