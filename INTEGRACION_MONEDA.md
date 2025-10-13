# Integración de Conversión de Moneda USD a Bolívares

Este documento describe la integración implementada para convertir automáticamente los precios de productos de dólares estadounidenses (USD) a bolívares venezolanos (Bs) utilizando la API de [dolarapi.com](https://ve.dolarapi.com/v1/dolares/oficial).

## Características

- ✅ Conversión automática de precios USD a Bs
- ✅ Cache de 5 minutos para optimizar llamadas a la API
- ✅ Manejo de errores robusto
- ✅ Métodos específicos para productos con conversión
- ✅ Logging detallado de operaciones
- ✅ Fallback graceful cuando la API no está disponible

## Archivos Implementados

### 1. `src/utils/currency-converter.ts`
Servicio principal para manejar la conversión de moneda.

**Interfaces:**
```typescript
interface DolarApiResponse {
  fuente: string;
  nombre: string;
  compra: number | null;
  venta: number | null;
  promedio: number;
  fechaActualizacion: string;
}

interface CurrencyConversionResult {
  success: boolean;
  data?: {
    usdToBsRate: number;
    lastUpdated: string;
  };
  error?: string;
}
```

**Métodos principales:**
- `getUsdToBsRate()`: Obtiene la tasa de conversión actual
- `convertUsdToBs(usdPrice)`: Convierte un precio específico
- `clearCache()`: Limpia el cache (útil para testing)

### 2. `src/database/models.ts` (ProductModel)
Nuevos métodos agregados al modelo de productos:

**Métodos con conversión:**
- `getAllProductsWithBsPrice(filters?)`: Obtiene todos los productos con precios en Bs
- `getProductByCodeWithBsPrice(code)`: Obtiene producto por código con precio en Bs
- `getProductByIdWithBsPrice(id)`: Obtiene producto por ID con precio en Bs

**Campos adicionales en la respuesta:**
- `price_bs`: Precio convertido a bolívares
- `conversion_rate`: Tasa de conversión utilizada
- `conversion_last_updated`: Fecha de última actualización de la tasa
- `conversion_error`: Error si la conversión falló

## Uso

### Ejemplo Básico

```typescript
import { productModel } from './database/models.js';

// Obtener todos los productos con precios en bolívares
const result = await productModel.getAllProductsWithBsPrice({
  limit: 10
});

if (result.success && result.data) {
  result.data.forEach(product => {
    console.log(`${product.brand}: $${product.price} USD = ${product.price_bs} Bs`);
  });
}
```

### Ejemplo de Producto Específico

```typescript
// Obtener producto por código con conversión
const product = await productModel.getProductByCodeWithBsPrice('PROD001');

if (product.success && product.data) {
  console.log(`Precio USD: $${product.data.price}`);
  console.log(`Precio Bs: ${product.data.price_bs} Bs`);
  console.log(`Tasa: 1 USD = ${product.data.conversion_rate} Bs`);
}
```

### Ejemplo de Conversión Directa

```typescript
import { CurrencyConverter } from './utils/currency-converter.js';

// Convertir precio específico
const conversion = await CurrencyConverter.convertUsdToBs(100);

if (conversion.success && conversion.data) {
  console.log(`$100 USD = ${conversion.data.bsPrice} Bs`);
}
```

## Configuración

### Cache
El servicio utiliza un cache de 5 minutos para evitar llamadas excesivas a la API. Esto se puede modificar cambiando la constante `CACHE_DURATION` en `CurrencyConverter`.

### API Endpoint
La URL de la API está configurada como constante:
```typescript
private static readonly DOLAR_API_URL = 'https://ve.dolarapi.com/v1/dolares/oficial';
```

## Manejo de Errores

El sistema maneja errores de manera graceful:

1. **API no disponible**: Devuelve productos sin conversión con campo `conversion_error`
2. **Datos inválidos**: Logs el error y devuelve fallback
3. **Timeout de red**: Reintenta y fallback si falla

### Ejemplo de Respuesta con Error

```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "PROD001",
    "brand": "Marca",
    "price": 100,
    "price_bs": null,
    "conversion_rate": null,
    "conversion_error": "Error en la API: 500 Internal Server Error"
  }
}
```

## Testing

### Ejecutar Ejemplos
```bash
# Compilar el proyecto
npm run build

# Ejecutar ejemplos
node dist/examples/currency-integration-example.js
```

### Limpiar Cache para Testing
```typescript
import { CurrencyConverter } from './utils/currency-converter.js';

// Limpiar cache para forzar nueva consulta
CurrencyConverter.clearCache();
```

## Logs

El servicio genera logs detallados:
- `INFO`: Cache hits, conversiones exitosas
- `ERROR`: Errores de API, conversiones fallidas

Ejemplo de logs:
```
[INFO] Usando datos de conversión desde cache
[INFO] Tasa de conversión obtenida: 1 USD = 195.2491 Bs
[ERROR] Error obteniendo tasa de conversión: Error en la API: 500 Internal Server Error
```

## Consideraciones de Rendimiento

1. **Cache**: Reduce llamadas a la API externa
2. **Async/Await**: No bloquea el hilo principal
3. **Error Handling**: Fallback rápido en caso de errores
4. **Logging**: Monitoreo de rendimiento y errores

## Integración Completa

✅ **IMPLEMENTADO**: La integración está completamente funcional y conectada al comando `CONSULT_CATALOG`.

### Cambios Realizados

1. **Servicio de Conversión** (`src/utils/currency-converter.ts`)
   - ✅ API de dolarapi.com integrada
   - ✅ Cache de 5 minutos implementado
   - ✅ Manejo de errores robusto

2. **Modelo de Productos** (`src/database/models.ts`)
   - ✅ Métodos con conversión: `getAllProductsWithBsPrice()`, `getProductByCodeWithBsPrice()`, `getProductByIdWithBsPrice()`
   - ✅ Campos adicionales: `price_bs`, `conversion_rate`, `conversion_last_updated`, `conversion_error`

3. **Comando CONSULT_CATALOG** (`src/bot/ai-integration/ai-processor.ts`)
   - ✅ Actualizado para usar `getAllProductsWithBsPrice()`
   - ✅ Formateo de catálogo incluye precios en USD y Bs

4. **Prompt de Gemini** (`src/bot/ai-integration/gemini-service.ts`)
   - ✅ Instrucciones para mostrar ambos precios
   - ✅ Formato: "Precio: $X USD / Y Bs"

### Flujo Completo

```
Usuario pregunta productos → CONSULT_CATALOG → getAllProductsWithBsPrice() → 
API dolarapi.com → Conversión automática → Gemini formatea → Usuario ve precios en USD y Bs
```

## Próximos Pasos

- [ ] Implementar retry automático con backoff exponencial
- [ ] Agregar métricas de rendimiento
- [ ] Implementar cache persistente (Redis)
- [ ] Agregar tests unitarios
- [ ] Implementar webhook para actualizaciones de tasa

## Dependencias

- `fetch`: Para llamadas HTTP a la API
- `logger`: Para logging (ya existente en el proyecto)

## API Externa

**Endpoint:** `https://ve.dolarapi.com/v1/dolares/oficial`

**Respuesta esperada:**
```json
{
  "fuente": "oficial",
  "nombre": "Oficial",
  "compra": null,
  "venta": null,
  "promedio": 195.2491,
  "fechaActualizacion": "2025-10-13T19:02:55.677Z"
}
```

**Rate Limits:** No especificados en la documentación oficial, pero se recomienda no exceder 1 llamada por minuto.
