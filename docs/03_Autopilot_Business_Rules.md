# 📋 AUTOPILOT — Reglas de Negocio

**Documento 3 de 3**
Lógica de comportamiento automático del sistema

---

## 1. REGLAS GLOBALES DEL SISTEMA

### 1.1 Multi-tenancy
- Toda consulta a la base de datos debe filtrar automáticamente por `workspace_id` mediante Row-Level Security
- Un usuario del workspace A nunca puede ver datos del workspace B (excepto Super Admin con bypass)
- Los archivos en Supabase Storage se organizan en carpetas por workspace_id
- Las credenciales de integraciones (Twilio, Evolution, Retell) son por workspace, nunca globales

### 1.2 Listas y paginación
- **Default:** 100 resultados por página en cualquier listado del sistema
- Paginación con scroll infinito o paginación tradicional según preferencia del usuario

### 1.3 Audit Log
- Cada acción significativa genera un registro en `AuditLog`
- Acciones registradas: create, update, delete, login, logout, impersonation_started, impersonation_ended, password_changed, role_changed, status_changed
- Para updates: se guarda `before` y `after` con los campos modificados
- Las impersonalizaciones incluyen `impersonatedUserId` para trazabilidad
- Los Audit Logs no se pueden borrar, solo consultar

### 1.4 Soft deletes
- Los registros importantes (Contact, Deal, Project, Unit, Customer) usan soft delete con `deletedAt`
- Datos eliminados son recuperables por Admin desde Audit Log durante 30 días
- Después de 30 días el cleanup job los elimina permanentemente

### 1.5 Timezone
- Toda fecha/hora se guarda en UTC en la base de datos
- Se renderiza al usuario en su timezone personal (definido en su perfil)
- Default del workspace: America/Santo_Domingo

---

## 2. REGLAS DE AUTENTICACIÓN

### 2.1 Login
- Email + password (password hasheado con bcrypt o argon2)
- Google OAuth como alternativa
- Sesión válida por 30 días con "Recordarme", 24h sin "Recordarme"
- Bloqueo de cuenta tras 5 intentos fallidos en 15 minutos
- Recuperación de contraseña vía link único enviado por email (expira en 1 hora)

### 2.2 Creación de usuarios
- Solo Admin o Super Admin pueden crear usuarios
- Email de activación enviado automáticamente con link único (expira en 7 días)
- Usuario establece su contraseña al activar
- Primera vez que entra → ve onboarding personal según rol

### 2.3 Onboarding del Admin (empresa nueva)
- Checklist de 6 pasos visible en dashboard hasta completarse al 100%:
  1. Configura tu empresa
  2. Invita a tu equipo
  3. Conecta tus canales (globales + por asesor)
  4. Configura tu pipeline
  5. Crea tu primer agente IA
  6. Importa tus contactos
- Cada paso es saltable
- El sistema marca progreso automáticamente al completar cada paso

### 2.4 Onboarding del Asesor
- Mini-checklist al primer login:
  - Completar información personal
  - Conectar Google Calendar
  - Escanear QR de WhatsApp
  - Conectar Facebook/Instagram personal
- No bloquea el uso del sistema, pero aparece como notificación hasta completarse

### 2.5 Impersonalización
- Solo Admin (y usuarios autorizados) pueden impersonalizar
- Al impersonalizar: nueva sesión con identidad del usuario destino
- Banner visible permanente: "Estás operando como [Nombre]"
- Audit Log registra inicio y fin de impersonación con timestamps
- Todas las acciones realizadas se registran con el usuario impersonado pero referencian al admin que ejecuta

---

## 3. REGLAS DEL CRM

### 3.1 Contactos

**Creación automática:**
- Webhook entrante de Facebook/Instagram/TikTok Lead Ads → crea contacto automáticamente
- Formulario web → crea contacto + asigna campaña + dispara automatización
- Mensaje entrante de número desconocido → crea contacto con datos mínimos (teléfono, canal)
- Importación CSV → bulk create con detección de duplicados por email/teléfono

**Detección de duplicados:**
- Al crear contacto: si email o teléfono coinciden con otro contacto activo del workspace → mostrar aviso al usuario antes de crear
- Opción de "merge" para combinar duplicados (suma actividad, mantiene el más antiguo)

**Owner del contacto:**
- Al crear desde campaña → owner = siguiente asesor en round robin
- Al crear manual → owner = usuario que lo crea (a menos que se asigne otro explícitamente)
- Cuando un asesor "comparte" un contacto → el receptor se vuelve owner, el original pasa a follower

**Scoring de leads (IA Asistente):**
- Score recalculado en tiempo real cada vez que ocurre actividad
- Factores que aumentan score:
  - Respuestas rápidas del cliente
  - Interacciones repetidas (múltiples mensajes en corto tiempo)
  - Citas agendadas
  - Sentimiento positivo detectado
  - Preguntas específicas sobre disponibilidad o precios
- Factores que disminuyen score:
  - Días sin actividad
  - Sentimiento negativo detectado
  - Mensajes ignorados
  - Cita cancelada o no asistida

**Cambio de etapa:**
- Cualquier asesor puede mover sus contactos de etapa
- Movimientos registrados en ContactEvent
- Al llegar a etapa "Won" → si tiene venta vinculada, sincronizar con módulo Desarrollo Inmobiliario

### 3.2 Conversaciones

**Llegada de mensajes:**
- Inbound de WhatsApp/SMS/Email/IG/FB → buscar contacto por teléfono/email
- Si existe → añadir mensaje a su conversación
- Si no existe → crear contacto + conversación nueva
- Mensaje marca conversación como "unread"
- Si el contacto tiene asesor asignado → notificación al asesor
- Si no → notificación al equipo (team inbox)

**Asignación de canal:**
- Cada mensaje se almacena con su canal exacto
- Al responder, el asesor elige el canal de respuesta
- El sistema sugiere por defecto el canal del último mensaje recibido

**Killswitch IA:**
- Si está activado para un contacto: ningún agente IA responderá automáticamente, todas las conversaciones requieren respuesta humana
- El asesor puede desactivarlo desde el panel del contacto

**Pausar bot al intervenir humano:**
- Si Chat Agent tiene activado "pauseOnHumanReply" Y un asesor envía mensaje manual → agente se pausa para ese contacto durante 24h (configurable)
- Después de 24h sin actividad humana → agente puede retomar

**Programar mensajes:**
- Mensajes con `scheduledFor` se envían en la fecha/hora programada
- Worker job procesa la cola cada minuto
- Si el contacto activa DND antes del envío → mensaje se cancela

### 3.3 Tareas

**Al completar tarea:**
- Al marcar como completed → abrir modal automáticamente para crear nueva tarea con el mismo contacto pre-seleccionado
- Si el asesor descarta → no se crea nada
- Si rellena → se crea nueva tarea

**Tareas vencidas:**
- Cada hora un job actualiza el estado visual de tareas que pasaron su due_date sin completarse
- Notificación al asesor cuando una tarea vence
- En el Kanban de Negocios, el contacto del deal cambia color según estado de tarea más urgente

### 3.4 Citas

**Sincronización con Google Calendar:**
- Bidireccional: cambios en Google Calendar se reflejan en Autopilot
- Cambios en Autopilot generan eventos en Google Calendar
- Si el asesor no tiene Google conectado → la cita solo existe en Autopilot

**Citas virtuales:**
- Al crear cita virtual → sistema genera enlace de Google Meet automáticamente
- Enlace se envía a invitados por email
- Si el asesor no tiene Google → enlace genérico de Meet con código aleatorio

**Recordatorios automáticos:**
- 24 horas antes → WhatsApp al cliente
- 30 minutos antes → notificación in-app al asesor
- Si el cliente confirma asistencia (responde "sí" al recordatorio) → estado de cita pasa a Confirmed

**Distribución de calendarios:**
- Round Robin: rota entre asesores asignados en orden
- Availability: asigna al asesor con más slots libres

### 3.5 Negocios (Deals)

**Creación:**
- Al crear contacto en pipeline activo → crear deal automáticamente
- Un contacto puede tener múltiples deals (negocios primarios y adicionales)
- Deal primary = el más reciente en pipeline activo

**Colores de tarjetas en Kanban:**
```
Si deal.tasks.filter(status=pending).count() == 0 → Gris (sin tarea)
Si todas las tareas pending tienen due_date > hoy + 1 día → Verde
Si alguna tarea pending tiene due_date == hoy → Amarillo
Si alguna tarea pending tiene due_date < hoy → Rojo
```

**Cierre como ganado:**
- Mover a etapa marcada como `isWon=true` → status=won, wonAt=now()
- Si existe venta vinculada en Desarrollo Inmobiliario → sincronizar
- Si no existe venta → ofrecer crear una al admin

**Cierre como perdido:**
- Mover a etapa `isLost=true` → solicitar motivo (campo obligatorio)
- Status=lost, lostAt=now(), lostReason=texto
- Notificación al admin

### 3.6 Campañas

**Round Robin:**
- Al entrar un nuevo lead a una campaña → asignar al siguiente asesor en orden
- El sistema lleva contador interno por campaña
- Si un asesor está marcado inactivo → saltar al siguiente
- Si todos están inactivos → asignar al admin de la empresa

**Hard Owner por campaña:**
- Cada campaña tiene configurado su Hard Owner (Compañía o Asesor)
- Este valor se asigna automáticamente al contacto al entrar
- Afecta directamente el cálculo de comisiones cuando la venta se cierra

### 3.7 Agentes IA

**Enrutamiento:**
- Al llegar mensaje/llamada entrante → evaluar reglas de enrutamiento en orden de prioridad
- Si ninguna regla hace match → enrutar a asesor humano
- Si match → activar el agente configurado en esa regla

**Function Calling (real-time):**
- Los agentes pueden ejecutar funciones del CRM durante la conversación:
  - `consultarDisponibilidad(proyecto, tipoUnidad, presupuesto)`
  - `agendarCita(fecha, hora, asesor)`
  - `crearContacto(datos)`
  - `consultarPlanPago(unidad)`
  - `enviarBrochure(proyecto)`
  - `transferirAHumano(motivo)`

**Knowledge Base — Hybrid Search:**
- Para cada consulta del agente: combinar búsqueda semántica (embeddings) + keywords
- Filtrar resultados por `metadata.projectId` si el contexto incluye proyecto
- Top 3-5 resultados pasan como contexto al LLM

**Eventos emitidos por llamada de IA:**
Al terminar cada llamada de agente de voz, emitir AiCall con datos estructurados:
- `result`: voicemail / no_answer / answered / completed
- `hangupReason`: contact_ended / ai_ended / voicemail / transferred
- `appointmentScheduled`: boolean
- `sentiment`: positive / neutral / negative
- `detectedInterest`: high / medium / low
- `mentionedProject`: nombre del proyecto
- `suggestedNextAction`: texto
- `transcript`, `summary`, `recordingUrl`, `cost`

Estos eventos están disponibles como condiciones en automatizaciones.

**Auto Follow-Up:**
- Si Chat Agent tiene `autoFollowUpAutomationId` configurado Y el cliente no responde en X tiempo → disparar la automatización seleccionada

### 3.8 Automatizaciones

**Ejecución:**
- Trigger → crear AutomationExecution con status=running
- Procesar nodos secuencialmente
- Cada nodo genera entry en `executionLog`
- Si nodo falla → status=failed, registrar error
- Si nodo es "Wait" → pausar ejecución y reactivar al cumplir tiempo

**Cancelación automática:**
- Si el contacto entra en DND → automatizaciones pausan envío de mensajes (otras acciones continúan)
- Si el contacto sale del workspace → automatización se cancela

**Idempotencia:**
- Cada nodo debe ser idempotente (ejecutar 2 veces el mismo nodo = mismo resultado)
- Especialmente importante en webhooks externos y creación de registros

### 3.9 WhatsApp CRM Agent

**Flujo de procesamiento:**
1. Mensaje entrante al número del CRM
2. Identificar usuario por teléfono → obtener permisos
3. Si voz → transcribir con Whisper
4. Si imagen → procesar con Claude Vision
5. Claude con Function Calling interpreta intención
6. Generar plan de acciones
7. Enviar al usuario: resumen + "¿Confirmas? Responde sí/no"
8. Esperar respuesta
9. Si "sí" → ejecutar acciones, reportar resultado
10. Si "no" → cancelar, ofrecer ajustar petición
11. Si no responde en 5 min → cancelar la sesión

**Permisos:**
- Las acciones que ejecuta el agente respetan los permisos del usuario que envió el mensaje
- Si pide algo fuera de su scope → agente responde "No tienes permiso para esta acción"

**Imágenes especiales:**
- Foto de tarjeta de presentación → extraer datos y crear contacto
- Comprobante de pago → vincular a cliente y registrar cobro
- Captura de conversación → analizar y añadir como nota al contacto

---

## 4. REGLAS DE DESARROLLO INMOBILIARIO

### 4.1 Proyectos

**Selector global:**
- En todo el módulo, el selector de proyecto en la barra superior filtra todos los menús
- Selección multi-checkbox: se pueden seleccionar varios proyectos a la vez
- Si no hay selección → mostrar todos

### 4.2 Unidades

**Generación masiva:**
- Al crear edificio con N pisos y M unidades por piso → opción de generar todas las unidades
- Nomenclatura automática: piso + letra (1A, 1B, 1C, 1D, 2A, ...)
- Cada unidad generada hereda configuración base + permite edición individual posterior

**Estados de la unidad:**
- DISPONIBLE → BLOQUEADA (al crear bloqueo)
- DISPONIBLE → RESERVADA (al crear reserva)
- BLOQUEADA → DISPONIBLE (al vencer bloqueo o liberar)
- BLOQUEADA → RESERVADA (al convertir bloqueo)
- RESERVADA → DISPONIBLE (al vencer reserva o cancelar)
- RESERVADA → VENDIDA (al convertir a venta)
- VENDIDA → ENTREGADA (al firmar acta de entrega)

### 4.3 Bloqueos

**Vencimiento automático:**
- Cada hora un job revisa bloqueos cuya `expiresAt` ya pasó
- Si status = ACTIVE → cambiar a EXPIRED, unidad → DISPONIBLE
- Notificación al responsable y admin

**Aviso anticipado:**
- 24h antes de vencer → notificación al responsable
- Estado visual cambia a EXPIRING_SOON

**Conversión a reserva:**
- Al crear reserva desde un bloqueo → bloqueo status = CONVERTED_TO_RESERVATION
- Unidad pasa de BLOQUEADA a RESERVADA
- Datos del bloqueo se precargan en la reserva (cliente, asesor)

### 4.4 Reservas

**Creación:**
- Solo se pueden crear reservas sobre unidades DISPONIBLES o BLOQUEADAS
- Al crear → unidad cambia a RESERVADA
- Si viene de bloqueo → datos precargados

**Vencimiento:**
- Cada hora un job revisa reservas cuya `expiresAt` pasó
- Si status = ACTIVE → cambiar a EXPIRED, alerta al admin
- Admin decide: liberar (unidad → DISPONIBLE) o extender vigencia

**Conversión a venta:**
- Al crear venta desde una reserva → reserva status = CONVERTED_TO_SALE
- Automáticamente:
  1. Crear Sale con datos precargados
  2. Generar PaymentPlan según template del proyecto
  3. Calcular Commission según Hard Owner
  4. Crear Customer vinculado al contacto
  5. Mover contacto en CRM a etapa "Ganado"
  6. Activar Client Portal en el contacto
  7. Notificar al admin

### 4.5 Ventas

**Flujo de creación (cascade):**
Cuando se crea una venta, el sistema ejecuta en transacción:
```
1. Crear Sale (status=active)
2. Cambiar Unit.status a VENDIDA
3. Buscar PaymentPlanTemplate del proyecto
4. Crear PaymentPlan con cuotas calculadas:
   - Reservación: monto fijo
   - Pago Inicial: initialPercent × finalPrice
   - Cuotas Construcción: constructionPercent × finalPrice / N cuotas
   - Pago Final: finalPercent × finalPrice
5. Generar PaymentInstallments según periodicidad
6. Calcular Commission según CommissionConfig:
   - Buscar % aplicable según soldBy + hardOwner
   - amount = finalPrice × percent / 100
   - Crear Commission (status=pending)
7. Crear Customer vinculado al contactId
8. Si la unidad tiene reserva vinculada → reservation.status = CONVERTED_TO_SALE
9. En el CRM: contact.currentStageId = stage where isWon=true del pipeline activo
10. Generar ContactEvent: "Venta cerrada - Unidad X"
11. Activar Customer.portalEnabled = true
12. Generar Notification al admin
```

### 4.6 Cobros (Payments)

**Reglas de estado:**
- `receivedAmount === expectedAmount` → status = PAID
- `receivedAmount > 0 && receivedAmount < expectedAmount` → status = PARTIAL
- `receivedAmount === 0 && now < dueDate` → status = PENDING
- `receivedAmount === 0 && now > dueDate` → status = OVERDUE

**Recordatorios automáticos:**
- Job diario revisa todos los Payment con status = PENDING
- Si `dueDate - now <= 3 días` Y `reminder3DaysBefore = false`:
  - Enviar WhatsApp + Email al cliente
  - Marcar `reminder3DaysBefore = true`
- Si `dueDate === today` Y `reminderDueDate = false`:
  - Enviar WhatsApp + Email al cliente
  - Marcar `reminderDueDate = true`
- Si `now > dueDate`:
  - Cambiar status a OVERDUE
  - Notificar al admin y asesor del cliente

**IA Asistente — detección de morosidad:**
- Analizar patrón histórico de pagos por cliente
- Si pago actual está más allá de X días de su patrón promedio → marcar como "alto riesgo"
- Card de alerta en dashboard de Cobros del módulo Desarrollo Inmobiliario

**Actualización del PaymentPlan:**
- Al registrar pago → `paymentPlan.totalPaid += receivedAmount`
- Actualizar PaymentInstallment correspondiente
- Si fue pago completo de cuota → installment.status = paid

### 4.7 Contratos

**Generación automática:**
1. Usuario crea contrato con tipo seleccionado
2. Sistema busca ContractTemplate activa para ese tipo
3. Leer el archivo .docx
4. Reemplazar todas las variables `{{...}}` con datos reales:
   - Datos del cliente (Contact)
   - Datos de la unidad (Unit)
   - Datos del proyecto (Project)
   - Datos de la empresa (Workspace)
   - Datos de la venta (Sale)
   - Datos del plan de pago (PaymentPlan)
   - Fechas dinámicas
5. Convertir .docx → PDF
6. Guardar como `generatedPdfUrl`
7. Usuario previsualiza, puede ajustar
8. Si activa firma digital → enviar al cliente

**Firma digital:**
- Generar `signatureLink` único y temporal
- Enviar por email + WhatsApp al cliente
- Cliente firma desde su teléfono (canvas o pad)
- Sistema guarda firma como imagen
- Genera versión final del PDF con firmas incrustadas
- `signedPdfUrl` se actualiza
- Status → SIGNED
- Copia firmada enviada por email a todas las partes

### 4.8 Comisiones

**Cálculo automático:**
- Trigger: creación de Sale
- Leer CommissionConfig del workspace
- Determinar % aplicable:

```
if soldBy == ASESOR_INTERNO:
    if hardOwner == COMPANIA:
        percent = config.internalCompany
    else:
        percent = config.internalAsesor
else: // AGENCIA
    if hardOwner == COMPANIA:
        percent = config.externalAgency
    else:
        percent = config.externalAgencyAsesor

amount = sale.finalPrice × percent / 100

create Commission(
  saleId, type, asesorUserId or agencyId,
  hardOwner, percent, amount, status=PENDING
)
```

**Flujo de aprobación:**
- PENDING → Admin revisa → APPROVED o REJECTED
- APPROVED → Notificación al beneficiario
- APPROVED → Admin registra pago → PAID
- PAID → Notificación al beneficiario

### 4.9 Cliente y CRM (sincronización)

**Al crear Customer desde Sale:**
- Customer.contactId = sale.contact_id (mismo registro, no duplicado)
- En CRM: contact.currentStageId = stage donde isWon=true
- Activar `Customer.portalEnabled = true`
- Generar credenciales del portal y enviar por email
- ContactEvent: "Convertido a cliente - Unidad X, Proyecto Y"

**Al cambiar Customer.status:**
- IN_PROCESS → SIGNATURE_PENDING (cuando hay contrato esperando firma)
- SIGNATURE_PENDING → CONTRACT_SIGNED (cuando firma el contrato definitivo)
- CONTRACT_SIGNED → IN_CONSTRUCTION (cuando el proyecto entra en construcción)
- IN_CONSTRUCTION → DELIVERED (cuando se completa Acta de Entrega)

### 4.10 Manejo de Obra

**Órdenes de Trabajo:**
- Al cambiar a COMPLETED → habilitar registro de pago al proveedor/subcontratista
- Foto de avance es opcional pero recomendada

**Presupuesto vs Ejecutado:**
- Cuando se registra `SupplierPayment` con `budgetItemId`:
  - `budgetItem.executedAmount += payment.amount`
  - Recalcular estado:
    - `executed < 0.8 × budgeted` → IN_BUDGET
    - `0.8 × budgeted <= executed < budgeted` → NEAR_LIMIT
    - `executed >= budgeted` → OVER_BUDGET
    - Si la WorkOrder vinculada está COMPLETED → COMPLETED

**Cronograma:**
- Si `now > plannedEndDate` Y status = IN_PROGRESS → cambiar a DELAYED
- Si se completa: `now <= plannedEndDate` → COMPLETED_ON_TIME, sino COMPLETED_LATE

**Avance de Obra:**
- Mínimo 1 foto requerida por entrada
- Si la entrada es marcada `visibleToCustomers=true` → los clientes ven la foto en su portal
- Stream en vivo configurable por proyecto → URL visible en página web pública si está activada

**Inspecciones:**
- Al programar → notificación al inspector
- Checklist se precarga desde InspectionTemplate
- Si resultado = REJECTED Y `requiresReinspection=true` → crear nueva inspección programada
- Si APPROVED_WITH_OBSERVATIONS → generar items en Punch List automáticamente

**Acta de Entrega:**
- Solo se puede crear sobre Customer con status = IN_CONSTRUCTION (o anterior)
- Checklist precargado de DeliveryActTemplate
- Mínimo 5 fotos requeridas
- Ambas firmas son obligatorias para completar
- Al completar:
  - `Unit.status = ENTREGADA`
  - `Customer.status = DELIVERED`
  - `customer.portalEnabled = true` (mantener acceso al portal post-entrega)
  - Generar PDF firmado y enviar por email al cliente
  - Guardar en ContactDocument

**Garantías:**
- Solo se pueden crear garantías sobre unidades ENTREGADAS
- Notificación al responsable asignado
- Si `priority = ALTA` → notificación inmediata, deadline 24h
- Resolución requiere foto del antes y después

**Punch List:**
- Se puede crear vinculado a un Acta de Entrega o de forma independiente
- Estado del Punch List según items:
  - Todos PENDING → OPEN
  - Algunos en progreso o resueltos → IN_PROGRESS
  - >80% resueltos → NEAR_COMPLETE
  - 100% RESOLVED → COMPLETED
- Cada item resuelto requiere foto del "después"
- Al cerrarse → notificación al cliente y admin

---

## 5. REGLAS DE NOTIFICACIONES

### 5.1 Disparadores in-app
| Evento | Destinatario | Canal |
|---|---|---|
| Nuevo mensaje entrante | owner del contacto | in-app + push |
| Nuevo mensaje (si no hay owner) | team inbox | in-app |
| Tarea vencida | asignado | in-app + push |
| Tarea próxima a vencer (2h antes) | asignado | in-app |
| Cita en 30 min | asignado | in-app + push |
| Contacto compartido contigo | receptor | in-app |
| Negocio movido de etapa | owner + followers | in-app |
| @mención en nota | usuario mencionado | in-app + email |
| Agente IA pausado (killswitch) | admin | in-app |
| WhatsApp desconectado | admin + asesor | in-app + email |
| Cuota vencida | admin + asesor | in-app + email |
| Nueva reserva creada | admin | in-app |
| Nueva venta creada | admin | in-app + email |
| Comisión aprobada | beneficiario | in-app + email |
| Comisión pagada | beneficiario | in-app + email |

### 5.2 WhatsApp a clientes
- Recordatorio cuota 3 días antes
- Recordatorio cuota día del vencimiento
- Confirmación de cita agendada
- Recordatorio de cita 24h antes
- Documento pendiente de firma

### 5.3 Email transaccional
- Bienvenida + link de activación → usuario nuevo
- Restablecimiento de contraseña → usuario
- Resumen diario de actividad → admin (opcional, configurable)
- Credenciales del portal → cliente nuevo
- Documento firmado → cliente + admin

---

## 6. REGLAS DEL AI QUERY LAYER

### 6.1 MCP Server propio
- Expone tools que permiten consultar:
  - Contactos
  - Conversaciones
  - Deals
  - Tareas
  - Ventas
  - Cobros
  - Unidades
  - Cualquier entidad del sistema
- Cada query respeta los permisos del usuario que la ejecuta
- Resultados devueltos en formato estructurado

### 6.2 Chat IA in-app
- Campo de texto disponible en dashboards
- Claude con Function Calling consulta la BD vía tools
- Respuestas en lenguaje natural con datos reales
- Ejemplo:
  - Usuario: "¿Cuál fue el mes con más ventas en Jardines IV?"
  - Sistema: ejecuta query SQL agregada → "El mes con más ventas en Jardines IV fue marzo con 14 ventas por un total de $2.4M"

### 6.3 ClickHouse para analytics
- Todos los eventos significativos se replican a ClickHouse:
  - Mensajes
  - Llamadas
  - Cambios de etapa
  - Ventas
  - Cobros
  - Visitas a la web
- Queries analíticas complejas usan ClickHouse en lugar de PostgreSQL
- Ejemplo: "Tasa de conversión por fuente en últimos 90 días" → ClickHouse

---

## 7. REGLAS DE INTEGRACIONES

### 7.1 Twilio
- Cada número asignado a un asesor (1:1)
- Pools de números para outbound de agentes IA
- Llamadas entrantes a un número → ruteo al asesor asignado o al agente IA configurado
- Grabación habilitada por default
- Transcripción automática post-call con Whisper

### 7.2 Evolution API
- Cada asesor tiene su propia instancia
- QR code para conectar/reconectar
- Si la sesión se cae → notificación al asesor
- Audios entrantes transcritos automáticamente con Whisper
- Imágenes entrantes procesadas con Claude Vision para detectar tarjetas, comprobantes, capturas

### 7.3 Meta Business API (WhatsApp oficial)
- Solo para el número del CRM (no para asesores individuales)
- Mensajes salientes deben usar templates aprobados (limitación de Meta)
- Mensajes entrantes son libres

### 7.4 AlterEstate (Red Inmobiliaria)
- Credenciales cifradas en IntegrationCredential
- Iframe carga `app.alterestate.com/trexo` con auto-login
- No hay sincronización de datos — solo navegación dentro del iframe

### 7.5 Retell AI
- Agentes creados en Autopilot se sincronizan con Retell vía API
- Cambios en Retell se reflejan en Autopilot al abrir el agente
- Llamadas ejecutadas por Retell, datos persistidos en AiCall

### 7.6 Google Calendar
- OAuth por usuario
- Token refrescado automáticamente
- Sync bidireccional cada 5 minutos + webhook push de Google

---

## 8. REGLAS DE SEGURIDAD

### 8.1 Encriptación
- Passwords: bcrypt o argon2
- Credenciales de integraciones: AES-256 at rest
- TLS 1.3 en todas las comunicaciones
- Datos personales: encriptación nivel columna en campos sensibles

### 8.2 Rate Limiting
- API: 100 requests/minuto por API key
- Login: 5 intentos por IP cada 15 minutos
- Webhooks entrantes: 1000/minuto por workspace

### 8.3 Backups
- Snapshots diarios de la BD
- Retención de 30 días
- Replicación cross-region en Supabase

### 8.4 GDPR / Privacy
- Soft delete preserva datos 30 días para recuperación
- Cliente puede solicitar exportación de sus datos (JSON)
- Cliente puede solicitar eliminación permanente

---

## 9. REGLAS DE PERFORMANCE

### 9.1 Caching (Redis)
- Sesiones de usuario
- Permisos por usuario (TTL 5 min)
- Métricas del dashboard (TTL 1 min)
- Knowledge base lookups frecuentes (TTL 1 hora)

### 9.2 Background Jobs
- Recordatorios de cobro: job diario a las 8 AM
- Recordatorios de cita: job cada hora
- Vencimiento de bloqueos/reservas: job cada hora
- Cleanup de soft deletes >30 días: job semanal
- Sync con Google Calendar: webhook + job de respaldo cada 6 horas
- Replicación a ClickHouse: streaming en tiempo real

### 9.3 Optimizaciones de BD
- Índices en todas las foreign keys
- Índices en `workspaceId` de todas las tablas multi-tenant
- Índices compuestos en queries frecuentes (workspaceId + status + createdAt)
- Particionamiento de tablas grandes por workspaceId si superan 10M filas

---

## 10. ESTADOS Y TRANSICIONES

### 10.1 Contact
No tiene estados — usa `currentStageId` del pipeline activo.

### 10.2 Deal
- `active` → `won` (al llegar a etapa isWon)
- `active` → `lost` (al llegar a etapa isLost)

### 10.3 Block
- ACTIVE → EXPIRING_SOON (24h antes de vencer)
- EXPIRING_SOON → EXPIRED (al pasar fecha sin acción)
- ACTIVE → RELEASED (manual)
- ACTIVE → CONVERTED_TO_RESERVATION (al crear reserva)

### 10.4 Reservation
- ACTIVE → EXPIRING_SOON → EXPIRED
- ACTIVE → CONVERTED_TO_SALE (al crear venta)
- ACTIVE → CANCELLED

### 10.5 Sale
- ACTIVE (default)
- IN_SIGNING_PROCESS (cuando contratos están pendientes)
- CANCELLED (admin cancela)
- IN_DISPUTE (admin marca)

### 10.6 Payment
- PENDING (default, antes del vencimiento)
- PARTIAL (pago parcial registrado)
- PAID (pago completo)
- OVERDUE (pasó vencimiento sin pago)
- CANCELLED (admin cancela)

### 10.7 Contract
- DRAFT → SENT_FOR_SIGNATURE → SIGNED → NOTARIZED
- En cualquier estado → CANCELLED

### 10.8 Commission
- PENDING → APPROVED → PAID
- PENDING → REJECTED

### 10.9 Customer
- IN_PROCESS → SIGNATURE_PENDING → CONTRACT_SIGNED → IN_CONSTRUCTION → DELIVERED
- En cualquier momento → CANCELLED

### 10.10 Unit
- DISPONIBLE → BLOQUEADA → RESERVADA → VENDIDA → ENTREGADA
- Cualquier estado intermedio puede volver a DISPONIBLE si se libera

---

## 11. ORDEN DE CONSTRUCCIÓN RECOMENDADO

Para que Antigravity construya con menor riesgo de retrabajo:

### Fase 1A — Fundación
1. Setup del proyecto Next.js + Prisma + Supabase
2. Schema completo aplicado (migración inicial)
3. Auth + multi-tenancy + roles
4. Onboarding inicial

### Fase 1B — CRM Core
5. Contactos (CRUD + búsqueda + filtros)
6. Pipelines y Negocios (Kanban + Lista)
7. Tareas
8. Calendarios y Citas

### Fase 1C — CRM Avanzado
9. Conversaciones (bandeja unificada)
10. Tags y Custom Fields
11. Campañas y round robin
12. Notificaciones

### Fase 1D — Integraciones
13. Twilio (llamadas + SMS)
14. Evolution API (WhatsApp personal)
15. Meta Business API (WhatsApp oficial)
16. Google Calendar
17. Facebook/Instagram

### Fase 1E — IA
18. Knowledge Base
19. Agentes (sync con Retell)
20. Enrutamiento
21. IA Asistente (scoring + sugerencias)
22. WhatsApp CRM Agent
23. AI Query Layer

### Fase 1F — Automatizaciones
24. Constructor visual
25. Chat IA constructor
26. Webhooks I/O
27. API REST

### Fase 1G — Desarrollo Inmobiliario
28. Proyectos / Edificios / Unidades
29. Disponibilidad visual
30. Planes de Pago (templates + generación)
31. Bloqueos / Reservas / Ventas (con cascada)
32. Cobros + recordatorios
33. Comisiones (cálculo automático)
34. Clientes (sync con CRM)
35. Contratos (generación con plantillas + firma digital)
36. Agencias / Staff / Mis Métricas
37. Reportes

### Fase 1H — Manejo de Obra
38. Órdenes de Trabajo
39. Presupuesto y Cronograma
40. Avance de Obra (con cámara en vivo)
41. Inspecciones
42. Subcontratistas / Proveedores
43. Inbox Proveedores
44. Pagos a Proveedores
45. Supervisión de Áreas
46. Actas de Entrega
47. Garantías y Punch List

### Fase 1I — Panel de Agencia (Super Admin)
48. Dashboard global
49. Gestión de empresas y módulos
50. Impersonalización

### Fase 1J — Pulido
51. Audit Logs visualizables
52. Búsqueda global Cmd+K
53. Optimización de queries (ClickHouse para analytics)
54. Tests E2E críticos
55. Documentación interna

---

**Fin del Documento 3 — Reglas de Negocio**

---

## RESUMEN DE LOS 3 DOCUMENTOS

| # | Documento | Contenido |
|---|---|---|
| 1 | **PRD General** | Visión, stack, módulos, pantallas, features, roles, integraciones |
| 2 | **Schema de Datos (.prisma)** | Modelos completos de la base de datos PostgreSQL |
| 3 | **Reglas de Negocio** | Comportamiento automático, transiciones de estado, jobs, validaciones |

Estos 3 documentos juntos constituyen el contrato técnico completo para construir Autopilot — Fase 1.
