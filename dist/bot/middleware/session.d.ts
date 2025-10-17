import type { BotContext, UserState } from '../../types/bot.js';
import type { BotFlowState } from '../../types/ai-system.js';
export declare function sessionMiddleware(ctx: BotContext, next: () => Promise<void>): Promise<void>;
export declare function stateMiddleware(requiredState?: UserState): (ctx: BotContext, next: () => Promise<void>) => Promise<void>;
export declare function resetSessionMiddleware(ctx: BotContext, next: () => Promise<void>): Promise<void>;
export declare function flowMiddleware(requiredFlow?: BotFlowState): (ctx: BotContext, next: () => Promise<void>) => Promise<void>;
//# sourceMappingURL=session.d.ts.map