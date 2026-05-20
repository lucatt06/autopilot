'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, KeyRound, ListChecks, Banknote, Pencil } from 'lucide-react'

import { cn } from '@/lib/utils'
import { STATUS_LABELS, STATUS_BADGE } from '@/lib/units/schemas'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UnitActionDialog, type ActionType, type UnitActionTarget } from './unit-action-dialog'

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
  building: {
    id: string
    name: string
    constructionStage?: string | null
    expectedDeliveryDate?: Date | null
  } | null
}

interface Props {
  items: UnitRow[]
  canManage: boolean
  hideProjectColumn?: boolean
  hiddenCols?: string[]
}

export function AvailabilityTable({
  items,
  canManage,
  hideProjectColumn = false,
  hiddenCols = [],
}: Props) {
  const hide = (key: string) => hiddenCols.includes(key)

  const [actionTarget, setActionTarget] = useState<{
    unit: UnitActionTarget
    action: ActionType
  } | null>(null)

  function openAction(unit: UnitRow, action: ActionType) {
    setActionTarget({
      unit: {
        id: unit.id,
        unitNumber: unit.unitNumber,
        type: unit.type,
        squareMeters: unit.squareMeters,
        currentPrice: unit.currentPrice,
        status: unit.status,
      },
      action,
    })
  }

  if (items.length === 0) {
    return (
      <div className="rounded-md border bg-muted/30 py-16 text-center text-sm text-muted-foreground">
        No se encontraron unidades con los filtros actuales.
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2.5 text-center font-medium">Unidad</th>
              {!hideProjectColumn && (
                <th className="px-3 py-2.5 text-center font-medium">Proyecto</th>
              )}
              {!hide('edificio') && <th className="px-3 py-2.5 text-center font-medium">Edificio</th>}
              {!hide('etapa')    && <th className="px-3 py-2.5 text-center font-medium">Etapa</th>}
              {!hide('entrega')  && <th className="px-3 py-2.5 text-center font-medium">Entrega</th>}
              {!hide('piso')     && <th className="px-3 py-2.5 text-center font-medium">Piso</th>}
              {!hide('tipo')     && <th className="px-3 py-2.5 text-center font-medium">Tipo</th>}
              {!hide('m2')       && <th className="px-3 py-2.5 text-center font-medium">m²</th>}
              {!hide('precio')   && <th className="px-3 py-2.5 text-center font-medium">Precio</th>}
              {!hide('estado')   && <th className="px-3 py-2.5 text-center font-medium">Estado</th>}
              {canManage && <th className="px-3 py-2.5" />}
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((u) => (
              <tr key={u.id} className="transition-colors hover:bg-muted/30">
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
                      <Link href={`/desarrollo/proyectos/${u.project.id}`} className="hover:underline">
                        {u.project.name}
                      </Link>
                    ) : '—'}
                  </td>
                )}
                {!hide('edificio') && (
                  <td className="px-3 py-2.5 text-center text-muted-foreground">
                    {u.building ? (
                      <Link href={`/desarrollo/edificios/${u.building.id}`} className="hover:underline">
                        {u.building.name}
                      </Link>
                    ) : '—'}
                  </td>
                )}
                {!hide('etapa') && (
                  <td className="px-3 py-2.5 text-center text-sm text-muted-foreground">
                    {u.building?.constructionStage ?? '—'}
                  </td>
                )}
                {!hide('entrega') && (
                  <td className="px-3 py-2.5 text-center text-sm text-muted-foreground">
                    {u.building?.expectedDeliveryDate
                      ? new Date(u.building.expectedDeliveryDate).toLocaleDateString('es-DO', {
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                )}
                {!hide('piso') && (
                  <td className="px-3 py-2.5 text-center tabular-nums">{u.floor}</td>
                )}
                {!hide('tipo') && (
                  <td className="px-3 py-2.5 text-center">{u.type}</td>
                )}
                {!hide('m2') && (
                  <td className="px-3 py-2.5 text-center tabular-nums">
                    {new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(u.squareMeters)}
                  </td>
                )}
                {!hide('precio') && (
                  <td className="px-3 py-2.5 text-center tabular-nums font-medium">
                    {usd(u.currentPrice)}
                  </td>
                )}
                {!hide('estado') && (
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={cn(
                        'inline-flex rounded-md border px-1.5 py-0.5 text-xs font-medium',
                        STATUS_BADGE[u.status as keyof typeof STATUS_BADGE] ??
                          'bg-muted text-muted-foreground',
                      )}
                    >
                      {STATUS_LABELS[u.status as keyof typeof STATUS_LABELS] ?? u.status}
                    </span>
                  </td>
                )}
                {canManage && (
                  <td className="px-3 py-2.5 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                          Acciones <ChevronDown className="ml-1 h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {u.status === 'DISPONIBLE' && (
                          <>
                            <DropdownMenuItem onSelect={() => openAction(u, 'block')}>
                              <KeyRound className="mr-2 h-3.5 w-3.5" />
                              Bloquear
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => openAction(u, 'reserve')}>
                              <ListChecks className="mr-2 h-3.5 w-3.5" />
                              Reservar
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => openAction(u, 'sell')}>
                              <Banknote className="mr-2 h-3.5 w-3.5" />
                              Vender
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {u.status === 'BLOQUEADA' && (
                          <>
                            <DropdownMenuItem onSelect={() => openAction(u, 'reserve')}>
                              <ListChecks className="mr-2 h-3.5 w-3.5" />
                              Reservar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {u.status === 'RESERVADA' && (
                          <>
                            <DropdownMenuItem onSelect={() => openAction(u, 'sell')}>
                              <Banknote className="mr-2 h-3.5 w-3.5" />
                              Convertir a venta
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem asChild>
                          <Link href={`/desarrollo/unidades/${u.id}/editar`}>
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UnitActionDialog
        unit={actionTarget?.unit ?? null}
        action={actionTarget?.action ?? null}
        onClose={() => setActionTarget(null)}
      />
    </>
  )
}
