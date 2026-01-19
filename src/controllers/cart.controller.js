const Cart = require('../models/Cart.model');
const Product = require('../models/Product.model');

async function recalcTotal(cart) {
  cart.total = cart.items.reduce((sum, it) => sum + (it.price * it.qty), 0);
}

exports.getCart = async (req, res, next) => {
  try {
    const userId = req.user._id;
    let cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart) {
      cart = new Cart({ userId, items: [], total: 0 });
      await cart.save();
    }
    res.json(cart);
  } catch (err) {
    next(err);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { productId, qty = 1 } = req.body;
    if (!productId) return res.status(400).json({ message: 'productId required' });

    const product = await Product.findById(productId);
    if (!product || !product.active) return res.status(404).json({ message: 'Product not available' });

    let cart = await Cart.findOne({ userId });
    if (!cart) cart = new Cart({ userId, items: [], total: 0 });

    const idx = cart.items.findIndex(it => it.productId.toString() === productId.toString());
    if (idx >= 0) {
      cart.items[idx].qty += Number(qty);
      cart.items[idx].price = product.price; // keep price in sync
    } else {
      cart.items.push({ productId: product._id, price: product.price, qty: Number(qty) });
    }

    await recalcTotal(cart);
    await cart.save();
    await cart.populate('items.productId');
    res.json(cart);
  } catch (err) {
    next(err);
  }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    let cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(it => it.productId.toString() !== productId.toString());
    await recalcTotal(cart);
    await cart.save();
    await cart.populate('items.productId');
    res.json(cart);
  } catch (err) {
    next(err);
  }
};
