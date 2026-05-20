import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireRole } from '@/lib/auth'
import { getBuildingById } from '@/lib/buildings/queries'

import { GenerateUnitsForm } from './generate-units-form'

export const metadata = { title: 'Generar unidades · Autopilot' }

interface PageProps {
  searchParams: { buildingId?: string }
}

export default async function GenerateUnitsPage({ searchParams }: PageProps) {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN')
  if (!user.workspaceId) return notFound()

  const { buildingId } = searchParams
  if (!buildingId) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        Parámetro <code>buildingId</code> requerido.{' '}
        <Link href="/desarrollo/edificios" className="text-primary hover:underline">
          Ver edificios
        </Link>
      </div>
    )
  }

  const building = await getBuildingById(buildingId, user.workspaceId)
  if (!building) return notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/desarrollo/edificios/${building.id}`} aria-label="Volver">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Generar unidades — {building.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {building.numberOfFloors} pisos ·{' '}
            {building._count.units} unidades existentes
          </p>
        </div>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="text-base">Configuración de generación</CardTitle>
        </CardHeader>
        <CardContent>
          <GenerateUnitsForm building={building} />
        </CardContent>
      </Card>
    </div>
  )
}
