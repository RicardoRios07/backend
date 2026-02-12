const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const auth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');

// ====== RUTAS PÚBLICAS ======
// Obtener todos los libros activos (con búsqueda y paginación)
router.get('/', productController.getProducts);

// Obtener un libro específico por ID
router.get('/:id', productController.getProduct);

// Descargar libro (PDF) - Requiere autenticación
router.get('/:id/download', auth, productController.downloadProduct);

// ====== RUTAS ADMINISTRADOR ======

// Obtener todos los libros (incluyendo inactivos) - SOLO ADMIN
router.get('/admin/all', auth, requireRole('ADMIN'), productController.getAllProductsAdmin);

// Crear un nuevo libro - SOLO ADMIN
router.post('/', auth, requireRole('ADMIN'), productController.createProduct);

// Actualizar un libro - SOLO ADMIN
router.put('/:id', auth, requireRole('ADMIN'), productController.updateProduct);

// Eliminar (desactivar) un libro - SOLO ADMIN
router.delete('/:id', auth, requireRole('ADMIN'), productController.deleteProduct);

module.exports = router;
