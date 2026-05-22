import { notFound } from 'next/navigation'

import { BackButton } from '@/components/ui/back-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireRole } from '@/lib/auth'
import { getProjectById } from '@/lib/projects/queries'

import { EditProjectForm } from './edit-project-form'

export const metadata = { title: 'Editar proyecto · Autopilot' }

interface PageProps {
  params: { id: string }
}

export default async function EditProjectPage({ params }: PageProps) {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN')
  if (!user.workspaceId) return notFound()

  const project = await getProjectById(params.id, user.workspaceId)
  if (!project) return notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar: {project.name}</h1>
          <p className="text-sm text-muted-foreground">
            Cambios visibles inmediatamente para todo el workspace.
          </p>
        </div>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Datos del proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <EditProjectForm
            project={{
              id: project.id,
              name: project.name,
              type: project.type,
              status: project.status,
              location: project.location,
              address: project.address,
              province: project.province,
              city: project.city,
              sector: project.sector,
              amenities: project.amenities,
              progressPercent: project.progressPercent,
              startDate: project.startDate ? project.startDate.toISOString().slice(0, 10) : '',
              expectedDeliveryDate: project.expectedDeliveryDate
                ? project.expectedDeliveryDate.toISOString().slice(0, 10)
                : '',
              coverImage: project.images[0] ?? '',
              hasStages: project.hasStages,
              stages: project.stages.map((s) => ({
                name: s.name,
                expectedDeliveryDate: s.expectedDeliveryDate
                  ? s.expectedDeliveryDate.toISOString().slice(0, 10)
                  : '',
              })),
              stdReservationAmount: project.stdReservationAmount,
              stdInitialPercent: project.stdInitialPercent,
              stdConstructionPercent: project.stdConstructionPercent,
              stdFinalPercent: project.stdFinalPercent,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
