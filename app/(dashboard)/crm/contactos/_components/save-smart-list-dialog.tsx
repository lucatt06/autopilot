'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Bookmark } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { createSavedView } from '@/app/actions/saved-views'

/**
 * Lista de query params que NO se guardan como parte de la smart list.
 * El usuario navega entre tabs y la paginación se resetea al cambiar.
 */
const NON_FILTER_PARAMS = new Set(['page', 'list'])

export function SaveSmartListDialog({ canShare }: { canShare: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [isShared, setIsShared] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Snapshot of current URL filters (excluding pagination)
  const filters: Record<string, string> = {}
  for (const [k, v] of searchParams.entries()) {
    if (!NON_FILTER_PARAMS.has(k)) filters[k] = v
  }

  const hasFilters = Object.keys(filters).length > 0
  if (!hasFilters) return null

  function reset() {
    setName('')
    setIsShared(false)
    setError(null)
  }

  function onSubmit(formData: FormData) {
    setError(null)
    const trimmed = String(formData.get('name') ?? '').trim()
    if (!trimmed) {
      setError('Ponle un nombre a la lista')
      return
    }

    startTransition(async () => {
      const result = await createSavedView({
        name: trimmed,
        entityType: 'contact',
        filters,
        isShared,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast.success(`"${trimmed}" guardada`)
      setOpen(false)
      reset()
      router.refresh()
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5">
          <Bookmark className="h-3.5 w-3.5" />
          Save as smart list
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Guardar como Smart List</DialogTitle>
          <DialogDescription>
            La combinación actual de filtros quedará como un tab fijo arriba de la lista.
          </DialogDescription>
        </DialogHeader>

        <form action={onSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="smartlist-name">Nombre</Label>
            <Input
              id="smartlist-name"
              name="name"
              placeholder="Ej. Leads calientes — Punta Cana"
              maxLength={60}
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
            />
          </div>

          {canShare && (
            <div className="flex items-start gap-2 rounded-md border bg-muted/30 p-3">
              <Checkbox
                id="smartlist-shared"
                checked={isShared}
                onCheckedChange={(v) => setIsShared(v === true)}
                disabled={isPending}
              />
              <div className="space-y-1">
                <Label htmlFor="smartlist-shared" className="font-medium leading-tight">
                  Compartir con el equipo
                </Label>
                <p className="text-xs text-muted-foreground">
                  Todos los usuarios del workspace verán este tab. Solo tú podrás editarlo o eliminarlo.
                </p>
              </div>
            </div>
          )}

          <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
            <span className="font-medium">Filtros guardados: </span>
            {Object.entries(filters)
              .map(([k, v]) => `${k}=${v}`)
              .join(' · ') || 'ninguno'}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
