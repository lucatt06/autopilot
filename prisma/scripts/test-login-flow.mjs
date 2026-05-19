/**
 * Verificación end-to-end de Fase 1A:
 *   1. Existe el workspace Trinova en BD
 *   2. Existe el Super Admin Lucas en BD vinculado a Trinova
 *   3. Existe Lucas en Supabase Auth y puede hacer login
 *   4. El JWT resultante apunta al mismo userId
 *   5. Con su sesión, puede leer su propio workspace (vía RLS)
 *   6. Con su sesión, puede leer el pipeline default
 *
 * USO: npm run test:fase-1a
 */
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const SUPER_ADMIN_EMAIL = 'lucatt06@gmail.com'
const SUPER_ADMIN_PASSWORD = '069456Lucas'

function requireEnv(name) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
const anonKey = requireEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')

const db = new PrismaClient({ log: ['error'] })

let passed = 0
let failed = 0
const log = (m) => console.log(`  ${m}`)
const ok = (m) => {
  passed++
  log(`✓ ${m}`)
}
const fail = (m) => {
  failed++
  log(`✗ ${m}`)
}

console.log('=== Test E2E de Fase 1A ===\n')

try {
  // ---- 1. Workspace Trinova existe ----
  console.log('[1] Workspace Trinova en BD')
  const trinova = await db.workspace.findUnique({ where: { slug: 'trinova' } })
  if (trinova) ok(`Existe (id=${trinova.id}, name=${trinova.name})`)
  else fail('Trinova NO encontrado')

  // ---- 2. Super Admin Lucas en BD ----
  console.log('\n[2] Super Admin Lucas en BD')
  const lucas = await db.user.findUnique({
    where: { email: SUPER_ADMIN_EMAIL },
    include: { workspace: true },
  })
  if (lucas) {
    ok(`Existe (id=${lucas.id})`)
    if (lucas.role === 'SUPER_ADMIN') ok('Role es SUPER_ADMIN')
    else fail(`Role incorrecto: ${lucas.role}`)
    if (lucas.workspaceId === trinova?.id) ok('Vinculado a Trinova')
    else fail(`workspaceId no coincide`)
    if (lucas.isActive) ok('Cuenta activa')
    else fail('Cuenta inactiva')
  } else {
    fail('Lucas NO encontrado en tabla User')
  }

  // ---- 3. Login con Supabase Auth ----
  console.log('\n[3] Login con Supabase Auth')
  const supabase = createClient(supabaseUrl, anonKey)
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: SUPER_ADMIN_EMAIL,
    password: SUPER_ADMIN_PASSWORD,
  })
  if (signInError) {
    fail(`signInWithPassword falló: ${signInError.message}`)
  } else {
    ok('signInWithPassword exitoso')
    if (signInData.session) ok('Recibió sesión con JWT')
    else fail('Sin sesión en respuesta')
    if (signInData.user?.id === lucas?.id) ok('auth user id coincide con User.id')
    else fail(`User IDs no coinciden: ${signInData.user?.id} vs ${lucas?.id}`)
  }

  // ---- 4. Lectura del workspace con RLS ----
  console.log('\n[4] Lectura via RLS')
  const { data: workspaces } = await supabase.from('Workspace').select('id, name, slug')
  if (workspaces?.length === 1 && workspaces[0].slug === 'trinova') {
    ok('Lee Workspace Trinova (1 resultado)')
  } else {
    fail(`Esperaba 1 workspace (Trinova), vio ${workspaces?.length ?? 0}`)
  }

  // ---- 5. Lectura del pipeline ----
  console.log('\n[5] Pipeline default visible')
  const { data: pipelines } = await supabase
    .from('Pipeline')
    .select('id, name, isDefault')
  if (pipelines && pipelines.length >= 1) {
    const defaultPipe = pipelines.find((p) => p.isDefault)
    if (defaultPipe) ok(`Pipeline default: ${defaultPipe.name}`)
    else fail('Sin pipeline default')
  } else {
    fail('Sin pipelines visibles')
  }

  // ---- 6. Lectura de stages ----
  console.log('\n[6] Stages del pipeline')
  const { data: stages } = await supabase.from('PipelineStage').select('name, position, isWon, isLost').order('position')
  if (stages?.length === 6) {
    ok(`6 etapas (${stages.map((s) => s.name).join(' → ')})`)
    const won = stages.find((s) => s.isWon)
    const lost = stages.find((s) => s.isLost)
    if (won?.name === 'Ganado') ok('Etapa isWon=true es "Ganado"')
    else fail(`isWon=true incorrecto: ${won?.name}`)
    if (lost?.name === 'Perdido') ok('Etapa isLost=true es "Perdido"')
    else fail(`isLost=true incorrecto: ${lost?.name}`)
  } else {
    fail(`Esperaba 6 etapas, vio ${stages?.length ?? 0}`)
  }

  // ---- 7. Tags base ----
  console.log('\n[7] Tags básicos')
  const { data: tags } = await supabase.from('Tag').select('name')
  if (tags?.length === 4) ok(`4 tags (${tags.map((t) => t.name).join(', ')})`)
  else fail(`Esperaba 4 tags, vio ${tags?.length ?? 0}`)

  // ---- 8. CommissionConfig ----
  console.log('\n[8] CommissionConfig')
  const { data: commConfigs } = await supabase.from('CommissionConfig').select('*')
  if (commConfigs?.length === 1) {
    const c = commConfigs[0]
    ok(`Configurado (Compañía ${c.internalCompany}% / Asesor ${c.internalAsesor}% / Agencia ${c.externalAgency}%)`)
  } else {
    fail(`Esperaba 1 commission config, vio ${commConfigs?.length ?? 0}`)
  }

  // ---- 9. Calendarios ----
  console.log('\n[9] Calendarios globales')
  const { data: calendars } = await supabase.from('Calendar').select('name, type')
  if (calendars?.length === 2) {
    ok(`2 calendarios (${calendars.map((c) => `${c.name}/${c.type}`).join(', ')})`)
  } else {
    fail(`Esperaba 2 calendarios, vio ${calendars?.length ?? 0}`)
  }
} catch (e) {
  console.error('ERROR INESPERADO:', e)
  failed++
} finally {
  await db.$disconnect()
  console.log('\n=============================================')
  console.log(`RESULTADO: ${passed} ✓ pasados, ${failed} ✗ fallados`)
  console.log('=============================================')
  process.exit(failed > 0 ? 1 : 0)
}
