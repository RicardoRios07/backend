const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
const possibleEnvFiles = ['.env.production', '.env.local', '.env'];

let envLoaded = false;
for (const envFile of possibleEnvFiles) {
  const envPath = path.join(__dirname, '..', envFile);
  if (fs.existsSync(envPath)) {
    console.log(`📄 Cargando configuración desde: ${envFile}`);
    dotenv.config({ path: envPath });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn('⚠️  No se encontró archivo .env, usando valores por defecto');
}

const Product = require('../src/models/Product.model');

// Productos de ejemplo
const sampleProducts = [
  {
    title: 'El extranjero',
    synopsis: 'Una novela filosófica que explora temas de existencialismo y absurdismo a través de la historia de Meursault, un hombre indiferente que comete un asesinato sin motivo aparente.',
    authors: ['Albert Camus'],
    year: 1942,
    price: 12.99,
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/TheStranger.jpg',
    category: 'Libros',
    active: true
  },
  {
    title: 'Cien años de soledad',
    synopsis: 'La obra maestra de García Márquez que narra la historia de la familia Buendía a lo largo de siete generaciones en el pueblo ficticio de Macondo.',
    authors: ['Gabriel García Márquez'],
    year: 1967,
    price: 15.99,
    coverImage: 'https://images-na.ssl-images-amazon.com/images/I/91TvVQS7loL.jpg',
    category: 'Libros',
    active: true
  },
  {
    title: '1984',
    synopsis: 'Una distopía clásica que presenta un futuro totalitario donde el Gran Hermano controla todos los aspectos de la vida de los ciudadanos.',
    authors: ['George Orwell'],
    year: 1949,
    price: 11.99,
    coverImage: 'https://images-na.ssl-images-amazon.com/images/I/71kxa1-0mfL.jpg',
    category: 'Libros',
    active: true
  },
  {
    title: 'Clean Code',
    synopsis: 'Una guía esencial para escribir código limpio, mantenible y profesional. Robert C. Martin comparte décadas de experiencia y mejores prácticas.',
    authors: ['Robert C. Martin'],
    year: 2008,
    price: 45.99,
    coverImage: 'https://m.media-amazon.com/images/I/51E2055ZGUL.jpg',
    category: 'Programación',
    active: true
  },
  {
    title: 'JavaScript: The Good Parts',
    synopsis: 'Douglas Crockford revela las características elegantes y poderosas de JavaScript, separando las partes buenas del lenguaje de las problemáticas.',
    authors: ['Douglas Crockford'],
    year: 2008,
    price: 32.99,
    coverImage: 'https://m.media-amazon.com/images/I/5166ztGe1GL.jpg',
    category: 'Programación',
    active: true
  },
  {
    title: 'Thinking, Fast and Slow',
    synopsis: 'Daniel Kahneman explora los dos sistemas que impulsan la forma en que pensamos: el rápido e intuitivo, y el lento y deliberado.',
    authors: ['Daniel Kahneman'],
    year: 2011,
    price: 18.99,
    coverImage: 'https://images-na.ssl-images-amazon.com/images/I/71-u2fUzyYL.jpg',
    category: 'Negocios',
    active: true
  },
  {
    title: 'El arte de la guerra',
    synopsis: 'Un tratado militar chino escrito durante el siglo VI a.C. por Sun Tzu. Es una obra fundamental sobre estrategia y táctica militar.',
    authors: ['Sun Tzu'],
    year: -500,
    price: 9.99,
    coverImage: 'https://m.media-amazon.com/images/I/71kHPWH3pbL.jpg',
    category: 'Gestión',
    active: true
  },
  {
    title: 'Diseño de Experiencia de Usuario',
    synopsis: 'Una guía completa sobre cómo crear experiencias digitales centradas en el usuario, desde la investigación hasta el diseño final.',
    authors: ['Jesse James Garrett'],
    year: 2010,
    price: 39.99,
    coverImage: 'https://m.media-amazon.com/images/I/41b1XvZeG7L.jpg',
    category: 'Diseño',
    active: true
  },
  {
    title: 'Sapiens: De animales a dioses',
    synopsis: 'Yuval Noah Harari examina cómo la especie Homo Sapiens llegó a dominar el mundo y rastrea la historia de la humanidad.',
    authors: ['Yuval Noah Harari'],
    year: 2011,
    price: 22.99,
    coverImage: 'https://images-na.ssl-images-amazon.com/images/I/71qVj0L8XyL.jpg',
    category: 'Libros',
    active: true
  },
  {
    title: 'Padre Rico, Padre Pobre',
    synopsis: 'Robert Kiyosaki comparte lecciones sobre dinero e inversión que aprendió de su padre rico, contrastándolas con las de su padre biológico.',
    authors: ['Robert T. Kiyosaki'],
    year: 1997,
    price: 16.99,
    coverImage: 'https://images-na.ssl-images-amazon.com/images/I/81bsw6fnAjL.jpg',
    category: 'Finanzas',
    active: true
  }
];

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/e-comerce';
  
  console.log('🔌 Conectando a MongoDB...');
  console.log(`   URI: ${uri.replace(/:[^:@]+@/, ':****@')}`);
  
  try {
    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB\n');
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    console.error('\n💡 Verifica que:');
    console.error('   1. MongoDB está corriendo');
    console.error('   2. Las credenciales en .env son correctas');
    process.exit(1);
  }

  console.log('📚 Creando productos de ejemplo...\n');

  let created = 0;
  let skipped = 0;

  for (const productData of sampleProducts) {
    try {
      // Verificar si ya existe un producto con el mismo título
      const existing = await Product.findOne({ title: productData.title });
      
      if (existing) {
        console.log(`⏭️  Ya existe: "${productData.title}"`);
        skipped++;
        continue;
      }

      // Crear el producto
      const product = new Product(productData);
      await product.save();
      
      console.log(`✅ Creado: "${productData.title}" - $${productData.price} (${productData.category})`);
      created++;
    } catch (error) {
      console.error(`❌ Error creando "${productData.title}":`, error.message);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Resumen:');
  console.log(`   ✅ Productos creados: ${created}`);
  console.log(`   ⏭️  Productos existentes: ${skipped}`);
  console.log(`   📦 Total en base de datos: ${created + skipped}`);
  console.log('='.repeat(50));

  // Mostrar todos los productos activos
  const allProducts = await Product.find({ active: true }).select('title category price');
  console.log('\n📚 Productos activos en la base de datos:');
  allProducts.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.title} - $${p.price} (${p.category})`);
  });

  await mongoose.disconnect();
  console.log('\n✅ Desconectado de MongoDB');
  console.log('\n🎉 ¡Listo! Ahora puedes ver los productos en el catálogo.');
  console.log('   👉 https://digitalbooksloja.com/catalogo\n');
  
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
