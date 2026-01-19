const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const auth = require('../middlewares/auth.middleware');

router.get('/', auth, orderController.getOrders);
router.get('/:id/download', auth, orderController.downloadInvoice);

module.exports = router;
