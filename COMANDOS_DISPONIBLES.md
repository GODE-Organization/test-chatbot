# 🤖 Comandos Disponibles del Bot de Telegram

Este documento contiene todos los comandos disponibles para probar el bot de Telegram.

## 📋 Comandos Principales

### `/start`
**Descripción:** Inicia el bot y muestra el mensaje de bienvenida
**Uso:** `/start`
**Funcionalidad:** 
- Muestra mensaje de bienvenida personalizado
- Presenta el menú principal con botones de navegación
- Registra la acción del usuario en los logs

---

### `/help`
**Descripción:** Muestra la ayuda completa con todos los comandos disponibles
**Uso:** `/help`
**Funcionalidad:**
- Lista todos los comandos principales y de prueba
- Explica las funcionalidades del bot
- Muestra teclado de ayuda para mejor navegación

---

### `/settings`
**Descripción:** Accede a la configuración del bot
**Uso:** `/settings`
**Funcionalidad:**
- Muestra opciones de personalización
- Presenta teclado de configuración
- Permite ajustar la experiencia del usuario

---

### `/stats`
**Descripción:** Muestra estadísticas del bot
**Uso:** `/stats`
**Funcionalidad:**
- Información de usuarios activos
- Contador de mensajes procesados
- Tiempo de actividad del bot
- Versión actual del sistema

---

### `/contact`
**Descripción:** Información de contacto y soporte
**Uso:** `/contact`
**Funcionalidad:**
- Información para obtener ayuda
- Opciones de contacto
- Teclado con enlaces de soporte

---

### `/reset`
**Descripción:** Reinicia la sesión del usuario
**Uso:** `/reset`
**Funcionalidad:**
- Limpia el estado de la sesión
- Reinicia los datos del usuario
- Vuelve al estado inicial

---

## 🎮 Comandos de Entretenimiento

### `/saludo`
**Descripción:** Genera un saludo aleatorio personalizado
**Uso:** `/saludo`
**Funcionalidad:**
- 8 saludos diferentes aleatorios
- Mensajes amigables y variados
- Incluye emojis para mayor expresividad

**Ejemplos de saludos:**
- "¡Hola! 👋 ¡Qué gusto verte por aquí!"
- "¡Saludos! 😊 ¿Cómo estás hoy?"
- "¡Hey! 🎉 ¡Espero que tengas un excelente día!"

---

### `/test`
**Descripción:** Comando de prueba para verificar el funcionamiento del bot
**Uso:** `/test`
**Funcionalidad:**
- Verifica el estado del bot
- Confirma que todos los sistemas funcionan
- Muestra información del sistema
- Lista comandos de prueba disponibles

---

### `/tiempo`
**Descripción:** Muestra la hora y fecha actual
**Uso:** `/tiempo`
**Funcionalidad:**
- Hora actual en zona horaria de México (GMT-6)
- Fecha completa en español
- Formato legible y amigable

**Ejemplo de salida:**
```
🕐 Hora Actual

Hora: 14:30:45
Fecha: 5 de octubre de 2025
Zona horaria: México (GMT-6)
```

---

### `/dado`
**Descripción:** Lanza un dado virtual de 6 caras
**Uso:** `/dado`
**Funcionalidad:**
- Genera número aleatorio del 1 al 6
- Muestra emoji correspondiente al resultado
- Incluye comentarios según el resultado

**Emojis de dados:**
- ⚀ (1), ⚁ (2), ⚂ (3), ⚃ (4), ⚄ (5), ⚅ (6)

---

### `/moneda`
**Descripción:** Lanza una moneda virtual
**Uso:** `/moneda`
**Funcionalidad:**
- Resultado aleatorio: cara o cruz
- Probabilidad 50/50
- Emojis y comentarios según el resultado

---

### `/chiste`
**Descripción:** Cuenta un chiste aleatorio
**Uso:** `/chiste`
**Funcionalidad:**
- 8 chistes diferentes aleatorios
- Contenido familiar y apropiado
- Formato atractivo con emojis

**Ejemplos de chistes:**
- "¿Por qué los pájaros vuelan hacia el sur en invierno? ¡Porque caminar es muy lento! 😄"
- "¿Qué hace un pez cuando se quema? ¡Nada! 🐟"

---

## 🔧 Características Técnicas

### Logging
- Todos los comandos registran las acciones del usuario
- Logs de errores para debugging
- Seguimiento de uso por usuario

### Manejo de Errores
- Try-catch en todos los comandos
- Mensajes de error amigables para el usuario
- Logs detallados para desarrolladores

### Interfaz de Usuario
- Teclados personalizados para mejor navegación
- Mensajes formateados con Markdown
- Emojis para mejor experiencia visual

---

## 🚀 Cómo Probar

1. **Inicia el bot:** Envía `/start` para comenzar
2. **Explora el menú:** Usa los botones del teclado
3. **Prueba comandos:** Ejecuta cualquier comando de la lista
4. **Verifica funcionalidad:** Usa `/test` para confirmar que todo funciona
5. **Explora entretenimiento:** Prueba `/saludo`, `/dado`, `/chiste`, etc.

---

## 📝 Notas Importantes

- Todos los comandos están en español
- Los comandos son case-insensitive
- El bot responde a comandos escritos y botones del teclado
- Los logs se guardan en `logs/bot.log`
- El bot funciona 24/7 una vez iniciado

---

*Documentación generada automáticamente desde el código fuente del bot.*
