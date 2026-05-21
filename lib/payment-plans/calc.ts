/**
 * Pure calculation helpers for the Payment Plan builder.
 *
 * Model recap (Doc 1 §8.7):
 *  - Reservation is an ABSOLUTE amount carved out of the Initial section.
 *  - initialPercent + constructionPercent + finalPercent = 100 (of total price).
 *  - The Initial section's scheduled payments must cover
 *    `initialAmount - reservationAmount` (the "Importe Restante por la Reserva").
 *  - Construction is split into N equal installments spaced by a periodicity (months).
 *
 * These helpers are framework-agnostic and safe to import in client components.
 */

export type InstallmentTypeKey = 'RESERVATION' | 'INITIAL' | 'CONSTRUCTION' | 'FINAL'

/** Round to 2 decimals avoiding float drift. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/** Add a whole number of months to a date, returning a new Date. */
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  const targetMonth = d.getMonth() + months
  d.setMonth(targetMonth)
  return d
}

/** Format a Date as a yyyy-MM-dd string for <input type="date">. */
export function toDateInput(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export interface SectionAmounts {
  initialAmount: number
  constructionAmount: number
  finalAmount: number
  /** initialAmount - reservationAmount — what the Initial scheduled payments must cover. */
  initialRemaining: number
  /** Sum of the three section percents (should be 100). */
  percentSum: number
}

export function computeSectionAmounts(input: {
  totalPrice: number
  reservationAmount: number
  initialPercent: number
  constructionPercent: number
  finalPercent: number
}): SectionAmounts {
  const { totalPrice, reservationAmount, initialPercent, constructionPercent, finalPercent } = input
  const initialAmount = round2((totalPrice * initialPercent) / 100)
  const constructionAmount = round2((totalPrice * constructionPercent) / 100)
  const finalAmount = round2((totalPrice * finalPercent) / 100)
  return {
    initialAmount,
    constructionAmount,
    finalAmount,
    initialRemaining: round2(initialAmount - reservationAmount),
    percentSum: round2(initialPercent + constructionPercent + finalPercent),
  }
}

export interface GeneratedInstallment {
  installmentNumber: number
  expectedAmount: number
  dueDate: string // yyyy-MM-dd
}

/**
 * Build N equal construction installments. The last installment absorbs any
 * rounding remainder so the sum equals constructionAmount exactly.
 */
export function generateConstructionInstallments(input: {
  constructionAmount: number
  count: number
  periodicityMonths: number
  startDate: Date
}): GeneratedInstallment[] {
  const { constructionAmount, count, periodicityMonths, startDate } = input
  if (count <= 0 || constructionAmount <= 0) return []

  const per = round2(constructionAmount / count)
  const installments: GeneratedInstallment[] = []
  let accumulated = 0

  for (let i = 0; i < count; i++) {
    const isLast = i === count - 1
    const amount = isLast ? round2(constructionAmount - accumulated) : per
    accumulated = round2(accumulated + amount)
    installments.push({
      installmentNumber: i + 1,
      expectedAmount: amount,
      dueDate: toDateInput(addMonths(startDate, i * periodicityMonths)),
    })
  }

  return installments
}

/** Sum expectedAmount of a list of installment-like rows. */
export function sumExpected(rows: { expectedAmount: number }[]): number {
  return round2(rows.reduce((acc, r) => acc + (Number(r.expectedAmount) || 0), 0))
}

/** Sum paidAmount of a list of installment-like rows. */
export function sumPaid(rows: { paidAmount?: number }[]): number {
  return round2(rows.reduce((acc, r) => acc + (Number(r.paidAmount) || 0), 0))
}

/**
 * Apply a real payment amount across a section's installments in due-date order,
 * fully covering each before spilling the remainder into the next (Cobros flow).
 * Returns updated rows with paidAmount/status. Pure — does not touch the DB.
 */
export function applyPaymentToInstallments<
  T extends { id?: string; expectedAmount: number; paidAmount: number; status: string },
>(installments: T[], paymentAmount: number): T[] {
  let remaining = round2(paymentAmount)
  return installments.map((inst) => {
    if (remaining <= 0) return inst
    const owed = round2(inst.expectedAmount - inst.paidAmount)
    if (owed <= 0) return inst
    const applied = Math.min(owed, remaining)
    remaining = round2(remaining - applied)
    const newPaid = round2(inst.paidAmount + applied)
    const status = newPaid >= inst.expectedAmount ? 'paid' : 'partial'
    return { ...inst, paidAmount: newPaid, status }
  })
}
