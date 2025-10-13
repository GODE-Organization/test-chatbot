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

      const result = await productModel.getAllProducts({
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
