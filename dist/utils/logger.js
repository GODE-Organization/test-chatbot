import winston from 'winston';
import { loggingConfig } from '../config/settings';
const winstonLogger = winston.createLogger({
    level: loggingConfig.level,
    format: winston.format.combine(winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }), winston.format.errors({ stack: true }), winston.format.json()),
    defaultMeta: { service: 'telegram-bot' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), winston.format.simple())
        })
    ]
});
if (loggingConfig.file) {
    winstonLogger.add(new winston.transports.File({
        filename: loggingConfig.file,
        format: winston.format.combine(winston.format.timestamp(), winston.format.json())
    }));
}
export const logger = {
    error: (message, meta) => winstonLogger.error(message, meta),
    warn: (message, meta) => winstonLogger.warn(message, meta),
    info: (message, meta) => winstonLogger.info(message, meta),
    debug: (message, meta) => winstonLogger.debug(message, meta),
    bot: {
        start: (message) => winstonLogger.info(`🚀 ${message}`),
        stop: (message) => winstonLogger.info(`🛑 ${message}`),
        error: (message, error) => winstonLogger.error(`❌ ${message}`, error),
        success: (message) => winstonLogger.info(`✅ ${message}`),
        warning: (message) => winstonLogger.warn(`⚠️ ${message}`),
        debug: (message, meta) => winstonLogger.debug(`🐛 ${message}`, meta)
    },
    database: {
        connect: (message) => winstonLogger.info(`🗄️ ${message}`),
        query: (message) => winstonLogger.debug(`📊 ${message}`),
        error: (message, error) => winstonLogger.error(`💾 ${message}`, error)
    },
    user: {
        join: (userId, username) => winstonLogger.info(`👤 Usuario ${userId}${username ? ` (@${username})` : ''} se unió`),
        leave: (userId, username) => winstonLogger.info(`👋 Usuario ${userId}${username ? ` (@${username})` : ''} se fue`),
        action: (userId, action) => winstonLogger.debug(`👤 Usuario ${userId}: ${action}`)
    }
};
export { logger as default };
//# sourceMappingURL=logger.js.map