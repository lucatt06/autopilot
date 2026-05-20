'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Folder } from 'lucide-react'

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
import { useInheritedProjectId } from '@/lib/projects/use-inherited-project'
import { PriceInput } from '@/components/ui/price-input'

const NONE = '__none__'

interface DefaultValues {
  type: string
  bedrooms: number
  bathrooms: number
  squareMeters: number
  terraceSquareMeters?: number | null
  basePrice: number
  currentPrice: number
  view?: string | null
  orientation?: string | null
  internalNotes?: string | null
  floorPlan?: string | null
}

interface Props {
  projects: { id: string; name: string }[]
  buildings: { id: string; name: string; projectId: string; numberOfFloors: number }[]
  defaultBuildingId?: string
  defaultProjectId?: string
  defaultValues?: DefaultValues
}

export function NewUnitForm({ projects, buildings, defaultBuildingId, defaultProjectId, defaultValues }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState(defaultValues?.type ?? '2 Hab')
  const [status, setStatus] = useState('DISPONIBLE')
  const [view, setView] = useState(defaultValues?.view ?? NONE)
  const [buildingId, setBuildingId] = useState(defaultBuildingId ?? NONE)

  // The contextual building (if any) determines the project; otherwise the
  // global selector does. When inherited, the project picker is hidden entirely.
  const contextualProjectId =
    defaultBuildingId ? buildings.find((b) => b.id === defaultBuildingId)?.projectId : undefined
  const inheritedProjectId = useInheritedProjectId(contextualProjectId)
  const inheritedProject = inheritedProjectId
    ? projects.find((p) => p.id === inheritedProjectId)
    : undefined

  const [pickedProjectId, setPickedProjectId] = useState(defaultProjectId ?? NONE)
  const projectId = inheritedProjectId ?? pickedProjectId

  const filteredBuildings =
    projectId === NONE ? buildings : buildings.filter((b) => b.projectId === projectId)

  function onSubmit(formData: FormData) {
    if (buildingId === NONE) {
      setError('Selecciona un edificio')
      return
    }
    setError(null)
    // The unit's project always follows its building (server re-derives it too).
    const resolvedProjectId =
      buildings.find((b) => b.id === buildingId)?.projectId ??
      (projectId !== NONE ? projectId : '')
    const input = {
      buildingId,
      projectId: resolvedProjectId,
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

      const params = new URLSearchParams()
      if (buildingId !== NONE) params.set('buildingId', buildingId)
      params.set('copyFrom', result.data!.id)

      toast.success(`Unidad ${input.unitNumber} creada`, {
        action: {
          label: 'Crear similar',
          onClick: () => router.push(`/desarrollo/unidades/nuevo?${params}`),
        },
        duration: 8000,
      })
      router.push(`/desarrollo/unidades/${result.data?.id}`)
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
          {inheritedProject ? (
            <div className="space-y-2">
              <Label>Proyecto</Label>
              <div className="flex h-10 items-center gap-2 rounded-md border border-primary bg-primary/5 px-3 text-sm font-medium text-primary">
                <Folder className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{inheritedProject.name}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Proyecto</Label>
              <Select value={pickedProjectId} onValueChange={(v) => { setPickedProjectId(v); setBuildingId(NONE) }}>
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
          )}
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
            <Input
              id="bedrooms"
              name="bedrooms"
              type="number"
              min={0}
              disabled={isPending}
              defaultValue={defaultValues?.bedrooms ?? 2}
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
              defaultValue={defaultValues?.bathrooms ?? 2}
            />
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
            <Input
              id="squareMeters"
              name="squareMeters"
              type="number"
              min={1}
              step={0.01}
              required
              disabled={isPending}
              defaultValue={defaultValues?.squareMeters ?? 80}
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
              defaultValue={defaultValues?.terraceSquareMeters ?? undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orientation">Orientación</Label>
            <Input
              id="orientation"
              name="orientation"
              disabled={isPending}
              placeholder="N, S, NE…"
              maxLength={10}
              defaultValue={defaultValues?.orientation ?? undefined}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-muted-foreground">Precios (USD)</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="basePrice">Precio base *</Label>
            <PriceInput
              id="basePrice"
              name="basePrice"
              required
              disabled={isPending}
              defaultValue={defaultValues?.basePrice ?? 150000}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentPrice">Precio actual *</Label>
            <PriceInput
              id="currentPrice"
              name="currentPrice"
              required
              disabled={isPending}
              defaultValue={defaultValues?.currentPrice ?? 150000}
            />
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
            placeholder="https://..."
            defaultValue={defaultValues?.floorPlan ?? undefined}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="internalNotes">Notas internas</Label>
          <Textarea
            id="internalNotes"
            name="internalNotes"
            disabled={isPending}
            rows={3}
            placeholder="Visible solo para admins..."
            defaultValue={defaultValues?.internalNotes ?? undefined}
          />
        </div>
      </fieldset>

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Button asChild variant="outline" disabled={isPending}>
          <a href={defaultBuildingId ? `/desarrollo/edificios/${defaultBuildingId}` : '/desarrollo/unidades'}>
            Cancelar
          </a>
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Crear unidad'}
        </Button>
      </div>
    </form>
  )
}
