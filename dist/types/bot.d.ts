import type { Context } from 'telegraf';
export interface BotContext extends Context {
    user?: {
        id: number;
        username?: string;
        first_name?: string;
        last_name?: string;
        language_code?: string;
    };
    session?: {
        state?: string;
        data?: Record<string, any>;
    };
}
export declare enum UserState {
    IDLE = "idle",
    WAITING_INPUT = "waiting_input",
    IN_CONVERSATION = "in_conversation",
    SETTINGS = "settings"
}
export declare enum MessageType {
    TEXT = "text",
    COMMAND = "command",
    CALLBACK_QUERY = "callback_query",
    PHOTO = "photo",
    DOCUMENT = "document",
    STICKER = "sticker",
    VOICE = "voice",
    VIDEO = "video",
    LOCATION = "location",
    CONTACT = "contact"
}
export interface BotConfig {
    token: string;
    webhook?: {
        url?: string;
        port?: number;
        path?: string;
        secretToken?: string;
    };
    database: {
        path: string;
    };
    logging: {
        level: 'error' | 'warn' | 'info' | 'debug';
        file?: string;
    };
}
export interface User {
    id: number;
    telegram_id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    language_code?: string;
    is_bot: boolean;
    created_at: string;
    updated_at: string;
    last_activity: string;
    state?: UserState;
    settings?: Record<string, any>;
}
export interface Chat {
    id: number;
    telegram_id: number;
    type: 'private' | 'group' | 'supergroup' | 'channel';
    title?: string;
    username?: string;
    created_at: string;
    updated_at: string;
    last_activity: string;
    settings?: Record<string, any>;
}
export interface Message {
    id: number;
    telegram_id: number;
    user_id: number;
    chat_id: number;
    message_type: MessageType;
    content?: string;
    file_id?: string;
    reply_to_message_id?: number;
    created_at: string;
}
export interface KeyboardConfig {
    text: string;
    callback_data?: string;
    url?: string;
    web_app?: any;
    switch_inline_query?: string;
    switch_inline_query_current_chat?: string;
    switch_inline_query_chosen_chat?: any;
    callback_game?: any;
    pay?: boolean;
}
export interface DatabaseResponse<T = any> {
    success: boolean;
    data?: T | undefined;
    error?: string;
    lastInsertRowid?: number;
    changes?: number;
}
export interface MiddlewareConfig {
    name: string;
    enabled: boolean;
    order: number;
    options?: Record<string, any>;
}
//# sourceMappingURL=bot.d.ts.map