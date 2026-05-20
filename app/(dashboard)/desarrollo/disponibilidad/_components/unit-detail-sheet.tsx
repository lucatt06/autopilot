'use client'

import Link from 'next/link'
import { Banknote, KeyRound, ListChecks } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import type { UnitForAvailability } from '@/lib/buildings/queries'

const STATUS_CHIP: Record<string, { label: string; className: string }> = {
  DISPONIBLE: { label: 'Disponible', className: 'bg-green-100 text-green-800 border border-green-300' },
  BLOQUEADA:  { label: 'Bloqueada',  className: 'bg-amber-100 text-amber-800 border border-amber-300' },
  RESERVADA:  { label: 'Reservada',  className: 'bg-blue-100 text-blue-800 border border-blue-300' },
  VENDIDA:    { label: 'Vendida',    className: 'bg-red-100 text-red-800 border border-red-300' },
  ENTREGADA:  { label: 'Entregada',  className: 'bg-purple-100 text-purple-800 border border-purple-300' },
}

const VIEW_LABELS: Record<string, string> = {
  MAR: 'Mar',
  PISCINA: 'Piscina',
  JARDIN: 'Jardín',
  CIUDAD: 'Ciudad',
  INTERIOR: 'Interior',
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

interface DataRowProps {
  label: string
  value: React.ReactNode
}

function DataRow({ label, value }: DataRowProps) {
  return (
    <>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-xs font-medium">{value}</dd>
    </>
  )
}

interface Props {
  unit: UnitForAvailability | null
  buildingName: string
  onClose: () => void
}

export function UnitDetailSheet({ unit, buildingName, onClose }: Props) {
  const chip = unit ? (STATUS_CHIP[unit.status] ?? null) : null

  return (
    <Sheet open={unit !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent className="w-[360px] sm:max-w-[360px] overflow-y-auto">
        {unit && (
          <>
            <SheetHeader className="mb-4">
              <SheetTitle>{unit.unitNumber}</SheetTitle>
              <p className="text-sm text-muted-foreground">{buildingName}</p>
              {chip && (
                <span
                  className={cn(
                    'mt-1 inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium',
                    chip.className,
                  )}
                >
                  {chip.label}
                </span>
              )}
            </SheetHeader>

            <Separator className="mb-4" />

            {/* Details grid */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <DataRow label="Piso" value={unit.floor} />
              <DataRow label="Tipo" value={unit.type} />
              <DataRow
                label="Habitaciones"
                value={unit.bedrooms > 0 ? unit.bedrooms : '—'}
              />
              <DataRow label="Baños" value={unit.bathrooms} />
              <DataRow label="Metros²" value={`${unit.squareMeters} m²`} />
              <DataRow
                label="Terraza"
                value={
                  unit.terraceSquareMeters != null
                    ? `${unit.terraceSquareMeters} m²`
                    : '—'
                }
              />
              <DataRow label="Precio base" value={formatPrice(unit.basePrice)} />
              <DataRow
                label="Precio actual"
                value={
                  <span
                    className={cn(
                      unit.currentPrice !== unit.basePrice && 'font-bold',
                    )}
                  >
                    {formatPrice(unit.currentPrice)}
                  </span>
                }
              />
              <DataRow
                label="Vista"
                value={unit.view ? (VIEW_LABELS[unit.view] ?? unit.view) : '—'}
              />
              <DataRow label="Orientación" value={unit.orientation ?? '—'} />
            </dl>

            <Separator className="my-4" />

            {/* Actions */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Acciones
              </p>

              {unit.status === 'DISPONIBLE' && (
                <>
                  <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                    <Link href={`/desarrollo/bloqueos/nuevo?unitId=${unit.id}`}>
                      <KeyRound className="h-4 w-4" />
                      Bloquear
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                    <Link href={`/desarrollo/reservas/nuevo?unitId=${unit.id}`}>
                      <ListChecks className="h-4 w-4" />
                      Reservar
                    </Link>
                  </Button>
                  <Button size="sm" className="w-full justify-start" asChild>
                    <Link href={`/desarrollo/ventas/nueva?unitId=${unit.id}`}>
                      <Banknote className="h-4 w-4" />
                      Vender
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                    <Link href={`/desarrollo/unidades/${unit.id}/editar`}>
                      Editar
                    </Link>
                  </Button>
                </>
              )}

              {unit.status === 'BLOQUEADA' && (
                <>
                  <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                    <Link href={`/desarrollo/reservas/nuevo?unitId=${unit.id}`}>
                      <ListChecks className="h-4 w-4" />
                      Reservar
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                    <Link href={`/desarrollo/unidades/${unit.id}/editar`}>
                      Editar
                    </Link>
                  </Button>
                </>
              )}

              {unit.status === 'RESERVADA' && (
                <>
                  <Button size="sm" className="w-full justify-start" asChild>
                    <Link href={`/desarrollo/ventas/nueva?unitId=${unit.id}`}>
                      <Banknote className="h-4 w-4" />
                      Convertir a venta
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                    <Link href={`/desarrollo/unidades/${unit.id}/editar`}>
                      Editar
                    </Link>
                  </Button>
                </>
              )}

              {(unit.status === 'VENDIDA' || unit.status === 'ENTREGADA') && (
                <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                  <Link href={`/desarrollo/unidades/${unit.id}/editar`}>
                    Editar
                  </Link>
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
