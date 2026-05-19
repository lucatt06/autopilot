# Decisiones Arquitectónicas del Proyecto

> Bitácora de decisiones técnicas y de proceso. Una entrada por decisión.
> Formato: fecha + decisión + rationale + alternativas descartadas.

---

## 2026-05-19 — Orden de construcción: estricto según Doc 3 §11

**Decisión:** Seguir el orden EXACTO del Documento 3 §11 (Fase 1A → 1B → 1C → 1D → 1E → 1F → 1G → 1H → 1I → 1J).

**Rationale:**
- Desarrollo Inmobiliario (Fase 1G) tiene hard dependencies sobre el CRM completo:
  - `Sale.contactId`, `Customer.contactId`, `Reservation.contactId` requieren Contact
  - Cascada de venta (Doc 3 §4.5) requiere Pipeline + Stage(isWon=true) + ContactEvent
  - Comisiones requieren `hardOwner` de campañas
  - Recordatorios de Cobros requieren WhatsApp + Email (Fase 1D)
  - IA Asistente de morosidad requiere capa IA (Fase 1E)
- Avanzar DI antes de CRM completo obligaría a stubs frágiles y/o reescritura
- Doc 4 §6 — "Velocidad > elegancia, pero sin deuda técnica que cueste reescribir"

**Alternativa descartada:** Construir CRM mínimo + DI completo + luego CRM avanzado.
- Pro: Valor más rápido para Trinova en su pain principal
- Con: Riesgo de stubs frágiles, recordatorios de cobros sin canales, sin IA de morosidad
- Decisión del owner (Lucas): no negociar deuda técnica por velocidad relativa

---

## 2026-05-19 — Stack confirmado sin reaperturas

**Decisión:** No reabrir ninguna de las 12 decisiones descartadas listadas en Doc 4 §3.

Lista cerrada:
1. ❌ NestJS/Express backend separado
2. ❌ MongoDB
3. ❌ Auth0/Clerk/WorkOS (usar Supabase Auth)
4. ❌ App móvil nativa en Fase 1
5. ❌ Stripe en Fase 1
6. ❌ Productividad/Gestión/Portal/Web en Fase 1
7. ❌ "Active Tags" para enrutamiento IA
8. ❌ Bulk Actions en Negocios
9. ❌ Función IA llamada "Autopilot" (es "IA Asistente")
10. ❌ Probar agentes IA dentro de Autopilot (usar Retell)
11. ❌ Comprar números en Retell (usar Twilio)
12. ❌ Plantillas en Configuración (van en Contratos)

---

## 2026-05-19 — Manejo de credenciales

**Decisión:** Usuario pasa credenciales directamente en el chat. Yo las escribo en `.env.local` (gitignored), NUNCA en `.env.example` ni commits.

**Rationale:** Workflow más rápido para entorno solo-Lucas. Si el equipo crece, migrar a un secret manager (Vercel Encrypted Env Vars, Doppler, etc.).

---

## 2026-05-19 — Configuración GitHub

**Decisión:** Repo será `github.com/lucatt06/autopilot` (cuenta personal de Lucas, no organización).

**Rationale:** Trinova es el primer cliente del SaaS pero la propiedad del código pertenece al equipo Autopilot. Si crece a organización, se transfiere después.

---

## 2026-05-19 — Comunicación de modelo recomendado

**Decisión:** Per `user_preferences.md`, antes de iniciar cada fase, recomendar explícitamente qué modelo usar:
- Planning / análisis / arquitectura: `Claude Opus 4.7 (Thinking)` o `Sonnet 4.6 (Thinking)`
- Ejecución pura / setup mecánico: `Haiku 4.5`
