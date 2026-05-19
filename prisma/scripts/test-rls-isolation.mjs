/**
 * TEST CRÍTICO DE FASE 1A — Doc 4 §8.4 #1
 *
 * Verifica que RLS aísla correctamente datos entre workspaces:
 *   1. Crea 2 workspaces de prueba
 *   2. Crea 2 usuarios auth (uno por workspace) + sus rows en User
 *   3. Crea 2 contactos (uno por workspace)
 *   4. Login como user A → query Contact → debe ver solo SU contacto
 *   5. Login como user B → query Contact → debe ver solo SU contacto
 *   6. Cleanup
 *
 * Si user A ve 0 o 2 contactos → RLS roto.
 * Si user A ve 1 (el suyo) → RLS funciona.
 *
 * USO:
 *   node --env-file=.env.local prisma/scripts/test-rls-isolation.mjs
 */
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
  console.error('FALTA: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const db = new PrismaClient({ log: ['error'] })

const RUN_ID = `rls-test-${Date.now()}`
const PASSWORD = 'TestPassword123!'

let workspaceAId, workspaceBId
let userA, userB
let contactAId, contactBId
let testsPassed = 0
let testsFailed = 0

const log = (msg) => console.log(`  ${msg}`)
const assert = (cond, msg) => {
  if (cond) {
    testsPassed++
    log(`✓ ${msg}`)
  } else {
    testsFailed++
    log(`✗ FAIL: ${msg}`)
  }
}

try {
  // ---------- Setup ----------
  console.log('--- SETUP ---')

  const wsA = await db.workspace.create({
    data: { name: `${RUN_ID}-A`, slug: `${RUN_ID}-a` },
  })
  workspaceAId = wsA.id
  log(`Workspace A creado: ${workspaceAId}`)

  const wsB = await db.workspace.create({
    data: { name: `${RUN_ID}-B`, slug: `${RUN_ID}-b` },
  })
  workspaceBId = wsB.id
  log(`Workspace B creado: ${workspaceBId}`)

  // Crear auth users
  const { data: authA, error: errA } = await adminClient.auth.admin.createUser({
    email: `${RUN_ID}-a@test.local`,
    password: PASSWORD,
    email_confirm: true,
  })
  if (errA) throw errA
  userA = authA.user
  log(`Auth User A: ${userA.id} (${userA.email})`)

  const { data: authB, error: errB } = await adminClient.auth.admin.createUser({
    email: `${RUN_ID}-b@test.local`,
    password: PASSWORD,
    email_confirm: true,
  })
  if (errB) throw errB
  userB = authB.user
  log(`Auth User B: ${userB.id} (${userB.email})`)

  // Crear User rows vinculados
  await db.user.create({
    data: {
      id: userA.id,
      email: userA.email,
      firstName: 'Test',
      lastName: 'A',
      role: 'ADMIN',
      workspaceId: workspaceAId,
    },
  })
  await db.user.create({
    data: {
      id: userB.id,
      email: userB.email,
      firstName: 'Test',
      lastName: 'B',
      role: 'ADMIN',
      workspaceId: workspaceBId,
    },
  })
  log('User rows creados para ambos auth users')

  // Crear contacts
  const cA = await db.contact.create({
    data: {
      workspaceId: workspaceAId,
      firstName: 'Contact-A',
      lastName: RUN_ID,
      contactType: 'LEAD',
    },
  })
  contactAId = cA.id
  const cB = await db.contact.create({
    data: {
      workspaceId: workspaceBId,
      firstName: 'Contact-B',
      lastName: RUN_ID,
      contactType: 'LEAD',
    },
  })
  contactBId = cB.id
  log(`Contact A (en ws A): ${contactAId}`)
  log(`Contact B (en ws B): ${contactBId}`)

  // ---------- Test A: como User A ----------
  console.log('')
  console.log('--- TEST: User A intenta leer Contacts ---')

  const clientA = createClient(SUPABASE_URL, ANON_KEY)
  const { error: signInErrA } = await clientA.auth.signInWithPassword({
    email: userA.email,
    password: PASSWORD,
  })
  if (signInErrA) throw signInErrA

  const { data: contactsAsA, error: queryErrA } = await clientA
    .from('Contact')
    .select('id, firstName, workspaceId')
  if (queryErrA) {
    log(`Query error: ${queryErrA.message}`)
  }

  assert(contactsAsA?.length === 1, `User A ve exactamente 1 contacto (vio ${contactsAsA?.length})`)
  assert(
    contactsAsA?.[0]?.id === contactAId,
    `User A ve SU propio contacto (id=${contactsAsA?.[0]?.id})`
  )
  assert(
    !contactsAsA?.some((c) => c.id === contactBId),
    'User A NO ve el contacto del workspace B'
  )

  // ---------- Test B: como User B ----------
  console.log('')
  console.log('--- TEST: User B intenta leer Contacts ---')

  const clientB = createClient(SUPABASE_URL, ANON_KEY)
  const { error: signInErrB } = await clientB.auth.signInWithPassword({
    email: userB.email,
    password: PASSWORD,
  })
  if (signInErrB) throw signInErrB

  const { data: contactsAsB } = await clientB.from('Contact').select('id, firstName, workspaceId')

  assert(contactsAsB?.length === 1, `User B ve exactamente 1 contacto (vio ${contactsAsB?.length})`)
  assert(
    contactsAsB?.[0]?.id === contactBId,
    `User B ve SU propio contacto (id=${contactsAsB?.[0]?.id})`
  )
  assert(
    !contactsAsB?.some((c) => c.id === contactAId),
    'User B NO ve el contacto del workspace A'
  )

  // ---------- Test: usuario anónimo no ve nada ----------
  console.log('')
  console.log('--- TEST: Usuario anónimo (sin login) ---')

  const anonClient = createClient(SUPABASE_URL, ANON_KEY)
  const { data: contactsAnon } = await anonClient.from('Contact').select('id')

  assert(
    !contactsAnon || contactsAnon.length === 0,
    `Usuario anónimo NO ve ningún contacto (vio ${contactsAnon?.length ?? 0})`
  )

  // ---------- Test: User A intenta INSERTAR en workspace B ----------
  console.log('')
  console.log('--- TEST: User A intenta crear contacto en workspace B ---')

  const { error: insertErr } = await clientA
    .from('Contact')
    .insert({
      workspaceId: workspaceBId,
      firstName: 'Hack',
      lastName: 'Attempt',
      contactType: 'LEAD',
    })
  assert(insertErr !== null, `INSERT en ws ajeno es BLOQUEADO (error: ${insertErr?.message ?? 'NONE'})`)
} catch (e) {
  console.error('ERROR INESPERADO:', e.message)
  testsFailed++
} finally {
  // ---------- Cleanup ----------
  console.log('')
  console.log('--- CLEANUP ---')

  try {
    if (contactAId) await db.contact.delete({ where: { id: contactAId } })
    if (contactBId) await db.contact.delete({ where: { id: contactBId } })
    if (userA) {
      await db.user.delete({ where: { id: userA.id } }).catch(() => {})
      await adminClient.auth.admin.deleteUser(userA.id)
    }
    if (userB) {
      await db.user.delete({ where: { id: userB.id } }).catch(() => {})
      await adminClient.auth.admin.deleteUser(userB.id)
    }
    if (workspaceAId) await db.workspace.delete({ where: { id: workspaceAId } })
    if (workspaceBId) await db.workspace.delete({ where: { id: workspaceBId } })
    log('Datos de prueba eliminados')
  } catch (e) {
    log(`Cleanup parcial — revisar manualmente: ${e.message}`)
  }

  await db.$disconnect()

  console.log('')
  console.log('=============================================')
  console.log(`RESULTADO: ${testsPassed} ✓ pasados, ${testsFailed} ✗ fallados`)
  console.log('=============================================')
  process.exit(testsFailed > 0 ? 1 : 0)
}
