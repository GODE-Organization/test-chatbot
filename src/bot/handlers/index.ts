import { Telegraf } from 'telegraf'
import type { BotContext } from '../../types/bot.js'
import { 
  startCommand, 
  helpCommand, 
  settingsCommand, 
  statsCommand, 
  contactCommand, 
  resetCommand 
} from './commands.js'
import { 
  handleSettingsCallbacks,
  handleLanguageCallbacks,
  handleNotificationCallbacks,
  handleHelpCallbacks
} from './callbacks.js'
import { 
  handleTextMessage,
  handlePhotoMessage,
  handleDocumentMessage,
  handleStickerMessage,
  handleVoiceMessage,
  handleLocationMessage,
  handleContactMessage
} from './messages.js'

/**
 * Configurar todos los handlers del bot
 */
export async function setupHandlers(bot: Telegraf<BotContext>): Promise<void> {
  // Comandos principales
  bot.command('start', startCommand)
  bot.command('help', helpCommand)
  bot.command('settings', settingsCommand)
  bot.command('stats', statsCommand)
  bot.command('contact', contactCommand)
  bot.command('reset', resetCommand)

  // Callbacks de configuración
  bot.action(/^settings_/, handleSettingsCallbacks)
  bot.action(/^lang_/, handleLanguageCallbacks)
  bot.action(/^notif_/, handleNotificationCallbacks)
  bot.action(/^theme_/, handleSettingsCallbacks)
  bot.action(/^privacy_/, handleSettingsCallbacks)
  bot.action(/^help_/, handleHelpCallbacks)
  bot.action(/^back_/, handleSettingsCallbacks)
  bot.action(/^confirm_/, handleSettingsCallbacks)
  bot.action(/^cancel_/, handleSettingsCallbacks)

  // Manejo de mensajes por tipo
  bot.on('text', handleTextMessage)
  bot.on('photo', handlePhotoMessage)
  bot.on('document', handleDocumentMessage)
  bot.on('sticker', handleStickerMessage)
  bot.on('voice', handleVoiceMessage)
  bot.on('location', handleLocationMessage)
  bot.on('contact', handleContactMessage)

  // Manejo de mensajes de grupo/supergrupo
  bot.on('new_chat_members', async (ctx) => {
    const newMembers = ctx.message && 'new_chat_members' in ctx.message ? ctx.message.new_chat_members : []
    for (const member of newMembers) {
      if (member.is_bot && member.id === ctx.botInfo.id) {
        await ctx.reply('¡Hola! 👋 Gracias por agregarme al grupo. Usa /help para ver los comandos disponibles.')
      }
    }
  })

  bot.on('left_chat_member', async (ctx) => {
    const leftMember = ctx.message && 'left_chat_member' in ctx.message ? ctx.message.left_chat_member : null
    if (leftMember && leftMember.is_bot && leftMember.id === ctx.botInfo.id) {
      // El bot fue removido del grupo
      console.log('Bot removido del grupo:', ctx.chat?.id)
    }
  })

  // Manejo de errores específicos
  bot.on('callback_query', async (ctx) => {
    try {
      await ctx.answerCbQuery()
    } catch (error) {
      console.error('Error en callback query:', error)
    }
  })
}
