import { getDatabase } from './connection.js';
import { CurrencyConverter } from '../utils/currency-converter.js';
export class UserModel {
    get db() {
        return getDatabase();
    }
    upsertUser(userData) {
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
                stmt.run(userData.telegram_id, userData.username || null, userData.first_name || null, userData.last_name || null, userData.language_code || 'es', userData.is_bot || false, userData.settings || '{}');
                const getUserStmt = this.db.prepare('SELECT * FROM users WHERE telegram_id = ?');
                getUserStmt.get(userData.telegram_id, (err, user) => {
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
            }
            catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        });
    }
    getUserByTelegramId(telegramId) {
        return new Promise((resolve) => {
            try {
                const stmt = this.db.prepare('SELECT * FROM users WHERE telegram_id = ?');
                stmt.get(telegramId, (err, user) => {
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
            }
            catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        });
    }
    getUserState(telegramId) {
        return new Promise((resolve) => {
            try {
                const stmt = this.db.prepare('SELECT settings FROM users WHERE telegram_id = ?');
                stmt.get(telegramId, (err, user) => {
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
            }
            catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        });
    }
    updateUserState(telegramId, state, additionalData) {
        return new Promise((resolve) => {
            try {
                const settings = {
                    state: state,
                    ...(additionalData?.flow_data !== undefined && { flow_data: additionalData.flow_data }),
                    ...(additionalData?.ai_session_data !== undefined && { ai_session_data: additionalData.ai_session_data })
                };
                const query = 'UPDATE users SET settings = ?, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?';
                const params = [JSON.stringify(settings), telegramId];
                const stmt = this.db.prepare(query);
                stmt.run(...params, function (err) {
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
            }
            catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        });
    }
}
export class ChatModel {
    get db() {
        return getDatabase();
    }
    upsertChat(chatData) {
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
                stmt.run(chatData.telegram_id, chatData.type, chatData.title || null, chatData.username || null, chatData.first_name || null, chatData.last_name || null, chatData.description || null, chatData.settings || '{}', function (err) {
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
                });
            }
            catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        });
    }
    getChatByTelegramId(telegramId) {
        return new Promise((resolve) => {
            try {
                const stmt = this.db.prepare('SELECT * FROM chats WHERE telegram_id = ?');
                stmt.get(telegramId, (err, chat) => {
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
            }
            catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        });
    }
}
export class MessageModel {
    get db() {
        return getDatabase();
    }
    saveMessage(messageData) {
        return new Promise((resolve) => {
            try {
                const stmt = this.db.prepare(`
          INSERT INTO messages (telegram_id, user_id, chat_id, text, message_type, reply_to_message_id)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
                stmt.run(messageData.telegram_id, messageData.user_id || null, messageData.chat_id || null, messageData.text || null, messageData.message_type || null, messageData.reply_to_message_id || null, function (err) {
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
                });
            }
            catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        });
    }
    getMessageById(id) {
        return new Promise((resolve) => {
            try {
                const stmt = this.db.prepare('SELECT * FROM messages WHERE id = ?');
                stmt.get(id, (err, message) => {
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
            }
            catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        });
    }
    getRecentMessages(userId, limit = 10) {
        return new Promise((resolve) => {
            try {
                const stmt = this.db.prepare(`
          SELECT text, message_type, created_at 
          FROM messages 
          WHERE user_id = ? AND text IS NOT NULL 
          ORDER BY created_at DESC 
          LIMIT ?
        `);
                stmt.all(userId, limit, (err, messages) => {
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
            }
            catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        });
    }
}
export class ProductModel {
    get db() {
        return getDatabase();
    }
    getAllProducts(filters) {
        return new Promise((resolve) => {
            try {
                let query = 'SELECT * FROM products WHERE 1=1';
                const params = [];
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
                stmt.all(params, (err, products) => {
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
            }
            catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        });
    }
    getProductByCode(code) {
        return new Promise((resolve) => {
            try {
                const stmt = this.db.prepare('SELECT * FROM products WHERE code = ?');
                stmt.get(code, (err, product) => {
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
            }
            catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        });
    }
    getProductById(id) {
        return new Promise((resolve) => {
            try {
                const stmt = this.db.prepare('SELECT * FROM products WHERE id = ?');
                stmt.get(id, (err, product) => {
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
            }
            catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        });
    }
    createProduct(productData) {
        return new Promise((resolve) => {
            try {
                const stmt = this.db.prepare(`
          INSERT INTO products (code, brand, image_file_id, price, description, available_units)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
                stmt.run(productData.code, productData.brand, productData.image_file_id || null, productData.price, productData.description || null, productData.available_units || 0, function (err) {
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
                });
            }
            catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        });
    }
    async getAllProductsWithBsPrice(filters) {
        try {
            const productsResult = await this.getAllProducts(filters);
            if (!productsResult.success || !productsResult.data) {
                return productsResult;
            }
            const conversionResult = await CurrencyConverter.getUsdToBsRate();
            if (!conversionResult.success || !conversionResult.data) {
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
            const productsWithBsPrice = productsResult.data.map(product => ({
                ...product,
                price_bs: Math.round(product.price * conversionResult.data.usdToBsRate * 100) / 100,
                conversion_rate: conversionResult.data.usdToBsRate,
                conversion_last_updated: conversionResult.data.lastUpdated
            }));
            return {
                success: true,
                data: productsWithBsPrice
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    async getProductByCodeWithBsPrice(code) {
        try {
            const productResult = await this.getProductByCode(code);
            if (!productResult.success || !productResult.data) {
                return productResult;
            }
            const conversionResult = await CurrencyConverter.getUsdToBsRate();
            if (!conversionResult.success || !conversionResult.data) {
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
            const productWithBsPrice = {
                ...productResult.data,
                price_bs: Math.round(productResult.data.price * conversionResult.data.usdToBsRate * 100) / 100,
                conversion_rate: conversionResult.data.usdToBsRate,
                conversion_last_updated: conversionResult.data.lastUpdated
            };
            return {
                success: true,
                data: productWithBsPrice
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    async getProductByIdWithBsPrice(id) {
        try {
            const productResult = await this.getProductById(id);
            if (!productResult.success || !productResult.data) {
                return productResult;
            }
            const conversionResult = await CurrencyConverter.getUsdToBsRate();
            if (!conversionResult.success || !conversionResult.data) {
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
            const productWithBsPrice = {
                ...productResult.data,
                price_bs: Math.round(productResult.data.price * conversionResult.data.usdToBsRate * 100) / 100,
                conversion_rate: conversionResult.data.usdToBsRate,
                conversion_last_updated: conversionResult.data.lastUpdated
            };
            return {
                success: true,
                data: productWithBsPrice
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
export class GuaranteeModel {
    get db() {
        return getDatabase();
    }
    getGuaranteesByUserId(userId) {
        return new Promise((resolve) => {
            try {
                const stmt = this.db.prepare('SELECT * FROM guarantees WHERE user_id = ? ORDER BY created_at DESC');
                stmt.all(userId, (err, guarantees) => {
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
            }
            catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        });
    }
    createGuarantee(guaranteeData) {
        return new Promise((resolve) => {
            try {
                const stmt = this.db.prepare(`
          INSERT INTO guarantees (user_id, invoice_number, invoice_photo_file_id, product_photo_file_id, description)
          VALUES (?, ?, ?, ?, ?)
        `);
                stmt.run(guaranteeData.user_id, guaranteeData.invoice_number, guaranteeData.invoice_photo_file_id, guaranteeData.product_photo_file_id, guaranteeData.description, function (err) {
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
                });
            }
            catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        });
    }
}
export class StoreConfigModel {
    get db() {
        return getDatabase();
    }
    getStoreConfig() {
        return new Promise((resolve) => {
            try {
                const stmt = this.db.prepare('SELECT * FROM store_config ORDER BY id DESC LIMIT 1');
                stmt.get((err, config) => {
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
            }
            catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        });
    }
    updateStoreConfig(configData) {
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
                stmt.run(configData.name, configData.address, configData.latitude || null, configData.longitude || null, configData.phone || null, configData.email || null, function (err) {
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
            }
            catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        });
    }
}
export class SatisfactionSurveyModel {
    get db() {
        return getDatabase();
    }
    createSurvey(surveyData) {
        return new Promise((resolve) => {
            try {
                const stmt = this.db.prepare(`
          INSERT INTO satisfaction_surveys (user_id, rating, feedback, conversation_id)
          VALUES (?, ?, ?, ?)
        `);
                stmt.run(surveyData.user_id, surveyData.rating, surveyData.feedback || null, surveyData.conversation_id || null, function (err) {
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
                });
            }
            catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        });
    }
}
export class ConversationModel {
    get db() {
        return getDatabase();
    }
    createConversation(conversationData) {
        return new Promise((resolve) => {
            try {
                const stmt = this.db.prepare(`
          INSERT INTO conversations (user_id, ai_session_data)
          VALUES (?, ?)
        `);
                stmt.run(conversationData.user_id, conversationData.ai_session_data || null, function (err) {
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
                });
            }
            catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        });
    }
    getActiveConversation(userId) {
        return new Promise((resolve) => {
            try {
                const stmt = this.db.prepare('SELECT * FROM conversations WHERE user_id = ? AND status = "active" ORDER BY started_at DESC LIMIT 1');
                stmt.get(userId, (err, conversation) => {
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
            }
            catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        });
    }
    endConversation(conversationId) {
        return new Promise((resolve) => {
            try {
                const stmt = this.db.prepare('UPDATE conversations SET status = "ended", ended_at = CURRENT_TIMESTAMP WHERE id = ?');
                stmt.run(conversationId, function (err) {
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
            }
            catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        });
    }
    updateConversationData(conversationId, aiSessionData) {
        return new Promise((resolve) => {
            try {
                const stmt = this.db.prepare('UPDATE conversations SET ai_session_data = ? WHERE id = ?');
                stmt.run(aiSessionData, conversationId, function (err) {
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
            }
            catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        });
    }
}
export class ScheduleModel {
    get db() {
        return getDatabase();
    }
    async getAllSchedules() {
        return new Promise((resolve) => {
            try {
                const stmt = this.db.prepare(`
          SELECT * FROM schedules 
          WHERE is_active = 1
          ORDER BY day_of_week, open_time
        `);
                stmt.all((err, schedules) => {
                    if (err) {
                        resolve({
                            success: false,
                            error: err.message
                        });
                        return;
                    }
                    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                    const mappedSchedules = schedules.map((schedule) => ({
                        ...schedule,
                        day_name: dayNames[schedule.day_of_week] || 'Día desconocido'
                    }));
                    resolve({
                        success: true,
                        data: mappedSchedules
                    });
                });
            }
            catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Error obteniendo horarios'
                });
            }
        });
    }
    async getSchedulesByDay(dayOfWeek) {
        return new Promise((resolve) => {
            try {
                const stmt = this.db.prepare(`
          SELECT * FROM schedules 
          WHERE day_of_week = ? AND is_active = 1
          ORDER BY open_time
        `);
                stmt.all(dayOfWeek, (err, schedules) => {
                    if (err) {
                        resolve({
                            success: false,
                            error: err.message
                        });
                        return;
                    }
                    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                    const mappedSchedules = schedules.map((schedule) => ({
                        ...schedule,
                        day_name: dayNames[schedule.day_of_week] || 'Día desconocido'
                    }));
                    resolve({
                        success: true,
                        data: mappedSchedules
                    });
                });
            }
            catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Error obteniendo horarios por día'
                });
            }
        });
    }
    async createSchedule(schedule) {
        return new Promise((resolve) => {
            try {
                const stmt = this.db.prepare(`
          INSERT INTO schedules (day_of_week, open_time, close_time, is_active)
          VALUES (?, ?, ?, ?)
        `);
                stmt.run(schedule.day_of_week, schedule.open_time, schedule.close_time, schedule.is_active !== false ? 1 : 0, function (err) {
                    if (err) {
                        resolve({
                            success: false,
                            error: err.message
                        });
                        return;
                    }
                    resolve({
                        success: true,
                        data: { id: this.lastID }
                    });
                });
            }
            catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Error creando horario'
                });
            }
        });
    }
}
export const userModel = new UserModel();
export const chatModel = new ChatModel();
export const messageModel = new MessageModel();
export const productModel = new ProductModel();
export const guaranteeModel = new GuaranteeModel();
export const scheduleModel = new ScheduleModel();
export const storeConfigModel = new StoreConfigModel();
export const satisfactionSurveyModel = new SatisfactionSurveyModel();
export const conversationModel = new ConversationModel();
//# sourceMappingURL=models.js.map