import { Markup } from 'telegraf'
import type { KeyboardConfig } from '../../types/bot.js'

/**
 * Teclados principales del bot
 */

/**
 * Teclado principal del menú
 */
export function getMainMenuKeyboard() {
  return Markup.keyboard([
    ['📊 Estadísticas', '⚙️ Configuración'],
    ['ℹ️ Ayuda', '📞 Contacto'],
    ['🔄 Reiniciar']
  ])
  .resize()
  .oneTime()
}

/**
 * Teclado de configuración
 */
export function getSettingsKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🔔 Notificaciones', 'settings_notifications'),
      Markup.button.callback('🌐 Idioma', 'settings_language')
    ],
    [
      Markup.button.callback('📱 Tema', 'settings_theme'),
      Markup.button.callback('🔒 Privacidad', 'settings_privacy')
    ],
    [
      Markup.button.callback('⬅️ Volver al menú', 'back_to_main')
    ]
  ])
}

/**
 * Teclado de idiomas
 */
export function getLanguageKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🇪🇸 Español', 'lang_es'),
      Markup.button.callback('🇺🇸 English', 'lang_en')
    ],
    [
      Markup.button.callback('🇫🇷 Français', 'lang_fr'),
      Markup.button.callback('🇩🇪 Deutsch', 'lang_de')
    ],
    [
      Markup.button.callback('⬅️ Volver', 'back_to_settings')
    ]
  ])
}

/**
 * Teclado de confirmación
 */
export function getConfirmationKeyboard(action: string) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Sí', `confirm_${action}`),
      Markup.button.callback('❌ No', `cancel_${action}`)
    ]
  ])
}

/**
 * Teclado de navegación
 */
export function getNavigationKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('⬅️ Anterior', 'nav_prev'),
      Markup.button.callback('➡️ Siguiente', 'nav_next')
    ],
    [
      Markup.button.callback('🏠 Inicio', 'nav_home')
    ]
  ])
}

/**
 * Teclado de opciones de notificación
 */
export function getNotificationKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🔔 Todas', 'notif_all'),
      Markup.button.callback('🔕 Ninguna', 'notif_none')
    ],
    [
      Markup.button.callback('📢 Importantes', 'notif_important'),
      Markup.button.callback('📱 Solo mensajes', 'notif_messages')
    ],
    [
      Markup.button.callback('⬅️ Volver', 'back_to_settings')
    ]
  ])
}

/**
 * Teclado de temas
 */
export function getThemeKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🌞 Claro', 'theme_light'),
      Markup.button.callback('🌙 Oscuro', 'theme_dark')
    ],
    [
      Markup.button.callback('🎨 Automático', 'theme_auto')
    ],
    [
      Markup.button.callback('⬅️ Volver', 'back_to_settings')
    ]
  ])
}

/**
 * Teclado de privacidad
 */
export function getPrivacyKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('👤 Perfil público', 'privacy_public'),
      Markup.button.callback('🔒 Perfil privado', 'privacy_private')
    ],
    [
      Markup.button.callback('📊 Compartir estadísticas', 'privacy_stats'),
      Markup.button.callback('🚫 No compartir', 'privacy_no_share')
    ],
    [
      Markup.button.callback('⬅️ Volver', 'back_to_settings')
    ]
  ])
}

/**
 * Teclado de ayuda
 */
export function getHelpKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('📖 Comandos', 'help_commands'),
      Markup.button.callback('❓ Preguntas frecuentes', 'help_faq')
    ],
    [
      Markup.button.callback('🐛 Reportar error', 'help_bug'),
      Markup.button.callback('💡 Sugerir mejora', 'help_suggestion')
    ],
    [
      Markup.button.callback('⬅️ Volver al menú', 'back_to_main')
    ]
  ])
}

/**
 * Teclado de contacto
 */
export function getContactKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.url('📧 Email', 'mailto:support@example.com'),
      Markup.button.url('🌐 Sitio web', 'https://example.com')
    ],
    [
      Markup.button.url('📱 Telegram', 'https://t.me/username'),
      Markup.button.url('🐙 GitHub', 'https://github.com/username')
    ],
    [
      Markup.button.callback('⬅️ Volver al menú', 'back_to_main')
    ]
  ])
}

/**
 * Teclado personalizado basado en configuración
 */
export function createCustomKeyboard(config: KeyboardConfig[][]) {
  const buttons = config.map(row => 
    row.map(button => {
      if (button.url) {
        return Markup.button.url(button.text, button.url)
      } else if (button.callback_data) {
        return Markup.button.callback(button.text, button.callback_data)
      } else {
        return Markup.button.text(button.text)
      }
    })
  )
  
  return Markup.keyboard(buttons).resize()
}

/**
 * Teclado inline personalizado
 */
export function createCustomInlineKeyboard(config: KeyboardConfig[][]) {
  const buttons = config.map(row => 
    row.map(button => {
      if (button.url) {
        return Markup.button.url(button.text, button.url)
      } else if (button.callback_data) {
        return Markup.button.callback(button.text, button.callback_data)
      } else {
        return Markup.button.callback(button.text, button.text)
      }
    })
  )
  
  return Markup.inlineKeyboard(buttons)
}
