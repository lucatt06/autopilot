import { z } from 'zod'

/**
 * Zod schemas for Contact mutations and filtering.
 * Single source of truth: every Server Action validates against these.
 */

const cleanString = (s: string) => s.trim()

const optionalEmail = z
  .string()
  .trim()
  .email('Email inválido')
  .optional()
  .or(z.literal('').transform(() => undefined))

const optionalPhone = z
  .string()
  .trim()
  .min(5, 'Teléfono muy corto')
  .max(40)
  .optional()
  .or(z.literal('').transform(() => undefined))

const optionalString = z
  .string()
  .trim()
  .optional()
  .or(z.literal('').transform(() => undefined))

// ---------- Enums mirror Prisma ----------

export const CONTACT_TYPES = [
  'LEAD',
  'PROSPECTO',
  'CLIENTE',
  'AGENTE_INMOBILIARIO',
  'REFERIDO',
  'OTRO',
] as const

export const TEMPERATURES = [
  'MUY_CALIENTE',
  'CALIENTE',
  'TIBIO',
  'FRIO',
  'SIN_CLASIFICAR',
] as const

export const HARD_OWNERS = ['COMPANIA', 'ASESOR'] as const

export const BUY_PURPOSES = ['VIVIR', 'INVERTIR', 'AMBOS', 'NO_DEFINIDO'] as const

export const PAYMENT_PREFERENCES = [
  'CONTADO',
  'FINANCIAMIENTO_BANCARIO',
  'PLAN_DESARROLLADOR',
  'NO_DEFINIDO',
] as const

export const RESIDENCIES = [
  'RESIDENTE_LOCAL',
  'DOMINICANO_EXTERIOR',
  'EXTRANJERO',
  'NO_ESPECIFICADO',
] as const

// ---------- Create / Update ----------

export const createContactSchema = z.object({
  // Personal
  firstName: z.string().trim().min(1, 'Nombre requerido').max(100),
  lastName: z.string().trim().min(1, 'Apellido requerido').max(100),
  email: optionalEmail,
  mobilePhone: optionalPhone,
  phone: optionalPhone,
  country: optionalString,
  city: optionalString,
  language: z.string().default('es'),
  gender: optionalString,

  // Professional
  company: optionalString,
  position: optionalString,
  website: optionalString,

  // Lead classification
  contactType: z.enum(CONTACT_TYPES).default('LEAD'),
  source: optionalString,
  hardOwner: z.enum(HARD_OWNERS).optional(),
  temperature: z.enum(TEMPERATURES).default('SIN_CLASIFICAR'),
  requiredAction: optionalString,

  // Real estate interest
  buyPurpose: z.enum(BUY_PURPOSES).optional(),
  unitTypes: z.array(z.string()).default([]),
  budgetMin: z.coerce.number().positive().optional(),
  budgetMax: z.coerce.number().positive().optional(),
  estimatedBuyTime: optionalString,
  paymentPreference: z.enum(PAYMENT_PREFERENCES).optional(),
  residency: z.enum(RESIDENCIES).optional(),

  // DND
  dndAll: z.coerce.boolean().default(false),
  dndCalls: z.coerce.boolean().default(false),
  dndSms: z.coerce.boolean().default(false),
  dndEmail: z.coerce.boolean().default(false),
  dndIncoming: z.coerce.boolean().default(false),

  // Ownership (caller may override; defaults to current user)
  ownerId: z.string().optional(),
})

export type CreateContactInput = z.infer<typeof createContactSchema>

export const updateContactSchema = createContactSchema.partial()
export type UpdateContactInput = z.infer<typeof updateContactSchema>

// ---------- Filters / list params ----------

const dateOptional = z
  .string()
  .trim()
  .refine((v) => !v || !Number.isNaN(Date.parse(v)), 'Fecha inválida')
  .optional()
  .or(z.literal('').transform(() => undefined))

export const SORT_FIELDS = [
  'lastActivityAt',
  'createdAt',
  'firstName',
  'iaScore',
] as const

export const SORT_DIRS = ['asc', 'desc'] as const

export const contactFiltersSchema = z.object({
  search: optionalString,
  contactType: z.enum(CONTACT_TYPES).optional(),
  temperature: z.enum(TEMPERATURES).optional(),
  ownerId: optionalString, // "Asesores"
  tagId: optionalString, // "Etiquetas"
  source: optionalString, // "Fuente"
  createdFrom: dateOptional, // "Fecha" — desde
  createdTo: dateOptional, // "Fecha" — hasta
  sortBy: z.enum(SORT_FIELDS).default('lastActivityAt'),
  sortDir: z.enum(SORT_DIRS).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(500).default(100),
})

export type ContactFilters = z.infer<typeof contactFiltersSchema>

/**
 * Sources catalog (Doc 1 §7.5).
 * Free text in DB, but these are the canonical options shown in filters.
 */
export const SOURCES = [
  'Facebook',
  'Instagram',
  'TikTok',
  'Google',
  'Referido',
  'Página web',
  'WhatsApp directo',
  'LinkedIn',
  'Evento',
  'Otro',
] as const
