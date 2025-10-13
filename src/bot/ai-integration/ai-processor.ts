import type { 
  AIExternalResponse, 
  AICommand, 
  AICommandResponse, 
  MessageProcessingResult,
  BotFlowState,
  GuaranteeFlowStep,
  UserSessionData
} from '../../types/ai-system.js'
import { logger } from '../../utils/logger.js'
import { productModel, guaranteeModel, scheduleModel, storeConfigModel, conversationModel } from '../../database/models.js'
import { GeminiAdapter, GeminiAdapterFactory } from './gemini-adapter.js'

/**
 * Procesador de respuestas de IA externa
 */
export class AIProcessor {
  private static instance: AIProcessor
  private geminiAdapter: GeminiAdapter

  private constructor() {
    this.geminiAdapter = GeminiAdapterFactory.createAdapter()
  }

  public static getInstance(): AIProcessor {
    if (!AIProcessor.instance) {
      AIProcessor.instance = new AIProcessor()
    }
    return AIProcessor.instance
  }

  /**
   * Envía un mensaje a Gemini y procesa la respuesta
   */
  public async sendMessageToAI(
    userMessage: string,
    userId: number,
    chatId: number,
    sessionData?: Record<string, any>
  ): Promise<MessageProcessingResult> {
    try {
      logger.debug(`Enviando mensaje a Gemini - Usuario: ${userId}, Chat: ${chatId}`)
      
      const result = await this.geminiAdapter.sendMessageToAI(
        userMessage,
        userId,
        sessionData
      )

      if (!result.success) {
        return result
      }

      // Procesar las acciones de la IA
      const actionResults: AICommandResponse[] = []
      
      for (const action of result.actions || []) {
        const actionResult = await this.executeAIAction(action, userId, chatId)
        actionResults.push(actionResult)
        
        // Si es una consulta de catálogo exitosa, enviar los datos a Gemini para formatear
        if (action.command === 'CONSULT_CATALOG' && actionResult.success && actionResult.data) {
          logger.info('🛍️ Enviando datos de catálogo a Gemini para formateo:', {
            productCount: actionResult.data.length,
            userId
          })
          
          const catalogResult = await this.sendCatalogDataToGemini(
            actionResult.data,
            userId,
            sessionData
          )
          
          if (catalogResult.success) {
            // Reemplazar la respuesta original con la formateada por Gemini
            result.response = catalogResult.response!
            logger.info('✅ Respuesta de catálogo formateada por Gemini:', catalogResult.response)
            
            // Procesar acciones de imagen del formateo de catálogo
            if (catalogResult.actions && catalogResult.actions.length > 0) {
              for (const imageAction of catalogResult.actions) {
                const imageResult = await this.executeAIAction(imageAction, userId, chatId)
                actionResults.push(imageResult)
                
                // Agregar imagen a la respuesta si es exitosa
                if (imageResult.success && imageResult.data) {
                  if (!result.response.images) {
                    result.response.images = []
                  }
                  result.response.images.push({
                    file_id: imageResult.data.file_id,
                    product: imageResult.data.product
                  })
                }
              }
            }
          }
        }
        
        // Si es una solicitud de imagen exitosa, preparar para envío
        if (action.command === 'SEND_IMAGE' && actionResult.success && actionResult.data) {
          logger.info('📸 Preparando imagen de producto:', {
            productId: actionResult.data.product?.id,
            fileId: actionResult.data.file_id,
            userId
          })
          
          // Agregar información de imagen a la respuesta
          if (result.response && !result.response.images) {
            result.response.images = []
          }
          if (result.response) {
            result.response.images!.push({
              file_id: actionResult.data.file_id,
              product: actionResult.data.product
            })
          }
        }
      }

      const response = result.response || { text: 'Respuesta procesada correctamente', parse_mode: 'Markdown' as const }
      
      return {
        success: true,
        response,
        actions: result.actions || [],
        session_data: result.session_data || {},
        action_results: actionResults
      }

    } catch (error) {
      logger.error('Error enviando mensaje a Gemini:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de comunicación con Gemini'
      }
    }
  }

  /**
   * Procesa una respuesta JSON de la IA externa
   */
  public async processAIResponse(
    aiResponse: AIExternalResponse,
    userId: number,
    chatId: number
  ): Promise<MessageProcessingResult> {
    try {
      // Validar la respuesta de la IA
      if (!this.validateAIResponse(aiResponse)) {
        return {
          success: false,
          error: 'Respuesta de IA inválida'
        }
      }

      // Procesar las acciones de la IA
      const actionResults: AICommandResponse[] = []
      
      for (const action of aiResponse.actions) {
        const result = await this.executeAIAction(action, userId, chatId)
        actionResults.push(result)
      }

      // Verificar si alguna acción falló
      const failedActions = actionResults.filter(result => !result.success)
      if (failedActions.length > 0) {
        logger.error('Algunas acciones de IA fallaron:', failedActions)
      }

      return {
        success: true,
        response: aiResponse.response,
        actions: aiResponse.actions,
        session_data: aiResponse.session_data || {}
      }

    } catch (error) {
      logger.error('Error procesando respuesta de IA:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }

  /**
   * Valida la estructura de la respuesta de IA
   */
  private validateAIResponse(response: any): response is AIExternalResponse {
    return (
      response &&
      typeof response === 'object' &&
      response.response &&
      typeof response.response.text === 'string' &&
      Array.isArray(response.actions)
    )
  }

  /**
   * Ejecuta una acción específica de la IA
   */
  private async executeAIAction(
    action: { command: AICommand; parameters: any },
    userId: number,
    chatId: number
  ): Promise<AICommandResponse> {
    try {
      switch (action.command) {
        case 'CONSULT_CATALOG':
          return await this.handleConsultCatalog(action.parameters)
        
        case 'CONSULT_GUARANTEES':
          return await this.handleConsultGuarantees(action.parameters)
        
        case 'REGISTER_GUARANTEE':
          return await this.handleRegisterGuarantee(userId)
        
        case 'CONSULT_SCHEDULE':
          return await this.handleConsultSchedule()
        
        case 'SEND_GEOLOCATION':
          return await this.handleSendGeolocation()
        
        case 'SEND_IMAGE':
          return await this.handleSendImage(action.parameters)
        
        case 'END_CONVERSATION':
          return await this.handleEndConversation(userId, action.parameters)
        
        default:
          return {
            success: false,
            error: `Comando no reconocido: ${action.command}`
          }
      }
    } catch (error) {
      logger.error(`Error ejecutando acción ${action.command}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }

  /**
   * Maneja la consulta del catálogo
   */
  private async handleConsultCatalog(parameters: any): Promise<AICommandResponse> {
    try {
      const filters = parameters?.filters || {}
      const limit = parameters?.limit || 10

      const result = await productModel.getAllProductsWithBsPrice({
        brand: filters.brand,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        limit
      })

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Error desconocido'
        }
      }

      return {
        success: true,
        data: result.data,
        message: `Se encontraron ${result.data?.length || 0} productos`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error consultando catálogo'
      }
    }
  }

  /**
   * Maneja la consulta de garantías
   */
  private async handleConsultGuarantees(parameters: any): Promise<AICommandResponse> {
    try {
      const userId = parameters?.user_id
      if (!userId) {
        return {
          success: false,
          error: 'user_id es requerido para consultar garantías'
        }
      }

      const result = await guaranteeModel.getGuaranteesByUserId(userId)

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Error desconocido'
        }
      }

      return {
        success: true,
        data: result.data,
        message: `Se encontraron ${result.data?.length || 0} garantías`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error consultando garantías'
      }
    }
  }

  /**
   * Maneja el registro de garantía (inicia flujo)
   */
  private async handleRegisterGuarantee(userId: number): Promise<AICommandResponse> {
    try {
      // Crear conversación si no existe
      const conversationResult = await conversationModel.createConversation({
        user_id: userId,
        ai_session_data: JSON.stringify({ flow: 'guarantee_registration' })
      })

      if (!conversationResult.success) {
        return {
          success: false,
          error: conversationResult.error || 'Error desconocido'
        }
      }

      return {
        success: true,
        data: {
          conversation_id: conversationResult.data?.id,
          flow_started: true
        },
        message: 'Flujo de registro de garantía iniciado'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error iniciando flujo de garantía'
      }
    }
  }

  /**
   * Maneja la consulta de horarios
   */
  private async handleConsultSchedule(): Promise<AICommandResponse> {
    try {
      const result = await scheduleModel.getAllSchedules()

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Error desconocido'
        }
      }

      return {
        success: true,
        data: result.data,
        message: 'Horarios obtenidos correctamente'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error consultando horarios'
      }
    }
  }

  /**
   * Maneja el envío de geolocalización
   */
  private async handleSendGeolocation(): Promise<AICommandResponse> {
    try {
      const result = await storeConfigModel.getStoreConfig()

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Error desconocido'
        }
      }

      if (!result.data) {
        return {
          success: false,
          error: 'No se encontró configuración de la tienda'
        }
      }

      return {
        success: true,
        data: result.data,
        message: 'Información de ubicación obtenida'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo ubicación'
      }
    }
  }

  /**
   * Maneja el envío de imagen
   */
  private async handleSendImage(parameters: any): Promise<AICommandResponse> {
    try {
      const { product_id, file_id } = parameters || {}
      
      if (!product_id || !file_id) {
        return {
          success: false,
          error: 'product_id y file_id son requeridos para enviar imagen'
        }
      }

      // Obtener información del producto
      const productResult = await productModel.getProductById(product_id)
      
      if (!productResult.success || !productResult.data) {
        return {
          success: false,
          error: 'Producto no encontrado'
        }
      }

      return {
        success: true,
        data: {
          product: productResult.data,
          file_id: file_id
        },
        message: 'Imagen de producto preparada para envío'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error manejando imagen'
      }
    }
  }

  /**
   * Maneja el fin de conversación
   */
  private async handleEndConversation(userId: number, parameters: any): Promise<AICommandResponse> {
    try {
      // Obtener conversación activa
      const conversationResult = await conversationModel.getActiveConversation(userId)
      
      if (conversationResult.success && conversationResult.data) {
        // Terminar conversación
        await conversationModel.endConversation(conversationResult.data.id)
      }

      return {
        success: true,
        data: {
          conversation_ended: true,
          reason: parameters?.reason || 'Usuario terminó la conversación'
        },
        message: 'Conversación terminada'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error terminando conversación'
      }
    }
  }

  /**
   * Crea una sesión de usuario con estado inicial
   */
  public createInitialSession(): UserSessionData {
    return {
      state: 'idle',
      last_activity: new Date()
    }
  }

  /**
   * Actualiza el estado de sesión para flujo de garantía
   */
  public updateSessionForGuaranteeFlow(session: UserSessionData): UserSessionData {
    return {
      ...session,
      state: 'guarantee_flow',
      flow_data: {
        ...session.flow_data,
        guarantee_flow: {
          step: 'waiting_invoice_number',
          data: {}
        }
      },
      last_activity: new Date()
    }
  }

  /**
   * Actualiza el estado de sesión para encuesta
   */
  public updateSessionForSurvey(session: UserSessionData, conversationId: number): UserSessionData {
    return {
      ...session,
      state: 'survey_waiting',
      flow_data: {
        ...session.flow_data,
        survey_data: {
          conversation_id: conversationId,
          waiting_for_rating: true
        }
      },
      last_activity: new Date()
    }
  }

  /**
   * Resetea la sesión a estado idle
   */
  public resetSessionToIdle(session: UserSessionData): UserSessionData {
    return {
      state: 'idle',
      last_activity: new Date()
    }
  }

  /**
   * Envía datos de catálogo a Gemini para formateo
   */
  private async sendCatalogDataToGemini(
    products: any[],
    userId: number,
    sessionData?: Record<string, any>
  ): Promise<MessageProcessingResult> {
    try {
      // Crear prompt específico para formatear catálogo
      const catalogPrompt = `
FORMATEAR CATÁLOGO DE PRODUCTOS:

Tienes que formatear la siguiente lista de productos de Tecno Express de manera atractiva y organizada para el usuario.

PRODUCTOS DISPONIBLES:
${JSON.stringify(products, null, 2)}

INSTRUCCIONES:
1. Presenta los productos de forma atractiva con emojis apropiados
2. Incluye precio en USD y Bs (bolívares venezolanos), descripción y disponibilidad
3. Organiza por categorías si es posible
4. Usa formato Markdown para mejor presentación
5. Si hay productos sin stock, indícalo claramente
6. Mantén un tono amigable y profesional como Max
7. Si un producto tiene imagen disponible (image_file_id), puedes usar el comando SEND_IMAGE para mostrarla
8. Para usar imágenes, incluye en tu respuesta JSON el comando: {"command": "SEND_IMAGE", "parameters": {"product_id": X, "file_id": "file_id_del_producto"}}
9. SIEMPRE muestra ambos precios: USD y Bs usando el formato "Precio: $X USD / Y Bs"
10. Si un producto tiene price_bs, úsalo; si no, indica que la conversión no está disponible

FORMATO DE RESPUESTA:
Responde con JSON en este formato:
{
  "response": {
    "text": "Tu texto formateado aquí",
    "parse_mode": "Markdown"
  },
  "actions": [
    {"command": "SEND_IMAGE", "parameters": {"product_id": 1, "file_id": "file_id_aqui"}}
  ]
}

Ejemplo de texto formateado:
🛍️ **Nuestros Productos Disponibles**

**🍳 Electrodomésticos de Cocina**
• **Freidora de Aire** - Precio: $90 USD / 17,572 Bs
  _Capacidad 5L, 7 programas, 1500W_
  ✅ Disponible (3 unidades)

• **Cafetera de Goteo** - Precio: $27 USD / 5,272 Bs
  _1.2L, función mantener caliente_
  ✅ Disponible (4 unidades)
      `.trim()

      // Enviar a Gemini para formateo
      const result = await this.geminiAdapter.sendMessageToAI(
        catalogPrompt,
        userId,
        sessionData
      )

      if (!result.success) {
        logger.error('Error formateando catálogo con Gemini:', result.error)
        return {
          success: false,
          error: result.error || 'Error formateando catálogo'
        }
      }

      // Procesar acciones de imagen si las hay
      const imageActions = result.actions?.filter(action => action.command === 'SEND_IMAGE') || []
      
      return {
        success: true,
        response: result.response || { text: 'Catálogo formateado', parse_mode: 'Markdown' as const },
        actions: imageActions,
        session_data: result.session_data || {}
      }

    } catch (error) {
      logger.error('Error enviando datos de catálogo a Gemini:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error formateando catálogo'
      }
    }
  }

  /**
   * Verifica la conectividad con Gemini
   */
  public async checkGeminiConnectivity(): Promise<boolean> {
    try {
      return await this.geminiAdapter.checkConnectivity()
    } catch (error) {
      logger.error('Error verificando conectividad con Gemini:', error)
      return false
    }
  }
}
