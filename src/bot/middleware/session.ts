import type { BotContext, UserState } from '../../types/bot.js'
import { userModel } from '../../database/models.js'
import { logger } from '../../utils/logger.js'

/**
 * Middleware de sesión
 * Maneja el estado de sesión del usuario
 */
export async function sessionMiddleware(ctx: BotContext, next: () => Promise<void>) {
  try {
    if (!ctx.from || !ctx.user) {
      return next()
    }

    // Inicializar sesión si no existe
    if (!ctx.session) {
      ctx.session = {
        state: 'idle',
        data: {}
      }
    }

    // Actualizar última actividad del usuario
    await userModel.updateUserState(ctx.from.id, ctx.session.state as UserState)

    await next()

    // Guardar cambios en la sesión si es necesario
    if (ctx.session && ctx.user) {
      // Aquí podrías guardar datos adicionales de la sesión
      // Por ejemplo, preferencias temporales, datos de formularios, etc.
    }

  } catch (error) {
    logger.error('Error en middleware de sesión:', error)
    await next()
  }
}

/**
 * Middleware para manejar estados de conversación
 */
export function stateMiddleware(requiredState?: UserState) {
  return async (ctx: BotContext, next: () => Promise<void>) => {
    try {
      if (!ctx.session) {
        ctx.session = { state: 'idle', data: {} }
      }

      // Si se requiere un estado específico
      if (requiredState && ctx.session.state !== requiredState) {
        await ctx.reply('❌ Esta acción no está disponible en tu estado actual.')
        return
      }

      await next()
    } catch (error) {
      logger.error('Error en middleware de estado:', error)
      await next()
    }
  }
}

/**
 * Middleware para resetear sesión
 */
export async function resetSessionMiddleware(ctx: BotContext, next: () => Promise<void>) {
  try {
    if (ctx.session) {
      ctx.session.state = 'idle'
      ctx.session.data = {}
    }

    await next()
  } catch (error) {
    logger.error('Error en middleware de reset de sesión:', error)
    await next()
  }
}
