const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno - intentar múltiples archivos
const possibleEnvFiles = [
  '.env.production',
  '.env.local',
  '.env'
];

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

const User = require('../src/models/User.model');

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/e-comerce';
  
  console.log('🔌 Conectando a MongoDB...');
  console.log(`   URI: ${uri.replace(/:[^:@]+@/, ':****@')}`); // Ocultar password en logs
  
  try {
    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB\n');
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    console.error('\n💡 Verifica que:');
    console.error('   1. MongoDB está corriendo: mongosh');
    console.error('   2. Las credenciales en .env.production son correctas');
    console.error('   3. El usuario tiene permisos en la base de datos');
    process.exit(1);
  }
  
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';
  const name = process.env.ADMIN_NAME || 'Admin';

  console.log(`👤 Creando usuario administrador: ${email}\n`);

  let user = await User.findOne({ email });
  if (user) {
    console.log('ℹ️  El usuario administrador ya existe');
    console.log(`   Email: ${email}`);
    console.log(`   Role: ${user.role}`);
    await mongoose.disconnect();
    process.exit(0);
  }

  user = new User({ name, email, password, role: 'ADMIN' });
  await user.save();
  
  console.log('✅ Usuario administrador creado exitosamente!');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role: ADMIN`);
  console.log('\n⚠️  Guarda estas credenciales en un lugar seguro');
  
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
