import type { BotContext } from '../../types/bot.js';
export declare class SatisfactionSurveyHandler {
    private static instance;
    private aiProcessor;
    private constructor();
    static getInstance(): SatisfactionSurveyHandler;
    sendSatisfactionSurvey(ctx: BotContext, conversationId: number): Promise<void>;
    processSurveyResponse(ctx: BotContext, rating: number): Promise<void>;
    handleSurveyCallback(ctx: BotContext, callbackData: string): Promise<boolean>;
    isWaitingForSurvey(session: any): boolean;
    getSurveyStats(): Promise<{
        total: number;
        average: number;
        distribution: Record<number, number>;
    }>;
}
//# sourceMappingURL=satisfaction-survey.d.ts.map