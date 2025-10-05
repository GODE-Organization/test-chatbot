import sqlite3 from 'sqlite3';
export declare const connectDatabase: () => Promise<sqlite3.Database>;
export declare const getDatabase: () => sqlite3.Database;
export declare const closeDatabase: () => Promise<void>;
export declare const isConnected: () => boolean;
//# sourceMappingURL=connection.d.ts.map