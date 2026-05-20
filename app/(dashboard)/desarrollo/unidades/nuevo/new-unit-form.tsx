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
import { createUnit } from '@/app/actions/units'
import { UNIT_STATUSES, UNIT_TYPES, UNIT_VIEWS, STATUS_LABELS, VIEW_LABELS } from '@/lib/units/schemas'

const NONE = '__none__'

interface Props {
  projects: { id: string; name: string }[]
  buildings: { id: string; name: string; projectId: string; numberOfFloors: number }[]
  defaultBuildingId?: string
  defaultProjectId?: string
}

export function NewUnitForm({ projects, buildings, defaultBuildingId, defaultProjectId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState('2 Hab')
  const [status, setStatus] = useState('DISPONIBLE')
  const [view, setView] = useState(NONE)
  const [projectId, setProjectId] = useState(defaultProjectId ?? NONE)
  const [buildingId, setBuildingId] = useState(defaultBuildingId ?? NONE)

  const filteredBuildings =
    projectId === NONE ? buildings : buildings.filter((b) => b.projectId === projectId)

  function onSubmit(formData: FormData) {
    if (buildingId === NONE) {
      setError('Selecciona un edificio')
      return
    }
    setError(null)
    const input = {
      buildingId,
      projectId: projects.find((p) => p.id === projectId)?.id ?? '',
      unitNumber: String(formData.get('unitNumber') ?? '').trim(),
      floor: Number(formData.get('floor') ?? 0),
      type,
      bedrooms: Number(formData.get('bedrooms') ?? 0),
      bathrooms: Number(formData.get('bathrooms') ?? 0),
      squareMeters: Number(formData.get('squareMeters') ?? 0),
      terraceSquareMeters: Number(formData.get('terraceSquareMeters') ?? 0) || undefined,
      basePrice: Number(formData.get('basePrice') ?? 0),
      currentPrice: Number(formData.get('currentPrice') ?? 0),
      view: view === NONE ? undefined : (view as never),
      orientation: String(formData.get('orientation') ?? '').trim() || undefined,
      status: status as never,
      internalNotes: String(formData.get('internalNotes') ?? '').trim() || undefined,
      floorPlan: String(formData.get('floorPlan') ?? '').trim() || undefined,
    }

    startTransition(async () => {
      const result = await createUnit(input)
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast.success('Unidad creada')
      if (result.data?.id) {
        router.push(`/desarrollo/unidades/${result.data.id}`)
      } else {
        router.push('/desarrollo/unidades')
      }
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
        <legend className="text-sm font-semibold text-muted-foreground">Ubicación</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Proyecto</Label>
            <Select value={projectId} onValueChange={(v) => { setProjectId(v); setBuildingId(NONE) }}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar proyecto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Todos los proyectos</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Edificio *</Label>
            <Select value={buildingId} onValueChange={setBuildingId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar edificio" />
              </SelectTrigger>
              <SelectContent>
                {filteredBuildings.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </fieldset>

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
              autoFocus
              placeholder="Ej. 101, PH-A"
              maxLength={20}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="floor">Piso *</Label>
            <Input id="floor" name="floor" type="number" min={0} required disabled={isPending} defaultValue={1} />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNIT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
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
            <Label>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNIT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bedrooms">Habitaciones</Label>
            <Input id="bedrooms" name="bedrooms" type="number" min={0} disabled={isPending} defaultValue={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bathrooms">Baños</Label>
            <Input id="bathrooms" name="bathrooms" type="number" min={0} step={0.5} disabled={isPending} defaultValue={2} />
          </div>
          <div className="space-y-2">
            <Label>Vista</Label>
            <Select value={view} onValueChange={setView}>
              <SelectTrigger><SelectValue placeholder="Sin vista" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sin vista especificada</SelectItem>
                {UNIT_VIEWS.map((v) => <SelectItem key={v} value={v}>{VIEW_LABELS[v]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="squareMeters">m² *</Label>
            <Input id="squareMeters" name="squareMeters" type="number" min={1} step={0.01} required disabled={isPending} defaultValue={80} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="terraceSquareMeters">m² Terraza</Label>
            <Input id="terraceSquareMeters" name="terraceSquareMeters" type="number" min={0} step={0.01} disabled={isPending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orientation">Orientación</Label>
            <Input id="orientation" name="orientation" disabled={isPending} placeholder="N, S, NE…" maxLength={10} />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-muted-foreground">Precios (USD)</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="basePrice">Precio base *</Label>
            <Input id="basePrice" name="basePrice" type="number" min={1} required disabled={isPending} defaultValue={150000} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentPrice">Precio actual *</Label>
            <Input id="currentPrice" name="currentPrice" type="number" min={1} required disabled={isPending} defaultValue={150000} />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-muted-foreground">Extras</legend>
        <div className="space-y-2">
          <Label htmlFor="floorPlan">URL del plano</Label>
          <Input id="floorPlan" name="floorPlan" type="url" disabled={isPending} placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="internalNotes">Notas internas</Label>
          <Textarea id="internalNotes" name="internalNotes" disabled={isPending} rows={3} placeholder="Visible solo para admins..." />
        </div>
      </fieldset>

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Button asChild variant="outline" disabled={isPending}>
          <a href="/desarrollo/unidades">Cancelar</a>
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Crear unidad'}
        </Button>
      </div>
    </form>
  )
}
