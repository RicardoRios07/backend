const User = require('../models/User.model');
const Product = require('../models/Product.model');
const Order = require('../models/Order.model');
const mongoose = require('mongoose');

exports.dashboard = async (req, res, next) => {
  try {
    const usersCount = await User.countDocuments();
    const productsCount = await Product.countDocuments();
    const ordersCount = await Order.countDocuments();

    const revenueAgg = await Order.aggregate([
      { $match: { paymentStatus: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const revenue = (revenueAgg[0] && revenueAgg[0].total) || 0;

    res.json({ usersCount, productsCount, ordersCount, revenue });
  } catch (err) {
    next(err);
  }
};

exports.listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const users = await User.find().select('-password').skip(skip).limit(parseInt(limit, 10)).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['USER', 'ADMIN'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
    const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

exports.listOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const filter = {};
    if (status) filter.paymentStatus = status;
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const orders = await Order.find(filter).populate('userId', 'name email').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10));
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['PENDING', 'PAID', 'FAILED'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const order = await Order.findByIdAndUpdate(id, { paymentStatus: status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    next(err);
  }
};

exports.listPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const payments = await Order.find({ payphoneTransactionId: { $exists: true, $ne: '' } }).populate('userId', 'name email').skip(skip).limit(parseInt(limit, 10)).sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    next(err);
  }
};

exports.salesByDay = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const match = { paymentStatus: 'PAID' };
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) match.createdAt.$lte = new Date(to);
    }

    const agg = await Order.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json(agg.map(a => ({ date: a._id, total: a.total, count: a.count })));
  } catch (err) {
    next(err);
  }
};

exports.topProducts = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const agg = await Order.aggregate([
      { $match: { paymentStatus: 'PAID' } },
      { $unwind: '$products' },
      { $group: { _id: '$products.productId', qty: { $sum: '$products.qty' }, revenue: { $sum: { $multiply: ['$products.price', '$products.qty'] } } } },
      { $sort: { qty: -1 } },
      { $limit: parseInt(limit, 10) },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      { $project: { productId: '$_id', qty: 1, revenue: 1, title: '$product.title' } }
    ]);

    res.json(agg);
  } catch (err) {
    next(err);
  }
};

// ----- PRODUCTOS (LIBROS) CRUD (admin) -----

/**
 * Crear un nuevo libro
 * Body: title, synopsis, authors[], year, price, coverImage
 */
exports.createProduct = async (req, res, next) => {
  try {
    const { title, synopsis, authors, year, price, coverImage } = req.body;

    // Validaciones
    if (!title || !synopsis || !authors || !year || !price || !coverImage) {
      return res.status(400).json({
        success: false,
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
 * Listar todos los libros (admin - incluye inactivos)
 */
exports.listProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, active } = req.query;
    const filter = {};
    if (active !== undefined) filter.active = active === 'true';

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const products = await Product.find(filter)
      .populate('createdBy', 'email name')
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
 * Actualizar un libro
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // No permitir actualizar createdBy y createdAt
    delete updates.createdBy;
    delete updates.createdAt;
    updates.updatedAt = new Date();

    // Validar formato de datos
    if (updates.authors && !Array.isArray(updates.authors)) {
      updates.authors = [updates.authors];
    }
    if (updates.year) updates.year = parseInt(updates.year, 10);
    if (updates.price) updates.price = parseFloat(updates.price);

    const product = await Product.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'email name');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Libro no encontrado'
      });
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
 * Obtener detalles de un libro
 */
exports.getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate('createdBy', 'email name');

    if (!product) {
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
    next(err);
  }
};

/**
 * Eliminar (desactivar) un libro
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndUpdate(
      id,
      { active: false, updatedAt: new Date() },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Libro no encontrado'
      });
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

// ----- Orders CRUD (admin) -----
exports.createOrder = async (req, res, next) => {
  try {
    const { userEmail, products, amount, paymentStatus = 'PENDING' } = req.body;
    if (!userEmail || !products || !Array.isArray(products)) return res.status(400).json({ message: 'userEmail and products[] required' });
    const user = await User.findOne({ email: userEmail });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const order = new Order({ userId: user._id, products, amount, paymentStatus });
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};

exports.updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const order = await Order.findByIdAndUpdate(id, updates, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    next(err);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Order.findByIdAndDelete(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

exports.activeUsers = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || '30', 10);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const agg = await Order.aggregate([
      { $match: { createdAt: { $gte: since }, paymentStatus: 'PAID' } },
      { $group: { _id: '$userId' } },
      { $group: { _id: null, activeUsers: { $sum: 1 } } }
    ]);
    const activeUsers = (agg[0] && agg[0].activeUsers) || 0;
    res.json({ days, activeUsers });
  } catch (err) {
    next(err);
  }
};

exports.conversionRate = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || '30', 10);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const totalUsers = await User.countDocuments();
    const agg = await Order.aggregate([
      { $match: { createdAt: { $gte: since }, paymentStatus: 'PAID' } },
      { $group: { _id: '$userId' } },
      { $group: { _id: null, buyers: { $sum: 1 } } }
    ]);
    const buyers = (agg[0] && agg[0].buyers) || 0;
    const rate = totalUsers > 0 ? (buyers / totalUsers) * 100 : 0;
    res.json({ days, totalUsers, buyers, conversionRate: rate });
  } catch (err) {
    next(err);
  }
};

exports.avgOrderValue = async (req, res, next) => {
  try {
    const agg = await Order.aggregate([
      { $match: { paymentStatus: 'PAID' } },
      { $group: { _id: null, avg: { $avg: '$amount' }, count: { $sum: 1 } } }
    ]);
    const avg = (agg[0] && agg[0].avg) || 0;
    const count = (agg[0] && agg[0].count) || 0;
    res.json({ avgOrderValue: avg, paidOrders: count });
  } catch (err) {
    next(err);
  }
};

exports.monthlyRevenue = async (req, res, next) => {
  try {
    const months = parseInt(req.query.months || '6', 10);
    const since = new Date();
    since.setMonth(since.getMonth() - months + 1);

    const agg = await Order.aggregate([
      { $match: { paymentStatus: 'PAID', createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, total: { $sum: '$amount' } } },
      { $sort: { _id: 1 } }
    ]);
    res.json(agg.map(a => ({ month: a._id, total: a.total })));
  } catch (err) {
    next(err);
  }
};
