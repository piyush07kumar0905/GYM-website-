const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: Number, required: true },
  name: { type: String, required: true },
  priceINR: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, default: '' },
  subtotalINR: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  customerName: { type: String, required: true, trim: true },
  customerEmail: { type: String, default: '', trim: true },
  customerPhone: { type: String, default: '', trim: true },
  shippingAddress: { type: String, required: true, trim: true },
  city: { type: String, default: '' },
  pinCode: { type: String, default: '' },

  items: [orderItemSchema],
  subtotalINR: { type: Number, required: true },
  discountINR: { type: Number, default: 0 },
  deliveryINR: { type: Number, default: 0 },
  totalINR: { type: Number, required: true },

  paymentMethod: {
    type: String,
    enum: ['upi', 'card', 'netbanking', 'cod', 'emi'],
    default: 'upi',
  },
  transactionId: { type: String, default: () => 'ORD' + Date.now() },
  status: {
    type: String,
    enum: ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'placed',
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);
