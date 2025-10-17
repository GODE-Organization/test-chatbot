import type { BotContext } from '../../types/bot.js';
export declare class GuaranteeFlowHandler {
    private static instance;
    private aiProcessor;
    private constructor();
    static getInstance(): GuaranteeFlowHandler;
    startGuaranteeFlow(ctx: BotContext): Promise<void>;
    processGuaranteeStep(ctx: BotContext, messageType: 'text' | 'photo'): Promise<boolean>;
    private handleInvoiceNumber;
    private handleInvoicePhoto;
    private handleProductPhoto;
    private handleDescription;
    private completeGuaranteeRegistration;
    cancelGuaranteeFlow(ctx: BotContext): Promise<void>;
    isInGuaranteeFlow(session: any): boolean;
}
//# sourceMappingURL=guarantee-flow.d.ts.map