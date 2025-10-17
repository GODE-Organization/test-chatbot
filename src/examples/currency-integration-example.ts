import { productModel } from '../database/models.js';
import { CurrencyConverter } from '../utils/currency-converter.js';

/**
 * Ejemplo de uso de la integración de conversión de moneda
 */
export class CurrencyIntegrationExample {
  
  /**
   * Ejemplo: Obtener todos los productos con precios en bolívares
   */
  static async getAllProductsWithBsPrice() {
    console.log('=== Obtener todos los productos con precios en bolívares ===');
    
    try {
      const result = await productModel.getAllProductsWithBsPrice({
        limit: 5 // Limitar a 5 productos para el ejemplo
      });

      if (result.success && result.data) {
        console.log('Productos obtenidos exitosamente:');
        result.data.forEach((product, index) => {
          console.log(`\n${index + 1}. ${product.brand} - ${product.code}`);
          console.log(`   Precio USD: $${product.price}`);
          if (product.price_bs) {
            console.log(`   Precio Bs: ${product.price_bs.toLocaleString()} Bs`);
            console.log(`   Tasa de conversión: 1 USD = ${product.conversion_rate} Bs`);
            console.log(`   Última actualización: ${product.conversion_last_updated}`);
          } else {
            console.log(`   Error en conversión: ${product.conversion_error}`);
          }
        });
      } else {
        console.error('Error obteniendo productos:', result.error);
      }
    } catch (error) {
      console.error('Error en el ejemplo:', error);
    }
  }

  /**
   * Ejemplo: Obtener un producto específico por código con precio en bolívares
   */
  static async getProductByCodeWithBsPrice(code: string) {
    console.log(`\n=== Obtener producto por código: ${code} ===`);
    
    try {
      const result = await productModel.getProductByCodeWithBsPrice(code);

      if (result.success && result.data) {
        const product = result.data;
        console.log(`Producto encontrado: ${product.brand} - ${product.code}`);
        console.log(`Precio USD: $${product.price}`);
        if (product.price_bs) {
          console.log(`Precio Bs: ${product.price_bs.toLocaleString()} Bs`);
          console.log(`Tasa de conversión: 1 USD = ${product.conversion_rate} Bs`);
          console.log(`Última actualización: ${product.conversion_last_updated}`);
        } else {
          console.log(`Error en conversión: ${product.conversion_error}`);
        }
      } else {
        console.log('Producto no encontrado o error:', result.error);
      }
    } catch (error) {
      console.error('Error en el ejemplo:', error);
    }
  }

  /**
   * Ejemplo: Obtener un producto específico por ID con precio en bolívares
   */
  static async getProductByIdWithBsPrice(id: number) {
    console.log(`\n=== Obtener producto por ID: ${id} ===`);
    
    try {
      const result = await productModel.getProductByIdWithBsPrice(id);

      if (result.success && result.data) {
        const product = result.data;
        console.log(`Producto encontrado: ${product.brand} - ${product.code}`);
        console.log(`Precio USD: $${product.price}`);
        if (product.price_bs) {
          console.log(`Precio Bs: ${product.price_bs.toLocaleString()} Bs`);
          console.log(`Tasa de conversión: 1 USD = ${product.conversion_rate} Bs`);
          console.log(`Última actualización: ${product.conversion_last_updated}`);
        } else {
          console.log(`Error en conversión: ${product.conversion_error}`);
        }
      } else {
        console.log('Producto no encontrado o error:', result.error);
      }
    } catch (error) {
      console.error('Error en el ejemplo:', error);
    }
  }

  /**
   * Ejemplo: Obtener solo la tasa de conversión
   */
  static async getCurrentExchangeRate() {
    console.log('\n=== Obtener tasa de conversión actual ===');
    
    try {
      const result = await CurrencyConverter.getUsdToBsRate();

      if (result.success && result.data) {
        console.log(`Tasa de conversión: 1 USD = ${result.data.usdToBsRate} Bs`);
        console.log(`Última actualización: ${result.data.lastUpdated}`);
      } else {
        console.error('Error obteniendo tasa de conversión:', result.error);
      }
    } catch (error) {
      console.error('Error en el ejemplo:', error);
    }
  }

  /**
   * Ejemplo: Convertir un precio específico
   */
  static async convertSpecificPrice(usdPrice: number) {
    console.log(`\n=== Convertir precio específico: $${usdPrice} ===`);
    
    try {
      const result = await CurrencyConverter.convertUsdToBs(usdPrice);

      if (result.success && result.data) {
        console.log(`Precio USD: $${result.data.usdPrice}`);
        console.log(`Precio Bs: ${result.data.bsPrice.toLocaleString()} Bs`);
        console.log(`Tasa utilizada: 1 USD = ${result.data.rate} Bs`);
        console.log(`Última actualización: ${result.data.lastUpdated}`);
      } else {
        console.error('Error convirtiendo precio:', result.error);
      }
    } catch (error) {
      console.error('Error en el ejemplo:', error);
    }
  }

  /**
   * Ejecutar todos los ejemplos
   */
  static async runAllExamples() {
    console.log('🚀 Iniciando ejemplos de integración de conversión de moneda\n');
    
    // Ejemplo 1: Obtener todos los productos con precios en bolívares
    await this.getAllProductsWithBsPrice();
    
    // Ejemplo 2: Obtener producto por código (usar un código existente)
    await this.getProductByCodeWithBsPrice('PROD001');
    
    // Ejemplo 3: Obtener producto por ID (usar un ID existente)
    await this.getProductByIdWithBsPrice(1);
    
    // Ejemplo 4: Obtener tasa de conversión actual
    await this.getCurrentExchangeRate();
    
    // Ejemplo 5: Convertir precio específico
    await this.convertSpecificPrice(100);
    
    console.log('\n✅ Ejemplos completados');
  }
}

// Si se ejecuta directamente, correr todos los ejemplos
if (import.meta.url === `file://${process.argv[1]}`) {
  CurrencyIntegrationExample.runAllExamples().catch(console.error);
}
