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

## 2026-05-19 — Workflow de migraciones SQL (no usar `prisma migrate dev`)

**Decisión:** No usar `prisma migrate dev` ni `prisma db push`. Aplicar SQL directo con un script Node propio.

**Rationale:**
- `prisma migrate dev` cuelga indefinidamente contra el pooler de Supabase. Síntoma: ningún output, ningún error, proceso vivo pero sin progreso. Causa probable: intenta crear un "shadow database" para detectar drift, lo cual Supabase hosted no permite (no hay permisos para `CREATE DATABASE`).
- `prisma db push` también cuelga (mismo issue subyacente).
- En cambio, **Prisma Client (`$executeRawUnsafe`) sí funciona perfectamente** contra el mismo pooler (probado: conexión en 879ms, schema completo aplicado en 65s con 229 statements, 0 fallos).

**Workflow definido para futuras migraciones:**

1. Editar `prisma/schema.prisma`
2. Generar el SQL del delta:
   ```bash
   npx prisma migrate diff \
     --from-url $DATABASE_URL \
     --to-schema-datamodel prisma/schema.prisma \
     --script > prisma/migrations/000N_descripcion.sql
   ```
3. **Revisar manualmente el SQL** generado (especialmente DROP statements destructivos)
4. Aplicar con el script propio:
   ```bash
   node --env-file=.env prisma/scripts/apply-sql.mjs prisma/migrations/000N_descripcion.sql
   ```
5. Regenerar el client:
   ```bash
   npx prisma generate
   ```

**Trade-offs:**
- ❌ Perdemos las features del `prisma migrate` CLI: tracking automático de migrations aplicadas en `_prisma_migrations`, rollback automático, dev/prod parity, etc.
- ✅ Ganamos: workflow que SÍ funciona contra Supabase, control explícito sobre qué SQL se ejecuta, posibilidad de auditar cada migración SQL manualmente.

**Riesgo a monitorear:** si en algún momento dos developers crean migraciones en paralelo sin coordinar, pueden divergir. Mitigación: convención de numeración secuencial + revisión obligatoria en PR.

**Schema aplicado exitosamente:**
- 66 tablas
- 53 enums
- 97 foreign keys
- 79 índices

Archivo baseline: `prisma/migrations/0001_init.sql` (1796 líneas).

---

## 2026-05-19 — RLS aplicado y validado (Doc 4 §8.4 #1 ✅)

**Decisión:** Patrón híbrido de RLS aplicado a las 66 tablas del schema.

**Implementación:**
- Helper functions SQL: `current_user_workspace_id()` y `is_super_admin()` (SECURITY DEFINER, STABLE)
- 51 tablas con `workspaceId` directo → policies que comparan con `current_user_workspace_id()`
- 15 child tables sin `workspaceId` → policies que validan vía EXISTS al parent
- Workspace + User → policies especiales
- Todas las policies son `TO authenticated` (Prisma con rol `postgres` no se ve afectado)

**Archivos:**
- `prisma/migrations/0002_rls.sql` — policies de tablas con workspaceId (262 statements)
- `prisma/migrations/0003_rls_children.sql` — policies de child tables (75 statements)
- `prisma/scripts/generate-rls.mjs` — generator del 0002
- `prisma/scripts/generate-rls-children.mjs` — generator del 0003
- `prisma/scripts/verify-rls.mjs` — auditoría del estado
- `prisma/scripts/test-rls-isolation.mjs` — test end-to-end de aislamiento

**Estado final BD:**
- 66/66 tablas con RLS habilitado
- 264 policies activas
- 2 helpers SQL desplegados

**Test de validación (8/8 ✓):**
- User A ve solo su workspace ✓
- User B ve solo su workspace ✓
- Aislamiento cross-workspace verificado ✓
- Anónimo no ve nada ✓
- INSERT cross-workspace bloqueado por RLS ✓

**Importante para el código de la app:**
- Prisma (`lib/db.ts`) conecta como rol `postgres` → bypassea RLS
- Toda Server Action DEBE validar `workspaceId` antes de cualquier query (ver `.claude/rules/multi-tenant.md`)
- Para reads desde el cliente browser, usar `@supabase/ssr` que respeta RLS automáticamente

---

## 2026-05-19 — Comunicación de modelo recomendado

**Decisión:** Per `user_preferences.md`, antes de iniciar cada fase, recomendar explícitamente qué modelo usar:
- Planning / análisis / arquitectura: `Claude Opus 4.7 (Thinking)` o `Sonnet 4.6 (Thinking)`
- Ejecución pura / setup mecánico: `Haiku 4.5`
