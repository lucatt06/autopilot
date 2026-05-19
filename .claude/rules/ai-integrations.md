# Regla: Integraciones de IA

## Servicios y cuándo usar cada uno

| Servicio | Cuándo |
|---|---|
| **Claude API** (Anthropic) | Function Calling, agentes conversacionales, IA Asistente, análisis de texto en español |
| **OpenAI embeddings** | Generar vectores para Knowledge Base (`text-embedding-3-small`) |
| **Pinecone** | Vector DB para búsqueda semántica con hybrid search + metadata filtering |
| **Retell AI** | Agentes de voz outbound/inbound (síntesis de la conversación + LLM + STT) |
| **ElevenLabs** | TTS de alta calidad (Flash v2.5 para latencia mínima) |
| **OpenAI Whisper** | Transcripción de notas de voz entrantes de WhatsApp |
| **Claude Vision** | Procesar imágenes entrantes (tarjetas, comprobantes, capturas) |

## Patrones obligatorios

### Knowledge Base con Pinecone

**Hybrid search obligatorio** (semántico + keywords):
```typescript
const results = await pinecone.index('autopilot-kb').query({
  vector: embedding,
  topK: 5,
  filter: {
    workspaceId: ws.id,
    projectId: ctx.projectId, // metadata filtering obligatorio
  },
  includeMetadata: true,
})
```

**Metadata filtering por proyecto obligatorio** — no mezclar información entre proyectos similares (ej: dos proyectos del mismo desarrollador con precios diferentes).

### Function Calling con Claude

Cada agente tiene functions definidas:
```typescript
const tools = [
  {
    name: 'consultarDisponibilidad',
    description: 'Consulta unidades disponibles en un proyecto',
    input_schema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        unitType: { type: 'string' },
        budgetMax: { type: 'number' },
      },
      required: ['projectId'],
    },
  },
  // ...
]
```

### Eventos estructurados de llamadas IA

Cada AiCall DEBE generar evento con campos:
- `result`: voicemail / no_answer / answered / completed
- `hangupReason`: contact_ended / ai_ended / voicemail / transferred
- `appointmentScheduled`: boolean
- `sentiment`: positive / neutral / negative
- `detectedInterest`: high / medium / low
- `mentionedProject`: nombre del proyecto
- `suggestedNextAction`: texto
- `transcript`, `summary`, `recordingUrl`, `cost`

Estos campos se usan como condiciones en automatizaciones.

## WhatsApp CRM Agent (feature crítico)

### Flujo obligatorio
1. Mensaje entrante al número del CRM
2. Identificar usuario por número → cargar permisos
3. Si voz → transcribir con Whisper
4. Si imagen → procesar con Claude Vision
5. Claude con Function Calling interpreta intención
6. Presentar plan al usuario: "¿Confirmas? Sí/No"
7. Esperar respuesta
8. Si "sí" → ejecutar, reportar resultado ("2 ✅ / 0 ❌")
9. Si "no" → cancelar, ofrecer ajustar
10. Si no responde en 5 min → cancelar sesión

### Respetar permisos
Las acciones que ejecuta el agente respetan los permisos del usuario que envió el mensaje. Si pide algo fuera de su scope → agente responde "No tienes permiso para esta acción".

## Modelos a usar

| Tarea | Modelo recomendado |
|---|---|
| Function Calling complejo (WhatsApp CRM Agent) | `claude-opus-4-7` o latest Sonnet |
| Análisis de texto/sentimiento | `claude-sonnet-latest` |
| Generación rápida (mensajes simples) | `claude-haiku-latest` |
| Embeddings | `text-embedding-3-small` |
| Voz IA (agentes Retell) | Modelo configurable por agente |

## Cost management

- Streaming siempre que sea posible (mejor UX)
- Caching de embeddings (no re-generar para el mismo texto)
- Batch operations en background cuando aplique
- Logear cost por cada llamada a Anthropic/OpenAI

## Manejo de errores con servicios IA

```typescript
try {
  const response = await anthropic.messages.create({...})
  // ...
} catch (error) {
  if (error.status === 529) {
    // Overloaded - retry with backoff
  } else if (error.status === 401) {
    // Auth issue - alertar admin
  } else {
    // Log and fallback
  }
}
```

## NO hacer

```typescript
// ❌ Hardcodear API keys
const anthropic = new Anthropic({ apiKey: 'sk-ant-...' })

// ✅ Desde env (encriptado en producción)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
```

```typescript
// ❌ Mezclar contextos de proyectos
await pinecone.query({ vector, topK: 5 }) // sin filter

// ✅ Filtrar por workspace + proyecto siempre
await pinecone.query({
  vector,
  topK: 5,
  filter: { workspaceId, projectId },
})
```
