import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Building2, Calendar, Check, ChevronLeft, Flag, MapPin, Ruler } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAuth } from '@/lib/auth'
import { getProjectById } from '@/lib/projects/queries'
import { getProjectStats } from '@/lib/projects/stats'
import { STATUS_LABELS, STATUS_BADGE, TYPE_LABELS } from '@/lib/projects/schemas'
import { formatDate } from '@/lib/dates'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Proyecto · Autopilot' }

interface PageProps {
  params: { id: string }
}

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)

const sqm = (n: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n)

export default async function ProjectDetailPage({ params }: PageProps) {
  const user = await requireAuth()
  if (!user.workspaceId) return notFound()

  const project = await getProjectById(params.id, user.workspaceId)
  if (!project) return notFound()

  const stats = await getProjectStats(project.id, user.workspaceId)
  const canManage = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link href="/desarrollo/proyectos" aria-label="Volver">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <span
              className={cn(
                'inline-flex rounded-md border px-2 py-0.5 text-xs font-medium',
                STATUS_BADGE[project.status]
              )}
            >
              {STATUS_LABELS[project.status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {TYPE_LABELS[project.type]}
            {project.location && (
              <>
                {' · '}
                <MapPin className="inline h-3 w-3" /> {project.location}
              </>
            )}
          </p>
        </div>
        {canManage && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/desarrollo/proyectos/${project.id}/editar`}>Editar</Link>
          </Button>
        )}
      </div>

      {project.images[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.images[0]}
          alt={project.name}
          className="max-h-72 w-full rounded-lg border object-cover"
        />
      )}

      {/* Counters / progress — bloque principal arriba */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Edificios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{project._count.buildings}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project._count.units}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              % Avance de obra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.progressPercent}%</div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${project.progressPercent}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Address / dates detail */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalles adicionales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-1 gap-y-3 sm:grid-cols-2">
            <Field label="Dirección" value={project.address ?? '—'} />
            <Field
              label="Inicio de obra"
              value={
                project.startDate ? (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatDate(project.startDate)}
                  </span>
                ) : (
                  '—'
                )
              }
            />
            <Field
              label="Entrega proyectada"
              value={
                project.expectedDeliveryDate ? (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatDate(project.expectedDeliveryDate)}
                  </span>
                ) : (
                  '—'
                )
              }
            />
            <Field label="Creado" value={<span>{formatDate(project.createdAt)}</span>} />
          </div>

          {/* Stages */}
          {project.hasStages && (
            <div className="border-t pt-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Flag className="h-3.5 w-3.5" />
                Etapas del proyecto
              </div>
              {project.stages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sin etapas definidas.{' '}
                  {canManage && (
                    <Link
                      href={`/desarrollo/proyectos/${project.id}/editar`}
                      className="text-primary hover:underline"
                    >
                      Agregar etapas
                    </Link>
                  )}
                </p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {project.stages.map((stage, i) => (
                    <div
                      key={stage.id}
                      className="flex items-center gap-2.5 rounded-lg border bg-muted/30 px-3 py-2"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                        {i + 1}
                      </span>
                      <div>
                        <div className="text-sm font-medium">{stage.name}</div>
                        {stage.expectedDeliveryDate && (
                          <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(stage.expectedDeliveryDate)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Headline grid: metraje, precios, provincia/ciudad/sector, condición */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-y-4 pt-6 sm:grid-cols-3 lg:grid-cols-4">
          <Field
            label="Metraje"
            value={
              stats.totalUnits === 0 ? (
                '—'
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Ruler className="h-3.5 w-3.5 text-emerald-600" />
                  {sqm(stats.squareMetersMin)} – {sqm(stats.squareMetersMax)} m²
                </span>
              )
            }
          />
          <Field
            label="Precio desde"
            value={stats.totalUnits === 0 ? '—' : usd(stats.priceMin)}
          />
          <Field
            label="Precio hasta"
            value={stats.totalUnits === 0 ? '—' : usd(stats.priceMax)}
          />
          <Field label="Provincia" value={project.province ?? '—'} />

          <Field label="Ciudad" value={project.city ?? '—'} />
          <Field label="Sector" value={project.sector ?? '—'} />
          <Field
            label="Condición"
            value={
              <span
                className={cn(
                  'inline-flex rounded-md border px-1.5 py-0.5 text-xs font-medium',
                  STATUS_BADGE[project.status]
                )}
              >
                {STATUS_LABELS[project.status]}
              </span>
            }
          />
          <Field
            label="Última actualización"
            value={
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {formatDate(project.updatedAt)}
              </span>
            }
          />
        </CardContent>
      </Card>

      {/* Metro Cuadrado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metro Cuadrado</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.totalUnits === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay unidades creadas para calcular el metraje.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
              <SqmField
                label="m² Total"
                value={stats.squareMetersTotal}
                dotClass="bg-muted-foreground/40"
              />
              <SqmField
                label="m² Disponible"
                value={stats.squareMetersAvailable}
                dotClass="bg-emerald-400"
              />
              <SqmField
                label="m² Reservado"
                value={stats.squareMetersReserved}
                dotClass="bg-blue-400"
              />
              <SqmField
                label="m² Bloqueado"
                value={stats.squareMetersBlocked}
                dotClass="bg-amber-400"
              />
              <SqmField
                label="m² Vendido"
                value={stats.squareMetersSold}
                dotClass="bg-rose-400"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Características */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Características</CardTitle>
        </CardHeader>
        <CardContent>
          {project.amenities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin amenidades registradas.{' '}
              {canManage && (
                <Link
                  href={`/desarrollo/proyectos/${project.id}/editar`}
                  className="text-primary hover:underline"
                >
                  Agregar características
                </Link>
              )}
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {project.amenities.map((a) => (
                <li key={a} className="inline-flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
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

function SqmField({
  label,
  value,
  dotClass,
}: {
  label: string
  value: number
  dotClass: string
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 inline-flex items-center gap-2 text-lg font-semibold">
        <span className={cn('h-2.5 w-2.5 rounded-full', dotClass)} />
        {sqm(value)}
      </div>
    </div>
  )
}
