'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { STATUS_LABELS, STATUS_BADGE } from '@/lib/units/schemas'

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)

interface UnitRow {
  id: string
  unitNumber: string
  floor: number
  type: string
  bedrooms: number
  bathrooms: number
  squareMeters: number
  currentPrice: number
  status: string
  project: { id: string; name: string } | null
  building: { id: string; name: string; constructionStage?: string | null; expectedDeliveryDate?: Date | null } | null
}

export function UnitsTable({
  items,
  canManage,
  hideProjectColumn = false,
}: {
  items: UnitRow[]
  canManage: boolean
  hideProjectColumn?: boolean
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-md border bg-muted/30 py-16 text-center text-sm text-muted-foreground">
        No se encontraron unidades con los filtros actuales.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2.5 text-center font-medium">Unidad</th>
            {!hideProjectColumn && <th className="px-3 py-2.5 text-center font-medium">Proyecto</th>}
            <th className="px-3 py-2.5 text-center font-medium">Edificio</th>
            <th className="px-3 py-2.5 text-center font-medium">Etapa</th>
            <th className="px-3 py-2.5 text-center font-medium">Entrega</th>
            <th className="px-3 py-2.5 text-center font-medium">Piso</th>
            <th className="px-3 py-2.5 text-center font-medium">Tipo</th>
            <th className="px-3 py-2.5 text-center font-medium">m²</th>
            <th className="px-3 py-2.5 text-center font-medium">Precio</th>
            <th className="px-3 py-2.5 text-center font-medium">Estado</th>
            {canManage && <th className="px-3 py-2.5" />}
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((u) => (
            <tr key={u.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-3 py-2.5 text-center font-medium">
                <Link
                  href={`/desarrollo/unidades/${u.id}`}
                  className="text-primary hover:underline"
                >
                  {u.unitNumber}
                </Link>
              </td>
              {!hideProjectColumn && (
                <td className="px-3 py-2.5 text-center text-muted-foreground">
                  {u.project ? (
                    <Link
                      href={`/desarrollo/proyectos/${u.project.id}`}
                      className="hover:underline"
                    >
                      {u.project.name}
                    </Link>
                  ) : (
                    '—'
                  )}
                </td>
              )}
              <td className="px-3 py-2.5 text-center text-muted-foreground">
                {u.building ? (
                  <Link
                    href={`/desarrollo/edificios/${u.building.id}`}
                    className="hover:underline"
                  >
                    {u.building.name}
                  </Link>
                ) : (
                  '—'
                )}
              </td>
              <td className="px-3 py-2.5 text-center text-sm text-muted-foreground">
                {u.building?.constructionStage ?? '—'}
              </td>
              <td className="px-3 py-2.5 text-center text-sm text-muted-foreground">
                {u.building?.expectedDeliveryDate
                  ? new Date(u.building.expectedDeliveryDate).toLocaleDateString('es-DO', {
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </td>
              <td className="px-3 py-2.5 text-center tabular-nums">{u.floor}</td>
              <td className="px-3 py-2.5 text-center">{u.type}</td>
              <td className="px-3 py-2.5 text-center tabular-nums">
                {new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(u.squareMeters)}
              </td>
              <td className="px-3 py-2.5 text-center tabular-nums font-medium">{usd(u.currentPrice)}</td>
              <td className="px-3 py-2.5 text-center">
                <span
                  className={cn(
                    'inline-flex rounded-md border px-1.5 py-0.5 text-xs font-medium',
                    STATUS_BADGE[u.status as keyof typeof STATUS_BADGE] ??
                      'bg-muted text-muted-foreground'
                  )}
                >
                  {STATUS_LABELS[u.status as keyof typeof STATUS_LABELS] ?? u.status}
                </span>
              </td>
              {canManage && (
                <td className="px-3 py-2.5 text-center">
                  <Link
                    href={`/desarrollo/unidades/${u.id}/editar`}
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Editar
                  </Link>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
