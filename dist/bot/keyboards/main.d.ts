import { Markup } from 'telegraf';
import type { KeyboardConfig } from '../../types/bot.js';
export declare function getMainMenuKeyboard(): Markup.Markup<import("@telegraf/types").ReplyKeyboardMarkup>;
export declare function getSettingsKeyboard(): Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>;
export declare function getLanguageKeyboard(): Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>;
export declare function getConfirmationKeyboard(action: string): Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>;
export declare function getNavigationKeyboard(): Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>;
export declare function getNotificationKeyboard(): Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>;
export declare function getThemeKeyboard(): Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>;
export declare function getPrivacyKeyboard(): Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>;
export declare function getHelpKeyboard(): Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>;
export declare function getContactKeyboard(): Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>;
export declare function createCustomKeyboard(config: KeyboardConfig[][]): Markup.Markup<import("@telegraf/types").ReplyKeyboardMarkup>;
export declare function createCustomInlineKeyboard(config: KeyboardConfig[][]): Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>;
//# sourceMappingURL=main.d.ts.map