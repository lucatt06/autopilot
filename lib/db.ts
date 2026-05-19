import { PrismaClient } from '@prisma/client'

/**
 * Prisma Client singleton.
 *
 * En desarrollo, Next.js hace hot-reload y puede instanciar múltiples clientes,
 * agotando las conexiones del pooler de Supabase. Usar globalThis evita esto.
 *
 * En producción, cada lambda/edge function obtiene su propia instancia limpia.
 *
 * IMPORTANTE: Este cliente bypassa RLS (usa service_role indirectamente via
 * DATABASE_URL). Toda Server Action que use este cliente DEBE validar
 * `workspaceId` antes de cualquier query. Ver .claude/rules/multi-tenant.md.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
