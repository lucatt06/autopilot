'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, History, MoreHorizontal, Pencil, Share2, Trash2 } from 'lucide-react'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deletePaymentPlan } from '@/app/actions/payment-plans'
import { PlanVersionsDialog } from './plan-versions-dialog'

interface PlanRowActionsProps {
  id: string
  name: string
  canManage: boolean
}

export function PlanRowActions({ id, name, canManage }: PlanRowActionsProps) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [versionsOpen, setVersionsOpen] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const result = await deletePaymentPlan(id)
    setDeleting(false)
    setDeleteOpen(false)
    if (result.ok) {
      toast.success('Plan eliminado')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        {/* Eye: view */}
        <Button asChild variant="ghost" size="icon" className="h-8 w-8" aria-label="Ver plan">
          <Link href={`/desarrollo/planes-pago/${id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>

        {/* Edit */}
        {canManage && (
          <Button asChild variant="ghost" size="icon" className="h-8 w-8" aria-label="Editar plan">
            <Link href={`/desarrollo/planes-pago/${id}/editar`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
        )}

        {/* Three-dots menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Más opciones">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem asChild>
              <Link href={`/desarrollo/planes-pago/${id}`} className="flex items-center gap-2">
                <Eye className="h-4 w-4" /> Ver
              </Link>
            </DropdownMenuItem>
            {canManage && (
              <DropdownMenuItem asChild>
                <Link href={`/desarrollo/planes-pago/${id}/editar`} className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" /> Editar
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="flex items-center gap-2"
              onClick={() => {
                const url = `${window.location.origin}/p/planes-pago/${id}`
                navigator.clipboard.writeText(url).then(
                  () => toast.success('Enlace público copiado'),
                  () => toast.error('No se pudo copiar el enlace'),
                )
              }}
            >
              <Share2 className="h-4 w-4" /> Compartir
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2" onClick={() => setVersionsOpen(true)}>
              <History className="h-4 w-4" /> Versiones
            </DropdownMenuItem>
            {canManage && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center gap-2 text-destructive focus:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4" /> Eliminar
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar plan de pago?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <span className="font-semibold">{name}</span> permanentemente. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Eliminando…' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Version history dialog */}
      <PlanVersionsDialog planId={id} open={versionsOpen} onOpenChange={setVersionsOpen} canManage={canManage} />
    </>
  )
}
