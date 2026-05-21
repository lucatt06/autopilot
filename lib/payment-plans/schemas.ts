import { z } from 'zod'

// ─── Status ───────────────────────────────────────────────────────────────────

export const PLAN_STATUSES = ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const
export type PlanStatusKey = (typeof PLAN_STATUSES)[number]

export const PLAN_STATUS_LABELS: Record<PlanStatusKey, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activo',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
}

export const PLAN_STATUS_BADGE: Record<PlanStatusKey, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 border-gray-300',
  ACTIVE: 'bg-blue-50 text-blue-700 border-blue-300',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  CANCELLED: 'bg-gray-100 text-gray-500 border-gray-300',
}

// ─── Currency ───────────────────────────────────────────────────────────────────

export const CURRENCIES = ['USD', 'DOP', 'EUR'] as const
export type CurrencyKey = (typeof CURRENCIES)[number]

export const CURRENCY_LABELS: Record<CurrencyKey, string> = {
  USD: 'USD',
  DOP: 'DOP (RD$)',
  EUR: 'EUR',
}

// ─── Installments ───────────────────────────────────────────────────────────────

export const INSTALLMENT_TYPES = ['RESERVATION', 'INITIAL', 'CONSTRUCTION', 'FINAL'] as const

export const installmentInputSchema = z.object({
  type: z.enum(INSTALLMENT_TYPES),
  installmentNumber: z.number().int().min(1),
  label: z.string().max(120).optional(),
  expectedAmount: z.number().min(0),
  dueDate: z.string().min(1), // yyyy-MM-dd
  locked: z.boolean().default(false),
})
export type InstallmentInput = z.infer<typeof installmentInputSchema>

// ─── Plan ─────────────────────────────────────────────────────────────────────

const PERCENT_TOLERANCE = 0.5

export const createPaymentPlanSchema = z
  .object({
    name: z.string().min(1, 'Ingresa un nombre').max(160),
    projectId: z.string().optional(),
    customerId: z.string().optional(),
    saleId: z.string().optional(),
    currency: z.enum(CURRENCIES).default('USD'),
    status: z.enum(PLAN_STATUSES).default('DRAFT'),
    deliveryDate: z.string().optional(),
    notes: z.string().max(2000).optional(),
    totalPrice: z.number().positive('El precio debe ser mayor a 0'),
    reservationAmount: z.number().min(0).default(0),
    initialPercent: z.number().min(0).max(100),
    constructionPercent: z.number().min(0).max(100),
    finalPercent: z.number().min(0).max(100),
    constructionInstallmentsCount: z.number().int().min(0).max(600).default(12),
    constructionPeriodicityMonths: z.number().int().min(1).max(36).default(1),
    constructionMode: z.enum(['automatic', 'manual']).default('automatic'),
    installments: z.array(installmentInputSchema).max(1000),
  })
  .refine(
    (v) => Math.abs(v.initialPercent + v.constructionPercent + v.finalPercent - 100) <= PERCENT_TOLERANCE,
    { message: 'Los porcentajes (Inicial + Construcción + Final) deben sumar 100%', path: ['initialPercent'] },
  )
  .refine((v) => v.reservationAmount <= (v.totalPrice * v.initialPercent) / 100 + 0.01, {
    message: 'La reservación no puede ser mayor que el monto del pago inicial',
    path: ['reservationAmount'],
  })
export type CreatePaymentPlanInput = z.infer<typeof createPaymentPlanSchema>

export const updatePaymentPlanSchema = createPaymentPlanSchema
export type UpdatePaymentPlanInput = z.infer<typeof updatePaymentPlanSchema>

// ─── List filters ───────────────────────────────────────────────────────────────

export const planFiltersSchema = z.object({
  search: z.string().optional(),
  projectId: z.string().optional(),
  status: z.enum(PLAN_STATUSES).optional(),
  projects: z.string().optional(), // global selector (comma-separated)
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(100),
})
export type PlanFilters = z.infer<typeof planFiltersSchema>
