const express = require('express');
const router = express.Router();
const admin = require('../controllers/admin.controller');
const auth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const upload = require('../config/multer');
const uploadController = require('../controllers/upload.controller');

// All admin routes require ADMIN role
router.use(auth, requireRole('ADMIN'));

// ====== DASHBOARD ======
router.get('/dashboard', admin.dashboard);

// ====== GESTIÓN DE USUARIOS ======
router.get('/users', admin.listUsers);
router.put('/users/:id/role', admin.updateUserRole);
router.delete('/users/:id', admin.deleteUser);

// ====== GESTIÓN DE ÓRDENES Y PAGOS ======
router.get('/orders', admin.listOrders);
router.put('/orders/:id/status', admin.updateOrderStatus);
router.get('/payments', admin.listPayments);
router.post('/orders', admin.createOrder);
router.put('/orders/:id', admin.updateOrder);
router.delete('/orders/:id', admin.deleteOrder);

// ====== GESTIÓN DE LIBROS (PRODUCTOS) ======
// Listar todos los libros (incluyendo inactivos)
router.get('/products', admin.listProducts);

// Obtener detalles de un libro específico
router.get('/products/:id', admin.getProduct);

// Crear un nuevo libro
router.post('/products', admin.createProduct);

// Actualizar un libro
router.put('/products/:id', admin.updateProduct);

// Eliminar (desactivar) un libro
router.delete('/products/:id', admin.deleteProduct);

// ====== CARGA DE ARCHIVOS ======
router.post('/upload', upload.single('file'), uploadController.uploadFile);

// ====== ESTADÍSTICAS ======
router.get('/stats/sales-by-day', admin.salesByDay);
router.get('/stats/top-products', admin.topProducts);
router.get('/stats/active-users', admin.activeUsers);
router.get('/stats/conversion-rate', admin.conversionRate);
router.get('/stats/avg-order-value', admin.avgOrderValue);
router.get('/stats/monthly-revenue', admin.monthlyRevenue);

module.exports = router;
