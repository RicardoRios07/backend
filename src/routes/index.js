const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.json({ ok: true, api: 'e-comerce backend' }));

// Mount auth routes
const authRoutes = require('./auth.routes');
router.use('/auth', authRoutes);

// Mount product routes
const productRoutes = require('./product.routes');
router.use('/products', productRoutes);

// Mount cart routes
const cartRoutes = require('./cart.routes');
router.use('/cart', cartRoutes);

// Mount payment routes
const paymentRoutes = require('./payment.routes');
router.use('/payment', paymentRoutes);

// Mount orders routes
const orderRoutes = require('./order.routes');
router.use('/orders', orderRoutes);

// Mount support routes
const supportRoutes = require('./support.routes');
router.use('/support', supportRoutes);

// Mount admin routes
const adminRoutes = require('./admin.routes');
router.use('/admin', adminRoutes);

module.exports = router;
