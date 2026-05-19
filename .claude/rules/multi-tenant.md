# Regla: Multi-Tenancy

Esta regla aplica a TODA query a la BD y a TODA tabla nueva.

## Reglas absolutas

1. **Toda tabla con datos sensibles DEBE tener columna `workspaceId`** (cuid o uuid)
2. **Toda query a la BD DEBE filtrar por `workspaceId`** (excepto operaciones del Super Admin con bypass explícito)
3. **Toda tabla nueva DEBE tener política RLS aplicada** antes del primer uso
4. **Las credenciales de integraciones** (Twilio, Retell, Evolution, etc.) son **por workspace**, NUNCA globales
5. **Los archivos en Supabase Storage** se organizan en `/{workspaceId}/...`

## Tablas exentas del workspaceId

Solo estas tablas no requieren workspaceId:
- `Workspace` (es el propio tenant)
- `User` con `role = SUPER_ADMIN` (puede tener workspaceId nulo)
- Tablas globales del sistema (no aplicables en este proyecto)

## Patrón obligatorio para Server Actions

```typescript
'use server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function getContacts() {
  const session = await auth()
  if (!session?.user?.workspaceId) {
    throw new Error('Unauthorized')
  }

  // SIEMPRE filtrar por workspaceId
  return db.contact.findMany({
    where: { workspaceId: session.user.workspaceId }
  })
}
```

## Patrón anti — NUNCA hacer

```typescript
// ❌ MAL - sin filtro de workspace
const contacts = await db.contact.findMany()

// ❌ MAL - workspaceId desde request body (manipulable)
const contacts = await db.contact.findMany({
  where: { workspaceId: body.workspaceId }
})

// ❌ MAL - sin verificar sesión
export async function deleteContact(id: string) {
  await db.contact.delete({ where: { id } })
}
```

## Super Admin bypass

Solo el rol SUPER_ADMIN puede hacer queries cross-workspace, y debe ser explícito:

```typescript
if (session.user.role === 'SUPER_ADMIN' && options?.crossWorkspace) {
  // Bypass intencional
  return db.contact.findMany()
}
```

## Antes de mergear cualquier feature que toque BD
Invocar el subagent `multi-tenant-auditor` para verificar cumplimiento.
