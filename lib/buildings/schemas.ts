import { z } from 'zod'

export const BUILDING_STATUSES = [
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

export const createBuildingSchema = z.object({
  projectId: z.string().min(1, 'Selecciona el proyecto'),
  name: z.string().trim().min(1, 'Nombre requerido').max(120),
  numberOfFloors: z.coerce.number().int().positive().max(200),
  unitsPerFloor: z.coerce.number().int().positive().max(50).default(4),
  description: optionalString,
  image: optionalUrl,
  status: z.enum(BUILDING_STATUSES).default('EN_CONSTRUCCION'),
  expectedDeliveryDate: optionalDate,
})

export type CreateBuildingInput = z.infer<typeof createBuildingSchema>

export const updateBuildingSchema = createBuildingSchema.partial()
export type UpdateBuildingInput = z.infer<typeof updateBuildingSchema>

export const buildingFiltersSchema = z.object({
  search: optionalString,
  projectId: optionalString,
  status: z.enum(BUILDING_STATUSES).optional(),
  /** Comma-separated project ids coming from the global selector. */
  projects: optionalString,
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(500).default(100),
})

export type BuildingFilters = z.infer<typeof buildingFiltersSchema>

export const STATUS_LABELS: Record<(typeof BUILDING_STATUSES)[number], string> = {
  EN_PLANOS: 'En planos',
  EN_CONSTRUCCION: 'En construcción',
  ENTREGADO: 'Entregado',
  SUSPENDIDO: 'Suspendido',
}

export const STATUS_BADGE: Record<(typeof BUILDING_STATUSES)[number], string> = {
  EN_PLANOS: 'bg-blue-100 text-blue-700 border-blue-200',
  EN_CONSTRUCCION: 'bg-amber-100 text-amber-700 border-amber-200',
  ENTREGADO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  SUSPENDIDO: 'bg-gray-100 text-gray-700 border-gray-200',
}
