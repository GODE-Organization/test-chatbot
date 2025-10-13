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

      // Procesar mensaje con Gemini
      const aiResponse = await this.geminiService.processMessage(
        userMessage,
        userId,
        sessionData
      )

      logger.debug('Respuesta recibida de Gemini:', aiResponse)

      return {
        success: true,
        response: aiResponse.response,
        actions: aiResponse.actions,
        session_data: aiResponse.session_data || {}
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
