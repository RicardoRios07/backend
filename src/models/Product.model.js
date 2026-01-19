const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  // Información básica del libro
  title: { type: String, required: true, trim: true },
  synopsis: { type: String, required: true, trim: true }, // Sinopsis del libro
  authors: { type: [String], required: true }, // Array de autores
  year: { type: Number, required: true }, // Año de publicación
  
  // Información comercial
  price: { type: Number, required: true, min: 0 },
  
  // Contenido multimedia
  coverImage: { type: String, required: true }, // URL de portada del libro
  pdfUrl: { type: String, default: '' }, // URL del PDF (opcional, para descarga directa)
  
  // Metadata
  category: { type: String, index: true, default: 'libros' },
  description: { type: String, default: '' },
  active: { type: Boolean, default: true, index: true },
  
  // Auditoría
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

// Índice de búsqueda de texto
ProductSchema.index({ title: 'text', synopsis: 'text', authors: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
