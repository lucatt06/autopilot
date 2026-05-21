'use client'

import { useMemo, useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Lock, LockOpen, Plus, Table2, Trash2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { searchCustomers } from '@/app/actions/payment-plans-search'

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

interface Props {
  mode: 'create' | 'edit'
  projects: ProjectOpt[]
  initial?: PaymentPlanFormInitial
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
            <Input
              type="number"
              step="0.01"
              min={0}
              disabled={disabled}
              value={r.expectedAmount || ''}
              onChange={(e) => update(r.key, { expectedAmount: round2(Number(e.target.value) || 0) })}
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
  const falta = round2(target - scheduled)
  return (
    <p className="text-right text-sm">
      <span className={cn('font-semibold', color)}>Total: {money(scheduled, currency)}</span>
      {showFalta && (
        <>
          {' / '}
          <span className={falta === 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-orange-600'}>
            Falta: {money(falta, currency)}
          </span>
        </>
      )}
    </p>
  )
}

// ─── Main form ─────────────────────────────────────────────────────────────────

export function PaymentPlanForm({ mode, projects, initial }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Header
  const [name, setName] = useState(initial?.name ?? '')
  const [projectId, setProjectId] = useState(initial?.projectId ?? '')
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

  // Construction config
  const [count, setCount] = useState<number>(initial?.constructionInstallmentsCount ?? 12)
  const [periodicity, setPeriodicity] = useState<number>(initial?.constructionPeriodicityMonths ?? 1)
  const [autoMode, setAutoMode] = useState<boolean>((initial?.constructionMode ?? 'automatic') === 'automatic')
  const [constructionStart, setConstructionStart] = useState<string>(() => {
    const existing = initial?.installments.find((i) => i.type === 'CONSTRUCTION')
    if (existing?.dueDate) return existing.dueDate.slice(0, 10)
    return toDateInput(addMonths(new Date(), 1))
  })

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

  // ─── Generate construction table ──────────────────────────────────────────────

  function generateTable() {
    const locked = constructionRows.filter((r) => r.locked)
    const lockedSum = sumExpected(locked)
    const remaining = round2(sections.constructionAmount - lockedSum)
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

  // Auto-regenerate when in automatic mode and config changes
  useEffect(() => {
    if (!autoMode) return
    if (sections.constructionAmount <= 0 || count <= 0) return
    const hasLocks = constructionRows.some((r) => r.locked)
    if (hasLocks) return // don't clobber manual locks automatically
    const generated = generateConstructionInstallments({
      constructionAmount: sections.constructionAmount,
      count,
      periodicityMonths: periodicity,
      startDate: parseDateInput(constructionStart),
    })
    setConstructionRows(
      generated.map((g) => ({
        key: newKey(),
        id: null,
        dueDate: g.dueDate,
        expectedAmount: g.expectedAmount,
        label: null,
        locked: false,
        paidAmount: 0,
        status: 'pending',
      })),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode, sections.constructionAmount, count, periodicity, constructionStart])

  // ─── Construction row actions ──────────────────────────────────────────────────

  function updateConstr(key: string, patch: Partial<Row>) {
    setConstructionRows((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }
  function removeConstr(key: string) {
    setConstructionRows((rows) => rows.filter((r) => r.key !== key))
  }
  function addConstr() {
    setConstructionRows((rows) => [
      ...rows,
      {
        key: newKey(),
        id: null,
        dueDate: toDateInput(addMonths(parseDateInput(constructionStart), rows.length * periodicity)),
        expectedAmount: 0,
        label: null,
        locked: false,
        paidAmount: 0,
        status: 'pending',
      },
    ])
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

    if (!name.trim()) { setError('Ingresa un nombre para el plan'); return }
    if (totalPrice <= 0) { setError('Ingresa el precio de compra'); return }
    if (!percentOk) { setError('Los porcentajes (Inicial + Construcción + Final) deben sumar 100%'); return }

    const payload = {
      name: name.trim(),
      projectId: projectId || undefined,
      customerId: customer?.id || undefined,
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
      constructionMode: autoMode ? ('automatic' as const) : ('manual' as const),
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
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Plan- Griselda y Pablo H." />
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="price">Precio de Compra *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min={0}
            value={totalPrice || ''}
            onChange={(e) => setTotalPrice(round2(Number(e.target.value) || 0))}
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
            <Input type="number" min={0} max={100} value={initialPercent || ''} onChange={(e) => setInitialPercent(Number(e.target.value) || 0)} className="h-9" />
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
      </section>

      {/* Pago de Construcción */}
      <section className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-emerald-700">Pago de Construcción ({constructionPercent || 0}%)</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">% Construcción (1-100%)</Label>
            <Input type="number" min={0} max={100} value={constructionPercent || ''} onChange={(e) => setConstructionPercent(Number(e.target.value) || 0)} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Monto Construcción (solo lectura)</Label>
            <Input readOnly value={money(sections.constructionAmount, currency)} className="h-9 bg-muted/50 font-medium" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Número de Cuotas</Label>
            <Input type="number" min={0} max={600} value={count || ''} onChange={(e) => setCount(Number(e.target.value) || 0)} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Periodicidad (meses)</Label>
            <Input type="number" min={1} max={36} value={periodicity || ''} onChange={(e) => setPeriodicity(Number(e.target.value) || 1)} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Fecha primera cuota</Label>
            <Input type="date" value={constructionStart} onChange={(e) => setConstructionStart(e.target.value)} className="h-9" />
          </div>
          <div className="flex items-end justify-between gap-3">
            <Button type="button" variant="outline" size="sm" onClick={generateTable} className="bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white">
              <Table2 className="mr-1 h-3.5 w-3.5" /> Generar Tabla
            </Button>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Modo
              <Switch checked={autoMode} onCheckedChange={setAutoMode} />
              <span>{autoMode ? 'Automático' : 'Manual'}</span>
            </label>
          </div>
        </div>

        {/* Installments table */}
        <div className="rounded-md border bg-background">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-semibold">Tabla de Cuotas de Construcción</span>
            <span className="text-xs">
              Total cuotas:{' '}
              <span className={constructionScheduled === sections.constructionAmount ? 'font-semibold text-emerald-600' : 'font-semibold text-orange-600'}>
                {money(constructionScheduled, currency)}
              </span>{' '}
              / Objetivo: {money(sections.constructionAmount, currency)}
            </span>
          </div>
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Cuota #</th>
                  <th className="px-3 py-2 text-left font-medium">Fecha de Pago</th>
                  <th className="px-3 py-2 text-right font-medium">Monto</th>
                  <th className="px-3 py-2 text-center font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {constructionRows.length === 0 ? (
                  <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">Genera la tabla o añade cuotas manualmente</td></tr>
                ) : (
                  constructionRows.map((r, idx) => (
                    <tr key={r.key} className="border-t">
                      <td className="px-3 py-1.5">{idx + 1}</td>
                      <td className="px-3 py-1.5">
                        <Input type="date" value={r.dueDate} disabled={r.locked} onChange={(e) => updateConstr(r.key, { dueDate: e.target.value })} className="h-8 w-40" />
                      </td>
                      <td className="px-3 py-1.5">
                        <Input type="number" step="0.01" min={0} value={r.expectedAmount || ''} disabled={r.locked} onChange={(e) => updateConstr(r.key, { expectedAmount: round2(Number(e.target.value) || 0) })} className="h-8 text-right" />
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="flex items-center justify-center gap-1">
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateConstr(r.key, { locked: !r.locked })} aria-label={r.locked ? 'Desbloquear' : 'Bloquear'}>
                            {r.locked ? <Lock className="h-3.5 w-3.5 text-amber-600" /> : <LockOpen className="h-3.5 w-3.5 text-muted-foreground" />}
                          </Button>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-rose-500 hover:text-rose-600" onClick={() => removeConstr(r.key)} aria-label="Eliminar cuota">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addConstr}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Añadir Cuota
        </Button>
      </section>

      {/* Pago Final */}
      <section className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-amber-700">Pago Final / Entrega ({finalPercent || 0}%)</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">% Final (Entrega)</Label>
            <Input type="number" min={0} max={100} value={finalPercent || ''} onChange={(e) => setFinalPercent(Number(e.target.value) || 0)} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Monto Final (solo lectura)</Label>
            <Input readOnly value={money(sections.finalAmount, currency)} className="h-9 bg-muted/50 font-medium" />
          </div>
        </div>
        <PaymentRows rows={finalRows} onChange={setFinalRows} />
        <SectionTotal scheduled={finalScheduled} target={sections.finalAmount} currency={currency} color="text-amber-700" />
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
        <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas adicionales sobre el plan de pago…" />
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
