export type AICommand = 'CONSULT_CATALOG' | 'CONSULT_GUARANTEES' | 'REGISTER_GUARANTEE' | 'CONSULT_SCHEDULE' | 'SEND_GEOLOCATION' | 'END_CONVERSATION';
export interface ConsultCatalogParams {
    filters?: {
        brand?: string;
        minPrice?: number;
        maxPrice?: number;
    };
    limit?: number;
}
export interface ConsultGuaranteesParams {
    user_id: number;
}
export interface RegisterGuaranteeParams {
}
export interface ConsultScheduleParams {
}
export interface SendGeolocationParams {
}
export interface EndConversationParams {
    reason?: string;
}
export type AICommandParams = ConsultCatalogParams | ConsultGuaranteesParams | RegisterGuaranteeParams | ConsultScheduleParams | SendGeolocationParams | EndConversationParams;
export interface AIAction {
    command: AICommand;
    parameters: AICommandParams;
}
export interface AIResponse {
    text: string;
    parse_mode?: 'Markdown' | 'HTML' | null;
    reply_markup?: {
        inline_keyboard?: any[][];
        keyboard?: any[][];
    };
}
export interface AIExternalResponse {
    response: AIResponse;
    actions: AIAction[];
    session_data?: Record<string, any>;
}
export type BotFlowState = 'idle' | 'guarantee_flow' | 'survey_waiting' | 'conversation_ended';
export type GuaranteeFlowStep = 'waiting_invoice_number' | 'waiting_invoice_photo' | 'waiting_product_photo' | 'waiting_description' | 'completed';
export interface UserSessionData {
    state: BotFlowState;
    flow_data?: {
        guarantee_flow?: {
            step: GuaranteeFlowStep;
            data: {
                invoice_number?: string;
                invoice_photo_file_id?: string;
                product_photo_file_id?: string;
                description?: string;
            };
        };
        survey_data?: {
            conversation_id: number;
            waiting_for_rating: boolean;
        };
    };
    ai_session_data?: Record<string, any>;
    last_activity: Date;
}
export interface AICommandResponse {
    success: boolean;
    data?: any;
    error?: string;
    message?: string;
}
export interface Product {
    id: number;
    code: string;
    brand: string;
    image_file_id?: string;
    price: number;
    description?: string;
    available_units: number;
    created_at: string;
    updated_at: string;
}
export interface Guarantee {
    id: number;
    user_id: number;
    invoice_number: string;
    invoice_photo_file_id: string;
    product_photo_file_id: string;
    description: string;
    status: 'pending' | 'approved' | 'rejected' | 'in_progress';
    created_at: string;
}
export interface Schedule {
    id: number;
    day_of_week: number;
    open_time: string;
    close_time: string;
    is_active: boolean;
    created_at: string;
}
export interface StoreConfig {
    id: number;
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    phone?: string;
    email?: string;
    created_at: string;
    updated_at: string;
}
export interface SatisfactionSurvey {
    id: number;
    user_id: number;
    rating: number;
    feedback?: string;
    conversation_id?: number;
    created_at: string;
}
export interface Conversation {
    id: number;
    user_id: number;
    started_at: string;
    ended_at?: string;
    status: 'active' | 'ended';
    ai_session_data?: string;
}
export interface AISystemConfig {
    external_ai_url: string;
    api_key?: string;
    timeout_ms: number;
    max_retries: number;
    conversation_timeout_minutes: number;
}
export interface MessageProcessingResult {
    success: boolean;
    response?: AIResponse;
    actions?: AIAction[];
    session_data?: Record<string, any>;
    action_results?: AICommandResponse[];
    error?: string;
}
//# sourceMappingURL=ai-system.d.ts.map