import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AIExternalResponse, AISystemConfig } from '../../types/ai-system.js'
import { logger } from '../../utils/logger.js'

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
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
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
    try {
      // Construir el prompt del sistema
      const systemPrompt = this.buildSystemPrompt()
      
      // Construir el contexto de la conversación
      const conversationContext = this.buildConversationContext(userMessage, userId, sessionData)
      
      // Generar respuesta con Gemini
      const result = await this.model.generateContent([
        systemPrompt,
        conversationContext
      ])
      
      const response = await result.response
      const text = response.text()
      
      // Parsear la respuesta JSON de Gemini
      const aiResponse = this.parseGeminiResponse(text)
      
      logger.debug('Respuesta de Gemini generada:', aiResponse)
      
      return aiResponse

    } catch (error) {
      logger.error('Error procesando mensaje con Gemini:', error)
      throw error
    }
  }

  /**
   * Construye el prompt del sistema para Gemini
   */
  private buildSystemPrompt(): string {
    return `
Eres un asistente de atención al cliente inteligente para una tienda. Tu trabajo es ayudar a los clientes con consultas sobre productos, garantías, horarios y ubicación.

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
- CONSULT_GUARANTEES: Para consultar garantías del usuario (parámetros: user_id)
- REGISTER_GUARANTEE: Para iniciar registro de garantía (sin parámetros)
- CONSULT_SCHEDULE: Para consultar horarios (sin parámetros)
- SEND_GEOLOCATION: Para enviar ubicación (sin parámetros)
- END_CONVERSATION: Para terminar conversación (parámetros: reason)

INSTRUCCIONES:
1. Responde de manera amigable y profesional
2. Usa emojis apropiados
3. Si el usuario pregunta sobre productos, usa CONSULT_CATALOG
4. Si el usuario quiere registrar una garantía, usa REGISTER_GUARANTEE
5. Si el usuario pregunta horarios, usa CONSULT_SCHEDULE
6. Si el usuario pregunta ubicación, usa SEND_GEOLOCATION
7. Si el usuario se despide, usa END_CONVERSATION
8. Mantén el contexto en session_data
9. SIEMPRE responde con JSON válido, nunca texto plano

IMPORTANTE: Tu respuesta debe ser SOLO el JSON, sin texto adicional antes o después.
    `.trim()
  }

  /**
   * Construye el contexto de la conversación
   */
  private buildConversationContext(
    userMessage: string, 
    userId: number, 
    sessionData?: Record<string, any>
  ): string {
    const context = sessionData ? JSON.stringify(sessionData, null, 2) : '{}'
    
    return `
CONTEXTO DE LA CONVERSACIÓN:
- Usuario ID: ${userId}
- Datos de sesión: ${context}
- Mensaje del usuario: "${userMessage}"

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
}
