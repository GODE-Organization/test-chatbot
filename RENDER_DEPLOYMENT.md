# Despliegue en Render

Este documento explica cómo desplegar el bot de Telegram en Render.

## 🚀 Opciones de Despliegue

### Opción 1: Worker (Recomendado)

Los bots de Telegram que usan **polling** no necesitan puertos HTTP, por lo que Render los ejecuta como "Workers".

**Ventajas:**
- ✅ Más simple de configurar
- ✅ No requiere configuración de webhook
- ✅ Ideal para desarrollo y pruebas
- ✅ Menor consumo de recursos

**Configuración:**
1. Usa el archivo `render.yaml` incluido
2. El bot usará polling automáticamente
3. No necesitas configurar webhook en Telegram

### Opción 2: Web Service con Webhook

Para producción con alto volumen, puedes usar webhook.

**Ventajas:**
- ✅ Mejor rendimiento para alto volumen
- ✅ Respuesta más rápida
- ✅ Menos consumo de CPU

**Configuración:**
1. Usa el archivo `render-webhook.yaml`
2. Configura la URL del webhook en Telegram
3. Requiere configuración adicional

## 📋 Pasos para Desplegar

### 1. Preparar el Repositorio

Asegúrate de que tu repositorio tenga:
- ✅ Archivo `render.yaml` o `render-webhook.yaml`
- ✅ Variables de entorno configuradas
- ✅ Código compilado (se compila automáticamente)

### 2. Variables de Entorno Requeridas

Configura estas variables en Render:

```bash
# Obligatorias
BOT_TOKEN=tu_token_del_bot

# Opcionales
NODE_ENV=production
LOG_LEVEL=info
DATABASE_PATH=./data/bot.db
```

### 3. Crear Servicio en Render

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Haz clic en "New +" → "Blueprint"
3. Conecta tu repositorio de GitHub
4. Render detectará automáticamente el archivo `render.yaml`

### 4. Configurar Variables de Entorno

En la configuración del servicio:
1. Ve a "Environment"
2. Agrega las variables de entorno necesarias
3. Especialmente `BOT_TOKEN`

### 5. Desplegar

1. Haz clic en "Create Blueprint"
2. Render compilará y desplegará automáticamente
3. El bot estará funcionando en unos minutos

## 🔧 Configuración Avanzada

### Para Webhook (Opción 2)

Si eliges usar webhook:

1. **Configura el webhook en Telegram:**
   ```bash
   curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
        -H "Content-Type: application/json" \
        -d '{"url": "https://tu-app.onrender.com/webhook"}'
   ```

2. **Variables adicionales:**
   ```bash
   BOT_USE_WEBHOOK=true
   WEBHOOK_URL=https://tu-app.onrender.com
   WEBHOOK_PORT=10000
   WEBHOOK_PATH=/webhook
   ```

### Monitoreo

- **Logs:** Disponibles en la pestaña "Logs" de Render
- **Métricas:** CPU, memoria y tiempo de respuesta
- **Estado:** Render notifica si el servicio se cae

## 🐛 Solución de Problemas

### Error: "No se detectaron puertos abiertos"

**Causa:** Render espera que el servicio se vincule a un puerto HTTP.

**Solución:**
- Usa la configuración de Worker (`render.yaml`)
- O configura webhook (`render-webhook.yaml`)

### Error: "BOT_TOKEN es requerido"

**Causa:** Variable de entorno no configurada.

**Solución:**
1. Ve a "Environment" en Render
2. Agrega `BOT_TOKEN=tu_token_aqui`

### Bot no responde

**Posibles causas:**
1. Token incorrecto
2. Bot no está iniciado
3. Problemas de red

**Solución:**
1. Verifica los logs en Render
2. Confirma que el token es correcto
3. Reinicia el servicio

## 📊 Rendimiento

### Worker (Polling)
- **CPU:** Bajo consumo
- **Memoria:** ~50-100MB
- **Latencia:** 1-2 segundos
- **Ideal para:** Desarrollo, bots simples

### Web Service (Webhook)
- **CPU:** Medio consumo
- **Memoria:** ~100-200MB
- **Latencia:** <1 segundo
- **Ideal para:** Producción, alto volumen

## 🔄 Actualizaciones

Para actualizar el bot:

1. Haz push a la rama principal
2. Render detectará los cambios automáticamente
3. Recompilará y redesplegará
4. El bot se reiniciará sin pérdida de datos

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs en Render
2. Verifica las variables de entorno
3. Consulta la documentación de Render
4. Crea un issue en el repositorio
