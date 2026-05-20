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
import { generateUnits } from '@/app/actions/units'
import { UNIT_TYPES } from '@/lib/units/schemas'

interface Props {
  building: {
    id: string
    name: string
    numberOfFloors: number
    unitsPerFloor: number
    project: { id: string; name: string } | null
  }
}

export function GenerateUnitsForm({ building }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState('2 Hab')
  const [numberingStyle, setNumberingStyle] = useState<string>('floor_number')
  const [preview, setPreview] = useState<{ floor: number; units: string[] }[]>([])

  function buildPreview(
    floorStart: number,
    floorEnd: number,
    unitsPerFloor: number,
    style: string
  ) {
    const rows: { floor: number; units: string[] }[] = []
    let seq = 1
    for (let f = floorStart; f <= Math.min(floorEnd, floorStart + 2); f++) {
      const units: string[] = []
      for (let p = 1; p <= unitsPerFloor; p++) {
        if (style === 'floor_letter') units.push(`${f}${String.fromCharCode(64 + p)}`)
        else if (style === 'floor_number') units.push(`${f}${String(p).padStart(2, '0')}`)
        else units.push(String(seq))
        seq++
      }
      rows.push({ floor: f, units })
    }
    return rows
  }

  function handleChange(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget)
    const fs = Number(fd.get('floorStart') ?? 1)
    const fe = Number(fd.get('floorEnd') ?? building.numberOfFloors)
    const upf = Number(fd.get('unitsPerFloor') ?? building.unitsPerFloor)
    setPreview(buildPreview(fs, fe, upf, numberingStyle))
  }

  function onSubmit(formData: FormData) {
    setError(null)
    const input = {
      buildingId: building.id,
      floorStart: Number(formData.get('floorStart') ?? 1),
      floorEnd: Number(formData.get('floorEnd') ?? building.numberOfFloors),
      unitsPerFloor: Number(formData.get('unitsPerFloor') ?? building.unitsPerFloor),
      type,
      bedrooms: Number(formData.get('bedrooms') ?? 0),
      bathrooms: Number(formData.get('bathrooms') ?? 0),
      squareMeters: Number(formData.get('squareMeters') ?? 0),
      basePrice: Number(formData.get('basePrice') ?? 0),
      numberingStyle: numberingStyle as never,
    }

    startTransition(async () => {
      const result = await generateUnits(input)
      if (!result.ok) {
        setError(result.error)
        return
      }
      const count = result.data?.created ?? 0
      if (count === 0) {
        toast.info('Todas las unidades ya existían — no se creó ninguna nueva.')
      } else {
        toast.success(`${count} unidades creadas exitosamente`)
      }
      router.push(`/desarrollo/edificios/${building.id}`)
      router.refresh()
    })
  }

  return (
    <form action={onSubmit} onChange={handleChange} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-muted-foreground">Rango de pisos</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="floorStart">Piso inicial</Label>
            <Input
              id="floorStart"
              name="floorStart"
              type="number"
              min={1}
              defaultValue={1}
              disabled={isPending}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="floorEnd">Piso final</Label>
            <Input
              id="floorEnd"
              name="floorEnd"
              type="number"
              min={1}
              defaultValue={building.numberOfFloors}
              disabled={isPending}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unitsPerFloor">Unidades por piso</Label>
            <Input
              id="unitsPerFloor"
              name="unitsPerFloor"
              type="number"
              min={1}
              max={50}
              defaultValue={building.unitsPerFloor}
              disabled={isPending}
              required
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-muted-foreground">Tipo y características</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="space-y-2">
            <Label>Tipo de unidad</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
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
              defaultValue={2}
              disabled={isPending}
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
              defaultValue={2}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="squareMeters">m² por unidad</Label>
            <Input
              id="squareMeters"
              name="squareMeters"
              type="number"
              min={1}
              step={0.01}
              defaultValue={80}
              disabled={isPending}
              required
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-muted-foreground">Precio y numeración</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="basePrice">Precio base (USD)</Label>
            <Input
              id="basePrice"
              name="basePrice"
              type="number"
              min={1}
              defaultValue={150000}
              disabled={isPending}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Estilo de numeración</Label>
            <Select
              value={numberingStyle}
              onValueChange={(v) => {
                setNumberingStyle(v)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="floor_number">Piso + número (101, 102…)</SelectItem>
                <SelectItem value="floor_letter">Piso + letra (1A, 1B…)</SelectItem>
                <SelectItem value="sequential">Secuencial (1, 2, 3…)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </fieldset>

      {preview.length > 0 && (
        <div className="rounded-md border bg-muted/30 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Vista previa (primeros pisos)
          </p>
          <div className="space-y-1">
            {preview.map(({ floor, units }) => (
              <div key={floor} className="flex items-center gap-2 text-sm">
                <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                  Piso {floor}
                </span>
                <div className="flex flex-wrap gap-1">
                  {units.map((u) => (
                    <span
                      key={u}
                      className="rounded border bg-background px-1.5 py-0.5 text-xs font-medium"
                    >
                      {u}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Button asChild variant="outline" disabled={isPending}>
          <a href={`/desarrollo/edificios/${building.id}`}>Cancelar</a>
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Generando...' : 'Generar unidades'}
        </Button>
      </div>
    </form>
  )
}
