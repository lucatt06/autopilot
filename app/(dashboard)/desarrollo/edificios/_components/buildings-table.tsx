'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Building2, Copy, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { deleteBuilding, duplicateBuilding } from '@/app/actions/buildings'
import { STATUS_LABELS, STATUS_BADGE } from '@/lib/buildings/schemas'
import { cn } from '@/lib/utils'

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)

interface BuildingRow {
  id: string
  name: string
  project: { id: string; name: string } | null
  numberOfFloors: number
  unitsPerFloor: number
  status: keyof typeof STATUS_LABELS
  constructionStage: string | null
  expectedDeliveryDate: Date | null
  image: string | null
  totalUnits: number
  availableUnits: number
  availableValue: number
  blockedUnits: number
  blockedValue: number
  reservedUnits: number
  reservedValue: number
  soldUnits: number
  soldValue: number
  deliveredUnits: number
  deliveredValue: number
}

function StatCell({
  count,
  value,
  color,
}: {
  count: number
  value: number
  color: string
}) {
  return (
    <TableCell className="text-center">
      <div className={cn('text-sm font-medium', color)}>{count}</div>
      <div className="text-[11px] text-muted-foreground">{usd(value)}</div>
    </TableCell>
  )
}

export function BuildingsTable({
  items,
  canManage,
  hideProjectColumn = false,
  showStageColumn = false,
}: {
  items: BuildingRow[]
  canManage: boolean
  hideProjectColumn?: boolean
  showStageColumn?: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (items.length === 0) {
    return (
      <div className="rounded-lg border bg-card py-16 text-center">
        <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
        <h3 className="mt-3 text-sm font-medium">Sin edificios aún</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {canManage
            ? 'Crea tu primer edificio desde "Nuevo edificio".'
            : 'Aún no hay edificios para los proyectos seleccionados.'}
        </p>
      </div>
    )
  }

  function onDelete(b: BuildingRow) {
    if (!confirm(`¿Eliminar "${b.name}"?`)) return
    startTransition(async () => {
      const res = await deleteBuilding(b.id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success('Edificio eliminado')
      router.refresh()
    })
  }

  function onDuplicate(b: BuildingRow) {
    startTransition(async () => {
      const res = await duplicateBuilding(b.id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(`"${b.name}" duplicado`)
      if (res.data?.id) router.push(`/desarrollo/edificios/${res.data.id}`)
      else router.refresh()
    })
  }

  return (
    <div className="rounded-lg border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-center font-medium">Edificio</TableHead>
            {!hideProjectColumn && <TableHead className="text-center font-medium">Proyecto</TableHead>}
            {showStageColumn && <TableHead className="text-center font-medium">Etapa</TableHead>}
            <TableHead className="text-center font-medium">Entrega</TableHead>
            <TableHead className="text-center font-medium">Pisos</TableHead>
            <TableHead className="text-center font-medium">Total</TableHead>
            <TableHead className="text-center font-medium">Disponibles</TableHead>
            <TableHead className="text-center font-medium">Bloqueadas</TableHead>
            <TableHead className="text-center font-medium">Reservadas</TableHead>
            <TableHead className="text-center font-medium">Vendidas</TableHead>
            <TableHead className="text-center font-medium">Entregadas</TableHead>
            <TableHead className="text-center font-medium">Estado</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((b) => (
            <TableRow key={b.id} className="group">
              <TableCell>
                <Link
                  href={`/desarrollo/edificios/${b.id}`}
                  className="flex items-center gap-2.5 font-medium group-hover:text-primary"
                >
                  {b.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.image}
                      alt={b.name}
                      className="h-7 w-7 rounded object-cover"
                    />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded bg-muted">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  )}
                  {b.name}
                </Link>
              </TableCell>
              {!hideProjectColumn && (
                <TableCell className="text-center text-sm text-muted-foreground">
                  {b.project?.name ?? '—'}
                </TableCell>
              )}
              {showStageColumn && (
                <TableCell className="text-center text-sm text-muted-foreground">
                  {b.constructionStage ?? '—'}
                </TableCell>
              )}
              <TableCell className="text-center text-sm text-muted-foreground">
                {b.expectedDeliveryDate
                  ? new Date(b.expectedDeliveryDate).toLocaleDateString('es-DO', {
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </TableCell>
              <TableCell className="text-center text-sm">{b.numberOfFloors}</TableCell>
              <TableCell className="text-center">
                <div className="text-sm font-medium">{b.totalUnits}</div>
                <div className="text-[11px] text-muted-foreground">
                  {usd(
                    b.availableValue +
                      b.blockedValue +
                      b.reservedValue +
                      b.soldValue +
                      b.deliveredValue
                  )}
                </div>
              </TableCell>
              <StatCell count={b.availableUnits} value={b.availableValue} color="text-emerald-600" />
              <StatCell count={b.blockedUnits} value={b.blockedValue} color="text-amber-600" />
              <StatCell count={b.reservedUnits} value={b.reservedValue} color="text-blue-600" />
              <StatCell count={b.soldUnits} value={b.soldValue} color="text-rose-600" />
              <StatCell count={b.deliveredUnits} value={b.deliveredValue} color="text-purple-600" />
              <TableCell className="text-center">
                <span
                  className={cn(
                    'inline-flex rounded-md border px-1.5 py-0.5 text-[11px] font-medium',
                    STATUS_BADGE[b.status]
                  )}
                >
                  {STATUS_LABELS[b.status]}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label="Acciones"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/desarrollo/edificios/${b.id}`}>Ver detalles</Link>
                    </DropdownMenuItem>
                    {canManage && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href={`/desarrollo/edificios/${b.id}/editar`}>Editar</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDuplicate(b)}
                          disabled={isPending}
                        >
                          <Copy className="mr-2 h-3.5 w-3.5" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(b)}
                          disabled={isPending}
                          className="text-destructive focus:text-destructive"
                        >
                          Eliminar
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
