import { logger } from '../../utils/logger.js';
import { getMainMenuKeyboard, getSettingsKeyboard, getLanguageKeyboard, getNotificationKeyboard, getThemeKeyboard, getPrivacyKeyboard, getHelpKeyboard, getConfirmationKeyboard } from '../keyboards/main.js';
import { AIMessageHandler } from './ai-message-handler.js';
export async function handleSettingsCallbacks(ctx) {
    try {
        if (!ctx.callbackQuery || !('data' in ctx.callbackQuery))
            return;
        const data = ctx.callbackQuery.data;
        const messageId = ctx.callbackQuery.message?.message_id;
        switch (data) {
            case 'settings_notifications':
                await ctx.editMessageText('🔔 **Configuración de Notificaciones**\n\nSelecciona qué notificaciones deseas recibir:', {
                    reply_markup: getNotificationKeyboard().reply_markup,
                    parse_mode: 'Markdown'
                });
                break;
            case 'settings_language':
                await ctx.editMessageText('🌐 **Seleccionar Idioma**\n\nElige tu idioma preferido:', {
                    reply_markup: getLanguageKeyboard().reply_markup,
                    parse_mode: 'Markdown'
                });
                break;
            case 'settings_theme':
                await ctx.editMessageText('📱 **Configuración de Tema**\n\nSelecciona el tema que prefieras:', {
                    reply_markup: getThemeKeyboard().reply_markup,
                    parse_mode: 'Markdown'
                });
                break;
            case 'settings_privacy':
                await ctx.editMessageText('🔒 **Configuración de Privacidad**\n\nConfigura cómo se maneja tu información:', {
                    reply_markup: getPrivacyKeyboard().reply_markup,
                    parse_mode: 'Markdown'
                });
                break;
            case 'back_to_main':
                await ctx.editMessageText('🏠 **Menú Principal**\n\nSelecciona una opción:', {
                    reply_markup: getSettingsKeyboard().reply_markup,
                    parse_mode: 'Markdown'
                });
                break;
            case 'back_to_settings':
                await ctx.editMessageText('⚙️ **Configuración**\n\nSelecciona una opción para personalizar tu experiencia:', {
                    reply_markup: getSettingsKeyboard().reply_markup,
                    parse_mode: 'Markdown'
                });
                break;
            default:
                await ctx.answerCbQuery('❌ Opción no reconocida');
                return;
        }
        await ctx.answerCbQuery();
        logger.user.action(ctx.from?.id || 0, `Callback ejecutado: ${data}`);
    }
    catch (error) {
        logger.error('Error manejando callback de configuración:', error);
        await ctx.answerCbQuery('❌ Error procesando solicitud');
    }
}
export async function handleLanguageCallbacks(ctx) {
    try {
        if (!ctx.callbackQuery || !('data' in ctx.callbackQuery))
            return;
        const data = ctx.callbackQuery.data;
        const messageId = ctx.callbackQuery.message?.message_id;
        const languageMap = {
            'lang_es': { code: 'es', name: 'Español', flag: '🇪🇸' },
            'lang_en': { code: 'en', name: 'English', flag: '🇺🇸' },
            'lang_fr': { code: 'fr', name: 'Français', flag: '🇫🇷' },
            'lang_de': { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
        };
        if (data in languageMap) {
            const lang = languageMap[data];
            if (lang) {
                await ctx.editMessageText(`✅ **Idioma actualizado**\n\nTu idioma se ha cambiado a ${lang.flag} ${lang.name}`, {
                    reply_markup: getSettingsKeyboard().reply_markup,
                    parse_mode: 'Markdown'
                });
                logger.user.action(ctx.from?.id || 0, `Idioma cambiado a: ${lang.name}`);
            }
        }
        else if (data === 'back_to_settings') {
            await ctx.editMessageText('⚙️ **Configuración**\n\nSelecciona una opción para personalizar tu experiencia:', {
                reply_markup: getSettingsKeyboard().reply_markup,
                parse_mode: 'Markdown'
            });
        }
        else {
            await ctx.answerCbQuery('❌ Opción no reconocida');
            return;
        }
        await ctx.answerCbQuery();
    }
    catch (error) {
        logger.error('Error manejando callback de idioma:', error);
        await ctx.answerCbQuery('❌ Error procesando solicitud');
    }
}
export async function handleNotificationCallbacks(ctx) {
    try {
        if (!ctx.callbackQuery || !('data' in ctx.callbackQuery))
            return;
        const data = ctx.callbackQuery.data;
        const messageId = ctx.callbackQuery.message?.message_id;
        const notificationMap = {
            'notif_all': 'Todas las notificaciones',
            'notif_none': 'Sin notificaciones',
            'notif_important': 'Solo notificaciones importantes',
            'notif_messages': 'Solo mensajes directos'
        };
        if (data in notificationMap) {
            const setting = notificationMap[data];
            await ctx.editMessageText(`✅ **Notificaciones actualizadas**\n\nConfiguración: ${setting}`, {
                reply_markup: getSettingsKeyboard().reply_markup,
                parse_mode: 'Markdown'
            });
            logger.user.action(ctx.from?.id || 0, `Notificaciones cambiadas a: ${setting}`);
        }
        else if (data === 'back_to_settings') {
            await ctx.editMessageText('⚙️ **Configuración**\n\nSelecciona una opción para personalizar tu experiencia:', {
                reply_markup: getSettingsKeyboard().reply_markup,
                parse_mode: 'Markdown'
            });
        }
        else {
            await ctx.answerCbQuery('❌ Opción no reconocida');
            return;
        }
        await ctx.answerCbQuery();
    }
    catch (error) {
        logger.error('Error manejando callback de notificaciones:', error);
        await ctx.answerCbQuery('❌ Error procesando solicitud');
    }
}
export async function handleHelpCallbacks(ctx) {
    try {
        if (!ctx.callbackQuery || !('data' in ctx.callbackQuery))
            return;
        const data = ctx.callbackQuery.data;
        const messageId = ctx.callbackQuery.message?.message_id;
        switch (data) {
            case 'help_commands':
                await ctx.editMessageText('📖 **Lista de Comandos**\n\n' +
                    '/start - Iniciar el bot\n' +
                    '/help - Mostrar ayuda\n' +
                    '/settings - Configuración\n' +
                    '/stats - Ver estadísticas\n' +
                    '/contact - Información de contacto\n' +
                    '/reset - Reiniciar sesión', {
                    reply_markup: getHelpKeyboard().reply_markup,
                    parse_mode: 'Markdown'
                });
                break;
            case 'help_faq':
                await ctx.editMessageText('❓ **Preguntas Frecuentes**\n\n' +
                    '**¿Cómo cambio mi idioma?**\n' +
                    'Ve a Configuración > Idioma y selecciona tu preferencia.\n\n' +
                    '**¿Puedo desactivar las notificaciones?**\n' +
                    'Sí, en Configuración > Notificaciones puedes elegir qué recibir.\n\n' +
                    '**¿Mis datos están seguros?**\n' +
                    'Sí, respetamos tu privacidad y solo guardamos datos necesarios.', {
                    reply_markup: getHelpKeyboard().reply_markup,
                    parse_mode: 'Markdown'
                });
                break;
            case 'help_bug':
                await ctx.editMessageText('🐛 **Reportar Error**\n\n' +
                    'Si encuentras un error, por favor:\n\n' +
                    '1. Describe qué estabas haciendo\n' +
                    '2. Incluye el mensaje de error si aparece\n' +
                    '3. Contacta al soporte técnico\n\n' +
                    '¡Gracias por ayudarnos a mejorar!', {
                    reply_markup: getHelpKeyboard().reply_markup,
                    parse_mode: 'Markdown'
                });
                break;
            case 'help_suggestion':
                await ctx.editMessageText('💡 **Sugerir Mejora**\n\n' +
                    '¡Nos encanta recibir sugerencias!\n\n' +
                    'Puedes enviar tus ideas a través de:\n' +
                    '• El botón de contacto\n' +
                    '• Email de soporte\n' +
                    '• Canal de Telegram\n\n' +
                    '¡Todas las sugerencias son bienvenidas!', {
                    reply_markup: getHelpKeyboard().reply_markup,
                    parse_mode: 'Markdown'
                });
                break;
            case 'back_to_main':
                await ctx.editMessageText('🏠 **Menú Principal**\n\nSelecciona una opción:', {
                    reply_markup: getSettingsKeyboard().reply_markup,
                    parse_mode: 'Markdown'
                });
                break;
            default:
                await ctx.answerCbQuery('❌ Opción no reconocida');
                return;
        }
        await ctx.answerCbQuery();
        logger.user.action(ctx.from?.id || 0, `Callback de ayuda ejecutado: ${data}`);
    }
    catch (error) {
        logger.error('Error manejando callback de ayuda:', error);
        await ctx.answerCbQuery('❌ Error procesando solicitud');
    }
}
export async function handleAICallbacks(ctx) {
    try {
        if (!ctx.callbackQuery || !('data' in ctx.callbackQuery))
            return;
        const data = ctx.callbackQuery.data;
        const aiHandler = AIMessageHandler.getInstance();
        await aiHandler.handleCallbackQuery(ctx);
    }
    catch (error) {
        logger.error('Error manejando callback de IA:', error);
        await ctx.answerCbQuery('❌ Error procesando solicitud');
    }
}
//# sourceMappingURL=callbacks.js.map