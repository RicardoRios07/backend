const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  price: { type: Number, required: true, min: 0 },
  qty: { type: Number, default: 1, min: 1 }
});

const CartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: { type: [CartItemSchema], default: [] },
  total: { type: Number, default: 0, min: 0 }
});

module.exports = mongoose.model('Cart', CartSchema);
