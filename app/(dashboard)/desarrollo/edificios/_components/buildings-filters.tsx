'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition, useEffect } from 'react'
import { Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BUILDING_STATUSES,
  STATUS_LABELS,
  type BuildingFilters,
} from '@/lib/buildings/schemas'

const NONE = '__none__'

export function BuildingsFilters({
  initial,
  projects,
}: {
  initial: BuildingFilters
  projects: { id: string; name: string }[]
}) {
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
    if (value === null || value === '' || value === NONE) params.delete(key)
    else params.set(key, value)
    if (key !== 'page') params.delete('page')
    startTransition(() => router.replace(`?${params.toString()}`))
  }

  const hasFilters = !!initial.search || !!initial.projectId || !!initial.status

  function clearAll() {
    setSearch('')
    startTransition(() => router.replace('?'))
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-64">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar edificio"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 pl-8 text-sm"
        />
      </div>

      <Select
        value={initial.projectId ?? NONE}
        onValueChange={(v) => update('projectId', v === NONE ? null : v)}
      >
        <SelectTrigger className="h-9 w-48">
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

      <Select
        value={initial.status ?? NONE}
        onValueChange={(v) => update('status', v === NONE ? null : v)}
      >
        <SelectTrigger className="h-9 w-44">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Todos los estados</SelectItem>
          {BUILDING_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
