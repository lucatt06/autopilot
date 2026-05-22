'use server'

import { revalidatePath } from 'next/cache'

import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { audit } from '@/lib/audit'
import {
  POSVENTA_FUNNEL_KEY,
  isPosventaStage,
  STAGE_TO_UNIT_STATUS,
  COARSE_STAGES,
} from '@/lib/funnels/posventa'

export type ActionResult = { ok: true } | { ok: false; error: string }

/**
 * Manually place a unit in a Posventa stage (drag-and-drop).
 * Bidirectional sync: this also updates the unit's status to match the stage.
 *  - Coarse stages (Bloqueada / Reservada / Entrega) are fully determined by the
 *    status, so any manual override is cleared.
 *  - VENDIDA sub-stages (Firmar Contrato … Cuotas en Atraso) set status=VENDIDA
 *    and store an override so the precise sub-stage sticks.
 */
export async function setPosventaStage(unitId: string, stage: string): Promise<ActionResult> {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN', 'ASESOR')
  if (!user.workspaceId) return { ok: false, error: 'Sin workspace activo' }
  if (!isPosventaStage(stage)) return { ok: false, error: 'Etapa inválida' }
  const workspaceId = user.workspaceId

  const unit = await db.unit.findFirst({ where: { id: unitId, workspaceId }, select: { id: true } })
  if (!unit) return { ok: false, error: 'Unidad no encontrada' }

  const nextStatus = STAGE_TO_UNIT_STATUS[stage]
  const isCoarse = COARSE_STAGES.has(stage)

  await db.$transaction(async (tx) => {
    // Bidirectional: update the unit status to match the stage.
    await tx.unit.update({ where: { id: unitId }, data: { status: nextStatus } })

    if (isCoarse) {
      // Status alone determines the stage → drop any manual override.
      await tx.funnelStageOverride.deleteMany({
        where: { workspaceId, funnelKey: POSVENTA_FUNNEL_KEY, unitId },
      })
    } else {
      // VENDIDA sub-stage → remember it via an override.
      const existing = await tx.funnelStageOverride.findUnique({
        where: { funnelKey_unitId: { funnelKey: POSVENTA_FUNNEL_KEY, unitId } },
        select: { id: true },
      })
      if (existing) {
        await tx.funnelStageOverride.update({ where: { id: existing.id }, data: { stage } })
      } else {
        await tx.funnelStageOverride.create({
          data: { workspaceId, funnelKey: POSVENTA_FUNNEL_KEY, unitId, stage, createdById: user.id },
        })
      }
    }
  })

  await audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: 'update',
    entityType: 'Unit',
    entityId: unitId,
    changes: { funnel: POSVENTA_FUNNEL_KEY, stage, status: nextStatus },
  })

  revalidatePath('/desarrollo/embudos')
  revalidatePath('/desarrollo/unidades')
  revalidatePath('/desarrollo/disponibilidad')
  return { ok: true }
}

/**
 * Remove the manual override so the unit returns to its data-derived stage.
 */
export async function resetPosventaStage(unitId: string): Promise<ActionResult> {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN', 'ASESOR')
  if (!user.workspaceId) return { ok: false, error: 'Sin workspace activo' }

  await db.funnelStageOverride.deleteMany({
    where: { workspaceId: user.workspaceId, funnelKey: POSVENTA_FUNNEL_KEY, unitId },
  })

  revalidatePath('/desarrollo/embudos')
  return { ok: true }
}
