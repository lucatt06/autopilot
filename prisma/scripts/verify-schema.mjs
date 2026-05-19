/**
 * Verifica que las tablas estén creadas en Supabase.
 * Cuenta tablas + enums + foreign keys + índices.
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient({ log: ['error'] })

const tables = await db.$queryRaw`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ORDER BY table_name
`

const enums = await db.$queryRaw`
  SELECT typname FROM pg_type
  WHERE typcategory = 'E' AND typnamespace = 'public'::regnamespace
  ORDER BY typname
`

const fks = await db.$queryRaw`
  SELECT count(*)::int AS count FROM information_schema.table_constraints
  WHERE constraint_schema = 'public' AND constraint_type = 'FOREIGN KEY'
`

const indexes = await db.$queryRaw`
  SELECT count(*)::int AS count FROM pg_indexes WHERE schemaname = 'public'
`

console.log(`Tablas: ${tables.length}`)
console.log(`Enums:  ${enums.length}`)
console.log(`FKs:    ${fks[0].count}`)
console.log(`Index:  ${indexes[0].count}`)
console.log('')
console.log('Tablas creadas:')
tables.forEach((t, i) => {
  process.stdout.write(`  ${t.table_name.padEnd(28)}`)
  if ((i + 1) % 3 === 0) process.stdout.write('\n')
})
console.log('')

await db.$disconnect()
