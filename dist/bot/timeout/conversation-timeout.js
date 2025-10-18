import { logger } from '../../utils/logger.js';
import { conversationModel, satisfactionSurveyModel } from '../../database/models.js';
import { AIClientFactory } from '../ai-integration/ai-client.js';
import { SatisfactionSurveyHandler } from '../handlers/satisfaction-survey.js';
export class ConversationTimeoutManager {
    static instance;
    timeoutMap = new Map();
    surveyHandler;
    aiClient;
    constructor() {
        this.surveyHandler = SatisfactionSurveyHandler.getInstance();
        this.aiClient = AIClientFactory.createClient();
    }
    static getInstance() {
        if (!ConversationTimeoutManager.instance) {
            ConversationTimeoutManager.instance = new ConversationTimeoutManager();
        }
        return ConversationTimeoutManager.instance;
    }
    startTimeout(userId, conversationId, timeoutMinutes = 15) {
        try {
            this.cancelTimeout(userId);
            const timeoutMs = timeoutMinutes * 60 * 1000;
            const timeout = setTimeout(async () => {
                await this.handleConversationTimeout(userId, conversationId);
            }, timeoutMs);
            this.timeoutMap.set(userId, timeout);
            logger.debug(`Timeout iniciado para usuario ${userId}, conversación ${conversationId} (${timeoutMinutes} minutos)`);
        }
        catch (error) {
            logger.error('Error iniciando timeout de conversación:', error);
        }
    }
    cancelTimeout(userId) {
        try {
            const timeout = this.timeoutMap.get(userId);
            if (timeout) {
                clearTimeout(timeout);
                this.timeoutMap.delete(userId);
                logger.debug(`Timeout cancelado para usuario ${userId}`);
            }
        }
        catch (error) {
            logger.error('Error cancelando timeout:', error);
        }
    }
    renewTimeout(userId, conversationId, timeoutMinutes = 15) {
        try {
            this.cancelTimeout(userId);
            this.startTimeout(userId, conversationId, timeoutMinutes);
            logger.debug(`Timeout renovado para usuario ${userId}`);
        }
        catch (error) {
            logger.error('Error renovando timeout:', error);
        }
    }
    async handleConversationTimeout(userId, conversationId) {
        try {
            logger.info(`Conversación ${conversationId} del usuario ${userId} ha expirado por timeout`);
            const endResult = await conversationModel.endConversation(conversationId);
            if (!endResult.success) {
                logger.error(`Error terminando conversación ${conversationId}:`, endResult.error);
                return;
            }
            const userInfo = await this.getUserInfo(userId);
            if (!userInfo) {
                logger.error(`No se pudo obtener información del usuario ${userId}`);
                return;
            }
            await this.sendTimeoutSurvey(userId, conversationId, userInfo);
            this.timeoutMap.delete(userId);
        }
        catch (error) {
            logger.error('Error manejando timeout de conversación:', error);
        }
    }
    async getUserInfo(userId) {
        try {
            return {
                id: userId,
                telegram_id: userId
            };
        }
        catch (error) {
            logger.error('Error obteniendo información del usuario:', error);
            return null;
        }
    }
    async sendTimeoutSurvey(userId, conversationId, userInfo) {
        try {
            const { TelegramBot } = await import('../../index.js');
            const bot = TelegramBot.getInstance();
            const realContext = {
                user: userInfo,
                reply: async (message, options) => {
                    try {
                        await bot.bot.telegram.sendMessage(userId, message, options);
                        logger.info(`✅ Encuesta enviada a usuario ${userId}: ${message}`);
                    }
                    catch (error) {
                        logger.error(`❌ Error enviando encuesta a usuario ${userId}:`, error);
                    }
                }
            };
            await this.surveyHandler.sendSatisfactionSurvey(realContext, conversationId);
        }
        catch (error) {
            logger.error('Error enviando encuesta por timeout:', error);
        }
    }
    getActiveTimeouts() {
        const activeTimeouts = [];
        for (const [userId, timeout] of this.timeoutMap.entries()) {
            activeTimeouts.push({
                userId,
                remainingMs: 0
            });
        }
        return activeTimeouts;
    }
    clearAllTimeouts() {
        try {
            for (const [userId, timeout] of this.timeoutMap.entries()) {
                clearTimeout(timeout);
            }
            this.timeoutMap.clear();
            logger.info('Todos los timeouts han sido limpiados');
        }
        catch (error) {
            logger.error('Error limpiando timeouts:', error);
        }
    }
    hasActiveTimeout(userId) {
        return this.timeoutMap.has(userId);
    }
    getActiveTimeoutCount() {
        return this.timeoutMap.size;
    }
}
export class ConversationCleanupService {
    static instance;
    cleanupInterval = null;
    timeoutManager;
    constructor() {
        this.timeoutManager = ConversationTimeoutManager.getInstance();
    }
    static getInstance() {
        if (!ConversationCleanupService.instance) {
            ConversationCleanupService.instance = new ConversationCleanupService();
        }
        return ConversationCleanupService.instance;
    }
    startCleanupService(intervalMinutes = 5) {
        try {
            this.stopCleanupService();
            this.performCleanup();
            this.cleanupInterval = setInterval(() => {
                this.performCleanup();
            }, intervalMinutes * 60 * 1000);
            logger.info(`Servicio de limpieza de conversaciones iniciado (cada ${intervalMinutes} minutos)`);
        }
        catch (error) {
            logger.error('Error iniciando servicio de limpieza:', error);
        }
    }
    stopCleanupService() {
        try {
            if (this.cleanupInterval) {
                clearInterval(this.cleanupInterval);
                this.cleanupInterval = null;
                logger.info('Servicio de limpieza de conversaciones detenido');
            }
        }
        catch (error) {
            logger.error('Error deteniendo servicio de limpieza:', error);
        }
    }
    async performCleanup() {
        try {
            logger.debug('Ejecutando limpieza de conversaciones inactivas');
            const activeTimeouts = this.timeoutManager.getActiveTimeoutCount();
            logger.debug(`Timeouts activos: ${activeTimeouts}`);
        }
        catch (error) {
            logger.error('Error ejecutando limpieza de conversaciones:', error);
        }
    }
}
//# sourceMappingURL=conversation-timeout.js.map