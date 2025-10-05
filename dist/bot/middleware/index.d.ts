import { Telegraf } from 'telegraf';
import type { BotContext } from '../../types/bot.js';
import { authMiddleware } from './auth.js';
import { loggingMiddleware } from './logging.js';
import { sessionMiddleware, stateMiddleware, resetSessionMiddleware } from './session.js';
export declare function setupMiddleware(bot: Telegraf<BotContext>): Promise<void>;
export { authMiddleware, loggingMiddleware, sessionMiddleware, stateMiddleware, resetSessionMiddleware };
//# sourceMappingURL=index.d.ts.map