'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { generateUnitsGroups } from '@/app/actions/units'
import { UNIT_TYPES, UNIT_VIEWS, VIEW_LABELS } from '@/lib/units/schemas'
import { PriceInput } from '@/components/ui/price-input'

interface UnitTemplate {
  id: string
  type: string
  bedrooms: number
  bathrooms: number
  squareMeters: number
  basePrice: number
  view?: string
}

interface FloorGroup {
  id: string
  floorStart: number
  floorEnd: number
  numberingStyle: 'floor_letter' | 'floor_number'
  templates: UnitTemplate[]
}

function uid() {
  return Math.random().toString(36).slice(2)
}

function newTemplate(overrides: Partial<UnitTemplate> = {}): UnitTemplate {
  return { id: uid(), type: '2 Hab', bedrooms: 2, bathrooms: 2, squareMeters: 85, basePrice: 150000, ...overrides }
}

function newGroup(floorStart: number, floorEnd: number): FloorGroup {
  return { id: uid(), floorStart, floorEnd, numberingStyle: 'floor_letter', templates: [newTemplate()] }
}

function posLabel(idx: number, style: 'floor_letter' | 'floor_number') {
  return style === 'floor_letter'
    ? String.fromCharCode(65 + idx)
    : String(idx + 1).padStart(2, '0')
}

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

interface Props {
  building: {
    id: string
    name: string
    numberOfFloors: number
    project: { id: string; name: string } | null
  }
}

export function GenerateUnitsForm({ building }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [groups, setGroups] = useState<FloorGroup[]>([newGroup(1, building.numberOfFloors)])

  // --- group helpers ---
  function updateGroup(gId: string, patch: Partial<FloorGroup>) {
    setGroups((gs) => gs.map((g) => (g.id === gId ? { ...g, ...patch } : g)))
  }
  function removeGroup(gId: string) {
    setGroups((gs) => gs.filter((g) => g.id !== gId))
  }
  function addGroup() {
    const last = groups[groups.length - 1]
    const start = last ? last.floorEnd + 1 : 1
    setGroups((gs) => [...gs, newGroup(start, Math.max(start, building.numberOfFloors))])
  }

  // --- template helpers ---
  function updateTemplate(gId: string, tId: string, patch: Partial<UnitTemplate>) {
    setGroups((gs) =>
      gs.map((g) =>
        g.id !== gId ? g : { ...g, templates: g.templates.map((t) => (t.id === tId ? { ...t, ...patch } : t)) }
      )
    )
  }
  function addTemplate(gId: string) {
    setGroups((gs) =>
      gs.map((g) => (g.id !== gId ? g : { ...g, templates: [...g.templates, newTemplate()] }))
    )
  }
  function removeTemplate(gId: string, tId: string) {
    setGroups((gs) =>
      gs.map((g) =>
        g.id !== gId ? g : { ...g, templates: g.templates.filter((t) => t.id !== tId) }
      )
    )
  }

  // --- preview ---
  const preview = groups.map((g) => {
    const totalFloors = Math.max(0, g.floorEnd - g.floorStart + 1)
    const totalUnits = totalFloors * g.templates.length
    const sample = []
    for (let f = g.floorStart; f <= Math.min(g.floorEnd, g.floorStart + 2); f++) {
      sample.push({
        floor: f,
        units: g.templates.map((t, i) => ({
          code: `${f}${posLabel(i, g.numberingStyle)}`,
          type: t.type,
          price: t.basePrice,
        })),
      })
    }
    return { group: g, sample, totalFloors, totalUnits }
  })
  const grandTotal = preview.reduce((acc, p) => acc + p.totalUnits, 0)

  // --- submit ---
  function onSubmit() {
    setError(null)
    const input = {
      buildingId: building.id,
      groups: groups.map((g) => ({
        floorStart: g.floorStart,
        floorEnd: g.floorEnd,
        numberingStyle: g.numberingStyle,
        templates: g.templates.map((t) => ({
          type: t.type,
          bedrooms: t.bedrooms,
          bathrooms: t.bathrooms,
          squareMeters: t.squareMeters,
          basePrice: t.basePrice,
          view: t.view || undefined,
        })),
      })),
    }
    startTransition(async () => {
      const result = await generateUnitsGroups(input as never)
      if (!result.ok) { setError(result.error); return }
      const count = result.data?.created ?? 0
      if (count === 0) toast.info('Todas las unidades ya existían — no se creó ninguna nueva.')
      else toast.success(`${count} unidades creadas exitosamente`)
      router.push(`/desarrollo/edificios/${building.id}`)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Groups */}
      <div className="space-y-4">
        {groups.map((g, gIdx) => (
          <Card key={g.id} className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {gIdx + 1}
                  </span>
                  <CardTitle className="text-sm font-semibold">
                    Pisos {g.floorStart}–{g.floorEnd} · {g.templates.length} tipo{g.templates.length !== 1 ? 's' : ''} por piso
                  </CardTitle>
                </div>
                {groups.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={() => removeGroup(g.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Floor range + numbering */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Piso inicial</Label>
                  <Input
                    type="number" min={0} max={200}
                    value={g.floorStart}
                    onChange={(e) => updateGroup(g.id, { floorStart: Number(e.target.value) || 1 })}
                    disabled={isPending}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Piso final</Label>
                  <Input
                    type="number" min={0} max={200}
                    value={g.floorEnd}
                    onChange={(e) => updateGroup(g.id, { floorEnd: Number(e.target.value) || 1 })}
                    disabled={isPending}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Numeración</Label>
                  <Select
                    value={g.numberingStyle}
                    onValueChange={(v) => updateGroup(g.id, { numberingStyle: v as 'floor_letter' | 'floor_number' })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="floor_letter">Piso + letra (1A, 1B…)</SelectItem>
                      <SelectItem value="floor_number">Piso + número (101, 102…)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Templates table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="pb-1.5 pr-2 text-left font-medium">Pos</th>
                      <th className="pb-1.5 pr-2 text-left font-medium">Tipo</th>
                      <th className="pb-1.5 pr-2 text-center font-medium">Hab</th>
                      <th className="pb-1.5 pr-2 text-center font-medium">Baños</th>
                      <th className="pb-1.5 pr-2 text-right font-medium">m²</th>
                      <th className="pb-1.5 pr-2 text-right font-medium">Precio USD</th>
                      <th className="pb-1.5 pr-2 text-left font-medium">Vista</th>
                      <th className="pb-1.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {g.templates.map((t, tIdx) => (
                      <tr key={t.id} className="group/row">
                        <td className="py-1.5 pr-2">
                          <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded border bg-muted px-1.5 text-xs font-bold">
                            {posLabel(tIdx, g.numberingStyle)}
                          </span>
                        </td>
                        <td className="py-1.5 pr-2">
                          <Select value={t.type} onValueChange={(v) => updateTemplate(g.id, t.id, { type: v })}>
                            <SelectTrigger className="h-7 w-36 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {UNIT_TYPES.map((ut) => (
                                <SelectItem key={ut} value={ut} className="text-xs">{ut}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-1.5 pr-2">
                          <Input
                            type="number" min={0} max={10}
                            value={t.bedrooms}
                            onChange={(e) => updateTemplate(g.id, t.id, { bedrooms: Number(e.target.value) || 0 })}
                            disabled={isPending}
                            className="h-7 w-14 text-center text-xs"
                          />
                        </td>
                        <td className="py-1.5 pr-2">
                          <Input
                            type="number" min={0} max={10} step={0.5}
                            value={t.bathrooms}
                            onChange={(e) => updateTemplate(g.id, t.id, { bathrooms: Number(e.target.value) || 0 })}
                            disabled={isPending}
                            className="h-7 w-14 text-center text-xs"
                          />
                        </td>
                        <td className="py-1.5 pr-2">
                          <Input
                            type="number" min={1} step={0.01}
                            value={t.squareMeters}
                            onChange={(e) => updateTemplate(g.id, t.id, { squareMeters: Number(e.target.value) || 1 })}
                            disabled={isPending}
                            className="h-7 w-20 text-right text-xs"
                          />
                        </td>
                        <td className="py-1.5 pr-2">
                          <PriceInput
                            value={t.basePrice}
                            onValueChange={(v) => updateTemplate(g.id, t.id, { basePrice: v ?? 1 })}
                            disabled={isPending}
                            className="h-7 w-28 text-right text-xs"
                          />
                        </td>
                        <td className="py-1.5 pr-2">
                          <Select
                            value={t.view ?? 'none'}
                            onValueChange={(v) => updateTemplate(g.id, t.id, { view: v === 'none' ? undefined : v })}
                          >
                            <SelectTrigger className="h-7 w-24 text-xs">
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" className="text-xs">—</SelectItem>
                              {UNIT_VIEWS.map((v) => (
                                <SelectItem key={v} value={v} className="text-xs">{VIEW_LABELS[v]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-1.5">
                          <Button
                            type="button" variant="ghost" size="icon"
                            className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100 hover:text-destructive"
                            onClick={() => removeTemplate(g.id, t.id)}
                            disabled={g.templates.length <= 1 || isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button
                type="button" variant="outline" size="sm"
                className="h-7 text-xs"
                onClick={() => addTemplate(g.id)}
                disabled={isPending || g.templates.length >= 26}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Agregar tipo
              </Button>
            </CardContent>
          </Card>
        ))}

        <Button
          type="button" variant="outline"
          className="w-full border-dashed"
          onClick={addGroup}
          disabled={isPending || groups.length >= 20}
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar grupo de pisos
        </Button>
      </div>

      {/* Preview */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vista previa</p>
          <span className="text-xs font-medium">
            Total:{' '}
            <span className="text-primary font-semibold">{grandTotal} unidades</span>
          </span>
        </div>
        {preview.map(({ group, sample, totalFloors, totalUnits }, pIdx) => (
          <div key={group.id} className={pIdx > 0 ? 'mt-3 border-t pt-3' : ''}>
            <p className="mb-1.5 text-xs text-muted-foreground">
              Grupo {pIdx + 1} · {totalFloors} piso{totalFloors !== 1 ? 's' : ''} ×{' '}
              {group.templates.length} unidad{group.templates.length !== 1 ? 'es' : ''} ={' '}
              <span className="font-medium text-foreground">{totalUnits}</span>
            </p>
            <div className="space-y-1">
              {sample.map(({ floor, units }) => (
                <div key={floor} className="flex items-start gap-2">
                  <span className="w-12 shrink-0 pt-0.5 text-right text-[11px] text-muted-foreground">P{floor}</span>
                  <div className="flex flex-wrap gap-1">
                    {units.map((u) => (
                      <span
                        key={u.code}
                        className="inline-flex items-center gap-1 rounded border bg-background px-1.5 py-0.5 text-[11px] font-medium"
                        title={`${u.type} · ${usd(u.price)}`}
                      >
                        {u.code}
                        <span className="text-[10px] text-muted-foreground">{u.type}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {totalFloors > 3 && (
                <p className="pl-14 text-[11px] text-muted-foreground">…y {totalFloors - 3} piso{totalFloors - 3 !== 1 ? 's' : ''} más</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Button asChild variant="outline" disabled={isPending}>
          <a href={`/desarrollo/edificios/${building.id}`}>Cancelar</a>
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isPending || grandTotal === 0}
        >
          {isPending ? 'Generando...' : `Generar ${grandTotal} unidades`}
        </Button>
      </div>
    </div>
  )
}
