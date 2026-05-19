import 'server-only'

import type { Prisma, UserRole } from '@prisma/client'

import { db } from '@/lib/db'
import type { ContactFilters } from '@/lib/contacts/schemas'

/**
 * Build the role-aware base WHERE for Contact queries.
 *
 * - SUPER_ADMIN: all contacts in their current workspaceId
 * - ADMIN: all contacts in the workspace
 * - ASESOR: only contacts they own or follow (UserFollowsContact)
 * - CLIENTE: none (handled at higher layer — clients don't list contacts)
 *
 * NEVER call without workspaceId. RLS would protect from data leaks at the
 * DB level when accessed via the @supabase/ssr client, but Prisma bypasses
 * RLS (rule: lib/multi-tenant.md).
 */
function baseWhere(
  workspaceId: string,
  role: UserRole,
  userId: string
): Prisma.ContactWhereInput {
  const base: Prisma.ContactWhereInput = {
    workspaceId,
    deletedAt: null,
  }

  if (role === 'ASESOR') {
    base.OR = [
      { ownerId: userId },
      { followers: { some: { userId } } },
    ]
  }

  return base
}

export interface ListContactsArgs {
  workspaceId: string
  role: UserRole
  userId: string
  filters?: ContactFilters
}

export async function listContacts({
  workspaceId,
  role,
  userId,
  filters,
}: ListContactsArgs) {
  const where = baseWhere(workspaceId, role, userId)

  if (filters?.search) {
    where.AND = [
      {
        OR: [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { mobilePhone: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search, mode: 'insensitive' } },
        ],
      },
    ]
  }

  if (filters?.contactType) where.contactType = filters.contactType
  if (filters?.temperature) where.temperature = filters.temperature
  if (filters?.ownerId) where.ownerId = filters.ownerId
  if (filters?.source) where.source = filters.source
  if (filters?.tagId) {
    where.tags = { some: { tagId: filters.tagId } }
  }
  if (filters?.createdFrom || filters?.createdTo) {
    where.createdAt = {}
    if (filters.createdFrom) where.createdAt.gte = new Date(filters.createdFrom)
    if (filters.createdTo) {
      // include the entire `to` day
      const end = new Date(filters.createdTo)
      end.setHours(23, 59, 59, 999)
      where.createdAt.lte = end
    }
  }

  const page = filters?.page ?? 1
  const pageSize = filters?.pageSize ?? 100

  // Build orderBy dynamically from sort params.
  const sortBy = filters?.sortBy ?? 'lastActivityAt'
  const sortDir = filters?.sortDir ?? 'desc'
  // For nullable fields, push nulls to the end so the user always sees "real"
  // data first regardless of direction.
  const nullsHandling =
    sortBy === 'lastActivityAt' || sortBy === 'iaScore'
      ? { sort: sortDir, nulls: 'last' as const }
      : sortDir

  const [items, total] = await Promise.all([
    db.contact.findMany({
      where,
      take: pageSize,
      skip: (page - 1) * pageSize,
      orderBy: [{ [sortBy]: nullsHandling }, { createdAt: 'desc' }],
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
        currentStage: { select: { id: true, name: true, color: true } },
        tags: {
          include: { tag: { select: { id: true, name: true, color: true } } },
        },
      },
    }),
    db.contact.count({ where }),
  ])

  return { items, total, page, pageSize }
}

export async function getContactById(
  id: string,
  workspaceId: string,
  role: UserRole,
  userId: string
) {
  const where = baseWhere(workspaceId, role, userId)
  where.id = id

  return db.contact.findFirst({
    where,
    include: {
      owner: { select: { id: true, firstName: true, lastName: true, email: true } },
      currentStage: true,
      tags: { include: { tag: true } },
      followers: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
    },
  })
}

export async function findContactDuplicates(
  workspaceId: string,
  email: string | null | undefined,
  phone: string | null | undefined
) {
  if (!email && !phone) return []

  const orClauses: Prisma.ContactWhereInput[] = []
  if (email) orClauses.push({ email: { equals: email, mode: 'insensitive' } })
  if (phone) {
    orClauses.push({ mobilePhone: phone }, { phone: phone })
  }

  return db.contact.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      OR: orClauses,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      mobilePhone: true,
      phone: true,
    },
    take: 5,
  })
}
