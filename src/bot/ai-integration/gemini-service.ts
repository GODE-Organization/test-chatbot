import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AIExternalResponse, AISystemConfig } from '../../types/ai-system.js'
import { logger } from '../../utils/logger.js'
import { messageModel } from '../../database/models.js'

/**
 * Servicio de integración con Google Gemini
 */
export class GeminiService {
  private static instance: GeminiService
  private genAI: GoogleGenerativeAI
  private model: any
  private config: AISystemConfig

  private constructor(apiKey: string, config: AISystemConfig) {
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    this.config = config
  }

  public static getInstance(apiKey?: string, config?: AISystemConfig): GeminiService {
    if (!GeminiService.instance) {
      if (!apiKey) {
        throw new Error('API Key de Google Gemini requerida')
      }
      if (!config) {
        throw new Error('Configuración requerida')
      }
      GeminiService.instance = new GeminiService(apiKey, config)
    }
    return GeminiService.instance
  }

  /**
   * Procesa un mensaje del usuario y genera respuesta con Gemini
   */
  public async processMessage(
    userMessage: string,
    userId: number,
    sessionData?: Record<string, any>
  ): Promise<AIExternalResponse> {
    const maxRetries = this.config.max_retries || 3
    const baseDelay = 1000 // 1 segundo base

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Construir el prompt del sistema
        const systemPrompt = this.buildSystemPrompt()
        
        // Construir el contexto de la conversación
        const conversationContext = await this.buildConversationContext(userMessage, userId, sessionData)
        
        // Generar respuesta con Gemini
        const result = await this.model.generateContent([
          systemPrompt,
          conversationContext
        ])
        
        const response = await result.response
        const text = response.text()
        
        // Log detallado de la respuesta cruda de Gemini
        logger.info('🔍 Respuesta cruda de Gemini:', {
          rawText: text,
          userId,
          timestamp: new Date().toISOString()
        })
        
        // Parsear la respuesta JSON de Gemini
        const aiResponse = this.parseGeminiResponse(text)
        
        logger.info('📋 Respuesta parseada de Gemini:', {
          response: aiResponse.response,
          actions: aiResponse.actions,
          sessionData: aiResponse.session_data,
          userId,
          timestamp: new Date().toISOString()
        })
        
        return aiResponse

      } catch (error) {
        const isRetryableError = this.isRetryableError(error)
        const isLastAttempt = attempt === maxRetries

        logger.warn(`Intento ${attempt}/${maxRetries} falló:`, {
          error: error instanceof Error ? error.message : 'Error desconocido',
          isRetryable: isRetryableError,
          userId
        })

        if (!isRetryableError || isLastAttempt) {
          // Si no es un error recuperable o es el último intento, devolver error de fallback
          return this.createFallbackResponse(error)
        }

        // Calcular delay con backoff exponencial + jitter
        const delay = this.calculateRetryDelay(attempt, baseDelay)
        logger.info(`Reintentando en ${delay}ms... (intento ${attempt + 1}/${maxRetries})`)
        
        await this.sleep(delay)
      }
    }

    // Este punto nunca debería alcanzarse, pero por seguridad
    return this.createFallbackResponse(new Error('Máximo número de reintentos alcanzado'))
  }

  /**
   * Construye el prompt del sistema para Gemini
   */
  private buildSystemPrompt(): string {
    return `
Eres "Max", el Asistente Virtual de Tecno Express, una empresa de pequeños electrodomésticos, conocida por su rapidez en la entrega y soporte post-venta.
Fuiste creado por el equipo de GODE Devs, tu trabajo es ayudar a los clientes con consultas sobre productos, garantías, horarios y ubicación.

FORMATO DE RESPUESTA OBLIGATORIO:
Debes responder SIEMPRE con un JSON válido en el siguiente formato:

{
  "response": {
    "text": "Tu respuesta al usuario aquí",
    "parse_mode": "Markdown",
    "reply_markup": {
      "inline_keyboard": []
    }
  },
  "actions": [
    {
      "command": "COMANDO_AQUI",
      "parameters": {}
    }
  ],
  "session_data": {
    "contexto": "datos que quieres recordar"
  }
}

COMANDOS DISPONIBLES:
- CONSULT_CATALOG: Para consultar productos (parámetros: filters, limit)
  * filters: { brand?: string, minPrice?: number, maxPrice?: number }
  * limit: número máximo de productos (recomendado: 5-10 para respuestas rápidas)
- CONSULT_GUARANTEES: Para consultar garantías del usuario (parámetros: user_id)
- REGISTER_GUARANTEE: Para iniciar registro de garantía (sin parámetros)
- CONSULT_SCHEDULE: Para consultar horarios (sin parámetros)
- SEND_GEOLOCATION: Para enviar ubicación (sin parámetros)
- SEND_IMAGE: Para enviar imagen de producto (parámetros: product_id, file_id)
- END_CONVERSATION: Para terminar conversación (parámetros: reason)

INSTRUCCIONES:
1. Responde de manera amigable y profesional
2. Al iniciar una conversación, debes presentarte como "Max", el Asistente Virtual de Tecno Express
3. No es necesario presentarte en cada mensaje, solo al inicio de la conversación
4. Siempre mantén tu rol como Asistente Virtual de Tecno Express
5. Usa emojis apropiados
6. Si el usuario pregunta sobre productos, usa CONSULT_CATALOG con filtros inteligentes:
   - Si pregunta "todos los productos" o "catálogo completo", usa limit: 10
   - Si menciona una marca específica, usa filters: { brand: "marca" }
   - Si menciona rango de precios, usa filters: { minPrice: X, maxPrice: Y }
   - Si pregunta "productos baratos", usa filters: { maxPrice: 50 }
   - Si pregunta "productos caros", usa filters: { minPrice: 100 }
   - Si no especifica, usa limit: 5 para respuesta rápida
7. Si el usuario quiere registrar una garantía, usa REGISTER_GUARANTEE
8. Si el usuario pregunta horarios, usa CONSULT_SCHEDULE
9. Si el usuario pregunta ubicación, usa SEND_GEOLOCATION
10. Si el usuario se despide, usa END_CONVERSATION
11. Mantén el contexto en session_data
12. SIEMPRE responde con JSON válido, nunca texto plano

IMPORTANTE: 
- Tu respuesta debe ser SOLO el JSON, sin texto adicional antes o después
- Cuando uses CONSULT_CATALOG, NO incluyas información de productos en tu respuesta inicial
- El sistema te proporcionará los datos de productos después de ejecutar el comando
- Los productos incluyen precios en USD y Bs (bolívares venezolanos) automáticamente
- Siempre muestra ambos precios: USD y Bs para dar opciones al cliente
- Usa formato: "Precio: $X USD / Y Bs" para mostrar ambos precios
    `.trim()
  }

  /**
   * Construye el contexto de la conversación
   */
  private async buildConversationContext(
    userMessage: string, 
    userId: number, 
    sessionData?: Record<string, any>
  ): Promise<string> {
    const context = sessionData ? JSON.stringify(sessionData, null, 2) : '{}'
    
    // Obtener historial de conversación reciente
    let conversationHistory = ''
    try {
      const recentMessages = await messageModel.getRecentMessages(userId, 5)
      if (recentMessages.success && recentMessages.data && recentMessages.data.length > 0) {
        const historyText = recentMessages.data
          .reverse() // Ordenar cronológicamente (más antiguo primero)
          .map((msg, index) => {
            const time = new Date(msg.created_at).toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
            return `${index + 1}. [${time}] ${msg.text}`
          })
          .join('\n')
        
        conversationHistory = `\nHISTORIAL RECIENTE DE LA CONVERSACIÓN:\n${historyText}\n`
      }
    } catch (error) {
      logger.warn('Error obteniendo historial de conversación:', error)
    }
    
    return `
CONTEXTO DE LA CONVERSACIÓN:
- Usuario ID: ${userId}
- Datos de sesión: ${context}
- Mensaje actual del usuario: "${userMessage}"${conversationHistory}

IMPORTANTE: Mantén el contexto de la conversación. Si el usuario pregunta sobre productos después de una consulta previa, recuerda que ya mostraste información y puedes hacer seguimiento apropiado.

Responde con el JSON apropiado basado en el mensaje del usuario.
    `.trim()
  }

  /**
   * Parsea la respuesta de Gemini y la convierte al formato esperado
   */
  private parseGeminiResponse(text: string): AIExternalResponse {
    try {
      // Limpiar la respuesta de Gemini (puede incluir markdown o texto adicional)
      const cleanText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^[^{]*/, '') // Remover texto antes del primer {
        .replace(/[^}]*$/, '') // Remover texto después del último }
        .trim()

      const parsed = JSON.parse(cleanText)
      
      // Validar estructura básica
      if (!parsed.response || !parsed.response.text) {
        throw new Error('Respuesta de Gemini no tiene estructura válida')
      }

      return {
        response: {
          text: parsed.response.text,
          parse_mode: parsed.response.parse_mode || 'Markdown',
          reply_markup: parsed.response.reply_markup || undefined
        },
        actions: parsed.actions || [],
        session_data: parsed.session_data || {}
      }

    } catch (error) {
      logger.error('Error parseando respuesta de Gemini:', error)
      
      // Respuesta de fallback
      return {
        response: {
          text: 'Lo siento, hubo un error procesando tu mensaje. ¿Podrías intentar de nuevo?',
          parse_mode: 'Markdown'
        },
        actions: [],
        session_data: {}
      }
    }
  }

  /**
   * Verifica la conectividad con Gemini
   */
  public async checkConnectivity(): Promise<boolean> {
    try {
      const result = await this.model.generateContent('test')
      await result.response
      return true
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
   * Determina si un error es recuperable y debe reintentarse
   */
  private isRetryableError(error: any): boolean {
    if (!error) return false

    const errorMessage = error.message || error.toString()
    const errorStatus = error.status || error.statusCode

    // Errores 5xx del servidor (sobrecarga, mantenimiento, etc.)
    if (errorStatus >= 500 && errorStatus < 600) {
      return true
    }

    // Errores específicos de Gemini que son recuperables
    const retryablePatterns = [
      '503 Service Unavailable',
      'The model is overloaded',
      'Please try again later',
      'Rate limit exceeded',
      'Quota exceeded',
      'Internal server error',
      'Bad Gateway',
      'Service Unavailable',
      'Gateway Timeout'
    ]

    return retryablePatterns.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    )
  }

  /**
   * Calcula el delay para el siguiente reintento con backoff exponencial + jitter
   */
  private calculateRetryDelay(attempt: number, baseDelay: number): number {
    // Backoff exponencial: baseDelay * 2^(attempt-1)
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1)
    
    // Jitter aleatorio: ±25% del delay calculado
    const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1)
    
    // Delay máximo de 30 segundos
    const maxDelay = 30000
    const finalDelay = Math.min(exponentialDelay + jitter, maxDelay)
    
    return Math.max(finalDelay, 1000) // Mínimo 1 segundo
  }

  /**
   * Pausa la ejecución por el tiempo especificado
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Crea una respuesta de fallback cuando no se puede procesar el mensaje
   */
  private createFallbackResponse(error: any): AIExternalResponse {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    
    // Determinar el tipo de mensaje de fallback basado en el error
    let fallbackText = 'Lo siento, estoy experimentando dificultades técnicas en este momento. ¿Podrías intentar de nuevo en unos minutos?'
    
    if (errorMessage.includes('503') || errorMessage.includes('overloaded')) {
      fallbackText = '¡Ups! 😅 Nuestro sistema de IA está un poco sobrecargado en este momento. Por favor, intenta de nuevo en unos minutos. Mientras tanto, puedo ayudarte con información básica sobre nuestros productos.'
    } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
      fallbackText = 'Hemos alcanzado nuestro límite de consultas por el momento. Por favor, intenta de nuevo más tarde. ¡Gracias por tu paciencia! 🙏'
    } else if (errorMessage.includes('timeout')) {
      fallbackText = 'La consulta está tardando más de lo esperado. ¿Podrías intentar de nuevo? Si el problema persiste, contacta con nuestro soporte técnico.'
    }

    logger.warn('Devolviendo respuesta de fallback:', {
      originalError: errorMessage,
      fallbackText
    })

    return {
      response: {
        text: fallbackText,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🔄 Intentar de nuevo',
                callback_data: 'retry_message'
              },
              {
                text: '📞 Contactar soporte',
                callback_data: 'contact_support'
              }
            ]
          ]
        }
      },
      actions: [],
      session_data: {
        fallback_reason: errorMessage,
        fallback_timestamp: new Date().toISOString()
      }
    }
  }
}
