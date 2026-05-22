import 'server-only'

import { db } from '@/lib/db'

// ─── Stage definitions ────────────────────────────────────────────────────────

export const POSVENTA_FUNNEL_KEY = 'posventa'

export type PosventaStageKey =
  | 'unidad_bloqueada'
  | 'completar_reserva'
  | 'firmar_contrato'
  | 'pagar_comision'
  | 'cuotas_al_dia'
  | 'cuotas_en_atraso'
  | 'entrega'

export interface PosventaStageDef {
  key: PosventaStageKey
  label: string
  /** Tailwind accent classes for the column header */
  accent: string
  dot: string
}

export const POSVENTA_STAGES: PosventaStageDef[] = [
  { key: 'unidad_bloqueada', label: 'Bloqueada',                       accent: 'text-yellow-700',  dot: 'bg-yellow-400' },
  { key: 'completar_reserva', label: 'Reservada',                      accent: 'text-blue-700',    dot: 'bg-blue-400' },
  { key: 'firmar_contrato',  label: 'Firmar Contrato',                 accent: 'text-indigo-700',  dot: 'bg-indigo-400' },
  { key: 'pagar_comision',   label: 'Contrato firmado / Pagar comisión', accent: 'text-purple-700', dot: 'bg-purple-400' },
  { key: 'cuotas_al_dia',    label: 'Cuotas al Día',                   accent: 'text-emerald-700', dot: 'bg-emerald-400' },
  { key: 'cuotas_en_atraso', label: 'Cuotas en Atraso',               accent: 'text-red-700',     dot: 'bg-red-400' },
  { key: 'entrega',          label: 'Entrega',                         accent: 'text-teal-700',    dot: 'bg-teal-400' },
]

// ─── Stage ↔ Unit status mapping (bidirectional sync) ──────────────────────────
// Moving a card sets the unit status; changing the unit status moves the card.
export const STAGE_TO_UNIT_STATUS: Record<PosventaStageKey, 'BLOQUEADA' | 'RESERVADA' | 'VENDIDA' | 'ENTREGADA'> = {
  unidad_bloqueada: 'BLOQUEADA',
  completar_reserva: 'RESERVADA',
  firmar_contrato: 'VENDIDA',
  pagar_comision: 'VENDIDA',
  cuotas_al_dia: 'VENDIDA',
  cuotas_en_atraso: 'VENDIDA',
  entrega: 'ENTREGADA',
}

// Stages whose target is fully determined by the unit status alone — dragging here
// clears any manual override (the derived stage will match). The VENDIDA sub-stages
// (firmar_contrato … cuotas_en_atraso) are NOT here: they need an override to stick.
export const COARSE_STAGES = new Set<PosventaStageKey>(['unidad_bloqueada', 'completar_reserva', 'entrega'])

const STAGE_KEYS = new Set<string>(POSVENTA_STAGES.map((s) => s.key))
export function isPosventaStage(v: string): v is PosventaStageKey {
  return STAGE_KEYS.has(v)
}

// ─── Card shape ─────────────────────────────────────────────────────────────────

export interface PosventaCard {
  unitId: string
  unitNumber: string
  buildingName: string
  projectId: string
  projectName: string
  type: string
  floor: number
  currentPrice: number
  unitStatus: string
  clientName: string | null
  contactId: string | null
  paymentPlanId: string | null
  /** Stage computed from real data (null if not in journey) */
  derivedStage: PosventaStageKey | null
  /** Effective stage = manual override ?? derived */
  stage: PosventaStageKey
  /** True when the card was placed manually (override exists) */
  isManual: boolean
  /** % of the plan total already paid (null if no plan) */
  paidPct: number | null
}

export interface PosventaColumn {
  stage: PosventaStageDef
  cards: PosventaCard[]
}

// ─── Derivation ───────────────────────────────────────────────────────────────

type UnitWithJourney = Awaited<ReturnType<typeof fetchUnits>>[number]

// The unit status is the PRIMARY driver of the stage (bidirectional sync).
// Within VENDIDA the precise sub-stage is refined from contract / commission /
// payment data. A manual override (handled by the caller) takes precedence.
function derivePosventaStage(unit: UnitWithJourney): PosventaStageKey | null {
  switch (unit.status) {
    case 'ENTREGADA':
      return 'entrega'
    case 'VENDIDA': {
      const sale = unit.sales[0]
      const contractSigned = sale?.contracts.some(
        (c) => c.status === 'SIGNED' || c.status === 'NOTARIZED' || !!c.signedAt,
      ) ?? false
      if (!contractSigned) return 'firmar_contrato'
      // Contract signed → commission step while any commission is unpaid.
      if (sale?.commissions.some((c) => c.status !== 'PAID')) return 'pagar_comision'
      const now = Date.now()
      const hasOverdue = sale?.paymentPlan?.installments.some(
        (i) =>
          i.status === 'overdue' ||
          (i.status !== 'paid' && i.paidAmount < i.expectedAmount && new Date(i.dueDate).getTime() < now),
      ) ?? false
      return hasOverdue ? 'cuotas_en_atraso' : 'cuotas_al_dia'
    }
    case 'RESERVADA':
      return 'completar_reserva'
    case 'BLOQUEADA':
      return 'unidad_bloqueada'
    default:
      return null // DISPONIBLE — not in the funnel
  }
}

// ─── Query ────────────────────────────────────────────────────────────────────

async function fetchUnits(workspaceId: string, projectIds: string[], extraUnitIds: string[]) {
  return db.unit.findMany({
    where: {
      workspaceId,
      ...(projectIds.length ? { projectId: { in: projectIds } } : {}),
      OR: [
        // Status is the primary driver — any non-available unit is in the funnel.
        { status: { in: ['BLOQUEADA', 'RESERVADA', 'VENDIDA', 'ENTREGADA'] } },
        ...(extraUnitIds.length ? [{ id: { in: extraUnitIds } }] : []),
      ],
    },
    select: {
      id: true,
      unitNumber: true,
      floor: true,
      type: true,
      currentPrice: true,
      status: true,
      projectId: true,
      project: { select: { name: true } },
      building: { select: { name: true } },
      blocks: {
        where: { status: { in: ['ACTIVE', 'EXPIRING_SOON'] } },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { contactId: true, status: true },
      },
      reservations: {
        where: { status: { in: ['ACTIVE', 'EXPIRING_SOON'] } },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { contactId: true, status: true },
      },
      sales: {
        where: { status: { not: 'CANCELLED' } },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          contactId: true,
          status: true,
          customer: { select: { status: true } },
          contracts: { select: { status: true, signedAt: true } },
          commissions: { select: { status: true } },
          paymentPlan: {
            select: {
              id: true,
              totalPrice: true,
              totalPaid: true,
              installments: { select: { status: true, paidAmount: true, expectedAmount: true, dueDate: true } },
            },
          },
        },
      },
    },
  })
}

/**
 * Build the Posventa funnel board: 7 stage columns with their unit cards.
 * Effective stage = manual override (if any) ?? derived-from-data.
 */
export async function getPosventaFunnel(workspaceId: string, projectIds: string[]): Promise<PosventaColumn[]> {
  // Manual overrides first — their units must be included even if their derived
  // state no longer matches (e.g. a block expired but the card was placed manually).
  const overrides = await db.funnelStageOverride.findMany({
    where: { workspaceId, funnelKey: POSVENTA_FUNNEL_KEY },
    select: { unitId: true, stage: true },
  })
  const overrideMap = new Map(overrides.map((o) => [o.unitId, o.stage]))

  const units = await fetchUnits(workspaceId, projectIds, [...overrideMap.keys()])

  // Resolve client names from contactIds (Sale/Reservation/Block have no relation).
  const contactIds = new Set<string>()
  for (const u of units) {
    const cid = u.sales[0]?.contactId ?? u.reservations[0]?.contactId ?? u.blocks[0]?.contactId ?? null
    if (cid) contactIds.add(cid)
  }
  const contacts = contactIds.size
    ? await db.contact.findMany({
        where: { id: { in: [...contactIds] }, workspaceId },
        select: { id: true, firstName: true, lastName: true },
      })
    : []
  const contactName = new Map(contacts.map((c) => [c.id, `${c.firstName} ${c.lastName}`.trim()]))

  const cards: PosventaCard[] = []
  for (const u of units) {
    const derived = derivePosventaStage(u)
    const overridden = overrideMap.get(u.id)
    const effective = (overridden && isPosventaStage(overridden) ? overridden : derived)
    if (!effective) continue // not in the journey and not manually placed

    const cid = u.sales[0]?.contactId ?? u.reservations[0]?.contactId ?? u.blocks[0]?.contactId ?? null
    const plan = u.sales[0]?.paymentPlan
    const paidPct = plan && plan.totalPrice > 0 ? Math.round((plan.totalPaid / plan.totalPrice) * 100) : null

    cards.push({
      unitId: u.id,
      unitNumber: u.unitNumber,
      buildingName: u.building.name,
      projectId: u.projectId,
      projectName: u.project.name,
      type: u.type,
      floor: u.floor,
      currentPrice: u.currentPrice,
      unitStatus: u.status,
      clientName: cid ? contactName.get(cid) ?? null : null,
      contactId: cid,
      paymentPlanId: plan?.id ?? null,
      derivedStage: derived,
      stage: effective,
      isManual: !!overridden && overridden !== derived,
      paidPct,
    })
  }

  // Group into ordered columns
  return POSVENTA_STAGES.map((stage) => ({
    stage,
    cards: cards.filter((c) => c.stage === stage.key),
  }))
}
