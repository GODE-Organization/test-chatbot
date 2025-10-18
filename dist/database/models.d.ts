import type { DatabaseResponse } from '../types/bot.js';
export declare class UserModel {
    private get db();
    upsertUser(userData: {
        telegram_id: number;
        username?: string;
        first_name?: string;
        last_name?: string;
        language_code?: string;
        is_bot?: boolean;
        settings?: string;
    }): Promise<DatabaseResponse<any>>;
    getUserByTelegramId(telegramId: number): Promise<DatabaseResponse<any>>;
    getUserState(telegramId: number): Promise<DatabaseResponse<any>>;
    updateUserState(telegramId: number, state: string, additionalData?: {
        flow_data?: string | null;
        ai_session_data?: string | null;
    }): Promise<DatabaseResponse<any>>;
}
export declare class ChatModel {
    private get db();
    upsertChat(chatData: {
        telegram_id: number;
        type: string;
        title?: string;
        username?: string;
        first_name?: string;
        last_name?: string;
        description?: string;
        settings?: string;
    }): Promise<DatabaseResponse<{
        id: number;
        lastInsertRowid: number;
    }>>;
    getChatByTelegramId(telegramId: number): Promise<DatabaseResponse<any>>;
}
export declare class MessageModel {
    private get db();
    saveMessage(messageData: {
        telegram_id: number;
        user_id?: number;
        chat_id?: number;
        text?: string;
        message_type?: string;
        reply_to_message_id?: number;
    }): Promise<DatabaseResponse<{
        id: number;
        lastInsertRowid: number;
    }>>;
    getMessageById(id: number): Promise<DatabaseResponse<any>>;
    getRecentMessages(userId: number, limit?: number): Promise<DatabaseResponse<any[]>>;
}
export declare class ProductModel {
    private get db();
    getAllProducts(filters?: {
        brand?: string;
        minPrice?: number;
        maxPrice?: number;
        limit?: number;
    }): Promise<DatabaseResponse<any[]>>;
    getProductByCode(code: string): Promise<DatabaseResponse<any>>;
    getProductById(id: number): Promise<DatabaseResponse<any>>;
    createProduct(productData: {
        code: string;
        brand: string;
        image_file_id?: string;
        price: number;
        description?: string;
        available_units?: number;
    }): Promise<DatabaseResponse<{
        id: number;
        lastInsertRowid: number;
    }>>;
    getAllProductsWithBsPrice(filters?: {
        brand?: string;
        minPrice?: number;
        maxPrice?: number;
        limit?: number;
    }): Promise<DatabaseResponse<any[]>>;
    getProductByCodeWithBsPrice(code: string): Promise<DatabaseResponse<any>>;
    getProductByIdWithBsPrice(id: number): Promise<DatabaseResponse<any>>;
}
export declare class GuaranteeModel {
    private get db();
    getGuaranteesByUserId(userId: number): Promise<DatabaseResponse<any[]>>;
    createGuarantee(guaranteeData: {
        user_id: number;
        invoice_number: string;
        invoice_photo_file_id: string;
        product_photo_file_id: string;
        description: string;
    }): Promise<DatabaseResponse<{
        id: number;
        lastInsertRowid: number;
    }>>;
}
export declare class StoreConfigModel {
    private get db();
    getStoreConfig(): Promise<DatabaseResponse<any>>;
    updateStoreConfig(configData: {
        name: string;
        address: string;
        latitude?: number;
        longitude?: number;
        phone?: string;
        email?: string;
    }): Promise<DatabaseResponse<any>>;
}
export declare class SatisfactionSurveyModel {
    private get db();
    createSurvey(surveyData: {
        user_id: number;
        rating: number;
        feedback?: string;
        conversation_id?: number;
    }): Promise<DatabaseResponse<{
        id: number;
        lastInsertRowid: number;
    }>>;
}
export declare class ConversationModel {
    private get db();
    createConversation(conversationData: {
        user_id: number;
        ai_session_data?: string;
    }): Promise<DatabaseResponse<{
        id: number;
        lastInsertRowid: number;
    }>>;
    getActiveConversation(userId: number): Promise<DatabaseResponse<any>>;
    endConversation(conversationId: number): Promise<DatabaseResponse<any>>;
    updateConversationData(conversationId: number, aiSessionData: string): Promise<DatabaseResponse<any>>;
}
export declare class ScheduleModel {
    private db;
    constructor();
    getAllSchedules(): Promise<{
        success: boolean;
        data?: any[];
        error?: string;
    }>;
    getSchedulesByDay(dayOfWeek: number): Promise<{
        success: boolean;
        data?: any[];
        error?: string;
    }>;
    createSchedule(schedule: {
        day_of_week: number;
        open_time: string;
        close_time: string;
        is_active?: boolean;
    }): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
}
export declare const userModel: UserModel;
export declare const chatModel: ChatModel;
export declare const messageModel: MessageModel;
export declare const productModel: ProductModel;
export declare const guaranteeModel: GuaranteeModel;
export declare const scheduleModel: ScheduleModel;
export declare const storeConfigModel: StoreConfigModel;
export declare const satisfactionSurveyModel: SatisfactionSurveyModel;
export declare const conversationModel: ConversationModel;
//# sourceMappingURL=models.d.ts.map