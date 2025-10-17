/**
 * Script de prueba para la integración de conversión de moneda
 * Ejecutar con: node test-currency-integration.js
 */

import { CurrencyConverter } from './dist/utils/currency-converter.js';

async function testCurrencyIntegration() {
  console.log('🧪 Iniciando pruebas de integración de conversión de moneda\n');

  try {
    // Prueba 1: Obtener tasa de conversión
    console.log('1️⃣ Probando obtención de tasa de conversión...');
    const rateResult = await CurrencyConverter.getUsdToBsRate();
    
    if (rateResult.success && rateResult.data) {
      console.log(`✅ Tasa obtenida: 1 USD = ${rateResult.data.usdToBsRate} Bs`);
      console.log(`   Última actualización: ${rateResult.data.lastUpdated}`);
    } else {
      console.log(`❌ Error obteniendo tasa: ${rateResult.error}`);
    }

    // Prueba 2: Convertir precio específico
    console.log('\n2️⃣ Probando conversión de precio específico...');
    const conversionResult = await CurrencyConverter.convertUsdToBs(50);
    
    if (conversionResult.success && conversionResult.data) {
      console.log(`✅ Conversión exitosa:`);
      console.log(`   $${conversionResult.data.usdPrice} USD = ${conversionResult.data.bsPrice.toLocaleString()} Bs`);
      console.log(`   Tasa utilizada: 1 USD = ${conversionResult.data.rate} Bs`);
    } else {
      console.log(`❌ Error en conversión: ${conversionResult.error}`);
    }

    // Prueba 3: Verificar cache
    console.log('\n3️⃣ Probando cache (segunda llamada debería usar cache)...');
    const startTime = Date.now();
    const cachedResult = await CurrencyConverter.getUsdToBsRate();
    const endTime = Date.now();
    
    if (cachedResult.success && cachedResult.data) {
      console.log(`✅ Cache funcionando (${endTime - startTime}ms)`);
      console.log(`   Tasa: 1 USD = ${cachedResult.data.usdToBsRate} Bs`);
    } else {
      console.log(`❌ Error con cache: ${cachedResult.error}`);
    }

    // Prueba 4: Limpiar cache
    console.log('\n4️⃣ Probando limpieza de cache...');
    CurrencyConverter.clearCache();
    console.log('✅ Cache limpiado');

    // Prueba 5: Conversión con diferentes precios
    console.log('\n5️⃣ Probando conversión con diferentes precios...');
    const testPrices = [10, 25.50, 100, 250.75, 1000];
    
    for (const price of testPrices) {
      const result = await CurrencyConverter.convertUsdToBs(price);
      if (result.success && result.data) {
        console.log(`   $${price} USD = ${result.data.bsPrice.toLocaleString()} Bs`);
      } else {
        console.log(`   $${price} USD = Error: ${result.error}`);
      }
    }

    console.log('\n🎉 Pruebas completadas exitosamente!');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  }
}

// Ejecutar pruebas
testCurrencyIntegration().catch(console.error);
