import type { BotContext } from '../../types/bot.js'
import { logger } from '../../utils/logger.js'
import { satisfactionSurveyModel, conversationModel } from '../../database/models.js'
import { AIProcessor } from '../ai-integration/ai-processor.js'
import { Markup } from 'telegraf'

/**
 * Handler para encuestas de satisfacción
 */
export class SatisfactionSurveyHandler {
  private static instance: SatisfactionSurveyHandler
  private aiProcessor: AIProcessor

  private constructor() {
    this.aiProcessor = AIProcessor.getInstance()
  }

  public static getInstance(): SatisfactionSurveyHandler {
    if (!SatisfactionSurveyHandler.instance) {
      SatisfactionSurveyHandler.instance = new SatisfactionSurveyHandler()
    }
    return SatisfactionSurveyHandler.instance
  }

  /**
   * Envía encuesta de satisfacción al finalizar conversación
   */
  public async sendSatisfactionSurvey(ctx: BotContext, conversationId: number): Promise<void> {
    try {
      if (!ctx.user) {
        return
      }

      // Actualizar sesión para encuesta
      if (ctx.session) {
        ctx.session = this.aiProcessor.updateSessionForSurvey(ctx.session, conversationId)
      }

      const message = `
📝 **Encuesta de Satisfacción**

¡Gracias por contactarnos! Tu opinión es muy importante para nosotros.

¿Cómo calificarías tu experiencia con nuestro servicio de atención?

*Selecciona una opción:*
      `.trim()

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('😊 Excelente (5)', 'survey_5'),
          Markup.button.callback('😌 Muy bueno (4)', 'survey_4')
        ],
        [
          Markup.button.callback('😐 Bueno (3)', 'survey_3'),
          Markup.button.callback('😕 Regular (2)', 'survey_2')
        ],
        [
          Markup.button.callback('😞 Malo (1)', 'survey_1')
        ]
      ])

      await ctx.reply(message, keyboard)
      
      logger.user.action(ctx.user.id, 'Encuesta de satisfacción enviada')

    } catch (error) {
      logger.error('Error enviando encuesta de satisfacción:', error)
    }
  }

  /**
   * Procesa respuesta de encuesta de satisfacción
   */
  public async processSurveyResponse(ctx: BotContext, rating: number): Promise<void> {
    try {
      if (!ctx.user || !ctx.session?.flow_data?.survey_data) {
        await ctx.reply('❌ Error procesando encuesta.')
        return
      }

      const surveyData = ctx.session.flow_data.survey_data
      const conversationId = surveyData.conversation_id

      // Registrar encuesta en la base de datos
      const result = await satisfactionSurveyModel.createSurvey({
        user_id: ctx.user.id,
        rating: rating,
        conversation_id: conversationId
      })

      if (!result.success) {
        await ctx.reply('❌ Error registrando tu respuesta.')
        return
      }

      // Resetear sesión
      ctx.session = this.aiProcessor.resetSessionToIdle(ctx.session)

      // Respuesta según la calificación
      let responseMessage = ''
      switch (rating) {
        case 5:
          responseMessage = `
😊 **¡Excelente!**

¡Nos alegra saber que tuviste una excelente experiencia! Tu calificación nos ayuda a seguir mejorando.

¡Gracias por elegirnos! 🙏
          `.trim()
          break
        case 4:
          responseMessage = `
😌 **¡Muy bien!**

¡Gracias por tu calificación! Nos esforzamos por brindar el mejor servicio.

¡Esperamos verte pronto! 😊
          `.trim()
          break
        case 3:
          responseMessage = `
😐 **¡Gracias!**

Apreciamos tu feedback. Trabajamos constantemente para mejorar nuestro servicio.

¡Esperamos superar tus expectativas la próxima vez! 💪
          `.trim()
          break
        case 2:
          responseMessage = `
😕 **Entendemos tu preocupación**

Lamentamos que tu experiencia no haya sido la esperada. Tu feedback es valioso para nosotros.

¿Te gustaría que un supervisor revise tu caso? Escribe /contact para más opciones.
          `.trim()
          break
        case 1:
          responseMessage = `
😞 **Lamentamos mucho tu experiencia**

Nos disculpamos sinceramente. Tu feedback es crucial para mejorar nuestro servicio.

Por favor, contacta a un supervisor escribiendo /contact para que podamos resolver tu situación.
          `.trim()
          break
        default:
          responseMessage = `
✅ **¡Gracias por tu feedback!**

Tu opinión es muy importante para nosotros.
          `.trim()
      }

      await ctx.reply(responseMessage)
      
      logger.user.action(ctx.user.id, `Encuesta completada - Rating: ${rating}`)

    } catch (error) {
      logger.error('Error procesando respuesta de encuesta:', error)
      await ctx.reply('❌ Ocurrió un error procesando tu respuesta.')
    }
  }

  /**
   * Maneja callback de encuesta
   */
  public async handleSurveyCallback(ctx: BotContext, callbackData: string): Promise<boolean> {
    try {
      if (!callbackData.startsWith('survey_')) {
        return false
      }

      const rating = parseInt(callbackData.replace('survey_', ''))
      
      if (isNaN(rating) || rating < 1 || rating > 5) {
        await ctx.answerCbQuery('❌ Calificación inválida')
        return false
      }

      // Procesar respuesta
      await this.processSurveyResponse(ctx, rating)
      
      // Responder al callback
      await ctx.answerCbQuery('✅ ¡Gracias por tu calificación!')
      
      return true

    } catch (error) {
      logger.error('Error manejando callback de encuesta:', error)
      await ctx.answerCbQuery('❌ Error procesando respuesta')
      return false
    }
  }

  /**
   * Verifica si el usuario está esperando respuesta de encuesta
   */
  public isWaitingForSurvey(session: any): boolean {
    return session?.state === 'survey_waiting' && 
           session?.flow_data?.survey_data?.waiting_for_rating === true
  }

  /**
   * Obtiene estadísticas de encuestas
   */
  public async getSurveyStats(): Promise<{ total: number; average: number; distribution: Record<number, number> }> {
    try {
      // Esta función requeriría implementar un método en el modelo
      // Por ahora retornamos datos de ejemplo
      return {
        total: 0,
        average: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      }
    } catch (error) {
      logger.error('Error obteniendo estadísticas de encuestas:', error)
      return {
        total: 0,
        average: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      }
    }
  }
}
