import { logger } from './logger.js'

/**
 * Lista de funciones de limpieza a ejecutar durante el shutdown
 */
const cleanupFunctions: Array<() => Promise<void> | void> = []

/**
 * Registrar una función de limpieza
 */
export function registerCleanupFunction(fn: () => Promise<void> | void): void {
  cleanupFunctions.push(fn)
}

/**
 * Ejecutar todas las funciones de limpieza registradas
 */
export async function gracefulShutdown(): Promise<void> {
  logger.info('🧹 Iniciando limpieza del sistema...')
  
  const promises = cleanupFunctions.map(async (fn, index) => {
    try {
      await fn()
      logger.debug(`✅ Función de limpieza ${index + 1} ejecutada correctamente`)
    } catch (error) {
      logger.error(`❌ Error en función de limpieza ${index + 1}:`, error)
    }
  })
  
  await Promise.allSettled(promises)
  logger.info('✅ Limpieza del sistema completada')
}

/**
 * Configurar manejo de señales del sistema
 */
export function setupGracefulShutdown(): void {
  // Manejar SIGINT (Ctrl+C)
  process.once('SIGINT', async () => {
    logger.info('🛑 Recibida señal SIGINT, cerrando aplicación...')
    await gracefulShutdown()
    process.exit(0)
  })
  
  // Manejar SIGTERM
  process.once('SIGTERM', async () => {
    logger.info('🛑 Recibida señal SIGTERM, cerrando aplicación...')
    await gracefulShutdown()
    process.exit(0)
  })
  
  // Manejar errores no capturados
  process.on('uncaughtException', async (error) => {
    logger.error('💥 Error no capturado:', error)
    await gracefulShutdown()
    process.exit(1)
  })
  
  // Manejar promesas rechazadas
  process.on('unhandledRejection', async (reason, promise) => {
    logger.error('💥 Promesa rechazada no manejada:', { reason, promise })
    await gracefulShutdown()
    process.exit(1)
  })
}
