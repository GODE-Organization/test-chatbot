import { Telegraf } from 'telegraf';
import { authMiddleware } from './auth.js';
import { loggingMiddleware } from './logging.js';
import { sessionMiddleware, stateMiddleware, resetSessionMiddleware } from './session.js';
export async function setupMiddleware(bot) {
    bot.use(loggingMiddleware);
    bot.use(authMiddleware);
    bot.use(sessionMiddleware);
    bot.catch((err, ctx) => {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Error en bot:', {
            error: error.message,
            stack: error.stack,
            updateId: ctx.update?.update_id,
            userId: ctx.from?.id,
            chatId: ctx.chat?.id
        });
    });
}
export { authMiddleware, loggingMiddleware, sessionMiddleware, stateMiddleware, resetSessionMiddleware };
//# sourceMappingURL=index.js.map