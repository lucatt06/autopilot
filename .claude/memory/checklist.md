# Autopilot — Checklist de Detalles No Negociables

> Extraído de los 4 documentos en `docs/`. Verificar al final de cada fase.
> NUNCA marcar una fase como DONE sin que todos los ítems aplicables estén ✅.

---

## 🔐 Reglas globales del sistema

- [ ] **100 resultados por defecto** en TODA lista del sistema
- [ ] **Audit Log** en cada acción: create, update, delete, login, logout, impersonation_started/ended, password_changed, role_changed, status_changed
- [ ] **Audit Log con before/after** en updates
- [ ] **Audit Logs no se borran**, solo se consultan
- [ ] **Soft deletes** en: Contact, Deal, Project, Unit, Customer (retención 30 días, cleanup job semanal)
- [ ] **UTC en BD, render en timezone del usuario** (default workspace: America/Santo_Domingo)
- [ ] **Cliente puede solicitar export JSON + eliminación permanente** (GDPR)

## 🎨 Convenciones de UI / lenguaje

**Términos en UI (español):**
- "Workspace" en código; **NO "Cuenta", NO "Tenant"** en UI
- "Asesor" no "Agente"
- "Cliente" no "Customer"
- "Negocio" no "Oportunidad"
- "Agencia" no "Partner"
- "IA Asistente" (NO "Autopilot AI", NO "Asistente")
- "Round Robin" se renombra → **"Campaña"**

**Colores consistentes (Doc 4 §4.3):**
- 🟢 Verde → éxito/completado
- 🔵 Azul → activo/en proceso
- 🟠 Naranja → atención requerida
- 🔴 Rojo → crítico/vencido
- 🟡 Amarillo → bloqueo/espera
- 🟣 Morado → especiales (Notariado, Escalado)
- ⚪ Gris → inactivo/cancelado

## 👥 Roles + permisos

3 matrices completas (Doc 1 §4):
- CRM: 14 permisos × 4 roles
- Desarrollo Inmobiliario: 19 permisos × 4 roles
- Configuración: 8 permisos × 4 roles

Casos especiales:
- Asesor solo ve sus contactos/conversaciones/campañas/comisiones
- Cliente ve solo su unidad/plan/avance de obra
- Admin puede otorgar `canImpersonate` a no-admin
- Super Admin tiene bypass en RLS

## 📞 Mensajes y conversaciones

- [ ] Inbound canal desconocido → buscar por teléfono/email → si no existe, crear contacto mínimo
- [ ] Conversación entrante marca `unread`
- [ ] Asesor elige canal respuesta (default = canal último mensaje)
- [ ] **Killswitch IA** por contacto: ningún agente responde
- [ ] **pauseOnHumanReply**: asesor manual → agente pausa 24h
- [ ] **Programar mensajes** (`scheduledFor`): worker cada minuto; **DND activado → cancelar**
- [ ] **Timeline mixta** (mensajes + eventos CRM + grabaciones inline)
- [ ] **Internal Comment** como canal especial (cliente no ve)

## 👤 Contactos

- [ ] Detección duplicados (email/teléfono) + opción merge
- [ ] **Compartir contacto**: receptor → Owner, original → Follower
- [ ] **Customer ↔ Contact CRM = MISMO registro** (no duplicar)
- [ ] **Score IA Asistente 0-100** recalculado en tiempo real
- [ ] **5 booleans DND**: dndAll, dndCalls, dndSms, dndEmail, dndIncoming
- [ ] Smart Lists personalizadas
- [ ] Bulk Import CSV + IDs externos + mapeo flexible
- [ ] **Tab 7 panel derecho = Plan de Pago** (si tiene venta)
- [ ] Client Portal toggle por contacto
- [ ] Hard Owner: Compañía o Asesor

## 💼 Negocios

- [ ] **NO Bulk Actions** (descartado Doc 4 §3.8)
- [ ] **Colores Kanban según tarea más urgente**:
  - Sin pending → Gris
  - Todas pending > hoy+1 día → Verde
  - Alguna pending = hoy → Amarillo
  - Alguna pending < hoy → Rojo
- [ ] Badge azul de cita si próxima
- [ ] Múltiples deals por contacto (primary = más reciente)
- [ ] Cierre perdido: motivo OBLIGATORIO

## 📅 Citas

- [ ] 24h antes → WhatsApp al cliente
- [ ] 30 min antes → notif in-app al asesor
- [ ] Cliente "sí" al recordatorio → CONFIRMED
- [ ] Virtual → Google Meet auto-link
- [ ] Sin Google → enlace genérico Meet
- [ ] Sync Google bidireccional (5 min + webhook)

## ✅ Tareas

- [ ] Al completar → modal automático nueva tarea con mismo contacto
- [ ] Job cada hora actualiza estado visual de vencidas
- [ ] **Nombre completo del asignado** (NO iniciales)
- [ ] Hasta 10 contactos vinculados
- [ ] Tareas recurrentes (cron-like)

## 📣 Campañas

- [ ] Round Robin: asesor inactivo → saltar; todos inactivos → admin
- [ ] Hard Owner configurado en wizard de automatización
- [ ] Asesor ve solo campañas en las que está incluido
- [ ] Vista: **"Activas"** + **"Pasadas"** (sin "Ver Todos")
- [ ] Sin "Meta de Negocios"

## 🤖 Agentes IA

- [ ] Sync bidireccional con Retell
- [ ] **Function Calling real-time** (no solo webhooks): consultarDisponibilidad, agendarCita, crearContacto, consultarPlanPago, enviarBrochure, transferirAHumano
- [ ] Tests vía botón "Abrir en Retell" (NO replicar panel)
- [ ] Templates: default Retell + propios empresa
- [ ] Modelos: Haiku, Sonnet, Opus
- [ ] **Numbers importados de Twilio** (NUNCA Retell)
- [ ] **Pools**: agentes comparten 1 número outbound
- [ ] Widgets chat embebibles
- [ ] **Enrutamiento por reglas nativas** (NO Active Tags)
- [ ] **Hybrid search obligatorio** + **metadata filtering por proyecto obligatorio**
- [ ] **8 eventos estructurados** por interacción IA
- [ ] Auto Follow-Up automatización

## 📱 WhatsApp CRM Agent — flujo de 11 pasos

```
1. Mensaje al número del CRM
2. Identificar usuario por teléfono → permisos
3. Voz → Whisper transcribe
4. Imagen → Claude Vision procesa
5. Claude con Function Calling interpreta
6. Generar plan
7. Enviar: resumen + "¿Confirmas? sí/no"
8. Esperar
9. "sí" → ejecutar + reportar "2 ✅ / 0 ❌"
10. "no" → cancelar
11. Sin respuesta en 5 min → cancelar
```

Procesamiento especial:
- Tarjeta de presentación → crear contacto
- Comprobante de pago → vincular + registrar cobro
- Captura conversación → analizar + nota

## 🔄 Cascada de venta (TRANSACCIÓN ATÓMICA — 12 pasos)

```
1. Crear Sale (status=active)
2. Unit.status = VENDIDA
3. Buscar PaymentPlanTemplate del proyecto
4. Crear PaymentPlan con cuotas
5. Generar PaymentInstallments según periodicidad
6. Calcular Commission (4 ramas if/else)
7. Crear Customer (vinculado a contactId)
8. Si reserva → reservation.status = CONVERTED_TO_SALE
9. CRM: contact.currentStageId = stage where isWon=true
10. ContactEvent: "Venta cerrada"
11. Customer.portalEnabled = true
12. Notification al admin
```

**Test E2E obligatorio.**

## 💰 Cobros — estados

- `received === expected` → PAID
- `0 < received < expected` → PARTIAL
- `received === 0 && now < dueDate` → PENDING
- `received === 0 && now > dueDate` → OVERDUE

**Recordatorios:**
- 3 días antes → WhatsApp + Email
- Día del vencimiento → WhatsApp + Email
- Vencido → cambiar OVERDUE + notif admin + asesor

**IA Asistente morosidad:** patrón histórico + alerta "alto riesgo"

## 🏗️ Manejo de Obra

- [ ] Avance Obra: **mínimo 1 foto**
- [ ] `visibleToCustomers=true` → clientes ven en portal
- [ ] Stream cámara vivo público si activado
- [ ] **Acta Entrega: mínimo 5 fotos + lecturas medidores + cantidad llaves + AMBAS firmas obligatorias**
- [ ] Garantías: SOLO sobre ENTREGADAS + foto antes Y después + ALTA = deadline 24h
- [ ] Punch List: cada item resuelto requiere foto del "después"
- [ ] Inspecciones APPROVED_WITH_OBSERVATIONS → items automáticos en Punch List
- [ ] Inspecciones REJECTED + requiresReinspection → nueva inspección
- [ ] Inbox Proveedores: SIN agentes IA, SIN automatizaciones
- [ ] SupplierPayment con budgetItemId → actualiza executedAmount
- [ ] Presupuesto: <80% IN_BUDGET, 80-100% NEAR_LIMIT, >100% OVER_BUDGET
- [ ] Cronograma: now > plannedEndDate + IN_PROGRESS → DELAYED

## 📄 Contratos — 22 variables exactas

`{{nombre_cliente}}, {{apellido_cliente}}, {{cedula_cliente}}, {{nacionalidad_cliente}}, {{email_cliente}}, {{telefono_cliente}}, {{nombre_unidad}}, {{tipo_unidad}}, {{piso}}, {{metraje}}, {{precio_venta}}, {{precio_letras}}, {{nombre_proyecto}}, {{direccion_proyecto}}, {{nombre_empresa}}, {{rnc_empresa}}, {{fecha_contrato}}, {{fecha_entrega}}, {{monto_reserva}}, {{monto_inicial}}, {{monto_construccion}}, {{monto_entrega}}, {{nombre_asesor}}, {{nombre_agencia}}`

- [ ] Tab Plantillas **dentro de Contratos** (no en Configuración)
- [ ] 1 plantilla activa por tipo
- [ ] Generar PDF + previsualización + ajuste manual
- [ ] Firma digital: email + WhatsApp + canvas en teléfono + incrustar en PDF

## 🔌 Integraciones

- [ ] Twilio: 1 número : 1 asesor + pools + grabación + Whisper post-call
- [ ] Evolution API: instancia por asesor + QR + Whisper + Claude Vision + sesión caída notif
- [ ] Meta Business API: SOLO número CRM + templates aprobados saliente
- [ ] AlterEstate: iframe `app.alterestate.com/trexo` + auto-login + AES-256
- [ ] Google Calendar: OAuth, refresh, sync 5min + webhook
- [ ] Retell: sync vía API, llamadas Retell, datos en AiCall

## 🔒 Seguridad — números exactos

- [ ] Passwords: bcrypt o argon2
- [ ] Credenciales: AES-256 at rest
- [ ] TLS 1.3
- [ ] Rate limits: API 100/min, Login 5/15min, Webhooks 1000/min
- [ ] Sesión: 30 días con "Recordarme", 24h sin
- [ ] Snapshots diarios, retención 30 días, cross-region
- [ ] Activation link: 7 días
- [ ] Password reset: 1 hora

## ⚡ Performance — TTLs

- [ ] Sesiones, Permisos (5 min), Métricas dashboard (1 min), KB (1 hora)

**Background Jobs:**
- Recordatorios cobro → diario 8 AM
- Recordatorios cita → cada hora
- Vencimiento bloqueos/reservas → cada hora
- Cleanup soft deletes >30d → semanal
- Sync Google respaldo → cada 6h
- Replicación ClickHouse → streaming tiempo real

**BD:** índices FK + workspaceId + compuestos + particionamiento >10M filas

## 🔍 AI Query Layer

- [ ] **MCP Server propio** para Claude Desktop (tools por entidad, respeta permisos)
- [ ] **Chat IA in-app** en dashboards
- [ ] **ClickHouse streaming** tiempo real
- [ ] **REGLA ABSOLUTA**: TODO consultable en lenguaje natural

## 🎛️ Funciones transversales CRM

- [ ] Centro notificaciones (bell, real-time, filtrable, push)
- [ ] @mention en notas
- [ ] Búsqueda global Cmd+K en tiempo real
- [ ] Programar mensajes
- [ ] Repositorio global documentos
- [ ] Impersonalización + banner permanente + Audit Log

## 🏢 Panel de Agencia

- [ ] Dashboard global métricas consolidadas
- [ ] Crear/eliminar empresas
- [ ] Habilitar/deshabilitar módulos por workspace (`enabledModules: String[]`)
- [ ] Impersonalizar cualquier workspace
- [ ] White-label: logo, primaryColor, customDomain

## 📥 Migración Trinova

- [ ] 274 contactos en GHL/HubSpot
- [ ] Bulk import CSV + detección duplicados
- [ ] Mantener IDs externos para reconciliación
- [ ] Mapeo flexible de campos

## 🧪 Validaciones críticas tempranas (Doc 4 §8.4)

Antes de avanzar a Fase 1G:
1. ✅ RLS — workspace A NO ve B
2. ✅ WhatsApp CRM Agent crea contacto desde texto natural
3. ✅ Agente IA de voz hace llamada de prueba + AiCall con eventos
4. ✅ Automatización simple end-to-end
5. ✅ Hybrid search Pinecone resultados relevantes

## 🚫 NO REABRIR (Doc 4 §3) — 12 decisiones descartadas

1. ❌ NestJS/Express backend separado
2. ❌ MongoDB
3. ❌ Auth0/Clerk/WorkOS
4. ❌ App móvil nativa en Fase 1
5. ❌ Stripe en Fase 1
6. ❌ Productividad/Gestión/Portal/Web en Fase 1
7. ❌ "Active Tags" para enrutamiento IA
8. ❌ Bulk Actions en Negocios
9. ❌ Función IA llamada "Autopilot" (es "IA Asistente")
10. ❌ Probar agentes IA dentro de Autopilot (usar Retell)
11. ❌ Comprar números en Retell (usar Twilio)
12. ❌ Plantillas en Configuración (van en Contratos)

## 🎯 7 principios no negociables (Doc 4 §12)

1. Sistema = una sola IA orquestando todo
2. WhatsApp = canal de comando LATAM
3. Humano + IA = colaboradores (killswitch siempre)
4. Multi-tenant = arquitectura, no feature
5. Inmobiliario LATAM tiene reglas únicas (CONFOTUR, USD, planes largos)
6. Velocidad > elegancia (5 meses, no 18)
7. Lucas decide lo no especificado
