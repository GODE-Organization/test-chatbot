import type { BotContext } from '../../types/bot.js'
import { logger } from '../../utils/logger.js'
import { formatDate } from '../../utils/helpers.js'

/**
 * Middleware de logging
 * Registra todas las interacciones con el bot
 */
export async function loggingMiddleware(ctx: BotContext, next: () => Promise<void>) {
  const startTime = Date.now()
  
  try {
    // Información básica del mensaje
    const messageInfo = {
      updateId: ctx.update?.update_id,
      messageId: ctx.message?.message_id,
      userId: ctx.from?.id,
      username: ctx.from?.username,
      chatId: ctx.chat?.id,
      chatType: ctx.chat?.type,
      updateType: ctx.updateType,
      timestamp: formatDate(new Date())
    }

    // Información específica del mensaje
    if (ctx.message && 'text' in ctx.message) {
      (messageInfo as any).text = ctx.message.text
      ;(messageInfo as any).command = ctx.message.text?.startsWith('/') ? ctx.message.text.split(' ')[0] : undefined
    }

    logger.debug('📥 Mensaje recibido:', messageInfo)

    await next()

    // Log de respuesta exitosa
    const duration = Date.now() - startTime
    logger.debug(`✅ Mensaje procesado en ${duration}ms`)

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error(`❌ Error procesando mensaje en ${duration}ms:`, error)
    throw error
  }
}
