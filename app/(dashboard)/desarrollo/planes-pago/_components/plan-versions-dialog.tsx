'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, History, Loader2, RotateCcw, Eye } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { PlanDetailView, type PlanDetailData } from '@/components/payment-plans/plan-detail-view'
import {
  getPaymentPlanVersions,
  restorePaymentPlanVersion,
  type PlanVersionListItem,
} from '@/app/actions/payment-plans'

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Map a stored snapshot into the shape PlanDetailView expects. */
function snapshotToDetail(v: PlanVersionListItem): PlanDetailData {
  const s = v.snapshot
  return {
    id: v.id,
    name: s.name,
    status: s.status,
    currency: s.currency,
    projectName: s.projectName,
    customerName: s.customerName,
    deliveryDate: s.deliveryDate,
    createdAt: v.createdAt,
    totalPrice: s.totalPrice,
    totalPaid: s.totalPaid,
    reservationAmount: s.reservationAmount,
    initialAmount: s.initialAmount,
    constructionAmount: s.constructionAmount,
    finalAmount: s.finalAmount,
    initialPercent: s.initialPercent,
    constructionPercent: s.constructionPercent,
    finalPercent: s.finalPercent,
    constructionInstallmentsCount: s.constructionInstallmentsCount,
    constructionPeriodicityMonths: s.constructionPeriodicityMonths,
    installments: s.installments.map((i, idx) => ({
      id: `${i.type}-${i.installmentNumber}-${idx}`,
      type: i.type,
      installmentNumber: i.installmentNumber,
      label: i.label,
      expectedAmount: i.expectedAmount,
      paidAmount: i.paidAmount,
      dueDate: i.dueDate,
      status: i.status,
    })),
  }
}

interface PlanVersionsDialogProps {
  planId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  canManage: boolean
}

export function PlanVersionsDialog({ planId, open, onOpenChange, canManage }: PlanVersionsDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [versions, setVersions] = useState<PlanVersionListItem[]>([])
  const [viewing, setViewing] = useState<PlanVersionListItem | null>(null)
  const [confirmRestore, setConfirmRestore] = useState<PlanVersionListItem | null>(null)
  const [isRestoring, startRestore] = useTransition()

  useEffect(() => {
    if (!open) { setViewing(null); return }
    setLoading(true)
    getPaymentPlanVersions(planId)
      .then(setVersions)
      .catch(() => toast.error('No se pudieron cargar las versiones'))
      .finally(() => setLoading(false))
  }, [open, planId])

  function handleRestore(v: PlanVersionListItem) {
    startRestore(async () => {
      const res = await restorePaymentPlanVersion(planId, v.id)
      if (res.ok) {
        toast.success(`Plan restaurado a la versión ${v.versionNumber}`)
        setConfirmRestore(null)
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden p-0">
          {viewing ? (
            /* ─── Single version preview ─── */
            <div className="flex max-h-[85vh] flex-col">
              <DialogHeader className="flex-row items-center gap-2 border-b px-5 py-3 text-left">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewing(null)} aria-label="Volver">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <DialogTitle className="text-base">Versión {viewing.versionNumber}</DialogTitle>
                  <DialogDescription className="text-xs">
                    {formatDateTime(viewing.createdAt)}
                    {viewing.createdByName ? ` · ${viewing.createdByName}` : ''}
                  </DialogDescription>
                </div>
                {canManage && (
                  <Button size="sm" onClick={() => setConfirmRestore(viewing)}>
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restablecer
                  </Button>
                )}
              </DialogHeader>
              <div className="overflow-y-auto px-5 py-4">
                <PlanDetailView plan={snapshotToDetail(viewing)} />
              </div>
            </div>
          ) : (
            /* ─── Version list ─── */
            <div className="flex max-h-[85vh] flex-col">
              <DialogHeader className="border-b px-5 py-3 text-left">
                <DialogTitle className="flex items-center gap-2 text-base">
                  <History className="h-4 w-4" /> Historial de versiones
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Cada vez que se guarda el plan se conserva una versión. Puedes ver y restablecer cualquiera.
                </DialogDescription>
              </DialogHeader>
              <div className="overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando…
                  </div>
                ) : versions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <History className="h-10 w-10 text-muted-foreground/40" />
                    <p className="mt-3 text-sm font-medium">Sin versiones aún</p>
                    <p className="mt-1 text-xs text-muted-foreground">Guarda el plan para crear la primera versión.</p>
                  </div>
                ) : (
                  <ul className="divide-y">
                    {versions.map((v, idx) => (
                      <li key={v.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                          v{v.versionNumber}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            {formatDateTime(v.createdAt)}
                            {idx === 0 && (
                              <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                                Actual
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {v.createdByName ?? 'Sistema'} · {v.snapshot.name}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setViewing(v)}>
                          <Eye className="mr-1.5 h-3.5 w-3.5" /> Ver
                        </Button>
                        {canManage && idx !== 0 && (
                          <Button variant="ghost" size="sm" onClick={() => setConfirmRestore(v)}>
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restablecer
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Restore confirmation */}
      <AlertDialog open={!!confirmRestore} onOpenChange={(o) => { if (!o) setConfirmRestore(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Restablecer esta versión?</AlertDialogTitle>
            <AlertDialogDescription>
              El plan volverá al estado de la <span className="font-semibold">versión {confirmRestore?.versionNumber}</span>
              {confirmRestore ? ` (${formatDateTime(confirmRestore.createdAt)})` : ''}. El estado actual se conserva como una versión más en el historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); if (confirmRestore) handleRestore(confirmRestore) }}
              disabled={isRestoring}
            >
              {isRestoring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-1.5 h-3.5 w-3.5" />}
              Restablecer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
