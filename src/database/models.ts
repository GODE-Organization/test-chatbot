import { getDatabase } from './connection.js';
import type { DatabaseResponse } from '../types/bot.js';

export class UserModel {
  private get db() {
    return getDatabase();
  }

  upsertUser(userData: {
    telegram_id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    language_code?: string;
    is_bot?: boolean;
    settings?: string;
  }): Promise<DatabaseResponse<any>> {
    return new Promise((resolve) => {
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

        stmt.run(
          userData.telegram_id,
          userData.username || null,
          userData.first_name || null,
          userData.last_name || null,
          userData.language_code || 'es',
          userData.is_bot || false,
          userData.settings || '{}'
        );

        // Obtener el usuario actualizado
        const getUserStmt = this.db.prepare('SELECT * FROM users WHERE telegram_id = ?');
        getUserStmt.get(userData.telegram_id, (err: any, user: any) => {
          if (err) {
            resolve({
              success: false,
              error: err.message
            });
            return;
          }

          resolve({
            success: true,
            data: user || undefined
          });
        });
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    });
  }

  getUserByTelegramId(telegramId: number): Promise<DatabaseResponse<any>> {
    return new Promise((resolve) => {
      try {
        const stmt = this.db.prepare('SELECT * FROM users WHERE telegram_id = ?');
        stmt.get(telegramId, (err: any, user: any) => {
          if (err) {
            resolve({
              success: false,
              error: err.message
            });
            return;
          }

          resolve({
            success: true,
            data: user || undefined
          });
        });
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    });
  }

  updateUserState(telegramId: number, state: string): Promise<DatabaseResponse<any>> {
    return new Promise((resolve) => {
      try {
        const stmt = this.db.prepare('UPDATE users SET settings = json_set(settings, "$.state", ?), updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?');
        stmt.run(state, telegramId, function(this: any, err: any) {
          if (err) {
            resolve({
              success: false,
              error: err.message
            });
            return;
          }

          resolve({
            success: true,
            data: { changes: this.changes }
          });
        });
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    });
  }
}

export class ChatModel {
  private get db() {
    return getDatabase();
  }

  upsertChat(chatData: {
    telegram_id: number;
    type: string;
    title?: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    description?: string;
    settings?: string;
  }): Promise<DatabaseResponse<{ id: number; lastInsertRowid: number }>> {
    return new Promise((resolve) => {
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

        stmt.run(
          chatData.telegram_id,
          chatData.type,
          chatData.title || null,
          chatData.username || null,
          chatData.first_name || null,
          chatData.last_name || null,
          chatData.description || null,
          chatData.settings || '{}',
          function(this: any, err: any) {
            if (err) {
              resolve({
                success: false,
                error: err.message
              });
              return;
            }

            resolve({
              success: true,
              data: {
                id: this.lastID,
                lastInsertRowid: this.lastID
              }
            });
          }
        );
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    });
  }

  getChatByTelegramId(telegramId: number): Promise<DatabaseResponse<any>> {
    return new Promise((resolve) => {
      try {
        const stmt = this.db.prepare('SELECT * FROM chats WHERE telegram_id = ?');
        stmt.get(telegramId, (err: any, chat: any) => {
          if (err) {
            resolve({
              success: false,
              error: err.message
            });
            return;
          }

          resolve({
            success: true,
            data: chat || undefined
          });
        });
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    });
  }
}

export class MessageModel {
  private get db() {
    return getDatabase();
  }

  saveMessage(messageData: {
    telegram_id: number;
    user_id?: number;
    chat_id?: number;
    text?: string;
    message_type?: string;
    reply_to_message_id?: number;
  }): Promise<DatabaseResponse<{ id: number; lastInsertRowid: number }>> {
    return new Promise((resolve) => {
      try {
        const stmt = this.db.prepare(`
          INSERT INTO messages (telegram_id, user_id, chat_id, text, message_type, reply_to_message_id)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
          messageData.telegram_id,
          messageData.user_id || null,
          messageData.chat_id || null,
          messageData.text || null,
          messageData.message_type || null,
          messageData.reply_to_message_id || null,
          function(this: any, err: any) {
            if (err) {
              resolve({
                success: false,
                error: err.message
              });
              return;
            }

            resolve({
              success: true,
              data: {
                id: this.lastID,
                lastInsertRowid: this.lastID
              }
            });
          }
        );
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    });
  }

  getMessageById(id: number): Promise<DatabaseResponse<any>> {
    return new Promise((resolve) => {
      try {
        const stmt = this.db.prepare('SELECT * FROM messages WHERE id = ?');
        stmt.get(id, (err: any, message: any) => {
          if (err) {
            resolve({
              success: false,
              error: err.message
            });
            return;
          }

          resolve({
            success: true,
            data: message || undefined
          });
        });
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    });
  }
}

// Crear instancias de los modelos
export const userModel = new UserModel();
export const chatModel = new ChatModel();
export const messageModel = new MessageModel();