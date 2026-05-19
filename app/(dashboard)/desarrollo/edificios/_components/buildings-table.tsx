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

interface BuildingRow {
  id: string
  name: string
  project: { id: string; name: string } | null
  numberOfFloors: number
  unitsPerFloor: number
  status: keyof typeof STATUS_LABELS
  image: string | null
  totalUnits: number
  availableUnits: number
  reservedUnits: number
  blockedUnits: number
  soldUnits: number
}

export function BuildingsTable({
  items,
  canManage,
}: {
  items: BuildingRow[]
  canManage: boolean
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
            ? 'Crea tu primer edificio desde “Nuevo edificio”.'
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
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-medium">Edificio</TableHead>
            <TableHead className="font-medium">Proyecto</TableHead>
            <TableHead className="text-right font-medium">Pisos</TableHead>
            <TableHead className="text-right font-medium">Total</TableHead>
            <TableHead className="text-right font-medium">Disponibles</TableHead>
            <TableHead className="text-right font-medium">Reservadas</TableHead>
            <TableHead className="text-right font-medium">Vendidas</TableHead>
            <TableHead className="font-medium">Estado</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((b) => {
            const soldPct =
              b.totalUnits === 0 ? 0 : Math.round((b.soldUnits / b.totalUnits) * 100)
            return (
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
                <TableCell className="text-sm text-muted-foreground">
                  {b.project?.name ?? '—'}
                </TableCell>
                <TableCell className="text-right text-sm">{b.numberOfFloors}</TableCell>
                <TableCell className="text-right text-sm font-medium">
                  {b.totalUnits}
                </TableCell>
                <TableCell className="text-right text-sm text-emerald-600">
                  {b.availableUnits}
                </TableCell>
                <TableCell className="text-right text-sm text-blue-600">
                  {b.reservedUnits}
                </TableCell>
                <TableCell className="text-right text-sm">
                  <span className="font-medium">{b.soldUnits}</span>
                  <span className="ml-1 text-xs text-muted-foreground">({soldPct}%)</span>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'inline-flex rounded-md border px-1.5 py-0.5 text-[11px] font-medium',
                      STATUS_BADGE[b.status]
                    )}
                  >
                    {STATUS_LABELS[b.status]}
                  </span>
                </TableCell>
                <TableCell>
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
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
