'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { ArrowDownNarrowWide, ArrowUpDown, ArrowUpNarrowWide, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { SORT_FIELDS, SORT_DIRS, type ContactFilters } from '@/lib/contacts/schemas'

const FIELD_LABELS: Record<(typeof SORT_FIELDS)[number], string> = {
  lastActivityAt: 'Última actividad',
  createdAt: 'Fecha de creación',
  firstName: 'Nombre',
  iaScore: 'Score IA',
}

export function ContactsSort({ initial }: { initial: ContactFilters }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const currentBy = initial.sortBy ?? 'lastActivityAt'
  const currentDir = initial.sortDir ?? 'desc'
  const isCustom = !(currentBy === 'lastActivityAt' && currentDir === 'desc')
  const label = isCustom ? `Sort: ${FIELD_LABELS[currentBy]}` : 'Sort'

  function update(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null || value === '') params.delete(key)
    else params.set(key, value)
    params.delete('page')
    startTransition(() => router.replace(`?${params.toString()}`))
  }

  function setField(field: string) {
    update('sortBy', field === 'lastActivityAt' ? null : field)
  }

  function setDir(dir: string) {
    update('sortDir', dir === 'desc' ? null : dir)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('h-9 gap-1.5', isCustom && 'border-primary text-primary')}
        >
          {currentDir === 'asc' ? (
            <ArrowUpNarrowWide className="h-3.5 w-3.5" />
          ) : currentDir === 'desc' && isCustom ? (
            <ArrowDownNarrowWide className="h-3.5 w-3.5" />
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5" />
          )}
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-2" align="start">
        <div className="mb-1 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Ordenar por
        </div>
        <ul className="flex flex-col gap-0.5">
          {SORT_FIELDS.map((f) => {
            const active = f === currentBy
            return (
              <li key={f}>
                <button
                  type="button"
                  onClick={() => setField(f)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm',
                    active ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                  )}
                >
                  <span>{FIELD_LABELS[f]}</span>
                  {active && <Check className="h-3.5 w-3.5" />}
                </button>
              </li>
            )
          })}
        </ul>

        <Separator className="my-2" />

        <div className="mb-1 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Dirección
        </div>
        <div className="grid grid-cols-2 gap-1">
          {SORT_DIRS.map((d) => {
            const active = d === currentDir
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDir(d)}
                className={cn(
                  'flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs',
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-transparent hover:bg-muted'
                )}
              >
                {d === 'asc' ? (
                  <ArrowUpNarrowWide className="h-3 w-3" />
                ) : (
                  <ArrowDownNarrowWide className="h-3 w-3" />
                )}
                {d === 'asc' ? 'Ascendente' : 'Descendente'}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
