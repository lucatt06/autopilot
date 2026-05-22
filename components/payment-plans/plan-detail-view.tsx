import { CalendarDays, DollarSign, Percent } from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatDate, formatDateLong } from '@/lib/dates'
import { PLAN_STATUS_LABELS, PLAN_STATUS_BADGE, type PlanStatusKey } from '@/lib/payment-plans/schemas'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlanDetailInstallment {
  id: string
  type: string
  installmentNumber: number
  label: string | null
  expectedAmount: number
  paidAmount: number
  dueDate: Date | string
  status: string
}

export interface PlanDetailData {
  id: string
  name: string
  status: string
  currency: string
  projectName: string | null
  customerName: string | null
  workspaceName?: string | null
  deliveryDate: Date | string | null
  createdAt: Date | string
  totalPrice: number
  totalPaid: number
  reservationAmount: number
  initialAmount: number
  constructionAmount: number
  finalAmount: number
  initialPercent: number
  constructionPercent: number
  finalPercent: number
  constructionInstallmentsCount: number
  constructionPeriodicityMonths: number
  installments: PlanDetailInstallment[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function money(n: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0)
}

function periodicityLabel(months: number): string {
  switch (months) {
    case 1: return 'Mensual'
    case 2: return 'Bimestral'
    case 3: return 'Trimestral'
    case 6: return 'Semestral'
    case 12: return 'Anual'
    default: return `Cada ${months} meses`
  }
}

const SECTION_META: Record<string, { label: string; accent: string; headerBg: string }> = {
  RESERVATION:  { label: 'Cuotas de Reservación',     accent: 'text-purple-700',  headerBg: 'bg-purple-50/60' },
  INITIAL:      { label: 'Cuotas de Inicial',          accent: 'text-blue-700',    headerBg: 'bg-blue-50/60' },
  CONSTRUCTION: { label: 'Cuotas de Construcción',     accent: 'text-emerald-700', headerBg: 'bg-emerald-50/60' },
  FINAL:        { label: 'Cuotas de Entrega / Final',  accent: 'text-amber-700',   headerBg: 'bg-amber-50/60' },
}

const SECTION_TOTAL_LABEL: Record<string, string> = {
  RESERVATION:  'Total Reservación',
  INITIAL:      'Total Inicial',
  CONSTRUCTION: 'Total Construcción',
  FINAL:        'Total Final',
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

type DisplayStatus = 'paid' | 'partial' | 'overdue' | 'soon' | 'pending'

function displayStatus(i: PlanDetailInstallment, now: number): DisplayStatus {
  if (i.status === 'paid' || (i.paidAmount > 0 && i.paidAmount >= i.expectedAmount)) return 'paid'
  if (i.paidAmount > 0) return 'partial'
  const due = new Date(i.dueDate).getTime()
  if (due < now) return 'overdue'
  if (due <= now + WEEK_MS) return 'soon'
  return 'pending'
}

const STATUS_BADGE: Record<DisplayStatus, { label: string; className: string }> = {
  paid:    { label: 'Pagado',    className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  partial: { label: 'Parcial',   className: 'bg-blue-100 text-blue-700 border-blue-200' },
  overdue: { label: 'Vencido',   className: 'bg-red-100 text-red-700 border-red-200' },
  soon:    { label: 'Próximo',   className: 'bg-orange-100 text-orange-700 border-orange-200' },
  pending: { label: 'Pendiente', className: 'bg-gray-100 text-gray-600 border-gray-200' },
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function PlanDetailView({ plan }: { plan: PlanDetailData }) {
  const now = Date.now()
  const statusKey = plan.status as PlanStatusKey
  const currency = plan.currency

  const sections = (['RESERVATION', 'INITIAL', 'CONSTRUCTION', 'FINAL'] as const).map((type) => ({
    type,
    rows: plan.installments
      .filter((i) => i.type === type)
      .sort((a, b) => a.installmentNumber - b.installmentNumber),
  })).filter((s) => s.rows.length > 0)

  // Payment summary
  const unpaid = plan.installments.filter((i) => displayStatus(i, now) !== 'paid')
  const soonCount = unpaid.filter((i) => new Date(i.dueDate).getTime() <= now + WEEK_MS).length
  const futureCount = unpaid.filter((i) => new Date(i.dueDate).getTime() > now + WEEK_MS).length
  const pendingAmount = plan.totalPrice - plan.totalPaid

  return (
    <div className="space-y-8">
      {/* ─── Top: Financial summary + Plan details ─── */}
      <div className="grid gap-8 sm:grid-cols-2">
        {/* Resumen Financiero */}
        <div>
          <h3 className="flex items-center gap-1.5 text-base font-semibold">
            <DollarSign className="h-4 w-4 text-emerald-600" /> Resumen Financiero
          </h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Monto Total:</dt>
              <dd className="font-bold tabular-nums">{money(plan.totalPrice, currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Inicial ({plan.initialPercent}%):</dt>
              <dd className="tabular-nums">{money(plan.initialAmount, currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Construcción ({plan.constructionPercent}%):</dt>
              <dd className="tabular-nums">{money(plan.constructionAmount, currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Entrega ({plan.finalPercent}%):</dt>
              <dd className="tabular-nums">{money(plan.finalAmount, currency)}</dd>
            </div>
          </dl>
        </div>

        {/* Detalles del Plan */}
        <div>
          <h3 className="flex items-center gap-1.5 text-base font-semibold">
            <Percent className="h-4 w-4 text-blue-600" /> Detalles del Plan
          </h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Número de Cuotas:</dt>
              <dd className="font-medium tabular-nums">{plan.constructionInstallmentsCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Periodicidad:</dt>
              <dd className="font-medium">{periodicityLabel(plan.constructionPeriodicityMonths)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Fecha de Entrega:</dt>
              <dd className="font-medium">{plan.deliveryDate ? formatDateLong(plan.deliveryDate) : '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Monto Reserva:</dt>
              <dd className="font-medium tabular-nums">{money(plan.reservationAmount, currency)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* ─── Section tables ─── */}
      {sections.map(({ type, rows }) => {
        const meta = SECTION_META[type]!
        const sectionTotal = rows.reduce((acc, r) => acc + r.expectedAmount, 0)
        const isConstruction = type === 'CONSTRUCTION'
        return (
          <div key={type}>
            <h3 className={cn('flex items-center gap-1.5 text-sm font-semibold', meta.accent)}>
              <CalendarDays className="h-4 w-4" /> {meta.label}
            </h3>
            <div className="mt-2 overflow-hidden rounded-lg border">
              <div>
                <table className="w-full text-sm">
                  <thead className={cn('sticky top-0 text-xs uppercase text-muted-foreground', meta.headerBg)}>
                    <tr>
                      <th className="px-3 py-2.5 text-left font-medium">{isConstruction ? 'Cuota #' : '#'}</th>
                      <th className="px-3 py-2.5 text-left font-medium">Fecha {isConstruction ? '' : 'de Pago'}</th>
                      <th className="px-3 py-2.5 text-right font-medium">Monto</th>
                      {isConstruction && <th className="px-3 py-2.5 text-right font-medium">Falta</th>}
                      <th className="px-3 py-2.5 text-center font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const st = displayStatus(r, now)
                      const badge = STATUS_BADGE[st]
                      const falta = Math.max(0, r.expectedAmount - r.paidAmount)
                      return (
                        <tr key={r.id} className="border-t">
                          <td className="px-3 py-2.5 text-muted-foreground">{r.installmentNumber}</td>
                          <td className="px-3 py-2.5">
                            {isConstruction ? formatDate(r.dueDate) : formatDateLong(r.dueDate)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-medium tabular-nums">{money(r.expectedAmount, currency)}</td>
                          {isConstruction && (
                            <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{money(falta, currency)}</td>
                          )}
                          <td className="px-3 py-2.5">
                            <div className="flex justify-center">
                              <span className={cn('inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium', badge.className)}>
                                {badge.label}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className={cn('border-t', meta.headerBg)}>
                      <td colSpan={2} className="px-3 py-2.5 text-sm font-semibold">{SECTION_TOTAL_LABEL[type]}</td>
                      <td className="px-3 py-2.5 text-right text-sm font-bold tabular-nums">{money(sectionTotal, currency)}</td>
                      {isConstruction && <td />}
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )
      })}

      {/* ─── Resumen de Pagos ─── */}
      <div>
        <h3 className="flex items-center gap-1.5 text-base font-semibold">
          <DollarSign className="h-4 w-4 text-emerald-600" /> Resumen de Pagos
        </h3>
        <div className="mt-3 overflow-hidden rounded-lg border text-sm">
          <div className="flex items-center justify-between bg-emerald-50/60 px-4 py-2.5">
            <span className="text-muted-foreground">Total pagado</span>
            <span className="font-bold tabular-nums text-emerald-600">{money(plan.totalPaid, currency)}</span>
          </div>
          <div className="flex items-center justify-between border-t bg-amber-50/50 px-4 py-2.5">
            <span className="text-muted-foreground">Próximas a vencer (7 días)</span>
            <span className="font-semibold text-amber-700">{soonCount} {soonCount === 1 ? 'cuota' : 'cuotas'}</span>
          </div>
          <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2.5">
            <span className="text-muted-foreground">Pendientes futuras</span>
            <span className="font-semibold">{futureCount} {futureCount === 1 ? 'cuota' : 'cuotas'}</span>
          </div>
          <div className="flex items-center justify-between border-t bg-amber-50/50 px-4 py-2.5">
            <span className="text-muted-foreground">Pendiente</span>
            <span className="font-bold tabular-nums text-amber-700">{money(pendingAmount, currency)}</span>
          </div>
          <div className="flex items-center justify-between border-t-2 px-4 py-3">
            <span className="font-semibold">Total del plan</span>
            <span className="font-bold tabular-nums">{money(plan.totalPrice, currency)}</span>
          </div>
        </div>
      </div>

      {/* Created date */}
      <p className="text-xs text-muted-foreground">Creado: {formatDateLong(plan.createdAt)}</p>
    </div>
  )
}
