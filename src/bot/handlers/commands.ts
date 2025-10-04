import type { BotContext } from '../../types/bot.js'
import { logger } from '../../utils/logger.js'
import { 
  getMainMenuKeyboard, 
  getSettingsKeyboard, 
  getHelpKeyboard,
  getContactKeyboard 
} from '../keyboards/main.js'

/**
 * Comando /start - Iniciar el bot
 */
export async function startCommand(ctx: BotContext) {
  try {
    const welcomeMessage = `
🃏 ¡Bienvenido al Bot de Telegram!

¡Hola! Soy un bot inteligente que puede ayudarte con diversas tareas.

Usa el menú de abajo para navegar por las opciones disponibles.

¿En qué puedo ayudarte hoy?
    `.trim()

    await ctx.reply(welcomeMessage, getMainMenuKeyboard())
    
    logger.user.action(ctx.from?.id || 0, 'Comando /start ejecutado')
  } catch (error) {
    logger.error('Error en comando start:', error)
    await ctx.reply('❌ Ocurrió un error. Por favor, intenta de nuevo.')
  }
}

/**
 * Comando /help - Mostrar ayuda
 */
export async function helpCommand(ctx: BotContext) {
  try {
    const helpMessage = `
📖 **Comandos disponibles:**

/start - Iniciar el bot
/help - Mostrar esta ayuda
/settings - Configuración
/stats - Ver estadísticas
/contact - Información de contacto

**Funcionalidades:**
• Interfaz intuitiva con menús
• Configuración personalizable
• Estadísticas de uso
• Soporte multiidioma

Usa los botones del menú para una mejor experiencia.
    `.trim()

    await ctx.reply(helpMessage, getHelpKeyboard())
    
    logger.user.action(ctx.from?.id || 0, 'Comando /help ejecutado')
  } catch (error) {
    logger.error('Error en comando help:', error)
    await ctx.reply('❌ Ocurrió un error. Por favor, intenta de nuevo.')
  }
}

/**
 * Comando /settings - Configuración
 */
export async function settingsCommand(ctx: BotContext) {
  try {
    const settingsMessage = `
⚙️ **Configuración**

Selecciona una opción para personalizar tu experiencia:
    `.trim()

    await ctx.reply(settingsMessage, getSettingsKeyboard())
    
    logger.user.action(ctx.from?.id || 0, 'Comando /settings ejecutado')
  } catch (error) {
    logger.error('Error en comando settings:', error)
    await ctx.reply('❌ Ocurrió un error. Por favor, intenta de nuevo.')
  }
}

/**
 * Comando /stats - Estadísticas
 */
export async function statsCommand(ctx: BotContext) {
  try {
    const statsMessage = `
📊 **Estadísticas del Bot**

• Usuarios activos: Calculando...
• Mensajes procesados: Calculando...
• Tiempo de actividad: 24/7
• Versión: 1.0.0

*Las estadísticas se actualizan en tiempo real*
    `.trim()

    await ctx.reply(statsMessage)
    
    logger.user.action(ctx.from?.id || 0, 'Comando /stats ejecutado')
  } catch (error) {
    logger.error('Error en comando stats:', error)
    await ctx.reply('❌ Ocurrió un error. Por favor, intenta de nuevo.')
  }
}

/**
 * Comando /contact - Información de contacto
 */
export async function contactCommand(ctx: BotContext) {
  try {
    const contactMessage = `
📞 **Información de Contacto**

¿Necesitas ayuda o tienes alguna sugerencia?

Puedes contactarnos a través de:
    `.trim()

    await ctx.reply(contactMessage, getContactKeyboard())
    
    logger.user.action(ctx.from?.id || 0, 'Comando /contact ejecutado')
  } catch (error) {
    logger.error('Error en comando contact:', error)
    await ctx.reply('❌ Ocurrió un error. Por favor, intenta de nuevo.')
  }
}

/**
 * Comando /reset - Reiniciar sesión
 */
export async function resetCommand(ctx: BotContext) {
  try {
    if (ctx.session) {
      ctx.session.state = 'idle'
      ctx.session.data = {}
    }

    const resetMessage = `
🔄 **Sesión Reiniciada**

Tu sesión ha sido reiniciada. Puedes comenzar de nuevo.

Usa /start para ver el menú principal.
    `.trim()

    await ctx.reply(resetMessage)
    
    logger.user.action(ctx.from?.id || 0, 'Comando /reset ejecutado')
  } catch (error) {
    logger.error('Error en comando reset:', error)
    await ctx.reply('❌ Ocurrió un error. Por favor, intenta de nuevo.')
  }
}
