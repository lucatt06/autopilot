import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'

import { NewUnitForm } from './new-unit-form'

export const metadata = { title: 'Nueva unidad · Autopilot' }

interface PageProps {
  searchParams: { buildingId?: string; projectId?: string }
}

export default async function NewUnitPage({ searchParams }: PageProps) {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN')
  if (!user.workspaceId) return notFound()

  const [projects, buildings] = await Promise.all([
    db.project.findMany({
      where: { workspaceId: user.workspaceId, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    db.building.findMany({
      where: { workspaceId: user.workspaceId },
      select: { id: true, name: true, projectId: true, numberOfFloors: true },
      orderBy: [{ project: { name: 'asc' } }, { name: 'asc' }],
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link href="/desarrollo/unidades" aria-label="Volver">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nueva unidad</h1>
          <p className="text-sm text-muted-foreground">
            Agrega una unidad individual a un edificio.
          </p>
        </div>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Datos de la unidad</CardTitle>
        </CardHeader>
        <CardContent>
          <NewUnitForm
            projects={projects}
            buildings={buildings}
            defaultBuildingId={searchParams.buildingId}
            defaultProjectId={searchParams.projectId}
          />
        </CardContent>
      </Card>
    </div>
  )
}
