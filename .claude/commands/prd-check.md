---
description: Verificar que una feature específica esté correctamente especificada en el PRD antes de construirla
---

# /prd-check

Verificar especificación de la feature: $ARGUMENTS

## Pasos

1. **Buscar la feature** en `@docs/01_Autopilot_PRD_General.md`
2. **Buscar reglas relacionadas** en `@docs/03_Autopilot_Business_Rules.md`
3. **Verificar que esté completamente especificada**:
   - ¿Está definida la pantalla?
   - ¿Están definidos los campos?
   - ¿Están definidos los estados?
   - ¿Está definido el comportamiento automático?
   - ¿Están definidos los permisos por rol?
   - ¿Está definida la cascada de efectos (si aplica)?
4. **Reportar al usuario**:
   - ✅ Lo que SÍ está especificado
   - ❌ Lo que NO está especificado (huecos en el PRD)
   - 💡 Recomendaciones (preguntas que el usuario debería responder antes de codear)

## Ejemplo

```
Usuario: /prd-check creación de venta

Tú reportas:
✅ Lo que SÍ está especificado:
- Formulario de venta (documento 1, sección 8.10)
- Cascada completa al crear venta (documento 3, sección 4.5)
- Estados de la venta (active, in_signing_process, etc.)
- Cálculo automático de comisión

❌ Lo que NO está especificado:
- Validación de que el contacto exista en CRM activo
- Comportamiento si la reservación está EXPIRED

💡 Preguntas para Lucas antes de codear:
- ¿Se puede crear venta sin reservación previa?
- ¿Qué pasa si el contacto está marcado como DND?
```
