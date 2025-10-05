import winston from 'winston'
import { loggingConfig } from '../config/settings.js'

/**
 * Configuración del logger
 */
const winstonLogger = winston.createLogger({
  level: loggingConfig.level,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'telegram-bot' },
  transports: [
    // Consola
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
})

// Agregar archivo de log si está configurado
if (loggingConfig.file) {
  winstonLogger.add(new winston.transports.File({
    filename: loggingConfig.file,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }))
}

/**
 * Logger personalizado con métodos específicos
 */
export const logger = {
  error: (message: string, meta?: any) => winstonLogger.error(message, meta),
  warn: (message: string, meta?: any) => winstonLogger.warn(message, meta),
  info: (message: string, meta?: any) => winstonLogger.info(message, meta),
  debug: (message: string, meta?: any) => winstonLogger.debug(message, meta),
  
  // Métodos específicos para el bot
  bot: {
    start: (message: string) => winstonLogger.info(`🚀 ${message}`),
    stop: (message: string) => winstonLogger.info(`🛑 ${message}`),
    error: (message: string, error?: any) => winstonLogger.error(`❌ ${message}`, error),
    success: (message: string) => winstonLogger.info(`✅ ${message}`),
    warning: (message: string) => winstonLogger.warn(`⚠️ ${message}`),
    debug: (message: string, meta?: any) => winstonLogger.debug(`🐛 ${message}`, meta)
  },
  
  // Métodos para base de datos
  database: {
    connect: (message: string) => winstonLogger.info(`🗄️ ${message}`),
    query: (message: string) => winstonLogger.debug(`📊 ${message}`),
    error: (message: string, error?: any) => winstonLogger.error(`💾 ${message}`, error)
  },
  
  // Métodos para usuarios
  user: {
    join: (userId: number, username?: string) => 
      winstonLogger.info(`👤 Usuario ${userId}${username ? ` (@${username})` : ''} se unió`),
    leave: (userId: number, username?: string) => 
      winstonLogger.info(`👋 Usuario ${userId}${username ? ` (@${username})` : ''} se fue`),
    action: (userId: number, action: string) => 
      winstonLogger.debug(`👤 Usuario ${userId}: ${action}`)
  }
}

export { logger as default }
