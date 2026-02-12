const Product = require('../models/Product.model');
const Order = require('../models/Order.model');
const fs = require('fs');
const path = require('path');

// ====== CRUD PARA LIBROS (PRODUCTOS) ======

/**
 * Crear un nuevo libro (producto)
 * Body requerido: title, synopsis, authors, year, price, coverImage
 */
exports.createProduct = async (req, res, next) => {
  try {
    const { title, synopsis, authors, year, price, coverImage } = req.body;

    // Validaciones
    if (!title || !synopsis || !authors || !year || !price || !coverImage) {
      return res.status(400).json({
        message: 'Faltan campos requeridos: title, synopsis, authors, year, price, coverImage'
      });
    }

    const product = new Product({
      title: title.trim(),
      synopsis: synopsis.trim(),
      authors: Array.isArray(authors) ? authors : [authors],
      year: parseInt(year, 10),
      price: parseFloat(price),
      coverImage: coverImage.trim(),
      createdBy: req.user._id,
      category: 'libros'
    });

    await product.save();
    res.status(201).json({
      success: true,
      message: 'Libro creado exitosamente',
      data: product
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Actualizar un libro existente
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // No permitir actualizar createdBy y updatedAt manualmente
    delete updates.createdBy;
    delete updates.createdAt;
    updates.updatedAt = new Date();

    // Validar que authors sea un array
    if (updates.authors && !Array.isArray(updates.authors)) {
      updates.authors = [updates.authors];
    }

    // Validar que year sea un número
    if (updates.year) {
      updates.year = parseInt(updates.year, 10);
    }

    // Validar que price sea un número
    if (updates.price) {
      updates.price = parseFloat(updates.price);
    }

    const product = await Product.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }

    res.json({
      success: true,
      message: 'Libro actualizado exitosamente',
      data: product
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Eliminar (desactivar) un libro
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Soft delete: solo marcar como inactivo
    const product = await Product.findByIdAndUpdate(
      id,
      { active: false, updatedAt: new Date() },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }

    res.json({
      success: true,
      message: 'Libro eliminado exitosamente',
      data: product
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Obtener libros activos (públicos)
 * Query params: q (búsqueda), category, page, limit
 */
exports.getProducts = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const filter = { active: true };

    if (q) {
      filter.$text = { $search: q };
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const products = await Product.find(filter)
      .select('-pdfUrl') // No incluir URL del PDF en listados públicos
      .skip(skip)
      .limit(parseInt(limit, 10))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Obtener un libro por ID
 */
exports.getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validar que el ID sea un ObjectId válido
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({
        success: false,
        message: 'Libro no encontrado'
      });
    }

    const product = await Product.findById(id);

    if (!product || !product.active) {
      return res.status(404).json({
        success: false,
        message: 'Libro no encontrado'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (err) {
    // Si hay error, asumir que el ID es inválido y retornar 404
    res.status(404).json({
      success: false,
      message: 'Libro no encontrado'
    });
  }
};

/**
 * Obtener todos los libros (incluyendo inactivos) - SOLO ADMIN
 * Query params: page, limit
 */
exports.getAllProductsAdmin = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const products = await Product.find()
      .populate('createdBy', 'email name')
      .skip(skip)
      .limit(parseInt(limit, 10))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments();

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.downloadProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Libro no encontrado' });
    if (!product.pdfUrl) return res.status(404).json({ message: 'Este libro no tiene archivo PDF disponible' });

    const order = await Order.findOne({ userId, paymentStatus: 'PAID', 'products.productId': id });
    if (!order && req.user.role !== 'ADMIN') return res.status(403).json({ message: 'No has comprado este libro' });

    // 4. Determinar si es un archivo local o URL
    let pdfUrl = product.pdfUrl.trim();
    let isUrl = false;

    // Si empieza con http/https/www, es URL.
    if (pdfUrl.match(/^(http|https|www\.)/i)) {
      isUrl = true;
    }
    // Si NO empieza con '/' ni 'files/', y NO existe localmente, asumimos URL.
    else if (!pdfUrl.startsWith('/') && !pdfUrl.startsWith('files/')) {
      const potentialLocalPath = path.join(__dirname, '../../files', path.basename(pdfUrl));
      if (!fs.existsSync(potentialLocalPath)) {
        isUrl = true; // No está en disco, debe ser URL
      }
    }

    if (isUrl) {
      if (!pdfUrl.startsWith('http')) {
        pdfUrl = 'https://' + pdfUrl;
      }

      // Usar axios para hacer proxy del PDF y evitar problemas de CORS
      try {
        const axios = require('axios');
        const response = await axios({
          method: 'get',
          url: pdfUrl,
          responseType: 'stream',
          timeout: 30000 // 30 segundos timeout
        });

        // Configurar headers para descarga
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${product.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`);
        res.setHeader('Access-Control-Allow-Origin', '*');

        // Stream del archivo al cliente
        response.data.pipe(res);
        return;
      } catch (proxyError) {
        console.error('Error al hacer proxy del PDF:', proxyError.message);
        return res.status(404).json({
          message: 'No se pudo descargar el archivo desde la URL externa',
          detail: proxyError.message
        });
      }
    }

    // 5. Si es archivo local
    let fileName = path.basename(pdfUrl);
    // Si pdfUrl incluía ruta (files/...), la respetamos, sino asumimos raíz de files/
    // Pero para evitar directory traversal, usamos basename + carpeta files fija.

    // CASO ESPECIAL: Si la BD tiene 'files/archivo.pdf', el basename es 'archivo.pdf'.
    // Y lo buscamos en backend/files/archivo.pdf.

    const safePath = path.join(__dirname, '../../files', fileName);

    if (fs.existsSync(safePath)) {
      res.download(safePath, `${product.title}.pdf`);
    } else {
      console.error(`Archivo no encontrado: ${safePath}. Valor en BD: ${product.pdfUrl}`);
      // Fallback final: Si no está en disco, redirigir como URL por si acaso
      let fallbackUrl = product.pdfUrl;
      if (!fallbackUrl.startsWith('http')) fallbackUrl = 'https://' + fallbackUrl;
      return res.redirect(fallbackUrl);
    }
  } catch (err) {
    next(err);
  }
};
