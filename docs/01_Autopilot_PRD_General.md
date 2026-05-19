# 📋 AUTOPILOT — PRD General

**Documento 1 de 3**
Plataforma SaaS de Gestión Inmobiliaria con IA Nativa

---

## 1. VISIÓN DEL PRODUCTO

**Autopilot** es una plataforma SaaS todo-en-uno diseñada específicamente para empresas inmobiliarias y constructoras del mercado latinoamericano. Reemplaza más de 10 herramientas separadas (CRM, telefonía, WhatsApp, automatizaciones, gestión de proyectos inmobiliarios, página web, contratos, cobros) en un único sistema potenciado con Inteligencia Artificial nativa en cada módulo.

**Tagline:** *"Tu negocio inmobiliario en piloto automático."*

**Primera empresa cliente:** Trinova (sistema diseñado multi-tenant desde el inicio, escalable a múltiples empresas en el futuro).

### Diferenciadores clave
1. **IA nativa con acceso real-time a datos del CRM** — agentes que conocen el historial completo de cada cliente
2. **Manejo del negocio por WhatsApp** — los asesores pueden gestionar el CRM completo escribiendo o hablando por WhatsApp
3. **Sincronización automática total** — la disponibilidad de unidades se actualiza en toda la plataforma incluyendo la página web sin intervención manual
4. **IA Asistente** — sistema de IA en segundo plano que analiza toda la actividad y sugiere acciones proactivamente
5. **Consultas en lenguaje natural** — cualquier dato del sistema es consultable como conversación

---

## 2. STACK TECNOLÓGICO

| Componente | Tecnología | Razón |
|---|---|---|
| Frontend | Next.js 14 (App Router) | SSR, performance, ecosistema |
| Base de datos principal | Supabase (PostgreSQL + Auth + RLS) | Multi-tenant con Row-Level Security nativa |
| Analytics DB | ClickHouse | Queries analíticas en tiempo real |
| Cache y colas | Upstash Redis | Serverless, pay-as-you-go |
| ORM | Prisma | Type-safety, migraciones |
| IA principal | Anthropic Claude API | Agentes, IA Asistente, Function Calling |
| Embeddings | OpenAI text-embedding-3-small | Knowledge base de agentes IA |
| Vector DB | Pinecone | Búsqueda semántica de knowledge bases |
| Email transaccional | Resend | Simple, moderno, confiable |
| Pagos (Fase 2) | Stripe | Subscripciones multi-tenant |
| Deploy | Vercel | Optimizado para Next.js |
| Telefonía | Twilio | Voz, SMS, números, softphone |
| WhatsApp | Evolution API + Meta Business API | WhatsApp personal + oficial |
| Voz IA | Retell AI + ElevenLabs | Agentes de voz natural |
| UI | Tailwind + shadcn/ui | Componentes y diseño rápido |
| Móvil | Web responsive optimizada | Fase 1; nativa con Expo/React Native en Fase 2 |
| Backend deploy | Railway | Para servicios auxiliares (Evolution API) |

---

## 3. ARQUITECTURA MULTI-TENANT

### Estructura
- **Workspaces** son el límite de tenant — cada empresa cliente tiene su propio workspace
- **Row-Level Security (RLS)** en Supabase asegura que las consultas solo devuelvan datos del workspace del usuario
- Cada tabla con datos sensibles tiene una columna `workspace_id`
- Las políticas de RLS validan el `workspace_id` en cada query
- El **Super Admin** (Lucas) puede ver/operar todos los workspaces vía bypass especial

### Aislamiento de datos
- Los datos de Trinova nunca son visibles para futuras empresas
- Las integraciones (Twilio, Evolution, Retell) tienen credenciales por workspace
- Los archivos en Supabase Storage se organizan por workspace
- Los webhooks entrantes se enrutan por workspace según subdomain o API key

---

## 4. ROLES Y PERMISOS

### 4 Roles del sistema

| Rol | Descripción | Alcance |
|---|---|---|
| **Super Admin** | Lucas Torres / equipo dueño de Autopilot | Todos los workspaces |
| **Admin** | Gerente de cada empresa cliente | Su workspace completo |
| **Asesor** | Vendedor/agente de ventas | Sus contactos, sus métricas |
| **Cliente** | Comprador con acceso al portal | Solo su unidad, su plan de pago |

### Matriz de permisos — CRM

| Función | Super Admin | Admin | Asesor | Cliente |
|---|---|---|---|---|
| Ver todos los contactos | ✅ | ✅ | ❌ (solo los suyos) | ❌ |
| Crear contactos | ✅ | ✅ | ✅ | ❌ |
| Editar cualquier contacto | ✅ | ✅ | ❌ (solo los suyos) | ❌ |
| Eliminar contactos | ✅ | ✅ | ❌ | ❌ |
| Ver todas las conversaciones | ✅ | ✅ | ❌ (solo las suyas) | ❌ |
| Mover contacto de etapa | ✅ | ✅ | ✅ | ❌ |
| Crear/editar pipelines | ✅ | ✅ | ❌ | ❌ |
| Ver campañas | ✅ | ✅ | ✅ (solo las suyas) | ❌ |
| Crear campañas | ✅ | ✅ | ❌ | ❌ |
| Gestionar agentes IA | ✅ | ✅ | ❌ | ❌ |
| Gestionar automatizaciones | ✅ | ✅ | ❌ | ❌ |
| Ver reportes globales | ✅ | ✅ | ❌ (solo los suyos) | ❌ |
| Impersonalizar usuarios | ✅ | ✅ | ❌ | ❌ |
| Configuración de la empresa | ✅ | ✅ | ❌ | ❌ |

### Matriz de permisos — Desarrollo Inmobiliario

| Función | Super Admin | Admin | Asesor | Cliente |
|---|---|---|---|---|
| Ver todos los proyectos | ✅ | ✅ | ✅ | ❌ |
| Crear/editar proyectos | ✅ | ✅ | ❌ | ❌ |
| Ver disponibilidad | ✅ | ✅ | ✅ | ✅ (solo su unidad) |
| Crear/editar unidades | ✅ | ✅ | ❌ | ❌ |
| Crear bloqueos | ✅ | ✅ | ✅ | ❌ |
| Eliminar bloqueos | ✅ | ✅ | ❌ | ❌ |
| Crear reservas | ✅ | ✅ | ✅ | ❌ |
| Aprobar reservas | ✅ | ✅ | ❌ | ❌ |
| Crear ventas | ✅ | ✅ | ✅ | ❌ |
| Aprobar ventas | ✅ | ✅ | ❌ | ❌ |
| Ver cobros globales | ✅ | ✅ | ❌ (solo los suyos) | ❌ |
| Registrar cobros | ✅ | ✅ | ✅ | ❌ |
| Ver/crear contratos | ✅ | ✅ | ✅ | ✅ (solo los suyos) |
| Aprobar comisiones | ✅ | ✅ | ❌ | ❌ |
| Ver comisiones | ✅ | ✅ | ✅ (solo las suyas) | ❌ |
| Gestionar agencias | ✅ | ✅ | ❌ | ❌ |
| Gestionar staff | ✅ | ✅ | ❌ | ❌ |
| Ver/crear órdenes de obra | ✅ | ✅ | ❌ | ❌ |
| Ver avance de obra | ✅ | ✅ | ✅ | ✅ |
| Ver/editar reportes | ✅ | ✅ | ❌ (solo los suyos) | ❌ |

### Matriz de permisos — Configuración

| Función | Super Admin | Admin | Asesor | Cliente |
|---|---|---|---|---|
| Configuración de la empresa | ✅ | ✅ | ❌ | ❌ |
| Gestionar usuarios | ✅ | ✅ | ❌ | ❌ |
| Gestionar roles y permisos | ✅ | ✅ | ❌ | ❌ |
| Gestionar integraciones | ✅ | ✅ | ❌ | ❌ |
| Ver/editar su perfil | ✅ | ✅ | ✅ | ✅ |
| Conectar Google Calendar | ✅ | ✅ | ✅ | ❌ |
| Conectar sus integraciones | ✅ | ✅ | ✅ | ❌ |
| Ver su WhatsApp/QR | ✅ | ✅ | ✅ | ❌ |

### Panel de Agencia (Super Admin)
- Ver todas las empresas del sistema
- Crear/eliminar empresas
- Habilitar/deshabilitar módulos por empresa
- Impersonalizar cualquier workspace
- Analytics consolidados

---

## 5. AUTH Y ONBOARDING

### Login
- Email + contraseña
- Continuar con Google (OAuth)
- ¿Olvidaste tu contraseña? → email de recuperación
- Sesión persistente con opción "Recordarme"

### Primer acceso de un usuario nuevo (creado por Admin)
1. Admin crea usuario desde Configuración → Usuarios
2. Sistema envía email con link de activación
3. Usuario hace clic, elige su contraseña
4. Entra al sistema por primera vez

### Onboarding del Admin de empresa nueva (checklist en dashboard)

```
Paso 1 — Configura tu empresa
   Logo, nombre, zona horaria, moneda

Paso 2 — Invita a tu equipo
   Añade asesores con su email y rol

Paso 3 — Conecta tus canales
   Globales de la empresa:
     WhatsApp empresa, Facebook Page, Instagram Business, Email corporativo
   Por asesor (cada asesor desde su perfil):
     WhatsApp personal, Google Calendar, Facebook/Instagram personal

Paso 4 — Configura tu pipeline
   Crea uno o usa el por defecto

Paso 5 — Crea tu primer agente IA
   Configura un agente de chat básico

Paso 6 — Importa tus contactos
   CSV o empezar desde cero
```

- Cada paso es saltable y completable después
- Checklist visible en dashboard hasta llegar a 100%

### Mini-checklist del Asesor (primera vez)

```
Bienvenido — Configura tu perfil
- Completa tu información personal
- Conecta tu Google Calendar
- Escanea el QR de tu WhatsApp
- Conecta tu Facebook/Instagram personal
```

### Primera pantalla por rol

| Rol | Primera pantalla |
|---|---|
| Super Admin | Panel de Agencia |
| Admin (empresa nueva) | Checklist de onboarding |
| Admin (empresa existente) | Dashboard del CRM |
| Asesor | Dashboard del CRM |
| Cliente | Portal del Cliente |

---

## 6. PANTALLA PRINCIPAL

Al hacer login el usuario ve un menú visual de módulos estilo Odoo. Solo se muestran los módulos contratados/habilitados para esa empresa.

### Módulos disponibles (con su ícono y color)

**FASE 1 — En construcción inmediata:**
- 🔵 **CRM** — Clientes, ventas y comunicación
- 🟡 **Desarrollo Inmobiliario** — Proyectos, unidades y cobros
- 🟣 **Agentes IA** — Configuración de agentes (acceso desde CRM admin)
- ⚙️ **Configuración** — Ajustes de la plataforma

**FASE 2 — Postergado:**
- 🟢 Productividad — Tareas y proyectos internos
- 🔴 Gestión Interna — Operación administrativa
- 🟣 Página Web — CMS del proyecto en línea
- 🔷 Portal Cliente — Acceso privado del comprador

### Welcome bar
- Saludo personalizado: "Buenos días, [Nombre]"
- Selector de empresa (si el usuario tiene acceso a múltiples)
- Avatar y menú de usuario en la esquina

---

## 7. MÓDULO CRM

### Estructura del menú lateral

```
DASHBOARD
CONVERSACIONES
CALENDARIOS
TAREAS
CONTACTOS
NEGOCIOS
CAMPAÑAS
RED INMOBILIARIA
─── ADMIN ───
AGENTES DE IA
AUTOMATIZACIONES
INTEGRACIONES
─── CONFIGURACIÓN ───
[expandible con todos los menús de config]
```

### 7.1 Dashboard

**Métricas principales (cards superiores):**
- Oportunidades activas (con cambio vs período anterior)
- Citas este mes
- Tasa de conversión
- Leads nuevos hoy

**Card de IA Asistente** — sugerencia estratégica generada automáticamente:
- Análisis de actividad reciente
- Identificación del contacto con mayor intención de compra
- Botones de acción: "Llamar ahora", "Ver contacto", "Descartar"

**Funnel del pipeline** — embudo visual con cantidad de contactos por etapa.

**Leads por fuente** — gráfico de barras horizontales con % por canal de origen.

**Tareas pendientes** — lista de tareas con estado de color:
- Rojo: vencida
- Amarillo: vence hoy
- Verde: en tiempo

**Dashboard personal por asesor:**
- Sus leads del día
- Tareas vencidas y de hoy
- Citas próximas
- Su ranking vs el equipo
- Performance mensual

**Filtros globales del dashboard:** rango de tiempo (Hoy, Esta semana, Últimos 30 días, Este mes, Personalizado), pipeline.

### 7.2 Conversaciones

Bandeja unificada de todos los canales en una sola pantalla.

**Canales soportados:**
- SMS (vía Evolution API o Twilio)
- WhatsApp (vía Meta Business API oficial)
- WhatsApp personal (vía Evolution API)
- Email
- Instagram DM
- Facebook Messenger
- Internal Comment (notas internas que el cliente no ve)

**Panel izquierdo — Lista de conversaciones:**
- Búsqueda
- Tabs: Team Inbox / My Inbox
- Agrupaciones: Unread, Recents, Starred, All, Internal Chat
- Filtros por canal, asesor asignado, etiquetas
- Cada conversación muestra: avatar, nombre, preview del último mensaje, hora, badge de no leídos

**Panel central — Timeline de conversación:**
- Mezcla mensajes y eventos del CRM en una sola línea de tiempo:
  - Mensajes (texto, audio, imagen, video)
  - Eventos: "Oportunidad creada", "Movido a etapa X", "Cita agendada"
  - Acciones de automatización ejecutadas
  - Llamadas con reproductor inline y botón "Leer transcripción"
- Indicadores: hora, estado de entrega, leído

**Panel derecho — 5 tabs:**
1. **Perfil** del contacto: datos, DND por canal, fuente, automatizaciones activas
2. **Citas** del contacto
3. **Oportunidades** vinculadas
4. **Tareas** del contacto
5. **Notas** con transcripciones

**Barra de respuesta multicanal:**
- Selector del canal por el cual responder (si el cliente entró por Instagram puede responder por Instagram, WhatsApp o email)
- Adjuntos
- Programar mensaje (botón reloj)
- Emojis y plantillas

### 7.3 Calendarios

**Dos calendarios globales del sistema:**
- **Citas Virtuales** — genera enlace de Google Meet automáticamente
- **Citas Presenciales** — solicita lugar de la cita obligatoriamente

**Cada asesor conecta su Google Calendar** personal — sincronización bidireccional. Los slots ocupados en Google Calendar bloquean automáticamente la disponibilidad en Autopilot.

**Dos vistas:**
- **Calendar View** — grid semanal con línea de hora actual, filtros por usuario, calendario y grupo
- **Appointment List View** — tabla con todas las citas, filtros por estado, búsqueda, columnas personalizables

**Modal de crear cita:**
- Calendario destino
- Título
- Descripción rich text
- Team member (asesor)
- Fecha y hora con zona horaria
- Contacto vinculado (búsqueda en CRM)
- Invitados adicionales (internos o externos por email)
- Notas internas
- Estado (Confirmada, Tentativa, Cancelada)

**Modal de bloquear tiempo:**
- Rango libre de inicio y fin
- Sin crear cita formal

**Configuración de calendarios (admin):**
- Gestión global de los dos calendarios
- Asignación de staff
- Prioridad por agente
- Ubicación de reunión por agente
- Distribución round robin o por disponibilidad

### 7.4 Tareas

Lista de tareas con 100 resultados por defecto.

**Filtros:**
- Asignado a
- Estado
- Fecha de vencimiento
- Filtros avanzados

**Búsqueda** por título.

**Tabs:**
- All
- Due Today
- Overdue
- Upcoming

**Información por tarea:**
- Estado visual
- Título
- Descripción
- Contacto vinculado
- Nombre completo del asignado (NO iniciales)
- Fecha y hora de vencimiento con zona horaria

**Modal de crear/editar tarea:**
- Título
- Descripción con editor rich text
- Fecha y hora
- Recurrente (opcional)
- Asignado a
- Objetos asociados (hasta 10 contactos)

**Comportamiento especial al completar tarea:**
> Al marcar una tarea como completada, el sistema abre automáticamente el modal de nueva tarea con el mismo contacto pre-seleccionado para que el asesor registre el siguiente paso inmediatamente.

### 7.5 Contactos

Base de datos con 100 resultados por defecto.

**Funcionalidades:**
- Smart Lists personalizadas
- Bulk Import CSV
- Búsqueda avanzada
- Filtros avanzados con cualquier campo
- Columnas personalizables (Manage Fields)
- Score visible en lista

**Vista de contacto individual — 3 paneles:**

**Panel izquierdo — Datos:**
- Información de contacto
- Campos custom inmobiliarios
- IA Agent (agente activo, agentes pasados con historial, transcripciones colapsables)
- General Info, Additional Info, Reporting
- Clasificación (etapa, temperatura, acción requerida, fecha siguiente paso, responsable, movido hacia)
- ACTIONS — Tags como chips removibles
- ACTIONS — Automation (Activas + Pasadas)
- ACTIONS — Opportunities (Primaria + Adicionales)
- DND por canal
- Client Portal (acceso del cliente)
- Audit Logs

**Panel central — Chat + Pipeline:**
- Pipeline visual horizontal con todas las etapas — se puede mover al contacto de etapa directamente
- Timeline de conversación
- Barra de respuesta multicanal
- Programar mensajes
- Botón de llamar (Twilio softphone integrado)

**Panel derecho — 7 tabs:**
1. **Actividad** — timeline filtrable (Todas, Actividades, Notas, Cambios)
2. **Tareas**
3. **Notas** (incluye transcripciones de llamadas)
4. **Citas**
5. **Documentos** (All, Internal, Sent, Received)
6. **Negocios**
7. **Plan de Pago** del cliente (si tiene venta)

**IA Asistente en el contacto:**
- Card de sugerencia estratégica
- Analiza toda la actividad (llamadas humanas y IA, mensajes, citas)
- Sugiere el mejor siguiente paso
- Botones de acción directa

**Scoring de leads (automático por IA Asistente):**
- Score 0-100 visible en Kanban y lista
- Basado en: nivel de interacción, sentimiento, tiempo en pipeline, respuestas, citas

**Compartir contacto:**
> El botón "Followers" se reemplaza por "Compartir". Al compartir con otro asesor, ese asesor se convierte en Owner y el original pasa a ser Follower.

### Campos completos del contacto

**Información Personal:**
- Nombre (texto, requerido)
- Apellido (texto, requerido)
- Email (con verificación)
- Celular (teléfono)
- Teléfono (teléfono fijo o secundario)
- País (dropdown)
- Ciudad (texto)
- Idioma (dropdown: Español, Inglés, Francés, Portugués, Otro)
- Fecha de nacimiento (fecha)
- Género (dropdown: Masculino, Femenino, No especificado)
- Foto (imagen)

**Información Profesional:**
- Empresa (texto)
- Cargo (texto)
- Sitio web (URL)

**Clasificación del Lead:**
- Tipo de contacto (dropdown, requerido): Lead, Prospecto, Cliente, Agente Inmobiliario, Referido, Otro
- Fuente del contacto (dropdown): Facebook, Instagram, TikTok, Google, Referido, Página web, WhatsApp directo, LinkedIn, Evento, Otro
- Hard Owner (dropdown): Compañía, Asesor
- Score IA Asistente (número 0-100, auto-calculado)
- Temperatura (dropdown): Muy caliente, Caliente, Tibio, Frío, Sin clasificar
- Acción requerida (dropdown): Necesita llamada, Enviar información, Reagendar cita, Dar seguimiento, Esperando respuesta, Ninguna

**Interés Inmobiliario:**
- Proyecto interesado (multi-select de proyectos activos)
- Propósito de compra (dropdown): Vivir, Invertir, Ambos, No definido
- Tipo de unidad (multi-select): Estudio, 1 Hab, 2 Hab, 3 Hab, Penthouse, Villa, Local, Otro
- Presupuesto mínimo (número USD)
- Presupuesto máximo (número USD)
- Tiempo estimado de compra (dropdown): Inmediato, 1-3 meses, 3-6 meses, 6-12 meses, +1 año, Solo explorando
- Forma de pago preferida (dropdown): Contado, Financiamiento bancario, Plan de pago del desarrollador, No definido
- Nacionalidad/Residencia (dropdown): Residente local, Dominicano en el exterior, Extranjero, No especificado

**Clasificación Avanzada:**
- En la etapa (dropdown automático del pipeline)
- Fecha siguiente paso (fecha + hora)
- Responsable siguiente paso (usuario)
- Movido hacia (dropdown, automático)
- Campaña de origen (texto, automático)

**IA Agent:**
- Agente IA activo (relación, automático)
- Killswitch IA (boolean)
- Último contacto IA (fecha/hora, automático)
- Grabación última llamada IA (URL, automático)
- Call ID Retell (texto, automático)

**DND:**
- DND todos los canales (boolean)
- DND llamadas y voicemails (boolean)
- DND mensajes de texto (boolean)
- DND emails (boolean)
- DND entrantes (boolean)

**Metadata (automática):**
- ID único (UUID)
- Workspace ID (UUID)
- Owner / Asignado a (usuario)
- Seguidores (usuarios[])
- Creado por (usuario)
- Fecha de creación (fecha/hora)
- Última modificación (fecha/hora)
- Última actividad (fecha/hora)
- Canal de última comunicación (dropdown)
- Fuente de primera atribución (texto)
- Fuente de última atribución (texto)
- Tags (texto[])

### 7.6 Negocios

**Vista Kanban:**
- Columnas por etapa del pipeline
- Tarjetas con: nombre del contacto, asesor asignado, fuente, valor, acciones rápidas inline
- Colores sutiles según estado de tarea:
  - **Gris** — sin tarea
  - **Verde** — tarea vigente (badge "Xd")
  - **Amarillo** — vence hoy (badge "Hoy")
  - **Rojo** — vencida (badge "Xd")
- Badge azul de cita si tiene cita próxima

**Vista Lista:** Misma información en formato tabular.

**Bulk Actions:** ELIMINADAS — no aplican en este sistema.

**Filtros avanzados** con cualquier campo del contacto.

**Tab Pipelines:**
- Lista de todos los embudos
- Por embudo: nombre, cantidad de etapas, fecha
- Acciones: Editar, Duplicar, Eliminar

### 7.7 Campañas

Visible para todos los usuarios. Asesor ve solo las campañas en las que está incluido.

**Vista principal:**
- Sección "Campañas Activas"
- Sección "Campañas Pasadas"
- (Sin botón "Ver Todos" — siempre visibles ambas secciones)

**Renombrado:** "Round Robin" → "Campaña"

**Detalle de campaña:**
- Gráfico de Desempeño
- Métricas (sin "Meta de Negocios" — solo asignaciones y conversiones)
- Lista de Participantes con botón "Modificar Orden"
- Panel de Conexiones (Meta Ads, Google Ads, web, Zapier, webhook)
- Tabla "Últimas Asignaciones" con: turno, agente, contacto, negocio, etapa, fecha, estatus

**Hard Owner** del contacto se configura en wizard de la automatización vinculada a la campaña (Compañía vs Asesor) para determinar % de comisión.

### 7.8 Red Inmobiliaria

Iframe de AlterEstate (`app.alterestate.com/trexo`) con auto-login usando credenciales guardadas cifradas en la configuración.

- Navega dentro de `/trexo` y todas sus variaciones de filtros y propiedades
- Permite consultar inventario de propiedades de otros desarrollos disponibles en la red

### 7.9 Agentes de IA

**Sub-menús (visibles solo a Admin):**
- Inbox
- Call Center → Analytics / Call History
- Knowledge
- Agentes
- Enrutamiento
- Numbers + Pools
- Widgets

**Decisión arquitectónica clave:** Los agentes se crean en Autopilot con UI propia, pero se sincronizan con Retell vía API. Custom Functions le dan al agente acceso real-time a datos del CRM durante la conversación (Function Calling), no solo webhooks post-llamada.

**Modelos disponibles:** Claude Haiku, Claude Sonnet, Claude Opus.

**Templates:**
- Los templates default de Retell
- Templates propios creados y guardados por la empresa

**Tipos de agente:**
- Voice Agent
- Chat Agent
- Subtipos: Conversation Flow / Single Prompt / Multi-Prompt / Custom LLM

**Configuración del agente (idéntica a Retell):**
- Prompt principal
- Welcome Message
- AI starts speaking after silence
- Functions (Custom + nativas)
- Knowledge Base vinculada
- Speech Settings
- Realtime Transcription
- Call Settings
- Post-Call Data Extraction
- Security & Fallback
- Webhook Settings
- MCPs

**Tests del agente:**
- Se hacen en Retell vía botón "Abrir en Retell"
- No se replica panel de test en Autopilot

**Chat Agent — configuraciones adicionales:**
- Wait Time (buffer de mensajes)
- Max Responses
- Temperature
- Sleep Mode
- Enable Purposeful Misspellings (con probabilidad)
- Response Channels
- Toggle: "Pausar bot cuando asesor envía mensaje manual"
- Auto Follow-Up (selector de automatización)

**Calendars (sección dentro del agente):**
- Vincular calendarios del CRM al agente

**Knowledge Base:**
- Tipos de entrada: texto/FAQ/archivo/URL
- **Hybrid search obligatorio** (semántico + keywords)
- **Metadata filtering por proyecto obligatorio** — no mezclar información entre proyectos similares

**Enrutamiento (reemplaza "Active Tags"):**
- Sistema de reglas nativas basadas en datos reales del contacto
- Condiciones: proyecto, canal, campaña, etapa
- Orden de prioridad con drag-and-drop
- No usa tags artificiales

**Numbers:**
- Importados desde Twilio (nunca comprados en Retell)
- Asignación a agentes específicos

**Pools:**
- Múltiples agentes comparten 1 número para OUTBOUND
- El cliente siempre ve el mismo número de la empresa

**Widgets:**
- Chat widgets embebibles en la web
- Configuración igual a Retell

**Eventos estructurados emitidos por cada interacción:**
- `resultado_llamada`: voicemail, no_answer, answered, completed
- `cita_agendada`: boolean
- `sentimiento`: positivo, neutral, negativo
- `razon_colgada`: contact_ended, ai_ended, voicemail, transferred
- `resumen`: texto generado
- `interes_detectado`: alto, medio, bajo
- `proyecto_mencionado`: nombre del proyecto
- `siguiente_accion_sugerida`: texto

Estos eventos están disponibles como condiciones en automatizaciones.

### 7.10 Automatizaciones

**Dos formas de construir:**

**1. Constructor Visual** (estilo GHL Advanced Workflow Builder):
- Canvas libre con drag and drop
- Múltiples paths en un canvas
- Sticky notes con colores
- Minimap para navegación
- Copiar/duplicar nodos entre automatizaciones
- Habilitar/deshabilitar nodos sin eliminar

**2. Chat IA Constructor:**
- Describe en lenguaje natural lo que quieres lograr
- El sistema construye el workflow automáticamente
- Sincronizado con el canvas visual

**Triggers estándar (estilo GHL):**
- Nuevo contacto creado
- Contacto cambió de etapa
- Mensaje entrante (por canal)
- Cita agendada/cancelada/no asistió
- Tarea completada/vencida
- Tag añadido/removido
- Formulario enviado
- Webhook entrante

**Triggers nuevos orientados a IA:**
- Agente IA sin respuesta en X tiempo
- Resultado de llamada: voicemail, no contestó, completada, cita agendada
- Sentimiento detectado positivo/neutral/negativo
- Cliente respondió después de silencio
- Intención detectada: interesado, no interesado
- Killswitch activado/desactivado
- Cuota vencida en plan de pago
- Negocio ganado

**Acciones estándar (estilo GHL):**
- Enviar mensaje (por canal seleccionado)
- Mover de etapa
- Asignar a usuario
- Crear tarea
- Crear cita
- Añadir/remover tag
- Esperar tiempo
- Condicional (if/else)
- Llamada con agente IA

**Acciones nuevas orientadas a IA:**
- Ejecutar agente de chat/voz
- Pausar/reactivar agente
- Analizar conversación con Claude
- Generar mensaje con Claude (personalizado por contexto)
- Consultar knowledge base
- Generar resumen de llamada
- Generar plan de seguimiento
- Notificar/transferir a humano

**Nodos únicos de IA:**
- Analizar conversación
- Decidir siguiente mensaje
- Clasificar contacto
- Detectar objeciones
- Resumir llamada
- Evaluar momento óptimo
- Generar contenido dinámico

**Webhooks:**
- Inbound webhooks como trigger
- Outbound webhooks como acción

**API propia REST:**
- Endpoints para todas las entidades
- Autenticación por API keys
- OAuth 2.0 para integraciones externas

### 7.11 Integraciones

| Integración | Admin | Asesor |
|---|---|---|
| Google Calendar | ✅ | ✅ |
| Google Account completo | ✅ | ✅ |
| Facebook / Instagram | ✅ | ✅ |
| WhatsApp Meta API | ✅ | ✅ |
| LinkedIn | ✅ | ✅ |
| TikTok Messaging | ✅ | ✅ |
| TikTok Lead Ads | ✅ | ❌ |
| Google Lead Ads | ✅ | ❌ |
| Evolution API | ✅ | ✅ |
| Twilio | ✅ | ❌ |
| Retell AI | ✅ | ❌ |
| AlterEstate | ✅ | ❌ |

**Evolution API — panel completo:**
- WhatsApp Numbers
- SMS (Android SIM)
- Settings con:
  - Notifications
  - Message Identification
  - Number Selection Prioritization (drag-drop)
  - Speech-to-Text (Whisper)
  - Text-to-Speech (ElevenLabs Flash v2.5)
  - Message Queuing (Drip mode anti-spam)

**Twilio — panel completo:**
- Gestión de números
- Asignación a asesores (1 por asesor)
- Pools para agentes IA outbound

### 7.12 WhatsApp Agent del CRM (Feature crítico)

Un número de WhatsApp del CRM (Meta API oficial) al que cada asesor o admin puede:
- Escribir por texto
- Enviar nota de voz (transcrita por Whisper)
- Enviar imágenes (procesadas por Claude Vision)

**El sistema:**
1. Identifica al usuario por su número de teléfono
2. Aplica sus permisos
3. Claude con Function Calling interpreta la petición
4. Presenta el plan de acción al usuario
5. Espera confirmación (Sí/No)
6. Ejecuta las acciones
7. Reporta resultado (Ej: "2 ✅ / 0 ❌")

**Ejemplos de uso por texto/voz:**
- "Crea un contacto llamado Juan Pérez, teléfono 809-555-1234"
- "Mueve a María González a etapa Cita Programada"
- "Crea una tarea para llamar a Pedro mañana a las 10am"
- "¿Cuántos leads tengo en etapa Nuevo Lead?"
- "Agenda cita virtual con Carlos Ruiz el jueves 3pm"
- "Envíale el brochure de Coralia a Luisa Martínez"

**Ejemplos por imagen:**
- Foto de tarjeta de presentación → crea contacto automáticamente
- Captura de conversación → analiza y actualiza notas
- Comprobante de pago → vincula al cliente y registra cobro

**Configuración en Admin:** Sección "WhatsApp del CRM" con:
- Número dedicado del CRM
- Gestión de qué asesores tienen acceso
- Log de todas las acciones ejecutadas
- Activar/desactivar por usuario

### 7.13 Configuración del CRM

**Para asesores:**
- Mi perfil
- Mis calendarios (Google Calendar)
- Mis integraciones personales
- Mis notificaciones
- Mi número Twilio
- Mi WhatsApp (estado + QR para reconectar)

**Para admins:**
- Empresa (logo, datos, zona horaria, moneda)
- Usuarios y equipos
- Roles y permisos
- Calendarios
- Pipelines
- Campos personalizados
- Tags
- Todas las integraciones
- Twilio
- Evolution API
- Retell AI
- Red Inmobiliaria (credenciales AlterEstate cifradas)
- API y webhooks
- Audit Logs globales
- Personalización (white-label)
- Onboarding

**Impersonalización:**
- Admins (por defecto) pueden entrar como cualquier usuario
- Admin puede otorgar este permiso a usuarios no-admin
- Todo queda registrado en Audit Log

### 7.14 Funciones transversales del CRM

- **Scoring de leads IA Asistente** 0-100 automático
- **Dashboard personal** por asesor
- **Centro de notificaciones** (bell icon, real-time, filtrable, push móvil)
- **Menciones @mention** en notas y comentarios internos
- **Búsqueda global Cmd+K** en tiempo real (contactos, negocios, conversaciones, tareas, notas, documentos)
- **Programar mensajes** (botón reloj)
- **Repositorio global de documentos** (brochures, fichas técnicas)
- **Impersonalización** registrada en Audit Log
- **Plan de Pago en el contacto** (tab 7 panel derecho):
  - Secciones: Reservación + Inicial + Construcción + Final/Entrega
  - Cuotas auto-generadas

### 7.15 AI Query Layer (diferenciador principal)

**REGLA ABSOLUTA:** Todo lo que existe en el sistema es consultable en lenguaje natural sin excepción.

**Dos accesos:**
1. **MCP Server propio** para Claude Desktop
2. **Chat IA dentro de la app** (en dashboards)

**ClickHouse** almacena todos los eventos en tiempo real para queries analíticas eficientes.

**Ejemplos de consultas naturales:**
- "¿Cuántos clientes entraron de la campaña de Facebook este mes?"
- "¿Cuál es el asesor que más ventas cerró en el primer trimestre?"
- "¿Cuántas unidades de 2 habitaciones quedan disponibles?"
- "¿Qué clientes tienen cuotas vencidas de más de 30 días?"

---

## 8. MÓDULO DESARROLLO INMOBILIARIO

### 8.1 Estructura del menú

**Selector de proyecto siempre visible** en barra superior (multi-checkbox) — filtra TODOS los menús.

```
PRINCIPAL
─────────
PROYECTOS
DASHBOARD
EDIFICIOS
UNIDADES
DISPONIBILIDAD
PLANES DE PAGO
BLOQUEOS
RESERVAS
VENTAS
COBROS
CONTRATOS
COMISIONES
CLIENTES
AGENCIAS
STAFF (solo Admin)
MIS MÉTRICAS (solo Asesor)
REPORTES

MANEJO DE OBRA
─────────────
ÓRDENES DE TRABAJO
PRESUPUESTO DE OBRA
CRONOGRAMA DE OBRA
AVANCE DE OBRA
INSPECCIONES
SUBCONTRATISTAS
PROVEEDORES
INBOX PROVEEDORES
PAGOS A PROVEEDORES
SUPERVISIÓN DE ÁREAS
ACTAS DE ENTREGA
GARANTÍAS
PUNCH LIST
```

### 8.2 Proyectos

Grid de cards de proyectos con checkbox de selección múltiple.

**Cada card muestra:**
- Imagen/render
- Nombre, tipo, ubicación
- Estado
- Cantidad de edificios y unidades
- % de avance de ventas

**Menú de opciones por proyecto:** Editar, Duplicar, Eliminar.

**Card especial:** Botón "+ Nuevo Proyecto".

**Formulario de proyecto:**
- Nombre, tipo (Residencial, Comercial, Mixto), ubicación
- Imágenes y renders
- Documentos (brochures, fichas técnicas, planos)
- Fechas (inicio, entrega proyectada)
- % de avance manual
- Estado: En planos, En construcción, Entregado, Suspendido

### 8.3 Dashboard de Desarrollo Inmobiliario

**Cards de métricas (5 columnas):**
- Disponibles (verde)
- Reservadas (azul)
- Bloqueadas (amarillo)
- Vendidas (rojo)
- Cobrado del mes (USD)

**2 Cards de IA Asistente:**

1. **IA Asistente — Ventas:**
   - Insights de rendimiento
   - Oportunidades detectadas
   - Proyecciones
   - Botones: "Ver unidades", "Crear campaña"

2. **IA Asistente — Riesgo de Morosidad:**
   - Análisis de comportamiento de pago
   - Detección temprana de clientes en riesgo
   - Botones: "Ver clientes en riesgo", "Iniciar seguimiento"

**Finanzas del Proyecto (estilo AlterEstate):**
- Barra de progreso de ventas
- Gráfico proyectado vs cobrado por mes
- Embudo de etapas de venta
- Tabla resumen por etapa
- Lista de ventas por proyecto

**Proyección Flujo de Caja:**
- Vista tabla con período, proyectado, cobrado
- Vista gráfico
- Vista por rango de fechas

**Widgets adicionales:**
- Termómetro de ventas del mes vs meta
- Ranking de asesores
- Ranking de inmobiliarias
- Mapa de calor por tipo de apartamento
- Próximos cobros de la semana
- Actividad reciente del módulo
- Tasa de conversión del pipeline
- Tiempo promedio de cierre

**Disponibilidad visual del proyecto:**
- Plano del edificio con unidades coloreadas
- Click en unidad → detalles y acciones

**Chat IA:** Campo para preguntas en lenguaje natural sobre cualquier dato del módulo.

### 8.4 Edificios

Lista de edificios del proyecto seleccionado.

**Columnas:** Nombre, Proyecto, Pisos, Total unidades, Disponibles, Vendidas, Estado.

**Formulario:**
- Nombre (Ej: Torre A, Torre Norte, Edificio 1)
- Proyecto
- Número de pisos
- Unidades por piso (para generación automática)
- Descripción
- Imagen/render
- Estado: En construcción, En planos, Entregado
- Fecha estimada de entrega

**Detalle del edificio:**
- Datos generales
- Vista visual de pisos con colores de disponibilidad por piso
- Resumen de unidades por estado
- Botón "+ Añadir Unidades" — generación automática

### 8.5 Unidades

Lista/grid con 100 resultados por defecto.

**Filtros:** proyecto, edificio, tipo, precio, estado, piso.

**Formulario:**
- Número de unidad (1A, 201, PH-01)
- Proyecto y Edificio
- Piso
- Tipo (Estudio, 1 Hab, 2 Hab, 3 Hab, Penthouse, Villa, Local, Otro)
- Metraje (m²)
- Metraje terraza (m²) opcional
- Habitaciones y Baños
- Precio base (USD)
- Precio actual (USD) — puede diferir del base
- Vista: Mar, Piscina, Jardín, Ciudad, Interior
- Orientación: Norte, Sur, Este, Oeste, NE, NO, SE, SO
- Características especiales (esquinero, panorámico, etc.)
- Plano de la unidad (imagen)
- Galería de fotos
- Estado: Disponible, Bloqueada, Reservada, Vendida
- Notas internas

**Generación masiva:**
```
Piso 1 al 10
Unidades por piso: 4 (A, B, C, D)
Tipo: 2 Habitaciones
Precio base: $180,000

→ Sistema genera 40 unidades con nomenclatura 1A...10D
```

### 8.6 Disponibilidad

Vista visual interactiva del inventario.

**Plano del edificio con unidades coloreadas:**
- 🟢 Verde — Disponible
- 🔵 Azul — Reservada
- 🟡 Amarillo — Bloqueada
- 🔴 Rojo — Vendida

**Al hacer clic en unidad:** Detalles + acciones (Bloquear, Reservar, Vender, Editar).

**Exportable** en PDF y Excel.

### 8.7 Planes de Pago

**Estructura del plan:**
- **Reservación** (monto fijo)
- **Pago Inicial** (% del precio total)
- **Pago de Construcción** (% del precio total, dividido en cuotas con periodicidad configurable)
- **Pago Final/Entrega** (% remanente)

**Reglas:**
- Los porcentajes siempre suman 100%
- Cuotas de construcción se generan automáticamente según periodicidad (mensual, bimestral, trimestral)
- Modo automático y manual disponibles
- Total pagado, falta y resumen en tiempo real

### 8.8 Bloqueos

Lista de bloqueos activos y vencidos.

**Estados:**
- 🟡 Activo — Amarillo
- 🟠 Próximo a vencer — Naranja
- 🔴 Vencido — Rojo
- ⚪ Liberado manualmente — Gris
- 🟢 Convertido a reserva — Verde

**Formulario:**
- Unidad (solo disponibles)
- Cliente (contacto del CRM)
- Motivo: Cliente evaluando, Pendiente documentos, Pendiente aprobación de crédito, Negociación de precio, Otro
- Responsable
- Fecha inicio (default hoy)
- Duración: 24h, 48h, 72h, 1 semana, 2 semanas, Personalizado
- Fecha de vencimiento (auto)
- Notas

**Comportamiento automático:**
- Al vencer → unidad regresa a Disponible
- 24h antes de vencer → notificación a responsable y admin
- Asesor puede extender o convertir en reserva

### 8.9 Reservas

Lista de reservas activas y pasadas.

**Estados:**
- 🔵 Activa — Azul
- 🟠 Próxima a vencer — Naranja
- 🔴 Vencida — Rojo
- 🟢 Convertida a venta — Verde
- ⚪ Cancelada — Gris

**Formulario:**
- Unidad (solo disponibles y bloqueadas)
- Cliente (contacto del CRM)
- Monto de reserva (USD)
- Fecha de pago reserva
- Comprobante de pago (archivo)
- Fecha de reserva (default hoy)
- Fecha de vencimiento
- Vendido por: Asesor interno / Agencia
- Asesor/Agencia
- Notas

**Comportamiento automático:**
- Al crear → unidad cambia a Reservada
- Al vencer sin convertirse → admin recibe alerta
- Al convertir a venta → genera venta + plan de pago automáticamente

### 8.10 Ventas

Lista de todas las ventas.

**Estados:**
- 🟢 Activa — Verde
- 🔵 En proceso de firma — Azul
- 🔴 Cancelada — Rojo
- 🟠 En disputa — Naranja

**Formulario:**
- Unidad (solo disponibles y reservadas)
- Cliente (contacto del CRM)
- Precio final de venta (USD)
- Fecha de cierre
- Vendido por: Asesor interno / Agencia
- Asesor/Agencia
- Hard Owner: Compañía / Asesor (determina % comisión)
- Reserva vinculada (opcional)
- Notas

**Al crear venta — comportamiento automático:**
1. Estado de la unidad → **Vendida**
2. Genera **Plan de Pago** según plantilla del proyecto
3. Calcula **Comisión** según Hard Owner y % configurado
4. Crea contacto como **Cliente** en módulo Clientes
5. Mueve contacto en CRM a etapa **Ganado** del pipeline
6. Activa opción de **Client Portal** en el contacto CRM
7. Genera notificación al Admin

### 8.11 Cobros

Lista de todos los cobros (pagos esperados y recibidos).

**Estados:**
- 🟢 Pagado — Verde
- 🟠 Pendiente — Naranja
- 🔴 Vencido — Rojo
- 🔵 Pago parcial — Azul
- ⚪ Cancelado — Gris

**Tabs:** Todos, Pendientes, Vencidos, Pagados, Pago parcial.

**Formulario de registro de cobro:**
- Cliente (clientes activos)
- Unidad (filtrada por cliente)
- Plan de pago (vinculado a la venta)
- Concepto: Reservación, Pago inicial, Cuota construcción, Pago final, Otro
- Monto esperado (precargado del plan)
- Monto recibido
- Fecha de vencimiento (precargada)
- Fecha de pago real
- Método: Transferencia, Efectivo, Cheque, Tarjeta, Crypto, Otro
- Comprobante (PDF/imagen)
- Notas

**Comportamiento automático:**
- Si monto recibido < esperado → estado **Pago parcial**
- Si fecha pago supera vencimiento → estado **Vencido**
- Al registrar pago → actualiza plan de pago del cliente
- 3 días antes del vencimiento → recordatorio automático al cliente (WhatsApp + email)
- El día del vencimiento → segundo recordatorio
- **IA Asistente** detecta cambios en patrones de pago y alerta al admin

### 8.12 Contratos

Tabs: **Contratos** + **Plantillas** (gestión integrada — sin ir a Configuración).

**Tipos de contrato:**
- Contrato de Reserva
- Promesa de Compraventa
- Contrato Definitivo
- Acta de Entrega
- Adenda
- Otro

**Estados:**
- ⚪ Borrador — Gris
- 🔵 Enviado para firma — Azul
- 🟢 Firmado — Verde
- 🟣 Notariado — Morado
- 🔴 Cancelado — Rojo

**Firma digital:**
- Al activar → sistema envía documento al cliente por email + WhatsApp
- Cliente firma desde teléfono
- Al firmar → estado **Firmado** + copia firmada a todas las partes

### Generación automática de contratos

**1. Admin sube plantillas Word (.docx)** con variables:
```
{{nombre_cliente}}
{{apellido_cliente}}
{{cedula_cliente}}
{{nacionalidad_cliente}}
{{email_cliente}}
{{telefono_cliente}}
{{nombre_unidad}}
{{tipo_unidad}}
{{piso}}
{{metraje}}
{{precio_venta}}
{{precio_letras}}
{{nombre_proyecto}}
{{direccion_proyecto}}
{{nombre_empresa}}
{{rnc_empresa}}
{{fecha_contrato}}
{{fecha_entrega}}
{{monto_reserva}}
{{monto_inicial}}
{{monto_construccion}}
{{monto_entrega}}
{{nombre_asesor}}
{{nombre_agencia}}
```

**2. Al crear contrato:**
- Sistema detecta plantilla del tipo seleccionado
- Llena todas las variables con datos reales
- Genera PDF final
- Admin previsualiza y puede ajustar manualmente
- Luego envía a cliente para firma digital

**Tab Plantillas:**
- Una plantilla por tipo de contrato
- Acciones: Subir, Editar, Reemplazar, Previsualizar con datos prueba, Activar/Desactivar, Eliminar
- Vista de variables disponibles como referencia

### 8.13 Comisiones

**Estados:**
- 🟠 Pendiente — Naranja
- 🔵 Aprobada — Azul
- 🟢 Pagada — Verde
- 🔴 Rechazada — Rojo

**Configuración** (tab dentro de Comisiones):
- Venta interna — Hard Owner Compañía: %
- Venta interna — Hard Owner Asesor: %
- Venta por agencia externa: %
- Venta por agencia — Hard Owner Asesor: %

**Comportamiento automático:**
- Al crear venta → sistema genera comisión correspondiente
- Calcula % según Hard Owner y origen (interna vs agencia)
- Admin recibe notificación
- Flujo: Pendiente → Admin aprueba → Aprobada → Admin paga → Pagada
- Notificación al beneficiario en cada cambio de estado

### 8.14 Clientes

Base de datos de compradores con tabs:

| Tab | Contenido |
|---|---|
| Resumen | Datos personales, unidad, asesor, estado |
| Plan de pago | Plan completo con cuotas y estados |
| Cobros | Historial de pagos |
| Contratos | Documentos vinculados |
| Documentos | Cédula, pasaporte, comprobantes |
| Portal | Estado del acceso al portal del cliente |

**Estados:**
- 🟠 En proceso — Naranja
- 🔵 Firma pendiente — Azul
- 🟣 Contrato firmado — Morado
- 🟡 En construcción — Amarillo
- 🟢 Entregado — Verde
- 🔴 Cancelado — Rojo

**Vinculación con CRM:**
> El cliente en Desarrollo Inmobiliario y el contacto en el CRM son **el mismo registro** — no hay duplicación. Al crear cliente con venta → contacto en CRM se mueve automáticamente a etapa **Ganado**.

### 8.15 Agencias

Directorio de inmobiliarias aliadas.

**Formulario:**
- Nombre, Logo, RNC, Teléfono, Email, Dirección
- País, Ciudad, Sitio web
- Persona de contacto (nombre, teléfono, email)
- Contrato de intermediación (PDF)
- % Comisión acordado (default)
- Estado: Activa, Inactiva, Suspendida
- Notas

**Tabs en detalle:**
- Resumen
- Agentes
- Unidades asignadas
- Ventas
- Comisiones
- Documentos

**Acceso especial al sistema:**
- Ven solo disponibilidad de unidades
- Registran sus clientes interesados
- Ven sus ventas y comisiones
- No ven info de otras agencias

### 8.16 Staff (solo Admin)

Equipo interno de ventas vinculado a usuarios del CRM.

**Formulario:**
- Usuario CRM (dropdown)
- Rol: Asesor de ventas, Coordinador, Gerente de ventas, Director comercial
- Proyectos asignados (multi)
- Unidades asignadas (multi, opcional)
- Meta mensual (USD)
- Meta de unidades
- % Comisión default
- Fecha de ingreso
- Estado: Activo, Inactivo
- Notas

**Tabs en detalle:**
- Resumen (datos, métricas, ranking)
- Ventas
- Clientes
- Comisiones
- Desempeño (gráfico ventas vs meta)

### 8.17 Mis Métricas (solo Asesor)

Vista exclusiva para asesores con SUS datos:
- Resumen del mes: ventas cerradas, unidades vendidas, comisiones
- Meta vs real (barra de progreso)
- Mis ventas
- Mis clientes
- Mis comisiones (pendiente, aprobada, pagada)
- Mi desempeño histórico (gráfico)
- Mi ranking (solo posición, sin ver datos de otros)

### 8.18 Reportes

Exportables en PDF y Excel:
- Ventas por período
- Disponibilidad
- Cobros y morosidad
- Rendimiento por agencia
- Rendimiento por asesor
- Proyección de ingresos
- Comisiones
- Mapa de calor por proyecto
- Tiempo promedio de cierre
- Tasa de conversión del pipeline

### 8.19 Manejo de Obra (submódulos)

#### 8.19.1 Órdenes de Trabajo
**Estados:** Borrador, Enviada, En progreso, Completada, Cancelada, En disputa.

**Campos:** Número auto, Título, Descripción, Proyecto, Edificio, Área/Piso, Tipo de trabajo (Electricidad/Plomería/Acabados/Estructura/Pintura/Carpintería/Otro), Asignado a (Subcontratista/Proveedor), Responsable interno, Fecha inicio, Fecha límite, Monto USD, Documentos, Notas.

**Seguimiento:** Historial de actualizaciones, fotos de avance, comentarios. Al completar → genera opción de pago al proveedor.

#### 8.19.2 Presupuesto de Obra
**Categorías:** Estructura, Electricidad, Plomería, Acabados, Carpintería, Pintura, Equipos, Honorarios, Imprevistos, Otro.

**Estados de partida:** En presupuesto (verde), Próximo a límite (naranja), Sobrepresupuesto (rojo), Completada (azul).

**Auto:** Cuando se registra pago a proveedor vinculado → monto ejecutado se actualiza. Si supera presupuesto → alerta.

#### 8.19.3 Cronograma de Obra
Vista Gantt + Vista Lista.

**Estados:** Pendiente, En progreso, Completada en tiempo, Completada con retraso, Retrasada.

**Campos:** Nombre, Proyecto, Edificio, Descripción, Fechas planificadas (inicio/fin), Fechas reales, Responsable, Depende de (etapa anterior), % Avance.

#### 8.19.4 Avance de Obra
**Vista por proyecto → edificio → piso.**

**Registro:** Proyecto, Edificio, Piso/Área, Etapa, % Avance, Descripción, Fotos (mín 1), Videos, Fecha, Registrado por.

**Cámara en vivo:** Configurable por proyecto. URL de stream embebida. Visible en página web pública.

**Visibilidad:**
- Admin/Staff: detalles completos
- Cliente: % avance + fotos seleccionadas en su portal
- Stream en vivo: visible al público

#### 8.19.5 Inspecciones
**Tipos:** Estructural, Eléctrica, Plomería, Acabados, Seguridad, General.

**Estados:** Programada, En progreso, Aprobada, Aprobada con observaciones, Rechazada, Reinspección pendiente.

**Checklist dinámico:** Admin crea plantillas por tipo. Ítems con: ✅ Aprobado, ❌ Rechazado, ⚠️ Con observación.

#### 8.19.6 Subcontratistas
**Especialidades:** Electricidad, Plomería, Acabados, Estructura, Pintura, Carpintería, Impermeabilización, Aire acondicionado, Otro.

**Campos:** Tipo (Empresa/Persona), RNC/Cédula, Teléfono, Email, Dirección, Contacto, Proyectos asignados, Contrato (PDF), % Retención, Estado.

**Tabs:** Resumen, Órdenes de trabajo, Pagos, Documentos.

#### 8.19.7 Proveedores
**Categorías:** Materiales de construcción, Equipos, Herramientas, Acabados, Eléctrico, Plomería, Pintura, Otro.

**Campos:** RNC, Teléfono, Email, Dirección, Contacto, Condiciones de pago (Contado/15d/30d/60d/Otro), Proyectos, Contrato, Estado.

**Tabs:** Resumen, Órdenes, Pagos, Documentos.

#### 8.19.8 Inbox Proveedores
Bandeja de comunicación con proveedores y subcontratistas — estilo Conversaciones del CRM pero:
- **Sin agentes IA**
- **Sin automatizaciones**
- **Canales:** WhatsApp, Email, Internal Comment

#### 8.19.9 Pagos a Proveedores
**Estados:** Pendiente (naranja), Vencido (rojo), Pagado (verde), Pago parcial (azul), Cancelado (gris).

**Campos:** Proveedor, Orden vinculada (opcional), Partida presupuestaria, Concepto, Monto, Fecha vencimiento, Fecha pago real, Método (Transferencia/Cheque/Efectivo/Otro), Comprobante, Retención %, Monto neto, Notas.

**Auto:** Al registrar pago → actualiza monto ejecutado en Presupuesto de Obra. Si supera → alerta al admin.

#### 8.19.10 Supervisión de Áreas
Grid de cards por área. Cada área tiene reportes diarios:
- Personal presente
- Actividades del día
- Incidencias
- Fotos
- Estado del área: Normal (verde), Requiere atención (naranja), Crítico (rojo), Inactiva (gris)

#### 8.19.11 Actas de Entrega
**Estados:** Programada, En proceso, Completada, Pendiente de firma, Cancelada.

**Formulario:**
- Unidad (vendidas)
- Cliente (precargado)
- Fecha programada
- Inspector
- Checklist de entrega (precargado de plantilla)
- Observaciones
- Fotos del estado (mín 5)
- Lecturas de medidores
- Llaves entregadas (cantidad)
- Documentos entregados
- Firma digital del cliente (requerida)
- Firma digital del representante (requerida)

**Al completar:**
- Unidad → Entregada
- Cliente → Entregado
- Acta firmada → enviada al cliente por email + guardada en documentos
- Notificación al admin

#### 8.19.12 Garantías
**Tipos:** Estructural, Eléctrica, Plomería, Acabados, Equipos, Otro.

**Estados:** Reportada, En evaluación, En proceso, Resuelta, Rechazada, Escalada.

**Campos:** Unidad, Cliente, Tipo, Descripción del problema, Fotos del problema, Fecha reporte, Reportado por (Cliente/Inspector/Asesor), Responsable de resolver, Fecha límite, Prioridad (Alta/Media/Baja), Notas.

**Fotos antes y después de resolución.**

#### 8.19.13 Punch List
**Estados:** Abierto (rojo), En progreso (naranja), Casi completo (amarillo), Completado (verde).

**Estructura:**
- Punch List (cabecera): Unidad, Cliente, Acta vinculada, Responsable general, Fecha límite general
- Ítems del punch list:
  - Descripción
  - Ubicación
  - Foto del problema
  - Foto de resolución (al resolver)
  - Responsable (Subcontratista/Proveedor)
  - Prioridad
  - Fecha límite
  - Estado del ítem (Pendiente, En proceso, Resuelto)

**Al completarse todos los ítems → Punch List Completado + notificación a cliente y admin.**

---

## 9. NOTIFICACIONES

### 9.1 In-app (bell icon)

| Notificación | Destinatario |
|---|---|
| Nuevo mensaje de un contacto | Asesor asignado |
| Tarea vencida | Asesor asignado |
| Tarea próxima a vencer (2h antes) | Asesor asignado |
| Cita en 30 min | Asesor asignado |
| Contacto asignado/compartido | Asesor receptor |
| Negocio movido de etapa | Owner + Seguidores |
| Comentario con @mención | Usuario mencionado |
| Agente IA pausado (killswitch) | Admin |
| Número de WhatsApp desconectado | Admin + Asesor afectado |
| Cuota vencida de cliente | Admin + Asesor asignado |
| Nueva reserva creada | Admin |
| Nueva venta creada | Admin |
| Comisión aprobada | Asesor beneficiario |
| Plan de pago creado | Admin |

### 9.2 Push móvil

- Nuevo mensaje entrante
- Llamada entrante
- Tarea vencida
- Cita en 30 min
- @mención

### 9.3 Email

- Bienvenida al sistema → Usuario nuevo
- Contraseña restablecida → Usuario
- Resumen diario de actividad → Admin (opcional)
- Número de WhatsApp desconectado → Admin
- Cuota vencida del cliente → Cliente (recordatorio)
- Documento pendiente de firma → Cliente
- Credenciales del portal → Cliente nuevo

### 9.4 WhatsApp (a clientes)

- Recordatorio de cuota 3 días antes
- Recordatorio de cuota día del vencimiento
- Confirmación de cita agendada
- Recordatorio de cita 24h antes
- Documento pendiente de firma

---

## 10. PANEL DE AGENCIA (SUPER ADMIN)

Panel exclusivo del Super Admin (Lucas):

- **Dashboard Global:** Métricas consolidadas de todas las empresas
- **Empresas:** Lista, crear nuevas, configurar
- **Módulos:** Habilitar/deshabilitar por empresa
- **Facturación:** Planes y pagos (Fase 2)
- **Analytics:** Comportamiento agregado del producto
- **Configuración:** White-label (logo, colores, dominio personalizado)

---

## 11. REGLAS GLOBALES DEL SISTEMA

- Todas las listas: **100 resultados por defecto**
- Todo registrado en **Audit Log** (acciones, cambios, impersonaciones)
- Multi-tenant con **Row-Level Security** en Supabase desde día 1
- Toda interacción de agente IA emite **eventos ricos estructurados** disponibles en automatizaciones
- Chat es **timeline mixta** (mensajes + eventos CRM + grabaciones)
- Grabaciones de llamadas se reproducen **inline con botón "Leer transcripción"**
- **AI Query Layer:** todo es consultable en lenguaje natural

---

## 12. MÓDULOS DE FASE 2 (referencia futura)

- **Productividad** — Gestión de tareas internas estilo ClickUp/Monday
- **Gestión Interna** — Operación administrativa
- **Portal del Cliente** — Acceso del comprador con vista de su unidad, plan de pago, contratos, avance de obra
- **Página Web** — CMS del proyecto con disponibilidad en vivo, cámara de obra, portal cliente, panel agencias, chat IA
- **Billing** — Planes de suscripción con Stripe para múltiples empresas cliente

---

**Fin del Documento 1 — PRD General**
*Continúa en Documento 2: Schema de Datos*
