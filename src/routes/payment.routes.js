const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const auth = require('../middlewares/auth.middleware');

// Obtener configuración para la Cajita de Pagos de Payphone (autenticado)
router.post('/payphone/config', auth, paymentController.getPaymentConfig);

// Confirmar pago de Payphone (público - se llama desde el frontend después del pago)
router.post('/payphone/confirm', paymentController.confirmPayment);

// Webhook de Payphone (público - backup)
router.post('/payphone/webhook', paymentController.webhook);

module.exports = router;
