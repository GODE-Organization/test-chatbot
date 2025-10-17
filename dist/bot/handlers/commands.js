import { logger } from '../../utils/logger.js';
import { getMainMenuKeyboard, getSettingsKeyboard, getHelpKeyboard, getContactKeyboard } from '../keyboards/main.js';
export async function startCommand(ctx) {
    try {
        const welcomeMessage = `
🛍️ ¡Bienvenido a nuestro asistente de atención al cliente!

¡Hola! Soy tu asistente inteligente y estoy aquí para ayudarte con:

• Consultas sobre nuestros productos
• Registro de garantías
• Información de horarios y ubicación
• Cualquier pregunta que tengas

Simplemente escribe tu mensaje y te ayudaré de inmediato.

¿En qué puedo ayudarte hoy?
    `.trim();
        await ctx.reply(welcomeMessage, getMainMenuKeyboard());
        logger.user.action(ctx.from?.id || 0, 'Comando /start ejecutado');
    }
    catch (error) {
        logger.error('Error en comando start:', error);
        await ctx.reply('❌ Ocurrió un error. Por favor, intenta de nuevo.');
    }
}
export async function helpCommand(ctx) {
    try {
        const helpMessage = `
📖 **Comandos disponibles:**

**Comandos principales:**
/start - Iniciar el bot
/help - Mostrar esta ayuda
/settings - Configuración
/stats - Ver estadísticas
/contact - Información de contacto
/reset - Reiniciar sesión
/cancel - Cancelar operación actual

**Funcionalidades:**
• Asistente inteligente con IA
• Consulta de catálogo de productos
• Registro de garantías
• Consulta de horarios
• Información de ubicación
• Encuestas de satisfacción

Simplemente escribe tu mensaje y nuestro asistente inteligente te ayudará.
    `.trim();
        await ctx.reply(helpMessage, getHelpKeyboard());
        logger.user.action(ctx.from?.id || 0, 'Comando /help ejecutado');
    }
    catch (error) {
        logger.error('Error en comando help:', error);
        await ctx.reply('❌ Ocurrió un error. Por favor, intenta de nuevo.');
    }
}
export async function settingsCommand(ctx) {
    try {
        const settingsMessage = `
⚙️ **Configuración**

Selecciona una opción para personalizar tu experiencia:
    `.trim();
        await ctx.reply(settingsMessage, getSettingsKeyboard());
        logger.user.action(ctx.from?.id || 0, 'Comando /settings ejecutado');
    }
    catch (error) {
        logger.error('Error en comando settings:', error);
        await ctx.reply('❌ Ocurrió un error. Por favor, intenta de nuevo.');
    }
}
export async function statsCommand(ctx) {
    try {
        const statsMessage = `
📊 **Estadísticas del Bot**

• Usuarios activos: Calculando...
• Mensajes procesados: Calculando...
• Tiempo de actividad: 24/7
• Versión: 1.0.0

*Las estadísticas se actualizan en tiempo real*
    `.trim();
        await ctx.reply(statsMessage);
        logger.user.action(ctx.from?.id || 0, 'Comando /stats ejecutado');
    }
    catch (error) {
        logger.error('Error en comando stats:', error);
        await ctx.reply('❌ Ocurrió un error. Por favor, intenta de nuevo.');
    }
}
export async function contactCommand(ctx) {
    try {
        const contactMessage = `
📞 **Información de Contacto**

¿Necesitas ayuda o tienes alguna sugerencia?

Puedes contactarnos a través de:
    `.trim();
        await ctx.reply(contactMessage, getContactKeyboard());
        logger.user.action(ctx.from?.id || 0, 'Comando /contact ejecutado');
    }
    catch (error) {
        logger.error('Error en comando contact:', error);
        await ctx.reply('❌ Ocurrió un error. Por favor, intenta de nuevo.');
    }
}
export async function resetCommand(ctx) {
    try {
        if (ctx.session) {
            const { AIProcessor } = await import('../ai-integration/ai-processor.js');
            const aiProcessor = AIProcessor.getInstance();
            ctx.session = aiProcessor.resetSessionToIdle(ctx.session);
        }
        const resetMessage = `
🔄 **Sesión Reiniciada**

Tu sesión ha sido reiniciada. Puedes comenzar de nuevo.

Usa /start para ver el menú principal.
    `.trim();
        await ctx.reply(resetMessage);
        logger.user.action(ctx.from?.id || 0, 'Comando /reset ejecutado');
    }
    catch (error) {
        logger.error('Error en comando reset:', error);
        await ctx.reply('❌ Ocurrió un error. Por favor, intenta de nuevo.');
    }
}
export async function cancelCommand(ctx) {
    try {
        const { AIMessageHandler } = await import('./ai-message-handler.js');
        const aiHandler = AIMessageHandler.getInstance();
        await aiHandler.handleCancelCommand(ctx);
        logger.user.action(ctx.from?.id || 0, 'Comando /cancel ejecutado');
    }
    catch (error) {
        logger.error('Error en comando cancel:', error);
        await ctx.reply('❌ Ocurrió un error. Por favor, intenta de nuevo.');
    }
}
//# sourceMappingURL=commands.js.map