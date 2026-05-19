---
description: Documentar una decisión arquitectónica o de producto en la memoria del proyecto
---

# /decision

Documentar decisión sobre: $ARGUMENTS

## Pasos

1. **Leer `.claude/memory/decisions.md`** (crear si no existe)
2. **Añadir entrada** al final con formato:

```markdown
## [Fecha YYYY-MM-DD] — [Título breve de la decisión]

**Contexto:**
[Por qué surgió esta decisión, qué problema resuelve]

**Decisión:**
[Qué se decidió hacer]

**Alternativas consideradas:**
- Opción A: [descripción] — descartada porque [razón]
- Opción B: [descripción] — descartada porque [razón]

**Consecuencias:**
- ✅ [Beneficio 1]
- ✅ [Beneficio 2]
- ⚠️ [Tradeoff 1]
- ⚠️ [Tradeoff 2]

**Implementación:**
- Archivos afectados: [lista]
- Migraciones necesarias: [lista]
- Tests necesarios: [lista]

**Decidido por:** Lucas Torres
**Status:** Implementado / Pendiente / Reconsiderado
```

3. **Confirmar al usuario** que la decisión quedó registrada

## Importante

Solo se documentan decisiones IMPORTANTES:
- Cambios arquitectónicos
- Cambios de stack
- Cambios al modelo de datos significativos
- Cambios de comportamiento de negocio
- Excepciones a las reglas estándar

NO documentar:
- Decisiones triviales de implementación (nombre de variable, etc.)
- Cambios de UI menores
- Bug fixes

## Cuando consultar este archivo

Antes de:
- Proponer una decisión arquitectónica → revisar si ya se decidió
- Reabrir una decisión que parece "obvia" mejorar
- Cuando hay duda sobre por qué algo está hecho así
