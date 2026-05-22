import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FileText, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { requireAuth } from '@/lib/auth'
import { listPaymentPlans } from '@/lib/payment-plans/queries'
import { planFiltersSchema, PLAN_STATUS_LABELS, PLAN_STATUS_BADGE, type PlanStatusKey } from '@/lib/payment-plans/schemas'
import { parseProjectIdsFromParam } from '@/lib/projects/filter-utils'
import { formatDate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { PlanRowActions } from './_components/plan-row-actions'

function nuevoHref(searchParams: Record<string, string | string[] | undefined>): string {
  const projects = Array.isArray(searchParams.projects) ? searchParams.projects[0] : searchParams.projects
  return projects ? `/desarrollo/planes-pago/nuevo?projects=${encodeURIComponent(projects)}` : '/desarrollo/planes-pago/nuevo'
}

export const metadata = { title: 'Planes de Pago · Autopilot' }

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>
}

function money(n: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(n || 0)
}

export default async function PlanesPagoPage({ searchParams }: PageProps) {
  const user = await requireAuth()
  if (!user.workspaceId) return notFound()

  const filters = planFiltersSchema.parse(searchParams)
  const { items, total } = await listPaymentPlans(user.workspaceId, filters)
  const canManage = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'
  const isAdmin = canManage

  // Determine if a single project is already filtered so we can hide that column.
  const rawProjects = Array.isArray(searchParams.projects) ? searchParams.projects[0] : searchParams.projects
  const globalProjectIds = parseProjectIdsFromParam(rawProjects)
  const projectFiltered = globalProjectIds.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            Planes de Pago
            <span className="text-sm font-normal text-muted-foreground">{total} planes</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Estructura de financiamiento: reservación, inicial, construcción y entrega.
          </p>
        </div>
        {canManage && (
          <Button asChild>
            <Link href={nuevoHref(searchParams)}>
              <Plus className="mr-1 h-4 w-4" /> Nuevo Plan
            </Link>
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-3 text-sm font-medium">Sin planes de pago aún</h3>
          <p className="mt-1 text-sm text-muted-foreground">Crea tu primer plan de financiamiento.</p>
          {canManage && (
            <Button asChild className="mt-6">
              <Link href={nuevoHref(searchParams)}>
                <Plus className="mr-1 h-4 w-4" /> Nuevo Plan
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Nombre</th>
                  {/* Hide Proyecto column when a project is already selected globally */}
                  {!projectFiltered && (
                    <th className="px-4 py-2.5 text-left font-medium">Proyecto</th>
                  )}
                  <th className="px-4 py-2.5 text-right font-medium">Precio</th>
                  <th className="px-4 py-2.5 text-left font-medium">Cubierto</th>
                  <th className="px-4 py-2.5 text-left font-medium">Estado</th>
                  {/* Creado por — only visible to admins */}
                  {isAdmin && (
                    <th className="px-4 py-2.5 text-left font-medium">Creado por</th>
                  )}
                  <th className="px-4 py-2.5 text-left font-medium">Actualizado</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {items.map((p) => {
                  const pct = p.totalPrice > 0 ? Math.round((p.totalPaid / p.totalPrice) * 100) : 0
                  const statusKey = p.status as PlanStatusKey
                  const createdByName = p.createdBy
                    ? `${p.createdBy.firstName} ${p.createdBy.lastName}`.trim()
                    : '—'
                  return (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      {!projectFiltered && (
                        <td className="px-4 py-3 text-muted-foreground">{p.project?.name ?? '—'}</td>
                      )}
                      <td className="px-4 py-3 text-right tabular-nums">{money(p.totalPrice, p.currency)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex rounded-md border px-2 py-0.5 text-xs font-medium', PLAN_STATUS_BADGE[statusKey])}>
                          {PLAN_STATUS_LABELS[statusKey] ?? p.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-muted-foreground">{createdByName}</td>
                      )}
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(p.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <PlanRowActions id={p.id} name={p.name} canManage={canManage} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
