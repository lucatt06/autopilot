'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateUnit } from '@/app/actions/units'
import {
  UNIT_STATUSES,
  UNIT_TYPES,
  UNIT_VIEWS,
  STATUS_LABELS,
  VIEW_LABELS,
} from '@/lib/units/schemas'

interface InitialValues {
  id: string
  buildingId: string
  unitNumber: string
  floor: number
  type: string
  bedrooms: number
  bathrooms: number
  squareMeters: number
  terraceSquareMeters: number | null
  basePrice: number
  currentPrice: number
  view: string | null
  orientation: string | null
  status: string
  internalNotes: string | null
  floorPlan: string | null
}

export function EditUnitForm({ unit }: { unit: InitialValues }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState(unit.status)
  const [type, setType] = useState(unit.type)
  const [view, setView] = useState(unit.view ?? '__none__')

  function onSubmit(formData: FormData) {
    setError(null)
    const input = {
      unitNumber: String(formData.get('unitNumber') ?? '').trim(),
      floor: Number(formData.get('floor') ?? 0),
      type,
      bedrooms: Number(formData.get('bedrooms') ?? 0),
      bathrooms: Number(formData.get('bathrooms') ?? 0),
      squareMeters: Number(formData.get('squareMeters') ?? 0),
      terraceSquareMeters: Number(formData.get('terraceSquareMeters') ?? 0) || undefined,
      basePrice: Number(formData.get('basePrice') ?? 0),
      currentPrice: Number(formData.get('currentPrice') ?? 0),
      view: view === '__none__' ? undefined : (view as never),
      orientation: String(formData.get('orientation') ?? '').trim() || undefined,
      status: status as never,
      internalNotes: String(formData.get('internalNotes') ?? '').trim() || undefined,
      floorPlan: String(formData.get('floorPlan') ?? '').trim() || undefined,
    }

    startTransition(async () => {
      const result = await updateUnit(unit.id, input)
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast.success('Unidad actualizada')
      router.push(`/desarrollo/unidades/${unit.id}`)
      router.refresh()
    })
  }

  const NONE = '__none__'

  return (
    <form action={onSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-muted-foreground">Identificación</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="unitNumber">Número de unidad *</Label>
            <Input
              id="unitNumber"
              name="unitNumber"
              required
              disabled={isPending}
              defaultValue={unit.unitNumber}
              placeholder="Ej. 101, PH-A"
              maxLength={20}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="floor">Piso *</Label>
            <Input
              id="floor"
              name="floor"
              type="number"
              min={0}
              required
              disabled={isPending}
              defaultValue={unit.floor}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-muted-foreground">Características</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
                {!UNIT_TYPES.includes(type as never) && (
                  <SelectItem value={type}>{type}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bedrooms">Habitaciones</Label>
            <Input
              id="bedrooms"
              name="bedrooms"
              type="number"
              min={0}
              disabled={isPending}
              defaultValue={unit.bedrooms}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bathrooms">Baños</Label>
            <Input
              id="bathrooms"
              name="bathrooms"
              type="number"
              min={0}
              step={0.5}
              disabled={isPending}
              defaultValue={unit.bathrooms}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="view">Vista</Label>
            <Select value={view} onValueChange={setView}>
              <SelectTrigger id="view">
                <SelectValue placeholder="Sin vista" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sin vista especificada</SelectItem>
                {UNIT_VIEWS.map((v) => (
                  <SelectItem key={v} value={v}>
                    {VIEW_LABELS[v]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="squareMeters">Metros cuadrados *</Label>
            <Input
              id="squareMeters"
              name="squareMeters"
              type="number"
              min={1}
              step={0.01}
              required
              disabled={isPending}
              defaultValue={unit.squareMeters}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="terraceSquareMeters">m² Terraza</Label>
            <Input
              id="terraceSquareMeters"
              name="terraceSquareMeters"
              type="number"
              min={0}
              step={0.01}
              disabled={isPending}
              defaultValue={unit.terraceSquareMeters ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orientation">Orientación</Label>
            <Input
              id="orientation"
              name="orientation"
              disabled={isPending}
              defaultValue={unit.orientation ?? ''}
              placeholder="N, S, E, W, NE..."
              maxLength={10}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-muted-foreground">Precios</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="basePrice">Precio base (USD) *</Label>
            <Input
              id="basePrice"
              name="basePrice"
              type="number"
              min={1}
              required
              disabled={isPending}
              defaultValue={unit.basePrice}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentPrice">Precio actual (USD) *</Label>
            <Input
              id="currentPrice"
              name="currentPrice"
              type="number"
              min={1}
              required
              disabled={isPending}
              defaultValue={unit.currentPrice}
            />
            <p className="text-xs text-muted-foreground">
              Puede diferir del precio base si hay descuento o ajuste.
            </p>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-muted-foreground">Extras</legend>
        <div className="space-y-2">
          <Label htmlFor="floorPlan">URL del plano</Label>
          <Input
            id="floorPlan"
            name="floorPlan"
            type="url"
            disabled={isPending}
            defaultValue={unit.floorPlan ?? ''}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="internalNotes">Notas internas</Label>
          <Textarea
            id="internalNotes"
            name="internalNotes"
            disabled={isPending}
            defaultValue={unit.internalNotes ?? ''}
            rows={3}
            placeholder="Visible solo para admins..."
          />
        </div>
      </fieldset>

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Button asChild variant="outline" disabled={isPending}>
          <a href={`/desarrollo/unidades/${unit.id}`}>Cancelar</a>
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}
