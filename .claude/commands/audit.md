---
description: Auditoría completa antes de mergear código (multi-tenant + QA)
---

# /audit

Auditoría completa de los cambios actuales antes de mergear.

## Pasos

1. **Identificar archivos modificados**:
   ```bash
   git status
   git diff --stat
   ```

2. **Invocar subagent `multi-tenant-auditor`**:
   - Verifica reglas de multi-tenant
   - Reporta violaciones con archivo y línea

3. **Invocar subagent `qa-engineer`**:
   - Checklist funcional completa
   - Checklist de datos, tests, performance, UI, seguridad

4. **Verificar tests pasan**:
   ```bash
   npm test
   ```

5. **Verificar lint pasa**:
   ```bash
   npm run lint
   ```

6. **Verificar build pasa**:
   ```bash
   npm run build
   ```

7. **Reportar consolidado**:
   ```
   # 📋 Auditoría completa

   ## Multi-tenant
   ✅ Pasada / 🔴 Bloqueada

   ## QA
   ✅ Pasada / 🔴 Bloqueada / 🟠 Aprobada con observaciones

   ## Tests
   ✅ X/Y pasados / 🔴 N fallidos

   ## Lint
   ✅ Sin errores / 🟠 N warnings

   ## Build
   ✅ Compila / 🔴 N errores

   ## Veredicto
   ✅ LISTO PARA MERGE
   ó
   🔴 BLOQUEADO — issues a resolver: [lista]
   ```

## NO ejecutar merge automáticamente

Solo reportar. Lucas decide si proceder con el merge.

## Cuándo usar

- Antes de mergear un branch a `main`
- Antes de marcar una feature como DONE
- Antes de hacer deploy a producción
- Cuando hay dudas sobre la calidad de un PR
