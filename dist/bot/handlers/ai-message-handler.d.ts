import type { BotContext } from '../../types/bot.js';
export declare class AIMessageHandler {
    private static instance;
    private aiProcessor;
    private aiClient;
    private guaranteeHandler;
    private surveyHandler;
    private constructor();
    static getInstance(): AIMessageHandler;
    handleTextMessage(ctx: BotContext): Promise<void>;
    handlePhotoMessage(ctx: BotContext): Promise<void>;
    handleCallbackQuery(ctx: BotContext): Promise<void>;
    private processWithAI;
    private sendResponseToUser;
    private processAIActions;
    private handleEndConversation;
    initializeUserSession(ctx: BotContext): void;
    private isCatalogQuery;
    handleCancelCommand(ctx: BotContext): Promise<void>;
    private sanitizeMarkdownText;
}
//# sourceMappingURL=ai-message-handler.d.ts.map