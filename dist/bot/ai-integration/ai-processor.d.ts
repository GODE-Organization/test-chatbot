import type { AIExternalResponse, MessageProcessingResult, UserSessionData } from '../../types/ai-system.js';
export declare class AIProcessor {
    private static instance;
    private geminiAdapter;
    private constructor();
    static getInstance(): AIProcessor;
    sendMessageToAI(userMessage: string, userId: number, chatId: number, sessionData?: Record<string, any>): Promise<MessageProcessingResult>;
    processAIResponse(aiResponse: AIExternalResponse, userId: number, chatId: number): Promise<MessageProcessingResult>;
    private validateAIResponse;
    private executeAIAction;
    private handleConsultCatalog;
    private handleConsultGuarantees;
    private handleRegisterGuarantee;
    private handleConsultSchedule;
    private handleSendGeolocation;
    private handleEndConversation;
    createInitialSession(): UserSessionData;
    updateSessionForGuaranteeFlow(session: UserSessionData): UserSessionData;
    updateSessionForSurvey(session: UserSessionData, conversationId: number): UserSessionData;
    resetSessionToIdle(session: UserSessionData): UserSessionData;
    checkGeminiConnectivity(): Promise<boolean>;
}
//# sourceMappingURL=ai-processor.d.ts.map