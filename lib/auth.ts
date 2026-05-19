import 'server-only'

import { redirect } from 'next/navigation'
import type { User as PrismaUser, UserRole, Workspace } from '@prisma/client'

import { db } from '@/lib/db'
import { createServerClient } from '@/lib/supabase/server'

export type SessionUser = PrismaUser & {
  workspace: Workspace | null
}

/**
 * Returns the validated Supabase auth user (or null).
 * Uses getUser() which validates the JWT on every call.
 */
export async function getAuthUser() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * Returns the full domain User (Prisma row) including their workspace.
 * Null if not authenticated or if the User row doesn't exist yet.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const authUser = await getAuthUser()
  if (!authUser) return null

  const user = await db.user.findUnique({
    where: { id: authUser.id },
    include: { workspace: true },
  })

  return user
}

/**
 * Guard: throws redirect if no user. Use at the top of protected pages.
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!user.isActive) redirect('/login?error=account_inactive')
  return user
}

/**
 * Guard: ensures the user has one of the allowed roles.
 */
export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const user = await requireAuth()
  if (!roles.includes(user.role)) {
    throw new Error(
      `Forbidden: required role ${roles.join(' | ')}, got ${user.role}`
    )
  }
  return user
}

/**
 * Returns the workspaceId of the current user.
 * Super Admin without active workspace throws — they must pick one first.
 */
export async function requireWorkspaceId(): Promise<string> {
  const user = await requireAuth()
  if (!user.workspaceId) {
    throw new Error('No workspace selected. Super Admin must impersonate or pick a workspace.')
  }
  return user.workspaceId
}
