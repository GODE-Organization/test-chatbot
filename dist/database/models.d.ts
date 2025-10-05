import type { DatabaseResponse } from '../types/bot';
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
    }): DatabaseResponse<any>;
    getUserByTelegramId(telegramId: number): DatabaseResponse<any>;
    updateUserState(telegramId: number, state: string): DatabaseResponse<any>;
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
    }): DatabaseResponse<{
        id: number;
        lastInsertRowid: number;
    }>;
    getChatByTelegramId(telegramId: number): DatabaseResponse<any>;
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
    }): DatabaseResponse<{
        id: number;
        lastInsertRowid: number;
    }>;
    getMessageById(id: number): DatabaseResponse<any>;
}
export declare const userModel: UserModel;
export declare const chatModel: ChatModel;
export declare const messageModel: MessageModel;
//# sourceMappingURL=models.d.ts.map