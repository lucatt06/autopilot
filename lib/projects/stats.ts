import 'server-only'

import { db } from '@/lib/db'

export interface ProjectStats {
  // Square meters
  squareMetersMin: number
  squareMetersMax: number
  squareMetersTotal: number
  squareMetersAvailable: number
  squareMetersReserved: number
  squareMetersBlocked: number
  squareMetersSold: number
  // Prices
  priceMin: number
  priceMax: number
  // Counts (for sanity)
  totalUnits: number
}

const EMPTY: ProjectStats = {
  squareMetersMin: 0,
  squareMetersMax: 0,
  squareMetersTotal: 0,
  squareMetersAvailable: 0,
  squareMetersReserved: 0,
  squareMetersBlocked: 0,
  squareMetersSold: 0,
  priceMin: 0,
  priceMax: 0,
  totalUnits: 0,
}

/**
 * Aggregate stats derived from the project's units.
 * Used by the Project detail page (Doc 1 §8.2 — "Precio desde / hasta",
 * "Metro Cuadrado" section).
 */
export async function getProjectStats(
  projectId: string,
  workspaceId: string
): Promise<ProjectStats> {
  const units = await db.unit.findMany({
    where: { projectId, workspaceId },
    select: { squareMeters: true, currentPrice: true, status: true },
  })
  if (units.length === 0) return EMPTY

  let smMin = Infinity
  let smMax = -Infinity
  let smTotal = 0
  let smAvail = 0
  let smRes = 0
  let smBlk = 0
  let smSold = 0
  let pMin = Infinity
  let pMax = -Infinity

  for (const u of units) {
    smMin = Math.min(smMin, u.squareMeters)
    smMax = Math.max(smMax, u.squareMeters)
    smTotal += u.squareMeters
    pMin = Math.min(pMin, u.currentPrice)
    pMax = Math.max(pMax, u.currentPrice)
    switch (u.status) {
      case 'DISPONIBLE':
        smAvail += u.squareMeters
        break
      case 'RESERVADA':
        smRes += u.squareMeters
        break
      case 'BLOQUEADA':
        smBlk += u.squareMeters
        break
      case 'VENDIDA':
      case 'ENTREGADA':
        smSold += u.squareMeters
        break
    }
  }

  return {
    squareMetersMin: smMin,
    squareMetersMax: smMax,
    squareMetersTotal: Math.round(smTotal * 100) / 100,
    squareMetersAvailable: Math.round(smAvail * 100) / 100,
    squareMetersReserved: Math.round(smRes * 100) / 100,
    squareMetersBlocked: Math.round(smBlk * 100) / 100,
    squareMetersSold: Math.round(smSold * 100) / 100,
    priceMin: pMin,
    priceMax: pMax,
    totalUnits: units.length,
  }
}
