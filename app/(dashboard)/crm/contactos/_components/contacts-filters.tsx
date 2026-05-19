'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition, useEffect } from 'react'
import {
  Calendar as CalendarIcon,
  Check,
  Filter,
  Search,
  Settings2,
  Tag as TagIcon,
  UserCircle2,
} from 'lucide-react'

import { ContactsSort } from './contacts-sort'

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string }>

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { ContactFilters } from '@/lib/contacts/schemas'

interface FilterOption {
  value: string
  label: string
  hint?: string
}

interface AgentRow {
  id: string
  firstName: string
  lastName: string
}

interface TagRow {
  id: string
  name: string
  color: string
}

const CONTACT_TYPE_OPTIONS: FilterOption[] = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'PROSPECTO', label: 'Prospecto' },
  { value: 'CLIENTE', label: 'Cliente' },
  { value: 'AGENTE_INMOBILIARIO', label: 'Agente Inmobiliario' },
  { value: 'REFERIDO', label: 'Referido' },
  { value: 'OTRO', label: 'Otro' },
]

export interface ContactsFiltersProps {
  initial: ContactFilters
  agents: AgentRow[]
  tags: TagRow[]
  sources: string[]
}

export function ContactsFilters({ initial, agents, tags, sources }: ContactsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [search, setSearch] = useState(initial.search ?? '')

  // Debounce search input
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
    if (value === null || value === '') params.delete(key)
    else params.set(key, value)
    if (key !== 'page') params.delete('page')
    startTransition(() => router.replace(`?${params.toString()}`))
  }

  function clearAll() {
    setSearch('')
    startTransition(() => router.replace('?'))
  }

  const hasFilters =
    !!initial.search ||
    !!initial.contactType ||
    !!initial.tagId ||
    !!initial.ownerId ||
    !!initial.source ||
    !!initial.createdFrom ||
    !!initial.createdTo

  // Map current selection labels for the trigger buttons
  const tipoLabel =
    CONTACT_TYPE_OPTIONS.find((o) => o.value === initial.contactType)?.label ?? null
  const tagLabel = tags.find((t) => t.id === initial.tagId)?.name ?? null
  const agentLabel = agents.find((a) => a.id === initial.ownerId)
  const agentName = agentLabel ? `${agentLabel.firstName} ${agentLabel.lastName}` : null
  const fechaLabel =
    initial.createdFrom || initial.createdTo
      ? formatRange(initial.createdFrom, initial.createdTo)
      : null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-56">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 pl-8 text-sm"
        />
      </div>

        <FilterPopover
          icon={TagIcon}
          label="Etiquetas"
          value={tagLabel}
          onClear={() => update('tagId', null)}
        >
          <ListOptions
            options={tags.map((t) => ({ value: t.id, label: t.name, color: t.color }))}
            selected={initial.tagId ?? null}
            onSelect={(v) => update('tagId', v)}
          />
        </FilterPopover>

        <FilterPopover
          icon={UserCircle2}
          iconBadge
          label="Asesores"
          value={agentName}
          onClear={() => update('ownerId', null)}
        >
          <ListOptions
            options={agents.map((a) => ({
              value: a.id,
              label: `${a.firstName} ${a.lastName}`,
            }))}
            selected={initial.ownerId ?? null}
            onSelect={(v) => update('ownerId', v)}
          />
        </FilterPopover>

        <FilterPopover
          icon={SourceIcon}
          label="Fuente"
          value={initial.source ?? null}
          onClear={() => update('source', null)}
        >
          <ListOptions
            options={sources.map((s) => ({ value: s, label: s }))}
            selected={initial.source ?? null}
            onSelect={(v) => update('source', v)}
          />
        </FilterPopover>

        <FilterPopover
          icon={TypeIcon}
          label="Tipo"
          value={tipoLabel}
          onClear={() => update('contactType', null)}
        >
          <ListOptions
            options={CONTACT_TYPE_OPTIONS}
            selected={initial.contactType ?? null}
            onSelect={(v) => update('contactType', v)}
          />
        </FilterPopover>

        <FilterPopover
          icon={CalendarIcon}
          label="Fecha"
          value={fechaLabel}
          onClear={() => {
            update('createdFrom', null)
            setTimeout(() => update('createdTo', null), 0)
          }}
        >
          <DateRangeContent
            from={initial.createdFrom ?? null}
            to={initial.createdTo ?? null}
            onChange={(from, to) => {
              update('createdFrom', from)
              setTimeout(() => update('createdTo', to), 0)
            }}
          />
        </FilterPopover>

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

      <Separator orientation="vertical" className="h-6" />

      <Button variant="outline" size="sm" disabled title="En construcción (paso siguiente)">
        <Filter className="mr-1.5 h-3.5 w-3.5" />
        Advanced filters
      </Button>
      <ContactsSort initial={initial} />

      <div className="ml-auto">
        <Button variant="outline" size="sm" disabled title="En construcción (B.1.7)">
          <Settings2 className="mr-1.5 h-3.5 w-3.5" />
          Manage fields
        </Button>
      </div>
    </div>
  )
}

// ---------------- FilterPopover ----------------

interface FilterPopoverProps {
  icon: IconComponent
  iconBadge?: boolean
  label: string
  value: string | null
  onClear: () => void
  children: React.ReactNode
}

function FilterPopover({ icon: Icon, iconBadge, label, value, onClear, children }: FilterPopoverProps) {
  const active = value !== null
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('relative h-9 gap-1.5 font-normal', active && 'border-primary text-primary')}
        >
          <span className="relative">
            <Icon className="h-3.5 w-3.5" />
            {iconBadge && (
              <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
            )}
          </span>
          {active ? (
            <>
              <span className="text-muted-foreground">{label}:</span>
              <span className="max-w-[10rem] truncate font-medium">{value}</span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  onClear()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onClear()
                  }
                }}
                className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={`Quitar filtro ${label}`}
              >
                ×
              </span>
            </>
          ) : (
            <span>{label}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        {children}
      </PopoverContent>
    </Popover>
  )
}

// ---------------- ListOptions ----------------

interface ListOption {
  value: string
  label: string
  color?: string
}

function ListOptions({
  options,
  selected,
  onSelect,
}: {
  options: ListOption[]
  selected: string | null
  onSelect: (value: string) => void
}) {
  if (options.length === 0) {
    return <div className="p-3 text-xs text-muted-foreground">Sin opciones disponibles.</div>
  }
  return (
    <ul className="max-h-72 overflow-y-auto p-1">
      {options.map((o) => {
        const isActive = o.value === selected
        return (
          <li key={o.value}>
            <button
              type="button"
              onClick={() => onSelect(o.value)}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm',
                isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
              )}
            >
              {o.color ? (
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: o.color }}
                />
              ) : (
                <span className="h-2.5 w-2.5 shrink-0" />
              )}
              <span className="flex-1 truncate text-left">{o.label}</span>
              {isActive && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

// ---------------- DateRangeContent ----------------

function DateRangeContent({
  from,
  to,
  onChange,
}: {
  from: string | null
  to: string | null
  onChange: (from: string | null, to: string | null) => void
}) {
  const range = {
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  }
  return (
    <div className="p-2">
      <Calendar
        mode="range"
        selected={range}
        onSelect={(r) => {
          onChange(r?.from ? toISO(r.from) : null, r?.to ? toISO(r.to) : null)
        }}
        numberOfMonths={1}
      />
      <div className="flex justify-end border-t pt-2">
        <Button variant="ghost" size="sm" onClick={() => onChange(null, null)}>
          Limpiar
        </Button>
      </div>
    </div>
  )
}

// ---------------- Helpers / mini-icons ----------------

function toISO(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

function formatRange(from?: string, to?: string): string | null {
  if (!from && !to) return null
  const fmt = (s: string) =>
    new Date(s).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })
  if (from && to) return `${fmt(from)} – ${fmt(to)}`
  if (from) return `≥ ${fmt(from)}`
  if (to) return `≤ ${fmt(to)}`
  return null
}

// Lightweight bespoke icons (Source ≈ funnel-ish, Type ≈ squares)
function SourceIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 4h18l-7 9v6l-4 2v-8z" />
    </svg>
  )
}

function TypeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}
