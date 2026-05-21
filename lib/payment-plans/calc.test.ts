import { describe, it, expect } from 'vitest'

import {
  addMonths,
  applyPaymentToInstallments,
  computeSectionAmounts,
  generateConstructionInstallments,
  installmentStatus,
  parseDateInput,
  reconcileInstallments,
  round2,
  sumExpected,
  toDateInput,
} from './calc'

describe('round2', () => {
  it('rounds to 2 decimals without float drift', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3)
    expect(round2(2686.255)).toBe(2686.26)
    expect(round2(64470 / 12)).toBe(5372.5)
  })
})

describe('parseDateInput / toDateInput', () => {
  it('parses a date-only string as local (no UTC off-by-one)', () => {
    const d = parseDateInput('2026-06-20')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(5) // June (0-indexed)
    expect(d.getDate()).toBe(20)
  })

  it('round-trips through toDateInput', () => {
    expect(toDateInput(parseDateInput('2026-06-20'))).toBe('2026-06-20')
  })
})

describe('addMonths', () => {
  it('adds whole months', () => {
    expect(toDateInput(addMonths(parseDateInput('2026-01-20'), 1))).toBe('2026-02-20')
    expect(toDateInput(addMonths(parseDateInput('2026-12-20'), 1))).toBe('2027-01-20')
    expect(toDateInput(addMonths(parseDateInput('2026-06-20'), 6))).toBe('2026-12-20')
  })
})

describe('computeSectionAmounts', () => {
  it('matches the reference scenario (161,175 / 20-40-40 / reserva 3,000)', () => {
    const s = computeSectionAmounts({
      totalPrice: 161175,
      reservationAmount: 3000,
      initialPercent: 20,
      constructionPercent: 40,
      finalPercent: 40,
    })
    expect(s.initialAmount).toBe(32235)
    expect(s.constructionAmount).toBe(64470)
    expect(s.finalAmount).toBe(64470)
    expect(s.initialRemaining).toBe(29235) // initial - reservation
    expect(s.percentSum).toBe(100)
  })

  it('reports percentSum when percentages do not sum to 100', () => {
    const s = computeSectionAmounts({
      totalPrice: 100000,
      reservationAmount: 0,
      initialPercent: 30,
      constructionPercent: 30,
      finalPercent: 30,
    })
    expect(s.percentSum).toBe(90)
  })

  it('yields negative initialRemaining when reservation exceeds initial', () => {
    const s = computeSectionAmounts({
      totalPrice: 100000,
      reservationAmount: 25000,
      initialPercent: 20, // initial = 20,000
      constructionPercent: 40,
      finalPercent: 40,
    })
    expect(s.initialRemaining).toBe(-5000)
  })
})

describe('generateConstructionInstallments', () => {
  it('returns [] for count = 0', () => {
    expect(generateConstructionInstallments({ constructionAmount: 64470, count: 0, periodicityMonths: 1, startDate: parseDateInput('2026-06-20') })).toEqual([])
  })

  it('returns [] for constructionAmount = 0', () => {
    expect(generateConstructionInstallments({ constructionAmount: 0, count: 12, periodicityMonths: 1, startDate: parseDateInput('2026-06-20') })).toEqual([])
  })

  it('count = 1 produces a single installment equal to the amount', () => {
    const r = generateConstructionInstallments({ constructionAmount: 64470, count: 1, periodicityMonths: 1, startDate: parseDateInput('2026-06-20') })
    expect(r).toHaveLength(1)
    expect(r[0]!.expectedAmount).toBe(64470)
    expect(r[0]!.dueDate).toBe('2026-06-20')
  })

  it('splits evenly and the sum equals the target (12 equal cuotas)', () => {
    const r = generateConstructionInstallments({ constructionAmount: 64470, count: 12, periodicityMonths: 1, startDate: parseDateInput('2026-06-20') })
    expect(r).toHaveLength(12)
    expect(sumExpected(r)).toBe(64470)
    expect(r.every((i) => i.expectedAmount === 5372.5)).toBe(true)
  })

  it('last installment absorbs the rounding remainder (non-divisible)', () => {
    // 1000 / 3 = 333.333… → 333.33 each, last absorbs the cent to total exactly.
    const r = generateConstructionInstallments({ constructionAmount: 1000, count: 3, periodicityMonths: 1, startDate: parseDateInput('2026-06-20') })
    expect(r).toHaveLength(3)
    expect(sumExpected(r)).toBe(1000) // exact despite rounding
    expect(r[0]!.expectedAmount).toBe(333.33)
    expect(r[1]!.expectedAmount).toBe(333.33)
    expect(r[2]!.expectedAmount).toBe(333.34) // remainder lands here
  })

  it('spaces due dates by the periodicity in months', () => {
    const r = generateConstructionInstallments({ constructionAmount: 30000, count: 3, periodicityMonths: 2, startDate: parseDateInput('2026-01-15') })
    expect(r.map((i) => i.dueDate)).toEqual(['2026-01-15', '2026-03-15', '2026-05-15'])
  })
})

describe('installmentStatus', () => {
  it('classifies pending / partial / paid', () => {
    expect(installmentStatus(0, 1000)).toBe('pending')
    expect(installmentStatus(400, 1000)).toBe('partial')
    expect(installmentStatus(1000, 1000)).toBe('paid')
    expect(installmentStatus(1200, 1000)).toBe('paid')
  })
})

describe('applyPaymentToInstallments (Cobros coverage cascade)', () => {
  const base = () => [
    { id: 'a', expectedAmount: 1000, paidAmount: 0, status: 'pending' },
    { id: 'b', expectedAmount: 1000, paidAmount: 0, status: 'pending' },
    { id: 'c', expectedAmount: 1000, paidAmount: 0, status: 'pending' },
  ]

  it('fully covers the first installment with an exact payment', () => {
    const r = applyPaymentToInstallments(base(), 1000)
    expect(r[0]).toMatchObject({ paidAmount: 1000, status: 'paid' })
    expect(r[1]).toMatchObject({ paidAmount: 0, status: 'pending' })
  })

  it('spills the remainder into the next installment (partial)', () => {
    const r = applyPaymentToInstallments(base(), 1500)
    expect(r[0]).toMatchObject({ paidAmount: 1000, status: 'paid' })
    expect(r[1]).toMatchObject({ paidAmount: 500, status: 'partial' })
    expect(r[2]).toMatchObject({ paidAmount: 0, status: 'pending' })
  })

  it('ignores leftover when payment exceeds the total owed', () => {
    const r = applyPaymentToInstallments(base(), 5000)
    expect(r.every((i) => i.status === 'paid')).toBe(true)
    expect(sumExpected(r.map((i) => ({ expectedAmount: i.paidAmount })))).toBe(3000)
  })

  it('skips already-paid installments and covers the next owed one', () => {
    const rows = [
      { id: 'a', expectedAmount: 1000, paidAmount: 1000, status: 'paid' },
      { id: 'b', expectedAmount: 1000, paidAmount: 0, status: 'pending' },
    ]
    const r = applyPaymentToInstallments(rows, 600)
    expect(r[0]).toMatchObject({ paidAmount: 1000, status: 'paid' })
    expect(r[1]).toMatchObject({ paidAmount: 600, status: 'partial' })
  })
})

describe('reconcileInstallments (preserve paidAmount on edit)', () => {
  it('carries paidAmount by stable id even when order/number changes', () => {
    const prev = [
      { id: 'i1', paidAmount: 1000 },
      { id: 'i2', paidAmount: 250 },
    ]
    // Simulate a rebuild where i2 moved to position 1 and a new row was inserted.
    const next = [
      { id: 'i2', expectedAmount: 1000, installmentNumber: 1 },
      { id: null, expectedAmount: 500, installmentNumber: 2 }, // brand new row
      { id: 'i1', expectedAmount: 1000, installmentNumber: 3 },
    ]
    const r = reconcileInstallments(next, prev)
    expect(r[0]).toMatchObject({ id: 'i2', paidAmount: 250, status: 'partial' })
    expect(r[1]).toMatchObject({ id: null, paidAmount: 0, status: 'pending' })
    expect(r[2]).toMatchObject({ id: 'i1', paidAmount: 1000, status: 'paid' })
  })

  it('does NOT misassign paidAmount after deleting an intermediate cuota (regression for the positional-key bug)', () => {
    // Previously paid cuota #2 ($800). User deletes cuota #1, so the survivor
    // is renumbered to #1 but keeps id 'c2'. Matching by id keeps the money on it.
    const prev = [
      { id: 'c1', paidAmount: 0 },
      { id: 'c2', paidAmount: 800 },
      { id: 'c3', paidAmount: 0 },
    ]
    const next = [
      { id: 'c2', expectedAmount: 1000, installmentNumber: 1 },
      { id: 'c3', expectedAmount: 1000, installmentNumber: 2 },
    ]
    const r = reconcileInstallments(next, prev)
    expect(r.find((x) => x.id === 'c2')!.paidAmount).toBe(800)
    expect(r.find((x) => x.id === 'c3')!.paidAmount).toBe(0)
  })

  it('treats unknown ids as new rows', () => {
    const r = reconcileInstallments([{ id: 'ghost', expectedAmount: 100 }], [{ id: 'real', paidAmount: 50 }])
    expect(r[0]).toMatchObject({ paidAmount: 0, status: 'pending' })
  })
})
