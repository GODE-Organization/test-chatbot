import { userModel } from '../../database/models.js';
import { logger } from '../../utils/logger.js';
export async function sessionMiddleware(ctx, next) {
    try {
        if (!ctx.from || !ctx.user) {
            return next();
        }
        if (!ctx.session) {
            ctx.session = {
                state: 'idle',
                data: {}
            };
        }
        await userModel.updateUserState(ctx.from.id, ctx.session.state);
        await next();
        if (ctx.session && ctx.user) {
        }
    }
    catch (error) {
        logger.error('Error en middleware de sesión:', error);
        await next();
    }
}
export function stateMiddleware(requiredState) {
    return async (ctx, next) => {
        try {
            if (!ctx.session) {
                ctx.session = { state: 'idle', data: {} };
            }
            if (requiredState && ctx.session.state !== requiredState) {
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
        if (ctx.session) {
            ctx.session.state = 'idle';
            ctx.session.data = {};
        }
        await next();
    }
    catch (error) {
        logger.error('Error en middleware de reset de sesión:', error);
        await next();
    }
}
//# sourceMappingURL=session.js.map