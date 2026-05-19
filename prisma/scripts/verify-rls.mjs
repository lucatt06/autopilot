/**
 * Verifica el estado de RLS: tablas con RLS habilitado y conteo de policies.
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient({ log: ['error'] })

const rlsEnabled = await db.$queryRaw`
  SELECT count(*)::int AS count FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = true
`

const totalTables = await db.$queryRaw`
  SELECT count(*)::int AS count FROM pg_tables WHERE schemaname = 'public'
`

const policies = await db.$queryRaw`
  SELECT count(*)::int AS count FROM pg_policies WHERE schemaname = 'public'
`

const tablesWithoutRls = await db.$queryRaw`
  SELECT tablename FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = false
  ORDER BY tablename
`

const helpers = await db.$queryRaw`
  SELECT proname FROM pg_proc
  WHERE pronamespace = 'public'::regnamespace
    AND proname IN ('current_user_workspace_id', 'is_super_admin')
  ORDER BY proname
`

console.log(`Tablas totales:    ${totalTables[0].count}`)
console.log(`Con RLS activo:    ${rlsEnabled[0].count}`)
console.log(`Sin RLS:           ${totalTables[0].count - rlsEnabled[0].count}`)
console.log(`Policies totales:  ${policies[0].count}`)
console.log(`Helpers SQL:       ${helpers.map((h) => h.proname).join(', ') || 'NINGUNO'}`)

if (tablesWithoutRls.length > 0) {
  console.log('')
  console.log('Tablas sin RLS (esperado: junction tables y child tables sin workspaceId directo):')
  tablesWithoutRls.forEach((t) => console.log(`  - ${t.tablename}`))
}

await db.$disconnect()
