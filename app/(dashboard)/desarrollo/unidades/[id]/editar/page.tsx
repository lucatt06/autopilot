import { notFound } from 'next/navigation'

import { BackButton } from '@/components/ui/back-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireRole } from '@/lib/auth'
import { getUnitById } from '@/lib/units/queries'

import { EditUnitForm } from './edit-unit-form'

export const metadata = { title: 'Editar unidad · Autopilot' }

interface PageProps {
  params: { id: string }
}

export default async function EditUnitPage({ params }: PageProps) {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN')
  if (!user.workspaceId) return notFound()

  const unit = await getUnitById(params.id, user.workspaceId)
  if (!unit) return notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Editar: Unidad {unit.unitNumber}
          </h1>
          <p className="text-sm text-muted-foreground">
            {unit.building?.name ?? ''}{unit.building && unit.project ? ' · ' : ''}{unit.project?.name ?? ''}
          </p>
        </div>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Datos de la unidad</CardTitle>
        </CardHeader>
        <CardContent>
          <EditUnitForm
            unit={{
              id: unit.id,
              buildingId: unit.buildingId,
              unitNumber: unit.unitNumber,
              floor: unit.floor,
              type: unit.type,
              bedrooms: unit.bedrooms,
              bathrooms: unit.bathrooms,
              squareMeters: unit.squareMeters,
              terraceSquareMeters: unit.terraceSquareMeters,
              basePrice: unit.basePrice,
              currentPrice: unit.currentPrice,
              view: unit.view,
              orientation: unit.orientation,
              status: unit.status,
              internalNotes: unit.internalNotes,
              floorPlan: unit.floorPlan,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
