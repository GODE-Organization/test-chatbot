# Seeders de Base de Datos

Este directorio contiene los scripts de seeder para poblar la base de datos con datos iniciales.

## Productos Seeder

El seeder de productos (`products-seeder.ts`) inserta una lista predefinida de productos electrodomésticos en la base de datos.

### Características

- **15 productos** de electrodomésticos populares
- **Imágenes de Telegram** incluidas (usando `imagen_id` como `file_id`)
- **Precios** convertidos automáticamente de string a número
- **Códigos de referencia** únicos para cada producto
- **Marcas** y descripciones detalladas
- **Unidades disponibles** por defecto (10 unidades)

### Uso

#### Ejecutar seeder (solo si no hay productos existentes)
```bash
npm run seed:products
```

#### Ejecutar seeder forzando sobrescritura
```bash
npm run seed:products:force
```

### Estructura de Datos

Los datos se mapean de la siguiente manera:

| Campo JSON | Campo DB | Descripción |
|------------|----------|-------------|
| `codigo_ref` | `code` | Código único del producto |
| `marca_ejemplo` | `brand` | Marca del producto |
| `imagen_id` | `image_file_id` | ID de archivo de Telegram |
| `precio_promedio_referencia` | `price` | Precio convertido a número |
| `producto + descripcion` | `description` | Nombre y descripción combinados |
| - | `available_units` | 10 unidades por defecto |

### Notas Importantes

- El seeder verifica si ya existen productos antes de insertar
- Si existen productos, se requiere el flag `--force` para sobrescribir
- Las imágenes usan `imagen_id` (file_id de Telegram) para reenvío
- Los precios se convierten automáticamente de "$XX" a número
- Se establecen 10 unidades disponibles por defecto para cada producto

### Productos Incluidos

1. Freidora de Aire (Air Fryer) - Cosori
2. Cafetera de Goteo - Taurus
3. Licuadora de Vaso - Oster
4. Batidora de Mano (Minipimer) - Bosch
5. Tostadora Ranura Larga - Philips
6. Microondas con Grill - Samsung
7. Hervidor de Agua Eléctrico - Princess
8. Robot Aspirador - Xiaomi
9. Plancha de Vapor - Tefal
10. Secador de Pelo Profesional - Remington
11. Plancha de Pelo (Alisadora) - Philips
12. Báscula de Baño Digital - Beurer
13. Ventilador de Torre - Solac
14. Picadora Eléctrica - Kenwood
15. Exprimidor Eléctrico - Braun
