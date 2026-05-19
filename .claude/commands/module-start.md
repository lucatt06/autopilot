---
description: Cargar contexto completo para construir un módulo o feature específico
---

# /module-start

Cargar contexto para construir el módulo o feature: $ARGUMENTS

## Pasos a ejecutar

1. **Identificar el módulo solicitado** en `$ARGUMENTS`
2. **Leer la sección correspondiente** en `@docs/01_Autopilot_PRD_General.md`:
   - Si es CRM → sección 7
   - Si es Desarrollo Inmobiliario → sección 8
   - Si es Agentes IA → sección 7.9, 7.10, 7.12
   - Si es Automatizaciones → sección 7.10
   - Si es Integraciones → sección 7.11
   - Si es Panel de Agencia → sección 10
   - Si es Auth/Onboarding → sección 5
3. **Identificar tablas relacionadas** en `@docs/02_Autopilot_Schema.prisma`
4. **Identificar reglas de negocio** en `@docs/03_Autopilot_Business_Rules.md`
5. **Verificar decisiones relevantes** en `@docs/04_Autopilot_Contexto_y_Decisiones.md`
6. **Determinar el subagent apropiado**:
   - CRM → `crm-builder`
   - Desarrollo Inmobiliario → `di-builder`
   - Cualquier IA → `ai-integrator`
   - UI específica → `ui-builder`
7. **Generar plan paso a paso** en `.claude/memory/active-plan.md`:
   - Título del módulo
   - Pantallas a construir
   - Tablas involucradas
   - Lógica de negocio crítica
   - Subagent recomendado
   - Pasos numerados con archivos a crear/modificar
   - Tests críticos
8. **Reportar el plan a Lucas** y esperar confirmación antes de codear

## NO hacer
- No empezar a codear antes de generar el plan
- No saltarse leer los 4 documentos relevantes
- No asumir decisiones — si algo no está claro en el PRD, escalar
