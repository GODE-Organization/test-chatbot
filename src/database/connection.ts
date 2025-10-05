import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { logger } from '../utils/logger.js';

let db: Database.Database | null = null;

export const connectDatabase = (): Database.Database => {
  if (db) {
    return db;
  }

  try {
    const dbPath = process.env['DATABASE_PATH'] || join(process.cwd(), 'data', 'bot.db');
    
    // Crear directorio si no existe
    const dir = dirname(dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    db = new Database(dbPath);
    
    // Crear tablas si no existen
    createTables();
    
    logger.database.connect(dbPath);
    return db;
  } catch (error) {
    logger.database.error('Error al conectar con la base de datos:', error);
    throw error;
  }
};

const createTables = (): void => {
  if (!db) return;

  try {
    // Tabla de usuarios
    db.exec(`
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
    `);

    // Tabla de chats
    db.exec(`
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
    `);

    // Tabla de mensajes
    db.exec(`
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
    `);

    logger.database.connect('Tablas creadas correctamente');
  } catch (error) {
    logger.database.error('Error al crear tablas:', error);
    throw error;
  }
};

export const getDatabase = (): Database.Database => {
  if (!db) {
    throw new Error('Base de datos no conectada. Llama a connectDatabase() primero.');
  }
  return db;
};

export const closeDatabase = (): void => {
  if (db) {
    db.close();
    db = null;
    logger.database.connect('Conexión a la base de datos cerrada');
  }
};

export const isConnected = (): boolean => {
  return db !== null;
};