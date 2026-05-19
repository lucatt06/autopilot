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
  PROJECT_STATUSES,
  PROJECT_TYPES,
  STATUS_LABELS,
  TYPE_LABELS,
  type ProjectFilters,
} from '@/lib/projects/schemas'

const NONE = '__none__'

export function ProjectsFilters({ initial }: { initial: ProjectFilters }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [search, setSearch] = useState(initial.search ?? '')

  useEffect(() => {
    const timer = setTimeout(() => {
      const current = searchParams.get('search') ?? ''
      if (search !== current) update('search', search || null)
    }, 350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  function update(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null || value === '' || value === NONE) params.delete(key)
    else params.set(key, value)
    if (key !== 'page') params.delete('page')
    startTransition(() => router.replace(`?${params.toString()}`))
  }

  const hasFilters = !!initial.search || !!initial.status || !!initial.type

  function clearAll() {
    setSearch('')
    startTransition(() => router.replace('?'))
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-64">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar proyecto"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 pl-8 text-sm"
        />
      </div>

      <Select
        value={initial.status ?? NONE}
        onValueChange={(v) => update('status', v === NONE ? null : v)}
      >
        <SelectTrigger className="h-9 w-44">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Todos los estados</SelectItem>
          {PROJECT_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={initial.type ?? NONE}
        onValueChange={(v) => update('type', v === NONE ? null : v)}
      >
        <SelectTrigger className="h-9 w-40">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Todos los tipos</SelectItem>
          {PROJECT_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {TYPE_LABELS[t]}
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
