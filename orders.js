const express = require('express');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const User = require('../models/User');

const router = express.Router();


const softAuth = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    }
  } catch (_) { }
  next();
};


const requireAuth = (req, res, next) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: 'Please log in to view this resource.' });
  next();
};


router.post('/', softAuth, async (req, res) => {
  try {
    const {
      customerName, customerEmail, customerPhone,
      shippingAddress, city, pinCode,
      items, subtotalINR, discountINR, deliveryINR, totalINR,
      paymentMethod,
    } = req.body;

    if (!customerName || !shippingAddress || !items?.length || !totalINR)
      return res.status(400).json({ success: false, message: 'Missing required order fields.' });


    const validItems = items.every(i =>
      i.productId && i.name && i.priceINR >= 0 && i.quantity >= 1
    );
    if (!validItems)
      return res.status(400).json({ success: false, message: 'Invalid item data in order.' });

    const order = await Order.create({
      user: req.user?._id || null,
      customerName,
      customerEmail: customerEmail || req.user?.email || '',
      customerPhone: customerPhone || '',
      shippingAddress,
      city: city || '',
      pinCode: pinCode || '',
      items,
      subtotalINR: Number(subtotalINR),
      discountINR: Number(discountINR || 0),
      deliveryINR: Number(deliveryINR || 0),
      totalINR: Number(totalINR),
      paymentMethod: paymentMethod || 'upi',
    });

    res.status(201).json({
      success: true,
      message: `Order placed successfully! 🎉 Order ID: ${order.transactionId}`,
      order: {
        id: order._id,
        transactionId: order.transactionId,
        totalINR: order.totalINR,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ success: false, message: 'Failed to place order. Please try again.' });
  }
});


router.get('/my', softAuth, requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
});


router.get('/', softAuth, requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Admin access required.' });

    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
});


router.patch('/:id/status', softAuth, requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Admin access required.' });

    const { status } = req.body;
    const validStatuses = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status value.' });

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found.' });

    res.json({ success: true, message: 'Order status updated.', order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update order status.' });
  }
});

module.exports = router;
