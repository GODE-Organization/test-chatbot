import { logger } from '../../utils/logger.js';
import { AIProcessor } from '../ai-integration/ai-processor.js';
import { AIClientFactory } from '../ai-integration/ai-client.js';
import { GuaranteeFlowHandler } from './guarantee-flow.js';
import { SatisfactionSurveyHandler } from './satisfaction-survey.js';
import { messageModel, conversationModel } from '../../database/models.js';
export class AIMessageHandler {
    static instance;
    aiProcessor;
    aiClient;
    guaranteeHandler;
    surveyHandler;
    constructor() {
        this.aiProcessor = AIProcessor.getInstance();
        this.aiClient = AIClientFactory.createClient();
        this.guaranteeHandler = GuaranteeFlowHandler.getInstance();
        this.surveyHandler = SatisfactionSurveyHandler.getInstance();
    }
    static getInstance() {
        if (!AIMessageHandler.instance) {
            AIMessageHandler.instance = new AIMessageHandler();
        }
        return AIMessageHandler.instance;
    }
    async handleTextMessage(ctx) {
        try {
            if (!ctx.message || !('text' in ctx.message) || !ctx.user) {
                return;
            }
            const text = ctx.message.text;
            const userId = ctx.user.id;
            const chatId = ctx.chat?.id;
            if (chatId) {
                await messageModel.saveMessage({
                    telegram_id: ctx.message.message_id,
                    user_id: userId,
                    chat_id: chatId,
                    text: text,
                    message_type: 'text'
                });
            }
            if (this.guaranteeHandler.isInGuaranteeFlow(ctx.session)) {
                const processed = await this.guaranteeHandler.processGuaranteeStep(ctx, 'text');
                if (processed) {
                    return;
                }
            }
            if (this.surveyHandler.isWaitingForSurvey(ctx.session)) {
                await ctx.reply('Por favor, selecciona una opción de la encuesta de satisfacción.');
                return;
            }
            await this.processWithAI(ctx, text);
        }
        catch (error) {
            logger.error('Error manejando mensaje de texto:', error);
            await ctx.reply('❌ Ocurrió un error procesando tu mensaje.');
        }
    }
    async handlePhotoMessage(ctx) {
        try {
            if (!ctx.message || !('photo' in ctx.message) || !ctx.user) {
                return;
            }
            const userId = ctx.user.id;
            const chatId = ctx.chat?.id;
            if (chatId) {
                await messageModel.saveMessage({
                    telegram_id: ctx.message.message_id,
                    user_id: userId,
                    chat_id: chatId,
                    message_type: 'photo'
                });
            }
            if (this.guaranteeHandler.isInGuaranteeFlow(ctx.session)) {
                const processed = await this.guaranteeHandler.processGuaranteeStep(ctx, 'photo');
                if (processed) {
                    return;
                }
            }
            await ctx.reply('📸 Recibí tu foto, pero actualmente solo puedo procesar fotos durante el registro de garantías. ¿Hay algo más en lo que pueda ayudarte?');
        }
        catch (error) {
            logger.error('Error manejando mensaje de foto:', error);
            await ctx.reply('❌ Ocurrió un error procesando la foto.');
        }
    }
    async handleCallbackQuery(ctx) {
        try {
            if (!ctx.callbackQuery || !('data' in ctx.callbackQuery) || !ctx.user) {
                return;
            }
            const callbackData = ctx.callbackQuery.data;
            if (callbackData.startsWith('survey_')) {
                await this.surveyHandler.handleSurveyCallback(ctx, callbackData);
                return;
            }
        }
        catch (error) {
            logger.error('Error manejando callback query:', error);
            await ctx.answerCbQuery('❌ Error procesando selección');
        }
    }
    async processWithAI(ctx, message) {
        try {
            if (!ctx.user) {
                return;
            }
            const aiSessionData = ctx.session?.ai_session_data || {};
            const aiResponse = await this.aiClient.sendMessageToAI(message, ctx.user.id, aiSessionData);
            if (!aiResponse.success) {
                await ctx.reply('❌ Error comunicándose con el sistema de IA. Intenta de nuevo.');
                return;
            }
            const result = await this.aiProcessor.processAIResponse({
                response: aiResponse.response,
                actions: aiResponse.actions || [],
                session_data: aiResponse.session_data
            }, ctx.user.id, ctx.chat?.id || 0);
            if (!result.success) {
                await ctx.reply('❌ Error procesando respuesta de IA.');
                return;
            }
            await this.sendResponseToUser(ctx, result.response);
            if (result.session_data && ctx.session) {
                ctx.session.ai_session_data = result.session_data;
            }
            await this.processAIActions(ctx, result.actions || []);
        }
        catch (error) {
            logger.error('Error procesando con IA:', error);
            await ctx.reply('❌ Ocurrió un error procesando tu mensaje.');
        }
    }
    async sendResponseToUser(ctx, response) {
        try {
            const options = {};
            if (response.parse_mode) {
                options.parse_mode = response.parse_mode;
            }
            if (response.reply_markup) {
                options.reply_markup = response.reply_markup;
            }
            await ctx.reply(response.text, options);
        }
        catch (error) {
            logger.error('Error enviando respuesta al usuario:', error);
            await ctx.reply('❌ Error enviando respuesta.');
        }
    }
    async processAIActions(ctx, actions) {
        try {
            for (const action of actions) {
                switch (action.command) {
                    case 'REGISTER_GUARANTEE':
                        await this.guaranteeHandler.startGuaranteeFlow(ctx);
                        break;
                    case 'END_CONVERSATION':
                        await this.handleEndConversation(ctx);
                        break;
                    default:
                        break;
                }
            }
        }
        catch (error) {
            logger.error('Error procesando acciones de IA:', error);
        }
    }
    async handleEndConversation(ctx) {
        try {
            if (!ctx.user) {
                return;
            }
            const conversationResult = await conversationModel.getActiveConversation(ctx.user.id);
            if (conversationResult.success && conversationResult.data) {
                await conversationModel.endConversation(conversationResult.data.id);
                await this.surveyHandler.sendSatisfactionSurvey(ctx, conversationResult.data.id);
            }
        }
        catch (error) {
            logger.error('Error manejando fin de conversación:', error);
        }
    }
    initializeUserSession(ctx) {
        if (!ctx.session) {
            ctx.session = this.aiProcessor.createInitialSession();
        }
    }
    async handleCancelCommand(ctx) {
        try {
            if (!ctx.session) {
                return;
            }
            if (this.guaranteeHandler.isInGuaranteeFlow(ctx.session)) {
                await this.guaranteeHandler.cancelGuaranteeFlow(ctx);
                return;
            }
            if (this.surveyHandler.isWaitingForSurvey(ctx.session)) {
                ctx.session = this.aiProcessor.resetSessionToIdle(ctx.session);
                await ctx.reply('❌ Encuesta cancelada. ¿En qué más puedo ayudarte?');
                return;
            }
            await ctx.reply('No hay nada que cancelar. ¿En qué puedo ayudarte?');
        }
        catch (error) {
            logger.error('Error manejando comando cancel:', error);
            await ctx.reply('❌ Error procesando cancelación.');
        }
    }
}
//# sourceMappingURL=ai-message-handler.js.map