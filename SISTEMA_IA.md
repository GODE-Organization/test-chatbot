# Sistema de Integración con IA Externa

Este documento describe el sistema de integración con IA externa implementado en el chatbot de Telegram.

## Arquitectura General

El sistema está diseñado para recibir mensajes de usuarios, enviarlos a una IA externa, procesar la respuesta JSON y ejecutar las acciones correspondientes.

```
Usuario → Bot → IA Externa → Bot → Usuario
```

## Formato JSON de la IA Externa

La IA externa debe responder con el siguiente formato JSON:

```json
{
  "response": {
    "text": "Texto de respuesta al usuario",
    "parse_mode": "Markdown" | "HTML" | null,
    "reply_markup": {
      "inline_keyboard": [...],
      "keyboard": [...]
    }
  },
  "actions": [
    {
      "command": "CONSULT_CATALOG" | "CONSULT_GUARANTEES" | "REGISTER_GUARANTEE" | "CONSULT_SCHEDULE" | "SEND_GEOLOCATION" | "END_CONVERSATION",
      "parameters": {
        // Parámetros específicos según el comando
      }
    }
  ],
  "session_data": {
    // Datos que la IA quiere mantener en la sesión
  }
}
```

## Comandos Disponibles

### 1. CONSULT_CATALOG
Consulta el catálogo de productos.

**Parámetros:**
- `filters` (opcional): Filtros de búsqueda
  - `brand`: Marca del producto
  - `minPrice`: Precio mínimo
  - `maxPrice`: Precio máximo
- `limit` (opcional): Número máximo de productos a retornar

**Ejemplo:**
```json
{
  "command": "CONSULT_CATALOG",
  "parameters": {
    "filters": {
      "brand": "Samsung",
      "minPrice": 100,
      "maxPrice": 500
    },
    "limit": 10
  }
}
```

### 2. CONSULT_GUARANTEES
Consulta las garantías de un usuario.

**Parámetros:**
- `user_id` (obligatorio): ID del usuario

**Ejemplo:**
```json
{
  "command": "CONSULT_GUARANTEES",
  "parameters": {
    "user_id": 12345
  }
}
```

### 3. REGISTER_GUARANTEE
Inicia el flujo de registro de garantía.

**Parámetros:** Ninguno

**Ejemplo:**
```json
{
  "command": "REGISTER_GUARANTEE",
  "parameters": {}
}
```

### 4. CONSULT_SCHEDULE
Consulta los horarios de atención.

**Parámetros:** Ninguno

**Ejemplo:**
```json
{
  "command": "CONSULT_SCHEDULE",
  "parameters": {}
}
```

### 5. SEND_GEOLOCATION
Envía la ubicación de la tienda.

**Parámetros:** Ninguno

**Ejemplo:**
```json
{
  "command": "SEND_GEOLOCATION",
  "parameters": {}
}
```

### 6. END_CONVERSATION
Termina la conversación y envía encuesta de satisfacción.

**Parámetros:**
- `reason` (opcional): Razón del fin de conversación

**Ejemplo:**
```json
{
  "command": "END_CONVERSATION",
  "parameters": {
    "reason": "Usuario satisfecho"
  }
}
```

## Flujo de Registro de Garantías

Cuando se ejecuta el comando `REGISTER_GUARANTEE`, se inicia un flujo secuencial:

1. **Solicitar número de factura** (texto)
2. **Solicitar foto de la factura** (imagen)
3. **Solicitar foto del producto** (imagen)
4. **Solicitar descripción del problema** (texto)
5. **Registrar en base de datos**

El usuario puede cancelar en cualquier momento escribiendo `/cancel`.

## Sistema de Encuestas de Satisfacción

Al finalizar una conversación (por timeout o comando `END_CONVERSATION`), se envía automáticamente una encuesta de satisfacción con botones de calificación del 1 al 5.

## Timeout de Conversaciones

- Las conversaciones terminan automáticamente después de 15 minutos de inactividad
- Al terminar, se envía una encuesta de satisfacción
- El timeout se renueva con cada mensaje del usuario

## Configuración

### Variables de Entorno

```env
# URL del servicio de IA externa
AI_EXTERNAL_URL=http://localhost:3001/api/ai

# API Key para autenticación (opcional)
AI_API_KEY=tu_api_key_aqui

# Timeout para comunicación con IA (ms)
AI_TIMEOUT_MS=30000

# Número máximo de reintentos
AI_MAX_RETRIES=3

# Timeout de conversación (minutos)
CONVERSATION_TIMEOUT_MINUTES=15
```

### Estructura de Base de Datos

El sistema utiliza las siguientes tablas:

- `products`: Catálogo de productos
- `guarantees`: Solicitudes de garantía
- `schedules`: Horarios de atención
- `store_config`: Configuración de la tienda
- `satisfaction_surveys`: Encuestas de satisfacción
- `conversations`: Conversaciones activas

## Estados de Sesión

El bot maneja los siguientes estados:

- `idle`: Estado normal
- `guarantee_flow`: Flujo de registro de garantía
- `survey_waiting`: Esperando respuesta de encuesta
- `conversation_ended`: Conversación terminada

## Ejemplo de Uso

1. Usuario envía: "Quiero ver productos de Samsung"
2. Bot envía a IA externa: `{"message": "Quiero ver productos de Samsung", "user_id": 12345, "session_data": {}}`
3. IA responde:
```json
{
  "response": {
    "text": "Aquí tienes nuestros productos Samsung:",
    "parse_mode": "Markdown"
  },
  "actions": [
    {
      "command": "CONSULT_CATALOG",
      "parameters": {
        "filters": {"brand": "Samsung"},
        "limit": 5
      }
    }
  ]
}
```
4. Bot ejecuta la consulta y envía los productos al usuario

## Manejo de Errores

- Si la IA externa no responde, se muestra un mensaje de error
- Si hay errores en la base de datos, se registran en los logs
- Los timeouts se manejan automáticamente
- Los flujos se pueden cancelar con `/cancel`

## Logging

Todos los eventos se registran en los logs:
- Comunicación con IA externa
- Ejecución de comandos
- Errores y excepciones
- Acciones de usuarios
- Timeouts de conversación
