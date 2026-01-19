const Order = require('../models/Order.model');

exports.getOrders = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

exports.downloadInvoice = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.userId.toString() !== userId.toString() && req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });
    if (order.paymentStatus !== 'PAID') return res.status(403).json({ message: 'Payment not completed' });

    // If PDF exists on disk, serve it
    const pdfService = require('../services/pdf.service');
    if (order.pdfUrl && require('fs').existsSync(order.pdfUrl)) {
      return res.sendFile(require('path').resolve(order.pdfUrl));
    }

    // Otherwise generate PDF, save path to order.pdfUrl and serve
    const filePath = await pdfService.generatePdf(order, req.user);
    order.pdfUrl = filePath;
    await order.save();

    res.sendFile(require('path').resolve(filePath));
  } catch (err) {
    next(err);
  }
};
