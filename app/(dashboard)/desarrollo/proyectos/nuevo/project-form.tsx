'use client'

import { Plus, Trash2 } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import { createProject } from '@/app/actions/projects'
import {
  PROJECT_STATUSES,
  PROJECT_TYPES,
  STATUS_LABELS,
  TYPE_LABELS,
} from '@/lib/projects/schemas'

import { AmenitiesPicker } from '../_components/amenities-picker'

interface Stage {
  name: string
  expectedDeliveryDate: string
}

export function ProjectForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState<string>('RESIDENCIAL')
  const [status, setStatus] = useState<string>('EN_PLANOS')
  const [hasStages, setHasStages] = useState(false)
  const [stages, setStages] = useState<Stage[]>([{ name: '', expectedDeliveryDate: '' }])

  function addStage() {
    setStages((prev) => [...prev, { name: '', expectedDeliveryDate: '' }])
  }

  function removeStage(index: number) {
    setStages((prev) => prev.filter((_, i) => i !== index))
  }

  function updateStage(index: number, field: keyof Stage, value: string) {
    setStages((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  function onSubmit(formData: FormData) {
    setError(null)
    const input = {
      name: String(formData.get('name') ?? '').trim(),
      location: String(formData.get('location') ?? '').trim() || undefined,
      address: String(formData.get('address') ?? '').trim() || undefined,
      province: String(formData.get('province') ?? '').trim() || undefined,
      city: String(formData.get('city') ?? '').trim() || undefined,
      sector: String(formData.get('sector') ?? '').trim() || undefined,
      amenities: formData.getAll('amenities').map(String),
      progressPercent: Number(formData.get('progressPercent') ?? 0),
      startDate: String(formData.get('startDate') ?? '') || undefined,
      expectedDeliveryDate: String(formData.get('expectedDeliveryDate') ?? '') || undefined,
      coverImage: String(formData.get('coverImage') ?? '').trim() || undefined,
      type,
      status,
      hasStages,
      stdReservationAmount: formData.get('stdReservationAmount') ? Number(formData.get('stdReservationAmount')) : undefined,
      stdInitialPercent: formData.get('stdInitialPercent') ? Number(formData.get('stdInitialPercent')) : undefined,
      stdConstructionPercent: formData.get('stdConstructionPercent') ? Number(formData.get('stdConstructionPercent')) : undefined,
      stdFinalPercent: formData.get('stdFinalPercent') ? Number(formData.get('stdFinalPercent')) : undefined,
      stages: hasStages
        ? stages
            .filter((s) => s.name.trim())
            .map((s, i) => ({
              name: s.name.trim(),
              expectedDeliveryDate: s.expectedDeliveryDate || undefined,
              order: i,
            }))
        : [],
    }

    startTransition(async () => {
      const result = await createProject(input as never)
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast.success('Proyecto creado')
      if (result.data?.id) {
        router.push(`/desarrollo/proyectos/${result.data.id}`)
      } else {
        router.push('/desarrollo/proyectos')
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
        <legend className="text-sm font-semibold text-muted-foreground">
          Información general
        </legend>

        <div className="space-y-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            name="name"
            required
            disabled={isPending}
            autoFocus
            placeholder="Ej. Coralia Tower"
            maxLength={120}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map((s) => (
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
        <legend className="text-sm font-semibold text-muted-foreground">Ubicación</legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="province">Provincia</Label>
            <Input
              id="province"
              name="province"
              disabled={isPending}
              placeholder="Ej. La Altagracia"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Ciudad</Label>
            <Input id="city" name="city" disabled={isPending} placeholder="Ej. Punta Cana" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sector">Sector</Label>
            <Input id="sector" name="sector" disabled={isPending} placeholder="Ej. Bávaro" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Localidad / referencia</Label>
          <Input id="location" name="location" disabled={isPending} placeholder="Texto libre" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Dirección exacta</Label>
          <Input id="address" name="address" disabled={isPending} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-muted-foreground">Características</legend>
        <p className="text-xs text-muted-foreground">
          Marca las amenidades del proyecto. Puedes agregar personalizadas si tu lista no está aquí.
        </p>
        <AmenitiesPicker />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-muted-foreground">Fechas</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startDate">Fecha de inicio</Label>
            <Input id="startDate" name="startDate" type="date" disabled={isPending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expectedDeliveryDate">Fecha de entrega proyectada</Label>
            <Input
              id="expectedDeliveryDate"
              name="expectedDeliveryDate"
              type="date"
              disabled={isPending}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-muted-foreground">Etapas</legend>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="hasStages" className="text-sm font-medium">
              Entrega en varias etapas
            </Label>
            <p className="text-xs text-muted-foreground">
              Activa esto si el proyecto se entregará en fases o etapas distintas.
            </p>
          </div>
          <Switch
            id="hasStages"
            checked={hasStages}
            onCheckedChange={setHasStages}
            disabled={isPending}
          />
        </div>

        {hasStages && (
          <div className="space-y-3">
            {stages.map((stage, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </div>
                <div className="flex-1 space-y-1">
                  <Input
                    placeholder="Nombre de la etapa"
                    value={stage.name}
                    onChange={(e) => updateStage(i, 'name', e.target.value)}
                    disabled={isPending}
                    maxLength={80}
                  />
                </div>
                <div className="w-40 space-y-1">
                  <Input
                    type="date"
                    value={stage.expectedDeliveryDate}
                    onChange={(e) => updateStage(i, 'expectedDeliveryDate', e.target.value)}
                    disabled={isPending}
                  />
                </div>
                {stages.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeStage(i)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStage}
              disabled={isPending}
              className="mt-1"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Agregar etapa
            </Button>
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-muted-foreground">Plan de Pago Estándar</legend>
        <p className="text-xs text-muted-foreground">
          Define los valores por defecto para planes de pago asociados a este proyecto.
          Se pueden modificar individualmente en cada plan.
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="stdReservationAmount">Reserva estándar ($)</Label>
            <Input
              id="stdReservationAmount"
              name="stdReservationAmount"
              type="number"
              min={0}
              step="0.01"
              placeholder="0"
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stdInitialPercent">% Separación / Inicial</Label>
            <Input
              id="stdInitialPercent"
              name="stdInitialPercent"
              type="number"
              min={0}
              max={100}
              placeholder="20"
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stdConstructionPercent">% Durante construcción</Label>
            <Input
              id="stdConstructionPercent"
              name="stdConstructionPercent"
              type="number"
              min={0}
              max={100}
              placeholder="40"
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stdFinalPercent">% Contra entrega</Label>
            <Input
              id="stdFinalPercent"
              name="stdFinalPercent"
              type="number"
              min={0}
              max={100}
              placeholder="40"
              disabled={isPending}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Los tres porcentajes (Separación + Construcción + Entrega) deben sumar 100%.
        </p>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-muted-foreground">Avance</legend>
        <div className="space-y-2">
          <Label htmlFor="progressPercent">% Avance de obra</Label>
          <Input
            id="progressPercent"
            name="progressPercent"
            type="number"
            min={0}
            max={100}
            defaultValue={0}
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground">
            Valor entre 0 y 100. Se actualiza manualmente desde Edición o vía Avance de Obra (Fase 1H).
          </p>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-muted-foreground">Imagen principal</legend>
        <div className="space-y-2">
          <Label htmlFor="coverImage">URL del render / foto</Label>
          <Input
            id="coverImage"
            name="coverImage"
            type="url"
            disabled={isPending}
            placeholder="https://..."
          />
          <p className="text-xs text-muted-foreground">
            Por ahora se acepta una URL externa. La subida de archivos a Supabase Storage llega en
            la siguiente iteración.
          </p>
        </div>
      </fieldset>

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Button asChild variant="outline" disabled={isPending}>
          <a href="/desarrollo/proyectos">Cancelar</a>
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Crear proyecto'}
        </Button>
      </div>
    </form>
  )
}
