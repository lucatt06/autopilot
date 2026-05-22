'use client'

import { useMemo, useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Loader2, Lock, LockOpen, Plus, Table2, Trash2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MentionTextarea } from '@/components/mentions/mention-textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  addMonths,
  computeSectionAmounts,
  generateConstructionInstallments,
  installmentCountForWindow,
  parseDateInput,
  round2,
  sumExpected,
  toDateInput,
} from '@/lib/payment-plans/calc'
import {
  CURRENCIES,
  CURRENCY_LABELS,
  PLAN_STATUSES,
  PLAN_STATUS_LABELS,
  type CurrencyKey,
  type PlanStatusKey,
} from '@/lib/payment-plans/schemas'
import { createPaymentPlan, updatePaymentPlan } from '@/app/actions/payment-plans'
import { getUnitsForProject, searchCustomers } from '@/app/actions/payment-plans-search'

// ─── Types ───────────────────────────────────────────────────────────────────

type SectionType = 'RESERVATION' | 'INITIAL' | 'CONSTRUCTION' | 'FINAL'

interface Row {
  key: string
  id: string | null // existing installment id (null for new rows) — preserves paidAmount
  dueDate: string
  expectedAmount: number
  label: string | null
  locked: boolean
  paidAmount: number
  status: string
}

interface ProjectOpt {
  id: string
  name: string
  expectedDeliveryDate: string | null
  stdReservationAmount: number | null
  stdInitialPercent: number | null
  stdConstructionPercent: number | null
  stdFinalPercent: number | null
}

interface InitialInstallment {
  id: string
  type: string
  installmentNumber: number
  label: string | null
  expectedAmount: number
  dueDate: string
  locked: boolean
  paidAmount: number
  status: string
}

export interface PaymentPlanFormInitial {
  id: string
  name: string
  projectId: string | null
  customerId: string | null
  customerName: string | null
  unitId: string | null
  saleId: string | null
  currency: string
  status: string
  deliveryDate: string | null
  notes: string | null
  totalPrice: number
  reservationAmount: number
  initialPercent: number
  constructionPercent: number
  finalPercent: number
  constructionInstallmentsCount: number
  constructionPeriodicityMonths: number
  constructionMode: string
  installments: InitialInstallment[]
}

interface UnitOpt {
  id: string
  unitNumber: string
  type: string
  floor: number
  buildingName: string
  currentPrice: number
  status: string
}

interface Props {
  mode: 'create' | 'edit'
  projects: ProjectOpt[]
  initial?: PaymentPlanFormInitial
  /** Pre-selected project id from the module's global project selector */
  defaultProjectId?: string | null
  /** Pre-selected unit id */
  defaultUnitId?: string | null
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

let keySeq = 0
const newKey = () => `r${++keySeq}`

function money(n: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0)
}

function todayInput(): string {
  return toDateInput(new Date())
}

function rowsFromInstallments(installments: InitialInstallment[], type: SectionType): Row[] {
  return installments
    .filter((i) => i.type === type)
    .sort((a, b) => a.installmentNumber - b.installmentNumber)
    .map((i) => ({
      key: newKey(),
      id: i.id,
      dueDate: i.dueDate ? i.dueDate.slice(0, 10) : todayInput(),
      expectedAmount: i.expectedAmount,
      label: i.label,
      locked: i.locked,
      paidAmount: i.paidAmount,
      status: i.status,
    }))
}

// ─── Customer combobox (optional link) ────────────────────────────────────────

function CustomerCombobox({
  value,
  onChange,
}: {
  value: { id: string; name: string } | null
  onChange: (c: { id: string; name: string } | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const results = await searchCustomers(query)
      setOptions(results)
      setLoading(false)
    }, 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, open])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {value ? (
          <span className="truncate font-medium">{value.name}</span>
        ) : (
          <span className="text-muted-foreground">Sin vincular (opcional)</span>
        )}
        {value && (
          <X
            className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); onChange(null) }}
          />
        )}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="border-b p-2">
            <Input
              autoFocus
              placeholder="Buscar cliente…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {loading ? (
              <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando…
              </div>
            ) : options.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Sin resultados</p>
            ) : (
              options.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { onChange(c); setOpen(false); setQuery('') }}
                  className="flex w-full items-center px-3 py-2 text-sm hover:bg-accent"
                >
                  {c.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Money input with real-time comma formatting ──────────────────────────────

function MoneyInput({
  value,
  onChange,
  onKeyDown,
  id,
  className,
  disabled,
}: {
  value: number
  onChange: (n: number) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  id?: string
  className?: string
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  function fmt(n: number): string {
    if (!n) return ''
    // Keep up to 2 decimals, strip trailing zeros
    const s = Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '')
    const [intPart, decPart] = s.split('.')
    const withCommas = (intPart ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return decPart ? `${withCommas}.${decPart}` : withCommas
  }

  const [display, setDisplay] = useState(() => fmt(value))

  // Sync when external value changes (e.g. unit auto-fill) while not focused
  const prevValue = useRef(value)
  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value
      if (document.activeElement !== inputRef.current) {
        setDisplay(fmt(value))
      }
    }
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const el = e.target
    const raw = el.value
    const cursorPos = el.selectionStart ?? raw.length

    // Strip everything except digits and the first decimal point (max 2 decimals)
    const stripped = raw.replace(/[^0-9.]/g, '')
    const dotIdx = stripped.indexOf('.')
    const clean =
      dotIdx >= 0
        ? stripped.slice(0, dotIdx + 1) + stripped.slice(dotIdx + 1).replace(/\./g, '').slice(0, 2)
        : stripped

    // Format integer part with commas, keep decimal as-is while typing
    const [intRaw, decRaw] = clean.split('.')
    const formattedInt = (intRaw ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    const newDisplay = decRaw !== undefined ? `${formattedInt}.${decRaw}` : formattedInt + (raw.endsWith('.') ? '.' : '')

    setDisplay(newDisplay)
    onChange(round2(parseFloat(clean) || 0))

    // Restore cursor: count non-comma chars before cursor in raw, find same position in newDisplay
    requestAnimationFrame(() => {
      if (!inputRef.current) return
      let nonCommas = 0
      for (let i = 0; i < cursorPos && i < raw.length; i++) {
        if (raw[i] !== ',') nonCommas++
      }
      let found = 0
      for (let i = 0; i < newDisplay.length; i++) {
        if (newDisplay[i] !== ',') found++
        if (found === nonCommas) {
          inputRef.current.setSelectionRange(i + 1, i + 1)
          return
        }
      }
      inputRef.current.setSelectionRange(newDisplay.length, newDisplay.length)
    })
  }

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="decimal"
      disabled={disabled}
      value={display}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      placeholder="0"
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
    />
  )
}

// ─── Unit combobox (client-side filter over loaded units) ─────────────────────

const UNIT_STATUS_LABELS: Record<string, string> = {
  DISPONIBLE: 'Disponible',
  BLOQUEADA: 'Bloqueada',
  RESERVADA: 'Reservada',
  VENDIDA: 'Vendida',
  ENTREGADA: 'Entregada',
}
const UNIT_STATUS_COLORS: Record<string, string> = {
  DISPONIBLE: 'text-emerald-600',
  BLOQUEADA: 'text-yellow-600',
  RESERVADA: 'text-blue-600',
  VENDIDA: 'text-red-600',
  ENTREGADA: 'text-gray-500',
}

function UnitCombobox({
  value,
  units,
  loading,
  disabled,
  onChange,
}: {
  value: string
  units: UnitOpt[]
  loading: boolean
  disabled: boolean
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selected = units.find((u) => u.id === value) ?? null

  const filtered = query.trim()
    ? units.filter((u) => {
        const q = query.toLowerCase()
        return (
          u.unitNumber.toLowerCase().includes(q) ||
          u.buildingName.toLowerCase().includes(q) ||
          u.type.toLowerCase().includes(q) ||
          String(u.floor).includes(q)
        )
      })
    : units

  const placeholder = disabled && !loading
    ? 'Selecciona un proyecto primero'
    : loading
    ? 'Cargando unidades…'
    : 'Sin unidad (opcional)'

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) { setOpen((p) => !p); setQuery('') } }}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando unidades…
          </span>
        ) : selected ? (
          <span className="truncate font-medium">
            {selected.buildingName} · {selected.unitNumber} — {selected.type} (Piso {selected.floor})
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        {selected && (
          <X
            className="h-3.5 w-3.5 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); onChange(''); setOpen(false) }}
          />
        )}
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="border-b p-2">
            <Input
              autoFocus
              placeholder="Buscar por número, edificio, tipo o piso…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {/* Clear option */}
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); setQuery('') }}
              className="flex w-full items-center px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
            >
              Sin unidad
            </button>
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Sin resultados</p>
            ) : (
              filtered.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => { onChange(u.id); setOpen(false); setQuery('') }}
                  className={cn(
                    'flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent',
                    value === u.id && 'bg-accent',
                  )}
                >
                  <span>
                    <span className="font-medium">{u.buildingName} · {u.unitNumber}</span>
                    <span className="ml-2 text-muted-foreground">{u.type} · Piso {u.floor}</span>
                  </span>
                  <span className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">${u.currentPrice.toLocaleString('en-US')}</span>
                    <span className={cn('font-medium', UNIT_STATUS_COLORS[u.status])}>
                      {UNIT_STATUS_LABELS[u.status] ?? u.status}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Payment rows editor (Reservation / Initial / Final) ───────────────────────

function PaymentRows({
  rows,
  onChange,
  disabled,
}: {
  rows: Row[]
  onChange: (rows: Row[]) => void
  disabled?: boolean
}) {
  function update(key: string, patch: Partial<Row>) {
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }
  function remove(key: string) {
    onChange(rows.filter((r) => r.key !== key))
  }
  function add() {
    onChange([
      ...rows,
      { key: newKey(), id: null, dueDate: todayInput(), expectedAmount: 0, label: null, locked: false, paidAmount: 0, status: 'pending' },
    ])
  }

  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.key} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Monto del pago</Label>
            <MoneyInput
              value={r.expectedAmount}
              onChange={(n) => update(r.key, { expectedAmount: n })}
              disabled={disabled}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Fecha de Pago</Label>
            <Input
              type="date"
              disabled={disabled}
              value={r.dueDate}
              onChange={(e) => update(r.key, { dueDate: e.target.value })}
              className="h-9"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-rose-500 hover:text-rose-600"
            disabled={disabled || rows.length <= 1}
            onClick={() => remove(r.key)}
            aria-label="Eliminar pago"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} disabled={disabled}>
        <Plus className="mr-1 h-3.5 w-3.5" /> Añadir Pago
      </Button>
    </div>
  )
}

// ─── Section total/falta line ─────────────────────────────────────────────────

function SectionTotal({
  scheduled,
  target,
  currency,
  showFalta = true,
  color,
}: {
  scheduled: number
  target: number
  currency: string
  showFalta?: boolean
  color: string
}) {
  const diff = round2(target - scheduled)
  // Exact → "De: {objetivo}"; surplus → "Sobra: {excedente}"; short → "Falta: {faltante}".
  const label = diff === 0 ? 'De' : diff < 0 ? 'Sobra' : 'Falta'
  const diffAmount = diff === 0 ? target : Math.abs(diff)
  // Green when covered or in surplus; red when short.
  const diffClass = diff > 0 ? 'text-red-600' : 'text-emerald-600'
  return (
    <p className="text-right text-sm">
      <span className={cn('font-semibold', color)}>Total: {money(scheduled, currency)}</span>
      {showFalta && (
        <>
          {' / '}
          <span className={cn('font-semibold', diffClass)}>
            {label}: {money(diffAmount, currency)}
          </span>
        </>
      )}
    </p>
  )
}

// ─── Main form ─────────────────────────────────────────────────────────────────

export function PaymentPlanForm({ mode, projects, initial, defaultProjectId, defaultUnitId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Set<string>>(new Set())

  function clearFieldError(field: string) {
    setFieldErrors((prev) => {
      if (!prev.has(field)) return prev
      const next = new Set(prev)
      next.delete(field)
      return next
    })
  }

  function clearPercentErrors() {
    setFieldErrors((prev) => {
      if (!prev.has('initialPercent') && !prev.has('constructionPercent') && !prev.has('finalPercent')) return prev
      const next = new Set(prev)
      next.delete('initialPercent')
      next.delete('constructionPercent')
      next.delete('finalPercent')
      return next
    })
  }

  // Header
  const [name, setName] = useState(initial?.name ?? '')
  const [projectId, setProjectId] = useState(initial?.projectId ?? defaultProjectId ?? '')
  const [unitId, setUnitId] = useState(initial?.unitId ?? defaultUnitId ?? '')
  const [units, setUnits] = useState<UnitOpt[]>([])
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [customer, setCustomer] = useState<{ id: string; name: string } | null>(
    initial?.customerId && initial.customerName ? { id: initial.customerId, name: initial.customerName } : null,
  )
  const [currency, setCurrency] = useState<CurrencyKey>((initial?.currency as CurrencyKey) ?? 'USD')
  const [status, setStatus] = useState<PlanStatusKey>((initial?.status as PlanStatusKey) ?? 'DRAFT')
  const [deliveryDate, setDeliveryDate] = useState(initial?.deliveryDate?.slice(0, 10) ?? '')
  const [totalPrice, setTotalPrice] = useState<number>(initial?.totalPrice ?? 0)
  const [notes, setNotes] = useState(initial?.notes ?? '')

  // Percents
  const [initialPercent, setInitialPercent] = useState<number>(initial?.initialPercent ?? 20)
  const [constructionPercent, setConstructionPercent] = useState<number>(initial?.constructionPercent ?? 40)
  const [finalPercent, setFinalPercent] = useState<number>(initial?.finalPercent ?? 40)

  // Reservation
  const [reservationAmount, setReservationAmount] = useState<number>(initial?.reservationAmount ?? 0)

  // ─── Banner: editable standard-plan overrides (initialized from the project's std values) ───
  const _initProj = projects.find((p) => p.id === (initial?.projectId ?? defaultProjectId ?? ''))
  const [bannerReserva, setBannerReserva] = useState<number>(_initProj?.stdReservationAmount ?? 0)
  const [bannerInitialPct, setBannerInitialPct] = useState<number>(_initProj?.stdInitialPercent ?? 20)
  const [bannerConstrPct, setBannerConstrPct] = useState<number>(_initProj?.stdConstructionPercent ?? 40)
  const [bannerFinalPct, setBannerFinalPct] = useState<number>(_initProj?.stdFinalPercent ?? 40)

  // Construction config
  const [count, setCount] = useState<number>(initial?.constructionInstallmentsCount ?? 12)
  const [periodicity, setPeriodicity] = useState<number>(initial?.constructionPeriodicityMonths ?? 1)
  // Generation mode: automatic (default) derives the cuota count from periodicity +
  // delivery window; manual lets the user enter the count and amount per cuota by hand.
  const [manualMode, setManualMode] = useState<boolean>((initial?.constructionMode ?? 'automatic') === 'manual')
  const [manualCount, setManualCount] = useState<number>(initial?.constructionInstallmentsCount ?? 0)
  const [manualPerAmount, setManualPerAmount] = useState<number>(0)
  const [constructionStart, setConstructionStart] = useState<string>(() => {
    const existing = initial?.installments.find((i) => i.type === 'CONSTRUCTION')
    if (existing?.dueDate) return existing.dueDate.slice(0, 10)
    return toDateInput(addMonths(new Date(), 1))
  })
  // Tracks whether the user manually edited the first-cuota date. While untouched, it
  // defaults to one month after the last Pago Inicial payment (previous segment).
  const constructionStartTouched = useRef<boolean>(!!initial)

  // Section rows
  const [reservationRows, setReservationRows] = useState<Row[]>(() =>
    initial ? rowsFromInstallments(initial.installments, 'RESERVATION') : [
      { key: newKey(), id: null, dueDate: todayInput(), expectedAmount: 0, label: null, locked: false, paidAmount: 0, status: 'pending' },
    ],
  )
  const [initialRows, setInitialRows] = useState<Row[]>(() =>
    initial ? rowsFromInstallments(initial.installments, 'INITIAL') : [
      { key: newKey(), id: null, dueDate: todayInput(), expectedAmount: 0, label: null, locked: false, paidAmount: 0, status: 'pending' },
    ],
  )
  const [constructionRows, setConstructionRows] = useState<Row[]>(() =>
    initial ? rowsFromInstallments(initial.installments, 'CONSTRUCTION') : [],
  )
  // Key of the row currently being entered (awaiting user confirmation via ✓ or Enter).
  // While this is set the row amount is empty/editable but no redistribution has run yet.
  const [pendingConstrKey, setPendingConstrKey] = useState<string | null>(null)
  const [finalRows, setFinalRows] = useState<Row[]>(() =>
    initial ? rowsFromInstallments(initial.installments, 'FINAL') : [
      { key: newKey(), id: null, dueDate: todayInput(), expectedAmount: 0, label: null, locked: false, paidAmount: 0, status: 'pending' },
    ],
  )

  // Derived section amounts
  const sections = useMemo(
    () => computeSectionAmounts({ totalPrice, reservationAmount, initialPercent, constructionPercent, finalPercent }),
    [totalPrice, reservationAmount, initialPercent, constructionPercent, finalPercent],
  )

  const reservationScheduled = sumExpected(reservationRows)
  const initialScheduled = sumExpected(initialRows)
  const constructionScheduled = sumExpected(constructionRows)
  const finalScheduled = sumExpected(finalRows)
  const totalAgreed = round2(reservationScheduled + initialScheduled + constructionScheduled + finalScheduled)
  const pending = round2(totalPrice - totalAgreed)
  const percentOk = Math.abs(sections.percentSum - 100) <= 0.5

  // ─── Cascade overflow: excess in one section reduces the next section's target
  // Inicial overflow → reduces Construcción target
  const initialOverflow = round2(Math.max(0, initialScheduled - sections.initialRemaining))
  const effectiveConstructionTarget = round2(Math.max(0, sections.constructionAmount - initialOverflow))
  // Construcción overflow → reduces Final target ONLY when every cuota is locked.
  // While any cuota remains unlocked the excess should be redistributed among them
  // instead of cascading to the Final section.
  const allConstructionLocked = constructionRows.length > 0 && constructionRows.every((r) => r.locked)
  const constructionOverflow = allConstructionLocked
    ? round2(Math.max(0, constructionScheduled - effectiveConstructionTarget))
    : 0
  const effectiveFinalTarget = round2(Math.max(0, sections.finalAmount - constructionOverflow))

  // ─── Generate construction table ──────────────────────────────────────────────

  function generateTable() {
    const locked = constructionRows.filter((r) => r.locked)
    const lockedSum = sumExpected(locked)
    // Split the EFFECTIVE target (objetivo), already reduced by any surplus carried
    // over from the previous section — not the gross construction amount.
    const remaining = round2(effectiveConstructionTarget - lockedSum)
    const unlockedCount = Math.max(0, count - locked.length)

    const generated = generateConstructionInstallments({
      constructionAmount: remaining > 0 ? remaining : 0,
      count: unlockedCount,
      periodicityMonths: periodicity,
      startDate: parseDateInput(constructionStart),
    })

    // Keep locked rows as-is; fill the remaining slots from the generated split.
    const rows: Row[] = generated.map((g) => ({
      key: newKey(),
      id: null,
      dueDate: g.dueDate,
      expectedAmount: g.expectedAmount,
      label: null,
      locked: false,
      paidAmount: 0,
      status: 'pending',
    }))
    for (const lr of locked) rows.push({ ...lr, key: newKey() })

    // Order by due date
    rows.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    setConstructionRows(rows)
  }

  // Manual generation: the user states how many cuotas and the amount of each one.
  function generateManualTable() {
    if (manualCount <= 0) {
      toast.error('Indica cuántas cuotas generar')
      return
    }
    const rows: Row[] = []
    for (let i = 0; i < manualCount; i++) {
      rows.push({
        key: newKey(),
        id: null,
        dueDate: toDateInput(addMonths(parseDateInput(constructionStart), i * periodicity)),
        expectedAmount: round2(manualPerAmount),
        label: null,
        locked: false,
        paidAmount: 0,
        status: 'pending',
      })
    }
    setCount(manualCount)
    setConstructionRows(rows)
  }

  // In AUTOMATIC mode the cuota count is a REFLECTION of the periodicity over the
  // construction window (first cuota date → delivery date). The table itself is NOT
  // auto-generated — it only appears when the user clicks "Generar Tabla".
  useEffect(() => {
    if (manualMode) return
    if (!constructionStart || !deliveryDate) return
    const derived = installmentCountForWindow({
      startDate: parseDateInput(constructionStart),
      endDate: parseDateInput(deliveryDate),
      periodicityMonths: periodicity,
      minGapDays: 30, // last cuota must be ≥ 30 days before delivery
    })
    setCount((prev) => (prev === derived ? prev : derived))
  }, [manualMode, periodicity, constructionStart, deliveryDate])

  // The first cuota defaults to one month after the LAST Pago Inicial payment
  // (the previous segment), unless the user has manually picked a date.
  const lastInitialDate = initialRows.length ? initialRows[initialRows.length - 1]!.dueDate : ''
  useEffect(() => {
    if (constructionStartTouched.current) return
    if (!lastInitialDate) return
    const derived = toDateInput(addMonths(parseDateInput(lastInitialDate), 1))
    setConstructionStart((prev) => (prev === derived ? prev : derived))
  }, [lastInitialDate])

  // Keep construction cuota AMOUNTS in sync with the faltante (effective target) in
  // automatic mode: when a surplus carried from a previous section changes the
  // faltante, re-split the EXISTING unlocked rows evenly (last absorbs the
  // remainder). This does NOT recreate or reveal the table — it only re-divides
  // already-generated cuotas so they always sum to the faltante.
  useEffect(() => {
    if (manualMode) return
    if (constructionRows.length === 0) return
    const lockedSum = sumExpected(constructionRows.filter((r) => r.locked))
    const target = Math.max(0, round2(effectiveConstructionTarget - lockedSum))
    const unlockedCount = constructionRows.filter((r) => !r.locked).length
    if (unlockedCount === 0) return
    const currentUnlocked = sumExpected(constructionRows.filter((r) => !r.locked))
    if (Math.abs(currentUnlocked - target) < 0.01) return // already matches the faltante
    const per = round2(target / unlockedCount)
    let acc = 0
    let seen = 0
    const next = constructionRows.map((r) => {
      if (r.locked) return r
      seen++
      const amount = seen === unlockedCount ? round2(target - acc) : per
      acc = round2(acc + amount)
      return { ...r, expectedAmount: amount }
    })
    setConstructionRows(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveConstructionTarget, manualMode])

  // ─── Load units when project changes ─────────────────────────────────────────

  useEffect(() => {
    if (!projectId) { setUnits([]); setUnitId(''); return }
    setLoadingUnits(true)
    getUnitsForProject(projectId).then((u) => {
      setUnits(u)
      setLoadingUnits(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // Sync banner values when project changes so the editable fields reflect the
  // new project's defaults (only overrides fields that the project has set).
  useEffect(() => {
    const proj = projects.find((p) => p.id === projectId)
    if (!proj) return
    if (proj.stdReservationAmount != null) setBannerReserva(proj.stdReservationAmount)
    if (proj.stdInitialPercent != null) setBannerInitialPct(proj.stdInitialPercent)
    if (proj.stdConstructionPercent != null) setBannerConstrPct(proj.stdConstructionPercent)
    if (proj.stdFinalPercent != null) setBannerFinalPct(proj.stdFinalPercent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  function handleUnitChange(newUnitId: string) {
    setUnitId(newUnitId)
    if (!newUnitId) return
    const u = units.find((u) => u.id === newUnitId)
    if (!u) return
    // Auto-fill price if currently 0 or in create mode
    if (totalPrice === 0 || mode === 'create') {
      setTotalPrice(u.currentPrice)
    }
    // Auto-fill delivery date if empty
    if (!deliveryDate) {
      const project = projects.find((p) => p.id === projectId)
      if (project?.expectedDeliveryDate) {
        setDeliveryDate(project.expectedDeliveryDate)
      }
    }
  }

  // ─── Construction row actions ──────────────────────────────────────────────────

  function updateConstr(key: string, patch: Partial<Row>) {
    setConstructionRows((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function removeConstr(key: string) {
    if (key === pendingConstrKey) setPendingConstrKey(null)

    const remaining = constructionRows.filter((r) => r.key !== key)
    const lockedSum = sumExpected(remaining.filter((r) => r.locked))
    const target = round2(Math.max(0, effectiveConstructionTarget - lockedSum))
    const unlockedCount = remaining.filter((r) => !r.locked).length

    if (unlockedCount > 0) {
      const per = round2(target / unlockedCount)
      let acc = 0
      let seen = 0
      setConstructionRows(
        remaining.map((r) => {
          if (r.locked) return r
          seen++
          const amount = seen === unlockedCount ? round2(target - acc) : per
          acc = round2(acc + amount)
          return { ...r, expectedAmount: amount }
        }),
      )
    } else {
      setConstructionRows(remaining)
    }
  }

  function addConstr() {
    // Prevent multiple pending rows at the same time.
    if (pendingConstrKey) {
      toast.error('Confirma la cuota anterior antes de añadir otra')
      return
    }
    // Engage manual mode; insert an empty row. No redistribution happens yet —
    // the user must type a value and press Enter / click ✓ to trigger it.
    setManualMode(true)
    const k = newKey()
    setConstructionRows((rows) => [
      ...rows,
      {
        key: k,
        id: null,
        dueDate: toDateInput(addMonths(parseDateInput(constructionStart), rows.length * periodicity)),
        expectedAmount: 0,
        label: null,
        locked: false,
        paidAmount: 0,
        status: 'pending',
      },
    ])
    setPendingConstrKey(k)
  }

  /** Confirm the pending row: keep its typed amount and redistribute the remainder
   * evenly across all OTHER unlocked rows. */
  function confirmConstr(key: string) {
    const confirmedRow = constructionRows.find((r) => r.key === key)
    if (!confirmedRow) { setPendingConstrKey(null); return }

    const confirmedAmount = round2(confirmedRow.expectedAmount)
    const lockedSum = sumExpected(constructionRows.filter((r) => r.locked))
    const remaining = round2(Math.max(0, effectiveConstructionTarget - lockedSum - confirmedAmount))
    const otherUnlocked = constructionRows.filter((r) => r.key !== key && !r.locked)
    const otherCount = otherUnlocked.length

    if (otherCount > 0) {
      const per = round2(remaining / otherCount)
      let acc = 0
      let seen = 0
      setConstructionRows((rows) =>
        rows.map((r) => {
          if (r.key === key || r.locked) return r
          seen++
          const amount = seen === otherCount ? round2(remaining - acc) : per
          acc = round2(acc + amount)
          return { ...r, expectedAmount: amount }
        }),
      )
    }
    setPendingConstrKey(null)
  }

  // ─── Submit ─────────────────────────────────────────────────────────────────────

  function buildInstallments() {
    const out: { id?: string; type: SectionType; installmentNumber: number; expectedAmount: number; dueDate: string; locked: boolean; label?: string }[] = []
    const push = (rows: Row[], type: SectionType) =>
      rows.forEach((r, idx) =>
        out.push({
          type,
          installmentNumber: idx + 1,
          expectedAmount: round2(r.expectedAmount),
          dueDate: r.dueDate,
          locked: r.locked,
          ...(r.id ? { id: r.id } : {}),
          ...(r.label ? { label: r.label } : {}),
        }),
      )
    push(reservationRows, 'RESERVATION')
    push(initialRows, 'INITIAL')
    push(constructionRows, 'CONSTRUCTION')
    push(finalRows, 'FINAL')
    return out
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Collect ALL field errors at once so every invalid field turns red simultaneously
    const errors = new Set<string>()
    if (!name.trim()) errors.add('name')
    if (totalPrice <= 0) errors.add('totalPrice')
    if (!percentOk) {
      errors.add('initialPercent')
      errors.add('constructionPercent')
      errors.add('finalPercent')
    }

    if (errors.size > 0) {
      setFieldErrors(errors)
      const msgs: string[] = []
      if (errors.has('name')) msgs.push('nombre del plan')
      if (errors.has('totalPrice')) msgs.push('precio de compra')
      if (errors.has('initialPercent')) msgs.push(`porcentajes (suman ${sections.percentSum}%, deben sumar 100%)`)
      setError(`Completa los campos requeridos: ${msgs.join(', ')}`)
      return
    }

    setFieldErrors(new Set())

    const payload = {
      name: name.trim(),
      projectId: projectId || undefined,
      customerId: customer?.id || undefined,
      unitId: unitId || undefined,
      currency,
      status,
      deliveryDate: deliveryDate || undefined,
      notes: notes.trim() || undefined,
      totalPrice: round2(totalPrice),
      reservationAmount: round2(reservationAmount),
      initialPercent,
      constructionPercent,
      finalPercent,
      constructionInstallmentsCount: count,
      constructionPeriodicityMonths: periodicity,
      constructionMode: manualMode ? ('manual' as const) : ('automatic' as const),
      installments: buildInstallments(),
    }

    startTransition(async () => {
      const result = mode === 'create'
        ? await createPaymentPlan(payload)
        : await updatePaymentPlan(initial!.id, payload)
      if (!result.ok) { setError(result.error); return }
      toast.success(mode === 'create' ? 'Plan de pago creado' : 'Plan de pago actualizado')
      router.push('/desarrollo/planes-pago')
      router.refresh()
    })
  }

  // ─── Render ─────────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nombre del Plan de Pago *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => { setName(e.target.value); clearFieldError('name') }}
            placeholder="Ej. Plan- Griselda y Pablo H."
            className={cn(fieldErrors.has('name') && 'border-destructive focus-visible:ring-destructive')}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Proyecto</Label>
          <Select value={projectId || 'none'} onValueChange={(v) => setProjectId(v === 'none' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Sin proyecto" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin proyecto</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Unit selector */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Unidad del Proyecto</Label>
          <UnitCombobox
            value={unitId}
            units={units}
            loading={loadingUnits}
            disabled={!projectId || loadingUnits}
            onChange={handleUnitChange}
          />
          {unitId && (() => {
            const u = units.find((u) => u.id === unitId)
            if (!u) return null
            return (
              <p className={cn('text-xs', UNIT_STATUS_COLORS[u.status] ?? 'text-muted-foreground')}>
                Estado: {UNIT_STATUS_LABELS[u.status] ?? u.status}
              </p>
            )
          })()}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="price">Precio de Compra *</Label>
          <MoneyInput
            id="price"
            value={totalPrice}
            onChange={(n) => { setTotalPrice(n); if (n > 0) clearFieldError('totalPrice') }}
            className={cn(fieldErrors.has('totalPrice') && 'border-destructive focus-visible:ring-destructive')}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Moneda</Label>
          <Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyKey)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>{CURRENCY_LABELS[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="delivery">Fecha de Entrega</Label>
          <Input id="delivery" type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Estado</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as PlanStatusKey)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PLAN_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{PLAN_STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Cliente vinculado</Label>
        <CustomerCombobox value={customer} onChange={setCustomer} />
      </div>

      {/* Auto-fill from project standard — with editable fields */}
      {projectId && (() => {
        const proj = projects.find((p) => p.id === projectId)
        const hasStd = proj && (
          proj.stdReservationAmount != null ||
          proj.stdInitialPercent != null ||
          proj.stdConstructionPercent != null ||
          proj.stdFinalPercent != null
        )
        if (!hasStd) return null

        const bannerPctSum = round2(bannerInitialPct + bannerConstrPct + bannerFinalPct)
        const bannerPctOk = Math.abs(bannerPctSum - 100) <= 0.5

        return (
          <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-3 space-y-3">
            <p className="text-sm font-medium text-primary">Plan estándar</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {proj.stdReservationAmount != null && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Reserva</Label>
                  <MoneyInput value={bannerReserva} onChange={setBannerReserva} className="h-8" />
                </div>
              )}
              {proj.stdInitialPercent != null && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">% Inicial</Label>
                  <div className="relative">
                    <Input
                      type="number" min={0} max={100}
                      value={bannerInitialPct || ''}
                      onChange={(e) => setBannerInitialPct(Number(e.target.value) || 0)}
                      className="h-8 pr-6"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              )}
              {proj.stdConstructionPercent != null && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">% Construcción</Label>
                  <div className="relative">
                    <Input
                      type="number" min={0} max={100}
                      value={bannerConstrPct || ''}
                      onChange={(e) => setBannerConstrPct(Number(e.target.value) || 0)}
                      className="h-8 pr-6"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              )}
              {proj.stdFinalPercent != null && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">% Entrega</Label>
                  <div className="relative">
                    <Input
                      type="number" min={0} max={100}
                      value={bannerFinalPct || ''}
                      onChange={(e) => setBannerFinalPct(Number(e.target.value) || 0)}
                      className="h-8 pr-6"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Suma: <span className={bannerPctOk ? 'font-medium text-emerald-600' : 'font-medium text-orange-600'}>{bannerPctSum}%</span>
                {!bannerPctOk && <span className="ml-1 text-orange-500">(debe ser 100%)</span>}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  if (totalPrice <= 0) {
                    toast.error('Ingresa el Precio de Compra primero')
                    return
                  }

                  // Use the editable banner values
                  const newReserv    = bannerReserva
                  const newInitPct   = bannerInitialPct
                  const newConstrPct = bannerConstrPct
                  const newFinalPct  = bannerFinalPct

                  // Compute amounts NOW (don't wait for React re-render)
                  const s = computeSectionAmounts({
                    totalPrice,
                    reservationAmount: newReserv,
                    initialPercent: newInitPct,
                    constructionPercent: newConstrPct,
                    finalPercent: newFinalPct,
                  })

                  // Dates: reserva=hoy, inicial=reserva+1m, construcción=inicial+1m, final=entrega
                  const reservDate  = todayInput()
                  const initialDate = toDateInput(addMonths(parseDateInput(reservDate), 1))
                  const constrStart = toDateInput(addMonths(parseDateInput(initialDate), 1))

                  // Cuotas reflect the periodicity over the construction window
                  const derivedCount = deliveryDate
                    ? installmentCountForWindow({
                        startDate: parseDateInput(constrStart),
                        endDate: parseDateInput(deliveryDate),
                        periodicityMonths: periodicity,
                        minGapDays: 30, // last cuota must be ≥ 30 days before delivery
                      })
                    : count
                  const finalDate = deliveryDate || toDateInput(addMonths(parseDateInput(constrStart), derivedCount * periodicity))

                  // Apply percents
                  setInitialPercent(newInitPct)
                  setConstructionPercent(newConstrPct)
                  setFinalPercent(newFinalPct)

                  // Reservación row
                  setReservationAmount(newReserv)
                  setReservationRows([{
                    key: newKey(), id: null, dueDate: reservDate,
                    expectedAmount: newReserv, label: 'Reserva',
                    locked: false, paidAmount: 0, status: 'pending',
                  }])

                  // Inicial row — 1 mes después de la reserva (regla estándar)
                  setInitialRows([{
                    key: newKey(), id: null, dueDate: initialDate,
                    expectedAmount: round2(s.initialRemaining),
                    label: 'Pago Inicial',
                    locked: false, paidAmount: 0, status: 'pending',
                  }])

                  // Construcción — generar tabla según cuotas derivadas
                  constructionStartTouched.current = false
                  setConstructionStart(constrStart)
                  setCount(derivedCount)
                  if (s.constructionAmount > 0 && derivedCount > 0) {
                    const generated = generateConstructionInstallments({
                      constructionAmount: s.constructionAmount,
                      count: derivedCount,
                      periodicityMonths: periodicity,
                      startDate: parseDateInput(constrStart),
                    })
                    setConstructionRows(generated.map((g) => ({
                      key: newKey(), id: null, dueDate: g.dueDate,
                      expectedAmount: g.expectedAmount, label: null,
                      locked: false, paidAmount: 0, status: 'pending',
                    })))
                  }

                  // Final row — fecha de entrega o fin de construcción
                  setFinalRows([{
                    key: newKey(), id: null, dueDate: finalDate,
                    expectedAmount: round2(s.finalAmount),
                    label: 'Contra Entrega',
                    locked: false, paidAmount: 0, status: 'pending',
                  }])

                  toast.success('Plan estándar aplicado')
                }}
              >
                Auto-llenar
              </Button>
            </div>
          </div>
        )
      })()}

      {/* Reservación */}
      <section className="rounded-lg border border-purple-200 bg-purple-50/50 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-purple-700">Reservación</h3>
        <p className="text-xs text-muted-foreground">Monto absoluto. Se descuenta del Pago Inicial.</p>
        <PaymentRows rows={reservationRows} onChange={(r) => { setReservationRows(r); setReservationAmount(sumExpected(r)) }} />
        <SectionTotal scheduled={reservationScheduled} target={reservationScheduled} currency={currency} showFalta={false} color="text-purple-700" />
      </section>

      {/* Pago Inicial */}
      <section className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-blue-700">Pago Inicial ({initialPercent || 0}%)</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">% Inicial (1-100%)</Label>
            <Input type="number" min={0} max={100} value={initialPercent || ''} onChange={(e) => { setInitialPercent(Number(e.target.value) || 0); clearPercentErrors() }} className={cn('h-9', fieldErrors.has('initialPercent') && 'border-destructive focus-visible:ring-destructive')} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Monto Total del Inicial</Label>
            <Input readOnly value={money(sections.initialAmount, currency)} className="h-9 bg-muted/50 font-medium" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Importe Restante por la Reserva</Label>
            <Input readOnly value={money(sections.initialRemaining, currency)} className="h-9 bg-muted/50 font-medium" />
          </div>
        </div>
        <PaymentRows rows={initialRows} onChange={setInitialRows} />
        <SectionTotal scheduled={initialScheduled} target={sections.initialRemaining} currency={currency} color="text-blue-700" />
        {initialOverflow > 0 && (
          <p className="text-right text-xs text-emerald-600">
            ↓ {money(initialOverflow, currency)} de excedente se abona a Construcción
          </p>
        )}
      </section>

      {/* Pago de Construcción */}
      <section className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-emerald-700">Pago de Construcción ({constructionPercent || 0}%)</h3>

        {!manualMode ? (
          /* ─── AUTOMÁTICO ─── count derived from periodicity + delivery window */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">% Construcción (1-100%)</Label>
              <Input type="number" min={0} max={100} value={constructionPercent || ''} onChange={(e) => { setConstructionPercent(Number(e.target.value) || 0); clearPercentErrors() }} className={cn('h-9', fieldErrors.has('constructionPercent') && 'border-destructive focus-visible:ring-destructive')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Monto Construcción (solo lectura)</Label>
              <Input
                readOnly
                value={money(sections.constructionAmount, currency)}
                className="h-9 bg-muted/50 font-medium"
                title="60% del precio de venta"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Periodicidad (meses)</Label>
              <Input type="number" min={1} max={36} value={periodicity || ''} onChange={(e) => setPeriodicity(Number(e.target.value) || 1)} className="h-9" />
              <p className="text-[11px] text-muted-foreground">1 = mensual · 2 = bimestral · 3 = trimestral</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Número de Cuotas (calculado automáticamente)</Label>
              <Input readOnly value={count || 0} className="h-9 bg-muted/50 font-medium" />
              <p className="text-[11px] text-muted-foreground">Según periodicidad y fecha de entrega</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fecha primera cuota</Label>
              <Input type="date" value={constructionStart} onChange={(e) => { constructionStartTouched.current = true; setConstructionStart(e.target.value) }} className="h-9" />
              <p className="text-[11px] text-muted-foreground">1 mes después del último Pago Inicial</p>
            </div>
            <div className="flex items-end justify-between gap-3">
              <Button type="button" variant="outline" size="sm" onClick={generateTable} className="bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white">
                <Table2 className="mr-1 h-3.5 w-3.5" /> Generar Tabla
              </Button>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Modo: <span className="font-medium text-foreground">Automático</span></span>
                <Switch checked={manualMode} onCheckedChange={setManualMode} />
              </label>
            </div>
          </div>
        ) : (
          /* ─── MANUAL ─── user states the cuota count and the amount of each one */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">% Construcción (1-100%)</Label>
              <Input type="number" min={0} max={100} value={constructionPercent || ''} onChange={(e) => { setConstructionPercent(Number(e.target.value) || 0); clearPercentErrors() }} className={cn('h-9', fieldErrors.has('constructionPercent') && 'border-destructive focus-visible:ring-destructive')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Monto Construcción (solo lectura)</Label>
              <Input
                readOnly
                value={money(sections.constructionAmount, currency)}
                className="h-9 bg-muted/50 font-medium"
                title="60% del precio de venta"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs"># Cuotas a generar</Label>
              <Input type="number" min={0} max={600} value={manualCount || ''} placeholder="Ej: 12" onChange={(e) => setManualCount(Number(e.target.value) || 0)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Monto por cuota</Label>
              <MoneyInput value={manualPerAmount} onChange={setManualPerAmount} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fecha de inicio</Label>
              <Input type="date" value={constructionStart} onChange={(e) => { constructionStartTouched.current = true; setConstructionStart(e.target.value) }} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Periodicidad (meses)</Label>
              <Input type="number" min={1} max={36} value={periodicity || ''} onChange={(e) => setPeriodicity(Number(e.target.value) || 1)} className="h-9" />
            </div>
            <div className="flex items-end justify-between gap-3 sm:col-span-2">
              <Button type="button" variant="outline" size="sm" onClick={generateManualTable} className="bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white">
                <Table2 className="mr-1 h-3.5 w-3.5" /> Generar Cuotas
              </Button>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Modo: <span className="font-medium text-foreground">Manual</span></span>
                <Switch checked={manualMode} onCheckedChange={setManualMode} />
              </label>
            </div>
          </div>
        )}

        {/* Installments table — only visible once cuotas have been generated */}
        {constructionRows.length > 0 && (
          <>
            <div className="rounded-md border bg-background">
              <div className="flex items-start justify-between gap-3 border-b px-3 py-2">
                <span className="text-sm font-semibold">Tabla de Cuotas de Construcción</span>
                <div className="space-y-0.5 text-right text-xs">
                  <div className="text-muted-foreground">
                    Objetivo: {money(sections.constructionAmount, currency)}
                    {initialOverflow > 0 && (
                      <span className="text-emerald-600"> − Abono: {money(initialOverflow, currency)}</span>
                    )}
                  </div>
                  {initialOverflow > 0 && (
                    <div>Faltante: <span className="font-medium">{money(effectiveConstructionTarget, currency)}</span></div>
                  )}
                  <div>
                    Total cuotas:{' '}
                    <span className={constructionScheduled >= effectiveConstructionTarget ? 'font-semibold text-emerald-600' : 'font-semibold text-orange-600'}>
                      {money(constructionScheduled, currency)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Cuota #</th>
                      <th className="px-3 py-2 text-left font-medium">Fecha de Pago</th>
                      <th className="px-3 py-2 text-center font-medium">Monto</th>
                      <th className="px-3 py-2 text-center font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {constructionRows.map((r, idx) => (
                      <tr key={r.key} className="border-t">
                        <td className="px-3 py-1.5">{idx + 1}</td>
                        <td className="px-3 py-1.5">
                          <Input type="date" value={r.dueDate} disabled={r.locked} onChange={(e) => updateConstr(r.key, { dueDate: e.target.value })} className="h-8 w-40" />
                        </td>
                        <td className="px-3 py-1.5">
                          <MoneyInput
                            value={r.expectedAmount}
                            onChange={(n) => updateConstr(r.key, { expectedAmount: n })}
                            disabled={r.locked}
                            className="h-8 text-center"
                            onKeyDown={r.key === pendingConstrKey
                              ? (e) => { if (e.key === 'Enter') { e.preventDefault(); confirmConstr(r.key) } }
                              : undefined}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <div className="flex items-center justify-center gap-1">
                            {r.key === pendingConstrKey ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                onClick={() => confirmConstr(r.key)}
                                aria-label="Confirmar cuota"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                            ) : (
                              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateConstr(r.key, { locked: !r.locked })} aria-label={r.locked ? 'Desbloquear' : 'Bloquear'}>
                                {r.locked ? <Lock className="h-3.5 w-3.5 text-amber-600" /> : <LockOpen className="h-3.5 w-3.5 text-muted-foreground" />}
                              </Button>
                            )}
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-rose-500 hover:text-rose-600" onClick={() => removeConstr(r.key)} aria-label="Eliminar cuota">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addConstr}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Añadir Cuota
            </Button>
            <SectionTotal scheduled={constructionScheduled} target={effectiveConstructionTarget} currency={currency} color="text-emerald-700" />
          </>
        )}
        {constructionOverflow > 0 && (
          <p className="text-right text-xs text-emerald-600">
            ↓ {money(constructionOverflow, currency)} de excedente se abona a Entrega
          </p>
        )}
      </section>

      {/* Pago Final */}
      <section className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-amber-700">Pago Final / Entrega ({finalPercent || 0}%)</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">% Final (Entrega)</Label>
            <Input type="number" min={0} max={100} value={finalPercent || ''} onChange={(e) => { setFinalPercent(Number(e.target.value) || 0); clearPercentErrors() }} className={cn('h-9', fieldErrors.has('finalPercent') && 'border-destructive focus-visible:ring-destructive')} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Monto Final (solo lectura)</Label>
            <Input
              readOnly
              value={money(effectiveFinalTarget, currency)}
              className="h-9 bg-muted/50 font-medium"
              title={constructionOverflow > 0 ? `Original: ${money(sections.finalAmount, currency)} − ${money(constructionOverflow, currency)} de Construcción` : undefined}
            />
          </div>
        </div>
        <PaymentRows rows={finalRows} onChange={setFinalRows} />
        <SectionTotal scheduled={finalScheduled} target={effectiveFinalTarget} currency={currency} color="text-amber-700" />
      </section>

      {/* Resumen */}
      <section className="rounded-lg border bg-muted/40 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resumen de Pagos</h3>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total acordado</span>
            <span className="font-semibold text-emerald-600">{money(totalAgreed, currency)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Pendiente</span>
            <span className={pending === 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-orange-600'}>{money(pending, currency)}</span>
          </div>
          <div className="flex items-center justify-between border-t pt-2">
            <span className="font-medium">Total del plan</span>
            <span className="font-bold">{money(totalPrice, currency)}</span>
          </div>
        </div>
      </section>

      {/* Notas */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notas</Label>
        <MentionTextarea
          id="notes"
          rows={2}
          value={notes}
          onChange={setNotes}
          placeholder="Notas adicionales… escribe @ para etiquetar a alguien"
        />
        <p className="text-[11px] text-muted-foreground">Escribe @ para mencionar a un miembro del equipo.</p>
      </div>

      {!percentOk && (
        <p className="rounded-md bg-orange-50 px-3 py-2 text-sm text-orange-700">
          Los porcentajes suman {sections.percentSum}% — deben sumar 100%.
        </p>
      )}
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" disabled={isPending} onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Crear Plan' : 'Actualizar Plan'}
        </Button>
      </div>
    </form>
  )
}
