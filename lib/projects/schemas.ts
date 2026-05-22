import { z } from 'zod'

export const PROJECT_TYPES = ['RESIDENCIAL', 'COMERCIAL', 'MIXTO'] as const
export const PROJECT_STATUSES = [
  'EN_PLANOS',
  'EN_CONSTRUCCION',
  'ENTREGADO',
  'SUSPENDIDO',
] as const

const optionalString = z
  .string()
  .trim()
  .optional()
  .or(z.literal('').transform(() => undefined))

const optionalDate = z
  .string()
  .trim()
  .refine((v) => !v || !Number.isNaN(Date.parse(v)), 'Fecha inválida')
  .optional()
  .or(z.literal('').transform(() => undefined))

const optionalUrl = z
  .string()
  .trim()
  .url('URL inválida')
  .optional()
  .or(z.literal('').transform(() => undefined))

export const projectStageSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'Nombre requerido').max(80),
  expectedDeliveryDate: optionalDate,
  order: z.coerce.number().int().default(0),
})
export type ProjectStageInput = z.infer<typeof projectStageSchema>

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Nombre requerido').max(120),
  type: z.enum(PROJECT_TYPES).default('RESIDENCIAL'),
  location: optionalString,
  address: optionalString,
  province: optionalString,
  city: optionalString,
  sector: optionalString,
  amenities: z.array(z.string().trim().min(1)).default([]),
  status: z.enum(PROJECT_STATUSES).default('EN_PLANOS'),
  startDate: optionalDate,
  expectedDeliveryDate: optionalDate,
  progressPercent: z.coerce.number().int().min(0).max(100).default(0),
  /** URL of the main image / render */
  coverImage: optionalUrl,
  hasStages: z.boolean().default(false),
  stages: z.array(projectStageSchema).default([]),
  stdReservationAmount: z.coerce.number().min(0).optional(),
  stdInitialPercent: z.coerce.number().min(0).max(100).optional(),
  stdConstructionPercent: z.coerce.number().min(0).max(100).optional(),
  stdFinalPercent: z.coerce.number().min(0).max(100).optional(),
})

/**
 * Catálogo común de amenidades para los proyectos. El usuario puede agregar
 * texto libre adicional (multi-select free-form).
 */
export const AMENITIES_CATALOG = [
  'Administración de alquileres',
  'Aire acondicionado central',
  'Ascensor',
  'Áreas verdes',
  'Balcón',
  'Cancha de Padel',
  'Cancha de Tenis',
  'Casa Club',
  'Centro comercial',
  'Cisterna',
  'Co-working',
  'Domótica',
  'Estacionamiento',
  'Generador eléctrico',
  'Gimnasio',
  'Helipuerto',
  'Jacuzzi',
  'Kids Club',
  'Lobby',
  'Marina',
  'Pet friendly',
  'Piscina',
  'Playa privada',
  'Restaurante',
  'Seguridad 24/7',
  'Sky lounge',
  'Spa',
  'Vista al Mar',
] as const

export type CreateProjectInput = z.infer<typeof createProjectSchema>

export const updateProjectSchema = createProjectSchema.partial()
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>

export const projectFiltersSchema = z.object({
  search: optionalString,
  status: z.enum(PROJECT_STATUSES).optional(),
  type: z.enum(PROJECT_TYPES).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(500).default(100),
})

export type ProjectFilters = z.infer<typeof projectFiltersSchema>

export const STATUS_LABELS: Record<(typeof PROJECT_STATUSES)[number], string> = {
  EN_PLANOS: 'En planos',
  EN_CONSTRUCCION: 'En construcción',
  ENTREGADO: 'Entregado',
  SUSPENDIDO: 'Suspendido',
}

export const TYPE_LABELS: Record<(typeof PROJECT_TYPES)[number], string> = {
  RESIDENCIAL: 'Residencial',
  COMERCIAL: 'Comercial',
  MIXTO: 'Mixto',
}

/** Tailwind class for status badge background (Doc 4 §4.3). */
export const STATUS_BADGE: Record<(typeof PROJECT_STATUSES)[number], string> = {
  EN_PLANOS: 'bg-blue-100 text-blue-700 border-blue-200',
  EN_CONSTRUCCION: 'bg-amber-100 text-amber-700 border-amber-200',
  ENTREGADO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  SUSPENDIDO: 'bg-gray-100 text-gray-700 border-gray-200',
}
