# Integración con Google Gemini

Este documento explica cómo configurar y usar la integración con Google Gemini como agente de IA externo.

## Configuración

### 1. Obtener API Key de Google Gemini

1. Ve a [Google AI Studio](https://aistudio.google.com/)
2. Inicia sesión con tu cuenta de Google
3. Crea un nuevo proyecto
4. Genera una API Key
5. Copia la API Key

### 2. Configurar Variables de Entorno

Crea un archivo `.env` basado en `env.example`:

```bash
# Configuración de IA Externa (Google Gemini)
GEMINI_API_KEY=tu_gemini_api_key_aqui

# Timeout para comunicación con IA (en milisegundos)
AI_TIMEOUT_MS=30000

# Número máximo de reintentos para comunicación con IA
AI_MAX_RETRIES=3

# Timeout de conversación (en minutos)
CONVERSATION_TIMEOUT_MINUTES=15
```

## Arquitectura

### Componentes Principales

1. **GeminiService**: Servicio principal que se comunica con la API de Google Gemini
2. **GeminiAdapter**: Adaptador que convierte las respuestas de Gemini al formato interno
3. **AIProcessor**: Procesador que maneja las respuestas y ejecuta las acciones

### Flujo de Comunicación

```
Usuario → Telegram Bot → AIProcessor → GeminiAdapter → GeminiService → Google Gemini API
                ↓
Usuario ← Telegram Bot ← AIProcessor ← GeminiAdapter ← GeminiService ← Google Gemini API
```

## Formato de Respuesta JSON

Gemini debe responder con un JSON estricto en el siguiente formato:

```json
{
  "response": {
    "text": "Tu respuesta al usuario aquí",
    "parse_mode": "Markdown",
    "reply_markup": {
      "inline_keyboard": []
    }
  },
  "actions": [
    {
      "command": "COMANDO_AQUI",
      "parameters": {}
    }
  ],
  "session_data": {
    "contexto": "datos que quieres recordar"
  }
}
```

### Comandos Disponibles

- **CONSULT_CATALOG**: Consultar productos
  - Parámetros: `filters`, `limit`
- **CONSULT_GUARANTEES**: Consultar garantías del usuario
  - Parámetros: `user_id`
- **REGISTER_GUARANTEE**: Iniciar registro de garantía
  - Sin parámetros
- **CONSULT_SCHEDULE**: Consultar horarios
  - Sin parámetros
- **SEND_GEOLOCATION**: Enviar ubicación
  - Sin parámetros
- **END_CONVERSATION**: Terminar conversación
  - Parámetros: `reason`

## Prompt del Sistema

El sistema envía un prompt detallado a Gemini que incluye:

1. **Instrucciones de formato**: Cómo responder con JSON
2. **Comandos disponibles**: Lista de comandos y parámetros
3. **Contexto de conversación**: Datos del usuario y sesión
4. **Instrucciones de comportamiento**: Cómo actuar como asistente de atención al cliente

## Manejo de Errores

### Errores de Comunicación
- Si Gemini no responde, se envía un mensaje de error al usuario
- Se implementan reintentos automáticos
- Timeout configurable

### Errores de Parsing
- Si Gemini no responde con JSON válido, se usa una respuesta de fallback
- Se registran los errores en los logs para debugging

### Errores de Validación
- Se valida que la respuesta tenga la estructura correcta
- Se verifica que los comandos sean válidos

## Logging y Debugging

### Niveles de Log
- **DEBUG**: Mensajes enviados y recibidos de Gemini
- **INFO**: Operaciones exitosas
- **ERROR**: Errores de comunicación y parsing

### Verificación de Conectividad
```typescript
const aiProcessor = AIProcessor.getInstance()
const isConnected = await aiProcessor.checkGeminiConnectivity()
```

## Ejemplo de Uso

```typescript
// Enviar mensaje a Gemini
const result = await aiProcessor.sendMessageToAI(
  "Hola, quiero ver productos",
  userId,
  chatId,
  sessionData
)

if (result.success) {
  // Enviar respuesta al usuario
  await ctx.reply(result.response.text, {
    parse_mode: result.response.parse_mode,
    reply_markup: result.response.reply_markup
  })
  
  // Ejecutar acciones si las hay
  for (const action of result.actions) {
    // Procesar acción...
  }
}
```

## Configuración Avanzada

### Personalizar el Modelo
En `src/bot/ai-integration/gemini-service.ts`:

```typescript
this.model = this.genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash' // Cambiar modelo aquí
})
```

### Personalizar el Prompt
Modifica el método `buildSystemPrompt()` en `GeminiService` para ajustar el comportamiento del asistente.

### Configurar Timeouts
Ajusta `AI_TIMEOUT_MS` en el archivo `.env` para cambiar el timeout de comunicación.

## Troubleshooting

### Error: "GEMINI_API_KEY no está configurada"
- Verifica que la variable de entorno esté configurada correctamente
- Reinicia el bot después de cambiar el `.env`

### Error: "Respuesta de Gemini no tiene estructura válida"
- Gemini no está respondiendo con JSON válido
- Verifica que el prompt del sistema esté bien configurado
- Revisa los logs para ver la respuesta cruda de Gemini

### Error: "Error de comunicación con Gemini"
- Verifica la conectividad a internet
- Confirma que la API Key sea válida
- Revisa los límites de la API de Google Gemini

## Monitoreo

### Métricas Importantes
- Tiempo de respuesta de Gemini
- Tasa de éxito de comunicación
- Errores de parsing
- Uso de comandos

### Logs Recomendados
```bash
# Ver logs en tiempo real
tail -f logs/bot.log | grep -i gemini

# Ver errores específicos
grep -i "error.*gemini" logs/bot.log
```
