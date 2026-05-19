# Regla: UI con Tailwind + shadcn/ui

## Setup
- Tailwind CSS configurado con `darkMode: 'class'`
- shadcn/ui via `npx shadcn-ui@latest add [component]`
- Componentes shadcn van en `components/ui/`
- Componentes custom van en `components/`

## Convenciones de componentes

### Server Component (default)
```tsx
// components/ContactCard.tsx
import { Card } from '@/components/ui/card'

interface ContactCardProps {
  contact: Contact
}

export function ContactCard({ contact }: ContactCardProps) {
  return (
    <Card>
      <h3>{contact.firstName} {contact.lastName}</h3>
    </Card>
  )
}
```

### Client Component (cuando necesario)
```tsx
'use client'
// components/ContactForm.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function ContactForm() {
  const [name, setName] = useState('')
  return (
    <form>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <Button type="submit">Guardar</Button>
    </form>
  )
}
```

## Idioma
- Texto visible al usuario: **Español**
- Nombres de componentes, variables, props: **Inglés**
- Comentarios en código: **Inglés**

## Colores y estados (consistencia visual)

Estados consistentes en TODA la aplicación:

```typescript
const STATUS_COLORS = {
  // Generales
  success: 'bg-green-100 text-green-800 border-green-300',
  active: 'bg-blue-100 text-blue-800 border-blue-300',
  warning: 'bg-orange-100 text-orange-800 border-orange-300',
  danger: 'bg-red-100 text-red-800 border-red-300',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  special: 'bg-purple-100 text-purple-800 border-purple-300',
  inactive: 'bg-gray-100 text-gray-800 border-gray-300',
}
```

Aplicación según contexto:
- 🟢 Verde — éxito, completado (Pagado, Resuelto, Aprobado)
- 🔵 Azul — activo, en proceso (Activa, Reservada)
- 🟠 Naranja — atención (Pendiente, Próximo a vencer, Parcial)
- 🔴 Rojo — crítico, vencido (Vencido, Rechazado)
- 🟡 Amarillo — bloqueo, espera (Bloqueada, En evaluación)
- 🟣 Morado — especial (Notariado, Escalado)
- ⚪ Gris — inactivo, cancelado (Cancelado, Inactiva)

## Patrones de UI

### Listados con 100 resultados por defecto
```tsx
const PAGE_SIZE = 100

async function ContactsPage({ searchParams }: Props) {
  const page = Number(searchParams.page ?? '1')
  const contacts = await getContacts({ page, pageSize: PAGE_SIZE })
  // ...
}
```

### Filtros avanzados
- Búsqueda por texto siempre disponible
- Filtros por dropdown para enums
- Filtros por fecha con date range picker
- Botón "Limpiar filtros" siempre visible cuando hay filtros activos

### Tablas
- Sticky header siempre
- Columnas personalizables (botón "Columnas" para mostrar/ocultar)
- Sort por click en header de columna
- Hover states para indicar fila clickeable
- Empty states con CTA claro

### Forms
- Validación en cliente con Zod + react-hook-form
- Errores inline debajo del campo
- Botón submit deshabilitado mientras se procesa
- Toast de éxito/error después de submit
- Campos requeridos marcados con asterisco rojo

### Loading states
- Skeleton screens para listados (no spinners)
- Spinner solo para acciones puntuales (botón con loading)
- Suspense boundaries para code splitting

### Empty states
```tsx
<div className="text-center py-12">
  <Icon className="mx-auto h-12 w-12 text-gray-400" />
  <h3 className="mt-2 text-sm font-medium">Sin contactos aún</h3>
  <p className="mt-1 text-sm text-gray-500">
    Empieza creando tu primer contacto
  </p>
  <Button className="mt-6">
    <Plus className="h-4 w-4 mr-2" />
    Nuevo contacto
  </Button>
</div>
```

## Iconos
- Usar `lucide-react` siempre
- Tamaño consistente: `h-4 w-4` inline, `h-5 w-5` botones, `h-6 w-6` headers
- Colores via Tailwind classes

## Responsive

- Mobile-first: empezar con clases sin prefijo, añadir `md:` y `lg:` después
- Breakpoints: `sm:` 640px, `md:` 768px, `lg:` 1024px, `xl:` 1280px
- Sidebar colapsable en mobile (drawer)
- Tablas con scroll horizontal en mobile

## Accesibilidad

- `aria-label` en botones con solo icono
- `alt` en todas las imágenes
- Focus states visibles (Tailwind default ya lo tiene)
- Contraste mínimo WCAG AA
- Navegación por teclado funcional

## Anti-patterns

```tsx
// ❌ Estilos inline
<div style={{ color: 'red', padding: '12px' }}>

// ✅ Tailwind
<div className="text-red-600 p-3">
```

```tsx
// ❌ CSS modules para algo trivial
import styles from './card.module.css'
<div className={styles.card}>

// ✅ Tailwind directo
<div className="rounded-lg border bg-card p-6 shadow-sm">
```
