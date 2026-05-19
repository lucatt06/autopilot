'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { audit, diffFields } from '@/lib/audit'
import {
  createContactSchema,
  updateContactSchema,
  type CreateContactInput,
} from '@/lib/contacts/schemas'
import { findContactDuplicates, getContactById } from '@/lib/contacts/queries'

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

/**
 * Create a new Contact.
 *
 * - Validates input with Zod
 * - Enforces workspaceId from session (never from client)
 * - Detects duplicates by email/phone (caller may opt to ignore)
 * - Defaults owner to the calling user
 * - Writes AuditLog entry
 */
export async function createContact(
  input: CreateContactInput,
  options: { ignoreDuplicates?: boolean } = {}
): Promise<ActionResult<{ id: string; duplicates?: Awaited<ReturnType<typeof findContactDuplicates>> }>> {
  const user = await requireAuth()
  if (!user.workspaceId) {
    return { ok: false, error: 'No workspace activo. Selecciona uno desde el Panel de Agencia.' }
  }

  const parsed = createContactSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Datos inválidos',
      field: issue?.path[0] as string | undefined,
    }
  }
  const data = parsed.data

  if (!options.ignoreDuplicates) {
    const duplicates = await findContactDuplicates(
      user.workspaceId,
      data.email,
      data.mobilePhone ?? data.phone
    )
    if (duplicates.length > 0) {
      return {
        ok: false,
        error: 'Posible duplicado encontrado',
        data: { id: '', duplicates },
      } as ActionResult<{ id: string; duplicates: typeof duplicates }>
    }
  }

  const ownerId = data.ownerId ?? user.id

  const created = await db.contact.create({
    data: {
      workspaceId: user.workspaceId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email ?? null,
      mobilePhone: data.mobilePhone ?? null,
      phone: data.phone ?? null,
      country: data.country ?? null,
      city: data.city ?? null,
      language: data.language ?? 'es',
      gender: data.gender ?? null,
      company: data.company ?? null,
      position: data.position ?? null,
      website: data.website ?? null,
      contactType: data.contactType,
      source: data.source ?? null,
      hardOwner: data.hardOwner ?? null,
      temperature: data.temperature,
      requiredAction: data.requiredAction ?? null,
      buyPurpose: data.buyPurpose ?? null,
      unitTypes: data.unitTypes,
      budgetMin: data.budgetMin ?? null,
      budgetMax: data.budgetMax ?? null,
      estimatedBuyTime: data.estimatedBuyTime ?? null,
      paymentPreference: data.paymentPreference ?? null,
      residency: data.residency ?? null,
      dndAll: data.dndAll,
      dndCalls: data.dndCalls,
      dndSms: data.dndSms,
      dndEmail: data.dndEmail,
      dndIncoming: data.dndIncoming,
      ownerId,
      createdById: user.id,
      lastActivityAt: new Date(),
    },
  })

  await audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: 'created',
    entityType: 'Contact',
    entityId: created.id,
    changes: { after: created },
  })

  revalidatePath('/crm/contactos')
  return { ok: true, data: { id: created.id } }
}

/**
 * Update an existing contact. Only fields present in input are touched.
 */
export async function updateContact(id: string, input: Partial<CreateContactInput>): Promise<ActionResult> {
  const user = await requireAuth()
  if (!user.workspaceId) return { ok: false, error: 'No workspace activo' }

  const parsed = updateContactSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Datos inválidos',
      field: issue?.path[0] as string | undefined,
    }
  }

  const existing = await getContactById(id, user.workspaceId, user.role, user.id)
  if (!existing) return { ok: false, error: 'Contacto no encontrado o sin permisos' }

  const updated = await db.contact.update({
    where: { id },
    data: { ...parsed.data, updatedAt: new Date() },
  })

  await audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: 'updated',
    entityType: 'Contact',
    entityId: id,
    changes: diffFields(existing as never, updated as never),
  })

  revalidatePath('/crm/contactos')
  revalidatePath(`/crm/contactos/${id}`)
  return { ok: true }
}

/**
 * Soft-delete a contact (Doc 3 §1.4).
 */
export async function deleteContact(id: string): Promise<ActionResult> {
  const user = await requireAuth()
  if (!user.workspaceId) return { ok: false, error: 'No workspace activo' }

  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return { ok: false, error: 'Solo administradores pueden eliminar contactos' }
  }

  const existing = await getContactById(id, user.workspaceId, user.role, user.id)
  if (!existing) return { ok: false, error: 'Contacto no encontrado' }

  await db.contact.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  await audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: 'deleted',
    entityType: 'Contact',
    entityId: id,
    changes: { before: existing },
  })

  revalidatePath('/crm/contactos')
  return { ok: true }
}

/**
 * Convenience action used by the "Nuevo contacto" form — handles FormData,
 * shows duplicate dialog, and redirects on success.
 */
export async function createContactFromForm(formData: FormData): Promise<ActionResult> {
  const input = Object.fromEntries(formData.entries()) as Record<string, string>

  // Convert checkbox values (which arrive as "on"/undefined) to boolean strings
  const normalized = {
    ...input,
    unitTypes: formData.getAll('unitTypes').map(String),
  }

  const result = await createContact(normalized as never)
  if (!result.ok) return result

  if (result.data?.id) redirect(`/crm/contactos/${result.data.id}`)
  return { ok: true }
}
