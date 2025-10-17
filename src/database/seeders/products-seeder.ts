import { connectDatabase } from '../connection.js';
import { logger } from '../../utils/logger.js';

interface ProductData {
  id: number;
  producto: string;
  codigo_ref: string;
  marca_ejemplo: string;
  descripcion: string;
  precio_promedio_referencia: string;
  imagen_id: string;
  available_units: number;
}

// AgACAgEAAxkBAAMRaO1hFGleBQoV6rHttWceLxHRaBIAApELaxtP_WhHa0bvZ7Nv8_4BAAMCAAN5AAM2BA 
// AgACAgEAAxkBAAMSaO1hFNOtHpsFVECkZvz7OwEqVScAApILaxtP_WhH4W7PtJk7oz4BAAMCAAN5AAM2BA 
// AgACAgEAAxkBAAMTaO1hFO7N_hckaLKg9pQ-Bh8VHQQAApMLaxtP_WhHQbjbeJL5WmsBAAMCAAN5AAM2BA
// AgACAgEAAxkBAAMUaO1hFOu7bOSwCuqK7_YJ6F6MXCgAApQLaxtP_WhHXGEd57bX3aEBAAMCAAN5AAM2BA
// AgACAgEAAxkBAAMVaO1hFEPSUKkUOGTMJ3gD-fSnslcAApULaxtP_WhHogzlmiHnBWwBAAMCAAN5AAM2BA
// AgACAgEAAxkBAAMWaO1hFLJgBbcm_6O7MJoE3lszmzMAApYLaxtP_WhH6yz1TJJV-PYBAAMCAAN5AAM2BA
// AgACAgEAAxkBAAMXaO1hFOrErlt-AZLQbOTK_mWQOr4AApcLaxtP_WhHRyHoggABzX8LAQADAgADeQADNgQ
// AgACAgEAAxkBAAMYaO1hFD2i2nRTHBWr1vL49U8uTxMAApgLaxtP_WhHltTkQctng3YBAAMCAAN5AAM2BA 
// AgACAgEAAxkBAAMZaO1hFMDX6xVbE3CvO4acG5ZCjaIAApkLaxtP_WhHpxkNZ9CbUVkBAAMCAAN4AAM2BA
// AgACAgEAAxkBAAMaaO1hFDq-FftbKg39cYg9lLMYcggAApoLaxtP_WhHtoP3DiNJr24BAAMCAAN4AAM2BA
// AgACAgEAAxkBAAMbaO1hFEImQQlX-_l0mxm67I898CgAApsLaxtP_WhHEtX8aFx_PMYBAAMCAAN5AAM2BA 
// AgACAgEAAxkBAAMcaO1hFE1fKwKdAAGUccdv--WFaVFgAAKcC2sbT_1oR28DnKEO-_5sAQADAgADbQADNgQ 
// AgACAgEAAxkBAAMdaO1hFCbni8fMCA486ikbbAb2F3oAAp0LaxtP_WhHHWLsINqdHzUBAAMCAAN5AAM2BA 
// AgACAgEAAxkBAAMeaO1hFKiUKYPXBFiWtX7gmub95EQAAp4LaxtP_WhHvaKaNH5CnUIBAAMCAANtAAM2BA 
// AgACAgEAAxkBAAMfaO1hFMNzt8wG4NKQNWjBBOVYtGMAAp8LaxtP_WhH6qXnOTVSFE0BAAMCAAN5AAM2BA

const productsData: ProductData[] = [
  {
    "id": 1,
    "producto": "Freidora de Aire (Air Fryer)",
    "codigo_ref": "AF-5000",
    "marca_ejemplo": "Cosori",
    "descripcion": "Freidora de aire digital con 5 litros de capacidad y 7 programas preestablecidos. Potencia de 1500W.",
    "precio_promedio_referencia": "$90",
    "imagen_id": "AgACAgEAAxkBAAMRaO1hFGleBQoV6rHttWceLxHRaBIAApELaxtP_WhHa0bvZ7Nv8_4BAAMCAAN5AAM2BA",
    "available_units": 3
  },
  {
    "id": 2,
    "producto": "Cafetera de Goteo",
    "codigo_ref": "CG-12T",
    "marca_ejemplo": "Taurus",
    "descripcion": "Cafetera eléctrica de goteo con jarra de cristal de 1.2 litros (10-12 tazas) y función de mantener caliente.",
    "precio_promedio_referencia": "$27",
    "imagen_id": "AgACAgEAAxkBAAMSaO1hFNOtHpsFVECkZvz7OwEqVScAApILaxtP_WhH4W7PtJk7oz4BAAMCAAN5AAM2BA",
    "available_units": 4
  },
  {
    "id": 3,
    "producto": "Licuadora de Vaso",
    "codigo_ref": "LV-750P",
    "marca_ejemplo": "Oster",
    "descripcion": "Licuadora de vaso de 1.5 litros, 3 velocidades, función pulse y cuchillas de acero inoxidable. Potencia de 750W.",
    "precio_promedio_referencia": "$45",
    "imagen_id": "AgACAgEAAxkBAAMTaO1hFO7N_hckaLKg9pQ-Bh8VHQQAApMLaxtP_WhHQbjbeJL5WmsBAAMCAAN5AAM2BA",
    "available_units": 0
  },
  {
    "id": 4,
    "producto": "Batidora de Mano (Minipimer)",
    "codigo_ref": "BM-1000X",
    "marca_ejemplo": "Bosch",
    "descripcion": "Batidora de mano con motor de 1000W. Incluye pie de acero inoxidable, vaso medidor y accesorio picador.",
    "precio_promedio_referencia": "$60",
    "imagen_id": "AgACAgEAAxkBAAMUaO1hFOu7bOSwCuqK7_YJ6F6MXCgAApQLaxtP_WhHXGEd57bX3aEBAAMCAAN5AAM2BA",
    "available_units": 2
  },
  {
    "id": 5,
    "producto": "Tostadora Ranura Larga",
    "codigo_ref": "TR-2XL",
    "marca_ejemplo": "Philips",
    "descripcion": "Tostadora con ranuras extra largas y anchas, ideal para 2 rebanadas grandes o 4 estándar. Control de tostado.",
    "precio_promedio_referencia": "$33",
    "imagen_id": "AgACAgEAAxkBAAMVaO1hFEPSUKkUOGTMJ3gD-fSnslcAApULaxtP_WhHogzlmiHnBWwBAAMCAAN5AAM2BA",
    "available_units": 3
  },
  {
    "id": 6,
    "producto": "Microondas con Grill",
    "codigo_ref": "MG-20L",
    "marca_ejemplo": "Samsung",
    "descripcion": "Microondas de 20 litros de capacidad. Con función de grill. 6 niveles de potencia y temporizador digital.",
    "precio_promedio_referencia": "$100",
    "imagen_id": "AgACAgEAAxkBAAMWaO1hFLJgBbcm_6O7MJoE3lszmzMAApYLaxtP_WhH6yz1TJJV-PYBAAMCAAN5AAM2BA",
    "available_units": 2
  },
  {
    "id": 7,
    "producto": "Hervidor de Agua Eléctrico",
    "codigo_ref": "HA-17E",
    "marca_ejemplo": "Princess",
    "descripcion": "Hervidor eléctrico de acero inoxidable con capacidad de 1.7 litros. Apagado automático y base giratoria 360°.",
    "precio_promedio_referencia": "$22",
    "imagen_id": "AgACAgEAAxkBAAMXaO1hFOrErlt-AZLQbOTK_mWQOr4AApcLaxtP_WhHRyHoggABzX8LAQADAgADeQADNgQ",
    "available_units": 5
  },
  {
    "id": 8,
    "producto": "Robot Aspirador",
    "codigo_ref": "RA-R300",
    "marca_ejemplo": "Xiaomi",
    "descripcion": "Robot aspirador con navegación inteligente. Control por app móvil y regresa a la base automáticamente.",
    "precio_promedio_referencia": "$195",
    "imagen_id": "AgACAgEAAxkBAAMYaO1hFD2i2nRTHBWr1vL49U8uTxMAApgLaxtP_WhHltTkQctng3YBAAMCAAN5AAM2BA",
    "available_units": 0
  },
  {
    "id": 9,
    "producto": "Plancha de Vapor",
    "codigo_ref": "PV-2400",
    "marca_ejemplo": "Tefal",
    "descripcion": "Plancha de vapor con suela cerámica antiadherente. Golpe de vapor de 150g/min y 2400W de potencia.",
    "precio_promedio_referencia": "$50",
    "imagen_id": "AgACAgEAAxkBAAMZaO1hFMDX6xVbE3CvO4acG5ZCjaIAApkLaxtP_WhHpxkNZ9CbUVkBAAMCAAN4AAM2BA",
    "available_units": 2
  },
  {
    "id": 10,
    "producto": "Secador de Pelo Profesional",
    "codigo_ref": "SP-2200D",
    "marca_ejemplo": "Remington",
    "descripcion": "Secador con motor AC de 2200W, 3 temperaturas, 2 velocidades y botón de aire frío. Incluye boquilla y difusor.",
    "precio_promedio_referencia": "$38",
    "imagen_id": "AgACAgEAAxkBAAMaaO1hFDq-FftbKg39cYg9lLMYcggAApoLaxtP_WhHtoP3DiNJr24BAAMCAAN4AAM2BA",
    "available_units": 3
  },
  {
    "id": 11,
    "producto": "Plancha de Pelo (Alisadora)",
    "codigo_ref": "PP-IONC",
    "marca_ejemplo": "Philips",
    "descripcion": "Plancha alisadora con placas de cerámica con tecnología iónica. Calentamiento rápido y temperatura ajustable.",
    "precio_promedio_referencia": "$45",
    "imagen_id": "AgACAgEAAxkBAAMbaO1hFEImQQlX-_l0mxm67I898CgAApsLaxtP_WhHEtX8aFx_PMYBAAMCAAN5AAM2BA",
    "available_units": 4
  },
  {
    "id": 12,
    "producto": "Báscula de Baño Digital",
    "codigo_ref": "BD-SMART",
    "marca_ejemplo": "Beurer",
    "descripcion": "Báscula digital de vidrio templado para medición de peso. Diseño extraplano y apagado automático.",
    "precio_promedio_referencia": "$22",
    "imagen_id": "AgACAgEAAxkBAAMcaO1hFE1fKwKdAAGUccdv--WFaVFgAAKcC2sbT_1oR28DnKEO-_5sAQADAgADbQADNgQ",
    "available_units": 5
  },
  {
    "id": 13,
    "producto": "Ventilador de Torre",
    "codigo_ref": "VT-90CM",
    "marca_ejemplo": "Solac",
    "descripcion": "Ventilador oscilante de columna (torre) de 90 cm. Ofrece 3 velocidades y temporizador programable.",
    "precio_promedio_referencia": "$45",
    "imagen_id": "AgACAgEAAxkBAAMdaO1hFCbni8fMCA486ikbbAb2F3oAAp0LaxtP_WhHHWLsINqdHzUBAAMCAAN5AAM2BA",
    "available_units": 4
  },
  {
    "id": 14,
    "producto": "Picadora Eléctrica",
    "codigo_ref": "PE-500G",
    "marca_ejemplo": "Kenwood",
    "descripcion": "Picadora de alimentos con bol de cristal de 500 ml. Cuchillas de doble filo para picar y triturar. Potencia de 500W.",
    "precio_promedio_referencia": "$33",
    "imagen_id": "AgACAgEAAxkBAAMeaO1hFKiUKYPXBFiWtX7gmub95EQAAp4LaxtP_WhHvaKaNH5CnUIBAAMCAANtAAM2BA",
    "available_units": 3
  },
  {
    "id": 15,
    "producto": "Exprimidor Eléctrico",
    "codigo_ref": "EE-40W",
    "marca_ejemplo": "Braun",
    "descripcion": "Exprimidor de cítricos eléctrico con doble sentido de giro del cono y sistema anti-goteo. Potencia de 40W.",
    "precio_promedio_referencia": "$20",
    "imagen_id": "AgACAgEAAxkBAAMfaO1hFMNzt8wG4NKQNWjBBOVYtGMAAp8LaxtP_WhH6qXnOTVSFE0BAAMCAAN5AAM2BA",
    "available_units": 5
  }
];

/**
 * Convierte el precio de string a número
 * @param priceString Precio en formato "$XX"
 * @returns Número del precio
 */
function parsePrice(priceString: string): number {
  const cleanPrice = priceString.replace('$', '').trim();
  return parseFloat(cleanPrice);
}

/**
 * Ejecuta el seeder de productos
 */
export async function seedProducts(): Promise<void> {
  try {
    console.log('📊 Iniciando seeder de productos...');
    logger.info('Iniciando seeder de productos...');
    
    console.log('🔌 Conectando a la base de datos...');
    const db = await connectDatabase();
    console.log('✅ Base de datos conectada');
    
    // Verificar si ya existen productos
    console.log('🔍 Verificando productos existentes...');
    const checkQuery = 'SELECT COUNT(*) as count FROM products';
    const existingProducts = await new Promise<number>((resolve, reject) => {
      db.get(checkQuery, (err: any, row: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row.count);
      });
    });

    console.log(`📦 Productos existentes: ${existingProducts}`);

    if (existingProducts > 0) {
      console.log(`⚠️  Ya existen ${existingProducts} productos en la base de datos.`);
      logger.warn(`Ya existen ${existingProducts} productos en la base de datos.`);
      const shouldContinue = process.argv.includes('--force');
      if (!shouldContinue) {
        console.log('💡 Usa --force para sobrescribir los datos existentes.');
        logger.info('Usa --force para sobrescribir los datos existentes.');
        return;
      }
      
      // Limpiar productos existentes
      console.log('🗑️  Limpiando productos existentes...');
      logger.info('Limpiando productos existentes...');
      await new Promise<void>((resolve, reject) => {
        db.run('DELETE FROM products', (err: any) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
      console.log('✅ Productos existentes eliminados');
    }

    // Insertar productos
    console.log(`📝 Insertando ${productsData.length} productos...`);
    let insertedCount = 0;
    for (const product of productsData) {
      try {
        const price = parsePrice(product.precio_promedio_referencia);
        console.log(`➕ Insertando: ${product.producto} (${product.codigo_ref}) - $${price}`);
        
        await new Promise<void>((resolve, reject) => {
          const insertQuery = `
            INSERT INTO products (code, brand, image_file_id, price, description, available_units)
            VALUES (?, ?, ?, ?, ?, ?)
          `;
          
          db.run(
            insertQuery,
            [
              product.codigo_ref,
              product.marca_ejemplo,
              product.imagen_id, // Usando imagen_id como file_id de Telegram
              price,
              `${product.producto} - ${product.descripcion}`,
              product.available_units // Unidades disponibles por defecto
            ],
            (err: any) => {
              if (err) {
                reject(err);
                return;
              }
              resolve();
            }
          );
        });
        
        insertedCount++;
        console.log(`✅ Producto insertado: ${product.producto}`);
        logger.debug(`Producto insertado: ${product.producto} (${product.codigo_ref})`);
        
      } catch (error) {
        console.error(`❌ Error insertando producto ${product.producto}:`, error);
        logger.error(`Error insertando producto ${product.producto}:`, error);
        throw error;
      }
    }

    console.log(`🎉 Seeder completado. ${insertedCount} productos insertados.`);
    logger.info(`Seeder completado. ${insertedCount} productos insertados.`);
    
  } catch (error) {
    logger.error('Error ejecutando seeder de productos:', error);
    throw error;
  }
}

/**
 * Función principal para ejecutar el seeder
 */
async function main() {
  try {
    console.log('🚀 Iniciando seeder de productos...');
    await seedProducts();
    console.log('✅ Seeder completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seeder:', error);
    logger.error('Error en seeder:', error);
    process.exit(1);
  }
}

// Ejecutar siempre que se llame el archivo
main();