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
            logger.info('🔍 Verificando flujo de garantía en handleTextMessage:', {
                userId: ctx.user.id,
                sessionState: ctx.session?.state,
                flowData: ctx.session?.flow_data,
                message: text
            });
            if (this.guaranteeHandler.isInGuaranteeFlow(ctx.session)) {
                logger.info('✅ Usuario en flujo de garantía, procesando paso:', {
                    userId: ctx.user.id,
                    message: text,
                    currentStep: ctx.session?.flow_data?.guarantee_flow?.step
                });
                const processed = await this.guaranteeHandler.processGuaranteeStep(ctx, 'text');
                if (processed) {
                    logger.info('✅ Paso de garantía procesado exitosamente');
                    return;
                }
                else {
                    logger.warn('⚠️ Paso de garantía no se procesó correctamente');
                }
            }
            else {
                logger.info('❌ Usuario NO está en flujo de garantía');
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
            logger.info('Mensaje de foto recibido:', ctx.message);
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
            const isCatalogQuery = this.isCatalogQuery(message);
            let loadingMessage = null;
            if (isCatalogQuery) {
                loadingMessage = await ctx.reply('🔍 Estoy consultando nuestro catálogo de productos... ⏳');
            }
            const aiSessionData = ctx.session?.ai_session_data || {};
            const result = await this.aiProcessor.sendMessageToAI(message, ctx.user.id, ctx.chat?.id || 0, aiSessionData);
            if (!result.success) {
                if (loadingMessage) {
                    try {
                        await ctx.deleteMessage(loadingMessage.message_id);
                    }
                    catch (e) {
                    }
                }
                await ctx.reply('❌ Error procesando respuesta de IA.');
                return;
            }
            if (loadingMessage) {
                try {
                    await ctx.deleteMessage(loadingMessage.message_id);
                }
                catch (e) {
                }
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
            const sanitizedText = this.sanitizeMarkdownText(response.text);
            await ctx.reply(sanitizedText, options);
            if (response.images && Array.isArray(response.images)) {
                for (const imageData of response.images) {
                    try {
                        logger.info('📸 Enviando imagen de producto:', {
                            fileId: imageData.file_id,
                            productId: imageData.product?.id,
                            productName: imageData.product?.description
                        });
                        await ctx.replyWithPhoto(imageData.file_id, {
                            caption: `📦 ${imageData.product?.description || 'Producto'}`,
                            parse_mode: 'Markdown'
                        });
                    }
                    catch (imageError) {
                        logger.error('Error enviando imagen de producto:', imageError);
                    }
                }
            }
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
                        logger.info('🚀 Ejecutando acción REGISTER_GUARANTEE:', {
                            userId: ctx.user?.id,
                            sessionState: ctx.session?.state,
                            flowData: ctx.session?.flow_data
                        });
                        await this.guaranteeHandler.startGuaranteeFlow(ctx);
                        logger.info('✅ Flujo de garantía iniciado:', {
                            userId: ctx.user?.id,
                            sessionState: ctx.session?.state,
                            flowData: ctx.session?.flow_data
                        });
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
    isCatalogQuery(message) {
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
        ];
        const lowerMessage = message.toLowerCase();
        return catalogKeywords.some(keyword => lowerMessage.includes(keyword));
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
    sanitizeMarkdownText(text) {
        if (!text)
            return text;
        return text
            .replace(/Licuaddora/g, 'Licuadora')
            .replace(/aacero/g, 'acero')
            .replace(/Electrodomésticcos/g, 'Electrodomésticos')
            .replace(/Bossch/g, 'Bosch')
            .replace(/función pulse/g, 'función pulse')
            .replace(/cuchillas de accero/g, 'cuchillas de acero')
            .replace(/pie de accero/g, 'pie de acero')
            .replace(/\*{3,}/g, '**')
            .replace(/_{3,}/g, '__')
            .replace(/\*{1}(?!\*)/g, '')
            .replace(/_{1}(?!_)/g, '')
            .replace(/[\u200B-\u200D\uFEFF]/g, '')
            .trim();
    }
}
//# sourceMappingURL=ai-message-handler.js.map