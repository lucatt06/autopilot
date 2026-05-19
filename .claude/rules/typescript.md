# Regla: TypeScript

## Configuración base
- `strict: true` siempre
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- Path aliases: `@/*` mapeado a `./src/*` o `./app/*`

## Tipos

### Nunca usar `any`
```typescript
// ❌
function process(data: any) { ... }

// ✅
function process(data: unknown) {
  if (typeof data === 'string') { ... }
}
```

### Preferir tipos derivados de Prisma
```typescript
import { Prisma } from '@prisma/client'

type ContactWithDeals = Prisma.ContactGetPayload<{
  include: { deals: true }
}>
```

### Zod schemas como source of truth
```typescript
const contactSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
})

type Contact = z.infer<typeof contactSchema>
```

## Enums vs Union Types

### Para valores de UI/lógica: Union types
```typescript
type Status = 'active' | 'inactive' | 'pending'
```

### Para valores en BD: Prisma enums
```prisma
enum UnitStatus {
  DISPONIBLE
  RESERVADA
  VENDIDA
}
```

## Naming

- Tipos: PascalCase (`Contact`, `CreateContactInput`)
- Variables/funciones: camelCase
- Constantes globales: SCREAMING_SNAKE_CASE
- Componentes React: PascalCase
- Booleans: prefijo `is`, `has`, `can`, `should` (`isActive`, `hasPermission`)

## Funciones

### Funciones puras donde sea posible
```typescript
function calculateCommission(price: number, percent: number): number {
  return price * (percent / 100)
}
```

### Tipos de retorno explícitos en funciones públicas
```typescript
export async function getContact(id: string): Promise<Contact | null> {
  // ...
}
```

## Error handling

### Errors estructurados
```typescript
class WorkspaceMismatchError extends Error {
  constructor(public expectedWorkspaceId: string, public actualWorkspaceId: string) {
    super(`Workspace mismatch: expected ${expectedWorkspaceId}, got ${actualWorkspaceId}`)
  }
}
```

### Result pattern para operaciones críticas
```typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E }

async function createSale(input: SaleInput): Promise<Result<Sale>> {
  try {
    const sale = await db.sale.create({ data: input })
    return { ok: true, value: sale }
  } catch (error) {
    return { ok: false, error: error as Error }
  }
}
```

## Imports

### Order
1. React/Next.js core
2. Librerías externas
3. Imports internos (`@/...`)
4. Tipos
5. Estilos

```typescript
import { useState } from 'react'
import { z } from 'zod'

import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

import type { Contact } from '@prisma/client'

import './styles.css'
```

## Anti-patterns

```typescript
// ❌ Type assertion sin validación
const data = JSON.parse(input) as Contact

// ✅ Validar con Zod
const data = contactSchema.parse(JSON.parse(input))
```

```typescript
// ❌ Optional chaining sin manejar null
const name = user?.profile?.name?.toUpperCase() // puede ser undefined

// ✅ Manejar el caso null explícitamente
const name = user?.profile?.name?.toUpperCase() ?? 'Sin nombre'
```
