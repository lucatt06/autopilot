'use client'

import Link from 'next/link'
import { Download, Pencil, Share2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

interface PlanViewActionsProps {
  planId: string
  canManage: boolean
}

export function PlanViewActions({ planId, canManage }: PlanViewActionsProps) {
  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/p/planes-pago/${planId}`

  function handleShare() {
    const url = `${window.location.origin}/p/planes-pago/${planId}`
    navigator.clipboard.writeText(url).then(
      () => toast.success('Enlace público copiado al portapapeles'),
      () => toast.error('No se pudo copiar el enlace'),
    )
  }

  function handlePdf() {
    // Open the public (print-optimised) page and trigger print
    const url = `${window.location.origin}/p/planes-pago/${planId}?print=1`
    window.open(url, '_blank')
  }

  return (
    <div className="flex items-center justify-end gap-2 border-t pt-4">
      <Button variant="outline" onClick={handlePdf}>
        <Download className="mr-1.5 h-4 w-4" /> Descargar PDF
      </Button>
      <Button variant="outline" onClick={handleShare}>
        <Share2 className="mr-1.5 h-4 w-4" /> Compartir
      </Button>
      {canManage && (
        <Button asChild>
          <Link href={`/desarrollo/planes-pago/${planId}/editar`}>
            <Pencil className="mr-1.5 h-4 w-4" /> Editar Plan
          </Link>
        </Button>
      )}
    </div>
  )
}
