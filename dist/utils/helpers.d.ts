export declare function formatDate(date: Date): string;
export declare function generateId(): string;
export declare function escapeMarkdown(text: string): string;
export declare function truncateText(text: string, maxLength: number): string;
export declare function isNumeric(str: string): boolean;
export declare function capitalizeWords(str: string): string;
export declare function generateRandomText(length: number): string;
export declare function delay(ms: number): Promise<void>;
export declare function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries?: number, baseDelay?: number): Promise<T>;
export declare function isValidEmail(email: string): boolean;
export declare function getUserFullName(user: {
    first_name?: string;
    last_name?: string;
    username?: string;
}): string;
//# sourceMappingURL=helpers.d.ts.map