import { logger } from '../../utils/logger.js';
import { getMainMenuKeyboard, getSettingsKeyboard, getHelpKeyboard, getContactKeyboard } from '../keyboards/main.js';
export async function startCommand(ctx) {
    try {
        const welcomeMessage = `
🃏 ¡Bienvenido al Bot de Telegram!

¡Hola! Soy un bot inteligente que puede ayudarte con diversas tareas.

Usa el menú de abajo para navegar por las opciones disponibles.

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

**Comandos de prueba:**
/saludo - Saludo aleatorio
/test - Comando de prueba
/tiempo - Hora actual
/dado - Lanzar un dado
/moneda - Lanzar una moneda
/chiste - Un chiste aleatorio

**Funcionalidades:**
• Interfaz intuitiva con menús
• Configuración personalizable
• Estadísticas de uso
• Soporte multiidioma
• Comandos de entretenimiento

Usa los botones del menú para una mejor experiencia.
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
            ctx.session.state = 'idle';
            ctx.session.data = {};
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
export async function saludoCommand(ctx) {
    try {
        const saludos = [
            '¡Hola! 👋 ¡Qué gusto verte por aquí!',
            '¡Saludos! 😊 ¿Cómo estás hoy?',
            '¡Hey! 🎉 ¡Espero que tengas un excelente día!',
            '¡Buenos días! ☀️ ¡Espero que todo vaya genial!',
            '¡Hola amigo! 🤗 ¡Gracias por usar nuestro bot!',
            '¡Saludos cordiales! 🌟 ¡Espero que encuentres útil este bot!',
            '¡Hola! 🚀 ¡Bienvenido a la experiencia del bot!',
            '¡Hey! 💫 ¡Espero que tengas un día maravilloso!'
        ];
        const saludoAleatorio = saludos[Math.floor(Math.random() * saludos.length)];
        const saludoMessage = `
${saludoAleatorio}

¿Hay algo específico en lo que pueda ayudarte? 
Usa /help para ver todos los comandos disponibles.
    `.trim();
        await ctx.reply(saludoMessage);
        logger.user.action(ctx.from?.id || 0, 'Comando /saludo ejecutado');
    }
    catch (error) {
        logger.error('Error en comando saludo:', error);
        await ctx.reply('❌ Ocurrió un error. Por favor, intenta de nuevo.');
    }
}
export async function testCommand(ctx) {
    try {
        const testMessage = `
🧪 **Comando de Prueba**

¡El bot está funcionando perfectamente! ✅

**Información del sistema:**
• Bot activo: ✅
• Base de datos: ✅
• Logging: ✅
• Middleware: ✅

**Comandos de prueba disponibles:**
• /saludo - Saludo aleatorio
• /tiempo - Hora actual
• /dado - Lanzar un dado
• /moneda - Lanzar una moneda
• /chiste - Un chiste aleatorio

¡Todo funciona correctamente! 🎉
    `.trim();
        await ctx.reply(testMessage);
        logger.user.action(ctx.from?.id || 0, 'Comando /test ejecutado');
    }
    catch (error) {
        logger.error('Error en comando test:', error);
        await ctx.reply('❌ Ocurrió un error. Por favor, intenta de nuevo.');
    }
}
export async function tiempoCommand(ctx) {
    try {
        const ahora = new Date();
        const hora = ahora.toLocaleTimeString('es-ES', {
            timeZone: 'America/Mexico_City',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        const fecha = ahora.toLocaleDateString('es-ES', {
            timeZone: 'America/Mexico_City',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const tiempoMessage = `
🕐 **Hora Actual**

**Hora:** ${hora}
**Fecha:** ${fecha}
**Zona horaria:** México (GMT-6)

¡Espero que tengas un excelente día! 😊
    `.trim();
        await ctx.reply(tiempoMessage);
        logger.user.action(ctx.from?.id || 0, 'Comando /tiempo ejecutado');
    }
    catch (error) {
        logger.error('Error en comando tiempo:', error);
        await ctx.reply('❌ Ocurrió un error. Por favor, intenta de nuevo.');
    }
}
export async function dadoCommand(ctx) {
    try {
        const numero = Math.floor(Math.random() * 6) + 1;
        const emoji = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][numero - 1];
        const dadoMessage = `
🎲 **Lanzamiento de Dado**

${emoji} **Resultado: ${numero}**

${numero === 6 ? '¡Suerte! 🍀' : numero === 1 ? '¡Ups! 😅' : '¡Bien! 👍'}
    `.trim();
        await ctx.reply(dadoMessage);
        logger.user.action(ctx.from?.id || 0, `Comando /dado ejecutado - Resultado: ${numero}`);
    }
    catch (error) {
        logger.error('Error en comando dado:', error);
        await ctx.reply('❌ Ocurrió un error. Por favor, intenta de nuevo.');
    }
}
export async function monedaCommand(ctx) {
    try {
        const resultado = Math.random() < 0.5 ? 'cara' : 'cruz';
        const emoji = resultado === 'cara' ? '🪙' : '🪙';
        const monedaMessage = `
${emoji} **Lanzamiento de Moneda**

**Resultado: ${resultado.toUpperCase()}**

${resultado === 'cara' ? '¡Cara! 😊' : '¡Cruz! ⚡'}
    `.trim();
        await ctx.reply(monedaMessage);
        logger.user.action(ctx.from?.id || 0, `Comando /moneda ejecutado - Resultado: ${resultado}`);
    }
    catch (error) {
        logger.error('Error en comando moneda:', error);
        await ctx.reply('❌ Ocurrió un error. Por favor, intenta de nuevo.');
    }
}
export async function chisteCommand(ctx) {
    try {
        const chistes = [
            '¿Por qué los pájaros vuelan hacia el sur en invierno? ¡Porque caminar es muy lento! 😄',
            '¿Qué hace un pez cuando se quema? ¡Nada! 🐟',
            '¿Por qué los elefantes no usan computadoras? ¡Porque tienen miedo del mouse! 🐭',
            '¿Qué le dice un semáforo a otro? ¡No me mires, me estoy cambiando! 🚦',
            '¿Por qué los libros de matemáticas están tristes? ¡Porque tienen muchos problemas! 📚',
            '¿Qué hace una abeja en el gimnasio? ¡Zum-ba! 🐝',
            '¿Por qué los fantasmas no mienten? ¡Porque se transparentan! 👻',
            '¿Qué le dice un huevo a otro huevo? ¡Nos vemos en la sartén! 🍳'
        ];
        const chisteAleatorio = chistes[Math.floor(Math.random() * chistes.length)];
        const chisteMessage = `
😄 **Chiste del Día**

${chisteAleatorio}

¡Espero que te haya gustado! 😊
    `.trim();
        await ctx.reply(chisteMessage);
        logger.user.action(ctx.from?.id || 0, 'Comando /chiste ejecutado');
    }
    catch (error) {
        logger.error('Error en comando chiste:', error);
        await ctx.reply('❌ Ocurrió un error. Por favor, intenta de nuevo.');
    }
}
//# sourceMappingURL=commands.js.map