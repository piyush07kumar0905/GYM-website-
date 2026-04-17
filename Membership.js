const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  plan: {
    type: String,
    enum: ['Basic', 'Premium', 'Elite'],
    required: [true, 'Plan is required'],
  },
  billing: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly',
  },
  priceINR: { type: Number, required: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired'],
    default: 'active',
  },
  paymentMethod: { type: String, default: 'UPI' },
  transactionId: { type: String, default: () => 'TXN' + Date.now() },
  createdAt: { type: Date, default: Date.now },
});

membershipSchema.pre('save', function (next) {
  if (!this.endDate) {
    const months = this.billing === 'yearly' ? 12 : 1;
    const d = new Date(this.startDate);
    d.setMonth(d.getMonth() + months);
    this.endDate = d;
  }
  next();
});

module.exports = mongoose.model('Membership', membershipSchema);
