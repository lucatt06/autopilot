'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition, useEffect } from 'react'
import { Folder, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MultiSelect } from '@/components/ui/multi-select'
import { PriceInput } from '@/components/ui/price-input'
import {
  UNIT_STATUSES,
  STATUS_LABELS,
  UNIT_VIEWS,
  VIEW_LABELS,
  UNIT_ORIENTATIONS,
  type UnitFilters,
} from '@/lib/units/schemas'

interface Props {
  initial: UnitFilters
  projects: { id: string; name: string }[]
  buildings: { id: string; name: string; projectId: string }[]
  typeOptions: string[]
  globalProjectIds?: string[]
}

export function AvailabilityFilters({
  initial,
  projects,
  buildings,
  typeOptions,
  globalProjectIds = [],
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [search, setSearch] = useState(initial.search ?? '')

  useEffect(() => {
    const t = setTimeout(() => {
      const cur = searchParams.get('search') ?? ''
      if (search !== cur) update('search', search || null)
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  function update(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null || value === '') params.delete(key)
    else params.set(key, value)
    if (key !== 'page') params.delete('page')
    startTransition(() => router.replace(`?${params.toString()}`))
  }

  function updateMulti(key: string, values: string[]) {
    update(key, values.length > 0 ? values.join(',') : null)
  }

  // Parse current multi-select values from URL
  const selectedBuildings = (initial.buildingIds ?? '').split(',').filter(Boolean)
  const selectedTypes    = (initial.types ?? '').split(',').filter(Boolean)
  const selectedStatuses = (initial.statuses ?? '').split(',').filter(Boolean)
  const selectedViews    = (initial.views ?? '').split(',').filter(Boolean)
  const selectedOrients  = (initial.orientations ?? '').split(',').filter(Boolean)

  // Filter buildings by currently selected project (global) if applicable
  const globalSingleId = globalProjectIds.length === 1 ? globalProjectIds[0] : undefined
  const filteredBuildings = globalSingleId
    ? buildings.filter((b) => b.projectId === globalSingleId)
    : buildings

  const hasFilters =
    !!initial.search ||
    selectedBuildings.length > 0 ||
    selectedTypes.length > 0 ||
    selectedStatuses.length > 0 ||
    selectedViews.length > 0 ||
    selectedOrients.length > 0 ||
    initial.floor !== undefined ||
    initial.priceMin !== undefined ||
    initial.priceMax !== undefined

  function clearAll() {
    setSearch('')
    const params = new URLSearchParams(searchParams.toString())
    // Preserve projects param
    const projectsVal = params.get('projects')
    params.forEach((_, k) => params.delete(k))
    if (projectsVal) params.set('projects', projectsVal)
    startTransition(() => router.replace(`?${params.toString()}`))
  }

  // Project badge (read-only when inherited)
  const projectLabel =
    globalProjectIds.length === 1
      ? (projects.find((p) => p.id === globalProjectIds[0])?.name ?? 'Proyecto')
      : globalProjectIds.length > 1
        ? `${globalProjectIds.length} proyectos`
        : null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative w-52">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar unidad"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 pl-8 text-sm"
        />
      </div>

      {/* Project — read-only chip when inherited */}
      {projectLabel && (
        <div className="flex h-9 items-center gap-1.5 rounded-md border border-primary bg-primary/5 px-3 text-sm font-medium text-primary">
          <Folder className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate max-w-[10rem]">{projectLabel}</span>
        </div>
      )}

      {/* Edificio — multi */}
      <MultiSelect
        options={filteredBuildings.map((b) => ({ value: b.id, label: b.name }))}
        selected={selectedBuildings}
        onChange={(v) => updateMulti('buildingIds', v)}
        placeholder="Todos los edificios"
        className="w-44"
      />

      {/* Tipo — multi */}
      <MultiSelect
        options={typeOptions.map((t) => ({ value: t, label: t }))}
        selected={selectedTypes}
        onChange={(v) => updateMulti('types', v)}
        placeholder="Todos los tipos"
        className="w-36"
      />

      {/* Estado — multi */}
      <MultiSelect
        options={UNIT_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
        selected={selectedStatuses}
        onChange={(v) => updateMulti('statuses', v)}
        placeholder="Todos los estados"
        className="w-40"
      />

      {/* Piso */}
      <Input
        placeholder="Piso"
        type="number"
        min={0}
        className="h-9 w-20 text-sm"
        defaultValue={initial.floor ?? ''}
        onChange={(e) => update('floor', e.target.value || null)}
      />

      {/* Precio mín/máx */}
      <PriceInput
        placeholder="Precio mín"
        className="h-9 w-32 text-sm"
        defaultValue={initial.priceMin}
        onValueChange={(v) => update('priceMin', v != null ? String(v) : null)}
      />
      <PriceInput
        placeholder="Precio máx"
        className="h-9 w-32 text-sm"
        defaultValue={initial.priceMax}
        onValueChange={(v) => update('priceMax', v != null ? String(v) : null)}
      />

      {/* Vista — multi */}
      <MultiSelect
        options={UNIT_VIEWS.map((v) => ({ value: v, label: VIEW_LABELS[v] }))}
        selected={selectedViews}
        onChange={(v) => updateMulti('views', v)}
        placeholder="Todas las vistas"
        className="w-36"
      />

      {/* Orientación — multi */}
      <MultiSelect
        options={UNIT_ORIENTATIONS.map((o) => ({ value: o, label: o }))}
        selected={selectedOrients}
        onChange={(v) => updateMulti('orientations', v)}
        placeholder="Todas las orientaciones"
        className="w-44"
      />

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="text-destructive hover:text-destructive"
        >
          Limpiar
        </Button>
      )}
    </div>
  )
}
