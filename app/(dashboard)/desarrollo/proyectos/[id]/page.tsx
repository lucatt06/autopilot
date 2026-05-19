import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Building2, Calendar, ChevronLeft, MapPin } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StubPage } from '@/components/stub-page'
import { requireAuth } from '@/lib/auth'
import { getProjectById } from '@/lib/projects/queries'
import { STATUS_LABELS, STATUS_BADGE, TYPE_LABELS } from '@/lib/projects/schemas'
import { formatDate } from '@/lib/dates'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Proyecto · Autopilot' }

interface PageProps {
  params: { id: string }
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const user = await requireAuth()
  if (!user.workspaceId) return notFound()

  const project = await getProjectById(params.id, user.workspaceId)
  if (!project) return notFound()

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalles</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-y-3 text-sm sm:grid-cols-2">
          <Field label="Dirección" value={project.address ?? '—'} />
          <Field
            label="Inicio"
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
          <Field
            label="Creado"
            value={<span>{formatDate(project.createdAt)}</span>}
          />
        </CardContent>
      </Card>

      <StubPage
        title="Edificios y unidades del proyecto"
        phase="1G (siguiente paso)"
        description="Listado de edificios + accesos a Unidades, Disponibilidad y Plan de Pago de este proyecto. Vienen en G.1.4–G.1.7."
      />
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
