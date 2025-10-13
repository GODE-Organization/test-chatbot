import { userModel } from '../../database/models.js';
import { logger } from '../../utils/logger.js';
export async function authMiddleware(ctx, next) {
    try {
        if (!ctx.from) {
            return next();
        }
        const userData = {
            telegram_id: ctx.from.id,
            ...(ctx.from.username && { username: ctx.from.username }),
            ...(ctx.from.first_name && { first_name: ctx.from.first_name }),
            ...(ctx.from.last_name && { last_name: ctx.from.last_name }),
            ...(ctx.from.language_code && { language_code: ctx.from.language_code }),
            is_bot: ctx.from.is_bot
        };
        const userResult = await userModel.upsertUser(userData);
        if (userResult.success && userResult.data) {
            ctx.user = {
                id: userResult.data.id,
                ...(userResult.data.username && { username: userResult.data.username }),
                ...(userResult.data.first_name && { first_name: userResult.data.first_name }),
                ...(userResult.data.last_name && { last_name: userResult.data.last_name }),
                ...(userResult.data.language_code && { language_code: userResult.data.language_code })
            };
            if (!ctx.session) {
                const { AIProcessor } = await import('../ai-integration/ai-processor.js');
                const aiProcessor = AIProcessor.getInstance();
                ctx.session = aiProcessor.createInitialSession();
            }
            logger.user.action(ctx.from.id, `Usuario autenticado: ${userResult.data.first_name || userResult.data.username || 'Sin nombre'}`);
        }
        else {
            logger.error('Error autenticando usuario:', userResult.error);
        }
        await next();
    }
    catch (error) {
        logger.error('Error en middleware de autenticación:', error);
        await next();
    }
}
//# sourceMappingURL=auth.js.map