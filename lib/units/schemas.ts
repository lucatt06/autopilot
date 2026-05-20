import { z } from 'zod'

export const UNIT_STATUSES = ['DISPONIBLE', 'BLOQUEADA', 'RESERVADA', 'VENDIDA', 'ENTREGADA'] as const
export type UnitStatusKey = (typeof UNIT_STATUSES)[number]

export const STATUS_LABELS: Record<UnitStatusKey, string> = {
  DISPONIBLE: 'Disponible',
  BLOQUEADA: 'Bloqueada',
  RESERVADA: 'Reservada',
  VENDIDA: 'Vendida',
  ENTREGADA: 'Entregada',
}

export const STATUS_BADGE: Record<UnitStatusKey, string> = {
  DISPONIBLE: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  BLOQUEADA: 'bg-amber-50 text-amber-700 border-amber-300',
  RESERVADA: 'bg-blue-50 text-blue-700 border-blue-300',
  VENDIDA: 'bg-rose-50 text-rose-700 border-rose-300',
  ENTREGADA: 'bg-purple-50 text-purple-700 border-purple-300',
}

export const UNIT_VIEWS = ['MAR', 'PISCINA', 'JARDIN', 'CIUDAD', 'INTERIOR'] as const
export type UnitViewKey = (typeof UNIT_VIEWS)[number]
export const VIEW_LABELS: Record<UnitViewKey, string> = {
  MAR: 'Mar',
  PISCINA: 'Piscina',
  JARDIN: 'Jardín',
  CIUDAD: 'Ciudad',
  INTERIOR: 'Interior',
}

export const UNIT_TYPES = ['Estudio', '1 Hab', '2 Hab', '3 Hab', '4 Hab', 'PH', 'Local Comercial', 'Oficina'] as const

export const unitFiltersSchema = z.object({
  search: z.string().optional(),
  projectId: z.string().optional(),
  buildingId: z.string().optional(),
  type: z.string().optional(),
  status: z.enum(UNIT_STATUSES).optional(),
  floor: z.coerce.number().int().optional(),
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(100),
  projects: z.string().optional(),
})
export type UnitFilters = z.infer<typeof unitFiltersSchema>

export const createUnitSchema = z.object({
  projectId: z.string().min(1),
  buildingId: z.string().min(1),
  unitNumber: z.string().min(1).max(20),
  floor: z.number().int().min(0),
  type: z.string().min(1).max(50),
  bedrooms: z.number().int().min(0).default(0),
  bathrooms: z.number().min(0).default(0),
  squareMeters: z.number().positive(),
  terraceSquareMeters: z.number().min(0).optional(),
  basePrice: z.number().positive(),
  currentPrice: z.number().positive(),
  view: z.enum(UNIT_VIEWS).optional(),
  orientation: z.string().max(10).optional(),
  status: z.enum(UNIT_STATUSES).default('DISPONIBLE'),
  internalNotes: z.string().optional(),
  floorPlan: z.string().url().optional().or(z.literal('')),
})
export type CreateUnitInput = z.infer<typeof createUnitSchema>

export const updateUnitSchema = createUnitSchema.partial().omit({ projectId: true, buildingId: true })
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>

export const generateUnitsSchema = z.object({
  buildingId: z.string().min(1),
  floorStart: z.number().int().min(1),
  floorEnd: z.number().int().min(1),
  unitsPerFloor: z.number().int().min(1).max(50),
  type: z.string().min(1),
  bedrooms: z.number().int().min(0).default(0),
  bathrooms: z.number().min(0).default(0),
  squareMeters: z.number().positive(),
  basePrice: z.number().positive(),
  numberingStyle: z.enum(['floor_letter', 'floor_number', 'sequential']).default('floor_number'),
})
export type GenerateUnitsInput = z.infer<typeof generateUnitsSchema>
