import { userModel, conversationModel } from '../../database/models.js';
import { logger } from '../../utils/logger.js';
import { ConversationTimeoutManager } from '../timeout/conversation-timeout.js';
import { AIProcessor } from '../ai-integration/ai-processor.js';
export async function sessionMiddleware(ctx, next) {
    try {
        if (!ctx.from || !ctx.user) {
            return next();
        }
        const timeoutManager = ConversationTimeoutManager.getInstance();
        const aiProcessor = AIProcessor.getInstance();
        if (!ctx.session) {
            const userResult = await userModel.getUserByTelegramId(ctx.from.id);
            if (userResult.success && userResult.data && userResult.data.settings) {
                try {
                    const settings = JSON.parse(userResult.data.settings);
                    ctx.session = {
                        state: settings.state || 'idle',
                        last_activity: new Date(),
                        flow_data: settings.flow_data,
                        ai_session_data: settings.ai_session_data
                    };
                    logger.debug('Sesión recuperada desde BD:', {
                        userId: ctx.from.id,
                        state: ctx.session.state,
                        flowData: ctx.session.flow_data
                    });
                }
                catch (parseError) {
                    ctx.session = aiProcessor.createInitialSession();
                    logger.debug('Error parseando settings, nueva sesión creada:', {
                        userId: ctx.from.id,
                        error: parseError
                    });
                }
            }
            else {
                ctx.session = aiProcessor.createInitialSession();
                logger.debug('Nueva sesión creada:', {
                    userId: ctx.from.id,
                    state: ctx.session.state
                });
            }
        }
        ctx.session.last_activity = new Date();
        await handleConversationTimeout(ctx, timeoutManager);
        await userModel.updateUserState(ctx.from.id, ctx.session.state, {
            flow_data: ctx.session.flow_data ? JSON.stringify(ctx.session.flow_data) : null,
            ai_session_data: ctx.session.ai_session_data ? JSON.stringify(ctx.session.ai_session_data) : null
        });
        await next();
        if (ctx.session?.ai_session_data && ctx.user) {
            await saveAISessionData(ctx.user.id, ctx.session.ai_session_data);
        }
    }
    catch (error) {
        logger.error('Error en middleware de sesión:', error);
        await next();
    }
}
async function handleConversationTimeout(ctx, timeoutManager) {
    try {
        if (!ctx.user || !ctx.session)
            return;
        const conversationResult = await conversationModel.getActiveConversation(ctx.user.id);
        if (conversationResult.success && conversationResult.data) {
            const conversation = conversationResult.data;
            if (conversation.status === 'active') {
                timeoutManager.renewTimeout(ctx.user.id, conversation.id, 15);
            }
        }
        else if (ctx.session.state === 'idle') {
            const newConversationResult = await conversationModel.createConversation({
                user_id: ctx.user.id,
                ai_session_data: JSON.stringify(ctx.session.ai_session_data || {})
            });
            if (newConversationResult.success && newConversationResult.data) {
                timeoutManager.startTimeout(ctx.user.id, newConversationResult.data.id, 15);
            }
        }
    }
    catch (error) {
        logger.error('Error manejando timeout de conversación:', error);
    }
}
async function saveAISessionData(userId, sessionData) {
    try {
        const conversationResult = await conversationModel.getActiveConversation(userId);
        if (conversationResult.success && conversationResult.data) {
            await conversationModel.updateConversationData(conversationResult.data.id, JSON.stringify(sessionData));
        }
    }
    catch (error) {
        logger.error('Error guardando datos de sesión de IA:', error);
    }
}
export function stateMiddleware(requiredState) {
    return async (ctx, next) => {
        try {
            if (!ctx.session) {
                ctx.session = AIProcessor.getInstance().createInitialSession();
            }
            if (requiredState && ctx.session && ctx.session.state !== requiredState) {
                await ctx.reply('❌ Esta acción no está disponible en tu estado actual.');
                return;
            }
            await next();
        }
        catch (error) {
            logger.error('Error en middleware de estado:', error);
            await next();
        }
    };
}
export async function resetSessionMiddleware(ctx, next) {
    try {
        const timeoutManager = ConversationTimeoutManager.getInstance();
        const aiProcessor = AIProcessor.getInstance();
        if (ctx.user) {
            timeoutManager.cancelTimeout(ctx.user.id);
        }
        if (ctx.session) {
            ctx.session = aiProcessor.resetSessionToIdle(ctx.session);
        }
        else {
            ctx.session = aiProcessor.createInitialSession();
        }
        await next();
    }
    catch (error) {
        logger.error('Error en middleware de reset de sesión:', error);
        await next();
    }
}
export function flowMiddleware(requiredFlow) {
    return async (ctx, next) => {
        try {
            if (!ctx.session) {
                ctx.session = AIProcessor.getInstance().createInitialSession();
            }
            if (requiredFlow && ctx.session && ctx.session.state !== requiredFlow) {
                await ctx.reply('❌ Esta acción no está disponible en tu estado actual.');
                return;
            }
            await next();
        }
        catch (error) {
            logger.error('Error en middleware de flujo:', error);
            await next();
        }
    };
}
//# sourceMappingURL=session.js.map