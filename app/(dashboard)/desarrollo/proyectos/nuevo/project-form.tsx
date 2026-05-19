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
import { createProject } from '@/app/actions/projects'
import {
  PROJECT_STATUSES,
  PROJECT_TYPES,
  STATUS_LABELS,
  TYPE_LABELS,
} from '@/lib/projects/schemas'

import { AmenitiesPicker } from '../_components/amenities-picker'

export function ProjectForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState<string>('RESIDENCIAL')
  const [status, setStatus] = useState<string>('EN_PLANOS')

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
