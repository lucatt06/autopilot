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
      { label: 'Conversaciones', href: '/crm/conversaciones', icon: 'MessageSquare' },
      { label: 'Calendarios', href: '/crm/calendarios', icon: 'Calendar' },
      { label: 'Tareas', href: '/crm/tareas', icon: 'CheckSquare' },
      { label: 'Contactos', href: '/crm/contactos', icon: 'ContactRound' },
      { label: 'Negocios', href: '/crm/negocios', icon: 'Target' },
      { label: 'Campañas', href: '/crm/campanas', icon: 'Megaphone' },
      { label: 'Red Inmobiliaria', href: '/crm/red', icon: 'Globe' },
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
      },
      {
        label: 'Automatizaciones',
        href: '/crm/automatizaciones',
        icon: 'Sparkles',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        label: 'Integraciones',
        href: '/configuracion/integraciones',
        icon: 'Plug',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
    ],
  },
]

// ----- Desarrollo Inmobiliario (Doc 1 §8.1) -----
export const REAL_ESTATE_NAV: NavSection[] = [
  {
    label: 'Principal',
    items: [
      { label: 'Dashboard', href: '/desarrollo', icon: 'LayoutDashboard' },
      { label: 'Proyectos', href: '/desarrollo/proyectos', icon: 'Folder' },
      { label: 'Edificios', href: '/desarrollo/edificios', icon: 'Building2' },
      { label: 'Unidades', href: '/desarrollo/unidades', icon: 'Home' },
      { label: 'Disponibilidad', href: '/desarrollo/disponibilidad', icon: 'MapPin' },
      { label: 'Planes de Pago', href: '/desarrollo/planes-pago', icon: 'CreditCard' },
      { label: 'Bloqueos', href: '/desarrollo/bloqueos', icon: 'KeyRound' },
      { label: 'Reservas', href: '/desarrollo/reservas', icon: 'ListChecks' },
      { label: 'Ventas', href: '/desarrollo/ventas', icon: 'Banknote' },
      { label: 'Cobros', href: '/desarrollo/cobros', icon: 'Wallet' },
      { label: 'Contratos', href: '/desarrollo/contratos', icon: 'FileSignature' },
      { label: 'Comisiones', href: '/desarrollo/comisiones', icon: 'Receipt' },
      { label: 'Clientes', href: '/desarrollo/clientes', icon: 'Users' },
      { label: 'Agencias', href: '/desarrollo/agencias', icon: 'Network' },
      {
        label: 'Staff',
        href: '/desarrollo/staff',
        icon: 'UserCog',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        label: 'Mis Métricas',
        href: '/desarrollo/mis-metricas',
        icon: 'Target',
        roles: ['ASESOR'],
      },
      { label: 'Reportes', href: '/desarrollo/reportes', icon: 'FileText' },
    ],
  },
  {
    label: 'Manejo de Obra',
    items: [
      { label: 'Órdenes de Trabajo', href: '/desarrollo/obra/ordenes', icon: 'Wrench' },
      { label: 'Presupuesto de Obra', href: '/desarrollo/obra/presupuesto', icon: 'ClipboardList' },
      { label: 'Cronograma de Obra', href: '/desarrollo/obra/cronograma', icon: 'Calendar' },
      { label: 'Avance de Obra', href: '/desarrollo/obra/avance', icon: 'HardHat' },
      { label: 'Inspecciones', href: '/desarrollo/obra/inspecciones', icon: 'ShieldCheck' },
      { label: 'Subcontratistas', href: '/desarrollo/obra/subcontratistas', icon: 'Users' },
      { label: 'Proveedores', href: '/desarrollo/obra/proveedores', icon: 'Truck' },
      { label: 'Inbox Proveedores', href: '/desarrollo/obra/inbox', icon: 'Inbox' },
      { label: 'Pagos a Proveedores', href: '/desarrollo/obra/pagos', icon: 'Banknote' },
      { label: 'Supervisión de Áreas', href: '/desarrollo/obra/areas', icon: 'MapPin' },
      { label: 'Actas de Entrega', href: '/desarrollo/obra/actas', icon: 'FileSignature' },
      { label: 'Garantías', href: '/desarrollo/obra/garantias', icon: 'ShieldCheck' },
      { label: 'Punch List', href: '/desarrollo/obra/punch-list', icon: 'ListTodo' },
    ],
  },
]

// ----- Agentes IA (Doc 1 §7.9) -----
export const AI_AGENTS_NAV: NavSection[] = [
  {
    items: [
      { label: 'Inbox', href: '/agentes-ia/inbox', icon: 'Inbox' },
      { label: 'Call Center', href: '/agentes-ia/call-center', icon: 'PhoneCall' },
      { label: 'Knowledge', href: '/agentes-ia/knowledge', icon: 'Brain' },
      { label: 'Agentes', href: '/agentes-ia/agentes', icon: 'Bot' },
      { label: 'Enrutamiento', href: '/agentes-ia/enrutamiento', icon: 'Route' },
      { label: 'Numbers + Pools', href: '/agentes-ia/numbers', icon: 'PhoneCall' },
      { label: 'Widgets', href: '/agentes-ia/widgets', icon: 'LayoutGrid' },
    ],
  },
]

// ----- Configuración: admin (Doc 1 §7.13) -----
export const CONFIG_NAV_ADMIN: NavSection[] = [
  {
    items: [
      { label: 'Empresa', href: '/configuracion/empresa', icon: 'Building2' },
      { label: 'Usuarios y Equipos', href: '/configuracion/usuarios', icon: 'Users' },
      { label: 'Roles y Permisos', href: '/configuracion/roles', icon: 'ShieldCheck' },
      { label: 'Calendarios', href: '/configuracion/calendarios', icon: 'Calendar' },
      { label: 'Pipelines', href: '/configuracion/pipelines', icon: 'Target' },
      { label: 'Campos Personalizados', href: '/configuracion/campos', icon: 'Tags' },
      { label: 'Tags', href: '/configuracion/tags', icon: 'Tag' },
      { label: 'Integraciones', href: '/configuracion/integraciones', icon: 'Plug' },
      { label: 'API y Webhooks', href: '/configuracion/api', icon: 'Plug' },
      { label: 'Audit Logs', href: '/configuracion/auditoria', icon: 'ScrollText' },
      { label: 'Personalización', href: '/configuracion/personalizacion', icon: 'Palette' },
      { label: 'Onboarding', href: '/configuracion/onboarding', icon: 'ListChecks' },
    ],
  },
  {
    label: 'Mi cuenta',
    items: [
      { label: 'Mi perfil', href: '/configuracion/perfil', icon: 'UserCog' },
      { label: 'Mis notificaciones', href: '/configuracion/notificaciones', icon: 'Bell' },
    ],
  },
]

// ----- Configuración: asesor (limitado) -----
export const CONFIG_NAV_ASESOR: NavSection[] = [
  {
    items: [
      { label: 'Mi perfil', href: '/configuracion/perfil', icon: 'UserCog' },
      { label: 'Mis calendarios', href: '/configuracion/calendarios', icon: 'Calendar' },
      { label: 'Mis integraciones', href: '/configuracion/integraciones-personales', icon: 'Plug' },
      { label: 'Mis notificaciones', href: '/configuracion/notificaciones', icon: 'Bell' },
      { label: 'Mi número Twilio', href: '/configuracion/twilio', icon: 'PhoneCall' },
      { label: 'Mi WhatsApp', href: '/configuracion/whatsapp', icon: 'MessageSquare' },
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
      { label: 'Dashboard Global', href: '/agencia', icon: 'LayoutDashboard' },
      { label: 'Empresas', href: '/agencia/empresas', icon: 'Building2' },
      { label: 'Módulos', href: '/agencia/modulos', icon: 'Package' },
      { label: 'Analytics', href: '/agencia/analytics', icon: 'Headphones' },
      { label: 'Personalización', href: '/agencia/personalizacion', icon: 'Palette' },
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
