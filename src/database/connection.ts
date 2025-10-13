import sqlite3 from 'sqlite3';
import { join, dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { logger } from '../utils/logger.js';

let db: sqlite3.Database | null = null;

export const connectDatabase = (): Promise<sqlite3.Database> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    try {
      const dbPath = process.env['DATABASE_PATH'] || join(process.cwd(), 'data', 'bot.db');
      
      // Crear directorio si no existe
      const dir = dirname(dbPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      db = new sqlite3.Database(dbPath, (err: any) => {
        if (err) {
          logger.database.error('Error al conectar con la base de datos:', err);
          reject(err);
          return;
        }
        
        logger.database.connect(dbPath);
        
        // Crear tablas si no existen
        createTables()
          .then(() => {
            logger.database.connect('Tablas creadas correctamente');
            resolve(db!);
          })
          .catch(reject);
      });
    } catch (error) {
      logger.database.error('Error al conectar con la base de datos:', error);
      reject(error);
    }
  });
};

const createTables = (): Promise<void> => {
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

    const createProductsTable = `
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code VARCHAR(50) UNIQUE NOT NULL,
        brand VARCHAR(100) NOT NULL,
        image_file_id VARCHAR(255),
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        available_units INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createGuaranteesTable = `
      CREATE TABLE IF NOT EXISTS guarantees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        invoice_number VARCHAR(100) NOT NULL,
        invoice_photo_file_id VARCHAR(255) NOT NULL,
        product_photo_file_id VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `;

    const createSchedulesTable = `
      CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        day_of_week INTEGER NOT NULL,
        open_time TIME NOT NULL,
        close_time TIME NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createStoreConfigTable = `
      CREATE TABLE IF NOT EXISTS store_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        phone VARCHAR(20),
        email VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createSatisfactionSurveysTable = `
      CREATE TABLE IF NOT EXISTS satisfaction_surveys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        feedback TEXT,
        conversation_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `;

    const createConversationsTable = `
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ended_at DATETIME,
        status VARCHAR(20) DEFAULT 'active',
        ai_session_data TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `;

    db.serialize(() => {
      db!.exec(createUsersTable, (err: any) => {
        if (err) {
          logger.database.error('Error al crear tabla users:', err);
          reject(err);
          return;
        }
      });

      db!.exec(createChatsTable, (err: any) => {
        if (err) {
          logger.database.error('Error al crear tabla chats:', err);
          reject(err);
          return;
        }
      });

      db!.exec(createMessagesTable, (err: any) => {
        if (err) {
          logger.database.error('Error al crear tabla messages:', err);
          reject(err);
          return;
        }
      });

      db!.exec(createProductsTable, (err: any) => {
        if (err) {
          logger.database.error('Error al crear tabla products:', err);
          reject(err);
          return;
        }
      });

      db!.exec(createGuaranteesTable, (err: any) => {
        if (err) {
          logger.database.error('Error al crear tabla guarantees:', err);
          reject(err);
          return;
        }
      });

      db!.exec(createSchedulesTable, (err: any) => {
        if (err) {
          logger.database.error('Error al crear tabla schedules:', err);
          reject(err);
          return;
        }
      });

      db!.exec(createStoreConfigTable, (err: any) => {
        if (err) {
          logger.database.error('Error al crear tabla store_config:', err);
          reject(err);
          return;
        }
      });

      db!.exec(createSatisfactionSurveysTable, (err: any) => {
        if (err) {
          logger.database.error('Error al crear tabla satisfaction_surveys:', err);
          reject(err);
          return;
        }
      });

      db!.exec(createConversationsTable, (err: any) => {
        if (err) {
          logger.database.error('Error al crear tabla conversations:', err);
          reject(err);
          return;
        }
        resolve();
      });
    });
  });
};

export const getDatabase = (): sqlite3.Database => {
  if (!db) {
    throw new Error('Base de datos no conectada. Llama a connectDatabase() primero.');
  }
  return db;
};

export const closeDatabase = (): Promise<void> => {
  return new Promise((resolve) => {
    if (db) {
      db.close((err: any) => {
        if (err) {
          logger.database.error('Error cerrando base de datos:', err);
        } else {
          logger.database.connect('Conexión a la base de datos cerrada');
        }
        db = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
};

export const isConnected = (): boolean => {
  return db !== null;
};