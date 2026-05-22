'use client'

import { useMemo, useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarPlus,
  CheckSquare,
  ChevronLeft,
  LayoutGrid,
  List as ListIcon,
  MessageSquare,
  Phone,
  RotateCcw,
  Search,
  StickyNote,
  Tag,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { setPosventaStage, resetPosventaStage } from '@/app/actions/funnels'
import type { PosventaCard, PosventaColumn, PosventaStageDef, PosventaStageKey } from '@/lib/funnels/posventa'

function money(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)
}

const UNIT_STATUS_DOT: Record<string, string> = {
  DISPONIBLE: 'bg-emerald-500',
  BLOQUEADA: 'bg-yellow-500',
  RESERVADA: 'bg-blue-500',
  VENDIDA: 'bg-red-500',
  ENTREGADA: 'bg-teal-500',
}

const UNIT_STATUS_LABEL: Record<string, string> = {
  DISPONIBLE: 'Disponible',
  BLOQUEADA: 'Bloqueada',
  RESERVADA: 'Reservada',
  VENDIDA: 'Vendida',
  ENTREGADA: 'Entregada',
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

type SortKey = 'none' | 'price_desc' | 'price_asc' | 'client_asc' | 'unit_asc'

// ─── Fixed-height custom scrollbar ───────────────────────────────────────────
// Gives every funnel column the same thumb length regardless of card count.
const THUMB_H = 48

function FixedScrollbar({ scrollRef }: { scrollRef: React.RefObject<HTMLDivElement> }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [thumbTop, setThumbTop] = useState(0)
  const [visible, setVisible] = useState(false)
  const isDragging = useRef(false)
  const dragStart = useRef({ y: 0, scrollTop: 0 })

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    function update() {
      const track = trackRef.current
      if (!el || !track) return
      const { scrollTop, scrollHeight, clientHeight } = el
      const scrollable = scrollHeight - clientHeight
      if (scrollable <= 0) { setVisible(false); return }
      setVisible(true)
      const maxTop = track.clientHeight - THUMB_H
      setThumbTop(Math.max(0, Math.min((scrollTop / scrollable) * maxTop, maxTop)))
    }

    const ro = new ResizeObserver(update)
    ro.observe(el)
    el.addEventListener('scroll', update, { passive: true })
    update()
    return () => { ro.disconnect(); el.removeEventListener('scroll', update) }
  }, [scrollRef])

  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    isDragging.current = true
    dragStart.current = { y: e.clientY, scrollTop: scrollRef.current?.scrollTop ?? 0 }

    function onMove(e: MouseEvent) {
      if (!isDragging.current || !scrollRef.current || !trackRef.current) return
      const { scrollHeight, clientHeight } = scrollRef.current
      const trackH = trackRef.current.clientHeight
      const scrollable = scrollHeight - clientHeight
      const maxTop = trackH - THUMB_H
      if (maxTop <= 0) return
      scrollRef.current.scrollTop =
        dragStart.current.scrollTop + (e.clientY - dragStart.current.y) * (scrollable / maxTop)
    }

    function onUp() {
      isDragging.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <div ref={trackRef} className="absolute inset-y-2 right-0.5 w-1">
      {visible && (
        <div
          className="absolute w-full cursor-pointer rounded-full bg-gray-300 transition-colors hover:bg-gray-400"
          style={{ height: THUMB_H, top: thumbTop }}
          onMouseDown={onMouseDown}
        />
      )}
    </div>
  )
}

// ─── Column cards area (owns its own scroll ref + custom scrollbar) ───────────
interface ColumnCardsProps {
  cards: PosventaCard[]
  stageKey: PosventaStageKey
  canManage: boolean
  hideProject: boolean
  onDragStart: (unitId: string) => void
  onOpenUnit: (unitId: string) => void
  onReset: (unitId: string) => void
}

function ColumnCards({ cards, stageKey, canManage, hideProject, onDragStart, onOpenUnit, onReset }: ColumnCardsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={scrollRef} className="hide-scrollbar h-full space-y-2 overflow-y-auto p-2 pr-3">
        {cards.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground/60">Sin unidades</p>
        ) : (
          cards.map((card) => (
            <PosventaCardItem
              key={card.unitId}
              card={card}
              canManage={canManage}
              hideProject={hideProject}
              onDragStart={() => onDragStart(card.unitId)}
              onOpenUnit={() => onOpenUnit(card.unitId)}
              onReset={() => onReset(card.unitId)}
            />
          ))
        )}
      </div>
      <FixedScrollbar scrollRef={scrollRef} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

interface PosventaBoardProps {
  columns: PosventaColumn[]
  stages: PosventaStageDef[]
  canManage: boolean
  /** Hide the project row on cards when a project is already selected globally */
  hideProject?: boolean
}

export function PosventaBoard({ columns, stages, canManage, hideProject = false }: PosventaBoardProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [board, setBoard] = useState<Record<string, PosventaCard[]>>(() => {
    const map: Record<string, PosventaCard[]> = {}
    for (const col of columns) map[col.stage.key] = col.cards
    return map
  })
  const [dragOver, setDragOver] = useState<string | null>(null)
  const dragged = useRef<{ unitId: string; from: PosventaStageKey } | null>(null)

  // Toolbar state
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('none')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const totalCards = useMemo(() => Object.values(board).reduce((a, c) => a + c.length, 0), [board])

  function matches(c: PosventaCard): boolean {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      c.unitNumber.toLowerCase().includes(q) ||
      c.buildingName.toLowerCase().includes(q) ||
      c.projectName.toLowerCase().includes(q) ||
      c.type.toLowerCase().includes(q) ||
      (c.clientName?.toLowerCase().includes(q) ?? false)
    )
  }

  function sortCards(cards: PosventaCard[]): PosventaCard[] {
    if (sort === 'none') return cards
    const arr = [...cards]
    switch (sort) {
      case 'price_desc': arr.sort((a, b) => b.currentPrice - a.currentPrice); break
      case 'price_asc': arr.sort((a, b) => a.currentPrice - b.currentPrice); break
      case 'client_asc': arr.sort((a, b) => (a.clientName ?? '').localeCompare(b.clientName ?? '')); break
      case 'unit_asc': arr.sort((a, b) => a.unitNumber.localeCompare(b.unitNumber)); break
    }
    return arr
  }

  function visibleCards(stageKey: string): PosventaCard[] {
    return sortCards((board[stageKey] ?? []).filter(matches))
  }

  // ─── DnD ───
  function handleDrop(toStage: PosventaStageKey) {
    setDragOver(null)
    const info = dragged.current
    dragged.current = null
    if (!info || info.from === toStage) return
    const prev = board
    const card = prev[info.from]?.find((c) => c.unitId === info.unitId)
    if (!card) return
    const moved: PosventaCard = { ...card, stage: toStage, isManual: card.derivedStage !== toStage }
    setBoard({
      ...prev,
      [info.from]: prev[info.from]!.filter((c) => c.unitId !== info.unitId),
      [toStage]: [moved, ...(prev[toStage] ?? [])],
    })
    startTransition(async () => {
      const res = await setPosventaStage(info.unitId, toStage)
      if (!res.ok) { setBoard(prev); toast.error(res.error) }
      else { toast.success('Unidad movida de etapa'); router.refresh() }
    })
  }

  function handleReset(unitId: string) {
    startTransition(async () => {
      const res = await resetPosventaStage(unitId)
      if (!res.ok) toast.error(res.error)
      else { toast.success('Etapa automática restaurada'); router.refresh() }
    })
  }

  function toggleCollapse(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* ─── Toolbar (single row) ─── */}
      <div className="flex items-center gap-3">
        {/* Funnel selector */}
        <Select value="posventa" onValueChange={() => {}}>
          <SelectTrigger className="h-9 w-40 shrink-0 font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="posventa">Posventa</SelectItem>
          </SelectContent>
        </Select>

        {/* Count badge */}
        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          {totalCards} unidades
        </span>

        {/* Search — fills available space */}
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar unidad, cliente o proyecto…"
            className="h-9 pl-8"
          />
        </div>

        {/* Sort */}
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="h-9 w-48 shrink-0">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Orden por defecto</SelectItem>
            <SelectItem value="price_desc">Precio (mayor a menor)</SelectItem>
            <SelectItem value="price_asc">Precio (menor a mayor)</SelectItem>
            <SelectItem value="client_asc">Cliente (A–Z)</SelectItem>
            <SelectItem value="unit_asc">Unidad (A–Z)</SelectItem>
          </SelectContent>
        </Select>

        {/* Grid / List toggle */}
        <div className="flex shrink-0 items-center rounded-md border p-0.5">
          <button
            type="button"
            onClick={() => setView('kanban')}
            className={cn('flex h-7 w-8 items-center justify-center rounded', view === 'kanban' ? 'bg-muted' : 'text-muted-foreground')}
            aria-label="Vista tablero"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            className={cn('flex h-7 w-8 items-center justify-center rounded', view === 'list' ? 'bg-muted' : 'text-muted-foreground')}
            aria-label="Vista lista"
          >
            <ListIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ─── Board ─── */}
      {view === 'kanban' ? (
        <div className="flex min-h-0 flex-1 gap-2 overflow-x-auto pb-1">
          {stages.map((stage) => {
            const cards = visibleCards(stage.key)
            const totalValue = cards.reduce((a, c) => a + c.currentPrice, 0)
            const isOver = dragOver === stage.key
            const isCollapsed = collapsed.has(stage.key)

            if (isCollapsed) {
              return (
                <button
                  key={stage.key}
                  type="button"
                  onClick={() => toggleCollapse(stage.key)}
                  className="flex w-10 shrink-0 flex-col items-center gap-2 rounded-lg border bg-muted/30 py-3 hover:bg-muted/60"
                  title={`Expandir ${stage.label}`}
                >
                  <span className={cn('h-2 w-2 rounded-full', stage.dot)} />
                  <span className="rounded-full bg-background px-1.5 text-[10px] font-medium">{cards.length}</span>
                  <span className={cn('text-xs font-semibold [writing-mode:vertical-rl]', stage.accent)}>{stage.label}</span>
                </button>
              )
            }

            return (
              <div
                key={stage.key}
                className={cn(
                  'flex w-52 shrink-0 flex-col rounded-lg border bg-muted/30 transition-colors',
                  isOver && 'border-primary bg-primary/5',
                )}
                onDragOver={(e) => { if (canManage) { e.preventDefault(); setDragOver(stage.key) } }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver((s) => (s === stage.key ? null : s)) }}
                onDrop={() => canManage && handleDrop(stage.key)}
              >
                {/* Column header */}
                <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={cn('h-2 w-2 shrink-0 rounded-full', stage.dot)} />
                    <div className="min-w-0">
                      <h3 className={cn('truncate text-sm font-semibold', stage.accent)}>{stage.label}</h3>
                      <p className="text-[11px] text-muted-foreground">
                        {cards.length} unidades · {money(totalValue)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleCollapse(stage.key)}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="Colapsar columna"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>

                {/* Cards — each column scrolls independently with a fixed-height thumb */}
                <ColumnCards
                  cards={cards}
                  stageKey={stage.key}
                  canManage={canManage}
                  hideProject={hideProject}
                  onDragStart={(unitId) => { dragged.current = { unitId, from: stage.key } }}
                  onOpenUnit={(unitId) => router.push(`/desarrollo/unidades/${unitId}`)}
                  onReset={handleReset}
                />
              </div>
            )
          })}
        </div>
      ) : (
        <ListView stages={stages} board={board} matches={matches} sortCards={sortCards} onOpenUnit={(id) => router.push(`/desarrollo/unidades/${id}`)} />
      )}
    </div>
  )
}

// ─── Card ───
const CARD_ACTIONS = [
  { key: 'call', icon: Phone, label: 'Llamar' },
  { key: 'write', icon: MessageSquare, label: 'Escribir' },
  { key: 'tags', icon: Tag, label: 'Etiquetas' },
  { key: 'notes', icon: StickyNote, label: 'Notas' },
  { key: 'tasks', icon: CheckSquare, label: 'Tareas' },
  { key: 'appointment', icon: CalendarPlus, label: 'Programar cita' },
] as const

function PosventaCardItem({
  card,
  canManage,
  hideProject,
  onDragStart,
  onOpenUnit,
  onReset,
}: {
  card: PosventaCard
  canManage: boolean
  hideProject: boolean
  onDragStart: () => void
  onOpenUnit: () => void
  onReset: () => void
}) {
  const seed = card.clientName ?? card.unitNumber
  return (
    <div
      draggable={canManage}
      onDragStart={onDragStart}
      onClick={onOpenUnit}
      className={cn(
        'group cursor-pointer rounded-md border bg-background p-3 shadow-sm transition-shadow hover:shadow-md',
        canManage && 'active:cursor-grabbing',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{card.buildingName} · {card.unitNumber}</p>
          <p className="truncate text-[11px] text-muted-foreground">{card.type} · Piso {card.floor}</p>
        </div>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-500">
          {initials(seed)}
        </span>
      </div>

      <dl className="mt-2.5 space-y-1 text-xs">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Cliente</dt>
          <dd className="truncate font-medium">{card.clientName ?? 'Sin cliente'}</dd>
        </div>
        {!hideProject && (
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Proyecto</dt>
            <dd className="truncate">{card.projectName}</dd>
          </div>
        )}
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Precio</dt>
          <dd className="font-semibold tabular-nums">{money(card.currentPrice)}</dd>
        </div>
      </dl>

      {/* Footer: quick actions (Llamar, Escribir, Etiquetas, Notas, Tareas, Programar cita) */}
      <div className="mt-2.5 flex items-center justify-between border-t pt-2">
        {CARD_ACTIONS.map(({ key, icon: ActionIcon, label }) => (
          <button
            key={key}
            type="button"
            onClick={(e) => { e.stopPropagation(); toast.info(`${label} — próximamente`) }}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            title={label}
            aria-label={label}
          >
            <ActionIcon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>

      {card.isManual && (
        <div className="mt-2 flex items-center justify-between border-t pt-1.5">
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">Movida manualmente</span>
          {canManage && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onReset() }}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
              title="Restaurar etapa automática"
            >
              <RotateCcw className="h-3 w-3" /> Auto
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── List view ───
function ListView({
  stages,
  board,
  matches,
  sortCards,
  onOpenUnit,
}: {
  stages: PosventaStageDef[]
  board: Record<string, PosventaCard[]>
  matches: (c: PosventaCard) => boolean
  sortCards: (cards: PosventaCard[]) => PosventaCard[]
  onOpenUnit: (unitId: string) => void
}) {
  const stageLabel = new Map(stages.map((s) => [s.key, s]))
  const rows = sortCards(stages.flatMap((s) => (board[s.key] ?? [])).filter(matches))

  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 border-b bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Unidad</th>
            <th className="px-4 py-2.5 text-left font-medium">Cliente</th>
            <th className="px-4 py-2.5 text-left font-medium">Proyecto</th>
            <th className="px-4 py-2.5 text-left font-medium">Etapa</th>
            <th className="px-4 py-2.5 text-right font-medium">Precio</th>
            <th className="px-4 py-2.5 text-left font-medium">Pagado</th>
            <th className="px-4 py-2.5 text-left font-medium">Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Sin unidades</td></tr>
          ) : (
            rows.map((c) => {
              const st = stageLabel.get(c.stage)
              return (
                <tr key={c.unitId} className="cursor-pointer border-b last:border-0 hover:bg-muted/30" onClick={() => onOpenUnit(c.unitId)}>
                  <td className="px-4 py-2.5 font-medium">{c.buildingName} · {c.unitNumber}<span className="ml-2 text-xs text-muted-foreground">{c.type} · Piso {c.floor}</span></td>
                  <td className="px-4 py-2.5">{c.clientName ?? '—'}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{c.projectName}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={cn('h-2 w-2 rounded-full', st?.dot)} />
                      <span className={cn('text-xs font-medium', st?.accent)}>{st?.label}</span>
                      {c.isManual && <span className="rounded bg-amber-100 px-1 text-[10px] text-amber-700">manual</span>}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{money(c.currentPrice)}</td>
                  <td className="px-4 py-2.5">{c.paidPct != null ? `${c.paidPct}%` : '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <span className={cn('h-2 w-2 rounded-full', UNIT_STATUS_DOT[c.unitStatus] ?? 'bg-gray-400')} />
                      {UNIT_STATUS_LABEL[c.unitStatus] ?? c.unitStatus}
                    </span>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
