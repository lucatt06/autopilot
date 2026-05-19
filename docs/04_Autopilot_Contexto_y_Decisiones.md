# 📋 AUTOPILOT — Contexto y Decisiones

**Documento 4 de 4**
El "por qué" detrás de Autopilot

---

> Este documento NO describe qué construir (eso está en el PRD General) ni cómo se comporta (eso está en Reglas de Negocio). Este documento captura el **rationale**, la **filosofía**, las **decisiones descartadas** y los **constraints** que dieron forma al producto. Léelo antes de proponer alternativas o reabrir decisiones — probablemente ya se evaluaron.

---

## 1. IDENTIDAD DEL PROYECTO

### 1.1 Autopilot vs Trinova
Hay dos conceptos que NO se deben confundir:

| Concepto | Qué es |
|---|---|
| **Autopilot** | El producto SaaS multi-tenant que estamos construyendo |
| **Trinova** | La primera empresa cliente que usará Autopilot |

Autopilot está diseñado desde día 1 como multi-tenant, aunque inicialmente solo tendrá un workspace activo (Trinova). El sistema NUNCA debe acoplarse a Trinova — debe poder onboardear una segunda empresa cliente sin reescribir nada.

**Implicación técnica:** Todo dato sensible tiene `workspace_id`, todas las queries filtran por RLS, las credenciales de integraciones son por workspace.

### 1.2 Owner del proyecto
Lucas Torres es el CTO/Director de Tecnología de **Luciano Aquino Inversiones (LAI)**, una empresa inmobiliaria en República Dominicana especializada en propiedades de zonas turísticas y costeras. Autopilot es un proyecto que parte de las necesidades reales de LAI pero apunta al mercado latinoamericano.

Equipo de construcción inicial:
- **Lucas** — Arquitectura, decisiones técnicas, supervisión general
- **Javier** — Fullstack developer
- **Marlys** — AI y reportes (perfil más operacional)

### 1.3 Mercado objetivo
- **Geográfico:** República Dominicana primero, LATAM después (México, Colombia, Panamá, Costa Rica)
- **Vertical:** Empresas inmobiliarias y constructoras (no agentes individuales)
- **Tamaño:** Pymes a medianas (5-50 empleados, manejan 1-20 proyectos)
- **Diferenciador del mercado RD:** CONFOTUR (exenciones fiscales en zonas turísticas), foco en compradores extranjeros (dominicanos en el exterior, canadienses, europeos)

---

## 2. FILOSOFÍA DEL PRODUCTO

### 2.1 Los 5 principios que guían cada decisión

**1. IA nativa, no añadida**
Cada módulo debe tener IA pensada desde el diseño, no como feature opcional. Si una pantalla podría tener IA y no la tiene, eso es un bug.

**2. Lenguaje natural en todas partes**
Cualquier dato del sistema debe ser consultable conversacionalmente. Si necesitas un dashboard custom para responder una pregunta, falló el AI Query Layer.

**3. Automatización por defecto**
Si el sistema puede deducir un dato o accionar un proceso sin intervención humana, debe hacerlo. La intervención humana es la excepción, no la regla.

**4. WhatsApp como canal de comando**
El asesor LATAM vive en WhatsApp. El CRM debe poder operarse desde WhatsApp por completo — esto no es feature, es requisito.

**5. Multi-tenant desde día 1**
Cualquier diseño que dificulte añadir un segundo cliente es un error arquitectónico, no una optimización.

### 2.2 Diferenciadores no negociables vs competidores

| Diferenciador | Vs HubSpot/Salesforce | Vs GoHighLevel | Vs AlterEstate |
|---|---|---|---|
| **Vertical inmobiliario LATAM** | Genéricos no entienden CONFOTUR, ventas en USD, compradores extranjeros | Tampoco vertical | Sí pero sin IA potente |
| **IA en cada módulo** | Sí pero genérico | Sí pero limitado | Mínima |
| **WhatsApp CRM Agent** | No existe | No existe | No existe |
| **AI Query Layer** | Reportes preconstruidos | Reportes preconstruidos | Reportes preconstruidos |
| **Sincronización web ↔ CRM real-time** | N/A | Limitada | Sí pero estática |
| **Manejo de Obra integrado** | No | No | No |

---

## 3. DECISIONES DESCARTADAS (NO REABRIR)

Las siguientes opciones se evaluaron y se descartaron. Si Claude Code o algún miembro del equipo las propone de nuevo, recordar el rationale.

### 3.1 ❌ NestJS / Express como backend separado
**Por qué se descartó:** Next.js 14 con App Router + Server Actions cubre 95% de las necesidades. Añadir un backend separado duplica complejidad sin aportar valor. **Excepción válida:** servicios auxiliares como Evolution API (que ya viven en Railway).

### 3.2 ❌ MongoDB como BD principal
**Por qué se descartó:** Datos altamente relacionales (contactos ↔ deals ↔ unidades ↔ ventas ↔ pagos). PostgreSQL con Prisma da type-safety + integridad referencial + RLS nativo. MongoDB hubiera obligado a manejar consistencia en código.

### 3.3 ❌ Auth0 / Clerk / WorkOS
**Por qué se descartó:** Supabase Auth ya viene con la BD principal y soporta RLS nativamente. Añadir auth externo introduce sincronización innecesaria. **Si Supabase Auth se queda corto** (no escala, falta SSO empresarial) → reconsiderar para Fase 2.

### 3.4 ❌ App móvil nativa en Fase 1
**Por qué se descartó:** Triple costo (iOS + Android + web), tiempo de desarrollo, Apple Developer ($99/año) + Google Play ($25 una vez), proceso de aprobación lento. **Decisión Fase 1:** Web responsive optimizada. **Fase 2:** Expo/React Native si hay demanda real.

### 3.5 ❌ Stripe en Fase 1
**Por qué se descartó:** En Fase 1 solo hay 1 cliente (Trinova). Billing automatizado se justifica desde el cliente 3-5. **Fase 2:** Stripe con subscripciones multi-tenant y pago de comisiones.

### 3.6 ❌ Productividad, Gestión Interna, Portal Cliente, Página Web en Fase 1
**Por qué se postergaron:** Cada uno es un módulo del tamaño de un producto completo. Intentar construir 12 módulos al mismo tiempo garantiza no completar ninguno bien. **Decisión:** completar Fase 1 (CRM + Desarrollo Inmobiliario + Agentes IA + Automatizaciones + Integraciones + Configuración + Panel Agencia) con calidad antes de abrir Fase 2.

### 3.7 ❌ "Active Tags" como sistema de enrutamiento de agentes IA
**Por qué se descartó:** Es una abstracción artificial sobre datos reales. Los datos del contacto (proyecto, canal, etapa, campaña) ya describen el contexto sin necesidad de tags intermedias que el asesor tiene que mantener manualmente. **Decisión:** Sistema de reglas nativas con condiciones directas sobre datos del contacto, ordenadas por prioridad.

### 3.8 ❌ Bulk Actions en Negocios
**Por qué se descartó:** En el negocio inmobiliario las acciones masivas raramente aplican (cada deal tiene contexto único). Incluirlas invita errores costosos.

### 3.9 ❌ Asistente IA con función llamada "Autopilot" dentro del producto
**Por qué se descartó:** El producto se llama Autopilot. Llamar a una función interna también "Autopilot" causaría confusión perpetua. **Decisión:** Función IA interna = **IA Asistente**.

### 3.10 ❌ Probar agentes IA dentro de Autopilot
**Por qué se descartó:** Retell ya tiene un panel de testing maduro. Replicarlo es trabajo desperdiciado. **Decisión:** Botón "Abrir en Retell" para tests, el resto se configura en Autopilot.

### 3.11 ❌ Comprar números directamente en Retell
**Por qué se descartó:** Twilio ofrece más control, mejor precio, y los mismos números sirven para asesores humanos y agentes IA. **Decisión:** Todos los números se compran en Twilio, se importan a Retell vía configuración.

### 3.12 ❌ Tab "Plantillas de Contratos" en Configuración
**Por qué se descartó:** Las plantillas son contexto del flujo de contratos, no configuración global. **Decisión:** Tab "Plantillas" dentro del menú Contratos.

---

## 4. CONVENCIONES Y TERMINOLOGÍA

### 4.1 Nombres específicos del producto

| Nombre | Uso correcto | Uso incorrecto |
|---|---|---|
| **Autopilot** | El producto SaaS | No "Autopilot CRM", no "Autopilot Inmobiliario" |
| **IA Asistente** | La función IA en segundo plano | No "Autopilot AI", no "El Asistente" |
| **Trinova** | Primer cliente empresa | No es feature, no es producto |
| **Workspace** | Tenant/Empresa cliente | No "Cuenta", no "Tenant" en UI |
| **Asesor** | Vendedor inmobiliario | No "Agente" (se confunde con agente IA) |
| **Cliente** | Comprador de unidad | No "Customer" en UI español |
| **Agente IA** | Asistente conversacional automatizado | Diferente de agente IA humano |
| **Agencia** | Inmobiliaria externa aliada | No "Partner" |
| **Negocio** | Deal/Opportunity en español | No "Oportunidad" en UI |

### 4.2 Terminología inmobiliaria LATAM

| Término | Definición |
|---|---|
| **Hard Owner** | Define quién recibe % de comisión en una venta — Compañía o Asesor. Se configura por campaña/contacto |
| **CONFOTUR** | Ley dominicana de incentivo turístico que exime de impuestos a inmuebles en zonas turísticas declaradas |
| **RNC** | Registro Nacional del Contribuyente (DR) — equivalente a EIN en EE.UU. |
| **Reservación** | Pre-pago no vinculante para apartar una unidad (típicamente reembolsable) |
| **Promesa de Compraventa** | Contrato vinculante intermedio entre reservación y escritura definitiva |
| **Acta de Entrega** | Documento de transferencia formal de la unidad al comprador |
| **Punch List** | Lista de defectos menores a corregir post-entrega (término del construction industry) |
| **Plan de Pago** | Estructura financiera: Reservación + Inicial + Construcción (cuotas) + Final/Entrega |
| **Bloqueo** | Reserva temporal de unidad sin pago (típicamente 24-72h) mientras cliente evalúa |
| **Comisión** | Pago al asesor o agencia por venta cerrada — % variable según Hard Owner |

### 4.3 Estados con colores (consistencia visual)

Estos colores se aplican consistentemente en todo el sistema:

| Color | Significado general | Ejemplos de uso |
|---|---|---|
| 🟢 **Verde** | Estado exitoso / completado | Pagado, Disponible, Resuelto, Aprobado |
| 🔵 **Azul** | Estado activo / en proceso normal | Activa, Reservada, En proceso |
| 🟠 **Naranja** | Atención requerida / pronto a vencer | Pendiente, Próximo a vencer, Pago parcial |
| 🔴 **Rojo** | Crítico / vencido / fallido | Vencido, Crítico, Rechazado |
| 🟡 **Amarillo** | Bloqueo / espera | Bloqueada, En evaluación |
| 🟣 **Morado** | Especiales / escalado | Notariado, Escalado |
| ⚪ **Gris** | Inactivo / cancelado | Cancelado, Inactiva, Liberado |

---

## 5. STACK — RATIONALE DE CADA ELECCIÓN

### 5.1 Next.js 14 (App Router)
- **Por qué:** Server Components reducen JS al cliente, Server Actions eliminan boilerplate API, RSC streaming mejora performance percibida
- **Alternativa considerada:** Remix (no madurez del ecosistema), SvelteKit (curva de aprendizaje del equipo)

### 5.2 Supabase
- **Por qué:** PostgreSQL + Auth + Storage + Realtime + RLS nativo en un solo servicio. RLS multi-tenant es first-class
- **Alternativa considerada:** Neon + Clerk + S3 + Pusher (más complejo, más facturas, más superficie de mantenimiento)

### 5.3 ClickHouse
- **Por qué:** Queries analíticas en PostgreSQL se vuelven lentas con millones de eventos. ClickHouse es columnar y agrega 10-100x más rápido para queries OLAP
- **Cuándo se justifica:** Desde día 1 — el AI Query Layer hará agregaciones constantes
- **Alternativa considerada:** TimescaleDB (extensión de Postgres, más simple pero menos performant a escala)

### 5.4 Prisma ORM
- **Por qué:** Type-safety entre BD y código TypeScript, migraciones limpias, schema legible, soporte nativo de Supabase
- **Alternativa considerada:** Drizzle (más nuevo, menos ecosistema), raw SQL (sin type-safety)

### 5.5 Anthropic Claude API
- **Por qué:** Mejor modelo para Function Calling en español, sentido común para edge cases inmobiliarios, Function Calling con muchos tools complejos
- **Alternativa considerada:** OpenAI GPT-4 (más caro), Gemini (Function Calling menos consistente en español)

### 5.6 OpenAI Embeddings (text-embedding-3-small)
- **Por qué:** Calidad/costo óptima para embeddings en español, integración madura con Pinecone
- **Alternativa considerada:** Voyage AI (calidad similar pero más caro), embeddings de Cohere

### 5.7 Pinecone
- **Por qué:** Vector DB managed, hybrid search nativo (semántico + keywords), metadata filtering robusto
- **Alternativa considerada:** Supabase pgvector (limitaciones con hybrid search y metadata filtering complejos), Weaviate (más complejidad operacional)

### 5.8 Retell AI
- **Por qué:** Mejor latencia para voz conversacional en español, Function Calling real-time, infra madura
- **Alternativa considerada:** Vapi (similar pero menos maduro), build propio (3x costo en tiempo)
- **Historia:** Antes se usaba Assistable, se migró a Retell por mejor performance y costo

### 5.9 ElevenLabs
- **Por qué:** Voces en español natural, baja latencia (Flash v2.5), clonación de voz para futuras features
- **Alternativa considerada:** OpenAI TTS (voces menos naturales), Azure Speech (calidad sí, costo no)

### 5.10 Twilio
- **Por qué:** Estándar de la industria, mejor coverage en RD y LATAM, Number Pools para outbound de IA
- **Alternativa considerada:** Vonage (menos coverage RD), Plivo (más barato pero menos features)

### 5.11 Evolution API + Meta Business API (dual WhatsApp)
- **Por qué:** Cada uno tiene su caso de uso:
  - **Evolution API** → WhatsApp personal de asesores (sin templates, conversación natural)
  - **Meta Business API** → Número oficial de la empresa con templates (notificaciones masivas)
- **Alternativa considerada:** WhatsApp Cloud API solo (limita la conversación libre saliente)

### 5.12 Tailwind + shadcn/ui
- **Por qué:** shadcn/ui da componentes hermosos copy-paste (no dependencia), Tailwind no requiere CSS files, productividad altísima
- **Alternativa considerada:** Material UI (visualmente genérico), Chakra (menos personalizable)

### 5.13 Vercel
- **Por qué:** Optimizado para Next.js, deploys instantáneos, preview deployments para branches, Edge functions
- **Alternativa considerada:** Railway (donde corren servicios auxiliares como Evolution API), AWS Amplify (más complejo)

### 5.14 Web responsive (no app nativa) en Fase 1
- **Por qué:** Costo de oportunidad. Construir 3 plataformas en paralelo retrasa todo. Web responsive cubre 95% de casos
- **Cuándo Fase 2:** Cuando haya >100 asesores activos y demanda real de push notifications nativas, cámara directa, geofencing

---

## 6. ECONOMICS DEL PROYECTO

### 6.1 Costos operativos mensuales (Fase 1)

```
Nómina equipo (Lucas + Javier)     $1,500
Claude Code para todos                $200
Google AI Pro (2 users)                $40
Supabase                          $25-75
Vercel                            $40-60
ClickHouse                       $100-300
Upstash Redis                     $20-50
Pinecone                         $50-100
Railway                           $15-30
GitHub                                $12
Anthropic Claude API             $300-800
OpenAI embeddings                 $10-30
Retell AI                       $100-500
ElevenLabs                            $99
Twilio                          $110-270
WhatsApp Meta API                  $0-50
Evolution API                      $15-20
Resend                            $20-50
Stripe                          (Fase 2)
Dominio                              $1.25
TOTAL                      $2,657-4,487/mes
```

### 6.2 Implementación (5 meses, una vez)
```
Total inversión:           $11,420-12,820
```

### 6.3 Punto de equilibrio
- **Precio sugerido por cliente:** $500/mes
- **Break-even:** 6-9 clientes activos
- **Margen una vez en break-even:** ~70-80% (costos marginales por cliente son bajos gracias a multi-tenant)

### 6.4 Implicación para decisiones técnicas
Cada decisión técnica debe pensarse en términos de costo marginal por cliente. Una decisión que escala linealmente con clientes (ej: pagar por cada workspace en un servicio externo) es peor que una que escala sub-linealmente (ej: BD compartida con RLS).

---

## 7. HARD CONSTRAINTS DEL PROYECTO

### 7.1 Constraints de Fase 1 (no negociables)

| Constraint | Razón |
|---|---|
| **Multi-tenant desde día 1** | Reescribir RLS después es 10x más caro |
| **Solo 8 módulos en Fase 1** | CRM + Desarrollo Inmobiliario + IA + Automatizaciones + Integraciones + Configuración + Panel Agencia (no más) |
| **Web responsive, no app nativa** | Triple costo, triple deploy, no es prioridad |
| **Solo Trinova como cliente activo** | Validar producto antes de salir al mercado |
| **WhatsApp CRM Agent debe funcionar** | Es el diferenciador #1, no es opcional |
| **AI Query Layer en todos los módulos** | Diferenciador estructural |
| **Audit logs en todas las acciones** | Compliance + debugging |
| **Soft deletes para entidades críticas** | Recuperabilidad |

### 7.2 Constraints de equipo

| Constraint | Implicación |
|---|---|
| **Solo 2-3 personas full-time codeando** | Decisiones simples gana sobre arquitectura elegante |
| **Lucas también supervisa GHL operations actuales** | No bloquear con dependencias externas innecesarias |
| **Javier es fullstack pero junior-mid** | Stack debe ser learnable, no esotérico |
| **Marlys es más operacional que técnica** | UI debe ser usable sin training extenso |

### 7.3 Constraints de timeline

| Hito | Timeline objetivo |
|---|---|
| Fase 1A (Fundación) | Mes 1 |
| Fase 1B-D (CRM Core + Avanzado + Integraciones) | Mes 2-3 |
| Fase 1E-F (IA + Automatizaciones) | Mes 3-4 |
| Fase 1G-H (Desarrollo Inmobiliario + Manejo de Obra) | Mes 4-5 |
| Fase 1I-J (Panel Agencia + Pulido) | Mes 5 |
| **Trinova en producción** | **Mes 5** |

---

## 8. PRÓXIMOS PASOS ESPERADOS

### 8.1 Inmediato (esta semana)
1. Setup del proyecto Next.js + Prisma + Supabase
2. Aplicar el schema completo (documento 2) como primera migración
3. Configurar RLS en todas las tablas
4. Crear primer workspace de Trinova
5. Crear primer Super Admin (Lucas)

### 8.2 Corto plazo (mes 1)
1. Auth + Onboarding del Admin funcionando
2. CRUD básico de contactos
3. Pipeline visual con Kanban
4. Primera integración: Twilio para llamadas

### 8.3 Mediano plazo (mes 2-3)
1. Conversaciones unificadas
2. Calendarios + Google Calendar sync
3. WhatsApp (Evolution API + Meta)
4. Primer agente IA con Retell

### 8.4 Validaciones críticas tempranas
Antes de avanzar a Fase 1G (Desarrollo Inmobiliario), validar:
1. ✅ RLS funciona — un usuario del workspace A no ve datos del workspace B
2. ✅ WhatsApp CRM Agent puede crear un contacto desde texto natural
3. ✅ Agente IA de voz hace una llamada de prueba y genera AiCall con eventos estructurados
4. ✅ Automatización simple (trigger → acción) funciona end-to-end
5. ✅ Hybrid search en Pinecone devuelve resultados relevantes

---

## 9. PRINCIPIOS DE INGENIERÍA

### 9.1 Reglas que aplican a TODO el código

1. **Server-first** — Componentes server por defecto, client solo donde necesario
2. **Type-safety end-to-end** — Prisma → TypeScript → Zod en boundaries → React
3. **Workspace_id es sagrado** — Toda query lo incluye, todo input lo valida
4. **Idempotencia donde aplique** — Webhooks, jobs, automatizaciones
5. **Fail loud, fail fast** — Errors deben propagar, no esconderse
6. **Logs estructurados** — JSON con contexto, no `console.log`
7. **Tests para lógica crítica** — Cascada de venta, recordatorios cobros, comisiones
8. **Optimistic UI cuando aplique** — Mejor UX en operaciones lentas
9. **Server Actions sobre API routes** — Excepto cuando necesitas un endpoint público
10. **Edge runtime cuando posible** — Menor latencia, mejor costo

### 9.2 Anti-patterns a evitar

| Anti-pattern | Por qué evitarlo |
|---|---|
| Lógica de negocio en componentes | Difícil de testear, no reusable |
| useEffect para fetch | Usar React Query o RSC |
| Polling para tiempo real | Usar Supabase Realtime |
| Strings mágicos | Constantes con `as const` o enums |
| `any` en TypeScript | Si no sabes el tipo, usa `unknown` |
| Console.log en producción | Logger estructurado siempre |
| Try/catch silenciosos | Capturar es ok, ignorar no |
| Migraciones manuales SQL | Prisma migrate siempre |

---

## 10. CÓMO COMUNICARSE CON CLAUDE CODE

### 10.1 Reglas de comunicación durante desarrollo

1. **Una tarea a la vez** — "Construye el CRUD de contactos" no "Construye el CRM"
2. **Plan Mode primero en módulos nuevos** — Shift+Tab antes de codear
3. **Acepta los planes antes de ejecutar** — No dejes que asuma
4. **Pide commits pequeños** — "Commitea esto y luego seguimos"
5. **Si Claude duda, escala al PRD** — "Revisa la sección X del documento Y"
6. **Cuando algo no esté especificado:** Lucas decide, no Claude Code

### 10.2 Comandos slash sugeridos

- `/module-start [nombre]` — Cargar contexto del módulo
- `/prd-check [feature]` — Verificar especificación contra PRD
- `/schema-validate` — Validar que cambios respetan multi-tenant
- `/decision [tema]` — Documentar decisión en `.claude/memory/decisions.md`
- `/test-cascade` — Testear cascadas (venta, cobros, comisiones)
- `/audit` — Verificar audit logs de la última acción

### 10.3 Subagents a usar

| Subagent | Cuándo |
|---|---|
| `multi-tenant-auditor` | Antes de mergear cualquier feature que toque BD |
| `prisma-architect` | Cualquier cambio al schema |
| `crm-builder` | Trabajo en módulo CRM |
| `di-builder` | Trabajo en Desarrollo Inmobiliario |
| `ai-integrator` | Cualquier feature con Claude API, Retell, OpenAI |
| `qa-engineer` | Antes de marcar feature como completo |
| `ui-builder` | Componentes nuevos shadcn + Tailwind |

---

## 11. GLOSARIO DE SISTEMAS EXISTENTES (CONTEXTO PREVIO)

Lucas viene operando un stack con varias herramientas que Autopilot va a reemplazar o integrar. Para entender el "por qué" de algunas decisiones, conviene conocer este contexto:

| Sistema | Rol actual | Relación con Autopilot |
|---|---|---|
| **GoHighLevel (GHL)** | CRM principal de LAI hoy | Autopilot lo reemplaza completamente |
| **n8n** | Automatizaciones actuales | Autopilot tendrá automatizaciones nativas |
| **Retell AI** | Agentes de voz IA | Autopilot integra y orquesta Retell |
| **AlterEstate** | Inventario inmobiliario + red | Autopilot embebe la red inmobiliaria (iframe) |
| **Pinecone + OpenAI** | Knowledge base de agentes | Autopilot usa el mismo stack |
| **Railway** | Infraestructura para Evolution API | Sigue siendo el host de Evolution API |
| **Supabase + Next.js** | Apps custom previas | Stack ya conocido por el equipo |

### Migración desde GHL
Trinova ya tiene 274 contactos reales que se migraron de HubSpot a GHL. Esos contactos eventualmente migrarán a Autopilot. El sistema debe:
- Soportar bulk import desde CSV (existe en PRD)
- Mantener IDs externos para reconciliación
- Permitir mapeo flexible de campos

---

## 12. CIERRE — PRINCIPIOS NO NEGOCIABLES

Si en algún momento durante el desarrollo Claude Code o el equipo está dudando, recordar estos 7 principios fundacionales:

1. **El sistema debe sentirse como una sola IA orquestando todo**, no como 15 features sueltas con IA pegada
2. **WhatsApp es el canal de comando del LATAM**, no email, no app
3. **El asesor humano y el agente IA son colaboradores**, no reemplazo. El humano tiene killswitch siempre
4. **Multi-tenant no es feature, es arquitectura**. Toda decisión lo respeta
5. **El inmobiliario en LATAM tiene reglas únicas** (CONFOTUR, compradores extranjeros, ventas en USD, planes de pago largos). El sistema debe modelar eso nativamente
6. **Velocidad de ejecución > elegancia arquitectónica**. Trinova en producción en 5 meses, no en 18
7. **Lucas decide lo que el PRD no especifica**. Cuando hay duda, escalar a Lucas, no inventar

---

**Fin del Documento 4 — Contexto y Decisiones**

---

## RESUMEN DE LOS 4 DOCUMENTOS

| # | Documento | Pregunta que responde |
|---|---|---|
| 1 | **PRD General** | ¿Qué construir? |
| 2 | **Schema de Datos (.prisma)** | ¿Cómo estructurar los datos? |
| 3 | **Reglas de Negocio** | ¿Cómo se debe comportar? |
| 4 | **Contexto y Decisiones** | ¿Por qué se decidió así? |

Los 4 documentos juntos son el contrato técnico completo para construir Autopilot — Fase 1.
