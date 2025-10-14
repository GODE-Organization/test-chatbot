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
      logger.info('🔍 Verificando flujo de garantía en handleTextMessage:', {
        telegramId: ctx.from?.id,
        dbUserId: ctx.user.id,
        sessionState: ctx.session?.state,
        flowData: ctx.session?.flow_data,
        message: text
      })
      
      if (this.guaranteeHandler.isInGuaranteeFlow(ctx.session)) {
        logger.info('✅ Usuario en flujo de garantía, procesando paso:', {
          userId: ctx.user.id,
          message: text,
          currentStep: ctx.session?.flow_data?.guarantee_flow?.step
        })
        const processed = await this.guaranteeHandler.processGuaranteeStep(ctx, 'text')
        if (processed) {
          logger.info('✅ Paso de garantía procesado exitosamente')
          return
        } else {
          logger.warn('⚠️ Paso de garantía no se procesó correctamente')
        }
      } else {
        logger.info('❌ Usuario NO está en flujo de garantía')
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

      logger.info('Mensaje de foto recibido:', ctx.message)

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

      // Detectar si es una consulta de catálogo o garantías para mostrar mensaje de carga
      const isCatalogQuery = this.isCatalogQuery(message)
      const isGuaranteesQuery = this.isGuaranteesQuery(message)
      let loadingMessage: any = null

      if (isCatalogQuery) {
        loadingMessage = await ctx.reply('🔍 Estoy consultando nuestro catálogo de productos... ⏳')
      } else if (isGuaranteesQuery) {
        loadingMessage = await ctx.reply('🔧 Estoy consultando tus garantías... ⏳')
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
        // Eliminar mensaje de carga si hay error
        if (loadingMessage) {
          try {
            await ctx.deleteMessage(loadingMessage.message_id)
          } catch (e) {
            // Ignorar error si no se puede eliminar
          }
        }
        await ctx.reply('❌ Error procesando respuesta de IA.')
        return
      }

      // Eliminar mensaje de carga antes de enviar respuesta
      if (loadingMessage) {
        try {
          await ctx.deleteMessage(loadingMessage.message_id)
        } catch (e) {
          // Ignorar error si no se puede eliminar
        }
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

      // Sanitizar texto para evitar errores de parsing
      const sanitizedText = this.sanitizeMarkdownText(response.text)

      // Enviar texto principal
      await ctx.reply(sanitizedText, options)

      // Enviar imágenes si están disponibles
      if (response.images && Array.isArray(response.images)) {
        for (const imageData of response.images) {
          try {
            logger.info('📸 Enviando imagen de producto:', {
              fileId: imageData.file_id,
              productId: imageData.product?.id,
              productName: imageData.product?.description
            })
            
            await ctx.replyWithPhoto(imageData.file_id, {
              caption: `📦 ${imageData.product?.description || 'Producto'}`,
              parse_mode: 'Markdown'
            })
          } catch (imageError) {
            logger.error('Error enviando imagen de producto:', imageError)
            // No fallar toda la respuesta por una imagen
          }
        }
      }

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
            logger.info('🚀 Ejecutando acción REGISTER_GUARANTEE:', {
              userId: ctx.user?.id,
              sessionState: ctx.session?.state,
              flowData: ctx.session?.flow_data
            })
            await this.guaranteeHandler.startGuaranteeFlow(ctx)
            logger.info('✅ Flujo de garantía iniciado:', {
              userId: ctx.user?.id,
              sessionState: ctx.session?.state,
              flowData: ctx.session?.flow_data
            })
            // La sesión ya se actualiza dentro de startGuaranteeFlow
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
   * Detecta si un mensaje es una consulta de catálogo
   */
  private isCatalogQuery(message: string): boolean {
    const catalogKeywords = [
      'productos',
      'catálogo',
      'catalogo',
      'muestrame',
      'muéstrame',
      'tienes',
      'disponible',
      'disponibles',
      'ver',
      'listar',
      'mostrar',
      'que hay',
      'qué hay',
      'inventario',
      'stock'
    ]
    
    const lowerMessage = message.toLowerCase()
    return catalogKeywords.some(keyword => lowerMessage.includes(keyword))
  }

  /**
   * Detecta si el mensaje es una consulta de garantías
   */
  private isGuaranteesQuery(message: string): boolean {
    const guaranteesKeywords = [
      'garantías',
      'garantias',
      'garantía',
      'garantia',
      'mis garantías',
      'mis garantias',
      'estado de garantía',
      'estado de garantia',
      'revisar garantía',
      'revisar garantia',
      'consultar garantía',
      'consultar garantia',
      'ver garantías',
      'ver garantias',
      'listar garantías',
      'listar garantias',
      'mostrar garantías',
      'mostrar garantias'
    ]
    
    const lowerMessage = message.toLowerCase()
    return guaranteesKeywords.some(keyword => lowerMessage.includes(keyword))
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

  /**
   * Sanitiza texto Markdown para evitar errores de parsing
   */
  private sanitizeMarkdownText(text: string): string {
    if (!text) return text

    return text
      // Corregir caracteres duplicados comunes
      .replace(/Licuaddora/g, 'Licuadora')
      .replace(/aacero/g, 'acero')
      .replace(/Electrodomésticcos/g, 'Electrodomésticos')
      .replace(/Bossch/g, 'Bosch')
      .replace(/función pulse/g, 'función pulse')
      .replace(/cuchillas de accero/g, 'cuchillas de acero')
      .replace(/pie de accero/g, 'pie de acero')
      // Limpiar entidades Markdown mal formadas
      .replace(/\*{3,}/g, '**') // Más de 2 asteriscos seguidos
      .replace(/_{3,}/g, '__') // Más de 2 guiones bajos seguidos
      .replace(/\*{1}(?!\*)/g, '') // Asteriscos sueltos sin cerrar
      .replace(/_{1}(?!_)/g, '') // Guiones bajos sueltos sin cerrar
      // Limpiar caracteres problemáticos
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Caracteres de control invisibles
      .trim()
  }
}
