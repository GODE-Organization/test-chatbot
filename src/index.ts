#!/usr/bin/env node

/**
 * Telegram Chatbot
 * Archivo principal de la aplicación
 */

import { Telegraf } from 'telegraf'
import type { Chat } from 'telegraf/types'
import { createServer } from 'http'

import { logger } from './utils/logger.js'
import { appConfig, validateConfig } from './config/settings.js'
import { connectDatabase, closeDatabase } from './database/connection.js'
import { setupMiddleware } from './bot/middleware/index.js'
import { setupHandlers } from './bot/handlers/index.js'
import { registerCleanupFunction, setupGracefulShutdown } from './utils/graceful-shutdown.js'
import { ConversationCleanupService } from './bot/timeout/index.js'
import type { BotContext } from './types/bot.js'
import 'dotenv/config'

// Validar configuración
validateConfig()

interface BotInstance {
  bot: Telegraf<BotContext>
  isShuttingDown: boolean
  initialize: () => Promise<void>
  start: () => Promise<void>
  shutdown: (code?: number, signal?: string | null) => Promise<void>
}

class TelegramBot implements BotInstance {
  public bot: Telegraf<BotContext>
  public isShuttingDown: boolean = false
  
  // Instancia global para acceso desde otros módulos
  private static instance: TelegramBot | null = null
  
  static getInstance(): TelegramBot {
    if (!TelegramBot.instance) {
      throw new Error('Bot no inicializado')
    }
    return TelegramBot.instance
  }

  constructor() {
    this.bot = new Telegraf<BotContext>(appConfig.token)
    
    // Middleware de logging básico
    this.bot.use(async (ctx, next) => {
      const updateInfo = {
        type: ctx.updateType,
        messageText: ctx.message && 'text' in ctx.message ? ctx.message.text : undefined,
        from: ctx.from?.username,
        chatType: ctx.chat?.type,
        chatTitle: ctx.chat && ('title' in ctx.chat) ? (ctx.chat as Chat.GroupChat | Chat.SupergroupChat).title : undefined,
        updateId: ctx.update?.update_id,
        messageId: ctx.message?.message_id,
        date: ctx.message?.date,
        command: ctx.message && 'text' in ctx.message && ctx.message.text?.startsWith('/') ? ctx.message.text.split(' ')[0] : undefined,
        entities: ctx.message && 'entities' in ctx.message ? ctx.message.entities : undefined
      }
      logger.debug('📥 Mensaje recibido:', updateInfo)
      await next()
    })

    this.bot.catch((err: unknown, ctx) => {
      const error = err instanceof Error ? err : new Error(String(err))
      logger.error('Error en bot:', {
        error: error.message,
        stack: error.stack,
        updateId: ctx.update?.update_id,
        userId: ctx.from?.id,
        chatId: ctx.chat?.id
      })
    })
  }

  async initialize(): Promise<void> {
    try {
      logger.bot.start('Iniciando Telegram Chatbot...')

      // Establecer instancia global
      TelegramBot.instance = this

      // Configurar base de datos
      logger.debug('Configurando base de datos...')
      try {
        await connectDatabase()
        logger.bot.success('Base de datos configurada')
      } catch (error) {
        logger.bot.error('Error configurando base de datos:', error)
        throw error
      }

      // Configurar middleware
      logger.debug('Configurando middleware...')
      try {
        await setupMiddleware(this.bot)
        logger.bot.success('Middleware configurado')
      } catch (error) {
        logger.bot.error('Error configurando middleware:', error)
        throw error
      }

      // Configurar handlers
      logger.debug('Configurando handlers...')
      try {
        await setupHandlers(this.bot)
        logger.bot.success('Handlers configurados')
      } catch (error) {
        logger.bot.error('Error configurando handlers:', error)
        throw error
      }

      // Configurar servicio de limpieza de conversaciones
      logger.debug('Configurando servicio de limpieza...')
      try {
        const cleanupService = ConversationCleanupService.getInstance()
        cleanupService.startCleanupService(5) // Limpiar cada 5 minutos
        logger.bot.success('Servicio de limpieza configurado')
      } catch (error) {
        logger.bot.error('Error configurando servicio de limpieza:', error)
        throw error
      }

      // Configurar cierre elegante
      logger.debug('Configurando cierre elegante...')
      try {
        this.setupGracefulShutdown()
        logger.bot.success('Cierre elegante configurado')
      } catch (error) {
        logger.bot.error('Error configurando cierre elegante:', error)
        throw error
      }

      logger.bot.success('Bot inicializado correctamente')
    } catch (error) {
      logger.bot.error('Error inicializando bot:', error)
      throw error
    }
  }

  async start(): Promise<void> {
    try {
      logger.debug('Iniciando bot...')
      if (process.env['BOT_USE_WEBHOOK'] === 'true') {
        await this.startWebhook()
      } else {
        await this.startPolling()
      }
      logger.bot.start('Bot iniciado exitosamente')
    } catch (error) {
      logger.bot.error('Error iniciando bot:', error)
      throw error
    }
  }

  private async startPolling(): Promise<void> {
    try {
      logger.debug('Iniciando polling...')
      await this.bot.launch()
      logger.bot.start('Bot iniciado con polling')
    } catch (error) {
      logger.bot.error('Error iniciando polling:', error)
      throw error
    }
  }

  private async startWebhook(): Promise<void> {
    const { url, port, path, secretToken } = appConfig.webhook!
    
    if (!url) {
      throw new Error('WEBHOOK_URL es requerido para modo webhook')
    }

    try {
      logger.debug('Iniciando webhook...')
      const webhookConfig: any = {
        domain: url,
        port,
        path
      }
      
      if (secretToken) {
        webhookConfig.secretToken = secretToken
      }

      await this.bot.launch({
        webhook: webhookConfig
      })

      logger.bot.start(`Bot iniciado con webhook en ${url}:${port}${path}`)
    } catch (error) {
      logger.bot.error('Error iniciando webhook:', error)
      throw error
    }
  }

  private setupGracefulShutdown(): void {
    // Registrar función de limpieza para la base de datos
    registerCleanupFunction(async () => {
      await closeDatabase()
    })
    
    // Configurar manejo de señales
    setupGracefulShutdown()
  }

  async shutdown(code: number = 0, signal: string | null = null): Promise<void> {
    if (this.isShuttingDown) return
    
    this.isShuttingDown = true
    
    if (signal) {
      logger.bot.stop(`Recibida señal ${signal}, cerrando bot...`)
    } else {
      logger.bot.stop('Cerrando bot...')
    }

    try {
      this.bot.stop(signal ?? 'Manual shutdown')
      logger.bot.success('Bot cerrado correctamente')
      process.exit(code)
    } catch (error) {
      logger.bot.error('Error cerrando bot:', error)
      process.exit(1)
    }
  }
}

async function main(): Promise<void> {
  try {
    const bot = new TelegramBot()
    await bot.initialize()
    await bot.start()

    // Crear servidor HTTP simple para que Render detecte el puerto
    const port = process.env['PORT'] ? parseInt(process.env['PORT']) : 3000
    const server = createServer((req, res) => {
      if (req.url === '/health' || req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ 
          status: 'ok', 
          service: 'telegram-bot',
          timestamp: new Date().toISOString()
        }))
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Not found' }))
      }
    })

    server.listen(port, () => {
      logger.bot.success(`Servidor HTTP iniciado en puerto ${port}`)
    })

    // Manejar señales de terminación
    process.once('SIGINT', () => {
      server.close()
      bot.shutdown(0, 'SIGINT')
    })
    process.once('SIGTERM', () => {
      server.close()
      bot.shutdown(0, 'SIGTERM')
    })

    // Manejar errores no capturados
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error)
      server.close()
      bot.shutdown(1)
    })

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', { promise, reason })
      server.close()
      bot.shutdown(1)
    })

  } catch (error) {
    logger.bot.error('Error fatal:', error)
    process.exit(1)
  }
}

main().catch((error: unknown) => {
  logger.bot.error('Error fatal:', error)
  process.exit(1)
})

export { TelegramBot, type BotInstance }