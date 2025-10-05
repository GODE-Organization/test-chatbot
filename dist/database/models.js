import { getDatabase } from './connection';
export class UserModel {
    get db() {
        return getDatabase();
    }
    upsertUser(userData) {
        try {
            const stmt = this.db.prepare(`
        INSERT INTO users (telegram_id, username, first_name, last_name, language_code, is_bot, settings, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(telegram_id) DO UPDATE SET
          username = excluded.username,
          first_name = excluded.first_name,
          last_name = excluded.last_name,
          language_code = excluded.language_code,
          is_bot = excluded.is_bot,
          settings = excluded.settings,
          updated_at = CURRENT_TIMESTAMP
      `);
            stmt.run(userData.telegram_id, userData.username || null, userData.first_name || null, userData.last_name || null, userData.language_code || 'es', userData.is_bot || false, userData.settings || '{}');
            const getUserStmt = this.db.prepare('SELECT * FROM users WHERE telegram_id = ?');
            const user = getUserStmt.get(userData.telegram_id);
            return {
                success: true,
                data: user || undefined
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    getUserByTelegramId(telegramId) {
        try {
            const stmt = this.db.prepare('SELECT * FROM users WHERE telegram_id = ?');
            const user = stmt.get(telegramId);
            return {
                success: true,
                data: user || undefined
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    updateUserState(telegramId, state) {
        try {
            const stmt = this.db.prepare('UPDATE users SET settings = json_set(settings, "$.state", ?), updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?');
            const result = stmt.run(state, telegramId);
            return {
                success: true,
                data: { changes: result.changes }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
}
export class ChatModel {
    get db() {
        return getDatabase();
    }
    upsertChat(chatData) {
        try {
            const stmt = this.db.prepare(`
        INSERT INTO chats (telegram_id, type, title, username, first_name, last_name, description, settings, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(telegram_id) DO UPDATE SET
          type = excluded.type,
          title = excluded.title,
          username = excluded.username,
          first_name = excluded.first_name,
          last_name = excluded.last_name,
          description = excluded.description,
          settings = excluded.settings,
          updated_at = CURRENT_TIMESTAMP
      `);
            const result = stmt.run(chatData.telegram_id, chatData.type, chatData.title || null, chatData.username || null, chatData.first_name || null, chatData.last_name || null, chatData.description || null, chatData.settings || '{}');
            return {
                success: true,
                data: {
                    id: Number(result.lastInsertRowid),
                    lastInsertRowid: Number(result.lastInsertRowid)
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    getChatByTelegramId(telegramId) {
        try {
            const stmt = this.db.prepare('SELECT * FROM chats WHERE telegram_id = ?');
            const chat = stmt.get(telegramId);
            return {
                success: true,
                data: chat || undefined
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
}
export class MessageModel {
    get db() {
        return getDatabase();
    }
    saveMessage(messageData) {
        try {
            const stmt = this.db.prepare(`
        INSERT INTO messages (telegram_id, user_id, chat_id, text, message_type, reply_to_message_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
            const result = stmt.run(messageData.telegram_id, messageData.user_id || null, messageData.chat_id || null, messageData.text || null, messageData.message_type || null, messageData.reply_to_message_id || null);
            return {
                success: true,
                data: {
                    id: Number(result.lastInsertRowid),
                    lastInsertRowid: Number(result.lastInsertRowid)
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    getMessageById(id) {
        try {
            const stmt = this.db.prepare('SELECT * FROM messages WHERE id = ?');
            const message = stmt.get(id);
            return {
                success: true,
                data: message || undefined
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
}
export const userModel = new UserModel();
export const chatModel = new ChatModel();
export const messageModel = new MessageModel();
//# sourceMappingURL=models.js.map