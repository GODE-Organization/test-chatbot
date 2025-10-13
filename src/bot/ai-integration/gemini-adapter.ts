import type { AIExternalResponse, AISystemConfig, MessageProcessingResult } from '../../types/ai-system.js'
import { logger } from '../../utils/logger.js'
import { GeminiService } from './gemini-service.js'

/**
 * Adaptador que usa Google Gemini como IA externa
 */
export class GeminiAdapter {
  private static instance: GeminiAdapter
  private geminiService: GeminiService
  private config: AISystemConfig

  private constructor(config: AISystemConfig) {
    this.config = config
    const apiKey = process.env['GEMINI_API_KEY']
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno')
    }
    this.geminiService = GeminiService.getInstance(apiKey, config)
  }

  public static getInstance(config?: AISystemConfig): GeminiAdapter {
    if (!GeminiAdapter.instance) {
      if (!config) {
        throw new Error('Configuración requerida para crear instancia de GeminiAdapter')
      }
      GeminiAdapter.instance = new GeminiAdapter(config)
    }
    return GeminiAdapter.instance
  }

  /**
   * Envía un mensaje a Gemini y obtiene respuesta
   */
  public async sendMessageToAI(
    userMessage: string,
    userId: number,
    sessionData?: Record<string, any>
  ): Promise<MessageProcessingResult> {
    try {
      logger.debug(`Enviando mensaje a Gemini - Usuario: ${userId}, Mensaje: ${userMessage}`)

      // Procesar mensaje con Gemini (ya incluye reintentos internos)
      const aiResponse = await this.geminiService.processMessage(
        userMessage,
        userId,
        sessionData
      )

      logger.debug('Respuesta recibida de Gemini:', aiResponse)

      // Verificar si es una respuesta de fallback
      const isFallbackResponse = aiResponse.session_data?.['fallback_reason']

      return {
        success: true,
        response: aiResponse.response,
        actions: aiResponse.actions,
        session_data: aiResponse.session_data || {},
        is_fallback: !!isFallbackResponse,
        fallback_reason: isFallbackResponse
      }

    } catch (error) {
      logger.error('Error enviando mensaje a Gemini:', error)
      
      // Crear respuesta de fallback en caso de error crítico
      const fallbackResponse = this.createCriticalErrorFallback(error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de comunicación con Gemini',
        response: fallbackResponse.response,
        actions: fallbackResponse.actions,
        session_data: fallbackResponse.session_data || {},
        is_fallback: true,
        fallback_reason: 'critical_error'
      }
    }
  }

  /**
   * Verifica la conectividad con Gemini
   */
  public async checkConnectivity(): Promise<boolean> {
    try {
      return await this.geminiService.checkConnectivity()
    } catch (error) {
      logger.error('Error verificando conectividad con Gemini:', error)
      return false
    }
  }

  /**
   * Obtiene la configuración actual
   */
  public getConfig(): AISystemConfig {
    return { ...this.config }
  }

  /**
   * Actualiza la configuración
   */
  public updateConfig(newConfig: Partial<AISystemConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Crea una respuesta de fallback para errores críticos
   */
  private createCriticalErrorFallback(error: any): AIExternalResponse {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    
    logger.warn('Creando respuesta de fallback crítico:', {
      error: errorMessage,
      timestamp: new Date().toISOString()
    })

    return {
      response: {
        text: `🚨 *Error del Sistema*\n\nLo siento, estoy experimentando problemas técnicos graves en este momento. Nuestro equipo técnico ha sido notificado.\n\n*¿Qué puedes hacer?*\n• Intenta de nuevo en unos minutos\n• Contacta con nuestro soporte técnico\n• Usa nuestros canales alternativos de atención`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🔄 Reintentar',
                callback_data: 'retry_message'
              },
              {
                text: '📞 Soporte Técnico',
                callback_data: 'contact_support'
              }
            ],
            [
              {
                text: '📋 Ver catálogo básico',
                callback_data: 'show_basic_catalog'
              }
            ]
          ]
        }
      },
      actions: [],
      session_data: {
        critical_error: true,
        error_message: errorMessage,
        error_timestamp: new Date().toISOString(),
        fallback_type: 'critical'
      }
    }
  }
}

/**
 * Factory para crear instancia de GeminiAdapter
 */
export class GeminiAdapterFactory {
  private static defaultConfig: AISystemConfig = {
    external_ai_url: 'gemini://google.com', // Placeholder
    api_key: process.env['GEMINI_API_KEY'] || '',
    timeout_ms: parseInt(process.env['AI_TIMEOUT_MS'] || '30000'),
    max_retries: parseInt(process.env['AI_MAX_RETRIES'] || '3'),
    conversation_timeout_minutes: parseInt(process.env['CONVERSATION_TIMEOUT_MINUTES'] || '15')
  }

  public static createAdapter(config?: Partial<AISystemConfig>): GeminiAdapter {
    const finalConfig = { ...this.defaultConfig, ...config }
    return GeminiAdapter.getInstance(finalConfig)
  }

  public static getDefaultConfig(): AISystemConfig {
    return { ...this.defaultConfig }
  }
}
