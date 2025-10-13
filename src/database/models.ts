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

export class ProductModel {
  private get db() {
    return getDatabase();
  }

  getAllProducts(filters?: { brand?: string; minPrice?: number; maxPrice?: number; limit?: number }): Promise<DatabaseResponse<any[]>> {
    return new Promise((resolve) => {
      try {
        let query = 'SELECT * FROM products WHERE 1=1';
        const params: any[] = [];

        if (filters?.brand) {
          query += ' AND brand LIKE ?';
          params.push(`%${filters.brand}%`);
        }

        if (filters?.minPrice) {
          query += ' AND price >= ?';
          params.push(filters.minPrice);
        }

        if (filters?.maxPrice) {
          query += ' AND price <= ?';
          params.push(filters.maxPrice);
        }

        query += ' ORDER BY created_at DESC';

        if (filters?.limit) {
          query += ' LIMIT ?';
          params.push(filters.limit);
        }

        const stmt = this.db.prepare(query);
        stmt.all(params, (err: any, products: any[]) => {
          if (err) {
            resolve({
              success: false,
              error: err.message
            });
            return;
          }

          resolve({
            success: true,
            data: products || []
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

  getProductByCode(code: string): Promise<DatabaseResponse<any>> {
    return new Promise((resolve) => {
      try {
        const stmt = this.db.prepare('SELECT * FROM products WHERE code = ?');
        stmt.get(code, (err: any, product: any) => {
          if (err) {
            resolve({
              success: false,
              error: err.message
            });
            return;
          }

          resolve({
            success: true,
            data: product || undefined
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

  createProduct(productData: {
    code: string;
    brand: string;
    image_file_id?: string;
    price: number;
    description?: string;
    available_units?: number;
  }): Promise<DatabaseResponse<{ id: number; lastInsertRowid: number }>> {
    return new Promise((resolve) => {
      try {
        const stmt = this.db.prepare(`
          INSERT INTO products (code, brand, image_file_id, price, description, available_units)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
          productData.code,
          productData.brand,
          productData.image_file_id || null,
          productData.price,
          productData.description || null,
          productData.available_units || 0,
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
}

export class GuaranteeModel {
  private get db() {
    return getDatabase();
  }

  getGuaranteesByUserId(userId: number): Promise<DatabaseResponse<any[]>> {
    return new Promise((resolve) => {
      try {
        const stmt = this.db.prepare('SELECT * FROM guarantees WHERE user_id = ? ORDER BY created_at DESC');
        stmt.all(userId, (err: any, guarantees: any[]) => {
          if (err) {
            resolve({
              success: false,
              error: err.message
            });
            return;
          }

          resolve({
            success: true,
            data: guarantees || []
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

  createGuarantee(guaranteeData: {
    user_id: number;
    invoice_number: string;
    invoice_photo_file_id: string;
    product_photo_file_id: string;
    description: string;
  }): Promise<DatabaseResponse<{ id: number; lastInsertRowid: number }>> {
    return new Promise((resolve) => {
      try {
        const stmt = this.db.prepare(`
          INSERT INTO guarantees (user_id, invoice_number, invoice_photo_file_id, product_photo_file_id, description)
          VALUES (?, ?, ?, ?, ?)
        `);

        stmt.run(
          guaranteeData.user_id,
          guaranteeData.invoice_number,
          guaranteeData.invoice_photo_file_id,
          guaranteeData.product_photo_file_id,
          guaranteeData.description,
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
}

export class ScheduleModel {
  private get db() {
    return getDatabase();
  }

  getAllSchedules(): Promise<DatabaseResponse<any[]>> {
    return new Promise((resolve) => {
      try {
        const stmt = this.db.prepare('SELECT * FROM schedules WHERE is_active = 1 ORDER BY day_of_week');
        stmt.all((err: any, schedules: any[]) => {
          if (err) {
            resolve({
              success: false,
              error: err.message
            });
            return;
          }

          resolve({
            success: true,
            data: schedules || []
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

export class StoreConfigModel {
  private get db() {
    return getDatabase();
  }

  getStoreConfig(): Promise<DatabaseResponse<any>> {
    return new Promise((resolve) => {
      try {
        const stmt = this.db.prepare('SELECT * FROM store_config ORDER BY id DESC LIMIT 1');
        stmt.get((err: any, config: any) => {
          if (err) {
            resolve({
              success: false,
              error: err.message
            });
            return;
          }

          resolve({
            success: true,
            data: config || undefined
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

  updateStoreConfig(configData: {
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    phone?: string;
    email?: string;
  }): Promise<DatabaseResponse<any>> {
    return new Promise((resolve) => {
      try {
        const stmt = this.db.prepare(`
          INSERT INTO store_config (name, address, latitude, longitude, phone, email)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            address = excluded.address,
            latitude = excluded.latitude,
            longitude = excluded.longitude,
            phone = excluded.phone,
            email = excluded.email,
            updated_at = CURRENT_TIMESTAMP
        `);

        stmt.run(
          configData.name,
          configData.address,
          configData.latitude || null,
          configData.longitude || null,
          configData.phone || null,
          configData.email || null,
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
              data: { changes: this.changes }
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
}

export class SatisfactionSurveyModel {
  private get db() {
    return getDatabase();
  }

  createSurvey(surveyData: {
    user_id: number;
    rating: number;
    feedback?: string;
    conversation_id?: number;
  }): Promise<DatabaseResponse<{ id: number; lastInsertRowid: number }>> {
    return new Promise((resolve) => {
      try {
        const stmt = this.db.prepare(`
          INSERT INTO satisfaction_surveys (user_id, rating, feedback, conversation_id)
          VALUES (?, ?, ?, ?)
        `);

        stmt.run(
          surveyData.user_id,
          surveyData.rating,
          surveyData.feedback || null,
          surveyData.conversation_id || null,
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
}

export class ConversationModel {
  private get db() {
    return getDatabase();
  }

  createConversation(conversationData: {
    user_id: number;
    ai_session_data?: string;
  }): Promise<DatabaseResponse<{ id: number; lastInsertRowid: number }>> {
    return new Promise((resolve) => {
      try {
        const stmt = this.db.prepare(`
          INSERT INTO conversations (user_id, ai_session_data)
          VALUES (?, ?)
        `);

        stmt.run(
          conversationData.user_id,
          conversationData.ai_session_data || null,
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

  getActiveConversation(userId: number): Promise<DatabaseResponse<any>> {
    return new Promise((resolve) => {
      try {
        const stmt = this.db.prepare('SELECT * FROM conversations WHERE user_id = ? AND status = "active" ORDER BY started_at DESC LIMIT 1');
        stmt.get(userId, (err: any, conversation: any) => {
          if (err) {
            resolve({
              success: false,
              error: err.message
            });
            return;
          }

          resolve({
            success: true,
            data: conversation || undefined
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

  endConversation(conversationId: number): Promise<DatabaseResponse<any>> {
    return new Promise((resolve) => {
      try {
        const stmt = this.db.prepare('UPDATE conversations SET status = "ended", ended_at = CURRENT_TIMESTAMP WHERE id = ?');
        stmt.run(conversationId, function(this: any, err: any) {
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

  updateConversationData(conversationId: number, aiSessionData: string): Promise<DatabaseResponse<any>> {
    return new Promise((resolve) => {
      try {
        const stmt = this.db.prepare('UPDATE conversations SET ai_session_data = ? WHERE id = ?');
        stmt.run(aiSessionData, conversationId, function(this: any, err: any) {
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

// Crear instancias de los modelos
export const userModel = new UserModel();
export const chatModel = new ChatModel();
export const messageModel = new MessageModel();
export const productModel = new ProductModel();
export const guaranteeModel = new GuaranteeModel();
export const scheduleModel = new ScheduleModel();
export const storeConfigModel = new StoreConfigModel();
export const satisfactionSurveyModel = new SatisfactionSurveyModel();
export const conversationModel = new ConversationModel();