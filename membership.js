const express = require('express');
const jwt = require('jsonwebtoken');
const Membership = require('../models/Membership');
const User = require('../models/User');

const router = express.Router();


const requireAuth = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer '))
      return res.status(401).json({ success: false, message: 'Please log in first.' });

    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user)
      return res.status(401).json({ success: false, message: 'User not found.' });
    next();
  } catch (_) {
    res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
  }
};

const PRICES = {
  Basic: { monthly: 1000, yearly: 600 },
  Premium: { monthly: 1500, yearly: 900 },
  Elite: { monthly: 2000, yearly: 1200 },
};


router.post('/', requireAuth, async (req, res) => {
  try {
    const { plan, billing = 'monthly', paymentMethod = 'UPI' } = req.body;

    if (!['Basic', 'Premium', 'Elite'].includes(plan))
      return res.status(400).json({ success: false, message: 'Invalid plan. Choose Basic, Premium, or Elite.' });

    if (!['monthly', 'yearly'].includes(billing))
      return res.status(400).json({ success: false, message: 'Billing must be monthly or yearly.' });


    await Membership.updateMany(
      { user: req.user._id, status: 'active' },
      { status: 'cancelled' }
    );

    const priceINR = PRICES[plan][billing];

    const membership = await Membership.create({
      user: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      plan,
      billing,
      priceINR,
      paymentMethod,
    });


    await User.findByIdAndUpdate(req.user._id, { activeMembership: membership._id });

    res.status(201).json({
      success: true,
      message: `🎉 ${plan} membership activated! Enjoy your workouts!`,
      membership: {
        id: membership._id,
        plan: membership.plan,
        billing: membership.billing,
        priceINR: membership.priceINR,
        startDate: membership.startDate,
        endDate: membership.endDate,
        transactionId: membership.transactionId,
        status: membership.status,
      },
    });
  } catch (err) {
    console.error('Membership error:', err);
    res.status(500).json({ success: false, message: 'Failed to activate membership. Please try again.' });
  }
});


router.get('/my', requireAuth, async (req, res) => {
  try {
    const membership = await Membership.findOne({
      user: req.user._id,
      status: 'active',
    });
    res.json({ success: true, membership: membership || null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch membership.' });
  }
});


router.delete('/cancel', requireAuth, async (req, res) => {
  try {
    const result = await Membership.updateMany(
      { user: req.user._id, status: 'active' },
      { status: 'cancelled' }
    );
    await User.findByIdAndUpdate(req.user._id, { activeMembership: null });
    res.json({ success: true, message: 'Membership cancelled successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to cancel membership.' });
  }
});


router.get('/', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Admin access required.' });

    const memberships = await Membership.find()
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: memberships.length, memberships });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch memberships.' });
  }
});

module.exports = router;
