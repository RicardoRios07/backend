const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/e-comerce';
  
  // Ocultar password en logs
  const safeUri = uri.replace(/:[^:@]+@/, ':****@');
  
  try {
    console.log(`🔌 Conectando a MongoDB: ${safeUri}`);
    
    await mongoose.connect(uri, {
      // useNewUrlParser and useUnifiedTopology are defaults in Mongoose 7+
    });
    
    console.log('✅ MongoDB conectado exitosamente');
  } catch (err) {
    console.error('❌ Error al conectar a MongoDB:', err.message);
    
    if (err.message.includes('authentication') || err.message.includes('Authentication')) {
      console.error('\n💡 Error de autenticación:');
      console.error('   1. Verifica MONGO_URI en .env.production');
      console.error('   2. Verifica que el usuario existe en MongoDB');
      console.error('   3. Verifica que el password es correcto\n');
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;
