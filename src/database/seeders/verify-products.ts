import { connectDatabase } from '../connection.js';

async function verifyProducts() {
  try {
    console.log('🔍 Verificando productos en la base de datos...');
    
    const db = await connectDatabase();
    
    // Contar productos
    const countResult = await new Promise<number>((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM products', (err: any, row: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row.count);
      });
    });
    
    console.log(`📦 Total de productos: ${countResult}`);
    
    // Mostrar algunos productos de ejemplo
    const sampleProducts = await new Promise<any[]>((resolve, reject) => {
      db.all('SELECT code, brand, price, description FROM products LIMIT 5', (err: any, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows || []);
      });
    });
    
    console.log('\n📋 Primeros 5 productos:');
    sampleProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.brand} - ${product.code} - $${product.price}`);
      console.log(`   ${product.description.substring(0, 80)}...`);
    });
    
    // Verificar que las imágenes están guardadas
    const imageCount = await new Promise<number>((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM products WHERE image_file_id IS NOT NULL', (err: any, row: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row.count);
      });
    });
    
    console.log(`\n🖼️  Productos con imágenes: ${imageCount}/${countResult}`);
    
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error verificando productos:', error);
  }
}

verifyProducts();
