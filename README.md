# Telegram Chatbot

Un bot de Telegram completo construido con Node.js, TypeScript, Telegraf y SQLite.

## 🚀 Características

- **Arquitectura modular** con separación clara de responsabilidades
- **Base de datos SQLite** para persistencia de datos
- **Sistema de logging** completo con Winston
- **Middleware personalizable** para autenticación, sesiones y logging
- **Handlers organizados** para comandos, callbacks y mensajes
- **Teclados interactivos** para mejor UX
- **Manejo de errores** robusto con cierre elegante
- **Soporte para webhook y polling**
- **TypeScript** para mayor seguridad de tipos

## 📁 Estructura del Proyecto

```
src/
├── bot/
│   ├── handlers/          # Manejadores de comandos, callbacks y mensajes
│   ├── middleware/        # Middleware personalizado
│   └── keyboards/         # Teclados inline y de respuesta
├── config/               # Configuración de la aplicación
├── database/             # Modelos y conexión a SQLite
├── types/                # Definiciones de tipos TypeScript
├── utils/                # Utilidades y helpers
└── index.ts              # Punto de entrada principal
```

## 🛠️ Instalación

1. **Clona el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd test-chatbot
   ```

2. **Instala las dependencias**
   ```bash
   pnpm install
   ```

3. **Configura las variables de entorno**
   ```bash
   cp env.example .env
   ```
   
   Edita el archivo `.env` y configura:
   - `BOT_TOKEN`: Tu token del bot de Telegram (obtén de @BotFather)
   - `DATABASE_PATH`: Ruta de la base de datos SQLite
   - `LOG_LEVEL`: Nivel de logging (debug, info, warn, error)

4. **Compila el proyecto**
   ```bash
   pnpm build
   ```

## 🚀 Uso

### Desarrollo
```bash
# Ejecutar en modo desarrollo con hot reload
pnpm dev
```

### Producción
```bash
# Compilar y ejecutar
pnpm build
pnpm start
```

## 📋 Comandos Disponibles

- `/start` - Iniciar el bot y mostrar menú principal
- `/help` - Mostrar ayuda y comandos disponibles
- `/settings` - Acceder a la configuración
- `/stats` - Ver estadísticas del bot
- `/contact` - Información de contacto
- `/reset` - Reiniciar la sesión del usuario

## 🗄️ Base de Datos

El bot utiliza SQLite para almacenar:
- **Usuarios**: Información de usuarios de Telegram
- **Chats**: Información de chats y grupos
- **Mensajes**: Historial de mensajes (opcional)

Las tablas se crean automáticamente al iniciar el bot.

## 🔧 Configuración

### Variables de Entorno

| Variable | Descripción | Requerido | Default |
|----------|-------------|-----------|---------|
| `BOT_TOKEN` | Token del bot de Telegram | ✅ | - |
| `BOT_USE_WEBHOOK` | Usar webhook en lugar de polling | ❌ | false |
| `WEBHOOK_URL` | URL del webhook | ❌ | - |
| `WEBHOOK_PORT` | Puerto del webhook | ❌ | 3000 |
| `WEBHOOK_PATH` | Ruta del webhook | ❌ | /webhook |
| `DATABASE_PATH` | Ruta de la base de datos SQLite | ❌ | ./data/bot.db |
| `LOG_LEVEL` | Nivel de logging | ❌ | info |
| `LOG_FILE` | Archivo de log | ❌ | - |

### Webhook vs Polling

- **Polling** (recomendado para desarrollo): El bot consulta constantemente a Telegram por actualizaciones
- **Webhook** (recomendado para producción): Telegram envía actualizaciones a tu servidor

## 🏗️ Desarrollo

### Agregar Nuevos Comandos

1. Crea el handler en `src/bot/handlers/commands.ts`
2. Registra el comando en `src/bot/handlers/index.ts`

### Agregar Nuevos Callbacks

1. Crea el handler en `src/bot/handlers/callbacks.ts`
2. Registra el callback en `src/bot/handlers/index.ts`

### Agregar Nuevos Middleware

1. Crea el middleware en `src/bot/middleware/`
2. Regístralo en `src/bot/middleware/index.ts`

## 📝 Scripts Disponibles

- `pnpm dev` - Ejecutar en modo desarrollo
- `pnpm build` - Compilar TypeScript
- `pnpm start` - Ejecutar versión compilada
- `pnpm clean` - Limpiar archivos compilados
- `pnpm lint` - Ejecutar linter
- `pnpm lint:fix` - Corregir errores de linting

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación
2. Busca en los issues existentes
3. Crea un nuevo issue con detalles del problema

## 🙏 Agradecimientos

- [Telegraf](https://telegraf.js.org/) - Framework para bots de Telegram
- [Better SQLite3](https://github.com/WiseLibs/better-sqlite3) - Driver SQLite para Node.js
- [Winston](https://github.com/winstonjs/winston) - Logger para Node.js
