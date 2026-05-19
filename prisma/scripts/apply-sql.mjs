/**
 * Aplica un archivo SQL al BD usando conexión raw de Prisma Client.
 *
 * USO:
 *   node --env-file=.env prisma/scripts/apply-sql.mjs <ruta-al-sql>
 *
 * Ejemplo:
 *   node --env-file=.env prisma/scripts/apply-sql.mjs prisma/migrations/0001_init.sql
 *
 * Por qué este script existe:
 *   `prisma migrate dev` cuelga indefinidamente contra el pooler de Supabase
 *   (incompatibilidad con shadow database). Este script bypassa el CLI de Prisma
 *   y aplica el SQL directamente vía Prisma Client (que sí funciona).
 *
 * Workflow para nuevas migraciones:
 *   1. Editar prisma/schema.prisma
 *   2. Generar SQL del delta:
 *        npx prisma migrate diff \
 *          --from-url $DATABASE_URL \
 *          --to-schema-datamodel prisma/schema.prisma \
 *          --script > prisma/migrations/000N_descripcion.sql
 *   3. Revisar el SQL generado
 *   4. Aplicar con este script
 *   5. Regenerar el client: npx prisma generate
 */
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const sqlPath = process.argv[2]
if (!sqlPath) {
  console.error('Uso: node --env-file=.env prisma/scripts/apply-sql.mjs <ruta-al-sql>')
  process.exit(1)
}

const sql = readFileSync(resolve(sqlPath), 'utf8')

const statements = sql
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.match(/^(--.*\n?)+$/))

console.log(`Archivo: ${sqlPath}`)
console.log(`Statements a aplicar: ${statements.length}`)
console.log('')

const db = new PrismaClient({ log: ['error'] })

let ok = 0
let fail = 0
const start = Date.now()

for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i]
  const firstLine = stmt.split('\n').find((l) => !l.startsWith('--') && l.trim()) || ''
  const label = firstLine.substring(0, 80).replace(/\s+/g, ' ')

  try {
    await db.$executeRawUnsafe(stmt)
    ok++
    if (i % 20 === 0 || i === statements.length - 1) {
      console.log(`  [${i + 1}/${statements.length}] OK — ${label}`)
    }
  } catch (e) {
    fail++
    console.error(`  [${i + 1}/${statements.length}] FAIL — ${label}`)
    console.error(`    Error: ${e.message.split('\n')[0]}`)
  }
}

await db.$disconnect()

console.log('')
console.log(`Completado en ${((Date.now() - start) / 1000).toFixed(1)}s`)
console.log(`  ✓ OK:   ${ok}`)
console.log(`  ✗ FAIL: ${fail}`)
process.exit(fail > 0 ? 1 : 0)
