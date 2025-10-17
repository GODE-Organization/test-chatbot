# Sistema de Integración con IA Externa (Google Gemini)

Este documento describe el sistema de integración con Google Gemini implementado en el chatbot de Telegram para Tecno Express.

## Arquitectura General

El sistema está diseñado para recibir mensajes de usuarios, enviarlos a Google Gemini, procesar la respuesta JSON y ejecutar las acciones correspondientes.

```
Usuario → Bot → Google Gemini → Bot → Usuario
```

## Integración con Google Gemini

El sistema utiliza Google Gemini 2.5 Flash como motor de IA principal, con las siguientes características:

- **Modelo**: `gemini-2.5-flash`
- **Personalidad**: "Max", Asistente Virtual de Tecno Express
- **Empresa**: Tecno Express (electrodomésticos)
- **Desarrollado por**: GODE Devs
- **Ubicación**: Porlamar, Nueva Esparta, Venezuela

## Formato JSON de Respuesta de Gemini

Google Gemini debe responder con el siguiente formato JSON:

```json
{
  "response": {
    "text": "Texto de respuesta al usuario",
    "parse_mode": "Markdown" | "HTML" | null,
    "reply_markup": {
      "inline_keyboard": [...],
      "keyboard": [...]
    },
    "images": [
      {
        "file_id": "string",
        "product": { /* datos del producto */ }
      }
    ]
  },
  "actions": [
    {
      "command": "CONSULT_CATALOG" | "CONSULT_GUARANTEES" | "REGISTER_GUARANTEE" | "CONSULT_SCHEDULE" | "SEND_GEOLOCATION" | "SEND_IMAGE" | "END_CONVERSATION",
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
Consulta el catálogo de productos con conversión automática de precios USD a Bs.

**Parámetros:**
- `filters` (opcional): Filtros de búsqueda
  - `brand`: Marca del producto
  - `minPrice`: Precio mínimo en USD
  - `maxPrice`: Precio máximo en USD
- `limit` (opcional): Número máximo de productos a retornar (recomendado: 5-10)

**Características especiales:**
- Conversión automática USD → Bs (bolívares venezolanos)
- Formateo inteligente por Gemini
- Soporte para imágenes de productos
- Muestra ambos precios: USD y Bs

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

**Flujo secuencial:**
1. Solicitar número de factura (texto)
2. Solicitar foto de la factura (imagen)
3. Solicitar foto del producto (imagen)
4. Solicitar descripción del problema (texto)
5. Registrar en base de datos

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

### 6. SEND_IMAGE
Envía imagen de un producto específico.

**Parámetros:**
- `product_id` (obligatorio): ID del producto
- `file_id` (obligatorio): ID del archivo de imagen

**Ejemplo:**
```json
{
  "command": "SEND_IMAGE",
  "parameters": {
    "product_id": 123,
    "file_id": "BAADBAADrwADBREAAYag"
  }
}
```

### 7. END_CONVERSATION
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

Cuando se ejecuta el comando `REGISTER_GUARANTEE`, se inicia un flujo secuencial controlado por estados:

### Estados del Flujo:
1. **`waiting_invoice_number`**: Esperando número de factura (texto)
2. **`waiting_invoice_photo`**: Esperando foto de la factura (imagen)
3. **`waiting_product_photo`**: Esperando foto del producto (imagen)
4. **`waiting_description`**: Esperando descripción del problema (texto)
5. **`completed`**: Flujo completado

### Validaciones:
- Número de factura: mínimo 3 caracteres
- Descripción: mínimo 10 caracteres
- Fotos: se valida que sean imágenes válidas

### Cancelación:
El usuario puede cancelar en cualquier momento escribiendo `/cancel`.

## Sistema de Encuestas de Satisfacción

Al finalizar una conversación (por timeout o comando `END_CONVERSATION`), se envía automáticamente una encuesta de satisfacción con botones de calificación del 1 al 5.

### Estados de Encuesta:
- **`survey_waiting`**: Esperando respuesta de encuesta
- **`waiting_for_rating`**: Esperando calificación del usuario

### Respuestas Personalizadas:
- **5 estrellas**: Mensaje de agradecimiento entusiasta
- **4 estrellas**: Mensaje positivo
- **3 estrellas**: Mensaje neutral con motivación
- **2 estrellas**: Mensaje de disculpa con opción de contacto
- **1 estrella**: Mensaje de disculpa con contacto obligatorio

## Timeout de Conversaciones

- Las conversaciones terminan automáticamente después de 15 minutos de inactividad
- Al terminar, se envía una encuesta de satisfacción
- El timeout se renueva con cada mensaje del usuario

## Configuración

### Variables de Entorno

```env
# Google Gemini API Key (obligatorio)
GEMINI_API_KEY=tu_gemini_api_key_aqui

# Timeout para comunicación con Gemini (ms)
AI_TIMEOUT_MS=30000

# Número máximo de reintentos
AI_MAX_RETRIES=3

# Timeout de conversación (minutos)
CONVERSATION_TIMEOUT_MINUTES=15

# Configuración de base de datos SQLite
DATABASE_PATH=./data/bot.db
```

### Estructura de Base de Datos

El sistema utiliza las siguientes tablas:

- `users`: Información de usuarios de Telegram
- `chats`: Información de chats
- `messages`: Historial de mensajes
- `products`: Catálogo de productos con precios USD y Bs
- `guarantees`: Solicitudes de garantía
- `schedules`: Horarios de atención
- `store_config`: Configuración de la tienda
- `satisfaction_surveys`: Encuestas de satisfacción
- `conversations`: Conversaciones activas

### Características de la Base de Datos:
- **SQLite**: Base de datos local
- **Conversión de moneda**: Automática USD → Bs
- **Historial de mensajes**: Para contexto de conversación
- **Sesiones persistentes**: Estados de usuario mantenidos

## Estados de Sesión

El bot maneja los siguientes estados:

- `idle`: Estado normal
- `guarantee_flow`: Flujo de registro de garantía
- `survey_waiting`: Esperando respuesta de encuesta
- `conversation_ended`: Conversación terminada

### Datos de Sesión:
- **`state`**: Estado actual del usuario
- **`flow_data`**: Datos específicos del flujo activo
- **`ai_session_data`**: Contexto mantenido por Gemini
- **`last_activity`**: Timestamp de última actividad

## Ejemplo de Uso

1. **Usuario envía**: "Quiero ver productos de Samsung"
2. **Bot procesa**: Envía mensaje a Gemini con contexto de conversación
3. **Gemini responde**:
```json
{
  "response": {
    "text": "¡Hola! Soy Max, tu Asistente Virtual de Tecno Express. Te ayudo a encontrar productos Samsung.",
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
4. **Bot ejecuta**: Consulta catálogo con conversión USD→Bs
5. **Gemini formatea**: Los datos se envían de vuelta a Gemini para formateo
6. **Bot responde**: Envía productos formateados con precios en USD y Bs

## Características Avanzadas

### Conversión de Moneda
- **Automática**: USD → Bs (bolívares venezolanos)
- **Tiempo real**: Tasa de cambio actualizada
- **Formato**: "Precio: $X USD / Y Bs (BCV)"

### Formateo Inteligente
- **Gemini formatea**: Catálogos con emojis y estructura
- **Imágenes**: Soporte para mostrar fotos de productos
- **Markdown**: Formateo rico para mejor presentación

### Manejo de Errores
- **Reintentos automáticos**: Hasta 3 intentos con backoff exponencial
- **Fallback inteligente**: Mensajes de error personalizados
- **Logging detallado**: Todos los eventos registrados
- **Recuperación**: Los flujos se pueden cancelar con `/cancel`

### Sistema de Logging

Todos los eventos se registran en los logs:
- **Comunicación con Gemini**: Requests y responses
- **Ejecución de comandos**: Resultados de acciones
- **Errores y excepciones**: Stack traces completos
- **Acciones de usuarios**: Comandos y flujos
- **Timeouts de conversación**: Fin automático de sesiones
- **Conversión de moneda**: Tasa de cambio y errores
- **Formateo de catálogo**: Procesamiento de productos

### Comandos de Usuario

- `/start`: Iniciar bot y mostrar menú principal
- `/help`: Mostrar ayuda y comandos disponibles
- `/settings`: Configuración del usuario
- `/stats`: Estadísticas del bot
- `/contact`: Información de contacto
- `/reset`: Reiniciar sesión
- `/cancel`: Cancelar operación actual
