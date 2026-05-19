/**
 * Seed inicial — Fase 1A, Bloque F.
 *
 * Crea los datos mínimos para arrancar:
 *   - Workspace "Trinova"
 *   - Super Admin Lucas (Supabase Auth + User row)
 *   - Pipeline default con 6 etapas
 *   - 2 calendarios globales (Virtual + Presencial)
 *   - CommissionConfig default (porcentajes Doc 1 §8.13)
 *   - 4 tags básicos
 *
 * Idempotente — correrlo múltiples veces es seguro.
 *
 * USO:  npm run db:seed
 */
import { PrismaClient } from '@prisma/client'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPER_ADMIN_EMAIL = 'lucatt06@gmail.com'
const SUPER_ADMIN_PASSWORD = '069456Lucas'
const SUPER_ADMIN_FIRSTNAME = 'Lucas'
const SUPER_ADMIN_LASTNAME = 'Torres'

const TRINOVA = {
  name: 'Trinova',
  slug: 'trinova',
  timezone: 'America/Santo_Domingo',
  currency: 'USD',
  language: 'es',
  primaryColor: '#2563EB',
  enabledModules: ['crm', 'real_estate'],
}

const db = new PrismaClient({ log: ['warn', 'error'] })

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

async function findAuthUserByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<{ id: string } | null> {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 })
    if (error) throw error
    const found = data.users.find((u) => u.email === email)
    if (found) return { id: found.id }
    if (data.users.length < 100) break
  }
  return null
}

async function ensureSuperAdminAuth(supabase: SupabaseClient): Promise<string> {
  const existing = await findAuthUserByEmail(supabase, SUPER_ADMIN_EMAIL)
  if (existing) {
    // Reset password to the canonical one in case it drifted in dev.
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: SUPER_ADMIN_PASSWORD,
      email_confirm: true,
    })
    if (error) throw error
    console.log(`  auth user encontrado (id=${existing.id})`)
    return existing.id
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: SUPER_ADMIN_EMAIL,
    password: SUPER_ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: {
      firstName: SUPER_ADMIN_FIRSTNAME,
      lastName: SUPER_ADMIN_LASTNAME,
    },
  })
  if (error || !data.user) throw error ?? new Error('No user returned')
  console.log(`  auth user creado (id=${data.user.id})`)
  return data.user.id
}

async function main() {
  console.log('=== Seed Fase 1A — Bloque F ===\n')

  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

  const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ---- 1. Workspace Trinova ----
  console.log('[1] Workspace Trinova')
  const trinova = await db.workspace.upsert({
    where: { slug: TRINOVA.slug },
    update: {
      name: TRINOVA.name,
      timezone: TRINOVA.timezone,
      currency: TRINOVA.currency,
      language: TRINOVA.language,
      primaryColor: TRINOVA.primaryColor,
      enabledModules: TRINOVA.enabledModules,
    },
    create: TRINOVA,
  })
  console.log(`  ✓ ${trinova.name} (id=${trinova.id})`)

  // ---- 2. Super Admin Lucas (Auth + User row) ----
  console.log('\n[2] Super Admin Lucas')
  const authUserId = await ensureSuperAdminAuth(adminSupabase)

  const lucas = await db.user.upsert({
    where: { id: authUserId },
    update: {
      email: SUPER_ADMIN_EMAIL,
      firstName: SUPER_ADMIN_FIRSTNAME,
      lastName: SUPER_ADMIN_LASTNAME,
      role: 'SUPER_ADMIN',
      workspaceId: trinova.id,
      isActive: true,
      onboardingCompleted: true,
    },
    create: {
      id: authUserId,
      email: SUPER_ADMIN_EMAIL,
      firstName: SUPER_ADMIN_FIRSTNAME,
      lastName: SUPER_ADMIN_LASTNAME,
      role: 'SUPER_ADMIN',
      workspaceId: trinova.id,
      isActive: true,
      onboardingCompleted: true,
      timezone: 'America/Santo_Domingo',
      language: 'es',
    },
  })
  console.log(`  ✓ User Lucas (role=${lucas.role}, ws=${trinova.slug})`)

  // ---- 3. Pipeline default ----
  console.log('\n[3] Pipeline default + stages')
  const pipeline = await db.pipeline.upsert({
    where: { id: `pipeline-default-${trinova.id}` },
    update: {},
    create: {
      id: `pipeline-default-${trinova.id}`,
      workspaceId: trinova.id,
      name: 'Pipeline principal',
      isDefault: true,
    },
  })

  const stages = [
    { name: 'Nuevo lead', position: 0, color: '#3B82F6', isWon: false, isLost: false },
    { name: 'Contactado', position: 1, color: '#8B5CF6', isWon: false, isLost: false },
    { name: 'Cita programada', position: 2, color: '#F59E0B', isWon: false, isLost: false },
    { name: 'Negociación', position: 3, color: '#F97316', isWon: false, isLost: false },
    { name: 'Ganado', position: 4, color: '#10B981', isWon: true, isLost: false },
    { name: 'Perdido', position: 5, color: '#6B7280', isWon: false, isLost: true },
  ]

  for (const s of stages) {
    await db.pipelineStage.upsert({
      where: { id: `stage-${pipeline.id}-${s.position}` },
      update: { name: s.name, color: s.color, isWon: s.isWon, isLost: s.isLost },
      create: {
        id: `stage-${pipeline.id}-${s.position}`,
        pipelineId: pipeline.id,
        ...s,
      },
    })
  }
  console.log(`  ✓ ${pipeline.name} (${stages.length} etapas)`)

  // ---- 4. Calendarios globales ----
  console.log('\n[4] Calendarios globales')
  await db.calendar.upsert({
    where: { id: `calendar-virtual-${trinova.id}` },
    update: {},
    create: {
      id: `calendar-virtual-${trinova.id}`,
      workspaceId: trinova.id,
      name: 'Citas Virtuales',
      type: 'VIRTUAL',
      isSystemDefault: true,
      generateMeetLink: true,
      requireLocation: false,
      distribution: 'round_robin',
    },
  })
  await db.calendar.upsert({
    where: { id: `calendar-presencial-${trinova.id}` },
    update: {},
    create: {
      id: `calendar-presencial-${trinova.id}`,
      workspaceId: trinova.id,
      name: 'Citas Presenciales',
      type: 'PRESENCIAL',
      isSystemDefault: true,
      generateMeetLink: false,
      requireLocation: true,
      distribution: 'round_robin',
    },
  })
  console.log('  ✓ Virtuales + Presenciales')

  // ---- 5. CommissionConfig default ----
  console.log('\n[5] Configuración de comisiones')
  await db.commissionConfig.upsert({
    where: { id: `commission-config-${trinova.id}` },
    update: {},
    create: {
      id: `commission-config-${trinova.id}`,
      workspaceId: trinova.id,
      internalCompany: 1.0, // % cuando Hard Owner = Compañía y venta interna
      internalAsesor: 3.0, // % cuando Hard Owner = Asesor y venta interna
      externalAgency: 5.0, // % cuando viene de Agencia externa
      externalAgencyAsesor: 2.5, // % cuando Agencia + Hard Owner = Asesor
    },
  })
  console.log('  ✓ Compañía 1% / Asesor 3% / Agencia 5% / Agencia+Asesor 2.5%')

  // ---- 6. Tags básicos ----
  console.log('\n[6] Tags básicos')
  const tags = [
    { name: 'Caliente', color: '#EF4444' },
    { name: 'Tibio', color: '#F59E0B' },
    { name: 'Frío', color: '#94A3B8' },
    { name: 'VIP', color: '#8B5CF6' },
  ]
  for (const t of tags) {
    await db.tag.upsert({
      where: { workspaceId_name: { workspaceId: trinova.id, name: t.name } },
      update: { color: t.color },
      create: { workspaceId: trinova.id, ...t },
    })
  }
  console.log(`  ✓ ${tags.length} tags creados`)

  console.log('\n=== Seed completado ===')
  console.log(`Workspace:  ${trinova.name} (${trinova.slug})`)
  console.log(`Super Admin: ${SUPER_ADMIN_EMAIL}`)
  console.log(`Login URL:  http://localhost:3000/login`)
}

main()
  .catch((e) => {
    console.error('Seed falló:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
