import sqlite3 from 'sqlite3';
import { join, dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { logger } from '../utils/logger.js';
let db = null;
export const connectDatabase = () => {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }
        try {
            const dbPath = process.env['DATABASE_PATH'] || join(process.cwd(), 'data', 'bot.db');
            const dir = dirname(dbPath);
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }
            db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    logger.database.error('Error al conectar con la base de datos:', err);
                    reject(err);
                    return;
                }
                logger.database.connect(dbPath);
                createTables()
                    .then(() => {
                    logger.database.connect('Tablas creadas correctamente');
                    resolve(db);
                })
                    .catch(reject);
            });
        }
        catch (error) {
            logger.database.error('Error al conectar con la base de datos:', error);
            reject(error);
        }
    });
};
const createTables = () => {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Base de datos no conectada'));
            return;
        }
        const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER UNIQUE NOT NULL,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        language_code TEXT DEFAULT 'es',
        is_bot BOOLEAN DEFAULT 0,
        settings TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
        const createChatsTable = `
      CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER UNIQUE NOT NULL,
        type TEXT NOT NULL,
        title TEXT,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        description TEXT,
        settings TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
        const createMessagesTable = `
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER UNIQUE NOT NULL,
        user_id INTEGER,
        chat_id INTEGER,
        text TEXT,
        message_type TEXT,
        reply_to_message_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (chat_id) REFERENCES chats (id)
      )
    `;
        db.serialize(() => {
            db.exec(createUsersTable, (err) => {
                if (err) {
                    logger.database.error('Error al crear tabla users:', err);
                    reject(err);
                    return;
                }
            });
            db.exec(createChatsTable, (err) => {
                if (err) {
                    logger.database.error('Error al crear tabla chats:', err);
                    reject(err);
                    return;
                }
            });
            db.exec(createMessagesTable, (err) => {
                if (err) {
                    logger.database.error('Error al crear tabla messages:', err);
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    });
};
export const getDatabase = () => {
    if (!db) {
        throw new Error('Base de datos no conectada. Llama a connectDatabase() primero.');
    }
    return db;
};
export const closeDatabase = () => {
    return new Promise((resolve) => {
        if (db) {
            db.close((err) => {
                if (err) {
                    logger.database.error('Error cerrando base de datos:', err);
                }
                else {
                    logger.database.connect('Conexión a la base de datos cerrada');
                }
                db = null;
                resolve();
            });
        }
        else {
            resolve();
        }
    });
};
export const isConnected = () => {
    return db !== null;
};
//# sourceMappingURL=connection.js.map