import { logger } from './logger.js';

export interface DolarApiResponse {
  fuente: string;
  nombre: string;
  compra: number | null;
  venta: number | null;
  promedio: number;
  fechaActualizacion: string;
}

export interface CurrencyConversionResult {
  success: boolean;
  data?: {
    usdToBsRate: number;
    lastUpdated: string;
  };
  error?: string;
}

export class CurrencyConverter {
  private static readonly DOLAR_API_URL = 'https://ve.dolarapi.com/v1/dolares/oficial';
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos
  private static cache: {
    data: CurrencyConversionResult;
    timestamp: number;
  } | null = null;

  /**
   * Obtiene la tasa de conversión USD a Bs desde la API de dolarapi.com
   * Incluye cache para evitar llamadas excesivas a la API
   */
  static async getUsdToBsRate(): Promise<CurrencyConversionResult> {
    try {
      // Verificar si tenemos datos en cache válidos
      if (this.cache && Date.now() - this.cache.timestamp < this.CACHE_DURATION) {
        logger.info('Usando datos de conversión desde cache');
        return this.cache.data;
      }

      logger.info('Obteniendo tasa de conversión USD a Bs desde API');
      
      const response = await fetch(this.DOLAR_API_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GODE-Chatbot/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Error en la API: ${response.status} ${response.statusText}`);
      }

      const data: DolarApiResponse = await response.json();
      
      if (!data.promedio || data.promedio <= 0) {
        throw new Error('Tasa de conversión inválida recibida de la API');
      }

      const result: CurrencyConversionResult = {
        success: true,
        data: {
          usdToBsRate: data.promedio,
          lastUpdated: data.fechaActualizacion
        }
      };

      // Actualizar cache
      this.cache = {
        data: result,
        timestamp: Date.now()
      };

      logger.info(`Tasa de conversión obtenida: 1 USD = ${data.promedio} Bs`);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error('Error obteniendo tasa de conversión:', errorMessage);
      
      const result: CurrencyConversionResult = {
        success: false,
        error: errorMessage
      };

      return result;
    }
  }

  /**
   * Convierte un precio en USD a Bs usando la tasa actual
   */
  static async convertUsdToBs(usdPrice: number): Promise<{
    success: boolean;
    data?: {
      usdPrice: number;
      bsPrice: number;
      rate: number;
      lastUpdated: string;
    };
    error?: string;
  }> {
    try {
      const rateResult = await this.getUsdToBsRate();
      
      if (!rateResult.success || !rateResult.data) {
        return {
          success: false,
          error: rateResult.error || 'No se pudo obtener la tasa de conversión'
        };
      }

      const bsPrice = usdPrice * rateResult.data.usdToBsRate;

      return {
        success: true,
        data: {
          usdPrice,
          bsPrice: Math.round(bsPrice * 100) / 100, // Redondear a 2 decimales
          rate: rateResult.data.usdToBsRate,
          lastUpdated: rateResult.data.lastUpdated
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error('Error convirtiendo precio:', errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Limpia el cache de conversión (útil para testing o forzar actualización)
   */
  static clearCache(): void {
    this.cache = null;
    logger.info('Cache de conversión limpiado');
  }
}
