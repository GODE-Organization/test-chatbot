import { Telegraf } from 'telegraf'
import type { BotContext } from '../../types/bot.js'
import { authMiddleware } from './auth.js'
import { loggingMiddleware } from './logging.js'
import { sessionMiddleware, stateMiddleware, resetSessionMiddleware } from './session.js'

/**
 * Configurar todos los middleware del bot
 */
export async function setupMiddleware(bot: Telegraf<BotContext>): Promise<void> {
  // Middleware de logging (debe ir primero)
  bot.use(loggingMiddleware)
  
  // Middleware de autenticación
  bot.use(authMiddleware)
  
  // Middleware de sesión
  bot.use(sessionMiddleware)
  
  // Middleware de manejo de errores global
  bot.catch((err: unknown, ctx) => {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('Error en bot:', {
      error: error.message,
      stack: error.stack,
      updateId: ctx.update?.update_id,
      userId: ctx.from?.id,
      chatId: ctx.chat?.id
    })
  })
}

// Exportar middleware individuales para uso específico
export {
  authMiddleware,
  loggingMiddleware,
  sessionMiddleware,
  stateMiddleware,
  resetSessionMiddleware
}
