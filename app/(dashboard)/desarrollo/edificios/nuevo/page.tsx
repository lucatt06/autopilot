import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'

import { BuildingForm } from './building-form'

export const metadata = { title: 'Nuevo edificio · Autopilot' }

export default async function NewBuildingPage({
  searchParams,
}: {
  searchParams: { projectId?: string }
}) {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN')
  if (!user.workspaceId) {
    return <div className="p-8 text-sm text-muted-foreground">Sin workspace.</div>
  }

  const projects = await db.project.findMany({
    where: { workspaceId: user.workspaceId, deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link href="/desarrollo/edificios" aria-label="Volver">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuevo edificio</h1>
          <p className="text-sm text-muted-foreground">
            Define la cantidad de pisos y unidades por piso. La generación masiva de unidades
            se hace después desde el detalle del edificio.
          </p>
        </div>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Datos del edificio</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="space-y-2 text-sm">
              <p>Para crear un edificio primero necesitas un proyecto.</p>
              <Button asChild size="sm">
                <Link href="/desarrollo/proyectos/nuevo">Crear proyecto</Link>
              </Button>
            </div>
          ) : (
            <BuildingForm projects={projects} initialProjectId={searchParams.projectId} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
