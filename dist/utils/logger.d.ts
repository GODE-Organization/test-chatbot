import winston from 'winston';
export declare const logger: {
    error: (message: string, meta?: any) => winston.Logger;
    warn: (message: string, meta?: any) => winston.Logger;
    info: (message: string, meta?: any) => winston.Logger;
    debug: (message: string, meta?: any) => winston.Logger;
    bot: {
        start: (message: string) => winston.Logger;
        stop: (message: string) => winston.Logger;
        error: (message: string, error?: any) => winston.Logger;
        success: (message: string) => winston.Logger;
        warning: (message: string) => winston.Logger;
        debug: (message: string, meta?: any) => winston.Logger;
    };
    database: {
        connect: (message: string) => winston.Logger;
        query: (message: string) => winston.Logger;
        error: (message: string, error?: any) => winston.Logger;
    };
    user: {
        join: (userId: number, username?: string) => winston.Logger;
        leave: (userId: number, username?: string) => winston.Logger;
        action: (userId: number, action: string) => winston.Logger;
    };
};
export { logger as default };
//# sourceMappingURL=logger.d.ts.map