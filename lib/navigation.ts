import type { IconName } from '@/components/icons'
import type { Permission } from '@/lib/permissions'
import type { UserRole } from '@prisma/client'

// =====================================================================
// MÓDULOS DE LA PANTALLA PRINCIPAL (Doc 1 §6)
// =====================================================================

export type ModuleKey =
  | 'crm'
  | 'real_estate'
  | 'ai_agents'
  | 'configuration'
  | 'agency_panel'

export type ModuleDef = {
  key: ModuleKey
  label: string
  description: string
  href: string
  icon: IconName
  /** Solid background for the icon tile on the home cards */
  color: string
  /** Roles allowed to even see the card */
  visibleToRoles: UserRole[]
  /** If set, the workspace must have the key in enabledModules */
  requiredEnabledModule?: string
}

export const MODULES: ModuleDef[] = [
  {
    key: 'crm',
    label: 'CRM',
    description: 'Clientes, ventas y comunicación',
    href: '/crm',
    icon: 'ContactRound',
    color: 'bg-blue-500',
    visibleToRoles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR'],
    requiredEnabledModule: 'crm',
  },
  {
    key: 'real_estate',
    label: 'Desarrollo Inmobiliario',
    description: 'Proyectos, unidades y cobros',
    href: '/desarrollo',
    icon: 'Building2',
    color: 'bg-yellow-500',
    visibleToRoles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR'],
    requiredEnabledModule: 'real_estate',
  },
  {
    key: 'ai_agents',
    label: 'Agentes IA',
    description: 'Configuración de agentes',
    href: '/agentes-ia',
    icon: 'Bot',
    color: 'bg-purple-500',
    visibleToRoles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    key: 'configuration',
    label: 'Configuración',
    description: 'Ajustes de la plataforma',
    href: '/configuracion',
    icon: 'Settings',
    color: 'bg-slate-500',
    visibleToRoles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR'],
  },
  {
    key: 'agency_panel',
    label: 'Panel de Agencia',
    description: 'Gestión multi-empresa',
    href: '/agencia',
    icon: 'Briefcase',
    color: 'bg-rose-500',
    visibleToRoles: ['SUPER_ADMIN'],
  },
]

export function getVisibleModules(
  role: UserRole,
  enabledModules: string[] = []
): ModuleDef[] {
  return MODULES.filter((m) => {
    if (!m.visibleToRoles.includes(role)) return false
    if (m.requiredEnabledModule) {
      if (role === 'SUPER_ADMIN') return true
      return enabledModules.includes(m.requiredEnabledModule)
    }
    return true
  })
}

// =====================================================================
// SIDEBAR NAV ITEMS
// =====================================================================

export type NavItem = {
  label: string
  href: string
  icon: IconName
  /** Permission required to see this item */
  permission?: Permission
  /** Restrict to specific roles (alternative to permission) */
  roles?: UserRole[]
  /** Show only when user has any of these phases enabled — UI only */
  badge?: string
}

export type NavSection = {
  label?: string
  items: NavItem[]
}

// ----- CRM (Doc 1 §7) -----
export const CRM_NAV: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', href: '/crm', icon: 'LayoutDashboard' },
      { label: 'Conversaciones', href: '/crm/conversaciones', icon: 'MessageSquare', badge: '1C' },
      { label: 'Calendarios', href: '/crm/calendarios', icon: 'Calendar', badge: '1B' },
      { label: 'Tareas', href: '/crm/tareas', icon: 'CheckSquare', badge: '1B' },
      { label: 'Contactos', href: '/crm/contactos', icon: 'ContactRound', badge: '1B' },
      { label: 'Negocios', href: '/crm/negocios', icon: 'Target', badge: '1B' },
      { label: 'Campañas', href: '/crm/campanas', icon: 'Megaphone', badge: '1C' },
      { label: 'Red Inmobiliaria', href: '/crm/red', icon: 'Globe', badge: '1D' },
    ],
  },
  {
    label: 'Admin',
    items: [
      {
        label: 'Agentes de IA',
        href: '/agentes-ia',
        icon: 'Bot',
        roles: ['SUPER_ADMIN', 'ADMIN'],
        badge: '1E',
      },
      {
        label: 'Automatizaciones',
        href: '/crm/automatizaciones',
        icon: 'Sparkles',
        roles: ['SUPER_ADMIN', 'ADMIN'],
        badge: '1F',
      },
      {
        label: 'Integraciones',
        href: '/configuracion/integraciones',
        icon: 'Plug',
        roles: ['SUPER_ADMIN', 'ADMIN'],
        badge: '1D',
      },
    ],
  },
]

// ----- Desarrollo Inmobiliario (Doc 1 §8.1) -----
export const REAL_ESTATE_NAV: NavSection[] = [
  {
    label: 'Principal',
    items: [
      { label: 'Proyectos', href: '/desarrollo/proyectos', icon: 'Folder', badge: '1G' },
      { label: 'Dashboard', href: '/desarrollo', icon: 'LayoutDashboard', badge: '1G' },
      { label: 'Edificios', href: '/desarrollo/edificios', icon: 'Building2', badge: '1G' },
      { label: 'Unidades', href: '/desarrollo/unidades', icon: 'Home', badge: '1G' },
      { label: 'Disponibilidad', href: '/desarrollo/disponibilidad', icon: 'MapPin', badge: '1G' },
      { label: 'Planes de Pago', href: '/desarrollo/planes-pago', icon: 'CreditCard', badge: '1G' },
      { label: 'Bloqueos', href: '/desarrollo/bloqueos', icon: 'KeyRound', badge: '1G' },
      { label: 'Reservas', href: '/desarrollo/reservas', icon: 'ListChecks', badge: '1G' },
      { label: 'Ventas', href: '/desarrollo/ventas', icon: 'Banknote', badge: '1G' },
      { label: 'Cobros', href: '/desarrollo/cobros', icon: 'Wallet', badge: '1G' },
      { label: 'Contratos', href: '/desarrollo/contratos', icon: 'FileSignature', badge: '1G' },
      { label: 'Comisiones', href: '/desarrollo/comisiones', icon: 'Receipt', badge: '1G' },
      { label: 'Clientes', href: '/desarrollo/clientes', icon: 'Users', badge: '1G' },
      { label: 'Agencias', href: '/desarrollo/agencias', icon: 'Network', badge: '1G' },
      {
        label: 'Staff',
        href: '/desarrollo/staff',
        icon: 'UserCog',
        roles: ['SUPER_ADMIN', 'ADMIN'],
        badge: '1G',
      },
      {
        label: 'Mis Métricas',
        href: '/desarrollo/mis-metricas',
        icon: 'Target',
        roles: ['ASESOR'],
        badge: '1G',
      },
      { label: 'Reportes', href: '/desarrollo/reportes', icon: 'FileText', badge: '1G' },
    ],
  },
  {
    label: 'Manejo de Obra',
    items: [
      { label: 'Órdenes de Trabajo', href: '/desarrollo/obra/ordenes', icon: 'Wrench', badge: '1H' },
      { label: 'Presupuesto de Obra', href: '/desarrollo/obra/presupuesto', icon: 'ClipboardList', badge: '1H' },
      { label: 'Cronograma de Obra', href: '/desarrollo/obra/cronograma', icon: 'Calendar', badge: '1H' },
      { label: 'Avance de Obra', href: '/desarrollo/obra/avance', icon: 'HardHat', badge: '1H' },
      { label: 'Inspecciones', href: '/desarrollo/obra/inspecciones', icon: 'ShieldCheck', badge: '1H' },
      { label: 'Subcontratistas', href: '/desarrollo/obra/subcontratistas', icon: 'Users', badge: '1H' },
      { label: 'Proveedores', href: '/desarrollo/obra/proveedores', icon: 'Truck', badge: '1H' },
      { label: 'Inbox Proveedores', href: '/desarrollo/obra/inbox', icon: 'Inbox', badge: '1H' },
      { label: 'Pagos a Proveedores', href: '/desarrollo/obra/pagos', icon: 'Banknote', badge: '1H' },
      { label: 'Supervisión de Áreas', href: '/desarrollo/obra/areas', icon: 'MapPin', badge: '1H' },
      { label: 'Actas de Entrega', href: '/desarrollo/obra/actas', icon: 'FileSignature', badge: '1H' },
      { label: 'Garantías', href: '/desarrollo/obra/garantias', icon: 'ShieldCheck', badge: '1H' },
      { label: 'Punch List', href: '/desarrollo/obra/punch-list', icon: 'ListTodo', badge: '1H' },
    ],
  },
]

// ----- Agentes IA (Doc 1 §7.9) -----
export const AI_AGENTS_NAV: NavSection[] = [
  {
    items: [
      { label: 'Inbox', href: '/agentes-ia/inbox', icon: 'Inbox', badge: '1E' },
      { label: 'Call Center', href: '/agentes-ia/call-center', icon: 'PhoneCall', badge: '1E' },
      { label: 'Knowledge', href: '/agentes-ia/knowledge', icon: 'Brain', badge: '1E' },
      { label: 'Agentes', href: '/agentes-ia/agentes', icon: 'Bot', badge: '1E' },
      { label: 'Enrutamiento', href: '/agentes-ia/enrutamiento', icon: 'Route', badge: '1E' },
      { label: 'Numbers + Pools', href: '/agentes-ia/numbers', icon: 'PhoneCall', badge: '1E' },
      { label: 'Widgets', href: '/agentes-ia/widgets', icon: 'LayoutGrid', badge: '1E' },
    ],
  },
]

// ----- Configuración: admin (Doc 1 §7.13) -----
export const CONFIG_NAV_ADMIN: NavSection[] = [
  {
    items: [
      { label: 'Empresa', href: '/configuracion/empresa', icon: 'Building2', badge: '1A' },
      { label: 'Usuarios y Equipos', href: '/configuracion/usuarios', icon: 'Users', badge: '1A' },
      { label: 'Roles y Permisos', href: '/configuracion/roles', icon: 'ShieldCheck', badge: '1A' },
      { label: 'Calendarios', href: '/configuracion/calendarios', icon: 'Calendar', badge: '1B' },
      { label: 'Pipelines', href: '/configuracion/pipelines', icon: 'Target', badge: '1B' },
      { label: 'Campos Personalizados', href: '/configuracion/campos', icon: 'Tags', badge: '1B' },
      { label: 'Tags', href: '/configuracion/tags', icon: 'Tag', badge: '1B' },
      { label: 'Integraciones', href: '/configuracion/integraciones', icon: 'Plug', badge: '1D' },
      { label: 'API y Webhooks', href: '/configuracion/api', icon: 'Plug', badge: '1F' },
      { label: 'Audit Logs', href: '/configuracion/auditoria', icon: 'ScrollText', badge: '1A' },
      { label: 'Personalización', href: '/configuracion/personalizacion', icon: 'Palette', badge: '1I' },
      { label: 'Onboarding', href: '/configuracion/onboarding', icon: 'ListChecks', badge: '1A' },
    ],
  },
  {
    label: 'Mi cuenta',
    items: [
      { label: 'Mi perfil', href: '/configuracion/perfil', icon: 'UserCog', badge: '1A' },
      { label: 'Mis notificaciones', href: '/configuracion/notificaciones', icon: 'Bell', badge: '1C' },
    ],
  },
]

// ----- Configuración: asesor (limitado) -----
export const CONFIG_NAV_ASESOR: NavSection[] = [
  {
    items: [
      { label: 'Mi perfil', href: '/configuracion/perfil', icon: 'UserCog', badge: '1A' },
      { label: 'Mis calendarios', href: '/configuracion/calendarios', icon: 'Calendar', badge: '1D' },
      { label: 'Mis integraciones', href: '/configuracion/integraciones-personales', icon: 'Plug', badge: '1D' },
      { label: 'Mis notificaciones', href: '/configuracion/notificaciones', icon: 'Bell', badge: '1C' },
      { label: 'Mi número Twilio', href: '/configuracion/twilio', icon: 'PhoneCall', badge: '1D' },
      { label: 'Mi WhatsApp', href: '/configuracion/whatsapp', icon: 'MessageSquare', badge: '1D' },
    ],
  },
]

export function getConfigNav(role: UserRole): NavSection[] {
  if (role === 'ASESOR' || role === 'CLIENTE') return CONFIG_NAV_ASESOR
  return CONFIG_NAV_ADMIN
}

// ----- Panel de Agencia (Doc 1 §10) -----
export const AGENCY_NAV: NavSection[] = [
  {
    items: [
      { label: 'Dashboard Global', href: '/agencia', icon: 'LayoutDashboard', badge: '1I' },
      { label: 'Empresas', href: '/agencia/empresas', icon: 'Building2', badge: '1I' },
      { label: 'Módulos', href: '/agencia/modulos', icon: 'Package', badge: '1I' },
      { label: 'Analytics', href: '/agencia/analytics', icon: 'Headphones', badge: '1I' },
      { label: 'Personalización', href: '/agencia/personalizacion', icon: 'Palette', badge: '1I' },
    ],
  },
]

// =====================================================================
// FILTER UTILITIES
// =====================================================================

export function filterNavByRole(sections: NavSection[], role: UserRole): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.roles || item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0)
}
