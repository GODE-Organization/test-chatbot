import type { BotContext } from '../../types/bot.js'
import { userModel } from '../../database/models.js'
import { logger } from '../../utils/logger.js'

/**
 * Middleware de autenticación
 * Registra usuarios automáticamente cuando interactúan con el bot
 */
export async function authMiddleware(ctx: BotContext, next: () => Promise<void>) {
  try {
    // Solo procesar si hay información del usuario
    if (!ctx.from) {
      return next()
    }

    // Mapear datos del usuario de Telegram
    const userData = {
      telegram_id: ctx.from.id,
      ...(ctx.from.username && { username: ctx.from.username }),
      ...(ctx.from.first_name && { first_name: ctx.from.first_name }),
      ...(ctx.from.last_name && { last_name: ctx.from.last_name }),
      ...(ctx.from.language_code && { language_code: ctx.from.language_code }),
      is_bot: ctx.from.is_bot
    };

    // Registrar/actualizar usuario en la base de datos
    const userResult = await userModel.upsertUser(userData)
    
    if (userResult.success && userResult.data) {
      // Agregar información del usuario al contexto
      ctx.user = {
        id: userResult.data.id,
        ...(userResult.data.username && { username: userResult.data.username }),
        ...(userResult.data.first_name && { first_name: userResult.data.first_name }),
        ...(userResult.data.last_name && { last_name: userResult.data.last_name }),
        ...(userResult.data.language_code && { language_code: userResult.data.language_code })
      }

      // La sesión se maneja en el middleware de sesión

      logger.user.action(ctx.from.id, `Usuario autenticado: ${userResult.data.first_name || userResult.data.username || 'Sin nombre'}`)
    } else {
      logger.error('Error autenticando usuario:', userResult.error)
    }

    await next()
  } catch (error) {
    logger.error('Error en middleware de autenticación:', error)
    await next()
  }
}
