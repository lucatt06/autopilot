'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Folder } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { updateBuilding } from '@/app/actions/buildings'
import { BUILDING_STATUSES, STATUS_LABELS } from '@/lib/buildings/schemas'

interface InitialValues {
  id: string
  projectId: string
  projectName: string
  name: string
  numberOfFloors: number
  status: string
  constructionStage: string | null
  expectedDeliveryDate: string | null
  description: string | null
  image: string | null
}

export function EditBuildingForm({ initial }: { initial: InitialValues }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>(initial.status)
  const [numberOfFloors, setNumberOfFloors] = useState<number>(initial.numberOfFloors)

  function onSubmit(formData: FormData) {
    setError(null)
    const input = {
      projectId: initial.projectId,
      name: String(formData.get('name') ?? '').trim(),
      numberOfFloors,
      description: String(formData.get('description') ?? '').trim() || undefined,
      image: String(formData.get('image') ?? '').trim() || undefined,
      status,
      constructionStage: String(formData.get('constructionStage') ?? '').trim() || undefined,
      expectedDeliveryDate: String(formData.get('expectedDeliveryDate') ?? '') || undefined,
    }

    startTransition(async () => {
      const result = await updateBuilding(initial.id, input as never)
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast.success('Edificio actualizado')
      router.back()
    })
  }

  return (
    <form action={onSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <fieldset className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Proyecto</Label>
            <div className="flex h-10 items-center gap-2 rounded-md border border-primary bg-primary/5 px-3 text-sm font-medium text-primary">
              <Folder className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{initial.projectName}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              name="name"
              required
              autoFocus
              placeholder="Ej. Torre A · Edificio Norte"
              maxLength={120}
              disabled={isPending}
              defaultValue={initial.name}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="numberOfFloors">Pisos</Label>
            <Input
              id="numberOfFloors"
              type="number"
              min={1}
              max={200}
              value={numberOfFloors}
              onChange={(e) => setNumberOfFloors(Number(e.target.value) || 1)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUILDING_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="constructionStage">Etapa de construcción</Label>
            <Input
              id="constructionStage"
              name="constructionStage"
              placeholder="Ej. Etapa 1 · Fase A · Cimentación"
              maxLength={80}
              disabled={isPending}
              defaultValue={initial.constructionStage ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expectedDeliveryDate">Entrega proyectada</Label>
            <Input
              id="expectedDeliveryDate"
              name="expectedDeliveryDate"
              type="date"
              disabled={isPending}
              defaultValue={initial.expectedDeliveryDate ?? ''}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            name="description"
            rows={2}
            disabled={isPending}
            placeholder="Notas internas, características del edificio…"
            defaultValue={initial.description ?? ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">URL de imagen</Label>
          <Input
            id="image"
            name="image"
            type="url"
            disabled={isPending}
            placeholder="https://…"
            defaultValue={initial.image ?? ''}
          />
        </div>
      </fieldset>

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" disabled={isPending} onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}
