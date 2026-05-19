# Autopilot — SaaS Inmobiliario Multi-Tenant

## Documentos de referencia (LEER al iniciar tarea nueva)
- @docs/01_Autopilot_PRD_General.md — Visión, módulos, pantallas, features
- @docs/02_Autopilot_Schema.prisma — Schema completo de la BD
- @docs/03_Autopilot_Business_Rules.md — Reglas de negocio y orden de construcción
- @docs/04_Autopilot_Contexto_y_Decisiones.md — Rationale, decisiones descartadas, convenciones

## Stack
- **Frontend**: Next.js 14 (App Router) + Tailwind + shadcn/ui
- **BD**: Supabase (PostgreSQL + Auth + RLS) + Prisma ORM
- **Analytics**: ClickHouse + Upstash Redis (cache)
- **IA**: Anthropic Claude API + OpenAI embeddings + Pinecone (vector)
- **Comunicación**: Twilio (voz/SMS) + Evolution API + Meta Business API + Retell AI + ElevenLabs
- **Deploy**: Vercel (app) + Railway (servicios auxiliares)
- **Lenguaje**: TypeScript strict mode

## Reglas no-negociables
1. Toda tabla con datos sensibles DEBE tener `workspaceId` y política RLS — sin excepción
2. Validar todo input con Zod en boundaries (Server Actions, API routes)
3. Server Components por defecto, Client Components solo cuando interactividad lo requiera
4. Server Actions sobre API routes cuando sea posible
5. Nunca commitear secretos — solo `.env.local` y `.env.example` con placeholders
6. Migraciones via `prisma migrate`, nunca SQL manual
7. UI en español, código y comentarios en inglés
8. Tests obligatorios para lógica de cascada (creación de venta, recordatorios cobros, comisiones)

## Routing del trabajo
- Plan activo de la tarea: `.claude/memory/active-plan.md`
- Decisiones arquitectónicas: `.claude/memory/decisions.md`
- Reglas técnicas: `@.claude/rules/`
- Agentes especializados: `.claude/agents/`
- Comandos disponibles: `.claude/commands/`

## Workflow obligatorio por módulo nuevo
1. Usar `/module-start [nombre]` para cargar contexto
2. Usar **Plan Mode** (Shift+Tab) antes de codear
3. Esperar mi confirmación del plan antes de ejecutar
4. Hacer commits pequeños y atómicos
5. Antes de marcar DONE: invocar `qa-engineer` y `multi-tenant-auditor`

## Cuando hay duda
- Especificación ambigua → consultar `@docs/01_Autopilot_PRD_General.md`
- Comportamiento ambiguo → consultar `@docs/03_Autopilot_Business_Rules.md`
- Decisión arquitectónica ambigua → consultar `@docs/04_Autopilot_Contexto_y_Decisiones.md`
- Si sigue sin estar claro → preguntar a Lucas, NUNCA inventar

## Identidad del producto
- **Producto**: Autopilot
- **Función IA interna**: IA Asistente (NO "Autopilot")
- **Primer cliente**: Trinova (empresa, no es feature ni producto)
- **Idioma de UI**: Español
- **Mercado**: República Dominicana → LATAM

## Compactación
Cuando compactes, SIEMPRE preservar:
- Lista de archivos modificados
- Decisiones tomadas en la sesión
- Plan activo si quedaron pasos pendientes
- Comandos de test/build relevantes
