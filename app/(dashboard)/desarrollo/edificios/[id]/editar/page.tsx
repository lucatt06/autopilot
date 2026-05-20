import { notFound } from 'next/navigation'

import { BackButton } from '@/components/ui/back-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireRole } from '@/lib/auth'
import { getBuildingById } from '@/lib/buildings/queries'

import { EditBuildingForm } from './edit-building-form'

export const metadata = { title: 'Editar edificio · Autopilot' }

interface PageProps {
  params: { id: string }
}

export default async function EditBuildingPage({ params }: PageProps) {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN')
  if (!user.workspaceId) return notFound()

  const building = await getBuildingById(params.id, user.workspaceId)
  if (!building) return notFound()

  const expectedDeliveryDate = building.expectedDeliveryDate
    ? new Date(building.expectedDeliveryDate).toISOString().slice(0, 10)
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar edificio</h1>
          <p className="text-sm text-muted-foreground">{building.name}</p>
        </div>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Datos del edificio</CardTitle>
        </CardHeader>
        <CardContent>
          <EditBuildingForm
            initial={{
              id: building.id,
              projectId: building.projectId,
              projectName: building.project?.name ?? '—',
              name: building.name,
              numberOfFloors: building.numberOfFloors,
              status: building.status,
              constructionStage: building.constructionStage,
              expectedDeliveryDate,
              description: building.description,
              image: building.image,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
