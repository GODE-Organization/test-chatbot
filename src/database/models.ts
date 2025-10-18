import { getDatabase } from './connection.js';
import type { DatabaseResponse } from '../types/bot.js';
import { CurrencyConverter } from '../utils/currency-converter.js';
import type { Database as Sqlite3Database } from 'sqlite3';

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
            settings = CASE 
              WHEN excluded.settings IS NOT NULL AND excluded.settings != '{}' 
              THEN excluded.settings 
              ELSE users.settings 
            END,
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

  getUserState(telegramId: number): Promise<DatabaseResponse<any>> {
    return new Promise((resolve) => {
      try {
        const stmt = this.db.prepare('SELECT settings FROM users WHERE telegram_id = ?');
        stmt.get(telegramId, (err: any, user: any) => {
          if (err) {
            resolve({
              success: false,
              error: err.message
            });
            return;
          }

          if (!user) {
            resolve({
              success: false,
              error: 'Usuario no encontrado'
            });
            return;
          }

          const settings = user.settings ? JSON.parse(user.settings) : {};
          resolve({
            success: true,
            data: {
              state: settings.state || 'idle',
              flow_data: settings.flow_data,
              ai_session_data: settings.ai_session_data
            }
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

  updateUserState(telegramId: number, state: string, additionalData?: { flow_data?: string | null; ai_session_data?: string | null }): Promise<DatabaseResponse<any>> {
    return new Promise((resolve) => {
      try {
        // Construir el objeto settings completo
        const settings = {
          state: state,
          ...(additionalData?.flow_data !== undefined && { flow_data: additionalData.flow_data }),
          ...(additionalData?.ai_session_data !== undefined && { ai_session_data: additionalData.ai_session_data })
        };
        
        const query = 'UPDATE users SET settings = ?, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?';
        const params = [JSON.stringify(settings), telegramId];
        
        const stmt = this.db.prepare(query);
        stmt.run(...params, function(this: any, err: any) {
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

  getRecentMessages(userId: number, limit: number = 10): Promise<DatabaseResponse<any[]>> {
    return new Promise((resolve) => {
      try {
        const stmt = this.db.prepare(`
          SELECT text, message_type, created_at 
          FROM messages 
          WHERE user_id = ? AND text IS NOT NULL 
          ORDER BY created_at DESC 
          LIMIT ?
        `);
        
        stmt.all(userId, limit, (err: any, messages: any[]) => {
          if (err) {
            resolve({
              success: false,
              error: err.message
            });
            return;
          }

          resolve({
            success: true,
            data: messages || []
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

  getProductById(id: number): Promise<DatabaseResponse<any>> {
    return new Promise((resolve) => {
      try {
        const stmt = this.db.prepare('SELECT * FROM products WHERE id = ?');
        stmt.get(id, (err: any, product: any) => {
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

  /**
   * Obtiene todos los productos con conversión de precios a bolívares
   */
  async getAllProductsWithBsPrice(filters?: { brand?: string; minPrice?: number; maxPrice?: number; limit?: number }): Promise<DatabaseResponse<any[]>> {
    try {
      // Obtener productos de la base de datos
      const productsResult = await this.getAllProducts(filters);
      
      if (!productsResult.success || !productsResult.data) {
        return productsResult;
      }

      // Obtener tasa de conversión
      const conversionResult = await CurrencyConverter.getUsdToBsRate();
      
      if (!conversionResult.success || !conversionResult.data) {
        // Si no se puede obtener la tasa, devolver productos sin conversión
        return {
          success: true,
          data: productsResult.data.map(product => ({
            ...product,
            price_bs: null,
            conversion_rate: null,
            conversion_error: conversionResult.error
          }))
        };
      }

      // Agregar precios en bolívares a cada producto
      const productsWithBsPrice = productsResult.data.map(product => ({
        ...product,
        price_bs: Math.round(product.price * conversionResult.data!.usdToBsRate * 100) / 100,
        conversion_rate: conversionResult.data!.usdToBsRate,
        conversion_last_updated: conversionResult.data!.lastUpdated
      }));

      return {
        success: true,
        data: productsWithBsPrice
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtiene un producto por código con conversión de precio a bolívares
   */
  async getProductByCodeWithBsPrice(code: string): Promise<DatabaseResponse<any>> {
    try {
      // Obtener producto de la base de datos
      const productResult = await this.getProductByCode(code);
      
      if (!productResult.success || !productResult.data) {
        return productResult;
      }

      // Obtener tasa de conversión
      const conversionResult = await CurrencyConverter.getUsdToBsRate();
      
      if (!conversionResult.success || !conversionResult.data) {
        // Si no se puede obtener la tasa, devolver producto sin conversión
        return {
          success: true,
          data: {
            ...productResult.data,
            price_bs: null,
            conversion_rate: null,
            conversion_error: conversionResult.error
          }
        };
      }

      // Agregar precio en bolívares
      const productWithBsPrice = {
        ...productResult.data,
        price_bs: Math.round(productResult.data.price * conversionResult.data!.usdToBsRate * 100) / 100,
        conversion_rate: conversionResult.data!.usdToBsRate,
        conversion_last_updated: conversionResult.data!.lastUpdated
      };

      return {
        success: true,
        data: productWithBsPrice
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtiene un producto por ID con conversión de precio a bolívares
   */
  async getProductByIdWithBsPrice(id: number): Promise<DatabaseResponse<any>> {
    try {
      // Obtener producto de la base de datos
      const productResult = await this.getProductById(id);
      
      if (!productResult.success || !productResult.data) {
        return productResult;
      }

      // Obtener tasa de conversión
      const conversionResult = await CurrencyConverter.getUsdToBsRate();
      
      if (!conversionResult.success || !conversionResult.data) {
        // Si no se puede obtener la tasa, devolver producto sin conversión
        return {
          success: true,
          data: {
            ...productResult.data,
            price_bs: null,
            conversion_rate: null,
            conversion_error: conversionResult.error
          }
        };
      }

      // Agregar precio en bolívares
      const productWithBsPrice = {
        ...productResult.data,
        price_bs: Math.round(productResult.data.price * conversionResult.data!.usdToBsRate * 100) / 100,
        conversion_rate: conversionResult.data!.usdToBsRate,
        conversion_last_updated: conversionResult.data!.lastUpdated
      };

      return {
        success: true,
        data: productWithBsPrice
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
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

export class ScheduleModel {
  private get db() {
    return getDatabase();
  }

  /**
   * Obtiene todos los horarios de atención
   */
  public async getAllSchedules(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    return new Promise((resolve) => {
      try {
        const stmt = this.db.prepare(`
          SELECT * FROM schedules 
          WHERE is_active = 1
          ORDER BY day_of_week, open_time
        `)
        
        stmt.all((err: any, schedules: any[]) => {
          if (err) {
            resolve({
              success: false,
              error: err.message
            })
            return
          }
          
          // Mapear los datos para incluir nombres de días
          const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
          const mappedSchedules = schedules.map((schedule: any) => ({
            ...schedule,
            day_name: dayNames[schedule.day_of_week] || 'Día desconocido'
          }))
          
          resolve({
            success: true,
            data: mappedSchedules
          })
        })
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Error obteniendo horarios'
        })
      }
    })
  }

  /**
   * Obtiene horarios por día de la semana
   */
  public async getSchedulesByDay(dayOfWeek: number): Promise<{ success: boolean; data?: any[]; error?: string }> {
    return new Promise((resolve) => {
      try {
        const stmt = this.db.prepare(`
          SELECT * FROM schedules 
          WHERE day_of_week = ? AND is_active = 1
          ORDER BY open_time
        `)
        
        stmt.all(dayOfWeek, (err: any, schedules: any[]) => {
          if (err) {
            resolve({
              success: false,
              error: err.message
            })
            return
          }
          
          // Mapear los datos para incluir nombres de días
          const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
          const mappedSchedules = schedules.map((schedule: any) => ({
            ...schedule,
            day_name: dayNames[schedule.day_of_week] || 'Día desconocido'
          }))
          
          resolve({
            success: true,
            data: mappedSchedules
          })
        })
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Error obteniendo horarios por día'
        })
      }
    })
  }

  /**
   * Crea un nuevo horario
   */
  public async createSchedule(schedule: {
    day_of_week: number
    open_time: string
    close_time: string
    is_active?: boolean
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    return new Promise((resolve) => {
      try {
        const stmt = this.db.prepare(`
          INSERT INTO schedules (day_of_week, open_time, close_time, is_active)
          VALUES (?, ?, ?, ?)
        `)
        
        stmt.run(
          schedule.day_of_week,
          schedule.open_time,
          schedule.close_time,
          schedule.is_active !== false ? 1 : 0,
          function(this: any, err: any) {
            if (err) {
              resolve({
                success: false,
                error: err.message
              })
              return
            }
            
            resolve({
              success: true,
              data: { id: this.lastID }
            })
          }
        )
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Error creando horario'
        })
      }
    })
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