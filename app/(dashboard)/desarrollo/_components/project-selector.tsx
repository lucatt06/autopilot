'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useTransition } from 'react'
import { Check, ChevronDown, Folder } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { parseProjectIdsFromParam } from '@/lib/projects/filter-utils'

const STORAGE_KEY = 'di_last_projects'

interface ProjectOption {
  id: string
  name: string
  status: string
}

/**
 * Multi-checkbox project picker shown in the DI sidebar header.
 * URL state: ?projects=id1,id2. Empty = all projects.
 * Persists last selection to localStorage and restores it on first load.
 */
export function ProjectSelector({ projects }: { projects: ProjectOption[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const selected = new Set(parseProjectIdsFromParam(searchParams.getAll('projects')))

  // Re-run whenever the URL changes: if no ?projects= param, restore from localStorage.
  // This makes the project selection sticky across all DI pages.
  const searchParamsStr = searchParams.toString()
  useEffect(() => {
    if (searchParams.has('projects')) return
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return
      const ids = saved.split(',').filter(Boolean)
      if (ids.length === 0) return
      const validIds = ids.filter((id) => projects.some((p) => p.id === id))
      if (validIds.length === 0) return
      const params = new URLSearchParams(searchParams.toString())
      params.set('projects', validIds.join(','))
      params.delete('page')
      startTransition(() => router.replace(`?${params.toString()}`))
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParamsStr])

  function applySelection(next: Set<string>) {
    try {
      localStorage.setItem(STORAGE_KEY, Array.from(next).join(','))
    } catch {}
    const params = new URLSearchParams(searchParams.toString())
    if (next.size === 0) {
      params.delete('projects')
    } else {
      params.set('projects', Array.from(next).join(','))
    }
    params.delete('page')
    startTransition(() => router.replace(`?${params.toString()}`))
  }

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    applySelection(next)
  }

  function clear() {
    applySelection(new Set())
  }

  function selectAll() {
    applySelection(new Set(projects.map((p) => p.id)))
  }

  const label =
    selected.size === 0
      ? 'Todos los proyectos'
      : selected.size === 1
        ? (projects.find((p) => selected.has(p.id))?.name ?? '1 proyecto')
        : `${selected.size} proyectos`

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-9 w-full justify-between gap-2 font-normal',
            selected.size > 0 && 'border-primary text-primary'
          )}
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <Folder className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{label}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="flex items-center justify-between p-2 text-xs">
          <span className="font-medium uppercase tracking-wide text-muted-foreground">
            Proyectos
          </span>
          {selected.size > 0 ? (
            <button
              type="button"
              onClick={clear}
              className="text-xs text-primary hover:underline"
            >
              Limpiar
            </button>
          ) : (
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-primary hover:underline"
            >
              Seleccionar todos
            </button>
          )}
        </div>
        <Separator />
        {projects.length === 0 ? (
          <div className="p-3 text-xs text-muted-foreground">
            No hay proyectos. Crea uno desde el menú Proyectos.
          </div>
        ) : (
          <ul className="max-h-80 overflow-y-auto p-1">
            {projects.map((p) => {
              const isActive = selected.has(p.id)
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => toggle(p.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm',
                      isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                    )}
                  >
                    <Checkbox checked={isActive} className="pointer-events-none" />
                    <span className="flex-1 truncate text-left">{p.name}</span>
                    {isActive && <Check className="h-3.5 w-3.5" />}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
