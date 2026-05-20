import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Building2, ChevronLeft, Copy, Pencil, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAuth } from '@/lib/auth'
import { getBuildingById, getBuildingFloorMap } from '@/lib/buildings/queries'
import { STATUS_LABELS, STATUS_BADGE } from '@/lib/buildings/schemas'
import { STATUS_LABELS as UNIT_STATUS_LABELS, STATUS_BADGE as UNIT_STATUS_BADGE } from '@/lib/units/schemas'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Edificio · Autopilot' }

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)

const UNIT_STATUS_COLOR: Record<string, string> = {
  DISPONIBLE: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  RESERVADA: 'bg-blue-100 text-blue-700 border-blue-300',
  BLOQUEADA: 'bg-amber-100 text-amber-700 border-amber-300',
  VENDIDA: 'bg-rose-100 text-rose-700 border-rose-300',
  ENTREGADA: 'bg-purple-100 text-purple-700 border-purple-300',
}

interface PageProps {
  params: { id: string }
}

export default async function BuildingDetailPage({ params }: PageProps) {
  const user = await requireAuth()
  if (!user.workspaceId) return notFound()

  const building = await getBuildingById(params.id, user.workspaceId)
  if (!building) return notFound()

  const floors = await getBuildingFloorMap(building.id, user.workspaceId)
  const canManage = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'

  const totalUnits = building._count.units
  const potentialUnits = building.numberOfFloors * building.unitsPerFloor
  const remainingToGenerate = Math.max(0, potentialUnits - totalUnits)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link href="/desarrollo/edificios" aria-label="Volver">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{building.name}</h1>
            <span
              className={cn(
                'inline-flex rounded-md border px-2 py-0.5 text-xs font-medium',
                STATUS_BADGE[building.status]
              )}
            >
              {STATUS_LABELS[building.status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {building.project ? (
              <Link href={`/desarrollo/proyectos/${building.project.id}`} className="hover:underline">
                {building.project.name}
              </Link>
            ) : (
              '—'
            )}
            {' · '}
            {building.numberOfFloors} pisos · {building.unitsPerFloor} unidades/piso
            {building.constructionStage && (
              <> · <span className="font-medium text-foreground">{building.constructionStage}</span></>
            )}
            {building.expectedDeliveryDate && (
              <> · Entrega{' '}
                {new Date(building.expectedDeliveryDate).toLocaleDateString('es-DO', {
                  month: 'long',
                  year: 'numeric',
                })}
              </>
            )}
          </p>
        </div>
        {canManage && (
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={`/desarrollo/unidades/nuevo?buildingId=${building.id}`}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Nueva unidad
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/desarrollo/unidades/generar?buildingId=${building.id}`}>
                Generar en lote
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/desarrollo/edificios/${building.id}/editar`}>Editar</Link>
            </Button>
          </>
        )}
      </div>

      {building.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={building.image}
          alt={building.name}
          className="max-h-64 w-full rounded-lg border object-cover"
        />
      )}

      {(() => {
        const allUnits = floors.flatMap((f) => f.units)
        const byStatus = (s: string) => allUnits.filter((u) => u.status === s)
        const totalValue = (units: typeof allUnits) =>
          units.reduce((acc, u) => acc + u.currentPrice, 0)
        const disponibles = byStatus('DISPONIBLE')
        const bloqueadas = byStatus('BLOQUEADA')
        const reservadas = byStatus('RESERVADA')
        const vendidas = byStatus('VENDIDA')
        const entregadas = byStatus('ENTREGADA')
        return (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Card className="col-span-2 sm:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total unidades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUnits}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {usd(totalValue(allUnits))}
                </p>
              </CardContent>
            </Card>
            <StatCard label="Disponibles" value={disponibles.length} amount={totalValue(disponibles)} accent="text-emerald-600" />
            <StatCard label="Bloqueadas" value={bloqueadas.length} amount={totalValue(bloqueadas)} accent="text-amber-600" />
            <StatCard label="Reservadas" value={reservadas.length} amount={totalValue(reservadas)} accent="text-blue-600" />
            <StatCard label="Vendidas" value={vendidas.length} amount={totalValue(vendidas)} accent="text-rose-600" />
            <StatCard label="Entregadas" value={entregadas.length} amount={totalValue(entregadas)} accent="text-purple-600" />
          </div>
        )
      })()}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Plano del edificio</CardTitle>
          <span className="text-xs text-muted-foreground">
            {totalUnits === 0
              ? `Aún no hay unidades — genera ${potentialUnits} de un click`
              : `Vista por piso · click en una unidad para verla`}
          </span>
        </CardHeader>
        <CardContent>
          {floors.length === 0 ? (
            <div className="rounded-md border bg-muted/30 py-12 text-center text-sm text-muted-foreground">
              <Building2 className="mx-auto h-10 w-10 opacity-40" />
              <p className="mt-2">
                Este edificio no tiene unidades aún.
                {canManage && remainingToGenerate > 0 && (
                  <>
                    {' '}
                    <Link
                      href={`/desarrollo/unidades/generar?buildingId=${building.id}`}
                      className="text-primary hover:underline"
                    >
                      Genera las {potentialUnits} unidades automáticamente.
                    </Link>
                  </>
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {floors.map(({ floor, units }) => (
                <div key={floor} className="flex items-center justify-center gap-3">
                  <div className="w-14 shrink-0 text-right text-xs text-muted-foreground">
                    Piso {floor}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {units.map((u) => (
                      <Link
                        key={u.id}
                        href={`/desarrollo/unidades/${u.id}`}
                        className={cn(
                          'inline-flex min-w-[3.25rem] items-center justify-center rounded-md border px-2 py-1 text-[11px] font-medium transition-transform hover:scale-105',
                          UNIT_STATUS_COLOR[u.status] ?? 'bg-muted text-muted-foreground'
                        )}
                        title={`${u.unitNumber} · ${u.type} · ${u.status}`}
                      >
                        {u.unitNumber}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              <Legend />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Units table */}
      {floors.length > 0 && (() => {
        const allUnits = floors
          .flatMap((f) => f.units)
          .sort((a, b) => a.floor - b.floor || a.unitNumber.localeCompare(b.unitNumber))
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Listado de unidades</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2.5 text-center font-medium">Piso</th>
                    <th className="px-4 py-2.5 text-center font-medium">Código</th>
                    <th className="px-4 py-2.5 text-center font-medium">Tipo</th>
                    <th className="px-4 py-2.5 text-center font-medium">Tipología</th>
                    <th className="px-4 py-2.5 text-center font-medium">m²</th>
                    <th className="px-4 py-2.5 text-center font-medium">Precio</th>
                    <th className="px-4 py-2.5 text-center font-medium">Estado</th>
                    {canManage && <th className="px-4 py-2.5" />}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allUnits.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5 text-center tabular-nums text-muted-foreground">{u.floor}</td>
                      <td className="px-4 py-2.5 text-center font-medium">
                        <Link href={`/desarrollo/unidades/${u.id}`} className="text-primary hover:underline">
                          {u.unitNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-center">{u.type}</td>
                      <td className="px-4 py-2.5 text-center text-muted-foreground">
                        {u.bedrooms} Hab · {u.bathrooms} {u.bathrooms === 1 ? 'Baño' : 'Baños'}
                      </td>
                      <td className="px-4 py-2.5 text-center tabular-nums">
                        {new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(u.squareMeters)}
                      </td>
                      <td className="px-4 py-2.5 text-center tabular-nums font-medium">{usd(u.currentPrice)}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className={cn(
                            'inline-flex rounded-md border px-1.5 py-0.5 text-xs font-medium',
                            UNIT_STATUS_BADGE[u.status as keyof typeof UNIT_STATUS_BADGE] ??
                              'bg-muted text-muted-foreground'
                          )}
                        >
                          {UNIT_STATUS_LABELS[u.status as keyof typeof UNIT_STATUS_LABELS] ?? u.status}
                        </span>
                      </td>
                      {canManage && (
                        <td className="px-4 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <Link
                              href={`/desarrollo/unidades/nuevo?buildingId=${building.id}&copyFrom=${u.id}`}
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <Copy className="h-3 w-3" />
                              Duplicar
                            </Link>
                            <Link
                              href={`/desarrollo/unidades/${u.id}/editar`}
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <Pencil className="h-3 w-3" />
                              Editar
                            </Link>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )
      })()}
    </div>
  )
}

function StatCard({
  label,
  value,
  amount,
  accent,
}: {
  label: string
  value: number
  amount?: number
  accent?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold', accent)}>{value}</div>
        {amount !== undefined && (
          <p className="mt-1 text-xs text-muted-foreground">{usd(amount)}</p>
        )}
      </CardContent>
    </Card>
  )
}

function Legend() {
  const items = [
    { label: 'Disponible', cls: 'bg-emerald-100 border-emerald-300' },
    { label: 'Reservada', cls: 'bg-blue-100 border-blue-300' },
    { label: 'Bloqueada', cls: 'bg-amber-100 border-amber-300' },
    { label: 'Vendida', cls: 'bg-rose-100 border-rose-300' },
    { label: 'Entregada', cls: 'bg-purple-100 border-purple-300' },
  ]
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-3 border-t pt-3 text-[11px] text-muted-foreground">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1">
          <span className={cn('h-3 w-3 rounded border', i.cls)} />
          {i.label}
        </span>
      ))}
    </div>
  )
}
