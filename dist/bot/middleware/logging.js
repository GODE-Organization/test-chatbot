import { logger } from '../../utils/logger.js';
import { formatDate } from '../../utils/helpers.js';
export async function loggingMiddleware(ctx, next) {
    const startTime = Date.now();
    try {
        const messageInfo = {
            updateId: ctx.update?.update_id,
            messageId: ctx.message?.message_id,
            userId: ctx.from?.id,
            username: ctx.from?.username,
            chatId: ctx.chat?.id,
            chatType: ctx.chat?.type,
            updateType: ctx.updateType,
            timestamp: formatDate(new Date())
        };
        if (ctx.message && 'text' in ctx.message) {
            messageInfo.text = ctx.message.text;
            messageInfo.command = ctx.message.text?.startsWith('/') ? ctx.message.text.split(' ')[0] : undefined;
        }
        logger.debug('📥 Mensaje recibido:', messageInfo);
        await next();
        const duration = Date.now() - startTime;
        logger.debug(`✅ Mensaje procesado en ${duration}ms`);
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`❌ Error procesando mensaje en ${duration}ms:`, error);
        throw error;
    }
}
//# sourceMappingURL=logging.js.map