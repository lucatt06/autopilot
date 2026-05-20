import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Calendar } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/ui/back-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAuth } from '@/lib/auth'
import { getUnitById } from '@/lib/units/queries'
import { STATUS_LABELS, STATUS_BADGE, VIEW_LABELS } from '@/lib/units/schemas'
import { formatDate } from '@/lib/dates'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Unidad · Autopilot' }

interface PageProps {
  params: { id: string }
}

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)

export default async function UnitDetailPage({ params }: PageProps) {
  const user = await requireAuth()
  if (!user.workspaceId) return notFound()

  const unit = await getUnitById(params.id, user.workspaceId)
  if (!unit) return notFound()

  const canManage = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'
  const statusKey = unit.status as keyof typeof STATUS_LABELS

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BackButton />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Unidad {unit.unitNumber}</h1>
            <span
              className={cn(
                'inline-flex rounded-md border px-2 py-0.5 text-xs font-medium',
                STATUS_BADGE[statusKey] ?? 'bg-muted text-muted-foreground'
              )}
            >
              {STATUS_LABELS[statusKey] ?? unit.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {unit.project ? (
              <Link href={`/desarrollo/proyectos/${unit.project.id}`} className="hover:underline">
                {unit.project.name}
              </Link>
            ) : null}
            {unit.project && unit.building && ' · '}
            {unit.building ? (
              <Link href={`/desarrollo/edificios/${unit.building.id}`} className="hover:underline">
                {unit.building.name}
              </Link>
            ) : null}
            {' · '}Piso {unit.floor}
          </p>
        </div>
        {canManage && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/desarrollo/unidades/${unit.id}/editar`}>Editar</Link>
          </Button>
        )}
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Precio actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usd(unit.currentPrice)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Precio base</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{usd(unit.basePrice)}</div>
            {unit.currentPrice !== unit.basePrice && (
              <p className="text-xs text-emerald-600 mt-0.5">
                {unit.currentPrice < unit.basePrice ? 'Descuento aplicado' : 'Precio actualizado'}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Metraje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(unit.squareMeters)} m²
            </div>
            {unit.terraceSquareMeters && (
              <p className="text-xs text-muted-foreground mt-0.5">
                + {unit.terraceSquareMeters} m² terraza
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalles</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-y-4 text-sm sm:grid-cols-3 lg:grid-cols-4">
          <Field label="Tipo" value={unit.type} />
          <Field label="Piso" value={String(unit.floor)} />
          <Field label="Habitaciones" value={String(unit.bedrooms)} />
          <Field label="Baños" value={String(unit.bathrooms)} />
          {unit.view && (
            <Field
              label="Vista"
              value={VIEW_LABELS[unit.view as keyof typeof VIEW_LABELS] ?? unit.view}
            />
          )}
          {unit.orientation && <Field label="Orientación" value={unit.orientation} />}
          <Field
            label="Creada"
            value={
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {formatDate(unit.createdAt)}
              </span>
            }
          />
          <Field
            label="Actualizada"
            value={
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {formatDate(unit.updatedAt)}
              </span>
            }
          />
        </CardContent>
      </Card>

      {unit.specialFeatures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Características especiales</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-2">
              {unit.specialFeatures.map((f) => (
                <li
                  key={f}
                  className="rounded-md border bg-muted/50 px-2.5 py-1 text-sm"
                >
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {unit.internalNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas internas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{unit.internalNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  )
}
