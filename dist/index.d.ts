#!/usr/bin/env node
import { Telegraf } from 'telegraf';
import type { BotContext } from './types/bot.js';
import 'dotenv/config';
interface BotInstance {
    bot: Telegraf<BotContext>;
    isShuttingDown: boolean;
    initialize: () => Promise<void>;
    start: () => Promise<void>;
    shutdown: (code?: number, signal?: string | null) => Promise<void>;
}
declare class TelegramBot implements BotInstance {
    bot: Telegraf<BotContext>;
    isShuttingDown: boolean;
    private static instance;
    static getInstance(): TelegramBot;
    constructor();
    initialize(): Promise<void>;
    start(): Promise<void>;
    private startPolling;
    private startWebhook;
    private setupGracefulShutdown;
    shutdown(code?: number, signal?: string | null): Promise<void>;
}
export { TelegramBot, type BotInstance };
//# sourceMappingURL=index.d.ts.map