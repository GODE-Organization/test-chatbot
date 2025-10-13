import type { AISystemConfig, MessageProcessingResult } from '../../types/ai-system.js';
export declare class AIClient {
    private static instance;
    private config;
    private constructor();
    static getInstance(config?: AISystemConfig): AIClient;
    sendMessageToAI(userMessage: string, userId: number, sessionData?: Record<string, any>): Promise<MessageProcessingResult>;
    private makeRequest;
    private validateAIResponse;
    checkConnectivity(): Promise<boolean>;
    getConfig(): AISystemConfig;
    updateConfig(newConfig: Partial<AISystemConfig>): void;
}
export declare class AIClientFactory {
    private static defaultConfig;
    static createClient(config?: Partial<AISystemConfig>): AIClient;
    static getDefaultConfig(): AISystemConfig;
}
//# sourceMappingURL=ai-client.d.ts.map