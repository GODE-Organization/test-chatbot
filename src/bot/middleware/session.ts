import type { BotContext, UserState } from '../../types/bot.js'
import type { UserSessionData, BotFlowState } from '../../types/ai-system.js'
import { userModel, conversationModel } from '../../database/models.js'
import { logger } from '../../utils/logger.js'
import { ConversationTimeoutManager } from '../timeout/conversation-timeout.js'
import { AIProcessor } from '../ai-integration/ai-processor.js'

/**
 * Middleware de sesión
 * Maneja el estado de sesión del usuario con soporte para flujos de IA
 */
export async function sessionMiddleware(ctx: BotContext, next: () => Promise<void>) {
  try {
    if (!ctx.from || !ctx.user) {
      return next()
    }

    const timeoutManager = ConversationTimeoutManager.getInstance()
    const aiProcessor = AIProcessor.getInstance()

    // Recuperar o inicializar sesión
    if (!ctx.session) {
      logger.info('🔍 No hay sesión, recuperando desde BD:', { userId: ctx.from.id })
      
      // Intentar recuperar sesión desde la base de datos
      const userResult = await userModel.getUserByTelegramId(ctx.from.id)
      logger.info('📊 Resultado de getUserByTelegramId:', {
        userId: ctx.from.id,
        success: userResult.success,
        hasData: !!userResult.data,
        hasSettings: !!userResult.data?.settings
      })
      
      if (userResult.success && userResult.data && userResult.data.settings) {
        try {
          const settings = JSON.parse(userResult.data.settings)
          logger.info('📋 Settings parseados:', { userId: ctx.from.id, settings })
          
          // Crear sesión basada en el estado guardado
          ctx.session = {
            state: settings.state || 'idle' as BotFlowState,
            last_activity: new Date(),
            flow_data: settings.flow_data,
            ai_session_data: settings.ai_session_data
          }
          logger.info('✅ Sesión recuperada desde BD:', {
            userId: ctx.from.id,
            state: ctx.session.state,
            flowData: ctx.session.flow_data
          })
        } catch (parseError) {
          // Si hay error parseando settings, crear sesión inicial
          ctx.session = aiProcessor.createInitialSession()
          logger.warn('⚠️ Error parseando settings, nueva sesión creada:', {
            userId: ctx.from.id,
            error: parseError
          })
        }
      } else {
        // Crear sesión inicial si no existe
        ctx.session = aiProcessor.createInitialSession()
        logger.info('🆕 Nueva sesión creada:', {
          userId: ctx.from.id,
          state: ctx.session.state
        })
      }
    } else {
      logger.info('✅ Sesión ya existe:', {
        userId: ctx.from.id,
        state: ctx.session.state,
        flowData: ctx.session.flow_data
      })
    }

    // Actualizar última actividad
    ctx.session.last_activity = new Date()

    // Manejar timeout de conversación
    await handleConversationTimeout(ctx, timeoutManager)

    // Actualizar estado del usuario en la base de datos
    logger.info('💾 Guardando sesión en BD:', {
      userId: ctx.from.id,
      state: ctx.session.state,
      flowData: ctx.session.flow_data,
      aiSessionData: ctx.session.ai_session_data
    })
    
    const updateResult = await userModel.updateUserState(ctx.from.id, ctx.session.state as UserState, {
      flow_data: ctx.session.flow_data ? JSON.stringify(ctx.session.flow_data) : null,
      ai_session_data: ctx.session.ai_session_data ? JSON.stringify(ctx.session.ai_session_data) : null
    })
    
    logger.info('💾 Resultado de guardado en BD:', {
      userId: ctx.from.id,
      success: updateResult.success,
      error: updateResult.error
    })

    await next()

    // Guardar datos de sesión de IA si existen
    if (ctx.session?.ai_session_data && ctx.user) {
      await saveAISessionData(ctx.user.id, ctx.session.ai_session_data)
    }

  } catch (error) {
    logger.error('Error en middleware de sesión:', error)
    await next()
  }
}

/**
 * Maneja el timeout de conversaciones
 */
async function handleConversationTimeout(
  ctx: BotContext, 
  timeoutManager: ConversationTimeoutManager
): Promise<void> {
  try {
    if (!ctx.user || !ctx.session) return

    // Obtener conversación activa
    const conversationResult = await conversationModel.getActiveConversation(ctx.user.id)
    
    if (conversationResult.success && conversationResult.data) {
      const conversation = conversationResult.data
      
      // Renovar timeout si la conversación está activa
      if (conversation.status === 'active') {
        timeoutManager.renewTimeout(
          ctx.user.id, 
          conversation.id, 
          15 // 15 minutos de timeout
        )
      }
    } else if (ctx.session.state === 'idle') {
      // Si no hay conversación activa y el usuario está en estado idle,
      // crear una nueva conversación
      const newConversationResult = await conversationModel.createConversation({
        user_id: ctx.user.id,
        ai_session_data: JSON.stringify(ctx.session.ai_session_data || {})
      })

      if (newConversationResult.success && newConversationResult.data) {
        timeoutManager.startTimeout(
          ctx.user.id,
          newConversationResult.data.id,
          15
        )
      }
    }

  } catch (error) {
    logger.error('Error manejando timeout de conversación:', error)
  }
}

/**
 * Guarda datos de sesión de IA
 */
async function saveAISessionData(userId: number, sessionData: Record<string, any>): Promise<void> {
  try {
    const conversationResult = await conversationModel.getActiveConversation(userId)
    
    if (conversationResult.success && conversationResult.data) {
      await conversationModel.updateConversationData(
        conversationResult.data.id,
        JSON.stringify(sessionData)
      )
    }
  } catch (error) {
    logger.error('Error guardando datos de sesión de IA:', error)
  }
}

/**
 * Middleware para manejar estados de conversación
 */
export function stateMiddleware(requiredState?: UserState) {
  return async (ctx: BotContext, next: () => Promise<void>) => {
    try {
      if (!ctx.session) {
        ctx.session = AIProcessor.getInstance().createInitialSession()
      }

      // Si se requiere un estado específico
      if (requiredState && ctx.session && ctx.session.state !== requiredState) {
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
    const timeoutManager = ConversationTimeoutManager.getInstance()
    const aiProcessor = AIProcessor.getInstance()

    // Cancelar timeout si existe
    if (ctx.user) {
      timeoutManager.cancelTimeout(ctx.user.id)
    }

    // Resetear sesión a estado inicial
    if (ctx.session) {
      ctx.session = aiProcessor.resetSessionToIdle(ctx.session)
    } else {
      ctx.session = aiProcessor.createInitialSession()
    }

    await next()
  } catch (error) {
    logger.error('Error en middleware de reset de sesión:', error)
    await next()
  }
}

/**
 * Middleware para manejar flujos específicos
 */
export function flowMiddleware(requiredFlow?: BotFlowState) {
  return async (ctx: BotContext, next: () => Promise<void>) => {
    try {
      if (!ctx.session) {
        ctx.session = AIProcessor.getInstance().createInitialSession()
      }

      // Si se requiere un flujo específico
      if (requiredFlow && ctx.session && ctx.session.state !== requiredFlow) {
        await ctx.reply('❌ Esta acción no está disponible en tu estado actual.')
        return
      }

      await next()
    } catch (error) {
      logger.error('Error en middleware de flujo:', error)
      await next()
    }
  }
}
