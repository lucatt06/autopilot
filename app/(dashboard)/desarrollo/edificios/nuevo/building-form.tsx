'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

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
import { createBuilding } from '@/app/actions/buildings'
import { BUILDING_STATUSES, STATUS_LABELS } from '@/lib/buildings/schemas'

export function BuildingForm({
  projects,
  initialProjectId,
}: {
  projects: { id: string; name: string }[]
  initialProjectId?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<string>(
    initialProjectId ?? projects[0]?.id ?? ''
  )
  const [status, setStatus] = useState<string>('EN_CONSTRUCCION')
  const [numberOfFloors, setNumberOfFloors] = useState<number>(5)
  const [unitsPerFloor, setUnitsPerFloor] = useState<number>(4)

  function onSubmit(formData: FormData) {
    setError(null)
    const input = {
      projectId,
      name: String(formData.get('name') ?? '').trim(),
      numberOfFloors,
      unitsPerFloor,
      description: String(formData.get('description') ?? '').trim() || undefined,
      image: String(formData.get('image') ?? '').trim() || undefined,
      status,
      constructionStage: String(formData.get('constructionStage') ?? '').trim() || undefined,
      expectedDeliveryDate: String(formData.get('expectedDeliveryDate') ?? '') || undefined,
    }

    startTransition(async () => {
      const result = await createBuilding(input as never)
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast.success('Edificio creado')
      if (result.data?.id) router.push(`/desarrollo/edificios/${result.data.id}`)
      else router.push('/desarrollo/edificios')
    })
  }

  const previewTotal = numberOfFloors * unitsPerFloor

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
            <Label htmlFor="projectId">Proyecto *</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger id="projectId">
                <SelectValue placeholder="Selecciona un proyecto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            <Label htmlFor="unitsPerFloor">Unidades por piso</Label>
            <Input
              id="unitsPerFloor"
              type="number"
              min={1}
              max={50}
              value={unitsPerFloor}
              onChange={(e) => setUnitsPerFloor(Number(e.target.value) || 1)}
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expectedDeliveryDateTop">Entrega proyectada</Label>
            <Input
              id="expectedDeliveryDateTop"
              name="expectedDeliveryDate"
              type="date"
              disabled={isPending}
            />
          </div>
        </div>

        <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Total potencial de unidades:{' '}
          <span className="font-medium text-foreground">{previewTotal}</span> ·{' '}
          <span>
            Cuando guardes podrás generarlas todas con un click desde el detalle.
          </span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            name="description"
            rows={2}
            disabled={isPending}
            placeholder="Notas internas, características del edificio…"
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
          />
        </div>
      </fieldset>

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Button asChild variant="outline" disabled={isPending}>
          <a href="/desarrollo/edificios">Cancelar</a>
        </Button>
        <Button type="submit" disabled={isPending || !projectId}>
          {isPending ? 'Guardando...' : 'Crear edificio'}
        </Button>
      </div>
    </form>
  )
}
