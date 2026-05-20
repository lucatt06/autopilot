'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition, useEffect } from 'react'
import { Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PriceInput } from '@/components/ui/price-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UNIT_STATUSES, STATUS_LABELS, type UnitFilters } from '@/lib/units/schemas'

const NONE = '__none__'

interface Props {
  initial: UnitFilters
  projects: { id: string; name: string }[]
  buildings: { id: string; name: string; projectId: string }[]
  typeOptions: string[]
  globalProjectIds?: string[]
}

export function UnitsFilters({ initial, projects, buildings, typeOptions, globalProjectIds = [] }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [search, setSearch] = useState(initial.search ?? '')
  const [selectedProject, setSelectedProject] = useState(initial.projectId ?? NONE)

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
    if (value === null || value === '' || value === NONE) params.delete(key)
    else params.set(key, value)
    if (key !== 'page') params.delete('page')
    startTransition(() => router.replace(`?${params.toString()}`))
  }

  function handleProjectChange(v: string) {
    setSelectedProject(v)
    const params = new URLSearchParams(searchParams.toString())
    if (v === NONE) {
      params.delete('projectId')
    } else {
      params.set('projectId', v)
    }
    // clear buildingId when project changes
    params.delete('buildingId')
    params.delete('page')
    startTransition(() => router.replace(`?${params.toString()}`))
  }

  const globalSingleId = globalProjectIds.length === 1 ? globalProjectIds[0] : undefined

  const filteredBuildings =
    selectedProject === NONE
      ? buildings
      : buildings.filter((b) => b.projectId === selectedProject)

  const hasFilters =
    !!initial.search ||
    !!initial.projectId ||
    !!initial.buildingId ||
    !!initial.type ||
    !!initial.status ||
    initial.floor !== undefined ||
    initial.priceMin !== undefined ||
    initial.priceMax !== undefined

  function clearAll() {
    setSearch('')
    setSelectedProject(NONE)
    startTransition(() => router.replace('?'))
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-52">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar unidad"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 pl-8 text-sm"
        />
      </div>

      {globalProjectIds.length > 1 ? (
        <div className="flex h-9 items-center rounded-md border border-primary bg-primary/5 px-3 text-sm font-medium text-primary">
          {globalProjectIds.length} proyectos
        </div>
      ) : (
        <Select
          value={globalSingleId ?? selectedProject}
          onValueChange={(v) => {
            if (globalProjectIds.length > 0) return
            handleProjectChange(v)
          }}
          disabled={!!globalSingleId}
        >
          <SelectTrigger className={`h-9 w-48 ${globalSingleId ? 'border-primary text-primary' : ''}`}>
            <SelectValue placeholder="Proyecto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Todos los proyectos</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select
        value={initial.buildingId ?? NONE}
        onValueChange={(v) => update('buildingId', v === NONE ? null : v)}
      >
        <SelectTrigger className="h-9 w-44">
          <SelectValue placeholder="Edificio" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Todos los edificios</SelectItem>
          {filteredBuildings.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={initial.type ?? NONE}
        onValueChange={(v) => update('type', v === NONE ? null : v)}
      >
        <SelectTrigger className="h-9 w-36">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Todos los tipos</SelectItem>
          {typeOptions.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={initial.status ?? NONE}
        onValueChange={(v) => update('status', v === NONE ? null : v)}
      >
        <SelectTrigger className="h-9 w-40">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Todos los estados</SelectItem>
          {UNIT_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder="Piso"
        type="number"
        min={0}
        className="h-9 w-20 text-sm"
        defaultValue={initial.floor ?? ''}
        onChange={(e) => update('floor', e.target.value || null)}
      />

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
