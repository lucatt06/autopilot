# Regla: Prisma

## Migraciones
- SIEMPRE via `prisma migrate dev --name descriptive_name`
- NUNCA editar SQL manualmente
- NUNCA usar `prisma db push` en producción
- Migration names: snake_case descriptivo (ej: `add_workspace_audit_logs`, `add_unit_status_index`)

## Schema changes
1. Editar `prisma/schema.prisma`
2. Correr `prisma format` para alinear
3. Generar migración: `prisma migrate dev --name xxx`
4. Generar cliente: `prisma generate`
5. Verificar que tipos de TS se actualicen
6. Si cambia un campo crítico: invocar subagent `prisma-architect`

## Convenciones
- IDs: `cuid()` por defecto, `uuid()` solo si necesario para sistemas externos
- Timestamps: `createdAt @default(now())` + `updatedAt @updatedAt`
- Soft delete: `deletedAt DateTime?` (NULL = activo)
- Foreign keys: incluir `onDelete: Cascade` o `onDelete: SetNull` explícitamente
- Índices en TODA foreign key
- Índice compuesto en `(workspaceId, status)` y `(workspaceId, createdAt)` cuando aplique

## Naming
- Models: PascalCase singular (`Contact`, `Sale`, `WorkOrder`)
- Fields: camelCase (`firstName`, `workspaceId`, `createdAt`)
- Enums: SCREAMING_SNAKE_CASE para valores (`UnitStatus.DISPONIBLE`)
- Relations: nombre del modelo en lowercase (`workspace`, `owner`, `contact`)

## Queries
- Usar `select` cuando solo necesitas campos específicos (mejor performance)
- Usar `include` solo cuando necesitas la relación completa
- Para listados grandes: paginar con `take` + `skip` o cursor-based
- Default de paginación: **100 resultados por página**

## Transacciones
Lógica de cascada (ej: crear venta) DEBE estar en transacción:

```typescript
await db.$transaction(async (tx) => {
  const sale = await tx.sale.create({ data })
  await tx.unit.update({ where: { id }, data: { status: 'VENDIDA' } })
  await tx.paymentPlan.create({ ... })
  await tx.commission.create({ ... })
  // todo o nada
})
```

## RLS en Supabase
Después de cada migración nueva:
1. Generar políticas RLS para la tabla nueva
2. Aplicar via SQL script en `supabase/migrations/`
3. Testear que el filtro funciona con un user de otro workspace

## Antes de mergear
Invocar subagent `prisma-architect` si:
- Se añade tabla nueva
- Se cambia tipo de columna existente
- Se añade índice o constraint
- Se modifica una relación
