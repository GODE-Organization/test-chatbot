import { config } from 'dotenv'
import type { BotConfig } from '../types/bot.js'

// Cargar variables de entorno
config()

/**
 * Configuración de la aplicación
 */
export const appConfig: BotConfig = {
  token: process.env['BOT_TOKEN'] || '',
  webhook: {
    ...(process.env['WEBHOOK_URL'] && { url: process.env['WEBHOOK_URL'] }),
    port: process.env['WEBHOOK_PORT'] ? parseInt(process.env['WEBHOOK_PORT']) : 3000,
    path: process.env['WEBHOOK_PATH'] || '/webhook',
    ...(process.env['WEBHOOK_SECRET_TOKEN'] && { secretToken: process.env['WEBHOOK_SECRET_TOKEN'] })
  },
  database: {
    path: process.env['DATABASE_PATH'] || './data/bot.db'
  },
  logging: {
    level: (process.env['LOG_LEVEL'] as 'error' | 'warn' | 'info' | 'debug') || 'info',
    ...(process.env['LOG_FILE'] && { file: process.env['LOG_FILE'] })
  }
}

/**
 * Validar configuración requerida
 */
export function validateConfig(): void {
  if (!appConfig.token) {
    throw new Error('BOT_TOKEN es requerido en las variables de entorno')
  }
  
  if (process.env['BOT_USE_WEBHOOK'] === 'true' && !appConfig.webhook?.url) {
    throw new Error('WEBHOOK_URL es requerido cuando BOT_USE_WEBHOOK=true')
  }
}

/**
 * Configuración de desarrollo
 */
export const isDevelopment = process.env['NODE_ENV'] === 'development'
export const isProduction = process.env['NODE_ENV'] === 'production'

/**
 * Configuración de base de datos
 */
export const databaseConfig = {
  path: appConfig.database.path,
  options: {
    verbose: isDevelopment ? console.log : undefined
  }
}

/**
 * Configuración de logging
 */
export const loggingConfig = {
  level: appConfig.logging.level,
  format: isDevelopment ? 'dev' : 'combined',
  file: appConfig.logging.file
}
