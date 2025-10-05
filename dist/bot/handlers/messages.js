import { logger } from '../../utils/logger.js';
import { messageModel, chatModel } from '../../database/models.js';
import { getMainMenuKeyboard } from '../keyboards/main.js';
export async function handleTextMessage(ctx) {
    try {
        if (!ctx.message || !('text' in ctx.message) || !ctx.user) {
            return;
        }
        const text = ctx.message.text;
        const userId = ctx.user.id;
        const chatId = ctx.chat?.id;
        if (chatId) {
            await messageModel.saveMessage({
                telegram_id: ctx.message.message_id,
                user_id: userId,
                chat_id: chatId,
                text: text,
                message_type: 'text'
            });
        }
        if (text.startsWith('/')) {
            return;
        }
        const responses = {
            'hola': '¡Hola! 👋 ¿En qué puedo ayudarte?',
            'hello': 'Hello! 👋 How can I help you?',
            'gracias': '¡De nada! 😊 ¿Hay algo más en lo que pueda ayudarte?',
            'thanks': 'You\'re welcome! 😊 Is there anything else I can help you with?',
            'ayuda': 'Usa /help para ver los comandos disponibles o el menú de abajo.',
            'help': 'Use /help to see available commands or the menu below.',
            'menu': 'Aquí tienes el menú principal:',
            'menú': 'Aquí tienes el menú principal:'
        };
        const lowerText = text.toLowerCase().trim();
        if (lowerText in responses) {
            const response = responses[lowerText];
            if (response) {
                if (lowerText === 'menu' || lowerText === 'menú') {
                    await ctx.reply(response, getMainMenuKeyboard());
                }
                else {
                    await ctx.reply(response);
                }
            }
            logger.user.action(ctx.from?.id || 0, `Mensaje procesado: ${text}`);
            return;
        }
        const defaultResponse = `
🤔 No estoy seguro de cómo responder a eso.

Usa /help para ver los comandos disponibles o selecciona una opción del menú.
    `.trim();
        await ctx.reply(defaultResponse, getMainMenuKeyboard());
        logger.user.action(ctx.from?.id || 0, `Mensaje no reconocido: ${text}`);
    }
    catch (error) {
        logger.error('Error manejando mensaje de texto:', error);
        await ctx.reply('❌ Ocurrió un error procesando tu mensaje. Por favor, intenta de nuevo.');
    }
}
export async function handlePhotoMessage(ctx) {
    try {
        if (!ctx.message || !('photo' in ctx.message) || !ctx.user) {
            return;
        }
        const userId = ctx.user.id;
        const chatId = ctx.chat?.id;
        if (chatId) {
            await messageModel.saveMessage({
                telegram_id: ctx.message.message_id,
                user_id: userId,
                chat_id: chatId,
                message_type: 'photo'
            });
        }
        await ctx.reply('📸 ¡Gracias por la foto! ¿Hay algo específico que quieras hacer con ella?');
        logger.user.action(ctx.from?.id || 0, 'Mensaje de foto procesado');
    }
    catch (error) {
        logger.error('Error manejando mensaje de foto:', error);
        await ctx.reply('❌ Ocurrió un error procesando la foto. Por favor, intenta de nuevo.');
    }
}
export async function handleDocumentMessage(ctx) {
    try {
        if (!ctx.message || !('document' in ctx.message) || !ctx.user) {
            return;
        }
        const userId = ctx.user.id;
        const chatId = ctx.chat?.id;
        if (chatId) {
            await messageModel.saveMessage({
                telegram_id: ctx.message.message_id,
                user_id: userId,
                chat_id: chatId,
                message_type: 'document'
            });
        }
        const document = ctx.message.document;
        const fileName = document.file_name || 'archivo';
        const fileSize = document.file_size ? (document.file_size / 1024).toFixed(2) + ' KB' : 'desconocido';
        await ctx.reply(`📄 Documento recibido: ${fileName} (${fileSize})\n\n¿Necesitas ayuda con este archivo?`);
        logger.user.action(ctx.from?.id || 0, `Documento procesado: ${fileName}`);
    }
    catch (error) {
        logger.error('Error manejando mensaje de documento:', error);
        await ctx.reply('❌ Ocurrió un error procesando el documento. Por favor, intenta de nuevo.');
    }
}
export async function handleStickerMessage(ctx) {
    try {
        if (!ctx.message || !('sticker' in ctx.message) || !ctx.user) {
            return;
        }
        const userId = ctx.user.id;
        const chatId = ctx.chat?.id;
        if (chatId) {
            await messageModel.saveMessage({
                telegram_id: ctx.message.message_id,
                user_id: userId,
                chat_id: chatId,
                message_type: 'sticker'
            });
        }
        const sticker = ctx.message.sticker;
        const emoji = sticker.emoji || '😊';
        await ctx.reply(`${emoji} ¡Gracias por el sticker! Me encanta recibir stickers.`);
        logger.user.action(ctx.from?.id || 0, 'Mensaje de sticker procesado');
    }
    catch (error) {
        logger.error('Error manejando mensaje de sticker:', error);
        await ctx.reply('❌ Ocurrió un error procesando el sticker. Por favor, intenta de nuevo.');
    }
}
export async function handleVoiceMessage(ctx) {
    try {
        if (!ctx.message || !('voice' in ctx.message) || !ctx.user) {
            return;
        }
        const userId = ctx.user.id;
        const chatId = ctx.chat?.id;
        if (chatId) {
            await messageModel.saveMessage({
                telegram_id: ctx.message.message_id,
                user_id: userId,
                chat_id: chatId,
                message_type: 'voice'
            });
        }
        const voice = ctx.message.voice;
        const duration = voice.duration || 0;
        await ctx.reply(`🎤 Mensaje de voz recibido (${duration}s)\n\nActualmente no puedo procesar audio, pero lo he guardado. ¿Hay algo más en lo que pueda ayudarte?`);
        logger.user.action(ctx.from?.id || 0, 'Mensaje de voz procesado');
    }
    catch (error) {
        logger.error('Error manejando mensaje de voz:', error);
        await ctx.reply('❌ Ocurrió un error procesando el mensaje de voz. Por favor, intenta de nuevo.');
    }
}
export async function handleLocationMessage(ctx) {
    try {
        if (!ctx.message || !('location' in ctx.message) || !ctx.user) {
            return;
        }
        const userId = ctx.user.id;
        const chatId = ctx.chat?.id;
        if (chatId) {
            await messageModel.saveMessage({
                telegram_id: ctx.message.message_id,
                user_id: userId,
                chat_id: chatId,
                message_type: 'location'
            });
        }
        const location = ctx.message.location;
        const latitude = location.latitude;
        const longitude = location.longitude;
        await ctx.reply(`📍 Ubicación recibida: ${latitude}, ${longitude}\n\n¿Necesitas ayuda con esta ubicación?`);
        logger.user.action(ctx.from?.id || 0, 'Mensaje de ubicación procesado');
    }
    catch (error) {
        logger.error('Error manejando mensaje de ubicación:', error);
        await ctx.reply('❌ Ocurrió un error procesando la ubicación. Por favor, intenta de nuevo.');
    }
}
export async function handleContactMessage(ctx) {
    try {
        if (!ctx.message || !('contact' in ctx.message) || !ctx.user) {
            return;
        }
        const userId = ctx.user.id;
        const chatId = ctx.chat?.id;
        if (chatId) {
            await messageModel.saveMessage({
                telegram_id: ctx.message.message_id,
                user_id: userId,
                chat_id: chatId,
                message_type: 'contact'
            });
        }
        const contact = ctx.message.contact;
        const name = contact.first_name + (contact.last_name ? ` ${contact.last_name}` : '');
        await ctx.reply(`👤 Contacto recibido: ${name}\n\n¿Necesitas ayuda con este contacto?`);
        logger.user.action(ctx.from?.id || 0, 'Mensaje de contacto procesado');
    }
    catch (error) {
        logger.error('Error manejando mensaje de contacto:', error);
        await ctx.reply('❌ Ocurrió un error procesando el contacto. Por favor, intenta de nuevo.');
    }
}
//# sourceMappingURL=messages.js.map