export declare class ConversationTimeoutManager {
    private static instance;
    private timeoutMap;
    private surveyHandler;
    private aiClient;
    private constructor();
    static getInstance(): ConversationTimeoutManager;
    startTimeout(userId: number, conversationId: number, timeoutMinutes?: number): void;
    cancelTimeout(userId: number): void;
    renewTimeout(userId: number, conversationId: number, timeoutMinutes?: number): void;
    private handleConversationTimeout;
    private getUserInfo;
    private sendTimeoutSurvey;
    getActiveTimeouts(): {
        userId: number;
        remainingMs: number;
    }[];
    clearAllTimeouts(): void;
    hasActiveTimeout(userId: number): boolean;
    getActiveTimeoutCount(): number;
}
export declare class ConversationCleanupService {
    private static instance;
    private cleanupInterval;
    private timeoutManager;
    private constructor();
    static getInstance(): ConversationCleanupService;
    startCleanupService(intervalMinutes?: number): void;
    stopCleanupService(): void;
    private performCleanup;
}
//# sourceMappingURL=conversation-timeout.d.ts.map