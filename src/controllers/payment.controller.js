const Order = require('../models/Order.model');
const Product = require('../models/Product.model');
const payphoneService = require('../services/payphone.service');
const pdfService = require('../services/pdf.service');
const emailService = require('../services/email.service');
const payphoneConfig = require('../config/payphone');

/**
 * Obtiene la configuración para inicializar la Cajita de Pagos de Payphone
 * @route POST /api/payment/payphone/config
 */
exports.getPaymentConfig = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { products, email, phoneNumber, documentId } = req.body;

    console.log('=== Payment Config Request ===');
    console.log('User ID:', userId);
    console.log('Request body:', { products, email, phoneNumber, documentId });

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Se requieren productos para el pago' 
      });
    }

    // Calcular el monto total basado en los productos
    let totalAmount = 0;
    const productDetails = [];

    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ 
          success: false,
          message: `Producto ${item.productId} no encontrado` 
        });
      }
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      productDetails.push({
        productId: product._id,
        title: product.title,
        price: product.price,
        quantity: item.quantity
      });
    }

    console.log('Product details:', productDetails);
    console.log('Total amount:', totalAmount);

    // Crear la orden con estado PENDING
    const order = new Order({
      userId,
      products: productDetails,
      amount: totalAmount,
      paymentStatus: 'PENDING',
      email: email || req.user.email
    });

    await order.save();
    console.log('Order created:', order._id);

    // Generar ID único de transacción
    const clientTransactionId = `ORDER-${order._id}`;

    // Convertir a centavos (Payphone requiere valores en centavos)
    const amountInCents = Math.round(totalAmount * 100);
    
    // Para productos digitales sin impuesto
    const paymentConfig = payphoneService.getPaymentConfig({
      clientTransactionId,
      amount: amountInCents,
      amountWithoutTax: amountInCents,
      amountWithTax: 0,
      tax: 0,
      reference: `Compra de ${productDetails.length} libro(s) digital(es)`,
      email: email || '',
      phoneNumber: phoneNumber || '',
      documentId: documentId || '',
      optionalParameter: `Orden: ${order._id}`
    });

    console.log('Payment config generated:', paymentConfig);

    // Guardar el clientTransactionId en la orden
    order.payphoneTransactionId = clientTransactionId;
    await order.save();

    res.status(200).json({
      success: true,
      orderId: order._id,
      paymentConfig,
      responseUrl: payphoneConfig.responseUrl
    });
  } catch (error) {
    console.error('Error al generar configuración de pago:', error);
    next(error);
  }
};

/**
 * Confirma el pago después de que el usuario completa la transacción
 * @route POST /api/payment/payphone/confirm
 */
exports.confirmPayment = async (req, res, next) => {
  try {
    const { id, clientTransactionId } = req.body;

    if (!id || !clientTransactionId) {
      return res.status(400).json({ 
        message: 'Se requieren id y clientTransactionId' 
      });
    }

    // Confirmar transacción con Payphone
    const transactionData = await payphoneService.confirmTransaction(id, clientTransactionId);

    // Buscar la orden
    const orderId = clientTransactionId.replace('ORDER-', '');
    const order = await Order.findById(orderId).populate('userId');

    if (!order) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }

    // Actualizar orden según el estado de la transacción
    if (payphoneService.isTransactionApproved(transactionData)) {
      order.paymentStatus = 'PAID';
      order.payphoneTransactionId = transactionData.transactionId.toString();
      order.authorizationCode = transactionData.authorizationCode;
      order.paymentDate = new Date(transactionData.date);
      order.paymentDetails = {
        cardType: transactionData.cardType,
        cardBrand: transactionData.cardBrand,
        lastDigits: transactionData.lastDigits,
        email: transactionData.email,
        phoneNumber: transactionData.phoneNumber
      };
      await order.save();

      // Generar PDF y enviar email de confirmación
      try {
        const user = order.userId;
        const pdfPath = await pdfService.generatePdf(order, user);
        order.pdfUrl = pdfPath;
        await order.save();
        
        await emailService.sendOrderConfirmation(user, order, pdfPath);
      } catch (err) {
        console.error('Error en tareas post-pago:', err);
        // No fallar la confirmación si hay error en PDF/Email
      }

      res.status(200).json({
        success: true,
        message: 'Pago confirmado exitosamente',
        order: {
          _id: order._id,
          amount: order.amount,
          paymentStatus: order.paymentStatus,
          products: order.products
        },
        transaction: transactionData
      });
    } else if (payphoneService.isTransactionCanceled(transactionData)) {
      order.paymentStatus = 'FAILED';
      await order.save();

      res.status(400).json({
        success: false,
        message: 'Pago cancelado',
        order: {
          _id: order._id,
          paymentStatus: order.paymentStatus
        }
      });
    } else {
      // Estado desconocido
      res.status(400).json({
        success: false,
        message: 'Estado de pago desconocido',
        transaction: transactionData
      });
    }
  } catch (error) {
    console.error('Error al confirmar pago:', error);
    next(error);
  }
};

/**
 * Webhook para recibir notificaciones de Payphone (backup)
 * Nota: La confirmación principal se hace desde el frontend
 * @route POST /api/payment/payphone/webhook
 */
exports.webhook = async (req, res, next) => {
  try {
    const { id, clientTransactionId, status } = req.body;

    if (!id || !clientTransactionId) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    // Confirmar con Payphone
    const transactionData = await payphoneService.confirmTransaction(id, clientTransactionId);
    
    const orderId = clientTransactionId.replace('ORDER-', '');
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }

    // Solo actualizar si aún está pendiente
    if (order.paymentStatus === 'PENDING') {
      if (payphoneService.isTransactionApproved(transactionData)) {
        order.paymentStatus = 'PAID';
        order.payphoneTransactionId = transactionData.transactionId.toString();
        await order.save();
      } else if (payphoneService.isTransactionCanceled(transactionData)) {
        order.paymentStatus = 'FAILED';
        await order.save();
      }
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Error en webhook:', error);
    res.json({ ok: false });
  }
};
