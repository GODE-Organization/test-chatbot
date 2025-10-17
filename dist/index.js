#!/usr/bin/env node
import { Telegraf } from 'telegraf';
import { logger } from './utils/logger.js';
import { appConfig, validateConfig } from './config/settings.js';
import { connectDatabase, closeDatabase } from './database/connection.js';
import { setupMiddleware } from './bot/middleware/index.js';
import { setupHandlers } from './bot/handlers/index.js';
import { registerCleanupFunction, setupGracefulShutdown } from './utils/graceful-shutdown.js';
import { ConversationCleanupService } from './bot/timeout/index.js';
import 'dotenv/config';
validateConfig();
class TelegramBot {
    bot;
    isShuttingDown = false;
    static instance = null;
    static getInstance() {
        if (!TelegramBot.instance) {
            throw new Error('Bot no inicializado');
        }
        return TelegramBot.instance;
    }
    constructor() {
        this.bot = new Telegraf(appConfig.token);
        this.bot.use(async (ctx, next) => {
            const updateInfo = {
                type: ctx.updateType,
                messageText: ctx.message && 'text' in ctx.message ? ctx.message.text : undefined,
                from: ctx.from?.username,
                chatType: ctx.chat?.type,
                chatTitle: ctx.chat && ('title' in ctx.chat) ? ctx.chat.title : undefined,
                updateId: ctx.update?.update_id,
                messageId: ctx.message?.message_id,
                date: ctx.message?.date,
                command: ctx.message && 'text' in ctx.message && ctx.message.text?.startsWith('/') ? ctx.message.text.split(' ')[0] : undefined,
                entities: ctx.message && 'entities' in ctx.message ? ctx.message.entities : undefined
            };
            logger.debug('📥 Mensaje recibido:', updateInfo);
            await next();
        });
        this.bot.catch((err, ctx) => {
            const error = err instanceof Error ? err : new Error(String(err));
            logger.error('Error en bot:', {
                error: error.message,
                stack: error.stack,
                updateId: ctx.update?.update_id,
                userId: ctx.from?.id,
                chatId: ctx.chat?.id
            });
        });
    }
    async initialize() {
        try {
            logger.bot.start('Iniciando Telegram Chatbot...');
            TelegramBot.instance = this;
            logger.debug('Configurando base de datos...');
            try {
                await connectDatabase();
                logger.bot.success('Base de datos configurada');
            }
            catch (error) {
                logger.bot.error('Error configurando base de datos:', error);
                throw error;
            }
            logger.debug('Configurando middleware...');
            try {
                await setupMiddleware(this.bot);
                logger.bot.success('Middleware configurado');
            }
            catch (error) {
                logger.bot.error('Error configurando middleware:', error);
                throw error;
            }
            logger.debug('Configurando handlers...');
            try {
                await setupHandlers(this.bot);
                logger.bot.success('Handlers configurados');
            }
            catch (error) {
                logger.bot.error('Error configurando handlers:', error);
                throw error;
            }
            logger.debug('Configurando servicio de limpieza...');
            try {
                const cleanupService = ConversationCleanupService.getInstance();
                cleanupService.startCleanupService(5);
                logger.bot.success('Servicio de limpieza configurado');
            }
            catch (error) {
                logger.bot.error('Error configurando servicio de limpieza:', error);
                throw error;
            }
            logger.debug('Configurando cierre elegante...');
            try {
                this.setupGracefulShutdown();
                logger.bot.success('Cierre elegante configurado');
            }
            catch (error) {
                logger.bot.error('Error configurando cierre elegante:', error);
                throw error;
            }
            logger.bot.success('Bot inicializado correctamente');
        }
        catch (error) {
            logger.bot.error('Error inicializando bot:', error);
            throw error;
        }
    }
    async start() {
        try {
            logger.debug('Iniciando bot...');
            if (process.env['BOT_USE_WEBHOOK'] === 'true') {
                await this.startWebhook();
            }
            else {
                await this.startPolling();
            }
            logger.bot.start('Bot iniciado exitosamente');
        }
        catch (error) {
            logger.bot.error('Error iniciando bot:', error);
            throw error;
        }
    }
    async startPolling() {
        try {
            logger.debug('Iniciando polling...');
            await this.bot.launch();
            logger.bot.start('Bot iniciado con polling');
        }
        catch (error) {
            logger.bot.error('Error iniciando polling:', error);
            throw error;
        }
    }
    async startWebhook() {
        const { url, port, path, secretToken } = appConfig.webhook;
        if (!url) {
            throw new Error('WEBHOOK_URL es requerido para modo webhook');
        }
        try {
            logger.debug('Iniciando webhook...');
            const webhookConfig = {
                domain: url,
                port,
                path
            };
            if (secretToken) {
                webhookConfig.secretToken = secretToken;
            }
            await this.bot.launch({
                webhook: webhookConfig
            });
            logger.bot.start(`Bot iniciado con webhook en ${url}:${port}${path}`);
        }
        catch (error) {
            logger.bot.error('Error iniciando webhook:', error);
            throw error;
        }
    }
    setupGracefulShutdown() {
        registerCleanupFunction(async () => {
            await closeDatabase();
        });
        setupGracefulShutdown();
    }
    async shutdown(code = 0, signal = null) {
        if (this.isShuttingDown)
            return;
        this.isShuttingDown = true;
        if (signal) {
            logger.bot.stop(`Recibida señal ${signal}, cerrando bot...`);
        }
        else {
            logger.bot.stop('Cerrando bot...');
        }
        try {
            this.bot.stop(signal ?? 'Manual shutdown');
            logger.bot.success('Bot cerrado correctamente');
            process.exit(code);
        }
        catch (error) {
            logger.bot.error('Error cerrando bot:', error);
            process.exit(1);
        }
    }
}
async function main() {
    try {
        const bot = new TelegramBot();
        await bot.initialize();
        await bot.start();
        process.once('SIGINT', () => {
            bot.shutdown(0, 'SIGINT');
        });
        process.once('SIGTERM', () => {
            bot.shutdown(0, 'SIGTERM');
        });
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            bot.shutdown(1);
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', { promise, reason });
            bot.shutdown(1);
        });
    }
    catch (error) {
        logger.bot.error('Error fatal:', error);
        process.exit(1);
    }
}
main().catch((error) => {
    logger.bot.error('Error fatal:', error);
    process.exit(1);
});
export { TelegramBot };
//# sourceMappingURL=index.js.map