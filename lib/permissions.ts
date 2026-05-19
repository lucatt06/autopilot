import type { UserRole } from '@prisma/client'

/**
 * Permission matrix from Doc 1 §4.
 *
 * Action format: `<domain>:<verb>[:<scope>]`
 *   - `:all`  → action applies across the workspace (e.g. all contacts)
 *   - `:own`  → action restricted to the user's own resources (e.g. their leads)
 *   - no scope → action has no scope distinction (e.g. delete)
 *
 * When `view:all` is missing but `view:own` is granted, the caller must add
 * an explicit filter (e.g. `where: { ownerId: user.id }`) in code.
 */
export type Permission =
  // ----- CRM: contacts -----
  | 'contacts:view:all'
  | 'contacts:view:own'
  | 'contacts:create'
  | 'contacts:update:all'
  | 'contacts:update:own'
  | 'contacts:delete'
  | 'contacts:move-stage'

  // ----- CRM: conversations -----
  | 'conversations:view:all'
  | 'conversations:view:own'

  // ----- CRM: pipelines -----
  | 'pipelines:manage'

  // ----- CRM: campaigns -----
  | 'campaigns:view:all'
  | 'campaigns:view:own'
  | 'campaigns:create'

  // ----- CRM: ai-agents -----
  | 'ai-agents:manage'
  | 'automations:manage'

  // ----- CRM: reports -----
  | 'reports:view:all'
  | 'reports:view:own'

  // ----- CRM: admin -----
  | 'users:impersonate'
  | 'workspace:configure'

  // ----- Real Estate: projects -----
  | 'projects:view:all'
  | 'projects:manage'

  // ----- Real Estate: units -----
  | 'units:view:all'
  | 'units:view:own'
  | 'units:manage'

  // ----- Real Estate: blocks -----
  | 'blocks:create'
  | 'blocks:delete'

  // ----- Real Estate: reservations -----
  | 'reservations:create'
  | 'reservations:approve'

  // ----- Real Estate: sales -----
  | 'sales:create'
  | 'sales:approve'

  // ----- Real Estate: payments / commissions -----
  | 'payments:view:all'
  | 'payments:view:own'
  | 'payments:register'
  | 'commissions:approve'
  | 'commissions:view:all'
  | 'commissions:view:own'

  // ----- Real Estate: contracts -----
  | 'contracts:view:all'
  | 'contracts:view:own'
  | 'contracts:create'

  // ----- Real Estate: agencies / staff -----
  | 'agencies:manage'
  | 'staff:manage'

  // ----- Real Estate: construction -----
  | 'work-orders:manage'
  | 'construction-progress:view:all'
  | 'construction-progress:view:own'

  // ----- Real Estate: reports -----
  | 'real-estate-reports:view:all'
  | 'real-estate-reports:view:own'

  // ----- Configuration -----
  | 'config:workspace'
  | 'config:users'
  | 'config:roles'
  | 'config:integrations'
  | 'config:profile'
  | 'config:integrations-personal'

// Doc 1 §4 — matriz exacta
const PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    // Super Admin has every permission. We list them explicitly for clarity
    // (so adding a new permission doesn't silently leave Super Admin without it).
    'contacts:view:all',
    'contacts:view:own',
    'contacts:create',
    'contacts:update:all',
    'contacts:update:own',
    'contacts:delete',
    'contacts:move-stage',
    'conversations:view:all',
    'conversations:view:own',
    'pipelines:manage',
    'campaigns:view:all',
    'campaigns:view:own',
    'campaigns:create',
    'ai-agents:manage',
    'automations:manage',
    'reports:view:all',
    'reports:view:own',
    'users:impersonate',
    'workspace:configure',
    'projects:view:all',
    'projects:manage',
    'units:view:all',
    'units:view:own',
    'units:manage',
    'blocks:create',
    'blocks:delete',
    'reservations:create',
    'reservations:approve',
    'sales:create',
    'sales:approve',
    'payments:view:all',
    'payments:view:own',
    'payments:register',
    'commissions:approve',
    'commissions:view:all',
    'commissions:view:own',
    'contracts:view:all',
    'contracts:view:own',
    'contracts:create',
    'agencies:manage',
    'staff:manage',
    'work-orders:manage',
    'construction-progress:view:all',
    'construction-progress:view:own',
    'real-estate-reports:view:all',
    'real-estate-reports:view:own',
    'config:workspace',
    'config:users',
    'config:roles',
    'config:integrations',
    'config:profile',
    'config:integrations-personal',
  ],

  ADMIN: [
    // CRM
    'contacts:view:all',
    'contacts:view:own',
    'contacts:create',
    'contacts:update:all',
    'contacts:update:own',
    'contacts:delete',
    'contacts:move-stage',
    'conversations:view:all',
    'conversations:view:own',
    'pipelines:manage',
    'campaigns:view:all',
    'campaigns:view:own',
    'campaigns:create',
    'ai-agents:manage',
    'automations:manage',
    'reports:view:all',
    'reports:view:own',
    'users:impersonate',
    'workspace:configure',
    // Real Estate
    'projects:view:all',
    'projects:manage',
    'units:view:all',
    'units:manage',
    'blocks:create',
    'blocks:delete',
    'reservations:create',
    'reservations:approve',
    'sales:create',
    'sales:approve',
    'payments:view:all',
    'payments:register',
    'commissions:approve',
    'commissions:view:all',
    'contracts:view:all',
    'contracts:create',
    'agencies:manage',
    'staff:manage',
    'work-orders:manage',
    'construction-progress:view:all',
    'real-estate-reports:view:all',
    // Configuration
    'config:workspace',
    'config:users',
    'config:roles',
    'config:integrations',
    'config:profile',
    'config:integrations-personal',
  ],

  ASESOR: [
    // CRM — limited to own
    'contacts:view:own',
    'contacts:create',
    'contacts:update:own',
    'contacts:move-stage',
    'conversations:view:own',
    'campaigns:view:own',
    'reports:view:own',
    // Real Estate
    'projects:view:all',
    'units:view:all',
    'blocks:create',
    'reservations:create',
    'sales:create',
    'payments:view:own',
    'payments:register',
    'commissions:view:own',
    'contracts:view:all',
    'contracts:create',
    'construction-progress:view:all',
    'real-estate-reports:view:own',
    // Configuration
    'config:profile',
    'config:integrations-personal',
  ],

  CLIENTE: [
    // Real Estate — only their own
    'units:view:own',
    'contracts:view:own',
    'construction-progress:view:own',
    // Configuration
    'config:profile',
  ],
}

/**
 * Returns true if the given role has the permission.
 *
 * For granular checks (e.g. "can THIS user edit THAT contact"), combine with
 * a resource-level check (ownership, workspace match, etc.) in the caller.
 */
export function can(role: UserRole, permission: Permission): boolean {
  return PERMISSIONS[role].includes(permission)
}

/**
 * Returns the list of permissions for a role (read-only).
 */
export function permissionsOf(role: UserRole): readonly Permission[] {
  return PERMISSIONS[role]
}
