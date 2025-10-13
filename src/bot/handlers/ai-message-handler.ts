import type { BotContext } from '../../types/bot.js'
import type { AIExternalResponse } from '../../types/ai-system.js'
import { logger } from '../../utils/logger.js'
import { AIProcessor } from '../ai-integration/ai-processor.js'
import { AIClientFactory } from '../ai-integration/ai-client.js'
import { GuaranteeFlowHandler } from './guarantee-flow.js'
import { SatisfactionSurveyHandler } from './satisfaction-survey.js'
import { messageModel, conversationModel } from '../../database/models.js'

/**
 * Handler principal para mensajes con integración de IA
 */
export class AIMessageHandler {
  private static instance: AIMessageHandler
  private aiProcessor: AIProcessor
  private aiClient: any
  private guaranteeHandler: GuaranteeFlowHandler
  private surveyHandler: SatisfactionSurveyHandler

  private constructor() {
    this.aiProcessor = AIProcessor.getInstance()
    this.aiClient = AIClientFactory.createClient()
    this.guaranteeHandler = GuaranteeFlowHandler.getInstance()
    this.surveyHandler = SatisfactionSurveyHandler.getInstance()
  }

  public static getInstance(): AIMessageHandler {
    if (!AIMessageHandler.instance) {
      AIMessageHandler.instance = new AIMessageHandler()
    }
    return AIMessageHandler.instance
  }

  /**
   * Procesa un mensaje de texto con IA
   */
  public async handleTextMessage(ctx: BotContext): Promise<void> {
    try {
      if (!ctx.message || !('text' in ctx.message) || !ctx.user) {
        return
      }

      const text = ctx.message.text
      const userId = ctx.user.id
        const chatId = ctx.chat?.id

      // Guardar mensaje en la base de datos
      if (chatId) {
        await messageModel.saveMessage({
          telegram_id: ctx.message.message_id,
          user_id: userId,
          chat_id: chatId,
          text: text,
          message_type: 'text'
        })
      }

      // Verificar si está en flujo de garantía
      if (this.guaranteeHandler.isInGuaranteeFlow(ctx.session)) {
        const processed = await this.guaranteeHandler.processGuaranteeStep(ctx, 'text')
        if (processed) {
          return
        }
      }

      // Verificar si está esperando encuesta
      if (this.surveyHandler.isWaitingForSurvey(ctx.session)) {
        await ctx.reply('Por favor, selecciona una opción de la encuesta de satisfacción.')
        return
      }

      // Procesar con IA externa
      await this.processWithAI(ctx, text)

    } catch (error) {
      logger.error('Error manejando mensaje de texto:', error)
      await ctx.reply('❌ Ocurrió un error procesando tu mensaje.')
    }
  }

  /**
   * Procesa un mensaje de foto con IA
   */
  public async handlePhotoMessage(ctx: BotContext): Promise<void> {
    try {
      if (!ctx.message || !('photo' in ctx.message) || !ctx.user) {
        return
      }

      const userId = ctx.user.id
      const chatId = ctx.chat?.id

      // Guardar mensaje en la base de datos
      if (chatId) {
        await messageModel.saveMessage({
          telegram_id: ctx.message.message_id,
          user_id: userId,
          chat_id: chatId,
          message_type: 'photo'
        })
      }

      // Verificar si está en flujo de garantía
      if (this.guaranteeHandler.isInGuaranteeFlow(ctx.session)) {
        const processed = await this.guaranteeHandler.processGuaranteeStep(ctx, 'photo')
        if (processed) {
          return
        }
      }

      // Si no está en flujo de garantía, informar que no puede procesar fotos
      await ctx.reply('📸 Recibí tu foto, pero actualmente solo puedo procesar fotos durante el registro de garantías. ¿Hay algo más en lo que pueda ayudarte?')

    } catch (error) {
      logger.error('Error manejando mensaje de foto:', error)
      await ctx.reply('❌ Ocurrió un error procesando la foto.')
    }
  }

  /**
   * Procesa callback queries (botones)
   */
  public async handleCallbackQuery(ctx: BotContext): Promise<void> {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery) || !ctx.user) {
        return
      }

      const callbackData = ctx.callbackQuery.data

      // Manejar callbacks de encuesta
      if (callbackData.startsWith('survey_')) {
        await this.surveyHandler.handleSurveyCallback(ctx, callbackData)
        return
      }

      // Otros callbacks pueden agregarse aquí

    } catch (error) {
      logger.error('Error manejando callback query:', error)
      await ctx.answerCbQuery('❌ Error procesando selección')
    }
  }

  /**
   * Procesa mensaje con IA externa
   */
  private async processWithAI(ctx: BotContext, message: string): Promise<void> {
    try {
      if (!ctx.user) {
        return
      }

      // Obtener datos de sesión de IA
      const aiSessionData = ctx.session?.ai_session_data || {}

      // Procesar mensaje con Gemini
      const result = await this.aiProcessor.sendMessageToAI(
        message,
        ctx.user.id,
        ctx.chat?.id || 0,
        aiSessionData
      )

      if (!result.success) {
        await ctx.reply('❌ Error procesando respuesta de IA.')
        return
      }

      // Enviar respuesta al usuario
      await this.sendResponseToUser(ctx, result.response!)

      // Actualizar datos de sesión de IA
      if (result.session_data && ctx.session) {
        ctx.session.ai_session_data = result.session_data
      }

      // Procesar acciones específicas
      await this.processAIActions(ctx, result.actions || [])

    } catch (error) {
      logger.error('Error procesando con IA:', error)
      await ctx.reply('❌ Ocurrió un error procesando tu mensaje.')
    }
  }

  /**
   * Envía respuesta al usuario
   */
  private async sendResponseToUser(ctx: BotContext, response: any): Promise<void> {
    try {
      const options: any = {}

      // Configurar parse_mode si está especificado
      if (response.parse_mode) {
        options.parse_mode = response.parse_mode
      }

      // Configurar teclado si está especificado
      if (response.reply_markup) {
        options.reply_markup = response.reply_markup
      }

      await ctx.reply(response.text, options)

    } catch (error) {
      logger.error('Error enviando respuesta al usuario:', error)
      await ctx.reply('❌ Error enviando respuesta.')
    }
  }

  /**
   * Procesa acciones específicas de IA
   */
  private async processAIActions(ctx: BotContext, actions: any[]): Promise<void> {
    try {
      for (const action of actions) {
        switch (action.command) {
          case 'REGISTER_GUARANTEE':
            await this.guaranteeHandler.startGuaranteeFlow(ctx)
            break
          
          case 'END_CONVERSATION':
            await this.handleEndConversation(ctx)
            break
          
          // Otros comandos se procesan automáticamente en AIProcessor
          default:
            break
        }
      }
    } catch (error) {
      logger.error('Error procesando acciones de IA:', error)
    }
  }

  /**
   * Maneja el fin de conversación
   */
  private async handleEndConversation(ctx: BotContext): Promise<void> {
    try {
      if (!ctx.user) {
        return
      }

      // Obtener conversación activa
      const conversationResult = await conversationModel.getActiveConversation(ctx.user.id)
      
      if (conversationResult.success && conversationResult.data) {
        // Terminar conversación
        await conversationModel.endConversation(conversationResult.data.id)
        
        // Enviar encuesta de satisfacción
        await this.surveyHandler.sendSatisfactionSurvey(ctx, conversationResult.data.id)
      }

    } catch (error) {
      logger.error('Error manejando fin de conversación:', error)
    }
  }

  /**
   * Inicializa sesión de usuario
   */
  public initializeUserSession(ctx: BotContext): void {
    if (!ctx.session) {
      ctx.session = this.aiProcessor.createInitialSession()
    }
  }

  /**
   * Maneja comando de cancelación
   */
  public async handleCancelCommand(ctx: BotContext): Promise<void> {
    try {
      if (!ctx.session) {
        return
      }

      // Verificar si está en flujo de garantía
      if (this.guaranteeHandler.isInGuaranteeFlow(ctx.session)) {
        await this.guaranteeHandler.cancelGuaranteeFlow(ctx)
        return
      }

      // Verificar si está esperando encuesta
      if (this.surveyHandler.isWaitingForSurvey(ctx.session)) {
        ctx.session = this.aiProcessor.resetSessionToIdle(ctx.session)
        await ctx.reply('❌ Encuesta cancelada. ¿En qué más puedo ayudarte?')
        return
      }

      // Si no está en ningún flujo especial, solo confirmar
      await ctx.reply('No hay nada que cancelar. ¿En qué puedo ayudarte?')

    } catch (error) {
      logger.error('Error manejando comando cancel:', error)
      await ctx.reply('❌ Error procesando cancelación.')
    }
  }
}
