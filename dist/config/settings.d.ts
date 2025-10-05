import type { BotConfig } from '../types/bot.js';
export declare const appConfig: BotConfig;
export declare function validateConfig(): void;
export declare const isDevelopment: boolean;
export declare const isProduction: boolean;
export declare const databaseConfig: {
    path: string;
    options: {
        verbose: {
            (...data: any[]): void;
            (message?: any, ...optionalParams: any[]): void;
        } | undefined;
    };
};
export declare const loggingConfig: {
    level: "error" | "warn" | "info" | "debug";
    format: string;
    file: string | undefined;
};
//# sourceMappingURL=settings.d.ts.map