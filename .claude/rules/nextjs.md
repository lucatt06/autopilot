# Regla: Next.js 14 (App Router)

## Arquitectura

### Server Components (default)
- Cualquier archivo nuevo en `app/` es Server Component por defecto
- Puede hacer fetch async directamente
- Puede acceder a la BD via Prisma directamente
- NO usar `'use client'` a menos que sea estrictamente necesario

### Client Components
- Solo cuando necesitas:
  - Interactividad (onClick, onChange, etc.)
  - React hooks (useState, useEffect, useContext)
  - Browser APIs (window, localStorage)
  - Librerías que requieren cliente (chart.js, react-day-picker, etc.)
- Marcar con `'use client'` arriba del archivo
- Mantener Client Components lo más pequeños posible (boundary tight)

## Mutations

### Preferir Server Actions
```typescript
'use server'
export async function createContact(input: CreateContactInput) {
  const validated = createContactSchema.parse(input)
  const session = await auth()
  // ...
}
```

### Usar API routes solo cuando:
- Necesitas un endpoint público (webhooks)
- Necesitas streaming response
- Necesitas un endpoint consumido por terceros

## Data fetching

### Server Components: fetch directo
```typescript
async function ContactsPage() {
  const contacts = await getContacts() // server action
  return <ContactList contacts={contacts} />
}
```

### Client Components: usar React Query (TanStack Query)
- Para datos que cambian con frecuencia
- Para optimistic updates
- Para cache compartido entre componentes

## Routing

### Estructura de carpetas
```
app/
├── (auth)/              ← Group sin afectar URL
│   ├── login/
│   └── register/
├── (dashboard)/         ← Layout con sidebar
│   ├── layout.tsx
│   ├── crm/
│   │   ├── contactos/
│   │   ├── conversaciones/
│   │   └── ...
│   └── desarrollo/
│       ├── proyectos/
│       └── ...
└── api/                 ← Solo cuando Server Actions no aplican
```

### Convenciones
- `page.tsx` — la página
- `layout.tsx` — layout compartido
- `loading.tsx` — UI de loading
- `error.tsx` — UI de error
- `not-found.tsx` — UI de 404

## Validación con Zod

TODO input externo (Server Action params, API routes) DEBE validarse:

```typescript
import { z } from 'zod'

const schema = z.object({
  firstName: z.string().min(1).max(100),
  email: z.string().email().optional(),
})

export async function createContact(input: unknown) {
  const validated = schema.parse(input) // throws si inválido
  // ...
}
```

## Performance

- Imágenes: usar `next/image` siempre
- Fonts: usar `next/font` siempre
- Streaming: usar `<Suspense>` para componentes pesados
- Cache: usar `cache()` de React para deduplicar queries en el mismo render
- Edge runtime: usar `export const runtime = 'edge'` para handlers ligeros

## Anti-patterns

```typescript
// ❌ NO hacer fetch en useEffect en Client Component
useEffect(() => {
  fetch('/api/contacts').then(...)
}, [])

// ✅ SÍ — usar Server Component que hace fetch directo
async function ContactsPage() {
  const contacts = await getContacts()
  return <ContactList contacts={contacts} />
}
```

```typescript
// ❌ NO usar API routes para mutations sin razón
fetch('/api/contacts', { method: 'POST', body: ... })

// ✅ SÍ — Server Action
await createContact(input)
```
