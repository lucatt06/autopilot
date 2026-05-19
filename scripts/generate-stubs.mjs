/**
 * One-shot script: generate stub pages for every nav item in lib/navigation.ts.
 * Skips pages that already exist.
 *
 * Usage: node scripts/generate-stubs.mjs
 */
import { mkdir, writeFile, access } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const ROOT = process.cwd()

// Mirror of navigation structure with route → { title, phase }
// (Kept minimal to avoid pulling navigation.ts which depends on lucide-react)
const STUBS = [
  // ----- CRM (Doc 1 §7) -----
  { route: '/crm', title: 'Dashboard del CRM', phase: '1B' },
  { route: '/crm/conversaciones', title: 'Conversaciones', phase: '1C' },
  { route: '/crm/calendarios', title: 'Calendarios', phase: '1B' },
  { route: '/crm/tareas', title: 'Tareas', phase: '1B' },
  { route: '/crm/contactos', title: 'Contactos', phase: '1B' },
  { route: '/crm/negocios', title: 'Negocios', phase: '1B' },
  { route: '/crm/campanas', title: 'Campañas', phase: '1C' },
  { route: '/crm/red', title: 'Red Inmobiliaria', phase: '1D' },
  { route: '/crm/automatizaciones', title: 'Automatizaciones', phase: '1F' },

  // ----- Desarrollo Inmobiliario (Doc 1 §8) -----
  { route: '/desarrollo', title: 'Dashboard de Desarrollo Inmobiliario', phase: '1G' },
  { route: '/desarrollo/proyectos', title: 'Proyectos', phase: '1G' },
  { route: '/desarrollo/edificios', title: 'Edificios', phase: '1G' },
  { route: '/desarrollo/unidades', title: 'Unidades', phase: '1G' },
  { route: '/desarrollo/disponibilidad', title: 'Disponibilidad', phase: '1G' },
  { route: '/desarrollo/planes-pago', title: 'Planes de Pago', phase: '1G' },
  { route: '/desarrollo/bloqueos', title: 'Bloqueos', phase: '1G' },
  { route: '/desarrollo/reservas', title: 'Reservas', phase: '1G' },
  { route: '/desarrollo/ventas', title: 'Ventas', phase: '1G' },
  { route: '/desarrollo/cobros', title: 'Cobros', phase: '1G' },
  { route: '/desarrollo/contratos', title: 'Contratos', phase: '1G' },
  { route: '/desarrollo/comisiones', title: 'Comisiones', phase: '1G' },
  { route: '/desarrollo/clientes', title: 'Clientes', phase: '1G' },
  { route: '/desarrollo/agencias', title: 'Agencias', phase: '1G' },
  { route: '/desarrollo/staff', title: 'Staff', phase: '1G' },
  { route: '/desarrollo/mis-metricas', title: 'Mis Métricas', phase: '1G' },
  { route: '/desarrollo/reportes', title: 'Reportes', phase: '1G' },

  // Manejo de Obra (Doc 1 §8.19)
  { route: '/desarrollo/obra/ordenes', title: 'Órdenes de Trabajo', phase: '1H' },
  { route: '/desarrollo/obra/presupuesto', title: 'Presupuesto de Obra', phase: '1H' },
  { route: '/desarrollo/obra/cronograma', title: 'Cronograma de Obra', phase: '1H' },
  { route: '/desarrollo/obra/avance', title: 'Avance de Obra', phase: '1H' },
  { route: '/desarrollo/obra/inspecciones', title: 'Inspecciones', phase: '1H' },
  { route: '/desarrollo/obra/subcontratistas', title: 'Subcontratistas', phase: '1H' },
  { route: '/desarrollo/obra/proveedores', title: 'Proveedores', phase: '1H' },
  { route: '/desarrollo/obra/inbox', title: 'Inbox Proveedores', phase: '1H' },
  { route: '/desarrollo/obra/pagos', title: 'Pagos a Proveedores', phase: '1H' },
  { route: '/desarrollo/obra/areas', title: 'Supervisión de Áreas', phase: '1H' },
  { route: '/desarrollo/obra/actas', title: 'Actas de Entrega', phase: '1H' },
  { route: '/desarrollo/obra/garantias', title: 'Garantías', phase: '1H' },
  { route: '/desarrollo/obra/punch-list', title: 'Punch List', phase: '1H' },

  // ----- Agentes IA (Doc 1 §7.9) -----
  { route: '/agentes-ia', title: 'Agentes IA', phase: '1E' },
  { route: '/agentes-ia/inbox', title: 'Inbox de Agentes IA', phase: '1E' },
  { route: '/agentes-ia/call-center', title: 'Call Center', phase: '1E' },
  { route: '/agentes-ia/knowledge', title: 'Knowledge Base', phase: '1E' },
  { route: '/agentes-ia/agentes', title: 'Agentes', phase: '1E' },
  { route: '/agentes-ia/enrutamiento', title: 'Enrutamiento', phase: '1E' },
  { route: '/agentes-ia/numbers', title: 'Numbers + Pools', phase: '1E' },
  { route: '/agentes-ia/widgets', title: 'Widgets', phase: '1E' },

  // ----- Configuración (Doc 1 §7.13) -----
  { route: '/configuracion', title: 'Configuración', phase: '1A' },
  { route: '/configuracion/empresa', title: 'Configuración de la empresa', phase: '1A' },
  { route: '/configuracion/usuarios', title: 'Usuarios y equipos', phase: '1A' },
  { route: '/configuracion/roles', title: 'Roles y permisos', phase: '1A' },
  { route: '/configuracion/calendarios', title: 'Calendarios', phase: '1B' },
  { route: '/configuracion/pipelines', title: 'Pipelines', phase: '1B' },
  { route: '/configuracion/campos', title: 'Campos personalizados', phase: '1B' },
  { route: '/configuracion/tags', title: 'Tags', phase: '1B' },
  { route: '/configuracion/integraciones', title: 'Integraciones', phase: '1D' },
  { route: '/configuracion/integraciones-personales', title: 'Mis integraciones', phase: '1D' },
  { route: '/configuracion/api', title: 'API y Webhooks', phase: '1F' },
  { route: '/configuracion/auditoria', title: 'Audit Logs', phase: '1A' },
  { route: '/configuracion/personalizacion', title: 'Personalización', phase: '1I' },
  { route: '/configuracion/onboarding', title: 'Onboarding', phase: '1A' },
  { route: '/configuracion/perfil', title: 'Mi perfil', phase: '1A' },
  { route: '/configuracion/notificaciones', title: 'Mis notificaciones', phase: '1C' },
  { route: '/configuracion/twilio', title: 'Mi número Twilio', phase: '1D' },
  { route: '/configuracion/whatsapp', title: 'Mi WhatsApp', phase: '1D' },

  // ----- Panel de Agencia (Doc 1 §10) -----
  { route: '/agencia', title: 'Panel de Agencia', phase: '1I' },
  { route: '/agencia/empresas', title: 'Empresas', phase: '1I' },
  { route: '/agencia/modulos', title: 'Módulos', phase: '1I' },
  { route: '/agencia/analytics', title: 'Analytics globales', phase: '1I' },
  { route: '/agencia/personalizacion', title: 'Personalización global', phase: '1I' },
]

function template({ title, phase }) {
  return `import { StubPage } from '@/components/stub-page'

export const metadata = { title: '${title} · Autopilot' }

export default function Page() {
  return <StubPage title="${title}" phase="${phase}" />
}
`
}

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

let created = 0
let skipped = 0

for (const stub of STUBS) {
  const filePath = join(ROOT, 'app', '(dashboard)', stub.route, 'page.tsx')
  await mkdir(dirname(filePath), { recursive: true })

  if (await exists(filePath)) {
    skipped++
    continue
  }

  await writeFile(filePath, template(stub), 'utf8')
  created++
}

console.log(`Generados: ${created}`)
console.log(`Existentes (omitidos): ${skipped}`)
console.log(`Total: ${STUBS.length}`)
