import { logger } from '../../utils/logger.js'
import { conversationModel, satisfactionSurveyModel } from '../../database/models.js'
import { AIClientFactory } from '../ai-integration/ai-client.js'
import { SatisfactionSurveyHandler } from '../handlers/satisfaction-survey.js'

/**
 * Sistema de timeout para conversaciones
 */
export class ConversationTimeoutManager {
  private static instance: ConversationTimeoutManager
  private timeoutMap: Map<number, NodeJS.Timeout> = new Map()
  private surveyHandler: SatisfactionSurveyHandler
  private aiClient: any

  private constructor() {
    this.surveyHandler = SatisfactionSurveyHandler.getInstance()
    this.aiClient = AIClientFactory.createClient()
  }

  public static getInstance(): ConversationTimeoutManager {
    if (!ConversationTimeoutManager.instance) {
      ConversationTimeoutManager.instance = new ConversationTimeoutManager()
    }
    return ConversationTimeoutManager.instance
  }

  /**
   * Inicia el timeout para una conversación
   */
  public startTimeout(userId: number, conversationId: number, timeoutMinutes: number = 15): void {
    try {
      // Cancelar timeout existente si existe
      this.cancelTimeout(userId)

      // Convertir minutos a milisegundos
      const timeoutMs = timeoutMinutes * 60 * 1000

      // Crear nuevo timeout
      const timeout = setTimeout(async () => {
        await this.handleConversationTimeout(userId, conversationId)
      }, timeoutMs)

      // Guardar timeout
      this.timeoutMap.set(userId, timeout)

      logger.debug(`Timeout iniciado para usuario ${userId}, conversación ${conversationId} (${timeoutMinutes} minutos)`)

    } catch (error) {
      logger.error('Error iniciando timeout de conversación:', error)
    }
  }

  /**
   * Cancela el timeout para un usuario
   */
  public cancelTimeout(userId: number): void {
    try {
      const timeout = this.timeoutMap.get(userId)
      if (timeout) {
        clearTimeout(timeout)
        this.timeoutMap.delete(userId)
        logger.debug(`Timeout cancelado para usuario ${userId}`)
      }
    } catch (error) {
      logger.error('Error cancelando timeout:', error)
    }
  }

  /**
   * Renueva el timeout para un usuario (reinicia el contador)
   */
  public renewTimeout(userId: number, conversationId: number, timeoutMinutes: number = 15): void {
    try {
      // Cancelar timeout actual
      this.cancelTimeout(userId)
      
      // Iniciar nuevo timeout
      this.startTimeout(userId, conversationId, timeoutMinutes)
      
      logger.debug(`Timeout renovado para usuario ${userId}`)
    } catch (error) {
      logger.error('Error renovando timeout:', error)
    }
  }

  /**
   * Maneja el timeout de una conversación
   */
  private async handleConversationTimeout(userId: number, conversationId: number): Promise<void> {
    try {
      logger.info(`Conversación ${conversationId} del usuario ${userId} ha expirado por timeout`)

      // Terminar conversación en la base de datos
      const endResult = await conversationModel.endConversation(conversationId)
      
      if (!endResult.success) {
        logger.error(`Error terminando conversación ${conversationId}:`, endResult.error)
        return
      }

      // Obtener información del usuario para enviar encuesta
      const userInfo = await this.getUserInfo(userId)
      if (!userInfo) {
        logger.error(`No se pudo obtener información del usuario ${userId}`)
        return
      }

      // Enviar encuesta de satisfacción
      await this.sendTimeoutSurvey(userId, conversationId, userInfo)

      // Limpiar timeout del mapa
      this.timeoutMap.delete(userId)

    } catch (error) {
      logger.error('Error manejando timeout de conversación:', error)
    }
  }

  /**
   * Obtiene información del usuario
   */
  private async getUserInfo(userId: number): Promise<any> {
    try {
      // Aquí deberías obtener la información del usuario desde la base de datos
      // Por ahora retornamos un objeto básico
      return {
        id: userId,
        telegram_id: userId
      }
    } catch (error) {
      logger.error('Error obteniendo información del usuario:', error)
      return null
    }
  }

  /**
   * Envía encuesta de satisfacción por timeout
   */
  private async sendTimeoutSurvey(userId: number, conversationId: number, userInfo: any): Promise<void> {
    try {
      // Crear contexto simulado para enviar la encuesta
      const mockContext = {
        user: userInfo,
        reply: async (message: string, options?: any) => {
          // Aquí deberías enviar el mensaje real al usuario
          // Por ahora solo lo logueamos
          logger.info(`Enviando encuesta a usuario ${userId}: ${message}`)
        }
      }

      // Enviar encuesta usando el handler
      await this.surveyHandler.sendSatisfactionSurvey(mockContext as any, conversationId)

    } catch (error) {
      logger.error('Error enviando encuesta por timeout:', error)
    }
  }

  /**
   * Obtiene el estado de timeouts activos
   */
  public getActiveTimeouts(): { userId: number; remainingMs: number }[] {
    const activeTimeouts: { userId: number; remainingMs: number }[] = []
    
    for (const [userId, timeout] of this.timeoutMap.entries()) {
      // Calcular tiempo restante (esto es una aproximación)
      // En una implementación real, deberías guardar el timestamp de inicio
      activeTimeouts.push({
        userId,
        remainingMs: 0 // Placeholder
      })
    }

    return activeTimeouts
  }

  /**
   * Limpia todos los timeouts
   */
  public clearAllTimeouts(): void {
    try {
      for (const [userId, timeout] of this.timeoutMap.entries()) {
        clearTimeout(timeout)
      }
      this.timeoutMap.clear()
      logger.info('Todos los timeouts han sido limpiados')
    } catch (error) {
      logger.error('Error limpiando timeouts:', error)
    }
  }

  /**
   * Verifica si un usuario tiene timeout activo
   */
  public hasActiveTimeout(userId: number): boolean {
    return this.timeoutMap.has(userId)
  }

  /**
   * Obtiene el número de timeouts activos
   */
  public getActiveTimeoutCount(): number {
    return this.timeoutMap.size
  }
}

/**
 * Servicio de limpieza automática de conversaciones inactivas
 */
export class ConversationCleanupService {
  private static instance: ConversationCleanupService
  private cleanupInterval: NodeJS.Timeout | null = null
  private timeoutManager: ConversationTimeoutManager

  private constructor() {
    this.timeoutManager = ConversationTimeoutManager.getInstance()
  }

  public static getInstance(): ConversationCleanupService {
    if (!ConversationCleanupService.instance) {
      ConversationCleanupService.instance = new ConversationCleanupService()
    }
    return ConversationCleanupService.instance
  }

  /**
   * Inicia el servicio de limpieza
   */
  public startCleanupService(intervalMinutes: number = 5): void {
    try {
      // Cancelar servicio existente si existe
      this.stopCleanupService()

      // Ejecutar limpieza inmediatamente
      this.performCleanup()

      // Programar limpieza periódica
      this.cleanupInterval = setInterval(() => {
        this.performCleanup()
      }, intervalMinutes * 60 * 1000)

      logger.info(`Servicio de limpieza de conversaciones iniciado (cada ${intervalMinutes} minutos)`)

    } catch (error) {
      logger.error('Error iniciando servicio de limpieza:', error)
    }
  }

  /**
   * Detiene el servicio de limpieza
   */
  public stopCleanupService(): void {
    try {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval)
        this.cleanupInterval = null
        logger.info('Servicio de limpieza de conversaciones detenido')
      }
    } catch (error) {
      logger.error('Error deteniendo servicio de limpieza:', error)
    }
  }

  /**
   * Ejecuta la limpieza de conversaciones
   */
  private async performCleanup(): Promise<void> {
    try {
      logger.debug('Ejecutando limpieza de conversaciones inactivas')
      
      // Aquí podrías implementar lógica adicional de limpieza
      // como terminar conversaciones que han estado inactivas por mucho tiempo
      
      const activeTimeouts = this.timeoutManager.getActiveTimeoutCount()
      logger.debug(`Timeouts activos: ${activeTimeouts}`)

    } catch (error) {
      logger.error('Error ejecutando limpieza de conversaciones:', error)
    }
  }
}
