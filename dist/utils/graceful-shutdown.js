import { logger } from './logger.js';
const cleanupFunctions = [];
export function registerCleanupFunction(fn) {
    cleanupFunctions.push(fn);
}
export async function gracefulShutdown() {
    logger.info('🧹 Iniciando limpieza del sistema...');
    const promises = cleanupFunctions.map(async (fn, index) => {
        try {
            await fn();
            logger.debug(`✅ Función de limpieza ${index + 1} ejecutada correctamente`);
        }
        catch (error) {
            logger.error(`❌ Error en función de limpieza ${index + 1}:`, error);
        }
    });
    await Promise.allSettled(promises);
    logger.info('✅ Limpieza del sistema completada');
}
export function setupGracefulShutdown() {
    process.once('SIGINT', async () => {
        logger.info('🛑 Recibida señal SIGINT, cerrando aplicación...');
        await gracefulShutdown();
        process.exit(0);
    });
    process.once('SIGTERM', async () => {
        logger.info('🛑 Recibida señal SIGTERM, cerrando aplicación...');
        await gracefulShutdown();
        process.exit(0);
    });
    process.on('uncaughtException', async (error) => {
        logger.error('💥 Error no capturado:', error);
        await gracefulShutdown();
        process.exit(1);
    });
    process.on('unhandledRejection', async (reason, promise) => {
        logger.error('💥 Promesa rechazada no manejada:', { reason, promise });
        await gracefulShutdown();
        process.exit(1);
    });
}
//# sourceMappingURL=graceful-shutdown.js.map