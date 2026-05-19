---
description: Validar que cambios al schema de Prisma respetan el diseño multi-tenant y las convenciones del proyecto
---

# /schema-validate

Validar cambios al schema antes de generar migración.

## Pasos

1. **Comparar `prisma/schema.prisma` (working) vs `docs/02_Autopilot_Schema.prisma` (master)**
2. **Invocar subagent `prisma-architect`** para revisión arquitectónica
3. **Invocar subagent `multi-tenant-auditor`** para verificación multi-tenant
4. **Verificar manualmente**:
   - Toda tabla nueva tiene `workspaceId` (excepto Workspace y User SUPER_ADMIN)
   - Foreign keys tienen `onDelete` explícito
   - Hay índices en todas las FKs
   - Hay índice compuesto en (workspaceId, status) o (workspaceId, createdAt) si aplica
   - Enums siguen SCREAMING_SNAKE_CASE
   - Campos siguen camelCase
   - Models siguen PascalCase singular
5. **Reportar resultado**:
   ```
   ✅ Schema válido — proceder con `prisma migrate dev --name xxx`
   ó
   🔴 Schema inválido — corregir antes de migrar:
   - [Lista de issues con archivo y línea]
   ```

6. **Si todo OK**: sugerir nombre descriptivo para la migración

## NO hacer
- No ejecutar `prisma migrate dev` automáticamente — solo validar
- No tocar el documento maestro sin permiso explícito
