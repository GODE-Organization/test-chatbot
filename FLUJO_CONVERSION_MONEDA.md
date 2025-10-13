# Flujo de Conversión de Moneda - Diagrama

## Flujo Completo de la Integración

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Usuario       │    │   Telegram Bot   │    │   AI Processor      │
│   Pregunta      │───▶│   Recibe         │───▶│   Procesa           │
│   Productos     │    │   Mensaje        │    │   CONSULT_CATALOG   │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Usuario       │    │   Telegram Bot   │    │   Product Model     │
│   Ve Precios    │◀───│   Envía          │◀───│   getAllProducts    │
│   USD y Bs      │    │   Respuesta      │    │   WithBsPrice()     │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Gemini        │    │   AI Processor   │    │   Currency          │
│   Formatea      │◀───│   Envía Datos    │◀───│   Converter         │
│   Catálogo      │    │   a Gemini       │    │   getUsdToBsRate()  │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────────┐
                                                │   dolarapi.com      │
                                                │   API Externa       │
                                                │   Tasa USD→Bs       │
                                                └─────────────────────┘
```

## Detalles del Flujo

### 1. Usuario Pregunta Productos
- Usuario envía mensaje como "¿Qué productos tienen?"
- Bot detecta consulta de catálogo

### 2. Procesamiento con IA
- Mensaje se envía a Gemini
- Gemini responde con comando `CONSULT_CATALOG`
- AI Processor ejecuta el comando

### 3. Consulta de Productos con Conversión
- Se llama a `productModel.getAllProductsWithBsPrice()`
- Este método:
  - Obtiene productos de la base de datos
  - Llama a `CurrencyConverter.getUsdToBsRate()`
  - Convierte precios USD a Bs
  - Retorna productos con ambos precios

### 4. Conversión de Moneda
- `CurrencyConverter` consulta API de dolarapi.com
- Obtiene tasa actual USD→Bs
- Aplica cache de 5 minutos
- Maneja errores gracefully

### 5. Formateo por Gemini
- Datos de productos se envían a Gemini
- Gemini formatea con precios en USD y Bs
- Formato: "Precio: $X USD / Y Bs"

### 6. Respuesta al Usuario
- Bot envía catálogo formateado
- Usuario ve productos con ambos precios
- Opción de ver imágenes si están disponibles

## Campos de Datos

### Producto Original
```json
{
  "id": 1,
  "code": "PROD001",
  "brand": "Samsung",
  "price": 100,
  "description": "Producto ejemplo"
}
```

### Producto con Conversión
```json
{
  "id": 1,
  "code": "PROD001",
  "brand": "Samsung",
  "price": 100,
  "price_bs": 19524.91,
  "conversion_rate": 195.2491,
  "conversion_last_updated": "2025-10-13T19:02:55.677Z",
  "description": "Producto ejemplo"
}
```

## Manejo de Errores

### API No Disponible
```json
{
  "price_bs": null,
  "conversion_rate": null,
  "conversion_error": "Error en la API: 500 Internal Server Error"
}
```

### Cache Hit
- Si la tasa está en cache (< 5 min), se usa directamente
- No se hace llamada a la API externa

## Configuración

### Variables de Entorno
```bash
# No se requieren variables adicionales
# La API de dolarapi.com es pública
```

### Cache
- Duración: 5 minutos
- Almacenamiento: Memoria (volátil)
- Limpieza: `CurrencyConverter.clearCache()`

## Logs Generados

```
[INFO] Obteniendo tasa de conversión USD a Bs desde API
[INFO] Tasa de conversión obtenida: 1 USD = 195.2491 Bs
[INFO] Usando datos de conversión desde cache
[ERROR] Error obteniendo tasa de conversión: Error en la API: 500 Internal Server Error
```
